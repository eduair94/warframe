/**
 * @fileoverview Relic related interfaces
 * @module interfaces/relic
 * 
 * Contains interfaces for Void Relic data and reward calculations.
 * Relics contain prime parts that drop when opened.
 */

/**
 * Valid relic tiers in Warframe
 */
export type RelicTier = 'Lith' | 'Meso' | 'Neo' | 'Axi' | 'Requiem';

/**
 * Valid relic refinement states
 */
export type RelicState = 'Intact' | 'Exceptional' | 'Flawless' | 'Radiant';

/**
 * Rarity levels for relic rewards
 */
export type RewardRarity = 'Common' | 'Uncommon' | 'Rare';

/**
 * Single reward drop from a relic
 */
export interface IRelicReward {
  /** Name of the reward item */
  itemName: string;
  /** Rarity tier of the reward */
  rarity: RewardRarity;
  /** Drop chance percentage */
  chance: number;
}

/**
 * Complete relic data structure
 */
export interface IRelic {
  /** Formatted relic name (e.g., "lith a1") */
  relicName: string;
  /** Relic tier (Lith, Meso, Neo, Axi, Requiem) */
  tier: RelicTier | string;
  /** Relic refinement state */
  state: RelicState | string;
  /** List of possible rewards */
  rewards: IRelicReward[];
  /** MongoDB _id (to be removed before saving) */
  _id?: unknown;
}

/**
 * Response from warframestat drops API
 */
export interface IRelicsApiResponse {
  relics: IRelic[];
}

/**
 * Parsed relic URL name components
 */
export interface IParsedRelicName {
  /** Relic tier (lowercase) */
  tier: string;
  /** Relic name/code (uppercase) */
  name: string;
}

/**
 * Result of relic set calculation with pricing
 */
export interface IRelicSetResult {
  /** Relic set information */
  set: Array<{
    item_name: string;
    thumb: string;
    url_name: string;
    market: {
      buy: number;
      sell: number;
      diff: number;
    };
    tags?: string[];
    set?: boolean;
    priceUpdate?: Date;
  } | string>;
  /** Individual reward items with pricing */
  items: Array<{
    item_name: string;
    thumb: string;
    url_name: string;
    market: {
      buy: number;
      sell: number;
      diff: number;
    };
    tags?: string[];
    set?: boolean;
    priceUpdate?: Date;
  } | string>;
}

/**
 * Relic sync operation result
 */
export interface IRelicSyncResult {
  /** Whether sync was successful */
  success: boolean;
  /** Number of relics synced */
  relics: number;
  /** Error message if failed */
  error?: string;
}
