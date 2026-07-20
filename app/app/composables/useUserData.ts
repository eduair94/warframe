import { computed, ref, watch } from 'vue'
import {
  emptyFoundryData,
  emptyUserData,
  isEmptyUserData,
  newId,
  onSectionWrite,
  readOwnerUid,
  readSection,
  readUserData,
  writeOwnerUid,
  writeSection,
  writeUserData,
  type FoundryCounters,
  type FoundryData,
  type GoalEntry,
  type TradeEntry,
  type UserData,
  type UserSection,
  type FoundryItemProgress,
  type UserSettings,
  type VaultEntry,
  type WatchlistEntry,
} from '../utils/userStorage'

/**
 * THE data layer for every account-aware tool (/portfolio, /vault, /goals,
 * /ledger, /account).
 *
 * Local-first, cloud-synced
 * -------------------------
 * Every mutation writes localStorage SYNCHRONOUSLY and updates the reactive
 * copy immediately, so the UI never waits on the network and everything works
 * signed out. When a session exists the touched section is additionally pushed
 * to the API after a short debounce. Signing in MERGES (never replaces) the
 * local snapshot with the stored one — see services/userMerge.ts.
 *
 * State lives at module scope so all pages/components share one copy. That is
 * safe across SSR requests because nothing here ever populates it on the
 * server: `hydrate()` is client-only and the server always renders the empty,
 * signed-out shell (which is also what crawlers index).
 */

const SYNC_DEBOUNCE_MS = 1200

const watchlist = ref<Record<string, WatchlistEntry>>({})
const vault = ref<Record<string, VaultEntry>>({})
const goals = ref<GoalEntry[]>([])
const trades = ref<TradeEntry[]>([])
const foundry = ref<FoundryData>(emptyFoundryData())
const settings = ref<UserSettings>({})

export type SyncState = 'off' | 'idle' | 'syncing' | 'error'
const syncState = ref<SyncState>('off')
const lastSyncedAt = ref<string | null>(null)

let hydrated = false
let mergedForUid: string | null = null
/**
 * The uid whose merge has SUCCEEDED. Pushing a section is only safe once the
 * local snapshot and the cloud copy have been unioned — a push before that
 * would overwrite the server with whatever this device happened to have.
 */
let syncArmedForUid: string | null = null
let watcherStarted = false
const pendingSections = new Set<UserSection>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null
/** Guards the reload-on-write listener against the writes we make ourselves. */
let writingLocally = false

function now(): string {
  return new Date().toISOString()
}

/** A real object (not null, not an array) — used to validate adopted sections. */
function isPlainObject(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function loadSection(section: UserSection): void {
  switch (section) {
    case 'watchlist':
      watchlist.value = readSection<Record<string, WatchlistEntry>>('watchlist', {})
      break
    case 'vault':
      vault.value = readSection<Record<string, VaultEntry>>('vault', {})
      break
    case 'goals': {
      // Self-heal storage that is already the wrong shape, rather than making
      // the user clear site data to escape one bad import.
      const rawGoals = readSection<GoalEntry[]>('goals', [])
      goals.value = Array.isArray(rawGoals) ? rawGoals : []
      break
    }
    case 'trades': {
      const rawTrades = readSection<TradeEntry[]>('trades', [])
      trades.value = Array.isArray(rawTrades) ? rawTrades : []
      break
    }
    case 'foundry':
      foundry.value = readSection<FoundryData>('foundry', emptyFoundryData())
      break
    case 'settings':
      settings.value = readSection<UserSettings>('settings', {})
      break
  }
}

function snapshot(): UserData {
  return {
    watchlist: watchlist.value,
    vault: vault.value,
    goals: goals.value,
    trades: trades.value,
    foundry: foundry.value,
    settings: settings.value,
    updatedAt: now(),
  }
}

function valueOf(section: UserSection): unknown {
  switch (section) {
    case 'watchlist':
      return watchlist.value
    case 'vault':
      return vault.value
    case 'goals':
      return goals.value
    case 'trades':
      return trades.value
    case 'foundry':
      return foundry.value
    case 'settings':
      return settings.value
  }
}

export function useUserData() {
  const auth = useAuthStore()
  const api = useUserApi()
  const { locale } = useI18n()

  /** Persist a section locally, then queue a cloud sync when signed in. */
  function commit(section: UserSection): void {
    writingLocally = true
    try {
      writeSection(section, valueOf(section))
    } finally {
      writingLocally = false
    }
    queueSync(section)
  }

  /** Safe to push? Only after this account's merge has actually completed. */
  function canSync(): boolean {
    return !!auth.signedIn && !!syncArmedForUid && syncArmedForUid === (auth.profile?.uid || '')
  }

  function queueSync(section: UserSection): void {
    // Not armed yet (merge in flight, or it failed): the mutation is already in
    // localStorage and the next successful merge unions it in, so nothing is
    // lost by NOT pushing — whereas pushing now could clobber the cloud copy.
    if (!import.meta.client || !canSync()) return
    pendingSections.add(section)
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => void flush(), SYNC_DEBOUNCE_MS)
  }

  /** Push every queued section. Best-effort: failures set `syncState`, never throw. */
  async function flush(): Promise<void> {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (!import.meta.client || !canSync() || !pendingSections.size) return
    const sections = Array.from(pendingSections)
    pendingSections.clear()
    syncState.value = 'syncing'
    let ok = true
    for (const section of sections) {
      const done = await api.sync(section, valueOf(section))
      if (!done) ok = false
    }
    if (ok) {
      syncState.value = 'idle'
      lastSyncedAt.value = now()
    } else {
      syncState.value = 'error'
      // Keep them queued so the next mutation (or a manual "sync now") retries.
      for (const section of sections) pendingSections.add(section)
    }
  }

  /** Read localStorage into the reactive copies. Client-only, runs once. */
  function hydrate(): void {
    if (!import.meta.client || hydrated) return
    hydrated = true
    loadSection('watchlist')
    loadSection('vault')
    loadSection('goals')
    loadSection('trades')
    loadSection('foundry')
    loadSection('settings')
    // The legacy portfolio service writes the watchlist directly; mirror those
    // writes back into the reactive copy (and into the cloud) instead of
    // letting the two drift apart.
    onSectionWrite((section) => {
      if (writingLocally) return
      loadSection(section)
      queueSync(section)
    })
  }

  /**
   * First sign-in on this device: union local + server, then adopt the result
   * everywhere. Runs once per uid per page load.
   */
  async function mergeOnSignIn(): Promise<void> {
    if (!import.meta.client || !auth.signedIn) return
    const uid = auth.profile?.uid || ''
    if (!uid || mergedForUid === uid) return
    mergedForUid = uid
    syncState.value = 'syncing'
    const owner = readOwnerUid()
    const local = snapshot()
    // The local data belongs to a DIFFERENT account — a shared browser where
    // someone signed out and someone else signed in. Never upload it: pull this
    // account's own copy and let adopt() replace what is on the device.
    const foreign = !!owner && owner !== uid
    // Nothing local worth merging — a plain read is cheaper and identical.
    const account =
      foreign || isEmptyUserData(local)
        ? await api.me(locale.value)
        : await api.merge(local, locale.value)
    if (!account) {
      // Leave the account UNARMED and clear the stamp, so a later syncNow() or
      // the next page load retries the non-destructive merge instead of pushing
      // pre-merge local state over the server copy.
      mergedForUid = null
      syncState.value = 'error'
      return
    }
    adopt(account.data)
    writeOwnerUid(uid)
    syncArmedForUid = uid
    syncState.value = 'idle'
    lastSyncedAt.value = now()
  }

  /**
   * Replace all local state with a server payload (post-merge / post-import).
   *
   * Every section is TYPE-checked, not merely truthy-checked: /account lets a
   * user import a hand-written JSON file, and a wrong-typed section (an object
   * where an array belongs) would otherwise be adopted, persisted, and then
   * crash every page that iterates it — permanently, since it reloads from
   * localStorage on the next visit.
   */
  function adopt(data: Partial<UserData> | null | undefined): void {
    if (!data) return
    const src = { ...emptyUserData(), ...data } as UserData
    const next: UserData = {
      watchlist: isPlainObject(src.watchlist) ? src.watchlist : {},
      vault: isPlainObject(src.vault) ? src.vault : {},
      goals: Array.isArray(src.goals) ? src.goals : [],
      trades: Array.isArray(src.trades) ? src.trades : [],
      foundry: isPlainObject(src.foundry)
        ? { ...emptyFoundryData(), ...src.foundry }
        : emptyFoundryData(),
      settings: isPlainObject(src.settings) ? src.settings : {},
      updatedAt: typeof src.updatedAt === 'string' ? src.updatedAt : now(),
    }
    watchlist.value = next.watchlist
    vault.value = next.vault
    goals.value = next.goals
    trades.value = next.trades
    foundry.value = next.foundry
    settings.value = next.settings
    writingLocally = true
    try {
      writeUserData(next)
    } finally {
      writingLocally = false
    }
  }

  /**
   * Wires hydration + the sign-in/out reactions. Call once from any consuming
   * page's setup; repeat calls are no-ops.
   */
  function start(): void {
    if (!import.meta.client) return
    hydrate()
    if (watcherStarted) return
    watcherStarted = true
    auth.detect()
    void auth.init()
    watch(
      () => auth.profile?.uid || '',
      (uid) => {
        if (uid) {
          void mergeOnSignIn()
        } else {
          mergedForUid = null
          syncArmedForUid = null
          syncState.value = 'off'
        }
      },
      { immediate: true }
    )
  }

  // ------------------------------------------------------------- watchlist

  function watchItem(item: { url_name: string; item_name: string }): void {
    if (!item?.url_name || watchlist.value[item.url_name]) return
    watchlist.value = {
      ...watchlist.value,
      [item.url_name]: {
        url_name: item.url_name,
        item_name: item.item_name || item.url_name,
        addedAt: now(),
        updatedAt: now(),
        ownedQty: 0,
        alertBelow: null,
        alertAbove: null,
        notifiedBelow: false,
        notifiedAbove: false,
        alertAtl: false,
        notifiedAtl: false,
      },
    }
    commit('watchlist')
  }

  function unwatchItem(urlName: string): void {
    if (!watchlist.value[urlName]) return
    const next = { ...watchlist.value }
    delete next[urlName]
    watchlist.value = next
    commit('watchlist')
  }

  // ----------------------------------------------------------------- vault

  /** Sets an item's held quantity. `qty <= 0` removes it. */
  function setVaultQty(
    item: { url_name: string; item_name?: string },
    qty: number,
    extra: { cost?: number | null; note?: string } = {}
  ): void {
    const url = item?.url_name
    if (!url) return
    const rounded = Math.max(0, Math.round(Number(qty) || 0))
    const next = { ...vault.value }
    if (rounded <= 0) {
      delete next[url]
    } else {
      const prev = next[url]
      next[url] = {
        url_name: url,
        item_name: item.item_name || prev?.item_name || url,
        qty: rounded,
        cost: extra.cost !== undefined ? extra.cost : (prev?.cost ?? null),
        ...(extra.note !== undefined
          ? extra.note
            ? { note: extra.note }
            : {}
          : prev?.note
            ? { note: prev.note }
            : {}),
        updatedAt: now(),
      }
    }
    vault.value = next
    commit('vault')
  }

  /** Relative change, e.g. +1 when a trade is recorded. Clamps at zero. */
  function adjustVaultQty(
    item: { url_name: string; item_name?: string },
    delta: number
  ): void {
    const current = vault.value[item.url_name]?.qty || 0
    setVaultQty(item, current + (Number(delta) || 0))
  }

  function removeVault(urlName: string): void {
    if (!vault.value[urlName]) return
    const next = { ...vault.value }
    delete next[urlName]
    vault.value = next
    commit('vault')
  }

  // ----------------------------------------------------------------- goals

  function addGoal(
    item: { url_name: string; item_name?: string },
    targetQty = 1,
    note?: string
  ): GoalEntry | null {
    if (!item?.url_name) return null
    if (goals.value.some((g) => g.url_name === item.url_name)) return null
    const goal: GoalEntry = {
      id: newId(),
      url_name: item.url_name,
      item_name: item.item_name || item.url_name,
      targetQty: Math.max(1, Math.round(Number(targetQty) || 1)),
      createdAt: now(),
      updatedAt: now(),
      done: false,
      ...(note ? { note } : {}),
    }
    goals.value = [...goals.value, goal]
    commit('goals')
    return goal
  }

  function updateGoal(id: string, patch: Partial<GoalEntry>): void {
    let touched = false
    goals.value = goals.value.map((g) => {
      if (g.id !== id) return g
      touched = true
      // Stamp the edit — the cloud merge decides collisions on `updatedAt`.
      return { ...g, ...patch, id: g.id, updatedAt: now() }
    })
    if (touched) commit('goals')
  }

  function removeGoal(id: string): void {
    const next = goals.value.filter((g) => g.id !== id)
    if (next.length === goals.value.length) return
    goals.value = next
    commit('goals')
  }

  // ---------------------------------------------------------------- trades

  /**
   * Records a trade. `syncVault` (default true) keeps the inventory honest:
   * a buy adds to the vault, a sell removes from it.
   */
  function addTrade(
    input: Omit<TradeEntry, 'id' | 'at'> & { at?: string },
    syncVault = true
  ): TradeEntry | null {
    if (!input?.url_name) return null
    const trade: TradeEntry = {
      id: newId(),
      url_name: input.url_name,
      item_name: input.item_name || input.url_name,
      side: input.side === 'buy' ? 'buy' : 'sell',
      qty: Math.max(1, Math.round(Number(input.qty) || 1)),
      price: Math.max(0, Number(input.price) || 0),
      at: input.at || now(),
      ...(input.note ? { note: input.note } : {}),
    }
    trades.value = [...trades.value, trade].sort(
      (a, b) => Date.parse(a.at) - Date.parse(b.at)
    )
    commit('trades')
    if (syncVault) {
      adjustVaultQty(
        { url_name: trade.url_name, item_name: trade.item_name },
        trade.side === 'buy' ? trade.qty : -trade.qty
      )
    }
    return trade
  }

  function removeTrade(id: string): void {
    const next = trades.value.filter((t) => t.id !== id)
    if (next.length === trades.value.length) return
    trades.value = next
    commit('trades')
  }

  // --------------------------------------------------------------- foundry

  /** Replaces the whole foundry payload (import / bulk edit). */
  function setFoundry(next: FoundryData): void {
    foundry.value = { ...emptyFoundryData(), ...next, updatedAt: now() }
    commit('foundry')
  }

  /**
   * Ticks Built / Mastered on one item. Mirrors the semantics players already
   * know from warframe-foundry.app: mastering something implies you built it,
   * and un-building implies you have not mastered it.
   */
  function setFoundryItem(
    uniqueKey: string,
    patch: { built?: boolean; mastered?: boolean }
  ): void {
    if (!uniqueKey) return
    const prev = foundry.value.items[uniqueKey] || {}
    const entry: FoundryItemProgress = { ...prev }
    if (patch.built !== undefined) entry.built = patch.built || undefined
    if (patch.mastered !== undefined) entry.mastered = patch.mastered || undefined
    // Order matters: un-building must clear `mastered` BEFORE the
    // mastered-implies-built rule runs, or un-ticking Built on a mastered item
    // reads the stale flag and immediately puts built back.
    if (patch.built === false) entry.mastered = undefined
    if (entry.mastered) entry.built = true
    const items = { ...foundry.value.items }
    if (!entry.built && !entry.mastered && !entry.comp) delete items[uniqueKey]
    else items[uniqueKey] = entry
    foundry.value = { ...foundry.value, items, updatedAt: now() }
    commit('foundry')
  }

  /** Sets how many of one component the player owns (0 clears it). */
  function setFoundryComponent(uniqueKey: string, componentKey: string, qty: number): void {
    if (!uniqueKey || !componentKey) return
    const prev = foundry.value.items[uniqueKey] || {}
    const comp = { ...(prev.comp || {}) }
    const n = Math.max(0, Math.round(Number(qty) || 0))
    if (n > 0) comp[componentKey] = n
    else delete comp[componentKey]
    const entry: FoundryItemProgress = { ...prev }
    if (Object.keys(comp).length) entry.comp = comp
    else delete entry.comp
    const items = { ...foundry.value.items }
    if (!entry.built && !entry.mastered && !entry.comp) delete items[uniqueKey]
    else items[uniqueKey] = entry
    foundry.value = { ...foundry.value, items, updatedAt: now() }
    commit('foundry')
  }

  /** Sets how many units of a resource the player has on hand. */
  function setFoundryResource(resourceKey: string, qty: number): void {
    if (!resourceKey) return
    const resources = { ...foundry.value.resources }
    const n = Math.max(0, Math.round(Number(qty) || 0))
    if (n > 0) resources[resourceKey] = n
    else delete resources[resourceKey]
    foundry.value = { ...foundry.value, resources, updatedAt: now() }
    commit('foundry')
  }

  function setFoundryCounters(patch: Partial<FoundryCounters>): void {
    foundry.value = {
      ...foundry.value,
      counters: { ...foundry.value.counters, ...patch },
      updatedAt: now(),
    }
    commit('foundry')
  }

  /** Hides / unhides an item from the checklist (their "exclusion" feature). */
  function toggleFoundryExcluded(uniqueKey: string): void {
    if (!uniqueKey) return
    const set = new Set(foundry.value.excluded || [])
    if (set.has(uniqueKey)) set.delete(uniqueKey)
    else set.add(uniqueKey)
    foundry.value = { ...foundry.value, excluded: Array.from(set), updatedAt: now() }
    commit('foundry')
  }

  /**
   * Bulk tick — "mark every item at or below MR X as mastered", the single most
   * requested thing warframe-foundry.app never shipped (its users hand-ticked
   * hundreds of rows to get started). `keys` comes from the catalogue.
   */
  function bulkFoundryMastered(keys: string[], mastered = true): number {
    if (!Array.isArray(keys) || !keys.length) return 0
    const items = { ...foundry.value.items }
    let changed = 0
    for (const key of keys) {
      if (!key) continue
      const prev = items[key] || {}
      if (mastered) {
        if (prev.mastered) continue
        items[key] = { ...prev, built: true, mastered: true }
      } else {
        if (!prev.mastered && !prev.built) continue
        const entry: FoundryItemProgress = { ...prev }
        delete entry.mastered
        delete entry.built
        if (entry.comp) items[key] = entry
        else delete items[key]
      }
      changed++
    }
    if (!changed) return 0
    foundry.value = { ...foundry.value, items, updatedAt: now() }
    commit('foundry')
    return changed
  }

  // -------------------------------------------------------------- settings

  function patchSettings(patch: Partial<UserSettings>): void {
    settings.value = { ...settings.value, ...patch }
    commit('settings')
  }

  // ------------------------------------------------------- import / export

  /** The full payload, for the /account "export my data" button. */
  function exportData(): UserData {
    return snapshot()
  }

  /**
   * Adopts an exported payload. Signed in, it goes through the server merge so
   * the cloud copy is the union, not a replacement.
   */
  async function importData(data: Partial<UserData>): Promise<boolean> {
    const merged: UserData = { ...snapshot(), ...data, updatedAt: now() }
    adopt(merged)
    if (auth.signedIn) {
      const account = await api.merge(merged, locale.value)
      if (!account) {
        syncState.value = 'error'
        return false
      }
      adopt(account.data)
      lastSyncedAt.value = now()
      syncState.value = 'idle'
    }
    return true
  }

  /** Wipes local state (and, when asked, the server copy too). */
  async function resetAll(alsoServer = false): Promise<void> {
    adopt(emptyUserData())
    if (alsoServer && auth.signedIn) await api.destroy()
  }

  /** Forces an immediate full push (the /account "sync now" button). */
  async function syncNow(): Promise<void> {
    if (!auth.signedIn) return
    // Not armed means the sign-in merge never completed. Retry THAT (a union),
    // never a push — a push here is exactly the destructive overwrite the
    // arming flag exists to prevent.
    if (!canSync()) {
      mergedForUid = null
      await mergeOnSignIn()
      return
    }
    pendingSections.add('watchlist')
    pendingSections.add('vault')
    pendingSections.add('goals')
    pendingSections.add('trades')
    pendingSections.add('foundry')
    pendingSections.add('settings')
    await flush()
  }

  return {
    // state
    watchlist,
    vault,
    goals,
    trades,
    foundry,
    settings,
    syncState: computed(() => syncState.value),
    lastSyncedAt: computed(() => lastSyncedAt.value),
    // lifecycle
    start,
    hydrate,
    adopt,
    flush,
    syncNow,
    // watchlist
    watchItem,
    unwatchItem,
    // vault
    setVaultQty,
    adjustVaultQty,
    removeVault,
    // goals
    addGoal,
    updateGoal,
    removeGoal,
    // trades
    addTrade,
    removeTrade,
    // foundry
    setFoundry,
    setFoundryItem,
    setFoundryComponent,
    setFoundryResource,
    setFoundryCounters,
    toggleFoundryExcluded,
    bulkFoundryMastered,
    // settings
    patchSettings,
    // data management
    exportData,
    importData,
    resetAll,
  }
}
