<template>
  <v-dialog
    :model-value="modelValue"
    max-width="820"
    scrollable
    content-class="rld-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="relic" class="rld">
      <!-- Header -->
      <header class="rld__head">
        <img
          v-if="hasHeadThumb"
          class="rld__thumb"
          :src="headThumb"
          :alt="relic.relicName"
          @error="onImgError"
        />
        <span v-else class="rld__node" aria-hidden="true"></span>
        <div class="rld__headtext">
          <div class="rld__eyebrow">{{ t('relicsValue.dialog.eyebrow') }}</div>
          <h2 class="rld__title">
            {{ relic.relicName }}
            <span v-if="relic.vaulted" class="rld__badge rld__badge--vault">{{ t('relicsValue.tags.vaultedBadge') }}</span>
            <span v-else-if="relic.resurgence" class="rld__badge rld__badge--res" :title="t('relicsValue.tags.resurgenceTitle')">{{ t('relicsValue.tags.resurgence') }}</span>
          </h2>
          <div class="rld__sub">{{ relic.tier }} · {{ t('relicsValue.dialog.dropsCount', { n: relic.rewards.length }, relic.rewards.length) }}</div>
        </div>
        <button class="rld__close" :aria-label="t('relicsValue.dialog.closeAria')" @click="close">
          <v-icon>mdi-close</v-icon>
        </button>
      </header>

      <div class="rld__body">
        <!-- The page's thesis, in miniature: crack the relic, or cash it? -->
        <section class="rld__ledger" :class="'is-' + verdict.side">
          <div class="rld__pan" :class="{ 'is-win': verdict.side === 'crack' }">
            <div class="rld__pan-lbl">{{ t('relicsValue.dialog.crackFor', { refinement: refinementLabel }) }}</div>
            <div class="rld__pan-val">{{ fmtPlat(open) }}<span>p</span></div>
            <div class="rld__pan-note">{{ t('relicsValue.dialog.crackNote') }}</div>
          </div>
          <div class="rld__vs">
            <span class="rld__vs-mark" aria-hidden="true"></span>
            <span class="rld__vs-txt" :class="verdict.cls">{{ verdict.label }}</span>
            <span v-if="verdict.margin" class="rld__vs-amt">{{ verdict.margin }}</span>
          </div>
          <div class="rld__pan" :class="{ 'is-win': verdict.side === 'sell' }">
            <div class="rld__pan-lbl">{{ t('relicsValue.dialog.sellNow') }}</div>
            <div class="rld__pan-val">{{ fmtPlat(sellNow) }}<span>p</span></div>
            <div class="rld__pan-note">{{ t('relicsValue.dialog.sellNote') }}</div>
          </div>
        </section>

        <!-- Refinement toggle: watch the odds (and the verdict) shift live -->
        <div class="rld__refine-row">
          <span class="rld__refine-lbl">{{ t('relicsValue.filters.refinement') }}</span>
          <div class="rld__refine-toggle" role="group" :aria-label="t('relicsValue.filters.refinement')">
            <button
              v-for="opt in refineOptions"
              :key="opt.value"
              type="button"
              class="rld__refine-btn"
              :class="{ 'is-on': refinement === opt.value }"
              :aria-pressed="refinement === opt.value"
              @click="refinement = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Why "sell now" is what it is — the raw book, so the number is never a mystery -->
        <section class="rld__market">
          <div class="rld__mstat is-strong">
            <span class="rld__mlbl">{{ t('relicsValue.dialog.market.sellNow') }}</span>
            <span class="rld__mval">{{ fmtPlat(sellNow) }}p</span>
          </div>
          <div class="rld__mstat">
            <span class="rld__mlbl">{{ t('relicsValue.dialog.market.topBid') }}</span>
            <span class="rld__mval">{{ fmtPlat(mkt.buy) }}p</span>
          </div>
          <div class="rld__mstat">
            <span class="rld__mlbl">{{ t('relicsValue.dialog.market.lowAsk') }}</span>
            <span class="rld__mval">{{ fmtPlat(mkt.sell) }}p</span>
          </div>
          <div class="rld__mstat">
            <span class="rld__mlbl">{{ t('relicsValue.dialog.market.avg48h') }}</span>
            <span class="rld__mval">{{ fmtPlat(mkt.avgPrice) }}p</span>
          </div>
          <div class="rld__mstat">
            <span class="rld__mlbl">{{ t('relicsValue.dialog.market.vol48h') }}</span>
            <span class="rld__mval" :class="{ 'is-thin': (mkt.volume || 0) < 3 }">{{ fmtInt(mkt.volume) }}</span>
          </div>
        </section>
        <p v-if="bidInflated" class="rld__flag">
          ⚠ {{ t('relicsValue.dialog.bidFlag', { bid: fmtPlat(mkt.buy), rate: fmtPlat(sellNow) }) }}
        </p>

        <!-- Bulk buy/sell: walk the live book for the quantity you actually trade -->
        <section class="rld__bulk">
          <div class="rld__bulk-head">
            <span class="rld__sec-title">{{ t('relicsValue.dialog.bulk.title') }}</span>
            <div class="rld__qty" role="group" :aria-label="t('relicsValue.dialog.bulk.qtyAria')">
              <button type="button" class="rld__qty-btn" :disabled="qty <= 1" :aria-label="t('relicsValue.dialog.bulk.less')" @click="stepQty(-1)">−</button>
              <input
                class="rld__qty-in"
                type="number"
                min="1"
                max="999"
                inputmode="numeric"
                :value="qty"
                :aria-label="t('relicsValue.dialog.bulk.qtyAria')"
                @input="qty = Number(($event.target as HTMLInputElement).value)"
                @change="normalizeQty"
                @blur="normalizeQty"
              />
              <button type="button" class="rld__qty-btn" :aria-label="t('relicsValue.dialog.bulk.more')" @click="stepQty(1)">+</button>
              <span class="rld__qty-lbl">{{ t('relicsValue.dialog.bulk.relics', { n: qty }, qty) }}</span>
            </div>
          </div>

          <div v-if="bookLoading" class="rld__bulk-state">{{ t('relicsValue.dialog.bulk.loading') }}</div>
          <div v-else-if="bookError" class="rld__bulk-state">
            {{ t('relicsValue.dialog.bulk.error') }}
            <button type="button" class="rld__retry" @click="loadBook">{{ t('relicsValue.dialog.bulk.retry') }}</button>
          </div>
          <div v-else-if="bookEmpty" class="rld__bulk-state">{{ t('relicsValue.dialog.bulk.pending') }}</div>
          <div v-else-if="book" class="rld__bulk-grid">
            <!-- Sell your relics into the credible bids -->
            <div class="rld__quote rld__quote--sell">
              <div class="rld__quote-lbl">{{ t('relicsValue.dialog.bulk.sellHead', { n: qty }) }}</div>
              <template v-if="sellQuote && sellQuote.units">
                <div class="rld__quote-val">{{ fmtPlat(sellQuote.avg) }}<span>p {{ t('relicsValue.dialog.bulk.each') }}</span></div>
                <div class="rld__quote-sub">{{ t('relicsValue.dialog.bulk.totalGet', { p: fmtPlat(sellQuote.cost) }) }}</div>
                <div v-if="!sellQuote.filled" class="rld__quote-warn">⚠ {{ t('relicsValue.dialog.bulk.onlyDepth', { n: sellAvail }) }}</div>
                <div class="rld__ladderwrap">
                  <div class="rld__ladder">
                    <span v-for="(l, i) in sellQuote.levels" :key="i" class="rld__rung">{{ fmtPlat(l.price) }}p<small>×{{ l.take }}</small></span>
                  </div>
                </div>
                <div v-if="sellQuote.excluded" class="rld__quote-note">{{ t('relicsValue.dialog.bulk.baitSkipped', { n: sellQuote.excluded }, sellQuote.excluded) }}</div>
              </template>
              <div v-else class="rld__quote-val is-none">{{ t('relicsValue.dialog.bulk.noBuyers') }}</div>
            </div>

            <!-- Buy relics to open, out of the ask book -->
            <div class="rld__quote rld__quote--buy">
              <div class="rld__quote-lbl">{{ t('relicsValue.dialog.bulk.buyHead', { n: qty }) }}</div>
              <template v-if="buyQuote && buyQuote.units">
                <div class="rld__quote-val">{{ fmtPlat(buyQuote.avg) }}<span>p {{ t('relicsValue.dialog.bulk.each') }}</span></div>
                <div class="rld__quote-sub">{{ t('relicsValue.dialog.bulk.totalPay', { p: fmtPlat(buyQuote.cost) }) }}</div>
                <div v-if="!buyQuote.filled" class="rld__quote-warn">⚠ {{ t('relicsValue.dialog.bulk.onlyDepth', { n: buyAvail }) }}</div>
                <div class="rld__ladderwrap">
                  <div class="rld__ladder">
                    <span v-for="(l, i) in buyQuote.levels" :key="i" class="rld__rung">{{ fmtPlat(l.price) }}p<small>×{{ l.take }}</small></span>
                  </div>
                </div>
              </template>
              <div v-else class="rld__quote-val is-none">{{ t('relicsValue.dialog.bulk.noSellers') }}</div>
            </div>
          </div>
        </section>

        <!-- Drops: everything this relic can yield, ranked by what it realistically adds -->
        <section class="rld__sec">
          <div class="rld__sec-head">
            <span class="rld__sec-title">{{ t('relicsValue.dialog.dropsTitle') }}</span>
            <span class="rld__sec-hint">{{ t('relicsValue.dialog.dropsHint') }}</span>
          </div>
          <ul class="rld__drops">
            <li v-for="(d, i) in sortedRewards" :key="i" class="rld__drop">
              <img class="rld__drop-thumb" :src="rewardThumb(d)" :alt="d.item_name" @error="onImgError" />
              <div class="rld__drop-main">
                <a
                  v-if="d.url_name"
                  class="rld__drop-name"
                  :href="'https://warframe.market/items/' + d.url_name"
                  target="_blank"
                  rel="noopener"
                  :title="t('relicsValue.dialog.openMarket')"
                >{{ d.item_name }}</a>
                <span v-else class="rld__drop-name is-plain">{{ d.item_name }}</span>
                <span v-if="rewardVaulted(d)" class="rld__vtag">{{ t('relicsValue.tags.vaulted') }}</span>
                <span class="rld__drop-meta">
                  <i class="rld__dot" :style="{ background: rarityColor(d.rarity) }"></i>{{ d.rarity }} · {{ chanceOf(d) }}%
                </span>
              </div>
              <div class="rld__drop-num">
                <span class="rld__drop-price">{{ fmtPlat(rewardBasis(d)) }}p</span>
                <span class="rld__drop-vol">{{ t('relicsValue.dialog.volShort') }} {{ fmtInt(d.volume) }}</span>
              </div>
              <div class="rld__drop-contrib" :title="t('relicsValue.dialog.contribTip')">
                <span class="rld__contrib-val">+{{ fmtPlatFine(contribOf(d)) }}p</span>
                <span class="rld__contrib-lbl">{{ t('relicsValue.dialog.contribLbl') }}</span>
              </div>
              <button
                class="rld__drop-drops"
                type="button"
                :title="t('relicsValue.dialog.whereDrops', { name: d.item_name })"
                @click="$emit('open-item', d.item_name, d.thumb || '')"
              >
                <v-icon size="17">mdi-map-marker-radius-outline</v-icon>
              </button>
            </li>
          </ul>
        </section>
      </div>

      <!-- Everywhere else this relic lives -->
      <footer class="rld__foot">
        <nuxt-link class="rld__link rld__link--go" :to="'/relic/' + relic.url_name" @click="close">
          <v-icon size="15">mdi-file-document-outline</v-icon> {{ t('relicsValue.dialog.footer.detail') }}
        </nuxt-link>
        <a class="rld__link" :href="'https://warframe.market/items/' + relic.url_name" target="_blank" rel="noopener">
          <v-icon size="15">mdi-cart-outline</v-icon> {{ t('relicsValue.dialog.footer.market') }}
        </a>
        <a v-if="wikiUrl" class="rld__link" :href="wikiUrl" target="_blank" rel="noopener noreferrer">
          <v-icon size="15">mdi-book-open-variant</v-icon> {{ t('relicsValue.dialog.footer.wiki') }}
        </a>
        <a class="rld__link" :href="dropTableUrl" target="_blank" rel="noopener noreferrer">
          <v-icon size="15">mdi-open-in-new</v-icon> {{ t('relicsValue.dialog.footer.dropTable') }}
        </a>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  RELIC_CHANCES,
  useRelicValue,
  type RelicReward,
  type RelicRow,
} from '~/composables/useRelicValue'
import { availableUnits, bulkBuy, bulkSell, type OrderBook } from '~/composables/useOrderBook'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    relic?: RelicRow | null
    refinement?: string
  }>(),
  { modelValue: false, relic: null, refinement: 'Radiant' },
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'open-item', itemName: string, thumb: string): void
}>()

const { t } = useI18n()
const { itemThumb, THUMB_PLACEHOLDER } = useItemThumb()
const apiBase = useApiBase()

// The dialog owns its refinement so you can flip the odds inside the popup; it
// seeds from the page's choice each time it opens (watch below).
const refinement = ref(props.refinement)
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      refinement.value = props.refinement || 'Radiant'
      qty.value = 1
      loadBook()
    }
  },
)
watch(
  () => props.refinement,
  (r) => {
    if (props.modelValue && r) refinement.value = r
  },
)

const { ev, relicSellNow, rewardBasis, effectivePrice, rewardVaulted, fmtPlat } =
  useRelicValue(refinement)

const relicRef = computed<RelicRow | null>(() => props.relic ?? null)
const mkt = computed<any>(() => relicRef.value?.relic || {})
const open = computed(() => (relicRef.value ? ev(relicRef.value) : 0))
const sellNow = computed(() => relicSellNow(relicRef.value))

// A bid well above the going rate is the pathology this page fixes — surface it
// so the number reads as deliberate, not broken.
const bidInflated = computed(() => {
  const bid = Number(mkt.value.buy) || 0
  return bid > 0 && sellNow.value > 0 && bid > sellNow.value * 1.35
})

// --- Bulk buy/sell modeler -------------------------------------------------
// Fetch the live order book on open and walk it to price a chosen quantity, the
// way you'd actually fill it (cheap asks run out; bait bids are skipped). Maths
// lives in useOrderBook; here we only fetch and bind.
const qty = ref(1)
const book = ref<OrderBook | null>(null)
const bookLoading = ref(false)
const bookError = ref(false)
let bookFor = ''

async function loadBook() {
  const rel = relicRef.value
  if (!rel?.url_name) return
  if (bookFor === rel.url_name && book.value) return // already have this relic's book
  bookLoading.value = true
  bookError.value = false
  try {
    book.value = await $fetch<OrderBook>(`${apiBase}/orders/${encodeURIComponent(rel.url_name)}`)
    bookFor = rel.url_name
  } catch {
    bookError.value = true
    book.value = null
  } finally {
    bookLoading.value = false
  }
}

// The realistic anchor the walker uses to judge bait (bids far above it) and
// troll listings (asks far below it).
const goingRate = computed(() => relicSellNow(relicRef.value) || Number(mkt.value.avgPrice) || 0)
const sellQuote = computed(() => (book.value ? bulkSell(book.value, qty.value, goingRate.value) : null))
const buyQuote = computed(() => (book.value ? bulkBuy(book.value, qty.value, goingRate.value) : null))
const sellAvail = computed(() => (book.value ? availableUnits(book.value, 'sell', goingRate.value) : 0))
const buyAvail = computed(() => (book.value ? availableUnits(book.value, 'buy', goingRate.value) : 0))
// Book present but no stored levels yet — an item synced before depth capture
// shipped. Fills in on its next price sync.
const bookEmpty = computed(() => !!book.value && !book.value.buy.length && !book.value.sell.length)
function stepQty(d: number) {
  qty.value = Math.max(1, Math.min(999, (Number(qty.value) || 1) + d))
}
function normalizeQty() {
  const v = Math.floor(Number(qty.value) || 1)
  qty.value = Math.max(1, Math.min(999, v))
}

const refineOptions = computed(() => [
  { value: 'Intact', label: t('relicsValue.filters.intact') },
  { value: 'Radiant', label: t('relicsValue.filters.radiant') },
])
const refinementLabel = computed(() =>
  refinement.value === 'Radiant' ? t('relicsValue.filters.radiant') : t('relicsValue.filters.intact'),
)

const verdict = computed(() => {
  const o = open.value
  const s = sellNow.value
  if (o > s + 0.5)
    return { side: 'crack', cls: 'is-good', label: t('relicsValue.verdict.crack'), margin: t('relicsValue.verdict.crackAmount', { n: fmtPlat(o - s) }) }
  if (s > o + 0.5)
    return { side: 'sell', cls: 'is-alt', label: t('relicsValue.verdict.sell'), margin: t('relicsValue.verdict.sellAmount', { n: fmtPlat(s - o) }) }
  return { side: 'even', cls: 'is-even', label: t('relicsValue.verdict.even'), margin: '' }
})

// Fixed refinement chance for a reward's rarity (Common/Uncommon/Rare).
function chanceOf(r: RelicReward): string {
  const table = RELIC_CHANCES[refinement.value] ?? RELIC_CHANCES.Intact ?? {}
  const key = (r.rarity || '').charAt(0).toUpperCase() + (r.rarity || '').slice(1).toLowerCase()
  const c = Number(table[key]) || 0
  return c >= 10 ? c.toFixed(0) : c.toFixed(2).replace(/\.?0+$/, '')
}
// Realizable plat this drop adds to the relic's EV (chance × liquidity-weighted value).
function contribOf(r: RelicReward): number {
  const table = RELIC_CHANCES[refinement.value] ?? RELIC_CHANCES.Intact ?? {}
  const key = (r.rarity || '').charAt(0).toUpperCase() + (r.rarity || '').slice(1).toLowerCase()
  return ((Number(table[key]) || 0) / 100) * effectivePrice(r)
}
// Drops sorted by what they realistically contribute — the earners on top.
const sortedRewards = computed<RelicReward[]>(() =>
  [...(relicRef.value?.rewards || [])].sort((a, b) => contribOf(b) - contribOf(a)),
)

const headThumb = computed(() =>
  relicRef.value ? itemThumb({ urlName: relicRef.value.url_name, itemName: relicRef.value.relicName, thumb: relicRef.value.thumb }) : THUMB_PLACEHOLDER,
)
const hasHeadThumb = computed(() => headThumb.value !== THUMB_PLACEHOLDER)
function rewardThumb(r: RelicReward): string {
  return itemThumb({ urlName: r.url_name, itemName: r.item_name, thumb: r.thumb })
}

const wikiUrl = computed(() => (relicRef.value ? itemWikiUrl(relicRef.value.relicName + ' (Relic)') : ''))
const dropTableUrl = computed(() => {
  const name = relicRef.value ? relicRef.value.relicName + ' Relic' : ''
  return `https://drops.warframestat.us/#/search/${encodeURIComponent(name)}/relics/regex`
})

function close() {
  emit('update:modelValue', false)
}
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement | null
  if (img) img.style.display = 'none'
}
function fmtInt(n: any): string {
  return String(Math.round(Number(n) || 0))
}
// One decimal for the tiny per-drop contributions (many are < 1p).
function fmtPlatFine(n: any): string {
  const v = Number(n) || 0
  return v >= 10 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1).replace(/\.0$/, '')
}
function rarityColor(rarity: string): string {
  const r = (rarity || '').toLowerCase()
  if (r === 'legendary') return '#35d6d0'
  if (r === 'rare') return '#e7cf95'
  if (r === 'uncommon') return '#b6c0cc'
  return '#c08457'
}
</script>

<style scoped>
.rld {
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
/* The dialog body never scrolls sideways — long labels wrap, and any genuinely
   wide sub-content (the bulk ladder) scrolls inside its own container instead. */
.rld__body {
  min-width: 0;
}
.rld__mlbl,
.rld__mval,
.rld__quote-lbl,
.rld__drop-vol,
.rld__contrib-lbl {
  overflow-wrap: anywhere;
}

/* Header */
.rld__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.22);
}
.rld__node {
  width: 11px;
  height: 11px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.7);
  flex: none;
}
.rld__thumb {
  width: 46px;
  height: 46px;
  object-fit: contain;
  flex: none;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.rld__headtext { min-width: 0; flex: 1; }
.rld__eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.64rem;
  color: #8f95ab;
}
.rld__title {
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  line-height: 1.15;
  color: #e7cf95;
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}
.rld__badge {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 3px;
}
.rld__badge--vault { background: rgba(138, 143, 163, 0.18); color: #b6bcd0; border: 1px solid rgba(138, 143, 163, 0.4); }
.rld__badge--res { background: rgba(159, 122, 234, 0.16); color: #c4b0ee; border: 1px solid rgba(159, 122, 234, 0.42); }
.rld__sub {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.8rem;
  color: #8f95ab;
  margin-top: 3px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.rld__close {
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
.rld__close:hover { color: #e7cf95; border-color: rgba(200, 168, 92, 0.5); }
.rld__close:focus-visible { outline: 2px solid #35d6d0; outline-offset: 2px; }

.rld__body { padding: 16px 20px; overflow-y: auto; overflow-x: hidden; }

/* Ledger — the crack-vs-cash balance, this dialog's signature */
.rld__ledger {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  gap: 8px;
  border: 1px solid rgba(200, 168, 92, 0.2);
  background: rgba(255, 255, 255, 0.015);
  padding: 4px;
}
.rld__pan {
  padding: 14px 12px;
  text-align: center;
  border: 1px solid transparent;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.rld__pan.is-win {
  background: rgba(200, 168, 92, 0.08);
  border-color: rgba(200, 168, 92, 0.32);
}
.rld__ledger.is-sell .rld__pan.is-win { background: rgba(79, 179, 191, 0.09); border-color: rgba(79, 179, 191, 0.34); }
.rld__pan-lbl {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  font-size: 0.66rem;
  color: #8f95ab;
}
.rld__pan-val {
  font-family: 'Cinzel', serif;
  font-size: 1.85rem;
  line-height: 1.1;
  color: #eef1f8;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.rld__pan-val span { font-size: 0.9rem; color: #9aa0b8; margin-left: 2px; }
.rld__pan.is-win .rld__pan-val { color: #e7cf95; }
.rld__ledger.is-sell .rld__pan.is-win .rld__pan-val { color: #7fd8df; }
.rld__pan-note { font-size: 0.66rem; color: #6f758c; margin-top: 5px; }
.rld__vs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 6px;
  min-width: 82px;
}
.rld__vs-mark {
  width: 9px; height: 9px; background: #6f7796; transform: rotate(45deg); flex: none;
}
.rld__vs-txt {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  font-size: 0.86rem;
}
.rld__vs-txt.is-good { color: #7bd6a4; }
.rld__vs-txt.is-alt { color: #4fb3bf; }
.rld__vs-txt.is-even { color: #b6bcd0; }
.rld__vs-amt { font-size: 0.68rem; color: #8f95ab; text-align: center; }

/* Refinement toggle */
.rld__refine-row { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.rld__refine-lbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.1em; font-size: 0.66rem; color: #8f95ab;
}
.rld__refine-toggle {
  display: inline-flex;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.rld__refine-btn {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 0.82rem;
  color: #b6bcd0;
  background: transparent;
  border: none;
  padding: 5px 16px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.rld__refine-btn:hover { color: #e7cf95; }
.rld__refine-btn.is-on { background: rgba(212, 175, 90, 0.9); color: #17131f; }
.rld__refine-btn:focus-visible { outline: 2px solid #35d6d0; outline-offset: -2px; }

/* Market book */
.rld__market {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 8px 14px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(200, 168, 92, 0.16);
  background: rgba(200, 168, 92, 0.03);
}
.rld__mstat { display: flex; flex-direction: column; min-width: 0; }
.rld__mlbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.1em; font-size: 0.6rem; color: #8f95ab;
}
.rld__mval { font-variant-numeric: tabular-nums; color: #eef1f8; font-size: 0.98rem; font-weight: 600; }
.rld__mstat.is-strong .rld__mval { color: #e7cf95; }
.rld__mval.is-thin { color: #e0a3a3; }
.rld__flag {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.74rem;
  color: #d9b45a;
  margin: 9px 2px 0;
  line-height: 1.4;
}

/* Bulk buy/sell modeler */
.rld__bulk {
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid rgba(79, 179, 191, 0.18);
  background: rgba(79, 179, 191, 0.03);
}
.rld__bulk-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 10px;
}
.rld__qty { display: inline-flex; align-items: center; gap: 6px; }
.rld__qty-btn {
  width: 26px; height: 26px; flex: none;
  display: grid; place-items: center;
  font-size: 1.1rem; line-height: 1;
  color: #cfe9e7; background: rgba(79, 179, 191, 0.1);
  border: 1px solid rgba(79, 179, 191, 0.3); border-radius: 6px;
  cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
}
.rld__qty-btn:hover:not(:disabled) { background: rgba(79, 179, 191, 0.22); color: #fff; }
.rld__qty-btn:disabled { opacity: 0.4; cursor: default; }
.rld__qty-btn:focus-visible { outline: 2px solid #35d6d0; outline-offset: 2px; }
.rld__qty-in {
  width: 58px; text-align: center;
  font-variant-numeric: tabular-nums; font-size: 0.98rem; font-weight: 700;
  color: #eef1f8; background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 6px;
  padding: 4px 6px;
}
.rld__qty-in:focus-visible { outline: 2px solid #35d6d0; outline-offset: 1px; }
.rld__qty-lbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.08em; font-size: 0.68rem; color: #8f95ab;
}
.rld__bulk-state {
  font-family: 'Rajdhani', sans-serif; font-size: 0.86rem; color: #8f95ab;
  display: flex; align-items: center; gap: 12px; padding: 6px 0;
}
.rld__retry {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.06em;
  color: #17130a; background: #c8a85c; border: none; padding: 4px 14px; font-weight: 700; cursor: pointer;
}
.rld__retry:hover { background: #e7cf95; }
.rld__bulk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.rld__quote {
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.014);
  border-radius: 4px;
}
.rld__quote--sell { border-left: 2px solid #4fb3bf; }
.rld__quote--buy { border-left: 2px solid #c8a85c; }
.rld__quote-lbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.06em; font-size: 0.66rem; color: #8f95ab;
}
.rld__quote-val {
  font-family: 'Cinzel', serif; font-size: 1.5rem; line-height: 1.1;
  color: #eef1f8; margin-top: 3px; font-variant-numeric: tabular-nums;
}
.rld__quote-val span { font-size: 0.72rem; color: #9aa0b8; margin-left: 3px; }
.rld__quote--sell .rld__quote-val { color: #7fd8df; }
.rld__quote--buy .rld__quote-val { color: #e7cf95; }
.rld__quote-val.is-none { font-family: 'Rajdhani', sans-serif; font-size: 0.9rem; color: #8f95ab; font-style: italic; }
.rld__quote-sub { font-size: 0.76rem; color: #b6bcd0; margin-top: 3px; font-variant-numeric: tabular-nums; }
.rld__quote-warn { font-size: 0.7rem; color: #e0a35a; margin-top: 4px; }
.rld__quote-note { font-size: 0.66rem; color: #6f758c; margin-top: 5px; }
/* The one genuinely-wide element — the fill ladder — scrolls on its own axis
   so the dialog body never has to. */
.rld__ladderwrap { overflow-x: auto; margin-top: 7px; padding-bottom: 2px; }
.rld__ladder { display: inline-flex; gap: 5px; white-space: nowrap; }
.rld__rung {
  flex: none;
  font-size: 0.7rem; font-variant-numeric: tabular-nums; color: #cfd4e4;
  background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px; padding: 2px 6px;
}
.rld__rung small { color: #7f879c; margin-left: 1px; }

/* Drops */
.rld__sec { margin-top: 18px; }
.rld__sec-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 9px; flex-wrap: wrap; }
.rld__sec-title {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.8rem;
  color: #c8a85c;
}
.rld__sec-hint { font-size: 0.72rem; color: #6f758c; }
.rld__drops { list-style: none; padding: 0; margin: 0; }
.rld__drop {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.rld__drop:hover { background: rgba(200, 168, 92, 0.045); }
.rld__drop-thumb {
  width: 34px; height: 34px; object-fit: contain; flex: none;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(200, 168, 92, 0.22);
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.rld__drop-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.rld__drop-name {
  color: #dfe3f0; font-weight: 600; font-size: 0.94rem; text-decoration: none;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
}
a.rld__drop-name:hover { color: #7ff0eb; text-decoration: underline; }
.rld__drop-name.is-plain { color: #b6bcd0; }
.rld__vtag {
  display: inline-block; width: fit-content;
  font-size: 0.58rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
  color: #b6bcd0; background: rgba(138, 143, 163, 0.16);
  border: 1px solid rgba(138, 143, 163, 0.38); border-radius: 4px; padding: 0 5px;
}
.rld__drop-meta {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.74rem; color: #8f95ab;
}
.rld__dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
.rld__drop-num { text-align: right; flex: none; display: flex; flex-direction: column; }
.rld__drop-price { font-variant-numeric: tabular-nums; color: #eef1f8; font-size: 0.94rem; font-weight: 600; }
.rld__drop-vol { font-size: 0.66rem; color: #6f758c; text-transform: uppercase; letter-spacing: 0.05em; }
.rld__drop-contrib {
  text-align: right; flex: none; display: flex; flex-direction: column;
  min-width: 62px;
}
.rld__contrib-val { font-variant-numeric: tabular-nums; color: #7bd6a4; font-size: 0.9rem; font-weight: 700; }
.rld__contrib-lbl { font-size: 0.6rem; color: #6f758c; text-transform: uppercase; letter-spacing: 0.05em; }
.rld__drop-drops {
  flex: none; color: #4fb3bf; background: transparent;
  border: 1px solid rgba(79, 179, 191, 0.3);
  border-radius: 6px; width: 30px; height: 30px;
  display: grid; place-items: center; cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.rld__drop-drops:hover { color: #d4af5a; border-color: rgba(212, 175, 90, 0.5); background: rgba(212, 175, 90, 0.08); }
.rld__drop-drops:focus-visible { outline: 2px solid #35d6d0; outline-offset: 2px; }

/* Footer links */
.rld__foot {
  padding: 13px 20px;
  border-top: 1px solid rgba(200, 168, 92, 0.22);
  display: flex;
  align-items: center;
  gap: 8px 20px;
  flex-wrap: wrap;
}
.rld__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #8f95ab;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-size: 0.78rem;
  text-decoration: none;
}
.rld__link:hover { color: #35d6d0; }
.rld__link--go { color: #e7cf95; }
.rld__link--go:hover { color: #f6e6b8; }

@media (max-width: 560px) {
  .rld__ledger { grid-template-columns: 1fr; }
  .rld__vs { flex-direction: row; min-width: 0; padding: 4px 0; gap: 10px; }
  .rld__pan-val { font-size: 1.55rem; }
  .rld__bulk-grid { grid-template-columns: 1fr; }
  .rld__drop-contrib { display: none; }
}
</style>
