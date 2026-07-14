<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Ducat Efficiency</div>
            <h1 class="an-title">
              Most <span class="accent-b">ducats</span> per
              <span class="accent-a">platinum</span>.
            </h1>
            <p class="an-lede">
              Baro Ki'Teer pays ducats for prime parts. Buy the parts that give the
              most ducats for the least platinum, and every Void Trader visit costs
              you less. Ranked by ducats earned per platinum spent.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Best ducat value</div>
            <div class="an-hero__deal-plat">{{ eff(topDeal).toFixed(1) }}<span>d/p</span></div>
            <a class="an-hero__deal-name" :href="mkt(topDeal.url_name)" target="_blank" rel="noopener">{{ topDeal.item_name }} →</a>
            <div class="an-hero__deal-sub">{{ topDeal.ducats }} ducats · {{ fmtPlat(topDeal.market.sell) }}p</div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat"><div class="an-stat__num">{{ stats.total }}</div><div class="an-stat__lbl">prime parts</div></div>
          <div class="an-stat"><div class="an-stat__num is-good">{{ stats.best.toFixed(1) }}</div><div class="an-stat__lbl">best ducats/plat</div></div>
          <div class="an-stat"><div class="an-stat__num is-alt">{{ stats.avg.toFixed(1) }}</div><div class="an-stat__lbl">avg ducats/plat</div></div>
          <div class="an-stat"><div class="an-stat__num is-gold">{{ stats.cheap }}</div><div class="an-stat__lbl">≤ 15p parts</div></div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a part" class="an-search"></v-text-field>
            <v-text-field v-model.number="maxPrice" dark dense hide-details type="number" min="0" label="Max price (plat)" class="an-field"></v-text-field>
            <v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
          </div>
          <v-chip-group v-model="category" mandatory column class="an-cats">
            <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
          </v-chip-group>
          <div class="an-count">{{ filtered.length }} {{ filtered.length === 1 ? 'part' : 'parts' }} match</div>
        </section>

        <div v-if="!filtered.length" class="an-empty">
          No parts match these filters. Some items may not be enriched with ducat values yet.
        </div>

        <div v-else-if="!isMobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Prime part</th>
                <th class="grp-a">Plat (ask)</th>
                <th class="grp-b">Ducats</th>
                <th>Ducats / plat</th>
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
                      <span v-if="row.url_name === topDealUrl" class="an-badge">BEST</span>
                      <small class="an-sub">vol {{ fmtPlat(row.market.volume) }}</small>
                    </span>
                  </a>
                </td>
                <td class="grp-a an-num">{{ fmtPlat(row.market.sell) }}p</td>
                <td class="grp-b an-num">{{ row.ducats }}</td>
                <td class="an-num an-strong up">{{ eff(row).toFixed(1) }}</td>
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
                <div class="an-card__name">{{ row.item_name }}<span v-if="row.url_name === topDealUrl" class="an-badge">BEST</span></div>
                <small class="an-sub">vol {{ fmtPlat(row.market.volume) }}</small>
              </div>
              <v-icon color="#4fb3bf">mdi-open-in-new</v-icon>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">Value</div>
                <div class="an-block__row"><span>Plat</span><b>{{ fmtPlat(row.market.sell) }}p</b></div>
                <div class="an-block__row"><span>Ducats</span><b>{{ row.ducats }}</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">Efficiency</div>
                <div class="an-block__row"><span>Ducats/plat</span><b class="up">{{ eff(row).toFixed(1) }}</b></div>
                <div class="an-block__row"><span>Volume</span><b>{{ fmtPlat(row.market.volume) }}</b></div>
              </div>
            </div>
          </a>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer blue darken-4" type="info" dense>
        Ducats/plat = ducat value ÷ lowest sell order. Baro's ducat prices are fixed
        by the game; platinum prices are today's Warframe Market orders.
      </v-alert>
    </client-only>
  </div>
</template>

<script lang="ts">
import { mapGetters } from 'vuex'

export default {
  name: 'DucatsPage',
  data() {
    return {
      search: '',
      maxPrice: 0,
      category: 'All',
      sortKey: 'efficiency',
      page: 1,
      perPage: 25,
      placeholderImg:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
      sortOptions: [
        { text: 'Ducats per plat', value: 'efficiency' },
        { text: 'Most ducats', value: 'ducats' },
        { text: 'Cheapest', value: 'cheapest' },
        { text: 'Volume', value: 'volume' },
      ],
    }
  },
  head() {
    return {
      title: 'Ducat Efficiency — best ducats per platinum (Warframe)',
      meta: [{ hid: 'description', name: 'description', content: 'Warframe prime parts ranked by ducats earned per platinum spent — the cheapest way to stock ducats for Baro Ki\'Teer.' }],
    }
  },
  computed: {
    ...mapGetters({ allItems: 'all_items' }),
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.mobile
    },
    ducatItems(): any[] {
      return (this.allItems as any[]).filter((i) => i && i.ducats > 0 && i.market && i.market.sell > 0)
    },
    categoryOptions(): string[] {
      const present = new Set<string>()
      for (const r of this.ducatItems) present.add(this.categoryOf(r.tags))
      const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
      return ['All', ...order.filter((c) => present.has(c))]
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      const maxP = Number(this.maxPrice) || 0
      let list = this.ducatItems.filter((r) => {
        if (q && !r.item_name.toLowerCase().includes(q)) return false
        if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
        if (maxP > 0 && (r.market.sell || 0) > maxP) return false
        return true
      })
      const dir = (a: number, b: number) => b - a
      const sorters: Record<string, (a: any, b: any) => number> = {
        efficiency: (a, b) => dir(this.eff(a), this.eff(b)),
        ducats: (a, b) => dir(a.ducats, b.ducats),
        cheapest: (a, b) => a.market.sell - b.market.sell,
        volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
      }
      return list.slice().sort(sorters[this.sortKey] || sorters.efficiency)
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
      for (const r of this.ducatItems) if (!best || this.eff(r) > this.eff(best)) best = r
      return best
    },
    topDealUrl(): string {
      let best: any = null
      for (const r of this.filtered) if (!best || this.eff(r) > this.eff(best)) best = r
      return best ? best.url_name : ''
    },
    stats(): any {
      const list = this.ducatItems
      const effs = list.map((r) => this.eff(r))
      return {
        total: list.length,
        best: effs.length ? Math.max(...effs) : 0,
        avg: effs.length ? effs.reduce((s, v) => s + v, 0) / effs.length : 0,
        cheap: list.filter((r) => r.market.sell <= 15).length,
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
      if (t.includes('sentinel')) return 'Sentinel'
      if (t.includes('companion') || t.includes('pet')) return 'Companion'
      return 'Other'
    },
    eff(row: any): number {
      return row.market.sell > 0 ? row.ducats / row.market.sell : 0
    },
    fmtPlat(n: number): string {
      return Math.round(Number(n) || 0).toLocaleString('en-US')
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
