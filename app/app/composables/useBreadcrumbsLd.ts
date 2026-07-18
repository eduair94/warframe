// Emits a BreadcrumbList JSON-LD for EVERY non-home route. Called once from the
// layout so all ~70 content pages get breadcrumb structured data for free
// (breadcrumb rich results + a cleaner SERP path), with zero per-page code.
//
// Names come from the localized PAGE_SEO map (resolveSeo) so crumbs are already
// translated per locale; dynamic entity leaves (/set/<item>, /relic/<item>) that
// fall through to their parent's copy use the prettified slug instead ("Ash Prime
// Set"). URLs go through useLocalePath so localized crumbs point at localized URLs.
// resolveSeo + prettifySlug are auto-imported from utils/seo.ts.

// Kept in sync with nuxt.config LOCALES (non-default locale codes).
const LOCALE_PREFIX_RE = /^\/(es|pt|de|fr|ru|ko|ja|zh-hans|zh-hant|pl|it|uk)(?=\/|$)/

/** Strip the i18n URL prefix so /es/guides/kuva → /guides/kuva. */
function stripLocale(path: string): string {
  let p = path.replace(LOCALE_PREFIX_RE, '') || '/'
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p
}

/** First clause of an SEO title — a compact crumb label ("Warframe Kuva Farming Guide"). */
function shortName(title: string): string {
  return title.split(/[—:|]/)[0].trim()
}

export function useBreadcrumbsLd(): void {
  const { locale } = useI18n()
  const localePath = useLocalePath()
  const route = useRoute()
  const origin = useRequestURL().origin

  const crumbs = computed(() => {
    const base = stripLocale(route.path)
    if (base === '/' ) return null
    const segs = base.split('/').filter(Boolean)
    const items: Array<{ name: string; item: string }> = [
      { name: shortName(resolveSeo('/', locale.value).title), item: origin + localePath('/') },
    ]
    let acc = ''
    segs.forEach((seg, i) => {
      acc += '/' + seg
      const seo = resolveSeo(acc, locale.value)
      const parent = i > 0 ? resolveSeo(acc.slice(0, acc.lastIndexOf('/')) || '/', locale.value) : null
      // Prefix-fallthrough (a dynamic entity page inherits its parent's copy) →
      // label the leaf with its prettified slug instead of the generic parent title.
      const fell = i === segs.length - 1 && !!parent && seo.title === parent.title
      const name = fell ? prettifySlug(seg) : shortName(seo.title)
      items.push({ name, item: origin + localePath(acc) })
    })
    return items
  })

  useHead(() => {
    const list = crumbs.value
    if (!list) return {}
    return {
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: list.map((c, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: c.name,
              item: c.item,
            })),
          }).replace(/</g, '\\u003c'),
        },
      ],
    }
  })
}
