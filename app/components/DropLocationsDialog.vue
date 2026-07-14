<template>
  <v-dialog
    :value="value"
    max-width="760"
    scrollable
    dark
    content-class="dld-dialog"
    @input="$emit('input', $event)"
  >
    <div class="dld">
      <header class="dld__head">
        <img
          v-if="thumb"
          class="dld__thumb"
          :src="thumbUrl"
          :alt="itemName"
          @error="onImgError"
        />
        <span v-else class="dld__node" aria-hidden="true"></span>
        <div class="dld__headtext">
          <div class="dld__eyebrow">Drop locations</div>
          <h2 class="dld__title">{{ itemName || 'Item' }}</h2>
        </div>
        <button class="dld__close" aria-label="Close drop locations" @click="close">
          <v-icon>mdi-close</v-icon>
        </button>
      </header>

      <div class="dld__body">
        <!-- Loading -->
        <div v-if="loading" class="dld__state">
          <div v-for="n in 4" :key="n" class="dld__skel"></div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="dld__state dld__state--msg">
          <v-icon color="#e0a3a3" size="34">mdi-alert-circle-outline</v-icon>
          <p>Couldn't load drop data.</p>
          <button class="dld__retry" @click="load">Retry</button>
        </div>

        <!-- Empty -->
        <div v-else-if="!hasResults" class="dld__state dld__state--msg">
          <v-icon color="#6b7280" size="34">mdi-map-marker-off-outline</v-icon>
          <p>No drop sources found for this item.</p>
          <span class="dld__hint">It may be vaulted, sold by a shop, or traded only between players.</span>
        </div>

        <!-- Results -->
        <div v-else class="dld__results">
          <!-- Direct mission drops -->
          <section v-if="data.missions.length" class="dld__sec">
            <div class="dld__sec-head">
              <span class="dld__sec-title">Drops directly at</span>
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
              <span class="dld__sec-title">Found in relics</span>
              <span class="dld__sec-count">{{ data.relics.length }}</span>
            </div>
            <div v-for="(r, i) in data.relics" :key="'r' + i" class="dld__relic">
              <div class="dld__relic-head">
                <span class="dld__relic-name">{{ r.relicName }}</span>
                <span class="dld__chance">
                  <i class="dld__dot" :style="{ background: rarityColor(r.rarity) }"></i>{{ r.rarity }} · {{ fmt(r.chance) }}%
                </span>
              </div>
              <div v-if="r.farmNodes.length" class="dld__farm">
                <span class="dld__farm-lbl">Farm the relic at</span>
                <div class="dld__farm-nodes">
                  <span v-for="(n, j) in r.farmNodes.slice(0, 4)" :key="j" class="dld__chip">
                    {{ n.location }}<small>{{ n.planet }} · {{ n.gameMode }}<template v-if="n.rotation"> · {{ n.rotation }}</template></small>
                  </span>
                  <span v-if="r.farmNodes.length > 4" class="dld__chip dld__chip--more">+{{ r.farmNodes.length - 4 }}</span>
                </div>
              </div>
              <div v-else class="dld__farm dld__farm--none">Relic currently has no farmable source (likely vaulted).</div>
            </div>
          </section>
        </div>
      </div>

      <footer class="dld__foot">
        <a class="dld__source" :href="externalLink" target="_blank" rel="noopener noreferrer">
          Open full data <v-icon size="14">mdi-open-in-new</v-icon>
        </a>
      </footer>
    </div>
  </v-dialog>
</template>

<script lang="ts">
export default {
  name: 'DropLocationsDialog',
  props: {
    value: { type: Boolean, default: false },
    itemName: { type: String, default: '' },
    // warframe.market thumb path (e.g. item.thumb) — shown in the header the
    // same way the home-page table renders item images.
    thumb: { type: String, default: '' },
  },
  data() {
    return {
      loading: false,
      error: false,
      data: { missions: [], relics: [], itemName: '' } as any,
      lastLoaded: '',
    }
  },
  computed: {
    thumbUrl(): string {
      return 'https://warframe.market/static/assets/' + (this.thumb || '')
    },
    hasResults(): boolean {
      return !!(this.data && (this.data.missions.length || this.data.relics.length))
    },
    externalLink(): string {
      let s = '^' + (this.itemName || '')
      if (s.includes('(')) s = s.split('(')[0].trim()
      if (s.includes('Set')) s = s.replace('Set', '').trim()
      return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
    },
  },
  watch: {
    value(open: boolean) {
      if (open && this.itemName && this.itemName !== this.lastLoaded) this.load()
    },
    itemName(name: string) {
      if (this.value && name && name !== this.lastLoaded) this.load()
    },
  },
  methods: {
    close() {
      this.$emit('input', false)
    },
    onImgError(e: any) {
      // Hide a broken thumbnail and fall back to the diamond node glyph.
      const img = e.target
      if (img) img.style.display = 'none'
    },
    async load() {
      const name = this.itemName
      if (!name) return
      this.loading = true
      this.error = false
      try {
        const url = `${this.$config.apiURL}/drops/item/${encodeURIComponent(name)}`
        const res = await this.$axios.get(url)
        this.data = res.data || { missions: [], relics: [] }
        this.lastLoaded = name
      } catch (e) {
        this.error = true
      } finally {
        this.loading = false
      }
    },
    fmt(n: number): string {
      const v = Number(n) || 0
      return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
    },
    rarityColor(rarity: string): string {
      const r = (rarity || '').toLowerCase()
      if (r === 'legendary') return '#35d6d0'
      if (r === 'rare') return '#e7cf95'
      if (r === 'uncommon') return '#b6c0cc'
      return '#c08457'
    },
  },
}
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
.dld__relic-name { font-family: 'Cinzel', serif; color: #e7cf95; font-size: 1.02rem; }
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
</style>
