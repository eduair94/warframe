<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('live.eyebrow')"
          :name-label="t('live.table.item')"
          :columns="[t('live.table.bestBuy'), t('live.table.bestSell'), t('live.table.fair'), t('live.table.vol')]"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">
              {{ t('live.eyebrow') }}
              <span class="live-dot" :class="{ 'is-on': connected }" />
              <span class="live-state">{{ connected ? t('live.status.live') : t('live.status.connecting') }}</span>
            </div>
            <i18n-t keypath="live.hero.title" tag="h1" class="an-title">
              <template #signals><span class="accent-a">{{ t('live.hero.titleSignals') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('live.hero.lede') }}</p>
          </div>
        </header>

        <div v-if="pulse" class="live-pulse">
          <div class="live-pulse__stats">
            <span class="live-pulse__stat"><strong>{{ fmtVol(pulse.online.connections) }}</strong> {{ t('live.pulse.tradersOnline') }}</span>
            <span class="live-pulse__sep">·</span>
            <span class="live-pulse__stat"><strong>{{ fmtVol(pulse.online.authorizedUsers) }}</strong> {{ t('live.pulse.signedIn') }}</span>
            <span class="live-pulse__sep">·</span>
            <span class="live-pulse__stat"><strong>{{ pulse.ordersPerMin }}</strong> {{ t('live.pulse.ordersPerMin') }}</span>
            <span class="live-pulse__label">{{ t('live.pulse.latest') }}</span>
          </div>
          <div class="live-pulse__ticker">
            <span
              v-for="o in pulse.recent.slice(0, 14)"
              :key="o.itemId + '-' + o.at"
              class="ticker-item"
              :class="o.type"
            >
              <span class="ticker-tag">{{ o.type === 'buy' ? 'WTB' : 'WTS' }}</span>
              {{ localItemName(o) }}<template v-if="o.rank != null && o.rank > 0"> r{{ o.rank }}</template>
              <strong>{{ o.platinum }}p</strong>
            </span>
          </div>
        </div>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ buyCount }}</div>
            <div class="an-stat__lbl">{{ t('live.stats.goodBuys') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ sellCount }}</div>
            <div class="an-stat__lbl">{{ t('live.stats.goodSells') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ liveCount }}</div>
            <div class="an-stat__lbl">{{ t('live.stats.streaming') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ filtered.length }}</div>
            <div class="an-stat__lbl">{{ t('live.stats.matches') }}</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row live-filters">
            <v-text-field
              v-model="search"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              :label="t('live.filters.search')"
              class="an-search"
            />
            <v-text-field
              v-model.number="minVol"
              type="number"
              min="0"
              density="compact"
              hide-details
              :label="t('live.filters.minVol')"
              class="vol-field"
            />
            <v-btn-toggle
              v-model="mode"
              mandatory
              density="compact"
              class="mode-toggle"
              color="#4fb3bf"
              @update:model-value="onModeChange"
            >
              <v-btn value="all" size="small">{{ t('live.modes.all') }}</v-btn>
              <v-btn value="buy" size="small">{{ t('live.modes.buy') }}</v-btn>
              <v-btn value="sell" size="small">{{ t('live.modes.sell') }}</v-btn>
              <v-btn value="flip" size="small">{{ t('live.modes.flip') }}</v-btn>
            </v-btn-toggle>
          </div>
          <div class="an-count">
            {{ t('live.count.line', { shown: paged.length, total: filtered.length }, filtered.length) }}
            <span v-if="mode !== 'all'" class="mode-hint">{{ t('live.count.sortedBy', { what: modeHintWhat }) }}</span>
          </div>
        </section>

        <div v-if="!filtered.length" class="an-empty">{{ t('live.empty') }}</div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name sortable" @click="sortBy('name')">{{ t('live.table.item') }}{{ sortArrow('name') }}</th>
                <th class="an-num sortable" @click="sortBy('bestBuy')">{{ t('live.table.bestBuy') }}{{ sortArrow('bestBuy') }}</th>
                <th class="an-num sortable" @click="sortBy('bestSell')">{{ t('live.table.bestSell') }}{{ sortArrow('bestSell') }}</th>
                <th class="an-num sortable" @click="sortBy('fair')">{{ t('live.table.fair') }}{{ sortArrow('fair') }}</th>
                <th class="an-num sortable" @click="sortBy('vol')">{{ t('live.table.vol') }}{{ sortArrow('vol') }}</th>
                <th class="an-num sortable" @click="sortBy('flip')">{{ t('live.table.flip') }}{{ sortArrow('flip') }}</th>
                <th class="sortable" @click="sortBy('signal')">{{ t('live.table.signal') }}{{ sortArrow('signal') }}</th>
                <th class="an-num">{{ t('live.table.updated') }}</th>
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
                  <a
                    class="an-name"
                    :href="mkt(row.url_name)"
                    target="_blank"
                    rel="noopener"
                    @click.stop="trackMarketOpen(row.item_name, { source: 'row' })"
                  >
                    <img
                      class="an-thumb"
                      :src="thumbOf(row)"
                      :alt="localItemName(row)"
                      loading="lazy"
                    />
                    <span>{{ localItemName(row) }}</span>
                  </a>
                </td>
                <td class="an-num">{{ plat(row, 'bestBuy') }}</td>
                <td class="an-num an-strong">{{ plat(row, 'bestSell') }}</td>
                <td class="an-num">{{ plat(row, 'fair') }}</td>
                <td class="an-num">
                  <span :class="{ 'is-thin': isThin(row) }">{{ volNum(row) }}</span>
                  <span v-if="isThin(row)" class="thin-flag" :title="t('live.thinTitle')">⚠</span>
                </td>
                <td class="an-num">{{ plat(row, 'flip') }}</td>
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
              <img class="an-thumb" :src="thumbOf(row)" :alt="localItemName(row)" loading="lazy" />
              <div class="an-card__title">
                <a
                  class="an-card__name"
                  :href="mkt(row.url_name)"
                  target="_blank"
                  rel="noopener"
                  @click.stop="trackMarketOpen(row.item_name, { source: 'card' })"
                >
                  {{ localItemName(row) }}
                </a>
                <span class="an-ago">{{ agoOf(row.url_name) }}</span>
              </div>
              <MarketVerdictBadge :verdict="live[row.url_name]?.verdict ?? null" compact />
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <span class="an-block__lbl">{{ t('live.card.buy') }}</span>{{ plat(row, 'bestBuy') }}
              </div>
              <div class="an-block">
                <span class="an-block__lbl">{{ t('live.card.sell') }}</span>{{ plat(row, 'bestSell') }}
              </div>
              <div class="an-block">
                <span class="an-block__lbl">{{ t('live.card.fair') }}</span>{{ plat(row, 'fair') }}
              </div>
              <div class="an-block">
                <span class="an-block__lbl">{{ t('live.card.vol') }}</span>
                <span :class="{ 'is-thin': isThin(row) }">{{ volNum(row) }}</span>
                <span v-if="isThin(row)" class="thin-flag" :title="t('live.thinTitle')">⚠</span>
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
            @update:model-value="onPageChange"
          />
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        {{ t('live.disclaimer') }}
      </v-alert>

      <v-dialog v-model="showDetail" max-width="760">
        <div v-if="detail && detailRow" class="order-book">
          <div class="ob-head">
            <img class="an-thumb" :src="thumbOf(detailRow)" :alt="localItemName(detailRow)" />
            <div class="ob-head__title">
              <div class="ob-head__name">{{ localItemName(detailRow) }}</div>
              <a
                class="ob-head__link"
                :href="mkt(detailRow.url_name)"
                target="_blank"
                rel="noopener"
                @click="trackMarketOpen(detailRow.item_name, { source: 'order_book' })"
                >warframe.market ↗</a
              >
            </div>
            <MarketVerdictBadge :verdict="detail.verdict" />
            <v-btn icon="mdi-close" size="small" variant="text" @click="showDetail = false" />
          </div>

          <div class="ob-advice">
            <div class="ob-advice__row"><span class="ob-advice__lbl buy">{{ t('live.ob.buying') }}</span>{{ buyAdvice(detail) }}</div>
            <div class="ob-advice__row"><span class="ob-advice__lbl sell">{{ t('live.ob.selling') }}</span>{{ sellAdvice(detail) }}</div>
            <div class="ob-advice__meta">
              {{ t('live.ob.meta', { fv: Math.round(detail.verdict.fv), spread: Math.max(0, detail.book.bestSell - detail.book.bestBuy), vol: detail.verdict.volume }) }}<span
                v-if="detail.verdict.thin"
                class="is-thin"
              >
                {{ ' ' + t('live.ob.thin') }}</span
              >
              {{ ' ' + t('live.ob.updated', { ago: agoOf(detailRow.url_name) }) }}
            </div>
          </div>

          <div class="ob-cols">
            <div class="ob-col">
              <div class="ob-col__title sell">{{ t('live.ob.sellersTitle') }} <span>{{ t('live.ob.sellersHint') }}</span></div>
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
                <button
                  class="ob-copy"
                  :title="t('live.ob.copyBuy')"
                  @click.stop="
                    copyMsg('s' + i, whisper(o.ingame_name, detailRow.item_name, o.platinum, o.rank, 'buy'));
                    trackWhisperCopy('buy', o.platinum)
                  "
                >
                  {{ copiedKey === 's' + i ? '✓' : '⧉' }}
                </button>
              </div>
              <div v-if="!detail.book.sellOrders.length" class="ob-empty">{{ t('live.ob.noSellers') }}</div>
            </div>
            <div class="ob-col">
              <div class="ob-col__title buy">{{ t('live.ob.buyersTitle') }} <span>{{ t('live.ob.buyersHint') }}</span></div>
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
                <button
                  class="ob-copy"
                  :title="t('live.ob.copySell')"
                  @click.stop="
                    copyMsg('b' + i, whisper(o.ingame_name, detailRow.item_name, o.platinum, o.rank, 'sell'));
                    trackWhisperCopy('sell', o.platinum)
                  "
                >
                  {{ copiedKey === 'b' + i ? '✓' : '⧉' }}
                </button>
              </div>
              <div v-if="!detail.book.buyOrders.length" class="ob-empty">{{ t('live.ob.noBuyers') }}</div>
            </div>
          </div>
          <div class="ob-foot">{{ t('live.ob.foot') }}</div>
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

const { t } = useI18n()
const store = useItemsStore()
const allItems = computed<any[]>(() => store.allItems)

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const { connected, pulse } = useLiveFeed()
const { itemThumb } = useItemThumb()
const { localItemName } = useLocalizedName()
const { trackSearch, trackFilter, trackSort, trackAction, trackDialog, trackMarketOpen, trackTradeCopy } =
  useAnalytics()

// The socket is a module-level singleton, so `connected` can already be true when
// this page mounts and it flips back on every reconnect — report the first live
// handshake of the visit only, not the reconnect pulses.
let feedReported = false
watch(
  connected,
  (on) => {
    if (!on || feedReported) return
    feedReported = true
    trackAction('live_feed_connected')
  },
  { immediate: true },
)

const search = ref('')
const page = ref(1)
const perPage = 40
const minVol = ref(0)
const mode = ref<'all' | 'buy' | 'sell' | 'flip'>('all')
const sortKey = ref<string>('vol')
const sortDir = ref<'asc' | 'desc'>('desc')

// Sort/filter run over the whole catalog, so they use the static daily-sync market
// fields (present for every item); the live overlay refines the visible rows.
const num = (v: any) => Number(v) || 0
const sellP = (r: any) => num(r.market?.sell)
const buyP = (r: any) => num(r.market?.buy)
const volP = (r: any) => num(r.market?.volume)
const avgP = (r: any) => num(r.market?.avg_price)
const spreadP = (r: any) => {
  const s = sellP(r)
  const b = buyP(r)
  return s > 0 && b > 0 ? s - b : 0
}
const discountP = (r: any) => {
  const a = avgP(r)
  const s = sellP(r)
  return a > 0 && s > 0 ? (a - s) / a : 0 // + = sell below fair -> good buy
}
const overP = (r: any) => {
  const a = avgP(r)
  const s = sellP(r)
  return a > 0 && s > 0 ? (s - a) / a : 0 // + = sell above fair -> good to sell
}

const SORTERS: Record<string, (r: any) => number | string> = {
  name: (r) => (r.item_name || '').toLowerCase(),
  bestBuy: buyP,
  bestSell: sellP,
  fair: avgP,
  vol: volP,
  flip: spreadP,
  signal: discountP,
  overprice: overP,
}

const tradeable = computed<any[]>(() => allItems.value.filter((r) => r && r.url_name && r.market))
const filtered = computed<any[]>(() => {
  const q = (search.value || '').trim().toLowerCase()
  const mv = num(minVol.value)
  const base = tradeable.value.filter((r) => {
    if (q && !((r.item_name || '').toLowerCase().includes(q) || localItemName(r).toLowerCase().includes(q))) return false
    if (volP(r) < mv) return false
    if (mode.value === 'buy' && discountP(r) < 0.08) return false // ≥8% below fair
    if (mode.value === 'sell' && overP(r) < 0.08) return false // ≥8% above fair
    if (mode.value === 'flip' && spreadP(r) <= 0) return false
    return true
  })
  const val = SORTERS[sortKey.value] || volP
  const dir = sortDir.value === 'asc' ? 1 : -1
  return base.slice().sort((a, b) => {
    const va = val(a)
    const vb = val(b)
    if (typeof va === 'string' || typeof vb === 'string') return dir * String(va).localeCompare(String(vb))
    return dir * ((va as number) - (vb as number))
  })
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => {
  const s = (page.value - 1) * perPage
  return filtered.value.slice(s, s + perPage)
})
watch(filtered, () => {
  page.value = 1
})

// SSR-only crawlable snapshot for <SeoFallbackTable>: top 150 of the same
// default-filtered, default-sorted `filtered` list the live table renders,
// via the same live-or-static formatters — on SSR the live socket hasn't
// connected yet, so these fall through to the static daily-sync numbers.
const fallbackRows = computed(() =>
  filtered.value.slice(0, 150).map((row) => ({
    key: row.url_name,
    href: mkt(row.url_name),
    name: row.item_name,
    cells: [plat(row, 'bestBuy'), plat(row, 'bestSell'), plat(row, 'fair'), volNum(row)],
  })),
)

// The list re-filters on every keystroke, so the search event is debounced well
// past typing speed: we want the term the user settled on, not the prefixes.
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  const term = (q || '').trim()
  if (!term) return
  searchTimer = setTimeout(() => trackSearch(term, filtered.value.length), 700)
})

// Label for the "sorted by best …" hint next to the count.
const modeHintWhat = computed(() =>
  mode.value === 'buy'
    ? t('live.count.sortBuys')
    : mode.value === 'sell'
      ? t('live.count.sortSells')
      : t('live.count.sortFlips'),
)

function sortBy(key: string) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDir.value = key === 'name' ? 'asc' : 'desc'
  }
  trackSort(key, sortDir.value)
}
// Mode is the page's primary filter; the sort it implies is set by the watch below
// and is deliberately NOT reported as a sort_change (the user did not choose it).
function onModeChange(v: unknown) {
  if (v) trackFilter('mode', String(v))
}
function onPageChange(p: number) {
  trackAction('paginate', { page: p })
}
function sortArrow(key: string): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? ' ▲' : ' ▼'
}
// Picking a mode also sets a sensible default sort for it.
watch(mode, (m) => {
  sortDir.value = 'desc'
  sortKey.value = m === 'buy' ? 'signal' : m === 'sell' ? 'overprice' : m === 'flip' ? 'flip' : 'vol'
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
// Live value when subscribed, else the static daily-sync value — so the table is
// always populated and its numbers line up with the static sort.
function liveOrStatic(row: any, key: 'bestBuy' | 'bestSell' | 'fair' | 'flip' | 'vol'): number {
  const u = live.value[row.url_name]
  if (u) {
    if (key === 'bestBuy') return u.book.bestBuy
    if (key === 'bestSell') return u.book.bestSell
    if (key === 'fair') return u.verdict.fv
    if (key === 'flip') return u.verdict.flipMargin
    return u.verdict.volume
  }
  if (key === 'bestBuy') return buyP(row)
  if (key === 'bestSell') return sellP(row)
  if (key === 'fair') return avgP(row)
  if (key === 'flip') return spreadP(row)
  return volP(row)
}
function plat(row: any, key: 'bestBuy' | 'bestSell' | 'fair' | 'flip'): string {
  const n = liveOrStatic(row, key)
  return n > 0 ? fmtPlat(n) + 'p' : '—'
}
function volNum(row: any): string {
  return fmtVol(liveOrStatic(row, 'vol'))
}
function isThin(row: any): boolean {
  const u = live.value[row.url_name]
  return u ? u.verdict.thin : volP(row) < 3
}
function isFlash(url: string): boolean {
  const t = flashAt.value[url]
  return !!t && now.value - t < 1400
}
function agoOf(url: string): string {
  const u = live.value[url]
  if (!u) return ''
  const s = Math.max(0, Math.floor((now.value - u.book.updatedAt) / 1000))
  return s < 1 ? t('live.ago.now') : `${s}s`
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
  trackDialog('order_book', { item_name: row.item_name })
}

// Copy-paste-ready wf.market in-game whisper for a specific order.
const copiedKey = ref<string | null>(null)
function whisper(name: string, item: string, platinum: number, rank: number | undefined, kind: 'buy' | 'sell'): string {
  const r = rank != null ? t('live.whisper.rank', { rank }) : ''
  return t(`live.whisper.${kind}`, { name, item, rank: r, platinum })
}
async function copyMsg(key: string, text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null
    }, 1200)
  } catch {
    /* clipboard unavailable */
  }
}
// Reported next to the copy rather than inside copyMsg(): which side of the book
// was whispered, and at what price, only exists at the call site.
function trackWhisperCopy(side: 'buy' | 'sell', price: number) {
  if (!detailRow.value) return
  // `side` is the user's intent here (buy from a seller / sell to a buyer), but the
  // GA4 `side` dimension is WTB/WTS on every other trade_message_copy call site —
  // report the same vocabulary so the dimension is not split in two.
  trackTradeCopy(detailRow.value.item_name, { side: side === 'buy' ? 'wtb' : 'wts', price })
}
function buyAdvice(u: LiveUpdate): string {
  const b = u.book
  const v = u.verdict
  const fv = Math.round(v.fv)
  if (!b.bestSell) return t('live.advice.buy.noSellers')
  if (v.thin) return t('live.advice.buy.thin', { vol: v.volume })
  const pct = v.fv > 0 ? Math.round(((v.fv - b.bestSell) / v.fv) * 100) : 0
  if (pct >= 8) return t('live.advice.buy.good', { price: b.bestSell, pct, fv })
  if (pct <= -8) return t('live.advice.buy.over', { price: b.bestSell, pct: -pct, fv })
  return t('live.advice.buy.fair', { price: b.bestSell, fv })
}
function sellAdvice(u: LiveUpdate): string {
  const b = u.book
  const v = u.verdict
  const fv = Math.round(v.fv)
  if (!b.bestBuy) return t('live.advice.sell.noBuyers')
  if (v.thin) return t('live.advice.sell.thin')
  const pct = v.fv > 0 ? Math.round(((b.bestBuy - v.fv) / v.fv) * 100) : 0
  if (pct >= 8) return t('live.advice.sell.good', { price: b.bestBuy, pct })
  if (pct <= -8) return t('live.advice.sell.under', { price: b.bestBuy, pct: -pct, fv })
  return t('live.advice.sell.fair', { price: b.bestBuy, fv })
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
  if (searchTimer) clearTimeout(searchTimer)
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
/* sortable headers + filters + copy whisper */
.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.sortable:hover {
  color: #e7cf95;
}
.live-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.live-filters .an-search {
  flex: 1;
  min-width: 180px;
}
.vol-field {
  max-width: 108px;
}
.mode-toggle {
  flex: 0 0 auto;
}
.mode-hint {
  opacity: 0.6;
}
.ob-copy {
  margin-left: 6px;
  background: rgba(79, 179, 191, 0.15);
  color: #4fb3bf;
  border: none;
  border-radius: 4px;
  min-width: 22px;
  height: 20px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
  flex: 0 0 auto;
}
.ob-copy:hover {
  background: rgba(79, 179, 191, 0.32);
}
</style>
