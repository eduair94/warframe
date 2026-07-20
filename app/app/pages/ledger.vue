<template>
  <div class="an le">
    <client-only>
      <template #fallback>
        <div class="an-console">
          <header class="an-hero">
            <div class="an-hero__text">
              <div class="an-eyebrow">{{ t('ledger.eyebrow') }}</div>
              <h1 class="an-title">{{ t('ledger.hero.title') }}</h1>
              <p class="an-lede">{{ t('ledger.hero.lede') }}</p>
            </div>
          </header>
          <div class="an-empty">{{ t('ledger.empty.body') }}</div>
        </div>
      </template>

      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('ledger.eyebrow') }}</div>
            <h1 class="an-title">{{ t('ledger.hero.title') }}</h1>
            <p class="an-lede">{{ t('ledger.hero.lede') }}</p>
          </div>
          <div v-if="summary.trades" class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('ledger.hero.dealLabel') }}</div>
            <div class="an-hero__deal-plat" :class="summary.realized < 0 ? 'is-loss' : ''">
              {{ signed(summary.realized) }}<span>p</span>
            </div>
            <div class="an-hero__deal-sub">
              {{ spanDays > 1
                ? t('ledger.hero.dealSub', { trades: summary.trades, days: spanDays })
                : t('ledger.hero.dealSubOne', { trades: summary.trades }) }}
            </div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num" :class="summary.realized < 0 ? 'down' : 'is-good'">{{ signed(summary.realized) }}p</div>
            <div class="an-stat__lbl">{{ t('ledger.stats.realized') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ summary.trades }}</div>
            <div class="an-stat__lbl">{{ t('ledger.stats.trades') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmt1(summary.platPerDay || 0) }}p</div>
            <div class="an-stat__lbl">{{ t('ledger.stats.perDay') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ signed(summary.bestTrade ? summary.bestTrade.realized : 0) }}p</div>
            <div class="an-stat__lbl">{{ t('ledger.stats.best') }}</div>
          </div>
        </div>

        <!-- Record a trade -->
        <section class="an-filters">
          <div class="le-legend">{{ t('ledger.form.legend') }}</div>
          <div class="an-filters__row le-form">
            <v-btn-toggle v-model="side" mandatory density="compact" class="le-side">
              <v-btn value="buy" size="small">{{ t('ledger.form.buy') }}</v-btn>
              <v-btn value="sell" size="small">{{ t('ledger.form.sell') }}</v-btn>
            </v-btn-toggle>

            <v-autocomplete
              v-model="picked"
              :items="tradeItems"
              item-title="name"
              item-value="url_name"
              return-object
              auto-select-first
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              :label="t('ledger.form.item')"
              :no-data-text="t('ledger.form.noMatches')"
              class="an-search le-item"
              @update:model-value="onPick"
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
              v-model.number="qty"
              type="number"
              min="1"
              step="1"
              density="compact"
              hide-details
              :label="t('ledger.form.qty')"
              class="an-field le-num"
            ></v-text-field>
            <v-text-field
              v-model.number="price"
              type="number"
              min="0"
              step="1"
              density="compact"
              hide-details
              :label="t('ledger.form.price')"
              class="an-field le-num"
            ></v-text-field>
            <v-text-field
              v-model="date"
              type="date"
              density="compact"
              hide-details
              :label="t('ledger.form.date')"
              class="an-field le-date"
            ></v-text-field>
            <v-text-field
              v-model="note"
              density="compact"
              hide-details
              clearable
              :label="t('ledger.form.note')"
              class="an-field le-note"
            ></v-text-field>

            <button class="le-submit" type="button" :disabled="!picked" @click="submit">
              <v-icon size="16">mdi-plus</v-icon>
              {{ t('ledger.form.submit') }}
            </button>
          </div>

          <div class="an-toggles">
            <v-switch
              v-model="syncVault"
              hide-details
              density="compact"
              inset
              color="#4fb3bf"
              :label="t('ledger.form.syncVault')"
              class="an-toggle"
              @update:model-value="onSyncVault"
            ></v-switch>
            <span class="le-hint">{{ t('ledger.form.syncVaultHint') }}</span>
          </div>

          <div class="le-sync">
            <template v-if="auth.signedIn">
              <v-icon size="15" color="#35d6d0">mdi-cloud-check-outline</v-icon>
              <span>{{ t('ledger.sync.on') }}</span>
            </template>
            <template v-else>
              <v-icon size="15" color="#8f95ab">mdi-cloud-off-outline</v-icon>
              <span>{{ t('ledger.sync.cta') }}</span>
              <button class="le-signin" type="button" @click="openAuth">{{ t('ledger.sync.signIn') }}</button>
            </template>
          </div>
        </section>

        <!-- Empty state -->
        <div v-if="!summary.trades" class="an-empty le-empty">
          <div class="le-empty__title">{{ t('ledger.empty.title') }}</div>
          <p class="le-empty__body">{{ t('ledger.empty.body') }}</p>
          <p class="le-empty__hint">{{ t('ledger.empty.hint') }}</p>
        </div>

        <template v-else>
          <!-- Equity curve -->
          <section v-if="chart" class="le-chart">
            <div class="le-sechead">
              <h2 class="le-sechead__title">{{ t('ledger.curve.title') }}</h2>
              <p class="le-sechead__sub">{{ t('ledger.curve.sub') }}</p>
            </div>
            <svg class="le-chart__svg" :viewBox="`0 0 ${chart.w} ${chart.h}`" preserveAspectRatio="none" role="img" :aria-label="t('ledger.curve.title')">
              <path class="le-chart__area" :d="chart.area" />
              <line
                v-if="chart.zeroY !== null"
                class="le-chart__zero"
                x1="0"
                :y1="chart.zeroY"
                :x2="chart.w"
                :y2="chart.zeroY"
                vector-effect="non-scaling-stroke"
              />
              <polyline class="le-chart__line" :points="chart.line" vector-effect="non-scaling-stroke" />
            </svg>
            <div class="le-chart__axis">
              <span>{{ chart.first }}</span>
              <span v-if="chart.zeroY !== null" class="le-chart__zerolbl">{{ t('ledger.curve.zero') }}</span>
              <span>{{ chart.last }}</span>
            </div>
          </section>

          <!-- Per-item breakdown -->
          <section class="le-section">
            <div class="le-sechead">
              <h2 class="le-sechead__title">{{ t('ledger.positions.title') }}</h2>
              <p class="le-sechead__sub">{{ t('ledger.positions.sub') }}</p>
            </div>

            <div v-if="!isMobile" class="an-tablewrap">
              <table class="an-table">
                <thead>
                  <tr>
                    <th class="col-name">{{ t('ledger.positions.item') }}</th>
                    <th class="an-num">{{ t('ledger.positions.bought') }}</th>
                    <th class="an-num">{{ t('ledger.positions.sold') }}</th>
                    <th class="an-num">{{ t('ledger.positions.held') }}</th>
                    <th class="grp-a an-num">{{ t('ledger.positions.avgCost') }}</th>
                    <th class="grp-b an-num">{{ t('ledger.positions.realized') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in positions" :key="row.url_name">
                    <td class="col-name">
                      <nuxt-link class="an-name" :to="localePath('/set/' + row.url_name)">
                        <img class="an-thumb" :src="thumbFor(row)" :alt="nameFor(row)" loading="lazy" />
                        <span>
                          {{ nameFor(row) }}
                          <small class="an-sub">{{ row.url_name }}</small>
                        </span>
                      </nuxt-link>
                    </td>
                    <td class="an-num">{{ row.bought }}</td>
                    <td class="an-num">
                      {{ row.sold }}
                      <v-tooltip v-if="row.uncoveredUnits > 0" location="top" :text="t('ledger.positions.uncoveredTip', { n: row.uncoveredUnits })">
                        <template #activator="{ props: tipProps }">
                          <v-icon v-bind="tipProps" size="15" class="an-warn le-warn">mdi-alert-outline</v-icon>
                        </template>
                      </v-tooltip>
                    </td>
                    <td class="an-num">{{ row.qty }}</td>
                    <td class="grp-a an-num">{{ row.qty ? fmt1(row.avgCost) + 'p' : '—' }}</td>
                    <td class="grp-b an-num an-strong" :class="deltaCls(row.realized)">{{ signed(row.realized) }}p</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="an-cards">
              <div v-for="row in positions" :key="row.url_name" class="an-card">
                <nuxt-link class="an-card__head" :to="localePath('/set/' + row.url_name)">
                  <img class="an-thumb" :src="thumbFor(row)" :alt="nameFor(row)" loading="lazy" />
                  <div class="an-card__title">
                    <div class="an-card__name">{{ nameFor(row) }}</div>
                    <small class="an-sub">{{ t('ledger.positions.held') }} {{ row.qty }}</small>
                  </div>
                  <v-icon color="#4fb3bf">mdi-chevron-right</v-icon>
                </nuxt-link>
                <div class="an-card__verdict">
                  <span class="pill" :class="row.realized > 0 ? 'pill--good' : row.realized < 0 ? 'pill--alt' : 'pill--even'">
                    {{ signed(row.realized) }}p
                    <b>{{ t('ledger.positions.realized') }}</b>
                  </span>
                  <v-tooltip v-if="row.uncoveredUnits > 0" location="top" :text="t('ledger.positions.uncoveredTip', { n: row.uncoveredUnits })">
                    <template #activator="{ props: tipProps }">
                      <v-icon v-bind="tipProps" size="18" class="an-warn">mdi-alert-outline</v-icon>
                    </template>
                  </v-tooltip>
                </div>
                <div class="an-card__blocks">
                  <div class="an-block">
                    <div class="an-block__lbl">{{ t('ledger.positions.flow') }}</div>
                    <div class="an-block__row"><span>{{ t('ledger.positions.bought') }}</span><b>{{ row.bought }}</b></div>
                    <div class="an-block__row"><span>{{ t('ledger.positions.sold') }}</span><b>{{ row.sold }}</b></div>
                    <div class="an-block__row"><span>{{ t('ledger.positions.held') }}</span><b>{{ row.qty }}</b></div>
                  </div>
                  <div class="an-block">
                    <div class="an-block__lbl">{{ t('ledger.positions.result') }}</div>
                    <div class="an-block__row"><span>{{ t('ledger.positions.avgCost') }}</span><b>{{ row.qty ? fmt1(row.avgCost) + 'p' : '—' }}</b></div>
                    <div class="an-block__row"><span>{{ t('ledger.positions.realized') }}</span><b :class="deltaCls(row.realized)">{{ signed(row.realized) }}p</b></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Trade log -->
          <section class="le-section">
            <div class="le-sechead le-sechead--row">
              <h2 class="le-sechead__title">{{ t('ledger.log.title') }}</h2>
              <div class="le-sechead__acts">
                <span class="le-count">{{ logRows.length === 1 ? t('ledger.log.countOne') : t('ledger.log.count', { n: logRows.length }) }}</span>
                <button class="le-ghost" type="button" @click="exportCsv">
                  <v-icon size="15">mdi-download-outline</v-icon> {{ t('ledger.log.export') }}
                </button>
                <button class="le-ghost" type="button" @click="toggleLog">
                  <v-icon size="15">{{ showLog ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  {{ showLog ? t('ledger.log.hide') : t('ledger.log.show') }}
                </button>
              </div>
            </div>

            <v-expand-transition>
              <div v-show="showLog">
                <div v-if="!isMobile" class="an-tablewrap">
                  <table class="an-table">
                    <thead>
                      <tr>
                        <th>{{ t('ledger.log.date') }}</th>
                        <th>{{ t('ledger.log.side') }}</th>
                        <th class="col-name">{{ t('ledger.log.item') }}</th>
                        <th class="an-num">{{ t('ledger.log.qty') }}</th>
                        <th class="an-num">{{ t('ledger.log.price') }}</th>
                        <th class="grp-a an-num">{{ t('ledger.log.total') }}</th>
                        <th class="grp-b an-num">{{ t('ledger.log.realized') }}</th>
                        <th>{{ t('ledger.log.note') }}</th>
                        <th class="col-act"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in logPaged" :key="row.id">
                        <td class="an-num le-date">{{ shortDate(row.at) }}</td>
                        <td>
                          <span class="le-side-tag" :class="row.side === 'sell' ? 'is-sell' : 'is-buy'">
                            {{ row.side === 'sell' ? t('ledger.log.sell') : t('ledger.log.buy') }}
                          </span>
                        </td>
                        <td class="col-name">
                          <nuxt-link class="an-name le-name" :to="localePath('/set/' + row.url_name)">
                            <img class="an-thumb le-thumb" :src="thumbFor(row)" :alt="nameFor(row)" loading="lazy" />
                            <span>{{ nameFor(row) }}</span>
                          </nuxt-link>
                        </td>
                        <td class="an-num">{{ row.qty }}</td>
                        <td class="an-num">{{ fmtPlat(row.price) }}p</td>
                        <td class="grp-a an-num">{{ fmtPlat(row.qty * row.price) }}p</td>
                        <td class="grp-b an-num an-strong" :class="row.side === 'sell' ? deltaCls(row.realized) : 'flat'">
                          <template v-if="row.side === 'sell'">
                            {{ signed(row.realized) }}p
                            <v-tooltip v-if="row.uncovered" location="top" :text="t('ledger.log.uncovered')">
                              <template #activator="{ props: tipProps }">
                                <v-icon v-bind="tipProps" size="14" class="an-warn le-warn">mdi-alert-outline</v-icon>
                              </template>
                            </v-tooltip>
                          </template>
                          <template v-else>—</template>
                        </td>
                        <td class="le-note">{{ row.note || '' }}</td>
                        <td class="col-act">
                          <button class="le-del" :title="t('ledger.log.delete')" :aria-label="t('ledger.log.delete')" @click="remove(row)">
                            <v-icon size="16">mdi-trash-can-outline</v-icon>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else class="an-cards">
                  <div v-for="row in logPaged" :key="row.id" class="an-card">
                    <div class="an-card__head">
                      <img class="an-thumb" :src="thumbFor(row)" :alt="nameFor(row)" loading="lazy" />
                      <div class="an-card__title">
                        <div class="an-card__name">{{ nameFor(row) }}</div>
                        <small class="an-sub">{{ shortDate(row.at) }} · {{ row.qty }} × {{ fmtPlat(row.price) }}p</small>
                      </div>
                      <button class="le-del" :aria-label="t('ledger.log.delete')" @click="remove(row)">
                        <v-icon size="18">mdi-trash-can-outline</v-icon>
                      </button>
                    </div>
                    <div class="an-card__verdict">
                      <span class="le-side-tag" :class="row.side === 'sell' ? 'is-sell' : 'is-buy'">
                        {{ row.side === 'sell' ? t('ledger.log.sell') : t('ledger.log.buy') }}
                      </span>
                      <span class="pill" :class="row.side === 'sell' ? (row.realized >= 0 ? 'pill--good' : 'pill--alt') : 'pill--even'">
                        {{ fmtPlat(row.qty * row.price) }}p
                        <b>{{ row.side === 'sell' ? t('ledger.log.realized') + ' ' + signed(row.realized) + 'p' : t('ledger.log.total') }}</b>
                      </span>
                    </div>
                    <div v-if="row.note" class="le-cardnote">{{ row.note }}</div>
                  </div>
                </div>

                <div v-if="logRows.length > perPage" class="an-pager">
                  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPage"></v-pagination>
                </div>
              </div>
            </v-expand-transition>
          </section>
        </template>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        {{ t('ledger.disclaimer') }}
      </v-alert>

      <AuthDialog v-model="authDialog" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
/**
 * /ledger — "am I actually making platinum?"
 *
 * The player records the trades they really made; every number on this page is
 * derived by composables/useLedger.ts (weighted-average cost basis), never
 * re-derived here. Storage is the shared local-first account layer
 * (useUserData), so the whole tool works signed out — signing in only adds
 * cross-device sync.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { t } = useI18n()
const localePath = useLocalePath()
const { trackAction } = useAnalytics()
const { localItemName } = useLocalizedName()
const { itemThumb } = useItemThumb()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const ud = useUserData()
const auth = useAuthStore()
const trades = ud.trades

const itemsStore = useItemsStore()
const allItems = computed(() => itemsStore.allItems as any[])

// ---------------------------------------------------------------- form state
const side = ref<'buy' | 'sell'>('sell')
const picked = ref<any>(null)
const qty = ref<number>(1)
const price = ref<number | null>(null)
const date = ref<string>(todayISO())
const note = ref<string>('')
// Historical trades shouldn't move the vault — the player already owns (or has
// long since sold) those units, so let them opt out per session.
const syncVault = ref(true)
const authDialog = ref(false)

const showLog = ref(true)
const page = ref(1)
const perPage = 25

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Tradeable catalogue: anything warframe.market actually prices. */
const tradeItems = computed<any[]>(() =>
  allItems.value
    .filter((i) => i.url_name && i.market)
    .map((i) => ({
      url_name: i.url_name as string,
      item_name: i.item_name as string,
      thumb: i.thumb as string | undefined,
      name: localItemName(i) || (i.item_name as string),
      sell: Number(i.market?.sell) || 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name)),
)

/** Catalogue lookups for thumbs/localized names on logged rows. */
const catalogue = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const i of allItems.value) if (i.url_name) map[i.url_name] = i
  return map
})

function nameFor(row: { url_name: string; item_name?: string }): string {
  const hit = catalogue.value[row.url_name]
  return (hit && localItemName(hit)) || row.item_name || row.url_name
}
function thumbFor(row: { url_name: string; item_name?: string }): string {
  return itemThumb({
    urlName: row.url_name,
    itemName: row.item_name || '',
    thumb: catalogue.value[row.url_name]?.thumb,
  })
}

// Picking an item prefills the price with its current asking price — the number
// the player is about to type anyway, and the single biggest time saver here.
function onPick(value: any) {
  if (!value) return
  if (value.sell > 0) price.value = value.sell
}

function submit() {
  const item = picked.value
  if (!item?.url_name) return
  const units = Math.max(1, Math.round(Number(qty.value) || 1))
  const each = Math.max(0, Number(price.value) || 0)
  const trade = ud.addTrade(
    {
      url_name: item.url_name,
      item_name: item.item_name || item.url_name,
      side: side.value,
      qty: units,
      price: each,
      // Noon UTC: the ISO string's date half is what equityCurve() groups on, so
      // pinning it inside the day keeps a trade on the date the player picked
      // whatever timezone they are in.
      at: `${date.value || todayISO()}T12:00:00.000Z`,
      ...(note.value ? { note: note.value } : {}),
    },
    syncVault.value,
  )
  if (!trade) return
  trackAction('ledger_add', { side: side.value, url_name: item.url_name })
  // Keep the side and the item so a run of similar trades is quick to log.
  qty.value = 1
  price.value = item.sell > 0 ? item.sell : null
  note.value = ''
}

function remove(row: { id: string }) {
  ud.removeTrade(row.id)
  trackAction('ledger_remove', { id: row.id })
}

function onSyncVault(v: any) {
  trackAction('ledger_sync_vault', { on: !!v })
}
function toggleLog() {
  showLog.value = !showLog.value
  trackAction('ledger_toggle_log', { open: showLog.value })
}
function openAuth() {
  authDialog.value = true
  trackAction('ledger_sign_in_cta')
}
function onPage(n: number) {
  trackAction('paginate', { page: n })
}

// ------------------------------------------------------------------ maths
// Every figure below comes straight out of useLedger — no P/L is recomputed here.
const summary = computed(() => summarize(trades.value as any))
const replay = computed(() => replayLedger(trades.value as any))
const positions = computed(() => positionRows(trades.value as any))
const curve = computed(() => equityCurve(trades.value as any))
/** Newest first: replay results are chronological. */
const logRows = computed(() => replay.value.results.slice().reverse())

const spanDays = computed(() => {
  const s = summary.value
  if (!s.firstAt || !s.lastAt) return 1
  const span = (Date.parse(s.lastAt) || 0) - (Date.parse(s.firstAt) || 0)
  return Math.max(1, Math.round(span / 86_400_000) || 1)
})

const pageCount = computed(() => Math.max(1, Math.ceil(logRows.value.length / perPage)))
const logPaged = computed(() => {
  const start = (page.value - 1) * perPage
  return logRows.value.slice(start, start + perPage)
})
watch(logRows, () => {
  if (page.value > pageCount.value) page.value = pageCount.value
})

// ------------------------------------------------------------- equity curve
// Hand-rolled SVG, same idiom as PriceSpark: one polyline over a faint area,
// stretched with preserveAspectRatio="none" and non-scaling strokes.
const chart = computed(() => {
  const pts = curve.value
  if (pts.length < 2) return null
  const w = 1000
  const h = 120
  const pad = 10
  const vals = pts.map((p: { realized: number }) => p.realized)
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const span = hi - lo || Math.abs(hi) || 1
  const x = (i: number) => (i / (pts.length - 1)) * w
  const y = (v: number) => pad + ((hi - v) / span) * (h - pad * 2)
  const line = pts
    .map((p: { realized: number }, i: number) => `${x(i).toFixed(1)},${y(p.realized).toFixed(1)}`)
    .join(' ')
  const area = `M0,${h} L${line.split(' ').join(' L')} L${w},${h} Z`
  return {
    w,
    h,
    line,
    area,
    // Only meaningful when the run actually went underwater at some point.
    zeroY: lo < 0 && hi > 0 ? y(0).toFixed(1) : null,
    first: pts[0]?.date || '',
    last: pts[pts.length - 1]?.date || '',
  }
})

// ------------------------------------------------------------------ display
function fmt1(n: number): string {
  const v = Number(n) || 0
  return (Math.round(v * 10) / 10).toFixed(1)
}
/** Plat with an explicit sign — a ledger without one reads as a typo. */
function signed(n: number): string {
  const v = Math.round(Number(n) || 0)
  return (v > 0 ? '+' : '') + fmtPlat(v)
}
function deltaCls(n: number): string {
  return n > 0 ? 'up' : n < 0 ? 'down' : 'flat'
}
function shortDate(at: string): string {
  return (at || '').slice(0, 10)
}

// --------------------------------------------------------------- CSV export
function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function exportCsv() {
  const head = ['date', 'side', 'item', 'url_name', 'qty', 'price', 'total', 'realized', 'note']
  const lines = [head.join(',')]
  // Chronological — a ledger export is read top-down.
  for (const r of replay.value.results) {
    lines.push(
      [
        shortDate(r.at),
        r.side,
        r.item_name,
        r.url_name,
        r.qty,
        r.price,
        Math.round(r.qty * r.price * 100) / 100,
        r.side === 'sell' ? Math.round(r.realized * 100) / 100 : '',
        r.note || '',
      ]
        .map(csvCell)
        .join(','),
    )
  }
  const href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'))
  const a = document.createElement('a')
  a.href = href
  a.download = 'warframe-trade-ledger.csv'
  a.click()
  trackAction('ledger_export_csv', { trades: replay.value.results.length })
}

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
/* ---- Record-trade form -------------------------------------------------- */
.le-legend {
  font-family: var(--font-hud);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--orokin);
  margin-bottom: 12px;
}
.le-form {
  align-items: center;
}
.le-item {
  flex: 2 1 240px;
  min-width: 190px;
}
.le-num {
  flex: 0 1 110px;
  min-width: 92px;
}
.le-date {
  flex: 0 1 168px;
  min-width: 150px;
}
.le-note {
  flex: 1 1 180px;
  min-width: 150px;
}
.le-side {
  flex: 0 0 auto;
  border: 1px solid var(--line);
  border-radius: 0 !important;
  overflow: hidden;
}
.le-side :deep(.v-btn) {
  border-radius: 0 !important;
  text-transform: none;
  letter-spacing: 0.04em;
  font-family: var(--font-hud);
  font-weight: 700;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.le-side :deep(.v-btn.v-btn--active) {
  background: rgba(212, 175, 90, 0.9) !important;
  color: #17130a !important;
}
.le-submit {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  font-family: var(--font-hud);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #17130a;
  background: var(--orokin);
  border: 1px solid var(--orokin);
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  cursor: pointer;
  transition: filter 0.15s ease, opacity 0.15s ease;
}
.le-submit:hover:not(:disabled) {
  filter: brightness(1.12);
}
.le-submit:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.le-hint {
  font-family: var(--font-hud);
  font-size: 0.74rem;
  letter-spacing: 0.02em;
  color: var(--ink-dim);
}
.le-sync {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  font-family: var(--font-hud);
  font-size: 0.76rem;
  letter-spacing: 0.03em;
  color: var(--ink-dim);
}
.le-signin {
  color: var(--gold-ink);
  background: transparent;
  border: 1px solid rgba(200, 168, 92, 0.45);
  padding: 3px 12px;
  font-family: var(--font-hud);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
  cursor: pointer;
}
.le-signin:hover {
  background: rgba(200, 168, 92, 0.12);
}

/* ---- Section headers ---------------------------------------------------- */
.le-section {
  padding-top: 10px;
}
.le-sechead {
  padding: 22px 24px 4px;
}
.le-sechead--row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 18px;
}
.le-sechead__title {
  font-family: var(--font-display);
  font-size: 1.12rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--gold-ink);
  margin: 0;
}
.le-sechead__sub {
  font-family: var(--font-hud);
  font-size: 0.78rem;
  letter-spacing: 0.03em;
  color: var(--ink-dim);
  margin: 4px 0 0;
}
.le-sechead__acts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.le-count {
  font-family: var(--font-hud);
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}
.le-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  padding: 4px 11px;
  font-family: var(--font-hud);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.le-ghost:hover {
  color: var(--gold-ink);
  border-color: rgba(200, 168, 92, 0.45);
}

/* ---- Equity curve ------------------------------------------------------- */
.le-chart {
  padding: 0 24px 8px;
}
.le-chart .le-sechead {
  padding-left: 0;
  padding-right: 0;
}
.le-chart__svg {
  display: block;
  width: 100%;
  height: 120px;
  margin-top: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid var(--line);
}
.le-chart__area {
  fill: rgba(200, 168, 92, 0.13);
}
.le-chart__line {
  fill: none;
  stroke: var(--orokin);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.le-chart__zero {
  stroke: var(--ink-dim);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  opacity: 0.7;
}
.le-chart__axis {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  font-family: var(--font-hud);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--ink-dim);
  font-variant-numeric: tabular-nums;
}
.le-chart__zerolbl {
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

/* ---- Tables ------------------------------------------------------------- */
.le-date {
  white-space: nowrap;
  color: var(--ink-dim);
}
.le-note {
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-hud);
  font-size: 0.78rem;
  color: var(--ink-dim);
}
.le-name .le-thumb {
  width: 32px;
  height: 32px;
}
.le-warn {
  margin-left: 4px;
  vertical-align: middle;
}
.le-side-tag {
  display: inline-block;
  font-family: var(--font-hud);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 3px 9px;
  clip-path: polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px);
}
.le-side-tag.is-sell {
  background: rgba(53, 214, 208, 0.14);
  color: var(--energy);
  border: 1px solid rgba(53, 214, 208, 0.45);
}
.le-side-tag.is-buy {
  background: rgba(255, 255, 255, 0.05);
  color: var(--ink-dim);
  border: 1px solid var(--line);
}
.le-del {
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.le-del:hover {
  color: var(--rose);
  border-color: rgba(217, 138, 138, 0.5);
  background: rgba(217, 138, 138, 0.08);
}
.le-cardnote {
  margin-top: 10px;
  font-family: var(--font-hud);
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  color: var(--ink-dim);
}

/* ---- Empty state -------------------------------------------------------- */
.le-empty {
  max-width: 620px;
  margin: 0 auto;
}
.le-empty__title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  letter-spacing: 0.08em;
  color: var(--gold-ink);
  margin-bottom: 10px;
}
.le-empty__body {
  margin: 0 0 8px;
  line-height: 1.6;
}
.le-empty__hint {
  margin: 0;
  font-size: 0.82rem;
  opacity: 0.75;
}

/* A negative bottom line must not be dressed in gold. */
.an-hero__deal-plat.is-loss {
  color: var(--rose);
}

@media (max-width: 600px) {
  .le-sechead {
    padding: 18px 16px 4px;
  }
  .le-chart {
    padding: 0 16px 8px;
  }
  .le-submit {
    flex: 1 1 100%;
    justify-content: center;
  }
}
</style>
