import { unref, type MaybeRef } from 'vue'
import { demandTier, fmtPlat } from './marketFormat'

/**
 * Shared relic-valuation logic for the /relic-farming and /relics-value pages.
 *
 * Both pages read the same `/relics_ev` payload and used to value a relic purely
 * from each drop's lowest sell order — a price a single overpriced listing can
 * set even when nobody is buying. This module fixes that the same way the Star
 * Chart already does: it discounts every drop by its 48h trade volume, so a part
 * with zero demand contributes ~nothing to a relic's *realizable* payout.
 *
 * Keeping the maths here (not copied into each page) guarantees the farming and
 * value pages agree on what a relic is actually worth.
 */

/** Fixed refinement drop-chance table (per rarity), shared by every relic. */
export const RELIC_CHANCES: Record<string, Record<string, number>> = {
  Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
  Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
}

/**
 * Liquidity half-weight (same basis as the Star Chart). A drop's value counts at
 * 50% when its 48h volume equals VOL_K, approaches full value as volume grows,
 * and is ~0 for an unsold, zero-volume drop — so an illiquid ask can't inflate
 * a relic's EV.
 */
export const VOL_K = 10

export interface RelicReward {
  item_name: string
  rarity: string
  price: number
  avgPrice?: number
  volume?: number
  url_name?: string
  thumb?: string
  /** Whether the part itself is vaulted (scarce) vs still dropping (abundant). */
  vaulted?: boolean
}

export interface RelicRow {
  url_name: string
  relicName: string
  tier: string
  thumb: string
  vaulted?: boolean
  /** Prime Resurgence (Varzia) relic — Aya-bought, never fissure-farmable. */
  resurgence?: boolean
  rewards: RelicReward[]
  relic: { buy: number; sell: number; volume: number; avgPrice?: number }
}

/** Value basis for one drop: the 48h average sell, falling back to the raw ask. */
export function rewardBasis(r: RelicReward | undefined | null): number {
  const avg = Number(r?.avgPrice) || 0
  const sell = Number(r?.price) || 0
  return avg > 0 ? avg : sell
}

/** Liquidity weight in [0,1): vol / (vol + VOL_K). 0 volume → 0. */
export function rewardLiquidity(r: RelicReward | undefined | null): number {
  const vol = Number(r?.volume) || 0
  return vol / (vol + VOL_K)
}

/** Realizable plat for one drop: value basis discounted by its liquidity. */
export function effectivePrice(r: RelicReward | undefined | null): number {
  return rewardBasis(r) * rewardLiquidity(r)
}

/** Forma is untradeable filler (legitimately 0p) — never counts as "missing". */
export function rewardPriced(r: RelicReward | undefined | null): boolean {
  if (/forma/i.test(r?.item_name ? r.item_name : '')) return true
  return Number(r?.price) > 0
}

/**
 * "Full data" = the relic is on the market AND every drop resolved to a price —
 * only then is its EV trustworthy. (Independent of liquidity: a fully-priced
 * relic can still have an illiquid, near-zero *realizable* payout.)
 */
export function hasFullData(relic: RelicRow | undefined | null): boolean {
  const m: any = relic?.relic || {}
  const relicOnMarket = Number(m.buy) > 0 || Number(m.sell) > 0 || Number(m.volume) > 0
  const rewards = relic?.rewards || []
  return relicOnMarket && rewards.length > 0 && rewards.every(rewardPriced)
}

/**
 * Realistic "sell this relic right now" price — what you'd actually pocket, not
 * a sticker number.
 *
 * warframe.market relic BUY orders are polluted with non-executable high bids:
 * Meso V6, for instance, shows standing bids of 120–150p while the relic really
 * trades at ~30p (its 48h average, matching the lowest live asks). Taking the
 * top bid as the sell price — the old behaviour — advertised a payout no seller
 * ever realises and wrongly flipped the "sell it" verdict.
 *
 * So we anchor the price to what the relic actually CLEARS at: the 48h
 * volume-weighted average when it has traded, else the lowest live ask. The best
 * buyer's standing offer only counts UP TO that going rate — a genuine bid below
 * the rate still shows through, but a bait bid above it collapses to reality.
 * Buyer-led where the buyer is real, outlier-proof where they're not.
 */
export function relicSellNow(relic: RelicRow | undefined | null): number {
  const m: any = relic?.relic || {}
  const bid = Number(m.buy) || 0 // highest live buy order — what a buyer offers now
  const ask = Number(m.sell) || 0 // lowest live ask — a listed sell price
  const avg = Number(m.avgPrice) || 0 // 48h volume-weighted average — the true clearing price
  const rate = avg > 0 ? avg : ask // the realistic going rate
  if (bid > 0 && rate > 0) return Math.min(bid, rate)
  return rate > 0 ? rate : bid
}

/** A vaulted relic no longer drops from missions (can't be farmed). */
export function isVaulted(relic: RelicRow | undefined | null): boolean {
  return relic?.vaulted === true
}

/**
 * A Prime Resurgence (Varzia) relic — a non-fissure tier obtained only by buying
 * from Varzia with Aya, never dropped by a mission or fissure. warframe.market
 * flags it non-vaulted (it IS obtainable in-game), so it slips past `isVaulted`;
 * the farming board excludes it from "currently dropping" via this flag instead.
 */
export function isResurgence(relic: RelicRow | undefined | null): boolean {
  return relic?.resurgence === true
}

/** Can this relic be farmed by running a fissure right now (not vaulted, not Resurgence-only)? */
export function isFarmable(relic: RelicRow | undefined | null): boolean {
  return !isVaulted(relic) && !isResurgence(relic)
}

/** A reward part that itself no longer drops from any current relic/mission. */
export function rewardVaulted(r: RelicReward | undefined | null): boolean {
  return r?.vaulted === true
}

export interface DropMix {
  /** Priced drops that still drop in missions (not vaulted) — abundant supply. */
  dropping: number
  /** Priced drops that are themselves vaulted — scarce. */
  vaulted: number
  /** Total drops that carry a market price (Forma / unlisted excluded). */
  priced: number
}

/**
 * Splits a relic's tradeable drops into currently-dropping vs vaulted parts.
 * Lets the pages show which of a relic's payout is scarce (vaulted) vs still
 * farmable elsewhere — "take into account the items that currently drop".
 */
export function dropMix(relic: RelicRow | undefined | null): DropMix {
  let dropping = 0
  let vaulted = 0
  let priced = 0
  for (const r of relic?.rewards || []) {
    if (!(Number(r?.price) > 0)) continue // skip Forma / unpriced filler
    priced += 1
    if (rewardVaulted(r)) vaulted += 1
    else dropping += 1
  }
  return { dropping, vaulted, priced }
}

/**
 * Value-weighted share of a relic's payout that is actually liquid, in [0,1].
 * 1 = every plat of expected payout comes from freely-trading drops; 0 = the
 * payout is entirely drops nobody buys. Drives the demand badge.
 */
export function payoutLiquidity(relic: RelicRow | undefined | null, refinement: string): number {
  const table = RELIC_CHANCES[refinement] ?? RELIC_CHANCES.Intact ?? {}
  let weight = 0
  let weighted = 0
  for (const r of relic?.rewards || []) {
    const w = ((table[r.rarity] || 0) / 100) * (Number(r.price) || 0)
    weight += w
    weighted += w * rewardLiquidity(r)
  }
  return weight > 0 ? weighted / weight : 0
}

// DemandTier + demandTier + fmtPlat now live in ./marketFormat (the single
// auto-import source, shared with useEndoValue). Not re-exported here — doing so
// would recreate the duplicate-export collision this refactor removes. Pages use
// fmtPlat via auto-import; nothing imports demandTier/DemandTier off this module.

/**
 * Refinement-bound valuation closures. Pass the page's `refinement` ref (or a
 * plain string); the returned functions read it live.
 */
export function useRelicValue(refinement: MaybeRef<string>) {
  const table = () => RELIC_CHANCES[unref(refinement)] ?? RELIC_CHANCES.Intact ?? {}

  /**
   * Expected payout of cracking a relic. `liquid` (default) discounts each drop
   * by its trade volume — the realizable payout; `liquid: false` gives the raw
   * headline EV (every ask taken at face value).
   */
  function ev(relic: RelicRow, opts: { liquid?: boolean } = {}): number {
    const liquid = opts.liquid !== false
    const t = table()
    return (relic?.rewards || []).reduce((sum, r) => {
      const chance = t[r.rarity] || 0
      const value = liquid ? effectivePrice(r) : Number(r.price) || 0
      return sum + (chance / 100) * value
    }, 0)
  }

  const evLiquid = (relic: RelicRow) => ev(relic, { liquid: true })
  const evRaw = (relic: RelicRow) => ev(relic, { liquid: false })

  /**
   * The relic's headline drop: the one contributing the most *realizable* value
   * (chance × liquidity-weighted price). Falls back to the priciest raw ask when
   * nothing is liquid, so the cell is never empty.
   */
  function topDrop(relic: RelicRow): RelicReward {
    let best: RelicReward = { item_name: '—', price: 0, rarity: '' }
    let bestScore = -1
    const t = table()
    for (const r of relic?.rewards || []) {
      const score = ((t[r.rarity] || 0) / 100) * effectivePrice(r)
      if (score > bestScore) {
        bestScore = score
        best = r
      }
    }
    if (bestScore <= 0) {
      for (const r of relic?.rewards || []) {
        if ((Number(r.price) || 0) > (Number(best.price) || 0)) best = r
      }
    }
    return best
  }

  const liquidity = (relic: RelicRow) => payoutLiquidity(relic, unref(refinement))
  const demand = (relic: RelicRow) => demandTier(liquidity(relic))

  return {
    ev,
    evLiquid,
    evRaw,
    topDrop,
    liquidity,
    demand,
    effectivePrice,
    rewardBasis,
    rewardLiquidity,
    rewardVaulted,
    relicSellNow,
    dropMix,
    isVaulted,
    isResurgence,
    isFarmable,
    hasFullData,
    fmtPlat,
  }
}
