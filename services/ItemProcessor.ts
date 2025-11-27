/**
 * @fileoverview Utility for processing items for display
 * @module services/ItemProcessor
 * 
 * Single Responsibility: Transform raw market items into display-ready format.
 * Pure utility class with no side effects or dependencies.
 * 
 * This centralizes the item processing logic that was duplicated across
 * multiple classes (WarframeUndici, WarframeFacade, etc.)
 */

import { IMarketItem, IProcessedItem } from '../interfaces/market.interface';

/**
 * Utility class for processing market items
 * 
 * @example
 * ```typescript
 * const processed = ItemProcessor.processForDisplay(item);
 * // Use in array operations
 * const items = rawItems.map(ItemProcessor.processForDisplay).filter(Boolean);
 * ```
 */
export class ItemProcessor {
  /**
   * Processes a market item for frontend display
   * 
   * Transforms a full market item into a lighter format suitable
   * for display in lists and search results.
   * 
   * @param item - Raw market item from database
   * @returns Processed item or empty string if invalid
   */
  static processForDisplay(item: IMarketItem): IProcessedItem | string {
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate } = item;
    
    // Validate required fields
    if (!market) return "";
    if (!items_in_set || items_in_set.length === 0) return "";
    
    const { tags } = items_in_set[0];
    
    return {
      item_name,
      thumb,
      market: {
        buy: market.buy,
        sell: market.sell,
        diff: market.sell - market.buy
      },
      url_name,
      tags,
      set: items_in_set.length > 1,
      priceUpdate
    } as IProcessedItem;
  }

  /**
   * Processes an array of items, filtering out invalid ones
   * 
   * @param items - Array of raw market items
   * @returns Array of processed items (invalid items filtered out)
   */
  static processMany(items: IMarketItem[]): IProcessedItem[] {
    return items
      .map(item => this.processForDisplay(item))
      .filter((item): item is IProcessedItem => item !== "");
  }

  /**
   * Creates a "by parts" variant of a set item
   * 
   * @param setItem - The original set item
   * @param parts - Array of parts with their prices
   * @returns A new item representing the "by parts" price
   */
  static createByPartsItem(
    setItem: IMarketItem,
    parts: Array<IMarketItem & { item_in_set?: { quantity_for_set?: number } }>
  ): IMarketItem {
    // Deep clone the set item
    const byParts: IMarketItem = JSON.parse(JSON.stringify(setItem));
    byParts.item_name = `${setItem.item_name} by Parts`;

    if (byParts.market) {
      // Calculate total buy price from parts
      byParts.market.buy = parts.reduce((total, part) => {
        const quantity = part.item_in_set?.quantity_for_set ?? 1;
        const buyPrice = part.market?.buy ?? 0;
        return total + (buyPrice * quantity);
      }, 0);

      // Calculate total sell price from parts
      byParts.market.sell = parts.reduce((total, part) => {
        const quantity = part.item_in_set?.quantity_for_set ?? 1;
        const sellPrice = part.market?.sell ?? 0;
        return total + (sellPrice * quantity);
      }, 0);
    }

    return byParts;
  }

  /**
   * Checks if an item is a valid market item
   * 
   * @param item - Item to validate
   * @returns True if item has required fields
   */
  static isValidMarketItem(item: Partial<IMarketItem>): item is IMarketItem {
    return !!(
      item.id &&
      item.url_name &&
      item.item_name &&
      item.market &&
      item.items_in_set?.length
    );
  }
}
