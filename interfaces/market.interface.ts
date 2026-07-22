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
  /** Ducat value when sold to Baro Ki'Teer (from v2 API enrichment) */
  ducats?: number;
  /** Market data including prices */
  market?: IMarketData;
  /** Items included in this set */
  items_in_set?: IItemInSet[];
  /** Last time prices were updated */
  priceUpdate?: Date;
  /** Item added to set calculation */
  item_in_set?: IItemInSet;
  /** Whether item was enriched with v2 API data */
  v2_enriched?: boolean;
  /** Timestamp when v2 enrichment was performed */
  v2_enriched_at?: Date;
  /** Maximum amber stars for Ayatan sculptures (from v2 API) */
  max_amber_stars?: number;
  /** Maximum cyan stars for Ayatan sculptures (from v2 API) */
  max_cyan_stars?: number;
  /** Base endo value for Ayatan sculptures (from v2 API) */
  base_endo?: number;
  /** Endo multiplier for Ayatan sculptures (from v2 API) */
  endo_multiplier?: number;
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
  /** Stored price snapshot for every tradeable rank. */
  rankPrices?: {
    maxRank: number;
    updatedAt: string;
    ranks: Array<{
      rank: number;
      ask: number;
      bid: number;
      avg_price: number;
      volume: number;
      sellCount: number;
      buyCount: number;
    }>;
  };
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
  /** Ducat value when sold to Baro Ki'Teer (Ducat efficiency page) */
  ducats?: number;
  /** Whether the item is vaulted (Vaulted investment page) */
  vaulted?: boolean;
  /** Maximum tradeable rank; present for mods, arcanes and other ranked items. */
  maxRank?: number;
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

/**
 * One price level of the stored order-book ladder (see OrderCalculator.depthLadder).
 */
export interface IDepthLevel {
  price: number;
  quantity: number;
  orders: number;
}

/**
 * Market block for the set detail page.
 *
 * Wider than {@link IProcessedItem}'s: it keeps the whole `last_completed`
 * datapoint (median / moving_avg / min / max) and the depth ladder, so the page
 * can price a set under several bases — instant, top-5 average, 48h traded
 * average, median, and an order-book walk — instead of best-bid/best-ask only.
 */
export interface ISetFullMarket {
  /** Highest buy order (what you RECEIVE when selling) */
  buy: number;
  /** Lowest sell order (what you PAY to acquire) */
  sell: number;
  /** sell - buy */
  diff: number;
  /** Average of the top 5 buy orders */
  buyAvg?: number;
  /** Average of the top 5 sell orders */
  sellAvg?: number;
  /** Trade volume over the last 48h */
  volume?: number;
  /** 48h volume-weighted average of completed trades */
  avg_price?: number;
  /** Latest closed 48h datapoint: median, moving_avg, min_price, max_price */
  last_completed?: IStatisticsDataPoint | null;
  /** Dominant order variant (e.g. a relic's 'intact'), matching the depth ladder */
  subtype?: string;
}

/**
 * A single item (the set itself, or one of its parts) on the set detail page.
 */
export interface ISetFullNode {
  item_name: string;
  url_name: string;
  thumb: string;
  tags: string[];
  /** Ducat value at Baro Ki'Teer (v2 enrichment; may be undefined) */
  ducats?: number;
  /** Vault status (v2 enrichment; may be undefined) */
  vaulted?: boolean;
  /** When this item's prices were last synced */
  priceUpdate?: Date;
  /** How many of this part one set requires (1 for the set node itself) */
  quantity_for_set: number;
  market: ISetFullMarket;
  /** Stored order-book ladder, when the sync captured one */
  depth?: { buy: IDepthLevel[]; sell: IDepthLevel[] };
  /** Trimmed daily price series plus its trend */
  history: {
    points: Array<{ date: string; buy: number; sell: number; avg_price: number; volume: number }>;
    trend: { direction: 'up' | 'down' | 'flat'; changePercent: number };
  };
}

/**
 * Bundled payload for the set detail page: the set, every part, and everything
 * the page needs to compare them (quantities, full market blocks, depth ladders
 * and price history) in ONE cached request.
 *
 * Deliberately carries no synthetic "by Parts" row — the client derives parts
 * totals per pricing basis, which is why `quantity_for_set` must ship.
 */
export interface ISetFullResult {
  set: ISetFullNode;
  parts: ISetFullNode[];
  meta: {
    generatedAt: string;
    /** Stalest priceUpdate across set + parts (drives the freshness label) */
    oldestPriceUpdate: string | null;
    /** Freshest priceUpdate across set + parts */
    newestPriceUpdate: string | null;
    /** Longest stored series across set + parts, in days */
    historyDays: number;
    partsCount: number;
    pricedParts: number;
  };
}

/**
 * A single row in the "set vs parts" comparison table.
 *
 * Price semantics (warframe.market): `sell` = lowest sell order = what you PAY to
 * acquire; `buy` = highest buy order = what you RECEIVE when selling. So the
 * acquire perspective uses `sell` prices and the resale perspective uses `buy`.
 */
export interface ISetComparisonRow {
  /** Set display name (e.g. "Latron Prime Set") */
  item_name: string;
  /** URL-friendly set name, used for the /set/<url_name> detail link */
  url_name: string;
  /** Thumbnail image path (warframe.market static asset) */
  thumb: string;
  /** Tags for categorization (warframe, primary, melee, ...) */
  tags: string[];
  /** Number of distinct parts the set is composed of */
  partsCount: number;
  /** Parts that had usable market prices */
  pricedParts: number;
  /** Parts with no market price (comparison is a lower bound when > 0) */
  missingParts: number;
  /** The assembled-set market data */
  set: { buy: number; sell: number; volume: number };
  /** Summed part prices (buy = resale total, sell = acquire total) */
  byParts: { buy: number; sell: number };
  /** Buyer's view: cost to acquire the set vs the parts */
  acquire: {
    /** Cost to buy the assembled set (set.sell) */
    setCost: number;
    /** Cost to buy every part (Σ part.sell × quantity) */
    partsCost: number;
    /** setCost - partsCost; positive => buying by parts is cheaper */
    save: number;
    /** save as a percentage of setCost */
    savePct: number;
  };
  /** Seller's view: resale value of the set vs the parts */
  resale: {
    /** Resale value of the assembled set (set.buy) */
    setValue: number;
    /** Resale value of every part (Σ part.buy × quantity) */
    partsValue: number;
    /** partsValue - setValue; positive => selling by parts yields more */
    extra: number;
    /** extra as a percentage of setValue */
    extraPct: number;
  };
}
