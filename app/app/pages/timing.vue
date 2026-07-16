<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('timing.eyebrow') }}</div>
            <i18n-t keypath="timing.hero.title" tag="h1" class="an-title">
              <template #low><span class="accent-a">{{ t('timing.hero.low') }}</span></template>
              <template #high><span class="accent-b">{{ t('timing.hero.high') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('timing.hero.lede') }}</p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('timing.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(priceOf(topDeal)) }}<span>p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">
              {{ topDeal.item_name }} →
            </a>
            <div class="an-hero__deal-sub">+{{ topDeal.pctFromAtl.toFixed(0) }}% {{ t('timing.hero.dealSub', { days: topDeal.dataDays }) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.withSignal }}</div>
            <div class="an-stat__lbl">{{ t('timing.stats.withSignal') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.buy }}</div>
            <div class="an-stat__lbl">{{ t('timing.stats.buy') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ stats.sell }}</div>
            <div class="an-stat__lbl">{{ t('timing.stats.sell') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ meta.maxHistoryDays }}</div>
            <div class="an-stat__lbl">{{ t('timing.stats.history') }}</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('timing.filters.search')" class="an-search"></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">{{ t('timing.filters.signal') }}</div>
              <v-btn-toggle v-model="mode" mandatory density="compact">
                <v-btn value="all" size="small">{{ t('timing.mode.all') }}</v-btn>
                <v-btn value="buy" size="small">{{ t('timing.mode.buy') }}</v-btn>
                <v-btn value="sell" size="small">{{ t('timing.mode.sell') }}</v-btn>
              </v-btn-toggle>
            </div>
          </div>
          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ t('timing.categories.' + c) }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ t('timing.filters.count', { n: filtered.length }, filtered.length) }}</div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          {{ t('timing.loadError') }}
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          {{ emptyMessage }}
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('timing.table.item') }}</th>
                <th>{{ t('timing.table.price') }}</th>
                <th>{{ t('timing.table.vsLow') }}</th>
                <th>{{ t('timing.table.vsHigh') }}</th>
                <th>{{ t('timing.table.signal') }}</th>
                <th>{{ t('timing.table.trend') }}</th>
                <th>{{ t('timing.table.history') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.item_name }}
                      <span v-if="row.vaulted" class="an-badge">{{ t('timing.row.vaulted') }}</span>
                      <small class="an-sub">{{ t('timing.row.history', { days: row.dataDays }) }}</small>
                    </span>
                  </a>
                </td>
                <td class="an-num an-strong">{{ fmtPlat(priceOf(row)) }}p</td>
                <td class="an-num an-strong" :class="vsLowClass(row)">+{{ row.pctFromAtl.toFixed(0) }}%</td>
                <td class="an-num" :class="vsHighClass(row)">{{ row.pctFromAth.toFixed(0) }}%</td>
                <td>
                  <span class="pill" :class="signal(row).cls">
                    {{ t('timing.signal.' + signal(row).key + '.label') }}
                    <b>{{ t('timing.signal.' + signal(row).key + '.note') }}</b>
                  </span>
                </td>
                <td class="an-num"><span :class="trendClass(row.trend)">{{ trendArrow(row.trend) }}</span></td>
                <td><span class="an-spark" v-html="sparkSvg(row.spark, row.change7d)"></span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="row in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ row.item_name }}<span v-if="row.vaulted" class="an-badge">{{ t('timing.row.vaulted') }}</span></div>
                <small class="an-sub">{{ fmtPlat(priceOf(row)) }}p · {{ t('timing.row.history', { days: row.dataDays }) }}</small>
              </div>
            </div>
            <div class="an-card__verdict">
              <span class="pill" :class="signal(row).cls">
                {{ t('timing.signal.' + signal(row).key + '.label') }}
                <b>{{ t('timing.signal.' + signal(row).key + '.note') }}</b>
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('timing.card.priceBands') }}</div>
                <div class="an-block__row"><span>{{ t('timing.card.vsLow') }}</span><b :class="vsLowClass(row)">+{{ row.pctFromAtl.toFixed(0) }}%</b></div>
                <div class="an-block__row"><span>{{ t('timing.card.vsHigh') }}</span><b :class="vsHighClass(row)">{{ row.pctFromAth.toFixed(0) }}%</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('timing.card.historyDays', { days: row.dataDays }) }}</div>
                <span class="an-spark an-spark--wide" v-html="sparkSvg(row.spark, row.change7d)"></span>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer" type="info" color="blue-darken-4" density="compact">
        {{ t('timing.disclaimer') }}
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { t } = useI18n()
const base = useApiBase()

const { data, error } = await useAsyncData('timing-analytics', () => $fetch<any>(`${base}/market_analytics`))

const loadError = computed(() => !!error.value)
const items = computed<any[]>(() => (data.value && data.value.items) || [])
const meta = computed<any>(() => (data.value && data.value.meta) || { count: 0, maxHistoryDays: 0 })

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const search = ref('')
const mode = ref('all')
const category = ref('All')
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

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
function priceOf(row: any): number {
  return Number(row.avg_price) > 0 ? row.avg_price : row.sell
}
function categoryOf(tags: string[] = []): string {
  const t = (tags || []).map((x) => (x || '').toLowerCase())
  if (t.includes('warframe')) return 'Warframe'
  if (t.includes('primary')) return 'Primary'
  if (t.includes('secondary')) return 'Secondary'
  if (t.includes('melee')) return 'Melee'
  if (t.includes('mod')) return 'Mod'
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
  return 'Other'
}
function signalable(row: any): boolean {
  return !!row && row.dataDays >= 7 && row.atl != null && row.ath != null && row.pctFromAtl != null && row.pctFromAth != null
}
// Returns a stable internal `key` (buy/sell/hold) used for filtering + counting;
// the displayed label/note are localized in the template via t('timing.signal.<key>.*').
function signal(row: any): { key: string; cls: string } {
  if (!signalable(row)) return { key: 'hold', cls: 'pill--even' }
  if (row.pctFromAtl <= 5) return { key: 'buy', cls: 'pill--good' }
  if (row.pctFromAth >= -5) return { key: 'sell', cls: 'pill--alt' }
  return { key: 'hold', cls: 'pill--even' }
}
function vsLowClass(row: any): string {
  return row.pctFromAtl != null && row.pctFromAtl <= 5 ? 'up' : 'flat'
}
function vsHighClass(row: any): string {
  return row.pctFromAth != null && row.pctFromAth >= -5 ? 'down' : 'flat'
}
function trendArrow(t: string): string {
  return t === 'up' ? '▲' : t === 'down' ? '▼' : '▬'
}
function trendClass(t: string): string {
  return t === 'up' ? 'up' : t === 'down' ? 'down' : 'flat'
}
function sparkSvg(spark: number[], change: number): string {
  const pts = (spark || []).filter((n) => typeof n === 'number')
  if (pts.length < 2) return ''
  const w = 88
  const h = 24
  const pad = 2
  const min = Math.min(...pts)
  const max = Math.max(...pts)
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

const signalItems = computed<any[]>(() => items.value.filter((r) => signalable(r)))
const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of signalItems.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})
const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  let list = signalItems.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    const key = signal(r).key
    if (mode.value === 'buy' && key !== 'buy') return false
    if (mode.value === 'sell' && key !== 'sell') return false
    return true
  })
  if (mode.value === 'sell') list = list.slice().sort((a, b) => b.pctFromAth - a.pctFromAth)
  else list = list.slice().sort((a, b) => a.pctFromAtl - b.pctFromAtl)
  return list
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of signalItems.value) {
    if (signal(r).key !== 'buy') continue
    if (!(Number(r.volume) > 0)) continue
    if (!best || r.pctFromAtl < best.pctFromAtl) best = r
  }
  return best
})
const topDealUrl = computed(() => (topDeal.value ? topDeal.value.url_name : ''))
const emptyMessage = computed(() => t('timing.empty'))
const stats = computed<any>(() => {
  const sig = signalItems.value
  let buy = 0
  let sell = 0
  for (const r of sig) {
    const key = signal(r).key
    if (key === 'buy') buy++
    else if (key === 'sell') sell++
  }
  return { withSignal: sig.length, buy, sell }
})

watch(filtered, () => {
  page.value = 1
})

// Hide the global loading spinner once mounted (project rule). Bounded retry:
// the #spinner-wrapper element is injected by the (not-yet-wired) LoadingBar
// component; if it never appears we stop after a few ticks instead of looping
// forever (the old Options-API version recursed unbounded).
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onMounted(() => {
  finishLoading()
})
</script>

<style scoped>
.an-refine {
  flex: 0 0 auto;
}
.an-refine__lbl {
  font-size: 0.72rem;
  color: #9aa0b4;
  margin-bottom: 4px;
}
.an-refine :deep(.v-btn-toggle) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.an-refine :deep(.v-btn-toggle .v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) {
  background: rgba(212, 175, 90, 0.9) !important;
  color: #17131f !important;
}
.an-spark {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.an-spark--wide :deep(svg) {
  width: 100%;
  height: 34px;
}
</style>
