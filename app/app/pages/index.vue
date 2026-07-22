<template>
  <div class="mt-md-4">
    <div class="my-4">
      <h1 class="visually-hidden">{{ t('home.h1') }}</h1>
      <NuxtLink :to="localePath('/guides')" class="kc-promo an">
        <span class="kc-promo__node"></span>
        <div class="kc-promo__text">
          <div class="kc-promo__eyebrow">{{ t('homePromo.eyebrow') }}</div>
          <div class="kc-promo__title">{{ t('homePromo.title') }}</div>
          <div class="kc-promo__sub">{{ t('homePromo.sub') }}</div>
        </div>
        <span class="kc-promo__cta">{{ t('homePromo.cta') }} <span class="kc-promo__arrow">→</span></span>
      </NuxtLink>
      <client-only>
        <template #fallback>
          <SeoFallbackTable
            :caption="t('home.h1')"
            :name-label="t('col_name')"
            :columns="[t('home.headers.buyLive'), t('home.headers.sellLive'), t('col_volume')]"
            :rows="fallbackRows"
          />
        </template>
        <v-data-table
          mobile-breakpoint="sm"
          show-select
          return-object
          item-value="url_name"
          v-model="selectedItems"
          v-model:expanded="expandedRows"
          :multi-sort="multiSort"
          v-model:sort-by="sortBy"
          :row-props="rowProps"
          :headers="headers"
          :items="all_items"
          :items-per-page="50"
          :items-per-page-options="[10, 20, 30, 40, 50]"
          class="elevation-1 money_table"
          @update:page="onPageUpdate"
          @update:sort-by="onSortBy"
        >
          <!-- Accessible row-select checkboxes (Vuetify's built-ins ship no
               aria-label, which fails the Lighthouse/axe "label" audit). -->
          <template #header.data-table-select="{ allSelected, selectAll, someSelected }">
            <v-checkbox-btn
              :indeterminate="someSelected && !allSelected"
              :model-value="allSelected"
              :aria-label="t('home.a11y.selectAll')"
              @update:model-value="selectAll(!allSelected)"
            />
          </template>
          <template #item.data-table-select="{ internalItem, isSelected, toggleSelect }">
            <v-checkbox-btn
              :model-value="isSelected(internalItem)"
              :aria-label="t('home.a11y.selectRow')"
              @update:model-value="toggleSelect(internalItem)"
            />
          </template>
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
                  @submit.prevent="onFilterSubmit"
                >
                  <v-text-field
                    v-model="min_volume"
                    type="number"
                    class="filter-input mr-2"
                    :label="t('home.filters.minVolume')"
                    hide-details
                    density="compact"
                  ></v-text-field>
                  <v-select
                    v-model="selection"
                    :label="t('home.filters.select')"
                    class="filter-input mr-2"
                    :items="selectionOptions"
                    hide-details
                    density="compact"
                    @update:model-value="trackFilter('category', $event)"
                  ></v-select>
                  <v-combobox
                    v-model="search"
                    :label="t('home.filters.search')"
                    class="filter-input mr-2"
                    :items="allItems.map((el) => localItemName(el))"
                    hide-details
                    density="compact"
                  ></v-combobox>
                  <v-btn type="submit" color="primary" class="mr-2 my-1"> {{ t('home.filters.search') }} </v-btn>
                  <v-btn color="primary" @click.prevent="reset" class="my-1" :aria-label="t('home.a11y.resetFilters')">
                    <v-icon>mdi-restore</v-icon>
                  </v-btn>
                </form>

                <!-- Advanced Filters Section -->
                <v-expansion-panels class="mt-2 mb-2" flat @update:model-value="onAdvancedToggle">
                  <v-expansion-panel>
                    <v-expansion-panel-title>
                      {{ t('home.advanced.title') }}
                    </v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-row density="compact">
                        <v-col cols="12" md="4">
                          <v-autocomplete
                            v-model="includedTags"
                            :items="availableTags"
                            item-title="text"
                            item-value="value"
                            :label="t('home.advanced.includeTags')"
                            multiple
                            chips
                            closable-chips
                            density="compact"
                            hide-details
                            @update:model-value="trackFilter('include_tags', $event?.length ?? 0)"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="12" md="2">
                          <v-radio-group v-model="tagLogic" inline density="compact" hide-details class="mt-0">
                            <v-radio :label="t('home.advanced.and')" value="AND"></v-radio>
                            <v-radio :label="t('home.advanced.or')" value="OR"></v-radio>
                          </v-radio-group>
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-autocomplete
                            v-model="excludedTags"
                            :items="availableTags"
                            item-title="text"
                            item-value="value"
                            :label="t('home.advanced.excludeTags')"
                            multiple
                            chips
                            closable-chips
                            density="compact"
                            hide-details
                            @update:model-value="trackFilter('exclude_tags', $event?.length ?? 0)"
                          ></v-autocomplete>
                        </v-col>
                        <v-col cols="12" md="2" class="d-flex align-center justify-end">
                          <v-btn
                            size="small"
                            color="error"
                            @click="clearTags"
                            :disabled="includedTags.length === 0 && excludedTags.length === 0"
                          >
                            {{ t('home.advanced.clearTags') }}
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>

                <!-- Comparison Action -->
                <div v-if="selectedItems.length > 0" class="d-flex align-center my-2 pa-2 bg-blue-darken-4 rounded">
                  <span class="text-white mr-4">{{ t('home.compare.selected', { n: selectedItems.length }, selectedItems.length) }}</span>
                  <v-btn size="small" color="white" @click="openCompare">
                    {{ t('home.compare.compareBtn') }}
                  </v-btn>
                  <v-btn icon size="small" variant="text" color="white" class="ml-2" :aria-label="t('home.a11y.clearSelection')" @click="clearSelection">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>

                <div class="d-flex">
                  <v-checkbox
                    v-model="avgPrice"
                    :label="t('home.options.avgPrices')"
                    class="mr-4"
                  ></v-checkbox>
                  <v-checkbox
                    v-model="multiSort"
                    :label="t('home.options.multiSort')"
                  ></v-checkbox>
                </div>
              </div>
            </v-theme-provider>
          </template>
          <template #expanded-row="{ columns, item }">
            <tr class="rank-detail-row">
              <td :colspan="columns.length">
                <div class="rank-detail">
                  <div v-if="rankLoading[item.url_name]" class="rank-detail__state">
                    <v-progress-circular indeterminate size="22" width="2" color="primary" />
                    {{ t('home.ranks.loading') }}
                  </div>
                  <div v-else-if="rankErrors[item.url_name]" class="rank-detail__state rank-detail__state--error">
                    {{ t('home.ranks.error') }}
                    <v-btn size="small" variant="text" color="primary" @click="loadRankPrices(item, true)">
                      {{ t('home.ranks.retry') }}
                    </v-btn>
                  </div>
                  <v-data-table
                    v-else-if="rankPrices[item.url_name]?.ranks?.length"
                    class="rank-grid"
                    theme="dark"
                    density="compact"
                    mobile-breakpoint="sm"
                    hide-default-footer
                    :headers="rankHeaders"
                    :items="rankPrices[item.url_name]!.ranks"
                    :items-per-page="-1"
                    item-value="rank"
                  >
                    <template #item.rank="{ item: rank }">
                      <span class="rank-badge">{{ rank.rank }}</span>
                    </template>
                    <template #item.bid="{ item: rank }">
                      {{ rank.bid ? fixPrice(rank.bid) : '—' }}
                    </template>
                    <template #item.ask="{ item: rank }">
                      {{ rank.ask ? fixPrice(rank.ask) : '—' }}
                    </template>
                    <template #item.avg_price="{ item: rank }">
                      {{ rank.avg_price ? fixPrice(rank.avg_price) : '—' }}
                    </template>
                    <template #item.volume="{ item: rank }">
                      {{ rank.volume || '—' }}
                    </template>
                  </v-data-table>
                  <div v-else class="rank-detail__state">{{ t('home.ranks.pending') }}</div>
                </div>
              </td>
            </tr>
          </template>
          <template #item.item_name="{ item, index }">
            <div class="d-flex justify-start align-center py-3">
              <img
                class="mr-3"
                width="50"
                height="50"
                loading="lazy"
                style="object-fit: contain"
                :alt="localItemName(item)"
                :src="'https://warframe.market/static/assets/' + item.thumb"
              />
              <div>
                <span class="item-name-line">
                  <a
                    class="no_link"
                    target="_blank"
                    :href="'https://warframe.market/items/' + item.url_name"
                    @click="onMarketLink(item, index)"
                  >{{ localItemName(item) }}</a>
                  <v-btn
                    v-if="isRankableItem(item)"
                    class="rank-toggle"
                    icon
                    size="x-small"
                    variant="text"
                    color="primary"
                    :aria-expanded="isRankExpanded(item)"
                    :aria-label="t(isRankExpanded(item) ? 'home.ranks.collapse' : 'home.ranks.expand', { item: localItemName(item) })"
                    @click.stop="toggleRankRow(item)"
                  >
                    <v-icon size="small">{{ isRankExpanded(item) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                  </v-btn>
                </span>
                <br />
                <v-btn
                  v-if="item.item_name.includes(' Set')"
                  size="small"
                  color="primary"
                  class="mt-1"
                  :to="'/set/' + item.url_name"
                  @click="trackAction('set_page_nav', { item_name: item.item_name })"
                  >{{ t('nav.items.setVsParts') }}</v-btn
                >
                <v-btn
                  v-if="item.tags.includes('relic')"
                  size="small"
                  color="primary"
                  class="mt-1"
                  :to="'/relic/' + item.url_name"
                  @click="trackAction('relic_page_nav', { item_name: item.item_name })"
                  >{{ t('home.row.relicCalculator') }}</v-btn
                >
              </div>
            </div>
          </template>
          <template #item.thumb="{ item }"> </template>
          <!-- Live buy/sell open the order-book dialog (5 best buyers/sellers +
               whisper). Clicking the number shows the depth behind it. -->
          <template #item.market.buy="{ item }">
            <button type="button" class="price-open" :aria-label="t('components.orderBook.openBuyAria', { price: fixPrice(item.market.buy) })" @click.stop="openOrderBook(item)">
              {{ fixPrice(item.market.buy) }}
              <v-icon size="x-small" color="primary">mdi-book-open-variant</v-icon>
            </button>
          </template>
          <template #item.market.sell="{ item }">
            <button type="button" class="price-open" :aria-label="t('components.orderBook.openSellAria', { price: fixPrice(item.market.sell) })" @click.stop="openOrderBook(item)">
              {{ fixPrice(item.market.sell) }}
              <v-icon size="x-small" color="primary">mdi-book-open-variant</v-icon>
            </button>
          </template>
          <template #item.market.buyAvg="{ item }">
            <button type="button" class="price-open" :aria-label="t('components.orderBook.openBuyAria', { price: fixPrice(item.market.buyAvg) })" @click.stop="openOrderBook(item)">
              {{ fixPrice(item.market.buyAvg) }}
              <v-icon size="x-small" color="primary">mdi-book-open-variant</v-icon>
            </button>
          </template>
          <template #item.market.sellAvg="{ item }">
            <button type="button" class="price-open" :aria-label="t('components.orderBook.openSellAria', { price: fixPrice(item.market.sellAvg) })" @click.stop="openOrderBook(item)">
              {{ fixPrice(item.market.sellAvg) }}
              <v-icon size="x-small" color="primary">mdi-book-open-variant</v-icon>
            </button>
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
              {{ t('col_drops') }}
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

      <!-- Order-book dialog: 5 best buyers/sellers + trade-whisper buttons -->
      <OrderBookDialog v-model="orderBookDialog" :item="orderBookItem" />

      <!-- Transaction Details Dialog -->
      <v-dialog v-model="transactionDialog" max-width="500">
        <v-card v-if="selectedTransactionItem">
          <v-card-title class="text-h6 bg-grey-lighten-2">
            {{ t('home.txDialog.title') }}
          </v-card-title>
          <v-card-text class="pt-4">
            <h3 class="mb-2">{{ localItemName(selectedTransactionItem) }}</h3>
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
                       <td><strong>{{ t('home.txDialog.date') }}</strong></td>
                       <td>{{ new Date(selectedTransactionItem.market.last_completed.datetime).toLocaleString() }}</td>
                     </tr>
                     <tr>
                       <td><strong>{{ t('home.txDialog.volume') }}</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.volume }}</td>
                     </tr>
                     <tr>
                       <td><strong>{{ t('home.txDialog.avgPrice') }}</strong></td>
                       <td>{{ fixPrice(selectedTransactionItem.market.last_completed.avg_price) }}</td>
                     </tr>
                     <tr>
                       <td><strong>{{ t('home.txDialog.minPrice') }}</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.min_price }}</td>
                     </tr>
                     <tr>
                       <td><strong>{{ t('home.txDialog.maxPrice') }}</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.max_price }}</td>
                     </tr>
                     <tr>
                       <td><strong>{{ t('home.txDialog.openPrice') }}</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.open_price }}</td>
                     </tr>
                     <tr>
                       <td><strong>{{ t('home.txDialog.closedPrice') }}</strong></td>
                       <td>{{ selectedTransactionItem.market.last_completed.closed_price }}</td>
                     </tr>
                   </tbody>
                 </template>
               </v-table>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="text" @click="transactionDialog = false">{{ t('cerrar') }}</v-btn>
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
                <div class="text-white mr-3">{{ t('relic_help_donate') }}</div>
                <a
                  target="_blank"
                  :aria-label="t('home.donate.paypalAria')"
                  class="text-white d-flex mr-4 align-center justify-content-left donation_logo"
                  href="https://ko-fi.com/cambio_uruguay"
                >
                  <picture>
                    <source srcset="/img/paypal_icon.webp" type="image/webp" />
                    <img src="/img/paypal_icon.png" alt="PayPal" width="50" height="50" class="donation_icon" />
                  </picture>
                </a>
                <a
                  :aria-label="t('home.donate.mercadopagoAria')"
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

    <!-- Community signal: Reddit feedback banner (Orokin voidglass, reddit-accented) -->
    <div class="rd-banner an">
      <span class="rd-banner__node" aria-hidden="true">
        <v-icon size="16" class="rd-banner__node-icon">mdi-reddit</v-icon>
      </span>
      <div class="rd-banner__text">
        <div class="rd-banner__eyebrow">r/Warframe</div>
        <h2 class="rd-banner__title">{{ t('home.feedback.title') }}</h2>
        <div class="rd-banner__sub">{{ t('home.feedback.body') }}</div>
      </div>
      <v-btn
        class="rd-banner__cta"
        variant="flat"
        :href="redditThreadUrl"
        target="_blank"
        rel="noopener noreferrer"
        append-icon="mdi-arrow-right"
        @click="trackAction('reddit_banner_click', { source: 'home' })"
      >
        {{ t('home.feedback.join') }}
      </v-btn>
    </div>

    <!-- Open Source Project Information -->
    <v-card class="mt-4 mb-3" color="#2c2c54">
      <v-card-text class="text-center">
        <div class="d-flex align-center justify-center mb-3">
          <v-icon size="large" class="mr-3" color="white">mdi-open-source-initiative</v-icon>
          <h2 class="text-h6">{{ t('open_source_project') }}</h2>
        </div>
        <p class="mb-3">{{ t('github_description') }}</p>
        <div class="d-flex flex-wrap justify-center gap-2">
          <GitHubButton :text="t('view_source_code')" />
          <v-btn
            color="amber-darken-1"
            variant="flat"
            href="https://github.com/eduair94/warframe"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackAction('star_github_click', { source: 'home_oss_card' })"
          >
            <v-icon start>mdi-star</v-icon>
            {{ t('star_on_github') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-alert class="an-disclaimer mt-3 mt-md-4 mb-0 mb-md-3" type="info" density="compact">
      {{ t('disclaimer') }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGoTo } from 'vuetify'
import type { OrderBook } from '~/composables/useOrderBook'

dayjs.extend(relativeTime)

const base = useApiBase()
const { t } = useI18n()
const localePath = useLocalePath()
const { localItemName } = useLocalizedName()
const goTo = useGoTo()
const { trackAction, trackDialog, trackFilter, trackMarketOpen, trackSearch, trackSort } = useAnalytics()

const items = useItemsStore()
const allItems = computed<any[]>(() => items.allItems)

// Live community-feedback thread linked from the reddit banner below.
const redditThreadUrl =
  'https://www.reddit.com/r/Warframe/comments/1uuu7gj/built_a_free_opensource_market_analytics_tool_to/'

// SSR-only crawlable snapshot for <SeoFallbackTable> (see that component for
// why): top 150 by 48h volume — same default ordering the live table opens
// on — capped so the fallback stays a small fraction of page weight.
const fallbackRows = computed(() =>
  [...allItems.value]
    .sort((a, b) => (b?.market?.volume || 0) - (a?.market?.volume || 0))
    .slice(0, 40)
    .map((item) => ({
      key: item.url_name,
      href: 'https://warframe.market/items/' + item.url_name,
      name: item.item_name,
      cells: [fixPrice(item.market?.buy), fixPrice(item.market?.sell), item.market?.volume || 0],
    })),
)

const route = useRoute()
const all_items = ref<any[]>([])
const min_volume = ref(0)
// Deep-linkable search (?q=…): powers the WebSite SearchAction / sitelinks
// searchbox declared in app.vue and lets any /?q=ash+prime link land pre-filtered.
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const avgPrice = ref(false)
const selection = ref('All')
const hasScroll = ref(false)
const scrollWidth = ref<string | number>(0)
const includedTags = ref<string[]>([])
const excludedTags = ref<string[]>([])
const tagLogic = ref('AND')
const selectedItems = ref<any[]>([])
const expandedRows = ref<any[]>([])
const rankPrices = ref<Record<string, NonNullable<OrderBook['rankPrices']>>>({})
const rankLoading = ref<Record<string, boolean>>({})
const rankErrors = ref<Record<string, boolean>>({})
const rankLoaded = ref<Record<string, boolean>>({})
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

// Order-book dialog (best buyers/sellers + whisper), opened from a price cell.
const orderBookDialog = ref(false)
const orderBookItem = ref<any>(null)

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

// Category filter options. The `value` stays the English key `filterSelect`
// switches on; only the displayed `title` is localized.
const selectionKeys = ['All', 'Warframe', 'Arcane', 'Weapon', 'Sentinel', 'Imprint', 'Mod', 'Relic']
const selectionOptions = computed(() =>
  selectionKeys.map((k) => ({ title: t('home.filters.categories.' + k), value: k })),
)

const headers = computed(() => {
  const toReturn: any[] = [
    { title: t('col_name'), key: 'item_name', width: 'auto' },
    { title: t('home.headers.buyLive'), key: 'market.buy', width: 'auto' },
    { title: t('home.headers.sellLive'), key: 'market.sell', width: 'auto' },
    { title: t('home.headers.avgSold'), key: 'market.avg_price', width: 'auto' },
    {
      title: t('home.headers.latestTrades'),
      key: 'market.last_completed',
      width: 'auto',
      sort: (a: any, b: any) => {
        const priceA = a ? a.avg_price : -1
        const priceB = b ? b.avg_price : -1
        return priceA - priceB
      },
    },
    { title: t('col_diff'), key: 'market.diff', width: 'auto' },
    { title: t('col_volume'), key: 'market.volume', width: 'auto' },
    { title: t('col_tags'), key: 'tags' },
    { title: t('home.headers.updated'), key: 'priceUpdate' },
    { title: t('col_drops'), key: 'drops' },
  ]
  if (avgPrice.value) {
    toReturn[1] = { title: t('home.headers.buyAvg'), key: 'market.buyAvg', width: 'auto' }
    toReturn[2] = { title: t('home.headers.sellAvg'), key: 'market.sellAvg', width: 'auto' }
  }
  return toReturn
})

const rankHeaders = computed(() => [
  { title: t('home.ranks.rank'), key: 'rank', align: 'start' as const },
  { title: t('home.headers.buyLive'), key: 'bid', align: 'end' as const },
  { title: t('home.headers.sellLive'), key: 'ask', align: 'end' as const },
  { title: t('home.headers.avgSold'), key: 'avg_price', align: 'end' as const },
  { title: t('col_volume'), key: 'volume', align: 'end' as const },
])

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
  trackDialog('price_history', { item_name: item.item_name })
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
  trackDialog('drop_locations', { item_name: item.item_name })
  dropItemName.value = item.item_name
  dropThumb.value = item.thumb || ''
  dropDialog.value = true
}

// Open the order-book dialog for a row (the dialog fetches /orders itself and
// reports its own open event).
function openOrderBook(item: any) {
  orderBookItem.value = item
  orderBookDialog.value = true
}

function isRankableItem(item: any): boolean {
  const tags = Array.isArray(item?.tags) ? item.tags : []
  return Number(item?.maxRank) > 0 || tags.includes('mod') || tags.includes('arcane_enhancement')
}

function isRankExpanded(item: any): boolean {
  return expandedRows.value.some((expandedItem) => expandedItem?.url_name === item?.url_name)
}

function toggleRankRow(item: any) {
  const key = item?.url_name
  if (!key) return
  const expanded = isRankExpanded(item)
  if (expanded) expandedRows.value = expandedRows.value.filter((expandedItem) => expandedItem?.url_name !== key)
  else {
    // The main table uses `return-object`, so Vuetify also expects expanded
    // values to be the original item objects rather than their item-value keys.
    expandedRows.value = [...expandedRows.value, item]
    void loadRankPrices(item)
  }
  trackAction(expanded ? 'rank_prices_collapse' : 'rank_prices_expand', {
    item_name: item.item_name,
    max_rank: item.maxRank,
  })
}

async function loadRankPrices(item: any, force = false) {
  const key = item?.url_name
  if (!key || rankLoading.value[key] || (!force && rankLoaded.value[key])) return
  rankLoading.value[key] = true
  rankErrors.value[key] = false
  try {
    const book = await $fetch<OrderBook>(`${base}/orders/${encodeURIComponent(key)}`)
    if (book.rankPrices) rankPrices.value[key] = book.rankPrices
    rankLoaded.value[key] = true
  } catch {
    rankErrors.value[key] = true
  } finally {
    rankLoading.value[key] = false
  }
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
  const wasIncluded = includedTags.value.includes(tag)
  if (wasIncluded) {
    includedTags.value = includedTags.value.filter((tt) => tt !== tag)
  } else {
    includedTags.value.push(tag)
  }
  trackFilter('tag_chip', tag, { action: wasIncluded ? 'remove' : 'add' })
  filter()
}

function clearTags() {
  trackAction('tags_clear', {
    tag_count: includedTags.value.length + excludedTags.value.length,
  })
  includedTags.value = []
  excludedTags.value = []
  tagLogic.value = 'AND'
}

function reset() {
  trackAction('filters_reset')
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
        el.item_name.toLowerCase().includes(search.value.toLowerCase()) ||
        localItemName(el).toLowerCase().includes(search.value.toLowerCase()))

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

// Analytics only. filter() itself is also driven by the tag watchers, the chip
// shortcut and the 2-min store refresh, so instrumenting it directly would
// report "filter applied" events the user never triggered — the submit wrapper
// is the only place that maps 1:1 to a deliberate apply.
function onFilterSubmit() {
  filter()
  trackFilter('home_filters', selection.value, {
    min_volume: Number(min_volume.value) || 0,
    tag_count: includedTags.value.length + excludedTags.value.length,
    has_search: !!search.value,
    results_count: all_items.value.length,
  })
  // Only the submit carries the search term: the combobox updates its model on
  // every blur/selection, and it does not apply the filter on its own.
  if (search.value) {
    trackSearch(String(search.value), all_items.value.length, { method: 'submit' })
  }
}

// v-expansion-panels emits the open panel's value, or undefined when it
// collapses again — we only care that the advanced filters were revealed.
function onAdvancedToggle(val: unknown) {
  if (val === undefined || val === null) return
  if (Array.isArray(val) && val.length === 0) return
  trackAction('advanced_filters_open')
}

function openCompare() {
  compareDialog.value = true
  trackDialog('item_compare', { item_count: selectedItems.value.length })
}

function clearSelection() {
  trackAction('compare_clear', { item_count: selectedItems.value.length })
  selectedItems.value = []
}

// Merged with the v-model:sort-by writer by the template compiler, so this
// listener only reports — it never owns the sort state.
function onSortBy(val: any[]) {
  const first = val?.[0]
  trackSort(first?.key ?? 'none', first?.order ? String(first.order) : undefined)
}

// The table swaps to stacked cards below its mobile-breakpoint and the two
// layouts need to stay separable in GA4. Vuetify 4 puts the `--mobile` modifier
// on the ROWS (`v-data-table__tr--mobile`, VDataTableRow -> useDisplay(props,
// 'v-data-table__tr')), never on the table root — probing the root would report
// every mobile visitor as `table`.
function tableSource() {
  return document.querySelector('.money_table .v-data-table__tr--mobile') ? 'mobile_card' : 'table'
}

function onMarketLink(item: any, index?: number) {
  trackMarketOpen(item.item_name, {
    position: typeof index === 'number' ? index + 1 : undefined,
    source: tableSource(),
  })
}

// Re-apply the active filters whenever the store catalogue refreshes (the
// 2-min background poll / focus refetch in app.vue, or the hydration
// self-heal). The table binds the filtered `all_items` snapshot, which would
// otherwise stay frozen on whatever the store held at mount. Filter state
// (search, category, tags, volume) is read live inside filter(), so the
// user's current filtering survives each refresh untouched.
watch(allItems, () => filter())

function row_classes(item: any) {
  if (item.isInterBank) return 'bg-purple-darken-4'
  if (item.condition) return 'bg-grey-darken-3'
  return ''
}

// Vuetify 3 replaces :item-class with :row-props
function rowProps({ item }: { item: any }) {
  return { class: row_classes(item) }
}

// Debounced: paging through a 4k-row table fires update:page on every click,
// and only the page the user settles on is worth an event.
let pageTrackTimer: ReturnType<typeof setTimeout> | null = null

function onPageUpdate(page?: number) {
  goTo('.money_table')
  if (pageTrackTimer) clearTimeout(pageTrackTimer)
  pageTrackTimer = setTimeout(() => {
    trackAction('table_page', { page: typeof page === 'number' ? page : undefined })
  }, 800)
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
  // Honour an initial ?q= deep link (SearchAction target); else show everything.
  if (search.value) filter()
  else all_items.value = allItems.value
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
  if (pageTrackTimer) clearTimeout(pageTrackTimer)
  teardownScroll()
})
</script>

<style scoped>
/* Knowledge Center promo banner (Orokin voidglass) */
.kc-promo {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 4px 0 20px;
  padding: 16px 20px;
  text-decoration: none;
  background:
    radial-gradient(120% 140% at 0% 0%, rgba(53, 214, 208, 0.08), transparent 55%),
    linear-gradient(180deg, #14162a 0%, #0e0f1c 100%);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  transition: border-color 0.15s ease, transform 0.15s ease;
}
.kc-promo:hover { border-color: rgba(200, 168, 92, 0.6); transform: translateY(-2px); }
.kc-promo__node { width: 11px; height: 11px; background: #c8a85c; transform: rotate(45deg); box-shadow: 0 0 10px rgba(200, 168, 92, 0.6); flex: 0 0 auto; }
.kc-promo__text { flex: 1; min-width: 0; }
.kc-promo__eyebrow { font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.66rem; color: #35d6d0; margin-bottom: 3px; }
.kc-promo__title { font-family: 'Cinzel', serif; color: #e7cf95; font-size: 1.12rem; line-height: 1.2; }
.kc-promo__sub { color: #b6bcd0; font-size: 0.86rem; margin-top: 3px; }
.kc-promo__cta {
  flex: 0 0 auto; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 0.06em;
  text-transform: uppercase; font-size: 0.82rem; color: #17130a; background: #c8a85c; padding: 10px 18px;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  white-space: nowrap;
}
.kc-promo:hover .kc-promo__cta { background: #e7cf95; }
.kc-promo__arrow { margin-left: 2px; }
@media (max-width: 700px) {
  .kc-promo { flex-wrap: wrap; }
  .kc-promo__cta { width: 100%; text-align: center; }
}

/* Reddit community-feedback banner — same voidglass card as the promo above,
   with a reddit-orange signal node so it reads as an outside voice rather
   than a second internal promo. */
.rd-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 0 20px;
  padding: 16px 20px;
  background:
    radial-gradient(120% 140% at 100% 0%, rgba(255, 69, 0, 0.09), transparent 55%),
    linear-gradient(180deg, #14162a 0%, #0e0f1c 100%);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  transition: border-color 0.15s ease;
}
.rd-banner:hover { border-color: rgba(255, 69, 0, 0.5); }
.rd-banner__node {
  display: flex; align-items: center; justify-content: center;
  flex: 0 0 auto; width: 30px; height: 30px;
  background: rgba(255, 69, 0, 0.14);
  border: 1px solid rgba(255, 69, 0, 0.5);
  transform: rotate(45deg);
}
.rd-banner__node-icon { transform: rotate(-45deg); color: #ff4500; }
.rd-banner__text { flex: 1; min-width: 0; }
.rd-banner__eyebrow { font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.66rem; color: #ff4500; margin-bottom: 3px; }
.rd-banner__title { font-family: 'Cinzel', serif; color: #e7cf95; font-size: 1.05rem; line-height: 1.25; font-weight: 400; margin: 0; }
.rd-banner__sub { color: #b6bcd0; font-size: 0.86rem; margin-top: 4px; line-height: 1.5; }
.rd-banner__cta.v-btn {
  flex: 0 0 auto;
  font-family: 'Rajdhani', sans-serif !important;
  font-weight: 700 !important;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.82rem !important;
  color: #17130a !important;
  background: #c8a85c !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.rd-banner__cta.v-btn:hover { background: #e7cf95 !important; }
@media (max-width: 700px) {
  .rd-banner { flex-wrap: wrap; }
  .rd-banner__cta.v-btn { width: 100%; }
}
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
/* Clickable buy/sell price → opens the order-book dialog (best buyers/sellers). */
.price-open {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.price-open:hover {
  color: #c8a85c;
  text-decoration: underline;
}
.price-open:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: 2px;
}
.tag-cell {
  gap: 4px;
  padding: 4px 0;
}
.item-name-line {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.rank-toggle { flex: 0 0 auto; }
.rank-detail-row td {
  background: #0d0f1b !important;
  padding: 0 !important;
}
.rank-detail {
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(53, 214, 208, 0.18);
  border-bottom: 1px solid rgba(200, 168, 92, 0.2);
}
.rank-detail__state {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #aeb5c9;
}
.rank-detail__state--error { color: #e0a3a3; }
.rank-grid {
  background: transparent !important;
  font-variant-numeric: tabular-nums;
}
.rank-grid :deep(.v-table__wrapper) { background: transparent; }
.rank-grid :deep(th) {
  background: #14162a !important;
  color: #8f95ab !important;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rank-grid :deep(td) {
  background: #0d0f1b !important;
  color: #eef1f8 !important;
  border-color: rgba(255, 255, 255, 0.07) !important;
}
.rank-grid :deep(tbody tr:hover td) { background: rgba(53, 214, 208, 0.035) !important; }
.rank-badge {
  display: inline-grid;
  place-items: center;
  min-width: 30px;
  height: 24px;
  padding: 0 7px;
  color: #e7cf95;
  border: 1px solid rgba(200, 168, 92, 0.38);
  background: rgba(200, 168, 92, 0.06);
}
/* Screen-reader-only H1: keeps the real page heading in the DOM (SEO + a11y)
   without altering the visual layout, which leads with the data table. */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
