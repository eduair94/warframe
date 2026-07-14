<template>
  <div class="sc">
    <header class="sc-hero">
      <div class="sc-hero__text">
        <div class="an-eyebrow">Warframe · Origin System</div>
        <h1 class="sc-title">
          Where the <span class="sc-accent">plat</span> actually is.
        </h1>
        <p class="sc-lede">
          Every planet on the Star Chart, lit by what its best mission is worth
          right now — drop chances from the Void, priced against today's Warframe
          Market. The brighter a world burns, the more platinum a single reward returns.
          Pick one to see the missions worth your time.
        </p>
      </div>
      <div v-if="richest" class="sc-hero__deal">
        <div class="sc-hero__deal-label">Richest world</div>
        <button class="sc-hero__deal-name" @click="selectPlanet(richest.planet)">
          {{ richest.planet }} →
        </button>
        <div class="sc-hero__deal-plat">{{ fmtPlat(richest.value) }}<span>p/drop</span></div>
        <div class="sc-hero__deal-sub" v-if="richest.bestNode">
          {{ richest.bestNode.location }} · {{ richest.bestNode.gameMode }}
        </div>
      </div>
    </header>

    <div class="sc-stats">
      <div class="sc-stat"><div class="sc-stat__num">{{ stats.planets }}</div><div class="sc-stat__lbl">worlds charted</div></div>
      <div class="sc-stat"><div class="sc-stat__num is-gold">{{ fmtPlat(stats.topValue) }}</div><div class="sc-stat__lbl">best drop (p)</div></div>
      <div class="sc-stat"><div class="sc-stat__num is-teal">{{ stats.nodes }}</div><div class="sc-stat__lbl">missions priced</div></div>
      <div class="sc-stat">
        <div class="sc-stat__num">{{ stats.topNode ? stats.topNode.location : '—' }}</div>
        <div class="sc-stat__lbl">top farm node</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="sc-loading">
      <div class="sc-loading__orbit"></div>
      <p>Charting the Origin System…</p>
    </div>

    <!-- First-run empty -->
    <div v-else-if="!planets.length" class="sc-empty">
      <v-icon color="#c8a85c" size="40">mdi-orbit</v-icon>
      <p>Star chart data isn't loaded yet.</p>
      <span>Run the drop sync to populate the map, then reload.</span>
    </div>

    <div v-else class="sc-main">
      <!-- ===== The chart ===== -->
      <section class="sc-chart" aria-label="Interactive star chart">
        <svg
          :viewBox="viewBox"
          class="sc-svg"
          role="group"
          aria-roledescription="star chart"
          @keydown="onSvgKey"
        >
          <defs>
            <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#fff4d6" />
              <stop offset="45%" stop-color="#e7cf95" />
              <stop offset="100%" stop-color="#c8853d" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
            </radialGradient>
          </defs>

          <!-- starfield -->
          <g class="sc-stars" aria-hidden="true">
            <circle v-for="(s, i) in starfield" :key="'s' + i" :cx="s.x" :cy="s.y" :r="s.r" :opacity="s.o" fill="#cfd6ea" />
          </g>

          <!-- solar rails (junction connections) -->
          <g class="sc-rails" aria-hidden="true">
            <line
              v-for="(e, i) in scene.edges"
              :key="'e' + i"
              :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
              class="sc-rail"
              :class="{ 'sc-rail--special': e.special }"
            />
          </g>

          <!-- the Sun -->
          <g aria-hidden="true">
            <circle :cx="scene.sun.x" :cy="scene.sun.y" r="44" fill="url(#sunGrad)" class="sc-sun-halo" />
            <circle :cx="scene.sun.x" :cy="scene.sun.y" r="12" fill="#ffe9b0" />
          </g>

          <!-- planets -->
          <g
            v-for="p in scene.nodes"
            :key="p.planet"
            class="sc-planet"
            :class="{ 'is-selected': p.planet === selected }"
            role="button"
            tabindex="0"
            :aria-label="`${p.planet}: best run ${fmtPlat(p.value)} platinum. ${p.nodeCount} missions.`"
            :aria-pressed="p.planet === selected ? 'true' : 'false'"
            @click="selectPlanet(p.planet)"
            @focus="onPlanetFocus(p.planet)"
            @keydown.enter.prevent="selectPlanet(p.planet)"
            @keydown.space.prevent="selectPlanet(p.planet)"
          >
            <circle :cx="p.x" :cy="p.y" :r="p.glowR" :fill="p.type === 'special' ? '#35d6d0' : '#e7cf95'" :opacity="p.glowO" class="sc-planet__glow" />
            <circle v-if="p.planet === selected" :cx="p.x" :cy="p.y" :r="p.r + 7" class="sc-planet__ring" />
            <circle :cx="p.x" :cy="p.y" :r="p.r" :fill="p.color" class="sc-planet__disc" :stroke="p.type === 'special' ? '#7ff0eb' : '#f4e2b4'" />
            <text :x="p.x" :y="p.y + p.r + 15" class="sc-planet__label" text-anchor="middle">{{ p.planet }}</text>
          </g>
        </svg>

        <div class="sc-legend">
          <span class="sc-legend__lbl">sparse</span>
          <span class="sc-legend__bar"></span>
          <span class="sc-legend__lbl">rich (plat / run)</span>
          <span class="sc-legend__hint">glow = best mission value · lines = Solar Rail junctions</span>
        </div>
      </section>

      <!-- ===== Detail panel ===== -->
      <aside ref="panel" class="sc-panel" aria-live="polite">
        <div v-if="!selectedData" class="sc-panel__idle">
          <v-icon color="#c8a85c" size="30">mdi-cursor-default-click-outline</v-icon>
          <p>Select a world to see what's worth farming.</p>
        </div>
        <div v-else class="sc-panel__body">
          <div class="sc-panel__head">
            <div>
              <div class="an-eyebrow">{{ selectedData.nodeCount }} missions</div>
              <h2 class="sc-panel__title">{{ selectedData.planet }}</h2>
            </div>
            <div class="sc-panel__best">
              <span>{{ fmtPlat(selectedData.value) }}</span><small>p/drop best</small>
            </div>
          </div>

          <ul class="sc-nodes">
            <li v-for="node in selectedData.nodes" :key="node.location" class="sc-node" :class="{ 'is-open': openNode === node.location }">
              <button class="sc-node__head" @click="toggleNode(node.location)" :aria-expanded="openNode === node.location ? 'true' : 'false'">
                <div class="sc-node__id">
                  <span class="sc-node__name">{{ node.location }}</span>
                  <span class="sc-node__mode">{{ node.gameMode }}<template v-if="node.isEvent"> · event</template></span>
                </div>
                <div class="sc-node__val" :class="valueClass(node.value)">
                  {{ fmtPlat(node.value) }}<small>p</small>
                </div>
                <v-icon class="sc-node__chev" size="20">{{ openNode === node.location ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </button>

              <div v-if="openNode === node.location" class="sc-node__body">
                <div v-for="rot in node.rotations" :key="rot.rotation || 'flat'" class="sc-rot">
                  <div class="sc-rot__head" v-if="rot.rotation">
                    <span class="sc-rot__badge" :data-rot="rot.rotation">{{ rot.rotation }}</span>
                    <span class="sc-rot__val">{{ fmtPlat(rot.value) }} p/drop</span>
                  </div>
                  <div v-for="(rw, i) in sortedRewards(rot.rewards)" :key="i" class="sc-reward" :class="{ 'is-dud': !rw.tradeable }">
                    <img
                      class="sc-reward__thumb"
                      :src="thumbUrl(rw.thumb)"
                      :alt="rw.itemName"
                      loading="lazy"
                      @error="onImgError"
                    />
                    <button class="sc-reward__name" @click="openDrops(rw.itemName)">{{ rw.itemName }}</button>
                    <span class="sc-reward__chance"><i class="sc-dot" :style="{ background: rarityColor(rw.rarity) }"></i>{{ fmtChance(rw.chance) }}%</span>
                    <span class="sc-reward__plat">{{ rw.tradeable ? fmtPlat(rw.price) + 'p' : '—' }}</span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <!-- Find where to farm an item -->
    <section v-if="!loading && planets.length" class="sc-find">
      <div class="sc-find__text">
        <div class="an-eyebrow">Reverse lookup</div>
        <h3 class="sc-find__title">Where do I farm…?</h3>
      </div>
      <v-autocomplete
        v-model="findItem"
        :items="itemNames"
        dark dense hide-details clearable
        prepend-inner-icon="mdi-magnify"
        label="Search any prime part, relic or item"
        class="sc-find__input"
        @change="onFind"
      ></v-autocomplete>
    </section>

    <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" />

    <v-alert v-if="!loading && planets.length" class="sc-disclaimer blue darken-4" type="info" dense>
      Expected p/drop = Σ (drop chance × lowest sell order) across a mission's reward
      table — the average platinum one reward is worth. Drop chances come from the
      community drop data; platinum prices are today's Warframe Market orders.
      Untradeable rewards (Forma, resources, credits) count as zero.
    </v-alert>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'
import DropLocationsDialog from '../components/DropLocationsDialog.vue'

// --- Faithful Star Chart topology (real Solar Rail junction progression) ---
// The main chain is the order the game unlocks worlds through Junctions.
const CHAIN = [
  'Earth', 'Mercury', 'Venus', 'Mars', 'Phobos', 'Ceres', 'Jupiter',
  'Europa', 'Saturn', 'Uranus', 'Neptune', 'Pluto', 'Sedna', 'Eris',
]
// Off-chain worlds reachable directly from a parent (no junction).
const SATELLITES: Record<string, string> = {
  Lua: 'Earth',
  Deimos: 'Mars',
  'Kuva Fortress': 'Sedna',
}
// Consecutive junctions + the direct offshoots — drawn as Solar Rails.
const CHAIN_EDGES: [string, string][] = CHAIN.slice(1).map((p, i) => [CHAIN[i], p])
const SPECIAL_EDGES: [string, string][] = Object.entries(SATELLITES).map(([s, p]) => [p, s])

// spiral geometry
const VB = { w: 960, h: 840 }
const CX = 470
const CY = 402
const A0 = -108 // start angle (deg)
const STEP = 24.5 // deg per chain step
const R0 = 122
const RSTEP = 19

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}
function polar(r: number, deg: number) {
  return { x: CX + r * Math.cos(toRad(deg)), y: CY + r * Math.sin(toRad(deg)) }
}
// Deterministic pseudo-stars (no Math.random so SSR/CSR match)
function makeStars(n: number) {
  const out = []
  let seed = 7
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let i = 0; i < n; i++) {
    out.push({ x: rnd() * VB.w, y: rnd() * VB.h, r: 0.4 + rnd() * 1.1, o: 0.15 + rnd() * 0.5 })
  }
  return out
}

// Fallback thumbnail (void-diamond) for rewards with no market listing.
const PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%232a2a3d'/%3E%3Cpath d='M20 9 L29 20 L20 31 L11 20 Z' fill='none' stroke='%23c8a85c' stroke-width='2' opacity='0.7'/%3E%3C/svg%3E"

export default {
  name: 'StarChartPage',
  components: { DropLocationsDialog },
  data() {
    return {
      VB,
      loading: true,
      planets: [] as any[],
      selected: '' as string,
      openNode: '' as string,
      dropsDialog: false,
      dropsItem: '',
      findItem: '',
      starfield: makeStars(90),
    }
  },
  head() {
    return {
      title: 'Star Chart — what to farm in Warframe, ranked by platinum',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'An interactive Warframe Star Chart that ranks every planet and mission by expected platinum per run — drop chances joined with live Warframe Market prices.',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({ allItems: 'all_items' }),
    planetsByName(): Record<string, any> {
      const map: Record<string, any> = {}
      for (const p of this.planets) map[p.planet] = p
      return map
    },
    maxValue(): number {
      return this.planets.reduce((m, p) => Math.max(m, p.value || 0), 0) || 1
    },
    richest(): any {
      return this.planets.slice().sort((a, b) => b.value - a.value)[0] || null
    },
    stats(): any {
      let topNode: any = null
      let nodes = 0
      for (const p of this.planets) {
        nodes += p.nodeCount
        if (p.bestNode && (!topNode || p.bestNode.value > topNode.value)) {
          topNode = { ...p.bestNode, planet: p.planet }
        }
      }
      return {
        planets: this.planets.length,
        nodes,
        topValue: this.richest ? this.richest.value : 0,
        topNode,
      }
    },
    selectedData(): any {
      return this.selected ? this.planetsByName[this.selected] : null
    },
    itemNames(): string[] {
      return (this.allItems as any[]).map((i) => i && i.item_name).filter(Boolean)
    },
    // Builds every planet's position, size and glow, plus the rail edges.
    scene(): any {
      const chainPolar: Record<string, { r: number; deg: number }> = {}
      CHAIN.forEach((name, i) => {
        chainPolar[name] = { r: R0 + i * RSTEP, deg: A0 + i * STEP }
      })
      const maxR = R0 + (CHAIN.length - 1) * RSTEP

      const posOf = (name: string, specialIndex: number, specialCount: number) => {
        if (chainPolar[name]) return polar(chainPolar[name].r, chainPolar[name].deg)
        if (SATELLITES[name] && chainPolar[SATELLITES[name]]) {
          const pp = chainPolar[SATELLITES[name]]
          return polar(pp.r + 30, pp.deg + 9)
        }
        // unknown / special zones (Void, Zariman, …) on an outer arc
        const deg = 250 + (specialCount > 1 ? (specialIndex / (specialCount - 1)) * 80 : 40)
        return polar(maxR + 40, deg)
      }

      const specials = this.planets.filter((p) => !chainPolar[p.planet] && !SATELLITES[p.planet])
      const nodes = this.planets.map((p) => {
        const type = chainPolar[p.planet]
          ? 'planet'
          : SATELLITES[p.planet]
          ? 'satellite'
          : 'special'
        const pos = posOf(p.planet, specials.indexOf(p), specials.length)
        const t = Math.min(1, (p.value || 0) / this.maxValue)
        const baseR = type === 'satellite' ? 6.5 : 8.5
        return {
          planet: p.planet,
          value: p.value,
          nodeCount: p.nodeCount,
          type,
          x: pos.x,
          y: pos.y,
          r: baseR + t * (type === 'satellite' ? 4 : 6),
          glowR: baseR + 4 + t * 12,
          glowO: 0.1 + 0.34 * t,
          color: this.discColor(t, type),
        }
      })

      const byName: Record<string, any> = {}
      nodes.forEach((n) => (byName[n.planet] = n))
      const edges = [
        ...CHAIN_EDGES.map((e) => ({ e, special: false })),
        ...SPECIAL_EDGES.map((e) => ({ e, special: true })),
      ]
        .filter(({ e }) => byName[e[0]] && byName[e[1]])
        .map(({ e, special }) => ({
          x1: byName[e[0]].x, y1: byName[e[0]].y,
          x2: byName[e[1]].x, y2: byName[e[1]].y,
          special,
        }))

      return { sun: { x: CX, y: CY }, nodes, edges }
    },
    // Fit the SVG viewport to every planet's disc, glow AND label. The special
    // worlds (Void/Zariman/Sanctuary/Veil Proxima…) sit on an outer arc that
    // pushed some discs above y=0, so a fixed `0 0 960 840` box sliced their
    // tops off. Expand the box to whatever the scene actually spans, never
    // smaller than the base frame, with padding so nothing touches an edge.
    viewBox(): string {
      const nodes = this.scene.nodes
      let minX = 0
      let minY = 0
      let maxX = VB.w
      let maxY = VB.h
      for (const n of nodes) {
        // label sits below the disc, centred; ~6.6px per char at 11px Rajdhani
        const halfLabel = ((n.planet || '').length * 6.6) / 2 + 4
        const reach = Math.max(n.glowR, n.r + 4)
        minX = Math.min(minX, n.x - reach, n.x - halfLabel)
        maxX = Math.max(maxX, n.x + reach, n.x + halfLabel)
        minY = Math.min(minY, n.y - reach)
        maxY = Math.max(maxY, n.y + n.r + 15 + 13) // label baseline + height
      }
      const pad = 14
      minX -= pad
      minY -= pad
      maxX += pad
      maxY += pad
      return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`
    },
  },
  mounted() {
    this.load()
    this.finishLoading()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const res = await this.$axios.get(`${this.$config.apiURL}/drops/map`)
        this.planets = (res.data && res.data.planets) || []
      } catch (e) {
        this.planets = []
      } finally {
        this.loading = false
      }
    },
    selectPlanet(name: string) {
      this.selected = name
      this.openNode = ''
      const first = this.planetsByName[name]
      if (first && first.nodes && first.nodes.length) this.openNode = first.nodes[0].location
      if (this.$vuetify.breakpoint.mobile) {
        this.$nextTick(() => {
          const el = this.$refs.panel as HTMLElement
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    },
    onPlanetFocus(name: string) {
      // keyboard focus previews the world without committing scroll
      this.selected = name
    },
    onSvgKey(e: KeyboardEvent) {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
      if (!keys.includes(e.key)) return
      const order = this.scene.nodes.map((n: any) => n.planet)
      if (!order.length) return
      e.preventDefault()
      const cur = order.indexOf(this.selected)
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      const next = order[(cur + dir + order.length) % order.length] || order[0]
      this.selectPlanet(next)
    },
    toggleNode(location: string) {
      this.openNode = this.openNode === location ? '' : location
    },
    sortedRewards(rewards: any[]): any[] {
      return rewards.slice().sort((a, b) => (b.chance / 100) * b.price - (a.chance / 100) * a.price || b.chance - a.chance)
    },
    openDrops(name: string) {
      this.dropsItem = name
      this.dropsDialog = true
    },
    onFind(name: string) {
      if (name) this.openDrops(name)
    },
    discColor(t: number, type: string): string {
      if (type === 'special') return t >= 0.4 ? '#35d6d0' : '#2b8f8b'
      if (t >= 0.66) return '#e7cf95'
      if (t >= 0.33) return '#c8a85c'
      if (t >= 0.1) return '#9a8f6a'
      return '#5a6178'
    },
    valueClass(v: number): string {
      const t = v / this.maxValue
      if (t >= 0.5) return 'is-gold'
      if (t >= 0.2) return 'is-mid'
      return 'is-low'
    },
    rarityColor(rarity: string): string {
      const r = (rarity || '').toLowerCase()
      if (r === 'legendary') return '#35d6d0'
      if (r === 'rare') return '#e7cf95'
      if (r === 'uncommon') return '#b6c0cc'
      return '#c08457'
    },
    thumbUrl(thumb: string): string {
      if (!thumb) return PLACEHOLDER_IMG
      return 'https://warframe.market/static/assets/' + thumb
    },
    onImgError(e: any) {
      const img = e.target
      if (!img || img.dataset.fallback) return
      img.dataset.fallback = '1'
      img.src = PLACEHOLDER_IMG
    },
    fmtPlat(n: number): string {
      const v = Number(n) || 0
      return v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)
    },
    fmtChance(n: number): string {
      const v = Number(n) || 0
      return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
    },
    finishLoading() {
      this.$nextTick(() => {
        const el = document.getElementById('spinner-wrapper')
        if (el) el.style.display = 'none'
        else this.finishLoading()
      })
    },
  },
}
</script>

<style scoped>
.sc {
  color: #eef1f8;
  padding-bottom: 8px;
}
.an-eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-size: 0.68rem;
  color: #8f95ab;
  margin-bottom: 6px;
}

/* ---- hero ---- */
.sc-hero {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  margin: 6px 0 22px;
}
.sc-hero__text { max-width: 640px; }
.sc-title {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: clamp(2rem, 5vw, 3.1rem);
  line-height: 1.05;
  color: #f2ead6;
  margin: 0 0 12px;
}
.sc-accent { color: #35d6d0; }
.sc-lede {
  font-family: 'Open Sans', sans-serif;
  color: #b6bcd0;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
}
.sc-hero__deal {
  border: 1px solid rgba(53, 214, 208, 0.3);
  background: linear-gradient(180deg, rgba(53, 214, 208, 0.08), rgba(12, 13, 24, 0.2));
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
  padding: 14px 18px;
  min-width: 210px;
}
.sc-hero__deal-label {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.64rem;
  color: #8f95ab;
}
.sc-hero__deal-name {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 1.3rem;
  color: #7ff0eb;
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  text-align: left;
}
.sc-hero__deal-name:hover { color: #aef6f2; }
.sc-hero__deal-plat {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.8rem;
  color: #e7cf95;
  line-height: 1.1;
}
.sc-hero__deal-plat span { font-size: 0.8rem; color: #8f95ab; margin-left: 4px; }
.sc-hero__deal-sub { font-size: 0.8rem; color: #9aa0b8; }

/* ---- stats ---- */
.sc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: rgba(200, 168, 92, 0.18);
  border: 1px solid rgba(200, 168, 92, 0.18);
  margin-bottom: 24px;
}
.sc-stat { background: #0e0f1c; padding: 14px 16px; }
.sc-stat__num {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #eef1f8;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sc-stat__num.is-gold { color: #e7cf95; }
.sc-stat__num.is-teal { color: #35d6d0; }
.sc-stat__lbl {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: #8f95ab;
  margin-top: 2px;
}

/* ---- loading / empty ---- */
.sc-loading, .sc-empty {
  text-align: center;
  padding: 70px 16px;
  color: #b6bcd0;
}
.sc-loading__orbit {
  width: 54px; height: 54px;
  margin: 0 auto 18px;
  border: 2px solid rgba(200, 168, 92, 0.25);
  border-top-color: #c8a85c;
  border-radius: 50%;
  animation: sc-spin 0.9s linear infinite;
}
.sc-loading p, .sc-empty p {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #cfd4e4;
  margin: 4px 0;
}
.sc-empty span { font-size: 0.86rem; color: #8f95ab; }
@keyframes sc-spin { to { transform: rotate(360deg); } }

/* ---- main layout ---- */
.sc-main {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.9fr);
  gap: 18px;
  align-items: start;
}
.sc-chart {
  border: 1px solid rgba(200, 168, 92, 0.2);
  background:
    radial-gradient(60% 50% at 50% 45%, rgba(53, 214, 208, 0.05), transparent 70%),
    linear-gradient(180deg, #0a0b16 0%, #06070e 100%);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  padding: 8px 8px 4px;
  position: sticky;
  top: 12px;
}
.sc-svg { width: 100%; height: auto; display: block; touch-action: manipulation; }

.sc-sun-halo { animation: sc-pulse 5s ease-in-out infinite; transform-origin: center; }
@keyframes sc-pulse { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; } }
.sc-stars circle { animation: sc-twinkle 4s ease-in-out infinite; }
@keyframes sc-twinkle { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }

.sc-rail { stroke: rgba(200, 168, 92, 0.22); stroke-width: 1; }
.sc-rail--special { stroke: rgba(53, 214, 208, 0.22); stroke-dasharray: 3 4; }

.sc-planet { cursor: pointer; outline: none; }
.sc-planet__disc { stroke-width: 1.2; transition: r 0.15s ease; }
.sc-planet__glow { transition: opacity 0.2s ease; pointer-events: none; }
.sc-planet__ring {
  fill: none;
  stroke: #fff;
  stroke-width: 1.4;
  opacity: 0.9;
  animation: sc-ring 2.4s ease-in-out infinite;
}
@keyframes sc-ring { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
.sc-planet__label {
  font-family: 'Rajdhani', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  fill: #c3c8dc;
  pointer-events: none;
  paint-order: stroke;
  stroke: #06070e;
  stroke-width: 3px;
  stroke-linejoin: round;
}
.sc-planet.is-selected .sc-planet__label { fill: #f2ead6; }
.sc-planet:hover .sc-planet__label { fill: #e7cf95; }
.sc-planet:focus-visible .sc-planet__disc { stroke: #35d6d0; stroke-width: 2.4; }
.sc-planet:focus-visible .sc-planet__label { fill: #35d6d0; }

.sc-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 10px 6px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.72rem;
  color: #8f95ab;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.sc-legend__bar {
  width: 90px; height: 8px;
  background: linear-gradient(90deg, #5a6178, #9a8f6a, #c8a85c, #e7cf95);
  border-radius: 2px;
}
.sc-legend__hint { margin-left: auto; text-transform: none; letter-spacing: 0.02em; color: #767c92; }

/* ---- detail panel ---- */
.sc-panel {
  border: 1px solid rgba(200, 168, 92, 0.2);
  background: linear-gradient(180deg, #12142400, #0c0d18);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  min-height: 300px;
}
.sc-panel__idle {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; text-align: center; padding: 60px 20px; height: 100%;
  color: #8f95ab; font-family: 'Rajdhani', sans-serif;
}
.sc-panel__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 16px 18px 12px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.18);
}
.sc-panel__title { font-family: 'Cinzel', serif; font-size: 1.6rem; color: #e7cf95; margin: 0; }
.sc-panel__best { text-align: right; white-space: nowrap; }
.sc-panel__best span { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 1.5rem; color: #e7cf95; }
.sc-panel__best small { display: block; font-size: 0.64rem; color: #8f95ab; text-transform: uppercase; letter-spacing: 0.1em; }

.sc-nodes { list-style: none; margin: 0; padding: 6px; max-height: 620px; overflow-y: auto; }
.sc-node { border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
.sc-node__head {
  width: 100%;
  display: flex; align-items: center; gap: 10px;
  background: none; border: none; cursor: pointer;
  padding: 10px 8px; text-align: left; color: inherit;
}
.sc-node__head:hover { background: rgba(200, 168, 92, 0.05); }
.sc-node__head:focus-visible { outline: 2px solid #35d6d0; outline-offset: -2px; }
.sc-node__id { flex: 1; min-width: 0; }
.sc-node__name { display: block; font-weight: 600; color: #eef1f8; font-size: 0.98rem; }
.sc-node__mode {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.06em; font-size: 0.72rem; color: #8f95ab;
}
.sc-node__val { font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 1.08rem; white-space: nowrap; }
.sc-node__val small { font-size: 0.66rem; color: #8f95ab; margin-left: 1px; }
.sc-node__val.is-gold { color: #e7cf95; }
.sc-node__val.is-mid { color: #c8a85c; }
.sc-node__val.is-low { color: #8f95ab; }
.sc-node__chev { color: #8f95ab !important; }

.sc-node__body { padding: 4px 8px 12px; }
.sc-rot { margin-bottom: 8px; }
.sc-rot__head { display: flex; align-items: center; gap: 8px; margin: 6px 0 4px; }
.sc-rot__badge {
  font-family: 'Rajdhani', sans-serif; font-weight: 700; font-size: 0.72rem;
  width: 18px; height: 18px; display: grid; place-items: center; color: #0c0d18;
}
.sc-rot__badge[data-rot='A'] { background: #6fae9b; }
.sc-rot__badge[data-rot='B'] { background: #c8a85c; }
.sc-rot__badge[data-rot='C'] { background: #cf7b57; }
.sc-rot__badge[data-rot='D'] { background: #9a7bcf; }
.sc-rot__val { font-family: 'Rajdhani', sans-serif; font-size: 0.74rem; color: #8f95ab; text-transform: uppercase; letter-spacing: 0.06em; }

.sc-reward {
  display: grid;
  grid-template-columns: 30px 1fr auto auto;
  align-items: center;
  gap: 9px;
  padding: 5px 4px;
}
.sc-reward.is-dud { opacity: 0.5; }
.sc-reward__thumb { width: 30px; height: 30px; object-fit: contain; }
.sc-reward__name {
  background: none; border: none; text-align: left; cursor: pointer;
  color: #dfe3f0; font-size: 0.9rem; padding: 0; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.sc-reward__name:hover { color: #35d6d0; text-decoration: underline; }
.sc-reward__chance { display: inline-flex; align-items: center; gap: 5px; font-size: 0.84rem; color: #b6bcd0; font-variant-numeric: tabular-nums; white-space: nowrap; }
.sc-reward__plat { font-family: 'Rajdhani', sans-serif; font-weight: 600; color: #e7cf95; font-size: 0.9rem; white-space: nowrap; }
.sc-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }

/* ---- find ---- */
.sc-find {
  display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
  margin-top: 24px; padding: 16px 18px;
  border: 1px solid rgba(53, 214, 208, 0.2);
  background: linear-gradient(180deg, rgba(53, 214, 208, 0.05), transparent);
}
.sc-find__title { font-family: 'Cinzel', serif; font-size: 1.3rem; color: #7ff0eb; margin: 0; }
.sc-find__input { flex: 1; min-width: 240px; }

.sc-disclaimer { margin-top: 22px; }

/* ---- responsive ---- */
@media (max-width: 900px) {
  .sc-main { grid-template-columns: 1fr; }
  .sc-chart { position: static; }
  .sc-stats { grid-template-columns: repeat(2, 1fr); }
  .sc-nodes { max-height: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sc-sun-halo, .sc-stars circle, .sc-planet__ring, .sc-loading__orbit { animation: none !important; }
}
</style>
