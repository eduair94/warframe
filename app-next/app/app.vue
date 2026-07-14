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

const config = useRuntimeConfig()
const base = config.public.apiURL
const items = useItemsStore()

// Global bootstrap: was default.vue middleware ($axios.get($config.apiURL) -> dispatch setItems).
// useAsyncData swallows fetch errors (data.value stays null) so the shell still renders if the
// API is down; the items store just stays empty in that case.
const { data } = await useAsyncData('app-items', () => $fetch<WarframeItem[]>(base))
if (data.value) items.setItems(data.value)

// The <LoadingBar/> overlay renders visible by default (the initial-load
// spinner). Guarantee it hides once the app has mounted so it can never stick,
// independent of any individual page's own hide logic. Client navigation is
// handled by plugins/nav-loading.client.ts.
onMounted(() => {
  const el = document.getElementById('spinner-wrapper')
  if (el) el.style.display = 'none'
})
</script>
