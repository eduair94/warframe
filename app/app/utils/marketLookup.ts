/**
 * @fileoverview Client-side market lookup for drop rewards.
 *
 * Resolves an item name to its live Warframe Market data straight from the Pinia
 * items store (`useItemsStore().allItems`, populated app-wide by the default
 * layout). Mirrors the backend's DropService.normalizeName/matchKeys so the
 * browser resolves the same item the backend priced — tolerant of WFCD's
 * trailing " Blueprint" the market omits.
 *
 * Pure module (no Vue/Nuxt): auto-imported by Nuxt from `utils/`.
 */

export interface MarketData {
  buy?: number
  sell?: number
  diff?: number
  volume?: number
  avg_price?: number
  buyAvg?: number
  sellAvg?: number
  last_completed?: any
}

export interface MarketLookupItem {
  item_name?: string
  url_name?: string
  thumb?: string
  tags?: string[]
  priceUpdate?: string | number
  market?: MarketData
  [key: string]: unknown
}

export interface MarketSignal {
  thin: boolean
  overpriced: boolean
  note: string
}

/** Low-volume threshold (48h realized trades). At or below this = "thin". */
export const THIN_VOLUME = 3
/** Live ask this many × the 48h average → flagged as above recent average. */
export const OVERPRICED_RATIO = 1.4

/** Collapse a name to a match key: lower-cased, trimmed, single-spaced. */
export function normalizeName(name: string): string {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Match keys for an item, tolerant of WFCD's "… Blueprint" suffix the market
 * often omits, a trailing " Set", and parentheticals. Parity with
 * DropService.matchKeys so the client join matches the backend price join.
 */
export function matchKeys(name: string): string[] {
  let base = normalizeName(name)
  if (base.includes('(')) base = (base.split('(')[0] ?? '').trim()
  if (base.endsWith(' set')) base = base.slice(0, -4).trim()
  const keys = new Set<string>([base])
  if (base.endsWith(' blueprint')) keys.add(base.slice(0, -' blueprint'.length).trim())
  else keys.add(`${base} blueprint`)
  return [...keys].filter(Boolean)
}

/**
 * Single-key index (normalized item_name -> item), mirroring the backend's
 * buildPriceMap. Blueprint tolerance is applied at resolve time, not here, so
 * two items can't clobber each other via an added variant key. First write wins.
 */
export function buildItemIndex(items: MarketLookupItem[]): Map<string, MarketLookupItem> {
  const map = new Map<string, MarketLookupItem>()
  for (const item of items || []) {
    if (!item || !item.item_name) continue
    const key = normalizeName(item.item_name)
    if (!map.has(key)) map.set(key, item)
  }
  return map
}

/** Resolve an item name to its market item, tolerant of the Blueprint suffix. */
export function resolveMarketItem(
  name: string,
  index: Map<string, MarketLookupItem>,
): MarketLookupItem | null {
  for (const key of matchKeys(name)) {
    const hit = index.get(key)
    if (hit) return hit
  }
  return null
}

/**
 * Subtle liquidity/price signal. `thin` when 48h volume is at or below
 * THIN_VOLUME; `overpriced` only when thin AND the live sell sits well above
 * the 48h realized average. Raw numbers are always shown by the caller — this
 * is only a muted flag, not a verdict.
 */
export function marketSignal(market: MarketData | null | undefined): MarketSignal {
  const volume = Number(market && market.volume) || 0
  const sell = Number(market && market.sell) || 0
  const avg = Number(market && market.avg_price) || 0
  const thin = volume <= THIN_VOLUME
  const overpriced = thin && avg > 0 && sell > OVERPRICED_RATIO * avg
  const note = overpriced ? 'price above recent avg' : thin ? 'thin' : ''
  return { thin, overpriced, note }
}
