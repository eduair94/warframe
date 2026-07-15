// SSR HTML documents shipped with NO Cache-Control/ETag/Last-Modified, so
// browsers heuristically cached the page and kept referencing old hashed
// `/_nuxt/*` chunks after a deploy. Those chunks are content-addressed and
// purged on rebuild, so returning visitors saw a stale (often broken) layout
// until a hard refresh — every deploy. Force revalidation of the document only;
// hashed assets keep their own `immutable` headers (set by Nitro's asset
// handler, untouched here) since `render:response` fires for page renders only.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:response', (response, { event }) => {
    const ct = response.headers?.['content-type']
    if (typeof ct === 'string' && ct.includes('text/html')) {
      setResponseHeader(event, 'cache-control', 'no-cache, must-revalidate')
    }
  })
})
