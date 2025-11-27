/**
 * @fileoverview Riven mod related interfaces
 * @module interfaces/riven
 * 
 * Contains interfaces for Riven mod data, auctions, and endo calculations.
 * Rivens are randomized mods that can be traded on Warframe Market.
 */

/**
 * Riven item from the API items list
 */
export interface IRivenItem {
  /** URL-friendly name */
  url_name: string;
  /** Display name */
  item_name: string;
  /** Weapon group/category */
  group?: string;
  /** Icon path */
  icon?: string;
  /** Icon format */
  icon_format?: string;
  /** Thumbnail path */
  thumb?: string;
  /** Cached auction items */
  items?: IRivenAuction[];
}

/**
 * Response structure for riven items endpoint
 */
export interface IRivenItemsResponse {
  payload: {
    items: IRivenItem[];
  };
}

/**
 * Single attribute on a riven mod
 */
export interface IRivenAttribute {
  /** Attribute URL name */
  url_name: string;
  /** Whether attribute is positive */
  positive: boolean;
  /** Attribute value */
  value: number;
}

/**
 * Detailed riven mod information in an auction
 */
export interface IRivenModDetails {
  /** Riven type */
  type: string;
  /** Weapon URL name this riven is for */
  weapon_url_name: string;
  /** Custom riven name */
  name: string;
  /** Current mod rank */
  mod_rank: number;
  /** Number of re-rolls */
  re_rolls: number;
  /** Riven polarity */
  polarity: string;
  /** Required mastery level */
  mastery_level: number;
  /** Riven attributes */
  attributes: IRivenAttribute[];
}

/**
 * Auction owner/seller information
 */
export interface IAuctionOwner {
  /** User unique identifier */
  id: string;
  /** In-game name */
  ingame_name: string;
  /** Current online status */
  status: 'ingame' | 'online' | 'offline';
  /** User reputation */
  reputation: number;
  /** User locale */
  locale: string;
  /** User region */
  region: string;
  /** Avatar URL */
  avatar?: string;
  /** Last seen timestamp */
  last_seen: string;
}

/**
 * Single riven auction listing
 */
export interface IRivenAuction {
  /** Auction unique identifier */
  id: string;
  /** Riven mod details */
  item: IRivenModDetails;
  /** Auction owner */
  owner: IAuctionOwner;
  /** Starting bid price */
  starting_price: number;
  /** Instant buyout price */
  buyout_price?: number;
  /** Minimum reputation to bid */
  minimal_reputation: number;
  /** Auction note (formatted) */
  note: string;
  /** Auction note (raw) */
  note_raw: string;
  /** Whether auction is visible */
  visible: boolean;
  /** Trading platform */
  platform: string;
  /** Whether auction is closed */
  closed: boolean;
  /** Whether this is a direct sell */
  is_direct_sell: boolean;
  /** Whether auction is private */
  private: boolean;
  /** Creation timestamp */
  created: string;
  /** Last update timestamp */
  updated: string;
  /** Current top bid */
  top_bid?: number;
  /** Auction winner */
  winner?: unknown;
  /** Calculated endo value (added during processing) */
  endo?: number;
  /** Endo per platinum ratio (added during processing) */
  endoPerPlat?: number;
}

/**
 * Response structure for riven auctions search endpoint
 */
export interface IRivenAuctionsResponse {
  payload: {
    auctions: IRivenAuction[];
  };
}

/**
 * Parameters for endo value calculation
 * 
 * Formula: 100 * (mastery_level - 8) + 22.5 * mod_rank² + 200 * re_rolls
 */
export interface IEndoCalculationParams {
  /** Required mastery level */
  mastery_level: number;
  /** Current mod rank */
  mod_rank: number;
  /** Number of re-rolls */
  re_rolls: number;
}

/**
 * Processed riven with endo calculations
 */
export interface IProcessedRiven extends IRivenAuction {
  /** Calculated endo value */
  endo: number;
  /** Endo per platinum efficiency ratio */
  endoPerPlat: number;
}

/**
 * Riven search parameters for auction queries
 */
export interface IRivenSearchParams {
  /** Weapon URL name */
  weaponUrlName: string;
  /** Polarity filter */
  polarity?: string;
  /** Minimum re-rolls filter */
  reRollsMin?: number;
  /** Buyout policy filter */
  buyoutPolicy?: 'direct' | 'with_top_bid';
  /** Sort order */
  sortBy?: 'price_asc' | 'price_desc';
}

/**
 * Endo calculation constants
 */
export const ENDO_CONSTANTS = {
  /** Base multiplier for mastery level */
  BASE_MULTIPLIER: 100,
  /** Mastery level offset */
  MASTERY_OFFSET: 8,
  /** Multiplier for mod rank squared */
  RANK_MULTIPLIER: 22.5,
  /** Multiplier for re-rolls */
  REROLL_MULTIPLIER: 200
} as const;
