<!-- /guides/beginner-warframes — thin page: content lives in data/guides/beginner-warframes.ts,
     rendered by the shared <GuideArticle>. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/beginner-warframes'
const guide = await useLocalizedGuide('beginner-warframes', enGuide)
</script>
