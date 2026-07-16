// SSR HTML documents must always be revalidated by the browser: they were
// shipped with no Cache-Control, so browsers heuristically cached the page and
// kept referencing old hashed `/_nuxt/*` chunks after a deploy (those chunks are
// content-addressed and purged on rebuild), so returning visitors saw a stale,
// often broken layout until a hard refresh.
//
// The app now SWR-caches rendered pages server-side (nitro.routeRules) for speed.
// Nitro's SWR sets `Cache-Control: s-maxage=60, stale-while-revalidate` on the
// response — which has NO `max-age`, so private (browser) caches fall back to
// heuristic freshness: the exact stale-chunk bug again. We therefore overwrite
// the document's Cache-Control on the way out, on EVERY response (fresh renders
// AND SWR cache hits), via `beforeResponse` — the earlier `render:response` hook
// did not fire for cache hits, so those escaped with the s-maxage header.
//
// This only rewrites the CLIENT-facing header; Nitro still serves the render
// from its server-side SWR store, so the speed win is preserved. Hashed assets
// keep their own long-lived `immutable` headers (guarded on text/html here).
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', (event) => {
    const ct = getResponseHeader(event, 'content-type')
    if (typeof ct === 'string' && ct.includes('text/html')) {
      setResponseHeader(event, 'cache-control', 'no-cache, must-revalidate')
    }
  })
})
