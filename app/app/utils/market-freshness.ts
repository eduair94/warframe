export const MARKET_STALE_AFTER_MS = 3 * 60 * 60 * 1000

export interface CatalogueFreshness {
  status: 'empty' | 'unknown' | 'fresh' | 'stale'
  latestUpdate: string | null
}

/** Use recorded price timestamps, never the time the catalogue was downloaded. */
export function catalogueFreshness(
  catalogue: readonly { priceUpdate?: unknown; [key: string]: unknown }[],
  nowMs: number,
): CatalogueFreshness {
  if (!catalogue.length) return { status: 'empty', latestUpdate: null }
  if (!Number.isFinite(nowMs)) return { status: 'unknown', latestUpdate: null }

  let latest = -Infinity
  for (const item of catalogue) {
    const value = item?.priceUpdate
    // An explicit timezone avoids different server/browser interpretations.
    const timestamp = value instanceof Date ? value.getTime()
      : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
        ? Date.parse(value) : NaN
    if (Number.isFinite(timestamp) && timestamp <= nowMs && timestamp > latest) latest = timestamp
  }

  if (latest === -Infinity) return { status: 'unknown', latestUpdate: null }
  return {
    status: nowMs - latest > MARKET_STALE_AFTER_MS ? 'stale' : 'fresh',
    latestUpdate: new Date(latest).toISOString(),
  }
}

/** Stable UTC display on the server and browser, regardless of their timezone. */
export function marketTimestampUtc(iso: string): string {
  return `${iso.slice(0, 19).replace('T', ' ')} UTC`
}
