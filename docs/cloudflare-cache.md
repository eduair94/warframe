# Cloudflare edge caching for the API

The API (`warframe.digitalshopuy.com`, served through the Cloudflare Tunnel) now
sends real cache headers on every cached GET route:

```
Cache-Control: public, max-age=60, s-maxage=60, stale-while-revalidate=3600, stale-if-error=86400
```

- `max-age=60` — the BROWSER may reuse the JSON for only 60s
  (`CACHE_BROWSER_MAX_AGE_SECONDS`), deliberately decoupled from the edge TTL: a
  long browser max-age pins every client to an hours-old snapshot ("everything
  updated an hour ago") that we cannot invalidate.
- `s-maxage=60` — Cloudflare's edge caches the JSON for 60s
  (`CACHE_TTL_SECONDS`), so most traffic never reaches the origin at all.
- `stale-if-error=86400` — if the origin errors or times out, the edge keeps
  serving the last good copy for up to 24h. **This is what keeps the site up
  during an origin blip** instead of showing "caído".
- `stale-while-revalidate=60` — a request just past TTL is served instantly from
  cache while the edge refreshes in the background.

By default Cloudflare does **not** cache dynamic JSON on a proxied hostname, even
with these headers — you must tell it these paths are cacheable. Two options.

---

## Option A — Cache Rule (recommended, no code)

Dashboard → **Caching → Cache Rules → Create rule**.

**When incoming requests match** (edit expression):

```
(http.host eq "warframe.digitalshopuy.com" and http.request.method eq "GET" and not starts_with(http.request.uri.path, "/build_"))
```

- `method eq "GET"` — never cache POSTs.
- `not starts_with(... "/build_")` — never cache the protected sync endpoints
  (`/build_relics`, `/build_drops`), which must always run live.

**Then**:

- Cache eligibility: **Eligible for cache**
- Edge TTL: **Use cache-control header if present, bypass cache if not** (honours
  the `s-maxage` above; routes without it won't be cached)
- Browser TTL: **Respect origin**

> **⚠ Zone-level "Browser Cache TTL" (Caching → Configuration) must be
> "Respect Existing Headers".** If it holds a fixed value (the default is 4
> hours), Cloudflare rewrites `max-age` upward on every cached response and
> browsers pin an hours-old JSON snapshot regardless of what the origin or this
> rule says — this was the production "everything updated an hour ago" bug.

Deploy. Verify with:

```bash
curl -sI https://warframe.digitalshopuy.com/ | grep -i "cf-cache-status\|cache-control"
# first call: cf-cache-status: MISS   second call within 60s: HIT
```

---

## Option B — Worker (bulletproof stale-if-error)

Use this if you want the edge to serve the last good copy on origin failure even
on plans that don't honour `stale-if-error`. It keeps a 24h backup copy in the
Cache API and falls back to it whenever the origin throws or returns `>= 500`.

1. Dashboard → **Workers & Pages → Create → Worker**, paste
   [`cloudflare/worker.js`](../cloudflare/worker.js).
2. **Deploy**, then **Triggers → Add route**:
   `warframe.digitalshopuy.com/*` on the site's zone.

Response headers show `x-edge-cache: HIT | MISS | STALE-ON-ERROR` so you can see
it working.

> Run **either** Option A **or** Option B, not both on the same paths (the Cache
> Rule and the Worker would both try to own caching). The Worker already does the
> eligibility + TTL logic itself.

---

## What NOT to cache at the edge

- `warframe-app.digitalshopuy.com` (the Nuxt frontend / SSR HTML) — leave on its
  own default. This doc is only about the API host.
- `/build_relics`, `/build_drops` — mutating sync triggers (excluded above).
- `/live-io/**` — the realtime Socket.IO path (on the frontend host, not the API).
