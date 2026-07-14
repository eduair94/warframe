<template>
  <div style="padding: 2rem; font-family: sans-serif">
    <h1>app-next scaffold OK</h1>
    <p>Nuxt {{ 4 }} boots. API base: {{ apiURL }}</p>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const apiURL = config.public.apiURL
</script>
