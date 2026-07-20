// Compresses DYNAMIC responses (SSR HTML, JSON, XML) with brotli or gzip.
//
// Why: the Node server shipped every SSR document uncompressed. The homepage
// document alone is ~2.3 MB of HTML (the item catalogue is serialised into the
// Nuxt payload), so a cold visit transferred 2.3 MB before the first paint —
// ~11 s on a throttled mobile connection, and Lighthouse measured FCP at 28 s.
// Cloudflare compresses on the way out to the browser, but only when it has
// the response: the origin -> edge hop was still uncompressed, and any request
// that bypasses the edge (health checks, the route warmer, direct origin hits,
// local dev/preview) paid the full weight.
//
// Static `/​_nuxt/*` assets are handled separately by
// `nitro.compressPublicAssets` (pre-compressed .br/.gz files written at build
// time), which is why this only has to deal with rendered responses. Anything
// that already carries a content-encoding is left alone.
import { promisify } from 'node:util'
import { brotliCompress, gzip, constants as zlibConstants } from 'node:zlib'

const brotliAsync = promisify(brotliCompress)
const gzipAsync = promisify(gzip)

// Text-ish payloads only. Images/fonts/video are already compressed formats and
// re-compressing them burns CPU for nothing.
const COMPRESSIBLE =
  /^(?:text\/|application\/(?:json|ld\+json|javascript|xml|xhtml\+xml|manifest\+json)|image\/svg\+xml)/

// Below ~1 KB the framing overhead cancels out the saving.
const MIN_BYTES = 1024

// Quality 5 is the usual server-side sweet spot: within a few percent of the
// max ratio at a fraction of the CPU (max quality on a 2 MB document takes
// hundreds of ms, which would just move the cost from network to TTFB).
const BROTLI_QUALITY = 5

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('beforeResponse', async (event, response) => {
    const body = response?.body
    if (typeof body !== 'string' && !(body instanceof Uint8Array)) return
    if (getResponseHeader(event, 'content-encoding')) return

    const type = String(getResponseHeader(event, 'content-type') || '')
    if (!COMPRESSIBLE.test(type)) return

    const raw = typeof body === 'string' ? Buffer.from(body, 'utf8') : Buffer.from(body)
    if (raw.length < MIN_BYTES) return

    const accept = String(getRequestHeader(event, 'accept-encoding') || '')
    let encoded: Buffer
    let encoding: string
    if (/\bbr\b/.test(accept)) {
      encoding = 'br'
      encoded = await brotliAsync(raw, {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
          [zlibConstants.BROTLI_PARAM_SIZE_HINT]: raw.length,
        },
      })
    } else if (/\bgzip\b/.test(accept)) {
      encoding = 'gzip'
      encoded = await gzipAsync(raw, { level: 6 })
    } else {
      return
    }

    setResponseHeader(event, 'content-encoding', encoding)
    setResponseHeader(event, 'content-length', String(encoded.length))
    // Caches keyed on the URL alone would otherwise hand a brotli body to a
    // client that only speaks gzip.
    const vary = String(getResponseHeader(event, 'vary') || '')
    if (!/accept-encoding/i.test(vary)) {
      setResponseHeader(event, 'vary', vary ? `${vary}, accept-encoding` : 'accept-encoding')
    }
    response.body = encoded
  })
})
