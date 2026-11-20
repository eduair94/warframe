const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/**
 * How often the incremental price sync re-prices an item, by how busy its
 * market is. Mirrors the DEFAULT policy in services/PriceRefreshScheduler.ts
 * (keep the two in step): traded items every 2 h, priced ones every 6 h,
 * empty markets daily, and anything with a fresh order within minutes.
 */
export const MARKET_REFRESH_POLICY = Object.freeze({
  liquidVolume: 20,
  liquidMaxAgeMs: 2 * HOUR,
  activeMaxAgeMs: 6 * HOUR,
  idleMaxAgeMs: 24 * HOUR,
})

/**
 * An item is overdue once it is twice its target age. The sync always serves
 * the most overdue item first, so a busy queue runs somewhat behind target
 * without anything being wrong.
 */
export const MARKET_OVERDUE_FACTOR = 2

/**
 * A healthy sync records a new price every few seconds. When even the newest
 * recorded price is this old, the sync itself has stopped.
 */
export const MARKET_SYNC_STALL_MS = HOUR

/**
 * Share of the catalogue that may be overdue while it still counts as fresh.
 * The price sync skips markets with no in-game orders (~2-4% of items)
 * instead of overwriting their last price with zeros, so they never become
 * recent. Requiring every item made the warning permanent on a healthy site.
 */
export const MARKET_STALE_SHARE_TOLERANCE = 0.1

export interface CatalogueFreshness {
  status: 'empty' | 'unknown' | 'fresh' | 'stale' | 'mixed'
  latestUpdate: string | null
  counts: { fresh: number; stale: number; unknown: number }
}

/** The age at which the sync is due to re-price an item with this market. */
export function marketRefreshTargetMs(market: unknown): number {
  const m = (market && typeof market === 'object' ? market : {}) as Record<string, unknown>
  const volume = Number(m.volume) || 0
  if (volume >= MARKET_REFRESH_POLICY.liquidVolume) return MARKET_REFRESH_POLICY.liquidMaxAgeMs
  if (volume > 0 || (Number(m.sell) || 0) > 0 || (Number(m.buy) || 0) > 0) return MARKET_REFRESH_POLICY.activeMaxAgeMs
  return MARKET_REFRESH_POLICY.idleMaxAgeMs
}

/** Use recorded price timestamps, never the time the catalogue was downloaded. */
export function catalogueFreshness(
  catalogue: readonly { priceUpdate?: unknown; market?: unknown; [key: string]: unknown }[],
  nowMs: number,
): CatalogueFreshness {
  const counts = { fresh: 0, stale: 0, unknown: 0 }
  if (!catalogue.length) return { status: 'empty', latestUpdate: null, counts }
  if (!Number.isFinite(nowMs)) {
    counts.unknown = catalogue.length
    return { status: 'unknown', latestUpdate: null, counts }
  }

  let latest = -Infinity
  for (const item of catalogue) {
    const value = item?.priceUpdate
    // An explicit timezone avoids different server/browser interpretations.
    const timestamp = value instanceof Date ? value.getTime()
      : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        ? Date.parse(value) : NaN
    if (!Number.isFinite(timestamp) || timestamp > nowMs) {
      counts.unknown++
      continue
    }
    if (nowMs - timestamp > marketRefreshTargetMs(item?.market) * MARKET_OVERDUE_FACTOR) counts.stale++
    else counts.fresh++
    if (timestamp > latest) latest = timestamp
  }

  const stalled = latest !== -Infinity && nowMs - latest > MARKET_SYNC_STALL_MS
  return {
    status: stalled || counts.stale === catalogue.length ? 'stale'
      : catalogue.length - counts.fresh <= catalogue.length * MARKET_STALE_SHARE_TOLERANCE ? 'fresh'
        : counts.unknown === catalogue.length ? 'unknown' : 'mixed',
    latestUpdate: latest === -Infinity ? null : new Date(latest).toISOString(),
    counts,
  }
}

/** Stable UTC display on the server and browser, regardless of their timezone. */
export function marketTimestampUtc(iso: string): string {
  return `${iso.slice(0, 19).replace('T', ' ')} UTC`
}
