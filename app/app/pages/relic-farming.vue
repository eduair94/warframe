<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Relic Farming</div>
            <h1 class="an-title">
              <span class="accent-b">Farm</span> the best
              <span class="accent-a">plat / hour</span>
            </h1>
            <p class="an-lede">
              EV tells you the average payout of cracking a relic — but not how
              fast you earn. This ranks relics by platinum per hour: expected
              {{ refinement.toLowerCase() }} payout divided by how long a run
              takes. Set your minutes-per-run and find the best relic to grind
              right now.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Best plat / hour</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(platPerHour(topDeal)) }}<span>p/hr</span></div>
            <nuxt-link class="an-hero__deal-name" :to="'/relic/' + topDeal.url_name">
              {{ topDeal.relicName }} →
            </nuxt-link>
            <div class="an-hero__deal-sub">avg {{ refinement.toLowerCase() }} payout</div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">relics</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtPlat(stats.bestPph) }}p</div>
            <div class="an-stat__lbl">best plat / hr</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(stats.avgPph) }}p</div>
            <div class="an-stat__lbl">avg plat / hr</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(stats.biggest) }}p</div>
            <div class="an-stat__lbl">top payout</div>
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
              label="Search a relic"
              class="an-search"
            ></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">Refinement</div>
              <v-btn-toggle v-model="refinement" mandatory density="compact">
                <v-btn value="Intact" size="small">Intact</v-btn>
                <v-btn value="Radiant" size="small">Radiant</v-btn>
              </v-btn-toggle>
            </div>
            <div class="an-mins">
              <div class="an-mins__lbl">
                Minutes per relic run · <b>{{ missionMinutes }}m</b>
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
              ></v-slider>
            </div>
            <v-select
              v-model="sortKey"
              :items="sortOptions"
              item-title="text"
              item-value="value"
              density="compact"
              hide-details
              label="Sort by"
              class="an-field"
              style="flex: 0 1 220px"
            ></v-select>
            <v-switch
              v-model="completeOnly"
              hide-details
              density="compact"
              color="#d4af5a"
              label="Full data only"
              class="an-complete"
            ></v-switch>
          </div>

          <v-chip-group v-model="tier" mandatory column class="an-cats">
            <v-chip
              v-for="t in tierOptions"
              :key="t"
              :value="t"
              size="small"
              active-class="an-chip--on"
            >
              {{ t }}
            </v-chip>
          </v-chip-group>

          <div class="an-count">
            {{ filtered.length }} {{ filtered.length === 1 ? 'relic' : 'relics' }} match
          </div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          Couldn't load relic data. The market service may be waking up — try a refresh.
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          No relics match these filters. Widen the search or reset the tier.
        </div>

        <!-- Desktop table -->
        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Relic</th>
                <th class="grp-a">Plat / hr</th>
                <th class="grp-b">EV ({{ refinement }})</th>
                <th>Top drop</th>
                <th>Vol</th>
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
                      <img class="an-thumb" :src="relicThumb(row)" :alt="row.relicName" loading="lazy" @error="onImgError" />
                      <span>
                        {{ row.relicName }}
                        <span v-if="row.url_name === topDealUrl" class="an-badge">TOP</span>
                        <small class="an-sub">{{ row.tier }} · {{ row.rewards.length }} drops</small>
                      </span>
                    </nuxt-link>
                    <button class="an-drops" title="Where to farm this relic" @click="openDrops(row)">
                      <v-icon size="18">mdi-map-marker-radius-outline</v-icon>
                    </button>
                  </div>
                </td>
                <td class="grp-a an-num an-strong up">{{ fmtPlat(platPerHour(row)) }}p/hr</td>
                <td class="grp-b an-num">{{ fmtPlat(ev(row)) }}p</td>
                <td class="an-num">
                  <span class="an-topdrop">{{ topDrop(row).item_name }}</span>
                  <small class="an-sub">{{ fmtPlat(topDrop(row).price) }}p · {{ topDrop(row).rarity }}</small>
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
              <img class="an-thumb" :src="relicThumb(row)" :alt="row.relicName" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ row.relicName }}
                  <span v-if="row.url_name === topDealUrl" class="an-badge">TOP</span>
                </div>
                <small class="an-sub">{{ row.tier }} · {{ row.rewards.length }} drops · vol {{ fmtPlat(row.relic.volume) }}</small>
              </div>
              <button class="an-drops" title="Where to farm this relic" @click.prevent.stop="openDrops(row)">
                <v-icon size="20">mdi-map-marker-radius-outline</v-icon>
              </button>
              <v-icon color="#4fb3bf">mdi-chevron-right</v-icon>
            </div>
            <div class="an-card__verdict">
              <span class="pill pill--good">
                {{ fmtPlat(platPerHour(row)) }} p/hr
                <b>avg {{ refinement.toLowerCase() }} payout</b>
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">Payout ({{ refinement }})</div>
                <div class="an-block__row"><span>EV / crack</span><b>{{ fmtPlat(ev(row)) }}p</b></div>
                <div class="an-block__row"><span>Sell relic</span><b>{{ fmtPlat(row.relic.buy) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">Top drop</div>
                <div class="an-block__row"><span>{{ topDrop(row).rarity }}</span><b>{{ fmtPlat(topDrop(row).price) }}p</b></div>
                <div class="an-block__row an-topdrop-m"><span>{{ topDrop(row).item_name }}</span></div>
              </div>
            </div>
          </nuxt-link>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        Plat/hr = expected {{ refinement }} payout ÷ your minutes-per-run × 60.
        Radiant costs 100 void traces to refine; actual run time varies by
        fissure and squad. Payout uses each drop's lowest sell order.
      </v-alert>

      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsRelic" :thumb="dropsThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

// Fixed refinement drop-chance table (per rarity), shared by all relics.
const CHANCES: Record<string, Record<string, number>> = {
  Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
  Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
}

// Shape of a relic row from /relics_ev.
interface RelicReward {
  item_name: string
  url_name?: string
  thumb?: string
  price: number
  rarity: string
}
interface RelicMarket {
  volume: number
  buy: number
}
interface RelicRow {
  url_name: string
  relicName: string
  tier: string
  thumb: string
  rewards: RelicReward[]
  relic: RelicMarket
}

// Working thumbnails cross-referenced against the fresh catalog (drop data
// carries stale warframe.market thumb hashes).
const { itemThumb } = useItemThumb()

const config = useRuntimeConfig()
const base = config.public.apiURL

// SSR fetch — preserve old asyncData try/catch -> loadError intent. Distinct
// key ('relic-farming') so the cache doesn't collide with relics-value.vue's
// 'relics-ev' key, even though both hit the same /relics_ev endpoint.
const { data, error } = await useAsyncData('relic-farming', () =>
  $fetch<{ relics: RelicRow[] }>(`${base}/relics_ev`),
)
const loadError = computed(() => !!error.value)
const relics = computed<RelicRow[]>(() => data.value?.relics ?? [])

useHead({
  title: 'Relic Farming — best relics by platinum per hour (Warframe)',
  meta: [
    {
      name: 'description',
      content:
        'Rank every Warframe void relic by platinum per hour: expected Intact or Radiant payout divided by your minutes-per-run. Find the best relic to farm plat right now.',
    },
  ],
})

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// UI state (former data())
const search = ref('')
const tier = ref('All')
const refinement = ref('Radiant')
const sortKey = ref('pph')
const missionMinutes = ref(3)
const page = ref(1)
const perPage = 20
// Only value/show relics that carry full drop + market data by default
// (relics missing prices for their drops can't get a meaningful plat/hour).
const completeOnly = ref(true)
// Drops popup — where to farm the clicked relic.
const dropsDialog = ref(false)
const dropsRelic = ref('')
const dropsThumb = ref('')
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = [
  { text: 'Plat / hour', value: 'pph' },
  { text: 'Payout (EV)', value: 'ev' },
  { text: 'Volume', value: 'volume' },
  { text: 'Name (A–Z)', value: 'name' },
]

function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function ev(relic: any): number {
  const table = CHANCES[refinement.value] ?? CHANCES.Intact ?? {}
  return (relic.rewards || []).reduce((sum: number, r: any) => {
    const chance = table[r.rarity] || 0
    return sum + (chance / 100) * (r.price || 0)
  }, 0)
}
function platPerHour(relic: any): number {
  const minutes = Number(missionMinutes.value) || 1
  return (ev(relic) / minutes) * 60
}
function topDrop(relic: any): any {
  let best = { item_name: '—', price: 0, rarity: '' }
  for (const r of relic.rewards || []) {
    if (r.price > best.price) best = r
  }
  return best
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
// A relic has "full data" when it has drops and every drop carries a market
// price — only then can we assign a trustworthy EV / plat-per-hour.
function hasFullData(relic: RelicRow): boolean {
  const rewards = relic.rewards || []
  if (!rewards.length) return false
  return rewards.every((r) => Number(r.price) > 0)
}
// Working thumbnail for a relic row (falls back through the fresh catalog).
function relicThumb(relic: RelicRow): string {
  return itemThumb({ urlName: relic.url_name, itemName: relic.relicName, thumb: relic.thumb })
}
// Open the "where to farm" drops popup for a relic.
function openDrops(relic: RelicRow) {
  dropsRelic.value = relic.relicName
  dropsThumb.value = relic.thumb || ''
  dropsDialog.value = true
}

const tierOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of relics.value) present.add(r.tier)
  const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
  return ['All', ...order.filter((t) => present.has(t))]
})

// When completeOnly is on (default), only relics with full drop/market data
// are valued and shown — matching the old page's behavior.
const valuedRelics = computed<RelicRow[]>(() =>
  completeOnly.value ? relics.value.filter(hasFullData) : relics.value,
)

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const list = valuedRelics.value.filter((r) => {
    if (q && !r.relicName.toLowerCase().includes(q)) return false
    if (tier.value !== 'All' && r.tier !== tier.value) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    pph: (a, b) => dir(platPerHour(a), platPerHour(b)),
    ev: (a, b) => dir(ev(a), ev(b)),
    volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
    name: (a, b) => a.relicName.localeCompare(b.relicName),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.pph)
})

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
.an-complete {
  flex: 0 0 auto;
}
.an-complete :deep(.v-label) {
  font-size: 0.8rem;
  color: #b6bcd0;
  opacity: 1;
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
</style>
