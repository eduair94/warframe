<template>
  <div class="my-4 portfolio-page">
    <div class="d-flex flex-wrap align-center justify-space-between gap-10 mb-2">
      <h1 class="text-h4">{{ t('portfolio.title') }}</h1>
      <v-btn variant="text" size="small" prepend-icon="mdi-help-circle-outline" @click="startTour">
        {{ t('portfolio.replayTour') }}
      </v-btn>
    </div>
    <i18n-t keypath="portfolio.intro.text" tag="p" class="text-body-2 mb-4">
      <template #atl><strong>{{ t('portfolio.intro.atl') }}</strong></template>
    </i18n-t>

    <!-- Add-alert panel: category chips (step 1) -> scoped search (step 2). -->
    <v-card class="pa-4 mb-4" variant="outlined">
      <div class="text-caption text-medium-emphasis mb-1">{{ t('portfolio.pickCategory') }}</div>
      <v-chip-group
        v-model="category"
        data-tour="alerts-category"
        mandatory
        column
        selected-class="text-primary"
        class="mb-3"
      >
        <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small" variant="outlined">
          {{ t('portfolio.categories.' + c) }}
        </v-chip>
      </v-chip-group>

      <div class="d-flex flex-wrap align-center gap-10">
        <v-autocomplete
          v-model="pickerModel"
          data-tour="alerts-search"
          :items="searchItems"
          item-title="name"
          item-value="url_name"
          return-object
          :label="t('portfolio.addLabel')"
          :no-data-text="t('portfolio.noMatches')"
          class="add-input"
          density="compact"
          variant="outlined"
          hide-details
          auto-select-first
          @update:model-value="onPick"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="item.raw.name">
              <template #prepend>
                <v-avatar size="28" rounded="sm">
                  <v-img :src="itemThumb({ urlName: item.raw.url_name, itemName: item.raw.item_name, thumb: item.raw.thumb })" />
                </v-avatar>
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>
      </div>

      <div data-tour="alerts-notify" class="mt-3 d-flex flex-wrap align-center gap-10">
        <v-btn
          v-if="notificationPermission !== 'granted' && notificationPermission !== 'denied'"
          color="secondary"
          variant="outlined"
          size="small"
          @click="enableAlerts"
        >
          <v-icon size="small" class="mr-1">mdi-bell-outline</v-icon>
          {{ t('portfolio.enableAlerts') }}
        </v-btn>
        <span v-else-if="pushActive" class="text-caption d-flex align-center">
          <v-icon size="small" color="green" class="mr-1">mdi-cloud-check-outline</v-icon>
          {{ t('portfolio.pushOn') }}
        </span>
        <span v-else-if="notificationPermission === 'granted'" class="text-caption d-flex align-center">
          <v-icon size="small" color="green" class="mr-1">mdi-bell-check</v-icon>
          {{ t('portfolio.alertsEnabled') }}
        </span>
        <span v-if="notificationPermission === 'denied'" class="text-caption text-error d-flex align-center">
          <v-icon size="x-small" class="mr-1">mdi-bell-off-outline</v-icon>{{ t('portfolio.pushBlocked') }}
        </span>
        <span v-else-if="!pushActive" class="text-caption text-medium-emphasis">
          <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>{{ t('portfolio.tabOnlyNote') }}
        </span>
      </div>
    </v-card>

    <v-alert v-if="notificationPermission === 'unsupported'" type="info" density="compact" variant="outlined" class="mb-4">
      {{ t('portfolio.unsupported') }}
    </v-alert>

    <div v-if="!watchlist.length" class="text-body-2 text-medium-emphasis text-center py-8">
      <v-icon size="40" class="mb-2 d-block mx-auto" color="grey">mdi-bell-plus-outline</v-icon>
      {{ t('portfolio.empty') }}
    </div>

    <template v-else>
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-caption text-medium-emphasis">{{ t('portfolio.watching', { n: watchlist.length }) }}</span>
        <span class="text-subtitle-2">{{ t('portfolio.totalValue') }} <strong>{{ totalValue.toFixed(0) }}p</strong></span>
      </div>
      <v-row data-tour="alerts-list" dense>
        <v-col v-for="entry in enrichedWatchlist" :key="entry.url_name" cols="12" sm="6" md="4">
          <AlertCard :entry="entry" @edit="openEdit" @delete="removeItem" />
        </v-col>
      </v-row>
    </template>

    <AlertEditSheet v-model="sheetOpen" :entry="activeEntry" @save="saveAlert" @delete="removeFromSheet" />
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

const { t } = useI18n()
const { localItemName } = useLocalizedName()
const { itemThumb } = useItemThumb()
const { categoryOf, categoryOptionsFor } = useItemCategory()
const { startTour, maybeAutoStart } = useAlertTour()
const push = usePushAlerts()
const { trackWatchlist, trackAlert, trackPush, trackAction } = useAnalytics()
const route = useRoute()
const base = useApiBase()

// Long-history analytics (atl / pctFromAtl / spark) power the all-time-low alert
// and the sheet's price context - a signal warframe.market's 90-day chart lacks.
const { data } = await useAsyncData('portfolio-market-analytics', () =>
  $fetch<any>(`${base}/market_analytics`).catch(() => null),
)
const analytics = computed<any[]>(() => (data.value && data.value.items) || [])

const itemsStore = useItemsStore()
const allItems = computed<any[]>(() => itemsStore.allItems as any[])

const watchlist = ref<WatchlistEntry[]>([])
const pickerModel = ref<any>(null)
const category = ref('All')
const sheetOpen = ref(false)
const activeEntry = ref<any>(null)
const notificationPermission = ref<string>('default')
// When true, the server delivers alerts (even tab-closed) — so the client-side
// foreground checks below are suppressed to avoid double-notifying.
const pushActive = ref(false)
let alertInterval: ReturnType<typeof setInterval> | null = null
// Real-time alert path: latest live sell price per watched item, overlaid onto the
// catalog before running the SAME client-side checkAlerts. The 60s interval stays a backstop.
const livePrices = ref<Record<string, number>>({})
const liveUnsubs = new Map<string, () => void>()

// Lightweight, searchable catalog rows (localized name baked in for the typeahead).
const lightItems = computed<any[]>(() =>
  allItems.value.map((i) => ({
    url_name: i.url_name,
    item_name: i.item_name,
    name: localItemName(i),
    tags: i.tags || [],
    thumb: i.thumb,
  })),
)
const categoryOptions = computed<string[]>(() => categoryOptionsFor(allItems.value))
// Step 2 is scoped to the chosen chip (Baymard "search within category").
const searchItems = computed<any[]>(() =>
  category.value === 'All'
    ? lightItems.value
    : lightItems.value.filter((i) => categoryOf(i.tags) === category.value),
)

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
    map[a.url_name] = { atl: a.atl, pctFromAtl: a.pctFromAtl, sell: a.sell, spark: a.spark }
  })
  return map
})
const enrichedWatchlist = computed(() =>
  watchlist.value.map((entry) => {
    const live = itemsByUrlName.value[entry.url_name]
    const a = analyticsByUrl.value[entry.url_name]
    // Prefer the real-time sell price; fall back to catalog then analytics.
    const currentSell = livePrices.value[entry.url_name] ?? live?.market?.sell ?? a?.sell ?? null
    return {
      ...entry,
      name: localItemName(live || entry),
      thumb: live?.thumb,
      currentSell,
      value: currentSell != null ? currentSell * (entry.ownedQty || 0) : null,
      atl: a && typeof a.atl === 'number' ? a.atl : null,
      pctFromAtl: a && typeof a.pctFromAtl === 'number' ? a.pctFromAtl : null,
      spark: a?.spark || [],
    }
  }),
)
const totalValue = computed<number>(() =>
  enrichedWatchlist.value.reduce((sum, e) => sum + (e.value || 0), 0),
)

function refresh() {
  watchlist.value = getWatchlist()
  subscribeWatchlistLive()
  // Keep the open sheet's entry in sync after a save/refresh.
  if (activeEntry.value) {
    activeEntry.value = enrichedWatchlist.value.find((e) => e.url_name === activeEntry.value.url_name) || activeEntry.value
  }
}

// Adding from the typeahead immediately opens the editor with the item
// pre-selected (contextual creation, à la Coinbase/Robinhood/Yahoo).
function onPick(picked: any) {
  if (!picked || !picked.url_name) return
  const exists = watchlist.value.some((w) => w.url_name === picked.url_name)
  if (!exists) {
    toggleWatch({ url_name: picked.url_name, item_name: picked.item_name })
    // Only a brand-new row counts as an add — re-picking a watched item just
    // reopens its editor.
    trackWatchlist('add', picked.item_name, { category: category.value })
  }
  refresh()
  const entry = enrichedWatchlist.value.find((e) => e.url_name === picked.url_name)
  if (entry) openEdit(entry)
  // Reset the field so the same item can be re-picked later.
  pickerModel.value = null
}

// Build the server payload from the local watchlist (only rows that arm something).
function alertsPayload() {
  return watchlist.value
    .filter((w) => w.alertBelow != null || w.alertAbove != null || w.alertAtl)
    .map((w) => ({
      url_name: w.url_name,
      item_name: w.item_name,
      below: w.alertBelow ?? null,
      above: w.alertAbove ?? null,
      atl: !!w.alertAtl,
    }))
}
// Mirror the local watchlist to the push backend whenever it changes (no-op
// unless this browser has a live push subscription).
function syncPush() {
  if (pushActive.value) push.syncAlerts(alertsPayload())
}

function openEdit(entry: any) {
  activeEntry.value = entry
  sheetOpen.value = true
}

function saveAlert(patch: {
  url_name: string
  alertBelow: number | null
  alertAbove: number | null
  alertAtl: boolean
  ownedQty: number
}) {
  const prev = watchlist.value.find((w) => w.url_name === patch.url_name)
  const wasArmed = !!prev && (prev.alertBelow != null || prev.alertAbove != null || !!prev.alertAtl)
  updateEntry(patch.url_name, {
    alertBelow: patch.alertBelow,
    alertAbove: patch.alertAbove,
    alertAtl: patch.alertAtl,
    ownedQty: patch.ownedQty,
  })
  refresh()
  runAlertCheck()
  syncPush()
  trackAlert(wasArmed ? 'update' : 'create', {
    has_below: patch.alertBelow != null,
    has_above: patch.alertAbove != null,
    has_atl: patch.alertAtl,
    target: patch.alertBelow ?? patch.alertAbove ?? undefined,
  })
}

function removeItem(urlName: string, source: 'card' | 'sheet' = 'card') {
  const entry = watchlist.value.find((w) => w.url_name === urlName)
  const wasArmed = !!entry && (entry.alertBelow != null || entry.alertAbove != null || !!entry.alertAtl)
  removeFromWatchlist(urlName)
  if (activeEntry.value?.url_name === urlName) sheetOpen.value = false
  refresh()
  syncPush()
  trackWatchlist('remove', entry?.item_name || urlName, { source })
  // Dropping a row that had a threshold armed is also the only way to delete an alert.
  if (wasArmed) trackAlert('delete', { source })
}
// The card's ✕ and the sheet's Remove land on the same handler; the sheet passes
// its own source so the funnel can tell the two surfaces apart.
function removeFromSheet(urlName: string) {
  removeItem(urlName, 'sheet')
}

// checkAlerts() fires the browser Notification and flips the entry's notified*
// flag itself, returning nothing — diffing those flags across the call is the
// only way to observe a REAL fire, and it de-dupes for free: the flag stays set,
// so the 60s poll (or a burst of live ticks) cannot re-emit the same alert.
const NOTIFIED_FLAGS = [
  ['below', 'notifiedBelow'],
  ['above', 'notifiedAbove'],
  ['atl', 'notifiedAtl'],
] as const
function notifiedKeys(): Set<string> {
  const keys = new Set<string>()
  for (const w of getWatchlist()) {
    for (const [dir, flag] of NOTIFIED_FLAGS) if (w[flag]) keys.add(`${w.url_name}|${dir}`)
  }
  return keys
}
function trackFiredAlerts(before: Set<string>) {
  for (const w of getWatchlist()) {
    for (const [dir, flag] of NOTIFIED_FLAGS) {
      if (!w[flag] || before.has(`${w.url_name}|${dir}`)) continue
      trackAlert('fire', { direction: dir, item_name: w.item_name })
    }
  }
}

function runAlertCheck() {
  if (pushActive.value) return // server owns delivery
  const before = notifiedKeys()
  checkAlerts(allItems.value, analyticsByUrl.value)
  trackFiredAlerts(before)
}
// Overlay live sell prices onto a shallow copy of the catalog, then run the same
// client-side check (never mutate the Pinia getter objects).
function runLiveAlertCheck() {
  if (pushActive.value) return // server owns delivery
  if (notificationPermission.value !== 'granted') return
  const overlaid = watchlist.value.map((w) => {
    const it = itemsByUrlName.value[w.url_name] || { url_name: w.url_name, item_name: w.item_name }
    const sell = livePrices.value[w.url_name]
    return sell != null ? { ...it, market: { ...(it.market || {}), sell } } : it
  })
  const before = notifiedKeys()
  checkAlerts(overlaid, analyticsByUrl.value)
  trackFiredAlerts(before)
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
  // Prefer real background push (fires with the tab closed).
  const res = await push.subscribe(alertsPayload())
  // One push_* event per outcome, with the raw SubscribeResult kept as a param so
  // 'disabled' (no server VAPID) stays distinguishable from a real 'error'.
  trackPush(res === 'subscribed' ? 'subscribe' : res === 'denied' ? 'denied' : 'error', { result: res })
  if (res === 'subscribed') {
    pushActive.value = true
    notificationPermission.value = 'granted'
    if (alertInterval) {
      clearInterval(alertInterval)
      alertInterval = null
    }
    return
  }
  if (res === 'denied') {
    notificationPermission.value = 'denied'
    return
  }
  // 'disabled' (server has no VAPID) / 'unsupported' / 'error' → fall back to the
  // original client-side notifications (only while this tab is open).
  const result = await requestNotificationPermission()
  notificationPermission.value = result
  if (result === 'granted') {
    runAlertCheck()
    if (!alertInterval) {
      alertInterval = setInterval(() => runAlertCheck(), 60000)
    }
  }
}

onMounted(async () => {
  // repo convention: kill the global loading spinner or it spins forever
  document.getElementById('spinner-wrapper')?.style.setProperty('display', 'none')
  refresh()
  if (typeof window !== 'undefined' && 'Notification' in window) {
    notificationPermission.value = Notification.permission
  } else {
    notificationPermission.value = 'unsupported'
  }

  // If this browser already has a live push subscription, the server delivers
  // alerts (even tab-closed): mark push active and re-sync the current list.
  await push.refreshState()
  if (push.subscribed.value && push.serverEnabled.value) {
    pushActive.value = true
    notificationPermission.value = 'granted'
    push.syncAlerts(alertsPayload())
  } else if (notificationPermission.value === 'granted') {
    // Foreground fallback (no push): re-check while the tab stays open.
    runAlertCheck()
    alertInterval = setInterval(() => runAlertCheck(), 60000)
  }

  // Deep-link seam: /portfolio?alert=<url_name> adds & opens that item's editor,
  // so other pages can later drop a contextual "bell" that lands here.
  const deep = route.query.alert
  const deepUrl = Array.isArray(deep) ? deep[0] : deep
  if (deepUrl) {
    const it = itemsByUrlName.value[deepUrl as string]
    trackAction('alert_deeplink', { found: !!it })
    if (it) onPick({ url_name: it.url_name, item_name: it.item_name })
  }
  maybeAutoStart()
})
onBeforeUnmount(() => {
  if (alertInterval) clearInterval(alertInterval)
  for (const [, off] of liveUnsubs) off()
  liveUnsubs.clear()
})
</script>

<style scoped>
.add-input {
  flex: 1 1 auto;
  max-width: 420px;
}
</style>
