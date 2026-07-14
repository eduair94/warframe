/**
 * @fileoverview Daily price history persistence and trend analysis
 * @module services/PriceHistoryService
 *
 * Single Responsibility: Record one price snapshot per item per day and
 * serve it back for charting/trend analysis.
 *
 * README Roadmap previously listed "Historical price charts" and "Market
 * trend analysis" as unimplemented - the DB only ever kept the latest
 * snapshot (overwritten on every sync) plus a single warframe.market
 * `last_completed` datapoint. This adds an actual time series: sync_prices
 * calls recordPoint() once per item per run, which appends at most one
 * point per UTC day (bounded via $push/$slice so storage doesn't grow
 * unbounded across "continuous" sync cycles).
 */

import { IDatabaseOperations } from '../interfaces/database.interface';
import { PRICE_HISTORY_CONFIG } from '../constants';
import { StatisticsCalculator } from './StatisticsCalculator';

export interface IPricePoint {
  /** ISO date string (day granularity is what matters - see recordPoint) */
  date: string;
  buy: number;
  sell: number;
  avg_price: number;
  volume: number;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface ITrendResult {
  direction: TrendDirection;
  /** Percent change from the oldest to the newest stored point */
  changePercent: number;
}

/** Below this magnitude a trend reads as "flat" rather than noise-driven up/down */
const FLAT_TREND_THRESHOLD_PERCENT = 1;

export class PriceHistoryService {
  constructor(private readonly repository: IDatabaseOperations<any>) {}

  /**
   * Appends today's price point for an item, unless one was already
   * recorded today (sync_prices runs continuously; this keeps the series
   * at day granularity instead of one point per sync cycle).
   */
  async recordPoint(urlName: string, point: Omit<IPricePoint, 'date'>): Promise<void> {
    if (!urlName) return;

    const today = new Date().toISOString().slice(0, 10);
    const existing: any = await this.repository.findEntry({ url_name: urlName });
    const points: IPricePoint[] = existing?.points ?? [];
    const last = points[points.length - 1];

    if (last && last.date === today) {
      return; // already have today's point
    }

    const newPoint: IPricePoint = { date: today, ...point };

    // addToSet() is a generic updateOne(query, update, {upsert:true, ...})
    // wrapper (see database.ts) - passing a raw $push/$slice update through
    // it bounds the array to the last MAX_POINTS entries server-side.
    await (this.repository as any).addToSet(
      { url_name: urlName },
      { $push: { points: { $each: [newPoint], $slice: -PRICE_HISTORY_CONFIG.MAX_POINTS } } }
    );
  }

  /**
   * Gets the stored history for an item, oldest first.
   */
  async getHistory(urlName: string): Promise<IPricePoint[]> {
    const doc: any = await this.repository.findEntry({ url_name: urlName });
    return doc?.points ?? [];
  }

  /**
   * Gets history plus a trend summary (direction + percent change) computed
   * with StatisticsCalculator.calculateTrend - previously defined but never
   * called from anywhere in the app.
   */
  async getHistoryWithTrend(urlName: string): Promise<{ points: IPricePoint[]; trend: ITrendResult }> {
    const points = await this.getHistory(urlName);
    const changePercent = StatisticsCalculator.calculateTrend(
      points.map((p) => ({ datetime: p.date, avg_price: p.avg_price, volume: p.volume }))
    );

    const direction: TrendDirection =
      Math.abs(changePercent) < FLAT_TREND_THRESHOLD_PERCENT ? 'flat' : changePercent > 0 ? 'up' : 'down';

    return { points, trend: { direction, changePercent } };
  }
}
