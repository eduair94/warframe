import { OrderCalculator, IOrderData } from '../OrderCalculator';
import { NormalizedOrder, LiveBook, FeedSnapshot, FeedDelta } from './LiveTypes';

/**
 * In-memory order book + presence for the hot set. One instance holds every
 * subscribed item, each as a Map<orderId, NormalizedOrder>. Best online prices
 * are recomputed with the SAME OrderCalculator the sync uses (ingame preferred,
 * online fallback), so live numbers match the daily snapshot's methodology.
 */
export class LiveStore {
  private readonly books = new Map<string, Map<string, NormalizedOrder>>();
  // Per-item max rank (arcanes/mods/rivens). Set from the fair-value item metadata so
  // the book prices at the top rank instead of mixing rank-0 lowballs into "best".
  private readonly ranks = new Map<string, number | undefined>();

  constructor(private readonly platform: string) {}

  /** Set the rank the book should price at for a ranked item (undefined = no rank filter). */
  setRank(url_name: string, maxRank: number | undefined): void {
    this.ranks.set(url_name, maxRank);
  }

  applySnapshot(s: FeedSnapshot): LiveBook {
    const m = new Map<string, NormalizedOrder>();
    for (const o of s.orders) m.set(o.id, o);
    this.books.set(s.url_name, m);
    return this.compute(s.url_name);
  }

  applyDelta(d: FeedDelta): LiveBook {
    const m = this.books.get(d.url_name) ?? new Map<string, NormalizedOrder>();
    if (d.upserts) for (const o of d.upserts) m.set(o.id, o);
    if (d.removeIds) for (const id of d.removeIds) m.delete(id);
    if (d.presence) {
      for (const p of d.presence) {
        for (const o of m.values()) {
          if (o.user.id === p.userId) o.user.status = p.status;
        }
      }
    }
    this.books.set(d.url_name, m);
    return this.compute(d.url_name);
  }

  getBook(url_name: string): LiveBook | null {
    return this.books.has(url_name) ? this.compute(url_name) : null;
  }
  has(url_name: string): boolean { return this.books.has(url_name); }
  drop(url_name: string): void { this.books.delete(url_name); }
  size(): number { return this.books.size; }

  private compute(url_name: string): LiveBook {
    const m = this.books.get(url_name) ?? new Map<string, NormalizedOrder>();
    const usable = Array.from(m.values()).filter(
      (o) => o.visible && o.platform === this.platform
    );
    const orders: IOrderData[] = usable.map((o) => ({
      order_type: o.order_type,
      platinum: o.platinum,
      mod_rank: o.mod_rank,
      subtype: o.subtype,
      user: { status: o.user.status },
    }));
    const prices = OrderCalculator.calculatePrices(orders, {
      requiredStatus: 'ingame',
      fallbackStatuses: ['online'],
      topOrdersCount: 5,
      // Ranked items (arcanes/mods/rivens): price at the item's max rank; falls back to
      // any rank if no max-rank orders exist. undefined for non-ranked items = no filter.
      maxRank: this.ranks.get(url_name),
    });
    // Raw liquidity metric: total ingame+online orders on each side. Note this is
    // a UNION of both statuses, whereas bestBuy/bestSell come from OrderCalculator's
    // ingame-first-then-online-only-if-empty bucket — so a count can be >0 while the
    // matching best price is 0 (e.g. ingame sells exist but only online buys). That's
    // intentional: the count reflects book depth, the price reflects the tradeable tier.
    const onlineOf = (t: 'buy' | 'sell') =>
      usable.filter((o) => o.order_type === t && (o.user.status === 'ingame' || o.user.status === 'online')).length;
    return {
      url_name,
      bestBuy: prices.buy,
      bestSell: prices.sell,
      buyAvg: prices.buyAvg,
      sellAvg: prices.sellAvg,
      onlineBuyCount: onlineOf('buy'),
      onlineSellCount: onlineOf('sell'),
      updatedAt: Date.now(),
    };
  }
}
