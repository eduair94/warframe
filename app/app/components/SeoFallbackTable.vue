<!--
  Plain, semantic HTML table rendered ONLY inside a <client-only> `#fallback`
  slot. The interactive Vuetify data-tables on the market pages are wrapped in
  <client-only> (Vuetify's v-data-table reads the viewport via useDisplay() for
  its mobile-card breakpoint, which differs between SSR and client hydration
  and would otherwise cause a hydration mismatch / full remount), which means
  their real price content was previously ABSENT from the server-rendered HTML
  entirely — invisible to Google's initial HTML pass and to any crawler that
  doesn't execute JavaScript (Bing, and the GPTBot/PerplexityBot/ClaudeBot
  crawlers robots.txt explicitly welcomes). This component fills that gap with
  a real <table> built from data already fetched during SSR, so the page's
  actual content exists in the HTML from the first byte. It's swapped out for
  the interactive table the instant client-side JS mounts.
-->
<template>
  <table class="seo-fallback-table">
    <caption class="visually-hidden">{{ caption }}</caption>
    <thead>
      <tr>
        <th scope="col">{{ nameLabel }}</th>
        <th v-for="col in columns" :key="col" scope="col">{{ col }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.key">
        <td>
          <a :href="row.href" target="_blank" rel="noopener">{{ row.name }}</a>
        </td>
        <td v-for="(cell, i) in row.cells" :key="i">{{ cell }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
defineProps<{
  caption: string
  nameLabel: string
  columns: string[]
  rows: Array<{ key: string; href: string; name: string; cells: Array<string | number> }>
}>()
</script>

<style scoped>
.seo-fallback-table {
  width: 100%;
  border-collapse: collapse;
  color: #dfe3f0;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.95rem;
}
.seo-fallback-table caption {
  text-align: left;
}
.seo-fallback-table th,
.seo-fallback-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.18);
  text-align: left;
}
.seo-fallback-table th {
  color: #c8a85c;
  font-weight: 700;
}
.seo-fallback-table a {
  color: #e7cf95;
}
</style>
