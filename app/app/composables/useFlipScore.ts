/**
 * Fill-confidence scoring for the /flip market spread finder.
 *
 * The Flip Finder used to rank purely by the raw bid–ask spread
 * (`sell − buy`). That number is a mirage on most items: a lone gouger's 999p
 * ask, or a lowball buy order, invents a "spread" nobody ever trades through.
 * A wide spread on an item with zero realized volume is not a deal — it's noise.
 *
 * This module scores how PLAUSIBLE a flip actually is, using the data the market
 * snapshot already ships (`avg_price` = 48h realized average, `volume` = 48h
 * realized trades, `last_completed` = the last real trade). Two ideas:
 *
 *  1. **Realistic margin** — buy at the bid, resell into real demand at the 48h
 *     clearing price, not at the optimistic ask you rarely get. So the headline
 *     profit is `avg_price − bid`, and the ask-based spread is kept only as a
 *     secondary, best-case figure. This alone neutralises the fake-ask problem:
 *     a junk ask can't inflate `avg − bid`.
 *
 *  2. **Fill confidence (0–100)** — a blend of liquidity (does anyone trade it?),
 *     anchor sanity (does the realized average sit inside the quoted band, or is
 *     one side a fantasy?) and freshness (was the last real trade recent?). Drives
 *     the Strong / Fair / Thin / Speculative tier and lets the page hide mirages
 *     by default.
 *
 * Pure module (no Vue) — auto-imported by Nuxt from `composables/`. Mirrors the
 * split the relic/endo pages use (`useRelicValue`, `useEndoValue`): the maths
 * lives here, the page just presents it.
 */

/** The market snapshot fields this scorer reads (subset of the store's market). */
export interface FlipMarket {
  /** Highest buy order — what you pay posting a competitive buy order (buy-in). */
  buy?: number
  /** Lowest sell order — the optimistic relist price (rarely the realized one). */
  sell?: number
  /** 48h realized-trade average — the true clearing price the flip resells into. */
  avg_price?: number
  /** 48h realized trade count — liquidity / fill odds. */
  volume?: number
  /** The last actually-completed trade (datetime drives freshness). */
  last_completed?: { datetime?: string; avg_price?: number } | null
}

/** Liquidity half-weight: a mod's 48h volume where its demand counts half. */
export const FLIP_VOL_K = 5
/**
 * A flip needs at least this many realized 48h trades to be non-speculative.
 * Aligned with marketLookup's THIN_VOLUME (≤3 = thin): 1–2 trades in 48h is too
 * few to trust the average or expect a fill, so those hide until you opt in.
 */
export const MIN_PLAUSIBLE_VOL = 3
/** Ask more than this × the realized average = a lone-gouger quote (flag it). */
export const JUNK_ASK_RATIO = 3
/** Freshness floor: a last trade this many hours old scores 0 on recency. */
export const FRESH_MAX_HOURS = 48

/** Confidence blend weights (sum to 1). Liquidity dominates — it's the fill risk. */
const W_LIQUIDITY = 0.55
const W_ANCHOR = 0.3
const W_FRESHNESS = 0.15

export interface FlipTier {
  key: 'strong' | 'fair' | 'thin' | 'spec'
  label: string
  /** Shared `.pill--*` variant class from analytics.css. */
  cls: string
}

export interface FlipScore {
  bid: number
  ask: number
  avg: number
  vol: number
  /** Optimistic best-case: ask − bid. Secondary, can be inflated by a junk ask. */
  spread: number
  spreadPct: number
  /** Headline profit: avg − bid (buy at bid, resell at the realized average). */
  realMargin: number
  /** realMargin ÷ bid × 100 — return on the platinum you deploy. */
  realMarginPct: number
  /** vol/(vol+K) in [0,1) — fill odds from 48h realized volume. */
  liquidity: number
  /** [0,1] recency of the last real trade (1 = just now, 0 = ≥FRESH_MAX_HOURS). */
  freshness: number
  /** [0,1] how well the realized average brackets the quoted bid/ask. */
  anchor: number
  /** The realized average supports the resale (avg in-band and above the bid). */
  anchorOk: boolean
  /** The ask is a lone-gouger price — the optimistic spread is not real. */
  junkAsk: boolean
  /** 0–100 fill-confidence: how likely this flip actually completes at profit. */
  confidence: number
  /** realMargin × liquidity — expected realizable platinum. Default sort key. */
  opportunity: number
  /** Passes the default (non-speculative) view: real margin, real volume. */
  plausible: boolean
  tier: FlipTier
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n
}

/** Hours between `iso` and `nowMs`; Infinity when the date is missing/invalid. */
function hoursSince(iso: string | undefined | null, nowMs: number): number {
  if (!iso) return Infinity
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return Infinity
  return (nowMs - t) / 3_600_000
}

/**
 * Tier from the confidence score. Anything without a positive realistic margin
 * is Speculative regardless of confidence — a liquid item you can't profit on is
 * not a flip.
 */
export function flipTier(confidence: number, realMargin: number): FlipTier {
  if (realMargin > 0 && confidence >= 66) return { key: 'strong', label: 'Strong', cls: 'pill--good' }
  if (realMargin > 0 && confidence >= 40) return { key: 'fair', label: 'Fair', cls: 'pill--alt' }
  if (realMargin > 0 && confidence >= 20) return { key: 'thin', label: 'Thin', cls: 'pill--even' }
  return { key: 'spec', label: 'Speculative', cls: 'pill--even' }
}

/**
 * Score one item's market snapshot. Pure — safe in a computed. `nowMs` is
 * injectable so callers can compute freshness against a single fixed clock.
 */
export function scoreFlip(market: FlipMarket | null | undefined, nowMs: number = Date.now()): FlipScore {
  const bid = num(market?.buy)
  const ask = num(market?.sell)
  const avg = num(market?.avg_price)
  const vol = num(market?.volume)

  const spread = ask - bid
  const spreadPct = bid > 0 ? (spread / bid) * 100 : 0

  // Realistic profit needs a realized average AND a bid to buy into. Without a
  // 48h average we can't say what the item truly clears at, so margin is 0
  // (unknown) rather than a fantasy — such rows fall out of the plausible set.
  const realMargin = avg > 0 && bid > 0 ? avg - bid : 0
  const realMarginPct = bid > 0 ? (realMargin / bid) * 100 : 0

  const liquidity = vol > 0 ? vol / (vol + FLIP_VOL_K) : 0

  // Anchor: where the realized average sits vs the quoted band.
  //  in-band (bid ≤ avg ≤ ask) → healthy two-sided market (1)
  //  avg above ask            → ask is a cheap listing, resale at avg very
  //                             plausible but the ask side is thin (0.85)
  //  avg below bid            → buyers bidding above recent trades; the margin
  //                             is illusory and the row is speculative (0.2)
  let anchor = 0
  if (avg > 0 && vol > 0) {
    if (bid <= avg && avg <= ask) anchor = 1
    else if (avg > ask) anchor = 0.85
    else anchor = 0.2
  }
  const anchorOk = avg > 0 && vol > 0 && avg >= bid
  const junkAsk = avg > 0 && ask > avg * JUNK_ASK_RATIO

  // Freshness of the last REAL trade (not the snapshot time) — a wide book that
  // last cleared days ago is far less likely to fill. Neutral 0.5 when unknown
  // so a missing timestamp neither rewards nor punishes.
  const h = hoursSince(market?.last_completed?.datetime, nowMs)
  const freshness = h === Infinity ? 0.5 : clamp01(1 - h / FRESH_MAX_HOURS)

  const confidence = Math.round(
    100 * (W_LIQUIDITY * liquidity + W_ANCHOR * anchor + W_FRESHNESS * freshness),
  )

  const opportunity = Math.max(0, realMargin) * liquidity
  const plausible = realMargin > 0 && vol >= MIN_PLAUSIBLE_VOL && bid > 0 && ask > 0

  return {
    bid,
    ask,
    avg,
    vol,
    spread,
    spreadPct,
    realMargin,
    realMarginPct,
    liquidity,
    freshness,
    anchor,
    anchorOk,
    junkAsk,
    confidence,
    opportunity,
    plausible,
    tier: flipTier(confidence, realMargin),
  }
}
