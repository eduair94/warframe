<!-- /guides/mastery-rank — thin page: content lives in data/guides/mastery-rank.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/mastery-rank'
const guide = await useLocalizedGuide('mastery-rank', enGuide)
</script>
