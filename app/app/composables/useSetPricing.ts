/**
 * Set-vs-parts valuation under several pricing bases.
 *
 * The set detail page used to answer exactly one question — "is the best ask on
 * the set cheaper than the sum of the best asks on its parts?" — which is the
 * noisiest possible reading of the market: a single bait listing on one part
 * flips the verdict. This module prices the same comparison five ways, so a
 * verdict that holds across bases is trustworthy and one that doesn't is
 * visibly fragile.
 *
 * warframe.market price semantics, which everything below depends on:
 *   `sell` = lowest SELL order = what you PAY to acquire.
 *   `buy`  = highest BUY order = what you RECEIVE when selling.
 * So the acquire side reads `sell` and the resale side reads `buy`.
 *
 * Pure functions, no Vue reactivity — unit-tested under the backend jest setup
 * (test-helpers/useSetPricing.logic.test.ts), same split as useRelicValue and
 * useEndoValue.
 */

import { bulkBuy, bulkSell, type OrderBook } from './useOrderBook'

export type BasisKey = 'instant' | 'top5' | 'avg48h' | 'median' | 'bulk'

/** Display order of the basis toggle. */
export const BASIS_KEYS: BasisKey[] = ['instant', 'top5', 'avg48h', 'median', 'bulk']

/**
 * Per-basis fallback preference, used when an item has no value on the selected
 * basis.
 *
 * Ordered by KIND, not by the toggle's display order. The book bases (instant /
 * top5 / bulk) read live orders; the traded bases (avg48h / median) read closed
 * trades, and they routinely disagree by a wide margin on thin items. Filling a
 * median gap with a live ask would quietly mix the two and overstate the total,
 * so each basis falls back within its own family first.
 */
const FALLBACK_ORDER: Record<BasisKey, BasisKey[]> = {
  instant: ['top5', 'bulk', 'avg48h', 'median'],
  top5: ['instant', 'bulk', 'avg48h', 'median'],
  bulk: ['instant', 'top5', 'avg48h', 'median'],
  avg48h: ['median', 'instant', 'top5', 'bulk'],
  median: ['avg48h', 'instant', 'top5', 'bulk'],
}

/**
 * Verdicts flip on noise below this. A 2% "saving" on a 60p set is one
 * platinum — inside the spread, not a real edge.
 */
export const EVEN_THRESHOLD_PCT = 3

export interface SetMarket {
  buy?: number
  sell?: number
  diff?: number
  buyAvg?: number
  sellAvg?: number
  volume?: number
  avg_price?: number
  last_completed?: { median?: number; moving_avg?: number; min_price?: number; max_price?: number } | null
  subtype?: string
}

export interface SetNode {
  item_name: string
  url_name: string
  thumb?: string
  tags?: string[]
  ducats?: number
  vaulted?: boolean
  priceUpdate?: string | Date
  quantity_for_set: number
  market: SetMarket
  depth?: { buy: Array<{ price: number; quantity: number; orders?: number }>; sell: Array<{ price: number; quantity: number; orders?: number }> }
  history?: { points: Array<{ date: string; buy: number; sell: number; avg_price: number; volume: number }>; trend?: { direction: 'up' | 'down' | 'flat'; changePercent: number } }
}

/** One item priced under one basis. */
export interface NodePrice {
  /** What you pay per unit to acquire it */
  acquire: number
  /** What you receive per unit when selling it */
  resale: number
  /** True when the requested basis had no value and a fallback supplied one */
  estimated: boolean
  /** Which basis actually produced the numbers */
  from: BasisKey | null
}

export interface PartPricing extends NodePrice {
  node: SetNode
  quantity: number
  /** acquire × quantity — this part's share of the parts total */
  acquireTotal: number
  /** resale × quantity */
  resaleTotal: number
}

/**
 * A row of the set detail ledger: a priced part, plus whether it is the
 * assembled set itself (rendered first and highlighted) or one of its parts.
 * Lives here rather than in the page so child components can type against it.
 */
export interface LedgerRow extends PartPricing {
  isSet: boolean
}

export type Verdict = 'parts' | 'set' | 'even'

export interface BasisResult {
  key: BasisKey
  /** False when the SET itself has no price under this basis (or any fallback) */
  available: boolean
  setCost: number
  setValue: number
  partsCost: number
  partsValue: number
  /** setCost - partsCost. Positive => buying the parts is cheaper. */
  save: number
  /** save as a percentage of setCost */
  savePct: number
  /** partsValue - setValue. Positive => parting out resells for more. */
  resaleExtra: number
  resaleExtraPct: number
  verdict: Verdict
  coverage: {
    /** Parts priced natively on this basis */
    priced: number
    /** Parts present in the payload */
    total: number
    /** Parts that needed a fallback basis */
    estimated: number
  }
  /** True when at least one part fell back, or the payload is missing parts */
  incomplete: boolean
  rows: PartPricing[]
}

const num = (n: unknown): number => {
  const v = Number(n)
  return Number.isFinite(v) && v > 0 ? v : 0
}

/**
 * The item's realistic going rate, used to anchor the order-book bait/troll
 * filters. Traded average first — it is the only figure backed by completed
 * trades — then the live book.
 */
export function goingRateOf(market: SetMarket): number {
  return num(market?.avg_price) || num(market?.sell) || num(market?.buy)
}

/** Adapts a payload node to the OrderBook shape useOrderBook walks. */
function bookOf(node: SetNode): OrderBook {
  return {
    url_name: node.url_name,
    subtype: node.market?.subtype ?? null,
    buy: node.depth?.buy ?? [],
    sell: node.depth?.sell ?? [],
  }
}

/**
 * Prices ONE item on ONE basis, with no fallback. Returns zeros when the basis
 * has no data for this item — the caller decides whether to fall back.
 *
 * `quantity` only matters for `bulk`: walking the ladder for 2 units of a part
 * costs more than 2× the best ask when the top level is thin, which is exactly
 * the realism the other bases cannot express.
 */
export function priceOn(node: SetNode, basis: BasisKey, quantity = 1): { acquire: number; resale: number } {
  const m = node?.market || {}
  switch (basis) {
    case 'instant':
      return { acquire: num(m.sell), resale: num(m.buy) }
    case 'top5':
      return { acquire: num(m.sellAvg), resale: num(m.buyAvg) }
    case 'avg48h':
      // One number for both sides: a traded average has no bid/ask side.
      return { acquire: num(m.avg_price), resale: num(m.avg_price) }
    case 'median':
      return { acquire: num(m.last_completed?.median), resale: num(m.last_completed?.median) }
    case 'bulk': {
      if (!node.depth) return { acquire: 0, resale: 0 }
      const qty = Math.max(1, Math.floor(Number(quantity) || 1))
      const rate = goingRateOf(m)
      const buyQuote = bulkBuy(bookOf(node), qty, rate)
      const sellQuote = bulkSell(bookOf(node), qty, rate)
      // Per-unit, so the caller multiplies by quantity uniformly across bases.
      // A partial fill still prices the units that WOULD clear.
      return { acquire: num(buyQuote.avg), resale: num(sellQuote.avg) }
    }
    default:
      return { acquire: 0, resale: 0 }
  }
}

/**
 * Prices one item on the requested basis, falling back when it has no data.
 *
 * Falling back per PART rather than per SET matters: one part missing a median
 * would otherwise either zero out the total (understating the parts cost and
 * inverting the verdict) or blank the whole basis. The row is flagged instead,
 * so the UI can mark it estimated.
 *
 * The fallback is also per SIDE, which is the subtle part. On the two-sided
 * bases each side comes from a different field and ONE of them is routinely
 * zero: OrderCalculator stops its ingame/online status walk as soon as EITHER
 * side has orders, so an item with bidders but no sellers is stored as
 * `sell: 0, buy: 20`. Accepting that as "has data" would price the part's
 * acquire cost at 0 platinum, drop it out of the parts total unflagged, and can
 * invert the verdict outright. Each side is therefore resolved independently,
 * and borrowing EITHER side marks the row estimated.
 */
export function priceWithFallback(node: SetNode, basis: BasisKey, quantity = 1): NodePrice {
  const primary = priceOn(node, basis, quantity)
  let acquire = primary.acquire
  let resale = primary.resale
  let estimated = false
  // `from` names the basis the ESTIMATE came from (what the row tooltip shows),
  // or the requested basis when nothing had to be borrowed.
  let from: BasisKey | null = acquire > 0 && resale > 0 ? basis : null

  if (acquire <= 0 || resale <= 0) {
    for (const alt of FALLBACK_ORDER[basis] || []) {
      if (acquire > 0 && resale > 0) break
      const p = priceOn(node, alt, quantity)
      if (acquire <= 0 && p.acquire > 0) {
        acquire = p.acquire
        estimated = true
        from = from ?? alt
      }
      if (resale <= 0 && p.resale > 0) {
        resale = p.resale
        estimated = true
        from = from ?? alt
      }
    }
    // Still short a side after exhausting every basis — the item genuinely has
    // no price there, so flag it rather than passing a zero off as real.
    if (acquire <= 0 || resale <= 0) estimated = true
  }

  return { acquire, resale, estimated, from }
}

function verdictOf(savePct: number, save: number): Verdict {
  if (save === 0) return 'even'
  if (Math.abs(savePct) < EVEN_THRESHOLD_PCT) return 'even'
  return save > 0 ? 'parts' : 'set'
}

/**
 * Prices a whole set on one basis.
 *
 * @param set - The assembled-set node
 * @param parts - Its parts, each carrying quantity_for_set
 * @param basis - Which pricing basis to use
 * @param declaredParts - How many parts the set is SUPPOSED to have
 *        (`meta.partsCount`). When the payload has fewer, the result is flagged
 *        incomplete — the totals are a lower bound, not a wrong answer.
 */
export function priceSet(
  set: SetNode | null | undefined,
  parts: SetNode[],
  basis: BasisKey,
  declaredParts?: number,
): BasisResult {
  const list = parts || []
  const rows: PartPricing[] = list.map((node) => {
    const quantity = Math.max(1, Math.floor(Number(node.quantity_for_set) || 1))
    const priced = priceWithFallback(node, basis, quantity)
    return {
      node,
      quantity,
      ...priced,
      acquireTotal: priced.acquire * quantity,
      resaleTotal: priced.resale * quantity,
    }
  })

  const partsCost = rows.reduce((sum, r) => sum + r.acquireTotal, 0)
  const partsValue = rows.reduce((sum, r) => sum + r.resaleTotal, 0)

  const setPrice = set
    ? priceWithFallback(set, basis, 1)
    : { acquire: 0, resale: 0, estimated: true, from: null as BasisKey | null }
  const setCost = setPrice.acquire
  const setValue = setPrice.resale

  const save = setCost > 0 && partsCost > 0 ? setCost - partsCost : 0
  const resaleExtra = setValue > 0 && partsValue > 0 ? partsValue - setValue : 0

  // Percentages are normalised against the EXPENSIVE side, which makes them
  // direction-correct for both verdicts. Anchoring on setCost alone was right
  // for "parts are X% cheaper" but wrong for "the set is X% cheaper" — that
  // baseline is the parts total, and dividing by the smaller number produced
  // impossible copy ("costs 150% less"). Using max() also makes the
  // even-threshold symmetric, so a set-side edge and a parts-side edge of the
  // same real magnitude are judged the same way.
  const costBase = Math.max(setCost, partsCost)
  const savePct = costBase > 0 ? (save / costBase) * 100 : 0
  const valueBase = Math.max(setValue, partsValue)
  const resaleExtraPct = valueBase > 0 ? (resaleExtra / valueBase) * 100 : 0

  const estimated = rows.filter((r) => r.estimated).length
  const total = declaredParts && declaredParts > rows.length ? declaredParts : rows.length

  return {
    key: basis,
    // A basis is "available" only if the set node itself priced natively on it —
    // otherwise the toggle would advertise data that is really a fallback.
    available: !setPrice.estimated && setCost > 0,
    setCost,
    setValue,
    partsCost,
    partsValue,
    save,
    savePct,
    resaleExtra,
    resaleExtraPct,
    verdict: verdictOf(savePct, save),
    coverage: { priced: rows.length - estimated, total, estimated },
    incomplete: estimated > 0 || total > rows.length,
    rows,
  }
}

/** Prices the set on every basis — powers the expanded all-bases comparison. */
export function priceAllBases(
  set: SetNode | null | undefined,
  parts: SetNode[],
  declaredParts?: number,
): Record<BasisKey, BasisResult> {
  const out = {} as Record<BasisKey, BasisResult>
  for (const key of BASIS_KEYS) out[key] = priceSet(set, parts, key, declaredParts)
  return out
}

/**
 * Whether a basis is worth offering at all for this set: the set AND at least
 * one part must price natively on it. Bases that would be pure fallback are
 * disabled in the toggle rather than shown as real readings.
 */
export function basisSupported(set: SetNode | null | undefined, parts: SetNode[], basis: BasisKey): boolean {
  if (!set) return false
  const s = priceOn(set, basis, 1)
  if (s.acquire <= 0 && s.resale <= 0) return false
  return (parts || []).some((p) => {
    const v = priceOn(p, basis, p.quantity_for_set || 1)
    return v.acquire > 0 || v.resale > 0
  })
}

export function useSetPricing() {
  return { priceSet, priceAllBases, priceOn, priceWithFallback, basisSupported, goingRateOf, BASIS_KEYS, EVEN_THRESHOLD_PCT }
}
