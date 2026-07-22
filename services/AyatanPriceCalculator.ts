/**
 * Builds the per-star price snapshot used by expandable Ayatan sculpture rows.
 * Ayatan sculptures are not ranked: each market variant is identified by the
 * exact number of socketed amber and cyan stars.
 */

import { IOrderData } from './OrderCalculator';
import { IStatisticsDataPoint, StatisticsCalculator } from './StatisticsCalculator';

export interface IAyatanPriceVariant {
  key: string;
  amberStars: number;
  cyanStars: number;
  ask: number;
  bid: number;
  avg_price: number;
  volume: number;
  sellCount: number;
  buyCount: number;
}

export interface IAyatanPriceData {
  maxAmberStars: number;
  maxCyanStars: number;
  variants: IAyatanPriceVariant[];
  updatedAt: string;
}

function isActionable(order: IOrderData & { visible?: boolean }): boolean {
  return order.visible !== false && (order.user?.status === 'ingame' || order.user?.status === 'online');
}

export function buildAyatanPriceData(
  orders: Array<IOrderData & { visible?: boolean }>,
  stats48h: IStatisticsDataPoint[] | null | undefined,
  maxAmberStars: number,
  maxCyanStars: number,
  now: string = new Date().toISOString(),
): IAyatanPriceData {
  const maxAmber = Math.max(0, Math.floor(Number(maxAmberStars) || 0));
  const maxCyan = Math.max(0, Math.floor(Number(maxCyanStars) || 0));
  const variants: IAyatanPriceVariant[] = [];

  // Total-star ordering reads as a natural empty -> filled progression while
  // preserving distinct amber/cyan combinations at the same total.
  for (let total = 0; total <= maxAmber + maxCyan; total++) {
    for (let amberStars = 0; amberStars <= maxAmber; amberStars++) {
      const cyanStars = total - amberStars;
      if (cyanStars < 0 || cyanStars > maxCyan) continue;

      const matching = (orders || []).filter((order) =>
        isActionable(order) &&
        (order.amber_stars ?? 0) === amberStars &&
        (order.cyan_stars ?? 0) === cyanStars
      );
      const sells = matching.filter((order) => order.order_type === 'sell');
      const buys = matching.filter((order) => order.order_type === 'buy');
      const ask = sells.reduce((best, order) => best === 0 ? order.platinum : Math.min(best, order.platinum), 0);
      const bid = buys.reduce((best, order) => Math.max(best, order.platinum), 0);
      const stats = StatisticsCalculator.calculate(stats48h || [], { amberStars, cyanStars });

      variants.push({
        key: `${amberStars}:${cyanStars}`,
        amberStars,
        cyanStars,
        ask,
        bid,
        avg_price: stats.avg_price,
        volume: stats.volume,
        sellCount: sells.length,
        buyCount: buys.length,
      });
    }
  }

  return { maxAmberStars: maxAmber, maxCyanStars: maxCyan, variants, updatedAt: now };
}
