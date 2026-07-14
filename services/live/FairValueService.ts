import { IPricePoint } from '../PriceHistoryService';
import { FairValueInputs } from './LiveTypes';

export function median(nums: number[]): number {
  const v = nums.filter((n) => n > 0).sort((a, b) => a - b);
  if (v.length === 0) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function coeffVariation(nums: number[]): number | null {
  const v = nums.filter((n) => n > 0);
  if (v.length < 3) return null;
  const mean = v.reduce((s, n) => s + n, 0) / v.length;
  if (mean <= 0) return null;
  const variance = v.reduce((s, n) => s + (n - mean) ** 2, 0) / v.length;
  return (Math.sqrt(variance) / mean) * 100;
}

/** Same rule as MarketAnalyticsService.priceOf: avg_price is truest, else sell. */
function priceOf(p: { avg_price?: number; sell?: number }): number {
  const avg = Number(p.avg_price) || 0;
  return avg > 0 ? avg : Number(p.sell) || 0;
}

export interface FairValueDeps {
  getItems(urls: string[]): Promise<any[]>;
  getHistory(url: string): Promise<IPricePoint[]>;
}

/**
 * Loads the fair-value baseline (realized avg_price + history median + volatility)
 * for a set of items straight from Mongo — no wf.market HTTP. Cached in memory and
 * refreshed on a timer by LiveGateway.
 */
export class FairValueService {
  private cache = new Map<string, FairValueInputs>();
  constructor(private readonly deps: FairValueDeps) {}

  async load(urls: string[]): Promise<Map<string, FairValueInputs>> {
    if (urls.length === 0) return this.cache;
    const items = await this.deps.getItems(urls);
    const byUrl = new Map<string, any>();
    for (const it of items) if (it && it.url_name) byUrl.set(it.url_name, it);

    for (const url of urls) {
      const it = byUrl.get(url);
      const market = (it && it.market) || {};
      // Max rank for arcanes/mods/rivens (same source the daily sync prices at) so the
      // live book compares like-for-like instead of mixing rank-0 and rank-max orders.
      const rawRank = it && (it.mod_max_rank ?? it.items_in_set?.[0]?.mod_max_rank);
      const maxRank = Number.isFinite(Number(rawRank)) ? Number(rawRank) : undefined;
      let points: IPricePoint[] = [];
      try { points = (await this.deps.getHistory(url)) || []; } catch { points = []; }
      const prices = points.map((p) => priceOf(p));
      this.cache.set(url, {
        url_name: url,
        avg_price: Number(market.avg_price) || 0,
        medianHistory: median(prices),
        volatility: coeffVariation(prices),
        dataDays: points.length,
        volume: Number(market.volume) || 0,
        maxRank,
      });
    }
    return this.cache;
  }

  get(url: string): FairValueInputs | null {
    return this.cache.get(url) ?? null;
  }
}
