/**
 * @fileoverview Service for managing item database operations
 * @module services/ItemService
 * 
 * Single Responsibility: Handle all item CRUD operations in the database.
 * This service provides methods for saving, retrieving, and managing
 * market items in MongoDB.
 */

import { Schema } from 'mongoose';
import { MongooseServer } from '../database';
import { COLLECTIONS } from '../constants';
import { IMarketItem, IProcessedItem } from '../interfaces/market.interface';

/**
 * Service for managing item database operations
 * 
 * @example
 * ```typescript
 * const itemService = new ItemService();
 * const items = await itemService.getAllItems();
 * await itemService.saveItem(item);
 * ```
 */
export class ItemService {
  /** Database instance for market items */
  private readonly db: MongooseServer;

  /**
   * Creates a new ItemService instance
   * Initializes the MongoDB connection for items collection
   */
  constructor() {
    this.db = MongooseServer.getInstance(
      COLLECTIONS.ITEMS,
      new Schema(
        { id: { type: String, unique: true } },
        { strict: false }
      )
    );
  }

  /**
   * Gets the database instance for external use
   * 
   * @returns Database instance
   */
  getDatabase(): MongooseServer {
    return this.db;
  }

  /**
   * Gets all items from database, processed for frontend display
   * 
   * @param processItem - Function to process items for display
   * @returns Promise resolving to array of processed items
   */
  async getAllItemsForDisplay(
    processItem: (item: IMarketItem) => IProcessedItem | string
  ): Promise<Array<IProcessedItem | string>> {
    const entries = await this.db.allEntries({}) as IMarketItem[];
    return entries
      .map((item: IMarketItem) => processItem(item))
      .filter((el: IProcessedItem | string) => el);
  }

  /**
   * Gets all raw items from database
   * 
   * @returns Promise resolving to array of raw items
   */
  async getAllItems(): Promise<IMarketItem[]> {
    return this.db.allEntries({}) as Promise<IMarketItem[]>;
  }

  /**
   * Gets all items sorted by price update date (oldest first)
   * Useful for finding items that need price updates.
   * 
   * @returns Promise resolving to sorted items
   */
  async getItemsByUpdateDate(): Promise<IMarketItem[]> {
    return this.db.allEntriesSort({}, { priceUpdate: 1 }) as Promise<IMarketItem[]>;
  }

  /**
   * Gets a single item by URL name
   * 
   * @param urlName - URL-friendly item name
   * @returns Promise resolving to found item or null
   */
  async getItemByUrlName(urlName: string): Promise<IMarketItem | null> {
    const result = await this.db.findEntry({ url_name: urlName });
    return result as IMarketItem | null;
  }

  /**
   * Gets a single item by ID
   * 
   * @param id - Item unique identifier
   * @returns Promise resolving to found item or null
   */
  async getItemById(id: string): Promise<IMarketItem | null> {
    const result = await this.db.findEntry({ id });
    return result as IMarketItem | null;
  }

  /**
   * Gets multiple items by URL names
   * 
   * @param urlNames - Array of URL-friendly item names
   * @returns Promise resolving to array of items
   */
  async getItemsByUrlNames(urlNames: string[]): Promise<IMarketItem[]> {
    return this.db.allEntries({ url_name: { $in: urlNames } }) as Promise<IMarketItem[]>;
  }

  /**
   * Gets multiple items by their display names
   * 
   * @param itemNames - Array of item display names
   * @returns Promise resolving to array of items
   */
  async getItemsByNames(itemNames: string[]): Promise<IMarketItem[]> {
    return this.db.allEntries({ item_name: { $in: itemNames } }) as Promise<IMarketItem[]>;
  }

  /**
   * Saves or updates an item in the database
   * 
   * @param id - Item unique identifier
   * @param item - Item data to save
   * @returns Promise resolving when save is complete
   */
  async saveItem(id: string, item: Partial<IMarketItem>): Promise<void> {
    await this.db.getAnUpdateEntry({ id }, item);
  }

  /**
   * Saves or updates an item by URL name
   * 
   * @param urlName - URL-friendly item name
   * @param item - Item data to save
   * @returns Promise resolving when save is complete
   */
  async saveItemByUrlName(urlName: string, item: Partial<IMarketItem>): Promise<void> {
    await this.db.getAnUpdateEntry({ url_name: urlName }, item);
  }

  /**
   * Removes an item from the database by ID
   * 
   * @param id - Item ID to remove
   * @returns Promise resolving to deletion result
   */
  async removeItemById(id: string): Promise<boolean> {
    const result = await this.db.deleteEntry({ id });
    return !!result;
  }

  /**
   * Removes an item from the database by URL name
   * 
   * @param urlName - URL-friendly item name
   * @returns Promise resolving to deletion result
   */
  async removeItemByUrlName(urlName: string): Promise<boolean> {
    const result = await this.db.deleteEntry({ url_name: urlName });
    return !!result;
  }

  /**
   * Counts total items in the database
   * 
   * @returns Promise resolving to item count
   */
  async countItems(): Promise<number> {
    const result = await this.db.countEntries({});
    return result as number;
  }

  /**
   * Bulk saves multiple items
   * 
   * @param items - Array of items to save
   * @returns Promise resolving when all items are saved
   */
  async saveItems(items: IMarketItem[]): Promise<void> {
    for (const item of items) {
      await this.saveItem(item.id, item);
    }
  }
}
