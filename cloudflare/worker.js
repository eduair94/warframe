/**
 * Cloudflare Worker — edge cache for the Warframe API with stale-if-error.
 *
 * Route it at:  warframe.digitalshopuy.com/*
 *
 * What it does
 * ------------
 *  - Caches GET responses at the edge, honouring the origin's `s-maxage`
 *    (falls back to DEFAULT_TTL if the origin sends no cache directive).
 *  - Keeps a long-lived (24h) BACKUP copy of every good response. If the origin
 *    later errors (throws, or returns >= 500), the Worker serves that backup so
 *    users keep seeing the last good data instead of an error page — this is the
 *    "keep the site up while origin is down" guarantee.
 *  - Never caches POSTs or the protected /build_* sync endpoints.
 *
 * Run EITHER this Worker OR the dashboard Cache Rule (docs/cloudflare-cache.md),
 * not both on the same paths.
 */

const DEFAULT_TTL = 60; // seconds, used only if origin sends no s-maxage/max-age
const BACKUP_TTL = 86400; // seconds the last-good backup is retained (24h)

export default {
  async fetch(request, ctx) {
    const url = new URL(request.url);

    // Only GETs to cacheable paths are handled; everything else passes through.
    const cacheable =
      request.method === "GET" && !url.pathname.startsWith("/build_");
    if (!cacheable) return fetch(request);

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), { method: "GET" });
    const backupKey = new Request(url.toString() + "#__backup", { method: "GET" });

    // 1) Fresh edge hit.
    const hit = await cache.match(cacheKey);
    if (hit) {
      const r = new Response(hit.body, hit);
      r.headers.set("x-edge-cache", "HIT");
      return r;
    }

    // 2) Miss — go to origin.
    try {
      const originResp = await fetch(request);

      if (originResp.status >= 500) {
        // Origin is unhealthy — try to serve the last-good backup.
        const stale = await cache.match(backupKey);
        if (stale) {
          const r = new Response(stale.body, stale);
          r.headers.set("x-edge-cache", "STALE-ON-ERROR");
          return r;
        }
        return originResp; // nothing to fall back to
      }

      // Derive edge TTL from the origin's Cache-Control (s-maxage > max-age).
      const cc = originResp.headers.get("Cache-Control") || "";
      const sMax = /s-maxage=(\d+)/.exec(cc);
      const max = /max-age=(\d+)/.exec(cc);
      const ttl = sMax ? +sMax[1] : max ? +max[1] : DEFAULT_TTL;

      // Store the fresh edge copy (respecting TTL) and the long-lived backup.
      const fresh = new Response(originResp.clone().body, originResp);
      fresh.headers.set("Cache-Control", `public, max-age=${ttl}`);
      fresh.headers.set("x-edge-cache", "MISS");
      ctx.waitUntil(cache.put(cacheKey, fresh.clone()));

      const backup = new Response(originResp.clone().body, originResp);
      backup.headers.set("Cache-Control", `public, max-age=${BACKUP_TTL}`);
      ctx.waitUntil(cache.put(backupKey, backup));

      return fresh;
    } catch (err) {
      // Origin unreachable (timeout / tunnel down) — serve backup if we have one.
      const stale = await cache.match(backupKey);
      if (stale) {
        const r = new Response(stale.body, stale);
        r.headers.set("x-edge-cache", "STALE-ON-ERROR");
        return r;
      }
      throw err;
    }
  },
};
