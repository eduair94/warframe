<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Warframe Market · Set vs Parts</div>
            <h1 class="an-title">
              Buy the <span class="accent-a">set</span>, or the
              <span class="accent-b">parts</span>?
            </h1>
            <p class="an-lede">
              Warframe.market lists set prices and part prices separately — never
              the decision. This is the decision: acquire the assembled set, or buy
              each part and combine. Which is cheaper right now, and by how much.
            </p>
          </div>
          <div v-if="topDeal" class="an-hero__deal">
            <div class="an-hero__deal-label">Biggest saving right now</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(topDeal.acquire.save) }}<span>p</span></div>
            <NuxtLink class="an-hero__deal-name" :to="'/set/' + topDeal.url_name">
              {{ topDeal.item_name.replace(' Set', '') }} →
            </NuxtLink>
            <div class="an-hero__deal-sub">
              buying by parts ({{ fmtPct(topDeal.acquire.savePct) }})
            </div>
          </div>
        </header>

        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ stats.total }}</div>
            <div class="an-stat__lbl">sets compared</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ stats.partsCheaper }}</div>
            <div class="an-stat__lbl">cheaper by parts</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">{{ stats.setCheaper }}</div>
            <div class="an-stat__lbl">cheaper as a set</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-good">{{ fmtPct(stats.avgSavePct) }}</div>
            <div class="an-stat__lbl">avg parts saving</div>
          </div>
        </div>

        <section class="an-filters">
          <div class="an-filters__row">
            <v-text-field
              v-model="search"
              density="compact"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              label="Search a set"
              class="an-search"
            ></v-text-field>
            <v-text-field
              v-model.number="minVolume"
              density="compact"
              hide-details
              type="number"
              min="0"
              label="Min volume (48h)"
              class="an-field"
            ></v-text-field>
            <v-select
              v-model="sortKey"
              :items="sortOptions"
              density="compact"
              hide-details
              label="Sort by"
              class="an-field"
              style="flex: 0 1 220px"
            ></v-select>
          </div>

          <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
            <v-chip
              v-for="cat in categoryOptions"
              :key="cat"
              :value="cat"
              size="small"
            >
              {{ cat }}
            </v-chip>
          </v-chip-group>

          <div class="an-toggles">
            <v-switch
              v-model="onlyPartsCheaper"
              density="compact"
              hide-details
              inset
              color="#35d6d0"
              label="Only where parts are cheaper to buy"
            ></v-switch>
            <v-switch
              v-model="onlyResellHigher"
              density="compact"
              hide-details
              inset
              color="#c8a85c"
              label="Only where parts resell for more"
            ></v-switch>
          </div>
          <div class="an-count">
            {{ filtered.length }} {{ filtered.length === 1 ? 'set' : 'sets' }} match
          </div>
        </section>

        <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
          Couldn't load comparison data. The market service may be waking up — try a refresh.
        </v-alert>
        <div v-else-if="!filtered.length" class="an-empty">
          No sets match these filters. Widen the search or reset the category.
        </div>

        <div v-else-if="!mobile" class="an-tablewrap">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Set</th>
                <th class="col-grp grp-a" colspan="3">Cost to acquire</th>
                <th class="col-grp grp-b" colspan="3">Resale value</th>
                <th>Vol</th>
                <th></th>
              </tr>
              <tr class="an-table__subhead">
                <th></th>
                <th class="grp-a">Set</th>
                <th class="grp-a">Parts</th>
                <th class="grp-a">Verdict</th>
                <th class="grp-b">Set</th>
                <th class="grp-b">Parts</th>
                <th class="grp-b">Δ</th>
                <th></th>
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
                  <NuxtLink class="an-name" :to="'/set/' + row.url_name">
                    <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
                    <span>
                      {{ row.item_name.replace(' Set', '') }}
                      <span v-if="row.url_name === topDealUrl" class="an-badge">BEST</span>
                      <small class="an-sub">
                        {{ row.partsCount }} parts
                        <span v-if="row.missingParts" class="an-warn">· {{ row.missingParts }} unpriced</span>
                      </small>
                    </span>
                  </NuxtLink>
                </td>
                <td class="grp-a an-num">{{ fmtPlat(row.acquire.setCost) }}p</td>
                <td class="grp-a an-num an-strong">{{ fmtPlat(row.acquire.partsCost) }}p</td>
                <td class="grp-a">
                  <span class="pill" :class="verdict(row).cls">
                    {{ verdict(row).label }}
                    <b v-if="verdict(row).amount">{{ verdict(row).amount }}</b>
                  </span>
                </td>
                <td class="grp-b an-num">{{ fmtPlat(row.resale.setValue) }}p</td>
                <td class="grp-b an-num">{{ fmtPlat(row.resale.partsValue) }}p</td>
                <td class="grp-b an-num" :class="deltaCls(row.resale.extra)">{{ signed(row.resale.extra) }}p</td>
                <td class="an-num">{{ fmtPlat(row.set.volume) }}</td>
                <td>
                  <v-btn icon size="small" color="#35d6d0" :to="'/set/' + row.url_name" :aria-label="'View ' + row.item_name + ' parts'">
                    <v-icon>mdi-arrow-right-circle</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="an-cards">
          <NuxtLink
            v-for="row in paged"
            :key="row.url_name"
            class="an-card"
            :class="{ 'is-top': row.url_name === topDealUrl }"
            :to="'/set/' + row.url_name"
          >
            <div class="an-card__head">
              <img class="an-thumb" :src="assetUrl(row.thumb)" :alt="row.item_name" loading="lazy" @error="onImgError" />
              <div class="an-card__title">
                <div class="an-card__name">
                  {{ row.item_name.replace(' Set', '') }}
                  <span v-if="row.url_name === topDealUrl" class="an-badge">BEST</span>
                </div>
                <small class="an-sub">
                  {{ row.partsCount }} parts
                  <span v-if="row.missingParts" class="an-warn">· {{ row.missingParts }} unpriced</span>
                  · vol {{ fmtPlat(row.set.volume) }}
                </small>
              </div>
              <v-icon color="#35d6d0">mdi-chevron-right</v-icon>
            </div>
            <div class="an-card__verdict">
              <span class="pill" :class="verdict(row).cls">
                {{ verdict(row).label }}
                <b v-if="verdict(row).amount">{{ verdict(row).amount }}</b>
              </span>
            </div>
            <div class="an-card__blocks">
              <div class="an-block">
                <div class="an-block__lbl">Cost to acquire</div>
                <div class="an-block__row"><span>Set</span><b>{{ fmtPlat(row.acquire.setCost) }}p</b></div>
                <div class="an-block__row"><span>Parts</span><b>{{ fmtPlat(row.acquire.partsCost) }}p</b></div>
              </div>
              <div class="an-block">
                <div class="an-block__lbl">Resale value</div>
                <div class="an-block__row"><span>Set</span><b>{{ fmtPlat(row.resale.setValue) }}p</b></div>
                <div class="an-block__row">
                  <span>Parts</span>
                  <b :class="deltaCls(row.resale.extra)">{{ fmtPlat(row.resale.partsValue) }}p ({{ signed(row.resale.extra) }})</b>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <div v-if="filtered.length > perPage" class="an-pager">
          <v-pagination v-model="page" :length="pageCount" :total-visible="mobile ? 5 : 9" color="#c8a85c"></v-pagination>
        </div>
      </div>

      <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
        Prices are lowest sell orders (cost to buy) and highest buy orders (resale),
        pulled from Warframe Market. Trading tax and set bonuses aren't included.
      </v-alert>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const config = useRuntimeConfig()
const base = config.public.apiURL

const { data, error } = await useAsyncData('sets-comparison', () =>
  $fetch<{ sets: any[] }>(`${base}/sets_comparison`),
)
// preserve old try/catch -> loadError intent
const loadError = computed(() => !!error.value)
const sets = computed<any[]>(() => data.value?.sets || [])

const { mobile } = useDisplay()

const search = ref('')
const minVolume = ref(0)
const category = ref('All')
const sortKey = ref('dealPct')
const onlyPartsCheaper = ref(false)
const onlyResellHigher = ref(false)
const page = ref(1)
const perPage = 20

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

const sortOptions = [
  { title: 'Best parts deal (%)', value: 'dealPct' },
  { title: 'Biggest saving (plat)', value: 'dealPlat' },
  { title: 'Resale edge (parts)', value: 'resale' },
  { title: 'Volume', value: 'volume' },
  { title: 'Name (A–Z)', value: 'name' },
]

function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function categoryOf(tags: string[] = []): string {
  const t = (tags || []).map((x) => (x || '').toLowerCase())
  if (t.includes('warframe')) return 'Warframe'
  if (t.includes('primary')) return 'Primary'
  if (t.includes('secondary')) return 'Secondary'
  if (t.includes('melee')) return 'Melee'
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  if (t.includes('archwing')) return 'Archwing'
  return 'Other'
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmtPct(n: number): string {
  const v = Number(n) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
}
function signed(n: number): string {
  const v = Math.round(Number(n) || 0)
  return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`
}
function deltaCls(n: number): string {
  if (n > 0.5) return 'up'
  if (n < -0.5) return 'down'
  return 'flat'
}
function verdict(row: any): { label: string; amount: string; cls: string } {
  const save = row.acquire.save
  if (save > 0.5) {
    return {
      label: 'Buy parts',
      amount: `save ${fmtPlat(save)}p (${fmtPct(row.acquire.savePct)})`,
      cls: 'pill--good',
    }
  }
  if (save < -0.5) {
    return { label: 'Buy set', amount: `save ${fmtPlat(-save)}p`, cls: 'pill--alt' }
  }
  return { label: 'Even', amount: '', cls: 'pill--even' }
}

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of sets.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Archwing', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const list = sets.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if ((r.set.volume || 0) < minV) return false
    if (onlyPartsCheaper.value && r.acquire.save <= 0) return false
    if (onlyResellHigher.value && r.resale.extra <= 0) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    dealPct: (a, b) => dir(a.acquire.savePct, b.acquire.savePct),
    dealPlat: (a, b) => dir(a.acquire.save, b.acquire.save),
    resale: (a, b) => dir(a.resale.extra, b.resale.extra),
    volume: (a, b) => dir(a.set.volume || 0, b.set.volume || 0),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.dealPct)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of sets.value) {
    if (r.acquire.save > 0 && (!best || r.acquire.save > best.acquire.save)) best = r
  }
  return best
})
const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) {
    if (r.acquire.save > 0 && (!best || r.acquire.savePct > best.acquire.savePct)) best = r
  }
  return best ? best.url_name : ''
})
const stats = computed<any>(() => {
  const list = sets.value
  const partsCheaper = list.filter((r) => r.acquire.save > 0)
  const setCheaper = list.filter((r) => r.acquire.save < 0)
  const avgSavePct = partsCheaper.length
    ? partsCheaper.reduce((s, r) => s + r.acquire.savePct, 0) / partsCheaper.length
    : 0
  return { total: list.length, partsCheaper: partsCheaper.length, setCheaper: setCheaper.length, avgSavePct }
})

watch(filtered, () => {
  page.value = 1
})

// Hide the global loading spinner once mounted (project rule). Bounded retry:
// the #spinner-wrapper element is injected by the (not-yet-wired) LoadingBar
// component; if it never appears we stop after a few ticks instead of looping
// forever (the old Options-API version recursed unbounded).
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onMounted(() => {
  finishLoading()
})
</script>
