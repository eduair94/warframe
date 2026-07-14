<template>
  <div class="sc3">
    <!-- ===================== The cartograph ===================== -->
    <section
      ref="mapEl"
      class="sc3-map"
      aria-label="3D interactive Warframe drop map. Arrow keys cycle worlds and open their missions, Escape clears the selection."
      tabindex="0"
      @keydown="onMapKey"
    >
      <StarChartGalaxy
        v-if="!unsupported"
        :worlds="galaxyWorlds"
        :selected="selected"
        :highlighted="highlightedWorlds"
        @select="onSceneSelect"
        @unsupported="unsupported = true"
      />

      <!-- HUD -->
      <div class="sc3-hud">
        <div class="sc3-hud__corner sc3-hud__corner--tl" aria-hidden="true"></div>
        <div class="sc3-hud__corner sc3-hud__corner--br" aria-hidden="true"></div>

        <header class="sc3-head">
          <div class="an-eyebrow">Warframe · 3D drop map</div>
          <h1 class="sc3-title">Origin System</h1>
          <div class="sc3-head__links">
            <NuxtLink :to="localePath('/star-chart')" class="sc3-2d">◂ 2D chart view</NuxtLink>
            <button class="sc3-guide-btn" @click="guideOpen = true">
              <v-icon size="15">mdi-shield-star-outline</v-icon>
              Warframe guide
            </button>
          </div>
        </header>

        <div v-if="!loading && planets.length" class="sc3-stats">
          <div class="sc3-stat">
            <span class="sc3-stat__num">{{ stats.planets }}</span>
            <span class="sc3-stat__lbl">worlds</span>
          </div>
          <div class="sc3-stat">
            <span class="sc3-stat__num is-teal">{{ stats.nodes }}</span>
            <span class="sc3-stat__lbl">missions</span>
          </div>
          <div class="sc3-stat">
            <span class="sc3-stat__num is-gold">{{ fmtPlat(stats.topValue) }}p</span>
            <span class="sc3-stat__lbl">best drop</span>
          </div>
        </div>

        <!-- polite announcements for screen readers (persistent live region) -->
        <div class="sc3-sr-live" aria-live="polite">{{ srAnnouncement }}</div>

        <div v-if="!loading && planets.length" class="sc3-search" :class="{ 'is-panel-open': panelOpen }">
          <v-autocomplete
            v-model="findItem"
            :items="searchNames"
            density="compact"
            hide-details
            clearable
            variant="solo-filled"
            bg-color="rgba(10,11,20,0.82)"
            prepend-inner-icon="mdi-magnify"
            label="Where do I farm…?"
            @update:model-value="onFind"
          ></v-autocomplete>
        </div>

        <div class="sc3-legend" aria-hidden="true">
          <span class="sc3-legend__bar"></span>
          <span>glow = plat / drop</span>
          <span class="sc3-legend__diamond">◆</span>
          <span>void zone</span>
        </div>

        <!-- Helldivers-style control legend (wording follows the pointer type) -->
        <div class="sc3-controls" aria-hidden="true">
          <span class="sc3-controls__item">
            <v-icon size="15">{{ coarsePointer ? 'mdi-gesture-swipe' : 'mdi-gesture-swipe-horizontal' }}</v-icon>
            <em>{{ coarsePointer ? '1 finger' : 'drag' }}</em> rotate
          </span>
          <span class="sc3-controls__sep"></span>
          <span class="sc3-controls__item">
            <v-icon size="15">{{ coarsePointer ? 'mdi-gesture-pinch' : 'mdi-magnify-plus-outline' }}</v-icon>
            <em>{{ coarsePointer ? 'pinch' : 'scroll' }}</em> zoom
          </span>
          <span class="sc3-controls__sep"></span>
          <span class="sc3-controls__item">
            <v-icon size="15">mdi-arrow-all</v-icon>
            <em>{{ coarsePointer ? '2 fingers' : 'right-drag' }}</em> pan
          </span>
        </div>

        <!-- world-to-world navigator -->
        <nav v-if="!loading && planets.length" class="sc3-dock" :class="{ 'is-panel-open': panelOpen }" aria-label="Jump between worlds">
          <button class="sc3-dock__arrow" aria-label="Previous world" @click="goWorld(-1)">
            <v-icon size="20">mdi-chevron-left</v-icon>
          </button>
          <v-menu location="top" offset="8">
            <template #activator="{ props: menuProps }">
              <button class="sc3-dock__name" v-bind="menuProps">
                {{ selected || 'Select a world' }}
                <v-icon size="14">mdi-menu-up</v-icon>
              </button>
            </template>
            <v-list density="compact" bg-color="#0c0d18" class="sc3-dock__list">
              <v-list-item
                v-for="w in navWorlds"
                :key="w.planet"
                :active="w.planet === selected"
                @click="selectPlanet(w.planet)"
              >
                <v-list-item-title class="sc3-dock__row">
                  <span>{{ w.planet }}</span>
                  <span class="sc3-dock__val">{{ fmtPlat(w.value) }}p</span>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <button class="sc3-dock__arrow" aria-label="Next world" @click="goWorld(1)">
            <v-icon size="20">mdi-chevron-right</v-icon>
          </button>
        </nav>

        <!-- loading -->
        <div v-if="loading" class="sc3-load">
          <div class="sc3-load__orbit"></div>
          <p>Charting the Origin System…</p>
        </div>
        <div v-else-if="!planets.length" class="sc3-load">
          <v-icon color="#c8a85c" size="38">mdi-orbit</v-icon>
          <p>Star chart data isn't loaded yet.</p>
          <span>Run the drop sync to populate the map, then reload.</span>
        </div>

        <!-- ============ Detail panel: world or item ============ -->
        <transition name="sc3-slide">
          <aside v-if="panelOpen" class="sc3-panel" aria-live="polite">
            <!-- world drilldown -->
            <template v-if="selectedData">
              <div class="sc3-panel__head">
                <div>
                  <div class="an-eyebrow">{{ selectedData.nodeCount }} missions</div>
                  <h2 class="sc3-panel__title">{{ selectedData.planet }}</h2>
                  <div v-if="focusItem" class="sc3-panel__focus">
                    <v-icon size="12" color="#7ff0eb">mdi-diamond-stone</v-icon>
                    showing sources of <strong>{{ focusItem }}</strong>
                  </div>
                  <div class="sc3-panel__wiki">
                    <a :href="worldWikiUrl(selectedData.planet)" target="_blank" rel="noopener noreferrer">
                      wiki <v-icon size="11">mdi-open-in-new</v-icon>
                    </a>
                    <a
                      v-if="selectedWikiMap"
                      :href="selectedWikiMap.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="sc3-panel__wiki-map"
                    >
                      <v-icon size="11">mdi-map-search-outline</v-icon>
                      {{ selectedWikiMap.title }} interactive map
                    </a>
                  </div>
                </div>
                <div class="sc3-panel__best">
                  <span>{{ fmtPlat(selectedData.value) }}</span
                  ><small>p/drop best</small>
                </div>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  class="sc3-panel__close"
                  :aria-label="findItem ? 'Back to item results' : 'Close panel'"
                  @click="closePanel"
                >
                  <v-icon>{{ findItem ? 'mdi-arrow-left' : 'mdi-close' }}</v-icon>
                </v-btn>
              </div>
              <ul class="sc3-nodes">
                <li v-for="node in selectedData.nodes" :key="node.location" class="sc3-node">
                  <button
                    class="sc3-node__head"
                    :aria-expanded="openNode === node.location ? 'true' : 'false'"
                    @click="toggleNode(node.location)"
                  >
                    <span class="sc3-node__id">
                      <span class="sc3-node__name">
                        {{ node.location }}
                        <v-icon v-if="focusItem && nodeHasFocusItem(node)" size="11" color="#7ff0eb" class="sc3-node__mark">mdi-diamond-stone</v-icon>
                      </span>
                      <span class="sc3-node__mode">{{ node.gameMode }}<template v-if="node.isEvent"> · event</template></span>
                    </span>
                    <span class="sc3-node__val" :class="valueClass(node.value)">{{ fmtPlat(node.value) }}<small>p</small></span>
                    <v-icon class="sc3-node__chev" size="18">{{ openNode === node.location ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </button>
                  <div v-if="openNode === node.location" class="sc3-node__body">
                    <div v-for="rot in node.rotations" :key="rot.rotation || 'flat'" class="sc3-rot">
                      <div v-if="rot.rotation" class="sc3-rot__head">
                        <span class="sc3-rot__badge" :data-rot="rot.rotation">{{ rot.rotation }}</span>
                        <span class="sc3-rot__val">{{ fmtPlat(rot.value) }} p/drop</span>
                      </div>
                      <div
                        v-for="(rw, i) in sortedRewards(rot.rewards)"
                        :key="i"
                        class="sc3-reward"
                        :class="{ 'is-dud': !rw.tradeable, 'is-focus': focusItem && rw.itemName === focusItem }"
                      >
                        <img
                          class="sc3-reward__thumb"
                          :src="itemThumb({ itemName: rw.itemName, urlName: rw.url_name, thumb: rw.thumb })"
                          :alt="rw.itemName"
                          loading="lazy"
                          @error="onImgError"
                        />
                        <button class="sc3-reward__name" @click="openDrops(rw.itemName)">{{ rw.itemName }}</button>
                        <span class="sc3-reward__chance">
                          <i class="sc3-dot" :style="{ background: rarityColor(rw.rarity) }"></i>{{ fmtChance(rw.chance) }}%
                        </span>
                        <span class="sc3-reward__plat">
                          <template v-if="rw.tradeable">
                            <span class="sc3-reward__price">{{ fmtPlat(rw.price) }}p</span>
                            <small
                              v-if="rewardMeta(rw).vol !== null"
                              class="sc3-reward__vol"
                              :class="{ 'is-thin': rewardMeta(rw).thin }"
                              :title="rewardMeta(rw).note"
                            >
                              vol {{ rewardMeta(rw).vol }}<template v-if="rewardMeta(rw).thin"> ⚠</template>
                            </small>
                          </template>
                          <template v-else>—</template>
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </template>

            <!-- item reverse-lookup results -->
            <template v-else-if="itemHits">
              <div class="sc3-panel__head">
                <div>
                  <div class="an-eyebrow">{{ itemHits.hits.length }} drop sources</div>
                  <h2 class="sc3-panel__title sc3-panel__title--item">{{ findItem }}</h2>
                </div>
                <v-btn icon variant="text" size="small" class="sc3-panel__close" aria-label="Close panel" @click="closePanel">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
              <div class="sc3-item-actions">
                <v-btn size="small" variant="outlined" color="#7ff0eb" @click="openDrops(findItem)">Full drop data</v-btn>
              </div>
              <ul class="sc3-nodes">
                <li v-for="(hit, i) in itemHits.hits" :key="i" class="sc3-hit">
                  <button
                    class="sc3-hit__world"
                    :title="`Open ${hit.location} on ${hit.planet} with this item highlighted`"
                    @click="openHit(hit)"
                  >
                    {{ hit.planet }}
                  </button>
                  <span class="sc3-hit__node">{{ hit.location }} · {{ hit.gameMode }}<template v-if="hit.rotation"> · {{ hit.rotation }}</template></span>
                  <span class="sc3-hit__chance"><i class="sc3-dot" :style="{ background: rarityColor(hit.rarity) }"></i>{{ fmtChance(hit.chance) }}%</span>
                </li>
              </ul>
            </template>
          </aside>
        </transition>
      </div>

      <!-- WebGL fallback -->
      <div v-if="unsupported" class="sc3-fallback">
        <v-icon color="#c8a85c" size="40">mdi-video-3d-off</v-icon>
        <p>Your browser can't render the 3D map (WebGL unavailable).</p>
        <NuxtLink :to="localePath('/star-chart')" class="sc3-fallback__link">Open the 2D star chart instead →</NuxtLink>
        <ul v-if="planets.length" class="sc3-fallback__list">
          <li v-for="p in rankedPlanets" :key="p.planet">
            <strong>{{ p.planet }}</strong> — {{ fmtPlat(p.value) }}p/drop
            <template v-if="p.bestNode"> · {{ p.bestNode.location }} ({{ p.bestNode.gameMode }})</template>
          </li>
        </ul>
      </div>
    </section>

    <!-- ===================== Crawlable copy ===================== -->
    <section class="sc3-about">
      <div class="an-eyebrow">About this map</div>
      <h2 class="sc3-about__title">The Warframe drop map, in three dimensions</h2>
      <p>
        Every world of the Origin System — planets, moons and void zones — rendered as an interactive 3D star
        chart. Each world glows by what its best mission actually pays: drop chances from the community drop
        tables, priced against live Warframe Market sell orders and discounted by real 48-hour trade volume, so
        a mission full of items nobody buys doesn't pretend to be a gold mine. Select a world to break its
        missions down by rotation, reward, drop chance and realizable platinum — or search any prime part,
        relic or item to light up exactly where it drops.
      </p>
      <p>
        Prefer a flat view? The classic <NuxtLink :to="localePath('/star-chart')">2D star chart</NuxtLink> ranks the same
        worlds and missions on a single screen.
      </p>
      <v-alert class="sc3-disclaimer bg-blue-darken-4" type="info" density="compact">
        Expected p/drop = Σ (drop chance × realizable value) across a mission's reward table. Realizable value
        uses each drop's 48h average sell price, weighted by its 48h trade volume (liquidity) — so overpriced
        drops nobody actually buys don't inflate a mission's worth. Drop chances come from community drop data;
        prices and volume are from Warframe Market. Untradeable rewards (Forma, resources, credits) count as
        zero.
      </v-alert>
    </section>

    <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" />
    <WarframeGuideDialog
      v-model="guideOpen"
      :planet-names="mapPlanetNames"
      @select-planet="selectPlanet"
      @find-item="onGuideItem"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

useHead({
  title: '3D Star Chart — interactive Warframe drop map',
  meta: [
    {
      name: 'description',
      content:
        'A 3D interactive Warframe drop map: every planet, moon and void zone of the Origin System, lit by expected platinum per drop. Search any item to see where it drops.',
    },
    { property: 'og:title', content: '3D Star Chart — interactive Warframe drop map' },
    {
      property: 'og:description',
      content:
        'Explore the Origin System in 3D. Every world glows by what its missions pay — drop chances priced against live Warframe Market data.',
    },
    { property: 'og:type', content: 'website' },
  ],
})

const { loading, planets, planetsByName, maxValue, stats, load, rewardMeta, sortedRewards } = useDropMap()
const { itemThumb } = useItemThumb()
const { mobile } = useDisplay()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()

const selected = ref('')
const openNode = ref('')
const findItem = ref<string | null>(null)
/** item emphasized inside the selected planet's panel (kept from the search) */
const focusItem = ref('')
const dropsDialog = ref(false)
const dropsItem = ref('')
const guideOpen = ref(false)
const unsupported = ref(false)
const mapEl = ref<HTMLElement | null>(null)
/** touch-first device — drives the control legend wording */
const coarsePointer = ref(false)

// persistent polite live region (a v-if'd aria-live container is unreliable)
const srAnnouncement = computed(() => {
  if (selectedData.value) {
    const p = selectedData.value
    return `${p.planet}: ${p.nodeCount} missions, best ${fmtPlat(p.value)} platinum per drop.`
  }
  if (itemHits.value && findItem.value) {
    return `${findItem.value}: ${itemHits.value.hits.length} drop sources highlighted on the map.`
  }
  return ''
})

/* ---------------- scene inputs ---------------- */

const galaxyWorlds = computed(() =>
  planets.value.map((p) => ({
    name: p.planet,
    value: p.value,
    nodeCount: p.nodeCount,
    t: Math.min(1, (p.value || 0) / maxValue.value),
  })),
)

const mapPlanetNames = computed(() => new Set(planets.value.map((p) => p.planet)))

// Guide → map: relics are themselves drops, so highlight where one drops;
// anything the map doesn't know falls back to the full drop-locations dialog.
function onGuideItem(name: string) {
  if (itemIndexMap.value.has(name)) {
    selected.value = ''
    findItem.value = name
  } else {
    openDrops(name)
  }
}

const rankedPlanets = computed(() => planets.value.slice().sort((a, b) => b.value - a.value))

// Spatial hop order for prev/next navigation: inner solar system outward
// (moons right after their parent), then the void zones. Unknown new worlds
// from the API land at the end instead of breaking the ring.
const NAV_ORDER = [
  'Mercury', 'Venus', 'Earth', 'Lua', 'Mars', 'Phobos', 'Deimos', 'Ceres',
  'Jupiter', 'Europa', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Eris',
  'Sedna', 'Kuva Fortress',
]
const navWorlds = computed(() => {
  const rank = new Map(NAV_ORDER.map((n, i) => [n, i]))
  return planets.value
    .slice()
    .sort((a, b) => {
      const ra = rank.has(a.planet) ? rank.get(a.planet)! : NAV_ORDER.length
      const rb = rank.has(b.planet) ? rank.get(b.planet)! : NAV_ORDER.length
      return ra - rb || a.planet.localeCompare(b.planet)
    })
})

function goWorld(dir: number) {
  const order = navWorlds.value.map((p) => p.planet)
  if (!order.length) return
  const cur = order.indexOf(selected.value)
  const next = cur === -1 ? (dir > 0 ? order[0]! : order[order.length - 1]!) : order[(cur + dir + order.length) % order.length]!
  selectPlanet(next)
}

/* ---------------- item reverse lookup ---------------- */

interface ItemHit {
  planet: string
  location: string
  gameMode: string
  rotation?: string
  chance: number
  rarity: string
}

const itemIndexMap = computed(() => {
  const map = new Map<string, { planets: Set<string>; hits: ItemHit[] }>()
  for (const p of planets.value) {
    for (const n of p.nodes) {
      for (const rot of n.rotations) {
        for (const rw of rot.rewards) {
          if (!rw.itemName) continue
          let entry = map.get(rw.itemName)
          if (!entry) {
            entry = { planets: new Set(), hits: [] }
            map.set(rw.itemName, entry)
          }
          entry.planets.add(p.planet)
          entry.hits.push({
            planet: p.planet,
            location: n.location,
            gameMode: n.gameMode,
            rotation: rot.rotation,
            chance: Number(rw.chance) || 0,
            rarity: rw.rarity,
          })
        }
      }
    }
  }
  map.forEach((e) => e.hits.sort((a, b) => b.chance - a.chance))
  return map
})

const searchNames = computed(() => [...itemIndexMap.value.keys()].sort((a, b) => a.localeCompare(b)))

const itemHits = computed(() => (findItem.value ? itemIndexMap.value.get(findItem.value) || null : null))

const highlightedWorlds = computed<string[] | null>(() =>
  itemHits.value ? [...itemHits.value.planets] : null,
)

/* ---------------- selection / panel ---------------- */

const selectedData = computed(() => (selected.value ? planetsByName.value[selected.value] : null))
const panelOpen = computed(() => !!selectedData.value || !!itemHits.value)
const selectedWikiMap = computed(() =>
  selectedData.value ? worldWikiMap(selectedData.value.planet) : null,
)

function onSceneSelect(name: string | null) {
  if (name) {
    selectPlanet(name)
  } else if (selected.value) {
    selected.value = ''
    focusItem.value = ''
  }
}

// Selecting a world keeps an active item search alive: the map highlight
// stays and the panel marks that item's rewards (focusItem). Without a
// search it is a plain planet drilldown.
function selectPlanet(name: string) {
  focusItem.value = findItem.value || ''
  selected.value = name
  openNode.value = ''
  const p = planetsByName.value[name]
  if (p && p.nodes.length) {
    const focusNode = focusItem.value ? p.nodes.find((n) => nodeHasFocusItem(n)) : null
    openNode.value = (focusNode || p.nodes[0]!).location
  }
  scrollPanelIntoView()
}

function nodeHasFocusItem(node: any): boolean {
  if (!focusItem.value) return false
  return (node.rotations || []).some((r: any) =>
    (r.rewards || []).some((rw: any) => rw.itemName === focusItem.value),
  )
}

// Item source row → that planet's panel, opened at the exact node, with the
// item's reward rows highlighted and scrolled into view.
function openHit(hit: ItemHit) {
  selectPlanet(hit.planet)
  openNode.value = hit.location
  nextTick(() => {
    const el = document.querySelector('.sc3-panel .sc3-node__head[aria-expanded="true"]')
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' })
  })
}

function closePanel() {
  if (selected.value && findItem.value) {
    // step back to the item's source list; the map highlight stays
    selected.value = ''
    focusItem.value = ''
    return
  }
  selected.value = ''
  findItem.value = null
  focusItem.value = ''
  mapEl.value?.focus()
}

function onFind(name: string | null) {
  focusItem.value = ''
  if (name) selected.value = ''
}

// On phones the map can be taller than the viewport — bring the bottom-sheet
// panel on-screen after a selection (same pattern as the 2D chart).
function scrollPanelIntoView() {
  if (!mobile.value) return
  nextTick(() => {
    const el = mapEl.value
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'end' })
  })
}

function toggleNode(location: string) {
  openNode.value = openNode.value === location ? '' : location
}

function openDrops(name: string | null) {
  if (!name) return
  dropsItem.value = name
  dropsDialog.value = true
}

/* keyboard: arrows cycle worlds spatially, Escape clears */
function onMapKey(e: KeyboardEvent) {
  // never hijack keys typed into the search field or any other form control
  const t = e.target as HTMLElement | null
  if (t && t.closest('input, textarea, select, [contenteditable]')) return
  if (e.key === 'Escape') {
    closePanel()
    return
  }
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
  if (!keys.includes(e.key) || !navWorlds.value.length) return
  e.preventDefault()
  goWorld(e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1)
}

/* ---------------- deep links (?planet= / ?item=) ---------------- */

let queryReady = false

function applyQuery() {
  const qp = typeof route.query.planet === 'string' ? route.query.planet : ''
  const qi = typeof route.query.item === 'string' ? route.query.item : ''
  if (qi && itemIndexMap.value.has(qi)) {
    findItem.value = qi
    if (qp && planetsByName.value[qp]) selectPlanet(qp)
  } else if (qp && planetsByName.value[qp]) {
    selectPlanet(qp)
  }
  queryReady = true
}

watch([selected, findItem], () => {
  if (!queryReady) return
  // merge into the existing query so unrelated params (utm, locale…) survive
  const query: Record<string, any> = { ...route.query }
  delete query.planet
  delete query.item
  if (selected.value) query.planet = selected.value
  if (findItem.value) query.item = findItem.value
  const cur = route.query
  const same =
    (cur.planet || '') === (query.planet || '') && (cur.item || '') === (query.item || '')
  if (!same) router.replace({ query })
})

/* ---------------- formatting ---------------- */

const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%232a2a3d'/%3E%3Cpath d='M20 9 L29 20 L20 31 L11 20 Z' fill='none' stroke='%23c8a85c' stroke-width='2' opacity='0.7'/%3E%3C/svg%3E"

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = PLACEHOLDER_IMG
}

function valueClass(v: number): string {
  const t = v / maxValue.value
  if (t >= 0.5) return 'is-gold'
  if (t >= 0.2) return 'is-mid'
  return 'is-low'
}

function rarityColor(rarity: string): string {
  const r = (rarity || '').toLowerCase()
  if (r === 'legendary') return '#35d6d0'
  if (r === 'rare') return '#e7cf95'
  if (r === 'uncommon') return '#b6c0cc'
  return '#c08457'
}

function fmtPlat(n: number): string {
  const v = Number(n) || 0
  return v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)
}

function fmtChance(n: number): string {
  const v = Number(n) || 0
  return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
}

/* ---------------- lifecycle ---------------- */

// Exact viewport width (excludes the OS scrollbar) so the full-bleed map
// never introduces a horizontal scrollbar the way a raw `100vw` would. The
// left offset is measured, not assumed: a pinned nav drawer (guided tour)
// shifts v-main so the container is no longer viewport-centered.
function measureBleed() {
  const el = mapEl.value
  if (!el) return
  el.style.marginLeft = '0px'
  const left = el.getBoundingClientRect().left
  el.style.setProperty('--sc3-bleed-w', `${document.documentElement.clientWidth}px`)
  el.style.marginLeft = `${-left}px`
}

function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

let bleedObs: ResizeObserver | null = null

onMounted(async () => {
  finishLoading()
  coarsePointer.value =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  measureBleed()
  window.addEventListener('resize', measureBleed)
  // the container resizes without a window resize when the nav drawer pins
  // open (guided tour) — re-measure then too
  if (typeof ResizeObserver === 'function' && mapEl.value?.parentElement) {
    bleedObs = new ResizeObserver(measureBleed)
    bleedObs.observe(mapEl.value.parentElement)
  }
  await load()
  applyQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureBleed)
  if (bleedObs) {
    bleedObs.disconnect()
    bleedObs = null
  }
})
</script>

<style scoped>
.sc3 {
  color: #eef1f8;
}
.an-eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.68rem;
  color: #8f95ab;
}

/* ---- full-bleed map shell ---- */
.sc3-map {
  position: relative;
  width: var(--sc3-bleed-w, 100%);
  margin-left: calc((100% - var(--sc3-bleed-w, 100%)) / 2);
  margin-top: -16px;
  height: clamp(540px, calc(100dvh - 84px), 1100px);
  background: #05060d;
  outline: none;
  overflow: hidden;
}
.sc3-map:focus-visible {
  box-shadow: inset 0 0 0 2px #35d6d0;
}

/* ---- HUD ---- */
.sc3-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
.sc3-hud__corner {
  position: absolute;
  width: 46px;
  height: 46px;
  border: 1px solid rgba(200, 168, 92, 0.5);
}
.sc3-hud__corner--tl {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}
.sc3-hud__corner--br {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

.sc3-head {
  position: absolute;
  top: 18px;
  left: 26px;
  pointer-events: auto;
}
.sc3-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: clamp(1.4rem, 3.2vw, 2.2rem);
  line-height: 1.05;
  color: #f2ead6;
  margin: 2px 0 4px;
  text-shadow: 0 2px 18px rgba(3, 4, 10, 0.9);
}
.sc3-head__links {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.sc3-2d {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7ff0eb;
  text-decoration: none;
}
.sc3-2d:hover {
  color: #aef6f2;
  text-decoration: underline;
}
.sc3-guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(200, 168, 92, 0.08);
  border: 1px solid rgba(200, 168, 92, 0.45);
  cursor: pointer;
  padding: 4px 12px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #e7cf95;
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
}
.sc3-guide-btn:hover {
  background: rgba(200, 168, 92, 0.16);
}
.sc3-guide-btn:focus-visible {
  outline: 2px solid #35d6d0;
}

.sc3-stats {
  position: absolute;
  top: 18px;
  right: 26px;
  display: flex;
  gap: 18px;
  /* read-only chip — stays pointer-events:none so orbiting works across it */
  background: rgba(10, 11, 20, 0.55);
  border: 1px solid rgba(200, 168, 92, 0.22);
  padding: 8px 14px;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.sc3-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.sc3-stat__num {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.12rem;
  line-height: 1.05;
}
.sc3-stat__num.is-gold {
  color: #e7cf95;
}
.sc3-stat__num.is-teal {
  color: #35d6d0;
}
.sc3-stat__lbl {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.6rem;
  color: #8f95ab;
}

.sc3-search {
  position: absolute;
  top: 78px;
  right: 26px;
  width: min(340px, calc(100% - 52px));
  pointer-events: auto;
}
/* the detail panel occupies the same corner — slide the search out of its way
   so it is never an invisible (but focusable) control underneath */
.sc3-search.is-panel-open {
  right: 436px;
}

/* visually hidden, but announced */
.sc3-sr-live {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.sc3-legend {
  position: absolute;
  left: 26px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8f95ab;
}
.sc3-legend__bar {
  width: 74px;
  height: 7px;
  background: linear-gradient(90deg, #5a6178, #9a8f6a, #c8a85c, #e7cf95);
  border-radius: 2px;
}
.sc3-legend__diamond {
  color: #35d6d0;
  margin-left: 10px;
}

/* Helldivers-style control legend */
.sc3-controls {
  position: absolute;
  right: 26px;
  bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 14px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #9aa0b8;
  background: rgba(10, 11, 20, 0.62);
  border: 1px solid rgba(200, 168, 92, 0.22);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.sc3-controls__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.sc3-controls__item .v-icon {
  color: #c8a85c;
}
.sc3-controls__item em {
  font-style: normal;
  color: #e7cf95;
  font-weight: 700;
}
.sc3-controls__sep {
  width: 1px;
  height: 14px;
  background: rgba(200, 168, 92, 0.3);
}

/* world-to-world navigator dock */
.sc3-dock {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 14px;
  display: flex;
  align-items: stretch;
  pointer-events: auto;
  background: rgba(10, 11, 20, 0.72);
  border: 1px solid rgba(200, 168, 92, 0.35);
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.sc3-dock__arrow {
  background: none;
  border: none;
  cursor: pointer;
  color: #c8a85c;
  padding: 6px 10px;
  display: grid;
  place-items: center;
}
.sc3-dock__arrow:hover {
  color: #e7cf95;
  background: rgba(200, 168, 92, 0.08);
}
.sc3-dock__arrow:focus-visible,
.sc3-dock__name:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: -2px;
}
.sc3-dock__name {
  background: none;
  border: none;
  border-left: 1px solid rgba(200, 168, 92, 0.25);
  border-right: 1px solid rgba(200, 168, 92, 0.25);
  cursor: pointer;
  min-width: 172px;
  padding: 7px 14px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.88rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f2ead6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.sc3-dock__name:hover {
  color: #e7cf95;
}
.sc3-dock__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  font-family: 'Rajdhani', sans-serif;
}
.sc3-dock__val {
  color: #e7cf95;
  font-weight: 700;
}

/* ---- loading / empty ---- */
.sc3-load {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #b6bcd0;
  font-family: 'Rajdhani', sans-serif;
  background: rgba(5, 6, 13, 0.55);
  pointer-events: auto;
}
.sc3-load p {
  font-size: 1.05rem;
  color: #cfd4e4;
  margin: 0;
}
.sc3-load span {
  font-size: 0.84rem;
  color: #8f95ab;
}
.sc3-load__orbit {
  width: 52px;
  height: 52px;
  border: 2px solid rgba(200, 168, 92, 0.25);
  border-top-color: #c8a85c;
  border-radius: 50%;
  animation: sc3-spin 0.9s linear infinite;
}
@keyframes sc3-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---- panel ---- */
.sc3-panel {
  position: absolute;
  top: 74px;
  right: 26px;
  bottom: 52px;
  width: min(390px, calc(100% - 52px));
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  background: linear-gradient(180deg, rgba(12, 13, 24, 0.92), rgba(8, 9, 17, 0.96));
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  backdrop-filter: blur(4px);
}
.sc3-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 10px 16px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.18);
}
.sc3-panel__title {
  font-family: 'Cinzel', serif;
  font-size: 1.35rem;
  color: #e7cf95;
  margin: 0;
  line-height: 1.1;
}
.sc3-panel__title--item {
  color: #7ff0eb;
  font-size: 1.05rem;
}
.sc3-panel__best {
  text-align: right;
  white-space: nowrap;
  margin-left: auto;
}
.sc3-panel__best span {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.35rem;
  color: #e7cf95;
}
.sc3-panel__best small {
  display: block;
  font-size: 0.6rem;
  color: #8f95ab;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.sc3-panel__close {
  margin: -4px -6px 0 0;
}
.sc3-panel__focus {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  color: #7ff0eb;
  margin-top: 3px;
}
.sc3-panel__focus strong {
  color: #aef6f2;
}
.sc3-panel__wiki {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.sc3-panel__wiki a {
  color: #8f95ab;
  text-decoration: none;
}
.sc3-panel__wiki a:hover {
  color: #e7cf95;
  text-decoration: underline;
}
.sc3-panel__wiki .sc3-panel__wiki-map {
  color: #7ff0eb;
}
.sc3-panel__wiki .sc3-panel__wiki-map:hover {
  color: #aef6f2;
}
.sc3-node__mark {
  vertical-align: 1px;
}
.sc3-item-actions {
  padding: 10px 16px 2px;
}

.sc3-nodes {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.sc3-node {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.sc3-node__head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 9px 8px;
  text-align: left;
  color: inherit;
}
.sc3-node__head:hover {
  background: rgba(200, 168, 92, 0.05);
}
.sc3-node__head:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: -2px;
}
.sc3-node__id {
  flex: 1;
  min-width: 0;
}
.sc3-node__name {
  display: block;
  font-weight: 600;
  color: #eef1f8;
  font-size: 0.94rem;
}
.sc3-node__mode {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.7rem;
  color: #8f95ab;
}
.sc3-node__val {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.02rem;
  white-space: nowrap;
}
.sc3-node__val small {
  font-size: 0.64rem;
  color: #8f95ab;
  margin-left: 1px;
}
.sc3-node__val.is-gold {
  color: #e7cf95;
}
.sc3-node__val.is-mid {
  color: #c8a85c;
}
.sc3-node__val.is-low {
  color: #8f95ab;
}
.sc3-node__chev {
  color: #8f95ab !important;
}
.sc3-node__body {
  padding: 2px 8px 10px;
}
.sc3-rot {
  margin-bottom: 8px;
}
.sc3-rot__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px 0 4px;
}
.sc3-rot__badge {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.72rem;
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  color: #0c0d18;
}
.sc3-rot__badge[data-rot='A'] {
  background: #6fae9b;
}
.sc3-rot__badge[data-rot='B'] {
  background: #c8a85c;
}
.sc3-rot__badge[data-rot='C'] {
  background: #cf7b57;
}
.sc3-rot__badge[data-rot='D'] {
  background: #9a7bcf;
}
.sc3-rot__val {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  color: #8f95ab;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.sc3-reward {
  display: grid;
  grid-template-columns: 28px 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 4px 4px;
}
.sc3-reward.is-dud {
  opacity: 0.5;
}
.sc3-reward.is-focus {
  background: rgba(53, 214, 208, 0.08);
  box-shadow: inset 2px 0 0 #35d6d0;
}
.sc3-reward.is-focus .sc3-reward__name {
  color: #7ff0eb;
}
.sc3-reward__thumb {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.sc3-reward__name {
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #dfe3f0;
  font-size: 0.86rem;
  padding: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc3-reward__name:hover {
  color: #35d6d0;
  text-decoration: underline;
}
.sc3-reward__chance {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: #b6bcd0;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.sc3-reward__plat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.15;
  white-space: nowrap;
}
.sc3-reward__price {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  color: #e7cf95;
  font-size: 0.86rem;
}
.sc3-reward__vol {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.6rem;
  color: #8f95ab;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.sc3-reward__vol.is-thin {
  color: #e0a3a3;
}
.sc3-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex: none;
}

/* item hits */
.sc3-hit {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.sc3-hit__world {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.9rem;
  color: #7ff0eb;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.sc3-hit__world:hover {
  text-decoration: underline;
}
.sc3-hit__node {
  font-size: 0.82rem;
  color: #b6bcd0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc3-hit__chance {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  color: #dfe3f0;
  font-variant-numeric: tabular-nums;
}

/* panel slide */
.sc3-slide-enter-active,
.sc3-slide-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}
.sc3-slide-enter-from,
.sc3-slide-leave-to {
  transform: translateX(24px);
  opacity: 0;
}

/* ---- fallback ---- */
.sc3-fallback {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 30px 16px;
  background: #05060d;
  overflow-y: auto;
}
.sc3-fallback p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.05rem;
  color: #cfd4e4;
  margin: 0;
}
.sc3-fallback__link {
  color: #7ff0eb;
}
.sc3-fallback__list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  max-width: 560px;
  text-align: left;
  font-size: 0.88rem;
  color: #b6bcd0;
}
.sc3-fallback__list li {
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.sc3-fallback__list strong {
  color: #e7cf95;
}

/* ---- about ---- */
.sc3-about {
  max-width: 860px;
  margin: 26px auto 8px;
}
.sc3-about__title {
  font-family: 'Cinzel', serif;
  font-size: 1.45rem;
  color: #f2ead6;
  margin: 4px 0 10px;
}
.sc3-about p {
  color: #b6bcd0;
  line-height: 1.65;
  font-size: 0.96rem;
}
.sc3-about a {
  color: #7ff0eb;
}
.sc3-disclaimer {
  margin-top: 16px;
}

/* ---- responsive ---- */
@media (max-width: 959px) {
  .sc3-map {
    /* low floor so short landscape phones keep the bottom sheet reachable */
    height: clamp(340px, calc(100dvh - 76px), 900px);
    margin-top: -12px;
  }
  .sc3-head {
    top: 12px;
    left: 14px;
  }
  .sc3-stats {
    display: none;
  }
  .sc3-search {
    top: auto;
    bottom: 46px;
    right: 12px;
    left: 12px;
    width: auto;
  }
  .sc3-legend {
    left: 14px;
    bottom: 12px;
  }
  .sc3-controls {
    display: none;
  }
  .sc3-hud__corner {
    display: none;
  }
  .sc3-search {
    bottom: 92px;
  }
  /* bottom sheet covers it — remove it from the tab order entirely */
  .sc3-search.is-panel-open {
    display: none;
  }
  .sc3-dock {
    bottom: 44px;
  }
  /* keep the world hopper reachable above the bottom sheet */
  .sc3-dock.is-panel-open {
    bottom: calc(58% + 10px);
  }

  /* bottom sheet */
  .sc3-panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-height: 58%;
    clip-path: none;
    border-left: none;
    border-right: none;
    border-bottom: none;
    border-top: 1px solid rgba(200, 168, 92, 0.35);
  }
  .sc3-slide-enter-from,
  .sc3-slide-leave-to {
    transform: translateY(30px);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sc3-load__orbit {
    animation: none !important;
  }
  .sc3-slide-enter-active,
  .sc3-slide-leave-active {
    transition: none !important;
  }
}
</style>
