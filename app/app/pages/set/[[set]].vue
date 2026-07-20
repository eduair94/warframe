<template>
  <div class="an st">
    <!-- Visually-hidden H1 keeps the entity keyword for SEO; the visible name is the Cinzel hero below. -->
    <h1 class="st-sr">
      {{ setName ? t('setDetail.h1WithName', { name: setName }) : t('setDetail.h1Fallback') }}
    </h1>

    <div class="an-console st-console">
      <!-- Top bar: set picker, freshness, refresh -->
      <div class="st-topbar">
        <div class="st-crumbs">
          {{ t('setDetail.crumb') }}
          <span v-if="displayName" class="st-crumbs__sep" aria-hidden="true"></span>
          <b v-if="displayName">{{ displayName }}</b>
        </div>
        <div class="st-controls">
          <v-autocomplete
            v-model="pick"
            :items="allSetsLocalized"
            item-title="item_name"
            item-value="url_name"
            :label="t('relic_search')"
            density="compact"
            hide-details
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            class="st-pick"
            @update:model-value="onPick"
          ></v-autocomplete>
          <div v-if="setSlug" class="st-fresh">
            <span class="st-fresh__lbl" :title="t('setDetail.freshTitle')">
              <v-icon size="14">mdi-clock-outline</v-icon>
              {{ updatedLabel ? t('setDetail.updated', { time: updatedLabel }) : t('setDetail.updatedNever') }}
            </span>
            <button
              type="button"
              class="st-sync"
              :disabled="refreshing"
              :title="t('setDetail.refreshTitle')"
              @click="syncPrices()"
            >
              <v-icon size="15" :class="{ 'st-sync__spin': refreshing }">mdi-refresh</v-icon>
              {{ refreshing ? t('setDetail.refreshing') : t('setDetail.refresh') }}
            </button>
            <!-- A failed manual refresh keeps the previous numbers on screen; say
                 so rather than passing stale data off as fresh. -->
            <span v-if="refreshError" class="st-staleflag" :title="t('setDetail.refreshFailedTitle')">
              <v-icon size="14">mdi-alert-outline</v-icon> {{ t('setDetail.refreshFailed') }}
            </span>
          </div>
        </div>
      </div>

      <!-- No set chosen -->
      <div v-if="!setSlug" class="st-state">
        <span class="st-state__node" aria-hidden="true"></span>
        <p>{{ t('setDetail.pickPrompt') }}</p>
        <nuxt-link class="st-state__link" :to="localePath('/comparison')">
          {{ t('setDetail.browseAll') }} →
        </nuxt-link>
      </div>

      <!-- Unknown slug / API error -->
      <div v-else-if="loadFailed" class="st-state">
        <span class="st-state__node" aria-hidden="true"></span>
        <p>{{ t('setDetail.notFound', { name: displayName }) }}</p>
        <button type="button" class="st-state__link" :disabled="refreshing" @click="syncPrices(true)">
          {{ refreshing ? t('setDetail.refreshing') : t('setDetail.retry') }}
        </button>
      </div>

      <template v-else-if="payload">
        <!-- Hero: set name + the verdict under the active basis -->
        <div class="st-hero">
          <div class="st-hero__text">
            <div class="an-eyebrow">{{ t('setDetail.eyebrow') }}</div>
            <div class="st-name">
              <img
                v-if="hasHeadThumb"
                :key="headThumb"
                class="st-name__thumb"
                :src="headThumb"
                :alt="displayName"
                @error="onImgError"
              />
              <span>{{ displayName }}</span>
              <span v-if="payload.set.vaulted" class="st-vault">{{ t('setDetail.vaulted') }}</span>
            </div>
            <p class="an-lede">{{ t('setDetail.lede', { name: displayName }) }}</p>
          </div>

          <div class="st-verdict" :class="'is-' + active.verdict">
            <div class="st-verdict__lbl">{{ t('setDetail.deal') }}</div>
            <div class="st-verdict__head">{{ t('setDetail.verdict.' + active.verdict) }}</div>
            <div class="st-verdict__plat">
              {{ fmtSigned(Math.abs(active.save)) }}<span>p</span>
            </div>
            <div class="st-verdict__sub">
              {{
                active.verdict === 'even'
                  ? t('setDetail.verdictSub.even')
                  : t('setDetail.verdictSub.' + active.verdict, {
                      pct: fmtPct(Math.abs(active.savePct)),
                      basis: t('setDetail.basis.' + basis),
                    })
              }}
            </div>
          </div>
        </div>

        <!-- Pricing basis toggle -->
        <section class="st-basis">
          <div class="st-basis__lbl">{{ t('setDetail.basisLabel') }}</div>
          <v-btn-toggle
            v-model="basis"
            mandatory
            density="comfortable"
            class="st-seg"
            @update:model-value="onBasisChange"
          >
            <v-btn
              v-for="key in BASIS_KEYS"
              :key="key"
              :value="key"
              size="small"
              :disabled="!supported[key]"
              :title="supported[key] ? t('setDetail.basisHelp.' + key) : t('setDetail.basisUnavailable')"
            >
              {{ t('setDetail.basis.' + key) }}
            </v-btn>
          </v-btn-toggle>
          <p class="st-basis__help">{{ t('setDetail.basisHelp.' + basis) }}</p>
          <p v-if="active.incomplete" class="st-basis__warn">
            <v-icon size="14">mdi-alert-outline</v-icon>
            {{ t('setDetail.incomplete', { priced: active.coverage.priced, total: active.coverage.total }) }}
          </p>
        </section>

        <!-- Headline numbers under the active basis -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(active.setCost) }}<small>p</small></div>
            <div class="an-stat__lbl">{{ t('setDetail.stats.setCost') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(active.partsCost) }}<small>p</small></div>
            <div class="an-stat__lbl">{{ t('setDetail.stats.partsCost') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num" :class="active.save > 0 ? 'is-good' : 'is-gold'">
              {{ fmtSigned(active.save) }}<small>p</small>
            </div>
            <div class="an-stat__lbl">{{ t('setDetail.stats.save') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ fmtInt(payload.set.market.volume) }}</div>
            <div class="an-stat__lbl">{{ t('setDetail.stats.volume') }}</div>
          </div>
        </div>

        <!-- Ledger: the assembled set, then every part -->
        <div v-if="!isMobile" class="an-tablewrap st-tablewrap">
          <table class="an-table st-table">
            <thead>
              <tr>
                <th class="col-name">{{ t('setDetail.cols.part') }}</th>
                <th>{{ t('setDetail.cols.qty') }}</th>
                <th class="grp-a">{{ t('setDetail.cols.acquire') }}</th>
                <th class="grp-b">{{ t('setDetail.cols.resale') }}</th>
                <th>{{ t('setDetail.cols.spread') }}</th>
                <th>{{ t('setDetail.cols.volume') }}</th>
                <th>{{ t('setDetail.cols.ducats') }}</th>
                <th>{{ t('setDetail.cols.trend') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in ledger" :key="row.node.url_name">
                <tr :class="{ 'is-top': row.isSet }">
                  <td class="col-name">
                    <!-- The delegated outbound tracker cannot know WHICH part of the
                         ledger was clicked; that is the whole question here. -->
                    <a
                      class="an-name"
                      :href="mkt(row.node.url_name)"
                      target="_blank"
                      rel="noopener"
                      @click="trackMarketOpen(row.node.url_name, { source: 'part_row', is_set: row.isSet })"
                    >
                      <img
                        class="an-thumb"
                        :src="thumbOf(row.node)"
                        :alt="nameOf(row.node)"
                        loading="lazy"
                        @error="onImgError"
                      />
                      <span>
                        {{ nameOf(row.node) }}
                        <span v-if="row.isSet" class="an-badge">{{ t('setDetail.rowSet') }}</span>
                        <small v-if="row.estimated" class="an-sub st-est" :title="estTitle(row)">
                          {{ t('setDetail.est') }}
                        </small>
                      </span>
                    </a>
                  </td>
                  <td class="an-num">{{ row.isSet ? '—' : '×' + row.quantity }}</td>
                  <td class="grp-a an-num an-strong">{{ fmtPlat(row.acquire) }}p</td>
                  <td class="grp-b an-num">{{ fmtPlat(row.resale) }}p</td>
                  <td class="an-num" :class="spreadClass(row)">{{ fmtPlat(row.acquire - row.resale) }}p</td>
                  <td class="an-num" :class="{ 'st-thin': isThin(row.node) }">
                    {{ fmtInt(row.node.market.volume) }}
                  </td>
                  <td class="an-num">{{ row.node.ducats ? fmtInt(row.node.ducats) : '—' }}</td>
                  <td>
                    <PriceSpark
                      :values="sparkOf(row.node)"
                      :direction="row.node.history?.trend?.direction || 'flat'"
                      :aria-label="t('setDetail.cols.trend')"
                    />
                  </td>
                  <td class="st-actions">
                    <v-btn
                      icon
                      size="small"
                      color="#4fb3bf"
                      variant="text"
                      :aria-label="t('setDetail.actions.dropsAria', { name: nameOf(row.node) })"
                      @click="openDrops(row.node)"
                    >
                      <v-icon>mdi-map-marker-radius-outline</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      color="#d4af5a"
                      variant="text"
                      :aria-label="expanded.has(row.node.url_name) ? t('setDetail.actions.collapse') : t('setDetail.actions.expand')"
                      @click="toggle(row.node.url_name)"
                    >
                      <v-icon>{{ expanded.has(row.node.url_name) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                    </v-btn>
                  </td>
                </tr>
                <tr v-if="expanded.has(row.node.url_name)" class="st-detailrow">
                  <td colspan="9">
                    <SetItemDetail :row="row" />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Mobile: one card per ledger row -->
        <div v-else class="an-cards st-cards">
          <div v-for="row in ledger" :key="row.node.url_name" class="an-card" :class="{ 'is-top': row.isSet }">
            <div class="an-card__head">
              <img
                class="an-thumb"
                :src="thumbOf(row.node)"
                :alt="nameOf(row.node)"
                loading="lazy"
                @error="onImgError"
              />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ nameOf(row.node) }}
                  <span v-if="row.isSet" class="an-badge">{{ t('setDetail.rowSet') }}</span>
                </div>
                <small class="an-sub">
                  <template v-if="!row.isSet">×{{ row.quantity }} · </template>
                  {{ t('setDetail.cols.volume') }} {{ fmtInt(row.node.market.volume) }}
                  <template v-if="row.estimated"> · {{ t('setDetail.est') }}</template>
                </small>
              </div>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">{{ t('setDetail.cols.acquire') }}</div>
                <div class="an-block__row">
                  <span>{{ t('setDetail.detail.perUnit') }}</span><b>{{ fmtPlat(row.acquire) }}p</b>
                </div>
                <div v-if="!row.isSet" class="an-block__row">
                  <span>{{ t('setDetail.detail.lineTotal') }}</span><b>{{ fmtPlat(row.acquireTotal) }}p</b>
                </div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">{{ t('setDetail.cols.resale') }}</div>
                <div class="an-block__row">
                  <span>{{ t('setDetail.detail.perUnit') }}</span><b>{{ fmtPlat(row.resale) }}p</b>
                </div>
                <div class="an-block__row">
                  <span>{{ t('setDetail.cols.ducats') }}</span
                  ><b>{{ row.node.ducats ? fmtInt(row.node.ducats) : '—' }}</b>
                </div>
              </div>
            </div>
            <div v-if="expanded.has(row.node.url_name)" class="st-detailcard">
              <SetItemDetail :row="row" />
            </div>
            <div class="st-cardactions">
              <button type="button" class="st-cardbtn" @click="openDrops(row.node)">
                <v-icon size="16">mdi-map-marker-radius-outline</v-icon> {{ t('setDetail.actions.drops') }}
              </button>
              <button type="button" class="st-cardbtn" @click="toggle(row.node.url_name)">
                <v-icon size="16">{{ expanded.has(row.node.url_name) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                {{ expanded.has(row.node.url_name) ? t('setDetail.actions.collapse') : t('setDetail.actions.expand') }}
              </button>
              <a
                class="st-cardbtn"
                :href="mkt(row.node.url_name)"
                target="_blank"
                rel="noopener"
                @click="trackMarketOpen(row.node.url_name, { source: 'part_card', is_set: row.isSet })"
              >
                <v-icon size="16">mdi-open-in-new</v-icon> {{ t('setDetail.actions.market') }}
              </a>
            </div>
          </div>
        </div>

        <!-- Cross-basis summary: does the verdict survive every reading? -->
        <section class="st-bases">
          <div class="st-bases__lbl">{{ t('setDetail.detail.allBases') }}</div>
          <div class="an-tablewrap">
            <table class="an-table st-basetable">
              <thead>
                <tr>
                  <th class="col-name">{{ t('setDetail.basisLabel') }}</th>
                  <th>{{ t('setDetail.stats.setCost') }}</th>
                  <th>{{ t('setDetail.stats.partsCost') }}</th>
                  <th>{{ t('setDetail.stats.save') }}</th>
                  <th>{{ t('setDetail.cols.verdict') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="key in BASIS_KEYS"
                  :key="key"
                  :class="{ 'is-top': key === basis }"
                  @click="onBasisRow(key)"
                >
                  <td class="col-name">
                    {{ t('setDetail.basis.' + key) }}
                    <small v-if="!supported[key]" class="an-sub">{{ t('setDetail.partial') }}</small>
                  </td>
                  <td class="an-num">{{ fmtPlat(allBases[key].setCost) }}p</td>
                  <td class="an-num">{{ fmtPlat(allBases[key].partsCost) }}p</td>
                  <td class="an-num an-strong" :class="saveClass(allBases[key].save)">
                    {{ fmtSigned(allBases[key].save) }}p
                  </td>
                  <td>
                    <span class="pill" :class="verdictPill(allBases[key].verdict)">
                      {{ t('setDetail.verdict.' + allBases[key].verdict) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Support -->
        <div class="st-donate">
          <span>{{ t('setDetail.helpDonating') }}</span>
          <a
            target="_blank"
            rel="noopener"
            :aria-label="t('setDetail.donatePaypal')"
            href="https://ko-fi.com/cambio_uruguay"
          >
            <v-img max-width="40" height="40" src="/img/paypal_icon.png">
              <template #sources><source srcset="/img/paypal_icon.webp" /></template>
            </v-img>
          </a>
          <a
            target="_blank"
            rel="noopener"
            :aria-label="t('setDetail.donateMercadoPago')"
            href="https://mpago.la/19j46vX"
          >
            <v-img max-width="40" height="40" src="/img/mercadopago_icon.png">
              <template #sources><source srcset="/img/mercadopago_icon.webp" /></template>
            </v-img>
          </a>
        </div>
      </template>
    </div>

    <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
      {{ t('disclaimer') }}
    </v-alert>

    <DropLocationsDialog v-model="dropDialog" :item-name="dropItemName" :thumb="dropThumb" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { fmtPlat } from '~/composables/marketFormat'
import {
  priceSet,
  priceAllBases,
  basisSupported,
  BASIS_KEYS,
  type BasisKey,
  type BasisResult,
  type LedgerRow,
  type SetNode,
} from '~/composables/useSetPricing'
import SetItemDetail from '~/components/SetItemDetail.vue'

dayjs.extend(relativeTime)

const base = useApiBase() as string
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const localePath = useLocalePath()
const { localItemName, localName } = useLocalizedName()
const { itemThumb, THUMB_PLACEHOLDER } = useItemThumb()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const { trackAction, trackDialog, trackFilter, trackMarketOpen, trackSelectItem, trackViewItem } =
  useAnalytics()

const items = useItemsStore()
const allSets = computed(() => items.allSets)
// Localized suggestion titles for the picker; the bound value stays url_name.
const allSetsLocalized = computed(() =>
  allSets.value.map((s: any) => ({ ...s, item_name: localItemName(s) })),
)

const setSlug = computed(() => route.params.set as string | undefined)
const setName = computed(() => prettifySlug(setSlug.value))

// Entity-specific SEO — the set name comes from the route param, so it can't
// live in the static seo.ts map. Canonical/hreflang stay centralised in the
// layout (do NOT call useLocaleHead here).
const setSeo = PAGE_SEO['/set']
useSeoPage({
  title: () =>
    setName.value
      ? `${setName.value} — Price & Set vs Parts (Warframe Market)`
      : setSeo?.title ?? '',
  description: () =>
    setName.value
      ? `Live Warframe Market platinum prices for the ${setName.value}: assembled set vs individual parts across five pricing bases, order-book depth, 48h volume and 30-day price history.`
      : setSeo?.description ?? '',
})

interface SetFullPayload {
  set: SetNode
  parts: SetNode[]
  meta: {
    generatedAt: string
    oldestPriceUpdate: string | null
    newestPriceUpdate: string | null
    historyDays: number
    partsCount: number
    pricedParts: number
  }
}

// Cache-buster appended to the request URL by the refresh button. The API caches
// by originalUrl (Redis + edge), so a changed query string is what actually
// forces a read of the current database state.
const bust = ref(0)

// SSR'd so crawlers get real prices on every set page (the old page was
// client-only and shipped an empty shell).
const { data: fetched, error, refresh } = await useAsyncData<SetFullPayload | null>(
  () => `set-full-${setSlug.value || 'none'}`,
  async () => {
    if (!setSlug.value) return null
    const suffix = bust.value ? `?_ts=${bust.value}` : ''
    const res = await $fetch<any>(
      `${base}/set_full/${encodeURIComponent(setSlug.value)}${suffix}`,
      bust.value ? { cache: 'no-cache' } : {},
    )
    // The cached API wrapper answers a failed producer with a 200 { error } body
    // rather than an HTTP error, which would slip past a plain `!payload` guard
    // and crash the template. Only a well-formed bundle counts as data.
    return res && res.set && Array.isArray(res.parts) ? (res as SetFullPayload) : null
  },
  { watch: [setSlug] },
)

// Last successfully loaded bundle for THIS slug. A manual refresh that fails
// (API down, endpoint not yet deployed) must not blank a page that is already
// showing good data — it keeps rendering the previous numbers and surfaces the
// failure next to the button instead.
const lastGood = ref<SetFullPayload | null>(fetched.value ?? null)
watch(fetched, (value) => {
  if (value) lastGood.value = value
})
// Navigating to a different set must drop the previous set's data rather than
// showing it under the new name.
watch(setSlug, () => {
  lastGood.value = null
  refreshError.value = false
  // Normal navigation should hit the shared cache; only the button opts out.
  bust.value = 0
})

const payload = computed<SetFullPayload | null>(() => fetched.value ?? lastGood.value)

// The error STATE is only for "there is nothing to show". A failed refresh sets
// `error` while `lastGood` still holds a perfectly good ledger — keying off
// `error` here would blank the page the fallback exists to preserve. The failure
// is surfaced by the `refreshError` flag next to the button instead.
const loadFailed = computed(() => !!setSlug.value && !payload.value)

const displayName = computed(() =>
  payload.value
    ? localName('items', payload.value.set.url_name, payload.value.set.item_name)
    : setName.value,
)

// ---------------------------------------------------------------------------
// Pricing basis
// ---------------------------------------------------------------------------

const BASIS_STORAGE_KEY = 'wf.set.basis'
const basis = ref<BasisKey>('instant')

const parts = computed<SetNode[]>(() => payload.value?.parts ?? [])

const supported = computed<Record<BasisKey, boolean>>(() => {
  const out = {} as Record<BasisKey, boolean>
  for (const key of BASIS_KEYS) out[key] = basisSupported(payload.value?.set, parts.value, key)
  return out
})

const allBases = computed(() =>
  priceAllBases(payload.value?.set, parts.value, payload.value?.meta.partsCount),
)
const active = computed<BasisResult>(() =>
  priceSet(payload.value?.set, parts.value, basis.value, payload.value?.meta.partsCount),
)

useMarketItemLd({
  name: displayName,
  description: () =>
    payload.value
      ? `Live Warframe Market platinum price for the assembled ${displayName.value}, versus buying its parts individually.`
      : '',
  image: () =>
    payload.value
      ? itemThumb({
          urlName: payload.value.set.url_name,
          itemName: payload.value.set.item_name,
          thumb: payload.value.set.thumb,
        })
      : undefined,
  plat: () => (active.value.available ? active.value.setCost : undefined),
  platLabel: 'Assembled set platinum price (Warframe Market)',
})

// A set with no order-book ladder cannot answer the "bulk" basis, and a set that
// has never traded has no median. Falling back to instant keeps the toggle from
// resting on a disabled option after navigating between sets.
watch(
  [supported, () => setSlug.value],
  () => {
    if (payload.value && !supported.value[basis.value]) basis.value = 'instant'
  },
  { immediate: true },
)

// Remember the user's choice across sets and sessions.
onMounted(() => {
  const stored = localStorage.getItem(BASIS_STORAGE_KEY) as BasisKey | null
  if (stored && BASIS_KEYS.includes(stored) && supported.value[stored]) basis.value = stored
})
watch(basis, (key) => {
  if (import.meta.client) localStorage.setItem(BASIS_STORAGE_KEY, key)
})

/**
 * Analytics: which basis the user ends up reading the deal on. Reported from the
 * two surfaces that change it by hand — the toggle and the cross-basis table —
 * rather than from a `watch(basis)`, which would also fire for the localStorage
 * restore and the unsupported-basis fallback.
 */
function onBasisChange(key: unknown) {
  if (typeof key === 'string') trackFilter('basis', key, { source: 'toggle' })
}

/**
 * Same contract from the cross-basis table, whose whole rows are clickable.
 * Vuetify drops the toggle's emit when the active button is clicked again, but a
 * table row has no such guard — without the comparison, re-reading the row that
 * is already active would report a basis change that never happened.
 */
function onBasisRow(key: BasisKey) {
  if (key !== basis.value) trackFilter('basis', key, { source: 'matrix' })
  basis.value = key
}

// One view_item per set actually opened. Keyed on the set's url_name so neither
// a price refresh nor a basis switch (both rebuild every derived number) reports
// the same set as viewed twice.
watch(
  () => payload.value?.set.url_name,
  (urlName) => {
    if (urlName) trackViewItem(urlName, { verdict: active.value.verdict })
  },
  { immediate: true },
)

// ---------------------------------------------------------------------------
// Ledger rows — the set first, then the parts
// ---------------------------------------------------------------------------

const ledger = computed<LedgerRow[]>(() => {
  if (!payload.value) return []
  const setRow = priceSet(payload.value.set, [payload.value.set], basis.value).rows[0]
  const rows: LedgerRow[] = []
  if (setRow) rows.push({ ...setRow, isSet: true })
  for (const row of active.value.rows) rows.push({ ...row, isSet: false })
  return rows
})

const expanded = ref<Set<string>>(new Set())
function toggle(urlName: string) {
  const next = new Set(expanded.value)
  if (next.has(urlName)) next.delete(urlName)
  else {
    next.add(urlName)
    trackAction('part_detail_expand', { item_name: urlName })
  }
  expanded.value = next
}

// ---------------------------------------------------------------------------
// Freshness + refresh
// ---------------------------------------------------------------------------

const refreshing = ref(false)
/** Set when a manual refresh failed while good data is still on screen. */
const refreshError = ref(false)
// The label is derived from a ticking clock so "4m ago" keeps counting up
// without a refetch.
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  clock = setInterval(() => (now.value = Date.now()), 30_000)
})
onBeforeUnmount(() => {
  if (clock) clearInterval(clock)
})

const updatedLabel = computed(() => {
  const stamp = payload.value?.meta.newestPriceUpdate
  if (!stamp) return ''
  const d = dayjs(stamp)
  // Touch `now` so the relative label re-renders on each tick.
  void now.value
  return d.isValid() ? d.fromNow() : ''
})

/** Minimum gap between manual refreshes — the data behind them syncs in batches. */
const REFRESH_MIN_GAP_MS = 10_000
let lastRefreshAt = 0

/**
 * @param force - Skip the rate limit. The error-state Retry button must always
 *        do something; silently swallowing it for 10 seconds reads as a broken
 *        button. The throttle only exists to stop idle hammering of the header
 *        refresh, which has data on screen already.
 */
async function syncPrices(force = false) {
  if (refreshing.value) return
  if (!force && Date.now() - lastRefreshAt < REFRESH_MIN_GAP_MS) return
  lastRefreshAt = Date.now()
  refreshing.value = true
  refreshError.value = false
  bust.value = Date.now()
  // Only reached once the throttle has let the click through, so this counts
  // refreshes that really refetch. `forced` separates the error-state Retry from
  // the header button.
  trackAction('prices_refresh', { forced: force })
  try {
    await refresh()
    // useAsyncData captures a failure into `error` rather than throwing, so the
    // catch below alone would miss it.
    refreshError.value = !!error.value || !fetched.value
  } catch {
    refreshError.value = true
  } finally {
    refreshing.value = false
    // Drop the buster so ordinary navigation and SSR go back through the shared
    // cache instead of forcing an uncached read on every subsequent request.
    bust.value = 0
  }
}

// ---------------------------------------------------------------------------
// Drops dialog
// ---------------------------------------------------------------------------

const dropDialog = ref(false)
const dropItemName = ref('')
const dropThumb = ref('')
function openDrops(node: SetNode) {
  // The dialog matches on the ENGLISH item_name, never the localized label.
  dropItemName.value = node.item_name
  dropThumb.value = node.thumb || ''
  dropDialog.value = true
  trackDialog('drop_locations', { item_name: node.url_name })
}

// ---------------------------------------------------------------------------
// Picker + formatting helpers
// ---------------------------------------------------------------------------

const pick = ref<string | undefined>(setSlug.value)
watch(setSlug, (slug) => {
  pick.value = slug
})
function onPick(slug: string | null) {
  if (slug) {
    trackSelectItem(slug, { source: 'picker' })
    router.push(localePath('/set/' + slug))
  }
}

const headThumb = computed(() =>
  itemThumb({
    urlName: payload.value?.set.url_name,
    itemName: payload.value?.set.item_name,
    thumb: payload.value?.set.thumb,
  }),
)
const hasHeadThumb = computed(() => headThumb.value !== THUMB_PLACEHOLDER)

function thumbOf(node: SetNode): string {
  return itemThumb({ urlName: node.url_name, itemName: node.item_name, thumb: node.thumb })
}
function nameOf(node: SetNode): string {
  return localName('items', node.url_name, node.item_name)
}
function mkt(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = THUMB_PLACEHOLDER
}
function sparkOf(node: SetNode): number[] {
  return (node.history?.points ?? []).map((p) => p.avg_price)
}
/** Volume this low means one listing moves the price — flag it in the table. */
function isThin(node: SetNode): boolean {
  return (Number(node.market?.volume) || 0) <= 3
}
function estTitle(row: LedgerRow): string {
  return t('setDetail.estTitle', {
    basis: t('setDetail.basis.' + basis.value),
    from: row.from ? t('setDetail.basis.' + row.from) : '—',
  })
}
function fmtInt(n: unknown): string {
  return String(Math.round(Number(n) || 0))
}
function fmtSigned(n: number): string {
  const v = Math.round(Number(n) || 0)
  return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`
}
function fmtPct(n: number): string {
  return `${(Number(n) || 0).toFixed(0)}%`
}
function saveClass(n: number): string {
  const v = Number(n) || 0
  if (v > 0) return 'up'
  if (v < 0) return 'down'
  return 'flat'
}
/** A wide acquire-vs-resale gap is a warning, not a win — colour it as such. */
function spreadClass(row: LedgerRow): string {
  const gap = row.acquire - row.resale
  if (row.acquire <= 0) return 'flat'
  return gap / row.acquire > 0.35 ? 'down' : 'flat'
}
function verdictPill(verdict: string): string {
  if (verdict === 'parts') return 'pill--good'
  if (verdict === 'set') return 'pill--alt'
  return 'pill--even'
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
/* The .an wrapper supplies the Orokin tokens (--void/--orokin/--energy and the
   Cinzel/Rajdhani families); this component styles the set ledger on top. */
.st {
  padding: 16px 0 40px;
}
.st-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
/* Top bar */
.st-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px 24px;
  flex-wrap: wrap;
  padding: 16px 26px;
  border-bottom: 1px solid var(--line);
  background: rgba(0, 0, 0, 0.18);
}
.st-crumbs {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.66rem;
  color: var(--ink-dim);
  display: flex;
  align-items: center;
  gap: 9px;
}
.st-crumbs b {
  color: var(--orokin);
  font-weight: 600;
}
.st-crumbs__sep {
  width: 4px;
  height: 4px;
  background: #626884;
  transform: rotate(45deg);
}
.st-controls {
  display: flex;
  align-items: center;
  gap: 14px 18px;
  flex-wrap: wrap;
}
.st-pick {
  min-width: 210px;
  max-width: 280px;
}
.st-fresh {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.st-fresh__lbl {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  color: var(--ink-dim);
  white-space: nowrap;
}
.st-sync {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.72rem;
  color: var(--energy);
  background: transparent;
  border: 1px solid rgba(53, 214, 208, 0.32);
  padding: 4px 12px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.st-sync:hover:not(:disabled) {
  color: var(--energy-hi);
  border-color: var(--energy);
}
.st-sync:disabled {
  opacity: 0.55;
  cursor: default;
}
.st-sync__spin {
  animation: st-spin 0.9s linear infinite;
}
.st-staleflag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: var(--rose);
  white-space: nowrap;
}
@keyframes st-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty / not-found states */
.st-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 24px;
  text-align: center;
  color: var(--ink-dim);
  font-family: var(--font-hud);
}
.st-state__node {
  width: 12px;
  height: 12px;
  background: var(--orokin);
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.6);
}
.st-state__link {
  color: var(--energy);
  text-decoration: none;
  font-weight: 600;
  letter-spacing: 0.05em;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.st-state__link:hover {
  color: var(--energy-hi);
}

/* Hero */
.st-hero {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 340px);
  gap: 26px;
  padding: 28px 26px 22px;
  align-items: center;
}
.st-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.7rem, 4.2vw, 2.7rem);
  line-height: 1.06;
  color: var(--gold-ink);
  text-wrap: balance;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.st-name__thumb {
  width: 54px;
  height: 54px;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid var(--orokin-line);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.st-vault {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.62rem;
  color: var(--rose);
  border: 1px solid rgba(217, 138, 138, 0.4);
  padding: 2px 8px;
  align-self: center;
}

/* Verdict card */
.st-verdict {
  border: 1px solid var(--orokin-line);
  border-left: 3px solid var(--orokin);
  background: rgba(200, 168, 92, 0.05);
  padding: 16px 20px;
}
.st-verdict.is-parts {
  border-left-color: var(--energy);
  background: rgba(53, 214, 208, 0.06);
}
.st-verdict.is-even {
  border-left-color: #626884;
  background: rgba(255, 255, 255, 0.02);
}
.st-verdict__lbl,
.st-basis__lbl,
.st-bases__lbl {
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.62rem;
  color: var(--ink-dim);
}
.st-verdict__head {
  font-family: var(--font-display);
  font-size: 1.12rem;
  color: var(--gold-ink);
  margin: 4px 0 2px;
}
.st-verdict.is-parts .st-verdict__head {
  color: var(--energy-hi);
}
.st-verdict__plat {
  font-variant-numeric: tabular-nums;
  font-size: 2.1rem;
  font-weight: 700;
  line-height: 1.05;
  color: var(--ink);
}
.st-verdict__plat span {
  font-size: 1rem;
  color: var(--ink-dim);
  margin-left: 2px;
}
.st-verdict__sub {
  font-size: 0.78rem;
  color: var(--ink-dim);
  margin-top: 4px;
}

/* Basis toggle */
.st-basis {
  padding: 4px 26px 18px;
}
.st-seg {
  margin-top: 8px;
  flex-wrap: wrap;
  height: auto !important;
}
.st-basis__help {
  margin: 8px 0 0;
  font-size: 0.8rem;
  color: var(--ink-dim);
  max-width: 74ch;
}
.st-basis__warn {
  margin: 6px 0 0;
  font-size: 0.78rem;
  color: var(--rose);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Ledger */
.st-tablewrap {
  padding: 0 26px;
}
.st-table {
  min-width: 860px;
}
.st-est {
  color: var(--orokin);
  cursor: help;
}
.st-thin {
  color: var(--rose);
}
.st-actions {
  white-space: nowrap;
  text-align: right;
}
.st-detailrow > td {
  padding: 0 !important;
  background: rgba(0, 0, 0, 0.22);
  /* analytics.css right-aligns and nowraps every .an-table cell for numeric
     columns; the expanded panel is prose + grids, so opt back out. */
  text-align: left;
  white-space: normal;
}

/* Mobile cards */
.st-cards {
  padding: 0 16px;
}
.st-cardactions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.st-cardbtn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-hud);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 5px 10px;
  text-decoration: none;
  cursor: pointer;
}
.st-cardbtn:hover {
  color: var(--energy);
  border-color: rgba(53, 214, 208, 0.4);
}
.st-detailcard {
  margin-top: 10px;
  border-top: 1px solid var(--line);
}

/* Cross-basis summary */
.st-bases {
  padding: 26px 26px 8px;
}
.st-basetable {
  min-width: 620px;
  margin-top: 8px;
}
.st-basetable tbody tr {
  cursor: pointer;
}

/* Support row */
.st-donate {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 18px 26px 24px;
  border-top: 1px solid var(--line);
  font-family: var(--font-hud);
  color: var(--ink-dim);
  font-size: 0.86rem;
}

@media (max-width: 860px) {
  .st-hero {
    grid-template-columns: 1fr;
    padding: 22px 18px 18px;
  }
  .st-topbar,
  .st-basis,
  .st-bases,
  .st-donate {
    padding-left: 18px;
    padding-right: 18px;
  }
  .st-pick {
    max-width: none;
    flex: 1 1 100%;
  }
}
</style>
