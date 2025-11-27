/**
 * @fileoverview Service for handling Relic operations
 * @module services/RelicService
 * 
 * Single Responsibility: Manage all Relic-related data operations
 * 
 * Void Relics in Warframe contain prime parts. This service handles
 * fetching relic data, syncing with external APIs, and calculating
 * relic reward values.
 */

import axios from 'axios';
import {
  IRelic,
  IRelicsApiResponse,
  IRelicSyncResult,
  IParsedRelicName
} from '../interfaces/relic.interface';
import { IMarketItem, IProcessedItem, ISetResult } from '../interfaces/market.interface';
import { IDatabaseOperations } from '../interfaces/database.interface';

/**
 * Service for managing Void Relic data
 * 
 * @example
 * ```typescript
 * const relicService = new RelicService(relicRepo, itemRepo);
 * await relicService.syncRelicsFromDrops();
 * const relicData = await relicService.getRelicSetData('lith_a1');
 * ```
 */
export class RelicService {
  /** External API URL for relic drop data */
  private static readonly DROPS_API_URL = 'https://drops.warframestat.us/data/relics.json';

  /**
   * Creates a new RelicService instance
   * 
   * @param relicRepository - Database repository for relic data
   * @param itemRepository - Database repository for item data
   */
  constructor(
    private readonly relicRepository: IDatabaseOperations<any>,
    private readonly itemRepository: IDatabaseOperations<any>
  ) {}

  /**
   * Gets all stored relics from database
   * 
   * @returns Promise resolving to array of relics
   */
  async getAllRelics(): Promise<IRelic[]> {
    return this.relicRepository.allEntries({});
  }

  /**
   * Fetches and syncs relics from the warframestat drops API
   * 
   * @returns Promise resolving to sync result
   */
  async syncRelicsFromDrops(): Promise<IRelicSyncResult> {
    try {
      // Fetch relic data from external API
      const response = await axios.get<IRelicsApiResponse>(RelicService.DROPS_API_URL);
      const allRelics = response.data.relics;

      // Filter to only intact relics (base state)
      const intactRelics = allRelics.filter(relic => relic.state === 'Intact');

      // Save each relic to database
      for (const relic of intactRelics) {
        // Generate consistent relic name format
        const relicName = this.formatRelicName(relic.tier, relic.relicName);

        // Clean up the relic object
        const cleanRelic = { ...relic };
        delete cleanRelic._id;

        await this.relicRepository.getAnUpdateEntry(
          { relicName },
          cleanRelic
        );
      }

      console.log(`✓ Synced ${intactRelics.length} relics`);
      return { success: true, relics: intactRelics.length };
    } catch (error) {
      console.error('✗ Failed to sync relics:', (error as Error).message);
      return { success: false, relics: 0, error: (error as Error).message };
    }
  }

  /**
   * Formats a relic name for database storage
   * 
   * @param tier - Relic tier (Lith, Meso, etc.)
   * @param name - Relic name code (A1, B2, etc.)
   * @returns Formatted relic name
   * @private
   */
  private formatRelicName(tier: string, name: string): string {
    return `${tier.toLowerCase()} ${name}`;
  }

  /**
   * Parses a URL name into relic tier and name components
   * 
   * @param urlName - URL-friendly relic name (e.g., 'lith_a1')
   * @returns Parsed tier and name
   */
  parseRelicUrlName(urlName: string): IParsedRelicName {
    const parts = urlName.split('_');
    return {
      tier: parts[0],
      name: parts[1]?.toUpperCase() ?? ''
    };
  }

  /**
   * Finds a relic by its URL name
   * 
   * @param urlName - URL-friendly relic name
   * @returns Promise resolving to relic or null
   */
  async findRelicByUrlName(urlName: string): Promise<IRelic | null> {
    const { tier, name } = this.parseRelicUrlName(urlName);
    const relicName = `${tier} ${name}`;
    return this.relicRepository.findEntry({ relicName });
  }

  /**
   * Gets relic set data with item prices for display
   * 
   * @param urlName - URL-friendly relic name
   * @param processItem - Function to process items for display
   * @returns Promise resolving to relic set result
   */
  async getRelicSetData(
    urlName: string,
    processItem: (item: IMarketItem) => IProcessedItem | string
  ): Promise<ISetResult> {
    // Get the relic item from market database
    const relicItem: IMarketItem = await this.itemRepository.findEntry({ url_name: urlName });

    if (!relicItem) {
      throw new Error(`Relic item not found in market: ${urlName}`);
    }

    // Parse URL name and find relic data
    const { tier, name } = this.parseRelicUrlName(urlName);
    const relic = await this.relicRepository.findEntry({
      relicName: `${tier} ${name}`
    });

    if (!relic) {
      throw new Error(`Relic data not found: ${tier} ${name}`);
    }

    // Get all reward item names
    const rewardItemNames = relic.rewards.map((reward: any) => reward.itemName);

    // Fetch all reward items from database
    const rewardItems: IMarketItem[] = await this.itemRepository.allEntries({
      item_name: { $in: rewardItemNames }
    });

    // Create "by parts" version with initial zero prices
    const relicByParts = JSON.parse(JSON.stringify(relicItem)) as IMarketItem;
    relicByParts.item_name = `${relicItem.item_name} by Parts`;
    if (relicByParts.market) {
      relicByParts.market.buy = 0;
      relicByParts.market.sell = 0;
    }

    return {
      set: [processItem(relicItem)],
      items: rewardItems.map(item => processItem(item))
    };
  }

  /**
   * Gets a single item from the database by URL name
   * 
   * @param urlName - Item URL name
   * @returns Promise resolving to the item
   */
  async getItemByUrlName(urlName: string): Promise<IMarketItem | null> {
    return this.itemRepository.findEntry({ url_name: urlName });
  }
}
