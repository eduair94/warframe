import {
  catalogueFreshness,
  marketRefreshTargetMs,
  marketTimestampUtc,
  MARKET_OVERDUE_FACTOR,
  MARKET_REFRESH_POLICY,
  MARKET_SYNC_STALL_MS,
} from '../app/app/utils/market-freshness'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const now = Date.parse('2026-10-22T13:00:00.000Z')
const liquid = { volume: 50, sell: 30, buy: 25 }
const active = { volume: 3, sell: 12, buy: 0 }
const idle = { volume: 0, sell: 0, buy: 0 }
const priceAt = (age: number, market: unknown = idle) => ({ priceUpdate: new Date(now - age).toISOString(), market })
// One item priced a moment ago keeps the "sync is alive" signal out of a test's way.
const pulse = () => priceAt(MINUTE, liquid)

describe('market refresh targets (mirror services/PriceRefreshScheduler.ts defaults)', () => {
  it('maps liquidity to the sync policy: liquid 2 h, priced 6 h, empty daily', () => {
    expect(MARKET_REFRESH_POLICY).toEqual({ liquidVolume: 20, liquidMaxAgeMs: 2 * HOUR, activeMaxAgeMs: 6 * HOUR, idleMaxAgeMs: 24 * HOUR })
    expect(marketRefreshTargetMs(liquid)).toBe(2 * HOUR)
    expect(marketRefreshTargetMs({ volume: 20 })).toBe(2 * HOUR)
    expect(marketRefreshTargetMs({ volume: 19 })).toBe(6 * HOUR)
    expect(marketRefreshTargetMs({ volume: 0, sell: 5 })).toBe(6 * HOUR)
    expect(marketRefreshTargetMs({ volume: 0, buy: 1 })).toBe(6 * HOUR)
    expect(marketRefreshTargetMs(idle)).toBe(24 * HOUR)
  })

  it('treats a missing or malformed market as idle', () => {
    for (const market of [undefined, null, 'x', 42, { volume: 'lots', sell: null }]) {
      expect(marketRefreshTargetMs(market)).toBe(24 * HOUR)
    }
  })
})

describe('catalogue price freshness', () => {
  it('does not show a warning while the catalogue is empty', () => {
    expect(catalogueFreshness([], now)).toEqual({ status: 'empty', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 0 } })
  })

  it('judges each item against its own tier, overdue past twice the target', () => {
    const limit = (market: unknown) => marketRefreshTargetMs(market) * MARKET_OVERDUE_FACTOR
    for (const market of [liquid, active, idle]) {
      expect(catalogueFreshness([pulse(), priceAt(limit(market), market)], now).counts).toEqual({ fresh: 2, stale: 0, unknown: 0 })
      expect(catalogueFreshness([pulse(), priceAt(limit(market) + 1, market)], now).counts).toEqual({ fresh: 1, stale: 1, unknown: 0 })
    }
  })

  it('keeps a healthy incremental sync fresh even though most items are hours old', () => {
    // The 2026-11-20 regression: one 3 h threshold for every item kept the
    // "some prices may be outdated" notice up permanently once the sync went
    // incremental (priced items every 6 h, empty markets daily).
    const rows = [
      ...Array.from({ length: 25 }, (_, i) => priceAt((i + 1) * 4 * MINUTE, liquid)),
      ...Array.from({ length: 45 }, (_, i) => priceAt((i + 1) * 15 * MINUTE, active)),
      ...Array.from({ length: 30 }, (_, i) => priceAt((i + 1) * 45 * MINUTE, idle)),
    ]
    expect(catalogueFreshness(rows, now)).toMatchObject({ status: 'fresh', counts: { fresh: 100, stale: 0, unknown: 0 } })
  })

  it('reports the whole feed as stale once even the newest price is older than the stall limit', () => {
    expect(catalogueFreshness([priceAt(MARKET_SYNC_STALL_MS), priceAt(3 * HOUR)], now).status).toBe('fresh')
    const stalled = catalogueFreshness([priceAt(MARKET_SYNC_STALL_MS + 1), priceAt(3 * HOUR)], now)
    // Every item is still within its own tier, but nothing has been priced for an hour.
    expect(stalled).toEqual({ status: 'stale', latestUpdate: new Date(now - MARKET_SYNC_STALL_MS - 1).toISOString(), counts: { fresh: 2, stale: 0, unknown: 0 } })
  })

  it('does not let one recent item hide an overdue majority or report the whole catalogue as stale', () => {
    const recent = pulse()
    expect(catalogueFreshness([priceAt(7 * 24 * HOUR, active), recent, priceAt(5 * HOUR, liquid), priceAt(13 * HOUR, active)], now))
      .toEqual({ status: 'mixed', latestUpdate: recent.priceUpdate, counts: { fresh: 1, stale: 3, unknown: 0 } })
  })

  it.each([
    { rows: [pulse(), {}], counts: { fresh: 1, stale: 0, unknown: 1 } },
    { rows: [pulse(), priceAt(5 * HOUR, liquid), {}], counts: { fresh: 1, stale: 1, unknown: 1 } },
  ])('reports partial coverage for valid and missing timestamps: $counts', ({ rows, counts }) => {
    expect(catalogueFreshness(rows, now)).toMatchObject({ status: 'mixed', counts })
  })

  it('reports unavailable dates for a nonempty catalogue with no valid timestamp', () => {
    expect(catalogueFreshness([
      {}, { priceUpdate: null }, { priceUpdate: '' }, { priceUpdate: 'not a date' },
      { priceUpdate: 0 }, { priceUpdate: '0' }, { priceUpdate: '2026-10-22T12:00:00' },
      { priceUpdate: new Date('invalid') },
    ], now)).toEqual({ status: 'unknown', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 8 } })
  })

  it('counts future timestamps as unknown without using them as the latest update', () => {
    const recent = pulse()
    expect(catalogueFreshness([recent, priceAt(-1), priceAt(-24 * HOUR)], now))
      .toEqual({ status: 'mixed', latestUpdate: recent.priceUpdate, counts: { fresh: 1, stale: 0, unknown: 2 } })
    expect(catalogueFreshness([priceAt(-1)], now)).toEqual({ status: 'unknown', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 1 } })
  })

  it('accepts explicit offsets and Date values and normalizes the recorded time to UTC', () => {
    expect(catalogueFreshness([{ priceUpdate: '2026-10-22T09:30:00-03:00' }], now))
      .toEqual({ status: 'fresh', latestUpdate: '2026-10-22T12:30:00.000Z', counts: { fresh: 1, stale: 0, unknown: 0 } })
    expect(catalogueFreshness([{ priceUpdate: new Date(now) }], now))
      .toEqual({ status: 'fresh', latestUpdate: '2026-10-22T13:00:00.000Z', counts: { fresh: 1, stale: 0, unknown: 0 } })
  })

  it('uses the provided clock so SSR and hydration share the same threshold decision', () => {
    const rows = [priceAt(MARKET_SYNC_STALL_MS)]
    const ambientClock = jest.spyOn(Date, 'now').mockReturnValue(now + 24 * HOUR)
    try {
      expect(catalogueFreshness(rows, now).status).toBe('fresh')
      expect(catalogueFreshness(rows, now + 1).status).toBe('stale')
      expect(catalogueFreshness(rows, NaN)).toEqual({ status: 'unknown', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 1 } })
    } finally {
      ambientClock.mockRestore()
    }
  })

  it('tolerates the items with no live orders, which keep their last recorded price', () => {
    // A healthy sync leaves ~2-4% of the catalogue old: the price sync skips
    // markets with no in-game orders instead of overwriting them with zeros.
    const rows = (fresh: number, old: number, missing = 0) => [
      ...Array.from({ length: fresh }, () => pulse()),
      ...Array.from({ length: old }, () => priceAt(12 * 24 * HOUR, active)),
      ...Array.from({ length: missing }, () => ({})),
    ]
    expect(catalogueFreshness(rows(96, 4), now)).toMatchObject({ status: 'fresh', counts: { fresh: 96, stale: 4, unknown: 0 } })
    expect(catalogueFreshness(rows(90, 6, 4), now).status).toBe('fresh')
    expect(catalogueFreshness(rows(89, 11), now).status).toBe('mixed')
    expect(catalogueFreshness(rows(89, 6, 5), now).status).toBe('mixed')
  })

  it('reads only recorded priceUpdate and market fields and does not mutate catalogue objects', () => {
    const recent = Object.freeze({ item_name: 'Serration', tags: ['mod'], ...pulse() })
    const unknown = Object.freeze({ item_name: 'Unrecorded', tags: [], updatedAt: new Date(now).toISOString() })
    const catalogue = Object.freeze([recent, unknown])
    expect(catalogueFreshness(catalogue, now)).toEqual({ status: 'mixed', latestUpdate: recent.priceUpdate, counts: { fresh: 1, stale: 0, unknown: 1 } })
    expect(catalogue).toEqual([recent, unknown])
  })

  it('displays an unambiguous UTC date without depending on machine timezone', () => {
    expect(marketTimestampUtc('2026-10-21T23:42:05.000Z')).toBe('2026-10-21 23:42:05 UTC')
  })
})
