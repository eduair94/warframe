/**
 * @fileoverview Builds per-rank mod-flip price data from a single orders + stats
 * fetch — the data the Endo Exchange stores per mod.
 * @module services/ModFlipCalculator
 *
 * warframe.market's v2 orders endpoint returns EVERY rank of a mod in one call,
 * and the v1 statistics endpoint returns 48h avg+volume for the two ranks it
 * tracks (unranked=0 and maxed=maxRank). `getItemPrices` already downloads both
 * arrays to price the maxed side, so this extracts the whole rank ladder for
 * FREE — no extra requests.
 *
 * The ladder (lowest ask + highest bid per rank) is what powers "buy at the
 * cheapest worthwhile rank, not just unranked": finishing a rank-3 copy skips
 * the early rank-up endo (see EndoCost.endoFromRankToMax), which sometimes beats
 * buying unranked.
 */

import { StatisticsCalculator, IStatisticsDataPoint } from './StatisticsCalculator';

/** Order shape this calculator needs (subset of the transformed v1 order). */
export interface IFlipOrder {
  order_type: 'buy' | 'sell';
  platinum: number;
  mod_rank?: number;
  visible?: boolean;
  user?: { status?: string };
}

/** One rung of the price ladder: the live market at a single mod rank. */
export interface IFlipRankRung {
  /** Mod rank this rung describes (0 = unranked … maxRank = maxed). */
  rank: number;
  /** Lowest sell order = what you PAY to buy a copy at this rank (0 if none). */
  ask: number;
  /** Highest buy order = what you'd RECEIVE selling instantly at this rank (0 if none). */
  bid: number;
  /** Number of actionable sell orders at this rank. */
  sellCount: number;
  /** Number of actionable buy orders at this rank. */
  buyCount: number;
}

/** 48h realized-trade stats for one rank. */
export interface IFlipStat {
  avg_price: number;
  volume: number;
}

/** Everything the Endo Exchange stores per mod to compute flips. */
export interface IModFlipData {
  /** warframe.market rarity (drives the endo cost tier). */
  rarity: string;
  /** The mod's max rank (drives how many rank-ups). */
  maxRank: number;
  /** Live ask/bid per rank, index-aligned to rank 0..maxRank. */
  ranks: IFlipRankRung[];
  /** 48h realized stats at rank 0 (unranked buyer demand context). */
  unranked: IFlipStat;
  /** 48h realized stats at maxRank (maxed sell demand — drives liquidity weight). */
  maxed: IFlipStat;
  /** ISO timestamp this flip snapshot was computed. */
  updatedAt: string;
}

/** Actionable = visible and the seller/buyer is reachable (ingame or online). */
function isActionable(o: IFlipOrder): boolean {
  if (o.visible === false) return false;
  const s = o.user?.status;
  return s === 'ingame' || s === 'online';
}

/**
 * Builds the ask/bid ladder for ranks 0..maxRank from a mod's order book.
 * Ranks with no actionable orders still get a rung (ask/bid 0) so the array is
 * dense and index-aligned.
 */
export function buildLadder(orders: IFlipOrder[], maxRank: number): IFlipRankRung[] {
  const rungs: IFlipRankRung[] = [];
  for (let rank = 0; rank <= maxRank; rank++) {
    let ask = 0;
    let bid = 0;
    let sellCount = 0;
    let buyCount = 0;
    for (const o of orders) {
      if ((o.mod_rank ?? 0) !== rank) continue;
      if (!isActionable(o)) continue;
      const p = Number(o.platinum) || 0;
      if (o.order_type === 'sell') {
        sellCount++;
        if (ask === 0 || p < ask) ask = p;
      } else if (o.order_type === 'buy') {
        buyCount++;
        if (p > bid) bid = p;
      }
    }
    rungs.push({ rank, ask, bid, sellCount, buyCount });
  }
  return rungs;
}

/**
 * Assembles the full per-mod flip snapshot from already-fetched orders + 48h
 * stats. `stats48h` is `payload.statistics_closed['48hours']` (may be empty).
 */
export function buildModFlipData(
  orders: IFlipOrder[],
  stats48h: IStatisticsDataPoint[] | null | undefined,
  meta: { rarity: string; maxRank: number },
  now: string = new Date().toISOString(),
): IModFlipData {
  const stats = stats48h || [];
  const unrankedStat = StatisticsCalculator.calculate(stats, { modRank: 0 });
  const maxedStat = StatisticsCalculator.calculate(stats, { modRank: meta.maxRank });
  return {
    rarity: meta.rarity,
    maxRank: meta.maxRank,
    ranks: buildLadder(orders || [], meta.maxRank),
    unranked: { avg_price: unrankedStat.avg_price, volume: unrankedStat.volume },
    maxed: { avg_price: maxedStat.avg_price, volume: maxedStat.volume },
    updatedAt: now,
  };
}
