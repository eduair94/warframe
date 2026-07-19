<!-- /guides/forma — thin page: content lives in data/guides/forma.ts, rendered
     by the shared <GuideArticle>. SEO title/description come from the central
     PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/forma'
const guide = await useLocalizedGuide('forma', enGuide)
</script>
