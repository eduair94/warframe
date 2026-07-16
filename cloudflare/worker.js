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
 *  - FAILS OPEN: any unexpected error falls back to a direct origin fetch, so the
 *    Worker can never turn a good origin response into a 500 (error 1101).
 *
 * Run EITHER this Worker OR the dashboard Cache Rule (docs/cloudflare-cache.md),
 * not both on the same paths.
 */

const DEFAULT_TTL = 60; // seconds, used only if origin sends no s-maxage/max-age
const BACKUP_TTL = 86400; // seconds the last-good backup is retained (24h)

/**
 * Rebuild a Response with MUTABLE headers. Headers taken straight from a fetch()
 * response are immutable — calling .set() on them throws and CF returns a 1101.
 * Copying into a fresh `new Headers()` gives us a writable copy.
 */
function withHeaders(resp, extra) {
  const headers = new Headers(resp.headers);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}

async function handle(request, ctx) {
  const url = new URL(request.url);

  // Only GETs to cacheable paths are handled; everything else passes through.
  const cacheable = request.method === "GET" && !url.pathname.startsWith("/build_");
  if (!cacheable) return fetch(request);

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const backupKey = new Request(url.toString() + "#__backup", { method: "GET" });

  // 1) Fresh edge hit.
  const hit = await cache.match(cacheKey);
  if (hit) return withHeaders(hit, { "x-edge-cache": "HIT" });

  // 2) Miss — go to origin.
  let originResp;
  try {
    originResp = await fetch(request);
  } catch (err) {
    // Origin unreachable (timeout / tunnel down) — serve backup if we have one.
    const stale = await cache.match(backupKey);
    if (stale) return withHeaders(stale, { "x-edge-cache": "STALE-ON-ERROR" });
    throw err;
  }

  if (originResp.status >= 500) {
    // Origin is unhealthy — prefer the last-good backup.
    const stale = await cache.match(backupKey);
    if (stale) return withHeaders(stale, { "x-edge-cache": "STALE-ON-ERROR" });
    return originResp;
  }

  // Only cache successful, cacheable responses.
  if (originResp.status !== 200) return originResp;

  // Derive edge TTL from the origin's Cache-Control (s-maxage > max-age).
  const cc = originResp.headers.get("Cache-Control") || "";
  const sMax = /s-maxage=(\d+)/.exec(cc);
  const max = /max-age=(\d+)/.exec(cc);
  const ttl = sMax ? +sMax[1] : max ? +max[1] : DEFAULT_TTL;

  // Store the fresh edge copy (respecting TTL) and the long-lived backup. Both
  // are built from independent clones so neither body stream is disturbed.
  const fresh = withHeaders(originResp.clone(), {
    "Cache-Control": `public, max-age=${ttl}`,
    "x-edge-cache": "MISS",
  });
  const backup = withHeaders(originResp.clone(), {
    "Cache-Control": `public, max-age=${BACKUP_TTL}`,
  });
  ctx.waitUntil(cache.put(cacheKey, fresh.clone()));
  ctx.waitUntil(cache.put(backupKey, backup));

  return fresh;
}

export default {
  async fetch(request, ctx) {
    try {
      return await handle(request, ctx);
    } catch (err) {
      // FAIL OPEN: never let a Worker bug become a 500 — return origin directly.
      try {
        return await fetch(request);
      } catch (_) {
        return new Response("upstream unavailable", { status: 502 });
      }
    }
  },
};
