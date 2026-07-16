<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('vaultSpikes.eyebrow') }}</div>
            <i18n-t keypath="vaultSpikes.hero.title" tag="h1" class="an-title">
              <template #climbing><span class="accent-b">{{ t('vaultSpikes.hero.titleClimbing') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('vaultSpikes.hero.lede') }}</p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('vaultSpikes.hero.dealLabel', { window: timeframeLabel }) }}</div>
            <div class="an-hero__deal-plat" :class="topDeal[changeKey] > 0 ? 'is-up' : 'is-down'">
              {{ fmtSignedPct(topDeal[changeKey]) }}
            </div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">
              {{ topDeal.item_name }} →
            </a>
            <div class="an-hero__deal-sub">{{ t('vaultSpikes.hero.dealSub', { price: fmtPlat(priceOf(topDeal)), vol: fmtPlat(topDeal.volume) }) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ stats.vaultedTracked }}</div>
            <div class="an-stat__lbl">{{ t('vaultSpikes.stats.vaultedTracked') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.climbingNow }}</div>
            <div class="an-stat__lbl">{{ t('vaultSpikes.stats.climbingNow') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtSignedPct(stats.biggestSpike) }}</div>
            <div class="an-stat__lbl">{{ t('vaultSpikes.stats.biggestSpike') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtSignedPct(stats.avgSpike) }}</div>
            <div class="an-stat__lbl">{{ t('vaultSpikes.stats.avgSpike') }}</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('vaultSpikes.filters.search')" class="an-search"></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">{{ t('vaultSpikes.filters.window') }}</div>
              <v-btn-toggle v-model="timeframe" mandatory density="compact">
                <v-btn value="change7d" size="small">7d</v-btn>
                <v-btn value="change30d" size="small">30d</v-btn>
              </v-btn-toggle>
            </div>
            <div class="an-refine">
              <div class="an-refine__lbl">{{ t('vaultSpikes.filters.filter') }}</div>
              <v-switch v-model="onlyClimbing" density="compact" inset hide-details color="#d4af5a" :label="t('vaultSpikes.filters.onlyClimbing')" class="an-switch"></v-switch>
            </div>
          </div>
          <v-chip-group v-model="category" mandatory column class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ t('vaultSpikes.categories.' + c) }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ t('vaultSpikes.filters.count', { n: filtered.length }, filtered.length) }}</div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          {{ t('vaultSpikes.loadError') }}
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          {{ emptyMessage }}
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('vaultSpikes.table.item') }}</th>
                <th>{{ t('vaultSpikes.table.price') }}</th>
                <th>7d</th>
                <th>30d</th>
                <th>{{ t('vaultSpikes.table.vsLow') }}</th>
                <th>{{ t('vaultSpikes.table.vol') }}</th>
                <th>{{ t('vaultSpikes.table.history') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.item_name }}
                      <span class="an-badge">{{ t('vaultSpikes.row.vaulted') }}</span>
                      <small class="an-sub">{{ t('vaultSpikes.row.tracked', { n: row.dataDays }) }}</small>
                    </span>
                  </a>
                </td>
                <td class="an-num an-strong">{{ fmtPlat(priceOf(row)) }}p</td>
                <td class="an-num an-strong" :class="changeClass(row.change7d)">{{ fmtSignedPct(row.change7d) }}</td>
                <td class="an-num an-strong" :class="changeClass(row.change30d)">{{ fmtSignedPct(row.change30d) }}</td>
                <td class="an-num">{{ fromLow(row.pctFromAtl) }}</td>
                <td class="an-num">{{ fmtPlat(row.volume) }}</td>
                <td><span class="an-spark" v-html="sparkSvg(row.spark, row[changeKey])"></span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="row in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ row.item_name }}<span class="an-badge">{{ t('vaultSpikes.row.vaulted') }}</span></div>
                <small class="an-sub">{{ t('vaultSpikes.card.sub', { price: fmtPlat(priceOf(row)), vol: fmtPlat(row.volume) }) }}</small>
              </div>
              <span class="an-num an-strong" :class="changeClass(row[changeKey])">{{ fmtSignedPct(row[changeKey]) }}</span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">7d</div>
                <div class="an-block__row"><span>{{ t('vaultSpikes.card.change') }}</span><b :class="changeClass(row.change7d)">{{ fmtSignedPct(row.change7d) }}</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">30d</div>
                <div class="an-block__row"><span>{{ t('vaultSpikes.card.change') }}</span><b :class="changeClass(row.change30d)">{{ fmtSignedPct(row.change30d) }}</b></div>
              </div>
              <div class="an-block an-block--full">
                <div class="an-block__lbl">{{ t('vaultSpikes.card.spikeTracked', { window: timeframeLabel, days: row.dataDays }) }}</div>
                <span class="an-spark an-spark--wide" v-html="sparkSvg(row.spark, row[changeKey])"></span>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        {{ t('vaultSpikes.disclaimer') }}
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { t } = useI18n()
const base = useApiBase()

const { data, error } = await useAsyncData('vault-spikes-market-analytics', () =>
  $fetch<any>(`${base}/market_analytics`),
)

const loadError = computed(() => !!error.value)
const items = computed<any[]>(() => (data.value && data.value.items) || [])
// meta preserved for parity (unused in template but part of the old asyncData return)
const meta = computed<any>(() => (data.value && data.value.meta) || { count: 0, maxHistoryDays: 0 })

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const search = ref('')
const timeframe = ref<'change7d' | 'change30d'>('change7d')
const onlyClimbing = ref(true)
const category = ref('All')
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

const changeKey = computed(() => timeframe.value)
const timeframeLabel = computed(
  () => ({ change7d: '7d', change30d: '30d' } as any)[timeframe.value] || '7d',
)

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
function fromLow(v: number): string {
  if (v === null || v === undefined) return '—'
  return `+${Number(v).toFixed(0)}%`
}
function changeClass(v: number): string {
  if (v === null || v === undefined) return 'flat'
  if (v > 0) return 'up'
  if (v < 0) return 'down'
  return 'flat'
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
function fmtSignedPct(n: number): string {
  if (n === null || n === undefined) return '—'
  const v = Number(n) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of items.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const key = changeKey.value
  let list = items.value.filter((r) => {
    if (!r.vaulted) return false
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    return true
  })
  if (onlyClimbing.value) list = list.filter((r) => Number(r[key]) > 0)
  const nz = (v: any) => (v === null || v === undefined ? -Infinity : Number(v))
  return list.slice().sort((a, b) => nz(b[key]) - nz(a[key]))
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const topDeal = computed<any>(() => (filtered.value.length ? filtered.value[0] : null))
const topDealUrl = computed(() => (topDeal.value ? topDeal.value.url_name : ''))
const emptyMessage = computed(() => t('vaultSpikes.empty'))
const stats = computed<any>(() => {
  const key = changeKey.value
  const vault = items.value.filter((r) => r.vaulted)
  const changes = vault.map((r) => r[key]).filter((v) => v !== null && v !== undefined).map(Number)
  const positives = changes.filter((v) => v > 0)
  return {
    vaultedTracked: vault.length,
    climbingNow: positives.length,
    biggestSpike: changes.length ? Math.max(...changes) : 0,
    avgSpike: positives.length ? positives.reduce((s, v) => s + v, 0) / positives.length : 0,
  }
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
.an-switch {
  margin-top: 0;
  padding-top: 2px;
}
.an-switch :deep(.v-label) {
  color: #b6bcd0;
  font-size: 0.86rem;
}
.an-hero__deal-plat.is-up {
  color: #4caf7d;
}
.an-hero__deal-plat.is-down {
  color: #e57373;
}
.an-stat__num.is-bad {
  color: #e57373;
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
