/**
 * Client-side portfolio/watchlist + price-alert storage.
 *
 * README Roadmap listed "User portfolio tracking" and "Real-time price
 * alerts" as unbuilt. This started as a localStorage-only watchlist because
 * the app had no accounts; it still is one — the app stayed deliberately
 * local-first — but the reads/writes now go through `utils/userStorage`, the
 * shared storage layer the account tools (/vault, /goals, /ledger) use. That
 * layer notifies `useUserData()` on every write, so a change made here is
 * mirrored to the signed-in user's cloud copy without this module knowing
 * anything about auth. The localStorage key is unchanged
 * (`warframe_portfolio_v1`), so existing visitors keep their watchlist.
 *
 * The exported function signatures are untouched — /portfolio, AlertCard and
 * AlertEditSheet consume them as before.
 */

import {
  readSection,
  writeSection,
  type WatchlistEntry as StoredWatchlistEntry,
} from '../utils/userStorage'

/**
 * Alert semantics recap (fields defined in utils/userStorage):
 * `alertAtl` fires when the item hits (or comes within a hair of) its all-time
 * low in OUR long price history — warframe.market can't offer this because its
 * per-item chart only reaches back 90 days. Evaluated against the
 * /market_analytics feed's pctFromAtl.
 */
export type WatchlistEntry = StoredWatchlistEntry

/** Minimal analytics needed to evaluate the all-time-low alert. */
export interface AnalyticsLite {
  atl?: number | null
  pctFromAtl?: number | null
}

/** Within this % of the stored all-time low counts as "at its low". */
const NEAR_ATL_PCT = 3

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readAll(): Record<string, WatchlistEntry> {
  return readSection<Record<string, WatchlistEntry>>('watchlist', {})
}

function writeAll(entries: Record<string, WatchlistEntry>): void {
  writeSection('watchlist', entries)
}

export function getWatchlist(): WatchlistEntry[] {
  return Object.values(readAll()).sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1))
}

export function isWatched(urlName: string): boolean {
  return !!readAll()[urlName]
}

export function toggleWatch(item: { url_name: string; item_name: string }): boolean {
  const all = readAll()
  if (all[item.url_name]) {
    delete all[item.url_name]
    writeAll(all)
    return false
  }
  const nowIso = new Date().toISOString()
  all[item.url_name] = {
    url_name: item.url_name,
    item_name: item.item_name,
    addedAt: nowIso,
    updatedAt: nowIso,
    ownedQty: 0,
    alertBelow: null,
    alertAbove: null,
    notifiedBelow: false,
    notifiedAbove: false,
    alertAtl: false,
    notifiedAtl: false,
  }
  writeAll(all)
  return true
}

export function removeFromWatchlist(urlName: string): void {
  const all = readAll()
  delete all[urlName]
  writeAll(all)
}

export function updateEntry(urlName: string, patch: Partial<WatchlistEntry>): void {
  const all = readAll()
  if (!all[urlName]) return
  // Editing a threshold re-arms that alert so it can fire again.
  if ('alertBelow' in patch) patch.notifiedBelow = false
  if ('alertAbove' in patch) patch.notifiedAbove = false
  if ('alertAtl' in patch) patch.notifiedAtl = false
  // Stamp the edit so the cloud merge can tell this copy from a stale one on
  // another device (`addedAt` never changes, so it cannot decide that).
  all[urlName] = { ...all[urlName], ...patch, updatedAt: new Date().toISOString() }
  writeAll(all)
}

export function markNotified(
  urlName: string,
  which: 'notifiedBelow' | 'notifiedAbove' | 'notifiedAtl'
): void {
  const all = readAll()
  if (!all[urlName]) return
  all[urlName][which] = true
  all[urlName].updatedAt = new Date().toISOString()
  writeAll(all)
}

/**
 * Checks every watched item's live sell price against its saved thresholds
 * and fires a browser Notification the first time a threshold is crossed
 * (notifiedBelow/notifiedAbove guards against re-notifying every poll).
 * Requires Notification permission to already be granted - see
 * requestNotificationPermission().
 */
export function checkAlerts(
  liveItems: Array<{ url_name: string; item_name: string; market?: { sell?: number } }>,
  analyticsByUrl?: Record<string, AnalyticsLite>
): void {
  if (!isBrowser() || !('Notification' in window) || Notification.permission !== 'granted') return

  const watchlist = readAll()
  const byUrlName: Record<string, { sell?: number }> = {}
  liveItems.forEach((i) => {
    byUrlName[i.url_name] = i.market || {}
  })

  Object.values(watchlist).forEach((entry) => {
    const sell = byUrlName[entry.url_name]?.sell

    if (typeof sell === 'number') {
      if (entry.alertBelow != null && sell <= entry.alertBelow && !entry.notifiedBelow) {
        new Notification(`${entry.item_name} price alert`, {
          body: `Sell price dropped to ${sell}p (alert set at ${entry.alertBelow}p)`,
          tag: `${entry.url_name}-below`,
        })
        markNotified(entry.url_name, 'notifiedBelow')
      }
      if (entry.alertAbove != null && sell >= entry.alertAbove && !entry.notifiedAbove) {
        new Notification(`${entry.item_name} price alert`, {
          body: `Sell price rose to ${sell}p (alert set at ${entry.alertAbove}p)`,
          tag: `${entry.url_name}-above`,
        })
        markNotified(entry.url_name, 'notifiedAbove')
      }
    }

    // All-time-low alert: fires when the item is within NEAR_ATL_PCT of the
    // lowest price we've ever recorded for it (long-history signal WFM lacks).
    if (entry.alertAtl && analyticsByUrl) {
      const a = analyticsByUrl[entry.url_name]
      if (a && typeof a.pctFromAtl === 'number' && a.pctFromAtl <= NEAR_ATL_PCT && !entry.notifiedAtl) {
        const atlText = typeof a.atl === 'number' ? ` (~${Math.round(a.atl)}p)` : ''
        new Notification(`${entry.item_name} at its all-time low`, {
          body: `Cheapest it's been in our records${atlText} — a good time to buy.`,
          tag: `${entry.url_name}-atl`,
        })
        markNotified(entry.url_name, 'notifiedAtl')
      }
    }
  })
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isBrowser() || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}
