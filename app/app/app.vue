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

// ---- Structured data (JSON-LD) --------------------------------------------
// WebSite + WebApplication describing the tool, so Google / AI answer engines
// can identify and cite it. Origin is derived per-request so it's correct in
// dev and prod without hardcoding. `<` is escaped to keep the inline script
// safe even though all values here are static.
const origin = useRequestURL().origin
const ldjson = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Warframe Market Analytics',
    alternateName: 'Warframe Analytics',
    url: origin,
    inLanguage: 'en',
    description:
      'Free real-time Warframe Market analytics: live prime prices, set-vs-parts, ducat efficiency, relic and riven valuation, vaulted-price tracking and trading signals.'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Warframe Market Analytics',
    url: origin,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    description:
      'Live Warframe Market trading tools — prime set vs parts, ducat and relic value, riven pricing, flip finder, vaulted-price and volatility tracking.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Person',
      name: 'Eduardo Airaudo',
      url: 'https://www.linkedin.com/in/eduardo-airaudo/'
    },
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
const CATALOGUE_FETCH = { retry: 2, retryDelay: 400, timeout: 25000 } as const
const { data } = await useAsyncData('app-items', () =>
  $fetch<WarframeItem[]>(base, CATALOGUE_FETCH).catch(() => null)
)
if (data.value?.length) {
  items.setItems(data.value)
} else if (import.meta.server) {
  const event = useRequestEvent()
  if (event) event.node.res.setHeader('Cache-Control', 'no-store, must-revalidate')
}

// The <LoadingBar/> overlay renders visible by default (the initial-load
// spinner). Guarantee it hides once the app has mounted so it can never stick,
// independent of any individual page's own hide logic. Client navigation is
// handled by plugins/nav-loading.client.ts.
onMounted(() => {
  const el = document.getElementById('spinner-wrapper')
  if (el) el.style.display = 'none'
  // Self-heal (see bootstrap note #3): if SSR delivered an empty catalogue (slow/
  // cold API, or an SWR-cached blank render), the store is empty and every page
  // would render blank. Refetch client-side from the public API so the UI recovers
  // without a manual reload. Cheap: the public API is Cloudflare-cached.
  if (!items.allItems.length) {
    $fetch<WarframeItem[]>(base, CATALOGUE_FETCH)
      .then((list) => {
        if (list?.length) items.setItems(list)
      })
      .catch(() => {})
  }
})
</script>
