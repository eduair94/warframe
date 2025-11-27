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
  };
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
  /** Required user status (default: 'ingame') */
  requiredStatus?: string;
  /** Number of top orders to average (default: 5) */
  topOrdersCount?: number;
  /** Fallback statuses to try if primary status has no orders (default: ['online']) */
  fallbackStatuses?: string[];
  /** Ayatan: Required amber stars for filled sculpture (undefined = no filter) */
  maxAmberStars?: number;
  /** Ayatan: Required cyan stars for filled sculpture (undefined = no filter) */
  maxCyanStars?: number;
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
      requiredStatus = PRICE_CONFIG.REQUIRED_STATUS,
      topOrdersCount = PRICE_CONFIG.TOP_ORDERS_COUNT,
      fallbackStatuses = ['online'],
      maxAmberStars,
      maxCyanStars
    } = options;

    // Build status priority list: primary status first, then fallbacks
    const statusPriority = [requiredStatus, ...fallbackStatuses];

    /**
     * Filter orders by item-specific criteria:
     * - Mods: filter by mod_rank matching maxRank
     * - Ayatan sculptures: filter by filled status (amber_stars + cyan_stars matching max values)
     * - Other items: no additional filtering
     */
    const filterByItemCriteria = (order: IOrderData): boolean => {
      // Mod rank filtering (for mods/rivens)
      if (maxRank !== undefined && order.mod_rank !== maxRank) return false;
      
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

    for (const status of statusPriority) {
      const filterByStatus = (order: IOrderData): boolean => {
        return order.user.status === status && filterByItemCriteria(order);
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

    return {
      ...this.calculateBuyPrices(buyOrders, topOrdersCount),
      ...this.calculateSellPrices(sellOrders, topOrdersCount)
    };
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
