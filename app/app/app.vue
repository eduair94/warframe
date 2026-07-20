<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Global route-loading overlay (#spinner-wrapper). Shown on navigation by
       plugins/nav-loading.client.ts and hidden by each page on mount — the
       Nuxt 4 equivalent of the old Nuxt 2 `loading` component. -->
  <LoadingBar />
  <!-- Injects the PWA web-manifest link tag into head (@vite-pwa/nuxt component; renderless). -->
  <VitePwaManifest />
</template>

<script setup lang="ts">
import type { WarframeItem } from './stores/items'

// server -> internal origin (no Cloudflare round-trip for the ~2MB SSR fetch),
// client -> public apiURL. See composables/useApiBase.ts.
const base = useApiBase()
const items = useItemsStore()
const translations = useTranslationsStore()
const { locale } = useI18n()
// Resolved before the top-level await below so it still runs inside setup's
// synchronous Nuxt context.
const { trackAction, trackLocaleChange } = useAnalytics()

// ---- Structured data (JSON-LD) --------------------------------------------
// WebSite + WebApplication describing the tool, so Google / AI answer engines
// can identify and cite it. Origin is derived per-request so it's correct in
// dev and prod without hardcoding. `<` is escaped to keep the inline script
// safe even though all values here are static.
const origin = useRequestURL().origin
const ORG_ID = origin + '/#org'
const AUTHOR = {
  '@type': 'Person',
  name: 'Eduardo Airaudo',
  url: 'https://www.linkedin.com/in/eduardo-airaudo/'
}
const ldjson = [
  // Organization — brand/logo eligibility (knowledge panel) + the @id every
  // other node (WebSite, WebApplication, per-page Article) references as publisher.
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'Warframe Market Analytics',
    alternateName: 'Warframe Analytics',
    url: origin,
    logo: {
      '@type': 'ImageObject',
      url: origin + '/android-chrome-384x384.png',
      width: 384,
      height: 384
    },
    founder: AUTHOR,
    sameAs: ['https://github.com/eduair94/warframe', 'https://www.linkedin.com/in/eduardo-airaudo/']
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': origin + '/#website',
    name: 'Warframe Market Analytics',
    alternateName: 'Warframe Analytics',
    url: origin,
    inLanguage: locale.value,
    publisher: { '@id': ORG_ID },
    description:
      'Free real-time Warframe Market analytics: live prime prices, set-vs-parts, ducat efficiency, relic and riven valuation, vaulted-price tracking and trading signals.',
    // Sitelinks searchbox — target is the homepage item search (index.vue reads
    // ?q=), so the action resolves to real results (required or Google drops it).
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: origin + '/?q={search_term_string}' },
      'query-input': 'required name=search_term_string'
    }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': origin + '/#webapp',
    name: 'Warframe Market Analytics',
    url: origin,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'Live Warframe Market trading tools — prime set vs parts, ducat and relic value, riven pricing, flip finder, vaulted-price and volatility tracking.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': ORG_ID },
    author: AUTHOR,
    sameAs: ['https://github.com/eduair94/warframe']
  }
]
useHead({
  script: ldjson.map((node) => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(node).replace(/</g, '\\u003c')
  }))
})

// Global bootstrap: fetch the full item catalogue every page reads from the
// store. This is the single most important SSR fetch — if it returns empty,
// EVERY page renders blank. Hardened after an outage where a slow/cold API made
// this fetch time out, the error was swallowed (data stayed null → empty store),
// and Nitro's SWR then cached that empty render for 60s and served it to everyone:
//   1. retry + a bounded timeout so a transient slow origin doesn't null it out.
//   2. on the server, if the catalogue is still empty, mark the response no-store
//      so the blank render is never SWR-cached (the next request retries).
//   3. on the client (onMounted), if the store is empty after hydration, refetch
//      from the public API so a poisoned/empty SSR payload self-heals — no reload.
// The fetched array is PACKED before it leaves the async-data handler, because
// whatever this returns is what Nuxt serialises into the HTML document. Raw, the
// catalogue is ~1.9 MB of JSON (two thirds of it the same key names repeated
// 3 800 times) and it made every page a 2.3 MB document. Packed it is ~0.65 MB,
// losslessly — see utils/catalogue.ts. Both SSR and the client unpack the same
// bytes, so the hydrated store matches the rendered one exactly.
// It is also SKIPPED entirely on routes that render no market data (the written
// guides, FAQ, creators, tools directory — see routeNeedsCatalogue). Those pages
// were paying the full download-and-revive cost for a store they never read.
const CATALOGUE_FETCH = { retry: 2, retryDelay: 400, timeout: 25000 } as const
const route = useRoute()
const needsCatalogue = routeNeedsCatalogue(route.name)
const { data } = await useAsyncData('app-items', async () => {
  if (!needsCatalogue) return null
  const list = await $fetch<WarframeItem[]>(base, CATALOGUE_FETCH).catch(() => null)
  return list?.length ? packCatalogue(list) : null
})
const catalogue = unpackCatalogue(data.value)
if (catalogue.length) {
  items.setItems(catalogue)
} else if (import.meta.server && needsCatalogue) {
  const event = useRequestEvent()
  if (event) event.node.res.setHeader('Cache-Control', 'no-store, must-revalidate')
}

// i18n: load the localized item-name dictionary for the active locale during
// SSR so localized names are in the server-rendered HTML (required for search
// indexing). No-op on English; the store rehydrates on the client (Pinia), so
// there's no duplicate client fetch. Page-specific scopes (riven weapons,
// locations, …) are loaded lazily by the pages that render them.
// Skipped on catalogue-free routes for the same reason the catalogue is: those
// pages render no item names, so the dictionary would be fetched, serialised
// into the payload and revived for nothing.
if (needsCatalogue) await translations.ensureScope('items', locale.value)

// ---- Near-realtime catalogue refresh ---------------------------------------
// The crawler re-prices the full catalogue roughly every 2 minutes, so poll on
// that cadence and refetch immediately when the tab regains focus — otherwise a
// kept-open tab shows prices as old as its last visit. `cache: 'no-cache'`
// bypasses the browser's HTTP cache and revalidates against the Cloudflare
// edge (the browser otherwise pins the JSON for hours when CF inflates
// max-age), while the edge cache keeps each poll cheap.
const REFRESH_INTERVAL_MS = 120_000
const REFRESH_MIN_GAP_MS = 30_000
let refreshTimer: ReturnType<typeof setInterval> | undefined
let lastRefreshAt = 0
const refreshCatalogue = (force = false) => {
  if (!force && Date.now() - lastRefreshAt < REFRESH_MIN_GAP_MS) return
  lastRefreshAt = Date.now()
  $fetch<WarframeItem[]>(base, { ...CATALOGUE_FETCH, cache: 'no-cache' })
    .then((list) => {
      if (list?.length) items.setItems(list)
    })
    .catch(() => {})
}
const onVisibilityChange = () => {
  if (!document.hidden) refreshCatalogue()
}

// Catalogue-free routes (guides, FAQ, …) never fetched it, so the store is
// empty. app.vue's setup runs once per hard load, so a CLIENT navigation from
// one of those pages to a market page would otherwise land on an empty store.
// Two safeguards: warm it in the background once the current page is idle (so
// the click that leaves a guide already has the data), and catch the navigation
// itself in case the warm-up hasn't landed.
watch(
  () => route.name,
  (name) => {
    if (!routeNeedsCatalogue(name)) return
    if (!items.allItems.length) refreshCatalogue(true)
    // Localized item names come from the same skipped-on-content-pages fetch.
    translations.ensureScope('items', locale.value)
  }
)

// Client-side locale switch: the app root's setup runs once, so a later switch
// to /de, /fr, … won't re-trigger the SSR dictionary load above. Fetch the new
// locale's item dictionary on change; names update reactively once it lands.
watch(locale, (l, prev) => {
  if (routeNeedsCatalogue(route.name)) translations.ensureScope('items', l)
  // The single hook that sees BOTH switch paths (LanguageMenu and the
  // browser-language suggestion banner), so locale adoption is measured once.
  if (prev && prev !== l) trackLocaleChange(prev, l)
})

// The <LoadingBar/> overlay renders visible by default (the initial-load
// spinner). Guarantee it hides once the app has mounted so it can never stick,
// independent of any individual page's own hide logic. Client navigation is
// handled by plugins/nav-loading.client.ts.
onMounted(() => {
  const el = document.getElementById('spinner-wrapper')
  if (el) el.style.display = 'none'
  if (needsCatalogue && !items.allItems.length) {
    // Self-heal (see bootstrap note #3): if SSR delivered an empty catalogue (slow/
    // cold API, or an SWR-cached blank render), the store is empty and every page
    // would render blank. Refetch client-side from the public API so the UI recovers
    // without a manual reload. Cheap: the public API is Cloudflare-cached.
    //
    // Today this outage is silent — the page just looks empty. Report it so the
    // blank-render rate is visible instead of only showing up as bounces.
    trackAction('catalogue_empty')
    $fetch<WarframeItem[]>(base, CATALOGUE_FETCH)
      .then((list) => {
        if (list?.length) items.setItems(list)
      })
      .catch(() => {})
  }
  refreshTimer = setInterval(() => {
    if (!document.hidden) refreshCatalogue()
  }, REFRESH_INTERVAL_MS)
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>
