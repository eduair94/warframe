<!-- /guides/archon-shards — thin page: content lives in data/guides/archon-shards.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/archon-shards'
const guide = await useLocalizedGuide('archon-shards', enGuide)
</script>
