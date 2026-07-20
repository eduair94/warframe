<!-- /guides — the Knowledge Center hub. The single front door to every guide,
     the FAQ and the creators directory, grouped by category with a live filter.
     Orokin "Void Ledger" look. -->
<template>
  <div class="an gh">
    <article class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('guidesHub.eyebrow') }}</div>
          <h1 class="an-title">{{ t('guidesHub.title') }}</h1>
          <p class="an-lede">{{ t('guidesHub.lede') }}</p>
        </div>
        <div class="an-hero__deal gh-hero-cta">
          <div class="an-hero__deal-label">{{ t('guidesHub.startHere') }}</div>
          <NuxtLink
            class="an-hero__deal-name gh-hero-cta__link"
            :to="localePath('/guides/new-player')"
            @click="onCardClick('new-player', 'hub_cta')"
          >
            {{ t('guidesHub.newPlayerCta') }}
          </NuxtLink>
          <div class="an-hero__deal-sub">{{ t('guidesHub.newPlayerSub') }}</div>
        </div>
      </header>

      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ GUIDES_INDEX.length }}</div>
          <div class="an-stat__lbl">{{ t('guidesHub.stats.guides') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ FAQS.length }}</div>
          <div class="an-stat__lbl">{{ t('guidesHub.stats.faqs') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">{{ CREATORS.length }}</div>
          <div class="an-stat__lbl">{{ t('guidesHub.stats.creators') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num">100%</div>
          <div class="an-stat__lbl">{{ t('guidesHub.stats.free') }}</div>
        </div>
      </div>

      <!-- Quick-jump: farming hub + FAQ + creators -->
      <div class="gh-quick">
        <NuxtLink class="gh-quick__card" :to="localePath('/guides/farming')" @click="onCardClick('farming-hub', 'hub_cta')">
          <v-icon class="gh-quick__icon">mdi-magnify-scan</v-icon>
          <span class="gh-quick__body">
            <span class="gh-quick__label">{{ t('guidesHub.farmingCard') }}</span>
            <span class="gh-quick__note">{{ t('guidesHub.farmingNote') }}</span>
          </span>
        </NuxtLink>
        <NuxtLink class="gh-quick__card" :to="localePath('/faq')" @click="onCardClick('faq', 'hub_cta')">
          <v-icon class="gh-quick__icon">mdi-help-circle-outline</v-icon>
          <span class="gh-quick__body">
            <span class="gh-quick__label">{{ t('guidesHub.faqCard') }}</span>
            <span class="gh-quick__note">{{ t('guidesHub.faqNote') }}</span>
          </span>
        </NuxtLink>
        <NuxtLink class="gh-quick__card" :to="localePath('/creators')" @click="onCardClick('creators', 'hub_cta')">
          <v-icon class="gh-quick__icon">mdi-youtube</v-icon>
          <span class="gh-quick__body">
            <span class="gh-quick__label">{{ t('guidesHub.creatorsCard') }}</span>
            <span class="gh-quick__note">{{ t('guidesHub.creatorsNote') }}</span>
          </span>
        </NuxtLink>
        <NuxtLink class="gh-quick__card" :to="localePath('/tools')" @click="onCardClick('tools', 'hub_cta')">
          <v-icon class="gh-quick__icon">mdi-tools</v-icon>
          <span class="gh-quick__body">
            <span class="gh-quick__label">{{ t('guidesHub.toolsCard') }}</span>
            <span class="gh-quick__note">{{ t('guidesHub.toolsNote') }}</span>
          </span>
        </NuxtLink>
      </div>

      <!-- Search -->
      <div class="gh-search-wrap">
        <div class="fq-search">
          <v-icon class="fq-search__icon">mdi-magnify</v-icon>
          <input
            v-model="query"
            type="search"
            class="fq-search__input"
            :placeholder="t('guidesHub.searchPlaceholder')"
            :aria-label="t('guidesHub.searchPlaceholder')"
          />
        </div>
      </div>

      <!-- Category sections -->
      <section v-for="cat in KNOWLEDGE_CATEGORIES" v-show="grouped[cat.key]?.length" :key="cat.key" class="gh-section">
        <div class="gh-section__head">
          <v-icon class="gh-section__icon">{{ cat.icon }}</v-icon>
          <div>
            <h2 class="gh-section__title">{{ t('guidesHub.cats.' + cat.key + '.title') }}</h2>
            <p class="gh-section__blurb">{{ t('guidesHub.cats.' + cat.key + '.blurb') }}</p>
          </div>
        </div>
        <div class="gh-grid">
          <NuxtLink
            v-for="g in grouped[cat.key]"
            :key="g.slug"
            class="an-card gh-card"
            :class="{ 'is-top': g.featured }"
            :to="localePath(g.route)"
            @click="onCardClick(g.slug, 'guide', g.category)"
          >
            <div class="gh-card__top">
              <v-icon class="gh-card__icon">{{ g.icon }}</v-icon>
              <span v-if="g.featured" class="gh-card__badge">{{ t('guidesHub.startBadge') }}</span>
            </div>
            <h3 class="gh-card__title">{{ g.title }}</h3>
            <p class="gh-card__blurb">{{ g.blurb }}</p>
            <div class="gh-card__foot">
              <span class="gh-card__read">{{ g.readMins }} {{ t('guidesChrome.minRead') }}</span>
              <span class="gh-card__arrow">→</span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <p v-if="!anyResults" class="ga-note gh-empty">{{ t('guidesHub.noResults') }}</p>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('guidesHub.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { GUIDES_INDEX, KNOWLEDGE_CATEGORIES } from '~/data/guides/registry'
import { FAQS } from '~/data/faq'
import { CREATORS } from '~/data/creators'

const { t } = useI18n()
const localePath = useLocalePath()

const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return GUIDES_INDEX
  return GUIDES_INDEX.filter((g) => (g.title + ' ' + g.blurb + ' ' + g.slug).toLowerCase().includes(q))
})
const grouped = computed(() => {
  const g: Record<string, typeof GUIDES_INDEX> = {}
  for (const item of filtered.value) (g[item.category] ||= []).push(item)
  return g
})
const anyResults = computed(() => filtered.value.length > 0)

const { trackContent, trackSearch } = useAnalytics()

// The hub's quick-jump CTAs and the guide cards are the same decision ("where
// do I go from here?"), so they share one event and `card_kind` tells them
// apart — one dimension to slice instead of two event names.
function onCardClick(id: string, kind: 'guide' | 'hub_cta', category?: string) {
  trackContent('guide_card_click', id, { card_kind: kind, category })
}

// The filter runs on every keystroke; the event must not. Fire once the user
// stops typing, with the result count so "searches that found nothing" is a
// direct answer to "what guide is missing?".
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  clearTimeout(searchTimer)
  const term = q.trim()
  if (term.length < 2) return
  searchTimer = setTimeout(() => trackSearch(term, filtered.value.length), 700)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

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
.gh-hero-cta { text-align: left; min-width: 220px; }
.gh-hero-cta__link { display: block; font-family: var(--font-display); font-size: 1.3rem; color: var(--gold-ink) !important; text-decoration: none; margin: 6px 0 6px; }
.gh-hero-cta__link:hover { color: #f4e2b4 !important; }

.gh-quick { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; padding: 18px 30px 6px; }
.gh-quick__card {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; text-decoration: none;
  background: linear-gradient(160deg, rgba(53, 214, 208, 0.06), rgba(0, 0, 0, 0.2));
  border: 1px solid rgba(53, 214, 208, 0.28);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.gh-quick__card:hover { border-color: var(--energy); transform: translateY(-2px); }
.gh-quick__icon { color: var(--energy) !important; font-size: 26px !important; }
.gh-quick__body { display: flex; flex-direction: column; gap: 2px; }
.gh-quick__label { font-family: var(--font-hud); font-weight: 700; color: var(--ink); font-size: 0.98rem; }
.gh-quick__note { color: var(--ink-dim); font-size: 0.8rem; }

.gh-search-wrap { padding: 16px 30px 4px; }
.fq-search {
  display: flex; align-items: center; gap: 10px; padding: 0 14px;
  background: rgba(0, 0, 0, 0.3); border: 1px solid var(--orokin-line);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.fq-search__icon { color: var(--orokin) !important; }
.fq-search__input { flex: 1; background: transparent; border: 0; outline: none; color: var(--ink); font-family: var(--font-hud); font-size: 1rem; padding: 13px 0; }
.fq-search__input::placeholder { color: var(--ink-dim); }

.gh-section { padding: 8px 30px 10px; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 8px; }
.gh-section__head { display: flex; align-items: center; gap: 14px; margin: 18px 0 14px; }
.gh-section__icon { color: var(--orokin) !important; font-size: 30px !important; }
.gh-section__title { font-family: var(--font-display); font-size: 1.35rem; color: var(--gold-ink); margin: 0; }
.gh-section__blurb { color: var(--ink-dim); font-size: 0.9rem; margin: 2px 0 0; }

.gh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.gh-card { display: flex; flex-direction: column; gap: 8px; padding: 16px; text-decoration: none; transition: border-color 0.15s ease, transform 0.15s ease; }
.gh-card:hover { transform: translateY(-2px); }
.gh-card__top { display: flex; justify-content: space-between; align-items: center; }
.gh-card__icon { color: var(--orokin) !important; font-size: 28px !important; }
.gh-card__badge {
  font-family: var(--font-hud); font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #06201f; background: var(--energy); padding: 2px 8px;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.gh-card__title { font-family: var(--font-display); color: var(--ink); font-size: 1.08rem; margin: 0; line-height: 1.25; }
.gh-card__blurb { color: #cdd2e4; font-size: 0.88rem; line-height: 1.5; margin: 0; flex: 1; }
.gh-card__foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
.gh-card__read { font-family: var(--font-hud); font-size: 0.76rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-dim); }
.gh-card__arrow { color: var(--orokin); font-family: var(--font-hud); font-size: 1.1rem; }

.ga-note { color: var(--ink-dim); font-family: var(--font-hud); font-size: 0.9rem; }
.gh-empty { padding: 20px 30px; }

@media (max-width: 600px) {
  .gh-quick, .gh-search-wrap, .gh-section { padding-left: 18px; padding-right: 18px; }
}
</style>
