<!-- /guides/resources — thin page: content lives in data/guides/resources.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/resources'
const guide = await useLocalizedGuide('resources', enGuide)
</script>
