/**
 * @fileoverview Market-related interfaces for Warframe Market API
 * @module interfaces/market
 * 
 * Contains all TypeScript interfaces for interacting with the Warframe Market API,
 * including items, orders, statistics, and processed data structures.
 */

/**
 * Represents the response structure from Warframe Market API for items list
 */
export interface IWarframeItemsResponse {
  payload: {
    items: IMarketItem[];
  };
}

/**
 * Represents a single market item from the API
 */
export interface IMarketItem {
  /** Unique identifier for the item */
  id: string;
  /** Display name of the item */
  item_name: string;
  /** URL-friendly name for API requests */
  url_name: string;
  /** Thumbnail image path */
  thumb: string;
  /** Whether the item is vaulted (prime items) */
  vaulted?: boolean;
  /** Market data including prices */
  market?: IMarketData;
  /** Items included in this set */
  items_in_set?: IItemInSet[];
  /** Last time prices were updated */
  priceUpdate?: Date;
  /** Item added to set calculation */
  item_in_set?: IItemInSet;
}

/**
 * Market price data for an item
 */
export interface IMarketData {
  /** Highest buy order price */
  buy: number;
  /** Lowest sell order price */
  sell: number;
  /** Average of top 5 buy orders */
  buyAvg?: number;
  /** Average of top 5 sell orders */
  sellAvg?: number;
  /** Trade volume in last 48 hours */
  volume?: number;
  /** Average price from completed trades */
  avg_price?: number;
  /** Price difference (sell - buy) */
  diff?: number;
  /** Most recent completed transaction data */
  last_completed?: IStatisticsDataPoint | null;
}

/**
 * Represents an item within a set
 */
export interface IItemInSet {
  /** Unique identifier */
  id: string;
  /** URL-friendly name */
  url_name: string;
  /** Thumbnail image path */
  thumb: string;
  /** Maximum mod rank (for mods only) */
  mod_max_rank?: number;
  /** Item rarity */
  rarity: string;
  /** Item tags for categorization */
  tags: string[];
  /** Trading tax in credits */
  trading_tax: number;
  /** Quantity needed for complete set */
  quantity_for_set?: number;
  /** Full icon path */
  icon: string;
  /** Icon format (e.g., 'land') */
  icon_format: string;
  /** Sub icon path */
  sub_icon?: string;
}

/**
 * Single order from Warframe Market
 */
export interface IOrder {
  /** Order unique identifier */
  id: string;
  /** Order type: buy or sell */
  order_type: 'buy' | 'sell';
  /** Platinum price */
  platinum: number;
  /** Quantity available */
  quantity: number;
  /** Mod rank (for mods only) */
  mod_rank?: number;
  /** Whether order is visible */
  visible: boolean;
  /** Trading platform */
  platform: string;
  /** Trading region */
  region: string;
  /** Order creation date */
  creation_date: string;
  /** Last update timestamp */
  last_update: string;
  /** User who placed the order */
  user: IOrderUser;
}

/**
 * User information attached to an order
 */
export interface IOrderUser {
  /** User unique identifier */
  id: string;
  /** In-game name */
  ingame_name: string;
  /** Current online status */
  status: 'ingame' | 'online' | 'offline';
  /** User reputation score */
  reputation: number;
  /** User locale */
  locale: string;
  /** User region */
  region: string;
  /** Avatar image URL */
  avatar?: string;
  /** Last seen timestamp */
  last_seen: string;
}

/**
 * Response structure for orders endpoint
 */
export interface IOrdersResponse {
  payload: {
    orders: IOrder[];
  };
}

/**
 * Single statistics data point from Warframe Market
 */
export interface IStatisticsDataPoint {
  /** Timestamp of the data point */
  datetime: string;
  /** Trade volume */
  volume: number;
  /** Minimum price in period */
  min_price: number;
  /** Maximum price in period */
  max_price: number;
  /** Average price */
  avg_price: number;
  /** Weighted average price */
  wa_price: number;
  /** Median price */
  median: number;
  /** Mod rank for mod items */
  mod_rank?: number;
  /** Data point identifier */
  id: string;
  /** Opening price (closed stats only) */
  open_price?: number;
  /** Closing price (closed stats only) */
  closed_price?: number;
  /** Donchian channel top */
  donch_top?: number;
  /** Donchian channel bottom */
  donch_bot?: number;
  /** Moving average */
  moving_avg?: number;
}

/**
 * Response structure for statistics endpoint
 */
export interface IStatisticsResponse {
  payload: {
    statistics_closed: {
      '48hours': IStatisticsDataPoint[];
      '90days': IStatisticsDataPoint[];
    };
    statistics_live: {
      '48hours': IStatisticsDataPoint[];
      '90days': IStatisticsDataPoint[];
    };
  };
}

/**
 * Processed item data optimized for frontend display
 */
export interface IProcessedItem {
  /** Display name */
  item_name: string;
  /** Thumbnail path */
  thumb: string;
  /** URL-friendly name */
  url_name: string;
  /** Market data with calculated diff */
  market: IMarketData & { diff: number };
  /** Item tags */
  tags: string[];
  /** Whether item is part of a set */
  set: boolean;
  /** Last price update timestamp */
  priceUpdate?: Date;
}

/**
 * Complete price calculation result
 */
export interface IPriceResult {
  /** Highest buy order price */
  buy: number;
  /** Lowest sell order price */
  sell: number;
  /** Average of top buy orders */
  buyAvg: number;
  /** Average of top sell orders */
  sellAvg: number;
  /** Trade volume in last 48 hours */
  volume: number;
  /** Average price from statistics */
  avg_price: number;
  /** Last completed transaction data */
  last_completed: IStatisticsDataPoint | null;
  /** Whether item was not found in API */
  not_found?: boolean;
}

/**
 * Result of set price calculation
 */
export interface ISetResult {
  /** Set items (main set and "by parts" version) */
  set: (IProcessedItem | string)[];
  /** Individual parts of the set */
  items: (IProcessedItem | string)[];
}
