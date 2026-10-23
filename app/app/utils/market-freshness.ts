export const MARKET_STALE_AFTER_MS = 3 * 60 * 60 * 1000

export interface CatalogueFreshness {
  status: 'empty' | 'unknown' | 'fresh' | 'stale' | 'mixed'
  latestUpdate: string | null
  counts: { fresh: number; stale: number; unknown: number }
}

/** Use recorded price timestamps, never the time the catalogue was downloaded. */
export function catalogueFreshness(
  catalogue: readonly { priceUpdate?: unknown; [key: string]: unknown }[],
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
    if (nowMs - timestamp > MARKET_STALE_AFTER_MS) counts.stale++
    else counts.fresh++
    if (timestamp > latest) latest = timestamp
  }

  return {
    status: counts.fresh === catalogue.length ? 'fresh'
      : counts.stale === catalogue.length ? 'stale'
        : counts.unknown === catalogue.length ? 'unknown' : 'mixed',
    latestUpdate: latest === -Infinity ? null : new Date(latest).toISOString(),
    counts,
  }
}

/** Stable UTC display on the server and browser, regardless of their timezone. */
export function marketTimestampUtc(iso: string): string {
  return `${iso.slice(0, 19).replace('T', ' ')} UTC`
}
