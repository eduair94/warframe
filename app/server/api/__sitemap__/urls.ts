// Dynamic sitemap source: enumerates every tradable prime-set and relic entity
// page (/set/<url_name>, /relic/<url_name>) from the live item catalogue. These
// are optional-catch-all routes (set/[[set]].vue, relic/[[relic]].vue), so the
// sitemap module's static auto-discovery only sees the bare /set and /relic —
// the thousands of individual value pages were absent from sitemap.xml. Wired via
// `sitemap.sources` in nuxt.config. `_i18nTransform` makes the module emit the
// 13-locale variants + xhtml:link hreflang alternates for each entity.
//
// Catalogue shape mirrors what app.vue fetches from the API root: a flat item
// list where sets carry `set === true` and relics carry the `relic` tag (same
// predicates the homepage category filter uses — index.vue filterSelect).

interface CatalogueItem {
  url_name?: string
  set?: boolean
  tags?: string[]
}

export default defineSitemapEventHandler(async () => {
  const config = useRuntimeConfig()
  const base = (config.apiInternal as string) || (config.public.apiURL as string)

  const items = await $fetch<CatalogueItem[]>(base, { timeout: 20000, retry: 1 }).catch(() => [])
  if (!Array.isArray(items) || !items.length) return []

  const urls: Array<Record<string, unknown>> = []
  for (const it of items) {
    if (!it?.url_name) continue
    if (it.set === true) {
      urls.push({ loc: `/set/${it.url_name}`, _i18nTransform: true, changefreq: 'daily', priority: 0.6 })
    } else if (Array.isArray(it.tags) && it.tags.includes('relic')) {
      urls.push({ loc: `/relic/${it.url_name}`, _i18nTransform: true, changefreq: 'weekly', priority: 0.5 })
    }
  }
  return urls
})
