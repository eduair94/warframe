/**
 * @fileoverview Cross-item market analytics derived from our own price history
 * @module services/MarketAnalyticsService
 *
 * Single Responsibility: turn the raw daily price-history series (one document
 * per item, see PriceHistoryService) plus the current item snapshot into a
 * compact per-item analytics record that the frontend can rank across the whole
 * catalogue.
 *
 * This is the data moat warframe.market does NOT expose: it only serves a
 * rolling 90-day window for ONE item at a time and never ranks items against
 * each other. We keep an unbounded daily series and compute movers, volatility,
 * all-time-low/high flags and trend for EVERY item in one pass.
 *
 * Pure computation only - no database or HTTP access. The caller (facade)
 * supplies the already-loaded items and history documents.
 */

/** A stored daily price point (matches PriceHistoryService.IPricePoint) */
export interface IHistoryPoint {
  date: string; // 'YYYY-MM-DD'
  buy: number;
  sell: number;
  avg_price: number;
  volume: number;
}

/** A stored price-history document, one per item */
export interface IHistoryDoc {
  url_name: string;
  points?: IHistoryPoint[];
}

/** Minimal shape of an item needed for analytics (from the items collection) */
export interface IAnalyticsItemInput {
  url_name: string;
  item_name: string;
  thumb?: string;
  tags?: string[];
  vaulted?: boolean;
  ducats?: number;
  market?: {
    buy?: number;
    sell?: number;
    volume?: number;
    avg_price?: number;
  };
}

/** One item's computed analytics, ready for the frontend */
export interface IItemAnalytics {
  url_name: string;
  item_name: string;
  thumb: string;
  tags: string[];
  vaulted: boolean;
  ducats: number;
  /** Current live snapshot (from the items collection, authoritative) */
  buy: number;
  sell: number;
  volume: number;
  avg_price: number;
  /** sell - buy (bid/ask spread) */
  spread: number;
  /** spread as a percentage of the sell price */
  spreadPct: number;
  /** How far the sell price sits below the average (positive = cheap right now) */
  discountPct: number;
  /** Number of daily history points available for this item */
  dataDays: number;
  /** Percent price change over the trailing window (null if not enough history) */
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  /** Coefficient of variation over the whole series (null if < 3 points) */
  volatility: number | null;
  /** Overall direction across the whole stored series */
  trend: 'up' | 'down' | 'flat';
  /** All-time low / high price within the stored history (null if none) */
  atl: number | null;
  ath: number | null;
  /** Where the current price sits relative to the stored low / high */
  pctFromAtl: number | null;
  pctFromAth: number | null;
  /** Last up-to-30 daily prices, for a sparkline */
  spark: number[];
}

/** Below this magnitude a trend reads as "flat" rather than noise-driven up/down */
const FLAT_TREND_THRESHOLD_PERCENT = 1;
/** How many trailing points to expose for the sparkline */
const SPARK_POINTS = 30;
const MS_PER_DAY = 86_400_000;

export class MarketAnalyticsService {
  /**
   * The price a data point represents. avg_price (from completed trades) is the
   * truest signal; fall back to the sell order when there were no trades.
   */
  private static priceOf(p: { avg_price?: number; sell?: number }): number {
    const avg = Number(p.avg_price) || 0;
    if (avg > 0) return avg;
    return Number(p.sell) || 0;
  }

  /** Shifts an ISO 'YYYY-MM-DD' date string by -n days (string-comparable). */
  private static shiftDate(iso: string, days: number): string {
    const t = Date.parse(iso + 'T00:00:00Z');
    if (Number.isNaN(t)) return iso;
    return new Date(t - days * MS_PER_DAY).toISOString().slice(0, 10);
  }

  /**
   * Percent change of the newest price versus the price ~n days earlier.
   * Returns null when the series does not reach back far enough.
   */
  private static changeOverDays(points: IHistoryPoint[], n: number): number | null {
    if (points.length < 2) return null;
    const last = points[points.length - 1];
    const target = MarketAnalyticsService.shiftDate(last.date, n);
    // The series is oldest-first; if even the oldest point is newer than the
    // target date we simply don't have n days of history yet.
    if (points[0].date > target) return null;

    // Largest date <= target (the baseline closest to n days ago).
    let baseline: IHistoryPoint | null = null;
    for (const p of points) {
      if (p.date <= target) baseline = p;
      else break;
    }
    if (!baseline || baseline === last) return null;

    const from = MarketAnalyticsService.priceOf(baseline);
    const to = MarketAnalyticsService.priceOf(last);
    if (from <= 0) return null;
    return ((to - from) / from) * 100;
  }

  /** Coefficient of variation (stdev / mean) as a percent, over all points. */
  private static volatilityOf(prices: number[]): number | null {
    const valid = prices.filter((p) => p > 0);
    if (valid.length < 3) return null;
    const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
    if (mean <= 0) return null;
    const variance = valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length;
    return (Math.sqrt(variance) / mean) * 100;
  }

  /**
   * Builds the analytics record for every item that has a current snapshot.
   * History is joined by url_name; items without stored history still get their
   * spread/discount columns (change/volatility/atl fields come back null).
   */
  static buildAnalytics(
    items: IAnalyticsItemInput[],
    historyDocs: IHistoryDoc[]
  ): { items: IItemAnalytics[]; maxHistoryDays: number } {
    const historyByUrl = new Map<string, IHistoryPoint[]>();
    let maxHistoryDays = 0;
    for (const doc of historyDocs) {
      if (!doc || !doc.url_name) continue;
      const pts = Array.isArray(doc.points) ? doc.points : [];
      historyByUrl.set(doc.url_name, pts);
      if (pts.length > maxHistoryDays) maxHistoryDays = pts.length;
    }

    const out: IItemAnalytics[] = [];
    for (const item of items) {
      if (!item || !item.url_name || !item.market) continue;
      const m = item.market;
      const buy = Number(m.buy) || 0;
      const sell = Number(m.sell) || 0;
      const volume = Number(m.volume) || 0;
      const avg_price = Number(m.avg_price) || 0;
      // Nothing tradeable to analyse.
      if (buy <= 0 && sell <= 0 && avg_price <= 0) continue;

      const spread = sell > 0 && buy > 0 ? sell - buy : 0;
      const spreadPct = sell > 0 ? (spread / sell) * 100 : 0;
      const curPrice = avg_price > 0 ? avg_price : sell;
      const discountPct = avg_price > 0 && sell > 0 ? ((avg_price - sell) / avg_price) * 100 : 0;

      const points = historyByUrl.get(item.url_name) || [];
      const prices = points.map((p) => MarketAnalyticsService.priceOf(p));
      const validPrices = prices.filter((p) => p > 0);

      const atl = validPrices.length ? Math.min(...validPrices) : null;
      const ath = validPrices.length ? Math.max(...validPrices) : null;
      const pctFromAtl = atl && atl > 0 && curPrice > 0 ? ((curPrice - atl) / atl) * 100 : null;
      const pctFromAth = ath && ath > 0 && curPrice > 0 ? ((curPrice - ath) / ath) * 100 : null;

      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (validPrices.length >= 2) {
        const first = validPrices[0];
        const last = validPrices[validPrices.length - 1];
        const pct = first > 0 ? ((last - first) / first) * 100 : 0;
        trend = Math.abs(pct) < FLAT_TREND_THRESHOLD_PERCENT ? 'flat' : pct > 0 ? 'up' : 'down';
      }

      out.push({
        url_name: item.url_name,
        item_name: item.item_name,
        thumb: item.thumb || '',
        tags: item.tags || [],
        vaulted: !!item.vaulted,
        ducats: Number(item.ducats) || 0,
        buy,
        sell,
        volume,
        avg_price,
        spread,
        spreadPct,
        discountPct,
        dataDays: points.length,
        change24h: MarketAnalyticsService.changeOverDays(points, 1),
        change7d: MarketAnalyticsService.changeOverDays(points, 7),
        change30d: MarketAnalyticsService.changeOverDays(points, 30),
        volatility: MarketAnalyticsService.volatilityOf(prices),
        trend,
        atl,
        ath,
        pctFromAtl,
        pctFromAth,
        spark: prices.slice(-SPARK_POINTS).map((p) => Math.round(p)),
      });
    }

    return { items: out, maxHistoryDays };
  }
}
