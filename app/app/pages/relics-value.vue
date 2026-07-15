<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('relicsValue.hero.eyebrow') }}</div>
            <i18n-t keypath="relicsValue.hero.title" tag="h1" class="an-title">
              <template #crack><span class="accent-b">{{ t('relicsValue.hero.crack') }}</span></template>
              <template #cash><span class="accent-a">{{ t('relicsValue.hero.cash') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('relicsValue.hero.lede') }}</p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('relicsValue.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(ev(topDeal)) }}<span>p</span></div>
            <nuxt-link class="an-hero__deal-name" :to="'/relic/' + topDeal.url_name">
              {{ topDeal.relicName }} →
            </nuxt-link>
            <div class="an-hero__deal-sub">{{ t('relicsValue.hero.dealSub', { refinement: refinementLabel.toLowerCase() }) }}</div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">{{ t('relicsValue.stats.relics') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.openWins }}</div>
            <div class="an-stat__lbl">{{ t('relicsValue.stats.betterToCrack') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(stats.biggest) }}p</div>
            <div class="an-stat__lbl">{{ t('relicsValue.stats.topPayout') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(stats.avg) }}p</div>
            <div class="an-stat__lbl">{{ t('relicsValue.stats.avgPayout') }}</div>
          </div>
        </div>

        <!-- Filters -->
        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field
              v-model="search"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              :label="t('relicsValue.filters.search')"
              class="an-search"
            ></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">{{ t('relicsValue.filters.refinement') }}</div>
              <v-btn-toggle v-model="refinement" mandatory density="comfortable">
                <v-btn value="Intact" size="small">{{ t('relicsValue.filters.intact') }}</v-btn>
                <v-btn value="Radiant" size="small">{{ t('relicsValue.filters.radiant') }}</v-btn>
              </v-btn-toggle>
            </div>
            <v-select
              v-model="sortKey"
              :items="sortOptions"
              item-title="text"
              item-value="value"
              density="compact"
              hide-details
              :label="t('relicsValue.filters.sortBy')"
              class="an-field"
              style="flex: 0 1 220px"
            ></v-select>
          </div>

          <v-chip-group v-model="tier" mandatory column class="an-cats">
            <v-chip
              v-for="tierName in tierOptions"
              :key="tierName"
              :value="tierName"
              size="small"
              active-class="an-chip--on"
            >
              {{ tierName === 'All' ? t('relicsValue.filters.allTiers') : tierName }}
            </v-chip>
          </v-chip-group>

          <div class="an-toggles">
            <v-switch
              v-model="completeOnly"
              density="compact"
              hide-details
              inset
              color="#4caf7d"
              :label="t('relicsValue.filters.completeData')"
            ></v-switch>
            <v-switch
              v-model="onlyOpenWins"
              density="compact"
              hide-details
              inset
              color="#4caf7d"
              :label="t('relicsValue.filters.onlyWins')"
            ></v-switch>
            <v-switch
              v-model="droppingOnly"
              density="compact"
              hide-details
              inset
              color="#4fb3bf"
              :label="t('relicsValue.filters.droppingOnly')"
            ></v-switch>
          </div>
          <div class="an-count">
            {{ t('relicsValue.filters.count', { n: filtered.length }, filtered.length) }}
            <span v-if="hiddenVaulted" class="an-hidden">{{ t('relicsValue.filters.hiddenVaulted', { n: hiddenVaulted }) }}</span>
            <span v-if="hiddenResurgence" class="an-hidden">{{ t('relicsValue.filters.hiddenResurgence', { n: hiddenResurgence }) }}</span>
            <span v-if="hiddenIncomplete" class="an-hidden">{{ t('relicsValue.filters.hiddenIncomplete', { n: hiddenIncomplete }) }}</span>
          </div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          {{ t('relicsValue.errors.load') }}
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          {{ t('relicsValue.errors.empty') }}
        </div>

        <!-- Desktop table -->
        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('relicsValue.table.relic') }}</th>
                <th class="grp-a">{{ t('relicsValue.table.evToOpen') }}</th>
                <th class="grp-b">{{ t('relicsValue.table.sellRelic') }}</th>
                <th class="grp-a">{{ t('relicsValue.table.verdict') }}</th>
                <th>{{ t('relicsValue.table.demand') }}</th>
                <th>{{ t('relicsValue.table.topDrop') }}</th>
                <th>{{ t('relicsValue.table.vol') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paged"
                :key="row.url_name"
                :class="{ 'is-top': row.url_name === topDealUrl }"
              >
                <td class="col-name">
                  <nuxt-link class="an-name" :to="'/relic/' + row.url_name">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.relicName" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.relicName }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('relicsValue.tags.top') }}</span>
                      <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('relicsValue.tags.vaultedBadge') }}</span>
                      <span v-else-if="row.resurgence" class="an-badge an-badge--resurgence" :title="t('relicsValue.tags.resurgenceTitle')">{{ t('relicsValue.tags.resurgence') }}</span>
                      <small class="an-sub">
                        {{ row.tier }} · {{ row.rewards.length }} drops
                        <template v-if="dropMix(row).vaulted"> · <span class="an-vtag">{{ t('relicsValue.tags.vaultedCount', { n: dropMix(row).vaulted }) }}</span></template>
                      </small>
                    </span>
                  </nuxt-link>
                </td>
                <td class="grp-a an-num an-strong" :class="{ up: ev(row) > row.relic.buy }">
                  {{ fmtPlat(ev(row)) }}p
                </td>
                <td class="grp-b an-num">{{ fmtPlat(row.relic.buy) }}p</td>
                <td class="grp-a">
                  <span class="pill" :class="verdict(row).cls">
                    {{ verdict(row).label }}
                    <b v-if="verdict(row).amount">{{ verdict(row).amount }}</b>
                  </span>
                </td>
                <td>
                  <span class="an-demand" :class="demand(row).cls" :title="t('relicsValue.table.liquidTitle', { pct: Math.round(liquidity(row) * 100) })">
                    <span class="an-demand__bar"><i :style="{ width: Math.round(liquidity(row) * 100) + '%' }"></i></span>
                    {{ demand(row).label }}
                  </span>
                </td>
                <td class="an-num">
                  <span class="an-topdrop">{{ topDrop(row).item_name }}</span>
                  <span v-if="rewardVaulted(topDrop(row))" class="an-vtag">{{ t('relicsValue.tags.vaulted') }}</span>
                  <small class="an-sub">{{ fmtPlat(topDrop(row).price) }}p · vol {{ fmtPlat(topDrop(row).volume || 0) }}</small>
                </td>
                <td class="an-num">{{ fmtPlat(row.relic.volume) }}</td>
                <td>
                  <v-btn icon size="small" color="#4fb3bf" :to="'/relic/' + row.url_name" :aria-label="t('relicsValue.table.view', { name: row.relicName })">
                    <v-icon>mdi-arrow-right-circle</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div v-else class="an-cards">
          <nuxt-link
            v-for="row in paged"
            :key="row.url_name"
            class="an-card"
            :class="{ 'is-top': row.url_name === topDealUrl }"
            :to="'/relic/' + row.url_name"
          >
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.relicName" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ row.relicName }}
                  <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('relicsValue.tags.top') }}</span>
                  <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('relicsValue.tags.vaultedBadge') }}</span>
                  <span v-else-if="row.resurgence" class="an-badge an-badge--resurgence" :title="t('relicsValue.tags.resurgenceTitle')">{{ t('relicsValue.tags.resurgence') }}</span>
                </div>
                <small class="an-sub">
                  {{ row.tier }} · {{ row.rewards.length }} drops · vol {{ fmtPlat(row.relic.volume) }}
                  <template v-if="dropMix(row).vaulted"> · <span class="an-vtag">{{ t('relicsValue.tags.vaultedCount', { n: dropMix(row).vaulted }) }}</span></template>
                </small>
              </div>
              <v-icon color="#4fb3bf">mdi-chevron-right</v-icon>
            </div>
            <div class="an-card__verdict">
              <span class="pill" :class="verdict(row).cls">
                {{ verdict(row).label }}
                <b v-if="verdict(row).amount">{{ verdict(row).amount }}</b>
              </span>
              <span class="an-demand" :class="demand(row).cls">
                <span class="an-demand__bar"><i :style="{ width: Math.round(liquidity(row) * 100) + '%' }"></i></span>
                {{ demand(row).label }}
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('relicsValue.card.open', { refinement: refinementLabel }) }}</div>
                <div class="an-block__row"><span>{{ t('relicsValue.card.realizableEv') }}</span><b :class="{ up: ev(row) > row.relic.buy }">{{ fmtPlat(ev(row)) }}p</b></div>
                <div class="an-block__row"><span>{{ t('relicsValue.card.rawEv') }}</span><b>{{ fmtPlat(evRaw(row)) }}p</b></div>
                <div class="an-block__row"><span>{{ t('relicsValue.card.sellRelic') }}</span><b>{{ fmtPlat(row.relic.buy) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('relicsValue.card.topDrop') }}</div>
                <div class="an-block__row"><span>{{ topDrop(row).rarity }}</span><b>{{ fmtPlat(topDrop(row).price) }}p</b></div>
                <div class="an-block__row an-topdrop-m">
                  <span>{{ topDrop(row).item_name }}</span>
                  <span v-if="rewardVaulted(topDrop(row))" class="an-vtag">{{ t('relicsValue.tags.vaulted') }}</span>
                </div>
              </div>
            </div>
          </nuxt-link>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <i18n-t keypath="relicsValue.disclaimer.text" tag="span">
          <template #realizable><b>{{ t('relicsValue.disclaimer.realizable') }}</b></template>
          <template #and><i>{{ t('relicsValue.disclaimer.and') }}</i></template>
          <template #refinement>{{ refinementLabel }}</template>
        </i18n-t>
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRelicValue, type RelicRow } from '~/composables/useRelicValue'

const { t } = useI18n()
const config = useRuntimeConfig()
const base = config.public.apiURL

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// SSR fetch — preserve old asyncData try/catch -> loadError intent.
const { data, error } = await useAsyncData('relics-ev', () =>
  $fetch<any>(`${base}/relics_ev`),
)
const relics = computed<any[]>(() => (data.value && data.value.relics) || [])
const loadError = computed(() => !!error.value)

// UI state (former data())
const search = ref('')
const tier = ref('All')
const refinement = ref('Radiant')
// Translated label for the active refinement (value stays 'Intact'/'Radiant').
const refinementLabel = computed(() =>
  refinement.value === 'Radiant'
    ? t('relicsValue.filters.radiant')
    : t('relicsValue.filters.intact'),
)
const sortKey = ref('ev')
const onlyOpenWins = ref(false)
// Only value/show relics with full drop + market data by default, so stats and
// verdicts never advertise an EV we can't back with prices.
const completeOnly = ref(true)
// Off by default: you value relics you already *own*, which may be vaulted. Turn
// on to focus the board on relics you can still farm.
const droppingOnly = ref(false)
const page = ref(1)
const perPage = 20
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = computed(() => [
  { text: t('relicsValue.filters.sort.ev'), value: 'ev' },
  { text: t('relicsValue.filters.sort.margin'), value: 'margin' },
  { text: t('relicsValue.filters.sort.demand'), value: 'demand' },
  { text: t('relicsValue.filters.sort.volume'), value: 'volume' },
  { text: t('relicsValue.filters.sort.name'), value: 'name' },
])

// Shared, liquidity-aware valuation (same basis as the Star Chart): each drop is
// discounted by its 48h trade volume, so an overpriced part nobody buys can't
// inflate the "crack it" verdict. `ev` here is the realizable EV.
const { ev, evRaw, topDrop, liquidity, demand, dropMix, rewardVaulted, isVaulted, isResurgence, hasFullData, fmtPlat } =
  useRelicValue(refinement)

// methods
function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function verdict(relic: any): { label: string; amount: string; cls: string } {
  // Crack = realizable payout of the drops; sell = the relic's highest bid (what
  // you'd actually get hitting the market). Comparing realizable-to-realizable
  // stops an illiquid drop from advising a "crack it" you can't cash out.
  const open = ev(relic)
  const sell = relic.relic.buy || 0
  if (open > sell + 0.5) {
    return { label: t('relicsValue.verdict.crack'), amount: t('relicsValue.verdict.crackAmount', { n: fmtPlat(open - sell) }), cls: 'pill--good' }
  }
  if (sell > open + 0.5) {
    return { label: t('relicsValue.verdict.sell'), amount: t('relicsValue.verdict.sellAmount', { n: fmtPlat(sell - open) }), cls: 'pill--alt' }
  }
  return { label: t('relicsValue.verdict.even'), amount: '', cls: 'pill--even' }
}

// computed
const tierOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of relics.value) present.add(r.tier)
  const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
  return ['All', ...order.filter((t) => present.has(t))]
})
// Search + tier only — the base set the completeness filter narrows.
const matched = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  return relics.value.filter((r) => {
    if (q && !r.relicName.toLowerCase().includes(q)) return false
    if (tier.value !== 'All' && r.tier !== tier.value) return false
    return true
  })
})
// Base quality gates shared by stats + the table: full data, and (optionally)
// currently-dropping. `onlyOpenWins` is a table-only lens, applied below.
function passesQuality(r: any): boolean {
  if (completeOnly.value && !hasFullData(r)) return false
  // "Currently dropping" excludes both vaulted relics and Prime Resurgence
  // (Varzia) relics — the latter are Aya-bought, never fissure-dropped, so they
  // don't belong on a "what can I farm right now" view (parity with relic-farming).
  if (droppingOnly.value && (isVaulted(r) || isResurgence(r))) return false
  return true
}
// Relics we'll actually value — so stats never advertise an EV we can't back.
const valuedRelics = computed<any[]>(() => relics.value.filter(passesQuality))
// How many search/tier matches each gate hides.
const hiddenIncomplete = computed<number>(() =>
  completeOnly.value ? matched.value.filter((r) => !hasFullData(r)).length : 0,
)
const hiddenVaulted = computed<number>(() =>
  droppingOnly.value ? matched.value.filter((r) => isVaulted(r)).length : 0,
)
// Prime Resurgence (Varzia) relics the "currently dropping" gate hides — counted
// apart from vaulted since they're a different kind of "not farmable from a run".
const hiddenResurgence = computed<number>(() =>
  droppingOnly.value ? matched.value.filter((r) => !isVaulted(r) && isResurgence(r)).length : 0,
)
const filtered = computed<any[]>(() => {
  let list = matched.value.filter(passesQuality)
  if (onlyOpenWins.value) list = list.filter((r) => ev(r) > r.relic.buy)
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    ev: (a, b) => dir(ev(a), ev(b)),
    margin: (a, b) => dir(ev(a) - a.relic.buy, ev(b) - b.relic.buy),
    demand: (a, b) => dir(liquidity(a), liquidity(b)) || dir(ev(a), ev(b)),
    volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
    name: (a, b) => a.relicName.localeCompare(b.relicName),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.ev)
})
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})
const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of valuedRelics.value) {
    if (!best || ev(r) > ev(best)) best = r
  }
  return best
})
const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) {
    if (!best || ev(r) > ev(best)) best = r
  }
  return best ? best.url_name : ''
})
const stats = computed<any>(() => {
  const list = valuedRelics.value
  const evs = list.map((r) => ev(r))
  const openWins = list.filter((r) => ev(r) > r.relic.buy).length
  return {
    total: list.length,
    openWins,
    biggest: evs.length ? Math.max(...evs) : 0,
    avg: evs.length ? evs.reduce((s, v) => s + v, 0) / evs.length : 0,
  }
})

// reset paging when the filtered set changes
watch(filtered, () => {
  page.value = 1
})

// Hide the global loading spinner once mounted (project rule). Bounded retry:
// the old Options-API version recursed unbounded, so cap the wait here.
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

<style scoped>
.an-refine {
  flex: 0 0 auto;
}
.an-refine__lbl {
  font-size: 0.72rem;
  color: #9aa0b4;
  margin-bottom: 4px;
}
.an-refine :deep(.v-btn-toggle) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.an-refine :deep(.v-btn-toggle .v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) {
  background: rgba(212, 175, 90, 0.9) !important;
  color: #17131f !important;
}
.an-topdrop {
  display: inline-block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  font-weight: 600;
}
.an-topdrop-m {
  min-width: 0;
}
/* Item name: shrink + ellipsize inside the block instead of forcing the grid
   column wider than the card on mobile. */
.an-topdrop-m > span:first-child {
  min-width: 0;
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Keep the "vaulted" tag intact — never ellipsize it. */
.an-topdrop-m > .an-vtag {
  flex: 0 0 auto;
}
.an-hidden {
  color: #9aa0b4;
  margin-left: 6px;
  font-size: 0.92em;
}
/* Verdict row: keep the verdict pill and the demand meter on one tidy line so
   the meter sits next to the pill instead of floating out to the right. */
.an-card__verdict {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
}
/* Demand meter — how much of a relic's payout is actually liquid. */
.an-demand {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
/* "vaulted" tag on an individual scarce drop. */
.an-vtag {
  display: inline-block;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #b6bcd0;
  background: rgba(138, 143, 163, 0.16);
  border: 1px solid rgba(138, 143, 163, 0.38);
  border-radius: 4px;
  padding: 1px 5px;
  vertical-align: middle;
}
.an-demand__bar {
  display: inline-block;
  width: 42px;
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
.an-demand__bar i {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: currentColor;
}
.dem--high {
  color: #4caf7d;
}
.dem--med {
  color: #d4af5a;
}
.dem--low {
  color: #d98a4f;
}
.dem--dead {
  color: #8a8fa3;
}
.an-badge--vault {
  background: rgba(138, 143, 163, 0.18);
  color: #b6bcd0;
  border: 1px solid rgba(138, 143, 163, 0.4);
}
/* Prime Resurgence (Varzia) relic — obtainable, but not from a fissure run. */
.an-badge--resurgence {
  background: rgba(159, 122, 234, 0.16);
  color: #c4b0ee;
  border: 1px solid rgba(159, 122, 234, 0.42);
}
</style>
