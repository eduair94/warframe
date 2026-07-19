<template>
  <div class="sid">
    <!-- Every basis for THIS item, so a suspicious headline number can be
         checked against the readings that disagree with it. -->
    <section class="sid__sec">
      <div class="sid__lbl">{{ t('setDetail.detail.allBases') }}</div>
      <div class="sid__bases">
        <div v-for="b in bases" :key="b.key" class="sid__basis" :class="{ 'is-off': !b.has }">
          <span class="sid__basis-lbl">{{ t('setDetail.basis.' + b.key) }}</span>
          <span class="sid__basis-val">
            <template v-if="b.has">{{ fmtPlat(b.acquire) }}p</template>
            <template v-else>—</template>
          </span>
          <small v-if="b.has" class="sid__basis-sub">{{ fmtPlat(b.resale) }}p {{ t('setDetail.detail.resaleShort') }}</small>
        </div>
      </div>
    </section>

    <div class="sid__cols">
      <!-- 48h traded range -->
      <section class="sid__sec">
        <div class="sid__lbl">{{ t('setDetail.detail.range48h') }}</div>
        <div v-if="lastCompleted" class="sid__kv">
          <div class="sid__row"><span>{{ t('setDetail.detail.low') }}</span><b>{{ plat(lastCompleted.min_price) }}p</b></div>
          <div class="sid__row"><span>{{ t('setDetail.detail.high') }}</span><b>{{ plat(lastCompleted.max_price) }}p</b></div>
          <div class="sid__row"><span>{{ t('setDetail.basis.median') }}</span><b>{{ plat(lastCompleted.median) }}p</b></div>
          <div v-if="lastCompleted.moving_avg" class="sid__row">
            <span>{{ t('setDetail.detail.movingAvg') }}</span><b>{{ plat(lastCompleted.moving_avg) }}p</b>
          </div>
        </div>
        <p v-else class="sid__none">{{ t('setDetail.detail.noTrades') }}</p>
      </section>

      <!-- Order-book ladder -->
      <section class="sid__sec">
        <div class="sid__lbl">{{ t('setDetail.detail.book') }}</div>
        <div v-if="hasBook" class="sid__book">
          <div class="sid__side">
            <div class="sid__side-lbl">{{ t('setDetail.detail.asks') }}</div>
            <div v-for="(lv, i) in asks" :key="'a' + i" class="sid__lvl">
              <b>{{ fmtPlat(lv.price) }}p</b><span>×{{ lv.quantity }}</span>
            </div>
          </div>
          <div class="sid__side">
            <div class="sid__side-lbl">{{ t('setDetail.detail.bids') }}</div>
            <div v-for="(lv, i) in bids" :key="'b' + i" class="sid__lvl">
              <b>{{ fmtPlat(lv.price) }}p</b><span>×{{ lv.quantity }}</span>
            </div>
          </div>
        </div>
        <p v-else class="sid__none">{{ t('setDetail.detail.noBook') }}</p>
      </section>

      <!-- 30-day series -->
      <section class="sid__sec">
        <div class="sid__lbl">{{ t('setDetail.detail.history', { days: points.length }) }}</div>
        <div v-if="points.length >= 2" class="sid__hist">
          <PriceSpark
            :values="points.map((p) => p.avg_price)"
            :direction="row.node.history?.trend?.direction || 'flat'"
            :width="200"
            :height="46"
            :aria-label="t('setDetail.detail.history', { days: points.length })"
          />
          <div class="sid__histmeta">
            <span :class="trendClass">{{ trendLabel }}</span>
            <small>{{ points[0]?.date }} → {{ points[points.length - 1]?.date }}</small>
          </div>
        </div>
        <p v-else class="sid__none">{{ t('setDetail.detail.noHistory') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Expanded per-item panel for the set ledger.
 *
 * Shows the numbers the headline row has to compress away: what every pricing
 * basis says about this one item, the 48h traded range, the top of the stored
 * order book, and the 30-day series. Read-only — all maths comes from
 * useSetPricing so the panel cannot disagree with the row above it.
 */
import { computed } from 'vue'
import { fmtPlat } from '~/composables/marketFormat'
import { priceOn, BASIS_KEYS, type LedgerRow } from '~/composables/useSetPricing'

const props = defineProps<{ row: LedgerRow }>()

const { t } = useI18n()

/** Top of book only — the ladder can hold 15 levels a side, which is noise here. */
const BOOK_LEVELS = 5

/** fmtPlat, tolerant of the optional fields on a statistics datapoint. */
function plat(n: number | undefined): string {
  return fmtPlat(Number(n) || 0)
}

const bases = computed(() =>
  BASIS_KEYS.map((key) => {
    const p = priceOn(props.row.node, key, props.row.quantity)
    return { key, acquire: p.acquire, resale: p.resale, has: p.acquire > 0 || p.resale > 0 }
  }),
)

const lastCompleted = computed(() => props.row.node.market?.last_completed || null)

const asks = computed(() => (props.row.node.depth?.sell ?? []).slice(0, BOOK_LEVELS))
const bids = computed(() => (props.row.node.depth?.buy ?? []).slice(0, BOOK_LEVELS))
const hasBook = computed(() => asks.value.length > 0 || bids.value.length > 0)

const points = computed(() => props.row.node.history?.points ?? [])

const trendClass = computed(() => {
  const d = props.row.node.history?.trend?.direction
  return d === 'up' ? 'up' : d === 'down' ? 'down' : 'flat'
})
const trendLabel = computed(() => {
  const pct = props.row.node.history?.trend?.changePercent ?? 0
  const v = Number(pct) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
})
</script>

<style scoped>
.sid {
  padding: 14px 18px 16px;
  border-top: 1px solid var(--line, rgba(255, 255, 255, 0.06));
  /* Self-defence: the panel is embedded inside an .an-table cell, which is
     right-aligned and nowrapped for numeric columns. */
  text-align: left;
  white-space: normal;
}
.sid__sec {
  margin-bottom: 14px;
}
.sid__sec:last-child {
  margin-bottom: 0;
}
.sid__lbl {
  font-family: var(--font-hud, 'Rajdhani', sans-serif);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.62rem;
  color: var(--ink-dim, #868ca6);
  margin-bottom: 7px;
}
.sid__cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 18px 26px;
}

/* All-bases strip */
.sid__bases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(94px, 1fr));
  gap: 8px;
}
.sid__basis {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 9px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.sid__basis.is-off {
  opacity: 0.45;
}
.sid__basis-lbl {
  font-family: var(--font-hud, 'Rajdhani', sans-serif);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.6rem;
  color: var(--ink-dim, #868ca6);
}
.sid__basis-val {
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: 0.98rem;
  color: var(--ink, #eef1f8);
}
.sid__basis-sub {
  font-size: 0.64rem;
  color: var(--ink-dim, #868ca6);
}

/* Key/value blocks */
.sid__kv {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sid__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.82rem;
  color: var(--ink-dim, #868ca6);
}
.sid__row b {
  color: var(--ink, #eef1f8);
  font-variant-numeric: tabular-nums;
}
.sid__none {
  margin: 0;
  font-size: 0.8rem;
  color: var(--ink-dim, #868ca6);
  font-style: italic;
}

/* Order book */
.sid__book {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.sid__side-lbl {
  font-family: var(--font-hud, 'Rajdhani', sans-serif);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.6rem;
  color: var(--ink-dim, #868ca6);
  margin-bottom: 3px;
}
.sid__lvl {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: var(--ink, #eef1f8);
}
.sid__lvl span {
  color: var(--ink-dim, #868ca6);
}

/* History */
.sid__hist {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.sid__histmeta {
  display: flex;
  flex-direction: column;
  font-variant-numeric: tabular-nums;
  font-size: 0.86rem;
}
.sid__histmeta small {
  font-size: 0.64rem;
  color: var(--ink-dim, #868ca6);
}
.up {
  color: var(--energy, #35d6d0);
}
.down {
  color: var(--rose, #d98a8a);
}
.flat {
  color: var(--ink-dim, #868ca6);
}
</style>
