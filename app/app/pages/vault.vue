<template>
  <div class="an va">
    <client-only>
      <template #fallback>
        <!-- The vault lives in localStorage, so the server has nothing to render
             for a specific player. Ship the static explainer instead of an
             empty console (and never a skeleton crawlers would index as thin). -->
        <div class="an-console">
          <header class="an-hero">
            <div class="an-hero__text">
              <div class="an-eyebrow">{{ t('vault.eyebrow') }}</div>
              <h1 class="an-title">{{ t('vault.hero.title', { own: t('vault.hero.titleOwn'), worth: t('vault.hero.titleWorth') }) }}</h1>
              <p class="an-lede">{{ t('vault.hero.lede') }}</p>
            </div>
          </header>
        </div>
      </template>

      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('vault.eyebrow') }}</div>
            <i18n-t keypath="vault.hero.title" tag="h1" class="an-title">
              <template #own><span class="accent-b">{{ t('vault.hero.titleOwn') }}</span></template>
              <template #worth><span class="accent-a">{{ t('vault.hero.titleWorth') }}</span></template>
            </i18n-t>
            <p class="an-lede">{{ t('vault.hero.lede') }}</p>
            <p v-if="!auth.signedIn" class="va-sync">
              {{ t('vault.syncCta') }}
              <nuxt-link :to="localePath('/account')" @click="trackAction('vault_sync_cta')">{{ t('vault.syncCtaLink') }} →</nuxt-link>
            </p>
          </div>
          <div v-if="topHolding" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('vault.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(topHolding.realizable) }}<span>p</span></div>
            <nuxt-link class="an-hero__deal-name" :to="localePath('/set/' + topHolding.url_name)">
              {{ topHolding.name }} →
            </nuxt-link>
            <div class="an-hero__deal-sub">
              {{ t('vault.hero.dealSub', { qty: topHolding.qty, verdict: verdictLabel(topHolding.verdict) }) }}
            </div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ totals.items }}</div>
            <div class="an-stat__lbl">{{ t('vault.stats.items') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ totals.units.toLocaleString() }}</div>
            <div class="an-stat__lbl">{{ t('vault.stats.units') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtPlat(totals.realizable) }}p</div>
            <div class="an-stat__lbl">{{ t('vault.stats.realizable') }}</div>
          </div>
          <div v-if="totals.pnlRows > 0" class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtSigned(totals.pnl) }}p</div>
            <div class="an-stat__lbl">{{ t('vault.stats.pnl') }}</div>
          </div>
          <div v-else class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(totals.value) }}p</div>
            <div class="an-stat__lbl">{{ t('vault.stats.value') }}</div>
          </div>
        </div>

        <!-- Add + filters -->
        <section class="an-filters">
          <div class="an-filters__row va-add">
            <v-autocomplete
              v-model="picker"
              :items="pickerItems"
              item-title="name"
              item-value="url_name"
              return-object
              density="compact"
              hide-details
              auto-select-first
              clearable
              :label="t('vault.add.item')"
              :no-data-text="t('vault.add.noMatches')"
              class="an-search va-picker"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" :title="item.raw.name">
                  <template #prepend>
                    <v-avatar size="28" rounded="0">
                      <v-img :src="itemThumb({ urlName: item.raw.url_name, itemName: item.raw.item_name, thumb: item.raw.thumb })" />
                    </v-avatar>
                  </template>
                </v-list-item>
              </template>
            </v-autocomplete>
            <v-text-field
              v-model="addQty"
              type="number"
              min="1"
              density="compact"
              hide-details
              :label="t('vault.add.qty')"
              class="an-field va-num"
            ></v-text-field>
            <v-text-field
              v-model="addCost"
              type="number"
              min="0"
              density="compact"
              hide-details
              :label="t('vault.add.cost')"
              class="an-field va-num va-num--wide"
            ></v-text-field>
            <v-btn
              :disabled="!picker"
              color="#d4af5a"
              variant="flat"
              size="small"
              class="va-addbtn"
              prepend-icon="mdi-plus"
              @click="addItem"
            >{{ t('vault.add.button') }}</v-btn>
          </div>

          <div class="an-filters__row">
            <v-text-field
              v-model="search"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              :label="t('vault.filters.search')"
              class="an-search"
            ></v-text-field>
            <v-select
              v-model="sortKey"
              :items="sortOptions"
              item-title="text"
              item-value="value"
              density="compact"
              hide-details
              :label="t('vault.filters.sortBy')"
              class="an-field"
              style="flex: 0 1 200px"
              @update:model-value="onSort"
            ></v-select>
            <v-select
              v-model="basis"
              :items="basisOptions"
              item-title="text"
              item-value="value"
              density="compact"
              hide-details
              :label="t('vault.filters.basis')"
              class="an-field"
              style="flex: 0 1 190px"
            ></v-select>
            <v-btn variant="text" size="small" color="#4fb3bf" prepend-icon="mdi-download-outline" class="va-csv" @click="exportCsv">
              {{ t('vault.filters.export') }}
            </v-btn>
          </div>

          <v-chip-group v-if="categoryOptions.length > 2" v-model="category" mandatory column class="an-cats" @update:model-value="onCategory">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small" active-class="an-chip--on">
              {{ c }}
            </v-chip>
          </v-chip-group>

          <div class="an-toggles">
            <v-switch
              v-model="liquidityAdjust"
              hide-details
              density="compact"
              inset
              color="#4fb3bf"
              :label="t('vault.filters.liquidityAdjust')"
              class="an-toggle"
            ></v-switch>
          </div>

          <div v-if="rows.length" class="an-count">
            {{ t('vault.count', { n: filtered.length }, filtered.length) }}
            <span v-if="totals.unpriced" class="va-hidden">{{ t('vault.unpriced', { n: totals.unpriced }) }}</span>
          </div>
        </section>

        <!-- Empty vault -->
        <div v-if="!rows.length" class="an-empty">
          <div class="va-empty__title">{{ t('vault.empty.title') }}</div>
          <p class="va-empty__text">{{ t('vault.empty.text') }}</p>
          <v-btn
            v-if="watchlistSeeds.length"
            variant="outlined"
            size="small"
            color="#d4af5a"
            prepend-icon="mdi-bookmark-multiple-outline"
            @click="importFromWatchlist"
          >{{ t('vault.empty.importWatchlist', { n: watchlistSeeds.length }, watchlistSeeds.length) }}</v-btn>
        </div>

        <div v-else-if="!filtered.length" class="an-empty">{{ t('vault.noMatch') }}</div>

        <!-- Desktop table -->
        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('vault.table.item') }}</th>
                <th>{{ t('vault.table.qty') }}</th>
                <th>{{ t('vault.table.unit') }}</th>
                <th class="grp-a">{{ t('vault.table.realizable') }}</th>
                <th class="grp-b">{{ t('vault.table.value') }}</th>
                <th>{{ t('vault.table.cost') }}</th>
                <th>{{ t('vault.table.pnl') }}</th>
                <th>{{ t('vault.table.verdict') }}</th>
                <th>{{ t('vault.table.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topHoldingUrl }">
                <td class="col-name">
                  <nuxt-link class="an-name" :to="localePath('/set/' + row.url_name)">
                    <img class="an-thumb" :src="row.thumb" :alt="row.name" loading="lazy" />
                    <span>
                      {{ row.name }}
                      <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('vault.row.vaulted') }}</span>
                      <small class="an-sub">
                        {{ row.category }}
                        <template v-if="row.unit <= 0"> · <span class="va-noprice">{{ t('vault.row.noPrice') }}</span></template>
                      </small>
                    </span>
                  </nuxt-link>
                </td>
                <td>
                  <v-text-field
                    :model-value="qtyValue(row)"
                    type="number"
                    min="0"
                    density="compact"
                    hide-details
                    variant="plain"
                    class="va-edit"
                    :title="t('vault.row.qtyTip')"
                    @update:model-value="onQtyInput(row, $event)"
                    @blur="commitQty(row)"
                  ></v-text-field>
                </td>
                <td class="an-num">{{ row.unit > 0 ? fmtPlat(row.unit) + 'p' : '—' }}</td>
                <td class="grp-a an-num an-strong">{{ fmtPlat(row.realizable) }}p</td>
                <td class="grp-b an-num">{{ fmtPlat(row.value) }}p</td>
                <td>
                  <v-text-field
                    :model-value="costValue(row)"
                    type="number"
                    min="0"
                    density="compact"
                    hide-details
                    variant="plain"
                    placeholder="—"
                    class="va-edit va-edit--cost"
                    :title="t('vault.row.costTip')"
                    @update:model-value="onCostInput(row, $event)"
                    @blur="commitCost(row)"
                  ></v-text-field>
                </td>
                <td class="an-num" :class="pnlClass(row.pnl)">{{ row.pnl === null ? '—' : fmtSigned(row.pnl) + 'p' }}</td>
                <td>
                  <span class="pill" :class="verdictPill(row.verdict)">{{ verdictLabel(row.verdict) }}</span>
                </td>
                <td>
                  <div class="va-acts">
                    <button class="va-iconbtn" :title="t('vault.row.dropsTip')" @click="openDrops(row)">
                      <v-icon size="18">mdi-map-marker-radius-outline</v-icon>
                    </button>
                    <button class="va-iconbtn va-iconbtn--danger" :title="t('vault.row.removeTip')" @click="removeRow(row)">
                      <v-icon size="18">mdi-trash-can-outline</v-icon>
                    </button>
                  </div>
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
            :class="{ 'is-top': row.url_name === topHoldingUrl }"
          >
            <div class="an-card__head">
              <img class="an-thumb" :src="row.thumb" :alt="row.name" loading="lazy" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ row.name }}
                  <span v-if="row.vaulted" class="an-badge an-badge--vault">{{ t('vault.row.vaulted') }}</span>
                </div>
                <small class="an-sub">{{ row.category }}</small>
              </div>
              <nuxt-link class="va-iconbtn" :to="localePath('/set/' + row.url_name)" :title="t('vault.row.open')">
                <v-icon size="20" color="#4fb3bf">mdi-chevron-right</v-icon>
              </nuxt-link>
            </div>

            <div class="an-card__verdict">
              <span class="pill" :class="verdictPill(row.verdict)">
                {{ fmtPlat(row.realizable) }}p <b>{{ t('vault.card.realizable') }}</b>
              </span>
              <span class="va-verdicttag">{{ verdictLabel(row.verdict) }}</span>
            </div>

            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('vault.card.qty') }}</div>
                <div class="an-block__row"><span>{{ t('vault.table.qty') }}</span><b>{{ row.qty }}</b></div>
                <div class="an-block__row"><span>{{ t('vault.card.unit') }}</span><b>{{ row.unit > 0 ? fmtPlat(row.unit) + 'p' : '—' }}</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('vault.card.value') }}</div>
                <div class="an-block__row"><span>{{ t('vault.table.value') }}</span><b>{{ fmtPlat(row.value) }}p</b></div>
                <div class="an-block__row">
                  <span>{{ t('vault.card.pnl') }}</span>
                  <b :class="pnlClass(row.pnl)">{{ row.pnl === null ? '—' : fmtSigned(row.pnl) + 'p' }}</b>
                </div>
              </div>
            </div>

            <div class="va-card__edit">
              <v-text-field
                :model-value="qtyValue(row)"
                type="number"
                min="0"
                density="compact"
                hide-details
                :label="t('vault.table.qty')"
                class="va-num"
                @update:model-value="onQtyInput(row, $event)"
                @blur="commitQty(row)"
              ></v-text-field>
              <v-text-field
                :model-value="costValue(row)"
                type="number"
                min="0"
                density="compact"
                hide-details
                :label="t('vault.table.cost')"
                class="va-num va-num--wide"
                @update:model-value="onCostInput(row, $event)"
                @blur="commitCost(row)"
              ></v-text-field>
              <button class="va-iconbtn" :title="t('vault.row.dropsTip')" @click="openDrops(row)">
                <v-icon size="20">mdi-map-marker-radius-outline</v-icon>
              </button>
              <button class="va-iconbtn va-iconbtn--danger" :title="t('vault.row.removeTip')" @click="removeRow(row)">
                <v-icon size="20">mdi-trash-can-outline</v-icon>
              </button>
            </div>
          </div>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPage"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <i18n-t keypath="vault.disclaimer.text" tag="span">
          <template #realizable><b>{{ t('vault.disclaimer.realizable') }}</b></template>
        </i18n-t>
      </v-alert>

      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" :thumb="dropsThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import {
  valueHolding,
  vaultTotals,
  type ValueBasis,
  type VaultMarket,
  type VaultRow,
  type VaultVerdict,
} from '~/composables/useVaultValue'

const { t } = useI18n()
const localePath = useLocalePath()
const { trackAction, trackFilter, trackSort, trackSearch, trackDialog } = useAnalytics()
const { localItemName } = useLocalizedName()
const { itemThumb } = useItemThumb()
const { categoryOf, categoryOptionsFor } = useItemCategory()
const base = useApiBase()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const ud = useUserData()
const auth = useAuthStore()
const itemsStore = useItemsStore()
const allItems = computed<any[]>(() => itemsStore.allItems as any[])

// atl/ath/change7d/volume feed the sell-timing verdict; the catalogue alone has
// no history. Failures are non-fatal — the catalogue's own market block still
// prices every holding (see `marketFor`).
const { data } = await useAsyncData('vault-market-analytics', () =>
  $fetch<any>(`${base}/market_analytics`),
)
const byUrl = computed<Record<string, any>>(() =>
  Object.fromEntries(((data.value && data.value.items) || []).map((i: any) => [i.url_name, i])),
)
const catalogueByUrl = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const i of allItems.value) if (i.url_name) map[i.url_name] = i
  return map
})

// ------------------------------------------------------------------ UI state
const search = ref('')
const category = ref('All')
const sortKey = ref('realizable')
const page = ref(1)
const perPage = 40

const picker = ref<any>(null)
const addQty = ref<string | number>(1)
const addCost = ref<string | number>('')

const dropsDialog = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')

// Live edits are held in drafts so a debounced commit can't yank half-typed
// digits out of the input (setVaultQty rewrites the row the field is bound to).
const qtyDraft = ref<Record<string, string>>({})
const costDraft = ref<Record<string, string>>({})
const timers = new Map<string, ReturnType<typeof setTimeout>>()

function schedule(key: string, fn: () => void, ms = 400) {
  const existing = timers.get(key)
  if (existing) clearTimeout(existing)
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key)
      fn()
    }, ms),
  )
}

const sortOptions = computed(() => [
  { text: t('vault.sort.realizable'), value: 'realizable' },
  { text: t('vault.sort.value'), value: 'value' },
  { text: t('vault.sort.pnl'), value: 'pnl' },
  { text: t('vault.sort.qty'), value: 'qty' },
  { text: t('vault.sort.verdict'), value: 'verdict' },
  { text: t('vault.sort.name'), value: 'name' },
])

const basisOptions = computed(() => [
  { text: t('vault.basis.sell'), value: 'sell' },
  { text: t('vault.basis.buy'), value: 'buy' },
  { text: t('vault.basis.avg'), value: 'avg' },
  { text: t('vault.basis.median'), value: 'median' },
])

// Both live in the shared user settings so /vault, /portfolio and /ledger agree
// on what a platinum number means.
const basis = computed<ValueBasis>({
  get: () => (ud.settings.value.basis || 'sell') as ValueBasis,
  set: (v: ValueBasis) => {
    ud.patchSettings({ basis: v })
    trackFilter('basis', v)
  },
})
// Honest-numbers default: ON unless the user explicitly turned it off.
const liquidityAdjust = computed<boolean>({
  get: () => ud.settings.value.liquidityAdjust !== false,
  set: (v: boolean) => {
    ud.patchSettings({ liquidityAdjust: !!v })
    trackFilter('liquidity_adjust', !!v)
  },
})

// ---------------------------------------------------------------- valuation
/**
 * Market facts for one holding. The analytics feed wins (it carries the history
 * fields the verdict needs); the catalogue fills the gaps — and supplies the
 * 48h median, which only lives on `market.last_completed`.
 */
function marketFor(urlName: string): VaultMarket {
  const a = byUrl.value[urlName] || null
  const c = catalogueByUrl.value[urlName] || null
  const cm = (c && c.market) || {}
  const lc = cm.last_completed || {}
  const pick = (x: any, y: any) => (x === undefined || x === null ? (y ?? null) : x)
  return {
    sell: pick(a?.sell, cm.sell),
    buy: pick(a?.buy, cm.buy),
    avg_price: pick(a?.avg_price, cm.avg_price),
    median: pick(lc.median, lc.moving_avg),
    volume: pick(a?.volume, cm.volume),
    atl: a?.atl ?? null,
    ath: a?.ath ?? null,
    pctFromAtl: a?.pctFromAtl ?? null,
    pctFromAth: a?.pctFromAth ?? null,
    change7d: a?.change7d ?? null,
    trend: a?.trend ?? null,
  }
}

interface VaultViewRow extends VaultRow {
  /** Localized display name (English `item_name` stays the lookup key). */
  name: string
  category: string
  thumb: string
  vaulted: boolean
  tags: string[]
}

const rows = computed<VaultViewRow[]>(() =>
  Object.values(ud.vault.value).map((entry: any) => {
    const cat = catalogueByUrl.value[entry.url_name] || null
    const analytics = byUrl.value[entry.url_name] || null
    const valued = valueHolding(
      { url_name: entry.url_name, item_name: entry.item_name, qty: entry.qty, cost: entry.cost },
      marketFor(entry.url_name),
      basis.value,
      liquidityAdjust.value,
    )
    const tags: string[] = (cat && cat.tags) || (analytics && analytics.tags) || []
    return {
      ...valued,
      name: localItemName({ url_name: entry.url_name, item_name: entry.item_name }) || entry.item_name,
      category: categoryOf(tags),
      thumb: itemThumb({ urlName: entry.url_name, itemName: entry.item_name, thumb: cat?.thumb || analytics?.thumb }),
      vaulted: !!(cat?.vaulted ?? analytics?.vaulted),
      tags,
    }
  }),
)

// Totals cover the WHOLE vault, not the filtered view — the header stats are a
// net-worth board, not a summary of the current search.
const totals = computed(() => vaultTotals(rows.value))

const categoryOptions = computed<string[]>(() => categoryOptionsFor(rows.value))

const VERDICT_ORDER: Record<VaultVerdict, number> = { sell: 0, hold: 1, thin: 2, unknown: 3 }

const filtered = computed<VaultViewRow[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const list = rows.value.filter((r) => {
    if (category.value !== 'All' && r.category !== category.value) return false
    if (q && !(r.item_name.toLowerCase().includes(q) || r.name.toLowerCase().includes(q))) return false
    return true
  })
  const desc = (a: number, b: number) => b - a
  const sorters: Record<string, (a: VaultViewRow, b: VaultViewRow) => number> = {
    realizable: (a, b) => desc(a.realizable, b.realizable),
    value: (a, b) => desc(a.value, b.value),
    pnl: (a, b) => desc(a.pnl ?? -Infinity, b.pnl ?? -Infinity),
    qty: (a, b) => desc(a.qty, b.qty),
    verdict: (a, b) => VERDICT_ORDER[a.verdict] - VERDICT_ORDER[b.verdict] || desc(a.realizable, b.realizable),
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.realizable)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<VaultViewRow[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topHolding = computed<VaultViewRow | null>(() => {
  let best: VaultViewRow | null = null
  for (const r of rows.value) if (!best || r.realizable > best.realizable) best = r
  return best
})
const topHoldingUrl = computed(() => (topHolding.value ? topHolding.value.url_name : ''))

// -------------------------------------------------------------- add control
// Localized name baked in so the typeahead matches what the player reads.
const pickerItems = computed<any[]>(() =>
  allItems.value
    .filter((i) => i.url_name && i.market)
    .map((i) => ({
      url_name: i.url_name,
      item_name: i.item_name,
      name: localItemName(i) || i.item_name,
      thumb: i.thumb,
    })),
)

function addItem() {
  const picked = picker.value
  if (!picked || !picked.url_name) return
  const qty = Math.max(1, Math.round(Number(addQty.value) || 1))
  const costNum = Number(addCost.value)
  const hasCost = addCost.value !== '' && addCost.value !== null && Number.isFinite(costNum)
  // Re-adding an item you already hold TOPS UP the stack rather than replacing
  // it — "Add 3" should never silently turn 20 into 3.
  const existing = ud.vault.value[picked.url_name]
  const nextQty = (existing?.qty || 0) + qty
  ud.setVaultQty(
    { url_name: picked.url_name, item_name: picked.item_name },
    nextQty,
    hasCost ? { cost: Math.max(0, costNum) } : {},
  )
  trackAction('vault_add', { url_name: picked.url_name, qty: nextQty })
  picker.value = null
  addQty.value = 1
  addCost.value = ''
}

const watchlistSeeds = computed<any[]>(() =>
  Object.values(ud.watchlist.value).filter(
    (w: any) => Number(w.ownedQty) > 0 && !ud.vault.value[w.url_name],
  ),
)

function importFromWatchlist() {
  const seeds = watchlistSeeds.value
  for (const w of seeds) {
    ud.setVaultQty({ url_name: w.url_name, item_name: w.item_name }, Number(w.ownedQty) || 0)
  }
  trackAction('vault_import_watchlist', { count: seeds.length })
}

// ------------------------------------------------------------- inline edits
function qtyValue(row: VaultViewRow): string {
  const draft = qtyDraft.value[row.url_name]
  return draft === undefined ? String(row.qty) : draft
}
function costValue(row: VaultViewRow): string {
  const draft = costDraft.value[row.url_name]
  if (draft !== undefined) return draft
  return row.cost === null || row.cost === undefined ? '' : String(row.cost)
}

function onQtyInput(row: VaultViewRow, v: any) {
  qtyDraft.value = { ...qtyDraft.value, [row.url_name]: v == null ? '' : String(v) }
  schedule('qty:' + row.url_name, () => commitQty(row))
}
function onCostInput(row: VaultViewRow, v: any) {
  costDraft.value = { ...costDraft.value, [row.url_name]: v == null ? '' : String(v) }
  schedule('cost:' + row.url_name, () => commitCost(row))
}

function commitQty(row: VaultViewRow) {
  const raw = qtyDraft.value[row.url_name]
  if (raw === undefined) return
  const next = { ...qtyDraft.value }
  delete next[row.url_name]
  qtyDraft.value = next
  // A blank field is a no-op, not a delete — deleting is the trash button's job.
  if (raw.trim() === '') return
  const qty = Math.max(0, Math.round(Number(raw) || 0))
  if (qty === row.qty) return
  ud.setVaultQty({ url_name: row.url_name, item_name: row.item_name }, qty)
  trackAction('vault_qty', { url_name: row.url_name, qty })
}

function commitCost(row: VaultViewRow) {
  const raw = costDraft.value[row.url_name]
  if (raw === undefined) return
  const next = { ...costDraft.value }
  delete next[row.url_name]
  costDraft.value = next
  const cost = raw.trim() === '' ? null : Math.max(0, Number(raw) || 0)
  if (cost === (row.cost ?? null)) return
  ud.setVaultQty({ url_name: row.url_name, item_name: row.item_name }, row.qty, { cost })
  trackAction('vault_cost', { url_name: row.url_name })
}

function removeRow(row: VaultViewRow) {
  ud.removeVault(row.url_name)
  trackAction('vault_remove', { url_name: row.url_name })
}

// Drop locations are indexed by the canonical ENGLISH item name.
function openDrops(row: VaultViewRow) {
  dropsItem.value = row.item_name
  dropsThumb.value = ''
  dropsDialog.value = true
  trackDialog('drop_locations', { item_name: row.item_name })
}

// --------------------------------------------------------------- CSV export
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}
function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100
}
function exportCsv() {
  const header = ['item', 'url_name', 'qty', 'unit', 'value', 'realizable', 'cost', 'pnl']
  const lines = [header.join(',')]
  for (const r of filtered.value) {
    lines.push(
      [
        csvCell(r.item_name),
        csvCell(r.url_name),
        r.qty,
        round2(r.unit),
        round2(r.value),
        round2(r.realizable),
        r.cost === null || r.cost === undefined ? '' : round2(r.cost),
        r.pnl === null ? '' : round2(r.pnl),
      ].join(','),
    )
  }
  const href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
  const a = document.createElement('a')
  a.href = href
  a.download = 'warframe-vault.csv'
  a.click()
  trackAction('vault_export', { rows: filtered.value.length })
}

// ------------------------------------------------------------------ display
function fmtPlat(n: number): string {
  const v = Number(n) || 0
  if (Math.abs(v) >= 100) return Math.round(v).toLocaleString()
  return (Math.round(v * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })
}
function fmtSigned(n: number | null): string {
  const v = Number(n) || 0
  return (v > 0 ? '+' : '') + fmtPlat(v)
}
function pnlClass(n: number | null): string {
  if (n === null || n === undefined) return ''
  if (n > 0) return 'up'
  if (n < 0) return 'down'
  return 'flat'
}
function verdictLabel(v: VaultVerdict): string {
  return t('vault.verdict.' + v)
}
function verdictPill(v: VaultVerdict): string {
  if (v === 'sell') return 'pill--good'
  if (v === 'hold') return 'pill--alt'
  return 'pill--even'
}

// ---------------------------------------------------------------- analytics
function onSort(v: any) {
  trackSort(v)
}
function onCategory(v: any) {
  trackFilter('category', v)
}
function onPage(n: number) {
  trackAction('paginate', { page: n })
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  const term = (q || '').toString().trim()
  if (!term) return
  searchTimer = setTimeout(() => trackSearch(term, filtered.value.length), 800)
})

// Only a *view* change resets the pager — editing a quantity on page 3 must not
// throw the user back to page 1.
watch([search, category, sortKey], () => {
  page.value = 1
})
watch(pageCount, (n) => {
  if (page.value > n) page.value = n
})

onUnmounted(() => {
  if (searchTimer) clearTimeout(searchTimer)
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
})

// Hide the global loading spinner once mounted (project rule). Bounded retry so
// a missing #spinner-wrapper element can't recurse forever.
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onMounted(() => {
  ud.start()
  finishLoading()
})
</script>

<style scoped>
/* Sign-in nudge under the hero — informative, never a gate. */
.va-sync {
  margin-top: 14px;
  font-family: var(--font-hud);
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  color: var(--ink-dim);
}
.va-sync a {
  color: var(--energy);
  text-decoration: none;
  font-weight: 700;
  margin-left: 6px;
}
.va-sync a:hover {
  color: var(--gold-ink);
}

/* Add row sits above the search row and reads as its own step. */
.va-add {
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 18px;
}
.va-picker {
  max-width: 420px;
}
.va-num {
  flex: 0 0 96px;
}
.va-num--wide {
  flex: 0 0 140px;
}
.va-addbtn {
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  border-radius: 0;
  font-family: var(--font-hud);
  font-weight: 700;
  letter-spacing: 0.08em;
}
.va-csv {
  font-family: var(--font-hud);
  letter-spacing: 0.08em;
}

.va-hidden {
  color: var(--ink-dim);
  margin-left: 8px;
  text-transform: none;
  letter-spacing: 0.02em;
}
.va-noprice {
  color: var(--rose);
}

/* Inline table editors — plain fields that read as text until focused. */
.va-edit {
  width: 76px;
}
.va-edit--cost {
  width: 88px;
}
.va-edit :deep(input) {
  font-family: var(--font-hud);
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
  color: var(--ink);
  padding: 2px 4px;
  min-height: 26px;
  border-bottom: 1px solid transparent;
}
.va-edit :deep(input:hover) {
  border-bottom-color: rgba(200, 168, 92, 0.4);
}
.va-edit :deep(input:focus) {
  border-bottom-color: var(--orokin);
}
.va-edit :deep(.v-field__input) {
  padding: 0;
}
/* Hide the browser spinners: the numbers are typed, not nudged. */
.va-edit :deep(input::-webkit-outer-spin-button),
.va-edit :deep(input::-webkit-inner-spin-button) {
  appearance: none;
  margin: 0;
}

.va-acts {
  display: flex;
  align-items: center;
  gap: 6px;
}
.va-iconbtn {
  flex: none;
  color: #4fb3bf;
  background: transparent;
  border: 1px solid rgba(79, 179, 191, 0.35);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  cursor: pointer;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.va-iconbtn:hover {
  color: var(--gold-ink);
  border-color: rgba(212, 175, 90, 0.5);
  background: rgba(212, 175, 90, 0.08);
}
.va-iconbtn--danger {
  color: var(--rose);
  border-color: rgba(217, 138, 138, 0.35);
}
.va-iconbtn--danger:hover {
  color: #f0a8a8;
  border-color: rgba(217, 138, 138, 0.6);
  background: rgba(217, 138, 138, 0.1);
}

/* Mobile card verdict row + editors. */
.va-verdicttag {
  font-family: var(--font-hud);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-dim);
}
.va-card__edit {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.va-empty__title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.1em;
  color: var(--gold-ink);
  text-transform: uppercase;
  margin-bottom: 10px;
}
.va-empty__text {
  max-width: 560px;
  margin: 0 auto 18px;
  line-height: 1.6;
}

.an-badge--vault {
  background: rgba(138, 143, 163, 0.18);
  color: #b6bcd0;
  border: 1px solid rgba(138, 143, 163, 0.4);
}

@media (max-width: 700px) {
  .va-picker {
    max-width: none;
  }
  .va-num,
  .va-num--wide {
    flex: 1 1 110px;
  }
}
</style>
