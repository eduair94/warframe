/**
 * Valuation for the /vault inventory tracker.
 *
 * Everything here is a PURE function over plain objects (no Vue reactivity, no
 * Nuxt), so it is unit-tested under the backend's jest setup — see
 * test-helpers/useVaultValue.logic.test.ts.
 *
 * The liquidity model is the project's existing one (`useRelicValue.VOL_K`,
 * mirrored in `useDropMap`): a holding is only worth what you can actually sell,
 * so its value is discounted by `vol / (vol + VOL_K)`. Ten thousand platinum of
 * an item that trades twice a week is not ten thousand platinum.
 */

/** Liquidity half-weight: value counts 50% when 48h volume equals VOL_K. */
export const VOL_K = 10

/** Below this 48h volume a holding is flagged thin (hard to actually sell). */
export const THIN_VOLUME = 3

/** Within this % of the all-time high counts as "at its top". */
export const NEAR_ATH_PCT = 5

export type ValueBasis = 'sell' | 'buy' | 'avg' | 'median'

/** Market facts for one item, as served by `/market_analytics` + the catalogue. */
export interface VaultMarket {
  /** Lowest live ask — what you'd have to undercut to sell. */
  sell?: number | null
  /** Highest live bid — what you could sell into right now. */
  buy?: number | null
  /** 48h volume-weighted average price. */
  avg_price?: number | null
  /** 48h median. */
  median?: number | null
  volume?: number | null
  atl?: number | null
  ath?: number | null
  pctFromAtl?: number | null
  pctFromAth?: number | null
  change7d?: number | null
  trend?: string | null
}

export interface VaultHolding {
  url_name: string
  item_name: string
  qty: number
  /** Average platinum paid per unit, when recorded. */
  cost?: number | null
}

export type VaultVerdict = 'sell' | 'hold' | 'thin' | 'unknown'

export interface VaultRow extends VaultHolding {
  market: VaultMarket
  /** Chosen price basis, per unit. */
  unit: number
  /** Liquidity weight in [0,1). */
  liquidity: number
  /** Realizable plat per unit (unit × liquidity). */
  unitRealizable: number
  /** unit × qty — the headline, undiscounted number. */
  value: number
  /** unitRealizable × qty — what you could plausibly cash out. */
  realizable: number
  /** Unrealized profit vs the recorded cost basis; null when no cost recorded. */
  pnl: number | null
  /** Unrealized profit as a fraction of cost; null when no cost recorded. */
  pnlPct: number | null
  verdict: VaultVerdict
}

function n(value: unknown): number {
  const x = typeof value === 'string' ? parseFloat(value) : (value as number)
  return typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0
}

/**
 * Per-unit price for a basis, with a sensible fallback chain. `sell` (the
 * lowest ask) is the default because that is the number a player sees when they
 * list an item; `buy` answers "what if I dump into the top bid right now".
 */
export function unitPrice(market: VaultMarket | null | undefined, basis: ValueBasis = 'sell'): number {
  if (!market) return 0
  const sell = n(market.sell)
  const buy = n(market.buy)
  const avg = n(market.avg_price)
  const median = n(market.median)
  switch (basis) {
    case 'buy':
      return buy || avg || sell || median
    case 'avg':
      return avg || median || sell || buy
    case 'median':
      return median || avg || sell || buy
    case 'sell':
    default:
      return sell || avg || median || buy
  }
}

/** Liquidity weight in [0,1): `vol / (vol + VOL_K)`. Zero volume → 0. */
export function liquidity(market: VaultMarket | null | undefined): number {
  const vol = n(market?.volume)
  return vol / (vol + VOL_K)
}

/**
 * Sell-timing verdict.
 *  - `thin`    — barely trades; the quoted price is not reliably obtainable.
 *  - `sell`    — at/near its all-time high, or up hard over the week.
 *  - `hold`    — everything else with a usable price.
 *  - `unknown` — no price at all.
 */
export function verdictFor(market: VaultMarket | null | undefined, basis: ValueBasis = 'sell'): VaultVerdict {
  if (!market || unitPrice(market, basis) <= 0) return 'unknown'
  const vol = n(market.volume)
  if (vol > 0 && vol < THIN_VOLUME) return 'thin'
  if (vol === 0) return 'thin'
  const pctFromAth = typeof market.pctFromAth === 'number' ? Math.abs(market.pctFromAth) : null
  if (pctFromAth !== null && pctFromAth <= NEAR_ATH_PCT) return 'sell'
  const change7d = typeof market.change7d === 'number' ? market.change7d : null
  if (change7d !== null && change7d >= 15) return 'sell'
  return 'hold'
}

/** Builds one fully-valued row from a holding + its market facts. */
export function valueHolding(
  holding: VaultHolding,
  market: VaultMarket | null | undefined,
  basis: ValueBasis = 'sell',
  liquidityAdjust = true
): VaultRow {
  const m = market || {}
  const qty = Math.max(0, Math.round(Number(holding.qty) || 0))
  const unit = unitPrice(m, basis)
  const liq = liquidityAdjust ? liquidity(m) : 1
  const unitRealizable = unit * liq
  const cost = typeof holding.cost === 'number' && Number.isFinite(holding.cost) ? holding.cost : null
  const value = unit * qty
  const realizable = unitRealizable * qty
  // P/L is measured against the REALIZABLE value, not the headline ask: a
  // paper gain you can't sell into isn't a gain.
  const pnl = cost === null ? null : realizable - cost * qty
  const pnlPct = cost === null || cost <= 0 ? null : (realizable - cost * qty) / (cost * qty)
  return {
    ...holding,
    qty,
    market: m,
    unit,
    liquidity: liq,
    unitRealizable,
    value,
    realizable,
    pnl,
    pnlPct,
    verdict: verdictFor(m, basis),
  }
}

export interface VaultTotals {
  items: number
  units: number
  value: number
  realizable: number
  /** Total unrealized P/L over the rows that recorded a cost basis. */
  pnl: number
  /** How many rows contributed to `pnl`. */
  pnlRows: number
  /** Rows whose market data is unusable. */
  unpriced: number
}

export function vaultTotals(rows: VaultRow[]): VaultTotals {
  const totals: VaultTotals = {
    items: rows.length,
    units: 0,
    value: 0,
    realizable: 0,
    pnl: 0,
    pnlRows: 0,
    unpriced: 0,
  }
  for (const row of rows) {
    totals.units += row.qty
    totals.value += row.value
    totals.realizable += row.realizable
    if (row.pnl !== null) {
      totals.pnl += row.pnl
      totals.pnlRows += 1
    }
    if (row.unit <= 0) totals.unpriced += 1
  }
  return totals
}
