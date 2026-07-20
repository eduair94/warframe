/**
 * @fileoverview Utility for calculating buy/sell prices from order data
 * @module services/OrderCalculator
 * 
 * Single Responsibility: Calculate price metrics from order arrays.
 * This is a pure utility class with no side effects or dependencies.
 * 
 * Following the Strategy pattern - can be used by any service that needs
 * to process order data consistently.
 */

import { PRICE_CONFIG } from '../constants';

/**
 * Represents a single order from the Warframe Market API
 * 
 * ## Field Usage by Item Type
 * 
 * | Field       | Mods     | Riven Mods | Ayatan Sculptures | Relics    | Other Items |
 * |-------------|----------|------------|-------------------|-----------|-------------|
 * | mod_rank    | 0-10     | 0-8        | undefined         | undefined | undefined   |
 * | amber_stars | -        | -          | 0-2               | -         | -           |
 * | cyan_stars  | -        | -          | 0-4               | -         | -           |
 * | subtype     | -        | -          | -                 | intact/radiant | -      |
 */
export interface IOrderData {
  order_type: 'buy' | 'sell';
  platinum: number;
  /** Units this order is for — bulk buyers/sellers post large quantities. */
  quantity?: number;
  /** Mod rank (0 to mod_max_rank for mods, undefined for non-mods) */
  mod_rank?: number;
  /** Ayatan sculptures: number of amber stars socketed (0-2) */
  amber_stars?: number;
  /** Ayatan sculptures: number of cyan stars socketed (0-4) */
  cyan_stars?: number;
  /** Item subtype/variant (e.g., 'intact', 'exceptional', 'flawless', 'radiant' for relics) */
  subtype?: string;
  user: {
    status: string;
    /** In-game name — used to build the "/w …" trade whisper in the order-book dialog. */
    ingame_name?: string;
  };
}

/**
 * A single named order kept for the order-book dialog's "best sellers / best
 * buyers" list — enough to render a row and build a warframe.market whisper.
 */
export interface ITopOrder {
  /** Unit price in platinum. */
  platinum: number;
  /** Units this order is for. */
  quantity: number;
  /** Seller/buyer in-game name (empty when the API omitted it). */
  ingame_name: string;
  /** Online status at sync time: 'ingame' | 'online' (offline users are excluded). */
  status: string;
}

/**
 * Result of price calculation
 */
export interface IPriceCalculationResult {
  /** Best buy price (highest buyer is willing to pay) */
  buy: number;
  /** Best sell price (lowest seller is asking) */
  sell: number;
  /** Average of top N buy orders */
  buyAvg: number;
  /** Average of top N sell orders */
  sellAvg: number;
}

/**
 * Options for price calculation
 */
export interface IPriceCalculationOptions {
  /** Maximum mod rank to filter by (undefined = no filter) */
  maxRank?: number;
  /** Variant/subtype to filter by, e.g. 'radiant' for relics (undefined = no filter).
   *  Both buy and sell are filtered to this subtype so the comparison is like-for-like.
   *  Use OrderCalculator.dominantSubtype(orders) to pick the most-liquid tier. */
  subtype?: string;
  /** Required user status (default: 'ingame') */
  requiredStatus?: string;
  /** Number of top orders to average (default: 5) */
  topOrdersCount?: number;
  /**
   * When true, fence bulk/bait orders out of the headline best buy/sell (bulk
   * BUYERS bidding far above the going rate never actually fill and used to set
   * `buy`; troll-low ASKS used to set `sell`). Off by default so shared callers
   * (the live verdict engine, ad-hoc price checks) keep their exact behavior —
   * only the catalogue/home price sync opts in. See PRICE_CONFIG.BAIT_CEIL /
   * TROLL_FLOOR.
   */
  fenceOutliers?: boolean;
  /**
   * The item's going rate (48h volume-weighted average) anchoring the fence.
   * When omitted (or 0) it is derived from the resolved orders themselves
   * (median ask, then median bid). Only consulted when `fenceOutliers` is true.
   */
  goingRate?: number;
  /** Fallback statuses to try if primary status has no orders (default: ['online']) */
  fallbackStatuses?: string[];
  /** Ayatan: Required amber stars for filled sculpture (undefined = no filter) */
  maxAmberStars?: number;
  /** Ayatan: Required cyan stars for filled sculpture (undefined = no filter) */
  maxCyanStars?: number;
  /** If true, fallback to any variant (rank/subtype/stars) when no orders match (default: true) */
  fallbackToAnyRank?: boolean;
}

/**
 * Utility class for calculating buy/sell prices from orders
 * 
 * @example
 * ```typescript
 * const prices = OrderCalculator.calculatePrices(orders, { maxRank: 10 });
 * console.log(`Buy: ${prices.buy}p, Sell: ${prices.sell}p`);
 * ```
 */
export class OrderCalculator {
  /**
   * Calculates buy and sell prices from an array of orders
   * 
   * @param orders - Array of order data
   * @param options - Calculation options
   * @returns Calculated prices
   */
  static calculatePrices(
    orders: IOrderData[],
    options: IPriceCalculationOptions = {}
  ): IPriceCalculationResult {
    const {
      maxRank,
      subtype,
      requiredStatus = PRICE_CONFIG.REQUIRED_STATUS,
      topOrdersCount = PRICE_CONFIG.TOP_ORDERS_COUNT,
      fallbackStatuses = ['online'],
      maxAmberStars,
      maxCyanStars,
      fallbackToAnyRank = true,
      fenceOutliers = false,
      goingRate
    } = options;

    // Whether any item-variant filter is active. When one is, an empty result on
    // both sides triggers the "show any variant" fallback below (previously gated
    // on maxRank only, so subtype/star items never fell back and could show 0/0).
    const hasVariantFilter =
      maxRank !== undefined ||
      subtype !== undefined ||
      maxAmberStars !== undefined ||
      maxCyanStars !== undefined;

    // Build status priority list: primary status first, then fallbacks
    const statusPriority = [requiredStatus, ...fallbackStatuses];

    /**
     * Filter orders by item-specific criteria:
     * - Mods: filter by mod_rank matching maxRank
     * - Relics/variants: filter by subtype matching the requested tier (e.g. 'radiant')
     * - Ayatan sculptures: filter by filled status (amber_stars + cyan_stars matching max values)
     * - Other items: no additional filtering
     *
     * @param order - The order to check
     * @param skipVariantFilter - If true, skip ALL variant filters (rank/subtype/stars) for fallback
     */
    const filterByItemCriteria = (order: IOrderData, skipVariantFilter = false): boolean => {
      if (skipVariantFilter) return true;

      // Mod rank filtering (for mods/rivens/arcanes)
      if (maxRank !== undefined && order.mod_rank !== maxRank) return false;

      // Variant/subtype filtering (relics: intact/exceptional/flawless/radiant, etc.)
      if (subtype !== undefined && order.subtype !== subtype) return false;

      // Ayatan sculpture filtering (only filled sculptures)
      // If maxAmberStars or maxCyanStars is specified, filter for filled sculptures
      if (maxAmberStars !== undefined || maxCyanStars !== undefined) {
        const requiredAmber = maxAmberStars ?? 0;
        const requiredCyan = maxCyanStars ?? 0;
        const orderAmber = order.amber_stars ?? 0;
        const orderCyan = order.cyan_stars ?? 0;

        // Only accept orders with all stars socketed (filled sculpture)
        if (orderAmber !== requiredAmber || orderCyan !== requiredCyan) {
          return false;
        }
      }

      return true;
    };

    // Try each status in priority order until we find orders
    let buyOrders: IOrderData[] = [];
    let sellOrders: IOrderData[] = [];
    let usedFallbackRank = false;

    // First pass: try with rank filter
    for (const status of statusPriority) {
      const filterByStatus = (order: IOrderData): boolean => {
        return order.user.status === status && filterByItemCriteria(order, false);
      };

      const potentialBuyOrders = orders.filter(
        order => order.order_type === 'buy' && filterByStatus(order)
      );
      const potentialSellOrders = orders.filter(
        order => order.order_type === 'sell' && filterByStatus(order)
      );

      // If we found any orders with this status, use them
      if (potentialBuyOrders.length > 0 || potentialSellOrders.length > 0) {
        buyOrders = potentialBuyOrders;
        sellOrders = potentialSellOrders;
        break;
      }
    }

    // Second pass: if no orders found and fallback is enabled, try without any variant filter
    if (buyOrders.length === 0 && sellOrders.length === 0 && fallbackToAnyRank && hasVariantFilter) {
      for (const status of statusPriority) {
        const filterByStatus = (order: IOrderData): boolean => {
          return order.user.status === status && filterByItemCriteria(order, true);
        };

        const potentialBuyOrders = orders.filter(
          order => order.order_type === 'buy' && filterByStatus(order)
        );
        const potentialSellOrders = orders.filter(
          order => order.order_type === 'sell' && filterByStatus(order)
        );

        // If we found any orders with this status, use them
        if (potentialBuyOrders.length > 0 || potentialSellOrders.length > 0) {
          buyOrders = potentialBuyOrders;
          sellOrders = potentialSellOrders;
          usedFallbackRank = true;
          break;
        }
      }
    }

    // Optionally fence out bulk/bait orders before picking the headline best
    // buy/sell. Bulk BUYERS bid far above the going rate for thousands of units
    // that never clear (an Ayatan sculpture drawing 42p bids while it trades
    // ~10p) and would otherwise set `buy`; troll-low ASKS would set `sell`.
    // Anchored to the going rate (48h avg if provided, else the median of the
    // resolved orders). Opt-in so shared callers keep their exact behavior.
    let finalBuy = buyOrders;
    let finalSell = sellOrders;
    if (fenceOutliers) {
      const reference = this.referenceRate(goingRate, sellOrders, buyOrders);
      finalBuy = this.filterCredibleBuys(buyOrders, reference);
      finalSell = this.filterCredibleSells(sellOrders, reference);
    }

    return {
      ...this.calculateBuyPrices(finalBuy, topOrdersCount),
      ...this.calculateSellPrices(finalSell, topOrdersCount)
    };
  }

  /**
   * Reference "going rate" for the credibility band. Prefers the passed 48h
   * average; otherwise the median ask (asks cluster near real value — baiters
   * inflate BIDS), then the median bid, then 0 (which disables filtering).
   */
  private static referenceRate(
    goingRate: number | undefined,
    sellOrders: IOrderData[],
    buyOrders: IOrderData[]
  ): number {
    if (goingRate && goingRate > 0) return goingRate;
    return this.median(sellOrders) || this.median(buyOrders) || 0;
  }

  /** Median platinum of an order array (0 when empty). */
  private static median(orders: IOrderData[]): number {
    const prices = orders
      .map((o) => Number(o.platinum) || 0)
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    if (prices.length === 0) return 0;
    const mid = Math.floor(prices.length / 2);
    return prices.length % 2 ? prices[mid]! : (prices[mid - 1]! + prices[mid]!) / 2;
  }

  /**
   * Drop bulk/bait BIDS priced above `reference × BAIT_CEIL`. Never returns an
   * empty side when the input was non-empty (a fully-baited book still needs a
   * best-bid), and is a no-op when there is no credible reference.
   */
  private static filterCredibleBuys(buyOrders: IOrderData[], reference: number): IOrderData[] {
    if (reference <= 0 || buyOrders.length === 0) return buyOrders;
    const ceil = reference * PRICE_CONFIG.BAIT_CEIL;
    const kept = buyOrders.filter((o) => (Number(o.platinum) || 0) <= ceil);
    return kept.length > 0 ? kept : buyOrders;
  }

  /** Drop troll-low ASKS priced below `reference × TROLL_FLOOR`. */
  private static filterCredibleSells(sellOrders: IOrderData[], reference: number): IOrderData[] {
    if (reference <= 0 || sellOrders.length === 0) return sellOrders;
    const floor = reference * PRICE_CONFIG.TROLL_FLOOR;
    const kept = sellOrders.filter((o) => (Number(o.platinum) || 0) >= floor);
    return kept.length > 0 ? kept : sellOrders;
  }

  /**
   * Picks the most-liquid variant/subtype among a set of orders — the subtype
   * value carried by the most orders. Used so buy and sell are compared on the
   * SAME tier (e.g. relic 'radiant' vs 'intact') instead of mixing variants.
   *
   * @param orders - Order array (any statuses; liquidity ~ listing count)
   * @returns The dominant subtype, or undefined if no order carries one.
   */
  static dominantSubtype(orders: IOrderData[]): string | undefined {
    const counts = new Map<string, number>();
    for (const order of orders) {
      const st = order.subtype;
      if (st === undefined || st === null || st === '') continue;
      counts.set(st, (counts.get(st) ?? 0) + 1);
    }
    if (counts.size === 0) return undefined;
    let best: string | undefined;
    let bestCount = -1;
    // Highest count wins; ties broken lexicographically for deterministic output.
    for (const [st, count] of counts) {
      if (count > bestCount || (count === bestCount && (best === undefined || st < best))) {
        best = st;
        bestCount = count;
      }
    }
    return best;
  }

  /**
   * Calculates buy prices (highest buyers)
   *
   * @param buyOrders - Filtered buy orders
   * @param topCount - Number of top orders to average
   * @returns Buy price and average
   * @private
   */
  private static calculateBuyPrices(
    buyOrders: IOrderData[],
    topCount: number
  ): Pick<IPriceCalculationResult, 'buy' | 'buyAvg'> {
    if (buyOrders.length === 0) {
      return { buy: 0, buyAvg: 0 };
    }

    // Sort descending (highest first) for buy orders
    const sorted = [...buyOrders].sort((a, b) => b.platinum - a.platinum);
    const buy = sorted[0].platinum;
    
    const count = Math.min(sorted.length, topCount);
    const buyAvg = sorted
      .slice(0, count)
      .reduce((sum, order) => sum + order.platinum, 0) / count;

    return { buy, buyAvg };
  }

  /**
   * Calculates sell prices (lowest sellers)
   * 
   * @param sellOrders - Filtered sell orders
   * @param topCount - Number of top orders to average
   * @returns Sell price and average
   * @private
   */
  private static calculateSellPrices(
    sellOrders: IOrderData[],
    topCount: number
  ): Pick<IPriceCalculationResult, 'sell' | 'sellAvg'> {
    if (sellOrders.length === 0) {
      return { sell: 0, sellAvg: 0 };
    }

    // Sort ascending (lowest first) for sell orders
    const sorted = [...sellOrders].sort((a, b) => a.platinum - b.platinum);
    const sell = sorted[0].platinum;
    
    const count = Math.min(sorted.length, topCount);
    const sellAvg = sorted
      .slice(0, count)
      .reduce((sum, order) => sum + order.platinum, 0) / count;

    return { sell, sellAvg };
  }

  /**
   * Aggregates orders into a compact depth ladder — price levels with total
   * quantity — for the "bulk buy/sell" modeler. Captured during the price sync
   * (from the orders it already fetches) and stored on the item, so the request
   * path serves it from the database instead of hitting warframe.market live
   * (the datacenter IP hangs on on-demand order fetches).
   *
   * Orders are filtered to the dominant subtype (e.g. an intact relic) and summed
   * by price, so a real bulk shop and a bait order look identical here — the
   * client (useOrderBook) decides credibility from the going rate. Levels are
   * sorted best-first (buy desc, sell asc) and bounded.
   *
   * @param orders - Raw orders (v1-shaped, carrying quantity + subtype)
   * @param subtype - Variant to keep (undefined = no subtype filter)
   * @param maxLevels - Cap on price levels per side (default 15 — deeper than any
   *   realistic bulk trade)
   */
  static depthLadder(
    orders: IOrderData[],
    subtype?: string,
    maxLevels = 15
  ): { buy: Array<{ price: number; quantity: number; orders: number }>; sell: Array<{ price: number; quantity: number; orders: number }> } {
    const inScope = (o: IOrderData) => subtype === undefined || o.subtype === subtype;
    const side = (type: 'buy' | 'sell') => {
      const byPrice = new Map<number, { price: number; quantity: number; orders: number }>();
      for (const o of orders || []) {
        if (o.order_type !== type || !inScope(o)) continue;
        const price = Number(o.platinum) || 0;
        if (price <= 0) continue;
        const qty = Math.max(1, Math.floor(Number(o.quantity) || 1));
        const cur = byPrice.get(price) || { price, quantity: 0, orders: 0 };
        cur.quantity += qty;
        cur.orders += 1;
        byPrice.set(price, cur);
      }
      const arr = [...byPrice.values()];
      arr.sort((a, b) => (type === 'buy' ? b.price - a.price : a.price - b.price));
      return arr.slice(0, maxLevels);
    };
    return { buy: side('buy'), sell: side('sell') };
  }

  /**
   * The best few NAMED orders per side, for the order-book dialog's "best
   * sellers / best buyers" list + its trade-whisper buttons.
   *
   * Unlike {@link depthLadder} (aggregated by price, no identities) this keeps
   * individual orders WITH the in-game name, so the client can build a
   * warframe.market "/w …" whisper. Captured during the price sync from the same
   * orders and stored on `item.market.topOrders`, so the request path serves it
   * from the database (no live warframe.market call — those hang on the
   * datacenter IP).
   *
   * Rules:
   *  - Only CONTACTABLE users (ingame/online) — you cannot whisper an offline
   *    trader, so listing them would be dead rows.
   *  - Same dominant `subtype` as the prices/ladder, so it describes one tier.
   *  - Same credibility band as the headline price (BAIT_CEIL / TROLL_FLOOR),
   *    so a bulk-bait bid never shows up as a "best buyer".
   *  - Buy side sorted highest-first, sell side lowest-first, capped at `count`.
   *
   * @param orders - Raw orders (v1-shaped, carrying quantity + subtype + user)
   * @param options.subtype - Variant to keep (undefined = no subtype filter)
   * @param options.goingRate - 48h average, for the credibility band
   * @param options.count - Max rows per side (default TOP_ORDERS_COUNT = 5)
   * @param options.statuses - Contactable statuses (default ['ingame','online'])
   */
  static topOrders(
    orders: IOrderData[],
    options: { subtype?: string; goingRate?: number; count?: number; statuses?: string[] } = {}
  ): { buy: ITopOrder[]; sell: ITopOrder[] } {
    const {
      subtype,
      goingRate,
      count = PRICE_CONFIG.TOP_ORDERS_COUNT,
      statuses = ['ingame', 'online']
    } = options;

    const statusSet = new Set(statuses);
    const inScope = (o: IOrderData) =>
      statusSet.has(o.user?.status) &&
      (subtype === undefined || o.subtype === subtype) &&
      (Number(o.platinum) || 0) > 0;

    const rawBuy = (orders || []).filter((o) => o.order_type === 'buy' && inScope(o));
    const rawSell = (orders || []).filter((o) => o.order_type === 'sell' && inScope(o));

    const reference = this.referenceRate(goingRate, rawSell, rawBuy);
    const credibleBuy = this.filterCredibleBuys(rawBuy, reference);
    const credibleSell = this.filterCredibleSells(rawSell, reference);

    const toRow = (o: IOrderData): ITopOrder => ({
      platinum: Number(o.platinum) || 0,
      quantity: Math.max(1, Math.floor(Number(o.quantity) || 1)),
      ingame_name: o.user?.ingame_name || '',
      status: o.user?.status || ''
    });

    const buy = [...credibleBuy]
      .sort((a, b) => b.platinum - a.platinum)
      .slice(0, count)
      .map(toRow);
    const sell = [...credibleSell]
      .sort((a, b) => a.platinum - b.platinum)
      .slice(0, count)
      .map(toRow);

    return { buy, sell };
  }

  /**
   * Calculates the profit margin between buy and sell prices
   *
   * @param prices - Calculated prices
   * @returns Profit margin (sell - buy)
   */
  static calculateMargin(prices: IPriceCalculationResult): number {
    return prices.sell - prices.buy;
  }

  /**
   * Calculates profit percentage
   * 
   * @param prices - Calculated prices
   * @returns Profit percentage or 0 if buy is 0
   */
  static calculateProfitPercentage(prices: IPriceCalculationResult): number {
    if (prices.buy === 0) return 0;
    return ((prices.sell - prices.buy) / prices.buy) * 100;
  }
}
