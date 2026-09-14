import { createSitemapLoader } from '../../utils/sitemap'

// The sitemap module gives a local source five seconds. Bound both independent
// API reads below that limit, with no retry that could outlive the caller.
const loadUrls = createSitemapLoader((url) => $fetch(url, { timeout: 4000, retry: 0 }))

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()
  const base = (config.apiInternal as string) || (config.public.apiURL as string)
  try {
    return await loadUrls(base)
  } catch {
    // A cold outage must not be cached as a successful empty catalogue.
    throw createError({ statusCode: 503, statusMessage: 'Sitemap data temporarily unavailable' })
  }
})
