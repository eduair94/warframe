import type { MaybeRefOrGetter } from 'vue'

/**
 * Per-page SEO OVERRIDE, for routes whose title/description can't live in the
 * static `utils/seo.ts` map because they depend on runtime data — i.e. the
 * dynamic `set/[[set]]` and `relic/[[relic]]` entity pages.
 *
 * The layout (`layouts/default.vue`) already gives every route its canonical +
 * hreflang, its base title/description (via `resolveSeo`), and a default OG
 * card. This helper is registered deeper in the tree so its values win, letting
 * an entity page bake the real set/relic name into the tags AND the OG image.
 *
 * Do NOT call `useLocaleHead` here — the layout owns canonical/hreflang; a
 * second call would emit duplicate alternate links.
 *
 * `title` is the bare page title (no brand suffix — `titleTemplate` in
 * nuxt.config appends it when needed). Inputs accept refs/getters so they stay
 * reactive to route-param changes.
 */
interface SeoPageInput {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  ogType?: 'website' | 'article'
  /** Absolute or root-relative image URL; when set, skips the dynamic OG card. */
  image?: MaybeRefOrGetter<string | undefined>
}

export function useSeoPage(input: SeoPageInput): void {
  const getTitle = () => toValue(input.title)
  const getDesc = () => toValue(input.description)

  useSeoMeta({
    title: () => getTitle(),
    description: () => getDesc(),
    ogTitle: () => getTitle(),
    ogDescription: () => getDesc(),
    ogType: input.ogType ?? 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: () => getTitle(),
    twitterDescription: () => getDesc(),
  })

  const override = toValue(input.image)
  if (override) {
    useSeoMeta({
      ogImage: () => toValue(input.image),
      twitterImage: () => toValue(input.image),
    })
  } else {
    defineOgImage('Void', {
      title: getTitle(),
      description: getDesc(),
    })
  }
}
