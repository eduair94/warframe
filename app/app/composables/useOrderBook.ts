/**
 * Order-book "bulk buy/sell" modeler — walk the live ladder to price a chosen
 * quantity, the way you'd actually fill it on warframe.market.
 *
 * The details dialogs fetch a compact depth ladder from `/orders/:url_name`
 * (see BaseWarframeClient.getOrderBook) and call these pure functions, so the
 * maths — and the bait cap that keeps meme-quantity orders from poisoning the
 * result — live in one unit-tested place.
 *
 * Two credibility rules, anchored to the item's realistic going rate:
 *  - BUY walks the ask side (lowest first). Only a troll-low ask (a 1p bait on a
 *    30p relic) is skipped; a genuine cheap or bulk ask is exactly what you want.
 *  - SELL walks the bid side (highest first) but skips bait bids priced far above
 *    the going rate — the 125p × 9,996 orders that never fill — so "sell 20"
 *    reflects the real bids you'd actually clear into, not the bait.
 */

/** A single price level: total quantity offered at `price`. */
export interface BookLevel {
  price: number
  quantity: number
  orders?: number
}

export interface OrderBook {
  url_name: string
  subtype: string | null
  /** Buy orders (bids), best-first (highest price first). */
  buy: BookLevel[]
  /** Sell orders (asks), best-first (lowest price first). */
  sell: BookLevel[]
}

export interface BulkQuote {
  /** Units actually available/filled (≤ requested). */
  units: number
  /** Units requested. */
  requested: number
  /** Total platinum for `units`. */
  cost: number
  /** Volume-weighted average price per unit (cost / units), 0 when nothing fills. */
  avg: number
  /** The best single-unit price (top of the credible book). */
  best: number
  /** Whether the full requested quantity could be filled from the credible book. */
  filled: boolean
  /** Each level consumed, in fill order. */
  levels: Array<{ price: number; take: number }>
  /** How many price levels were skipped as non-credible (bait / troll). */
  excluded: number
}

/**
 * Bids more than this multiple of the going rate are treated as non-fillable
 * bait. Relic buy orders sit at absurd prices AND quantities (a 30p relic drawing
 * 60–150p bids for thousands of units) that never clear — the 48h average proves
 * the real price. 1.5× keeps a genuine slight-overpayer while dropping the bait.
 */
export const BAIT_CEIL = 1.5
/** Asks below this fraction of the going rate are treated as troll listings. */
export const TROLL_FLOOR = 0.15

const num = (n: any) => Number(n) || 0

/**
 * Walk already-ordered, already-credible levels, taking up to `qty` units.
 * Levels must be pre-sorted in fill order (ascending price to buy, descending to
 * sell) and pre-filtered for credibility.
 */
export function walkBook(levels: BookLevel[], qty: number, excluded = 0): BulkQuote {
  const requested = Math.max(0, Math.floor(num(qty)))
  let need = requested
  let units = 0
  let cost = 0
  const taken: Array<{ price: number; take: number }> = []
  for (const lv of levels || []) {
    if (need <= 0) break
    const available = Math.max(0, Math.floor(num(lv.quantity)))
    const price = num(lv.price)
    if (available <= 0 || price <= 0) continue
    const take = Math.min(need, available)
    units += take
    cost += take * price
    need -= take
    taken.push({ price, take })
  }
  return {
    units,
    requested,
    cost,
    avg: units > 0 ? cost / units : 0,
    best: taken.length ? (taken[0]!.price as number) : 0,
    filled: requested > 0 && need <= 0,
    levels: taken,
    excluded,
  }
}

/** Credible asks to BUY into: drop troll-low listings, keep ascending order. */
function credibleAsks(book: OrderBook, goingRate: number): { levels: BookLevel[]; excluded: number } {
  const floor = goingRate > 0 ? goingRate * TROLL_FLOOR : 0
  const all = book?.sell || []
  const levels = all.filter((l) => num(l.price) >= floor && num(l.quantity) > 0)
  return { levels, excluded: all.length - levels.length }
}

/** Credible bids to SELL into: drop bait priced far above the going rate. */
function credibleBids(book: OrderBook, goingRate: number): { levels: BookLevel[]; excluded: number } {
  const ceil = goingRate > 0 ? goingRate * BAIT_CEIL : Infinity
  const all = book?.buy || []
  const levels = all.filter((l) => num(l.price) <= ceil && num(l.quantity) > 0)
  return { levels, excluded: all.length - levels.length }
}

/** Price to BUY `qty` units now: walk the ask side, cheapest first. */
export function bulkBuy(book: OrderBook, qty: number, goingRate = 0): BulkQuote {
  const { levels, excluded } = credibleAsks(book, goingRate)
  return walkBook(levels, qty, excluded)
}

/** Price to SELL `qty` units now: walk the (credible) bid side, highest first. */
export function bulkSell(book: OrderBook, qty: number, goingRate = 0): BulkQuote {
  const { levels, excluded } = credibleBids(book, goingRate)
  return walkBook(levels, qty, excluded)
}

/** Total credible units available on a side — the depth ceiling for the input. */
export function availableUnits(book: OrderBook, side: 'buy' | 'sell', goingRate = 0): number {
  const { levels } = side === 'buy' ? credibleAsks(book, goingRate) : credibleBids(book, goingRate)
  return levels.reduce((s, l) => s + Math.max(0, Math.floor(num(l.quantity))), 0)
}
