/**
 * @fileoverview Database-related interfaces
 * @module interfaces/database
 * 
 * Defines interfaces for database operations, configurations, and document types.
 * Follows the Repository pattern for data access abstraction.
 */

import { Document } from 'mongoose';

/**
 * Generic database operations interface
 * Provides a contract for all database repositories to implement
 * 
 * @template T - The document type this repository handles
 */
export interface IDatabaseOperations<T> {
  /**
   * Find a single entry matching the query
   * @param query - Partial object to match against
   * @returns Promise resolving to found entry or null
   */
  findEntry(query: Partial<T>): Promise<T | null>;

  /**
   * Find all entries matching the query
   * @param query - Partial object to match against
   * @returns Promise resolving to array of matching entries
   */
  allEntries(query: Partial<T> | object): Promise<T[]>;

  /**
   * Find all entries with sorting applied
   * @param query - Partial object to match against
   * @param sort - Sort specification (1 for ascending, -1 for descending)
   * @returns Promise resolving to sorted array of entries
   */
  allEntriesSort(query: Partial<T> | object, sort: Record<string, 1 | -1>): Promise<T[]>;

  /**
   * Save a single entry to the database
   * @param entry - Entry to save
   * @returns Promise resolving to saved entry
   */
  saveEntry(entry: T): Promise<T>;

  /**
   * Save multiple entries to the database
   * @param entries - Array of entries to save
   * @returns Promise resolving when all entries are saved
   */
  saveEntries(entries: T[]): Promise<void>;

  /**
   * Update an existing entry or insert if not found (upsert)
   * @param query - Query to find existing entry
   * @param update - Data to update/insert
   * @returns Promise resolving to updated/inserted entry
   */
  getAnUpdateEntry(query: Partial<T>, update: Partial<T>): Promise<T>;

  /**
   * Delete an entry from the database
   * @param query - Query to find entry to delete
   * @returns Promise resolving to deletion success status
   */
  deleteEntry(query: Partial<T>): Promise<boolean>;

  /**
   * Count entries matching the query
   * @param query - Optional query to filter entries
   * @returns Promise resolving to count
   */
  countEntries(query?: Partial<T>): Promise<number>;

  /**
   * Execute an aggregation pipeline
   * @template R - Result type from aggregation
   * @param pipeline - MongoDB aggregation pipeline stages
   * @returns Promise resolving to aggregation results
   */
  aggregate<R>(pipeline: object[]): Promise<R[]>;

  /**
   * Get the underlying Mongoose model
   * @returns The Mongoose model instance
   */
  getModel(): any;
}

/**
 * Database connection configuration
 */
export interface IDatabaseConfig {
  /** MongoDB connection URI */
  uri: string;
  /** Database name */
  dbName?: string;
  /** Connection options */
  options?: {
    /** Maximum connection pool size */
    maxPoolSize?: number;
    /** Server selection timeout in milliseconds */
    serverSelectionTimeoutMS?: number;
    /** Socket timeout in milliseconds */
    socketTimeoutMS?: number;
    /** Whether to use new URL parser */
    useNewUrlParser?: boolean;
    /** Whether to use unified topology */
    useUnifiedTopology?: boolean;
  };
}

/**
 * Item document structure in MongoDB
 */
export interface IItemDocument extends Document {
  /** Unique item identifier */
  id: string;
  /** Display name */
  item_name: string;
  /** URL-friendly name */
  url_name: string;
  /** Thumbnail path */
  thumb: string;
  /** Market pricing data */
  market?: {
    buy: number;
    sell: number;
    buyAvg?: number;
    sellAvg?: number;
    volume?: number;
    avg_price?: number;
  };
  /** Items in this set */
  items_in_set?: Array<{
    url_name: string;
    quantity_for_set?: number;
    mod_max_rank?: number;
    tags: string[];
  }>;
  /** Last price update timestamp */
  priceUpdate?: Date;
}

/**
 * Riven document structure in MongoDB
 */
export interface IRivenDocument extends Document {
  /** URL-friendly name */
  url_name: string;
  /** Display name */
  item_name: string;
  /** Riven auctions data */
  items?: Array<{
    buyout_price: number;
    endo: number;
    endoPerPlat: number;
    owner: {
      status: string;
      ingame_name: string;
    };
    item: {
      mod_rank: number;
      re_rolls: number;
      mastery_level: number;
    };
  }>;
}

/**
 * Relic document structure in MongoDB
 */
export interface IRelicDocument extends Document {
  /** Formatted relic name (e.g., "lith a1") */
  relicName: string;
  /** Relic tier */
  tier: string;
  /** Relic state (Intact, Exceptional, etc.) */
  state: string;
  /** Relic reward drops */
  rewards: Array<{
    itemName: string;
    rarity: string;
    chance: number;
  }>;
}

/**
 * Sync operation result
 */
export interface ISyncResult {
  /** Whether operation was successful */
  success: boolean;
  /** Number of items processed */
  count: number;
  /** Error message if failed */
  error?: string;
}
