<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Riven Fair Value</div>
            <h1 class="an-title">
              What's <span class="accent-a">my roll</span>
              <span class="accent-b">worth</span>?
            </h1>
            <p class="an-lede">
              Rivens are random, so warframe.market gives you raw listings and no
              price. Pick a weapon, tick the stats your riven rolled, and we
              estimate a fair plat range from the live auction corpus — then grade
              every listing against the field so you can spot a god roll or a deal.
            </p>
          </div>
          <div v-if="estimate.count" class="an-hero__deal">
            <div class="an-hero__deal-label">Estimated fair value</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(estimate.median) }}<span>p</span></div>
            <div class="an-hero__deal-name">{{ fmtPlat(estimate.p25) }}–{{ fmtPlat(estimate.p75) }}p range</div>
            <div class="an-hero__deal-sub">{{ estimate.count }} comparable{{ estimate.count === 1 ? '' : 's' }}{{ estimate.approx ? ' · approx' : '' }}</div>
          </div>
        </header>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-autocomplete
              v-model="selected"
              :items="weaponOptions"
              item-text="label"
              item-value="url_name"
              dark
              dense
              hide-details
              clearable
              prepend-inner-icon="mdi-sword"
              label="Choose a weapon"
              class="an-search"
              @change="onWeaponChange"
            ></v-autocomplete>
            <div v-if="weaponData" class="rv-meta">
              <span class="rv-meta__lbl">Disposition</span>
              <span class="rv-meta__val">{{ weaponData.disposition ? weaponData.disposition.toFixed(2) + '×' : '—' }}</span>
              <span class="rv-meta__lbl">Auctions</span>
              <span class="rv-meta__val">{{ weaponItems.length }}</span>
            </div>
          </div>
        </section>

        <v-alert v-if="loadError" type="error" dark dense class="ma-4">
          Couldn't load riven weapons. The market service may be waking up — try a refresh.
        </v-alert>

        <div v-else-if="!selected" class="an-empty">
          Pick a weapon above to estimate a riven's value and grade the live listings.
        </div>

        <div v-else-if="loadingWeapon" class="an-empty">Loading auctions…</div>

        <div v-else-if="!weaponItems.length" class="an-empty">
          No live direct-sale auctions stored for this weapon right now. Try another weapon.
        </div>

        <template v-else>
          <!-- Estimator -->
          <section class="rv-estimator">
            <div class="rv-panel__title">Tick the stats your riven rolled</div>
            <div class="rv-group">
              <div class="rv-group__lbl rv-pos">Positives</div>
              <div class="rv-chips">
                <button
                  v-for="opt in positiveOptions"
                  :key="'p-' + opt"
                  type="button"
                  class="rv-chip"
                  :class="{ 'rv-chip--on': selectedPositives.includes(opt) }"
                  @click="togglePositive(opt)"
                >
                  {{ attrLabel(opt) }}
                </button>
              </div>
            </div>
            <div v-if="negativeOptions.length" class="rv-group">
              <div class="rv-group__lbl rv-neg">Negative (optional)</div>
              <div class="rv-chips">
                <button
                  type="button"
                  class="rv-chip"
                  :class="{ 'rv-chip--on': selectedNegative === '' }"
                  @click="selectedNegative = ''"
                >
                  Any / none
                </button>
                <button
                  v-for="opt in negativeOptions"
                  :key="'n-' + opt"
                  type="button"
                  class="rv-chip rv-chip--neg"
                  :class="{ 'rv-chip--on': selectedNegative === opt }"
                  @click="selectedNegative = selectedNegative === opt ? '' : opt"
                >
                  − {{ attrLabel(opt) }}
                </button>
              </div>
            </div>

            <div class="rv-estimate">
              <template v-if="estimate.count">
                <div class="rv-estimate__main">
                  <div class="rv-estimate__num">{{ fmtPlat(estimate.median) }}<span>p</span></div>
                  <div class="rv-estimate__lbl">
                    fair value · range {{ fmtPlat(estimate.p25) }}–{{ fmtPlat(estimate.p75) }}p
                    <span class="rv-estimate__note">
                      from {{ estimate.count }} comparable{{ estimate.count === 1 ? '' : 's' }}{{ estimate.approx ? ' (few exact matches — approximate)' : '' }}
                    </span>
                  </div>
                </div>
                <div class="rv-estimate__cheapest" v-if="estimate.cheapest">
                  Cheapest listed: <b>{{ fmtPlat(estimate.cheapest) }}p</b>
                  <span v-if="estimate.cheapest < estimate.median" class="rv-deal">↓ below fair value</span>
                </div>
              </template>
              <div v-else class="rv-estimate__empty">
                {{ selectedPositives.length ? 'No comparable auctions with those exact stats — untick one to widen the match.' : 'Select at least one positive stat to get an estimate.' }}
              </div>
            </div>
          </section>

          <!-- Graded live listings -->
          <div class="rv-listhead">
            <span class="rv-panel__title">Live listings, graded</span>
            <span class="an-count">{{ gradedAuctions.length }} auctions · sorted by price</span>
          </div>

          <div v-if="!isMobile" class="an-tablewrap">
            <table class="an-table rv-table">
              <thead>
                <tr>
                  <th class="col-name">Stats</th>
                  <th>Grade</th>
                  <th>Rolls</th>
                  <th>MR</th>
                  <th>Buyout</th>
                  <th>Endo/p</th>
                  <th>Seller</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in pagedAuctions" :key="a.id" :class="{ 'is-top': a._deal }">
                  <td class="col-name">
                    <div class="rv-attrs">
                      <span v-for="at in positives(a)" :key="at.url_name" class="rv-attr rv-attr--pos">{{ attrLabel(at.url_name) }}</span>
                      <span v-for="at in negatives(a)" :key="at.url_name" class="rv-attr rv-attr--neg">− {{ attrLabel(at.url_name) }}</span>
                    </div>
                  </td>
                  <td><span class="rv-grade" :class="grade(a).cls">{{ grade(a).letter }}</span></td>
                  <td class="an-num">{{ a.item.re_rolls }}</td>
                  <td class="an-num">{{ a.item.mastery_level }}</td>
                  <td class="an-num an-strong">
                    {{ fmtPlat(a.buyout_price) }}p
                    <span v-if="a._deal" class="an-badge">DEAL</span>
                  </td>
                  <td class="an-num">{{ a.endoPerPlat ? a.endoPerPlat.toFixed(1) : '—' }}</td>
                  <td>
                    <span class="rv-status" :class="'rv-status--' + a.owner.status">{{ a.owner.status }}</span>
                    <small class="an-sub">{{ a.owner.ingame_name }}</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="an-cards">
            <div v-for="a in pagedAuctions" :key="a.id" class="an-card" :class="{ 'is-top': a._deal }">
              <div class="an-card__head">
                <span class="rv-grade rv-grade--lg" :class="grade(a).cls">{{ grade(a).letter }}</span>
                <div class="an-card__title">
                  <div class="an-card__name">{{ fmtPlat(a.buyout_price) }}p<span v-if="a._deal" class="an-badge">DEAL</span></div>
                  <small class="an-sub">{{ a.item.re_rolls }} rolls · MR{{ a.item.mastery_level }} · {{ a.owner.status }}</small>
                </div>
              </div>
              <div class="rv-attrs">
                <span v-for="at in positives(a)" :key="at.url_name" class="rv-attr rv-attr--pos">{{ attrLabel(at.url_name) }}</span>
                <span v-for="at in negatives(a)" :key="at.url_name" class="rv-attr rv-attr--neg">− {{ attrLabel(at.url_name) }}</span>
              </div>
            </div>
          </div>

          <div v-if="gradedAuctions.length > perPage" class="an-pager">
            <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
          </div>
        </template>
      </div>

      <v-alert class="an-disclaimer blue darken-4" type="info" dense>
        Estimates come from stored direct-sale auctions (rolled rivens, 50+
        re-rolls). The grade is each roll's positive-stat percentile <em>within
        this weapon's current listings</em> (A = top of the field) — a relative
        read, not an absolute god-roll score, since base stat ranges aren't
        modelled. Higher disposition ({{ weaponData && weaponData.disposition ? weaponData.disposition.toFixed(2) + '×' : 'shown above' }}) means bigger stat numbers overall.
      </v-alert>
    </client-only>
  </div>
</template>

<script lang="ts">
export default {
  name: 'RivenValuePage',
  async asyncData({ $axios, $config }: any) {
    try {
      const data = await $axios.get(`${$config.apiURL}/riven_weapons`).then((res: any) => res.data)
      return { weapons: (data && data.weapons) || [], loadError: false }
    } catch (e) {
      return { weapons: [], loadError: true }
    }
  },
  data() {
    return {
      weapons: [] as any[],
      loadError: false,
      selected: '' as string,
      weaponData: null as any,
      loadingWeapon: false,
      selectedPositives: [] as string[],
      selectedNegative: '' as string,
      page: 1,
      perPage: 20,
    }
  },
  head() {
    return {
      title: 'Riven Fair Value — price & grade any Warframe riven',
      meta: [{ hid: 'description', name: 'description', content: 'Estimate a fair platinum price for any Warframe riven by attribute combination, and grade every live listing against the field. Built from the live auction corpus.' }],
    }
  },
  computed: {
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.mobile
    },
    weaponOptions(): any[] {
      return (this.weapons as any[])
        .filter((w) => (w.auctionCount || 0) > 0)
        .map((w) => ({
          url_name: w.url_name,
          label: `${w.item_name} — ${w.auctionCount} live${w.disposition ? ' · disp ' + w.disposition.toFixed(2) : ''}`,
        }))
    },
    weaponItems(): any[] {
      const items = (this.weaponData && this.weaponData.items) || []
      return items.filter((a: any) => a && a.item && Array.isArray(a.item.attributes))
    },
    // stat url_name -> sorted positive values across the corpus (for percentiles)
    statValues(): Record<string, number[]> {
      const map: Record<string, number[]> = {}
      for (const a of this.weaponItems) {
        for (const at of a.item.attributes) {
          if (!at.positive) continue
          if (!map[at.url_name]) map[at.url_name] = []
          map[at.url_name].push(at.value)
        }
      }
      Object.keys(map).forEach((k) => map[k].sort((x, y) => x - y))
      return map
    },
    positiveOptions(): string[] {
      const set = new Set<string>()
      for (const a of this.weaponItems) for (const at of a.item.attributes) if (at.positive) set.add(at.url_name)
      return Array.from(set).sort((a, b) => this.attrLabel(a).localeCompare(this.attrLabel(b)))
    },
    negativeOptions(): string[] {
      const set = new Set<string>()
      for (const a of this.weaponItems) for (const at of a.item.attributes) if (!at.positive) set.add(at.url_name)
      return Array.from(set).sort((a, b) => this.attrLabel(a).localeCompare(this.attrLabel(b)))
    },
    estimate(): any {
      const pos = this.selectedPositives
      if (!pos.length) return { count: 0 }
      const hasAll = (a: any, needed: string[]) => {
        const names = a.item.attributes.filter((x: any) => x.positive).map((x: any) => x.url_name)
        return needed.every((n) => names.includes(n))
      }
      const hasNeg = (a: any) => {
        if (!this.selectedNegative) return true
        return a.item.attributes.some((x: any) => !x.positive && x.url_name === this.selectedNegative)
      }
      const priced = this.weaponItems.filter((a: any) => a.buyout_price > 0)
      let matches = priced.filter((a: any) => hasAll(a, pos) && hasNeg(a))
      let approx = false
      // Relax to (n-1) positives if too few exact comparables.
      if (matches.length < 3 && pos.length > 1) {
        approx = true
        matches = priced.filter((a: any) => {
          const names = a.item.attributes.filter((x: any) => x.positive).map((x: any) => x.url_name)
          const overlap = pos.filter((n) => names.includes(n)).length
          return overlap >= pos.length - 1 && hasNeg(a)
        })
      }
      if (!matches.length) return { count: 0 }
      const prices = matches.map((a: any) => a.buyout_price).sort((a: number, b: number) => a - b)
      return {
        count: prices.length,
        approx,
        p25: this.percentile(prices, 25),
        median: this.percentile(prices, 50),
        p75: this.percentile(prices, 75),
        cheapest: prices[0],
      }
    },
    gradedAuctions(): any[] {
      const median = this.estimate.count ? this.estimate.median : 0
      return this.weaponItems
        .filter((a: any) => a.buyout_price > 0)
        .slice()
        .sort((a: any, b: any) => a.buyout_price - b.buyout_price)
        .map((a: any) => ({ ...a, _deal: median > 0 && a.buyout_price < median * 0.9 }))
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.gradedAuctions.length / this.perPage))
    },
    pagedAuctions(): any[] {
      const start = (this.page - 1) * this.perPage
      return this.gradedAuctions.slice(start, start + this.perPage)
    },
  },
  watch: {
    gradedAuctions() {
      this.page = 1
    },
  },
  mounted() {
    this.finishLoading()
  },
  methods: {
    async onWeaponChange(urlName: string) {
      this.selectedPositives = []
      this.selectedNegative = ''
      this.weaponData = null
      if (!urlName) return
      this.loadingWeapon = true
      try {
        const cfg = (this as any).$config
        const data = await (this as any).$axios.get(`${cfg.apiURL}/riven_value/${urlName}`).then((res: any) => res.data)
        this.weaponData = data || { url_name: urlName, items: [] }
      } catch (e) {
        this.weaponData = { url_name: urlName, items: [] }
      } finally {
        this.loadingWeapon = false
      }
    },
    togglePositive(opt: string) {
      const i = this.selectedPositives.indexOf(opt)
      if (i >= 0) this.selectedPositives.splice(i, 1)
      else this.selectedPositives.push(opt)
    },
    positives(a: any): any[] {
      return a.item.attributes.filter((x: any) => x.positive)
    },
    negatives(a: any): any[] {
      return a.item.attributes.filter((x: any) => !x.positive)
    },
    attrLabel(urlName: string): string {
      return (urlName || '')
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .replace(/\bDamage\b/, 'Dmg')
    },
    percentile(sortedAsc: number[], p: number): number {
      if (!sortedAsc.length) return 0
      const idx = (p / 100) * (sortedAsc.length - 1)
      const lo = Math.floor(idx)
      const hi = Math.ceil(idx)
      if (lo === hi) return Math.round(sortedAsc[lo])
      const frac = idx - lo
      return Math.round(sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac)
    },
    // Percentile of a value within the corpus values for its stat (0..1).
    statPercentile(urlName: string, value: number): number {
      const vals = this.statValues[urlName]
      if (!vals || vals.length < 2) return 0.5
      let below = 0
      for (const v of vals) if (v <= value) below++
      return below / vals.length
    },
    grade(a: any): { letter: string; cls: string } {
      const pos = this.positives(a)
      if (!pos.length) return { letter: '—', cls: 'rv-grade--f' }
      let sum = 0
      for (const at of pos) sum += this.statPercentile(at.url_name, at.value)
      const score = sum / pos.length // 0..1
      // A god roll = high-value positives (and, loosely, fewer/curated stats).
      if (score >= 0.85) return { letter: 'S', cls: 'rv-grade--s' }
      if (score >= 0.7) return { letter: 'A', cls: 'rv-grade--a' }
      if (score >= 0.5) return { letter: 'B', cls: 'rv-grade--b' }
      if (score >= 0.3) return { letter: 'C', cls: 'rv-grade--c' }
      if (score >= 0.15) return { letter: 'D', cls: 'rv-grade--d' }
      return { letter: 'F', cls: 'rv-grade--f' }
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

<style scoped>
.rv-meta {
  display: flex;
  align-items: center;
  gap: 8px 14px;
  flex-wrap: wrap;
  color: #eef0f6;
}
.rv-meta__lbl {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #9aa0b4;
}
.rv-meta__val {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #d4af5a;
}
.rv-estimator {
  padding: 8px 24px 20px;
}
.rv-panel__title {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.82rem;
  color: #4fb3bf;
  font-weight: 700;
  margin: 10px 0 12px;
}
.rv-group {
  margin-bottom: 14px;
}
.rv-group__lbl {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}
.rv-pos {
  color: #4caf7d;
}
.rv-neg {
  color: #e57373;
}
.rv-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.rv-chip {
  background: rgba(255, 255, 255, 0.05);
  color: #cfd3e0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.rv-chip:hover {
  background: rgba(255, 255, 255, 0.1);
}
.rv-chip--on {
  background: #4caf7d !important;
  color: #10241a !important;
  border-color: #4caf7d !important;
}
.rv-chip--neg.rv-chip--on {
  background: #e57373 !important;
  color: #2a0f0f !important;
  border-color: #e57373 !important;
}
.rv-estimate {
  margin-top: 16px;
  background: rgba(212, 175, 90, 0.06);
  border: 1px solid rgba(212, 175, 90, 0.35);
  border-radius: 12px;
  padding: 16px 20px;
}
.rv-estimate__main {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}
.rv-estimate__num {
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  color: #d4af5a;
  font-variant-numeric: tabular-nums;
}
.rv-estimate__num span {
  font-size: 1.1rem;
  opacity: 0.7;
}
.rv-estimate__lbl {
  color: #cfd3e0;
  font-weight: 600;
}
.rv-estimate__note {
  display: block;
  color: #9aa0b4;
  font-weight: 400;
  font-size: 0.78rem;
  margin-top: 2px;
}
.rv-estimate__cheapest {
  margin-top: 10px;
  color: #cfd3e0;
  font-size: 0.9rem;
}
.rv-deal {
  color: #4caf7d;
  font-weight: 700;
  margin-left: 6px;
}
.rv-estimate__empty {
  color: #9aa0b4;
}
.rv-listhead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 24px 0;
  flex-wrap: wrap;
  gap: 8px;
}
.rv-attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.rv-attr {
  font-size: 0.74rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.rv-attr--pos {
  background: rgba(76, 175, 125, 0.16);
  color: #74d3a3;
}
.rv-attr--neg {
  background: rgba(229, 115, 115, 0.16);
  color: #ef9a9a;
}
.rv-grade {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 7px;
  font-weight: 800;
  font-size: 0.9rem;
}
.rv-grade--lg {
  min-width: 40px;
  height: 40px;
  font-size: 1.2rem;
}
.rv-grade--s { background: #d4af5a; color: #17131f; }
.rv-grade--a { background: rgba(76, 175, 125, 0.9); color: #10241a; }
.rv-grade--b { background: rgba(79, 179, 191, 0.85); color: #08222a; }
.rv-grade--c { background: rgba(255, 255, 255, 0.14); color: #cfd3e0; }
.rv-grade--d { background: rgba(224, 164, 88, 0.2); color: #e0a458; }
.rv-grade--f { background: rgba(229, 115, 115, 0.2); color: #e57373; }
.rv-status {
  text-transform: capitalize;
  font-weight: 700;
  font-size: 0.8rem;
}
.rv-status--ingame { color: #4caf7d; }
.rv-status--online { color: #4fb3bf; }
.rv-status--offline { color: #9aa0b4; }
.rv-table .col-name {
  min-width: 220px;
}
</style>
