/**
 * Realized P/L for the /ledger trade log.
 *
 * Accounting model: **weighted average cost** per item, the standard for
 * fungible inventory and the only one that behaves sanely here — Warframe parts
 * are indistinguishable, and a player recording "bought 3 at 40p" has no notion
 * of which specific copy they later sold.
 *
 *   buy  → position += qty, cost pool += qty × price
 *   sell → realized += qty × (price − avgCost); position -= qty; pool -= qty × avgCost
 *
 * Selling more than the recorded position is a normal data-entry situation (the
 * player owned items before they started logging), so the excess is treated as
 * zero-cost rather than dropped — it books the full sale as profit and flags the
 * row, instead of silently losing the trade.
 *
 * All pure functions over plain objects; unit-tested under the backend jest
 * setup (test-helpers/useLedger.logic.test.ts).
 */

export interface LedgerTrade {
  id: string
  url_name: string
  item_name: string
  side: 'buy' | 'sell'
  qty: number
  /** Platinum per unit. */
  price: number
  at: string
  note?: string
}

export interface LedgerPosition {
  url_name: string
  item_name: string
  /** Units currently held according to the log. */
  qty: number
  /** Weighted average platinum paid per held unit. */
  avgCost: number
  /** Platinum realized on this item so far. */
  realized: number
  bought: number
  sold: number
  /** Plat spent on buys / received on sells. */
  spent: number
  received: number
  /** Sales that exceeded the logged position (treated as zero-cost). */
  uncoveredUnits: number
}

export interface LedgerTradeResult extends LedgerTrade {
  /** Realized P/L booked by THIS trade (0 for buys). */
  realized: number
  /** Average cost per unit at the moment of the sale. */
  costAtSale: number
  /** True when part of this sale had no recorded cost basis. */
  uncovered: boolean
}

export interface LedgerSummary {
  trades: number
  buys: number
  sells: number
  spent: number
  received: number
  realized: number
  /** Realized profit as a fraction of the plat put at risk on covered sales. */
  realizedPct: number | null
  bestTrade: LedgerTradeResult | null
  worstTrade: LedgerTradeResult | null
  /** Plat realized per calendar day spanned by the log. */
  platPerDay: number | null
  firstAt: string | null
  lastAt: string | null
}

function num(value: unknown, fallback = 0): number {
  const x = typeof value === 'string' ? parseFloat(value) : (value as number)
  return typeof x === 'number' && Number.isFinite(x) ? x : fallback
}

function sortByTime(trades: LedgerTrade[]): LedgerTrade[] {
  return trades
    .slice()
    .sort((a, b) => (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0))
}

/**
 * Replays the log in chronological order.
 * Returns per-item positions and a per-trade result (what each sale realized).
 */
export function replayLedger(trades: LedgerTrade[]): {
  positions: Record<string, LedgerPosition>
  results: LedgerTradeResult[]
} {
  const positions: Record<string, LedgerPosition> = {}
  const results: LedgerTradeResult[] = []
  // Running cost pool per item; avgCost is derived from it, never stored twice.
  const pool: Record<string, number> = {}

  for (const raw of sortByTime(trades || [])) {
    const url = raw?.url_name
    if (!url) continue
    const qty = Math.max(0, Math.round(num(raw.qty, 0)))
    const price = Math.max(0, num(raw.price, 0))
    if (qty <= 0) continue

    if (!positions[url]) {
      positions[url] = {
        url_name: url,
        item_name: raw.item_name || url,
        qty: 0,
        avgCost: 0,
        realized: 0,
        bought: 0,
        sold: 0,
        spent: 0,
        received: 0,
        uncoveredUnits: 0,
      }
      pool[url] = 0
    }
    const pos = positions[url]
    if (raw.item_name) pos.item_name = raw.item_name

    if (raw.side === 'buy') {
      pos.qty += qty
      pos.bought += qty
      pos.spent += qty * price
      pool[url] += qty * price
      pos.avgCost = pos.qty > 0 ? pool[url] / pos.qty : 0
      results.push({ ...raw, qty, price, realized: 0, costAtSale: pos.avgCost, uncovered: false })
      continue
    }

    // Sell
    const avgCost = pos.qty > 0 ? pool[url] / pos.qty : 0
    const covered = Math.min(qty, pos.qty)
    const uncovered = qty - covered
    const realized = covered * (price - avgCost) + uncovered * price
    pos.realized += realized
    pos.sold += qty
    pos.received += qty * price
    pos.uncoveredUnits += uncovered
    pool[url] = Math.max(0, pool[url] - covered * avgCost)
    pos.qty = Math.max(0, pos.qty - covered)
    pos.avgCost = pos.qty > 0 ? pool[url] / pos.qty : 0
    results.push({
      ...raw,
      qty,
      price,
      realized,
      costAtSale: avgCost,
      uncovered: uncovered > 0,
    })
  }

  return { positions, results }
}

export function summarize(trades: LedgerTrade[]): LedgerSummary {
  const list = sortByTime(trades || [])
  const { results } = replayLedger(list)
  const summary: LedgerSummary = {
    trades: results.length,
    buys: 0,
    sells: 0,
    spent: 0,
    received: 0,
    realized: 0,
    realizedPct: null,
    bestTrade: null,
    worstTrade: null,
    platPerDay: null,
    firstAt: null,
    lastAt: null,
  }
  let costBase = 0
  for (const r of results) {
    if (r.side === 'buy') {
      summary.buys += 1
      summary.spent += r.qty * r.price
    } else {
      summary.sells += 1
      summary.received += r.qty * r.price
      summary.realized += r.realized
      costBase += r.qty * r.costAtSale
      if (!summary.bestTrade || r.realized > summary.bestTrade.realized) summary.bestTrade = r
      if (!summary.worstTrade || r.realized < summary.worstTrade.realized) summary.worstTrade = r
    }
  }
  if (costBase > 0) summary.realizedPct = summary.realized / costBase
  if (results.length) {
    summary.firstAt = results[0].at
    summary.lastAt = results[results.length - 1].at
    const span = (Date.parse(summary.lastAt) || 0) - (Date.parse(summary.firstAt) || 0)
    const days = Math.max(1, span / 86_400_000)
    summary.platPerDay = summary.realized / days
  }
  return summary
}

export interface EquityPoint {
  date: string
  realized: number
}

/**
 * Cumulative realized P/L, one point per day that has at least one sale.
 * Feeds the inline SVG curve on /ledger (same idiom as PriceSpark).
 */
export function equityCurve(trades: LedgerTrade[]): EquityPoint[] {
  const { results } = replayLedger(trades || [])
  const byDay = new Map<string, number>()
  for (const r of results) {
    if (r.side !== 'sell') continue
    const date = (r.at || '').slice(0, 10)
    if (!date) continue
    byDay.set(date, (byDay.get(date) || 0) + r.realized)
  }
  const days = Array.from(byDay.keys()).sort()
  let running = 0
  return days.map((date) => {
    running += byDay.get(date) || 0
    return { date, realized: running }
  })
}

/** Per-item rows for the ledger breakdown table, best realized first. */
export function positionRows(trades: LedgerTrade[]): LedgerPosition[] {
  const { positions } = replayLedger(trades || [])
  return Object.values(positions).sort((a, b) => b.realized - a.realized)
}
