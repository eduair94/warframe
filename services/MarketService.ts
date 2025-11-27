/**
 * @fileoverview Service for interacting with Warframe Market API
 * @module services/MarketService
 * 
 * Single Responsibility: Handle all Warframe Market item data operations
 * 
 * Dependency Inversion: Depends on IHttpClient abstraction, not concrete implementation.
 * This allows the service to work with both axios (HttpService) and undici (UndiciHttpService).
 * 
 * This service provides methods for:
 * - Fetching item listings
 * - Getting item prices and statistics
 * - Processing items for display
 */

import { IHttpClient } from '../interfaces/http.interface';
import { API_URLS, PRICE_CONFIG } from '../constants';
import { sleep } from '../Express/config';
import { OrderCalculator } from './OrderCalculator';
import { StatisticsCalculator } from './StatisticsCalculator';

// Debug mode - set DEBUG=true environment variable for verbose logging
const DEBUG = process.env.DEBUG === 'true';

/**
 * Configuration for price calculation
 */
export type PriceCalculationConfig = {
  /** Number of top orders to include in average calculation */
  topOrdersCount: number;
  /** Required user status for order consideration */
  requiredStatus: 'ingame' | 'online' | 'offline';
};

/**
 * Default price calculation configuration
 */
const DEFAULT_PRICE_CONFIG: PriceCalculationConfig = {
  topOrdersCount: PRICE_CONFIG.TOP_ORDERS_COUNT,
  requiredStatus: PRICE_CONFIG.REQUIRED_STATUS as 'ingame'
};

/**
 * Service for fetching and processing Warframe Market data
 * 
 * Works with any IHttpClient implementation (axios, undici, etc.)
 * 
 * @example
 * ```typescript
 * // With axios-based HttpService
 * const marketService = new MarketService(httpService);
 * 
 * // With undici-based UndiciHttpService
 * const marketService = new MarketService(undiciService);
 * 
 * // Same API regardless of HTTP client
 * const items = await marketService.getAllItems();
 * const price = await marketService.getItemPrices(item);
 * ```
 */
export class MarketService {
  /** Price calculation configuration */
  private readonly priceConfig: PriceCalculationConfig;

  /**
   * Creates a new MarketService instance
   * 
   * @param httpClient - HTTP client implementing IHttpClient
   * @param priceConfig - Optional price calculation configuration
   */
  constructor(
    private readonly httpClient: IHttpClient,
    priceConfig: Partial<PriceCalculationConfig> = {}
  ) {
    this.priceConfig = { ...DEFAULT_PRICE_CONFIG, ...priceConfig };
  }

  // =====================================
  // API METHODS - Item Fetching
  // =====================================

  /**
   * Fetches all available items from Warframe Market
   */
  async getAllItems<T = any>(): Promise<T> {
    if (DEBUG) console.log("🔄 Fetching all Warframe items...");
    return this.httpClient.get<T>(`${API_URLS.WARFRAME_MARKET}/items`);
  }

  /**
   * Fetches detailed information for a single item
   * 
   * @param urlName - URL-friendly item name
   */
  async getItemDetails<T = any>(urlName: string): Promise<T> {
    const url = `${API_URLS.WARFRAME_MARKET}/items/${urlName}`;
    if (DEBUG) console.log(`🔄 Fetching item: ${urlName}...`);
    return this.httpClient.get<T>(url);
  }

  /**
   * Fetches current orders for an item
   * 
   * @param urlName - URL-friendly item name
   */
  async getItemOrders<T = any>(urlName: string): Promise<T> {
    if (DEBUG) console.log(`🔄 Fetching orders for: ${urlName}...`);
    return this.httpClient.get<T>(
      `${API_URLS.WARFRAME_MARKET}/items/${urlName}/orders`
    );
  }

  /**
   * Fetches statistics for an item
   * 
   * @param urlName - URL-friendly item name
   */
  async getItemStatistics<T = any>(urlName: string): Promise<T> {
    return this.httpClient.get<T>(
      `${API_URLS.WARFRAME_MARKET}/items/${urlName}/statistics`
    );
  }

  // =====================================
  // API METHODS - Riven Fetching
  // =====================================

  /**
   * Fetches all Riven weapons from API
   */
  async getRivens<T = any>(): Promise<T> {
    if (DEBUG) console.log("🔄 Fetching Riven mods...");
    return this.httpClient.get<T>(`${API_URLS.WARFRAME_MARKET}/riven/items`);
  }

  /**
   * Fetches Riven orders for a weapon
   * 
   * @param weaponName - Weapon URL name
   */
  async getRivenOrders<T = any>(weaponName: string): Promise<T> {
    if (DEBUG) console.log(`🔄 Fetching Riven orders for: ${weaponName}...`);
    return this.httpClient.get<T>(
      `${API_URLS.WARFRAME_MARKET}/riven/items/${weaponName}/orders`
    );
  }

  /**
   * Fetches Riven auctions
   */
  async getAuctions<T = any>(): Promise<T> {
    if (DEBUG) console.log("🔄 Fetching Riven auctions...");
    return this.httpClient.get<T>(
      `${API_URLS.WARFRAME_MARKET}/auctions/search?type=riven&buyout_policy=direct`
    );
  }

  // =====================================
  // PRICE CALCULATION METHODS
  // =====================================

  /**
   * Calculates complete price data for an item
   * Combines order data and statistics for comprehensive pricing
   * 
   * @param item - Market item with url_name and items_in_set
   * @param retryAttempt - Current retry attempt (internal use)
   */
  async getItemPrices(
    item: { url_name: string; items_in_set?: Array<{ mod_max_rank?: number }> },
    retryAttempt: number = 0
  ): Promise<{
    buy: number;
    sell: number;
    buyAvg: number;
    sellAvg: number;
    volume: number;
    avg_price: number;
    last_completed: any;
    not_found?: boolean;
  }> {
    try {
      // Add random delay for anti-detection
      await this.httpClient.addRandomDelay(500, 2000);

      // Fetch orders
      const ordersResponse = await this.getItemOrders<{ payload: { orders: any[] } }>(item.url_name);

      // Get mod max rank if applicable
      const maxRank = item.items_in_set?.[0]?.mod_max_rank;

      // Calculate prices using OrderCalculator
      const prices = OrderCalculator.calculatePrices(
        ordersResponse.payload.orders,
        { maxRank }
      );

      // Fetch and calculate statistics
      const stats = await this.calculateStatistics(item.url_name, maxRank);

      return {
        ...prices,
        ...stats
      };
    } catch (error: any) {
      return this.handlePriceError(error, item, retryAttempt);
    }
  }

  /**
   * Gets item statistics (volume, average price)
   * Uses StatisticsCalculator for calculations.
   * 
   * @param urlName - Item URL name
   * @param maxRank - Maximum mod rank filter
   */
  async calculateStatistics(
    urlName: string,
    maxRank: number | undefined
  ): Promise<{ volume: number; avg_price: number; last_completed: any }> {
    await this.httpClient.addRandomDelay(300, 1000);

    const statsResponse = await this.getItemStatistics<{
      payload: { statistics_closed: { '48hours': any[] } }
    }>(urlName);

    const stats = statsResponse.payload.statistics_closed['48hours'];

    return StatisticsCalculator.calculate(stats, { modRank: maxRank });
  }

  /**
   * Extracts buy/sell prices from orders data
   * Uses OrderCalculator for calculations.
   */
  calculateBuySellPrices(
    orders: any[],
    maxRank: number | undefined
  ): { buy: number; sell: number; buyAvg: number; sellAvg: number } {
    return OrderCalculator.calculatePrices(orders, { maxRank });
  }

  // =====================================
  // ERROR HANDLING
  // =====================================

  /**
   * Handles errors during price fetching with retry logic
   */
  private async handlePriceError(
    error: any,
    item: { url_name: string; items_in_set?: Array<{ mod_max_rank?: number }> },
    retryAttempt: number
  ): Promise<{
    buy: number;
    sell: number;
    buyAvg: number;
    sellAvg: number;
    volume: number;
    avg_price: number;
    last_completed: any;
    not_found?: boolean;
  }> {
    const status = error?.response?.status || (error?.message?.includes('429') ? 429 : 0);

    // Handle rate limiting with retry
    if (status === 429 || error?.message?.includes('429')) {
      const delay = 2000 + Math.random() * 3000;
      if (DEBUG) console.log(`⏳ Rate limited on ${item.url_name}, waiting ${Math.round(delay)}ms...`);
      await sleep(delay);
      return this.getItemPrices(item, retryAttempt + 1);
    }

    // Handle not found
    if (status === 404 || error?.message?.includes('404')) {
      if (DEBUG) console.log(`⚠ Item not found: ${item.url_name}`);
      return this.createEmptyPriceResult(true);
    }

    // Log other errors (keep this one as it's important)
    console.error(`✗ Error fetching prices for ${item.url_name}:`, error.message);
    return this.createEmptyPriceResult(false);
  }

  /**
   * Creates an empty price result for error cases
   */
  private createEmptyPriceResult(notFound: boolean): {
    buy: number;
    sell: number;
    buyAvg: number;
    sellAvg: number;
    volume: number;
    avg_price: number;
    last_completed: any;
    not_found?: boolean;
  } {
    return {
      buy: 0,
      sell: 0,
      buyAvg: 0,
      sellAvg: 0,
      volume: 0,
      avg_price: 0,
      last_completed: null,
      not_found: notFound
    };
  }

  // =====================================
  // ITEM PROCESSING
  // =====================================

  /**
   * Processes an item for frontend display
   * 
   * @param item - Raw market item
   * @returns Processed item for display, or empty string if invalid
   */
  processItemForDisplay(item: any): any {
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate } = item;

    // Validate required data
    if (!market) {
      return '';
    }

    if (!items_in_set || items_in_set.length === 0) {
      return '';
    }

    const { tags } = items_in_set[0];

    return {
      item_name,
      thumb,
      url_name,
      market: {
        ...market,
        diff: market.sell - market.buy
      },
      tags,
      set: items_in_set.length > 1,
      priceUpdate
    };
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Tests API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getAllItems<{ payload: { items: any[] } }>();
      return !!(result && result.payload && result.payload.items);
    } catch (error: any) {
      console.error("Connection test failed:", error.message);
      return false;
    }
  }
}
