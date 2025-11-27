/**
 * @fileoverview Service for handling set-related calculations and operations
 * @module services/SetService
 * 
 * Single Responsibility: Calculate "by parts" pricing for item sets and relics.
 * This service handles the logic for computing the total value of sets
 * based on individual part prices.
 */

import { IMarketItem, IProcessedItem, ISetResult } from '../interfaces/market.interface';
import { ItemService } from './ItemService';
import { RelicService } from './RelicService';

/**
 * Service for handling set calculations and comparisons
 * 
 * @example
 * ```typescript
 * const setService = new SetService(itemService, relicService, processItemFn);
 * const setData = await setService.getSetData('ash_prime_set');
 * ```
 */
export class SetService {
  /**
   * Creates a new SetService instance
   * 
   * @param itemService - Item database service
   * @param relicService - Relic data service
   * @param processItem - Function to process items for display
   */
  constructor(
    private readonly itemService: ItemService,
    private readonly relicService: RelicService,
    private readonly processItem: (item: IMarketItem) => IProcessedItem | string
  ) {}

  /**
   * Gets set pricing data including individual parts and total "by parts" price
   * 
   * @param urlName - URL-friendly set name
   * @returns Promise resolving to set data with item prices
   */
  async getSetData(urlName: string): Promise<ISetResult> {
    // Get the set item from database
    const setItem = await this.itemService.getItemByUrlName(urlName);
    
    if (!setItem) {
      throw new Error(`Set not found: ${urlName}`);
    }

    if (!setItem.items_in_set || setItem.items_in_set.length === 0) {
      throw new Error(`Set has no items: ${urlName}`);
    }

    // Get all parts that aren't the set itself
    const partUrlNames = setItem.items_in_set
      .filter(item => item.url_name !== urlName)
      .map(item => item.url_name);

    // Fetch all parts from database
    let parts = await this.itemService.getItemsByUrlNames(partUrlNames);

    // Attach set information to each part
    parts = parts.map(part => {
      const itemInSet = setItem.items_in_set?.find(x => x.url_name === part.url_name);
      return {
        ...part,
        item_in_set: itemInSet
      };
    });

    // Calculate "by parts" price
    const setByParts = this.calculateByPartsPrice(setItem, parts);

    return {
      set: [this.processItem(setItem), this.processItem(setByParts)],
      items: parts.map(part => this.processItem(part))
    };
  }

  /**
   * Calculates the "by parts" price for a set
   * 
   * @param setItem - The complete set item
   * @param parts - Array of individual parts with item_in_set info
   * @returns Set item with "by parts" pricing
   * @private
   */
  private calculateByPartsPrice(
    setItem: IMarketItem,
    parts: Array<IMarketItem & { item_in_set?: any }>
  ): IMarketItem {
    // Create a deep copy of the set item
    const byParts: IMarketItem = JSON.parse(JSON.stringify(setItem));
    byParts.item_name = `${setItem.item_name} by Parts`;

    // Calculate total buy and sell prices from parts
    if (byParts.market) {
      byParts.market.buy = parts.reduce((total, part) => {
        const quantity = part.item_in_set?.quantity_for_set ?? 1;
        const buyPrice = part.market?.buy ?? 0;
        return total + (buyPrice * quantity);
      }, 0);

      byParts.market.sell = parts.reduce((total, part) => {
        const quantity = part.item_in_set?.quantity_for_set ?? 1;
        const sellPrice = part.market?.sell ?? 0;
        return total + (sellPrice * quantity);
      }, 0);
    }

    return byParts;
  }

  /**
   * Gets relic set data with associated item prices
   * 
   * @param urlName - URL-friendly relic name (e.g., "lith_a1")
   * @returns Promise resolving to relic set with item prices
   */
  async getRelicSetData(urlName: string): Promise<ISetResult> {
    return this.relicService.getRelicSetData(urlName, this.processItem);
  }

  /**
   * Compares set price vs by-parts price
   * 
   * @param urlName - URL-friendly set name
   * @returns Promise resolving to price comparison data
   */
  async getSetComparison(urlName: string): Promise<{
    setName: string;
    setPrice: { buy: number; sell: number };
    byPartsPrice: { buy: number; sell: number };
    savings: { buy: number; sell: number };
  }> {
    const setData = await this.getSetData(urlName);
    
    const setItem = setData.set[0];
    const byPartsItem = setData.set[1];

    if (typeof setItem === 'string' || typeof byPartsItem === 'string') {
      throw new Error(`Invalid set data for: ${urlName}`);
    }

    return {
      setName: setItem.item_name,
      setPrice: {
        buy: setItem.market.buy,
        sell: setItem.market.sell
      },
      byPartsPrice: {
        buy: byPartsItem.market.buy,
        sell: byPartsItem.market.sell
      },
      savings: {
        buy: byPartsItem.market.buy - setItem.market.buy,
        sell: byPartsItem.market.sell - setItem.market.sell
      }
    };
  }
}
