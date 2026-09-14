import type { GuideMeta } from '../data/guides/registry'
import type { PageSeo } from './seo'

export interface GuideCard extends GuideMeta {
  searchText: string
}

// Accent-insensitive matching keeps "maestria" useful for "maestría". Normalize
// both the query and index so composed/decomposed text works across languages.
const normalize = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

/** Reuse lightweight translated metadata; never load every guide body for the hub. */
export function buildGuideCards(
  guides: GuideMeta[],
  locale: string,
  resolve: (route: string, locale: string) => PageSeo,
): GuideCard[] {
  return guides.map((guide) => {
    const localized = locale === 'en' ? undefined : resolve(guide.route, locale)
    const title = localized?.title || guide.title
    const blurb = localized?.description || guide.blurb
    return {
      ...guide,
      title,
      blurb,
      // Keep English game/search vocabulary discoverable alongside local prose.
      searchText: normalize([title, blurb, guide.title, guide.blurb, guide.slug].join(' ')),
    }
  })
}

export function filterGuideCards(guides: GuideCard[], query: string): GuideCard[] {
  const term = normalize(query.trim())
  return term ? guides.filter((guide) => guide.searchText.includes(term)) : guides
}
