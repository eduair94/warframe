/**
 * @fileoverview Abstract base class for Warframe Market clients
 * @module services/BaseWarframeClient
 * 
 * This abstract class implements the Template Method pattern, providing
 * a skeleton for Warframe Market clients while allowing subclasses to
 * specify the HTTP client implementation.
 * 
 * All services use dependency injection with IHttpClient, enabling
 * the same service code to work with both axios and undici.
 * 
 * Design Patterns Used:
 * - Template Method: Defines the skeleton, subclasses fill in details
 * - Facade Pattern: Provides unified interface to complex subsystems
 * - Dependency Injection: Services receive HTTP client through constructor
 * 
 * SOLID Principles:
 * - Single Responsibility: Shared logic in one place
 * - Open/Closed: Extend without modifying (via abstract methods)
 * - Liskov Substitution: Subclasses can replace base class
 * - Dependency Inversion: All services depend on IHttpClient abstraction
 */

import { Schema } from 'mongoose';
import { COLLECTIONS } from '../constants';
import { MongooseServer } from '../database';
import { DropService } from './DropService';
import { ItemProcessor } from './ItemProcessor';
import { ItemService } from './ItemService';
import { MarketService, PriceCalculationConfig } from './MarketService';
import { MarketAnalyticsService } from './MarketAnalyticsService';
import { PriceHistoryService } from './PriceHistoryService';
import { RelicService } from './RelicService';
import { RivenService } from './RivenService';
import { SetService } from './SetService';
import { WarframeItemsResponse } from "./WarframeItems.interface";

/**
 * Configuration options for Warframe clients
 */
export type WarframeClientConfig = {
  /** Enable/disable proxy usage */
  useProxies?: boolean;
  /** Maximum retry attempts for API requests */
  maxRetries?: number;
  /** Minimum delay between requests in ms */
  minDelay?: number;
  /** Maximum delay between requests in ms */
  maxDelay?: number;
  /** Custom HTTP timeout in milliseconds */
  timeout?: number;
  /** Price calculation configuration (delays, etc.) */
  priceConfig?: Partial<PriceCalculationConfig>;
};

/**
 * Abstract base class for Warframe Market clients
 * 
 * Provides shared functionality for:
 * - Database initialization and management
 * - Service initialization with dependency injection
 * - Common API operations via MarketService
 * - Item processing utilities
 * 
 * Subclasses must implement:
 * - initializeServices(): Initialize HTTP client and all services
 * 
 * @abstract
 */
export abstract class BaseWarframeClient {
  // =====================================
  // Protected Services (accessible to subclasses)
  // =====================================

  /** Market service for API operations - uses injected HTTP client */
  protected abstract readonly marketService: MarketService;

  /** Item database service */
  protected readonly itemService: ItemService;

  /** Set calculation service */
  protected abstract readonly setService: SetService;

  /** Relic data service */
  protected abstract readonly relicService: RelicService;

  /** Riven mod operations service */
  protected abstract readonly rivenService: RivenService;

  // =====================================
  // Database Instances (public for backward compatibility)
  // =====================================

  /** Database instance for market items */
  public readonly db: MongooseServer;

  /** Database instance for riven mods */
  public readonly dbRivens: MongooseServer;

  /** Database instance for relics */
  public readonly dbRelics: MongooseServer;

  /** Database instance for daily price history points */
  public readonly dbPriceHistory: MongooseServer;

  /** Backup of WFCD drop data (two docs: 'map' + 'index'), see DropService */
  public readonly dbDrops: MongooseServer;

  /** Records/serves daily price points and trend analysis (README Roadmap) */
  protected readonly priceHistoryService: PriceHistoryService;

  /** Drop-data service: mission/relic drops joined with market prices (Star Chart) */
  protected readonly dropService: DropService;

  /** Configuration */
  protected readonly config: WarframeClientConfig;

  /**
   * Creates a new BaseWarframeClient instance
   * 
   * Initializes shared components:
   * - Database connections for items, rivens, and relics
   * - ItemService for database operations
   * 
   * Subclasses must call super() and then initialize all services
   * 
   * @param config - Configuration options
   */
  constructor(config: WarframeClientConfig = {}) {
    this.config = config;

    // Initialize database instances (shared by all implementations)
    this.db = MongooseServer.getInstance(
      COLLECTIONS.ITEMS,
      new Schema({ id: { type: String, unique: true } }, { strict: false })
    );

    this.dbRivens = MongooseServer.getInstance(
      COLLECTIONS.RIVENS,
      new Schema({ id: { type: String, unique: true } }, { strict: false })
    );
    // syncAllRivenAuctions upserts every weapon by url_name each run - without
    // this the rivens collection had no index on that field, so every sync
    // was a full collection scan per weapon.
    this.dbRivens.ensureIndex({ url_name: 1 }, { sparse: true }).catch(() => {});

    this.dbRelics = MongooseServer.getInstance(
      COLLECTIONS.RELICS,
      new Schema({ relicName: { type: String, unique: true } }, { strict: false })
    );

    this.dbPriceHistory = MongooseServer.getInstance(
      COLLECTIONS.PRICE_HISTORY,
      new Schema({ url_name: { type: String, unique: true } }, { strict: false })
    );
    this.dbPriceHistory.ensureIndex({ url_name: 1 }, { unique: true, sparse: true }).catch(() => {});
    this.priceHistoryService = new PriceHistoryService(this.dbPriceHistory as any);

    // WFCD drop-data backup: keyed by 'map' / 'index' (see DropService). Reads from
    // WFCD directly (via axios), so no HTTP client injection is needed here.
    this.dbDrops = MongooseServer.getInstance(
      COLLECTIONS.DROPS,
      new Schema({ key: { type: String, unique: true } }, { strict: false })
    );
    this.dbDrops.ensureIndex({ key: 1 }, { unique: true, sparse: true }).catch(() => {});
    this.dropService = new DropService(this.dbDrops as any, this.db as any);

    // Initialize item service (shared, no HTTP dependency)
    this.itemService = new ItemService();
  }

  /**
   * Helper to create SetService with dependencies
   * Called by subclasses after relicService is ready
   */
  protected createSetService(): SetService {
    return new SetService(
      this.itemService,
      this.relicService,
      (item: any) => this.processItem(item)
    );
  }

  // =====================================
  // API METHODS (Delegates to MarketService)
  // =====================================

  /**
   * Fetches all Warframe items from the API
   */
  async getWarframeItems<T = any>(): Promise<WarframeItemsResponse> {
    return this.marketService.getAllItems<T>();
  }

  /**
   * Alias for getWarframeItems
   */
  async getItems<T = any>(): Promise<WarframeItemsResponse> {
    return this.marketService.getAllItems<T>();
  }

  /**
   * Fetches a single item by name
   */
  async getItemByName<T = any>(itemName: string): Promise<T> {
    return this.marketService.getItemDetails<T>(itemName);
  }

  /**
   * Fetches orders for a specific item
   */
  async getItemOrders<T = any>(itemName: string): Promise<T> {
    return this.marketService.getItemOrders<T>(itemName);
  }

  /**
   * Gets detailed item data from API
   */
  async getSingleItemData<T = any>(item: { url_name: string }): Promise<T> {
    return this.marketService.getItemDetails<T>(item.url_name);
  }

  /**
   * Gets orders with buy/sell prices and statistics
   */
  async getWarframeItemOrders(
    item: { url_name: string; items_in_set?: Array<{ mod_max_rank?: number }> }
  ): Promise<{
    buy: number;
    sell: number;
    volume: number;
    avg_price: number;
    last_completed: any;
    not_found?: boolean;
  }> {
    return this.marketService.getItemPrices(item);
  }

  /**
   * Fetches all Riven weapons from API
   */
  async getRivens<T = any>(): Promise<T> {
    return this.marketService.getRivens<T>();
  }

  /**
   * Fetches Riven orders for a weapon
   */
  async getRivenOrders<T = any>(weaponName: string): Promise<T> {
    return this.marketService.getRivenOrders<T>(weaponName);
  }

  /**
   * Fetches Riven auctions
   */
  async getAuctions<T = any>(): Promise<T> {
    return this.marketService.getAuctions<T>();
  }

  /**
   * Tests API connection
   */
  async testConnection(): Promise<boolean> {
    return this.marketService.testConnection();
  }

  // =====================================
  // Database Operations (Shared Implementation)
  // =====================================

  /**
   * Saves or updates an item in the database
   */
  async saveItem(id: string, item: any): Promise<void> {
    return this.itemService.saveItem(id, item);
  }

  /**
   * Gets a single item from database by URL name
   */
  async getSingleItemDB(item: { url_name: string }): Promise<any> {
    return this.itemService.getItemByUrlName(item.url_name);
  }

  /**
   * Gets all items from database, processed for frontend display
   */
  async getItemsDatabaseServer(): Promise<any[]> {
    return this.itemService.getAllItemsForDisplay(
      (item: any) => this.processItem(item)
    );
  }

  /**
   * Gets all raw items from database
   */
  async getItemsDatabase(): Promise<any[]> {
    return this.itemService.getAllItems();
  }

  /**
   * Removes an item from the database
   */
  async removeItemDB(id: string): Promise<boolean> {
    return this.itemService.removeItemById(id);
  }

  /**
   * Gets all items sorted by price update date (oldest first)
   */
  async getItemsDatabaseDate(): Promise<any[]> {
    return this.itemService.getItemsByUpdateDate();
  }

  // =====================================
  // Price History Operations (Shared Implementation)
  // =====================================

  /**
   * Records today's price point for an item (no-op if already recorded today).
   * Called by sync_prices after computing/saving an item's market data.
   */
  async recordPriceHistoryPoint(
    urlName: string,
    point: { buy: number; sell: number; avg_price: number; volume: number }
  ): Promise<void> {
    return this.priceHistoryService.recordPoint(urlName, point);
  }

  /**
   * Gets an item's stored price history plus a computed trend direction.
   */
  async getPriceHistory(urlName: string) {
    return this.priceHistoryService.getHistoryWithTrend(urlName);
  }

  // =====================================
  // Market Analytics (cross-item, Shared Implementation)
  // =====================================

  /**
   * Builds the cross-item analytics feed powering the Screener, Top Movers,
   * Volatility, Buy/Sell-timing and Vault-Spike pages: joins every item's live
   * snapshot with its stored daily price series (two reads for the whole
   * catalogue) and derives spread, discount, %-change windows, volatility,
   * all-time low/high and trend. warframe.market exposes none of this across
   * items or beyond a 90-day per-item window.
   */
  async getMarketAnalytics(): Promise<{
    meta: { count: number; maxHistoryDays: number; generatedAt: string };
    items: import('./MarketAnalyticsService').IItemAnalytics[];
  }> {
    const [items, historyDocs] = await Promise.all([
      this.itemService.getAllItems(),
      this.dbPriceHistory.allEntries({}) as Promise<any[]>,
    ]);
    const { items: analytics, maxHistoryDays } = MarketAnalyticsService.buildAnalytics(
      items as any[],
      (historyDocs as any[]) || []
    );
    return {
      meta: {
        count: analytics.length,
        maxHistoryDays,
        generatedAt: new Date().toISOString(),
      },
      items: analytics,
    };
  }

  // =====================================
  // Riven analytics queries (Delegates to RivenService)
  // =====================================

  /**
   * Lightweight list of every riven weapon (with disposition + stored auction
   * counts) for the fair-value page's weapon picker.
   */
  async getRivenWeaponsList() {
    return this.rivenService.getWeaponsList();
  }

  /**
   * Full stored auction corpus + meta for one weapon, for the fair-value
   * estimator / god-roll grader (client-side maths over the returned auctions).
   */
  async getRivenValueData(weaponUrlName: string) {
    return this.rivenService.getWeaponAuctions(weaponUrlName);
  }

  // =====================================
  // Set Operations (Shared Implementation)
  // =====================================

  /**
   * Gets set pricing data including individual parts
   */
  async getSet(urlName: string): Promise<any> {
    return this.setService.getSetData(urlName);
  }

  /**
   * Builds the "set vs parts" comparison for every multi-part set.
   *
   * Loads all items once and computes each set's by-parts totals in memory
   * (see SetService.buildComparisonFromItems) so the aggregate view costs a
   * single database read rather than one query per set.
   */
  async getSetsComparison(): Promise<any[]> {
    const items = await this.itemService.getAllItems();
    return this.setService.buildComparisonFromItems(items);
  }

  /**
   * Gets relic data with associated item prices
   */
  async getRelic(urlName: string): Promise<any> {
    return this.setService.getRelicSetData(urlName);
  }

  /**
   * Builds the "open the relic vs sell it" EV table for every relic.
   *
   * Loads all relics and all items once, then joins in memory
   * (see RelicService.buildRelicEvFromData) — two reads for the whole table.
   */
  async getRelicsEv(): Promise<any[]> {
    const [relics, items] = await Promise.all([
      this.relicService.getAllRelics(),
      this.itemService.getAllItems(),
    ]);
    return this.relicService.buildRelicEvFromData(relics, items);
  }

  // =====================================
  // Relic Operations (Delegates to RelicService)
  // =====================================

  /**
   * Gets all relics from the database
   */
  async relics(): Promise<any[]> {
    return this.relicService.getAllRelics();
  }

  /**
   * Fetches and syncs relic data from the warframestat drops API
   */
  async buildRelics(): Promise<any> {
    return this.relicService.syncRelicsFromDrops();
  }

  // =====================================
  // Drop Operations (Delegates to DropService)
  // =====================================

  /**
   * Planets → nodes → missions ranked by expected platinum per run (Star Chart).
   * WFCD drop chances joined with this app's live market prices.
   */
  async getDropsMap() {
    return this.dropService.getDropsMap();
  }

  /**
   * Every place an item drops — direct mission nodes and the relics that contain
   * it — for the in-app drop-locations dialog.
   */
  async getItemDrops(name: string) {
    return this.dropService.getItemDrops(name);
  }

  /**
   * Fetches WFCD mission/relic drop data and replaces the Mongo backup.
   * Run by sync_drops.ts; also exposed via the protected /build_drops endpoint.
   */
  async syncDrops() {
    return this.dropService.syncDrops();
  }

  // =====================================
  // Riven Operations (Delegates to RivenService)
  // =====================================

  /**
   * Fetches all riven items from the API and saves to database
   */
  async getSaveRivens(): Promise<void> {
    await this.rivenService.saveAllRivenItems();
  }

  /**
   * Gets all riven items from the database
   */
  async getAllRivens(): Promise<any[]> {
    return this.rivenService.getAllRivens();
  }

  /**
   * Syncs auction data for a single riven weapon
   */
  async syncSingleRiven(riven: any): Promise<void> {
    return this.rivenService.syncSingleRiven(riven);
  }

  /**
   * Syncs all riven auctions with progress logging
   */
  async getSaveOffers(): Promise<void> {
    return this.rivenService.syncAllRivenAuctions();
  }

  /**
   * Gets top rivens by endo per platinum efficiency
   */
  async rivenMods(): Promise<any[]> {
    return this.rivenService.getTopEndoRivens(10);
  }

  /**
   * Calculates the endo value of a riven mod
   */
  endoRiven(mastery_level: number, mod_rank: number, re_rolls: number): number {
    return RivenService.calculateEndo({ mastery_level, mod_rank, re_rolls });
  }

  // =====================================
  // Item Processing (Shared Implementation)
  // =====================================

  /**
   * Processes an item for frontend display
   * Uses ItemProcessor utility for consistent processing
   */
  processItem(item: any): any {
    return ItemProcessor.processForDisplay(item);
  }

  // =====================================
  // Service Accessors (Shared Implementation)
  // =====================================

  /**
   * Gets the market service instance
   */
  getMarketService(): MarketService {
    return this.marketService;
  }

  /**
   * Gets the item service instance
   */
  getItemService(): ItemService {
    return this.itemService;
  }

  /**
   * Gets the set service instance
   */
  getSetService(): SetService {
    return this.setService;
  }

  /**
   * Gets the relic service instance
   */
  getRelicService(): RelicService {
    return this.relicService;
  }

  /**
   * Gets the riven service instance
   */
  getRivenService(): RivenService {
    return this.rivenService;
  }
}
