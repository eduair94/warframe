<!-- Renders a Guide content object (app/app/data/guides/*.ts) in the Orokin
     "Void Ledger" design system. One component = every guide looks the same and
     the look changes in one place. Emits FAQPage + Article JSON-LD for the
     structured-data / AI-search win that makes these pages answer questions
     directly in Google and assistants. -->
<template>
  <div class="an ga">
    <article class="an-console">
      <!-- ── Hero ─────────────────────────────────────────────────────── -->
      <header class="an-hero ga-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ guide.eyebrow }}</div>
          <h1 class="an-title ga-title">{{ guide.title }}</h1>
          <p class="an-lede">{{ guide.lede }}</p>
          <div class="ga-meta">
            <NuxtLink :to="localePath('/guides')" class="ga-crumb">← {{ hubLabel }}</NuxtLink>
            <span v-if="guide.readMins" class="ga-meta__i">{{ guide.readMins }} {{ minRead }}</span>
            <span v-if="guide.updated" class="ga-meta__i">{{ updatedLabel }} {{ prettyDate(guide.updated) }}</span>
          </div>
        </div>
      </header>

      <!-- ── Live proof strip ─────────────────────────────────────────── -->
      <div v-if="guide.stats?.length" class="an-stats ga-stats">
        <div v-for="(s, i) in guide.stats" :key="i" class="an-stat">
          <div class="an-stat__num" :class="toneClass(s.tone)">{{ s.num }}</div>
          <div class="an-stat__lbl">{{ s.label }}</div>
        </div>
      </div>

      <!-- ── Table of contents ────────────────────────────────────────── -->
      <nav v-if="toc.length > 2" class="ga-toc" :aria-label="onThisPage">
        <div class="ga-toc__title">{{ onThisPage }}</div>
        <ol class="ga-toc__list">
          <li v-for="s in toc" :key="s.id">
            <a :href="`#${s.id}`" @click.prevent="scrollTo(s.id)">{{ s.title }}</a>
          </li>
        </ol>
      </nav>

      <!-- ── Sections ─────────────────────────────────────────────────── -->
      <section v-for="sec in guide.sections" :id="sec.id" :key="sec.id" class="ga-section">
        <h2 class="ga-section__title">{{ sec.title }}</h2>
        <template v-for="(b, bi) in sec.blocks" :key="bi">
          <p v-if="b.type === 'p'" class="ga-p" v-html="rich(b.text)" />

          <ul v-else-if="b.type === 'list' && !b.ordered" class="ga-ul">
            <li v-for="(it, i) in b.items" :key="i" v-html="rich(it)" />
          </ul>
          <ol v-else-if="b.type === 'list' && b.ordered" class="ga-ol">
            <li v-for="(it, i) in b.items" :key="i" v-html="rich(it)" />
          </ol>

          <ol v-else-if="b.type === 'steps'" class="ga-steps">
            <li v-for="(st, i) in b.steps" :key="i">
              <div class="ga-step__h">{{ st.h }}</div>
              <p v-html="rich(st.p)" />
            </li>
          </ol>

          <div v-else-if="b.type === 'tip'" class="ga-call ga-call--tip">
            <span class="ga-call__tag">TIP</span><span><strong v-if="b.title">{{ b.title }} — </strong><span v-html="rich(b.text)" /></span>
          </div>
          <div v-else-if="b.type === 'warn'" class="ga-call ga-call--warn">
            <span class="ga-call__tag">⚠ HEADS UP</span><span><strong v-if="b.title">{{ b.title }} — </strong><span v-html="rich(b.text)" /></span>
          </div>
          <div v-else-if="b.type === 'info'" class="ga-call ga-call--info">
            <span class="ga-call__tag">NOTE</span><span><strong v-if="b.title">{{ b.title }} — </strong><span v-html="rich(b.text)" /></span>
          </div>

          <blockquote v-else-if="b.type === 'quote'" class="ga-quote">
            <span v-html="rich(b.text)" />
            <cite v-if="b.cite">— {{ b.cite }}</cite>
          </blockquote>

          <div v-else-if="b.type === 'kv'" class="ga-kv">
            <div v-for="(row, i) in b.kv" :key="i" class="ga-kv__row">
              <div class="ga-kv__k">{{ row.k }}</div>
              <div class="ga-kv__v" v-html="rich(row.v)" />
            </div>
          </div>

          <div v-else-if="b.type === 'table'" class="an-tablewrap ga-tablewrap">
            <table class="an-table ga-table is-cards">
              <thead>
                <tr><th v-for="(c, i) in b.table.columns" :key="i">{{ c }}</th></tr>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in b.table.rows" :key="ri">
                  <td v-for="(cell, ci) in row" :key="ci" :class="{ 'col-name': ci === 0 }" :data-label="b.table.columns[ci]" v-html="rich(String(cell))" />
                </tr>
              </tbody>
            </table>
            <p v-if="b.table.note" class="ga-note">{{ b.table.note }}</p>
          </div>

          <div v-else-if="b.type === 'video'" class="ga-video">
            <YouTubeEmbed :id="b.video.id" :title="b.video.title" :channel="b.video.channel" />
          </div>

          <div v-else-if="b.type === 'links'" class="ga-links">
            <div v-if="b.title" class="ga-links__title">{{ b.title }}</div>
            <div class="ga-linkgrid">
              <component
                :is="l.to ? 'NuxtLink' : 'a'"
                v-for="(l, i) in b.links"
                :key="i"
                :to="l.to ? localePath(l.to) : undefined"
                :href="l.href || undefined"
                :target="l.href ? '_blank' : undefined"
                :rel="l.href ? 'noopener' : undefined"
                class="ga-linkcard"
              >
                <v-icon v-if="l.icon" class="ga-linkcard__icon">{{ 'mdi-' + l.icon }}</v-icon>
                <span class="ga-linkcard__body">
                  <span class="ga-linkcard__label">{{ l.label }}</span>
                  <span v-if="l.note" class="ga-linkcard__note">{{ l.note }}</span>
                </span>
                <span class="ga-linkcard__arrow">→</span>
              </component>
            </div>
          </div>
        </template>
      </section>

      <!-- ── Featured creator videos ──────────────────────────────────── -->
      <section v-if="guide.videos?.length" id="videos" class="ga-section">
        <h2 class="ga-section__title">{{ watchLabel }}</h2>
        <p class="ga-note ga-note--lead">{{ watchSub }}</p>
        <div class="ga-videogrid">
          <YouTubeEmbed
            v-for="v in guide.videos"
            :id="v.id"
            :key="v.id"
            :title="v.title"
            :channel="v.channel"
            max="100%"
          />
        </div>
      </section>

      <!-- ── FAQ (also emitted as FAQPage JSON-LD) ────────────────────── -->
      <section v-if="guide.faqs?.length" id="faq" class="ga-section">
        <h2 class="ga-section__title">{{ faqLabel }}</h2>
        <div class="ga-faq">
          <details v-for="(f, i) in guide.faqs" :key="i" class="ga-faq__item">
            <summary class="ga-faq__q">{{ f.q }}</summary>
            <div class="ga-faq__a" v-html="rich(f.a)" />
          </details>
        </div>
      </section>

      <!-- ── Related ──────────────────────────────────────────────────── -->
      <section v-if="guide.related?.length" class="ga-section ga-section--related">
        <h2 class="ga-section__title">{{ relatedLabel }}</h2>
        <div class="ga-linkgrid">
          <component
            :is="l.to ? 'NuxtLink' : 'a'"
            v-for="(l, i) in guide.related"
            :key="i"
            :to="l.to ? localePath(l.to) : undefined"
            :href="l.href || undefined"
            :target="l.href ? '_blank' : undefined"
            :rel="l.href ? 'noopener' : undefined"
            class="ga-linkcard"
          >
            <v-icon v-if="l.icon" class="ga-linkcard__icon">{{ 'mdi-' + l.icon }}</v-icon>
            <span class="ga-linkcard__body">
              <span class="ga-linkcard__label">{{ l.label }}</span>
              <span v-if="l.note" class="ga-linkcard__note">{{ l.note }}</span>
            </span>
            <span class="ga-linkcard__arrow">→</span>
          </component>
        </div>
      </section>

      <!-- ── Sources ──────────────────────────────────────────────────── -->
      <footer v-if="guide.sources?.length" class="ga-sources">
        <span class="ga-sources__tag">{{ sourcesLabel }}</span>
        <template v-for="(s, i) in guide.sources" :key="i">
          <a :href="s.href" target="_blank" rel="noopener nofollow" class="ga-sources__link">{{ s.label }}</a><span v-if="i < guide.sources.length - 1" class="ga-sources__sep">·</span>
        </template>
      </footer>
    </article>

    <v-alert class="an-disclaimer" type="info" density="compact">{{ disclaimer }}</v-alert>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import type { Guide } from '~/data/guides/types'

const props = defineProps<{ guide: Guide }>()
const { t, locale } = useI18n()
const localePath = useLocalePath()

// i18n chrome (falls back to English via the app's fallbackLocale)
const hubLabel = computed(() => t('guidesChrome.backToHub'))
const onThisPage = computed(() => t('guidesChrome.onThisPage'))
const minRead = computed(() => t('guidesChrome.minRead'))
const updatedLabel = computed(() => t('guidesChrome.updated'))
const watchLabel = computed(() => t('guidesChrome.watch'))
const watchSub = computed(() => t('guidesChrome.watchSub'))
const faqLabel = computed(() => t('guidesChrome.faq'))
const relatedLabel = computed(() => t('guidesChrome.related'))
const sourcesLabel = computed(() => t('guidesChrome.sources'))
const disclaimer = computed(() => t('guidesChrome.disclaimer'))

const toc = computed(() => props.guide.sections.map((s) => ({ id: s.id, title: s.title })))

function toneClass(tone?: string) {
  return tone === 'good' ? 'is-good' : tone === 'alt' ? 'is-alt' : tone === 'gold' ? 'is-gold' : ''
}

// Shared safe inline renderer (utils/richText.ts, auto-imported).
const rich = renderRich

function prettyDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-US' : locale.value, { year: 'numeric', month: 'short' })
  } catch { return iso }
}

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    history.replaceState(null, '', `#${id}`)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ── Structured data: FAQPage + Article. Huge for the "answer questions"
// goal — makes answers eligible for rich results & AI citations. ──
const jsonLd = computed(() => {
  const graph: any[] = []
  if (props.guide.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: props.guide.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: stripRich(f.a) },
      })),
    })
  }
  graph.push({
    '@type': 'Article',
    headline: props.guide.title,
    description: props.guide.lede,
    ...(props.guide.updated ? { dateModified: props.guide.updated } : {}),
    articleSection: props.guide.category,
    inLanguage: locale.value,
  })
  return { '@context': 'https://schema.org', '@graph': graph }
})

useHead({
  script: [{ type: 'application/ld+json', innerHTML: computed(() => JSON.stringify(jsonLd.value)) }],
})

// Project rule: hide the global spinner once mounted (bounded retry).
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
.ga-inline,
.ga :deep(.ga-inline) {
  color: var(--gold-ink);
  text-decoration: none;
  border-bottom: 1px solid rgba(200, 168, 92, 0.4);
}
.ga :deep(.ga-inline:hover) { color: #f4e2b4; }
.ga :deep(code) {
  font-family: var(--font-hud);
  background: rgba(53, 214, 208, 0.1);
  border: 1px solid rgba(53, 214, 208, 0.25);
  color: var(--energy-hi);
  padding: 1px 6px;
  font-size: 0.9em;
}
.ga :deep(strong) { color: var(--gold-ink); font-weight: 700; }

/* ── Hero meta row ──────────────────────────────────────────────────── */
.ga-hero { padding-bottom: 18px; }
.ga-title { max-width: 22ch; }
.ga-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 16px;
  font-family: var(--font-hud); font-size: 0.8rem; letter-spacing: 0.03em; color: var(--ink-dim);
}
.ga-crumb {
  color: var(--energy); text-decoration: none; text-transform: uppercase;
  letter-spacing: 0.08em; font-weight: 600;
}
.ga-crumb:hover { color: var(--energy-hi); }
.ga-meta__i { position: relative; padding-left: 14px; }
.ga-meta__i::before {
  content: ''; position: absolute; left: 0; top: 6px; width: 5px; height: 5px;
  background: var(--orokin); transform: rotate(45deg);
}

/* ── TOC ────────────────────────────────────────────────────────────── */
.ga-toc {
  margin: 20px 30px 6px; padding: 16px 20px;
  background: rgba(0, 0, 0, 0.22); border: 1px solid var(--orokin-line);
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
}
.ga-toc__title {
  font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.16em;
  font-size: 0.7rem; color: var(--orokin); margin-bottom: 10px;
}
.ga-toc__list {
  columns: 2; column-gap: 28px; list-style: none; padding: 0; margin: 0;
  counter-reset: toc;
}
.ga-toc__list li { counter-increment: toc; break-inside: avoid; margin-bottom: 7px; }
.ga-toc__list a {
  color: #cdd2e4; text-decoration: none; font-size: 0.92rem; line-height: 1.4;
  display: flex; gap: 8px;
}
.ga-toc__list a::before {
  content: counter(toc, decimal-leading-zero); color: var(--orokin);
  font-family: var(--font-hud); font-size: 0.78rem; opacity: 0.8;
}
.ga-toc__list a:hover { color: var(--gold-ink); }
@media (max-width: 620px) { .ga-toc__list { columns: 1; } }

/* ── Sections ───────────────────────────────────────────────────────── */
.ga-section { padding: 10px 30px 8px; border-top: 1px solid rgba(255, 255, 255, 0.05); scroll-margin-top: 84px; }
.ga-section__title {
  font-family: var(--font-display); font-size: 1.42rem; color: var(--gold-ink);
  margin: 24px 0 14px; letter-spacing: 0.01em; line-height: 1.2;
}
.ga-p { color: #cdd2e4; line-height: 1.72; font-size: 0.99rem; margin: 0 0 15px; max-width: 76ch; }

.ga-ul, .ga-ol { margin: 0 0 16px; padding-left: 4px; max-width: 76ch; list-style: none; }
.ga-ul li, .ga-ol li {
  position: relative; padding-left: 24px; margin-bottom: 9px;
  color: #cdd2e4; line-height: 1.6; font-size: 0.96rem;
}
.ga-ul li::before {
  content: ''; position: absolute; left: 4px; top: 9px; width: 7px; height: 7px;
  background: var(--orokin); transform: rotate(45deg);
}
.ga-ol { counter-reset: gaol; }
.ga-ol li { counter-increment: gaol; }
.ga-ol li::before {
  content: counter(gaol); position: absolute; left: 0; top: 1px;
  color: var(--orokin); font-family: var(--font-hud); font-weight: 700; font-size: 0.9rem;
}

/* ── Steps ──────────────────────────────────────────────────────────── */
.ga-steps { list-style: none; counter-reset: gs; padding: 0; margin: 4px 0 18px; display: flex; flex-direction: column; gap: 16px; }
.ga-steps li { counter-increment: gs; position: relative; padding: 2px 0 0 56px; min-height: 42px; }
.ga-steps li::before {
  content: counter(gs); position: absolute; left: 0; top: 0; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-hud); font-weight: 700; font-size: 1.15rem; color: #17130a;
  background: var(--orokin);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
}
.ga-step__h { font-family: var(--font-hud); font-weight: 700; letter-spacing: 0.03em; color: var(--gold-ink); font-size: 1.02rem; margin-bottom: 3px; padding-top: 7px; }
.ga-steps p { color: #cdd2e4; line-height: 1.62; font-size: 0.95rem; margin: 0; max-width: 72ch; }

/* ── Callouts ───────────────────────────────────────────────────────── */
.ga-call {
  display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap;
  margin: 4px 0 18px; padding: 13px 18px; line-height: 1.6; font-size: 0.95rem;
  clip-path: polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px);
}
.ga-call__tag { font-family: var(--font-hud); font-weight: 700; letter-spacing: 0.1em; font-size: 0.68rem; white-space: nowrap; }
.ga-call--tip { background: rgba(53, 214, 208, 0.08); border: 1px solid rgba(53, 214, 208, 0.3); color: #d7e6ea; }
.ga-call--tip .ga-call__tag { color: var(--energy); }
.ga-call--warn { background: rgba(217, 138, 138, 0.1); border: 1px solid rgba(217, 138, 138, 0.4); color: #f0dada; }
.ga-call--warn .ga-call__tag { color: var(--rose); }
.ga-call--info { background: rgba(200, 168, 92, 0.09); border: 1px solid var(--orokin-line); color: #ece4d0; }
.ga-call--info .ga-call__tag { color: var(--orokin); }

/* ── Quote ──────────────────────────────────────────────────────────── */
.ga-quote {
  margin: 4px 0 18px; padding: 12px 20px; border-left: 3px solid var(--orokin);
  background: rgba(0, 0, 0, 0.2); color: #d5d9e8; font-style: italic; line-height: 1.6;
}
.ga-quote cite { display: block; margin-top: 6px; color: var(--ink-dim); font-size: 0.82rem; font-style: normal; font-family: var(--font-hud); }

/* ── Key/value facts ────────────────────────────────────────────────── */
.ga-kv { margin: 4px 0 18px; border: 1px solid var(--line); }
.ga-kv__row { display: flex; gap: 0; border-bottom: 1px solid var(--line); }
.ga-kv__row:last-child { border-bottom: 0; }
.ga-kv__k { flex: 0 0 40%; max-width: 260px; padding: 10px 16px; background: rgba(200, 168, 92, 0.06); font-family: var(--font-hud); font-weight: 600; letter-spacing: 0.02em; color: var(--gold-ink); font-size: 0.9rem; }
.ga-kv__v { flex: 1; padding: 10px 16px; color: #cdd2e4; font-size: 0.94rem; line-height: 1.55; }

/* ── Tables (reuse .an-table) ───────────────────────────────────────── */
.ga-tablewrap { margin: 4px 0 8px; }
.ga-note { color: var(--ink-dim); font-family: var(--font-hud); font-size: 0.82rem; letter-spacing: 0.02em; margin: 8px 0 16px; max-width: 76ch; }
.ga-note--lead { margin-top: -4px; margin-bottom: 16px; }

/* ── Video ──────────────────────────────────────────────────────────── */
.ga-video { margin: 6px 0 20px; }
.ga-videogrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-bottom: 14px; }

/* ── Link cards ─────────────────────────────────────────────────────── */
.ga-links { margin: 6px 0 18px; }
.ga-links__title { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.72rem; color: var(--orokin); margin-bottom: 10px; }
.ga-linkgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
.ga-linkcard {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; text-decoration: none;
  background: linear-gradient(160deg, rgba(200, 168, 92, 0.07), rgba(0, 0, 0, 0.2));
  border: 1px solid var(--orokin-line);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.ga-linkcard:hover { border-color: var(--orokin); transform: translateY(-2px); }
.ga-linkcard__icon { color: var(--orokin) !important; font-size: 26px !important; flex: 0 0 auto; }
.ga-linkcard__body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.ga-linkcard__label { font-family: var(--font-hud); font-weight: 700; color: var(--ink); font-size: 0.98rem; letter-spacing: 0.02em; }
.ga-linkcard__note { color: var(--ink-dim); font-size: 0.8rem; line-height: 1.35; }
.ga-linkcard__arrow { color: var(--orokin); font-family: var(--font-hud); font-size: 1.1rem; flex: 0 0 auto; }

/* ── FAQ ────────────────────────────────────────────────────────────── */
.ga-faq { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
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

/* ── Sources ────────────────────────────────────────────────────────── */
.ga-section--related { padding-bottom: 20px; }
.ga-sources { padding: 18px 30px 26px; border-top: 1px solid rgba(255, 255, 255, 0.05); display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
.ga-sources__tag { font-family: var(--font-hud); text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.68rem; color: var(--ink-dim); }
.ga-sources__link { color: var(--orokin); text-decoration: none; font-size: 0.86rem; }
.ga-sources__link:hover { color: var(--gold-ink); }
.ga-sources__sep { color: var(--ink-dim); }

@media (max-width: 600px) {
  .ga-section, .ga-sources { padding-left: 18px; padding-right: 18px; }
  .ga-toc { margin-left: 18px; margin-right: 18px; }
  .ga-kv__row { flex-direction: column; }
  .ga-kv__k { max-width: none; flex-basis: auto; }
}
</style>
