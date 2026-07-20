<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          :caption="t('flip.hero.eyebrow')"
          :name-label="t('flip.table.item')"
          :columns="[t('flip.table.buyBid'), t('flip.table.sellAsk'), t('flip.table.realMargin'), t('flip.table.confidence')]"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('flip.hero.eyebrow') }}</div>
            <i18n-t keypath="flip.hero.title" tag="h1" class="an-title">
              <template #low><span class="accent-a">{{ t('flip.hero.titleLow') }}</span></template>
              <template #clears><span class="accent-b">{{ t('flip.hero.titleClears') }}</span></template>
            </i18n-t>
            <i18n-t keypath="flip.hero.lede" tag="p" class="an-lede">
              <template #realisticMargin><strong>{{ t('flip.hero.ledeRealisticMargin') }}</strong></template>
              <template #fillConfidence><strong>{{ t('flip.hero.ledeFillConfidence') }}</strong></template>
            </i18n-t>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('flip.hero.bestFlip') }}</div>
            <div class="an-hero__deal-plat">+{{ fmtPlat(topDeal.s.realMargin) }}<span>p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(topDeal, 'hero')">
              {{ localItemName(topDeal) }} →
            </a>
            <div class="an-hero__deal-sub">
              {{ t('flip.hero.dealSub', { tier: topDeal.s.tier.label, conf: topDeal.s.confidence, vol: fmtPlat(topDeal.s.vol) }) }}
            </div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">{{ t('flip.stats.plausibleFlips') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">+{{ fmtPlat(stats.bestMargin) }}p</div>
            <div class="an-stat__lbl">{{ t('flip.stats.bestRealMargin') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ stats.avgConfidence }}</div>
            <div class="an-stat__lbl">{{ t('flip.stats.avgConfidence') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ stats.strong }}</div>
            <div class="an-stat__lbl">{{ t('flip.stats.strongDeals') }}</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" :label="t('flip.filters.searchItem')" class="an-search"></v-text-field>
            <v-text-field v-model.number="minVolume" density="compact" hide-details type="number" min="0" :label="t('flip.filters.minVolume')" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details :label="t('flip.filters.sortBy')" class="an-field" style="flex: 0 1 240px" @update:model-value="onSortChange"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats" @update:model-value="onCategoryChange">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ catLabel(c) }}</v-chip>
          </v-chip-group>
          <div class="an-toggles">
            <v-switch v-model="includeSpeculative" density="compact" hide-details inset color="#d4af5a" :label="t('flip.filters.includeSpeculative')" @update:model-value="onSpeculativeChange"></v-switch>
          </div>
          <div class="an-count">{{ filtered.length === 1 ? t('flip.filters.matchOne', { n: filtered.length }) : t('flip.filters.matchMany', { n: filtered.length }) }}</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">
          {{ includeSpeculative ? t('flip.empty.any') : t('flip.empty.plausible') }}
          {{ includeSpeculative ? t('flip.empty.hintSpeculative') : t('flip.empty.hintPlausible') }}
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('flip.table.item') }}</th>
                <th class="grp-a">{{ t('flip.table.buyBid') }}</th>
                <th class="grp-b">{{ t('flip.table.sellAsk') }}</th>
                <th>{{ t('flip.table.realMargin') }}</th>
                <th>{{ t('flip.table.return') }}</th>
                <th>{{ t('flip.table.spread') }}</th>
                <th>{{ t('flip.table.confidence') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'row', idx)">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
                    <span>
                      {{ localItemName(row) }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('flip.badge.top') }}</span>
                      <small class="an-sub">{{ t('flip.table.avgVol', { avg: fmtPlat(row.s.avg), vol: fmtPlat(row.s.vol) }) }}</small>
                    </span>
                  </a>
                </td>
                <td class="grp-a an-num">{{ fmtPlat(row.s.bid) }}p</td>
                <td class="grp-b an-num">{{ fmtPlat(row.s.ask) }}p</td>
                <td class="an-num an-strong" :class="marginClass(row.s.realMargin)">{{ fmtSignedPlat(row.s.realMargin) }}p</td>
                <td class="an-num" :class="marginClass(row.s.realMargin)">{{ fmtPct(row.s.realMarginPct) }}</td>
                <td class="an-num flat">
                  {{ fmtSignedPlat(row.s.spread) }}p<span v-if="row.s.junkAsk" class="an-warn" :title="t('flip.table.junkAskTitle')"> ⚠</span>
                </td>
                <td>
                  <span class="pill" :class="row.s.tier.cls">
                    {{ row.s.tier.label }}<b>{{ row.s.confidence }}/100</b>
                  </span>
                </td>
                <td class="an-actions">
                  <v-btn icon size="small" color="#4fb3bf" variant="text" :aria-label="t('flip.actions.dropsAria', { name: localItemName(row) })" @click="openDrops(row)">
                    <v-icon>mdi-map-marker-radius-outline</v-icon>
                  </v-btn>
                  <v-btn icon size="small" color="#d4af5a" variant="text" :href="mkt(row.url_name)" target="_blank" :aria-label="t('flip.actions.openAria', { name: localItemName(row) })" @click="onMarketOpen(row, 'row_button', idx)">
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <div v-for="(row, idx) in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="localItemName(row)" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ localItemName(row) }}<span v-if="row.url_name === topDealUrl" class="an-badge">{{ t('flip.badge.top') }}</span></div>
                <small class="an-sub">{{ t('flip.table.avgVol', { avg: fmtPlat(row.s.avg), vol: fmtPlat(row.s.vol) }) }}</small>
              </div>
            </div>
            <div class="an-card__verdict">
              <span class="pill" :class="row.s.tier.cls">
                {{ row.s.tier.label }}<b>{{ t('flip.card.fillConfidence', { conf: row.s.confidence }) }}</b>
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('flip.card.prices') }}</div>
                <div class="an-block__row"><span>{{ t('flip.table.buyBid') }}</span><b>{{ fmtPlat(row.s.bid) }}p</b></div>
                <div class="an-block__row"><span>{{ t('flip.table.sellAsk') }}</span><b>{{ fmtPlat(row.s.ask) }}p</b></div>
                <div class="an-block__row">
                  <span>{{ t('flip.table.spread') }}</span>
                  <b class="flat">{{ fmtSignedPlat(row.s.spread) }}p<span v-if="row.s.junkAsk" class="an-warn"> ⚠</span></b>
                </div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('flip.card.realisticFlip') }}</div>
                <div class="an-block__row"><span>{{ t('flip.card.margin') }}</span><b :class="marginClass(row.s.realMargin)">{{ fmtSignedPlat(row.s.realMargin) }}p</b></div>
                <div class="an-block__row"><span>{{ t('flip.table.return') }}</span><b :class="marginClass(row.s.realMargin)">{{ fmtPct(row.s.realMarginPct) }}</b></div>
                <div class="an-block__row"><span>{{ t('flip.card.clearsAt') }}</span><b>{{ fmtPlat(row.s.avg) }}p</b></div>
              </div>
            </div>
            <div class="an-card__actions">
              <button type="button" class="an-cardbtn" @click="openDrops(row)">
                <v-icon size="16">mdi-map-marker-radius-outline</v-icon> {{ t('flip.actions.dropsWiki') }}
              </button>
              <a class="an-cardbtn" :href="mkt(row.url_name)" target="_blank" rel="noopener" @click="onMarketOpen(row, 'mobile_card', idx)">
                <v-icon size="16">mdi-open-in-new</v-icon> {{ t('flip.actions.market') }}
              </a>
            </div>
          </div>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPageChange"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        <i18n-t keypath="flip.disclaimer.body" tag="span">
          <template #realMargin><strong>{{ t('flip.disclaimer.realMargin') }}</strong></template>
          <template #spread><strong>{{ t('flip.disclaimer.spread') }}</strong></template>
          <template #confidence><strong>{{ t('flip.disclaimer.confidence') }}</strong></template>
        </i18n-t>
      </v-alert>

      <DropLocationsDialog v-model="dropDialog" :item-name="dropItemName" :thumb="dropThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'
import { scoreFlip } from '~/composables/useFlipScore'

const { t } = useI18n()
const { trackSearch, trackFilter, trackSort, trackAction, trackDialog, trackMarketOpen } = useAnalytics()
const { localItemName } = useLocalizedName()
const itemsStore = useItemsStore()
const allItems = computed(() => itemsStore.allItems)

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const search = ref('')
const minVolume = ref<number>(0)
const category = ref('All')
const sortKey = ref('opportunity')
const includeSpeculative = ref(false)
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = computed(() => [
  { title: t('flip.sort.opportunity'), value: 'opportunity' },
  { title: t('flip.sort.confidence'), value: 'confidence' },
  { title: t('flip.sort.realMargin'), value: 'realMargin' },
  { title: t('flip.sort.return'), value: 'return' },
  { title: t('flip.sort.spread'), value: 'spread' },
  { title: t('flip.sort.volume'), value: 'volume' },
  { title: t('flip.sort.name'), value: 'name' },
])

// Category chip labels: the chip VALUE stays the English key (used in filter
// logic + as the i18n subkey), only the displayed label is localized.
function catLabel(c: string): string {
  return t('flip.categories.' + c.toLowerCase())
}

// Drop-locations + wiki dialog (reuses the shared component — it bundles the
// drop table, wiki link, warframestat cross-ref and a live market snapshot).
const dropDialog = ref(false)
const dropItemName = ref('')
const dropThumb = ref('')
function openDrops(row: any) {
  dropItemName.value = row.item_name
  dropThumb.value = row.thumb || ''
  dropDialog.value = true
  trackDialog('drop_locations', { item_name: row.item_name })
}

function categoryOf(tags: string[] = []): string {
  const t = (tags || []).map((x) => (x || '').toLowerCase())
  if (t.includes('warframe')) return 'Warframe'
  if (t.includes('primary')) return 'Primary'
  if (t.includes('secondary')) return 'Secondary'
  if (t.includes('melee')) return 'Melee'
  if (t.includes('mod')) return 'Mod'
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
  return 'Other'
}

// Every item that quotes both a bid and an ask, scored once. Base pool for the
// plausible/speculative split below.
const scored = computed<any[]>(() =>
  (allItems.value as any[])
    .filter((i) => i && i.market && Number(i.market.buy) > 0 && Number(i.market.sell) > 0)
    .map((i) => ({ ...i, s: scoreFlip(i.market) }))
)

const plausibleAll = computed<any[]>(() => scored.value.filter((r) => r.s.plausible))

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of scored.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const list = scored.value.filter((r) => {
    if (!includeSpeculative.value && !r.s.plausible) return false
    if (q && !(r.item_name.toLowerCase().includes(q) || localItemName(r).toLowerCase().includes(q))) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if (r.s.vol < minV) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    opportunity: (a, b) => dir(a.s.opportunity, b.s.opportunity),
    confidence: (a, b) => dir(a.s.confidence, b.s.confidence) || dir(a.s.realMargin, b.s.realMargin),
    realMargin: (a, b) => dir(a.s.realMargin, b.s.realMargin),
    return: (a, b) => dir(a.s.realMarginPct, b.s.realMarginPct),
    spread: (a, b) => dir(a.s.spread, b.s.spread),
    volume: (a, b) => dir(a.s.vol, b.s.vol),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.opportunity)
})

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): top 150 of the same filtered+sorted list the live table renders
// (default sort: opportunity score, descending).
const fallbackRows = computed(() =>
  filtered.value.slice(0, 150).map((row) => ({
    key: row.url_name,
    href: mkt(row.url_name),
    name: localItemName(row),
    cells: [
      fmtPlat(row.s.bid) + 'p',
      fmtPlat(row.s.ask) + 'p',
      fmtSignedPlat(row.s.realMargin) + 'p',
      row.s.confidence + '/100',
    ],
  })),
)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

// Hero = the single best realizable opportunity across the plausible universe.
const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of plausibleAll.value) if (!best || r.s.opportunity > best.s.opportunity) best = r
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) if (!best || r.s.opportunity > best.s.opportunity) best = r
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = plausibleAll.value
  const confs = list.map((r) => r.s.confidence)
  const margins = list.map((r) => r.s.realMargin)
  return {
    total: list.length,
    bestMargin: margins.length ? Math.max(...margins) : 0,
    avgConfidence: confs.length ? Math.round(confs.reduce((s, v) => s + v, 0) / confs.length) : 0,
    strong: list.filter((r) => r.s.tier.key === 'strong').length,
  }
})

watch([filtered], () => {
  page.value = 1
})

// --- Analytics -------------------------------------------------------------
// The two free-text fields re-run the ledger on every keystroke, so they are
// reported only once the user stops typing — otherwise a 12-letter item name
// would be 12 GA4 hits with 11 useless prefixes.
const TRACK_DEBOUNCE_MS = 700
let searchTimer: ReturnType<typeof setTimeout> | undefined
let volumeTimer: ReturnType<typeof setTimeout> | undefined

watch(search, (term) => {
  if (searchTimer) clearTimeout(searchTimer)
  const q = (term || '').toString().trim()
  if (!q) return
  searchTimer = setTimeout(() => trackSearch(q, filtered.value.length), TRACK_DEBOUNCE_MS)
})

watch(minVolume, (v) => {
  if (volumeTimer) clearTimeout(volumeTimer)
  volumeTimer = setTimeout(() => trackFilter('min_volume', Number(v) || 0), TRACK_DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  // A pending hit would otherwise land after navigation and be attributed to
  // whatever page the user moved to.
  if (searchTimer) clearTimeout(searchTimer)
  if (volumeTimer) clearTimeout(volumeTimer)
})

// Direction is not user-controllable here (each key has one fixed order), so
// only the key is reported.
function onSortChange(value: any) {
  trackSort(String(value ?? ''))
}
function onCategoryChange(value: any) {
  trackFilter('category', String(value ?? 'All'))
}
function onSpeculativeChange(value: any) {
  trackFilter('include_speculative', !!value)
}
function onPageChange(value: any) {
  trackAction('paginate', { page: Number(value) || 1 })
}

// Rank within the whole ledger, not within the visible page — that is what
// tells "took the top flip" apart from "dug to page 4 for it".
function onMarketOpen(row: any, source: string, idx?: number) {
  trackMarketOpen(row.item_name, {
    source,
    position: idx === undefined ? undefined : (page.value - 1) * perPage + idx + 1,
    flip_tier: row?.s?.tier?.key,
  })
}

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
function marginClass(n: number): string {
  const v = Number(n) || 0
  if (v > 0) return 'up'
  if (v < 0) return 'down'
  return 'flat'
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmtSignedPlat(n: number): string {
  const v = Math.round(Number(n) || 0)
  return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`
}
function fmtPct(n: number): string {
  const v = Number(n) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
}

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
/* Actions cell keeps its two icon buttons on one row, right-aligned */
.an-actions {
  white-space: nowrap;
  text-align: right;
}
/* Mobile card action buttons — angular HUD chips matching the design system */
.an-card__actions {
  display: flex;
  gap: 10px;
  margin-top: 13px;
}
.an-cardbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  padding: 9px 10px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 0.78rem;
  color: #cfd4e4;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.an-cardbtn:hover {
  background: rgba(200, 168, 92, 0.12);
  color: #e7cf95;
}
</style>
