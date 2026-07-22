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
import { MissionService } from './MissionService';
import { PriceHistoryService } from './PriceHistoryService';
import { RelicService } from './RelicService';
import { RivenService } from './RivenService';
import { SetService } from './SetService';
import { TranslationService, TranslationMap } from './TranslationService';
import { FoundryService } from './FoundryService';
import { WarframeItemsResponse } from "./WarframeItems.interface";
import { IEndoFlipResponse, IEndoFlipRow } from '../interfaces/endo.interface';
import { isEndoRankableMod } from './EndoCost';

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

  /** Star-chart node metadata + /mission pages (joins DropService's map). */
  protected readonly missionService: MissionService;

  /** Localized game-noun name dictionaries (i18n), see TranslationService */
  protected readonly translationService: TranslationService;

  /** Mastery/build catalogue behind the /foundry tracker, see FoundryService */
  protected readonly foundryService: FoundryService;

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
    this.missionService = new MissionService(this.dbDrops as any);

    // Initialize item service (shared, no HTTP dependency)
    this.itemService = new ItemService();

    // Localized name dictionaries (i18n) — shared, no HTTP dependency for reads.
    this.translationService = new TranslationService();

    // Mastery/build catalogue (WFCD warframe-items -> one Mongo document).
    this.foundryService = new FoundryService();
  }

  /**
   * Helper to create SetService with dependencies
   * Called by subclasses after relicService is ready
   */
  protected createSetService(): SetService {
    return new SetService(
      this.itemService,
      this.relicService,
      (item: any) => this.processItem(item),
      // Needed by getSetFullData, which bundles each item's daily price series
      // into the set detail payload with a single batched read.
      this.priceHistoryService
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

  // =====================================
  // Translations (i18n) — Shared Implementation
  // =====================================

  /**
   * Fetches a warframe.market v2 collection localized into `lang`.
   * Used by the translation collector; delegates to MarketService.
   */
  async getLocalizedCollection<T = any>(path: string, lang: string): Promise<T> {
    return this.marketService.getLocalizedCollection<T>(path, lang);
  }

  /**
   * Reads the stored `{ slug -> localized name }` dictionary for one
   * (scope, lang). Returns `{}` for English or an uncollected pair.
   */
  async getTranslations(scope: string, lang: string): Promise<TranslationMap> {
    return this.translationService.getMap(scope, lang);
  }

  /**
   * Upserts a localized name dictionary for one (scope, lang).
   */
  async saveTranslations(scope: string, lang: string, map: TranslationMap): Promise<void> {
    return this.translationService.saveMap(scope, lang, map);
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
  // Endo Exchange (mod-flip, Shared Implementation)
  // =====================================

  /**
   * Builds the Endo Exchange payload: every rank-able mod that has a stored
   * per-rank flip ladder (populated by sync_prices / sync_mod_flip via
   * MarketService.getItemPrices). One catalogue read; the client (`useEndoValue`)
   * does all valuation — endo cost, best buy rank, profit, plat-per-endo — so
   * the maths lives in a single unit-tested place. Same server-thin / client-rich
   * split as getRelicsEv.
   */
  async getEndoFlip(): Promise<IEndoFlipResponse> {
    const items = (await this.itemService.getAllItems()) as any[];
    const mods: IEndoFlipRow[] = [];
    for (const it of items || []) {
      const flip = it?.market?.flip;
      // Require a real ladder: a rank-able mod whose fusion cost we can compute
      // (buildModFlipData already gated on tags/rarity, so presence is enough).
      if (!flip || !Array.isArray(flip.ranks) || !(Number(flip.maxRank) > 0)) continue;
      // Drop Requiem/Kuva mods (murmur-ranked, not endo) even if an older sync
      // stored a ladder for them — no re-sync needed to clean the board.
      if (!isEndoRankableMod(it.url_name, it.items_in_set?.[0]?.tags)) continue;
      mods.push({
        item_name: it.item_name,
        url_name: it.url_name,
        thumb: it.thumb,
        tags: it.items_in_set?.[0]?.tags || [],
        flip,
      });
    }
    return {
      meta: { count: mods.length, generatedAt: new Date().toISOString() },
      mods,
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
   * Bundled payload for the set detail page: set + parts with quantities, full
   * market blocks (median / depth ladder) and each item's price history, in one
   * cached request. See SetService.getSetFullData.
   *
   * Throws `Not a set` for a set doc whose roster was never populated (enriched
   * before warframe.market published its `setParts`). That is a DATA gap, healed
   * out of band — not on this request path: the API server process cannot pull
   * warframe.market's throttled `/v2/items` catalogue, so the repair runs where
   * it reliably can — `sync_items` (needsV2Enrichment, nightly) and the targeted
   * `sync_repair_sets` one-shot the deploy runs. See isIncompleteSetRoster.
   */
  async getSetFull(urlName: string): Promise<any> {
    return this.setService.getSetFullData(urlName);
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
    const [relics, items, droppingKeys] = await Promise.all([
      this.relicService.getAllRelics(),
      this.itemService.getAllItems(),
      // Authoritative "currently dropping" set from the WFCD drop tables (same
      // source the drop dialog shows), so the farming board's vault gate matches
      // reality instead of warframe.market's unreliable per-relic flag.
      this.dropService.getDroppingRelicKeys(),
    ]);
    return this.relicService.buildRelicEvFromData(relics, items, droppingKeys);
  }

  /**
   * The single "open vs sell" EV row for one relic — the rich payload the relic
   * detail page renders (rewards with authoritative chances, per-part vault
   * status, the relic's own market book).
   *
   * Built from the SAME join as the whole-table view (getRelicsEv), so a relic's
   * page and its row in the value board always agree. The "is this part vaulted"
   * flag genuinely needs every relic (a part is farmable iff SOME dropping relic
   * yields it), so this reuses the full builder and picks the one row rather than
   * re-deriving a partial, inconsistent answer. Returns null for an unknown relic.
   */
  async getRelicEv(urlName: string): Promise<any | null> {
    // Cheap existence gate FIRST: a bad/typo/enumerated slug misses here via a
    // targeted indexed lookup and returns null without touching the heavy join
    // below. Without it, every unknown slug would run the full getRelicsEv scan
    // (all relics + all items + the drop index); its null result is uncacheable,
    // so a burst of distinct invalid slugs each re-scans Mongo — the exact
    // full-collection stampede the cache layer exists to prevent. The old
    // relic/:url_name route missed cheaply the same way.
    const relic = await this.relicService.findRelicByUrlName(urlName);
    if (!relic) return null;
    const rows = await this.getRelicsEv();
    return rows.find((r) => r.url_name === urlName) ?? null;
  }

  /**
   * Order-book depth and per-rank price snapshot for one item.
   *
   * Served from the DATABASE — the compact depth ladder the price-sync crawler
   * stores on `item.market.depth` (see OrderCalculator.depthLadder). The request
   * path deliberately makes NO live warframe.market call: on-demand order fetches
   * hang on the datacenter IP (unlike the crawler, which paces + rotates
   * proxies). An item with no stored depth yet (synced before this shipped)
   * returns empty ladders; the dialog degrades gracefully and fills in after the
   * item's next price sync.
   */
  async getOrderBook(urlName: string): Promise<{
    url_name: string;
    subtype: string | null;
    updatedAt: any;
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
    /** Best few NAMED, contactable orders per side (for the whisper buttons). */
    topOrders: {
      buy: Array<{ platinum: number; quantity: number; ingame_name: string; status: string }>;
      sell: Array<{ platinum: number; quantity: number; ingame_name: string; status: string }>;
    };
    rankPrices: any | null;
    ayatanPrices: any | null;
  }> {
    const item: any = await this.itemService.getItemByUrlName(urlName);
    const depth = item?.market?.depth;
    const top = item?.market?.topOrders;
    return {
      url_name: urlName,
      subtype: item?.market?.subtype ?? null,
      updatedAt: item?.priceUpdate ?? null,
      buy: Array.isArray(depth?.buy) ? depth.buy : [],
      sell: Array.isArray(depth?.sell) ? depth.sell : [],
      topOrders: {
        buy: Array.isArray(top?.buy) ? top.buy : [],
        sell: Array.isArray(top?.sell) ? top.sell : [],
      },
      rankPrices: item?.market?.rankPrices ?? null,
      ayatanPrices: item?.market?.ayatanPrices ?? null,
    };
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
  // Foundry Operations (Delegates to FoundryService)
  // =====================================

  /**
   * The mastery/build catalogue behind /foundry. Served straight from the Mongo
   * copy; when it has never been synced (fresh DB) it is built live once so the
   * page is never empty on a new deployment.
   */
  async getFoundryCatalogue() {
    const stored = await this.foundryService.get();
    if (stored) return stored;
    await this.syncFoundry();
    return this.foundryService.get();
  }

  /**
   * Rebuilds the Foundry catalogue from WFCD and stores it. Also attaches
   * warframe.market url_names by matching display names against this app's own
   * item catalogue — that link is what lets /foundry price the gear a player is
   * still missing, which a pure checklist cannot do.
   */
  async syncFoundry() {
    const items = (await this.itemService.getAllItems()) as any[];
    const marketByName: Record<string, string> = {};
    for (const it of items || []) {
      if (!it?.item_name || !it?.url_name) continue;
      const key = String(it.item_name)
        .toLowerCase()
        .replace(/\s*\(.*?\)\s*/g, ' ')
        .replace(/\s+blueprint$/i, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
      // First writer wins: the catalogue is sorted so the canonical listing for
      // a name lands before any later near-duplicate.
      if (key && !marketByName[key]) marketByName[key] = it.url_name;
    }
    return this.foundryService.sync(marketByName);
  }

  // =====================================
  // Mission Operations (Delegates to MissionService)
  // =====================================

  /** /missions hub: every drop source with node facts + best plat/run. */
  async getMissionList() {
    const [map, nodes] = await Promise.all([
      this.dropService.getDropsMap(),
      this.missionService.getNodesIndex(),
    ]);
    return { rows: MissionService.buildMissionList(map.planets, nodes), meta: map.meta };
  }

  /** /mission/<slug> detail, or null for an unknown slug. */
  async getMissionDetail(slug: string) {
    const [map, nodes] = await Promise.all([
      this.dropService.getDropsMap(),
      this.missionService.getNodesIndex(),
    ]);
    return MissionService.buildMissionDetail(slug, map.planets, nodes);
  }

  /** Refreshes the node-metadata backup (Node.json + solNodes). */
  async syncNodes() {
    return this.missionService.syncNodes();
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
