<!-- /guides/tier-list — thin page: content lives in data/guides/tier-list.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/tier-list'
const guide = await useLocalizedGuide('tier-list', enGuide)
</script>
