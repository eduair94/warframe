<!-- /vaulted-worth — "Vaulted Primes: worth buying now?" Fuses each vaulted
     prime's live plat + 7/30d trend + 30-day price position with Prime
     Resurgence (Varzia) availability into a BUY / WATCH / WAIT / RESURGENCE
     verdict. Resurgence is derived client-side: relics flagged `resurgence`
     from /relics_ev name which Primes are buyable from Varzia right now, so we
     tell buyers to spend Aya instead of plat. Modeled on vault-spikes.vue. -->
<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('vaultedWorth.hero.title', { worth: t('vaultedWorth.hero.titleWorth') })"
          :name-label="t('vaultedWorth.table.item')"
          :columns="[t('vaultedWorth.table.verdict'), t('vaultedWorth.table.price'), '7d', '30d']"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('vaultedWorth.eyebrow') }}</div>
            <i18n-t keypath="vaultedWorth.hero.title" tag="h1" class="an-title">
              <template #worth><span class="accent-b">{{ t('vaultedWorth.hero.titleWorth') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('vaultedWorth.hero.lede') }}</p>
          </div>
          <div v-if="topBuy" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('vaultedWorth.hero.pickLabel') }}</div>
            <div class="an-hero__deal-plat is-up">{{ fmtPlat(priceOf(topBuy)) }}p</div>
            <a class="an-hero__deal-name" :href="mkt(topBuy.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(topBuy, 'hero')">
              {{ localItemName(topBuy) }} →
            </a>
            <div class="an-hero__deal-sub">{{ t('vaultedWorth.hero.pickSub', { d7: fmtSignedPct(topBuy.change7d), d30: fmtSignedPct(topBuy.change30d) }) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ stats.vaulted }}</div>
            <div class="an-stat__lbl">{{ t('vaultedWorth.stats.vaulted') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.buyNow }}</div>
            <div class="an-stat__lbl">{{ t('vaultedWorth.stats.buyNow') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ stats.resurgence }}</div>
            <div class="an-stat__lbl">{{ t('vaultedWorth.stats.resurgence') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num" :class="stats.avg30 >= 0 ? 'is-good' : 'is-bad'">{{ fmtSignedPct(stats.avg30) }}</div>
            <div class="an-stat__lbl">{{ t('vaultedWorth.stats.avg30') }}</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('vaultedWorth.filters.search')" class="an-search"></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">{{ t('vaultedWorth.filters.verdict') }}</div>
              <v-chip-group v-model="verdictFilter" mandatory class="an-cats" @update:model-value="onVerdictChange">
                <v-chip v-for="vk in verdictFilters" :key="vk" :value="vk" size="small" active-class="an-chip--on">{{ t('vaultedWorth.verdictFilters.' + vk) }}</v-chip>
              </v-chip-group>
            </div>
          </div>
          <v-chip-group v-model="category" mandatory column class="an-cats" @update:model-value="onCategoryChange">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ t('vaultedWorth.categories.' + c) }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ t('vaultedWorth.filters.count', { n: filtered.length }, filtered.length) }}</div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          {{ t('vaultedWorth.loadError') }}
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          {{ t('vaultedWorth.empty') }}
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('vaultedWorth.table.item') }}</th>
                <th>{{ t('vaultedWorth.table.verdict') }}</th>
                <th>{{ t('vaultedWorth.table.price') }}</th>
                <th>7d</th>
                <th>30d</th>
                <th>{{ t('vaultedWorth.table.pos') }}</th>
                <th>{{ t('vaultedWorth.table.vol') }}</th>
                <th>{{ t('vaultedWorth.table.history') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topBuyUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'row', i)">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
                    <span>
                      {{ localItemName(row) }}
                      <small class="an-sub vw-reason">{{ t('vaultedWorth.reason.' + row._verdict) }}</small>
                    </span>
                  </a>
                </td>
                <td><span class="pill" :class="'pill--' + verdictTone(row._verdict)">{{ t('vaultedWorth.verdict.' + row._verdict) }}</span></td>
                <td class="an-num an-strong">{{ fmtPlat(priceOf(row)) }}p</td>
                <td class="an-num an-strong" :class="changeClass(row.change7d)">{{ fmtSignedPct(row.change7d) }}</td>
                <td class="an-num an-strong" :class="changeClass(row.change30d)">{{ fmtSignedPct(row.change30d) }}</td>
                <td class="an-num">{{ posLabel(row) }}</td>
                <td class="an-num">{{ fmtPlat(row.volume) }}</td>
                <td><span class="an-spark" v-html="sparkSvg(row.spark, row.change30d)"></span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="(row, i) in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topBuyUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'mobile_card', i)">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ localItemName(row) }}</div>
                <small class="an-sub">{{ t('vaultedWorth.card.sub', { price: fmtPlat(priceOf(row)), vol: fmtPlat(row.volume) }) }}</small>
              </div>
              <span class="pill" :class="'pill--' + verdictTone(row._verdict)">{{ t('vaultedWorth.verdict.' + row._verdict) }}</span>
            </div>
            <p class="vw-reason vw-reason--card">{{ t('vaultedWorth.reason.' + row._verdict) }}</p>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">7d</div>
                <div class="an-block__row"><b :class="changeClass(row.change7d)">{{ fmtSignedPct(row.change7d) }}</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">30d</div>
                <div class="an-block__row"><b :class="changeClass(row.change30d)">{{ fmtSignedPct(row.change30d) }}</b></div>
              </div>
              <div class="an-block an-block--full">
                <span class="an-spark an-spark--wide" v-html="sparkSvg(row.spark, row.change30d)"></span>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        {{ t('vaultedWorth.disclaimer') }}
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { t } = useI18n()
const base = useApiBase()
const { localItemName } = useLocalizedName()

// Vaulted + live price + trend (the fusion source).
const { data, error } = await useAsyncData('vaulted-worth-analytics', () =>
  $fetch<any>(`${base}/market_analytics`),
)
// Relic EV — used only to derive which Primes are in Prime Resurgence (Varzia) now.
const { data: relicData } = await useAsyncData('vaulted-worth-relics-ev', () =>
  $fetch<any>(`${base}/relics_ev`).catch(() => null),
)

const loadError = computed(() => !!error.value)
const items = computed<any[]>(() => (data.value && data.value.items) || [])

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const search = ref('')
const category = ref('All')
const verdictFilter = ref('buy')
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

const verdictFilters = ['buy', 'resurgence', 'watch', 'wait', 'all'] as const

// ── Prime Resurgence derivation ──────────────────────────────────────────
// A relic flagged `resurgence` is bought from Varzia with Aya, so every Prime
// part inside it is currently obtainable without trading. Collect the parent
// Prime name ("Ash Prime Chassis Blueprint" → "Ash Prime") of every reward in a
// resurgence relic; a market item is "in resurgence" if its parent Prime is in
// that set (covers both the set and its individual parts).
function primeOf(name: string): string | null {
  const m = String(name || '').match(/^(.+?\bPrime)\b/i)
  return m ? m[1] : null
}
const resurgencePrimes = computed(() => {
  const set = new Set<string>()
  const raw = relicData.value
  const rows: any[] = Array.isArray(raw) ? raw : (raw && raw.relics) || []
  for (const relic of rows) {
    if (!relic || relic.resurgence !== true) continue
    for (const rw of relic.rewards || []) {
      const p = primeOf(rw && rw.item_name)
      if (p) set.add(p.toLowerCase())
    }
  }
  return set
})
function isResurgence(r: any): boolean {
  const p = primeOf(r.item_name)
  return !!p && resurgencePrimes.value.has(p.toLowerCase())
}

// ── helpers (self-contained, mirrors vault-spikes.vue) ───────────────────
function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function mkt(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function num(v: any, d = 0): number {
  return v === null || v === undefined || Number.isNaN(Number(v)) ? d : Number(v)
}
function priceOf(row: any): number {
  return Number(row.avg_price) > 0 ? row.avg_price : row.sell
}
function categoryOf(tags: string[] = []): string {
  const tg = (tags || []).map((x) => (x || '').toLowerCase())
  if (tg.includes('warframe')) return 'Warframe'
  if (tg.includes('primary')) return 'Primary'
  if (tg.includes('secondary')) return 'Secondary'
  if (tg.includes('melee')) return 'Melee'
  if (tg.includes('sentinel')) return 'Sentinel'
  if (tg.includes('companion') || tg.includes('pet')) return 'Companion'
  if (tg.includes('arcane_enhancement') || tg.includes('arcane')) return 'Arcane'
  return 'Other'
}
// Position of the current price within its 30-day range (0 = at the low, 1 = at
// the high). Null when history is too short to judge.
function pricePos(row: any): number | null {
  const pts = (row.spark || []).filter((n: any) => typeof n === 'number')
  if (pts.length < 3) return null
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  if (max <= min) return 0.5
  return Math.min(1, Math.max(0, (priceOf(row) - min) / (max - min)))
}
function posLabel(row: any): string {
  const p = pricePos(row)
  return p === null ? '—' : `${Math.round(p * 100)}%`
}
function changeClass(v: number): string {
  if (v === null || v === undefined) return 'flat'
  if (v > 0) return 'up'
  if (v < 0) return 'down'
  return 'flat'
}
function sparkSvg(spark: number[], change: number): string {
  const pts = (spark || []).filter((n) => typeof n === 'number')
  if (pts.length < 2) return ''
  const w = 88, h = 24, pad = 2
  const min = Math.min(...pts), max = Math.max(...pts)
  const range = max - min || 1
  const step = (w - pad * 2) / (pts.length - 1)
  const coords = pts
    .map((v, i) => {
      const x = pad + i * step
      const y = pad + (h - pad * 2) * (1 - (v - min) / range)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const color = change > 0 ? '#4caf7d' : change < 0 ? '#e57373' : '#9aa0b4'
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="${coords}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmtSignedPct(n: number): string {
  if (n === null || n === undefined) return '—'
  const v = Number(n) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

// ── Verdict ──────────────────────────────────────────────────────────────
// resurgence → get it from Varzia (skip plat); wait → at its ceiling or falling;
// buy → climbing, liquid, still below the 30d high; watch → flat / thin.
function verdictOf(r: any): string {
  if (isResurgence(r)) return 'resurgence'
  const c7 = num(r.change7d), c30 = num(r.change30d)
  const vol = num(r.volume)
  const p = pricePos(r)
  const rising = c7 > 1 || c30 > 6
  const falling = c7 < -3 || c30 < -8
  const liquid = vol >= 6
  if (p !== null && p >= 0.9 && !falling) return 'wait'
  if (rising && liquid && (p === null || p <= 0.8)) return 'buy'
  if (falling) return 'wait'
  return 'watch'
}
function verdictTone(v: string): string {
  return v === 'buy' ? 'good' : v === 'resurgence' ? 'alt' : v === 'wait' ? 'even' : 'watch'
}
const VERDICT_RANK: Record<string, number> = { buy: 4, resurgence: 3, watch: 2, wait: 1 }

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of items.value) if (r.vaulted) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

// Vaulted items decorated with their verdict.
const decorated = computed<any[]>(() =>
  items.value
    .filter((r) => r.vaulted && r.market !== null && priceOf(r) > 0)
    .map((r) => ({ ...r, _verdict: verdictOf(r) })),
)

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  let list = decorated.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q) && !localItemName(r).toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if (verdictFilter.value !== 'all' && r._verdict !== verdictFilter.value) return false
    return true
  })
  return list.slice().sort((a, b) => {
    const vr = (VERDICT_RANK[b._verdict] || 0) - (VERDICT_RANK[a._verdict] || 0)
    if (vr) return vr
    return num(b.change30d, -Infinity) - num(a.change30d, -Infinity)
  })
})

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): sourced from `decorated` (every priced vaulted prime, verdict-ranked),
// NOT `filtered` — the live table defaults `verdictFilter` to 'buy', which can
// legitimately be a near-empty bucket depending on current market conditions,
// and a thin/empty crawlable snapshot defeats the point. `items` (and so
// `decorated`) comes from useAsyncData, populated during SSR.
const fallbackRows = computed(() =>
  decorated.value
    .slice()
    .sort((a, b) => {
      const vr = (VERDICT_RANK[b._verdict] || 0) - (VERDICT_RANK[a._verdict] || 0)
      if (vr) return vr
      return num(b.change30d, -Infinity) - num(a.change30d, -Infinity)
    })
    .slice(0, 40)
    .map((row) => ({
    key: row.url_name,
    href: row.item_name && row.item_name.includes(' Set') ? '/set/' + row.url_name : mkt(row.url_name),
    name: row.item_name,
    cells: [
      t('vaultedWorth.verdict.' + row._verdict),
      `${fmtPlat(priceOf(row))}p`,
      fmtSignedPct(row.change7d),
      fmtSignedPct(row.change30d),
    ],
  })),
)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))
const topBuy = computed<any>(() => decorated.value.filter((r) => r._verdict === 'buy').sort((a, b) => num(b.change30d) - num(a.change30d))[0] || null)
const topBuyUrl = computed(() => (topBuy.value ? topBuy.value.url_name : ''))

const stats = computed(() => {
  const vault = decorated.value
  const changes = vault.map((r) => num(r.change30d, NaN)).filter((v) => !Number.isNaN(v))
  return {
    vaulted: vault.length,
    buyNow: vault.filter((r) => r._verdict === 'buy').length,
    resurgence: vault.filter((r) => r._verdict === 'resurgence').length,
    avg30: changes.length ? changes.reduce((s, v) => s + v, 0) / changes.length : 0,
  }
})

watch([filtered], () => {
  page.value = 1
})

// ── Analytics ───────────────────────────────────────────────────────────────
// Same schema as the other ledger pages (ducats / screener / vaulted) so the
// four are comparable in GA4. Nothing is emitted from a computed: the verdict
// list recomputes whenever the analytics payload refreshes, so every hook below
// hangs off an explicit user interaction or a debounced watch of a raw ref.
const { trackSearch, trackFilter, trackAction, trackMarketOpen } = useAnalytics()

const TRACK_DEBOUNCE = 700
let searchTimer: ReturnType<typeof setTimeout> | null = null
let pageTimer: ReturnType<typeof setTimeout> | null = null

// One event per typed query, never one per keystroke.
watch(search, (term) => {
  if (searchTimer) clearTimeout(searchTimer)
  const q = (term || '').toString().trim()
  if (!q) return
  searchTimer = setTimeout(() => trackSearch(q, filtered.value.length), TRACK_DEBOUNCE)
})

function onCategoryChange(v: any) {
  trackFilter('category', String(v))
}
// The verdict chips are this page's primary lens (buy / resurgence / …), so
// they go through the same `filter_apply` event as every other list filter.
function onVerdictChange(v: any) {
  trackFilter('verdict', String(v))
}
// Clicking through a long ledger fires one event per page; only the page the
// user settles on is worth reporting.
function onPageChange(p: any) {
  if (pageTimer) clearTimeout(pageTimer)
  pageTimer = setTimeout(() => trackAction('page_change', { page: Number(p) || 1 }), 500)
}
// `position` is the row's absolute rank in the current result set, so GA4 can
// tell a top-of-list click from a page-4 click. `verdict` rides along because
// it is the reason the row was surfaced at all. item_name (English) is the
// canonical key — the localized label would explode cardinality.
function onMarketOpen(row: any, source: string, index?: number) {
  trackMarketOpen(row.item_name, {
    source,
    verdict: row._verdict,
    position: index === undefined ? undefined : (page.value - 1) * perPage + index + 1,
  })
}

onBeforeUnmount(() => {
  // A pending timer would otherwise fire after the route changed and be
  // attributed to the next page's `tool`.
  if (searchTimer) clearTimeout(searchTimer)
  if (pageTimer) clearTimeout(pageTimer)
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
.an-refine { flex: 0 0 auto; }
.an-refine__lbl { font-size: 0.72rem; color: #9aa0b4; margin-bottom: 4px; }
.an-hero__deal-plat.is-up { color: #4caf7d; }
.an-stat__num.is-bad { color: #e57373; }
.an-spark { display: inline-flex; align-items: center; vertical-align: middle; }
.an-spark--wide :deep(svg) { width: 100%; height: 34px; }
.vw-reason { display: block; color: #9aa0b4; font-size: 0.74rem; line-height: 1.35; margin-top: 2px; }
.vw-reason--card { margin: 2px 0 8px; font-size: 0.82rem; }

/* Verdict pills (reuse the shared .pill vocabulary; add a "watch" gold tone) */
.pill {
  display: inline-block; font-family: 'Rajdhani', sans-serif; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.68rem;
  padding: 3px 9px; white-space: nowrap;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.pill--good { background: rgba(76, 175, 125, 0.18); color: #6fe0a2; border: 1px solid rgba(76, 175, 125, 0.5); }
.pill--alt { background: rgba(53, 214, 208, 0.16); color: #35d6d0; border: 1px solid rgba(53, 214, 208, 0.45); }
.pill--watch { background: rgba(200, 168, 92, 0.16); color: #e7cf95; border: 1px solid rgba(200, 168, 92, 0.45); }
.pill--even { background: rgba(255, 255, 255, 0.07); color: #b6bcd0; border: 1px solid rgba(255, 255, 255, 0.16); }
</style>
