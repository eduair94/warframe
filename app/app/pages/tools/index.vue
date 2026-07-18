<!-- app/app/pages/tools/index.vue -->
<template>
  <div class="an ct">
    <article class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('communityTools.hero.eyebrow') }}</div>
          <h1 class="an-title">{{ t('communityTools.hero.title') }}</h1>
          <p class="an-lede">{{ t('communityTools.hero.lede') }}</p>
          <NuxtLink class="ct-guide-cta" :to="localePath('/tools/best')">
            ★ {{ t('toolDetail.index.bestGuideCta') }}
          </NuxtLink>
        </div>
      </header>

      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ TOOLS.length }}</div>
          <div class="an-stat__lbl">{{ t('communityTools.stats.tools') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">{{ openSourceCount }}</div>
          <div class="an-stat__lbl">{{ t('communityTools.stats.openSource') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ verifiedCount }}</div>
          <div class="an-stat__lbl">{{ t('communityTools.stats.verified') }}</div>
        </div>
      </div>

      <section v-for="sec in sections" :key="sec.key" class="ct-section">
        <div class="ct-section__title">{{ t('communityTools.sections.' + sec.key) }}</div>
        <div class="ct-grid">
          <article v-for="tool in sec.tools" :key="tool.slug" class="an-card ct-card" :class="{ 'is-top': tool.featured }">
            <div class="ct-card__shot">
              <img v-if="tool.screenshot" :src="tool.screenshot" :alt="tool.name" loading="lazy" width="1000" height="625" />
              <div v-else class="ct-card__shot--none">{{ tool.name }}</div>
              <span v-if="tool.verified" class="ct-verified" :title="t('communityTools.verified')">✓</span>
            </div>
            <div class="ct-card__body">
              <div class="ct-card__head">
                <h3 class="ct-card__name">
                  <NuxtLink class="ct-card__namelink" :to="localePath('/tools/' + tool.slug)">{{ tool.name }}</NuxtLink>
                </h3>
                <span class="ct-plats">
                  <span v-for="p in tool.platforms" :key="p" class="an-chip ct-plat">{{ t('communityTools.platform.' + p) }}</span>
                </span>
              </div>
              <p class="ct-card__desc">{{ cardDesc(tool) }}</p>

              <div v-if="tool.caveat === 'rmt'" class="ct-warn ct-warn--rmt">⚠ {{ t('communityTools.caveat.rmt') }}</div>
              <div v-else-if="tool.caveat === 'partial'" class="ct-warn ct-warn--partial">{{ t('communityTools.caveat.partial') }}</div>

              <div class="ct-meta">
                <span v-if="tool.domain?.created" class="ct-meta__i">
                  {{ t('communityTools.card.established', { year: yearOf(tool.domain.created) }) }}
                  <template v-if="tool.domain.ageYears != null"> · {{ tool.domain.ageYears }}y</template>
                </span>
                <span v-if="tool.repo" class="ct-meta__i" :class="{ 'is-stale': isStale(tool.repo.lastCommit) }">
                  ★ {{ tool.repo.stars }} · {{ rel(tool.repo.lastCommit) }}
                  <template v-if="tool.repo.archived"> · archived</template>
                </span>
                <span v-if="tool.openSource" class="ct-meta__i is-alt">{{ t('communityTools.card.openSource') }}</span>
              </div>

              <ToolSocials v-if="tool.social" :social="tool.social" variant="compact" />

              <div class="ct-actions">
                <NuxtLink class="ct-visit" :to="localePath('/tools/' + tool.slug)">{{ t('toolDetail.card.details') }}</NuxtLink>
                <a class="ct-sub" :href="tool.url" target="_blank" rel="noopener nofollow">{{ t('communityTools.visit') }}</a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('communityTools.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { TOOLS, TOOL_SECTIONS, toolsByCategory } from '~/data/tools'
import { RESEARCH } from '~/data/toolResearch'

// Localized per-tool research prose for the active locale (English fallback).
const localizedResearch = await useLocalizedResearch(RESEARCH)
const getResearch = (slug: string) => localizedResearch[slug]

dayjs.extend(relativeTime)
const { t, te } = useI18n()
const localePath = useLocalePath()

// ItemList JSON-LD enumerating the tool directory (rich results + AI citation).
const origin = useRequestURL().origin
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Warframe Community Tools',
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: TOOLS.length,
        itemListElement: TOOLS.map((tool, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: origin + localePath('/tools/' + tool.slug),
          name: tool.name,
        })),
      }).replace(/</g, '\\u003c'),
    },
  ],
})

// Card blurb: localized per-tool desc when present, else the tool's research
// one-liner (English) — covers tools without a communityTools.desc key (e.g. our
// own self-listing).
function cardDesc(tool: { slug: string }): string {
  const key = 'communityTools.desc.' + tool.slug
  return te(key) ? t(key) : getResearch(tool.slug)?.oneLiner || ''
}

const openSourceCount = computed(() => TOOLS.filter((x) => x.openSource).length)
const verifiedCount = computed(() => TOOLS.filter((x) => x.verified).length)
const sections = computed(() =>
  TOOL_SECTIONS.map((s) => ({ key: s.key, tools: toolsByCategory(s.key) })).filter((s) => s.tools.length),
)

function yearOf(iso: string) { return new Date(iso).getUTCFullYear() }
function rel(iso: string) { return dayjs(iso).fromNow() }
function isStale(iso: string) { return dayjs().diff(dayjs(iso), 'month') >= 12 }

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
.ct-section { padding: 8px 30px 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.ct-section__title { font-family: var(--font-display); font-size: 1.3rem; color: var(--gold-ink); margin: 22px 0 14px; }
.ct-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.ct-card { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.ct-card__shot { position: relative; aspect-ratio: 16 / 10; background: rgba(0, 0, 0, 0.35); overflow: hidden; }
.ct-card__shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.ct-card__shot--none { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ink-dim); font-family: var(--font-hud); padding: 10px; text-align: center; }
.ct-verified { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--energy); color: #06201f; font-weight: 800; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }
.ct-card__body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.ct-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.ct-card__name { font-family: var(--font-display); color: var(--ink); font-size: 1.06rem; margin: 0; }
.ct-card__namelink { color: inherit; text-decoration: none; }
.ct-card__namelink:hover { color: var(--gold-ink); }
.ct-guide-cta { display: inline-block; margin-top: 16px; font-family: var(--font-hud); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.84rem; color: var(--gold-ink); text-decoration: none; padding: 9px 18px; border: 1px solid var(--orokin-line); clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.ct-guide-cta:hover { background: rgba(200, 168, 92, 0.12); }
.ct-plats { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.ct-plat.an-chip { font-size: 0.62rem !important; padding: 1px 7px !important; }
.ct-card__desc { color: #cdd2e4; font-size: 0.88rem; line-height: 1.5; margin: 0; flex: 1; }
.ct-warn { font-size: 0.78rem; line-height: 1.4; padding: 7px 10px; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.ct-warn--rmt { background: rgba(217, 138, 138, 0.14); border: 1px solid rgba(217, 138, 138, 0.5); color: #f0d2d2; }
.ct-warn--partial { background: rgba(200, 168, 92, 0.1); border: 1px solid var(--orokin-line); color: #ece4d0; }
.ct-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-family: var(--font-hud); font-size: 0.74rem; color: var(--ink-dim); }
.ct-meta__i.is-alt { color: var(--energy); }
.ct-meta__i.is-stale { color: var(--rose); }
.ct-actions { display: flex; gap: 8px; margin-top: 4px; }
.ct-visit { flex: 1; text-align: center; font-family: var(--font-hud); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.82rem; color: #17130a; background: var(--orokin); text-decoration: none; padding: 9px 14px; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.ct-visit:hover { background: var(--gold-ink); }
.ct-sub { font-family: var(--font-hud); font-size: 0.82rem; color: var(--gold-ink); text-decoration: none; padding: 9px 12px; border: 1px solid var(--orokin-line); }
.ct-sub:hover { background: rgba(200, 168, 92, 0.12); }
@media (max-width: 600px) { .ct-section { padding-left: 16px; padding-right: 16px; } .ct-grid { grid-template-columns: 1fr; } }
</style>
