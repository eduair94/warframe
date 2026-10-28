import { catalogueFreshness, marketTimestampUtc, MARKET_STALE_AFTER_MS } from '../app/app/utils/market-freshness'

const now = Date.parse('2026-10-22T13:00:00.000Z')
const priceAt = (age: number) => ({ priceUpdate: new Date(now - age).toISOString() })

describe('catalogue price freshness', () => {
  it('does not show a warning while the catalogue is empty', () => {
    expect(catalogueFreshness([], now)).toEqual({ status: 'empty', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 0 } })
  })

  it('treats exactly three hours as fresh and any older recorded price as stale', () => {
    expect(catalogueFreshness([priceAt(MARKET_STALE_AFTER_MS)], now).status).toBe('fresh')
    expect(catalogueFreshness([priceAt(MARKET_STALE_AFTER_MS + 1)], now).status).toBe('stale')
    expect(catalogueFreshness([priceAt(MARKET_STALE_AFTER_MS), priceAt(MARKET_STALE_AFTER_MS + 1)], now).counts)
      .toEqual({ fresh: 1, stale: 1, unknown: 0 })
  })

  it('does not let one recent item hide an older majority or report the whole catalogue as stale', () => {
    const recent = priceAt(60_000)
    expect(catalogueFreshness([priceAt(7 * 24 * 60 * 60_000), recent, priceAt(4 * 60 * 60_000), priceAt(5 * 60 * 60_000)], now))
      .toEqual({ status: 'mixed', latestUpdate: recent.priceUpdate, counts: { fresh: 1, stale: 3, unknown: 0 } })
  })

  it.each([
    { rows: [priceAt(60_000), {}], counts: { fresh: 1, stale: 0, unknown: 1 } },
    { rows: [priceAt(4 * 60 * 60_000), {}], counts: { fresh: 0, stale: 1, unknown: 1 } },
    { rows: [priceAt(60_000), priceAt(4 * 60 * 60_000), {}], counts: { fresh: 1, stale: 1, unknown: 1 } },
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
    const stale = priceAt(MARKET_STALE_AFTER_MS + 60_000)
    expect(catalogueFreshness([stale, priceAt(-1), priceAt(-24 * 60 * 60_000)], now))
      .toEqual({ status: 'mixed', latestUpdate: stale.priceUpdate, counts: { fresh: 0, stale: 1, unknown: 2 } })
    expect(catalogueFreshness([priceAt(-1)], now)).toEqual({ status: 'unknown', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 1 } })
  })

  it('accepts explicit offsets and Date values and normalizes the recorded time to UTC', () => {
    expect(catalogueFreshness([{ priceUpdate: '2026-10-22T08:00:00-03:00' }], now))
      .toEqual({ status: 'fresh', latestUpdate: '2026-10-22T11:00:00.000Z', counts: { fresh: 1, stale: 0, unknown: 0 } })
    expect(catalogueFreshness([{ priceUpdate: new Date(now) }], now))
      .toEqual({ status: 'fresh', latestUpdate: '2026-10-22T13:00:00.000Z', counts: { fresh: 1, stale: 0, unknown: 0 } })
  })

  it('uses the provided clock so SSR and hydration share the same threshold decision', () => {
    const rows = [priceAt(MARKET_STALE_AFTER_MS)]
    const ambientClock = jest.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60_000)
    try {
      expect(catalogueFreshness(rows, now).status).toBe('fresh')
      expect(catalogueFreshness(rows, now + 1).status).toBe('stale')
      expect(catalogueFreshness(rows, NaN)).toEqual({ status: 'unknown', latestUpdate: null, counts: { fresh: 0, stale: 0, unknown: 1 } })
    } finally {
      ambientClock.mockRestore()
    }
  })

  it('clears the warning once nearly every item has a recent recorded price', () => {
    expect(catalogueFreshness([priceAt(4 * 60 * 60_000), priceAt(5 * 60 * 60_000)], now).status).toBe('stale')
    expect(catalogueFreshness([priceAt(60_000), priceAt(5 * 60 * 60_000)], now).status).toBe('mixed')
    expect(catalogueFreshness([priceAt(60_000), priceAt(2 * 60_000)], now).status).toBe('fresh')
  })

  it('tolerates the items with no live orders, which keep their last recorded price', () => {
    // A healthy sync leaves ~4% of the catalogue old: the price sync skips
    // markets with no in-game orders instead of overwriting them with zeros.
    const rows = (fresh: number, old: number, missing = 0) => [
      ...Array.from({ length: fresh }, () => priceAt(60_000)),
      ...Array.from({ length: old }, () => priceAt(12 * 24 * 60 * 60_000)),
      ...Array.from({ length: missing }, () => ({})),
    ]
    expect(catalogueFreshness(rows(96, 4), now)).toMatchObject({ status: 'fresh', counts: { fresh: 96, stale: 4, unknown: 0 } })
    expect(catalogueFreshness(rows(90, 6, 4), now).status).toBe('fresh')
    expect(catalogueFreshness(rows(89, 11), now).status).toBe('mixed')
    expect(catalogueFreshness(rows(89, 6, 5), now).status).toBe('mixed')
  })

  it('reads only recorded priceUpdate fields and does not mutate catalogue objects', () => {
    const recent = Object.freeze({ item_name: 'Serration', tags: ['mod'], ...priceAt(60_000) })
    const unknown = Object.freeze({ item_name: 'Unrecorded', tags: [], updatedAt: new Date(now).toISOString() })
    const catalogue = Object.freeze([recent, unknown])
    expect(catalogueFreshness(catalogue, now)).toEqual({ status: 'mixed', latestUpdate: recent.priceUpdate, counts: { fresh: 1, stale: 0, unknown: 1 } })
    expect(catalogue).toEqual([recent, unknown])
  })

  it('displays an unambiguous UTC date without depending on machine timezone', () => {
    expect(marketTimestampUtc('2026-10-21T23:42:05.000Z')).toBe('2026-10-21 23:42:05 UTC')
  })
})
