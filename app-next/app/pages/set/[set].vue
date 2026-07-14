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
                    width="200px"
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
                  Purchasing by parts can save you up to:
                  <b>{{ save }}</b> platinum
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
                  <a target="_blank" :href="getLink(item.item_name)"> Drops </a>
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
            <a target="_blank" :href="getLink(item.item_name)"> Drops </a>
          </template>
        </v-data-table>
      </ClientOnly>
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
                  <v-img max-width="50" height="50" src="/img/paypal_icon.png">
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
                    max-width="50"
                    height="50"
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useGoTo } from 'vuetify'

const config = useRuntimeConfig()
const base = config.public.apiURL as string
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const goTo = useGoTo()

const items = useItemsStore()
const allSets = computed(() => items.allSets)

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

const save = ref(0)
const search = ref('')
const all_items = ref<any[]>([])
const set = ref<any[]>([])
const hasScroll = ref(false)
const scrollWidth = ref<string | number>(0)
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([
  { key: 'market.volume', order: 'desc' },
])
const dataTable = ref<any>(null)
const wrapper2 = ref<HTMLElement | null>(null)

async function loadFilters() {
  const s = route.params.set as string | undefined
  if (!s) return
  search.value = s
  const data: any = await $fetch(`${base}/set/${s}`)
  const hasMarket = (item: any) =>
    item && typeof item === 'object' && item.market
  all_items.value = (data.items || []).filter(hasMarket)
  set.value = (data.set || []).filter(hasMarket)
  save.value =
    set.value.length === 2
      ? set.value[0].market.sell - set.value[1].market.sell
      : 0
}

function filter() {
  router.push('/set/' + search.value)
}
function reset() {
  router.push('/set')
}

function rowProps({ item }: { item: any }) {
  if (item.isInterBank) return { class: 'bg-purple-darken-4' }
  if (item.condition) return { class: 'bg-grey-darken-3' }
  return {}
}

function getLink(name: string) {
  let s = '^' + name
  if (s.includes('(')) s = (s.split('(')[0] ?? s).trim()
  if (s.includes('Set')) s = s.replace('Set', '').trim()
  return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
}

function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}

function setScrollBar() {
  // V3 DOM: the scrollable wrapper class is .v-table__wrapper (was .v-data-table__wrapper in V2)
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
  let wrapper1: HTMLElement | null = null
  let w2: HTMLElement | null = null
  if (hasScroll.value && !isMobile) {
    wrapper1 = document.querySelector(
      '.money_table .v-table__wrapper',
    ) as HTMLElement | null
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

onMounted(async () => {
  ;(window as any).startLoading = () => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'flex'
  }
  ;(window as any).stopLoading = () => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
  }
  await loadFilters()
  finishLoading()
  setScrollBar()
})

// param-only navigation (/set/x -> /set/y) does not remount the page; reload data
watch(
  () => route.params.set,
  () => loadFilters(),
)
</script>
