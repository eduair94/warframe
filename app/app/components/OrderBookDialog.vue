<template>
  <v-dialog
    :model-value="modelValue"
    max-width="760"
    scrollable
    content-class="obk-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="item" class="obk">
      <!-- Header -->
      <header class="obk__head">
        <img
          v-if="hasThumb"
          class="obk__thumb"
          :src="thumbUrl"
          :alt="localItemName(item)"
          @error="onImgError"
        />
        <span v-else class="obk__node" aria-hidden="true"></span>
        <div class="obk__headtext">
          <div class="obk__eyebrow">{{ t('components.orderBook.eyebrow') }}</div>
          <h2 class="obk__title">{{ localItemName(item) }}</h2>
          <div v-if="updatedLabel" class="obk__sub">{{ t('components.orderBook.updated', { time: updatedLabel }) }}</div>
        </div>
        <button class="obk__close" :aria-label="t('components.orderBook.closeAria')" @click="close">
          <v-icon>mdi-close</v-icon>
        </button>
      </header>

      <div class="obk__body">
        <!-- Current headline market (the synced aggregates), separate from the
             per-order lists below — "apart from the current data". -->
        <section class="obk__market" aria-label="Current market">
          <div class="obk__mstat is-buy">
            <span class="obk__mlbl">{{ t('components.orderBook.current.topBid') }}</span>
            <span class="obk__mval">{{ fmtPlat(mkt.buy) }}p</span>
          </div>
          <div class="obk__mstat is-sell">
            <span class="obk__mlbl">{{ t('components.orderBook.current.lowAsk') }}</span>
            <span class="obk__mval">{{ fmtPlat(mkt.sell) }}p</span>
          </div>
          <div class="obk__mstat">
            <span class="obk__mlbl">{{ t('components.orderBook.current.avg48h') }}</span>
            <span class="obk__mval">{{ fmtPlat(mkt.avg_price) }}p</span>
          </div>
          <div class="obk__mstat">
            <span class="obk__mlbl">{{ t('components.orderBook.current.vol48h') }}</span>
            <span class="obk__mval" :class="{ 'is-thin': (mkt.volume || 0) < 3 }">{{ fmtInt(mkt.volume) }}</span>
          </div>
        </section>

        <!-- States -->
        <div v-if="loading" class="obk__state">{{ t('components.orderBook.loading') }}</div>
        <div v-else-if="error" class="obk__state">
          {{ t('components.orderBook.error') }}
          <button type="button" class="obk__retry" @click="load">{{ t('components.orderBook.retry') }}</button>
        </div>
        <div v-else-if="isEmpty" class="obk__state">{{ t('components.orderBook.pending') }}</div>

        <!-- The 5 best orders each side, with per-order whisper buttons -->
        <div v-else class="obk__cols">
          <!-- Sellers (asks): cheapest first — you BUY from them -->
          <section class="obk__side obk__side--sell">
            <div class="obk__side-head">
              <span class="obk__side-title">{{ t('components.orderBook.sellers.title') }}</span>
              <span class="obk__side-hint">{{ t('components.orderBook.sellers.hint') }}</span>
            </div>
            <ul v-if="sellRows.length" class="obk__list">
              <li v-for="(row, i) in sellRows" :key="'s' + i" class="obk__row">
                <span class="obk__price">{{ fmtPlat(row.platinum) }}<small>p</small></span>
                <span class="obk__qty">×{{ row.quantity }}</span>
                <span class="obk__trader">
                  <i class="obk__pres" :class="'is-' + (row.status || 'offline')" :title="statusLabel(row.status)"></i>
                  <span class="obk__name">{{ row.ingame_name || '—' }}</span>
                </span>
                <button
                  v-if="row.ingame_name"
                  type="button"
                  class="obk__wbtn"
                  :aria-label="t('components.orderBook.whisperAria', { name: row.ingame_name })"
                  @click="whisper('buy', row, 's' + i)"
                >
                  <v-icon size="15">{{ copiedKey === 's' + i ? 'mdi-check' : 'mdi-message-text-outline' }}</v-icon>
                  {{ copiedKey === 's' + i ? t('components.orderBook.copied') : t('components.orderBook.whisper') }}
                </button>
              </li>
            </ul>
            <p v-else class="obk__none">{{ t('components.orderBook.sellers.none') }}</p>
          </section>

          <!-- Buyers (bids): highest first — you SELL to them -->
          <section class="obk__side obk__side--buy">
            <div class="obk__side-head">
              <span class="obk__side-title">{{ t('components.orderBook.buyers.title') }}</span>
              <span class="obk__side-hint">{{ t('components.orderBook.buyers.hint') }}</span>
            </div>
            <ul v-if="buyRows.length" class="obk__list">
              <li v-for="(row, i) in buyRows" :key="'b' + i" class="obk__row">
                <span class="obk__price">{{ fmtPlat(row.platinum) }}<small>p</small></span>
                <span class="obk__qty">×{{ row.quantity }}</span>
                <span class="obk__trader">
                  <i class="obk__pres" :class="'is-' + (row.status || 'offline')" :title="statusLabel(row.status)"></i>
                  <span class="obk__name">{{ row.ingame_name || '—' }}</span>
                </span>
                <button
                  v-if="row.ingame_name"
                  type="button"
                  class="obk__wbtn"
                  :aria-label="t('components.orderBook.whisperAria', { name: row.ingame_name })"
                  @click="whisper('sell', row, 'b' + i)"
                >
                  <v-icon size="15">{{ copiedKey === 'b' + i ? 'mdi-check' : 'mdi-message-text-outline' }}</v-icon>
                  {{ copiedKey === 'b' + i ? t('components.orderBook.copied') : t('components.orderBook.whisper') }}
                </button>
              </li>
            </ul>
            <p v-else class="obk__none">{{ t('components.orderBook.buyers.none') }}</p>
          </section>
        </div>

        <!-- Degrade note: item synced before named-order capture shipped -->
        <p v-if="!loading && !error && !isEmpty && !hasNames" class="obk__flag">
          {{ t('components.orderBook.namesPending') }}
        </p>
        <p class="obk__note">{{ t('components.orderBook.note') }}</p>
      </div>

      <footer class="obk__foot">
        <a class="obk__link" :href="'https://warframe.market/items/' + item.url_name" target="_blank" rel="noopener" @click="onMarketOpen">
          <v-icon size="15">mdi-cart-outline</v-icon> {{ t('components.orderBook.marketLink') }}
        </a>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
/**
 * Order-book dialog opened from a home-table buy/sell price.
 *
 * Shows the item's current headline market (the synced aggregates) AND the five
 * best CONTACTABLE sellers and buyers, each with a one-click "Whisper" button
 * that copies a ready-to-paste warframe.market "/w …" trade message.
 *
 * Data comes from `/orders/:url_name` (served from the DB — see
 * BaseWarframeClient.getOrderBook), which now carries `topOrders` (named orders)
 * next to the aggregated `depth` ladder. When `topOrders` is absent (item synced
 * before capture shipped) the dialog degrades to the depth ladder without
 * whisper buttons. warframe.market is never hit live from the request path (it
 * hangs on the datacenter IP), so these rows are as fresh as the last sync.
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, ref, watch } from 'vue'
import type { OrderBook, TopOrder } from '~/composables/useOrderBook'

dayjs.extend(relativeTime)

interface RowItem {
  url_name: string
  item_name: string
  thumb?: string
  market?: {
    buy?: number
    sell?: number
    avg_price?: number
    volume?: number
  }
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    item?: RowItem | null
  }>(),
  { modelValue: false, item: null },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { t } = useI18n()
const { localItemName } = useLocalizedName()
const { itemThumb, THUMB_PLACEHOLDER } = useItemThumb()
const { trackDialog, trackTradeCopy, trackMarketOpen } = useAnalytics()
const apiBase = useApiBase()

const book = ref<OrderBook | null>(null)
const loading = ref(false)
const error = ref(false)
const copiedKey = ref<string | null>(null)
let bookFor = ''
let copiedTimer: ReturnType<typeof setTimeout> | null = null

const mkt = computed(() => props.item?.market || {})

// Prefer the named top orders; fall back to the aggregated depth ladder (one row
// per price level, no trader name) for items synced before capture shipped.
const sellRows = computed<TopOrder[]>(() => rowsFor('sell'))
const buyRows = computed<TopOrder[]>(() => rowsFor('buy'))

function rowsFor(side: 'buy' | 'sell'): TopOrder[] {
  const named = book.value?.topOrders?.[side]
  if (named && named.length) return named.slice(0, 5)
  // Degrade: synthesize nameless rows from the depth ladder so the shape still
  // renders (whisper buttons hide themselves when ingame_name is empty).
  const levels = (side === 'buy' ? book.value?.buy : book.value?.sell) || []
  return levels.slice(0, 5).map((l) => ({
    platinum: l.price,
    quantity: l.quantity,
    ingame_name: '',
    status: '',
  }))
}

const hasNames = computed(
  () => (book.value?.topOrders?.buy?.length || 0) + (book.value?.topOrders?.sell?.length || 0) > 0,
)
const isEmpty = computed(
  () => !!book.value && sellRows.value.length === 0 && buyRows.value.length === 0,
)

const thumbUrl = computed(() =>
  props.item ? itemThumb({ urlName: props.item.url_name, itemName: props.item.item_name, thumb: props.item.thumb }) : THUMB_PLACEHOLDER,
)
const hasThumb = computed(() => thumbUrl.value !== THUMB_PLACEHOLDER)

const updatedLabel = computed(() => {
  const at = book.value?.updatedAt
  return at ? dayjs(at).fromNow() : ''
})

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.item) {
      trackDialog('order_book', { item_name: props.item.item_name })
      load()
    }
  },
)

async function load() {
  const it = props.item
  if (!it?.url_name) return
  if (bookFor === it.url_name && book.value) return
  // Latest-request guard: closing the dialog mid-fetch and opening a different
  // row must not let the first (stale) response resolve last and overwrite the
  // second item's book. Only the response for the row still showing is applied.
  const reqUrl = it.url_name
  loading.value = true
  error.value = false
  try {
    const data = await $fetch<OrderBook>(`${apiBase}/orders/${encodeURIComponent(reqUrl)}`)
    if (props.item?.url_name !== reqUrl) return // superseded — discard
    book.value = data
    bookFor = reqUrl
  } catch {
    if (props.item?.url_name !== reqUrl) return
    error.value = true
    book.value = null
  } finally {
    if (props.item?.url_name === reqUrl) loading.value = false
  }
}

/**
 * Build + copy the standard warframe.market whisper. `intent` is what YOU want
 * to do: 'buy' (contacting a seller/ask) or 'sell' (contacting a buyer/bid).
 * `key` identifies the clicked row so only its button shows the "Copied!" state.
 */
async function whisper(intent: 'buy' | 'sell', row: TopOrder, key: string) {
  const it = props.item
  if (!it || !row.ingame_name) return
  const body = t(`components.orderBook.whisperMsg.${intent}`, {
    item: it.item_name,
    price: row.platinum,
  })
  const message = `/w ${row.ingame_name} ${body}`
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(message)
    } else {
      const el = document.createElement('textarea')
      el.value = message
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    copiedKey.value = key
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copiedKey.value = null), 2000)
    trackTradeCopy(it.item_name, { side: intent === 'buy' ? 'wtb' : 'wts', price: row.platinum, source: 'order_book' })
  } catch {
    // Clipboard blocked — nothing else to do.
  }
}

function statusLabel(status: string): string {
  if (status === 'ingame') return t('components.orderBook.status.ingame')
  if (status === 'online') return t('components.orderBook.status.online')
  return ''
}

function onMarketOpen() {
  if (props.item) trackMarketOpen(props.item.item_name, { source: 'order_book' })
}
function close() {
  emit('update:modelValue', false)
}
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (img) img.style.display = 'none'
}
function fmtPlat(n: any): string {
  const v = Number(n) || 0
  return v >= 100 ? Math.round(v).toLocaleString('en-US') : String(Math.round(v * 100) / 100)
}
function fmtInt(n: any): string {
  return String(Math.round(Number(n) || 0))
}
</script>

<style scoped>
.obk {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.32);
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  color: #eef1f8;
  display: flex;
  flex-direction: column;
  max-height: 86vh;
  max-width: 100%;
  overflow: hidden;
}

/* Header */
.obk__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.22);
}
.obk__node {
  width: 11px;
  height: 11px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.7);
  flex: none;
}
.obk__thumb {
  width: 46px;
  height: 46px;
  object-fit: contain;
  flex: none;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.obk__headtext { min-width: 0; flex: 1; }
.obk__eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.64rem;
  color: #8f95ab;
}
.obk__title {
  font-family: 'Cinzel', serif;
  font-size: 1.24rem;
  line-height: 1.15;
  color: #e7cf95;
  margin: 2px 0 0;
  overflow-wrap: anywhere;
}
.obk__sub {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.74rem;
  color: #8f95ab;
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.obk__close {
  flex: none;
  color: #9aa0b8;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.obk__close:hover { color: #e7cf95; border-color: rgba(200, 168, 92, 0.5); }
.obk__close:focus-visible { outline: 2px solid #35d6d0; outline-offset: 2px; }

.obk__body { padding: 16px 20px; overflow-y: auto; overflow-x: hidden; }

/* Current headline market */
.obk__market {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 8px 14px;
  padding: 12px 14px;
  border: 1px solid rgba(200, 168, 92, 0.16);
  background: rgba(200, 168, 92, 0.03);
}
.obk__mstat { display: flex; flex-direction: column; min-width: 0; }
.obk__mlbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.1em; font-size: 0.6rem; color: #8f95ab;
}
.obk__mval { font-variant-numeric: tabular-nums; color: #eef1f8; font-size: 0.98rem; font-weight: 600; }
.obk__mstat.is-buy .obk__mval { color: #e7cf95; }
.obk__mstat.is-sell .obk__mval { color: #7fd8df; }
.obk__mval.is-thin { color: #e0a3a3; }

/* States */
.obk__state {
  font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; color: #8f95ab;
  display: flex; align-items: center; gap: 12px; padding: 20px 2px;
}
.obk__retry {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.06em;
  color: #17130a; background: #c8a85c; border: none; padding: 4px 14px; font-weight: 700; cursor: pointer;
}
.obk__retry:hover { background: #e7cf95; }

/* Two-column order lists */
.obk__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}
.obk__side {
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.014);
  border-radius: 4px;
}
.obk__side--sell { border-left: 2px solid #4fb3bf; }
.obk__side--buy { border-left: 2px solid #c8a85c; }
.obk__side-head { display: flex; flex-direction: column; margin-bottom: 8px; }
.obk__side-title {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.09em; font-size: 0.74rem; font-weight: 700;
}
.obk__side--sell .obk__side-title { color: #7fd8df; }
.obk__side--buy .obk__side-title { color: #e7cf95; }
.obk__side-hint { font-size: 0.64rem; color: #6f758c; }

.obk__list { list-style: none; padding: 0; margin: 0; }
.obk__row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  align-items: center;
  gap: 6px 8px;
  padding: 7px 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.obk__row:last-child { border-bottom: none; }
.obk__price { font-variant-numeric: tabular-nums; font-weight: 700; font-size: 0.98rem; color: #eef1f8; }
.obk__price small { font-size: 0.68rem; color: #9aa0b8; margin-left: 1px; }
.obk__qty {
  font-variant-numeric: tabular-nums; font-size: 0.72rem; color: #8f95ab;
}
.obk__trader { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
.obk__pres { width: 8px; height: 8px; border-radius: 50%; flex: none; background: #6f758c; }
.obk__pres.is-ingame { background: #7bd6a4; box-shadow: 0 0 6px rgba(123, 214, 164, 0.7); }
.obk__pres.is-online { background: #d9b45a; }
.obk__name {
  font-size: 0.82rem; color: #cfd4e4;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.obk__wbtn {
  grid-column: 1 / -1;
  justify-self: start;
  display: inline-flex; align-items: center; gap: 4px;
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;
  font-size: 0.68rem; font-weight: 700;
  color: #cfe9e7; background: rgba(79, 179, 191, 0.1);
  border: 1px solid rgba(79, 179, 191, 0.3); border-radius: 5px;
  padding: 2px 9px; cursor: pointer; margin-top: 1px;
  transition: background 0.15s ease, color 0.15s ease;
}
.obk__side--buy .obk__wbtn { color: #f0dca6; background: rgba(200, 168, 92, 0.1); border-color: rgba(200, 168, 92, 0.32); }
.obk__wbtn:hover { background: rgba(79, 179, 191, 0.22); color: #fff; }
.obk__side--buy .obk__wbtn:hover { background: rgba(200, 168, 92, 0.24); color: #fff; }
.obk__wbtn:focus-visible { outline: 2px solid #35d6d0; outline-offset: 2px; }

.obk__none {
  font-family: 'Rajdhani', sans-serif; font-size: 0.84rem; color: #8f95ab;
  font-style: italic; margin: 4px 0;
}
.obk__flag {
  font-family: 'Rajdhani', sans-serif; font-size: 0.74rem; color: #d9b45a;
  margin: 12px 2px 0; line-height: 1.4;
}
.obk__note {
  font-size: 0.68rem; color: #6f758c; margin: 10px 2px 0; line-height: 1.4;
}

/* Footer */
.obk__foot {
  padding: 13px 20px;
  border-top: 1px solid rgba(200, 168, 92, 0.22);
  display: flex;
  align-items: center;
  gap: 8px 20px;
  flex-wrap: wrap;
}
.obk__link {
  display: inline-flex; align-items: center; gap: 6px;
  color: #8f95ab; font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase; letter-spacing: 0.07em;
  font-size: 0.78rem; text-decoration: none;
}
.obk__link:hover { color: #35d6d0; }

@media (max-width: 560px) {
  .obk__cols { grid-template-columns: 1fr; }
}
</style>
