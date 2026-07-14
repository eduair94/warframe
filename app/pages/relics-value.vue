<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <!-- Hero -->
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Relic Value</div>
            <h1 class="an-title">
              <span class="accent-b">Crack</span> it, or
              <span class="accent-a">cash</span> it?
            </h1>
            <p class="an-lede">
              Every relic is a gamble. This is the expected payout: the average
              platinum you get opening a relic (its drops, weighted by chance)
              versus simply selling the relic on the market. Radiant shifts the odds
              toward the rare drop.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Best relic to crack</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(ev(topDeal)) }}<span>p</span></div>
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
            <div class="an-stat__num is-good">{{ stats.openWins }}</div>
            <div class="an-stat__lbl">better to crack</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(stats.biggest) }}p</div>
            <div class="an-stat__lbl">top payout</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ fmtPlat(stats.avg) }}p</div>
            <div class="an-stat__lbl">avg payout</div>
          </div>
        </div>

        <!-- Filters -->
        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field
              v-model="search"
              dark
              dense
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              label="Search a relic"
              class="an-search"
            ></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">Refinement</div>
              <v-btn-toggle v-model="refinement" mandatory dense dark>
                <v-btn value="Intact" small>Intact</v-btn>
                <v-btn value="Radiant" small>Radiant</v-btn>
              </v-btn-toggle>
            </div>
            <v-select
              v-model="sortKey"
              :items="sortOptions"
              dark
              dense
              hide-details
              label="Sort by"
              class="an-field"
              style="flex: 0 1 220px"
            ></v-select>
          </div>

          <v-chip-group v-model="tier" mandatory column class="an-cats">
            <v-chip
              v-for="t in tierOptions"
              :key="t"
              :value="t"
              small
              active-class="an-chip--on"
            >
              {{ t }}
            </v-chip>
          </v-chip-group>

          <div class="an-toggles">
            <v-switch
              v-model="onlyOpenWins"
              dark
              dense
              hide-details
              inset
              color="#4caf7d"
              label="Only where cracking beats selling"
            ></v-switch>
          </div>
          <div class="an-count">
            {{ filtered.length }} {{ filtered.length === 1 ? 'relic' : 'relics' }} match
          </div>
        </section>

        <v-alert v-if="loadError" type="error" dark dense class="ma-4">
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
                <th class="grp-a">EV to open</th>
                <th class="grp-b">Sell relic</th>
                <th class="grp-a">Verdict</th>
                <th>Top drop</th>
                <th>Vol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paged"
                :key="row.url_name"
                :class="{ 'is-top': row.url_name === topDealUrl }"
              >
                <td class="col-name">
                  <nuxt-link class="an-name" :to="'/relic/' + row.url_name">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.relicName" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.relicName }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">TOP</span>
                      <small class="an-sub">{{ row.tier }} · {{ row.rewards.length }} drops</small>
                    </span>
                  </nuxt-link>
                </td>
                <td class="grp-a an-num an-strong" :class="{ up: ev(row) > row.relic.buy }">
                  {{ fmtPlat(ev(row)) }}p
                </td>
                <td class="grp-b an-num">{{ fmtPlat(row.relic.buy) }}p</td>
                <td class="grp-a">
                  <span class="pill" :class="verdict(row).cls">
                    {{ verdict(row).label }}
                    <b v-if="verdict(row).amount">{{ verdict(row).amount }}</b>
                  </span>
                </td>
                <td class="an-num">
                  <span class="an-topdrop">{{ topDrop(row).item_name }}</span>
                  <small class="an-sub">{{ fmtPlat(topDrop(row).price) }}p · {{ topDrop(row).rarity }}</small>
                </td>
                <td class="an-num">{{ fmtPlat(row.relic.volume) }}</td>
                <td>
                  <v-btn icon small color="#4fb3bf" :to="'/relic/' + row.url_name" :aria-label="'View ' + row.relicName">
                    <v-icon>mdi-arrow-right-circle</v-icon>
                  </v-btn>
                </td>
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
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.relicName" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ row.relicName }}
                  <span v-if="row.url_name === topDealUrl" class="an-badge">TOP</span>
                </div>
                <small class="an-sub">{{ row.tier }} · {{ row.rewards.length }} drops · vol {{ fmtPlat(row.relic.volume) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-chevron-right</v-icon>
            </div>
            <div class="an-card__verdict">
              <span class="pill" :class="verdict(row).cls">
                {{ verdict(row).label }}
                <b v-if="verdict(row).amount">{{ verdict(row).amount }}</b>
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">Open ({{ refinement }})</div>
                <div class="an-block__row"><span>EV</span><b :class="{ up: ev(row) > row.relic.buy }">{{ fmtPlat(ev(row)) }}p</b></div>
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
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer blue darken-4" type="info" dense>
        EV = expected value: each drop's market price weighted by its
        {{ refinement }} chance. Radiant costs 100 void traces to refine. Selling
        value uses the relic's highest buy order.
      </v-alert>
    </client-only>
  </div>
</template>

<script lang="ts">
// Fixed refinement drop-chance table (per rarity), shared by all relics.
const CHANCES: Record<string, Record<string, number>> = {
  Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
  Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
}

export default {
  name: 'RelicsValuePage',
  async asyncData({ $axios, $config }: any) {
    try {
      const data = await $axios
        .get(`${$config.apiURL}/relics_ev`)
        .then((res: any) => res.data)
      return { relics: (data && data.relics) || [], loadError: false }
    } catch (e) {
      return { relics: [], loadError: true }
    }
  },
  data() {
    return {
      relics: [] as any[],
      loadError: false,
      search: '',
      tier: 'All',
      refinement: 'Radiant',
      sortKey: 'ev',
      onlyOpenWins: false,
      page: 1,
      perPage: 20,
      placeholderImg:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
      sortOptions: [
        { text: 'Best payout (EV)', value: 'ev' },
        { text: 'Crack margin', value: 'margin' },
        { text: 'Volume', value: 'volume' },
        { text: 'Name (A–Z)', value: 'name' },
      ],
    }
  },
  head() {
    return {
      title: 'Relic Value — open vs sell (Warframe Market)',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'Expected platinum value of cracking every Warframe void relic (Intact & Radiant) versus selling it. Per-relic drop breakdown and best relics to open.',
        },
      ],
    }
  },
  computed: {
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.mobile
    },
    tierOptions(): string[] {
      const present = new Set<string>()
      for (const r of this.relics as any[]) present.add(r.tier)
      const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
      return ['All', ...order.filter((t) => present.has(t))]
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      let list = (this.relics as any[]).filter((r) => {
        if (q && !r.relicName.toLowerCase().includes(q)) return false
        if (this.tier !== 'All' && r.tier !== this.tier) return false
        if (this.onlyOpenWins && this.ev(r) <= r.relic.buy) return false
        return true
      })
      const dir = (a: number, b: number) => b - a
      const sorters: Record<string, (a: any, b: any) => number> = {
        ev: (a, b) => dir(this.ev(a), this.ev(b)),
        margin: (a, b) => dir(this.ev(a) - a.relic.buy, this.ev(b) - b.relic.buy),
        volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
        name: (a, b) => a.relicName.localeCompare(b.relicName),
      }
      return list.slice().sort(sorters[this.sortKey] || sorters.ev)
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
    },
    paged(): any[] {
      const start = (this.page - 1) * this.perPage
      return this.filtered.slice(start, start + this.perPage)
    },
    topDeal(): any {
      let best: any = null
      for (const r of this.relics as any[]) {
        if (!best || this.ev(r) > this.ev(best)) best = r
      }
      return best
    },
    topDealUrl(): string {
      let best: any = null
      for (const r of this.filtered) {
        if (!best || this.ev(r) > this.ev(best)) best = r
      }
      return best ? best.url_name : ''
    },
    stats(): any {
      const list = this.relics as any[]
      const evs = list.map((r) => this.ev(r))
      const openWins = list.filter((r) => this.ev(r) > r.relic.buy).length
      return {
        total: list.length,
        openWins,
        biggest: evs.length ? Math.max(...evs) : 0,
        avg: evs.length ? evs.reduce((s, v) => s + v, 0) / evs.length : 0,
      }
    },
  },
  watch: {
    filtered() {
      this.page = 1
    },
  },
  mounted() {
    this.finishLoading()
  },
  methods: {
    assetUrl(thumb: string): string {
      return 'https://warframe.market/static/assets/' + (thumb || '')
    },
    onImgError(e: any) {
      const img = e.target
      if (!img || img.dataset.fallback) return
      img.dataset.fallback = '1'
      img.src = this.placeholderImg
    },
    ev(relic: any): number {
      const table = CHANCES[this.refinement] || CHANCES.Intact
      return (relic.rewards || []).reduce((sum: number, r: any) => {
        const chance = table[r.rarity] || 0
        return sum + (chance / 100) * (r.price || 0)
      }, 0)
    },
    topDrop(relic: any): any {
      let best = { item_name: '—', price: 0, rarity: '' }
      for (const r of relic.rewards || []) {
        if (r.price > best.price) best = r
      }
      return best
    },
    fmtPlat(n: number): string {
      return Math.round(Number(n) || 0).toLocaleString('en-US')
    },
    verdict(relic: any): { label: string; amount: string; cls: string } {
      const open = this.ev(relic)
      const sell = relic.relic.buy || 0
      if (open > sell + 0.5) {
        return { label: 'Crack it', amount: `+${this.fmtPlat(open - sell)}p vs selling`, cls: 'pill--good' }
      }
      if (sell > open + 0.5) {
        return { label: 'Sell it', amount: `+${this.fmtPlat(sell - open)}p vs cracking`, cls: 'pill--alt' }
      }
      return { label: 'Even', amount: '', cls: 'pill--even' }
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
.an-refine {
  flex: 0 0 auto;
}
.an-refine__lbl {
  font-size: 0.72rem;
  color: #9aa0b4;
  margin-bottom: 4px;
}
.an-refine >>> .v-btn-toggle {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.an-refine >>> .v-btn-toggle .v-btn {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.an-refine >>> .v-btn-toggle .v-btn.v-btn--active {
  background: rgba(212, 175, 90, 0.9) !important;
  color: #17131f !important;
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
