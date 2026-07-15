import { OrderCalculator, IOrderData } from '../OrderCalculator';
import { NormalizedOrder, LiveBook, OrderRow, FeedSnapshot, FeedDelta } from './LiveTypes';

/** How many real orders per side to expose in the book (for the detail view). */
const ORDER_CAP = 8;

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
  // Per-item Ayatan star capacity. Set from the fair-value item metadata so a sculpture
  // book prices the FILLED sculpture instead of mixing empty (cheap) and filled orders.
  private readonly stars = new Map<string, { amber?: number; cyan?: number }>();

  constructor(private readonly platform: string) {}

  /** Set the rank the book should price at for a ranked item (undefined = no rank filter). */
  setRank(url_name: string, maxRank: number | undefined): void {
    this.ranks.set(url_name, maxRank);
  }

  /** Set the Ayatan star capacity the book should price at (filled sculpture). */
  setStars(url_name: string, maxAmberStars: number | undefined, maxCyanStars: number | undefined): void {
    if (maxAmberStars === undefined && maxCyanStars === undefined) {
      this.stars.delete(url_name);
    } else {
      this.stars.set(url_name, { amber: maxAmberStars, cyan: maxCyanStars });
    }
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
      amber_stars: o.amber_stars,
      cyan_stars: o.cyan_stars,
      user: { status: o.user.status },
    }));
    const maxRank = this.ranks.get(url_name);
    const star = this.stars.get(url_name);
    // Relics/variants: price both sides at the most-liquid subtype so the book compares
    // like-for-like (e.g. radiant vs radiant) instead of mixing intact and radiant.
    const subtype = OrderCalculator.dominantSubtype(orders);
    const prices = OrderCalculator.calculatePrices(orders, {
      requiredStatus: 'ingame',
      fallbackStatuses: ['online'],
      topOrdersCount: 5,
      // Ranked items (arcanes/mods/rivens): price at the item's max rank. Relics: at the
      // most-liquid subtype. Sculptures: at the filled star capacity. All fall back to any
      // variant if no matching order exists. undefined for plain items = no filter.
      maxRank,
      subtype,
      maxAmberStars: star?.amber,
      maxCyanStars: star?.cyan,
    });
    // Raw liquidity metric: total ingame+online orders on each side. Note this is
    // a UNION of both statuses, whereas bestBuy/bestSell come from OrderCalculator's
    // ingame-first-then-online-only-if-empty bucket — so a count can be >0 while the
    // matching best price is 0 (e.g. ingame sells exist but only online buys). That's
    // intentional: the count reflects book depth, the price reflects the tradeable tier.
    const onlineOf = (t: 'buy' | 'sell') =>
      usable.filter((o) => o.order_type === t && (o.user.status === 'ingame' || o.user.status === 'online')).length;

    // Real order lists for the detail view: online orders in the SAME tier the best
    // price uses (max rank if ranked, most-liquid subtype for relics, filled stars for
    // sculptures; ingame-preferred), sorted so the top row is the best offer — sells
    // cheapest-first (what you'd buy from), buys highest-first.
    const matchesVariant = (o: NormalizedOrder): boolean => {
      if (maxRank !== undefined && o.mod_rank !== maxRank) return false;
      if (subtype !== undefined && o.subtype !== subtype) return false;
      if (star && (star.amber !== undefined || star.cyan !== undefined)) {
        if ((o.amber_stars ?? 0) !== (star.amber ?? 0) || (o.cyan_stars ?? 0) !== (star.cyan ?? 0)) return false;
      }
      return true;
    };
    const toRow = (o: NormalizedOrder): OrderRow => ({
      platinum: o.platinum,
      quantity: o.quantity,
      rank: o.mod_rank,
      ingame_name: o.user.ingame_name || '',
      status: o.user.status,
    });
    const sideRows = (type: 'buy' | 'sell'): OrderRow[] => {
      const online = usable.filter(
        (o) => o.order_type === type && (o.user.status === 'ingame' || o.user.status === 'online')
      );
      let atVariant = online.filter(matchesVariant);
      if (atVariant.length === 0) atVariant = online; // fallback to any variant (matches OrderCalculator)
      const dir = type === 'sell' ? 1 : -1; // sells cheapest-first, buys highest-first
      const rankStatus = (o: NormalizedOrder) => (o.user.status === 'ingame' ? 0 : 1);
      return atVariant
        .slice()
        .sort((a, b) => dir * (a.platinum - b.platinum) || rankStatus(a) - rankStatus(b))
        .slice(0, ORDER_CAP)
        .map(toRow);
    };

    return {
      url_name,
      bestBuy: prices.buy,
      bestSell: prices.sell,
      buyAvg: prices.buyAvg,
      sellAvg: prices.sellAvg,
      onlineBuyCount: onlineOf('buy'),
      onlineSellCount: onlineOf('sell'),
      updatedAt: Date.now(),
      sellOrders: sideRows('sell'),
      buyOrders: sideRows('buy'),
    };
  }
}
