/**
 * Local-first persistence for every account-aware tool.
 *
 * The app has always kept the watchlist in localStorage (key
 * `warframe_portfolio_v1`). Accounts do NOT replace that model — they extend
 * it: every tool still writes localStorage synchronously so it works signed
 * out, offline and instantly, and the account layer mirrors the same objects to
 * the API when a session exists (see composables/useUserData.ts).
 *
 * That is why the watchlist keeps its original key: an existing visitor who
 * signs in for the first time must find their watchlist exactly where it was.
 *
 * This module is deliberately framework-free (no refs, no Nuxt imports) so the
 * pure read/write/merge logic is unit-testable under the backend's jest setup.
 */

// ---------------------------------------------------------------- shapes

export interface WatchlistEntry {
  url_name: string
  item_name: string
  addedAt: string
  /**
   * Last EDIT. The cloud merge picks a winner on this rather than `addedAt` —
   * an entry edited today must beat the same entry sitting untouched on another
   * device, and `addedAt` never changes.
   */
  updatedAt?: string
  ownedQty: number
  alertBelow: number | null
  alertAbove: number | null
  notifiedBelow: boolean
  notifiedAbove: boolean
  alertAtl?: boolean
  notifiedAtl?: boolean
}

/** One held item in the Vault (inventory tracker). */
export interface VaultEntry {
  url_name: string
  item_name: string
  qty: number
  /** Average platinum paid per unit, when the user recorded it. */
  cost?: number | null
  note?: string
  updatedAt: string
}

/** A prime set the player is farming towards. */
export interface GoalEntry {
  id: string
  url_name: string
  item_name: string
  targetQty: number
  createdAt: string
  /** Last EDIT — the merge tiebreaker (see WatchlistEntry.updatedAt). */
  updatedAt?: string
  note?: string
  done?: boolean
}

/** One recorded trade in the ledger. */
export interface TradeEntry {
  id: string
  url_name: string
  item_name: string
  side: 'buy' | 'sell'
  qty: number
  /** Platinum per unit. */
  price: number
  at: string
  note?: string
}

/**
 * Per-item progress in the Foundry mastery tracker, keyed by WFCD `uniqueKey`
 * (the last path segment of `uniqueName`, e.g. `Ninja` for Ash).
 *
 * That key choice is what makes warframe-foundry.app interop possible: it is
 * exactly the key their export file uses. See utils/foundryFormat.ts.
 */
export interface FoundryItemProgress {
  built?: boolean
  mastered?: boolean
  /** Owned count per component uniqueKey (absent = none). */
  comp?: Record<string, number>
}

/** Mastery earned outside the item checklist. */
export interface FoundryCounters {
  missions?: number
  junctions?: number
  steelMissions?: number
  steelJunctions?: number
  intrinsics?: number
}

export interface FoundryData {
  items: Record<string, FoundryItemProgress>
  /** How many of each resource the player already has, by resource uniqueKey. */
  resources: Record<string, number>
  counters: FoundryCounters
  /** uniqueKeys the player has hidden from their checklist. */
  excluded: string[]
  updatedAt?: string
}

export interface UserSettings {
  platform?: string
  basis?: 'sell' | 'buy' | 'avg' | 'median'
  liquidityAdjust?: boolean
}

export interface UserData {
  watchlist: Record<string, WatchlistEntry>
  vault: Record<string, VaultEntry>
  goals: GoalEntry[]
  trades: TradeEntry[]
  foundry: FoundryData
  settings: UserSettings
  updatedAt: string
}

export type UserSection = 'watchlist' | 'vault' | 'goals' | 'trades' | 'foundry' | 'settings'

/**
 * localStorage keys. `watchlist` intentionally keeps the pre-accounts key so
 * existing visitors keep their data; the rest are new.
 */
export const STORAGE_KEYS: Record<UserSection, string> = {
  watchlist: 'warframe_portfolio_v1',
  vault: 'warframe_vault_v1',
  goals: 'warframe_goals_v1',
  trades: 'warframe_trades_v1',
  foundry: 'warframe_foundry_v1',
  settings: 'warframe_settings_v1',
}

export function emptyFoundryData(): FoundryData {
  return { items: {}, resources: {}, counters: {}, excluded: [] }
}

export function emptyUserData(now = new Date().toISOString()): UserData {
  return {
    watchlist: {},
    vault: {},
    goals: [],
    trades: [],
    foundry: emptyFoundryData(),
    settings: {},
    updatedAt: now,
  }
}

// ---------------------------------------------------------------- storage

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readSection<T>(section: UserSection, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[section])
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed == null ? fallback : (parsed as T)
  } catch {
    return fallback
  }
}

/**
 * Change notifications. Two code paths write the watchlist — the legacy
 * `services/portfolio.ts` functions (used by /portfolio, AlertCard,
 * AlertEditSheet) and the reactive `useUserData()` layer — so a write from
 * either must refresh the other's in-memory copy and trigger a cloud sync.
 * Keeping the fan-out here means neither side has to know about the other.
 */
type SectionListener = (section: UserSection) => void
const listeners = new Set<SectionListener>()

export function onSectionWrite(fn: SectionListener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function writeSection(section: UserSection, value: unknown): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEYS[section], JSON.stringify(value))
  } catch {
    // Storage full / unavailable (private browsing) — fail silently; the tool
    // keeps working for this session, it just won't survive a reload.
  }
  for (const fn of listeners) {
    try {
      fn(section)
    } catch {
      /* a broken listener must never break a write */
    }
  }
}

/** Reads every section into one payload (what gets merged/uploaded). */
export function readUserData(): UserData {
  return {
    watchlist: readSection<Record<string, WatchlistEntry>>('watchlist', {}),
    vault: readSection<Record<string, VaultEntry>>('vault', {}),
    goals: readSection<GoalEntry[]>('goals', []),
    trades: readSection<TradeEntry[]>('trades', []),
    foundry: readSection<FoundryData>('foundry', emptyFoundryData()),
    settings: readSection<UserSettings>('settings', {}),
    updatedAt: new Date().toISOString(),
  }
}

/** Overwrites every section (used after a server merge returns the union). */
export function writeUserData(data: Partial<UserData>): void {
  if (data.watchlist) writeSection('watchlist', data.watchlist)
  if (data.vault) writeSection('vault', data.vault)
  if (data.goals) writeSection('goals', data.goals)
  if (data.trades) writeSection('trades', data.trades)
  if (data.foundry) writeSection('foundry', data.foundry)
  if (data.settings) writeSection('settings', data.settings)
}

// ---------------------------------------------------------------- helpers

/**
 * Short, collision-resistant id for client-created rows (goals, trades).
 * `crypto.randomUUID` where available, otherwise a time+random fallback; both
 * satisfy the server's `[A-Za-z0-9_-]{1,64}` id rule.
 */
export function newId(): string {
  try {
    const c = typeof globalThis !== 'undefined' ? (globalThis as any).crypto : null
    if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Which account the local data belongs to.
 *
 * A shared browser is the failure this exists for: sign out of account A, sign
 * in as B, and without this the merge would upload A's vault and ledger into
 * B's cloud document. Stamped on every successful merge; when it disagrees with
 * the account signing in, the local copy is replaced rather than uploaded.
 */
const OWNER_KEY = 'warframe_owner_uid'

export function readOwnerUid(): string {
  if (!isBrowser()) return ''
  try {
    return window.localStorage.getItem(OWNER_KEY) || ''
  } catch {
    return ''
  }
}

export function writeOwnerUid(uid: string): void {
  if (!isBrowser()) return
  try {
    if (uid) window.localStorage.setItem(OWNER_KEY, uid)
    else window.localStorage.removeItem(OWNER_KEY)
  } catch {
    /* ignore */
  }
}

/** True when a payload has nothing worth uploading (skips a pointless merge). */
export function isEmptyUserData(data: UserData): boolean {
  return (
    Object.keys(data.watchlist || {}).length === 0 &&
    Object.keys(data.vault || {}).length === 0 &&
    (data.goals || []).length === 0 &&
    (data.trades || []).length === 0 &&
    Object.keys(data.foundry?.items || {}).length === 0 &&
    Object.keys(data.foundry?.resources || {}).length === 0 &&
    Object.keys(data.settings || {}).length === 0
  )
}
