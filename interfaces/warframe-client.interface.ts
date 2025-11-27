/**
 * @fileoverview Shared interface for Warframe Market clients
 * @module interfaces/warframe-client
 * 
 * Defines the common contract that both WarframeFacade and WarframeUndici implement.
 * This follows Interface Segregation Principle - clients depend only on what they need.
 */

import { IMarketItem, IProcessedItem, IPriceResult, ISetResult } from './market.interface';
import { IRelic, IRelicSyncResult } from './relic.interface';

/**
 * Common configuration options for Warframe clients
 */
export interface IWarframeClientConfig {
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
}

/**
 * Interface for Warframe Market client implementations
 * 
 * Both WarframeFacade (axios) and WarframeUndici implement this interface,
 * allowing consumers to swap implementations without changing their code.
 * 
 * @example
 * ```typescript
 * // Use any implementation
 * function processItems(client: IWarframeClient) {
 *   const items = await client.getItemsDatabase();
 *   // ... process items
 * }
 * 
 * // Works with both
 * processItems(new WarframeFacade());
 * processItems(new WarframeUndici());
 * ```
 */
export interface IWarframeClient {
  // =====================================
  // Database Operations
  // =====================================
  
  /**
   * Saves an item to the database
   */
  saveItem(id: string, item: Partial<IMarketItem>): Promise<void>;
  
  /**
   * Gets a single item from database by URL name
   */
  getSingleItemDB(item: { url_name: string }): Promise<IMarketItem | null>;
  
  /**
   * Gets all raw items from database
   */
  getItemsDatabase(): Promise<IMarketItem[]>;
  
  /**
   * Gets all items from database, processed for frontend display
   */
  getItemsDatabaseServer(): Promise<Array<IProcessedItem | string>>;
  
  /**
   * Gets items sorted by price update date
   */
  getItemsDatabaseDate(): Promise<IMarketItem[]>;
  
  /**
   * Removes an item from the database
   */
  removeItemDB(id: string): Promise<boolean | void>;

  // =====================================
  // Set Operations
  // =====================================
  
  /**
   * Gets set pricing data including individual parts
   */
  getSet(urlName: string): Promise<ISetResult>;
  
  /**
   * Gets relic data with associated item prices
   */
  getRelic(urlName: string): Promise<ISetResult>;

  // =====================================
  // Relic Operations
  // =====================================
  
  /**
   * Gets all relics from the database
   */
  relics(): Promise<IRelic[] | any[]>;
  
  /**
   * Fetches and syncs relic data from the warframestat drops API
   */
  buildRelics(): Promise<IRelicSyncResult | { success: boolean; relics: number }>;

  // =====================================
  // Riven Operations
  // =====================================
  
  /**
   * Fetches all riven items from the API and saves to database
   */
  getSaveRivens(): Promise<void>;
  
  /**
   * Gets all riven items from the database
   */
  getAllRivens(): Promise<any[]>;
  
  /**
   * Syncs auction data for a single riven weapon
   */
  syncSingleRiven(riven: any): Promise<void>;
  
  /**
   * Syncs all riven auctions
   */
  getSaveOffers(): Promise<void>;
  
  /**
   * Gets top rivens by endo per platinum efficiency
   */
  rivenMods(): Promise<any[]>;
  
  /**
   * Calculates the endo value of a riven mod
   */
  endoRiven(mastery_level: number, mod_rank: number, re_rolls: number): number;

  // =====================================
  // Item Processing
  // =====================================
  
  /**
   * Processes an item for frontend display
   */
  processItem(item: IMarketItem): IProcessedItem | string | any;
}

/**
 * Extended interface for clients that support direct API access
 */
export interface IWarframeApiClient extends IWarframeClient {
  /**
   * Fetches all items from Warframe Market API
   */
  getWarframeItems(): Promise<any>;
  
  /**
   * Gets detailed item data from Warframe Market API
   */
  getSingleItemData(item: any): Promise<any>;
  
  /**
   * Calculates complete price data for an item
   */
  getWarframeItemOrders(item: any): Promise<IPriceResult | any>;
}
