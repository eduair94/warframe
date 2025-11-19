<template>
  <div class="mt-md-4">
    <div class="my-4">
      <h1 style="display: none"></h1>
      <client-only>
        <v-data-table
          ref="dataTable"
          color="#f5f5f5"
          show-select
          item-key="url_name"
          v-model="selectedItems"
          :multi-sort="multiSort"
          :sort-by.sync="sortBy"
          :sort-desc.sync="sortDesc"
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
              <div class="filter-container pa-3 white--text">
                <form
                  id="form_warframe"
                  class="d-flex align-center flex-wrap"
                  @submit.prevent="filter"
                >
                  <v-text-field
                    v-model="min_volume"
                    dark
                    type="number"
                    class="filter-input mr-2"
                    label="Min Volume"
                    hide-details
                    dense
                  ></v-text-field>
                  <v-select
                    v-model="selection"
                    label="Select"
                    dark
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
                    dense
                  ></v-select>
                  <v-combobox
                    v-model="search"
                    label="Search"
                    class="filter-input mr-2"
                    dark
                    :items="allItems.map((el) => el.item_name)"
                    hide-details
                    dense
                  ></v-combobox>
                  <v-btn type="submit" color="primary" class="mr-2 my-1"> Search </v-btn>
                  <v-btn color="primary" @click.prevent="reset" class="my-1">
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                </form>

                <!-- Advanced Filters Section -->
                <v-expansion-panels class="mt-2 mb-2 transparent" flat dark>
                  <v-expansion-panel class="transparent">
                    <v-expansion-panel-header>
                      Advanced Filters (Tags & Logic)
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <v-row dense>
                        <v-col cols="12" md="4">
                          <v-combobox
                            v-model="includedTags"
                            :items="availableTags"
                            label="Include Tags"
                            multiple
                            chips
                            small-chips
                            deletable-chips
                            dark
                            dense
                            hide-details
                          >
                            <template #selection="{ item, index }">
                              <v-chip small close @click:close="includedTags.splice(index, 1)">
                                {{ formatTag(item) }}
                              </v-chip>
                            </template>
                            <template #item="{ item }">
                              {{ formatTag(item) }}
                            </template>
                          </v-combobox>
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-radio-group v-model="tagLogic" row dark dense hide-details class="mt-0">
                            <v-radio label="AND" value="AND"></v-radio>
                            <v-radio label="OR" value="OR"></v-radio>
                          </v-radio-group>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-combobox
                            v-model="excludedTags"
                            :items="availableTags"
                            label="Exclude Tags (NOT)"
                            multiple
                            chips
                            small-chips
                            deletable-chips
                            dark
                            dense
                            hide-details
                          >
                            <template #selection="{ item, index }">
                              <v-chip small close @click:close="excludedTags.splice(index, 1)">
                                {{ formatTag(item) }}
                              </v-chip>
                            </template>
                            <template #item="{ item }">
                              {{ formatTag(item) }}
                            </template>
                          </v-combobox>
                        </v-col>
                        <v-col cols="12" md="2" class="d-flex align-center justify-end">
                          <v-btn
                            small
                            color="error"
                            @click="clearTags"
                            :disabled="includedTags.length === 0 && excludedTags.length === 0"
                          >
                            Clear Tags
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!-- Comparison Action -->
                <div v-if="selectedItems.length > 0" class="d-flex align-center my-2 pa-2 blue darken-4 rounded">
                  <span class="white--text mr-4">{{ selectedItems.length }} items selected</span>
                  <v-btn small color="white" light @click="compareDialog = true">
                    Compare Selected
                  </v-btn>
                  <v-btn icon small color="white" class="ml-2" @click="selectedItems = []">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>

                <div class="d-flex">
                  <v-checkbox
                    v-model="avgPrice"
                    dark
                    label="Average Prices (5 lowest prices)"
                    class="mr-4"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="multiSort"
                    dark
                    label="Multi-Sort"
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
          <!-- New Column Template -->
          <template #item.market.avg_price="{ item }">
             {{ fixPrice(item.market.avg_price) }}
          </template>
          <template #item.market.last_completed="{ item }">
            <div v-if="item.market.last_completed" @click="openTransactionDetails(item)" style="cursor: pointer; text-decoration: underline; color: #1976d2;">
              {{ fixPrice(item.market.last_completed.avg_price) }}
              <v-icon small color="primary">mdi-information-outline</v-icon>
            </div>
            <div v-else>-</div>
          </template>
          <template #item.priceUpdate="{ item }">
            {{ fixDate(item.priceUpdate) }}
          </template>
          <template #item.tags="{ item }">
            <v-chip-group selected-class="text-primary" column>
              <v-chip 
                v-for="(tag, index) in item.tags" 
                :key="index"
                small
                @click.stop="addTagToFilter(tag)"
                style="cursor: pointer"
                :color="includedTags.includes(tag) ? 'primary' : ''"
              >
                {{ formatTag(tag) }}
              </v-chip>
            </v-chip-group>
          </template>
          <template #item.drops="{ item }">
            <a target="_blank" :href="getLink(item.item_name)"> Drops </a>
          </template>
        </v-data-table>
      </client-only>
      
      <!-- Comparison Dialog -->
      <ItemComparison
        v-model="compareDialog"
        :items="selectedItems"
        :headers="getHeaders()"
      />

      <!-- Transaction Details Dialog -->
      <v-dialog v-model="transactionDialog" max-width="500">
        <v-card v-if="selectedTransactionItem">
          <v-card-title class="headline grey lighten-2">
            Last Transaction Details
          </v-card-title>
          <v-card-text class="pt-4">
            <h3 class="mb-2">{{ selectedTransactionItem.item_name }}</h3>
            <div v-if="selectedTransactionItem.market.last_completed">
               <v-simple-table dense>
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
               </v-simple-table>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="transactionDialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

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

    <!-- Feedback Request -->
    <v-alert
      color="#ff4500"
      dark
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
          light
          class="mt-2 mt-sm-0 ml-sm-4"
        >
          <v-icon left color="#ff4500">mdi-reddit</v-icon>
          Join Discussion
        </v-btn>
      </div>
    </v-alert>
    
    <!-- Open Source Project Information -->
    <v-card class="mt-4 mb-3" color="#2c2c54" dark>
      <v-card-text class="text-center">
        <div class="d-flex align-center justify-center mb-3">
          <v-icon large class="mr-3" color="white">mdi-open-source-initiative</v-icon>
          <h3>{{ $t('open_source_project') }}</h3>
        </div>
        <p class="mb-3">{{ $t('github_description') }}</p>
        <div class="d-flex flex-wrap justify-center gap-2">
          <GitHubButton text="View Source Code" />
          <GitHubShare />
        </div>
      </v-card-text>
    </v-card>
    
    <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 blue darken-4" type="info" dense>
      {{ $t('disclaimer') }}
    </v-alert>
  </div>
</template>

<script lang="ts">
import moment from 'moment';
import Vue from 'vue';
import { mapGetters } from 'vuex';

export default Vue.extend({
  name: 'HomePage',
  components: {
    GitHubButton: () => import('../components/GitHubButton.vue'),
    GitHubShare: () => import('../components/GitHubShare.vue'),
    ItemComparison: () => import('../components/ItemComparison.vue'),
  },
  data() {
    return {
      all_items: [],
      min_volume: 0,
      search: '',
      avgPrice: false,
      selection: 'All',
      hasScroll: false,
      scrollWidth: 0,
      includedTags: [],
      excludedTags: [],
      tagLogic: 'AND',
      selectedItems: [],
      compareDialog: false,
      sortBy: 'market.volume',
      sortDesc: true,
      multiSort: false,
      transactionDialog: false,
      selectedTransactionItem: null,
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
    availableTags() {
      const tags = new Set()
      this.allItems.forEach(item => {
        if (item.tags) item.tags.forEach(tag => tags.add(tag))
      })
      return Array.from(tags).sort()
    }
  },
  watch: {
    includedTags() {
      this.filter()
    },
    excludedTags() {
      this.filter()
    },
    tagLogic() {
      this.filter()
    },
    avgPrice(val) {
      if (Array.isArray(this.sortBy)) {
        this.sortBy = this.sortBy.map(key => {
          if (val) {
            if (key === 'market.buy') return 'market.buyAvg'
            if (key === 'market.sell') return 'market.sellAvg'
          } else {
            if (key === 'market.buyAvg') return 'market.buy'
            if (key === 'market.sellAvg') return 'market.sell'
          }
          return key
        })
      } else {
        let key = this.sortBy
        if (val) {
          if (key === 'market.buy') key = 'market.buyAvg'
          else if (key === 'market.sell') key = 'market.sellAvg'
        } else if (key === 'market.buyAvg') {
          key = 'market.buy'
        } else if (key === 'market.sellAvg') {
          key = 'market.sell'
        }
        this.sortBy = key
      }
    }
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
    openTransactionDetails(item) {
      this.selectedTransactionItem = item;
      this.transactionDialog = true;
    },
    fixPrice(price: number) {
      if (!price) return 0
      return Math.round(price * 100) / 100
    },
    formatTag(tag: string) {
      if (!tag) return ''
      return tag
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
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
    addTagToFilter(tag) {
      if (this.includedTags.includes(tag)) {
        this.includedTags = this.includedTags.filter(t => t !== tag)
      } else {
        this.includedTags.push(tag)
      }
      this.filter()
    },
    clearTags() {
      this.includedTags = []
      this.excludedTags = []
      this.tagLogic = 'AND'
    },
    reset() {
      this.selection = ''
      this.search = ''
      this.min_volume = 0
      this.includedTags = []
      this.excludedTags = []
      this.tagLogic = 'AND'
      this.selectedItems = []
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
        (el) => {
          // Basic filters
          const basicMatch = el.market.volume >= this.min_volume &&
          this.filterSelect(el) &&
          (!this.search ||
            el.item_name.toLowerCase().includes(this.search.toLowerCase()));

          if (!basicMatch) return false;

          // Advanced Tag Logic
          const itemTags = el.tags || [];
          
          // Exclude Logic (NOT)
          if (this.excludedTags.length > 0) {
            const hasExcluded = this.excludedTags.some(tag => itemTags.includes(tag));
            if (hasExcluded) return false;
          }

          // Include Logic (AND / OR)
          if (this.includedTags.length > 0) {
            if (this.tagLogic === 'AND') {
              // Must have ALL included tags
              const hasAll = this.includedTags.every(tag => itemTags.includes(tag));
              if (!hasAll) return false;
            } else {
              // Must have AT LEAST ONE included tag
              const hasAny = this.includedTags.some(tag => itemTags.includes(tag));
              if (!hasAny) return false;
            }
          }

          return true;
        }
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
      const toReturn = [
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
        // New Column
        {
          text: 'Avg Sold (48h)',
          value: 'market.avg_price',
          width: 'auto',
        },
        {
          text: 'Last Transaction',
          value: 'market.last_completed',
          width: 'auto',
          sort: (a, b) => {
            const priceA = a ? a.avg_price : -1;
            const priceB = b ? b.avg_price : -1;
            return priceA - priceB;
          },
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
})
</script>

<style scoped>
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
</style>