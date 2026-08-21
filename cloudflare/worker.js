/**
 * Cloudflare Worker — edge cache + origin-outage shield for the Warframe stack.
 *
 * Route it at BOTH hostnames:
 *   warframe.digitalshopuy.com/*        (API, JSON)
 *   warframe-app.digitalshopuy.com/*    (Nuxt SSR frontend, HTML + /_nuxt assets)
 *
 * See docs/runbook-outage.md for the deploy steps and the incident that drove
 * this file's current shape.
 *
 * What it does
 * ------------
 *  - Caches GET responses at the edge, honouring the origin's `s-maxage`
 *    (falls back to DEFAULT_TTL if the origin sends no cache directive).
 *  - Keeps a long-lived BACKUP copy of every good response. If the origin later
 *    errors (throws, or returns >= 500 — which INCLUDES Cloudflare's own 52x/53x
 *    "origin/tunnel unreachable" pages), the Worker serves that backup so users
 *    keep seeing the last good data instead of an error page. This is the "keep
 *    the site up while the origin is down" guarantee.
 *  - If there is no backup either, returns a branded offline page (HTML request)
 *    or a structured 503 JSON (API request) instead of Cloudflare's raw
 *    "Error 1033 — Cloudflare Tunnel error" interstitial.
 *  - Never caches POSTs, the protected /build_* sync endpoints, or anything
 *    per-user.
 *  - FAILS OPEN: any unexpected error falls back to a direct origin fetch, so the
 *    Worker can never turn a good origin response into a 500 (error 1101).
 *
 * Run EITHER this Worker OR the dashboard Cache Rule (docs/cloudflare-cache.md),
 * not both on the same paths.
 */

const DEFAULT_TTL = 60; // seconds, used only if origin sends no s-maxage/max-age

// How long the last-good backup is retained. This is the ONLY thing standing
// between an origin outage and a dead site, so it is deliberately far longer
// than the edge TTL. It was 24h; the 2026-08 outage (prod VPS offline at the
// host for days) outlived that window, the backups expired, and every visitor
// got Cloudflare's 1033 page. A week covers a hardware/host incident.
const BACKUP_TTL = 604800; // 7 days

// Origin statuses that mean "the origin is not healthy, prefer stale". 5xx
// covers app crashes AND Cloudflare's own 520-530 family (521 origin down,
// 522 timeout, 523 origin unreachable, 530 = tunnel error 1033).
const isUnhealthy = (status) => status >= 500;

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

const wantsHtml = (request) => (request.headers.get("Accept") || "").includes("text/html");

/**
 * Cache key for the long-lived backup copy, kept DISTINCT from the fresh edge
 * key so the two TTLs cannot collide.
 *
 * This used to be `url + "#__backup"`. A fragment is not a dependable part of a
 * cache key — implementations are free to drop it during URL serialization, and
 * if it is dropped both `cache.put`s target the SAME entry, the 7-day backup
 * overwrites the short-TTL fresh copy, and there is no backup left to serve when
 * the origin dies. A query parameter is unambiguously part of the key
 * everywhere, so the backup is guaranteed to be its own entry.
 */
function backupKeyFor(url) {
  const backupUrl = new URL(url.toString());
  backupUrl.hash = "";
  backupUrl.searchParams.set("__edge_backup", "1");
  return new Request(backupUrl.toString(), { method: "GET" });
}

// Self-contained (no external assets — the origin that would serve them is the
// thing that is down). Void + gold Orokin palette to match analytics.css.
const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Void Ledger — temporarily offline</title>
<meta http-equiv="refresh" content="60">
<style>
  :root{--void:#06070c;--gold:#c9a227;--cyan:#4dd0e1;--txt:#e8e6df;--dim:#8b8f9a}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:
    radial-gradient(ellipse at 50% 0%,#141a2b 0%,var(--void) 60%);
    color:var(--txt);font-family:Rajdhani,"Segoe UI",system-ui,sans-serif;padding:24px}
  .card{max-width:560px;text-align:center}
  .node{width:56px;height:56px;margin:0 auto 28px;transform:rotate(45deg);
    border:2px solid var(--gold);background:rgba(201,162,39,.08);
    box-shadow:0 0 32px rgba(201,162,39,.25);animation:pulse 2.6s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:.55;transform:rotate(45deg) scale(1)}
    50%{opacity:1;transform:rotate(45deg) scale(1.08)}}
  h1{font-family:Cinzel,Georgia,serif;font-size:clamp(22px,4vw,30px);
    letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:0 0 14px}
  p{font-size:17px;line-height:1.65;color:var(--dim);margin:0 0 12px}
  .hair{height:1px;margin:28px auto;max-width:220px;
    background:linear-gradient(90deg,transparent,var(--gold),transparent);opacity:.6}
  .small{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);opacity:.8}
  @media(prefers-reduced-motion:reduce){.node{animation:none}}
</style></head>
<body><main class="card">
  <div class="node"></div>
  <h1>Void Ledger is offline</h1>
  <p>The origin server is temporarily unreachable, and the cached copy of this
     page has expired. This is an infrastructure outage, not something you did.</p>
  <div class="hair"></div>
  <p class="small">This page retries automatically every 60 seconds</p>
</main></body></html>`;

/**
 * Last-resort response when the origin is down AND no backup survives. Better
 * than Cloudflare's raw 1033 interstitial: it is on-brand, it says what is
 * actually happening, and it retries itself so the site comes back on its own
 * the moment the origin returns.
 */
function offlineResponse(request) {
  const headers = {
    "Cache-Control": "no-store",
    "Retry-After": "60",
    "x-edge-cache": "OFFLINE",
  };
  if (!wantsHtml(request)) {
    return new Response(
      JSON.stringify({
        error: "origin_unavailable",
        message:
          "The Warframe Market Analytics origin is temporarily unreachable. Cached data has expired. Retrying shortly.",
      }),
      {
        status: 503,
        headers: { ...headers, "Content-Type": "application/json; charset=utf-8" },
      },
    );
  }
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
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
  // stale-on-error backup would serve it to anonymous callers too, with no auth
  // check at all. Three independent guards, because any one alone is enough to
  // be wrong: the path list covers the account API, the Authorization check
  // covers any authenticated route added later, and the Set-Cookie check below
  // covers a response the origin itself marks as session-bearing.
  const isPrivatePath = url.pathname === "/me" || url.pathname.startsWith("/me/");
  const cacheable =
    request.method === "GET" &&
    !url.pathname.startsWith("/build_") &&
    !isPrivatePath &&
    !request.headers.has("Authorization");
  if (!cacheable) return fetch(request);

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const backupKey = backupKeyFor(url);

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
    // Origin unreachable (timeout / tunnel down) — serve backup if we have one,
    // otherwise the branded offline page. Never rethrow: rethrowing here lands
    // the visitor on Cloudflare's raw error interstitial, which is exactly the
    // failure mode this Worker exists to prevent.
    const stale = await cache.match(backupKey);
    if (stale) return withHeaders(stale, { "x-edge-cache": "STALE-ON-ERROR" });
    return offlineResponse(request);
  }

  if (isUnhealthy(originResp.status)) {
    // Origin is unhealthy — prefer the last-good backup, then the offline page.
    // Handing Cloudflare's own 530/1033 body to the visitor is never the best
    // available answer, so it is not one of the options here.
    const stale = await cache.match(backupKey);
    if (stale) return withHeaders(stale, { "x-edge-cache": "STALE-ON-ERROR" });
    return offlineResponse(request);
  }

  // Only cache successful, cacheable responses.
  if (originResp.status !== 200) return originResp;

  // Derive edge TTL from the origin's Cache-Control (s-maxage > max-age).
  const cc = originResp.headers.get("Cache-Control") || "";

  // Belt and braces on top of the path/Authorization guards above: if the origin
  // itself says this response is per-user, do not store it at EITHER TTL. The
  // backup copy is the dangerous one — it is written with a hardcoded long
  // max-age that would otherwise ignore the origin's `no-store` entirely.
  // Set-Cookie is the same class of signal from the SSR frontend: a response
  // that establishes a session must not be replayed to the next visitor.
  if (/(^|[\s,])(private|no-store)([\s,;]|$)/i.test(cc) || originResp.headers.has("Set-Cookie")) {
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
        return offlineResponse(request);
      }
    }
  },
};
