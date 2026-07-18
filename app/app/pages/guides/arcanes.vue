<!-- /guides/arcanes — thin page: content lives in data/guides/arcanes.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/arcanes'
const guide = await useLocalizedGuide('arcanes', enGuide)
</script>
