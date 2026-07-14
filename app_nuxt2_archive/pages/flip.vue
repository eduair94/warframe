<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Flip Finder</div>
            <h1 class="an-title">
              Buy <span class="accent-a">low</span>, sell
              <span class="accent-b">high</span>.
            </h1>
            <p class="an-lede">
              The spread between the highest buy order and the lowest sell order is
              your margin. Post a buy order at the bid, fill it, relist at the ask —
              these are the widest, liquid spreads to work right now.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Widest liquid spread</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(topDeal.market.diff) }}<span>p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">
              {{ topDeal.item_name }} →
            </a>
            <div class="an-hero__deal-sub">{{ fmtPct(marginPct(topDeal)) }} margin · vol {{ fmtPlat(topDeal.market.volume) }}</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">items tracked</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtPlat(stats.biggest) }}p</div>
            <div class="an-stat__lbl">widest spread</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-gold">{{ fmtPlat(stats.avg) }}p</div>
            <div class="an-stat__lbl">avg spread</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ stats.profitable }}</div>
            <div class="an-stat__lbl">spread ≥ 10p</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
            <v-text-field v-model.number="minVolume" dark dense hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ filtered.length }} {{ filtered.length === 1 ? 'item' : 'items' }} match</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">No items match these filters. Widen the search or lower the min volume.</div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Item</th>
                <th class="grp-a">Buy (bid)</th>
                <th class="grp-b">Sell (ask)</th>
                <th>Spread</th>
                <th>Margin</th>
                <th>Vol</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in paged" :key="row.url_name" :class="{ 'is-top': row.url_name === topDealUrl }">
                <td class="col-name">
                  <a class="an-name" :href="mkt(row.url_name)" target="_blank" rel="noopener">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.item_name }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">TOP</span>
                      <small class="an-sub">vol {{ fmtPlat(row.market.volume) }}</small>
                    </span>
                  </a>
                </td>
                <td class="grp-a an-num">{{ fmtPlat(row.market.buy) }}p</td>
                <td class="grp-b an-num">{{ fmtPlat(row.market.sell) }}p</td>
                <td class="an-num an-strong up">+{{ fmtPlat(row.market.diff) }}p</td>
                <td class="an-num up">{{ fmtPct(marginPct(row)) }}</td>
                <td class="an-num">{{ fmtPlat(row.market.volume) }}</td>
                <td>
                  <v-btn icon small color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
                    <v-icon>mdi-open-in-new</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <a v-for="row in paged" :key="row.url_name" class="an-card" :class="{ 'is-top': row.url_name === topDealUrl }" :href="mkt(row.url_name)" target="_blank" rel="noopener">
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">{{ row.item_name }}<span v-if="row.url_name === topDealUrl" class="an-badge">TOP</span></div>
                <small class="an-sub">vol {{ fmtPlat(row.market.volume) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">Prices</div>
                <div class="an-block__row"><span>Buy</span><b>{{ fmtPlat(row.market.buy) }}p</b></div>
                <div class="an-block__row"><span>Sell</span><b>{{ fmtPlat(row.market.sell) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">Margin</div>
                <div class="an-block__row"><span>Spread</span><b class="up">+{{ fmtPlat(row.market.diff) }}p</b></div>
                <div class="an-block__row"><span>Return</span><b class="up">{{ fmtPct(marginPct(row)) }}</b></div>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer blue darken-4" type="info" dense>
        Spread = lowest sell order − highest buy order, from Warframe Market. Wide
        spreads on low-volume items may not fill quickly — check the volume column.
      </v-alert>
    </client-only>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'

export default {
  name: 'FlipFinderPage',
  data() {
    return {
      search: '',
      minVolume: 0,
      category: 'All',
      sortKey: 'spread',
      page: 1,
      perPage: 25,
      placeholderImg:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
      sortOptions: [
        { text: 'Widest spread', value: 'spread' },
        { text: 'Best margin %', value: 'margin' },
        { text: 'Volume', value: 'volume' },
        { text: 'Name (A–Z)', value: 'name' },
      ],
    }
  },
  head() {
    return {
      title: 'Flip Finder — widest Warframe Market spreads',
      meta: [{ hid: 'description', name: 'description', content: 'Live buy/sell spread ranking across Warframe Market items — the widest, most liquid margins to flip for platinum.' }],
    }
  },
  computed: {
    ...mapGetters({ allItems: 'all_items' }),
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.mobile
    },
    priced(): any[] {
      return (this.allItems as any[]).filter(
        (i) => i && i.market && i.market.buy > 0 && i.market.sell > 0 && i.market.sell > i.market.buy
      )
    },
    categoryOptions(): string[] {
      const present = new Set<string>()
      for (const r of this.priced) present.add(this.categoryOf(r.tags))
      const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
      return ['All', ...order.filter((c) => present.has(c))]
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      const minV = Number(this.minVolume) || 0
      let list = this.priced.filter((r) => {
        if (q && !r.item_name.toLowerCase().includes(q)) return false
        if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
        if ((r.market.volume || 0) < minV) return false
        return true
      })
      const dir = (a: number, b: number) => b - a
      const sorters: Record<string, (a: any, b: any) => number> = {
        spread: (a, b) => dir(a.market.diff, b.market.diff),
        margin: (a, b) => dir(this.marginPct(a), this.marginPct(b)),
        volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
        name: (a, b) => a.item_name.localeCompare(b.item_name),
      }
      return list.slice().sort(sorters[this.sortKey] || sorters.spread)
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
      for (const r of this.priced) if (!best || r.market.diff > best.market.diff) best = r
      return best
    },
    topDealUrl(): string {
      let best: any = null
      for (const r of this.filtered) if (!best || r.market.diff > best.market.diff) best = r
      return best ? best.url_name : ''
    },
    stats(): any {
      const list = this.priced
      const diffs = list.map((r) => r.market.diff)
      return {
        total: list.length,
        biggest: diffs.length ? Math.max(...diffs) : 0,
        avg: diffs.length ? diffs.reduce((s, v) => s + v, 0) / diffs.length : 0,
        profitable: list.filter((r) => r.market.diff >= 10).length,
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
    fmtPlat(n: number): string {
      return Math.round(Number(n) || 0).toLocaleString('en-US')
    },
    fmtPct(n: number): string {
      const v = Number(n) || 0
      return `${v.toFixed(0)}%`
    },
    marginPct(row: any): number {
      return row.market.buy > 0 ? (row.market.diff / row.market.buy) * 100 : 0
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
