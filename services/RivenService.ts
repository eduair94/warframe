/**
 * @fileoverview Service for handling Riven mod operations
 * @module services/RivenService
 * 
 * Single Responsibility: Manage all Riven-related data operations
 * 
 * Rivens are randomized mods that can be traded on Warframe Market.
 * This service handles fetching, processing, and analyzing riven auctions.
 * 
 * Dependency Inversion: Depends on IHttpClient interface, not concrete implementation.
 * This allows the service to work with both axios (HttpService) and undici (UndiciHttpService).
 */

import { IHttpClient } from '../interfaces/http.interface';
import { IDatabaseOperations } from '../interfaces/database.interface';
import { ENDO_CONSTANTS, API_URLS, RIVEN_DEFAULTS, AGGREGATION } from '../constants';

// Debug mode - set DEBUG=true environment variable for verbose logging
const DEBUG = process.env.DEBUG === 'true';

/**
 * Represents a Riven item from the API
 */
export interface IRivenItem {
  id: string;
  url_name: string;
  item_name: string;
  thumb: string;
  group: string;
  riven_type: string;
}

/**
 * Represents a Riven auction
 */
export interface IRivenAuction {
  id: string;
  buyout_price: number | null;
  starting_price: number;
  owner: {
    status: string;
    ingame_name: string;
  };
  item: {
    weapon_url_name: string;
    mod_rank: number;
    re_rolls: number;
    mastery_level: number;
    attributes: Array<{
      url_name: string;
      value: number;
      positive: boolean;
    }>;
  };
}

/**
 * Processed Riven with endo calculations
 */
export interface IProcessedRiven extends IRivenAuction {
  endo: number;
  endoPerPlat: number;
}

/**
 * Parameters for endo calculation
 */
export interface IEndoParams {
  mastery_level: number;
  mod_rank: number;
  re_rolls: number;
}

/**
 * Parameters for searching auctions
 */
export interface IRivenSearchParams {
  weaponUrlName: string;
  polarity?: string;
  reRollsMin?: number;
  buyoutPolicy?: 'direct' | 'with' | 'without';
  sortBy?: 'price_asc' | 'price_desc';
}

/**
 * Service for managing Riven mod data and auctions
 * 
 * @example
 * ```typescript
 * // Works with any IHttpClient implementation
 * const rivenService = new RivenService(httpService, rivenRepository);
 * const topRivens = await rivenService.getTopEndoRivens(10);
 * ```
 */
export class RivenService {
  /**
   * Creates a new RivenService instance
   * 
   * @param httpClient - HTTP client implementing IHttpClient interface
   * @param repository - Database repository for riven data
   */
  constructor(
    private readonly httpClient: IHttpClient,
    private readonly repository: IDatabaseOperations<any>
  ) {}

  // =====================================
  // ENDO CALCULATION (Static methods for reuse)
  // =====================================

  /**
   * Calculates the endo value of a riven mod
   * 
   * Formula: 100 * (mastery_level - 8) + 22.5 * mod_rank² + 200 * re_rolls
   * 
   * @param params - Endo calculation parameters
   * @returns Calculated endo value
   */
  static calculateEndo(params: IEndoParams): number {
    const { mastery_level, mod_rank, re_rolls } = params;
    
    return (
      ENDO_CONSTANTS.BASE_MULTIPLIER * (mastery_level - ENDO_CONSTANTS.MASTERY_OFFSET) +
      ENDO_CONSTANTS.RANK_MULTIPLIER * Math.pow(mod_rank, 2) +
      ENDO_CONSTANTS.REROLL_MULTIPLIER * re_rolls
    );
  }

  /**
   * Calculates endo per platinum efficiency ratio
   * 
   * @param endo - Calculated endo value
   * @param price - Platinum price
   * @returns Endo per platinum ratio (rounded to 2 decimal places)
   */
  static calculateEndoPerPlat(endo: number, price: number): number {
    if (price <= 0) return 0;
    return Math.round((endo / price) * 100) / 100;
  }

  // Instance method that delegates to static
  calculateEndo(params: IEndoParams): number {
    return RivenService.calculateEndo(params);
  }

  // =====================================
  // API METHODS
  // =====================================

  /**
   * Fetches all riven items from the API
   * 
   * @returns Promise resolving to array of riven items
   */
  async fetchAllRivenItems(): Promise<IRivenItem[]> {
    const response = await this.httpClient.get<{ payload: { items: IRivenItem[] } }>(
      `${API_URLS.WARFRAME_MARKET}/riven/items`
    );
    return response.payload.items;
  }

  /**
   * Searches for riven auctions with specified parameters
   * 
   * @param params - Search parameters
   * @returns Promise resolving to array of auctions
   */
  async searchAuctions(params: IRivenSearchParams): Promise<IRivenAuction[]> {
    const queryParams = new URLSearchParams({
      type: 'riven',
      weapon_url_name: params.weaponUrlName,
      polarity: params.polarity ?? 'any',
      re_rolls_min: (params.reRollsMin ?? RIVEN_DEFAULTS.MIN_REROLLS).toString(),
      buyout_policy: params.buyoutPolicy ?? 'direct',
      sort_by: params.sortBy ?? 'price_asc'
    });

    const response = await this.httpClient.get<{ payload: { auctions: IRivenAuction[] } }>(
      `${API_URLS.WARFRAME_MARKET}/auctions/search?${queryParams.toString()}`
    );

    return response.payload.auctions;
  }

  // =====================================
  // DATABASE METHODS
  // =====================================

  /**
   * Saves all riven items to the database
   * 
   * @returns Promise resolving to count of items saved
   */
  async saveAllRivenItems(): Promise<{ upserted: number; skipped: number }> {
    const items = await this.fetchAllRivenItems();
    if (DEBUG) console.log(`✓ Fetched ${items.length} riven items`);
    
    let upsertedCount = 0;
    let skippedCount = 0;

    for (const riven of items) {
      try {
        await this.repository.getAnUpdateEntry({ id: riven.id }, riven);
        upsertedCount++;
      } catch (error: any) {
        if (error.code === 11000) {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    if (DEBUG) console.log(`✓ Rivens: ${upsertedCount} upserted, ${skippedCount} skipped`);
    return { upserted: upsertedCount, skipped: skippedCount };
  }

  /**
   * Gets all stored riven items from database
   * 
   * @returns Promise resolving to array of riven items
   */
  async getAllRivens(): Promise<IRivenItem[]> {
    return this.repository.allEntries({});
  }

  // =====================================
  // AUCTION PROCESSING
  // =====================================

  /**
   * Processes riven auctions to add endo calculations
   * 
   * @param auctions - Raw auction data
   * @returns Processed auctions with endo data
   */
  processAuctionsWithEndo(auctions: IRivenAuction[]): IProcessedRiven[] {
    return auctions
      .filter(auction => auction.buyout_price != null && auction.buyout_price > 0)
      .map(auction => {
        const { mod_rank, re_rolls, mastery_level } = auction.item;

        const endo = RivenService.calculateEndo({
          mastery_level,
          mod_rank,
          re_rolls
        });

        const endoPerPlat = RivenService.calculateEndoPerPlat(endo, auction.buyout_price!);

        return {
          ...auction,
          endo,
          endoPerPlat
        };
      });
  }

  /**
   * Syncs riven auction data for a specific weapon
   * 
   * @param riven - Riven item to sync
   */
  async syncSingleRiven(riven: IRivenItem): Promise<void> {
    try {
      const auctions = await this.searchAuctions({
        weaponUrlName: riven.url_name,
        reRollsMin: RIVEN_DEFAULTS.MIN_REROLLS,
        buyoutPolicy: 'direct',
        sortBy: 'price_asc'
      });

      const processedAuctions = this.processAuctionsWithEndo(auctions);

      await this.repository.getAnUpdateEntry(
        { url_name: riven.url_name },
        { items: processedAuctions }
      );
    } catch (error: any) {
      if (DEBUG) console.log(`⟳ Retrying riven sync for ${riven.item_name}:`, error.message);
      return this.syncSingleRiven(riven);
    }
  }

  /**
   * Syncs all riven auctions with progress logging
   * 
   * @param onProgress - Optional progress callback
   */
  async syncAllRivenAuctions(
    onProgress?: (current: number, total: number, itemName: string) => void
  ): Promise<void> {
    const allRivens = await this.getAllRivens();
    let idx = 1;

    for (const riven of allRivens) {
      if (onProgress) {
        onProgress(idx, allRivens.length, riven.item_name);
      } else if (DEBUG || idx % 10 === 0 || idx === allRivens.length) {
        // Only log every 10 items or at the end, unless in DEBUG mode
        console.log(`Loading ${idx}/${allRivens.length}: ${riven.item_name}`);
      }

      await this.syncSingleRiven(riven);
      idx++;
    }
  }

  /**
   * Gets top rivens by endo per platinum efficiency
   * 
   * @param limit - Maximum number of rivens to return
   * @returns Promise resolving to top rivens
   */
  async getTopEndoRivens(limit: number = AGGREGATION.DEFAULT_LIMIT): Promise<IProcessedRiven[]> {
    const aggregationPipeline = [
      { $unwind: '$items' },
      { $match: { 'items.owner.status': 'ingame' } },
      { $sort: { 'items.endoPerPlat': -1 } },
      { $limit: limit }
    ];

    const model = this.repository.getModel();
    
    return new Promise((resolve, reject) => {
      model.aggregate(aggregationPipeline).exec((err: Error | null, result: IProcessedRiven[]) => {
        if (err) {
          console.error('Error executing aggregation:', err);
          reject(err);
        } else {
          resolve(result || []);
        }
      });
    });
  }
}
