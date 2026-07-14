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
              blended fair value. Ranked items (arcanes/mods) price at max rank; thin-volume items
              are held, never advised.
            </p>
          </div>
        </header>

        <div v-if="pulse" class="live-pulse">
          <div class="live-pulse__stats">
            <span class="live-pulse__stat"><strong>{{ fmtVol(pulse.online.connections) }}</strong> traders online</span>
            <span class="live-pulse__sep">·</span>
            <span class="live-pulse__stat"><strong>{{ fmtVol(pulse.online.authorizedUsers) }}</strong> signed in</span>
            <span class="live-pulse__sep">·</span>
            <span class="live-pulse__stat"><strong>{{ pulse.ordersPerMin }}</strong> orders/min</span>
            <span class="live-pulse__label">latest listings, live from warframe.market →</span>
          </div>
          <div class="live-pulse__ticker">
            <span
              v-for="o in pulse.recent.slice(0, 14)"
              :key="o.itemId + '-' + o.at"
              class="ticker-item"
              :class="o.type"
            >
              <span class="ticker-tag">{{ o.type === 'buy' ? 'WTB' : 'WTS' }}</span>
              {{ o.item_name }}<template v-if="o.rank != null && o.rank > 0"> r{{ o.rank }}</template>
              <strong>{{ o.platinum }}p</strong>
            </span>
          </div>
        </div>

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
                <th class="an-num">Vol</th>
                <th class="an-num">Flip</th>
                <th>Signal</th>
                <th class="an-num">Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paged"
                :key="row.url_name"
                class="clickable"
                :class="{ 'row-flash': isFlash(row.url_name) }"
                @click="openDetail(row)"
              >
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click.stop>
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
                <td class="an-num">
                  <span :class="{ 'is-thin': live[row.url_name]?.verdict.thin }">
                    {{ live[row.url_name] ? fmtVol(live[row.url_name].verdict.volume) : '—' }}
                  </span>
                  <span v-if="live[row.url_name]?.verdict.thin" class="thin-flag" title="Thin volume — price may be rigged">⚠</span>
                </td>
                <td class="an-num">{{ liveVal(row.url_name, (u) => u.verdict.flipMargin) }}</td>
                <td><MarketVerdictBadge :verdict="live[row.url_name]?.verdict ?? null" /></td>
                <td class="an-num an-ago">{{ agoOf(row.url_name) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <div
            v-for="row in paged"
            :key="row.url_name"
            class="an-card clickable"
            :class="{ 'row-flash': isFlash(row.url_name) }"
            @click="openDetail(row)"
          >
            <div class="an-card__head">
              <img class="an-thumb" :src="thumbOf(row)" :alt="row.item_name" loading="lazy" />
              <div class="an-card__title">
                <a class="an-card__name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click.stop>
                  {{ row.item_name }}
                </a>
                <span class="an-ago">{{ agoOf(row.url_name) }}</span>
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
              <div class="an-block">
                <span class="an-block__lbl">Vol</span>
                <span :class="{ 'is-thin': live[row.url_name]?.verdict.thin }">
                  {{ live[row.url_name] ? fmtVol(live[row.url_name].verdict.volume) : '—' }}
                </span>
                <span v-if="live[row.url_name]?.verdict.thin" class="thin-flag" title="Thin volume — price may be rigged">⚠</span>
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
        price history). Arcanes/mods price at their max rank. Thin-volume items (⚠) are held, since
        a couple of orders can rig the price. Click any item for its live order book.
      </v-alert>

      <v-dialog v-model="showDetail" max-width="760">
        <div v-if="detail && detailRow" class="order-book">
          <div class="ob-head">
            <img class="an-thumb" :src="thumbOf(detailRow)" :alt="detailRow.item_name" />
            <div class="ob-head__title">
              <div class="ob-head__name">{{ detailRow.item_name }}</div>
              <a class="ob-head__link" :href="mkt(detailRow.url_name)" target="_blank" rel="noopener">warframe.market ↗</a>
            </div>
            <MarketVerdictBadge :verdict="detail.verdict" />
            <v-btn icon="mdi-close" size="small" variant="text" @click="showDetail = false" />
          </div>

          <div class="ob-advice">
            <div class="ob-advice__row"><span class="ob-advice__lbl buy">Buying</span>{{ buyAdvice(detail) }}</div>
            <div class="ob-advice__row"><span class="ob-advice__lbl sell">Selling</span>{{ sellAdvice(detail) }}</div>
            <div class="ob-advice__meta">
              Fair value {{ Math.round(detail.verdict.fv) }}p · spread
              {{ Math.max(0, detail.book.bestSell - detail.book.bestBuy) }}p · vol {{ detail.verdict.volume }}/48h<span
                v-if="detail.verdict.thin"
                class="is-thin"
              >
                · ⚠ thin</span
              >
              · updated {{ agoOf(detailRow.url_name) }}
            </div>
          </div>

          <div class="ob-cols">
            <div class="ob-col">
              <div class="ob-col__title sell">Sellers · WTS <span>cheapest first</span></div>
              <div
                v-for="(o, i) in detail.book.sellOrders"
                :key="'s' + i"
                class="ob-order"
                :class="{ 'is-best': i === 0 }"
              >
                <span class="ob-status" :class="o.status" :title="o.status" />
                <span class="ob-name">{{ o.ingame_name || '—' }}</span>
                <span v-if="o.rank != null" class="ob-rank">r{{ o.rank }}</span>
                <span class="ob-qty">×{{ o.quantity }}</span>
                <strong class="ob-plat">{{ o.platinum }}p</strong>
              </div>
              <div v-if="!detail.book.sellOrders.length" class="ob-empty">No online sellers</div>
            </div>
            <div class="ob-col">
              <div class="ob-col__title buy">Buyers · WTB <span>highest first</span></div>
              <div
                v-for="(o, i) in detail.book.buyOrders"
                :key="'b' + i"
                class="ob-order"
                :class="{ 'is-best': i === 0 }"
              >
                <span class="ob-status" :class="o.status" :title="o.status" />
                <span class="ob-name">{{ o.ingame_name || '—' }}</span>
                <span v-if="o.rank != null" class="ob-rank">r{{ o.rank }}</span>
                <span class="ob-qty">×{{ o.quantity }}</span>
                <strong class="ob-plat">{{ o.platinum }}p</strong>
              </div>
              <div v-if="!detail.book.buyOrders.length" class="ob-empty">No online buyers</div>
            </div>
          </div>
          <div class="ob-foot">🟢 ingame — trade now · 🟡 online — message them</div>
        </div>
      </v-dialog>
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
const { connected, pulse } = useLiveFeed()
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
// Liveness cues: a ticking clock for "updated Xs ago", and a flash timestamp per
// item so a row briefly highlights whenever its price/verdict actually changes.
const now = ref(Date.now())
const flashAt = ref<Record<string, number>>({})
const prevKey = new Map<string, string>()
let clock: ReturnType<typeof setInterval> | null = null

function onUpdate(u: LiveUpdate) {
  const key = `${u.book.bestBuy}|${u.book.bestSell}|${u.verdict.verdict}`
  const prev = prevKey.get(u.url_name)
  if (prev !== undefined && prev !== key) flashAt.value[u.url_name] = Date.now()
  prevKey.set(u.url_name, key)
  live.value[u.url_name] = u
}

function syncSubscriptions(rows: any[]) {
  const want = new Set(rows.map((r) => r.url_name))
  for (const [url, off] of unsubs) {
    if (!want.has(url)) {
      off()
      unsubs.delete(url)
      delete live.value[url]
      delete flashAt.value[url]
      prevKey.delete(url)
    }
  }
  for (const r of rows) {
    if (unsubs.has(r.url_name)) continue
    const off = subscribeLive(r.url_name, onUpdate)
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
function fmtVol(n: number | undefined): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function liveVal(url: string, pick: (u: LiveUpdate) => number): string {
  const u = live.value[url]
  return u ? fmtPlat(pick(u)) + 'p' : '—'
}
function isFlash(url: string): boolean {
  const t = flashAt.value[url]
  return !!t && now.value - t < 1400
}
function agoOf(url: string): string {
  const u = live.value[url]
  if (!u) return ''
  const s = Math.max(0, Math.floor((now.value - u.book.updatedAt) / 1000))
  return s < 1 ? 'now' : `${s}s`
}

// --- order-book detail (click a row to see the real offers + a worth-it call) ---
const detailRow = ref<any | null>(null)
const showDetail = ref(false)
const detail = computed<LiveUpdate | null>(() =>
  detailRow.value ? live.value[detailRow.value.url_name] || null : null,
)
function openDetail(row: any) {
  detailRow.value = row
  showDetail.value = true
}
function buyAdvice(u: LiveUpdate): string {
  const b = u.book
  const v = u.verdict
  const fv = Math.round(v.fv)
  if (!b.bestSell) return 'No sellers online right now.'
  if (v.thin) return `Thin volume (${v.volume}/48h) — a couple of orders can rig this, don't chase.`
  const pct = v.fv > 0 ? Math.round(((v.fv - b.bestSell) / v.fv) * 100) : 0
  if (pct >= 8) return `Buy from the cheapest seller at ${b.bestSell}p — ${pct}% below fair (${fv}p). Good buy.`
  if (pct <= -8) return `Cheapest sell ${b.bestSell}p is ${-pct}% above fair (${fv}p). Overpriced — wait.`
  return `Cheapest sell ${b.bestSell}p is about fair (${fv}p). No edge either way.`
}
function sellAdvice(u: LiveUpdate): string {
  const b = u.book
  const v = u.verdict
  const fv = Math.round(v.fv)
  if (!b.bestBuy) return 'No buyers online — list a sell order and wait.'
  if (v.thin) return `Thin volume — few real buyers, price is unreliable.`
  const pct = v.fv > 0 ? Math.round(((b.bestBuy - v.fv) / v.fv) * 100) : 0
  if (pct >= 8) return `Sell instantly to the top buyer at ${b.bestBuy}p — ${pct}% above fair. Great sell.`
  if (pct <= -8) return `Top buyer only ${b.bestBuy}p (${-pct}% below fair). List your own at ~${fv}p instead.`
  return `Top buyer ${b.bestBuy}p is about fair. Or list your own around ${fv}p.`
}

onMounted(() => {
  finishLoading()
  ensureLiveConnected() // open the socket so the global market-pulse arrives even before subscribing rows
  syncSubscriptions(paged.value)
  watch(paged, (rows) => syncSubscriptions(rows))
  clock = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  for (const [, off] of unsubs) off()
  unsubs.clear()
  if (clock) clearInterval(clock)
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
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 4px #4caf7d;
  }
  50% {
    box-shadow: 0 0 9px #4caf7d;
  }
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
.an-ago {
  font-size: 0.8em;
  opacity: 0.55;
  font-variant-numeric: tabular-nums;
}
.thin-flag {
  color: #e0a53a;
  margin-left: 3px;
  cursor: help;
}
.is-thin {
  color: #e0a53a;
}
/* Brief highlight when a row's price/verdict actually changes — makes the live feed feel alive. */
.row-flash td,
.an-card.row-flash {
  animation: rowflash 1.3s ease-out;
}
@keyframes rowflash {
  0% {
    background: rgba(79, 179, 191, 0.2);
  }
  100% {
    background: transparent;
  }
}
/* Market pulse: online traders + live orders/min + latest-listings ticker. */
.live-pulse {
  margin: 8px 0 4px;
  padding: 8px 12px;
  border: 1px solid rgba(79, 179, 191, 0.18);
  border-radius: 8px;
  background: rgba(79, 179, 191, 0.05);
}
.live-pulse__stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #9fb3b3;
}
.live-pulse__stat strong {
  color: #e7cf95;
}
.live-pulse__sep {
  opacity: 0.4;
}
.live-pulse__label {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.live-pulse__ticker {
  display: flex;
  gap: 14px;
  margin-top: 6px;
  overflow-x: hidden;
  white-space: nowrap;
  font-size: 12.5px;
  -webkit-mask-image: linear-gradient(to right, transparent, #000 3%, #000 93%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 3%, #000 93%, transparent);
}
.ticker-item {
  flex: 0 0 auto;
  color: #c9d4d4;
}
.ticker-item strong {
  color: #e7cf95;
  margin-left: 4px;
}
.ticker-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 0 4px;
  border-radius: 3px;
  margin-right: 4px;
}
.ticker-item.buy .ticker-tag {
  background: rgba(76, 175, 125, 0.2);
  color: #4caf7d;
}
.ticker-item.sell .ticker-tag {
  background: rgba(212, 175, 90, 0.2);
  color: #d4af5a;
}
/* Order-book detail dialog */
.clickable {
  cursor: pointer;
}
:deep(tr.clickable:hover) td {
  background: rgba(79, 179, 191, 0.06);
}
.an-card.clickable:hover {
  border-color: rgba(79, 179, 191, 0.35);
}
.order-book {
  background: #0d0f1a;
  border: 1px solid rgba(79, 179, 191, 0.2);
  border-radius: 10px;
  padding: 16px;
  color: #c9d4d4;
}
.ob-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.ob-head .an-thumb {
  width: 44px;
  height: 44px;
}
.ob-head__title {
  flex: 1;
  min-width: 0;
}
.ob-head__name {
  font-size: 16px;
  font-weight: 700;
  color: #e7cf95;
}
.ob-head__link {
  font-size: 11px;
  color: #4fb3bf;
  text-decoration: none;
}
.ob-advice {
  background: rgba(79, 179, 191, 0.05);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  font-size: 13px;
}
.ob-advice__row {
  margin-bottom: 4px;
}
.ob-advice__lbl {
  display: inline-block;
  min-width: 58px;
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  margin-right: 8px;
}
.ob-advice__lbl.buy {
  color: #4caf7d;
}
.ob-advice__lbl.sell {
  color: #d4af5a;
}
.ob-advice__meta {
  font-size: 11.5px;
  opacity: 0.6;
  margin-top: 6px;
}
.ob-cols {
  display: flex;
  gap: 14px;
}
.ob-col {
  flex: 1;
  min-width: 0;
}
.ob-col__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
}
.ob-col__title span {
  opacity: 0.45;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  margin-left: 4px;
}
.ob-col__title.sell {
  color: #d4af5a;
}
.ob-col__title.buy {
  color: #4caf7d;
}
.ob-order {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 6px;
  border-radius: 5px;
  font-size: 13px;
}
.ob-order.is-best {
  background: rgba(255, 255, 255, 0.05);
}
.ob-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: #667;
}
.ob-status.ingame {
  background: #4caf7d;
}
.ob-status.online {
  background: #d4af5a;
}
.ob-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ob-rank {
  font-size: 10px;
  opacity: 0.6;
}
.ob-qty {
  font-size: 11px;
  opacity: 0.55;
}
.ob-plat {
  color: #e7cf95;
}
.ob-empty {
  padding: 8px 6px;
  opacity: 0.5;
  font-size: 12px;
}
.ob-foot {
  margin-top: 10px;
  font-size: 11px;
  opacity: 0.5;
}
@media (max-width: 600px) {
  .ob-cols {
    flex-direction: column;
  }
}
</style>
