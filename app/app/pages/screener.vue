<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('screener.eyebrow')"
          :name-label="t('screener.table.item')"
          :columns="[t('screener.table.sell'), t('screener.table.discount'), t('screener.table.vol')]"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('screener.eyebrow') }}</div>
            <i18n-t keypath="screener.hero.title" tag="h1" class="an-title">
              <template #whole><span class="accent-a">{{ t('screener.hero.titleWhole') }}</span></template>
              <template #atOnce><span class="accent-b">{{ t('screener.hero.titleAtOnce') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('screener.hero.lede') }}</p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('screener.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPct(topDeal.discount) }}<span>{{ t('screener.hero.off') }}</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(topDeal, 'hero')">
              {{ localItemName(topDeal) }} →
            </a>
            <div class="an-hero__deal-sub">{{ t('screener.hero.dealSub', { sell: fmtPlat(topDeal.market.sell), avg: fmtPlat(topDeal.market.avg_price) }) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">{{ t('screener.stats.itemsTracked') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.underpriced }}</div>
            <div class="an-stat__lbl">{{ t('screener.stats.belowAvg') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(stats.avgSpread) }}p</div>
            <div class="an-stat__lbl">{{ t('screener.stats.avgSpread') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ stats.vaulted }}</div>
            <div class="an-stat__lbl">{{ t('screener.stats.vaulted') }}</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('screener.filters.search')" class="an-search"></v-text-field>
            <v-text-field v-model.number="minVolume" density="compact" hide-details type="number" min="0" :label="t('screener.filters.minVolume')" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details :label="t('screener.filters.sortBy')" class="an-field" style="flex: 0 1 240px" @update:model-value="onSortChange"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats" @update:model-value="onCategoryChange">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ t('screener.categories.' + c) }}</v-chip>
          </v-chip-group>
          <div class="an-toggles">
            <v-switch v-model="onlyVaulted" density="compact" hide-details inset color="#4fb3bf" :label="t('screener.filters.onlyVaulted')" @update:model-value="onToggle('only_vaulted', $event)"></v-switch>
            <v-switch v-model="onlyDucats" density="compact" hide-details inset color="#d4af5a" :label="t('screener.filters.onlyDucats')" @update:model-value="onToggle('only_ducats', $event)"></v-switch>
          </div>
          <div class="an-count">{{ t('screener.filters.count', { n: filtered.length }, filtered.length) }}</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">{{ t('screener.empty') }}</div>

        <div v-else-if="!mobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('screener.table.item') }}</th>
                <th>{{ t('screener.table.sell') }}</th>
                <th>{{ t('screener.table.buy') }}</th>
                <th>{{ t('screener.table.spread') }}</th>
                <th>{{ t('screener.table.spreadPct') }}</th>
                <th>{{ t('screener.table.discount') }}</th>
                <th>{{ t('screener.table.vol') }}</th>
                <th>{{ t('screener.table.ducats') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'row', i)">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
                    <span>
                      {{ localItemName(row) }}
                      <span v-if="row.vaulted" class="an-badge">{{ t('screener.row.vaulted') }}</span>
                      <small class="an-sub">{{ t('screener.row.avg', { price: fmtPlat(row.market.avg_price) }) }}</small>
                    </span>
                  </a>
                </td>
                <td class="an-num an-strong">{{ fmtPlat(row.market.sell) }}p</td>
                <td class="an-num">{{ fmtPlat(row.market.buy) }}p</td>
                <td class="an-num" :class="{ up: row.market.diff > 0 }">{{ row.market.diff > 0 ? '+' : '' }}{{ fmtPlat(row.market.diff) }}p</td>
                <td class="an-num">{{ fmtPct(spreadPct(row)) }}</td>
                <td class="an-num" :class="discountClass(row.discount)">{{ fmtSignedPct(row.discount) }}</td>
                <td class="an-num">{{ fmtPlat(row.market.volume) }}</td>
                <td class="an-num">{{ row.ducats ? fmtPlat(row.ducats) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="(row, i) in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'mobile_card', i)">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ localItemName(row) }}<span v-if="row.vaulted" class="an-badge">{{ t('screener.row.vaulted') }}</span></div>
                <small class="an-sub">{{ t('screener.row.avgVol', { price: fmtPlat(row.market.avg_price), vol: fmtPlat(row.market.volume) }) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('screener.card.prices') }}</div>
                <div class="an-block__row"><span>{{ t('screener.table.sell') }}</span><b>{{ fmtPlat(row.market.sell) }}p</b></div>
                <div class="an-block__row"><span>{{ t('screener.table.buy') }}</span><b>{{ fmtPlat(row.market.buy) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('screener.card.signals') }}</div>
                <div class="an-block__row"><span>{{ t('screener.table.spread') }}</span><b :class="{ up: row.market.diff > 0 }">{{ fmtPlat(row.market.diff) }}p</b></div>
                <div class="an-block__row"><span>{{ t('screener.table.discount') }}</span><b :class="discountClass(row.discount)">{{ fmtSignedPct(row.discount) }}</b></div>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="mobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        {{ t('screener.disclaimer') }}
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'

const { t } = useI18n()
const { localItemName } = useLocalizedName()
const store = useItemsStore()
const allItems = computed<any[]>(() => store.allItems)

const { mobile } = useDisplay()

const search = ref('')
const minVolume = ref(0)
const category = ref('All')
const sortKey = ref('discount')
const onlyVaulted = ref(false)
const onlyDucats = ref(false)
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

// NOTE: V3 v-select default item-title key is `title` (was `text` in V2)
const sortOptions = computed(() => [
  { title: t('screener.sort.discount'), value: 'discount' },
  { title: t('screener.sort.spread'), value: 'spread' },
  { title: t('screener.sort.spreadPct'), value: 'spreadPct' },
  { title: t('screener.sort.volume'), value: 'volume' },
  { title: t('screener.sort.ducatEff'), value: 'ducatEff' },
  { title: t('screener.sort.price'), value: 'price' },
  { title: t('screener.sort.name'), value: 'name' },
])

// ---- helpers (were methods) ----
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
function discountOf(row: any): number {
  const avg = Number(row.market.avg_price) || 0
  const sell = Number(row.market.sell) || 0
  if (avg <= 0 || sell <= 0) return 0
  return ((avg - sell) / avg) * 100
}
function spreadPct(row: any): number {
  const sell = Number(row.market.sell) || 0
  return sell > 0 ? ((row.market.diff || 0) / sell) * 100 : 0
}
function ducatEff(row: any): number {
  const sell = Number(row.market.sell) || 0
  const ducats = Number(row.ducats) || 0
  return sell > 0 && ducats > 0 ? ducats / sell : 0
}
function discountClass(discount: number): string {
  if (discount > 1) return 'up'
  if (discount < -1) return 'down'
  return 'flat'
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmtPct(n: number): string {
  return `${(Number(n) || 0).toFixed(0)}%`
}
function fmtSignedPct(n: number): string {
  const v = Number(n) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
}

// ---- derived state (were computed) ----
const priced = computed<any[]>(() =>
  allItems.value
    .filter((i) => i && i.market && (i.market.sell > 0 || i.market.buy > 0))
    .map((i) => ({ ...i, discount: discountOf(i) }))
)

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of priced.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const list = priced.value.filter((r) => {
    if (q && !(r.item_name.toLowerCase().includes(q) || localItemName(r).toLowerCase().includes(q))) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if ((r.market.volume || 0) < minV) return false
    if (onlyVaulted.value && !r.vaulted) return false
    if (onlyDucats.value && !r.ducats) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    discount: (a, b) => dir(a.discount, b.discount),
    spread: (a, b) => dir(a.market.diff, b.market.diff),
    spreadPct: (a, b) => dir(spreadPct(a), spreadPct(b)),
    volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
    ducatEff: (a, b) => dir(ducatEff(a), ducatEff(b)),
    price: (a, b) => dir(a.market.sell || 0, b.market.sell || 0),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.discount)
})

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): top 150 of the already-filtered/sorted screener (discount desc by default).
const fallbackRows = computed(() =>
  filtered.value.slice(0, 40).map((row) => ({
    key: row.url_name,
    href: mkt(row.url_name),
    name: localItemName(row),
    cells: [fmtPlat(row.market.sell) + 'p', fmtSignedPct(row.discount), fmtPlat(row.market.volume)],
  })),
)
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of priced.value) if (!best || r.discount > best.discount) best = r
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) if (!best || r.discount > best.discount) best = r
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = priced.value
  const spreads = list.map((r) => r.market.diff || 0)
  return {
    total: list.length,
    underpriced: list.filter((r) => r.discount > 0).length,
    avgSpread: spreads.length ? spreads.reduce((s, v) => s + v, 0) / spreads.length : 0,
    vaulted: list.filter((r) => r.vaulted).length,
  }
})

// reset page when the filtered result set changes
watch(filtered, () => {
  page.value = 1
})

// ── Analytics ───────────────────────────────────────────────────────────────
// Same schema as the other ledger pages (ducats / vaulted / vaulted-worth) so
// the four are comparable in GA4. Nothing is emitted from a computed: the list
// recomputes on every price poll, so every hook below hangs off an explicit
// user interaction or a debounced watch of a raw input ref.
const { trackSearch, trackFilter, trackSort, trackAction, trackMarketOpen } = useAnalytics()

const TRACK_DEBOUNCE = 700
let searchTimer: ReturnType<typeof setTimeout> | null = null
let volumeTimer: ReturnType<typeof setTimeout> | null = null
let pageTimer: ReturnType<typeof setTimeout> | null = null

// One event per typed query, never one per keystroke.
watch(search, (term) => {
  if (searchTimer) clearTimeout(searchTimer)
  const q = (term || '').toString().trim()
  if (!q) return
  searchTimer = setTimeout(() => trackSearch(q, filtered.value.length), TRACK_DEBOUNCE)
})

watch(minVolume, (v) => {
  if (volumeTimer) clearTimeout(volumeTimer)
  volumeTimer = setTimeout(() => trackFilter('min_volume', Number(v) || 0), TRACK_DEBOUNCE)
})

function onCategoryChange(v: any) {
  trackFilter('category', String(v))
}
function onSortChange(v: any) {
  trackSort(String(v))
}
function onToggle(name: string, v: any) {
  trackFilter(name, !!v)
}
// Clicking through a long ledger fires one event per page; only the page the
// user settles on is worth reporting.
function onPageChange(p: any) {
  if (pageTimer) clearTimeout(pageTimer)
  pageTimer = setTimeout(() => trackAction('page_change', { page: Number(p) || 1 }), 500)
}
// `position` is the row's absolute rank in the current result set, so GA4 can
// tell a top-of-list click from a page-4 click. item_name (English) is the
// canonical key — the localized label would explode cardinality.
function onMarketOpen(row: any, source: string, index?: number) {
  trackMarketOpen(row.item_name, {
    source,
    position: index === undefined ? undefined : (page.value - 1) * perPage + index + 1,
  })
}

onBeforeUnmount(() => {
  // A pending timer would otherwise fire after the route changed and be
  // attributed to the next page's `tool`.
  if (searchTimer) clearTimeout(searchTimer)
  if (volumeTimer) clearTimeout(volumeTimer)
  if (pageTimer) clearTimeout(pageTimer)
})

// hide the global loading spinner (per frontend-loading-spinner memory)
function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}
onMounted(finishLoading)
</script>
