<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Vaulted</div>
            <h1 class="an-title">
              Locked in the <span class="accent-b">Vault</span>.
            </h1>
            <p class="an-lede">
              Vaulted prime gear can't be farmed from relics anymore — supply only
              shrinks, so prices tend to climb. Here's every vaulted item on the
              market, ranked by what it's worth today.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Priciest vaulted</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(topDeal.market.sell) }}<span>p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">{{ topDeal.item_name }} →</a>
            <div class="an-hero__deal-sub">vol {{ fmtPlat(topDeal.market.volume) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat"><div class="an-stat__num">{{ stats.total }}</div><div class="an-stat__lbl">vaulted items</div></div>
          <div class="an-stat"><div class="an-stat__num is-gold">{{ fmtPlat(stats.priciest) }}p</div><div class="an-stat__lbl">priciest</div></div>
          <div class="an-stat"><div class="an-stat__num is-alt">{{ fmtPlat(stats.avg) }}p</div><div class="an-stat__lbl">avg price</div></div>
          <div class="an-stat"><div class="an-stat__num is-good">{{ stats.sets }}</div><div class="an-stat__lbl">full sets</div></div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
            <v-text-field v-model.number="minPrice" density="compact" hide-details type="number" min="0" label="Min price (plat)" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
          </v-chip-group>
          <div class="an-toggles">
            <v-switch v-model="setsOnly" density="compact" hide-details inset color="#4caf7d" label="Full sets only"></v-switch>
          </div>
          <div class="an-count">{{ filtered.length }} {{ filtered.length === 1 ? 'item' : 'items' }} match</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">
          No vaulted items match these filters. Some items may not be enriched with vault status yet.
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Vaulted item</th>
                <th class="grp-b">Price (ask)</th>
                <th class="grp-a">Buy (bid)</th>
                <th>Spread</th>
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
                      <span v-if="row.set" class="an-badge">SET</span>
                      <small class="an-sub">{{ categoryOf(row.tags) }}</small>
                    </span>
                  </a>
                </td>
                <td class="grp-b an-num an-strong">{{ fmtPlat(row.market.sell) }}p</td>
                <td class="grp-a an-num">{{ fmtPlat(row.market.buy) }}p</td>
                <td class="an-num">{{ fmtPlat(row.market.diff) }}p</td>
                <td class="an-num">{{ fmtPlat(row.market.volume) }}</td>
                <td>
                  <v-btn icon size="small" color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-btn>
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
                <div class="an-card__name">{{ row.item_name }}<span v-if="row.set" class="an-badge">SET</span></div>
                <small class="an-sub">{{ categoryOf(row.tags) }} · vol {{ fmtPlat(row.market.volume) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
            </div>
            <div class="an-card__blocks">
              <div class="an-block an-block--full">
                <div class="an-block__lbl">Market value</div>
                <div class="an-block__row"><span>Price (ask)</span><b>{{ fmtPlat(row.market.sell) }}p</b></div>
                <div class="an-block__row"><span>Buy (bid)</span><b>{{ fmtPlat(row.market.buy) }}p</b></div>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        Vault status comes from Warframe Market. Prices are today's orders — not a
        guarantee of future value. Low-volume items can swing hard.
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
const minPrice = ref<number>(0)
const category = ref('All')
const sortKey = ref('price')
const setsOnly = ref(false)
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = [
  { title: 'Price (high → low)', value: 'price' },
  { title: 'Volume', value: 'volume' },
  { title: 'Name (A–Z)', value: 'name' },
]

const vaultedItems = computed<any[]>(() =>
  (allItems.value as any[]).filter((i) => i && i.vaulted === true && i.market && i.market.sell > 0)
)

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of vaultedItems.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const minP = Number(minPrice.value) || 0
  const list = vaultedItems.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if ((r.market.sell || 0) < minP) return false
    if (setsOnly.value && !r.set) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    price: (a, b) => dir(a.market.sell, b.market.sell),
    volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.price)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of vaultedItems.value) if (!best || r.market.sell > best.market.sell) best = r
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) if (!best || r.market.sell > best.market.sell) best = r
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = vaultedItems.value
  const prices = list.map((r) => r.market.sell)
  return {
    total: list.length,
    priciest: prices.length ? Math.max(...prices) : 0,
    avg: prices.length ? prices.reduce((s, v) => s + v, 0) / prices.length : 0,
    sets: list.filter((r) => r.set).length,
  }
})

watch(filtered, () => {
  page.value = 1
})

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
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}

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
