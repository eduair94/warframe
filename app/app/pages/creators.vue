<!-- /creators — a verified directory of Warframe YouTube creators. Featured
     creators show an embedded signature video; the rest are channel cards.
     Every channel URL + video id was verified live. Orokin "Void Ledger" look. -->
<template>
  <div class="an cr">
    <article class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('creators.eyebrow') }}</div>
          <h1 class="an-title">{{ t('creators.title') }}</h1>
          <p class="an-lede">{{ t('creators.lede') }}</p>
          <div class="ga-meta">
            <NuxtLink :to="localePath('/guides')" class="ga-crumb">← {{ t('guidesChrome.backToHub') }}</NuxtLink>
          </div>
        </div>
      </header>

      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ CREATORS.length }}</div>
          <div class="an-stat__lbl">{{ t('creators.stats.channels') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ featured.length }}</div>
          <div class="an-stat__lbl">{{ t('creators.stats.featured') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">100%</div>
          <div class="an-stat__lbl">{{ t('creators.stats.verified') }}</div>
        </div>
      </div>

      <!-- Tag filter -->
      <div class="cr-filter">
        <button
          type="button"
          class="cr-chip"
          :class="{ 'is-on': activeTag === null }"
          @click="activeTag = null"
        >{{ t('creators.all') }}</button>
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          class="cr-chip"
          :class="{ 'is-on': activeTag === tag }"
          @click="activeTag = activeTag === tag ? null : tag"
        >{{ tag }}</button>
      </div>

      <!-- Featured (with embedded video) -->
      <section v-if="featuredFiltered.length" class="ga-section">
        <h2 class="ga-section__title">{{ t('creators.featuredTitle') }}</h2>
        <div class="cr-featgrid">
          <article v-for="c in featuredFiltered" :key="c.handle" class="an-card cr-feat">
            <YouTubeEmbed v-if="c.video" :id="c.video.id" :title="c.video.title" :channel="c.name" max="100%" />
            <div class="cr-feat__body">
              <div class="cr-feat__head">
                <h3 class="cr-name">{{ c.name }}</h3>
                <span class="cr-handle">{{ c.handle }}</span>
              </div>
              <p class="cr-blurb">{{ c.blurb }}</p>
              <div class="cr-tags">
                <span v-for="tg in c.tags" :key="tg" class="cr-tag">{{ tg }}</span>
              </div>
              <a class="cr-visit" :href="c.url" target="_blank" rel="noopener nofollow">{{ t('creators.visit') }}</a>
            </div>
          </article>
        </div>
      </section>

      <!-- Directory (channel cards) -->
      <section v-if="restFiltered.length" class="ga-section">
        <h2 class="ga-section__title">{{ t('creators.moreTitle') }}</h2>
        <div class="cr-grid">
          <a
            v-for="c in restFiltered"
            :key="c.handle"
            class="an-card cr-card"
            :href="c.url"
            target="_blank"
            rel="noopener nofollow"
          >
            <div class="cr-card__head">
              <h3 class="cr-name">{{ c.name }}</h3>
              <span class="cr-handle">{{ c.handle }}</span>
            </div>
            <p class="cr-blurb">{{ c.blurb }}</p>
            <div class="cr-tags">
              <span v-for="tg in c.tags" :key="tg" class="cr-tag">{{ tg }}</span>
            </div>
          </a>
        </div>
      </section>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('creators.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import { CREATORS as EN_CREATORS } from '~/data/creators'

// Localized creator blurbs for the active locale (English fallback).
const CREATORS = await useLocalizedCreators(EN_CREATORS)

const { t } = useI18n()
const localePath = useLocalePath()

// ItemList of Person items — structured data for the creator directory.
const origin = useRequestURL().origin
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Best Warframe Content Creators',
        numberOfItems: CREATORS.length,
        itemListElement: CREATORS.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Person',
            name: c.name,
            url: c.url,
            ...(c.handle ? { alternateName: c.handle } : {}),
          },
        })),
      }).replace(/</g, '\\u003c'),
    },
  ],
})

const activeTag = ref<string | null>(null)
const tags = computed(() => [...new Set(CREATORS.flatMap((c) => c.tags))].sort())
const featured = computed(() => CREATORS.filter((c) => c.featured))

function match(c: (typeof CREATORS)[number]) {
  return activeTag.value === null || c.tags.includes(activeTag.value)
}
const featuredFiltered = computed(() => featured.value.filter(match))
const restFiltered = computed(() => CREATORS.filter((c) => !c.featured && match(c)))

function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => finishLoading())
</script>

<style scoped>
.ga-meta { margin-top: 14px; }
.ga-crumb { color: var(--energy); text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; font-family: var(--font-hud); font-size: 0.8rem; }
.ga-crumb:hover { color: var(--energy-hi); }
.ga-section { padding: 10px 30px 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.ga-section__title { font-family: var(--font-display); font-size: 1.42rem; color: var(--gold-ink); margin: 22px 0 14px; }

.cr-filter { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 30px 8px; }
.cr-chip {
  font-family: var(--font-hud); font-weight: 600; letter-spacing: 0.04em; font-size: 0.8rem;
  text-transform: uppercase; color: #b6bcd0; background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--line); padding: 6px 14px; cursor: pointer;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.cr-chip:hover { color: var(--gold-ink); border-color: var(--orokin-line); }
.cr-chip.is-on { color: #17130a; background: var(--orokin); border-color: var(--orokin); font-weight: 700; }

.cr-featgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
.cr-feat { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.cr-feat__body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 9px; flex: 1; }
.cr-feat__head, .cr-card__head { display: flex; align-items: baseline; gap: 9px; flex-wrap: wrap; }
.cr-name { font-family: var(--font-display); color: var(--ink); font-size: 1.12rem; margin: 0; }
.cr-handle { font-family: var(--font-hud); color: var(--orokin); font-size: 0.82rem; letter-spacing: 0.02em; }
.cr-blurb { color: #cdd2e4; font-size: 0.9rem; line-height: 1.55; margin: 0; flex: 1; }
.cr-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.cr-tag {
  font-family: var(--font-hud); font-size: 0.66rem; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--energy); background: rgba(53, 214, 208, 0.08); border: 1px solid rgba(53, 214, 208, 0.28);
  padding: 2px 8px;
}
.cr-visit {
  align-self: flex-start; margin-top: 2px; font-family: var(--font-hud); font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.8rem; color: #17130a;
  background: var(--orokin); text-decoration: none; padding: 8px 16px;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: background 0.15s;
}
.cr-visit:hover { background: var(--gold-ink); }

.cr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.cr-card {
  display: flex; flex-direction: column; gap: 9px; padding: 16px; text-decoration: none;
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.cr-card:hover { transform: translateY(-2px); }

@media (max-width: 600px) {
  .ga-section, .cr-filter { padding-left: 18px; padding-right: 18px; }
}
</style>
