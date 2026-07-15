<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Ducat Efficiency</div>
            <h1 class="an-title">
              Most <span class="accent-b">ducats</span> per
              <span class="accent-a">platinum</span>.
            </h1>
            <p class="an-lede">
              Baro Ki'Teer pays ducats for prime parts. Buy the parts that give the
              most ducats for the least platinum, and every Void Trader visit costs
              you less. Ranked by ducats earned per platinum spent.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Best ducat value</div>
            <div class="an-hero__deal-plat">{{ eff(topDeal).toFixed(1) }}<span>d/p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">{{ topDeal.item_name }} →</a>
            <div class="an-hero__deal-sub">{{ topDeal.ducats }} ducats · {{ fmtPlat(topDeal.market.sell) }}p</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat"><div class="an-stat__num">{{ stats.total }}</div><div class="an-stat__lbl">prime parts</div></div>
          <div class="an-stat"><div class="an-stat__num is-good">{{ stats.best.toFixed(1) }}</div><div class="an-stat__lbl">best ducats/plat</div></div>
          <div class="an-stat"><div class="an-stat__num is-alt">{{ stats.avg.toFixed(1) }}</div><div class="an-stat__lbl">avg ducats/plat</div></div>
          <div class="an-stat"><div class="an-stat__num is-gold">{{ stats.cheap }}</div><div class="an-stat__lbl">≤ 15p parts</div></div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a part" class="an-search"></v-text-field>
            <v-text-field v-model.number="maxPrice" density="compact" hide-details type="number" min="0" label="Max price (plat)" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ filtered.length }} {{ filtered.length === 1 ? 'part' : 'parts' }} match</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">
          No parts match these filters. Some items may not be enriched with ducat values yet.
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Prime part</th>
                <th class="grp-a">Plat (ask)</th>
                <th class="grp-b">Ducats</th>
                <th>Ducats / plat</th>
                <th>Vol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.item_name }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">BEST</span>
                      <small class="an-sub">vol {{ fmtPlat(row.market.volume) }}</small>
                    </span>
                  </a>
                </td>
                <td class="grp-a an-num">{{ fmtPlat(row.market.sell) }}p</td>
                <td class="grp-b an-num">{{ row.ducats }}</td>
                <td class="an-num an-strong up">{{ eff(row).toFixed(1) }}</td>
                <td class="an-num">{{ fmtPlat(row.market.volume) }}</td>
                <td>
                  <v-btn icon="mdi-open-in-new" size="small" variant="text" color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name"></v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="row in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ row.item_name }}<span v-if="row.url_name === topDealUrl" class="an-badge">BEST</span></div>
                <small class="an-sub">vol {{ fmtPlat(row.market.volume) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">Value</div>
                <div class="an-block__row"><span>Plat</span><b>{{ fmtPlat(row.market.sell) }}p</b></div>
                <div class="an-block__row"><span>Ducats</span><b>{{ row.ducats }}</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">Efficiency</div>
                <div class="an-block__row"><span>Ducats/plat</span><b class="up">{{ eff(row).toFixed(1) }}</b></div>
                <div class="an-block__row"><span>Volume</span><b>{{ fmtPlat(row.market.volume) }}</b></div>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        Ducats/plat = ducat value ÷ lowest sell order. Baro's ducat prices are fixed
        by the game; platinum prices are today's Warframe Market orders.
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'

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
const sortOptions = [
  { title: 'Ducats per plat', value: 'efficiency' },
  { title: 'Most ducats', value: 'ducats' },
  { title: 'Cheapest', value: 'cheapest' },
  { title: 'Volume', value: 'volume' },
]

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
    if (q && !r.item_name.toLowerCase().includes(q)) return false
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
