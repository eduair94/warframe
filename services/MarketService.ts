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

import { API_URLS, PRICE_CONFIG } from '../constants';
import { sleep } from '../Express/config';
import { IHttpClient } from '../interfaces/http.interface';
import { OrderCalculator } from './OrderCalculator';
import { StatisticsCalculator } from './StatisticsCalculator';
import { WarframeItemsResponse } from "./WarframeItems.interface";

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
  /** Minimum delay before fetching orders (default: 500) */
  ordersMinDelay?: number;
  /** Maximum delay before fetching orders (default: 2000) */
  ordersMaxDelay?: number;
  /** Minimum delay before fetching stats (default: 300) */
  statsMinDelay?: number;
  /** Maximum delay before fetching stats (default: 1000) */
  statsMaxDelay?: number;
};

/**
 * Default price calculation configuration
 */
const DEFAULT_PRICE_CONFIG: Required<PriceCalculationConfig> = {
  topOrdersCount: PRICE_CONFIG.TOP_ORDERS_COUNT,
  requiredStatus: PRICE_CONFIG.REQUIRED_STATUS as 'ingame',
  ordersMinDelay: 500,
  ordersMaxDelay: 2000,
  statsMinDelay: 300,
  statsMaxDelay: 1000
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
    this.priceConfig = { ...DEFAULT_PRICE_CONFIG, ...priceConfig } as Required<PriceCalculationConfig>;
  }

  // =====================================
  // API METHODS - Item Fetching
  // =====================================

  /**
   * Fetches all available items from Warframe Market
   */
  async getAllItems<T = any>(): Promise<WarframeItemsResponse> {
    if (DEBUG) console.log("🔄 Fetching all Warframe items...");
    return this.httpClient.get<WarframeItemsResponse>(`${API_URLS.WARFRAME_MARKET_V2}/items`);
  }

  /**
   * Fetches detailed information for a single item
   * Uses v1 API for basic details, enriched with v2 data for special items (Ayatan sculptures)
   * 
   * @param urlName - URL-friendly item name
   */
  async getItemDetails<T = any>(urlName: string): Promise<T> {
    const url = `${API_URLS.WARFRAME_MARKET}/items/${urlName}`;
    if (DEBUG) console.log(`🔄 Fetching item: ${urlName}...`);
    
    const v1Response = await this.httpClient.get<any>(url);
    
    // Enrich with v2 data for special item types (Ayatan sculptures)
    try {
      const v2Data = await this.getItemDetailsV2(urlName);
      if (v2Data) {
        // Only add Ayatan-specific fields if they exist in v2 response
        // This preserves v1 data for non-Ayatan items
        const enrichment: Record<string, any> = {
          // Always mark as v2 enriched when we successfully fetch v2 data
          v2_enriched: true,
          v2_enriched_at: new Date()
        };
        
        // Ayatan sculpture fields (only add if present)
        if (v2Data.maxAmberStars !== undefined) {
          enrichment.max_amber_stars = v2Data.maxAmberStars;
        }
        if (v2Data.maxCyanStars !== undefined) {
          enrichment.max_cyan_stars = v2Data.maxCyanStars;
        }
        if (v2Data.baseEndo !== undefined) {
          enrichment.base_endo = v2Data.baseEndo;
        }
        if (v2Data.endoMultiplier !== undefined) {
          enrichment.endo_multiplier = v2Data.endoMultiplier;
        }
        
        // Always merge since we at least have v2_enriched flag
        v1Response.payload.item = {
          ...v1Response.payload.item,
          ...enrichment
        };
      }
    } catch (error) {
      // V2 enrichment is optional, continue with v1 data
      if (DEBUG) console.log(`⚠️ Could not enrich with v2 data for: ${urlName}`);
    }
    
    return v1Response as T;
  }

  /**
   * Fetches item details from v2 API
   * Provides additional data like maxAmberStars/maxCyanStars for Ayatan sculptures
   * 
   * @param urlName - URL-friendly item name
   * @returns v2 item data or null if not available
   */
  async getItemDetailsV2(urlName: string): Promise<{
    id: string;
    slug: string;
    tags?: string[];
    maxAmberStars?: number;
    maxCyanStars?: number;
    baseEndo?: number;
    endoMultiplier?: number;
  } | null> {
    try {
      const response = await this.httpClient.get<{ data: any }>(
        `${API_URLS.WARFRAME_MARKET_V2}/items/${urlName}`
      );
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Fetches current orders for an item using v2 API
   * Transforms v2 response to v1-compatible format for OrderCalculator
   * 
   * @param urlName - URL-friendly item name
   */
  async getItemOrders<T = any>(urlName: string): Promise<T> {
    if (DEBUG) console.log(`🔄 Fetching orders (v2) for: ${urlName}...`);
    
    // Use v2 API endpoint
    const v2Response = await this.httpClient.get<{ data: any[] }>(
      `${API_URLS.WARFRAME_MARKET_V2}/orders/item/${urlName}`
    );
    
    // Transform v2 response to v1-compatible format
    const transformedOrders = this.transformV2OrdersToV1(v2Response.data || []);
    
    // Return in v1-compatible format
    return {
      payload: {
        orders: transformedOrders
      }
    } as T;
  }

  /**
   * Transforms v2 API orders to v1-compatible format
   * 
   * ## Field Mapping (v2 → v1)
   * 
   * | v2 Field      | v1 Field        | Description                                    |
   * |---------------|-----------------|------------------------------------------------|
   * | type          | order_type      | 'buy' or 'sell'                                |
   * | platinum      | platinum        | Price in platinum                              |
   * | modRank       | mod_rank        | Mod rank (0-10 for mods, undefined otherwise)  |
   * | quantity      | quantity        | Number of items                                |
   * | createdAt     | creation_date   | ISO date string                                |
   * | updatedAt     | last_update     | ISO date string                                |
   * | user.status   | user.status     | 'ingame', 'online', or 'offline'               |
   * | user.ingameName| user.ingame_name| Player's in-game name                         |
   * | amberStars    | amber_stars     | Ayatan sculptures: amber stars socketed (0-2)  |
   * | cyanStars     | cyan_stars      | Ayatan sculptures: cyan stars socketed (0-4)   |
   * | subtype       | subtype         | Item variant (e.g., 'intact', 'radiant')       |
   * 
   * ## mod_rank Usage
   * 
   * The `mod_rank` field is used differently depending on item type:
   * 
   * 1. **Mods**: Represents the mod's current rank (0 to mod_max_rank)
   *    - When filtering, only orders matching the item's `mod_max_rank` are considered
   *    - Example: A rank 10 Vitality mod order has `mod_rank: 10`
   * 
   * 2. **Riven Mods**: Represents the riven's rank (typically 0-8)
   *    - Used in endo calculation formulas
   * 
   * 3. **Ayatan Sculptures**: Not used for rank, uses `amber_stars`/`cyan_stars` instead
   *    - Empty sculpture: amberStars=0, cyanStars=0
   *    - Filled sculpture: varies by sculpture type
   * 
   * 4. **Other Items**: `mod_rank` is undefined
   * 
   * @param v2Orders - Orders from v2 API
   * @returns Orders in v1-compatible format
   */
  private transformV2OrdersToV1(v2Orders: any[]): any[] {
    return v2Orders.map(order => ({
      order_type: order.type, // v2 uses 'type', v1 uses 'order_type'
      platinum: order.platinum,
      // v2 API uses 'rank' for mods/arcanes (not modRank)
      mod_rank: order.rank ?? order.modRank, // v2 uses 'rank', fallback to modRank for compatibility
      quantity: order.quantity,
      // Ayatan sculpture specific fields
      amber_stars: order.amberStars,
      cyan_stars: order.cyanStars,
      // Item variant (relics: intact/exceptional/flawless/radiant)
      subtype: order.subtype,
      user: {
        status: order.user?.status || 'offline',
        ingame_name: order.user?.ingameName,
        id: order.user?.id,
        region: order.user?.region,
        reputation: order.user?.reputation,
        avatar: order.user?.avatar
      },
      platform: order.platform,
      region: order.region,
      creation_date: order.createdAt,
      last_update: order.updatedAt,
      visible: order.visible,
      id: order.id
    }));
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
   * Handles different item types:
   * - Mods: filters by mod_max_rank
   * - Ayatan sculptures: filters for filled sculptures (max amber/cyan stars)
   * - Other items: no special filtering
   * 
   * @param item - Market item with url_name, items_in_set, and optional star capacity
   * @param retryAttempt - Current retry attempt (internal use)
   */
  async getItemPrices(
    item: { 
      url_name: string; 
      items_in_set?: Array<{ mod_max_rank?: number }>;
      /** Ayatan: max amber stars for filled sculpture */
      max_amber_stars?: number;
      /** Ayatan: max cyan stars for filled sculpture */
      max_cyan_stars?: number;
    },
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
      // Add random delay for anti-detection (configurable)
      if (this.priceConfig.ordersMinDelay > 0) {
        await this.httpClient.addRandomDelay(
          this.priceConfig.ordersMinDelay,
          this.priceConfig.ordersMaxDelay
        );
      }

      // Fetch orders
      const ordersResponse = await this.getItemOrders<{ payload: { orders: any[] } }>(item.url_name);

      // Get mod max rank if applicable (for mods)
      const maxRank = item.items_in_set?.[0]?.mod_max_rank;

      // Calculate prices using OrderCalculator with appropriate filters
      const prices = OrderCalculator.calculatePrices(
        ordersResponse.payload.orders,
        { 
          maxRank,
          // Ayatan sculpture filtering for filled sculptures
          maxAmberStars: item.max_amber_stars,
          maxCyanStars: item.max_cyan_stars
        }
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
    // Add random delay for anti-detection (configurable)
    if (this.priceConfig.statsMinDelay > 0) {
      await this.httpClient.addRandomDelay(
        this.priceConfig.statsMinDelay,
        this.priceConfig.statsMaxDelay
      );
    }

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
      const result = await this.getAllItems();
      return !!(result && result.data && result.data.length > 0);
    } catch (error: any) {
      console.error("Connection test failed:", error.message);
      return false;
    }
  }
}
