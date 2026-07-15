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
 * A single reward line in a relic EV row, joined with its market price.
 */
export interface IRelicEvReward {
  /** Reward item display name */
  item_name: string;
  /** URL-friendly name for the /items link (empty if not on market) */
  url_name: string;
  /** Thumbnail path */
  thumb: string;
  /** Drop rarity (drives the refinement chance table on the client) */
  rarity: RewardRarity | string;
  /** Going market price of the reward part (lowest sell order) */
  price: number;
  /**
   * 48h average sell price from completed trades. The client prefers this over
   * the raw `price` (lowest ask) as the value basis, since a single lowball or
   * lowfill ask distorts the ask. 0 when the part isn't traded / not listed.
   */
  avgPrice: number;
  /**
   * 48h trade volume for this part. Drives the liquidity weight: a drop nobody
   * actually buys (0 volume) contributes ~nothing to the relic's realizable
   * payout, so overpriced illiquid asks can't inflate an EV.
   */
  volume: number;
  /**
   * Whether this reward part is effectively vaulted — obtainable from NO
   * currently-dropping relic. Derived (not read off the part, since
   * warframe.market only flags relics): false means at least one non-vaulted
   * relic still drops it in fissures; true means it survives only in vaulted
   * relics (scarce, trade-only). Lets the pages flag which drops still farm.
   */
  vaulted: boolean;
}

/**
 * One row of the "open the relic vs sell it" analytics table.
 *
 * The expected value of opening is computed on the client from each reward's
 * rarity and the fixed refinement chance table (Intact / Radiant), so a single
 * payload serves every refinement without a refetch.
 */
export interface IRelicEvRow {
  /** Display name, e.g. "Lith A1" */
  relicName: string;
  /** URL-friendly name, e.g. "lith_a1" (links to /relic/<url_name>) */
  url_name: string;
  /** Relic tier (Lith, Meso, Neo, Axi, Requiem) */
  tier: string;
  /** Relic thumbnail (from its own market item, if listed) */
  thumb: string;
  /**
   * True when the relic is vaulted — it no longer drops from any current
   * mission, so it can't be farmed (only cracked from an existing inventory).
   * Sourced from the relic's own warframe.market item (v2 `vaulted` flag).
   * `false` also covers "unknown / not enriched" so a missing flag never hides
   * a relic that might still drop.
   */
  vaulted: boolean;
  /**
   * True when the relic belongs to a non-fissure tier (currently "Vanguard") —
   * a Prime Resurgence relic bought from Varzia with Aya, which never drops from
   * a mission or fissure. warframe.market flags it non-vaulted (it IS obtainable
   * in-game), so `vaulted` alone can't hide it; the farming board keys off this
   * to keep such relics off a "what can I farm from a run right now" list.
   */
  resurgence: boolean;
  /** The relic's own market data — relics are tradeable */
  relic: { buy: number; sell: number; volume: number; avgPrice: number };
  /** The six possible rewards with prices */
  rewards: IRelicEvReward[];
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
