<!-- /guides/farming — the Farming hub. A farming-focused front door: a
     "what do you want to farm?" item-type search (curated item -> guide router,
     see data/guides/farmIndex.ts) on top of the farming guide cards.
     Orokin "Void Ledger" look, English copy hardcoded like the guide content. -->
<template>
  <div class="an gh">
    <article class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">Knowledge Center · Farming</div>
          <h1 class="an-title">Warframe Farming Hub</h1>
          <p class="an-lede">
            Tell us what you want to farm — a resource, a currency, prime parts, an arcane — and jump straight to the
            guide that explains the best way to get it. Every farm is re-checked for accuracy on a rolling basis.
          </p>
        </div>
        <div class="an-hero__deal gh-hero-cta">
          <div class="an-hero__deal-label">Most asked</div>
          <NuxtLink class="an-hero__deal-name gh-hero-cta__link" :to="localePath('/guides/credits')">Credit Farming →</NuxtLink>
          <div class="an-hero__deal-sub">Höllvania safes, the Index & Profit-Taker (2026)</div>
        </div>
      </header>

      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ farmingGuides.length }}</div>
          <div class="an-stat__lbl">Farming guides</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ FARM_TARGETS.length }}</div>
          <div class="an-stat__lbl">Farm targets mapped</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">90d</div>
          <div class="an-stat__lbl">Freshness re-check</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num">100%</div>
          <div class="an-stat__lbl">Free, no login</div>
        </div>
      </div>

      <!-- ── What do you want to farm? ─────────────────────────────────── -->
      <section class="gh-section fh-searchsec">
        <div class="gh-section__head">
          <v-icon class="gh-section__icon">mdi-magnify-scan</v-icon>
          <div>
            <h2 class="gh-section__title">What do you want to farm?</h2>
            <p class="gh-section__blurb">Search by item, resource or currency — e.g. “Orokin Cell”, “Kuva”, “prime parts”, “argon”.</p>
          </div>
        </div>

        <div class="gh-search-wrap">
          <div class="fq-search">
            <v-icon class="fq-search__icon">mdi-magnify</v-icon>
            <input
              v-model="query"
              type="search"
              class="fq-search__input"
              placeholder="Type an item, resource or currency…"
              aria-label="Search farm targets by item type"
            />
          </div>
          <div v-if="query" class="fh-chips">
            <button
              v-for="k in activeKinds"
              :key="k"
              class="fh-chip"
              :class="{ 'is-on': kindFilter === k }"
              type="button"
              @click="kindFilter = kindFilter === k ? null : k"
            >
              {{ FARM_KIND_LABEL[k] }}
            </button>
          </div>
        </div>

        <div v-if="results.length" class="fh-grid">
          <NuxtLink v-for="tgt in results" :key="tgt.name" class="an-card fh-card" :to="toRoute(tgt.route)">
            <div class="fh-card__top">
              <v-icon class="fh-card__icon">{{ tgt.icon }}</v-icon>
              <span class="fh-card__kind">{{ FARM_KIND_LABEL[tgt.kind] }}</span>
            </div>
            <h3 class="fh-card__title">{{ tgt.name }}</h3>
            <p class="fh-card__hint">{{ tgt.hint }}</p>
            <div class="fh-card__foot">
              <span class="fh-card__guide">{{ guideTitle(tgt.guide) }}</span>
              <span class="gh-card__arrow">→</span>
            </div>
          </NuxtLink>
        </div>
        <p v-else class="ga-note gh-empty">
          No exact match for “{{ query }}”. Try a broader term, or browse the farming guides below — the resource
          cheat-sheet covers most materials.
        </p>
      </section>

      <!-- ── Farming guides ───────────────────────────────────────────── -->
      <section class="gh-section">
        <div class="gh-section__head">
          <v-icon class="gh-section__icon">mdi-timer-sand</v-icon>
          <div>
            <h2 class="gh-section__title">Farming &amp; resource guides</h2>
            <p class="gh-section__blurb">The full farming shelf — platinum, credits, Endo, Kuva, relics, resources and standing.</p>
          </div>
        </div>
        <div class="gh-grid">
          <NuxtLink
            v-for="g in farmingGuides"
            :key="g.slug"
            class="an-card gh-card"
            :class="{ 'is-top': g.featured }"
            :to="localePath(g.route)"
          >
            <div class="gh-card__top">
              <v-icon class="gh-card__icon">{{ g.icon }}</v-icon>
              <span v-if="g.featured" class="gh-card__badge">Start here</span>
            </div>
            <h3 class="gh-card__title">{{ g.title }}</h3>
            <p class="gh-card__blurb">{{ g.blurb }}</p>
            <div class="gh-card__foot">
              <span class="gh-card__read">{{ g.readMins }} min read</span>
              <span class="gh-card__arrow">→</span>
            </div>
          </NuxtLink>
        </div>
      </section>

      <div class="fh-back">
        <NuxtLink class="fh-back__link" :to="localePath('/guides')">← All Warframe guides</NuxtLink>
      </div>

      <v-alert class="an-disclaimer" type="info" density="compact">
        Farms and drop locations shift with updates — this hub is re-checked regularly. Always cross-check the live
        wiki for exact current numbers.
      </v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted } from 'vue'
import { GUIDES_INDEX } from '~/data/guides/registry'
import { FARM_TARGETS, FARM_KIND_LABEL, searchFarmTargets, type FarmKind } from '~/data/guides/farmIndex'

const localePath = useLocalePath()

const query = ref('')
const kindFilter = ref<FarmKind | null>(null)

const farmingGuides = computed(() => GUIDES_INDEX.filter((g) => g.category === 'farming'))

const baseResults = computed(() => searchFarmTargets(query.value))
const results = computed(() =>
  kindFilter.value ? baseResults.value.filter((t) => t.kind === kindFilter.value) : baseResults.value
)
// Kinds present in the current (pre-kind-filter) result set, for the chip row.
const activeKinds = computed(() => {
  const seen = new Set<FarmKind>()
  for (const t of baseResults.value) seen.add(t.kind)
  return (Object.keys(FARM_KIND_LABEL) as FarmKind[]).filter((k) => seen.has(k))
})

const guideTitleMap = computed(() => {
  const m: Record<string, string> = {}
  for (const g of GUIDES_INDEX) m[g.slug] = g.title
  return m
})
function guideTitle(slug: string): string {
  return guideTitleMap.value[slug] ?? 'Guide'
}

/** Split a "/path#anchor" route into a router location so the hash survives localePath. */
function toRoute(route: string) {
  const i = route.indexOf('#')
  if (i === -1) return localePath(route)
  return localePath({ path: route.slice(0, i), hash: route.slice(i) })
}

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

.gh-search-wrap { padding: 16px 30px 4px; }
.fq-search {
  display: flex; align-items: center; gap: 10px; padding: 0 14px;
  background: rgba(0, 0, 0, 0.3); border: 1px solid var(--orokin-line);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.fq-search__icon { color: var(--orokin) !important; }
.fq-search__input { flex: 1; background: transparent; border: 0; outline: none; color: var(--ink); font-family: var(--font-hud); font-size: 1rem; padding: 13px 0; }
.fq-search__input::placeholder { color: var(--ink-dim); }

.fh-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.fh-chip {
  font-family: var(--font-hud); font-size: 0.76rem; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--ink-dim); background: rgba(0, 0, 0, 0.25); border: 1px solid var(--orokin-line);
  padding: 5px 12px; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.fh-chip:hover { color: var(--ink); border-color: var(--energy); }
.fh-chip.is-on { color: #06201f; background: var(--energy); border-color: var(--energy); }

.gh-section { padding: 8px 30px 10px; border-top: 1px solid rgba(255, 255, 255, 0.05); margin-top: 8px; }
.fh-searchsec { border-top: 0; }
.gh-section__head { display: flex; align-items: center; gap: 14px; margin: 18px 0 6px; }
.gh-section__icon { color: var(--orokin) !important; font-size: 30px !important; }
.gh-section__title { font-family: var(--font-display); font-size: 1.35rem; color: var(--gold-ink); margin: 0; }
.gh-section__blurb { color: var(--ink-dim); font-size: 0.9rem; margin: 2px 0 0; }

.fh-grid, .gh-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; margin-top: 14px; }
.fh-card, .gh-card { display: flex; flex-direction: column; gap: 8px; padding: 16px; text-decoration: none; transition: border-color 0.15s ease, transform 0.15s ease; }
.fh-card:hover, .gh-card:hover { transform: translateY(-2px); }
.fh-card__top, .gh-card__top { display: flex; justify-content: space-between; align-items: center; }
.fh-card__icon, .gh-card__icon { color: var(--orokin) !important; font-size: 28px !important; }
.fh-card__kind {
  font-family: var(--font-hud); font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--orokin); border: 1px solid var(--orokin-line); padding: 2px 8px;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.fh-card__title, .gh-card__title { font-family: var(--font-display); color: var(--ink); font-size: 1.08rem; margin: 0; line-height: 1.25; }
.fh-card__hint, .gh-card__blurb { color: #cdd2e4; font-size: 0.88rem; line-height: 1.5; margin: 0; flex: 1; }
.fh-card__foot, .gh-card__foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; gap: 10px; }
.fh-card__guide { font-family: var(--font-hud); font-size: 0.72rem; letter-spacing: 0.03em; text-transform: uppercase; color: var(--ink-dim); }
.gh-card__read { font-family: var(--font-hud); font-size: 0.76rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-dim); }
.gh-card__arrow { color: var(--orokin); font-family: var(--font-hud); font-size: 1.1rem; }
.gh-card__badge {
  font-family: var(--font-hud); font-size: 0.6rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #06201f; background: var(--energy); padding: 2px 8px;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}

.ga-note { color: var(--ink-dim); font-family: var(--font-hud); font-size: 0.9rem; }
.gh-empty { padding: 16px 30px 20px; }

.fh-back { padding: 14px 30px 4px; }
.fh-back__link { font-family: var(--font-hud); color: var(--orokin); text-decoration: none; font-size: 0.9rem; }
.fh-back__link:hover { color: var(--energy); }

@media (max-width: 600px) {
  .gh-search-wrap, .gh-section, .gh-empty, .fh-back { padding-left: 18px; padding-right: 18px; }
}
</style>
