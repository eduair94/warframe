<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('relicFarming.eyebrow')"
          :name-label="t('relicFarming.table.relic')"
          :columns="[t('relicFarming.table.platHr'), t('relicFarming.table.ev', { refinement: refinementLabel }), t('relicFarming.table.demand'), t('relicFarming.table.vol')]"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('relicFarming.eyebrow') }}</div>
            <i18n-t keypath="relicFarming.hero.title" tag="h1" class="an-title">
              <template #farm><span class="accent-b">{{ t('relicFarming.hero.titleFarm') }}</span></template>
              <template #platHour><span class="accent-a">{{ t('relicFarming.hero.titlePlatHour') }}</span></template>
            </i18n-t>
            <p class="an-lede">
              {{ t('relicFarming.hero.lede', { refinement: refinementLabel.toLowerCase() }) }}
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('relicFarming.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(platPerHour(topDeal)) }}<span>p/hr</span></div>
            <nuxt-link class="an-hero__deal-name" :to="'/relic/' + topDeal.url_name">
              {{ localName('items', topDeal.url_name, topDeal.relicName) }} →
            </nuxt-link>
            <div class="an-hero__deal-sub">{{ t('relicFarming.hero.dealSub', { refinement: refinementLabel.toLowerCase() }) }}</div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">{{ t('relicFarming.stats.relics') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtPlat(stats.bestPph) }}p</div>
            <div class="an-stat__lbl">{{ t('relicFarming.stats.bestPph') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(stats.avgPph) }}p</div>
            <div class="an-stat__lbl">{{ t('relicFarming.stats.avgPph') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(stats.biggest) }}p</div>
            <div class="an-stat__lbl">{{ t('relicFarming.stats.topPayout') }}</div>
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
              :label="t('relicFarming.filters.search')"
              class="an-search"
            ></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">{{ t('relicFarming.filters.refinement') }}</div>
              <v-btn-toggle v-model="refinement" mandatory density="compact" @update:model-value="onRefinement">
                <v-btn value="Intact" size="small">{{ t('relicFarming.filters.intact') }}</v-btn>
                <v-btn value="Radiant" size="small">{{ t('relicFarming.filters.radiant') }}</v-btn>
              </v-btn-toggle>
            </div>
            <div class="an-mins">
              <div class="an-mins__lbl">
                <i18n-t keypath="relicFarming.filters.minutes" tag="span">
                  <template #mins><b>{{ missionMinutes }}m</b></template>
                </i18n-t>
              </div>
              <v-slider
                v-model="missionMinutes"
                :min="1"
                :max="10"
                :step="0.5"
                thumb-label
                hide-details
                color="#d4af5a"
                track-color="rgba(255,255,255,0.14)"
                class="an-mins__slider"
                @end="onMinutes"
              ></v-slider>
            </div>
            <v-select
              v-model="sortKey"
              :items="sortOptions"
              item-title="text"
              item-value="value"
              density="compact"
              hide-details
              :label="t('relicFarming.filters.sortBy')"
              class="an-field"
              style="flex: 0 1 220px"
              @update:model-value="onSort"
            ></v-select>
          </div>

          <v-chip-group v-model="tier" mandatory column class="an-cats" @update:model-value="onTier">
            <v-chip
              v-for="tv in tierOptions"
              :key="tv"
              :value="tv"
              size="small"
              active-class="an-chip--on"
            >
              {{ tv === 'All' ? t('relicFarming.filters.allTiers') : tv }}
            </v-chip>
          </v-chip-group>

          <div class="an-toggles">
            <v-switch
              v-model="droppingOnly"
              hide-details
              density="compact"
              inset
              color="#4fb3bf"
              :label="t('relicFarming.toggles.dropping')"
              class="an-toggle"
              @update:model-value="onToggle('dropping_only', $event)"
            ></v-switch>
            <v-switch
              v-model="hideNoDemand"
              hide-details
              density="compact"
              inset
              color="#4fb3bf"
              :label="t('relicFarming.toggles.hideNoDemand')"
              class="an-toggle"
              @update:model-value="onToggle('hide_no_demand', $event)"
            ></v-switch>
            <v-switch
              v-model="completeOnly"
              hide-details
              density="compact"
              inset
              color="#d4af5a"
              :label="t('relicFarming.toggles.fullData')"
              class="an-toggle"
              @update:model-value="onToggle('complete_only', $event)"
            ></v-switch>
          </div>

          <div class="an-count">
            {{ t('relicFarming.count', { n: filtered.length }, filtered.length) }}
            <span v-if="hiddenVaulted" class="an-hidden">{{ t('relicFarming.hidden.vaulted', { n: hiddenVaulted }) }}</span>
            <span v-if="hiddenResurgence" class="an-hidden">{{ t('relicFarming.hidden.resurgence', { n: hiddenResurgence }) }}</span>
            <span v-if="hiddenNoDemand" class="an-hidden">{{ t('relicFarming.hidden.noDemand', { n: hiddenNoDemand }) }}</span>
            <span v-if="hiddenIncomplete" class="an-hidden">{{ t('relicFarming.hidden.incomplete', { n: hiddenIncomplete }) }}</span>
          </div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          {{ t('relicFarming.errors.load') }}
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          {{ t('relicFarming.errors.empty') }}
        </div>

        <!-- Desktop table -->
        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('relicFarming.table.relic') }}</th>
                <th class="grp-a">{{ t('relicFarming.table.platHr') }}</th>
                <th class="grp-b">{{ t('relicFarming.table.ev', { refinement: refinementLabel }) }}</th>
                <th>{{ t('relicFarming.table.demand') }}</th>
                <th>{{ t('relicFarming.table.topDrop') }}</th>
                <th>{{ t('relicFarming.table.vol') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paged"
                :key="row.url_name"
                :class="{ 'is-top': row.url_name === topDealUrl }"
              >
                <td class="col-name">
                  <div class="an-namewrap">
                    <nuxt-link class="an-name" :to="'/relic/' + row.url_name">
                      <img class="an-thumb" :src="relicThumb(row)" :alt="localName('items', row.url_name, row.relicName)" loading="lazy" @error="onImgError" />
                      <span>
                        {{ localName('items', row.url_name, row.relicName) }}
                        <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('relicFarming.tags.top') }}</span>
                        <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('relicFarming.tags.vaultedBadge') }}</span>
                        <span v-else-if="row.resurgence" class="an-badge an-badge--resurgence" :title="t('relicFarming.tags.resurgenceTitle')">{{ t('relicFarming.tags.resurgence') }}</span>
                        <small class="an-sub">
                          {{ row.tier }} · {{ t('relicFarming.row.drops', { n: row.rewards.length }) }}
                          <template v-if="dropMix(row).vaulted"> · <span class="an-vtag">{{ t('relicFarming.tags.vaultedCount', { n: dropMix(row).vaulted }) }}</span></template>
                        </small>
                      </span>
                    </nuxt-link>
                    <button class="an-drops" :title="t('relicFarming.row.farmTip')" @click="openDrops(row)">
                      <v-icon size="18">mdi-map-marker-radius-outline</v-icon>
                    </button>
                  </div>
                </td>
                <td class="grp-a an-num an-strong up">{{ fmtPlat(platPerHour(row)) }}p/hr</td>
                <td class="grp-b an-num">{{ fmtPlat(ev(row)) }}p</td>
                <td>
                  <span class="an-demand" :class="demand(row).cls" :title="t('relicFarming.row.liquidTip', { pct: Math.round(liquidity(row) * 100) })">
                    <span class="an-demand__bar"><i :style="{ width: Math.round(liquidity(row) * 100) + '%' }"></i></span>
                    {{ demand(row).label }}
                  </span>
                </td>
                <td class="an-num">
                  <span class="an-topdrop">{{ localItemName(topDrop(row)) }}</span>
                  <span v-if="rewardVaulted(topDrop(row))" class="an-vtag">{{ t('relicFarming.tags.vaulted') }}</span>
                  <small class="an-sub">{{ fmtPlat(topDrop(row).price) }}p · {{ t('relicFarming.row.vol') }} {{ fmtPlat(topDrop(row).volume || 0) }}</small>
                </td>
                <td class="an-num">{{ fmtPlat(row.relic.volume) }}</td>
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
              <img class="an-thumb" :src="relicThumb(row)" :alt="localName('items', row.url_name, row.relicName)" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ localName('items', row.url_name, row.relicName) }}
                  <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('relicFarming.tags.top') }}</span>
                  <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('relicFarming.tags.vaultedBadge') }}</span>
                  <span v-else-if="row.resurgence" class="an-badge an-badge--resurgence" :title="t('relicFarming.tags.resurgenceTitle')">{{ t('relicFarming.tags.resurgence') }}</span>
                </div>
                <small class="an-sub">
                  {{ row.tier }} · {{ t('relicFarming.row.drops', { n: row.rewards.length }) }} · {{ t('relicFarming.row.vol') }} {{ fmtPlat(row.relic.volume) }}
                  <template v-if="dropMix(row).vaulted"> · <span class="an-vtag">{{ t('relicFarming.tags.vaultedCount', { n: dropMix(row).vaulted }) }}</span></template>
                </small>
              </div>
              <button class="an-drops" :title="t('relicFarming.row.farmTip')" @click.prevent.stop="openDrops(row)">
                <v-icon size="20">mdi-map-marker-radius-outline</v-icon>
              </button>
              <v-icon color="#4fb3bf">mdi-chevron-right</v-icon>
            </div>
            <div class="an-card__verdict">
              <span class="pill pill--good">
                {{ fmtPlat(platPerHour(row)) }} p/hr
                <b>{{ t('relicFarming.card.realizablePayout', { refinement: refinementLabel.toLowerCase() }) }}</b>
              </span>
              <span class="an-demand" :class="demand(row).cls">
                <span class="an-demand__bar"><i :style="{ width: Math.round(liquidity(row) * 100) + '%' }"></i></span>
                {{ demand(row).label }}
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('relicFarming.card.payout', { refinement: refinementLabel }) }}</div>
                <div class="an-block__row"><span>{{ t('relicFarming.card.realizableEv') }}</span><b>{{ fmtPlat(ev(row)) }}p</b></div>
                <div class="an-block__row"><span>{{ t('relicFarming.card.rawEv') }}</span><b>{{ fmtPlat(evRaw(row)) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('relicFarming.card.topDrop') }}</div>
                <div class="an-block__row"><span>{{ topDrop(row).rarity }}</span><b>{{ fmtPlat(topDrop(row).price) }}p</b></div>
                <div class="an-block__row an-topdrop-m">
                  <span>{{ localItemName(topDrop(row)) }}</span>
                  <span v-if="rewardVaulted(topDrop(row))" class="an-vtag">{{ t('relicFarming.tags.vaulted') }}</span>
                </div>
              </div>
            </div>
          </nuxt-link>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPage"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <i18n-t keypath="relicFarming.disclaimer.text" tag="span">
          <template #realizable><b>{{ t('relicFarming.disclaimer.realizable') }}</b></template>
          <template #refinement>{{ refinementLabel }}</template>
        </i18n-t>
      </v-alert>

      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsRelic" :thumb="dropsThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRelicValue, type RelicRow } from '~/composables/useRelicValue'

const { t } = useI18n()
const { trackAction, trackDialog, trackFilter, trackSearch, trackSort } = useAnalytics()
const { localItemName, localName } = useLocalizedName()

// Working thumbnails cross-referenced against the fresh catalog (drop data
// carries stale warframe.market thumb hashes).
const { itemThumb } = useItemThumb()

const base = useApiBase()

// SSR fetch — preserve old asyncData try/catch -> loadError intent. Distinct
// key ('relic-farming') so the cache doesn't collide with relics-value.vue's
// 'relics-ev' key, even though both hit the same /relics_ev endpoint.
const { data, error } = await useAsyncData('relic-farming', () =>
  $fetch<{ relics: RelicRow[] }>(`${base}/relics_ev`),
)
const loadError = computed(() => !!error.value)
const relics = computed<RelicRow[]>(() => data.value?.relics ?? [])

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// UI state (former data())
const search = ref('')
const tier = ref('All')
const refinement = ref('Radiant')
// Translated label for the active refinement (the ref value stays the logic key
// 'Intact'/'Radiant' used by the chance table; only the display text localizes).
const refinementLabel = computed(() =>
  refinement.value === 'Radiant'
    ? t('relicFarming.filters.radiant')
    : t('relicFarming.filters.intact'),
)
const sortKey = ref('pph')
const missionMinutes = ref(3)
const page = ref(1)
const perPage = 20
// Only value/show relics that carry full drop + market data by default
// (relics missing prices for their drops can't get a meaningful plat/hour).
const completeOnly = ref(true)
// Currently-dropping only (default): vaulted relics can't be farmed, so they
// have no place on a "what to grind now" board.
const droppingOnly = ref(true)
// Hide relics whose entire payout is illiquid — every drop has 0 trade volume,
// so the plat/hour is theoretical (nobody's buying). Default on.
const hideNoDemand = ref(true)
// Drops popup — where to farm the clicked relic.
const dropsDialog = ref(false)
const dropsRelic = ref('')
const dropsThumb = ref('')
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = computed(() => [
  { text: t('relicFarming.sort.pph'), value: 'pph' },
  { text: t('relicFarming.sort.ev'), value: 'ev' },
  { text: t('relicFarming.sort.demand'), value: 'demand' },
  { text: t('relicFarming.sort.volume'), value: 'volume' },
  { text: t('relicFarming.sort.name'), value: 'name' },
])

// Shared, liquidity-aware valuation (same basis as the Star Chart): each drop is
// discounted by its 48h trade volume, so overpriced parts nobody buys don't
// inflate a relic's plat/hour. `ev` here is the realizable EV.
const { ev, evRaw, topDrop, liquidity, demand, dropMix, rewardVaulted, isVaulted, isResurgence, hasFullData, fmtPlat } =
  useRelicValue(refinement)

function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
// Realizable plat/hour: liquidity-weighted expected payout ÷ minutes × 60.
function platPerHour(relic: any): number {
  const minutes = Number(missionMinutes.value) || 1
  return (ev(relic) / minutes) * 60
}
// A relic has "no demand" when none of its drops have traded in 48h — its whole
// payout is theoretical. `liquidity` returns 0 only in that case.
function noDemand(relic: RelicRow): boolean {
  return liquidity(relic) <= 0
}
// Working thumbnail for a relic row (falls back through the fresh catalog).
function relicThumb(relic: RelicRow): string {
  return itemThumb({ urlName: relic.url_name, itemName: relic.relicName, thumb: relic.thumb })
}
// Open the "where to farm" drops popup for a relic.
function openDrops(relic: RelicRow) {
  // Drop nodes are indexed under the full item name ("Axi S8 Relic"), but
  // relicName is the bare label ("Axi S8") and the dialog's matchKeys doesn't
  // strip a "Relic" suffix — pass the suffixed name so the nodes resolve.
  const rn = (relic.relicName || '').trim()
  dropsRelic.value = /relic$/i.test(rn) ? rn : `${rn} Relic`
  dropsThumb.value = relic.thumb || ''
  dropsDialog.value = true
  // plat/hour is the number the row is judged on, so carrying it tells us
  // whether people go farm the relics the board actually recommends.
  trackDialog('drop_locations', { item_name: dropsRelic.value, plat_per_hour: platPerHour(relic) })
}

// --- analytics hooks (tracking only; none of these touch page state) ---
function onRefinement(v: any) {
  trackFilter('refinement', v)
}
function onTier(v: any) {
  trackFilter('tier', v)
}
function onToggle(name: string, v: any) {
  trackFilter(name, !!v)
}
// The slider's `end` fires once per drag, not per step, so the run-length
// filter can't spam GA while the user is dragging it.
function onMinutes(v: number) {
  trackFilter('mission_minutes', v)
}
function onSort(v: any) {
  trackSort(v)
}
function onPage(n: number) {
  trackAction('paginate', { page: n })
}

const tierOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of relics.value) present.add(r.tier)
  const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
  return ['All', ...order.filter((t) => present.has(t))]
})

// Search + tier only — the base set the quality filters narrow.
const matched = computed<RelicRow[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  return relics.value.filter((r) => {
    if (q && !(r.relicName.toLowerCase().includes(q) || localName('items', r.url_name, r.relicName).toLowerCase().includes(q))) return false
    if (tier.value !== 'All' && r.tier !== tier.value) return false
    return true
  })
})

// The default board: currently-dropping (not vaulted), fully-priced, and with a
// real market for its drops. Each is an independent, user-toggleable gate.
function passesQuality(r: RelicRow): boolean {
  // "Currently dropping" = farmable from a fissure run: excludes both vaulted
  // relics and Prime Resurgence (Varzia) relics, which are Aya-bought and never
  // drop from a mission — so they carry no real plat-per-run.
  if (droppingOnly.value && (isVaulted(r) || isResurgence(r))) return false
  if (completeOnly.value && !hasFullData(r)) return false
  if (hideNoDemand.value && noDemand(r)) return false
  return true
}

// Relics we actually value (base set for hero + stats): quality filters only.
const valuedRelics = computed<RelicRow[]>(() => relics.value.filter(passesQuality))

// How many search/tier matches each gate hides — surfaced in the count line.
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
const hiddenNoDemand = computed<number>(() =>
  hideNoDemand.value
    ? matched.value.filter((r) => !isVaulted(r) && !isResurgence(r) && hasFullData(r) && noDemand(r)).length
    : 0,
)

const filtered = computed<any[]>(() => {
  const list = matched.value.filter(passesQuality)
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    pph: (a, b) => dir(platPerHour(a), platPerHour(b)),
    ev: (a, b) => dir(ev(a), ev(b)),
    demand: (a, b) => dir(liquidity(a), liquidity(b)) || dir(ev(a), ev(b)),
    volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
    name: (a, b) => a.relicName.localeCompare(b.relicName),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.pph)
})

// SSR-only crawlable snapshot for <SeoFallbackTable>: top 150 of the same
// default-filtered, default-sorted `filtered` list (currently-dropping,
// full-data, demand-gated relics ranked by plat/hour) the live board renders,
// fed by the SSR-safe /relics_ev useAsyncData fetch above.
const fallbackRows = computed(() =>
  filtered.value.slice(0, 150).map((row) => ({
    key: row.url_name,
    href: '/relic/' + row.url_name,
    name: row.relicName,
    cells: [
      fmtPlat(platPerHour(row)) + 'p/hr',
      fmtPlat(ev(row)) + 'p',
      demand(row).label,
      fmtPlat(row.relic.volume),
    ],
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
    if (!best || platPerHour(r) > platPerHour(best)) best = r
  }
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) {
    if (!best || platPerHour(r) > platPerHour(best)) best = r
  }
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = valuedRelics.value
  const pphs = list.map((r) => platPerHour(r))
  const evs = list.map((r) => ev(r))
  return {
    total: list.length,
    bestPph: pphs.length ? Math.max(...pphs) : 0,
    avgPph: pphs.length ? pphs.reduce((s, v) => s + v, 0) / pphs.length : 0,
    biggest: evs.length ? Math.max(...evs) : 0,
  }
})

watch(filtered, () => {
  page.value = 1
})

// Searching re-filters on every keystroke, so report only what the user settled
// on — and with the resulting row count, which is what makes "searched, found
// nothing" answerable.
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  const term = (q || '').toString().trim()
  if (!term) return
  searchTimer = setTimeout(() => trackSearch(term, filtered.value.length), 800)
})
onUnmounted(() => {
  // A pending timer would otherwise be attributed to whatever page came next.
  if (searchTimer) clearTimeout(searchTimer)
})

// Hide the global loading spinner once mounted (project rule). Bounded retry
// so a missing #spinner-wrapper element can't recurse forever.
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
.an-namewrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.an-namewrap .an-name {
  flex: 1;
  min-width: 0;
}
.an-drops {
  flex: none;
  color: #4fb3bf;
  background: transparent;
  border: 1px solid rgba(79, 179, 191, 0.35);
  border-radius: 6px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.an-drops:hover {
  color: #d4af5a;
  border-color: rgba(212, 175, 90, 0.5);
  background: rgba(212, 175, 90, 0.08);
}
.an-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  margin-top: 4px;
}
.an-toggle {
  flex: 0 0 auto;
}
.an-toggle :deep(.v-label) {
  font-size: 0.8rem;
  color: #b6bcd0;
  opacity: 1;
}
/* Verdict row: keep the plat/hr pill and the demand meter on one tidy line so
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
.an-mins {
  flex: 1 1 220px;
  max-width: 300px;
  min-width: 200px;
}
.an-mins__lbl {
  font-size: 0.72rem;
  color: #9aa0b4;
  margin-bottom: 2px;
  white-space: nowrap;
}
.an-mins__lbl b {
  color: #d4af5a;
  font-weight: 700;
}
.an-mins__slider {
  margin-top: 0;
  padding-top: 0;
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
.an-topdrop-m span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.an-hidden {
  color: #9aa0b4;
  margin-left: 6px;
  font-size: 0.92em;
}
</style>
