<!-- /guides/endo — thin page: content lives in data/guides/endo.ts, rendered by
     the shared <GuideArticle>. This replaced the old bespoke "buy Endo cheap with
     plat" landing page; that buy-with-plat route now lives on the /endo tool,
     linked from this guide's `related` cards. SEO title/description come from the
     central PAGE_SEO map (utils/seo.ts) via the layout. -->
<template>
  <GuideArticle :guide="guide" />
</template>

<script setup lang="ts">
import enGuide from '~/data/guides/endo'
const guide = await useLocalizedGuide('endo', enGuide)
</script>
