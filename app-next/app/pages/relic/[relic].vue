<template>
  <div class="mt-md-4">
    <div class="my-4">
      <h1 style="display: none"></h1>
      <ClientOnly>
        <v-data-table
          ref="dataTable"
          :hide-default-footer="true"
          :sort-by="sortBy"
          :row-props="rowProps"
          :headers="headers"
          :items="all_items"
          :items-per-page-options="[10, 20, 30, 40, 50]"
          :items-per-page="50"
          class="elevation-1 money_table"
          @update:page="goTo(dataTable)"
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
            <div>
              <div style="background: #1f1f2f" class="pa-3 text-white">
                <form
                  id="form_warframe"
                  class="d-flex align-center flex-wrap"
                  @submit.prevent="filter"
                >
                  <v-autocomplete
                    v-model="search"
                    label="Search"
                    style="max-width: 200px"
                    :items="allSets"
                    item-title="item_name"
                    item-value="url_name"
                  ></v-autocomplete>
                  <v-btn type="submit" color="primary"> Search </v-btn>
                  <v-btn color="primary" @click.prevent="reset">
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                </form>
              </div>
              <div>
                <v-alert density="compact">
                  You can sell this relic for <b>{{ priceRelic }}</b> or earn up
                  to <b>{{ maxEarn }}</b> platinum
                </v-alert>
              </div>
              <v-data-table
                :headers="headers"
                :hide-default-footer="true"
                :items="set"
                :items-per-page="50"
              >
                <template #item.item_name="{ item }">
                  <div class="d-flex justify-start align-center py-3">
                    <img
                      class="mr-3"
                      width="50px"
                      :src="
                        'https://warframe.market/static/assets/' + item.thumb
                      "
                    />
                    <a
                      class="no_link"
                      target="_blank"
                      :href="'https://warframe.market/items/' + item.url_name"
                    >
                      {{ item.item_name }}</a
                    >
                  </div>
                </template>
                <template #item.tags="{ item }">
                  <v-chip-group selected-class="text-primary" column>
                    <v-chip v-for="(tag, index) in item.tags" :key="index">
                      {{ tag }}
                    </v-chip>
                  </v-chip-group>
                </template>
                <template #item.drops="{ item }">
                  <button
                    type="button"
                    class="drops-btn"
                    @click="openDrops(item.item_name)"
                  >
                    <v-icon size="small">mdi-map-marker-radius-outline</v-icon>
                    Drops
                  </button>
                </template>
              </v-data-table>
            </div>
            <v-divider></v-divider>
          </template>
          <template #item.item_name="{ item }">
            <div class="d-flex justify-start align-center py-3">
              <img
                class="mr-3"
                width="50px"
                :src="'https://warframe.market/static/assets/' + item.thumb"
              />
              <a
                class="no_link"
                target="_blank"
                :href="'https://warframe.market/items/' + item.url_name"
              >
                {{ item.item_name }}</a
              >
            </div>
          </template>
          <template #item.tags="{ item }">
            <v-chip-group selected-class="text-primary" column>
              <v-chip v-for="(tag, index) in item.tags" :key="index">
                {{ tag }}
              </v-chip>
            </v-chip-group>
          </template>
          <template #item.drops="{ item }">
            <button
              type="button"
              class="drops-btn"
              @click="openDrops(item.item_name)"
            >
              <v-icon size="small">mdi-map-marker-radius-outline</v-icon> Drops
            </button>
          </template>
        </v-data-table>
      </ClientOnly>
      <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" />
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
                  <v-img max-width="50" height="50" src="/img/paypal_icon.png" />
                </a>
                <a
                  aria-label="Donar con Mercado Pago"
                  class="text-white d-flex align-center justify-content-left donation_logo"
                  target="_blank"
                  href="https://mpago.la/19j46vX"
                >
                  <v-img
                    max-width="50"
                    height="50"
                    src="/img/mercadopago_icon.png"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4" type="info" density="compact">
      {{ t('disclaimer') }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useGoTo } from 'vuetify'

const config = useRuntimeConfig()
const base = config.public.apiURL as string
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const goTo = useGoTo()

const items = useItemsStore()
const allSets = computed(() => items.allRelics)

// SEO / i18n head (ports this.$nuxtI18nHead({ addSeoAttributes: true }))
useHead(useLocaleHead({ seo: true }))

const headers = [
  { title: 'Name', key: 'item_name', width: 'auto' },
  { title: 'Buy', key: 'market.buy', width: 'auto' },
  { title: 'Sell', key: 'market.sell', width: 'auto' },
  { title: 'Diff', key: 'market.diff', width: 'auto' },
  { title: 'Volume (Last 48hrs)', key: 'market.volume', width: 'auto' },
  { title: 'Tags', key: 'tags' },
  { title: 'Drops', key: 'drops' },
] as const

const search = ref('')
const all_items = ref<any[]>([])
const set = ref<any[]>([])
const priceRelic = ref<number>(0)
const maxEarn = ref<number>(0)
const hasScroll = ref(false)
const scrollWidth = ref<string | number>(0)
const dropsDialog = ref(false)
const dropsItem = ref('')
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'market.sell', order: 'desc' }])
const dataTable = ref<any>(null)
const wrapper2 = ref<HTMLElement | null>(null)

async function loadFilters() {
  const s = route.params.relic as string
  if (!s) return
  search.value = s
  const data: any = await $fetch(`${base}/relic/${s}`)
  const hasMarket = (item: any) => item && typeof item === 'object' && item.market
  all_items.value = (data.items || []).filter(hasMarket)
  set.value = (data.set || []).filter(hasMarket)
  priceRelic.value = set.value.length ? (set.value[0].market.sell || set.value[0].market.buy) : 0
  maxEarn.value = all_items.value.length
    ? all_items.value.reduce((a: any, b: any) => (a.market.sell > b.market.sell ? a : b)).market.sell
    : 0
}

function filter() {
  router.push('/relic/' + search.value)
}
function reset() {
  router.push('/relic')
}
function openDrops(name: string) {
  dropsItem.value = name
  dropsDialog.value = true
}

function row_classes(item: any) {
  if (item.isInterBank) return 'bg-purple-darken-4'
  if (item.condition) return 'bg-grey-darken-3'
  return ''
}
const rowProps = ({ item }: { item: any }) => ({ class: row_classes(item) })

function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}

function setScrollBar() {
  // V3 DOM: the scrollable wrapper class is .v-table__wrapper (was .v-data-table__wrapper in V2)
  const tableWrapper = document.querySelector('.money_table .v-table__wrapper') as HTMLElement | null
  if (!tableWrapper) {
    nextTick(() => setScrollBar())
    return
  }
  const isMobile = document.querySelector('.money_table.v-data-table--mobile')
  hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
  let wp1: any = null
  let wp2: any = null
  let wrapper1: HTMLElement | null = null
  let w2: HTMLElement | null = null
  if (hasScroll.value && !isMobile) {
    wrapper1 = document.querySelector('.money_table .v-table__wrapper')
    w2 = wrapper2.value
    if (!w2 || !wrapper1) {
      nextTick(() => setScrollBar())
      return
    }
    const table = document.querySelector('.money_table table') as HTMLElement
    scrollWidth.value = table.clientWidth + 10 + 'px'
    let scrolling = false
    wp1 = () => {
      if (scrolling) {
        scrolling = false
        return
      }
      scrolling = true
      w2!.scrollLeft = wrapper1!.scrollLeft
    }
    wp2 = () => {
      if (scrolling) {
        scrolling = false
        return
      }
      scrolling = true
      wrapper1!.scrollLeft = w2!.scrollLeft
    }
    wrapper1.addEventListener('scroll', wp1)
    w2.addEventListener('scroll', wp2)
  }
  window.addEventListener(
    'resize',
    () => {
      if (wrapper1) {
        wrapper1.removeEventListener('scroll', wp1)
        w2?.removeEventListener('scroll', wp2)
      }
      setScrollBar()
    },
    { once: true },
  )
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
  loadFilters()
  finishLoading()
  setScrollBar()
})

// param-only navigation (/relic/x -> /relic/y) does not remount the page; reload data
watch(() => route.params.relic, () => loadFilters())
</script>

<style scoped>
.drops-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.82rem;
  color: #35d6d0;
  background: rgba(53, 214, 208, 0.08);
  border: 1px solid rgba(53, 214, 208, 0.28);
  padding: 4px 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.drops-btn:hover {
  background: rgba(53, 214, 208, 0.16);
  color: #7ff0eb;
}
.drops-btn:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 2px;
}
.drops-btn .v-icon {
  color: inherit !important;
}
</style>
