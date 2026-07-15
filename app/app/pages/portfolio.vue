<template>
  <div class="my-4">
    <h1 class="text-h4 mb-2">My Portfolio</h1>
    <p class="text-body-2 mb-4">
      Track items you own or want to watch, and get a browser notification when their sell
      price crosses a threshold you set — or when an item hits its <strong>all-time low</strong>
      in our long price history (something warframe.market's 90-day chart can't tell you).
      This is stored only in this browser (no account needed) - clearing your browser data
      clears your list.
    </p>

    <v-card class="pa-4 mb-4" variant="outlined">
      <div class="d-flex flex-wrap align-center gap-10">
        <v-combobox
          v-model="itemToAdd"
          label="Add an item to your portfolio"
          class="add-input"
          :items="allItems.map((el) => el.item_name)"
          hide-details
          density="compact"
          variant="outlined"
        ></v-combobox>
        <v-btn color="primary" :disabled="!itemToAdd" @click="addItem">
          <v-icon size="small" class="mr-1">mdi-plus</v-icon> Add
        </v-btn>
        <v-btn
          v-if="notificationPermission !== 'granted'"
          color="secondary"
          variant="outlined"
          @click="enableAlerts"
        >
          <v-icon size="small" class="mr-1">mdi-bell-outline</v-icon>
          Enable price alerts
        </v-btn>
        <span v-else class="text-caption d-flex align-center">
          <v-icon size="small" color="green" class="mr-1">mdi-bell-check</v-icon>
          Alerts enabled - checked whenever this page is open
        </span>
      </div>
    </v-card>

    <v-alert v-if="notificationPermission === 'unsupported'" type="info" density="compact" variant="outlined">
      Your browser doesn't support notifications. Thresholds are still saved and shown here.
    </v-alert>

    <div v-if="!watchlist.length" class="text-body-2 text-grey">
      Your portfolio is empty. Search for an item above to start tracking it.
    </div>

    <v-table v-else class="portfolio-table">
      <template #default>
        <thead>
          <tr>
            <th>Item</th>
            <th>Owned Qty</th>
            <th>Sell Price</th>
            <th>Value</th>
            <th>Alert Below</th>
            <th>Alert Above</th>
            <th>At All-Time Low</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in enrichedWatchlist" :key="entry.url_name">
            <td>
              <nuxt-link :to="'/set/' + entry.url_name" class="no_link">{{ entry.item_name }}</nuxt-link>
            </td>
            <td>
              <v-text-field
                :model-value="entry.ownedQty"
                type="number"
                density="compact"
                hide-details
                style="width: 80px"
                @change="(e: Event) => setField(entry.url_name, 'ownedQty', Number((e.target as HTMLInputElement).value) || 0)"
              ></v-text-field>
            </td>
            <td>{{ entry.currentSell != null ? entry.currentSell : '-' }}</td>
            <td>{{ entry.value != null ? entry.value.toFixed(0) : '-' }}</td>
            <td>
              <v-text-field
                :model-value="entry.alertBelow"
                type="number"
                density="compact"
                hide-details
                placeholder="none"
                style="width: 90px"
                @change="(e: Event) => { const val = (e.target as HTMLInputElement).value; setField(entry.url_name, 'alertBelow', val === '' ? null : Number(val)); }"
              ></v-text-field>
            </td>
            <td>
              <v-text-field
                :model-value="entry.alertAbove"
                type="number"
                density="compact"
                hide-details
                placeholder="none"
                style="width: 90px"
                @change="(e: Event) => { const val = (e.target as HTMLInputElement).value; setField(entry.url_name, 'alertAbove', val === '' ? null : Number(val)); }"
              ></v-text-field>
            </td>
            <td>
              <div class="d-flex align-center">
                <v-checkbox
                  :model-value="entry.alertAtl"
                  density="compact"
                  hide-details
                  class="ma-0 pa-0 atl-check"
                  color="#4caf7d"
                  @update:model-value="(v: boolean | null) => setField(entry.url_name, 'alertAtl', !!v)"
                ></v-checkbox>
                <span v-if="entry.pctFromAtl != null" class="text-caption" :class="entry.pctFromAtl <= 3 ? 'text-green' : 'text-grey'">
                  {{ entry.pctFromAtl <= 3 ? 'at low!' : '+' + entry.pctFromAtl.toFixed(0) + '%' }}
                </span>
                <span v-else class="text-caption text-grey">—</span>
              </div>
            </td>
            <td>
              <v-btn icon variant="text" size="small" @click="removeItem(entry.url_name)">
                <v-icon size="small">mdi-close</v-icon>
              </v-btn>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right font-weight-bold">Total portfolio value:</td>
            <td class="font-weight-bold">{{ totalValue.toFixed(0) }}p</td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      </template>
    </v-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  checkAlerts,
  getWatchlist,
  removeFromWatchlist,
  requestNotificationPermission,
  toggleWatch,
  updateEntry,
  type WatchlistEntry,
} from '../services/portfolio'
import { subscribeLive } from '~/composables/useLiveFeed'
import type { LiveUpdate } from '~/utils/liveTypes'

const config = useRuntimeConfig()
const base = config.public.apiURL

// Long-history analytics (atl / pctFromAtl) power the all-time-low alert -
// a signal warframe.market can't give (its chart caps at 90 days).
const { data } = await useAsyncData('portfolio-market-analytics', () =>
  $fetch<any>(`${base}/market_analytics`).catch(() => null),
)
const analytics = computed<any[]>(() => (data.value && data.value.items) || [])

const itemsStore = useItemsStore()
const allItems = computed<any[]>(() => itemsStore.allItems as any[])

const watchlist = ref<WatchlistEntry[]>([])
const itemToAdd = ref('')
const notificationPermission = ref<string>('default')
let alertInterval: ReturnType<typeof setInterval> | null = null
// Real-time alert path: latest live sell price per watched item, overlaid onto the
// catalog before running the SAME client-side checkAlerts. The 60s interval stays a backstop.
const livePrices = ref<Record<string, number>>({})
const liveUnsubs = new Map<string, () => void>()

const itemsByName = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  allItems.value.forEach((i) => {
    map[i.item_name] = i
  })
  return map
})
const itemsByUrlName = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  allItems.value.forEach((i) => {
    map[i.url_name] = i
  })
  return map
})
const analyticsByUrl = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  analytics.value.forEach((a) => {
    map[a.url_name] = { atl: a.atl, pctFromAtl: a.pctFromAtl }
  })
  return map
})
const enrichedWatchlist = computed(() =>
  watchlist.value.map((entry) => {
    const live = itemsByUrlName.value[entry.url_name]
    // Prefer the real-time sell price when the feed is streaming this item.
    const currentSell = livePrices.value[entry.url_name] ?? live?.market?.sell ?? null
    const a = analyticsByUrl.value[entry.url_name]
    return {
      ...entry,
      currentSell,
      value: currentSell != null ? currentSell * (entry.ownedQty || 0) : null,
      pctFromAtl: a && typeof a.pctFromAtl === 'number' ? a.pctFromAtl : null,
    }
  }),
)
const totalValue = computed<number>(() =>
  enrichedWatchlist.value.reduce((sum, e) => sum + (e.value || 0), 0),
)

function refresh() {
  watchlist.value = getWatchlist()
  subscribeWatchlistLive()
}
function addItem() {
  const item = itemsByName.value[itemToAdd.value]
  if (!item) return
  toggleWatch({ url_name: item.url_name, item_name: item.item_name })
  itemToAdd.value = ''
  refresh()
}
function removeItem(urlName: string) {
  removeFromWatchlist(urlName)
  refresh()
}
function setField(urlName: string, field: keyof WatchlistEntry, value: any) {
  updateEntry(urlName, { [field]: value } as any)
  refresh()
}
function runAlertCheck() {
  checkAlerts(allItems.value, analyticsByUrl.value)
}
// Overlay live sell prices onto a shallow copy of the catalog, then run the same
// client-side check (never mutate the Pinia getter objects).
function runLiveAlertCheck() {
  if (notificationPermission.value !== 'granted') return
  // Only the watched items need checking — overlay live sell prices onto that small
  // subset (not the whole catalog) before the same client-side checkAlerts.
  const overlaid = watchlist.value.map((w) => {
    const it = itemsByUrlName.value[w.url_name] || { url_name: w.url_name, item_name: w.item_name }
    const sell = livePrices.value[w.url_name]
    return sell != null ? { ...it, market: { ...(it.market || {}), sell } } : it
  })
  checkAlerts(overlaid, analyticsByUrl.value)
}
// Subscribe every watched item to the live feed; fire checkAlerts immediately on each
// push instead of waiting up to 60s. Re-runs whenever the watchlist changes.
function subscribeWatchlistLive() {
  const urls = new Set(watchlist.value.map((w) => w.url_name))
  for (const [url, off] of liveUnsubs) {
    if (!urls.has(url)) {
      off()
      liveUnsubs.delete(url)
      delete livePrices.value[url]
    }
  }
  for (const url of urls) {
    if (liveUnsubs.has(url)) continue
    const off = subscribeLive(url, (u: LiveUpdate) => {
      livePrices.value[u.url_name] = u.book.bestSell
      runLiveAlertCheck()
    })
    liveUnsubs.set(url, off)
  }
}
async function enableAlerts() {
  const result = await requestNotificationPermission()
  notificationPermission.value = result
  if (result === 'granted') {
    runAlertCheck()
    if (!alertInterval) {
      alertInterval = setInterval(() => runAlertCheck(), 60000)
    }
  }
}

onMounted(() => {
  // repo convention: kill the global loading spinner or it spins forever
  document.getElementById('spinner-wrapper')?.style.setProperty('display', 'none')
  refresh()
  if (typeof window !== 'undefined' && 'Notification' in window) {
    notificationPermission.value = Notification.permission
  } else {
    notificationPermission.value = 'unsupported'
  }
  if (notificationPermission.value === 'granted') {
    runAlertCheck()
    // Re-check periodically while the tab stays open - no push infra, so
    // this only fires while the page is open.
    alertInterval = setInterval(() => runAlertCheck(), 60000)
  }
})
onBeforeUnmount(() => {
  if (alertInterval) clearInterval(alertInterval)
  for (const [, off] of liveUnsubs) off()
  liveUnsubs.clear()
})
</script>

<style scoped>
.add-input {
  max-width: 320px;
}
.portfolio-table th,
.portfolio-table td {
  white-space: nowrap;
}
.atl-check {
  flex: 0 0 auto;
  margin-right: 4px !important;
}
</style>
