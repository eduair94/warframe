<template>
  <v-dialog
    :model-value="modelValue"
    :fullscreen="smAndDown"
    max-width="880"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="wg">
      <header class="wg-head">
        <button v-if="detail" ref="backBtn" class="wg-back" aria-label="Back to all warframes" @click="detail = null">
          <v-icon size="20">mdi-arrow-left</v-icon>
        </button>
        <div class="wg-head__text">
          <div class="an-eyebrow">Farming guide</div>
          <h2 class="wg-title">{{ detail ? detail.name : 'Warframes' }}</h2>
        </div>
        <v-btn icon variant="text" aria-label="Close guide" @click="emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </header>

      <!-- loading / error -->
      <div v-if="loading" class="wg-state">
        <div class="wg-state__orbit"></div>
        <p>Reading the foundry records…</p>
      </div>
      <div v-else-if="error" class="wg-state">
        <v-icon color="#e0a3a3" size="34">mdi-alert-circle-outline</v-icon>
        <p>{{ error }}</p>
        <v-btn size="small" variant="outlined" color="#7ff0eb" @click="load">Retry</v-btn>
      </div>

      <!-- ============ frame detail ============ -->
      <div v-else-if="detail" class="wg-body">
        <div class="wg-meta">
          <span v-if="detail.isPrime" class="wg-badge wg-badge--prime">Prime</span>
          <span v-if="detail.vaulted" class="wg-badge wg-badge--vaulted">Vaulted</span>
          <span class="wg-badge">MR {{ detail.masteryReq }}</span>
          <a v-if="detail.wikiaUrl" :href="detail.wikiaUrl" target="_blank" rel="noopener noreferrer" class="wg-wiki">
            wiki <v-icon size="12">mdi-open-in-new</v-icon>
          </a>
        </div>
        <p v-if="detail.description" class="wg-desc">{{ detail.description }}</p>

        <div v-if="detail.isPrime && setPrice(detail)" class="wg-buyline">
          <v-icon size="16" color="#e7cf95">mdi-cart-outline</v-icon>
          Skip the farm: full set trades around
          <strong>{{ fmtPlat(setPrice(detail)) }}p</strong> on Warframe Market.
        </div>
        <NuxtLink v-if="detail.isPrime && setUrl(detail)" :to="setUrl(detail)" class="wg-setlink">
          <v-icon size="15">mdi-scale-balance</v-icon>
          Set vs parts — is it cheaper to buy the pieces?
          <v-icon size="14">mdi-arrow-right</v-icon>
        </NuxtLink>
        <template v-if="!detail.isPrime">
          <div v-if="detail.bpCost > 0" class="wg-buyline">
            <v-icon size="16" color="#e7cf95">mdi-storefront-outline</v-icon>
            Main blueprint: in-game market, {{ detail.bpCost.toLocaleString('en-US') }} credits.
          </div>
          <div v-if="detail.marketCost > 0" class="wg-buyline">
            <v-icon size="16" color="#e7cf95">mdi-alpha-p-circle-outline</v-icon>
            Fully built: in-game market, {{ detail.marketCost.toLocaleString('en-US') }} platinum.
          </div>
          <div class="wg-note wg-note--muted">
            Standard warframe blueprints and parts can't be traded between players — the sources
            below are how you earn them yourself.
          </div>
        </template>
        <div v-if="detail.isPrime && detail.vaulted" class="wg-note">
          Vaulted — its relics no longer drop; farm them from other players' void fissures or trade
          for the relics/parts directly.
        </div>

        <section v-for="comp in detail.components" :key="comp.name" class="wg-comp">
          <div class="wg-comp__head">
            <span class="wg-comp__name">
              {{ comp.name }}<template v-if="comp.itemCount > 1"> × {{ comp.itemCount }}</template>
            </span>
            <span v-if="partPrice(detail, comp)" class="wg-comp__price">~{{ fmtPlat(partPrice(detail, comp)) }}p</span>
          </div>
          <div v-if="comp.sources.length" class="wg-sources">
            <template v-for="(src, i) in comp.sources.slice(0, 8)" :key="i">
              <!-- relic source (primes): highlight the relic's drops on the map -->
              <button
                v-if="src.relic"
                class="wg-chip wg-chip--relic"
                :title="`Show where ${src.relic} drops on the map`"
                @click="locate({ item: src.relic })"
              >
                <v-icon size="13">mdi-diamond-stone</v-icon>
                {{ src.relic.replace(' Relic', '') }}
                <em>{{ fmtChanceRange(src) }}</em>
                <span v-if="relicVaulted(src.relic)" class="wg-chip__vault">vaulted</span>
              </button>
              <!-- planet/node source (standard): open that world + highlight the part -->
              <button
                v-else-if="src.planet && planetNames.has(src.planet)"
                class="wg-chip wg-chip--planet"
                :title="`Highlight ${comp.name} on ${src.planet}`"
                @click="locate({ item: partMapName(comp), planet: src.planet, node: nodeName(src) })"
              >
                <v-icon size="13">mdi-orbit</v-icon>
                {{ src.location }}
                <em>{{ fmtChanceRange(src) }}</em>
              </button>
              <span v-else class="wg-chip wg-chip--plain">
                {{ src.location }}
                <em>{{ fmtChanceRange(src) }}</em>
              </span>
            </template>
            <span v-if="comp.sources.length > 8" class="wg-more">+{{ comp.sources.length - 8 }} more sources</span>
          </div>
          <div v-else class="wg-sources wg-sources--none">
            No mission drop — check the wiki (quest, dojo research, syndicate or vendor).
          </div>
        </section>
      </div>

      <!-- ============ frame list ============ -->
      <div v-else class="wg-body">
        <div class="wg-filters">
          <v-text-field
            ref="searchField"
            v-model="query"
            density="compact"
            hide-details
            clearable
            variant="solo-filled"
            bg-color="rgba(10,11,20,0.8)"
            prepend-inner-icon="mdi-magnify"
            label="Search a warframe"
          ></v-text-field>
          <div class="wg-tabs">
            <button
              v-for="t in TABS"
              :key="t.key"
              class="wg-tab"
              :class="{ 'is-active': tab === t.key }"
              :aria-pressed="tab === t.key ? 'true' : 'false'"
              @click="tab = t.key"
            >
              {{ t.label }}
            </button>
          </div>
        </div>
        <ul class="wg-list">
          <li v-for="f in filtered" :key="f.name">
            <button class="wg-row" @click="detail = f">
              <span class="wg-row__name">{{ f.name }}</span>
              <span v-if="f.vaulted" class="wg-badge wg-badge--vaulted">Vaulted</span>
              <span v-if="f.isPrime" class="wg-badge wg-badge--prime">Prime</span>
              <span v-if="f.isPrime && setPrice(f)" class="wg-row__price">{{ fmtPlat(setPrice(f)) }}p set</span>
              <v-icon size="18" class="wg-row__chev">mdi-chevron-right</v-icon>
            </button>
          </li>
          <li v-if="!filtered.length" class="wg-empty">No warframe matches "{{ query || '' }}".</li>
        </ul>
        <p class="wg-source-note">
          Sources: WFCD community drop data (auto-updated with game patches) · prices from Warframe Market.
        </p>
      </div>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import type { GuideComponent, GuideDropSource, GuideFrame } from '~/composables/useWarframeGuide'

const props = defineProps<{
  modelValue: boolean
  /** planet names that exist on the caller's map (clickable jumps) */
  planetNames: Set<string>
}>()

export interface GuideLocate {
  /** the map's reward item name to highlight (relic, or "<Frame> <Part> Blueprint") */
  item: string
  /** planet to open on the map, when the source names one */
  planet?: string
  /** bare node name (e.g. "Fenton's Field") to expand, best-effort */
  node?: string
}

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'locate', payload: GuideLocate): void
}>()

// fullscreen below 960px — matches this component's own CSS breakpoint
// (Vuetify's default `mobile` flips at 1280, which would fullscreen desktops)
const { smAndDown } = useDisplay()
const { frames, loading, error, load } = useWarframeGuide()
const items = useItemsStore()
const localePath = useLocalePath()

// Vuetify's clearable X writes null into the model — keep the type honest
const query = ref<string | null>('')
const tab = ref<'all' | 'prime' | 'standard'>('all')
const detail = ref<GuideFrame | null>(null)
const backBtn = ref<HTMLButtonElement | null>(null)
const searchField = ref<any>(null)

// moving between list and detail unmounts the focused element — keep
// keyboard focus inside the dialog
watch(detail, async (d) => {
  await nextTick()
  if (d) backBtn.value?.focus()
  else searchField.value?.focus?.()
})

const TABS = [
  { key: 'all' as const, label: 'All' },
  { key: 'prime' as const, label: 'Prime' },
  { key: 'standard' as const, label: 'Standard' },
]

watch(
  () => props.modelValue,
  (open) => {
    if (open) load()
    else detail.value = null
  },
)

const itemIndex = computed(() => buildItemIndex(items.allItems as any[]))

const filtered = computed(() => {
  const q = (query.value || '').trim().toLowerCase()
  return frames.value.filter((f) => {
    if (tab.value === 'prime' && !f.isPrime) return false
    if (tab.value === 'standard' && f.isPrime) return false
    return !q || f.name.toLowerCase().includes(q)
  })
})

function setPrice(f: GuideFrame): number {
  const item = resolveMarketItem(`${f.name} Set`, itemIndex.value)
  const m: any = item && item.market ? item.market : null
  return m ? Number(m.sell) || Number(m.avg_price) || 0 : 0
}

// Internal /set/<url_name> page (the set-vs-parts breakdown). Slugged straight
// from the frame name — "Frost Prime" -> /set/frost_prime_set. (The catalog's
// resolveMarketItem can't be used here: it tolerates the "… Blueprint" suffix
// and would match the blueprint item's url_name instead of the set's.)
function setUrl(f: GuideFrame): string {
  const slug = `${f.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}_set`
  return localePath(`/set/${slug}`)
}

function partPrice(f: GuideFrame, c: GuideComponent): number {
  if (!f.isPrime) return 0
  const item = resolveMarketItem(`${f.name} ${c.name}`, itemIndex.value)
  const m: any = item && item.market ? item.market : null
  return m ? Number(m.sell) || Number(m.avg_price) || 0 : 0
}

function relicVaulted(relicName: string): boolean {
  const item: any = resolveMarketItem(relicName, itemIndex.value)
  return item ? item.vaulted === true : false
}

// The drop-map reward name for a standard frame's component is
// "<Frame> <Component> Blueprint" (verified against /drops/map); relics keep
// their own name. Either resolves to a real reward the map can light up.
function partMapName(comp: GuideComponent): string {
  return detail.value ? `${detail.value.name} ${comp.name} Blueprint` : ''
}

// Bare node name from a WFCD source string:
// "Pluto/Fenton's Field (Skirmish), Rotation A" -> "Fenton's Field".
function nodeName(src: GuideDropSource): string {
  let s = src.location || ''
  const slash = s.indexOf('/')
  if (slash >= 0) s = s.slice(slash + 1)
  return s
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,\s*Rotation.*$/i, '')
    .trim()
}

function locate(payload: GuideLocate) {
  emit('locate', payload)
  emit('update:modelValue', false)
}

function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}

function fmtChanceRange(src: GuideDropSource): string {
  const f = (v: number) => (v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, ''))
  if (Math.abs(src.chanceMax - src.chanceMin) < 0.01) return `${f(src.chanceMax)}%`
  return `${f(src.chanceMin)}–${f(src.chanceMax)}%`
}
</script>

<style scoped>
.wg {
  display: flex;
  flex-direction: column;
  max-height: 86vh;
  background: linear-gradient(180deg, #10111f, #0a0b15);
  border: 1px solid rgba(200, 168, 92, 0.3);
  color: #eef1f8;
  overflow: hidden;
}
@media (max-width: 959px) {
  .wg {
    max-height: 100vh;
    height: 100%;
  }
}
.an-eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.66rem;
  color: #8f95ab;
}
.wg-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px 12px 18px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.2);
  flex: none;
}
.wg-head__text {
  flex: 1;
  min-width: 0;
}
.wg-back {
  background: none;
  border: 1px solid rgba(200, 168, 92, 0.3);
  color: #c8a85c;
  cursor: pointer;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: none;
}
.wg-back:hover {
  color: #e7cf95;
}
.wg-title {
  font-family: 'Cinzel', serif;
  font-size: 1.4rem;
  color: #e7cf95;
  margin: 0;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wg-body {
  overflow-y: auto;
  padding: 14px 18px 18px;
}
.wg-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #b6bcd0;
  font-family: 'Rajdhani', sans-serif;
}
.wg-state__orbit {
  width: 46px;
  height: 46px;
  border: 2px solid rgba(200, 168, 92, 0.25);
  border-top-color: #c8a85c;
  border-radius: 50%;
  animation: wg-spin 0.9s linear infinite;
}
@keyframes wg-spin {
  to {
    transform: rotate(360deg);
  }
}

/* list */
.wg-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.wg-filters > :first-child {
  flex: 1;
  min-width: 220px;
}
.wg-tabs {
  display: flex;
  border: 1px solid rgba(200, 168, 92, 0.3);
}
.wg-tab {
  background: none;
  border: none;
  cursor: pointer;
  padding: 7px 14px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #8f95ab;
}
.wg-tab.is-active {
  color: #0c0d18;
  background: #c8a85c;
}
.wg-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wg-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  padding: 10px 6px;
  text-align: left;
  color: inherit;
}
.wg-row:hover {
  background: rgba(200, 168, 92, 0.06);
}
.wg-row:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: -2px;
}
.wg-row__name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  flex: 1;
  min-width: 0;
}
.wg-row__price {
  font-family: 'Rajdhani', sans-serif;
  color: #e7cf95;
  font-size: 0.82rem;
}
.wg-row__chev {
  color: #8f95ab;
}
.wg-empty {
  padding: 26px 8px;
  color: #8f95ab;
  font-family: 'Rajdhani', sans-serif;
}
.wg-source-note {
  margin: 14px 2px 0;
  font-size: 0.74rem;
  color: #767c92;
}

/* badges */
.wg-badge {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.64rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 8px;
  border: 1px solid rgba(182, 192, 204, 0.4);
  color: #b6c0cc;
  white-space: nowrap;
}
.wg-badge--prime {
  border-color: rgba(231, 207, 149, 0.55);
  color: #e7cf95;
}
.wg-badge--vaulted {
  border-color: rgba(224, 163, 163, 0.5);
  color: #e0a3a3;
}
.wg-wiki {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7ff0eb;
  text-decoration: none;
}
.wg-wiki:hover {
  text-decoration: underline;
}

/* detail */
.wg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.wg-desc {
  color: #b6bcd0;
  font-size: 0.9rem;
  line-height: 1.55;
  margin: 0 0 12px;
}
.wg-buyline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  color: #cfd4e4;
  padding: 8px 12px;
  border: 1px solid rgba(231, 207, 149, 0.25);
  background: rgba(231, 207, 149, 0.05);
  margin-bottom: 10px;
}
.wg-buyline strong {
  color: #e7cf95;
}
.wg-setlink {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  padding: 7px 12px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  color: #7ff0eb;
  border: 1px solid rgba(53, 214, 208, 0.4);
  background: rgba(53, 214, 208, 0.06);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.wg-setlink:hover {
  color: #aef6f2;
  background: rgba(53, 214, 208, 0.12);
}
.wg-note {
  font-size: 0.82rem;
  color: #e0a3a3;
  margin-bottom: 12px;
}
.wg-note--muted {
  color: #8f95ab;
}
.wg-comp {
  margin-bottom: 14px;
}
.wg-comp__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.22);
  padding-bottom: 4px;
  margin-bottom: 8px;
}
.wg-comp__name {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #f2ead6;
}
.wg-comp__price {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.82rem;
  color: #e7cf95;
}
.wg-sources {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.wg-sources--none {
  font-size: 0.82rem;
  color: #8f95ab;
}
.wg-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 0.8rem;
  padding: 4px 10px;
  border: 1px solid rgba(182, 192, 204, 0.25);
  color: #cfd4e4;
  background: rgba(255, 255, 255, 0.02);
  white-space: nowrap;
}
.wg-chip em {
  font-style: normal;
  color: #8f95ab;
  font-size: 0.72rem;
}
button.wg-chip {
  cursor: pointer;
}
button.wg-chip:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 1px;
}
.wg-chip--relic {
  border-color: rgba(53, 214, 208, 0.45);
  color: #7ff0eb;
}
.wg-chip--relic:hover {
  background: rgba(53, 214, 208, 0.1);
}
.wg-chip--planet {
  border-color: rgba(231, 207, 149, 0.45);
  color: #e7cf95;
}
.wg-chip--planet:hover {
  background: rgba(231, 207, 149, 0.08);
}
.wg-chip__vault {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #e0a3a3;
  border-left: 1px solid rgba(224, 163, 163, 0.4);
  padding-left: 6px;
}
.wg-more {
  font-size: 0.74rem;
  color: #767c92;
  font-family: 'Rajdhani', sans-serif;
}
</style>
