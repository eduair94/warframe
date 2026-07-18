<!-- /faq — the searchable Warframe FAQ. Grounded in the r/Warframe wiki FAQ and
     the questions the subreddit asks most, answered concisely with links into
     the deeper guides + live tools. Emits FAQPage JSON-LD (rich results / AI
     citations). Orokin "Void Ledger" look. -->
<template>
  <div class="an fq">
    <article class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('faq.eyebrow') }}</div>
          <h1 class="an-title">{{ t('faq.title') }}</h1>
          <p class="an-lede">{{ t('faq.lede') }}</p>
          <div class="ga-meta">
            <NuxtLink :to="localePath('/guides')" class="ga-crumb">← {{ t('guidesChrome.backToHub') }}</NuxtLink>
          </div>
        </div>
      </header>

      <!-- Search + category filter -->
      <div class="fq-controls">
        <div class="fq-search">
          <v-icon class="fq-search__icon">mdi-magnify</v-icon>
          <input
            v-model="query"
            type="search"
            class="fq-search__input"
            :placeholder="t('faq.searchPlaceholder')"
            :aria-label="t('faq.searchPlaceholder')"
          />
        </div>
        <div class="fq-cats">
          <button
            type="button"
            class="cr-chip"
            :class="{ 'is-on': activeCat === null }"
            @click="activeCat = null"
          >{{ t('faq.all') }} <span class="cr-chip__n">{{ FAQS.length }}</span></button>
          <button
            v-for="c in FAQ_CATEGORIES"
            :key="c.key"
            type="button"
            class="cr-chip"
            :class="{ 'is-on': activeCat === c.key }"
            @click="activeCat = activeCat === c.key ? null : c.key"
          >
            {{ c.title }} <span class="cr-chip__n">{{ countByCat(c.key) }}</span>
          </button>
        </div>
      </div>

      <!-- Results -->
      <section class="ga-section fq-results">
        <p v-if="!filtered.length" class="ga-note">{{ t('faq.noResults') }}</p>
        <template v-for="c in FAQ_CATEGORIES" :key="c.key">
          <div v-if="grouped[c.key]?.length" class="fq-group">
            <div class="fq-group__title">
              <v-icon class="fq-group__icon">{{ c.icon }}</v-icon>{{ c.title }}
            </div>
            <div class="ga-faq">
              <details v-for="(f, i) in grouped[c.key]" :key="i" class="ga-faq__item" :open="!!query">
                <summary class="ga-faq__q">{{ f.q }}</summary>
                <div class="ga-faq__a" v-html="renderRich(f.a)" />
              </details>
            </div>
          </div>
        </template>
      </section>

      <!-- CTA to the hub -->
      <div class="fq-cta">
        <NuxtLink class="fq-cta__btn" :to="localePath('/guides')">{{ t('faq.cta') }}</NuxtLink>
      </div>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('faq.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import { FAQS, FAQ_CATEGORIES } from '~/data/faq'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const query = ref('')
const activeCat = ref<string | null>(null)

function countByCat(key: string) {
  return FAQS.filter((f) => f.cat === key).length
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return FAQS.filter((f) => {
    if (activeCat.value && f.cat !== activeCat.value) return false
    if (!q) return true
    return (f.q + ' ' + f.a).toLowerCase().includes(q)
  })
})

const grouped = computed(() => {
  const g: Record<string, typeof FAQS> = {}
  for (const f of filtered.value) (g[f.cat] ||= []).push(f)
  return g
})

// FAQPage JSON-LD over the full set (not the filtered view) so crawlers always
// see every Q&A regardless of the visitor's client-side filter.
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: locale.value,
          mainEntity: FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: stripRich(f.a) },
          })),
        }),
      ),
    },
  ],
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
.ga-meta { margin-top: 14px; }
.ga-crumb { color: var(--energy); text-decoration: none; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; font-family: var(--font-hud); font-size: 0.8rem; }
.ga-crumb:hover { color: var(--energy-hi); }
.ga-section { padding: 10px 30px 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.ga-note { color: var(--ink-dim); font-family: var(--font-hud); font-size: 0.9rem; }

.fq-controls { padding: 14px 30px 6px; display: flex; flex-direction: column; gap: 14px; }
.fq-search {
  display: flex; align-items: center; gap: 10px; padding: 0 14px;
  background: rgba(0, 0, 0, 0.3); border: 1px solid var(--orokin-line);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.fq-search__icon { color: var(--orokin) !important; }
.fq-search__input {
  flex: 1; background: transparent; border: 0; outline: none; color: var(--ink);
  font-family: var(--font-hud); font-size: 1rem; padding: 13px 0; letter-spacing: 0.02em;
}
.fq-search__input::placeholder { color: var(--ink-dim); }
.fq-cats { display: flex; flex-wrap: wrap; gap: 8px; }
.cr-chip {
  font-family: var(--font-hud); font-weight: 600; letter-spacing: 0.03em; font-size: 0.8rem;
  color: #b6bcd0; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--line);
  padding: 6px 13px; cursor: pointer;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  transition: color 0.15s, background 0.15s, border-color 0.15s;
}
.cr-chip:hover { color: var(--gold-ink); border-color: var(--orokin-line); }
.cr-chip.is-on { color: #17130a; background: var(--orokin); border-color: var(--orokin); font-weight: 700; }
.cr-chip__n { opacity: 0.6; font-size: 0.86em; }
.cr-chip.is-on .cr-chip__n { opacity: 0.8; }

.fq-group { margin-bottom: 22px; }
.fq-group__title {
  display: flex; align-items: center; gap: 9px; font-family: var(--font-display);
  font-size: 1.2rem; color: var(--gold-ink); margin: 14px 0 12px;
}
.fq-group__icon { color: var(--orokin) !important; }

/* FAQ accordion (mirrors GuideArticle) */
.ga-faq { display: flex; flex-direction: column; gap: 8px; }
.ga-faq__item { background: rgba(0, 0, 0, 0.2); border: 1px solid var(--line); }
.ga-faq__item[open] { border-color: var(--orokin-line); }
.ga-faq__q {
  cursor: pointer; padding: 14px 18px; font-family: var(--font-hud); font-weight: 600;
  font-size: 1rem; color: var(--gold-ink); list-style: none; position: relative; padding-right: 40px;
}
.ga-faq__q::-webkit-details-marker { display: none; }
.ga-faq__q::after { content: '+'; position: absolute; right: 18px; top: 12px; color: var(--orokin); font-size: 1.3rem; }
.ga-faq__item[open] .ga-faq__q::after { content: '−'; }
.ga-faq__a { padding: 0 18px 16px; color: #cdd2e4; line-height: 1.65; font-size: 0.95rem; }
.ga-faq__a :deep(.ga-inline) { color: var(--gold-ink); text-decoration: none; border-bottom: 1px solid rgba(200, 168, 92, 0.4); }
.ga-faq__a :deep(.ga-inline:hover) { color: #f4e2b4; }
.ga-faq__a :deep(strong) { color: var(--gold-ink); }
.ga-faq__a :deep(code) { font-family: var(--font-hud); background: rgba(53, 214, 208, 0.1); border: 1px solid rgba(53, 214, 208, 0.25); color: var(--energy-hi); padding: 1px 6px; }

.fq-cta { padding: 6px 30px 30px; }
.fq-cta__btn {
  display: inline-flex; font-family: var(--font-hud); font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; font-size: 0.9rem; color: #17130a; background: var(--orokin);
  text-decoration: none; padding: 12px 22px;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.fq-cta__btn:hover { background: var(--gold-ink); }

@media (max-width: 600px) {
  .ga-section, .fq-controls, .fq-cta { padding-left: 18px; padding-right: 18px; }
}
</style>
