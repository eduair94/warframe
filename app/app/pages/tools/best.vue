<!-- app/app/pages/tools/best.vue — curated "must-have Warframe tools" guide -->
<template>
  <div class="an tb">
    <article class="an-console">
      <nav class="td-crumb">
        <NuxtLink :to="localePath('/tools')">{{ t('toolDetail.back') }}</NuxtLink>
      </nav>

      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('toolDetail.best.eyebrow') }}</div>
          <h1 class="an-title">{{ t('toolDetail.best.title') }}</h1>
          <p class="an-lede">{{ t('toolDetail.best.lede') }}</p>
        </div>
      </header>

      <!-- Essential + Recommended tiers -->
      <section v-for="grp in tierGroups" :key="grp.tier" class="tb-tier">
        <div class="tb-tier__head">
          <span class="an-chip td-tier" :class="'is-' + grp.tier">{{ t('toolDetail.tier.' + grp.tier) }}</span>
          <p class="tb-tier__blurb">{{ t('toolDetail.best.tierBlurb.' + grp.tier) }}</p>
        </div>
        <div class="tb-grid">
          <NuxtLink v-for="tool in grp.tools" :key="tool.slug" class="an-card tb-card" :to="localePath('/tools/' + tool.slug)">
            <div class="tb-card__shot">
              <img v-if="tool.screenshot" :src="tool.screenshot" :alt="tool.name" loading="lazy" width="1000" height="625" />
              <div v-else class="tb-card__shot--none">{{ tool.name }}</div>
            </div>
            <div class="tb-card__body">
              <h2 class="tb-card__name">{{ tool.name }}</h2>
              <p class="tb-card__why">{{ research(tool.slug)?.tierReason || research(tool.slug)?.oneLiner }}</p>
              <div class="tb-card__meta">
                <span class="tb-cat">{{ t('communityTools.sections.' + tool.category) }}</span>
                <span class="tb-more">{{ t('toolDetail.best.readMore') }} →</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>

      <!-- Best pick per category -->
      <section class="tb-bycat">
        <h2 class="td-sec__title">{{ t('toolDetail.best.byCategory') }}</h2>
        <div class="tb-cat-list">
          <div v-for="row in byCategory" :key="row.cat" class="tb-cat-row">
            <div class="tb-cat-row__cat">{{ t('communityTools.sections.' + row.cat) }}</div>
            <NuxtLink class="tb-cat-row__pick" :to="localePath('/tools/' + row.pick.slug)">{{ row.pick.name }}</NuxtLink>
            <div class="tb-cat-row__why">{{ research(row.pick.slug)?.oneLiner }}</div>
          </div>
        </div>
      </section>

      <!-- Approach with caution -->
      <section v-if="avoidList.length" class="tb-avoid">
        <h2 class="td-sec__title">{{ t('toolDetail.best.caution') }}</h2>
        <ul class="tb-avoid__list">
          <li v-for="tool in avoidList" :key="tool.slug">
            <NuxtLink :to="localePath('/tools/' + tool.slug)">{{ tool.name }}</NuxtLink>
            <span class="tb-avoid__why">— {{ research(tool.slug)?.safety.notes || research(tool.slug)?.tierReason }}</span>
          </li>
        </ul>
      </section>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('communityTools.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import { TOOLS, TOOL_SECTIONS } from '~/data/tools'
import { getResearch, TIER_ORDER } from '~/data/toolResearch'

const { t } = useI18n()
const localePath = useLocalePath()

const research = (slug: string) => getResearch(slug)

// Essential + Recommended tool groups (the "must-have stack"), each sorted by featured.
const TIERS = ['essential', 'recommended'] as const
const tierGroups = computed(() =>
  TIERS.map((tier) => ({
    tier,
    tools: TOOLS.filter((x) => getResearch(x.slug)?.tier === tier).sort(
      (a, b) => Number(b.featured || false) - Number(a.featured || false),
    ),
  })).filter((g) => g.tools.length),
)

// The single best-ranked tool per category (lowest tier order, then featured).
const byCategory = computed(() =>
  TOOL_SECTIONS.map((s) => {
    const cands = TOOLS.filter((x) => x.category === s.key)
    const pick = [...cands].sort((a, b) => {
      const ta = TIER_ORDER[getResearch(a.slug)?.tier || 'niche']
      const tb = TIER_ORDER[getResearch(b.slug)?.tier || 'niche']
      if (ta !== tb) return ta - tb
      return Number(b.featured || false) - Number(a.featured || false)
    })[0]
    return pick ? { cat: s.key, pick } : null
  }).filter((r): r is { cat: string; pick: (typeof TOOLS)[number] } => !!r),
)

const avoidList = computed(() => TOOLS.filter((x) => getResearch(x.slug)?.tier === 'avoid'))

useSeoPage({
  title: () => 'The Best Warframe Tools & Apps — Must-Have Community Picks',
  description: () =>
    'The must-have Warframe tools ranked from real community feedback: trading, builds, drop tables, riven pricing, world-state and farming. The essential Tenno toolkit, plus the best pick in every category.',
  ogType: 'article',
})

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
.td-crumb { padding: 18px 30px 0; font-family: var(--font-hud); font-size: 0.8rem; }
.td-crumb a { color: var(--gold-ink); text-decoration: none; }
.td-crumb a:hover { text-decoration: underline; }

.tb-tier { padding: 8px 30px 22px; border-top: 1px solid rgba(255, 255, 255, 0.06); }
.tb-tier__head { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin: 18px 0 16px; }
.td-tier { text-transform: uppercase; font-weight: 800; letter-spacing: 0.06em; }
.td-tier.is-essential { background: var(--energy) !important; color: #06201f !important; }
.td-tier.is-recommended { background: var(--orokin) !important; color: #17130a !important; }
.tb-tier__blurb { color: var(--ink-dim); font-size: 0.9rem; margin: 0; }

.tb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.tb-card { display: flex; flex-direction: column; overflow: hidden; padding: 0; text-decoration: none; }
.tb-card__shot { aspect-ratio: 16 / 10; background: rgba(0, 0, 0, 0.35); overflow: hidden; }
.tb-card__shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.tb-card__shot--none { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ink-dim); font-family: var(--font-hud); padding: 10px; text-align: center; }
.tb-card__body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.tb-card__name { font-family: var(--font-display); color: var(--gold-ink); font-size: 1.1rem; margin: 0; }
.tb-card__why { color: #cdd2e4; font-size: 0.9rem; line-height: 1.55; margin: 0; flex: 1; }
.tb-card__meta { display: flex; justify-content: space-between; align-items: center; font-family: var(--font-hud); font-size: 0.76rem; }
.tb-cat { color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.tb-more { color: var(--energy); }

.tb-bycat, .tb-avoid { padding: 16px 30px 24px; border-top: 1px solid rgba(255, 255, 255, 0.06); }
.td-sec__title { font-family: var(--font-display); font-size: 1.3rem; color: var(--gold-ink); margin: 6px 0 16px; }
.tb-cat-list { display: flex; flex-direction: column; gap: 2px; }
.tb-cat-row { display: grid; grid-template-columns: 130px 180px 1fr; gap: 14px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.tb-cat-row__cat { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; color: var(--ink-dim); }
.tb-cat-row__pick { font-family: var(--font-display); color: var(--gold-ink); font-size: 1rem; text-decoration: none; }
.tb-cat-row__pick:hover { text-decoration: underline; }
.tb-cat-row__why { color: #cdd2e4; font-size: 0.88rem; line-height: 1.5; }

.tb-avoid__list { margin: 0; padding-left: 18px; color: #cdd2e4; font-size: 0.92rem; line-height: 1.7; }
.tb-avoid__list a { color: var(--rose); text-decoration: none; }
.tb-avoid__list a:hover { text-decoration: underline; }
.tb-avoid__why { color: var(--ink-dim); }

@media (max-width: 700px) {
  .tb-tier, .tb-bycat, .tb-avoid, .td-crumb { padding-left: 16px; padding-right: 16px; }
  .tb-grid { grid-template-columns: 1fr; }
  .tb-cat-row { grid-template-columns: 1fr; gap: 2px; }
}
</style>
