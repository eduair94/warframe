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

import { IMarketItem, IProcessedItem, ISetFullNode } from '../interfaces/market.interface';

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
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate, ducats, vaulted } = item;

    // Validate required fields
    if (!market) return "";
    if (!items_in_set || items_in_set.length === 0) return "";

    const { tags, mod_max_rank } = items_in_set[0];

    return {
      item_name,
      thumb,
      market: {
        buy: market.buy,
        sell: market.sell,
        diff: market.sell - market.buy,
        buyAvg: market.buyAvg,
        sellAvg: market.sellAvg,
        volume: market.volume,
        avg_price: market.avg_price,
        last_completed: market.last_completed
      },
      url_name,
      tags,
      set: items_in_set.length > 1,
      // Exposed for the analytics pages (Ducat efficiency, Vaulted investment).
      // Both come from the v2 API enrichment (see MarketService); may be undefined
      // for items that haven't been enriched yet.
      ducats,
      vaulted,
      maxRank: mod_max_rank,
      priceUpdate
    } as IProcessedItem;
  }

  /**
   * Processes an item for the SET DETAIL page.
   *
   * Deliberately a separate method rather than a widening of
   * {@link processForDisplay}: the catalogue endpoint, `/set`, `/relic` and the
   * analytics aggregates all depend on that method's exact (deliberately light)
   * shape, and `last_completed` + `depth` would bloat every one of them.
   *
   * What this adds over processForDisplay:
   *  - `quantity_for_set` — how many of this part a set needs. Stripped by
   *    processForDisplay, but without it parts totals are wrong for any set that
   *    needs 2× of a component.
   *  - the whole `last_completed` datapoint (median / moving_avg / min / max),
   *    which backs the "median" pricing basis.
   *  - `market.depth` + `market.subtype`, which back the order-book "bulk" basis.
   *
   * Validity guards match processForDisplay, so an unpriced part is DROPPED
   * rather than silently summed in as 0.
   *
   * @param item - Raw market item from the database
   * @param quantity - How many of this item one set requires (defaults to 1)
   * @returns A set-detail node, or "" when the item is unusable
   */
  static processForSetDetail(item: IMarketItem, quantity = 1): ISetFullNode | string {
    if (!item) return "";
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate, ducats, vaulted } =
      item as IMarketItem & { market?: any };

    // Same guards as processForDisplay — no market block or no set membership
    // means we cannot price it, and a zero would corrupt the parts total.
    if (!market) return "";
    if (!items_in_set || items_in_set.length === 0) return "";

    const { tags } = items_in_set[0] as { tags?: string[] };

    const qty = Number.isFinite(quantity) && (quantity as number) > 0 ? Math.floor(quantity) : 1;

    const node: ISetFullNode = {
      item_name,
      url_name,
      thumb,
      tags: tags ?? [],
      ducats,
      vaulted,
      priceUpdate,
      quantity_for_set: qty,
      market: {
        buy: market.buy,
        sell: market.sell,
        diff: (market.sell ?? 0) - (market.buy ?? 0),
        buyAvg: market.buyAvg,
        sellAvg: market.sellAvg,
        volume: market.volume,
        avg_price: market.avg_price,
        last_completed: market.last_completed ?? null,
        subtype: market.subtype,
      },
      // Empty ladders are omitted so the client can test `depth` for truthiness.
      depth:
        market.depth && (market.depth.buy?.length || market.depth.sell?.length)
          ? { buy: market.depth.buy ?? [], sell: market.depth.sell ?? [] }
          : undefined,
      // Filled in by SetService from the batched history read.
      history: { points: [], trend: { direction: 'flat', changePercent: 0 } },
    };

    return node;
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
