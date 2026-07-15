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
import { API_URLS } from '../constants';
import {
  IRelic,
  IRelicsApiResponse,
  IRelicSyncResult,
  IParsedRelicName,
  IRelicEvRow
} from '../interfaces/relic.interface';
import { IMarketItem, IProcessedItem, ISetResult } from '../interfaces/market.interface';
import { IDatabaseOperations } from '../interfaces/database.interface';
import { DropService } from './DropService';

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
  /**
   * Relic drop-data sources, tried in order. The primary (drops.warframestat.us)
   * is Cloudflare-walled and 403s from datacenter IPs, so the raw-GitHub mirror
   * is the working fallback on the server — WITHOUT it the collection silently
   * goes stale and newer relics (e.g. Lith T11) never sync. Same approach as
   * DropService.
   */
  private static readonly RELIC_SOURCES = [
    API_URLS.WARFRAME_DROPS,
    API_URLS.WARFRAME_DROPS_RELICS_MIRROR,
  ];

  /**
   * Canonical fissure relic tiers — the ones you can actually farm by running a
   * Void Fissure (Requiem included: farmed from Kuva Siphon/Flood). A relic of
   * any OTHER tier (currently only "Vanguard") is a Prime Resurgence relic: it's
   * bought from Varzia with Aya and never dropped by a mission or fissure, so it
   * has no place on a plat-per-run farming board even though warframe.market
   * flags it non-vaulted (it IS obtainable in-game — just not from a run).
   */
  private static readonly FISSURE_TIERS = new Set(['lith', 'meso', 'neo', 'axi', 'requiem']);

  /** Browser-like headers so drops.warframestat.us (Cloudflare) serves the JSON. */
  private static readonly FETCH_HEADERS = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

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
      // Fetch relic data, falling back to the raw-GitHub mirror when the primary
      // (Cloudflare-walled) source is unreachable.
      const allRelics = await this.fetchRelics();

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
   * Fetches the relic drop table from the first source that responds with a
   * non-empty payload. Browser headers get us past Cloudflare on the primary;
   * the raw-GitHub mirror is the fallback when the primary is walled entirely.
   *
   * @returns All relics (every state) from the winning source
   * @throws when every source fails or returns an empty payload
   * @private
   */
  private async fetchRelics(): Promise<IRelic[]> {
    let lastError: Error | null = null;
    for (const url of RelicService.RELIC_SOURCES) {
      try {
        const res = await axios.get<IRelicsApiResponse>(url, {
          headers: RelicService.FETCH_HEADERS,
          timeout: 30000,
        });
        const relics = res.data?.relics;
        if (Array.isArray(relics) && relics.length) return relics;
        lastError = new Error(`Empty relic payload from ${url}`);
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw new Error(
      `Failed to fetch relic drop data from all sources: ${lastError?.message ?? 'unknown error'}`,
    );
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
      items: rewardItems.map(item => processItem(item)).filter(item => item !== '')
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

  /**
   * Builds the "open vs sell" EV table for every relic from preloaded data.
   *
   * Pure function (no DB access): the caller loads all relics and all market
   * items once, and this joins each relic's rewards to their market prices and
   * resolves the relic's own market entry. The expected value of opening is left
   * to the client, which applies the fixed refinement chance table (Intact /
   * Radiant) to each reward's rarity — so one payload serves every refinement.
   *
   * @param relics - All stored (Intact-state) relics
   * @param items - All market items
   * @param droppingKeys - Keys (see DropService.relicKey) of relics that CURRENTLY
   *   drop from a mission node, from the WFCD drop tables — the authoritative
   *   "currently dropping" signal. When provided (non-empty) it overrides the
   *   unreliable warframe.market per-relic `vaulted` flag; when omitted/empty the
   *   builder falls back to that flag so the table still renders before a drops
   *   sync exists.
   * @returns One EV row per relic that has rewards
   */
  buildRelicEvFromData(
    relics: IRelic[],
    items: IMarketItem[],
    droppingKeys?: Set<string> | null,
  ): IRelicEvRow[] {
    const byName = new Map<string, IMarketItem>();
    const byUrl = new Map<string, IMarketItem>();
    for (const item of items) {
      if (!item) continue;
      if (item.item_name) byName.set(item.item_name, item);
      if (item.url_name) byUrl.set(item.url_name, item);
    }

    // Authoritative "currently dropping" = the relic appears in the live WFCD drop
    // tables (same source the drop-locations dialog shows). warframe.market's own
    // per-relic `vaulted` flag is unreliable — it read non-vaulted for dozens of
    // relics that no longer drop, leaking them onto the farming board. We fall
    // back to that flag ONLY when no drop data is supplied (pre-sync), so the
    // board never silently marks every relic vaulted.
    const hasDropData = !!droppingKeys && droppingKeys.size > 0;
    const isRelicDropping = (relic: IRelic): boolean => {
      const meta = this.relicMeta(relic);
      if (!meta) return false;
      if (hasDropData) {
        const key = DropService.relicKey(`${meta.displayName} Relic`);
        return key ? droppingKeys!.has(key) : false;
      }
      const relicItem = byUrl.get(meta.url_name) || byUrl.get(meta.baseUrl);
      return !(relicItem?.vaulted === true);
    };

    // A part's "vaulted" status can't be read off the part (warframe.market only
    // flags relics) — it's derived: a part still drops in fissures iff at least
    // one CURRENTLY-DROPPING relic contains it. Parts found only in non-dropping
    // relics are effectively vaulted (scarce, no longer farmable by cracking).
    const droppingParts = new Set<string>();
    for (const relic of relics) {
      if (!relic?.rewards?.length || !isRelicDropping(relic)) continue;
      for (const reward of relic.rewards) droppingParts.add(reward.itemName);
    }

    const rows: IRelicEvRow[] = [];

    for (const relic of relics) {
      const meta = this.relicMeta(relic);
      if (!meta) continue;

      const relicItem = byUrl.get(meta.url_name) || byUrl.get(meta.baseUrl);

      // Prime Resurgence (Varzia) relics live under a non-fissure tier and are
      // Aya-bought, never fissure-dropped — a "currently dropping" board must
      // exclude them regardless of drop-table / market flags.
      const resurgence = !RelicService.FISSURE_TIERS.has((meta.tier || '').toLowerCase());
      // Vaulted = not currently dropping and not a Resurgence relic (so the
      // Resurgence badge wins for those). Falls back to the market flag when no
      // drop data is available.
      const vaulted = hasDropData
        ? !isRelicDropping(relic) && !resurgence
        : relicItem?.vaulted === true;

      const rewards = relic.rewards.map((reward) => {
        const item = byName.get(reward.itemName);
        const m = item?.market;
        return {
          item_name: reward.itemName,
          url_name: item?.url_name ?? '',
          thumb: item?.thumb ?? '',
          rarity: reward.rarity,
          price: m?.sell ?? 0,
          // Liquidity inputs: the client discounts a drop's value by its trade
          // volume and prefers the 48h average over the raw lowest ask.
          avgPrice: m?.avg_price ?? 0,
          volume: m?.volume ?? 0,
          // Effectively vaulted: no currently-dropping relic yields this part,
          // so it can't be farmed from fissures right now (only traded).
          vaulted: !droppingParts.has(reward.itemName),
        };
      });

      rows.push({
        relicName: meta.displayName,
        url_name: meta.url_name,
        tier: this.capitalize(meta.tier),
        thumb: relicItem?.thumb ?? '',
        vaulted,
        resurgence,
        relic: {
          buy: relicItem?.market?.buy ?? 0,
          sell: relicItem?.market?.sell ?? 0,
          volume: relicItem?.market?.volume ?? 0,
          avgPrice: relicItem?.market?.avg_price ?? 0,
        },
        rewards,
      });
    }

    return rows;
  }

  /**
   * Derives a relic's display name and market url_name from its stored
   * "<tier> <code>" name (e.g. "lith A1"). Returns null for relics with no code
   * or no rewards. Relics are listed on warframe.market as "<tier>_<code>_relic".
   * @private
   */
  private relicMeta(
    relic: IRelic,
  ): { code: string; tier: string; displayName: string; url_name: string; baseUrl: string } | null {
    if (!relic || !relic.rewards || relic.rewards.length === 0) return null;
    const code = (relic.relicName || '').split(/\s+/).slice(1).join(' ').trim();
    if (!code) return null;
    const tier = relic.tier || (relic.relicName || '').split(/\s+/)[0] || '';
    return {
      code,
      tier,
      displayName: `${this.capitalize(tier)} ${code.toUpperCase()}`,
      url_name: `${tier.toLowerCase()}_${code.toLowerCase()}_relic`,
      baseUrl: `${tier.toLowerCase()}_${code.toLowerCase()}`,
    };
  }

  /**
   * Capitalises the first letter of a word (e.g. "lith" -> "Lith").
   * @private
   */
  private capitalize(word: string): string {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
}
