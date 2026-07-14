<template>
  <div class="mt-md-4">
    <div class="my-4">
      <h1 style="display: none"></h1>
      <client-only>
        <v-data-table
          :hide-default-footer="true"
          :headers="getHeadersRivens()"
          :items="rivens"
        >
          <template #top>
            <div style="background: #1f1f2f" class="pa-3 text-white">
              Find the best endo riven deals
            </div>
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
                  :href="'https://warframe.market/auction/' + item.items.id"
                >
                  {{ item.item_name }} {{ item.items.item.name }}</a
                >
              </div>
            </div>
          </template>
        </v-data-table>
        <v-data-table
          ref="dataTable"
          :sort-by="[{ key: 'market.endoPlatSell', order: 'desc' }]"
          :row-props="rowProps"
          :headers="getHeaders()"
          :items="all_items"
          :items-per-page="50"
          :hide-default-footer="true"
          class="elevation-1 money_table"
          @update:page="goTo(dataTable?.$el)"
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
                <div>
                  <v-checkbox
                    v-model="avgPrice"
                    label="Average Prices (5 lowest prices)"
                    @update:model-value="loadItems"
                  ></v-checkbox>
                </div>
              </div>
            </div>
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
                  {{ item.item_name }}
                </a>
                <br />
                <v-btn
                  v-if="item.set && item.item_name.includes(' Set')"
                  size="small"
                  target="_blank"
                  color="primary"
                  class="mt-1"
                  :to="'/set/' + item.url_name"
                  >Set vs Parts</v-btn
                >
              </div>
            </div>
          </template>
          <template #item.market.buyAvg="{ item }">
            {{ fixPrice(item.market.buyAvg) }}
          </template>
          <template #item.market.sellAvg="{ item }">
            {{ fixPrice(item.market.sellAvg) }}
          </template>
          <template #item.priceUpdate="{ item }">
            {{ fixDate(item.priceUpdate) }}
          </template>
          <template #item.drops="{ item }">
            <a target="_blank" :href="getLink(item.item_name)"> Drops </a>
          </template>
        </v-data-table>
      </client-only>
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
                  <v-img
                    max-width="50px"
                    height="50px"
                    contain
                    src="/img/paypal_icon.png"
                  >
                    <template #sources>
                      <source srcset="/img/paypal_icon.webp" />
                    </template>
                  </v-img>
                </a>
                <a
                  aria-label="Donar con Mercado Pago"
                  class="text-white d-flex align-center justify-content-left donation_logo"
                  target="_blank"
                  href="https://mpago.la/19j46vX"
                >
                  <v-img
                    max-width="50px"
                    height="50px"
                    contain
                    src="/img/mercadopago_icon.png"
                  >
                    <template #sources>
                      <source srcset="/img/mercadopago_icon.webp" />
                    </template>
                  </v-img>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <v-alert
      class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4"
      type="info"
      density="compact"
    >
      {{ t('disclaimer') }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, nextTick, onBeforeMount, onMounted, ref } from 'vue'
import { useGoTo } from 'vuetify'

dayjs.extend(relativeTime)

const config = useRuntimeConfig()
const base = config.public.apiURL
const { t } = useI18n()
const goTo = useGoTo()

// SEO head — old this.$nuxtI18nHead({ addSeoAttributes: true }).
// @nuxtjs/i18n v9 renamed the option key `addSeoAttributes` -> `seo`.
useHead(useLocaleHead({ seo: true }))

// Vuex all_items getter -> Pinia store
const store = useItemsStore()
const allItems = computed<any[]>(() => store.allItems)

// template refs (replace this.$refs.dataTable / this.$refs.wrapper2)
const dataTable = ref<any>(null)
const wrapper2 = ref<HTMLElement | null>(null)

// reactive state (only fields actually referenced by the template/lifecycle
// survive the port — the old file's dead currency-converter methods/state
// (`code`, `items`, `amount`, `wantTo`, `day`, `lastPos`, etc.) are dropped;
// they were never callable in the old page either, so this is parity-safe)
const all_items = ref<any[]>([])
const avgPrice = ref(false)
const hasScroll = ref(false)
const scrollWidth = ref<string | number>(0)
const maxEndoPerPlat = ref(0)
const rivens = ref<any[]>([])

const sculptures: Record<string, number> = {
  anasa: 3450,
  ayr: 1425,
  hemakara: 2600,
  kitha: 3000,
  orta: 2700,
  piv: 1725,
  sah: 1500,
  valana: 1575,
  vaya: 1800,
  zambuka: 2600,
}

async function getRivens() {
  rivens.value = await $fetch<any[]>(`${base}/rivens`)
}

function loadItems() {
  all_items.value = allItems.value
    .filter((el: any) => el.item_name.includes('Sculpture'))
    .map((el: any) => {
      const name = el.url_name.split(/_/g)[1] ?? ''
      const endo = sculptures[name] ?? 0
      const buy = avgPrice.value ? el.market.buyAvg : el.market.buy
      const sell = avgPrice.value ? el.market.sellAvg : el.market.sell
      return {
        ...el,
        market: {
          ...el.market,
          endo,
          endoPlatBuy: buy ? Math.round((endo / buy) * 100) / 100 : '-',
          endoPlatSell: sell ? Math.round((endo / sell) * 100) / 100 : '-',
        },
      }
    })
  if (all_items.value.length) {
    maxEndoPerPlat.value = all_items.value.reduce((prev, current) =>
      prev.market.endoPlatSell > current.market.endoPlatSell ? prev : current,
    ).market.endoPlatSell
  }
  getRivens()
}

function fixPrice(price: number) {
  if (!price) return 0
  return Math.round(price * 100) / 100
}
function fixDate(date: string | number | Date) {
  return dayjs(date).fromNow()
}
function getLink(name: string) {
  let s = '^' + name
  if (s.includes('(')) s = (s.split('(')[0] ?? s).trim()
  if (s.includes('Set')) s = s.replace('Set', '').trim()
  const encoded = encodeURIComponent(s)
  return `https://drops.warframestat.us/#/search/${encoded}/items/regex`
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

function getHeadersRivens() {
  return [
    { title: 'Riven Weapon', key: 'item_name' },
    { title: 'Re rolls', key: 'items.item.re_rolls' },
    { title: 'Buy', key: 'items.buyout_price' },
    { title: 'Endo', key: 'items.endo', width: 'auto' },
    { title: 'Endo/Plat Sell', key: 'items.endoPerPlat', width: 'auto' },
  ]
}

function getHeaders() {
  const toReturn: any[] = [
    { title: 'Name', key: 'item_name', width: 'auto' },
    { title: 'Buy', key: 'market.buy', width: 'auto' },
    { title: 'Sell', key: 'market.sell', width: 'auto' },
    { title: 'Endo', key: 'market.endo', width: 'auto' },
    { title: 'Endo/Plat Buy', key: 'market.endoPlatBuy', width: 'auto' },
    { title: 'Endo/Plat Sell', key: 'market.endoPlatSell', width: 'auto' },
    { title: 'Updated', key: 'priceUpdate' },
    { title: 'Drops', key: 'drops' },
  ]
  if (avgPrice.value) {
    toReturn[1] = { title: 'Buy', key: 'market.buyAvg', width: 'auto' }
    toReturn[2] = { title: 'Sell', key: 'market.sellAvg', width: 'auto' }
  }
  return toReturn
}

// Vuetify 3 renamed the scroll container from `.v-data-table__wrapper` to
// `.v-table__wrapper`; local var renamed `w2El` to avoid clashing with the
// `wrapper2` template ref.
function setScrollBar() {
  const tableWrapper = document.querySelector(
    '.money_table .v-table__wrapper',
  ) as HTMLElement | null
  if (!tableWrapper) {
    nextTick(() => setScrollBar())
    return
  }
  const isMobile = document.querySelector('.money_table.v-data-table--mobile')
  hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
  let wp1: any = null
  let wp2: any = null
  let wrapper1: any = null
  let w2El: any = null
  if (hasScroll.value && !isMobile) {
    wrapper1 = document.querySelector('.money_table .v-table__wrapper')
    w2El = wrapper2.value
    if (!w2El || !wrapper1) {
      nextTick(() => setScrollBar())
      return
    }
    const table = document.querySelector('.money_table table') as HTMLElement | null
    scrollWidth.value = (table?.clientWidth ?? 0) + 10 + 'px'

    let scrolling = false
    wp1 = function () {
      if (scrolling) {
        scrolling = false
        return true
      }
      scrolling = true
      w2El.scrollLeft = wrapper1.scrollLeft
    }
    wp2 = function () {
      if (scrolling) {
        scrolling = false
        return true
      }
      scrolling = true
      wrapper1.scrollLeft = w2El.scrollLeft
    }
    wrapper1.addEventListener('scroll', wp1)
    w2El.addEventListener('scroll', wp2)
  }

  addEventListener(
    'resize',
    () => {
      if (wrapper1) {
        wrapper1.removeEventListener('scroll', wp1)
        w2El.removeEventListener('scroll', wp2)
      }
      setScrollBar()
    },
    { once: true },
  )
}

// Hide the global loading spinner once mounted (project rule). Bounded retry:
// the old Options-API version recursed unbounded.
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onBeforeMount(() => {
  let pwaInstall = false
  try {
    if (!window.matchMedia('(display-mode: standalone)').matches) pwaInstall = true
  } catch (e) {
    console.error(e)
  }
  if (pwaInstall) {
    ;(window as any).deferredPrompt = null
    window.addEventListener('beforeinstallprompt', (e) => {
      ;(window as any).deferredPrompt = e
    })
  }
  loadItems()
  finishLoading()
})

onMounted(() => {
  ;(window as any).startLoading = () => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'flex'
  }
  ;(window as any).stopLoading = () => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
  }
  setScrollBar()
})
</script>
