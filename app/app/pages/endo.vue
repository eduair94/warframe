<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Endo Exchange</div>
            <h1 v-if="direction === 'flip'" class="an-title">
              Turn <span class="accent-b">endo</span> into
              <span class="accent-a">platinum</span>
            </h1>
            <h1 v-else class="an-title">
              Buy <span class="accent-a">endo</span> for the least
              <span class="accent-b">platinum</span>
            </h1>
            <p v-if="direction === 'flip'" class="an-lede">
              Sitting on endo with nothing left to max? Buy a mod cheap — unranked
              <em>or partly ranked</em> — finish it with your endo, and resell it
              maxed. This ranks every tradeable mod by platinum per 1,000 endo, and
              tells you the cheapest rank to buy in at.
            </p>
            <p v-else class="an-lede">
              The cheapest endo per platinum, across Ayatan sculptures, rivens, and
              normal mods (bought maxed and dissolved). See whether any mod keeps up
              with a sculpture — and how far ahead a high-rolled riven really is.
            </p>
          </div>
          <div v-if="direction === 'flip' && topFlip" class="an-hero__deal">
            <div class="an-hero__deal-label">Best plat / 1k endo</div>
            <div class="an-hero__deal-plat">{{ fmtNum(topFlip.eval.best.platPer1kEndo) }}<span>p/1k</span></div>
            <a class="an-hero__deal-name" :href="mkt(topFlip.url_name)" target="_blank" rel="noopener">
              {{ topFlip.item_name }} →
            </a>
            <div class="an-hero__deal-sub">buy {{ rankLabel(topFlip.eval.best.rank) }} · +{{ fmtPlat(topFlip.eval.best.profit) }}p maxed</div>
          </div>
          <div v-else-if="direction === 'sources' && topSource" class="an-hero__deal">
            <div class="an-hero__deal-label">Best endo / plat</div>
            <div class="an-hero__deal-plat">{{ fmtNum(topSource.endoPerPlat) }}<span>e/p</span></div>
            <a v-if="topSource.url_name" class="an-hero__deal-name" :href="mkt(topSource.url_name)" target="_blank" rel="noopener">
              {{ topSource.name }} →
            </a>
            <div v-else class="an-hero__deal-name">{{ topSource.name }}</div>
            <div class="an-hero__deal-sub">{{ fmtEndo(topSource.endo) }} endo · {{ fmtPlat(topSource.plat) }}p</div>
          </div>
        </header>

        <!-- Direction toggle -->
        <div class="an-dir">
          <v-btn-toggle v-model="direction" mandatory density="compact" class="an-dir__toggle">
            <v-btn value="flip" size="small">Spend endo → plat</v-btn>
            <v-btn value="sources" size="small">Get endo cheap</v-btn>
          </v-btn-toggle>
          <NuxtLink to="/guides/endo" class="endo-guide-link">New here? Read the Endo guide →</NuxtLink>
        </div>

        <!-- ============ DIRECTION A: MOD FLIP ============ -->
        <template v-if="direction === 'flip'">
          <div class="an-stats">
            <div class="an-stat">
              <div class="an-stat__num">{{ flipStats.total }}</div>
              <div class="an-stat__lbl">flippable mods</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-good">{{ fmtNum(flipStats.best) }}</div>
              <div class="an-stat__lbl">best plat / 1k endo</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-gold">{{ fmtPlat(flipStats.topProfit) }}p</div>
              <div class="an-stat__lbl">biggest maxed profit</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-alt">{{ flipStats.partial }}</div>
              <div class="an-stat__lbl">best bought part-ranked</div>
            </div>
          </div>

          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a mod" class="an-search"></v-text-field>
              <v-text-field v-model.number="minVolume" density="compact" hide-details type="number" min="0" label="Min maxed volume (48h)" class="an-field"></v-text-field>
              <v-select v-model="flipSort" :items="flipSortOptions" item-title="text" item-value="value" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 240px"></v-select>
            </div>
            <v-chip-group v-model="flipCat" mandatory column class="an-cats">
              <v-chip v-for="c in flipCatOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ c }}</v-chip>
            </v-chip-group>
            <div class="an-toggles">
              <v-switch v-model="hideThin" hide-details density="compact" inset color="#4fb3bf" label="Hide thin demand (maxed barely trades)" class="an-toggle"></v-switch>
            </div>
            <div class="an-count">{{ flipFiltered.length }} {{ flipFiltered.length === 1 ? 'mod' : 'mods' }} match<span v-if="hiddenThin" class="an-hidden">· {{ hiddenThin }} thin demand hidden</span></div>
          </section>

          <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
            Couldn't load mod-flip data. The market service may be waking up — try a refresh.
          </v-alert>
          <div v-else-if="!flipRows.length" class="an-empty">
            No flip data yet. Run the endo sync (<code>sync_mod_flip</code>) to populate the per-rank ladders.
          </div>
          <div v-else-if="!flipFiltered.length" class="an-empty">No mods match these filters. Widen the search or lower the min volume.</div>

          <!-- Desktop table -->
          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name">Mod</th>
                  <th class="grp-a">Buy @</th>
                  <th class="grp-b">Sell maxed</th>
                  <th>Profit</th>
                  <th>Endo</th>
                  <th>Plat / 1k endo</th>
                  <th>Demand</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in flipPaged" :key="row.url_name" :class="{ 'is-top': row.url_name === topFlipUrl }">
                  <td class="col-name">
                    <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                      <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                      <span>
                        {{ row.item_name }}
                        <span v-if="row.url_name === topFlipUrl" class="an-badge">TOP</span>
                        <small class="an-sub">{{ row.eval.rarity }} · R{{ row.eval.maxRank }} · {{ fmtEndo(row.eval.endoToMax) }} endo to max</small>
                      </span>
                    </a>
                  </td>
                  <td class="grp-a an-num">
                    <b>{{ rankLabel(row.eval.best.rank) }}</b>
                    <small class="an-sub">{{ fmtPlat(row.eval.best.ask) }}p</small>
                  </td>
                  <td class="grp-b an-num">
                    {{ fmtPlat(row.eval.maxedSell) }}p
                    <small class="an-sub">instant {{ fmtPlat(row.eval.maxedBid) }}p</small>
                  </td>
                  <td class="an-num up an-strong">+{{ fmtPlat(row.eval.best.profit) }}p</td>
                  <td class="an-num">
                    {{ fmtEndoK(row.eval.best.endoToFinish) }}
                    <small class="an-sub">{{ fmtEndoK(row.eval.best.creditsToFinish / 1000) }}k cr</small>
                  </td>
                  <td class="an-num an-strong">{{ fmtNum(row.eval.best.platPer1kEndo) }}</td>
                  <td>
                    <span class="an-demand" :class="row.eval.demand.cls" :title="`${Math.round(row.eval.liquidity * 100)}% liquidity · vol ${fmtPlat(row.eval.maxedVolume)}`">
                      <span class="an-demand__bar"><i :style="{ width: Math.round(row.eval.liquidity * 100) + '%' }"></i></span>
                      {{ fmtPlat(row.eval.maxedVolume) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div v-else class="an-cards">
            <a v-for="row in flipPaged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topFlipUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener">
              <div class="an-card__head">
                <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                <div class="an-card__title">
                  <div class="an-card__name">{{ row.item_name }}<span v-if="row.url_name === topFlipUrl" class="an-badge">TOP</span></div>
                  <small class="an-sub">{{ row.eval.rarity }} · R{{ row.eval.maxRank }} · {{ fmtEndo(row.eval.endoToMax) }} endo to max</small>
                </div>
                <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
              </div>
              <div class="an-card__verdict">
                <span class="pill pill--good">{{ fmtNum(row.eval.best.platPer1kEndo) }} <b>plat / 1k endo</b></span>
                <span class="an-demand" :class="row.eval.demand.cls">
                  <span class="an-demand__bar"><i :style="{ width: Math.round(row.eval.liquidity * 100) + '%' }"></i></span>
                  {{ row.eval.demand.label }}
                </span>
              </div>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">The flip</div>
                  <div class="an-block__row"><span>Buy {{ rankLabel(row.eval.best.rank) }}</span><b>{{ fmtPlat(row.eval.best.ask) }}p</b></div>
                  <div class="an-block__row"><span>Sell maxed</span><b>{{ fmtPlat(row.eval.maxedSell) }}p</b></div>
                  <div class="an-block__row"><span>Profit</span><b class="up">+{{ fmtPlat(row.eval.best.profit) }}p</b></div>
                </div>
                <div class="an-block">
                  <div class="an-block__lbl">Cost to finish</div>
                  <div class="an-block__row"><span>Endo</span><b>{{ fmtEndo(row.eval.best.endoToFinish) }}</b></div>
                  <div class="an-block__row"><span>Credits</span><b>{{ fmtEndo(row.eval.best.creditsToFinish) }}</b></div>
                  <div class="an-block__row"><span>Maxed vol (48h)</span><b>{{ fmtPlat(row.eval.maxedVolume) }}</b></div>
                </div>
              </div>
            </a>
          </div>

          <div v-if="flipFiltered.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="flipPageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
          </div>
        </template>

        <!-- ============ DIRECTION B: ENDO SOURCES ============ -->
        <template v-else>
          <div class="an-stats">
            <div class="an-stat">
              <div class="an-stat__num">{{ sourceStats.total }}</div>
              <div class="an-stat__lbl">endo sources</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-good">{{ fmtNum(sourceStats.best) }}</div>
              <div class="an-stat__lbl">best endo / plat</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-gold">{{ fmtNum(sourceStats.bestSculpt) }}</div>
              <div class="an-stat__lbl">best sculpture e/p</div>
            </div>
            <div class="an-stat">
              <div class="an-stat__num is-alt">{{ fmtNum(sourceStats.bestMod) }}</div>
              <div class="an-stat__lbl">best mod e/p</div>
            </div>
          </div>

          <section class="an-filters">
            <div class="an-filters__row">
              <v-text-field v-model="sourceSearch" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a source" class="an-search"></v-text-field>
              <v-select v-model="sourceSort" :items="sourceSortOptions" item-title="text" item-value="value" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
            </div>
            <v-chip-group v-model="sourceKind" mandatory column class="an-cats">
              <v-chip v-for="c in sourceKindOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ c }}</v-chip>
            </v-chip-group>
            <div class="an-count">{{ sourceFiltered.length }} sources match</div>
          </section>

          <div v-if="!sourceRows.length" class="an-empty">No endo-source data yet — items and rivens are still syncing.</div>
          <div v-else-if="!sourceFiltered.length" class="an-empty">No sources match these filters.</div>

          <div v-else-if="!isMobile" class="an-tablewrap">
            <table class="an-table">
              <thead>
                <tr>
                  <th class="col-name">Source</th>
                  <th class="grp-a">Endo</th>
                  <th class="grp-b">Cost</th>
                  <th>Endo / plat</th>
                  <th>Vol</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sourcePaged" :key="row.kind + row.name" :class="{ 'is-top': row === topSource }">
                  <td class="col-name">
                    <component :is="row.url_name ? 'a' : 'div'" class="an-name" :href="row.url_name ? mkt(row.url_name) : undefined" :target="row.url_name ? '_blank' : undefined" rel="noopener">
                      <span class="an-kind" :class="'kind--' + row.kind">{{ row.kind }}</span>
                      <span>
                        {{ row.name }}
                        <span v-if="row === topSource" class="an-badge">TOP</span>
                        <small class="an-sub">{{ row.sub }}</small>
                      </span>
                    </component>
                  </td>
                  <td class="grp-a an-num">{{ fmtEndo(row.endo) }}</td>
                  <td class="grp-b an-num">{{ fmtPlat(row.plat) }}p</td>
                  <td class="an-num an-strong">{{ fmtNum(row.endoPerPlat) }}</td>
                  <td class="an-num">{{ row.volume != null ? fmtPlat(row.volume) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="an-cards">
            <component :is="row.url_name ? 'a' : 'div'" v-for="row in sourcePaged" :key="row.kind + row.name" class="an-card" :class="{ 'is-top': row === topSource }" :href="row.url_name ? mkt(row.url_name) : undefined" :target="row.url_name ? '_blank' : undefined" rel="noopener">
              <div class="an-card__head">
                <span class="an-kind" :class="'kind--' + row.kind">{{ row.kind }}</span>
                <div class="an-card__title">
                  <div class="an-card__name">{{ row.name }}<span v-if="row === topSource" class="an-badge">TOP</span></div>
                  <small class="an-sub">{{ row.sub }}</small>
                </div>
              </div>
              <div class="an-card__blocks">
                <div class="an-block">
                  <div class="an-block__lbl">Endo per plat</div>
                  <div class="an-block__row"><span>Rate</span><b class="up">{{ fmtNum(row.endoPerPlat) }}</b></div>
                  <div class="an-block__row"><span>Endo</span><b>{{ fmtEndo(row.endo) }}</b></div>
                  <div class="an-block__row"><span>Cost</span><b>{{ fmtPlat(row.plat) }}p</b></div>
                </div>
              </div>
            </component>
          </div>

          <div v-if="sourceFiltered.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="sourcePageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
          </div>
        </template>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        <template v-if="direction === 'flip'">
          Plat / 1k endo = <b>(maxed sell − buy-in) ÷ endo to finish × 1000</b>.
          "Sell maxed" is the 48h traded average (fallback: lowest maxed ask);
          "instant" is the top maxed buy order. Warframe takes no platinum trade
          tax — your cost is endo + credits (credits are often the bigger
          bottleneck). Maxed copies sell slower than unranked, so check the
          demand column. {{ t('disclaimer') }}
        </template>
        <template v-else>
          Endo / plat = endo gained ÷ platinum paid. Sculptures use fully-starred
          endo (always star before dissolving). Mods assume you buy a maxed copy
          and dissolve it (returns ~75% of the fusion endo). {{ t('disclaimer') }}
        </template>
      </v-alert>

      <!-- Donations (preserved from the old page) -->
      <div class="px-0 pt-3">
        <div class="d-flex flex-wrap align-center top_container justify-space-between mb-md-4">
          <div class="my-3 mb-0 md-md-3 bg-grey-darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
            <div class="d-flex mt-2 align-center">
              <div class="text-white mr-3">Help us donating!</div>
              <a target="_blank" aria-label="Donar con Paypal" class="text-white d-flex mr-4 align-center justify-content-left donation_logo" href="https://ko-fi.com/cambio_uruguay">
                <picture>
                  <source srcset="/img/paypal_icon.webp" type="image/webp" />
                  <img src="/img/paypal_icon.png" alt="PayPal" width="50" height="50" class="donation_icon" />
                </picture>
              </a>
              <a aria-label="Donar con Mercado Pago" class="text-white d-flex align-center justify-content-left donation_logo" target="_blank" href="https://mpago.la/19j46vX">
                <picture>
                  <source srcset="/img/mercadopago_icon.webp" type="image/webp" />
                  <img src="/img/mercadopago_icon.png" alt="Mercado Pago" width="50" height="50" class="donation_icon" />
                </picture>
              </a>
            </div>
          </div>
        </div>
      </div>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'
import {
  evalFlip,
  hasFlip,
  modAsEndoSource,
  endoPerPlat,
  SCULPTURE_ENDO,
  fmtPlat,
  fmtEndo,
  fmtEndoK,
  fmtNum,
  type EndoFlipRow,
  type EndoSourceRow,
  type FlipEval,
} from '~/composables/useEndoValue'

const config = useRuntimeConfig()
const base = config.public.apiURL
const { t } = useI18n()

// SEO head (old this.$nuxtI18nHead) — preserve locale alternate links.
useHead(useLocaleHead({ seo: true }))
useHead({
  title: 'Endo Exchange — flip mods for platinum & find the cheapest endo (Warframe)',
  meta: [
    {
      name: 'description',
      content:
        'Spend excess endo to earn platinum: buy Warframe mods cheap, max them, resell maxed — ranked by plat per 1,000 endo, with the cheapest buy-in rank. Plus the cheapest endo sources (sculptures, rivens, mods).',
    },
  ],
})

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
const store = useItemsStore()

// ---- data: mod flip rows + rivens (sculptures come from the item store) ----
const { data: flipData, error } = await useAsyncData('endo-flip', () =>
  $fetch<{ mods: EndoFlipRow[] }>(`${base}/endo_flip`),
)
const { data: rivenData } = await useAsyncData('endo-rivens', () =>
  $fetch<any[]>(`${base}/rivens`).catch(() => []),
)
const loadError = computed(() => !!error.value)

// A flip row joined with its evaluation, kept only if it's actually a profitable flip.
interface FlipRowEval extends EndoFlipRow {
  eval: FlipEval & { best: NonNullable<FlipEval['best']> }
}
const flipRows = computed<FlipRowEval[]>(() => {
  const rows = flipData.value?.mods ?? []
  const out: FlipRowEval[] = []
  for (const r of rows) {
    const ev = evalFlip(r)
    if (!hasFlip(ev)) continue
    out.push({ ...r, eval: ev as FlipRowEval['eval'] })
  }
  return out
})

// ---- shared UI state ----
const direction = ref<'flip' | 'sources'>('flip')
const page = ref(1)
const perPage = 25

// ---- Direction A: mod flip ----
const search = ref('')
const minVolume = ref<number>(0)
const flipCat = ref('All')
const flipSort = ref('efficiency')
const hideThin = ref(true)
const flipSortOptions = [
  { text: 'Plat / 1k endo', value: 'efficiency' },
  { text: 'Maxed profit (plat)', value: 'profit' },
  { text: 'Cheapest endo to finish', value: 'endo' },
  { text: 'Maxed volume (liquidity)', value: 'volume' },
  { text: 'Name (A–Z)', value: 'name' },
]

// One bucket per mod for the category chips.
function flipCategory(row: FlipRowEval): string {
  const name = row.item_name || ''
  const tags = (row.tags || []).map((x) => (x || '').toLowerCase())
  if (/^(primed|umbral|archon)\b/i.test(name)) return 'Primed/Umbral'
  if (tags.includes('corrupted')) return 'Corrupted'
  if (tags.includes('aura')) return 'Aura'
  const mr = row.eval.maxRank
  if (mr >= 10) return 'Rank 10'
  if (mr >= 8) return 'Rank 8'
  if (mr >= 5) return 'Rank 5'
  return 'Rank ≤3'
}
const flipCatOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of flipRows.value) present.add(flipCategory(r))
  const order = ['Rank 10', 'Rank 8', 'Rank 5', 'Rank ≤3', 'Corrupted', 'Primed/Umbral', 'Aura']
  return ['All', ...order.filter((c) => present.has(c))]
})

const flipFiltered = computed<FlipRowEval[]>(() => {
  const q = (search.value || '').trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const list = flipRows.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (flipCat.value !== 'All' && flipCategory(r) !== flipCat.value) return false
    if (r.eval.maxedVolume < minV) return false
    if (hideThin.value && r.eval.maxedVolume < 1) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: FlipRowEval, b: FlipRowEval) => number> = {
    efficiency: (a, b) => dir(a.eval.best.platPer1kEndo, b.eval.best.platPer1kEndo),
    profit: (a, b) => dir(a.eval.best.profit, b.eval.best.profit),
    endo: (a, b) => a.eval.best.endoToFinish - b.eval.best.endoToFinish,
    volume: (a, b) => dir(a.eval.maxedVolume, b.eval.maxedVolume),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[flipSort.value] || sorters.efficiency)
})
const hiddenThin = computed<number>(() =>
  hideThin.value ? flipRows.value.filter((r) => r.eval.maxedVolume < 1).length : 0,
)
const flipPageCount = computed(() => Math.max(1, Math.ceil(flipFiltered.value.length / perPage)))
const flipPaged = computed<FlipRowEval[]>(() => {
  const start = (page.value - 1) * perPage
  return flipFiltered.value.slice(start, start + perPage)
})
const topFlip = computed<FlipRowEval | null>(() => {
  let best: FlipRowEval | null = null
  for (const r of flipRows.value) if (!best || r.eval.best.platPer1kEndo > best.eval.best.platPer1kEndo) best = r
  return best
})
const topFlipUrl = computed<string>(() => {
  let best: FlipRowEval | null = null
  for (const r of flipFiltered.value) if (!best || r.eval.best.platPer1kEndo > best.eval.best.platPer1kEndo) best = r
  return best ? best.url_name : ''
})
const flipStats = computed(() => {
  const list = flipRows.value
  const effs = list.map((r) => r.eval.best.platPer1kEndo)
  return {
    total: list.length,
    best: effs.length ? Math.max(...effs) : 0,
    topProfit: list.length ? Math.max(...list.map((r) => r.eval.best.profit)) : 0,
    partial: list.filter((r) => r.eval.best.rank > 0).length,
  }
})

// ---- Direction B: endo sources (sculptures + rivens + mods) ----
const sourceSearch = ref('')
const sourceKind = ref('All')
const sourceSort = ref('rate')
const sourceSortOptions = [
  { text: 'Endo / plat', value: 'rate' },
  { text: 'Endo amount', value: 'endo' },
  { text: 'Cheapest cost', value: 'cost' },
  { text: 'Name (A–Z)', value: 'name' },
]
const sourceKindOptions = ['All', 'Sculpture', 'Riven', 'Mod']

const sculptureSources = computed<EndoSourceRow[]>(() => {
  const out: EndoSourceRow[] = []
  for (const el of store.allItems as any[]) {
    if (!el?.item_name?.includes('Sculpture')) continue
    const key = (el.url_name || '').split('_')[1] ?? ''
    const endo = SCULPTURE_ENDO[key]
    if (!endo) continue
    const plat = Number(el.market?.sell) || Number(el.market?.sellAvg) || 0
    if (plat <= 0) continue
    out.push({
      kind: 'sculpture',
      name: el.item_name,
      url_name: el.url_name,
      thumb: el.thumb,
      endo,
      plat,
      endoPerPlat: endoPerPlat(endo, plat),
      volume: Number(el.market?.volume) || 0,
      liquidity: 1,
      sub: 'fully starred',
    })
  }
  return out
})
const rivenSources = computed<EndoSourceRow[]>(() => {
  const out: EndoSourceRow[] = []
  for (const r of (rivenData.value as any[]) || []) {
    const it = r?.items || {}
    const endo = Number(it.endo) || 0
    const plat = Number(it.buyout_price) || 0
    if (endo <= 0 || plat <= 0) continue
    out.push({
      kind: 'riven',
      name: `${r.item_name} ${it.item?.name ?? ''}`.trim(),
      url_name: undefined,
      endo,
      plat,
      endoPerPlat: Number(it.endoPerPlat) || endoPerPlat(endo, plat),
      liquidity: 1,
      sub: `${it.item?.re_rolls ?? 0} rerolls`,
    })
  }
  return out
})
// Best handful of mods as an endo source (buy maxed, dissolve) — the benchmark.
const modSources = computed<EndoSourceRow[]>(() => {
  const rows = flipData.value?.mods ?? []
  const out: EndoSourceRow[] = []
  for (const r of rows) {
    const s = modAsEndoSource(r)
    if (s.plat > 0 && s.endo > 0 && (s.volume || 0) >= 1) out.push(s)
  }
  return out.sort((a, b) => b.endoPerPlat - a.endoPerPlat).slice(0, 20)
})
const sourceRows = computed<EndoSourceRow[]>(() => [
  ...sculptureSources.value,
  ...rivenSources.value,
  ...modSources.value,
])
const sourceFiltered = computed<EndoSourceRow[]>(() => {
  const q = (sourceSearch.value || '').trim().toLowerCase()
  const list = sourceRows.value.filter((r) => {
    if (q && !r.name.toLowerCase().includes(q)) return false
    if (sourceKind.value !== 'All' && r.kind !== sourceKind.value.toLowerCase()) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: EndoSourceRow, b: EndoSourceRow) => number> = {
    rate: (a, b) => dir(a.endoPerPlat, b.endoPerPlat),
    endo: (a, b) => dir(a.endo, b.endo),
    cost: (a, b) => a.plat - b.plat,
    name: (a, b) => a.name.localeCompare(b.name),
  }
  return list.slice().sort(sorters[sourceSort.value] || sorters.rate)
})
const sourcePageCount = computed(() => Math.max(1, Math.ceil(sourceFiltered.value.length / perPage)))
const sourcePaged = computed<EndoSourceRow[]>(() => {
  const start = (page.value - 1) * perPage
  return sourceFiltered.value.slice(start, start + perPage)
})
const topSource = computed<EndoSourceRow | null>(() => {
  let best: EndoSourceRow | null = null
  for (const r of sourceFiltered.value) if (!best || r.endoPerPlat > best.endoPerPlat) best = r
  return best
})
const sourceStats = computed(() => {
  const all = sourceRows.value
  const rate = (arr: EndoSourceRow[]) => (arr.length ? Math.max(...arr.map((r) => r.endoPerPlat)) : 0)
  return {
    total: all.length,
    best: rate(all),
    bestSculpt: rate(sculptureSources.value),
    bestMod: rate(modSources.value),
  }
})

// Reset paging whenever the visible list or direction changes.
watch([flipFiltered, sourceFiltered, direction], () => {
  page.value = 1
})

// ---- helpers ----
function rankLabel(rank: number): string {
  return rank <= 0 ? 'Unranked' : `Rank ${rank}`
}
function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function mkt(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
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
.an-dir {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin: 4px 0 14px;
}
.an-dir__toggle :deep(.v-btn-toggle) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.an-dir__toggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.an-dir__toggle :deep(.v-btn.v-btn--active) {
  background: rgba(212, 175, 90, 0.9) !important;
  color: #17131f !important;
}
.endo-guide-link {
  color: #e7cf95;
  text-decoration: none;
  font-weight: 600;
  border-bottom: 1px solid rgba(200, 168, 92, 0.4);
  white-space: nowrap;
}
.endo-guide-link:hover {
  color: #f4e2b4;
}
/* Source-kind badge (Direction B). */
.an-kind {
  display: inline-block;
  flex: none;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 5px;
  padding: 3px 7px;
  margin-right: 4px;
  border: 1px solid transparent;
}
.kind--sculpture {
  color: #d4af5a;
  background: rgba(212, 175, 90, 0.14);
  border-color: rgba(212, 175, 90, 0.4);
}
.kind--riven {
  color: #c4b0ee;
  background: rgba(159, 122, 234, 0.16);
  border-color: rgba(159, 122, 234, 0.42);
}
.kind--mod {
  color: #4fb3bf;
  background: rgba(79, 179, 191, 0.14);
  border-color: rgba(79, 179, 191, 0.4);
}
/* Demand meter (reused from relic-farming). */
.an-demand {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
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
.dem--high { color: #4caf7d; }
.dem--med { color: #d4af5a; }
.dem--low { color: #d98a4f; }
.dem--dead { color: #8a8fa3; }
.an-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  margin-top: 4px;
}
.an-toggle :deep(.v-label) {
  font-size: 0.8rem;
  color: #b6bcd0;
  opacity: 1;
}
.an-hidden {
  color: #9aa0b4;
  margin-left: 6px;
  font-size: 0.92em;
}
.donation_icon {
  display: block;
  width: 50px;
  height: 50px;
  object-fit: contain;
}
</style>
