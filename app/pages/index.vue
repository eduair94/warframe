<template>
  <div class="mt-md-4">
    <div class="my-4">
      <h1 style="display: none"></h1>
      <client-only>
        <v-data-table
          ref="dataTable"
          color="#f5f5f5"
          sort-by="market.volume"
          sort-desc
          :item-class="row_classes"
          :headers="getHeaders()"
          :items="all_items"
          :footer-props="{
            'items-per-page-options': [10, 20, 30, 40, 50],
          }"
          :items-per-page="50"
          class="elevation-1 money_table"
          @update:page="$vuetify.goTo($refs.dataTable)"
        >
          <template #top="{ pagination, options, updateOptions }">
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
              <div style="background: #1f1f2f" class="pa-3 white--text">
                <form
                  id="form_warframe"
                  class="d-flex align-center flex-wrap"
                  @submit.prevent="filter"
                >
                  <v-text-field
                    v-model="min_volume"
                    dark
                    type="number"
                    width="200px"
                    label="Min Volume"
                  ></v-text-field>
                  <v-select
                    v-model="selection"
                    label="Select"
                    dark
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
                  ></v-select>
                  <v-combobox
                    v-model="search"
                    label="Search"
                    width="200px"
                    dark
                    :items="allItems.map((el) => el.item_name)"
                  ></v-combobox>
                  <v-btn type="submit" color="primary"> Search </v-btn>
                  <v-btn color="primary" @click.prevent="reset">
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                </form>
                <div>
                  <v-checkbox
                    v-model="avgPrice"
                    dark
                    label="Average Prices (5 lowest prices)"
                  ></v-checkbox>
                </div>
              </div>
              <v-data-footer
                :pagination="pagination"
                :options="options"
                items-per-page-text="$vuetify.dataTable.itemsPerPageText"
                @update:options="updateOptions"
              />
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
                  {{ item.item_name }}</a
                >
                <br />
                <v-btn
                  v-if="item.set && item.item_name.includes(' Set')"
                  small
                  target="_blank"
                  link
                  color="primary"
                  class="mt-1"
                  :to="'/set/' + item.url_name"
                  >Set vs Parts</v-btn
                >
                <v-btn
                  v-if="item.tags.includes('relic')"
                  small
                  target="_blank"
                  link
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
          <template #item.priceUpdate="{ item }">
            {{ fixDate(item.priceUpdate) }}
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
      </client-only>
      <div class="px-0 pt-3">
        <div>
          <div
            class="d-flex flex-wrap align-center top_container justify-space-between mb-md-4"
          >
            <div
              class="my-3 mb-0 md-md-3 grey darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container"
            >
              <div class="d-flex mt-2 align-center">
                <div class="white--text mr-3">Help us donating!</div>
                <a
                  target="_blank"
                  aria-label="Donar con Paypal"
                  class="white--text d-flex mr-4 align-center justify-content-left donation_logo"
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
                  class="white--text d-flex align-center justify-content-left donation_logo"
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
    <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 blue darken-4" type="info" dense>
      {{ $t('disclaimer') }}
    </v-alert>
  </div>
</template>

<script lang="ts">
import { mapGetters, mapActions } from 'vuex'
import moment from 'moment'
import { notFound } from '../services/not_found'
export default {
  name: 'HomePage',
  components: {},
  data() {
    return {
      all_items: [],
      min_volume: 0,
      search: '',
      avgPrice: false,
      selection: 'All',
      hasScroll: false,
      scrollWidth: 0,
    }
  },
  head() {
    return this.$nuxtI18nHead({
      addSeoAttributes: true,
    })
  },
  computed: {
    ...mapGetters({
      allItems: 'all_items',
    }),
  },
  beforeMount() {
    this.beforeMount()
  },
  mounted() {
    ;(window as any).startLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'flex'
    }
    ;(window as any).stopLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
    }
    this.setScrollBar()
  },
  methods: {
    fixPrice(price: number) {
      if (!price) return 0
      return Math.round(price * 100) / 100
    },
    fixDate(date) {
      return moment(date).fromNow()
    },
    getLink(name: string) {
      let s = '^' + name
      if (s.includes('(')) {
        s = s.split('(')[0].trim()
      }
      if (s.includes('Set')) {
        s = s.replace('Set', '').trim()
      }
      const encoded = encodeURIComponent(s)
      const url = `https://drops.warframestat.us/#/search/${encoded}/items/regex`
      return url
    },
    reset() {
      this.selection = ''
      this.search = ''
      this.min_volume = 0
      this.all_items = this.allItems
    },
    filterSelect(el: any) {
      const selection = this.selection
      let val = true
      switch (selection) {
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
    },
    filter() {
      this.all_items = this.allItems.filter(
        (el) =>
          el.market.volume >= this.min_volume &&
          this.filterSelect(el) &&
          (!this.search ||
            el.item_name.toLowerCase().includes(this.search.toLowerCase()))
      )
    },
    changeCode(code: string, codeWith: string) {
      this.code = codeWith
      this.code_with = code
    },
    formatNumber(number: number) {
      const nString = number.toString()
      if (!nString.includes('.')) {
        return number.toFixed(2)
      }
      const n = number.toPrecision(2)
      const nSplit = nString.split('.')[1]
      if (nSplit.length <= 2) {
        return number.toFixed(2)
      }
      return n
    },
    hideFeedback() {
      document.head.insertAdjacentHTML(
        'beforeend',
        `<style type="text/css" class="custom_style_list">
                    ._hj_feedback_container {
                      display:none!important;
                    }
            </style>`
      )
    },
    hideWidgets(val: boolean, att = 0) {
      const t = (window as any).Tawk_API
      if (t && t.hideWidget) {
        if (val) {
          localStorage.setItem('hideWidgets', '1')
          t.hideWidget()
          this.hideFeedback()
        } else {
          localStorage.removeItem('hideWidgets')
          t.showWidget()
          const el = document.querySelector('.custom_style_list')
          if (el) el.remove()
        }
      } else {
        this.$nextTick(() => {
          att++
          if (att === 10) {
            console.log('hide widget', att)
            return
          }
          this.hideWidgets(val, att)
        })
      }
    },
    beforeMount() {
      let pwaInstall = false
      try {
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          pwaInstall = true
        }
      } catch (e) {
        console.error(e)
      }
      if (pwaInstall) {
        ;(window as any).deferredPrompt = null
        window.addEventListener('beforeinstallprompt', (e) => {
          ;(window as any).deferredPrompt = e
          if (e !== null) {
            this.show_install = true
          }
        })
      }
      this.all_items = this.allItems
      this.finishLoading()
    },
    plusUy(array: string[]) {
      return [...array.filter((el) => el !== this.code), 'UYU']
    },
    setScrollBar() {
      const tableWrapper = document.querySelector(
        '.money_table .v-data-table__wrapper'
      )
      if (!tableWrapper) {
        this.$nextTick(() => {
          this.setScrollBar()
        })
        return
      }
      // Check if resolution is mobile.
      const isMobile = document.querySelector(
        '.money_table.v-data-table--mobile'
      )
      this.hasScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth
      let wp1 = null
      let wp2 = null
      let wrapper1 = null
      let wrapper2 = null
      if (this.hasScroll && !isMobile) {
        wrapper1 = document.querySelector('.money_table .v-data-table__wrapper')
        wrapper2 = this.$refs.wrapper2
        if (!wrapper2 || !wrapper1) {
          this.$nextTick(() => {
            this.setScrollBar()
          })
          return
        }

        const table = document.querySelector('.money_table table')

        this.scrollWidth = table.clientWidth + 10 + 'px'

        let scrolling = false
        wp1 = function () {
          if (scrolling) {
            scrolling = false
            return true
          }
          scrolling = true

          wrapper2.scrollLeft = wrapper1.scrollLeft
        }

        wp2 = function () {
          if (scrolling) {
            scrolling = false
            return true
          }
          scrolling = true
          wrapper1.scrollLeft = wrapper2.scrollLeft
        }

        wrapper1.addEventListener('scroll', wp1)
        wrapper2.addEventListener('scroll', wp2)
      }

      addEventListener(
        'resize',
        () => {
          if (wrapper1) {
            wrapper1.removeEventListener('scroll', wp1)
            wrapper2.removeEventListener('scroll', wp2)
          }
          this.setScrollBar()
        },
        { once: true }
      )
    },
    fixTitle(text: string) {
      return text.replace('{{day}}', this.day)
    },
    capitalize(entry: string) {
      let str = entry
      if (entry === 'TODOS') {
        const locale = this.$i18n.locale
        const tr = {
          es: 'TODOS',
          en: 'ALL',
          pt: 'TODOS',
        }
        str = tr[locale]
      }
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },
    getHeaders() {
      let toReturn = [
        {
          text: 'Name',
          value: 'item_name',
          width: 'auto',
        },
        {
          text: 'Buy',
          value: 'market.buy',
          width: 'auto',
        },
        {
          text: 'Sell',
          value: 'market.sell',
          width: 'auto',
        },
        {
          text: 'Diff',
          value: 'market.diff',
          width: 'auto',
        },
        {
          text: 'Volume (Last 48hrs)',
          value: 'market.volume',
          width: 'auto',
        },
        {
          text: 'Tags',
          value: 'tags',
        },
        {
          text: 'Updated',
          value: 'priceUpdate',
        },
        {
          text: 'Drops',
          value: 'drops',
        },
      ]
      if (this.avgPrice) {
        toReturn[1] = {
          text: 'Buy',
          value: 'market.buyAvg',
          width: 'auto',
        }
        toReturn[2] = {
          text: 'Sell',
          value: 'market.sellAvg',
          width: 'auto',
        }
      }
      return toReturn
    },
    async install_app() {
      const deferredPrompt = (window as any).deferredPrompt
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          ;(window as any).deferredPrompt = null
        }
      } else if (this.$refs.pwa_open) {
        this.$refs.pwa_open.click()
      }
    },
    get_text() {
      if (!this.items.length) return
      const m = this.formatMoney(this.items[0].amount)
      if (this.wantTo === 'buy') {
        const loc = {
          es: `Comprar ${this.amount} ${this.code} te costará un total de ${m}.`,
          en: `Buying ${this.amount} ${this.code} will cost you a total of ${m}.`,
          pt: `Comprar ${this.amount} ${this.code} lhe custará um total de ${m}.`,
        }
        return loc[this.$i18n.locale]
      } else {
        const loc = {
          es: `Te darán ${m} por tus ${this.amount} ${this.code}.`,
          en: `You will receive ${m} for your ${this.amount} ${this.code}.`,
          pt: `Você receberá ${m} por seus ${this.amount} ${this.code}.`,
        }
        return loc[this.$i18n.locale]
      }
    },
    getColor({ pos }) {
      if (this.amount === 0) return ''
      if (pos === 1) return 'green darken-4'
      if (pos === this.lastPos) return 'red darken-4'
      return ''
    },
    formatMoney(number) {
      return number.toLocaleString('es-ES', {
        style: 'currency',
        currency: this.code_with,
      })
    },
    row_classes(item) {
      if (item.isInterBank) {
        return 'purple darken-4'
      }
      if (item.condition) {
        return 'grey darken-3'
      }
      return ''
    },
    finishLoading() {
      this.$nextTick(() => {
        const el = document.getElementById('spinner-wrapper')
        if (el) el.style.display = 'none'
        else {
          this.finishLoading()
        }
      })
    },
  },
}
</script>