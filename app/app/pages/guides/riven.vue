<!-- /guides/riven — thin page: content lives in data/guides/riven.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import guide from '~/data/guides/riven'
</script>
