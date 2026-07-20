/**
 * @fileoverview Keeps the heavy aggregate endpoints permanently warm.
 * @module services/CacheWarmer
 *
 * Why
 * ---
 * The aggregate routes (`/`, market_analytics, …) take ~20s to compute cold on
 * prod. The CacheService serves a STALE copy instantly while it recomputes, so a
 * warm key never blocks a request — but a key that was NEVER populated (or whose
 * stale copy aged out because that route is rarely hit) has no stale to serve, so
 * the request falls into the blocking cold compute. Through Cloudflare that ~20s
 * origin call exceeds the tunnel/edge timeout and returns 502 Bad Gateway (this
 * is the exact remaining failure after the cache shipped).
 *
 * The warmer hits each heavy route locally on boot and on an interval, so a fresh
 * (and therefore stale) copy always exists in Redis. Combined with stale-serve +
 * background refresh, the origin then NEVER makes a request wait on a cold
 * compute, so Cloudflare always gets a fast 200. Warming a still-fresh key is
 * cheap (a cache hit); it only triggers a (single-flighted, background) recompute
 * when the fresh copy has lapsed.
 */

import http from "http";

/**
 * Heavy, parameterless, cached GET routes worth keeping warm. The per-item
 * parameterized routes (set/:, relic/:, riven_value/:, …) are far cheaper and are
 * left to warm on demand.
 */
const DEFAULT_WARM_PATHS = [
  "/",
  "/sets_comparison",
  "/relics_ev",
  "/drops/map",
  "/missions",
  "/market_analytics",
  "/endo_flip",
  "/riven_weapons",
];

function getWarmPaths(): string[] {
  const custom = process.env.CACHE_WARM_PATHS;
  if (custom) {
    return custom
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return DEFAULT_WARM_PATHS;
}

/** GET a local path; resolves on any completed response, never rejects. */
function warmOne(port: number, path: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now();
    const req = http.get(
      { host: "127.0.0.1", port, path, headers: { "user-agent": "cache-warmer" } },
      (res) => {
        // Drain and discard the body so the socket frees up.
        res.on("data", () => {});
        res.on("end", () => {
          if (process.env.CACHE_WARM_LOG === "true") {
            console.log(`[warmer] ${path} -> ${res.statusCode} ${Date.now() - started}ms`);
          }
          resolve();
        });
      }
    );
    // Generous timeout: a cold warm can legitimately take ~20s to recompute.
    req.setTimeout(timeoutMs, () => req.destroy());
    req.on("error", () => resolve());
    req.on("timeout", () => resolve());
  });
}

/**
 * Starts the warmer. Warms once on boot (after a short delay so the DB
 * connection is up), then repeats on an interval. Paths are warmed sequentially
 * so several 20s recomputes never pile onto the event loop at once.
 *
 * @param port          the API port to self-request against
 * @returns a stop() to clear the interval (used in tests)
 */
export function startCacheWarmer(port: number): () => void {
  if (process.env.CACHE_WARM_ENABLED === "false") {
    console.log("[warmer] disabled via CACHE_WARM_ENABLED=false");
    return () => {};
  }
  const paths = getWarmPaths();
  // Below the CacheService stale TTL (1h) with wide margin so rarely-hit routes
  // never let their stale copy age out; also below common fresh TTLs so warms
  // keep fresh mostly populated too.
  const intervalMs = parseInt(process.env.CACHE_WARM_INTERVAL_MS || "45000", 10);
  const perReqTimeout = parseInt(process.env.CACHE_WARM_TIMEOUT_MS || "60000", 10);

  const runSweep = async () => {
    for (const p of paths) {
      await warmOne(port, p, perReqTimeout);
    }
  };

  // Small initial delay: let Express bind and Mongo connect first.
  const boot = setTimeout(() => {
    runSweep().catch(() => {});
  }, parseInt(process.env.CACHE_WARM_BOOT_DELAY_MS || "4000", 10));

  const timer = setInterval(() => {
    runSweep().catch(() => {});
  }, intervalMs);
  // Don't keep the process alive just for the warmer.
  if (typeof timer.unref === "function") timer.unref();

  console.log(
    `[warmer] warming ${paths.length} routes every ${Math.round(intervalMs / 1000)}s on port ${port}`
  );

  return () => {
    clearTimeout(boot);
    clearInterval(timer);
  };
}
