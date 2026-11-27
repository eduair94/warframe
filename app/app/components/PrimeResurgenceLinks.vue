<template>
  <section class="pr-links" aria-labelledby="prime-resurgence-title">
    <h2 id="prime-resurgence-title">Prime Resurgence</h2>
    <p>{{ t('vaultedWorth.reason.resurgence') }}</p>
    <div class="pr-links__actions">
      <a href="https://www.warframe.com/en/shop/prime/resurgence" target="_blank" rel="noopener">Warframe.com · Prime Resurgence ↗</a>
      <NuxtLink :to="localePath('/relics')">{{ t('nav.items.relicPrices') }} →</NuxtLink>
      <NuxtLink :to="localePath('/guides/relics') + '#vaulting'">{{ t('nav.sections.guides') }} · Prime Resurgence →</NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<style scoped>
.pr-links { padding: 20px 30px; border-top: 1px solid var(--orokin-line); border-bottom: 1px solid var(--orokin-line); }
.pr-links h2 { margin: 0 0 8px; color: var(--gold-ink); font-family: var(--font-display); font-size: 1.15rem; }
.pr-links p { margin: 0 0 12px; color: var(--ink-dim); line-height: 1.5; }
.pr-links__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.pr-links__actions a { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 12px; border: 1px solid var(--orokin-line); color: var(--gold-ink); text-decoration: none; }
.pr-links__actions a:hover { background: rgba(200, 168, 92, 0.12); }
.pr-links__actions a:focus-visible { outline: 2px solid var(--energy); outline-offset: 3px; }
@media (max-width: 600px) { .pr-links { padding: 16px; } }
</style>
