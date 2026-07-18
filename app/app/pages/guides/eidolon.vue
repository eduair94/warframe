<!-- /guides/eidolon — thin page: content lives in data/guides/eidolon.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/eidolon'
const guide = await useLocalizedGuide('eidolon', enGuide)
</script>
