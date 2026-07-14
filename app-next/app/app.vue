<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
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
</script>
