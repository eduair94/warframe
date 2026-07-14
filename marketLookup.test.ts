import {
  normalizeName,
  matchKeys,
  buildItemIndex,
  resolveMarketItem,
  marketSignal,
  THIN_VOLUME,
  OVERPRICED_RATIO,
  MarketItem,
} from './app/utils/marketLookup'

describe('normalizeName', () => {
  it('lower-cases, trims, and collapses whitespace', () => {
    expect(normalizeName('  Nova   Prime  ')).toBe('nova prime')
  })
  it('handles null/undefined', () => {
    expect(normalizeName(undefined as any)).toBe('')
  })
})

describe('matchKeys', () => {
  it('adds the blueprint-less variant for a "… Blueprint" name', () => {
    expect(matchKeys('Nova Prime Neuroptics Blueprint')).toEqual(
      expect.arrayContaining(['nova prime neuroptics blueprint', 'nova prime neuroptics'])
    )
  })
  it('adds the blueprint variant for a bare name', () => {
    expect(matchKeys('Nova Prime Neuroptics')).toEqual(
      expect.arrayContaining(['nova prime neuroptics', 'nova prime neuroptics blueprint'])
    )
  })
  it('drops a trailing " Set" and parentheticals', () => {
    expect(matchKeys('Nova Prime Set')).toContain('nova prime')
    expect(matchKeys('Forma (Blueprint)')).toContain('forma')
  })
})

describe('buildItemIndex + resolveMarketItem', () => {
  const items: MarketItem[] = [
    { item_name: 'Nova Prime Neuroptics', url_name: 'nova_prime_neuroptics', market: { sell: 14, volume: 3 } },
    { item_name: 'Soma Prime Barrel', url_name: 'soma_prime_barrel', market: { sell: 5, volume: 40 } },
  ]
  const index = buildItemIndex(items)

  it('resolves a WFCD "… Blueprint" reward to the market item', () => {
    const hit = resolveMarketItem('Nova Prime Neuroptics Blueprint', index)
    expect(hit && hit.url_name).toBe('nova_prime_neuroptics')
  })
  it('resolves an exact name', () => {
    const hit = resolveMarketItem('Soma Prime Barrel', index)
    expect(hit && hit.url_name).toBe('soma_prime_barrel')
  })
  it('returns null for an unknown/untradeable item', () => {
    expect(resolveMarketItem('Forma Blueprint', index)).toBeNull()
  })
  it('skips items with no item_name and does not throw', () => {
    expect(() => buildItemIndex([null as any, { market: {} } as any])).not.toThrow()
  })
})

describe('marketSignal', () => {
  it('flags thin when volume is at or below the threshold', () => {
    expect(marketSignal({ volume: THIN_VOLUME, sell: 10, avg_price: 10 }).thin).toBe(true)
    expect(marketSignal({ volume: THIN_VOLUME + 1, sell: 10, avg_price: 10 }).thin).toBe(false)
  })
  it('flags overpriced only when thin AND sell exceeds ratio × avg', () => {
    const over = marketSignal({ volume: 1, sell: 100, avg_price: 50 }) // 100 > 1.4*50=70
    expect(over.overpriced).toBe(true)
    expect(over.note).toBe('price above recent avg')
    const fair = marketSignal({ volume: 1, sell: 60, avg_price: 50 }) // 60 < 70
    expect(fair.overpriced).toBe(false)
    expect(fair.note).toBe('thin')
  })
  it('never flags overpriced when avg_price is 0', () => {
    const s = marketSignal({ volume: 1, sell: 100, avg_price: 0 })
    expect(s.overpriced).toBe(false)
    expect(s.note).toBe('thin')
  })
  it('is healthy (no note) for a liquid item', () => {
    expect(marketSignal({ volume: 50, sell: 10, avg_price: 10 })).toEqual({ thin: false, overpriced: false, note: '' })
  })
  it('handles null market', () => {
    expect(marketSignal(null).thin).toBe(true) // volume 0 ≤ 3
  })
  it('exposes the documented threshold constants', () => {
    expect(THIN_VOLUME).toBe(3)
    expect(OVERPRICED_RATIO).toBe(1.4)
  })
})
