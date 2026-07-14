<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">
              Warframe Market · Real-time
              <span class="live-dot" :class="{ 'is-on': connected }" />
              <span class="live-state">{{ connected ? 'live' : 'connecting…' }}</span>
            </div>
            <h1 class="an-title">Live <span class="accent-a">signals</span>.</h1>
            <p class="an-lede">
              Best online buy/sell straight from the order book, with a buy/sell verdict against a
              blended fair value. Low-liquidity items are held, never advised.
            </p>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ buyCount }}</div>
            <div class="an-stat__lbl">Good buys (page)</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ sellCount }}</div>
            <div class="an-stat__lbl">Good sells (page)</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ liveCount }}</div>
            <div class="an-stat__lbl">Streaming</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ filtered.length }}</div>
            <div class="an-stat__lbl">Matches</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field
              v-model="search"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              label="Search an item"
              class="an-search"
            />
          </div>
          <div class="an-count">
            Streaming {{ paged.length }} of {{ filtered.length }} ·
            {{ filtered.length === 1 ? 'item' : 'items' }}
          </div>
        </section>

        <div v-if="!filtered.length" class="an-empty">No tradeable items match this search.</div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Item</th>
                <th class="an-num">Best buy</th>
                <th class="an-num">Best sell</th>
                <th class="an-num">Fair value</th>
                <th class="an-num">Flip</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                    <img
                      class="an-thumb"
                      :src="thumbOf(row)"
                      :alt="row.item_name"
                      loading="lazy"
                    />
                    <span>{{ row.item_name }}</span>
                  </a>
                </td>
                <td class="an-num">{{ liveVal(row.url_name, (u) => u.book.bestBuy) }}</td>
                <td class="an-num an-strong">{{ liveVal(row.url_name, (u) => u.book.bestSell) }}</td>
                <td class="an-num">{{ liveVal(row.url_name, (u) => u.verdict.fv) }}</td>
                <td class="an-num">{{ liveVal(row.url_name, (u) => u.verdict.flipMargin) }}</td>
                <td><MarketVerdictBadge :verdict="live[row.url_name]?.verdict ?? null" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <div v-for="row in paged" :key="row.url_name" class="an-card">
            <div class="an-card__head">
              <img class="an-thumb" :src="thumbOf(row)" :alt="row.item_name" loading="lazy" />
              <div class="an-card__title">
                <a class="an-card__name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                  {{ row.item_name }}
                </a>
              </div>
              <MarketVerdictBadge :verdict="live[row.url_name]?.verdict ?? null" compact />
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <span class="an-block__lbl">Buy</span>{{ liveVal(row.url_name, (u) => u.book.bestBuy) }}
              </div>
              <div class="an-block">
                <span class="an-block__lbl">Sell</span>{{ liveVal(row.url_name, (u) => u.book.bestSell) }}
              </div>
              <div class="an-block">
                <span class="an-block__lbl">Fair</span>{{ liveVal(row.url_name, (u) => u.verdict.fv) }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination
            v-model="page"
            :length="pageCount"
            :total-visible="isMobile ? 5 : 9"
            color="#d4af5a"
          />
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        Verdicts compare the lowest online sell against a blended fair value (realized average +
        price history). Thin books stay on “hold”, not a signal.
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'
import type { LiveUpdate } from '~/utils/liveTypes'

const store = useItemsStore()
const allItems = computed<any[]>(() => store.allItems)

useHead({
  title: 'Live Signals — real-time Warframe Market buy/sell',
  meta: [
    {
      name: 'description',
      content: 'Real-time best online buy/sell prices with a fair-value buy/sell verdict.',
    },
  ],
})

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const { connected } = useLiveFeed()
const { itemThumb } = useItemThumb()

const search = ref('')
const page = ref(1)
const perPage = 40

const tradeable = computed<any[]>(() =>
  allItems.value.filter((r) => r && r.url_name && r.market),
)
const filtered = computed<any[]>(() => {
  const q = (search.value || '').trim().toLowerCase()
  return q
    ? tradeable.value.filter((r) => (r.item_name || '').toLowerCase().includes(q))
    : tradeable.value
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => {
  const s = (page.value - 1) * perPage
  return filtered.value.slice(s, s + perPage)
})
watch(filtered, () => {
  page.value = 1
})

// Live updates keyed by url_name (only for the rows currently on screen).
const live = ref<Record<string, LiveUpdate>>({})
const unsubs = new Map<string, () => void>()

function syncSubscriptions(rows: any[]) {
  const want = new Set(rows.map((r) => r.url_name))
  for (const [url, off] of unsubs) {
    if (!want.has(url)) {
      off()
      unsubs.delete(url)
      delete live.value[url]
    }
  }
  for (const r of rows) {
    if (unsubs.has(r.url_name)) continue
    const off = subscribeLive(r.url_name, (u) => {
      live.value[u.url_name] = u
    })
    unsubs.set(r.url_name, off)
  }
}

const buyCount = computed(
  () => paged.value.filter((r) => live.value[r.url_name]?.verdict.verdict === 'buy').length,
)
const sellCount = computed(
  () => paged.value.filter((r) => live.value[r.url_name]?.verdict.verdict === 'sell').length,
)
const liveCount = computed(() => paged.value.filter((r) => live.value[r.url_name]).length)

function thumbOf(row: any): string {
  return itemThumb({ urlName: row.url_name, itemName: row.item_name, thumb: row.thumb })
}
function mkt(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}
function fmtPlat(n: number | undefined): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function liveVal(url: string, pick: (u: LiveUpdate) => number): string {
  const u = live.value[url]
  return u ? fmtPlat(pick(u)) + 'p' : '—'
}

onMounted(() => {
  finishLoading()
  syncSubscriptions(paged.value)
  watch(paged, (rows) => syncSubscriptions(rows))
})
onBeforeUnmount(() => {
  for (const [, off] of unsubs) off()
  unsubs.clear()
})

// Repo rule: hide the global spinner on mount or the page spins forever.
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
</script>

<style scoped>
.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 6px;
  background: #e57373;
  vertical-align: middle;
}
.live-dot.is-on {
  background: #4caf7d;
  box-shadow: 0 0 6px #4caf7d;
}
.live-state {
  font-size: 0.85em;
  opacity: 0.8;
  margin-left: 4px;
}
.an-block__lbl {
  display: block;
  opacity: 0.6;
  font-size: 11px;
}
</style>
