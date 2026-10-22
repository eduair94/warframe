import { catalogueFreshness, marketTimestampUtc, MARKET_STALE_AFTER_MS } from '../app/app/utils/market-freshness'

const now = Date.parse('2026-10-22T13:00:00.000Z')
const priceAt = (age: number) => ({ priceUpdate: new Date(now - age).toISOString() })

describe('catalogue price freshness', () => {
  it('does not show a warning while the catalogue is empty', () => {
    expect(catalogueFreshness([], now)).toEqual({ status: 'empty', latestUpdate: null })
  })

  it('warns only after the newest valid price is more than three hours old', () => {
    expect(catalogueFreshness([priceAt(MARKET_STALE_AFTER_MS)], now).status).toBe('fresh')
    expect(catalogueFreshness([priceAt(MARKET_STALE_AFTER_MS + 1)], now).status).toBe('stale')
  })

  it('uses the newest recorded price without treating one old item as an outage', () => {
    const recent = priceAt(60_000)
    expect(catalogueFreshness([priceAt(7 * 24 * 60 * 60_000), recent, priceAt(10 * 60_000)], now))
      .toEqual({ status: 'fresh', latestUpdate: recent.priceUpdate })
  })

  it('reports unavailable dates for a nonempty catalogue with no valid timestamp', () => {
    expect(catalogueFreshness([
      {}, { priceUpdate: null }, { priceUpdate: '' }, { priceUpdate: 'not a date' },
      { priceUpdate: 0 }, { priceUpdate: '0' }, { priceUpdate: '2026-10-22T12:00:00' },
      { priceUpdate: new Date('invalid') },
    ], now)).toEqual({ status: 'unknown', latestUpdate: null })
  })

  it('ignores future timestamps instead of hiding a stale-catalogue warning', () => {
    const stale = priceAt(MARKET_STALE_AFTER_MS + 60_000)
    expect(catalogueFreshness([stale, priceAt(-1), priceAt(-24 * 60 * 60_000)], now))
      .toEqual({ status: 'stale', latestUpdate: stale.priceUpdate })
    expect(catalogueFreshness([priceAt(-1)], now)).toEqual({ status: 'unknown', latestUpdate: null })
  })

  it('accepts explicit offsets and Date values and normalizes the recorded time to UTC', () => {
    expect(catalogueFreshness([{ priceUpdate: '2026-10-22T08:00:00-03:00' }], now))
      .toEqual({ status: 'fresh', latestUpdate: '2026-10-22T11:00:00.000Z' })
    expect(catalogueFreshness([{ priceUpdate: new Date(now) }], now))
      .toEqual({ status: 'fresh', latestUpdate: '2026-10-22T13:00:00.000Z' })
  })

  it('uses the provided clock so SSR and hydration share the same threshold decision', () => {
    const rows = [priceAt(MARKET_STALE_AFTER_MS)]
    const ambientClock = jest.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60_000)
    try {
      expect(catalogueFreshness(rows, now).status).toBe('fresh')
      expect(catalogueFreshness(rows, now + 1).status).toBe('stale')
      expect(catalogueFreshness(rows, NaN)).toEqual({ status: 'unknown', latestUpdate: null })
    } finally {
      ambientClock.mockRestore()
    }
  })

  it('clears the warning when a refreshed catalogue contains a current price', () => {
    expect(catalogueFreshness([priceAt(4 * 60 * 60_000)], now).status).toBe('stale')
    expect(catalogueFreshness([priceAt(60_000)], now).status).toBe('fresh')
  })

  it('displays an unambiguous UTC date without depending on machine timezone', () => {
    expect(marketTimestampUtc('2026-10-21T23:42:05.000Z')).toBe('2026-10-21 23:42:05 UTC')
  })
})
