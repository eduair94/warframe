<template>
  <v-dialog
    :model-value="modelValue"
    max-width="760"
    scrollable
    content-class="dld-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="dld">
      <header class="dld__head">
        <img
          v-if="hasHeadThumb"
          class="dld__thumb"
          :src="headThumb"
          :alt="displayName"
          @error="onImgError"
        />
        <span v-else class="dld__node" aria-hidden="true"></span>
        <div class="dld__headtext">
          <div class="dld__eyebrow">{{ t('dropDialog.eyebrow') }}</div>
          <h2 class="dld__title">{{ displayName || t('dropDialog.itemFallback') }}</h2>
        </div>
        <button class="dld__close" :aria-label="t('dropDialog.closeAria')" @click="close">
          <v-icon>mdi-close</v-icon>
        </button>
      </header>

      <!-- Live market snapshot (from the catalog store; independent of the drops fetch) -->
      <section v-if="marketItem" class="dld__market">
        <div class="dld__market-grid">
          <div class="dld__mstat"><span class="dld__mlbl">{{ t('dropDialog.market.buy') }}</span><span class="dld__mval">{{ fmtP(mkt.buy) }}p</span></div>
          <div class="dld__mstat"><span class="dld__mlbl">{{ t('dropDialog.market.sell') }}</span><span class="dld__mval">{{ fmtP(mkt.sell) }}p</span></div>
          <div class="dld__mstat"><span class="dld__mlbl">{{ t('dropDialog.market.avg48h') }}</span><span class="dld__mval">{{ fmtP(mkt.avg_price) }}p</span></div>
          <div class="dld__mstat"><span class="dld__mlbl">{{ t('dropDialog.market.diff') }}</span><span class="dld__mval">{{ fmtP(mkt.diff) }}p</span></div>
          <div class="dld__mstat"><span class="dld__mlbl">{{ t('dropDialog.market.vol48h') }}</span><span class="dld__mval" :class="{ 'is-thin': signal.thin }">{{ fmtInt(mkt.volume) }}</span></div>
          <div v-if="marketItem.priceUpdate" class="dld__mstat"><span class="dld__mlbl">{{ t('dropDialog.market.updated') }}</span><span class="dld__mval">{{ fromNow(marketItem.priceUpdate) }}</span></div>
        </div>
        <div class="dld__market-foot">
          <span v-if="signal.note" class="dld__flag" :class="{ 'is-warn': signal.overpriced }">⚠ {{ signal.note }}</span>
          <span v-if="lastTrade" class="dld__last">{{ t('dropDialog.market.lastTrade', { price: fmtP(lastTrade.avg_price), time: fromNow(lastTrade.datetime) }) }}</span>
          <div v-if="marketItem.tags && marketItem.tags.length" class="dld__tags">
            <span v-for="(t, ti) in marketItem.tags.slice(0, 4)" :key="ti" class="dld__tag">{{ fmtTag(t) }}</span>
          </div>
          <a
            v-if="wmUrl"
            class="dld__wm"
            :href="wmUrl"
            target="_blank"
            rel="noopener"
            @click="trackMarketOpen(itemName, { source: 'drops_dialog' })"
          >{{ t('dropDialog.market.viewOnMarket') }}</a>
        </div>
      </section>
      <section v-else-if="itemName" class="dld__market dld__market--none">
        {{ t('dropDialog.market.notTraded') }}
      </section>

      <div class="dld__body">
        <!-- Loading -->
        <div v-if="loading" class="dld__state">
          <div v-for="n in 4" :key="n" class="dld__skel"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="dld__state dld__state--msg">
          <v-icon color="#e0a3a3" size="34">mdi-alert-circle-outline</v-icon>
          <p>{{ t('dropDialog.state.error') }}</p>
          <button class="dld__retry" @click="onRetry">{{ t('dropDialog.state.retry') }}</button>
        </div>

        <!-- Empty -->
        <div v-else-if="!hasResults" class="dld__state dld__state--msg">
          <v-icon color="#6b7280" size="34">mdi-map-marker-off-outline</v-icon>
          <p>{{ t('dropDialog.state.empty') }}</p>
          <span class="dld__hint">{{ t('dropDialog.state.emptyHint') }}</span>
        </div>

        <!-- Results -->
        <div v-else class="dld__results">
          <!-- Direct mission drops -->
          <section v-if="data.missions.length" class="dld__sec">
            <div class="dld__sec-head">
              <span class="dld__sec-title">{{ t('dropDialog.results.directDrops') }}</span>
              <span class="dld__sec-count">{{ data.missions.length }}</span>
            </div>
            <ul class="dld__list">
              <li v-for="(m, i) in data.missions" :key="'m' + i" class="dld__row">
                <div class="dld__where">
                  <span class="dld__place">{{ m.location }}</span>
                  <span class="dld__planet">{{ m.planet }}</span>
                </div>
                <span class="dld__mode">{{ m.gameMode }}</span>
                <span v-if="m.rotation" class="dld__rot" :data-rot="m.rotation">{{ m.rotation }}</span>
                <span class="dld__chance">
                  <i class="dld__dot" :style="{ background: rarityColor(m.rarity) }"></i>{{ fmt(m.chance) }}%
                </span>
              </li>
            </ul>
          </section>

          <!-- From relics -->
          <section v-if="data.relics.length" class="dld__sec">
            <div class="dld__sec-head">
              <span class="dld__sec-title">{{ t('dropDialog.results.foundInRelics') }}</span>
              <span class="dld__sec-count">{{ data.relics.length }}</span>
            </div>
            <div v-for="(r, i) in data.relics" :key="'r' + i" class="dld__relic">
              <div class="dld__relic-head">
                <span class="dld__relic-id">
                  <img
                    class="dld__relic-thumb"
                    :src="itemThumb({ itemName: r.relicName })"
                    :alt="r.relicName"
                    @error="onImgError"
                  />
                  <span class="dld__relic-name">{{ r.relicName }}</span>
                </span>
                <span class="dld__chance">
                  <i class="dld__dot" :style="{ background: rarityColor(r.rarity) }"></i>{{ r.rarity }}
                </span>
              </div>

              <!-- Drop chance by relic refinement (Intact/Exceptional/Flawless/Radiant) -->
              <div class="dld__refine">
                <div
                  v-for="ref in refinements(r.chance)"
                  :key="ref.key"
                  class="dld__refcell"
                  :class="'is-' + ref.key"
                >
                  <span class="dld__reflbl">{{ t('dropDialog.refine.' + ref.key) }}</span>
                  <span class="dld__refval">{{ fmt(ref.chance) }}%</span>
                </div>
              </div>

              <div v-if="r.farmNodes.length" class="dld__farm">
                <span class="dld__farm-lbl">{{ t('dropDialog.results.farmRelicAt') }}</span>
                <div class="dld__farm-nodes">
                  <span
                    v-for="(n, j) in (expanded.has(i) ? r.farmNodes : r.farmNodes.slice(0, 6))"
                    :key="j"
                    class="dld__chip"
                  >
                    {{ n.location }}<small>{{ n.planet }} · {{ n.gameMode }}<template v-if="n.rotation"> · {{ n.rotation }}</template></small>
                  </span>
                  <button
                    v-if="r.farmNodes.length > 6"
                    type="button"
                    class="dld__chip dld__chip--more"
                    @click="toggle(i)"
                  >
                    {{ expanded.has(i) ? t('dropDialog.results.showLess') : t('dropDialog.results.showMore', { n: r.farmNodes.length - 6 }) }}
                  </button>
                </div>
              </div>
              <div v-else class="dld__farm dld__farm--none">{{ t('dropDialog.results.noFarmSource') }}</div>
            </div>
          </section>
        </div>
      </div>

      <footer class="dld__foot">
        <a
          v-if="wikiUrl"
          class="dld__source dld__source--wiki"
          :href="wikiUrl"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackAction('wiki_open', { item_name: itemName })"
        >
          <v-icon size="14">mdi-book-open-variant</v-icon> {{ t('dropDialog.footer.wiki') }}
        </a>
        <a
          class="dld__source"
          :href="externalLink"
          target="_blank"
          rel="noopener noreferrer"
          @click="trackAction('drop_table_open', { item_name: itemName })"
        >
          {{ t('dropDialog.footer.crossCheck') }} <v-icon size="14">mdi-open-in-new</v-icon>
        </a>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

interface DropMission {
  location: string
  planet: string
  gameMode: string
  rotation?: string
  rarity: string
  chance: number
}

interface DropFarmNode {
  location: string
  planet: string
  gameMode: string
  rotation?: string
}

interface DropRelic {
  relicName: string
  rarity: string
  chance: number
  farmNodes: DropFarmNode[]
}

interface DropData {
  missions: DropMission[]
  relics: DropRelic[]
  itemName?: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    itemName?: string
    thumb?: string
  }>(),
  { modelValue: false, itemName: '', thumb: '' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { t } = useI18n()
// The dialog is opened from 10 different pages; every event it sends is stamped
// with the host page's `tool` by the event layer, so no source prop is needed.
// The open itself is already reported by whichever parent toggles the v-model.
const { trackAction, trackMarketOpen } = useAnalytics()

const base = useApiBase()

const { itemThumb, THUMB_PLACEHOLDER } = useItemThumb()

const { localName } = useLocalizedName()

// Live market snapshot, cross-referenced from the freshly-synced catalog store
// by item name (blueprint-tolerant), so the dialog shows buy/sell/volume/etc.
// without the user having to leave for the home table. See utils/marketLookup.
const itemsStore = useItemsStore()
const itemIndex = computed(() => buildItemIndex(itemsStore.allItems as any[]))
const marketItem = computed<any>(() =>
  props.itemName ? resolveMarketItem(props.itemName, itemIndex.value) : null,
)
// Header title/alt localized to the active locale via the resolved item's
// url_name; falls back to the exact English `itemName` (unchanged on `en`).
const displayName = computed(() =>
  localName('items', marketItem.value && marketItem.value.url_name, props.itemName),
)
const mkt = computed<any>(() => (marketItem.value && marketItem.value.market) || {})
const lastTrade = computed<any>(() => (mkt.value && mkt.value.last_completed) || null)
const signal = computed(() => marketSignal(marketItem.value && marketItem.value.market))
const wmUrl = computed(() =>
  marketItem.value && marketItem.value.url_name
    ? 'https://warframe.market/items/' + marketItem.value.url_name
    : '',
)

const loading = ref(false)
const error = ref(false)
const data = ref<DropData>({ missions: [], relics: [], itemName: '' })
const lastLoaded = ref('')

// Resolve the header thumbnail against the fresh catalog (the passed `thumb`
// prop may carry a stale warframe.market hash that 404s). Falls back to the
// diamond node glyph when nothing resolves.
const headThumb = computed(() =>
  itemThumb({ itemName: props.itemName, thumb: props.thumb }),
)
const hasHeadThumb = computed(() => headThumb.value !== THUMB_PLACEHOLDER)
const hasResults = computed(
  () => !!(data.value && (data.value.missions.length || data.value.relics.length)),
)
const externalLink = computed(() => {
  let s = '^' + (props.itemName || '')
  if (s.includes('(')) s = (s.split('(')[0] ?? '').trim()
  if (s.includes('Set')) s = s.replace('Set', '').trim()
  return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
})
const wikiUrl = computed(() => itemWikiUrl(props.itemName))

function close() {
  emit('update:modelValue', false)
}

function onImgError(e: Event) {
  // Hide a broken thumbnail and fall back to the diamond node glyph.
  const img = e.target as HTMLImageElement | null
  if (img) img.style.display = 'none'
}

// Relic reward drop-chance by refinement, derived from the base (Intact) chance
// so the full drop table (Intact/Exceptional/Flawless/Radiant) shows inline —
// no need to open warframestat. Warframe's per-slot chances are fixed; we key
// off the base chance because it's reliable even when a rarity label disagrees.
interface Refinement {
  key: string
  chance: number
}
const REFINE_SLOTS: Record<string, number[]> = {
  common: [25.33, 23.33, 20, 16.67],
  uncommon: [11, 13, 17, 20],
  rare: [2, 4, 6, 10],
}
// Refinement tier keys map to translated labels via t('dropDialog.refine.<key>').
const REFINE_KEYS = ['intact', 'exceptional', 'flawless', 'radiant'] as const
function refinements(baseChance: number): Refinement[] {
  const slot = baseChance >= 18 ? 'common' : baseChance >= 6 ? 'uncommon' : 'rare'
  const vals = REFINE_SLOTS[slot] as number[]
  return REFINE_KEYS.map((key, i) => ({ key, chance: vals[i] as number }))
}

// Farm-node lists expand inline (show first 6, toggle to all) — no external nav.
const expanded = ref<Set<number>>(new Set())
function toggle(i: number) {
  const s = new Set(expanded.value)
  if (s.has(i)) s.delete(i)
  else {
    s.add(i)
    // Only the expand direction is a signal — it means the visible 6 farm nodes
    // weren't enough for the player.
    trackAction('drops_row_expand')
  }
  expanded.value = s
}

async function load() {
  const name = props.itemName
  if (!name) return
  loading.value = true
  error.value = false
  try {
    const res = await $fetch<DropData>(`${base}/drops/item/${encodeURIComponent(name)}`)
    data.value = res || { missions: [], relics: [], itemName: '' }
    lastLoaded.value = name
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

// Retry after a failed drops fetch — reported so the error rate can be read as
// "how often did it cost the user a second attempt", not just raw exceptions.
function onRetry() {
  trackAction('drops_retry')
  load()
}

function fmt(n: number): string {
  const v = Number(n) || 0
  return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
}
function fmtP(n: number): string {
  const v = Number(n) || 0
  return v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(v % 1 === 0 ? 0 : 1)
}
function fmtInt(n: number): string {
  return String(Math.round(Number(n) || 0))
}
function fromNow(d: any): string {
  if (!d) return ''
  const t = dayjs(d)
  return t.isValid() ? t.fromNow() : ''
}
function fmtTag(t: string): string {
  return (t || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function rarityColor(rarity: string): string {
  const r = (rarity || '').toLowerCase()
  if (r === 'legendary') return '#35d6d0'
  if (r === 'rare') return '#e7cf95'
  if (r === 'uncommon') return '#b6c0cc'
  return '#c08457'
}

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.itemName && props.itemName !== lastLoaded.value) load()
  },
)
watch(
  () => props.itemName,
  (name) => {
    if (props.modelValue && name && name !== lastLoaded.value) load()
  },
)
</script>

<style scoped>
.dld {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.32);
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  color: #eef1f8;
  display: flex;
  flex-direction: column;
  max-height: 84vh;
}
.dld__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.22);
}
.dld__node {
  width: 11px;
  height: 11px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.7);
  flex: none;
}
.dld__thumb {
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex: none;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.dld__headtext { min-width: 0; flex: 1; }
.dld__eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.64rem;
  color: #8f95ab;
}
.dld__title {
  font-family: 'Cinzel', serif;
  font-size: 1.28rem;
  line-height: 1.15;
  color: #e7cf95;
  margin: 2px 0 0;
  word-break: break-word;
}
.dld__close {
  flex: none;
  color: #9aa0b8;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.dld__close:hover { color: #e7cf95; border-color: rgba(200, 168, 92, 0.5); }
.dld__close:focus-visible { outline: 2px solid #35d6d0; outline-offset: 2px; }

.dld__market {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.16);
  background: rgba(200, 168, 92, 0.03);
}
.dld__market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
  gap: 8px 14px;
}
.dld__mstat { display: flex; flex-direction: column; min-width: 0; }
.dld__mlbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.1em; font-size: 0.6rem; color: #8f95ab;
}
.dld__mval { font-variant-numeric: tabular-nums; color: #eef1f8; font-size: 0.98rem; font-weight: 600; }
.dld__mval.is-thin { color: #e0a3a3; }
.dld__market-foot {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin-top: 10px;
}
.dld__flag {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.06em;
  font-size: 0.68rem; color: #c8a85c;
}
.dld__flag.is-warn { color: #e0a3a3; }
.dld__last { font-size: 0.74rem; color: #8f95ab; }
.dld__tags { display: inline-flex; flex-wrap: wrap; gap: 5px; }
.dld__tag {
  font-family: 'Rajdhani', sans-serif; font-size: 0.66rem; color: #b6bcd0;
  border: 1px solid rgba(255,255,255,0.12); padding: 1px 6px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.04em;
}
.dld__wm {
  margin-left: auto;
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.08em;
  font-size: 0.74rem; color: #35d6d0; text-decoration: none; white-space: nowrap;
}
.dld__wm:hover { color: #7ff0eb; text-decoration: underline; }
.dld__market--none {
  font-family: 'Rajdhani', sans-serif; font-size: 0.82rem; color: #8f95ab; font-style: italic;
}

.dld__body { padding: 16px 20px; overflow-y: auto; }

.dld__state { display: flex; flex-direction: column; gap: 12px; }
.dld__state--msg { align-items: center; text-align: center; padding: 26px 8px; gap: 8px; }
.dld__state--msg p { font-family: 'Rajdhani', sans-serif; font-size: 1.05rem; color: #cfd4e4; margin: 0; }
.dld__hint { font-size: 0.85rem; color: #8f95ab; max-width: 34ch; }
.dld__skel {
  height: 42px;
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.07), rgba(255,255,255,0.03));
  background-size: 200% 100%;
  animation: dld-shimmer 1.2s ease-in-out infinite;
}
@keyframes dld-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.dld__retry {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #17130a;
  background: #c8a85c;
  border: none;
  padding: 8px 20px;
  font-weight: 700;
  cursor: pointer;
}
.dld__retry:hover { background: #e7cf95; }

.dld__sec { margin-bottom: 20px; }
.dld__sec:last-child { margin-bottom: 0; }
.dld__sec-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
.dld__sec-title {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
  color: #c8a85c;
}
.dld__sec-count {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  color: #8f95ab;
  border: 1px solid rgba(255,255,255,0.12);
  padding: 0 7px;
  border-radius: 2px;
}
.dld__list { list-style: none; padding: 0; margin: 0; }
.dld__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.dld__row:hover { background: rgba(200, 168, 92, 0.05); }
.dld__where { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.dld__place { color: #eef1f8; font-weight: 600; font-size: 0.96rem; }
.dld__planet { color: #8f95ab; font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.06em; }
.dld__mode { color: #b6bcd0; font-size: 0.82rem; white-space: nowrap; }
.dld__rot {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.74rem;
  width: 20px; height: 20px;
  display: grid; place-items: center;
  border-radius: 2px;
  color: #0c0d18;
  background: #6f7796;
}
.dld__rot[data-rot='A'] { background: #6fae9b; }
.dld__rot[data-rot='B'] { background: #c8a85c; }
.dld__rot[data-rot='C'] { background: #cf7b57; }
.dld__chance {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-variant-numeric: tabular-nums;
  color: #dfe3f0;
  font-size: 0.9rem;
  white-space: nowrap;
}
.dld__dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }

.dld__relic {
  border: 1px solid rgba(200, 168, 92, 0.16);
  border-left: 2px solid #c8a85c;
  padding: 11px 13px;
  margin-bottom: 8px;
  background: rgba(255,255,255,0.014);
}
.dld__relic-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.dld__relic-id { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.dld__relic-thumb {
  width: 30px;
  height: 30px;
  object-fit: contain;
  flex: none;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px);
}
.dld__relic-name { font-family: 'Cinzel', serif; color: #e7cf95; font-size: 1.02rem; }
.dld__refine {
  margin-top: 9px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}
.dld__refcell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 5px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
}
.dld__refcell.is-radiant { border-color: rgba(200, 168, 92, 0.4); background: rgba(200, 168, 92, 0.08); }
.dld__reflbl { font-size: 0.62rem; letter-spacing: 0.04em; text-transform: uppercase; color: #8a93ab; }
.dld__refval { font-size: 0.9rem; font-weight: 700; color: #e8edf6; }
.dld__farm { margin-top: 9px; }
.dld__farm-lbl {
  display: block;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.66rem;
  color: #8f95ab;
  margin-bottom: 5px;
}
.dld__farm--none { font-size: 0.82rem; color: #8f95ab; font-style: italic; }
.dld__farm-nodes { display: flex; flex-wrap: wrap; gap: 6px; }
.dld__chip {
  display: inline-flex;
  flex-direction: column;
  background: rgba(53, 214, 208, 0.06);
  border: 1px solid rgba(53, 214, 208, 0.22);
  color: #cfe9e7;
  padding: 4px 9px;
  font-size: 0.86rem;
  line-height: 1.25;
}
.dld__chip small { color: #7f95a2; font-size: 0.68rem; }
.dld__chip--more { justify-content: center; color: #8f95ab; background: transparent; border-color: rgba(255,255,255,0.12); }

.dld__foot {
  padding: 12px 20px;
  border-top: 1px solid rgba(200, 168, 92, 0.22);
  display: flex;
  align-items: center;
  gap: 18px;
  justify-content: flex-end;
}
.dld__source {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #8f95ab;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  text-decoration: none;
}
.dld__source:hover { color: #35d6d0; }
.dld__source--wiki { color: #7ff0eb; margin-right: auto; }
.dld__source--wiki:hover { color: #aef6f2; }
</style>
