export interface SitemapUrl {
  loc: string
  _i18nTransform: true
}

interface CatalogueItem {
  url_name?: string
  item_name?: string
  tags?: string[]
}

const validSlug = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9_-]*$/.test(value)

/** Assembled set names end in " Set"; `set: true` also marks individual parts. */
export function catalogueSitemapUrls(payload: unknown): SitemapUrl[] {
  if (!Array.isArray(payload)) throw new Error('Invalid sitemap catalogue')
  const paths = new Set<string>()
  for (const item of payload as CatalogueItem[]) {
    if (!item || !validSlug(item.url_name)) continue
    if (typeof item.item_name === 'string' && item.item_name.endsWith(' Set')) paths.add(`/set/${item.url_name}`)
    else if (Array.isArray(item.tags) && item.tags.includes('relic')) paths.add(`/relic/${item.url_name}`)
  }
  return [...paths].map((loc) => ({ loc, _i18nTransform: true }))
}

export function missionSitemapUrls(payload: unknown): SitemapUrl[] {
  const rows = (payload as { rows?: unknown } | null)?.rows
  if (!Array.isArray(rows)) throw new Error('Invalid sitemap missions')
  return [...new Set<string>(rows
    .filter((row) => row?.indexable === true && validSlug(row.slug))
    .map((row) => `/mission/${row.slug}`))]
    .map((loc) => ({ loc, _i18nTransform: true }))
}

/**
 * Keep two small URL snapshots, not the full market payload. Each source refreshes
 * independently; a failed refresh can use its last successful snapshot for one
 * day. Concurrent locale sitemap requests share the same in-flight fetches.
 */
export function createSitemapLoader(
  fetchJson: (url: string) => Promise<unknown>,
  now: () => number = Date.now,
) {
  const sources = [
    { path: '', map: catalogueSitemapUrls },
    { path: '/missions', map: missionSitemapUrls },
  ].map((source) => ({
    ...source,
    base: '',
    urls: undefined as SitemapUrl[] | undefined,
    fetchedAt: 0,
    retryAt: 0,
    pending: undefined as Promise<SitemapUrl[]> | undefined,
  }))
  const freshMs = 5 * 60_000
  const staleMs = 24 * 60 * 60_000

  return async (apiBase: string): Promise<SitemapUrl[]> => {
    const base = apiBase.replace(/\/+$/, '')
    const results = await Promise.allSettled(sources.map(async (source) => {
      if (source.base !== base) {
        source.base = base
        source.urls = undefined
        source.pending = undefined
        source.fetchedAt = source.retryAt = 0
      }
      const hasSnapshot = source.urls !== undefined && now() - source.fetchedAt < staleMs
      if (hasSnapshot && now() < source.retryAt) return source.urls!
      if (!source.pending) {
        source.pending = fetchJson(base + source.path).then((payload) => {
          const urls = source.map(payload)
          source.urls = urls
          source.fetchedAt = now()
          source.retryAt = now() + freshMs
          return urls
        }).catch((error) => {
          source.retryAt = now() + 60_000
          if (source.urls !== undefined && now() - source.fetchedAt < staleMs) return source.urls
          throw error
        }).finally(() => { source.pending = undefined })
      }
      return source.pending
    }))
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('Sitemap data is temporarily unavailable')
    }
    return results.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
  }
}
