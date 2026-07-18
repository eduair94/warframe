<!-- /guides/credits — thin page: content lives in data/guides/credits.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/credits'
const guide = await useLocalizedGuide('credits', enGuide)
</script>
