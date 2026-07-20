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
  //
  // PER-USER RESPONSES MUST NEVER ENTER THIS CACHE. The cache key below is the
  // URL and nothing else, and Cloudflare's cache honours `Vary` only for
  // Accept-Encoding — so a cached `/me` would be one signed-in user's whole
  // account document (email, vault, trade ledger) served to everybody, and the
  // 24h stale-on-error backup would serve it to anonymous callers too, with no
  // auth check at all. Two independent guards, because either alone is enough
  // to be wrong: the path list covers the account API, and the Authorization
  // check covers any authenticated route added later.
  const isPrivatePath = url.pathname === "/me" || url.pathname.startsWith("/me/");
  const cacheable =
    request.method === "GET" &&
    !url.pathname.startsWith("/build_") &&
    !isPrivatePath &&
    !request.headers.has("Authorization");
  if (!cacheable) return fetch(request);

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const backupKey = new Request(url.toString() + "#__backup", { method: "GET" });

  // 1) Fresh edge hit. Restore the origin's Cache-Control for the browser —
  // the stored copy carries the edge TTL as max-age (that is how cache.put
  // expiry works), but the browser must see the origin's (much shorter)
  // max-age or clients pin an hours-old JSON snapshot.
  const hit = await cache.match(cacheKey);
  if (hit) {
    const originCC = hit.headers.get("x-origin-cache-control");
    return withHeaders(hit, {
      "x-edge-cache": "HIT",
      ...(originCC ? { "Cache-Control": originCC } : {}),
    });
  }

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

  // Belt and braces on top of the path/Authorization guards above: if the origin
  // itself says this response is per-user, do not store it at EITHER TTL. The
  // backup copy is the dangerous one — it is written with a hardcoded 24h
  // max-age that would otherwise ignore the origin's `no-store` entirely.
  if (/(^|[\s,])(private|no-store)([\s,;]|$)/i.test(cc)) {
    return withHeaders(originResp, { "x-edge-cache": "BYPASS" });
  }
  const sMax = /s-maxage=(\d+)/.exec(cc);
  const max = /max-age=(\d+)/.exec(cc);
  const ttl = sMax ? +sMax[1] : max ? +max[1] : DEFAULT_TTL;

  // Store the fresh edge copy (respecting TTL) and the long-lived backup. Both
  // are built from independent clones so neither body stream is disturbed.
  // The stored copy's Cache-Control is the edge TTL (cache.put expiry); the
  // origin's own Cache-Control is preserved in x-origin-cache-control so hits
  // can hand the browser the origin's shorter max-age instead of the edge TTL.
  const fresh = withHeaders(originResp.clone(), {
    "Cache-Control": `public, max-age=${ttl}`,
    "x-origin-cache-control": cc,
    "x-edge-cache": "MISS",
  });
  const backup = withHeaders(originResp.clone(), {
    "Cache-Control": `public, max-age=${BACKUP_TTL}`,
  });
  ctx.waitUntil(cache.put(cacheKey, fresh));
  ctx.waitUntil(cache.put(backupKey, backup));

  // The browser gets the origin response untouched (origin Cache-Control wins).
  return withHeaders(originResp, { "x-edge-cache": "MISS" });
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
