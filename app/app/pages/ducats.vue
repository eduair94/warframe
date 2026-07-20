<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('ducatsPage.eyebrow')"
          :name-label="t('ducatsPage.table.primePart')"
          :columns="[t('ducatsPage.table.platAsk'), t('ducatsPage.table.ducats'), t('ducatsPage.table.ducatsPerPlat'), t('ducatsPage.table.vol')]"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('ducatsPage.eyebrow') }}</div>
            <i18n-t keypath="ducatsPage.hero.title" tag="h1" class="an-title">
              <template #ducats><span class="accent-b">{{ t('ducatsPage.hero.titleDucats') }}</span></template>
              <template #platinum><span class="accent-a">{{ t('ducatsPage.hero.titlePlatinum') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('ducatsPage.hero.lede') }}</p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('ducatsPage.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ eff(topDeal).toFixed(1) }}<span>d/p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(topDeal, 'hero')">{{ localItemName(topDeal) }} →</a>
            <div class="an-hero__deal-sub">{{ t('ducatsPage.hero.dealSub', { ducats: topDeal.ducats, sell: fmtPlat(topDeal.market.sell) }) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat"><div class="an-stat__num">{{ stats.total }}</div><div class="an-stat__lbl">{{ t('ducatsPage.stats.primeParts') }}</div></div>
          <div class="an-stat"><div class="an-stat__num is-good">{{ stats.best.toFixed(1) }}</div><div class="an-stat__lbl">{{ t('ducatsPage.stats.bestPerPlat') }}</div></div>
          <div class="an-stat"><div class="an-stat__num is-alt">{{ stats.avg.toFixed(1) }}</div><div class="an-stat__lbl">{{ t('ducatsPage.stats.avgPerPlat') }}</div></div>
          <div class="an-stat"><div class="an-stat__num is-gold">{{ stats.cheap }}</div><div class="an-stat__lbl">{{ t('ducatsPage.stats.cheapParts') }}</div></div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('ducatsPage.filters.search')" class="an-search"></v-text-field>
            <v-text-field v-model.number="maxPrice" density="compact" hide-details type="number" min="0" :label="t('ducatsPage.filters.maxPrice')" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details :label="t('ducatsPage.filters.sortBy')" class="an-field" style="flex: 0 1 220px" @update:model-value="onSortChange"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats" @update:model-value="onCategoryChange">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ t('ducatsPage.categories.' + c) }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ t('ducatsPage.filters.count', { n: filtered.length }, filtered.length) }}</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">
          {{ t('ducatsPage.empty') }}
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('ducatsPage.table.primePart') }}</th>
                <th class="grp-a">{{ t('ducatsPage.table.platAsk') }}</th>
                <th class="grp-b">{{ t('ducatsPage.table.ducats') }}</th>
                <th>{{ t('ducatsPage.table.ducatsPerPlat') }}</th>
                <th>{{ t('ducatsPage.table.vol') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'row', i)">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
                    <span>
                      {{ localItemName(row) }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('ducatsPage.row.best') }}</span>
                      <small class="an-sub">{{ t('ducatsPage.row.vol', { vol: fmtPlat(row.market.volume) }) }}</small>
                    </span>
                  </a>
                </td>
                <td class="grp-a an-num">{{ fmtPlat(row.market.sell) }}p</td>
                <td class="grp-b an-num">{{ row.ducats }}</td>
                <td class="an-num an-strong up">{{ eff(row).toFixed(1) }}</td>
                <td class="an-num">{{ fmtPlat(row.market.volume) }}</td>
                <td>
                  <v-btn icon="mdi-open-in-new" size="small" variant="text" color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="t('ducatsPage.row.open', { name: localItemName(row) })" @click="onMarketOpen(row, 'row', i)"></v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="(row, i) in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'mobile_card', i)">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ localItemName(row) }}<span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('ducatsPage.row.best') }}</span></div>
                <small class="an-sub">{{ t('ducatsPage.row.vol', { vol: fmtPlat(row.market.volume) }) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('ducatsPage.card.value') }}</div>
                <div class="an-block__row"><span>{{ t('ducatsPage.card.plat') }}</span><b>{{ fmtPlat(row.market.sell) }}p</b></div>
                <div class="an-block__row"><span>{{ t('ducatsPage.card.ducats') }}</span><b>{{ row.ducats }}</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('ducatsPage.card.efficiency') }}</div>
                <div class="an-block__row"><span>{{ t('ducatsPage.card.ducatsPerPlat') }}</span><b class="up">{{ eff(row).toFixed(1) }}</b></div>
                <div class="an-block__row"><span>{{ t('ducatsPage.card.volume') }}</span><b>{{ fmtPlat(row.market.volume) }}</b></div>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        {{ t('ducatsPage.disclaimer') }}
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
const itemsStore = useItemsStore()
const allItems = computed(() => itemsStore.allItems)

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// filter/sort/pager state (was data())
const search = ref('')
const maxPrice = ref<number>(0)
const category = ref('All')
const sortKey = ref('efficiency')
const page = ref(1)
const perPage = 25

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

// key renamed text -> title for Vuetify 3 v-select (default item-title is 'title')
const sortOptions = computed(() => [
  { title: t('ducatsPage.sort.efficiency'), value: 'efficiency' },
  { title: t('ducatsPage.sort.ducats'), value: 'ducats' },
  { title: t('ducatsPage.sort.cheapest'), value: 'cheapest' },
  { title: t('ducatsPage.sort.volume'), value: 'volume' },
])

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
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  return 'Other'
}
function eff(row: any): number {
  return row.market.sell > 0 ? row.ducats / row.market.sell : 0
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}

const ducatItems = computed<any[]>(() =>
  (allItems.value as any[]).filter((i) => i && i.ducats > 0 && i.market && i.market.sell > 0),
)

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of ducatItems.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const maxP = Number(maxPrice.value) || 0
  const list = ducatItems.value.filter((r) => {
    if (q && !(r.item_name.toLowerCase().includes(q) || localItemName(r).toLowerCase().includes(q))) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if (maxP > 0 && (r.market.sell || 0) > maxP) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    efficiency: (a, b) => dir(eff(a), eff(b)),
    ducats: (a, b) => dir(a.ducats, b.ducats),
    cheapest: (a, b) => a.market.sell - b.market.sell,
    volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.efficiency)
})

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): top 150 of the same filtered+sorted list the live table renders
// (default sort: ducat efficiency, descending).
const fallbackRows = computed(() =>
  filtered.value.slice(0, 150).map((row) => ({
    key: row.url_name,
    href: mkt(row.url_name),
    name: localItemName(row),
    cells: [fmtPlat(row.market.sell) + 'p', row.ducats, eff(row).toFixed(1), fmtPlat(row.market.volume)],
  })),
)

const pageCount = computed<number>(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of ducatItems.value) if (!best || eff(r) > eff(best)) best = r
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) if (!best || eff(r) > eff(best)) best = r
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = ducatItems.value
  const effs = list.map((r) => eff(r))
  return {
    total: list.length,
    best: effs.length ? Math.max(...effs) : 0,
    avg: effs.length ? effs.reduce((s, v) => s + v, 0) / effs.length : 0,
    cheap: list.filter((r) => r.market.sell <= 15).length,
  }
})

watch(filtered, () => {
  page.value = 1
})

// ── Analytics ───────────────────────────────────────────────────────────────
// Same schema as the other ledger pages (screener / vaulted / vaulted-worth) so
// the four are comparable in GA4. Nothing is emitted from a computed: the list
// recomputes on every price poll, so every hook below hangs off an explicit
// user interaction or a debounced watch of a raw input ref.
const { trackSearch, trackFilter, trackSort, trackAction, trackMarketOpen } = useAnalytics()

const TRACK_DEBOUNCE = 700
let searchTimer: ReturnType<typeof setTimeout> | null = null
let priceTimer: ReturnType<typeof setTimeout> | null = null
let pageTimer: ReturnType<typeof setTimeout> | null = null

// One event per typed query, never one per keystroke.
watch(search, (term) => {
  if (searchTimer) clearTimeout(searchTimer)
  const q = (term || '').toString().trim()
  if (!q) return
  searchTimer = setTimeout(() => trackSearch(q, filtered.value.length), TRACK_DEBOUNCE)
})

watch(maxPrice, (v) => {
  if (priceTimer) clearTimeout(priceTimer)
  priceTimer = setTimeout(() => trackFilter('max_price', Number(v) || 0), TRACK_DEBOUNCE)
})

function onCategoryChange(v: any) {
  trackFilter('category', String(v))
}
function onSortChange(v: any) {
  trackSort(String(v))
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
  if (priceTimer) clearTimeout(priceTimer)
  if (pageTimer) clearTimeout(pageTimer)
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
