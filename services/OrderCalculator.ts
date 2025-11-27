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
 */
export interface IOrderData {
  order_type: 'buy' | 'sell';
  platinum: number;
  mod_rank?: number;
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
      topOrdersCount = PRICE_CONFIG.TOP_ORDERS_COUNT
    } = options;

    // Filter orders by status and mod rank
    const filterOrder = (order: IOrderData): boolean => {
      if (order.user.status !== requiredStatus) return false;
      if (maxRank !== undefined && order.mod_rank !== maxRank) return false;
      return true;
    };

    const buyOrders = orders
      .filter(order => order.order_type === 'buy' && filterOrder(order));
    
    const sellOrders = orders
      .filter(order => order.order_type === 'sell' && filterOrder(order));

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
