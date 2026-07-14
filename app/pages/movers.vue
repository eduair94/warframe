<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Top Movers</div>
            <h1 class="an-title">
              What's <span class="accent-b">pumping</span>,
              what's <span class="accent-a">dumping</span>.
            </h1>
            <p class="an-lede">
              The biggest price and volume moves across the whole market, built
              from our own daily price history — something warframe.market's
              per-item 90-day chart can't show you. Catch a rally before it peaks
              or a dip before it recovers.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Top gainer · {{ timeframeLabel }}</div>
            <div class="an-hero__deal-plat" :class="topDeal[changeKey] >= 0 ? 'is-up' : 'is-down'">
              {{ fmtSignedPct(topDeal[changeKey]) }}
            </div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">
              {{ topDeal.item_name }} →
            </a>
            <div class="an-hero__deal-sub">{{ fmtPlat(priceOf(topDeal)) }}p · vol {{ fmtPlat(topDeal.volume) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.withHistory }}</div>
            <div class="an-stat__lbl">items with history</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtSignedPct(stats.topGain) }}</div>
            <div class="an-stat__lbl">biggest gain</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-bad">{{ fmtSignedPct(stats.topLoss) }}</div>
            <div class="an-stat__lbl">biggest drop</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ meta.maxHistoryDays }}</div>
            <div class="an-stat__lbl">days of history</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
            <div class="an-refine">
              <div class="an-refine__lbl">Board</div>
              <v-btn-toggle v-model="mode" mandatory dense dark>
                <v-btn value="gainers" small>Gainers</v-btn>
                <v-btn value="losers" small>Losers</v-btn>
                <v-btn value="volume" small>Volume</v-btn>
              </v-btn-toggle>
            </div>
            <div class="an-refine">
              <div class="an-refine__lbl">Window</div>
              <v-btn-toggle v-model="timeframe" mandatory dense dark>
                <v-btn value="change24h" small>24h</v-btn>
                <v-btn value="change7d" small>7d</v-btn>
                <v-btn value="change30d" small>30d</v-btn>
              </v-btn-toggle>
            </div>
          </div>
          <v-chip-group v-model="category" mandatory column class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ filtered.length }} {{ filtered.length === 1 ? 'item' : 'items' }}</div>
        </section>

        <v-alert v-if="loadError" type="error" dark dense class="ma-4">
          Couldn't load analytics. The market service may be waking up — try a refresh.
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          {{ emptyMessage }}
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Item</th>
                <th>Price</th>
                <th>{{ timeframeLabel }} change</th>
                <th>Trend</th>
                <th>Vol</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.item_name }}
                      <span v-if="row.vaulted" class="an-badge">VAULTED</span>
                      <small class="an-sub">{{ row.dataDays }}d tracked</small>
                    </span>
                  </a>
                </td>
                <td class="an-num an-strong">{{ fmtPlat(priceOf(row)) }}p</td>
                <td class="an-num an-strong" :class="changeClass(row[changeKey])">{{ fmtSignedPct(row[changeKey]) }}</td>
                <td class="an-num"><span :class="trendClass(row.trend)">{{ trendArrow(row.trend) }}</span></td>
                <td class="an-num">{{ fmtPlat(row.volume) }}</td>
                <td><span class="an-spark" v-html="sparkSvg(row.spark, row[changeKey])"></span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="row in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ row.item_name }}<span v-if="row.vaulted" class="an-badge">VAULTED</span></div>
                <small class="an-sub">{{ fmtPlat(priceOf(row)) }}p · vol {{ fmtPlat(row.volume) }}</small>
              </div>
              <span class="an-num an-strong" :class="changeClass(row[changeKey])">{{ fmtSignedPct(row[changeKey]) }}</span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block an-block--full">
                <div class="an-block__lbl">{{ timeframeLabel }} · {{ row.dataDays }} days tracked</div>
                <span class="an-spark an-spark--wide" v-html="sparkSvg(row.spark, row[changeKey])"></span>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer blue darken-4" type="info" dense>
        Change is measured on our own daily price series (average trade price,
        falling back to the sell order). Items need at least the selected window
        of history to appear on the gainers/losers boards — coverage grows every
        day the sync runs.
      </v-alert>
    </client-only>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TopMoversPage',
  async asyncData({ $axios, $config }: any) {
    try {
      const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data)
      return {
        items: (data && data.items) || [],
        meta: (data && data.meta) || { count: 0, maxHistoryDays: 0 },
        loadError: false,
      }
    } catch (e) {
      return { items: [], meta: { count: 0, maxHistoryDays: 0 }, loadError: true }
    }
  },
  data() {
    return {
      items: [] as any[],
      meta: { count: 0, maxHistoryDays: 0 } as any,
      loadError: false,
      search: '',
      mode: 'gainers',
      timeframe: 'change7d',
      category: 'All',
      page: 1,
      perPage: 25,
      placeholderImg:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
    }
  },
  head() {
    return {
      title: 'Top Movers — Warframe Market gainers, losers & volume',
      meta: [{ hid: 'description', name: 'description', content: "Warframe Market's biggest price gainers and losers over 24h / 7d / 30d plus the volume leaderboard, from long-term daily price history." }],
    }
  },
  computed: {
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.mobile
    },
    changeKey(): string {
      return this.timeframe
    },
    timeframeLabel(): string {
      return { change24h: '24h', change7d: '7d', change30d: '30d' }[this.timeframe as string] || '7d'
    },
    categoryOptions(): string[] {
      const present = new Set<string>()
      for (const r of this.items as any[]) present.add(this.categoryOf(r.tags))
      const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
      return ['All', ...order.filter((c) => present.has(c))]
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      const key = this.changeKey
      let list = (this.items as any[]).filter((r) => {
        if (q && !r.item_name.toLowerCase().includes(q)) return false
        if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
        if (this.mode !== 'volume' && (r[key] === null || r[key] === undefined)) return false
        return true
      })
      if (this.mode === 'gainers') list = list.filter((r) => r[key] > 0).sort((a, b) => b[key] - a[key])
      else if (this.mode === 'losers') list = list.filter((r) => r[key] < 0).sort((a, b) => a[key] - b[key])
      else list = list.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))
      return list
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
    },
    paged(): any[] {
      const start = (this.page - 1) * this.perPage
      return this.filtered.slice(start, start + this.perPage)
    },
    topDeal(): any {
      return this.filtered.length ? this.filtered[0] : null
    },
    topDealUrl(): string {
      return this.topDeal ? this.topDeal.url_name : ''
    },
    emptyMessage(): string {
      if (this.mode === 'volume') return 'No items match these filters.'
      return `No items have ${this.timeframeLabel} history yet. The movers board fills in as daily snapshots accumulate — check back soon.`
    },
    stats(): any {
      const key = this.changeKey
      const withHistory = (this.items as any[]).filter((r) => r.dataDays > 1).length
      const changes = (this.items as any[]).map((r) => r[key]).filter((v) => v !== null && v !== undefined)
      return {
        withHistory,
        topGain: changes.length ? Math.max(...changes) : 0,
        topLoss: changes.length ? Math.min(...changes) : 0,
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
    mkt(urlName: string): string {
      return 'https://warframe.market/items/' + urlName
    },
    onImgError(e: any) {
      const img = e.target
      if (!img || img.dataset.fallback) return
      img.dataset.fallback = '1'
      img.src = this.placeholderImg
    },
    priceOf(row: any): number {
      return Number(row.avg_price) > 0 ? row.avg_price : row.sell
    },
    categoryOf(tags: string[] = []): string {
      const t = (tags || []).map((x) => (x || '').toLowerCase())
      if (t.includes('warframe')) return 'Warframe'
      if (t.includes('primary')) return 'Primary'
      if (t.includes('secondary')) return 'Secondary'
      if (t.includes('melee')) return 'Melee'
      if (t.includes('mod')) return 'Mod'
      if (t.includes('sentinel')) return 'Sentinel'
      if (t.includes('companion') || t.includes('pet')) return 'Companion'
      if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
      return 'Other'
    },
    changeClass(v: number): string {
      if (v === null || v === undefined) return 'flat'
      if (v > 0) return 'up'
      if (v < 0) return 'down'
      return 'flat'
    },
    trendArrow(t: string): string {
      return t === 'up' ? '▲' : t === 'down' ? '▼' : '▬'
    },
    trendClass(t: string): string {
      return t === 'up' ? 'up' : t === 'down' ? 'down' : 'flat'
    },
    sparkSvg(spark: number[], change: number): string {
      const pts = (spark || []).filter((n) => typeof n === 'number')
      if (pts.length < 2) return ''
      const w = 88
      const h = 24
      const pad = 2
      const min = Math.min(...pts)
      const max = Math.max(...pts)
      const range = max - min || 1
      const step = (w - pad * 2) / (pts.length - 1)
      const coords = pts
        .map((v, i) => {
          const x = pad + i * step
          const y = pad + (h - pad * 2) * (1 - (v - min) / range)
          return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
      const color = change > 0 ? '#4caf7d' : change < 0 ? '#e57373' : '#9aa0b4'
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="${coords}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`
    },
    fmtPlat(n: number): string {
      return Math.round(Number(n) || 0).toLocaleString('en-US')
    },
    fmtSignedPct(n: number): string {
      if (n === null || n === undefined) return '—'
      const v = Number(n) || 0
      return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
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
.an-hero__deal-plat.is-up {
  color: #4caf7d;
}
.an-hero__deal-plat.is-down {
  color: #e57373;
}
.an-stat__num.is-bad {
  color: #e57373;
}
.an-spark {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}
.an-spark--wide >>> svg {
  width: 100%;
  height: 34px;
}
</style>
