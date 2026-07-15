<template>
  <div class="mt-md-4">
    <div class="my-4">
      <h1 style="display: none"></h1>
      <client-only>
        <v-data-table
          show-select
          return-object
          item-value="url_name"
          v-model="selectedItems"
          :multi-sort="multiSort"
          v-model:sort-by="sortBy"
          :row-props="rowProps"
          :headers="headers"
          :items="all_items"
          :items-per-page="50"
          :items-per-page-options="[10, 20, 30, 40, 50]"
          class="elevation-1 money_table"
          @update:page="onPageUpdate"
        >
          <template #top>
            <div>
              <div
                v-show="hasScroll"
                id="wrapper2"
                ref="wrapper2"
                class="scroll-style-1"
              >
                <div
                  id="div2"
                  :style="{ width: scrollWidth }"
                  class="width-scroll"
                ></div>
              </div>
            </div>
            <v-theme-provider theme="dark" with-background>
              <div class="filter-container pa-3 text-white">
                <form
                  id="form_warframe"
                  class="d-flex align-center flex-wrap"
                  @submit.prevent="filter"
                >
                  <v-text-field
                    v-model="min_volume"
                    type="number"
                    class="filter-input mr-2"
                    label="Min Volume"
                    hide-details
                    density="compact"
                  ></v-text-field>
                  <v-select
                    v-model="selection"
                    label="Select"
                    class="filter-input mr-2"
                    :items="[
                      'All',
                      'Warframe',
                      'Arcane',
                      'Weapon',
                      'Sentinel',
                      'Imprint',
                      'Mod',
                      'Relic',
                    ]"
                    hide-details
                    density="compact"
                  ></v-select>
                  <v-combobox
                    v-model="search"
                    label="Search"
                    class="filter-input mr-2"
                    :items="allItems.map((el) => el.item_name)"
                    hide-details
                    density="compact"
                  ></v-combobox>
                  <v-btn type="submit" color="primary" class="mr-2 my-1"> Search </v-btn>
                  <v-btn color="primary" @click.prevent="reset" class="my-1">
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                </form>

                <!-- Advanced Filters Section -->
                <v-expansion-panels class="mt-2 mb-2" flat>
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      Advanced Filters (Tags & Logic)
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row dense>
                        <v-col cols="12" md="4">
                          <v-autocomplete
                            v-model="includedTags"
                            :items="availableTags"
                            item-title="text"
                            item-value="value"
                            label="Include Tags"
                            multiple
                            chips
                            closable-chips
                            density="compact"
                            hide-details
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-radio-group v-model="tagLogic" inline density="compact" hide-details class="mt-0">
                            <v-radio label="AND" value="AND"></v-radio>
                            <v-radio label="OR" value="OR"></v-radio>
                          </v-radio-group>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-autocomplete
                            v-model="excludedTags"
                            :items="availableTags"
                            item-title="text"
                            item-value="value"
                            label="Exclude Tags (NOT)"
                            multiple
                            chips
                            closable-chips
                            density="compact"
                            hide-details
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="12" md="2" class="d-flex align-center justify-end">
                          <v-btn
                            size="small"
                            color="error"
                            @click="clearTags"
                            :disabled="includedTags.length === 0 && excludedTags.length === 0"
                          >
                            Clear Tags
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!-- Comparison Action -->
                <div v-if="selectedItems.length > 0" class="d-flex align-center my-2 pa-2 bg-blue-darken-4 rounded">
                  <span class="text-white mr-4">{{ selectedItems.length }} items selected</span>
                  <v-btn size="small" color="white" @click="compareDialog = true">
                    Compare Selected
                  </v-btn>
                  <v-btn icon size="small" variant="text" color="white" class="ml-2" @click="selectedItems = []">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>

                <div class="d-flex">
                  <v-checkbox
                    v-model="avgPrice"
                    label="Average Prices (top 5 orders)"
                    class="mr-4"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="multiSort"
                    label="Multi-Sort (click several column headers)"
                  ></v-checkbox>
                </div>
              </div>
            </v-theme-provider>
          </template>
          <template #item.item_name="{ item }">
            <div class="d-flex justify-start align-center py-3">
              <img
                class="mr-3"
                width="50px"
                :src="'https://warframe.market/static/assets/' + item.thumb"
              />
              <div>
                <a
                  class="no_link"
                  target="_blank"
                  :href="'https://warframe.market/items/' + item.url_name"
                >
                  {{ item.item_name }}</a
                >
                <br />
                <v-btn
                  v-if="item.set && item.item_name.includes(' Set')"
                  size="small"
                  color="primary"
                  class="mt-1"
                  :to="'/set/' + item.url_name"
                  >Set vs Parts</v-btn
                >
                <v-btn
                  v-if="item.tags.includes('relic')"
                  size="small"
                  color="primary"
                  class="mt-1"
                  :to="'/relic/' + item.url_name"
                  >Relic calculator</v-btn
                >
              </div>
            </div>
          </template>
          <template #item.thumb="{ item }"> </template>
          <template #item.market.buyAvg="{ item }">
            {{ fixPrice(item.market.buyAvg) }}
          </template>
          <template #item.market.sellAvg="{ item }">
            {{ fixPrice(item.market.sellAvg) }}
          </template>
          <!-- New Column Template -->
          <template #item.market.avg_price="{ item }">
             {{ fixPrice(item.market.avg_price) }}
          </template>
          <template #item.market.last_completed="{ item }">
            <LastTransactionCell
              :last-completed="item.market.last_completed"
              :show-icon="true"
              @click="openTransactionDetails(item)"
            />
          </template>
          <template #item.priceUpdate="{ item }">
            {{ fixDate(item.priceUpdate) }}
          </template>
          <template #item.tags="{ item }">
            <div class="d-flex flex-wrap tag-cell">
              <v-chip
                v-for="(tag, index) in item.tags"
                :key="index"
                size="small"
                @click.stop="addTagToFilter(tag)"
                style="cursor: pointer"
                :color="includedTags.includes(tag) ? 'primary' : undefined"
              >
                {{ formatTag(tag) }}
              </v-chip>
            </div>
          </template>
          <template #item.drops="{ item }">
            <v-btn
              size="small"
              variant="text"
              color="primary"
              class="px-2"
              @click="openDrops(item)"
            >
              Drops
            </v-btn>
          </template>
        </v-data-table>
      </client-only>

      <!-- Comparison Dialog -->
      <ItemComparison
        v-model="compareDialog"
        :items="selectedItems"
        :headers="headers"
      />

      <!-- Drop Locations Dialog -->
      <DropLocationsDialog
        v-model="dropDialog"
        :item-name="dropItemName"
        :thumb="dropThumb"
      />

      <!-- Transaction Details Dialog -->
      <v-dialog v-model="transactionDialog" max-width="500">
        <v-card v-if="selectedTransactionItem">
          <v-card-title class="text-h6 bg-grey-lighten-2">
            Latest 48h Trade Data
          </v-card-title>
          <v-card-text class="pt-4">
            <h3 class="mb-2">{{ selectedTransactionItem.item_name }}</h3>
            <PriceHistoryChart
              class="mb-4"
              :points="priceHistoryPoints"
              :trend="priceHistoryTrend"
            />
            <TradeMessageButtons
              class="mb-4"
              :item-name="selectedTransactionItem.item_name"
              :sell-price="selectedTransactionItem.market.sell"
              :buy-price="selectedTransactionItem.market.buy"
            />
            <div v-if="selectedTransactionItem.market.last_completed">
               <v-table density="compact">
                 <template #default>
                   <tbody>
                     <tr>
                       <td><strong>Date</strong></td>
                       <td>{{ new Date(selectedTransactionItem.market.last_completed.datetime).toLocaleString() }}</td>
                     </tr>
                     <tr>
                       <td><strong>Volume</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.volume }}</td>
                     </tr>
                     <tr>
                       <td><strong>Avg Price</strong></td>
                       <td>{{ fixPrice(selectedTransactionItem.market.last_completed.avg_price) }}</td>
                     </tr>
                     <tr>
                       <td><strong>Min Price</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.min_price }}</td>
                     </tr>
                     <tr>
                       <td><strong>Max Price</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.max_price }}</td>
                     </tr>
                     <tr>
                       <td><strong>Open Price</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.open_price }}</td>
                     </tr>
                     <tr>
                       <td><strong>Closed Price</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.closed_price }}</td>
                     </tr>
                   </tbody>
                 </template>
               </v-table>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="transactionDialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <div class="px-0 pt-3">
        <div>
          <div
            class="d-flex flex-wrap align-center top_container justify-space-between mb-md-4"
          >
            <div
              class="my-3 mb-0 md-md-3 bg-grey-darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container"
            >
              <div class="d-flex mt-2 align-center">
                <div class="text-white mr-3">Help us donating!</div>
                <a
                  target="_blank"
                  aria-label="Donar con Paypal"
                  class="text-white d-flex mr-4 align-center justify-content-left donation_logo"
                  href="https://ko-fi.com/cambio_uruguay"
                >
                  <picture>
                    <source srcset="/img/paypal_icon.webp" type="image/webp" />
                    <img src="/img/paypal_icon.png" alt="PayPal" width="50" height="50" class="donation_icon" />
                  </picture>
                </a>
                <a
                  aria-label="Donar con Mercado Pago"
                  class="text-white d-flex align-center justify-content-left donation_logo"
                  target="_blank"
                  href="https://mpago.la/19j46vX"
                >
                  <picture>
                    <source srcset="/img/mercadopago_icon.webp" type="image/webp" />
                    <img src="/img/mercadopago_icon.png" alt="Mercado Pago" width="50" height="50" class="donation_icon" />
                  </picture>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Request -->
    <v-alert
      color="#ff4500"
      icon="mdi-reddit"
      prominent
      class="mt-4 mb-3"
    >
      <div class="d-flex align-center justify-space-between flex-wrap">
        <div>
          <h3 class="text-h6 font-weight-bold">We need your feedback!</h3>
          <div>Help us improve by sharing your thoughts and reviews on our Reddit thread. That will help us a lot!</div>
        </div>
        <v-btn
          href="https://www.reddit.com/r/Warframe/comments/1nnvsep/my_warframe_market_analytics_app_looking_for/"
          target="_blank"
          color="white"
          class="mt-2 mt-sm-0 ml-sm-4"
        >
          <v-icon start color="#ff4500">mdi-reddit</v-icon>
          Join Discussion
        </v-btn>
      </div>
    </v-alert>

    <!-- Open Source Project Information -->
    <v-card class="mt-4 mb-3" color="#2c2c54">
      <v-card-text class="text-center">
        <div class="d-flex align-center justify-center mb-3">
          <v-icon size="large" class="mr-3" color="white">mdi-open-source-initiative</v-icon>
          <h3>{{ t('open_source_project') }}</h3>
        </div>
        <p class="mb-3">{{ t('github_description') }}</p>
        <div class="d-flex flex-wrap justify-center gap-2">
          <GitHubButton text="View Source Code" />
        </div>
      </v-card-text>
    </v-card>

    <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4" type="info" density="compact">
      {{ t('disclaimer') }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGoTo } from 'vuetify'

dayjs.extend(relativeTime)

const config = useRuntimeConfig()
const base = config.public.apiURL
const { t } = useI18n()
const goTo = useGoTo()

// SEO head — old this.$nuxtI18nHead({ addSeoAttributes: true }).
// @nuxtjs/i18n v9 renamed the option key `addSeoAttributes` -> `seo`.
useHead(useLocaleHead({ seo: true }))

const items = useItemsStore()
const allItems = computed<any[]>(() => items.allItems)

const all_items = ref<any[]>([])
const min_volume = ref(0)
const search = ref('')
const avgPrice = ref(false)
const selection = ref('All')
const hasScroll = ref(false)
const scrollWidth = ref<string | number>(0)
const includedTags = ref<string[]>([])
const excludedTags = ref<string[]>([])
const tagLogic = ref('AND')
const selectedItems = ref<any[]>([])
const compareDialog = ref(false)
// Vuetify 3 merges sort-by + sort-desc into ONE model of { key, order } objects.
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([
  { key: 'market.volume', order: 'desc' },
])
const multiSort = ref(false)
const transactionDialog = ref(false)
const selectedTransactionItem = ref<any>(null)
const priceHistoryPoints = ref<any[]>([])
const priceHistoryTrend = ref<any>(null)
const priceHistoryLoading = ref(false)

// Drop-locations dialog (Star Chart drops) — replaces the old plain external link.
const dropDialog = ref(false)
const dropItemName = ref('')
const dropThumb = ref('')

// template ref (was this.$refs.wrapper2)
const wrapper2 = ref<HTMLElement | null>(null)

// Nav-leak guards: without these, ~a minute of client-side navigation stacked
// dozens of retained page components (resize + beforeinstallprompt listeners)
// and froze the tab.
let destroyed = false
let scrollRetries = 0
let resizeAdded = false
let scrollSync: { wrapper1: any; w2: any; wp1: any; wp2: any } | null = null

const availableTags = computed(() => {
  const tags = new Set<string>()
  allItems.value.forEach((item: any) => {
    if (item.tags) item.tags.forEach((tag: string) => tags.add(tag))
  })
  // item-title reads `text`, item-value matches `value`
  return Array.from(tags)
    .sort()
    .map((tag) => ({
      text: formatTag(tag),
      value: tag,
    }))
})

const headers = computed(() => {
  const toReturn: any[] = [
    { title: 'Name', key: 'item_name', width: 'auto' },
    { title: 'Buy (live listing)', key: 'market.buy', width: 'auto' },
    { title: 'Sell (live listing)', key: 'market.sell', width: 'auto' },
    { title: 'Avg Sold (48h)', key: 'market.avg_price', width: 'auto' },
    {
      title: 'Latest 48h Trades',
      key: 'market.last_completed',
      width: 'auto',
      sort: (a: any, b: any) => {
        const priceA = a ? a.avg_price : -1
        const priceB = b ? b.avg_price : -1
        return priceA - priceB
      },
    },
    { title: 'Diff', key: 'market.diff', width: 'auto' },
    { title: 'Volume (Last 48hrs)', key: 'market.volume', width: 'auto' },
    { title: 'Tags', key: 'tags' },
    { title: 'Updated', key: 'priceUpdate' },
    { title: 'Drops', key: 'drops' },
  ]
  if (avgPrice.value) {
    toReturn[1] = { title: 'Buy (live avg)', key: 'market.buyAvg', width: 'auto' }
    toReturn[2] = { title: 'Sell (live avg)', key: 'market.sellAvg', width: 'auto' }
  }
  return toReturn
})

watch(includedTags, () => filter())
watch(excludedTags, () => filter())
watch(tagLogic, () => filter())

watch(avgPrice, (val) => {
  // Keep the active sort keys pointing at whichever Buy/Sell columns
  // `headers` is now emitting, without changing the sort array length.
  sortBy.value = sortBy.value.map((s) => {
    const key = s.key
    let next = key
    if (val) {
      if (key === 'market.buy') next = 'market.buyAvg'
      else if (key === 'market.sell') next = 'market.sellAvg'
    } else {
      if (key === 'market.buyAvg') next = 'market.buy'
      else if (key === 'market.sellAvg') next = 'market.sell'
    }
    return { ...s, key: next }
  })
})

watch(multiSort, (val) => {
  if (!val && sortBy.value.length > 1) {
    sortBy.value = sortBy.value.slice(0, 1)
  }
})

async function openTransactionDetails(item: any) {
  selectedTransactionItem.value = item
  transactionDialog.value = true
  priceHistoryPoints.value = []
  priceHistoryTrend.value = null
  if (!item.url_name) return
  priceHistoryLoading.value = true
  try {
    const data: any = await $fetch(`${base}/price_history/${item.url_name}`)
    priceHistoryPoints.value = data.points || []
    priceHistoryTrend.value = data.trend || null
  } catch (e) {
    // Non-fatal: the dialog still shows the existing 48h table below
    priceHistoryPoints.value = []
  } finally {
    priceHistoryLoading.value = false
  }
}

function openDrops(item: any) {
  dropItemName.value = item.item_name
  dropThumb.value = item.thumb || ''
  dropDialog.value = true
}

function fixPrice(price: number) {
  if (!price) return 0
  return Math.round(price * 100) / 100
}

function formatTag(tag: string) {
  if (!tag) return ''
  return tag
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function fixDate(date: any) {
  return dayjs(date).fromNow()
}

function addTagToFilter(tag: string) {
  if (includedTags.value.includes(tag)) {
    includedTags.value = includedTags.value.filter((tt) => tt !== tag)
  } else {
    includedTags.value.push(tag)
  }
  filter()
}

function clearTags() {
  includedTags.value = []
  excludedTags.value = []
  tagLogic.value = 'AND'
}

function reset() {
  selection.value = 'All'
  search.value = ''
  min_volume.value = 0
  includedTags.value = []
  excludedTags.value = []
  tagLogic.value = 'AND'
  selectedItems.value = []
  all_items.value = allItems.value
}

function filterSelect(el: any) {
  const sel = selection.value
  let val = true
  switch (sel) {
    case 'Warframe':
      val =
        el.set === true &&
        el.item_name.includes(' Set') &&
        (el.tags.includes('component') || el.tags.includes('blueprint')) &&
        el.tags.includes('warframe')
      break
    case 'Arcane':
      val = el.tags.includes('arcane_enhancement')
      break
    case 'Weapon':
      val =
        (el.set === true &&
          el.item_name.includes(' Set') &&
          el.tags.includes('weapon')) ||
        (el.tags.includes('weapon') &&
          el.tags.length === 2 &&
          !el.tags.includes('component'))
      break
    case 'Sentinel':
      val = el.tags.includes('sentinel') && el.item_name.includes(' Set')
      break
    case 'Imprint':
      val = el.item_name.includes('Imprint')
      break
    case 'Mod':
      val = el.tags.includes('mod')
      break
    case 'Relic':
      val = el.tags.includes('relic')
      break
    default:
      break
  }
  return val
}

function filter() {
  all_items.value = allItems.value.filter((el: any) => {
    // Basic filters
    const basicMatch =
      el.market.volume >= min_volume.value &&
      filterSelect(el) &&
      (!search.value ||
        el.item_name.toLowerCase().includes(search.value.toLowerCase()))

    if (!basicMatch) return false

    // Advanced Tag Logic
    const itemTags = el.tags || []

    // Exclude Logic (NOT)
    if (excludedTags.value.length > 0) {
      if (excludedTags.value.some((tag) => itemTags.includes(tag))) return false
    }

    // Include Logic (AND / OR)
    if (includedTags.value.length > 0) {
      if (tagLogic.value === 'AND') {
        if (!includedTags.value.every((tag) => itemTags.includes(tag)))
          return false
      } else {
        if (!includedTags.value.some((tag) => itemTags.includes(tag)))
          return false
      }
    }

    return true
  })
}

function row_classes(item: any) {
  if (item.isInterBank) return 'bg-purple-darken-4'
  if (item.condition) return 'bg-grey-darken-3'
  return ''
}

// Vuetify 3 replaces :item-class with :row-props
function rowProps({ item }: { item: any }) {
  return { class: row_classes(item) }
}

function onPageUpdate() {
  goTo('.money_table')
}

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

// Named so onBeforeUnmount can remove it — an anonymous {once:true} resize
// listener re-added on every call piled up retaining destroyed page components.
function onResize() {
  if (!destroyed) setScrollBar()
}

function teardownScroll() {
  if (scrollSync) {
    scrollSync.wrapper1 &&
      scrollSync.wrapper1.removeEventListener('scroll', scrollSync.wp1)
    scrollSync.w2 && scrollSync.w2.removeEventListener('scroll', scrollSync.wp2)
    scrollSync = null
  }
}

function setScrollBar() {
  if (destroyed) return
  // Drop any scroll-sync listeners from a previous run so they can't stack.
  teardownScroll()
  const tableWrapper = document.querySelector(
    '.money_table .v-table__wrapper',
  ) as HTMLElement | null
  if (!tableWrapper) {
    // Table renders async (client-only). Retry a BOUNDED number of times — the
    // old unbounded nextTick recursion could spin forever on a destroyed page.
    if (++scrollRetries > 40) return
    nextTick(() => {
      if (!destroyed) setScrollBar()
    })
    return
  }
  scrollRetries = 0
  // Check if resolution is mobile.
  const isMobile = document.querySelector('.money_table.v-data-table--mobile')
  hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
  if (hasScroll.value && !isMobile) {
    const wrapper1: any = document.querySelector(
      '.money_table .v-table__wrapper',
    )
    const w2: any = wrapper2.value
    if (!w2 || !wrapper1) {
      if (++scrollRetries > 40) return
      nextTick(() => {
        if (!destroyed) setScrollBar()
      })
      return
    }

    const table = document.querySelector('.money_table table') as HTMLElement

    scrollWidth.value = table.clientWidth + 10 + 'px'

    let scrolling = false
    const wp1 = () => {
      if (scrolling) {
        scrolling = false
        return
      }
      scrolling = true
      w2.scrollLeft = wrapper1.scrollLeft
    }

    const wp2 = () => {
      if (scrolling) {
        scrolling = false
        return
      }
      scrolling = true
      wrapper1.scrollLeft = w2.scrollLeft
    }

    wrapper1.addEventListener('scroll', wp1)
    w2.addEventListener('scroll', wp2)
    scrollSync = { wrapper1, w2, wp1, wp2 }
  }

  // ONE persistent resize handler, added once and removed on unmount.
  if (!resizeAdded) {
    resizeAdded = true
    window.addEventListener('resize', onResize)
  }
}

onMounted(() => {
  ;(window as any).startLoading = () => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'flex'
  }
  ;(window as any).stopLoading = () => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
  }
  try {
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      ;(window as any).deferredPrompt = null
      // Named handler so onBeforeUnmount can remove it — an anonymous listener
      // re-added on every visit leaked a component per navigation.
      window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  } catch (e) {
    console.error(e)
  }
  all_items.value = allItems.value
  finishLoading()
  setScrollBar()
})

function onBeforeInstallPrompt(e: any) {
  ;(window as any).deferredPrompt = e
}

onBeforeUnmount(() => {
  // Remove every window/element listener this page registered — without this,
  // client-side navigation stacked retained page components and froze the tab.
  destroyed = true
  window.removeEventListener('resize', onResize)
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  teardownScroll()
})
</script>

<style scoped>
.donation_icon {
  display: block;
  width: 50px;
  height: 50px;
  object-fit: contain;
}
.filter-container {
  background: #1f1f2f;
}
.filter-input {
  min-width: 200px;
  flex: 1 1 auto;
}
.clickable-tag {
  cursor: pointer;
}
.tag-cell {
  gap: 4px;
  padding: 4px 0;
}
</style>
