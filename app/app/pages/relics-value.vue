<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('relicsValue.hero.eyebrow')"
          :name-label="t('relicsValue.table.relic')"
          :columns="[t('relicsValue.table.avgOut'), t('relicsValue.table.evToOpen'), t('relicsValue.table.sellRelic'), t('relicsValue.table.vol')]"
          :rows="fallbackRows"
        />
      </template>
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
              {{ localName('items', topDeal.url_name, topDeal.relicName) }} →
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
              <v-btn-toggle v-model="refinement" mandatory density="comfortable" @update:model-value="onRefinementChange">
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
              @update:model-value="onSortChange"
            ></v-select>
          </div>

          <v-chip-group v-model="tier" mandatory column class="an-cats" @update:model-value="onTierChange">
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
              @update:model-value="onToggle('complete_data', $event)"
            ></v-switch>
            <v-switch
              v-model="onlyOpenWins"
              density="compact"
              hide-details
              inset
              color="#4caf7d"
              :label="t('relicsValue.filters.onlyWins')"
              @update:model-value="onToggle('only_wins', $event)"
            ></v-switch>
            <v-switch
              v-model="droppingOnly"
              density="compact"
              hide-details
              inset
              color="#4fb3bf"
              :label="t('relicsValue.filters.droppingOnly')"
              @update:model-value="onToggle('dropping_only', $event)"
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
                <th class="col-name an-sortable" :class="{ 'is-sorted': sortKey === 'name' }" :aria-sort="ariaSort('name')" @click="setSort('name')">
                  {{ t('relicsValue.table.relic') }}<span class="an-caret">{{ sortArrow('name') }}</span>
                </th>
                <th class="grp-a an-sortable" :class="{ 'is-sorted': sortKey === 'out' }" :aria-sort="ariaSort('out')" :title="t('relicsValue.table.avgOutTip')" @click="setSort('out')">
                  {{ t('relicsValue.table.avgOut') }}<span class="an-caret">{{ sortArrow('out') }}</span>
                </th>
                <th class="grp-a an-sortable" :class="{ 'is-sorted': sortKey === 'ev' }" :aria-sort="ariaSort('ev')" :title="t('relicsValue.table.evToOpenTip')" @click="setSort('ev')">
                  {{ t('relicsValue.table.evToOpen') }}<span class="an-caret">{{ sortArrow('ev') }}</span>
                </th>
                <th class="grp-b an-sortable" :class="{ 'is-sorted': sortKey === 'sell' }" :aria-sort="ariaSort('sell')" :title="t('relicsValue.table.sellRelicTip')" @click="setSort('sell')">
                  {{ t('relicsValue.table.sellRelic') }}<span class="an-caret">{{ sortArrow('sell') }}</span>
                </th>
                <th class="grp-a an-sortable" :class="{ 'is-sorted': sortKey === 'margin' }" :aria-sort="ariaSort('margin')" @click="setSort('margin')">
                  {{ t('relicsValue.table.verdict') }}<span class="an-caret">{{ sortArrow('margin') }}</span>
                </th>
                <th class="an-sortable" :class="{ 'is-sorted': sortKey === 'demand' }" :aria-sort="ariaSort('demand')" @click="setSort('demand')">
                  {{ t('relicsValue.table.demand') }}<span class="an-caret">{{ sortArrow('demand') }}</span>
                </th>
                <th class="an-sortable" :class="{ 'is-sorted': sortKey === 'topdrop' }" :aria-sort="ariaSort('topdrop')" @click="setSort('topdrop')">
                  {{ t('relicsValue.table.topDrop') }}<span class="an-caret">{{ sortArrow('topdrop') }}</span>
                </th>
                <th class="an-sortable" :class="{ 'is-sorted': sortKey === 'volume' }" :aria-sort="ariaSort('volume')" @click="setSort('volume')">
                  {{ t('relicsValue.table.vol') }}<span class="an-caret">{{ sortArrow('volume') }}</span>
                </th>
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
                  <button
                    type="button"
                    class="an-name an-name--btn"
                    :title="t('relicsValue.table.details', { name: localName('items', row.url_name, row.relicName) })"
                    @click="openDetails(row)"
                  >
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localName('items', row.url_name, row.relicName)" loading="lazy" @error="onImgError" />
                    <span>
                      {{ localName('items', row.url_name, row.relicName) }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('relicsValue.tags.top') }}</span>
                      <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('relicsValue.tags.vaultedBadge') }}</span>
                      <span v-else-if="row.resurgence" class="an-badge an-badge--resurgence" :title="t('relicsValue.tags.resurgenceTitle')">{{ t('relicsValue.tags.resurgence') }}</span>
                      <small class="an-sub">
                        {{ row.tier }} · {{ row.rewards.length }} drops
                        <template v-if="dropMix(row).vaulted"> · <span class="an-vtag">{{ t('relicsValue.tags.vaultedCount', { n: dropMix(row).vaulted }) }}</span></template>
                      </small>
                    </span>
                  </button>
                </td>
                <td class="grp-a an-num an-strong">
                  {{ fmtPlat(evRaw(row)) }}p
                </td>
                <td class="grp-a an-num" :class="{ up: ev(row) > relicSellNow(row) }">
                  {{ fmtPlat(ev(row)) }}p
                </td>
                <td class="grp-b an-num">
                  {{ fmtPlat(relicSellNow(row)) }}p
                  <small
                    v-if="(row.relic.buy || 0) > relicSellNow(row) * 1.35"
                    class="an-bidflag"
                    :title="t('relicsValue.table.bidFlagTip', { bid: fmtPlat(row.relic.buy) })"
                  >{{ t('relicsValue.table.bidFlag', { bid: fmtPlat(row.relic.buy) }) }}</small>
                </td>
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
                  <span class="an-topdrop">{{ localItemName(topDrop(row)) }}</span>
                  <span v-if="rewardVaulted(topDrop(row))" class="an-vtag">{{ t('relicsValue.tags.vaulted') }}</span>
                  <small class="an-sub">{{ fmtPlat(topDrop(row).price) }}p · vol {{ fmtPlat(topDrop(row).volume || 0) }}</small>
                </td>
                <td class="an-num">{{ fmtPlat(row.relic.volume) }}</td>
                <td class="an-actions">
                  <nuxt-link
                    class="an-iconbtn an-iconbtn--go"
                    :to="'/relic/' + row.url_name"
                    :title="t('relicsValue.table.view', { name: localName('items', row.url_name, row.relicName) })"
                    :aria-label="t('relicsValue.table.view', { name: localName('items', row.url_name, row.relicName) })"
                  >
                    <v-icon size="20">mdi-arrow-right-circle</v-icon>
                  </nuxt-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div v-else class="an-cards">
          <div
            v-for="row in paged"
            :key="row.url_name"
            class="an-card"
            :class="{ 'is-top': row.url_name === topDealUrl }"
            role="button"
            tabindex="0"
            :aria-label="t('relicsValue.table.details', { name: localName('items', row.url_name, row.relicName) })"
            @click="openDetails(row)"
            @keydown.enter="openDetails(row)"
            @keydown.space.prevent="openDetails(row)"
          >
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localName('items', row.url_name, row.relicName)" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ localName('items', row.url_name, row.relicName) }}
                  <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('relicsValue.tags.top') }}</span>
                  <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('relicsValue.tags.vaultedBadge') }}</span>
                  <span v-else-if="row.resurgence" class="an-badge an-badge--resurgence" :title="t('relicsValue.tags.resurgenceTitle')">{{ t('relicsValue.tags.resurgence') }}</span>
                </div>
                <small class="an-sub">
                  {{ row.tier }} · {{ row.rewards.length }} drops · vol {{ fmtPlat(row.relic.volume) }}
                  <template v-if="dropMix(row).vaulted"> · <span class="an-vtag">{{ t('relicsValue.tags.vaultedCount', { n: dropMix(row).vaulted }) }}</span></template>
                </small>
              </div>
              <v-icon color="#4fb3bf">mdi-diamond-stone</v-icon>
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
                <div class="an-block__row"><span>{{ t('relicsValue.card.realizableEv') }}</span><b :class="{ up: ev(row) > relicSellNow(row) }">{{ fmtPlat(ev(row)) }}p</b></div>
                <div class="an-block__row"><span>{{ t('relicsValue.card.rawEv') }}</span><b>{{ fmtPlat(evRaw(row)) }}p</b></div>
                <div class="an-block__row"><span>{{ t('relicsValue.card.sellRelic') }}</span><b>{{ fmtPlat(relicSellNow(row)) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('relicsValue.card.topDrop') }}</div>
                <div class="an-block__row"><span>{{ trueRarity(topDrop(row)) }}</span><b>{{ fmtPlat(topDrop(row).price) }}p</b></div>
                <div class="an-block__row an-topdrop-m">
                  <span>{{ localItemName(topDrop(row)) }}</span>
                  <span v-if="rewardVaulted(topDrop(row))" class="an-vtag">{{ t('relicsValue.tags.vaulted') }}</span>
                </div>
              </div>
            </div>
            <nuxt-link class="an-card__full" :to="'/relic/' + row.url_name" @click.stop>
              {{ t('relicsValue.card.fullPage') }} →
            </nuxt-link>
          </div>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <i18n-t keypath="relicsValue.disclaimer.text" tag="span">
          <template #realizable><b>{{ t('relicsValue.disclaimer.realizable') }}</b></template>
          <template #and><i>{{ t('relicsValue.disclaimer.and') }}</i></template>
          <template #refinement>{{ refinementLabel }}</template>
        </i18n-t>
      </v-alert>

      <RelicDetailsDialog
        v-model="detailsOpen"
        :relic="selected"
        :refinement="refinement"
        @open-item="openItemDrops"
      />
      <DropLocationsDialog v-model="dropsOpen" :item-name="dropsItem" :thumb="dropsThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { trueRarity, useRelicValue, type RelicRow } from '~/composables/useRelicValue'

const { t } = useI18n()
const { localName, localItemName } = useLocalizedName()
const { trackAction, trackDialog, trackFilter, trackSearch, trackSort } = useAnalytics()
const base = useApiBase()

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// SSR fetch — preserve old asyncData try/catch -> loadError intent.
const { data, error } = await useAsyncData('relics-ev', () =>
  $fetch<any>(`${base}/relics_ev`),
)
const relics = computed<any[]>(() => (data.value && data.value.relics) || [])
const loadError = computed(() => !!error.value)

// UI state — hydrated from the URL query so any filtered/sorted board is a
// shareable, reload-safe link (see buildQuery + the query-sync watcher below).
// Reading in setup (not onMounted) keeps SSR and the client on the same view.
const route = useRoute()
const router = useRouter()
function qStr(k: string): string | undefined {
  const v = route.query[k]
  const s = Array.isArray(v) ? v[0] : v
  return s ? String(s) : undefined
}
// Every sortable metric + its natural direction (numbers high→low, name A→Z).
const SORT_KEYS = ['out', 'ev', 'margin', 'sell', 'topdrop', 'demand', 'volume', 'name'] as const
type SortKey = (typeof SORT_KEYS)[number]
function naturalDir(k: SortKey): 'asc' | 'desc' {
  return k === 'name' ? 'asc' : 'desc'
}

const search = ref(qStr('q') ?? '')
const tier = ref(qStr('tier') ?? 'All')
const refinement = ref(qStr('ref') === 'Intact' ? 'Intact' : 'Radiant')
// Translated label for the active refinement (value stays 'Intact'/'Radiant').
const refinementLabel = computed(() =>
  refinement.value === 'Radiant'
    ? t('relicsValue.filters.radiant')
    : t('relicsValue.filters.intact'),
)
// Default sort = average expected output per open (raw EV): the plat a crack
// yields on average, Σ (drop chance × market price), highest first.
const initSort = (SORT_KEYS as readonly string[]).includes(qStr('sort') || '')
  ? (qStr('sort') as SortKey)
  : 'out'
const sortKey = ref<SortKey>(initSort)
const sortDir = ref<'asc' | 'desc'>(
  qStr('dir') === 'asc' ? 'asc' : qStr('dir') === 'desc' ? 'desc' : naturalDir(initSort),
)
const onlyOpenWins = ref(qStr('wins') === '1')
// Only value/show relics with full drop + market data by default, so stats and
// verdicts never advertise an EV we can't back with prices.
const completeOnly = ref(qStr('complete') !== '0')
// On by default: this board answers "what's worth cracking right now", and a
// vaulted relic can't be farmed — so lead with what you can actually get.
// Toggle off to value relics you already own (incl. vaulted).
const droppingOnly = ref(qStr('drop') !== '0')
const page = ref(Math.max(1, parseInt(qStr('page') || '1', 10) || 1))
const perPage = 20
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = computed(() => [
  { text: t('relicsValue.filters.sort.out'), value: 'out' },
  { text: t('relicsValue.filters.sort.ev'), value: 'ev' },
  { text: t('relicsValue.filters.sort.margin'), value: 'margin' },
  { text: t('relicsValue.filters.sort.topDrop'), value: 'topdrop' },
  { text: t('relicsValue.filters.sort.demand'), value: 'demand' },
  { text: t('relicsValue.filters.sort.volume'), value: 'volume' },
  { text: t('relicsValue.filters.sort.name'), value: 'name' },
])

// Shared, liquidity-aware valuation (same basis as the Star Chart): each drop is
// discounted by its 48h trade volume, so an overpriced part nobody buys can't
// inflate the "crack it" verdict. `ev` here is the realizable EV.
const { ev, evRaw, topDrop, liquidity, demand, dropMix, rewardVaulted, relicSellNow, isVaulted, isResurgence, hasFullData, fmtPlat } =
  useRelicValue(refinement)

// Relic-details popup — the full drop table, market book and outbound links for
// one relic, without leaving the board.
const detailsOpen = ref(false)
const selected = ref<RelicRow | null>(null)
function openDetails(row: RelicRow) {
  selected.value = row
  detailsOpen.value = true
  // `item_name` (not a bespoke `relic` param) — it is the registered custom
  // dimension every other dialog_open/market_open/view_item uses, so the relic
  // funnel joins up in GA4 instead of landing in an unreportable field.
  trackDialog('relic_details', { item_name: row.relicName, refinement: refinement.value })
}
// Per-drop "where does this part come from" — delegated to the shared
// DropLocationsDialog the farming page already uses.
const dropsOpen = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')
function openItemDrops(name: string, thumb: string) {
  dropsItem.value = name
  dropsThumb.value = thumb || ''
  dropsOpen.value = true
}

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
  // Crack = realizable payout of the drops; sell = the relic's realistic going
  // rate (see relicSellNow — a bait-high bid can't inflate it). Comparing
  // realizable-to-realizable stops an illiquid drop from advising a "crack it"
  // you can't cash out, and a fake bid from advising a "sell it" you can't fill.
  const open = ev(relic)
  const sell = relicSellNow(relic)
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
    if (q && !(r.relicName.toLowerCase().includes(q) || localName('items', r.url_name, r.relicName).toLowerCase().includes(q))) return false
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
// One value per row for the active numeric sort metric. `name` is compared as a
// string separately (below).
function metricVal(r: any, key: SortKey): number {
  switch (key) {
    case 'out': return evRaw(r) // average expected output per open (raw EV)
    case 'ev': return ev(r) // realizable EV (liquidity-weighted)
    case 'margin': return ev(r) - relicSellNow(r) // crack vs sell edge
    case 'sell': return relicSellNow(r)
    case 'topdrop': return Number(topDrop(r).price) || 0
    case 'demand': return liquidity(r)
    case 'volume': return Number(r.relic.volume) || 0
    default: return 0
  }
}
const filtered = computed<any[]>(() => {
  let list = matched.value.filter(passesQuality)
  if (onlyOpenWins.value) list = list.filter((r) => ev(r) > relicSellNow(r))
  const k = sortKey.value
  // `base` is always a descending comparator (higher value / Z first); `flip`
  // reverses it for an ascending sort. Natural default per key: numbers desc,
  // name asc (set by setSort/naturalDir).
  const flip = sortDir.value === 'asc' ? -1 : 1
  return list.slice().sort((a, b) => {
    let base: number
    if (k === 'name') {
      base = b.relicName.localeCompare(a.relicName)
    } else {
      base = metricVal(b, k) - metricVal(a, k)
      if (base === 0) base = evRaw(b) - evRaw(a) // deterministic tiebreak
    }
    return flip * base
  })
})
// Cycle a column's sort: click a new column → its natural direction; click the
// active column → flip direction.
function setSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = naturalDir(key)
  }
  trackSort(key + ':' + sortDir.value)
}
// ▲/▼ indicator on the active header column, blank otherwise.
function sortArrow(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? '▲' : '▼'
}
// Screen-reader sort state for a column header.
function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}
// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): top 150 of the already-filtered/sorted board (EV desc by default).
const fallbackRows = computed(() =>
  filtered.value.slice(0, 40).map((row) => ({
    key: row.url_name,
    href: '/relic/' + row.url_name,
    name: localName('items', row.url_name, row.relicName),
    cells: [fmtPlat(evRaw(row)) + 'p', fmtPlat(ev(row)) + 'p', fmtPlat(relicSellNow(row)) + 'p', fmtPlat(row.relic.volume)],
  })),
)
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
  const openWins = list.filter((r) => ev(r) > relicSellNow(r)).length
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

// --- URL query-sync --------------------------------------------------------
// Mirror the board's state into the query string so a filtered/sorted view is a
// shareable, reload-safe link. Only non-default params are written, for clean
// URLs; the initial read happened in setup (above), so nothing runs until the
// client has mounted (syncReady) to avoid clobbering the hydrated query.
let syncReady = false
let syncTimer: ReturnType<typeof setTimeout> | null = null
function buildQuery(): Record<string, string> {
  const q: Record<string, string> = {}
  const s = (search.value || '').toString().trim()
  if (s) q.q = s
  if (tier.value !== 'All') q.tier = tier.value
  if (refinement.value !== 'Radiant') q.ref = refinement.value
  if (sortKey.value !== 'out') q.sort = sortKey.value
  if (sortDir.value !== naturalDir(sortKey.value)) q.dir = sortDir.value
  if (!completeOnly.value) q.complete = '0'
  if (onlyOpenWins.value) q.wins = '1'
  if (!droppingOnly.value) q.drop = '0'
  if (page.value > 1) q.page = String(page.value)
  return q
}
watch(
  [search, tier, refinement, sortKey, sortDir, completeOnly, onlyOpenWins, droppingOnly, page],
  () => {
    if (!syncReady) return
    if (syncTimer) clearTimeout(syncTimer)
    // Debounce so a burst of changes (typing, toggling) rewrites the URL once.
    syncTimer = setTimeout(() => {
      router.replace({ query: buildQuery() }).catch(() => {})
    }, 250)
  },
)

// --- Analytics hooks -------------------------------------------------------
// The board's controls are what tell us which lens people actually trade by, so
// each one reports as a single parameterised filter_apply. The search box is the
// exception: it is debounced well past typing speed so a query is one `search`
// hit (with the result count it produced) instead of one per keystroke.
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  const term = (q || '').toString().trim()
  if (!term) return
  searchTimer = setTimeout(() => trackSearch(term, filtered.value.length), 700)
})
// Drop a pending debounce when the page goes away: `tool` is resolved from the
// live route, so a timer that survives the navigation would file the search
// under whatever page the user landed on.
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (syncTimer) clearTimeout(syncTimer)
})
function onRefinementChange(v: string | null) {
  if (v) trackFilter('refinement', v)
}
function onTierChange(v: any) {
  trackFilter('tier', String(v ?? 'All'))
}
// Dropdown picks a metric; snap to its natural direction (the header caret then
// toggles it). `sortKey` is already updated by the v-model before this fires.
function onSortChange(v: any) {
  const key = (String(v ?? 'out') as SortKey)
  sortDir.value = naturalDir(key)
  trackSort(key + ':' + sortDir.value)
}
function onToggle(name: string, v: any) {
  trackFilter(name, !!v)
}
function onPageChange(p: number) {
  trackAction('page_change', { page: p })
}

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
  // Only start writing the URL after mount, so hydrating a shared link doesn't
  // immediately rewrite it on first paint.
  syncReady = true
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
/* Row actions: open the details popup, or jump to the full relic page. */
.an-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
}
.an-iconbtn {
  flex: none;
  color: #4fb3bf;
  background: transparent;
  border: 1px solid rgba(79, 179, 191, 0.35);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.an-iconbtn:hover {
  color: #d4af5a;
  border-color: rgba(212, 175, 90, 0.5);
  background: rgba(212, 175, 90, 0.08);
}
.an-iconbtn:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 2px;
}
.an-iconbtn--go {
  color: #d4af5a;
  border-color: rgba(212, 175, 90, 0.4);
}
.an-iconbtn--go:hover {
  color: #f0d79a;
}
/* Inline warning when the relic's top bid sits far above its realistic sell
   price — the value nobody actually fills. */
.an-bidflag {
  display: block;
  font-size: 0.62rem;
  color: #9aa0b4;
  letter-spacing: 0.02em;
  margin-top: 2px;
  white-space: nowrap;
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
/* Sortable column headers — click to sort, click again to flip direction. */
.an-sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: color 0.15s ease;
}
.an-sortable:hover,
.an-sortable.is-sorted {
  color: #e7cf95;
}
.an-caret {
  display: inline-block;
  width: 0.9em;
  margin-left: 3px;
  font-size: 0.72em;
  color: #d4af5a;
}
/* Relic name is now a button (opens the details popup) but must read as the old
   link: strip native chrome, keep the flex thumb+text layout from .an-name. */
.an-name--btn {
  background: none;
  border: 0;
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.an-name--btn:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 2px;
}
/* Mobile card is now a button (opens the popup); keep pointer + focus ring. The
   inner full-page link escapes the card click via @click.stop. */
.an-cards .an-card[role='button'] {
  cursor: pointer;
}
.an-cards .an-card[role='button']:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 2px;
}
.an-card__full {
  display: inline-block;
  margin-top: 10px;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-size: 0.78rem;
  color: #e7cf95;
  text-decoration: none;
}
.an-card__full:hover {
  color: #f6e6b8;
}
</style>
