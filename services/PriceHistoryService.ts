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
    return { points, trend: PriceHistoryService.trendOf(points) };
  }

  /**
   * Batch variant of getHistoryWithTrend: one query for many items.
   *
   * The set detail page needs a series for the set AND every part (5-8 items).
   * Looping getHistoryWithTrend would be an N+1; this is a single `$in` read.
   *
   * @param urlNames - Items to load (duplicates and blanks are ignored)
   * @param limit - Keep at most this many of the MOST RECENT points per item
   * @returns Map keyed by url_name. Items with no stored document are simply
   *          absent - callers substitute an empty series.
   */
  async getManyHistories(
    urlNames: string[],
    limit = 30
  ): Promise<Map<string, { points: IPricePoint[]; trend: ITrendResult }>> {
    const out = new Map<string, { points: IPricePoint[]; trend: ITrendResult }>();
    const wanted = Array.from(new Set((urlNames || []).filter(Boolean)));
    if (wanted.length === 0) return out;

    const docs: any[] = (await this.repository.allEntries({ url_name: { $in: wanted } })) as any[];

    for (const doc of docs || []) {
      if (!doc || !doc.url_name) continue;
      const all: IPricePoint[] = Array.isArray(doc.points) ? doc.points : [];
      // Points are appended oldest-first, so the tail is the recent window.
      const points = limit > 0 && all.length > limit ? all.slice(-limit) : all;
      // Trend is computed over the TRIMMED window so it describes the series the
      // client actually renders, not the full retained history.
      out.set(doc.url_name, { points, trend: PriceHistoryService.trendOf(points) });
    }

    return out;
  }

  /**
   * Derives a trend summary from an already-loaded series.
   * Shared by the single and batch readers so both classify identically.
   */
  static trendOf(points: IPricePoint[]): ITrendResult {
    const changePercent = StatisticsCalculator.calculateTrend(
      (points || []).map((p) => ({ datetime: p.date, avg_price: p.avg_price, volume: p.volume })) as any
    );

    const direction: TrendDirection =
      Math.abs(changePercent) < FLAT_TREND_THRESHOLD_PERCENT ? 'flat' : changePercent > 0 ? 'up' : 'down';

    return { direction, changePercent };
  }
}
