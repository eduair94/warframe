/**
 * @fileoverview Service for handling set-related calculations and operations
 * @module services/SetService
 * 
 * Single Responsibility: Calculate "by parts" pricing for item sets and relics.
 * This service handles the logic for computing the total value of sets
 * based on individual part prices.
 */

import { IMarketItem, IProcessedItem, ISetComparisonRow, ISetResult } from '../interfaces/market.interface';
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
      items: parts.map(part => this.processItem(part)).filter(item => item !== '')
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
   * Builds a "set vs parts" comparison row for every multi-part set found in a
   * preloaded item array.
   *
   * This is a **pure** function: it performs no database or network access, so
   * the caller loads every item once (a single `getAllItems()` read) and this
   * method resolves each set's parts against an in-memory map — avoiding the
   * N+1 queries that per-set lookups would incur.
   *
   * A set is any item whose `item_name` contains `" Set"` and that has more than
   * one entry in `items_in_set`. Parts without a market price are counted in
   * `missingParts` and excluded from the totals (so the comparison is a lower
   * bound on part totals when `missingParts > 0`).
   *
   * @param items - All raw market items from the database
   * @returns One comparison row per qualifying set
   */
  buildComparisonFromItems(items: IMarketItem[]): ISetComparisonRow[] {
    const byUrl = new Map<string, IMarketItem>();
    for (const item of items) {
      if (item && item.url_name) byUrl.set(item.url_name, item);
    }

    const rows: ISetComparisonRow[] = [];

    for (const setItem of items) {
      if (!setItem || !setItem.item_name || !setItem.market) continue;
      if (!setItem.item_name.includes(' Set')) continue;
      if (!setItem.items_in_set || setItem.items_in_set.length <= 1) continue;

      // Every entry except the set item itself is a part to buy/assemble.
      const partRefs = setItem.items_in_set.filter(
        (part) => part.url_name !== setItem.url_name
      );
      if (partRefs.length === 0) continue;

      let partsSell = 0; // acquire total (Σ part.sell × qty)
      let partsBuy = 0; // resale total (Σ part.buy × qty)
      let missingParts = 0;
      let pricedParts = 0;

      for (const ref of partRefs) {
        const part = byUrl.get(ref.url_name);
        const quantity = ref.quantity_for_set ?? 1;
        const sell = part?.market?.sell ?? 0;
        const buy = part?.market?.buy ?? 0;

        if (!part || !part.market || (!sell && !buy)) {
          missingParts++;
          continue;
        }

        partsSell += sell * quantity;
        partsBuy += buy * quantity;
        pricedParts++;
      }

      const setSell = setItem.market.sell ?? 0;
      const setBuy = setItem.market.buy ?? 0;

      const acquireSave = setSell - partsSell; // >0 => parts cheaper to buy
      const resaleExtra = partsBuy - setBuy; // >0 => parts resell for more

      rows.push({
        item_name: setItem.item_name,
        url_name: setItem.url_name,
        thumb: setItem.thumb,
        tags: setItem.items_in_set[0]?.tags ?? [],
        partsCount: partRefs.length,
        pricedParts,
        missingParts,
        set: {
          buy: setBuy,
          sell: setSell,
          volume: setItem.market.volume ?? 0,
        },
        byParts: {
          buy: partsBuy,
          sell: partsSell,
        },
        acquire: {
          setCost: setSell,
          partsCost: partsSell,
          save: acquireSave,
          savePct: setSell > 0 ? (acquireSave / setSell) * 100 : 0,
        },
        resale: {
          setValue: setBuy,
          partsValue: partsBuy,
          extra: resaleExtra,
          extraPct: setBuy > 0 ? (resaleExtra / setBuy) * 100 : 0,
        },
      });
    }

    return rows;
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
