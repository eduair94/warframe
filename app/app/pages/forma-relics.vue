<!-- /forma-relics — "Which relics drop Forma Blueprints" board. Derived from the
     shared /relics_ev payload via useFormaRelics; default shows only currently-
     dropping (non-vaulted) relics. Each relic → exact farm nodes via the shared
     DropLocationsDialog. Cross-links the Forma guide + the star-chart Forma
     preset. English-hardcoded chrome (like /guides/farming); item/relic display
     names localize via useLocalizedName. -->
<template>
  <div class="an">
    <client-only>
      <template #fallback>
        <SeoFallbackTable
          caption="Which Relics Drop Forma Blueprints"
          name-label="Relic"
          :columns="['Forma reward', 'Intact odds', 'Status']"
          :rows="fallbackRows"
        />
      </template>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Void Ledger · Forma Farming</div>
            <h1 class="an-title">Which Relics Drop <span class="accent-a">Forma</span></h1>
            <p class="an-lede">
              Forma Blueprint is a <b>Common</b> (1×) or <b>Uncommon</b> (2×) reward across a huge share of
              relics — never the Rare slot. Crack these <b>Intact</b> in a full public squad and Forma pours in.
              Showing what currently drops; flip the toggle for vaulted relics too.
            </p>
            <div class="fr-hero-cta">
              <NuxtLink :to="localePath('/guides/forma')" class="fr-cta">
                <v-icon size="16">mdi-book-open-page-variant-outline</v-icon> Full Forma farming guide
              </NuxtLink>
              <NuxtLink :to="localePath('/star-chart-3d?forma=1')" class="fr-cta fr-cta--map">
                <v-icon size="16">mdi-map-marker-radius</v-icon> See Forma nodes on the star map
              </NuxtLink>
            </div>
          </div>
        </header>

        <!-- Stats -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.dropping }}</div>
            <div class="an-stat__lbl">relics dropping Forma now</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ stats.doubleDropping }}</div>
            <div class="an-stat__lbl">of those pay 2× Forma</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ stats.vaulted }}</div>
            <div class="an-stat__lbl">Forma relics vaulted</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">Forma relics total</div>
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
              label="Search a relic (e.g. Lith C7)"
              class="an-search"
            ></v-text-field>
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
              @update:model-value="onSort"
            ></v-select>
          </div>

          <v-chip-group v-model="tier" mandatory column class="an-cats" @update:model-value="onTier">
            <v-chip v-for="tv in tierOptions" :key="tv" :value="tv" size="small" active-class="an-chip--on">
              {{ tv === 'All' ? 'All tiers' : tv }}
            </v-chip>
          </v-chip-group>

          <div class="an-toggles">
            <v-switch
              v-model="droppingOnly"
              hide-details
              density="compact"
              inset
              color="#4fb3bf"
              label="Currently dropping only"
              class="an-toggle"
              @update:model-value="onToggle('dropping_only', $event)"
            ></v-switch>
            <v-switch
              v-model="doubleOnly"
              hide-details
              density="compact"
              inset
              color="#d4af5a"
              label="Only 2× Forma (Uncommon)"
              class="an-toggle"
              @update:model-value="onToggle('double_forma_only', $event)"
            ></v-switch>
          </div>

          <div class="an-count">
            {{ filtered.length }} relic{{ filtered.length === 1 ? '' : 's' }}
            <span v-if="hiddenVaulted" class="an-hidden">· {{ hiddenVaulted }} vaulted hidden</span>
          </div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          Couldn't load relic data. Try again in a moment.
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">No Forma relics match those filters.</div>

        <!-- Desktop table -->
        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Relic</th>
                <th>Forma reward</th>
                <th>Intact odds</th>
                <th>Status</th>
                <th class="col-drops">Where it drops</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in paged" :key="f.row.url_name">
                <td class="col-name">
                  <nuxt-link class="an-name" :to="localePath('/relic/' + f.row.url_name)">
                    <img class="an-thumb" :src="relicThumb(f.row)" :alt="localName('items', f.row.url_name, f.row.relicName)" loading="lazy" @error="onImgError" />
                    <span>
                      {{ localName('items', f.row.url_name, f.row.relicName) }}
                      <small class="an-sub">{{ f.row.tier }} · {{ f.row.rewards.length }} drops</small>
                    </span>
                  </nuxt-link>
                </td>
                <td>
                  <span class="fr-forma" :class="f.count === 2 ? 'fr-forma--2' : 'fr-forma--1'">
                    <v-icon size="15">mdi-vector-triangle</v-icon>
                    {{ f.count }}× Forma
                    <small>{{ f.rarity }}</small>
                  </span>
                </td>
                <td class="an-num">{{ fmtPct(f.intactChance) }}%</td>
                <td>
                  <span class="fr-status" :class="'fr-status--' + f.status">{{ statusLabel(f.status) }}</span>
                </td>
                <td class="col-drops">
                  <button class="an-drops" title="Where does this relic drop?" @click="openDrops(f.row)">
                    <v-icon size="18">mdi-map-marker-radius-outline</v-icon>
                    <span>Drop nodes</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div v-else class="an-cards">
          <div v-for="f in paged" :key="f.row.url_name" class="an-card">
            <div class="an-card__head">
              <nuxt-link class="an-name" :to="localePath('/relic/' + f.row.url_name)">
                <img class="an-thumb" :src="relicThumb(f.row)" :alt="localName('items', f.row.url_name, f.row.relicName)" loading="lazy" @error="onImgError" />
                <div class="an-card__title">
                  <div class="an-card__name">{{ localName('items', f.row.url_name, f.row.relicName) }}</div>
                  <small class="an-sub">{{ f.row.tier }} · {{ f.row.rewards.length }} drops</small>
                </div>
              </nuxt-link>
              <span class="fr-status" :class="'fr-status--' + f.status">{{ statusLabel(f.status) }}</span>
            </div>
            <div class="an-card__row">
              <span class="fr-forma" :class="f.count === 2 ? 'fr-forma--2' : 'fr-forma--1'">
                <v-icon size="15">mdi-vector-triangle</v-icon> {{ f.count }}× Forma <small>{{ f.rarity }}</small>
              </span>
              <span class="fr-odds">{{ fmtPct(f.intactChance) }}% Intact</span>
              <button class="an-drops" @click="openDrops(f.row)">
                <v-icon size="18">mdi-map-marker-radius-outline</v-icon><span>Drops</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a" @update:model-value="onPage"></v-pagination>
        </div>

        <!-- How to run them -->
        <section class="fr-note">
          <div class="an-eyebrow">How to actually farm these</div>
          <ul class="fr-note__list">
            <li><b>Don't refine them.</b> Forma is a Common reward — going Radiant drops each Forma slot from 25.33% to 16.67% and costs 100 Void Traces. Crack them <b>Intact</b>.</li>
            <li><b>Run a full public squad.</b> Every reward round pools all four players' relics and you each pick one — up to 4 Forma a round.</li>
            <li><b>Use an endless fissure</b> (Survival / Defense) so everyone slots a fresh relic each rotation.</li>
          </ul>
          <NuxtLink :to="localePath('/guides/forma')" class="fr-cta">
            <v-icon size="16">mdi-book-open-page-variant-outline</v-icon> Read the full Forma guide
          </NuxtLink>
        </section>
      </div>

      <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
        “Currently dropping” is sourced from the live WFCD drop tables (the same data the drop-locations dialog shows),
        not the unreliable market vaulted flag. Relic contents rotate as items are vaulted and unvaulted.
      </v-alert>

      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsRelic" :thumb="dropsThumb" />
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useFormaRelics, type FormaRelic, type FormaStatus } from '~/composables/useFormaRelics'
import type { RelicRow } from '~/composables/useRelicValue'

const { trackAction, trackDialog, trackFilter, trackSearch, trackSort } = useAnalytics()
const { localName } = useLocalizedName()
const { itemThumb } = useItemThumb()
const localePath = useLocalePath()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const { formaRelics, loadError } = useFormaRelics()

// UI state
const search = ref('')
const tier = ref('All')
const sortKey = ref('forma')
const droppingOnly = ref(true)
const doubleOnly = ref(false)
const page = ref(1)
const perPage = 24

const dropsDialog = ref(false)
const dropsRelic = ref('')
const dropsThumb = ref('')

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

const sortOptions = [
  { text: 'Forma per crack', value: 'forma' },
  { text: 'Best odds', value: 'odds' },
  { text: 'Tier', value: 'tier' },
  { text: 'Name', value: 'name' },
]

const TIER_ORDER = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
const tierOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const f of formaRelics.value) present.add(f.row.tier)
  return ['All', ...TIER_ORDER.filter((t) => present.has(t))]
})

function statusLabel(s: FormaStatus): string {
  return s === 'dropping' ? 'Dropping' : s === 'resurgence' ? 'Resurgence' : 'Vaulted'
}

const matched = computed<FormaRelic[]>(() => {
  const q = search.value.trim().toLowerCase()
  return formaRelics.value.filter((f) => {
    if (q && !(f.row.relicName.toLowerCase().includes(q) || localName('items', f.row.url_name, f.row.relicName).toLowerCase().includes(q))) return false
    if (tier.value !== 'All' && f.row.tier !== tier.value) return false
    return true
  })
})

const hiddenVaulted = computed<number>(() =>
  droppingOnly.value ? matched.value.filter((f) => f.status !== 'dropping').length : 0,
)

const filtered = computed<FormaRelic[]>(() => {
  const list = matched.value.filter((f) => {
    if (droppingOnly.value && f.status !== 'dropping') return false
    if (doubleOnly.value && f.count < 2) return false
    return true
  })
  const byName = (a: FormaRelic, b: FormaRelic) => a.row.relicName.localeCompare(b.row.relicName)
  const tierRank = (t: string) => {
    const i = TIER_ORDER.indexOf(t)
    return i === -1 ? TIER_ORDER.length : i
  }
  const sorters: Record<string, (a: FormaRelic, b: FormaRelic) => number> = {
    forma: (a, b) => b.count - a.count || b.intactChance - a.intactChance || byName(a, b),
    odds: (a, b) => b.intactChance - a.intactChance || b.count - a.count || byName(a, b),
    tier: (a, b) => tierRank(a.row.tier) - tierRank(b.row.tier) || byName(a, b),
    name: byName,
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.forma)
})

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): top 150 of the same default-filtered, default-sorted `filtered` list
// the live board renders, fed by useFormaRelics' SSR-safe useAsyncData fetch.
const fallbackRows = computed(() =>
  filtered.value.slice(0, 40).map((f) => ({
    key: f.row.url_name,
    href: '/relic/' + f.row.url_name,
    name: f.row.relicName,
    cells: [`${f.count}× Forma`, `${fmtPct(f.intactChance)}%`, statusLabel(f.status)],
  })),
)

const stats = computed(() => {
  const all = formaRelics.value
  const dropping = all.filter((f) => f.status === 'dropping')
  return {
    total: all.length,
    dropping: dropping.length,
    doubleDropping: dropping.filter((f) => f.count === 2).length,
    vaulted: all.filter((f) => f.status === 'vaulted').length,
  }
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<FormaRelic[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
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

// --- analytics hooks (tracking only; none of these touch page state) ---
function onTier(v: any) {
  trackFilter('tier', v)
}
function onToggle(name: string, v: any) {
  trackFilter(name, !!v)
}
function onSort(v: any) {
  trackSort(v)
}
function onPage(n: number) {
  trackAction('paginate', { page: n })
}

function relicThumb(relic: RelicRow): string {
  return itemThumb({ urlName: relic.url_name, itemName: relic.relicName, thumb: relic.thumb })
}
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement & { dataset: DOMStringMap }
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function openDrops(relic: RelicRow) {
  // The drop index stores a relic's mission drops under its full item name
  // ("Axi S8 Relic"), but /relics_ev supplies the bare display label
  // ("Axi S8") and DropLocationsDialog's matchKeys strips "Blueprint"/"Set"
  // but not "Relic". Pass the suffixed item name so the nodes actually resolve.
  const rn = (relic.relicName || '').trim()
  dropsRelic.value = /relic$/i.test(rn) ? rn : `${rn} Relic`
  dropsThumb.value = relic.thumb || ''
  dropsDialog.value = true
  trackDialog('drop_locations', { item_name: dropsRelic.value })
}
function fmtPct(n: number): string {
  const v = Number(n) || 0
  return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
}

// Hide the global loading spinner once mounted (project rule).
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => finishLoading())
</script>

<style scoped>
.fr-hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}
.fr-cta {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-decoration: none;
  color: #e7cf95;
  border: 1px solid rgba(212, 175, 90, 0.45);
  background: rgba(212, 175, 90, 0.08);
  padding: 8px 14px;
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
  transition: background 0.15s ease, color 0.15s ease;
}
.fr-cta:hover {
  background: rgba(212, 175, 90, 0.18);
  color: #fff2cf;
}
.fr-cta--map {
  color: #7ff0eb;
  border-color: rgba(79, 179, 191, 0.5);
  background: rgba(79, 179, 191, 0.08);
}
.fr-cta--map:hover {
  background: rgba(79, 179, 191, 0.18);
  color: #aef6f2;
}

/* Forma reward badge */
.fr-forma {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: #e7cf95;
  white-space: nowrap;
}
.fr-forma small {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #9aa0b4;
}
.fr-forma--2 {
  color: #7ff0eb;
}
.fr-forma--2 small {
  color: #4fb3bf;
}
.fr-forma .v-icon {
  color: currentColor;
}

.fr-odds {
  font-variant-numeric: tabular-nums;
  color: #b6bcd0;
  font-size: 0.84rem;
}

/* status pill */
.fr-status {
  display: inline-block;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.fr-status--dropping {
  color: #7fe0b0;
  background: rgba(76, 175, 125, 0.14);
  border: 1px solid rgba(76, 175, 125, 0.4);
}
.fr-status--vaulted {
  color: #b6bcd0;
  background: rgba(138, 143, 163, 0.16);
  border: 1px solid rgba(138, 143, 163, 0.4);
}
.fr-status--resurgence {
  color: #c4b0ee;
  background: rgba(159, 122, 234, 0.16);
  border: 1px solid rgba(159, 122, 234, 0.42);
}

/* drops button */
.an-drops {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4fb3bf;
  background: transparent;
  border: 1px solid rgba(79, 179, 191, 0.35);
  border-radius: 6px;
  padding: 5px 10px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.an-drops:hover {
  color: #d4af5a;
  border-color: rgba(212, 175, 90, 0.5);
  background: rgba(212, 175, 90, 0.08);
}
.col-drops {
  text-align: right;
  white-space: nowrap;
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
.an-hidden {
  color: #9aa0b4;
  font-size: 0.92em;
}

.fr-note {
  margin: 26px 4px 8px;
  border: 1px solid rgba(212, 175, 90, 0.22);
  border-left: 2px solid #d4af5a;
  background: rgba(255, 255, 255, 0.015);
  padding: 16px 18px;
}
.fr-note__list {
  margin: 10px 0 14px;
  padding-left: 18px;
  color: #cfd4e4;
  line-height: 1.6;
  font-size: 0.94rem;
}
.fr-note__list li {
  margin-bottom: 6px;
}
.fr-note__list b {
  color: #e7cf95;
}

/* mobile card extras */
.an-card__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: 10px;
}
.an-card__row .an-drops {
  margin-left: auto;
}
</style>
