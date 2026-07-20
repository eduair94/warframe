/**
 * @fileoverview Service for Warframe drop-data (mission rewards + relic contents)
 * @module services/DropService
 *
 * Single Responsibility: own the WFCD drop data — fetch it, keep a Mongo backup,
 * and answer two questions the rest of the app asks:
 *
 *   1. "Where does this item drop?"  -> getItemDrops(name)     (drives the in-app dialog)
 *   2. "What's worth farming, where?" -> getDropsMap()          (drives the Star Chart)
 *
 * The unique bit is (2): WFCD gives drop *chances*, this app already owns live
 * Warframe Market *prices*, so we join them into an expected platinum-per-run for
 * every mission — something no external drop table shows.
 *
 * Data flows one way: `sync_drops.ts` fetches WFCD and writes the two backup
 * documents (a "map" doc and a flat "index" doc); the read paths serve from those
 * documents and fall back to a live WFCD fetch only when the backup is missing, so
 * the feature still works before the first sync without ever writing on a read.
 */

import axios from 'axios';
import { API_URLS } from '../constants';
import { IDatabaseOperations } from '../interfaces/database.interface';

// =====================================
// Raw WFCD shapes (as fetched)
// =====================================

/** One reward line in any WFCD drop table. */
export interface IDropReward {
  itemName: string;
  rarity: string;
  chance: number;
}

/** A mission node's reward tables — keyed by rotation (A/B/C…) or a flat array. */
interface IRawMissionNode {
  rewards: Record<string, IDropReward[]> | IDropReward[];
  gameMode?: string;
  isEvent?: boolean;
}

/** `missionRewards.json` — planets -> locations -> node. */
interface IRawMissionRewards {
  missionRewards: Record<string, Record<string, IRawMissionNode>>;
}

/** One relic entry in `relics.json` (one per tier/name/state). */
interface IRawRelic {
  tier: string;
  relicName: string;
  state: string;
  rewards: IDropReward[];
}

interface IRawRelics {
  relics: IRawRelic[];
}

// =====================================
// Normalized shapes (stored in Mongo)
// =====================================

export interface IMapRotation {
  /** 'A' | 'B' | 'C' … or null when the mission has no rotation. */
  rotation: string | null;
  rewards: IDropReward[];
}

export interface IMapNode {
  location: string;
  gameMode: string;
  isEvent: boolean;
  rotations: IMapRotation[];
}

export interface IMapPlanet {
  planet: string;
  nodes: IMapNode[];
}

/** One flat "item appears here" record — the searchable index behind the dialog. */
export interface IDropIndexEntry {
  itemName: string;
  source: 'mission' | 'relic';
  // mission-source fields
  planet?: string;
  location?: string;
  gameMode?: string;
  rotation?: string | null;
  // relic-source fields
  relicTier?: string;
  relicName?: string;
  rarity: string;
  chance: number;
}

// =====================================
// Enriched shapes (returned to the client, prices joined at read time)
// =====================================

export interface IEnrichedReward extends IDropReward {
  /** Lowest sell order in plat, 0 when the item isn't traded. */
  price: number;
  url_name: string;
  thumb: string;
  /** True when the item has a Warframe Market listing (i.e. is tradeable). */
  tradeable: boolean;
}

export interface IEnrichedRotation {
  rotation: string | null;
  /** Expected plat per reward drop: Σ (chance/100 × price). */
  value: number;
  rewards: IEnrichedReward[];
}

export interface IEnrichedNode {
  location: string;
  gameMode: string;
  isEvent: boolean;
  /** The node's best rotation value — its headline "worth farming" number. */
  value: number;
  rotations: IEnrichedRotation[];
}

export interface IEnrichedPlanet {
  planet: string;
  /** The planet's richest node value — drives the star chart's glow. */
  value: number;
  nodeCount: number;
  bestNode: { location: string; gameMode: string; value: number } | null;
  nodes: IEnrichedNode[];
}

export interface IDropsMapResult {
  planets: IEnrichedPlanet[];
  meta: {
    generatedAt: string;
    source: 'db' | 'live';
    planetCount: number;
    nodeCount: number;
  };
}

/** A relic that contains the queried item, plus where that relic itself drops. */
export interface IItemRelicSource {
  relicName: string;
  tier: string;
  rarity: string;
  chance: number;
  farmNodes: Array<{
    planet: string;
    location: string;
    gameMode: string;
    rotation: string | null;
    chance: number;
  }>;
}

export interface IItemDropsResult {
  itemName: string;
  /** Nodes where the item drops directly (true for relics themselves). */
  missions: Array<{
    planet: string;
    location: string;
    gameMode: string;
    rotation: string | null;
    rarity: string;
    chance: number;
  }>;
  /** Relics that contain the item (for prime parts), with their own drop nodes. */
  relics: IItemRelicSource[];
  meta: { source: 'db' | 'live'; found: boolean };
}

/** Minimal price-map value used by the read-time join. */
interface IPriceInfo {
  price: number;
  url_name: string;
  thumb: string;
}

/**
 * Service for Warframe drop data.
 *
 * @example
 * ```typescript
 * const drops = new DropService(dropRepo, itemRepo);
 * await drops.syncDrops();              // fetch WFCD -> Mongo backup
 * const map = await drops.getDropsMap();// planets ranked by plat/run
 * const where = await drops.getItemDrops('Nova Prime Neuroptics');
 * ```
 */
export class DropService {
  /** Browser-like headers so drops.warframestat.us (Cloudflare) serves us the JSON. */
  private static readonly FETCH_HEADERS = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  constructor(
    private readonly dropRepository: IDatabaseOperations<any>,
    private readonly itemRepository: IDatabaseOperations<any>
  ) {}

  // =====================================
  // Sync (the only writer)
  // =====================================

  /**
   * Fetches mission rewards + relic contents from WFCD, normalizes them, and
   * replaces the two backup documents in Mongo. On a failed fetch it throws
   * without touching Mongo, so a scheduler can alert and the last-good backup
   * survives untouched.
   */
  async syncDrops(): Promise<{ success: boolean; planets: number; nodes: number; indexEntries: number }> {
    const { planets, relics } = await this.fetchSource();

    const index = DropService.buildIndex(planets, relics);
    const nodeCount = planets.reduce((sum, p) => sum + p.nodes.length, 0);

    await this.dropRepository.getAnUpdateEntry(
      { key: 'map' },
      { planets, planetCount: planets.length, nodeCount, updatedAt: new Date().toISOString() }
    );
    await this.dropRepository.getAnUpdateEntry(
      { key: 'index' },
      { entries: index, count: index.length, updatedAt: new Date().toISOString() }
    );

    return { success: true, planets: planets.length, nodes: nodeCount, indexEntries: index.length };
  }

  // =====================================
  // Reads
  // =====================================

  /**
   * Planets -> nodes -> rotations, each mission's rewards joined to live market
   * prices to yield an expected plat-per-run. Serves the Mongo backup; if the
   * backup is missing (before first sync) it reads WFCD live so the page still
   * works — read-only, no write.
   */
  async getDropsMap(): Promise<IDropsMapResult> {
    let planets: IMapPlanet[];
    let source: 'db' | 'live';

    const doc = await this.dropRepository.findEntry({ key: 'map' });
    if (doc && Array.isArray(doc.planets) && doc.planets.length) {
      planets = doc.planets;
      source = 'db';
    } else {
      planets = (await this.fetchSource()).planets;
      source = 'live';
    }

    const priceMap = DropService.buildPriceMap(await this.itemRepository.allEntries({}));
    const enriched = DropService.enrichMap(planets, priceMap);
    const nodeCount = enriched.reduce((sum, p) => sum + p.nodeCount, 0);

    return {
      planets: enriched,
      meta: { generatedAt: new Date().toISOString(), source, planetCount: enriched.length, nodeCount },
    };
  }

  /**
   * Everywhere an item drops: direct mission nodes (true for relics) and the
   * relics that contain it (for prime parts), each relic resolved to the nodes it
   * drops from. Serves the flat index backup, with the same live fallback.
   */
  async getItemDrops(name: string): Promise<IItemDropsResult> {
    let entries: IDropIndexEntry[];
    let source: 'db' | 'live';

    const doc = await this.dropRepository.findEntry({ key: 'index' });
    if (doc && Array.isArray(doc.entries) && doc.entries.length) {
      entries = doc.entries;
      source = 'db';
    } else {
      const { planets, relics } = await this.fetchSource();
      entries = DropService.buildIndex(planets, relics);
      source = 'live';
    }

    const result = DropService.lookupItem(name, entries);
    return { ...result, meta: { source, found: result.missions.length > 0 || result.relics.length > 0 } };
  }

  /**
   * The set of relics that currently drop from a mission node (keyed by relicKey),
   * read from the same flat index backup as getItemDrops — with the same live
   * fallback so it works before the first sync. Drives the relic EV builder's
   * "currently dropping" gate. Returns an empty set only when there is genuinely
   * no drop data, so the caller can fall back rather than hide every relic.
   */
  async getDroppingRelicKeys(): Promise<Set<string>> {
    let entries: IDropIndexEntry[];

    const doc = await this.dropRepository.findEntry({ key: 'index' });
    if (doc && Array.isArray(doc.entries) && doc.entries.length) {
      entries = doc.entries;
    } else {
      const { planets, relics } = await this.fetchSource();
      entries = DropService.buildIndex(planets, relics);
    }

    return DropService.droppingRelicKeys(entries);
  }

  // =====================================
  // Fetch (with mirror fallback)
  // =====================================

  /** Fetches + normalizes both WFCD source files, trying the raw-GitHub mirror on failure. */
  private async fetchSource(): Promise<{ planets: IMapPlanet[]; relics: IRawRelic[] }> {
    const [missionRaw, relicRaw] = await Promise.all([
      this.fetchJson<IRawMissionRewards>([API_URLS.WARFRAME_DROPS_MISSIONS, API_URLS.WARFRAME_DROPS_MISSIONS_MIRROR]),
      this.fetchJson<IRawRelics>([API_URLS.WARFRAME_DROPS, API_URLS.WARFRAME_DROPS_RELICS_MIRROR]),
    ]);
    return {
      planets: DropService.normalizeMissionRewards(missionRaw),
      relics: DropService.normalizeRelics(relicRaw),
    };
  }

  /** GET the first URL that succeeds; throws only if every URL fails. */
  private async fetchJson<T>(urls: string[]): Promise<T> {
    let lastError: Error | null = null;
    for (const url of urls) {
      try {
        const res = await axios.get<T>(url, { headers: DropService.FETCH_HEADERS, timeout: 30000 });
        return res.data;
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw new Error(`Failed to fetch drop data from all sources: ${lastError?.message ?? 'unknown error'}`);
  }

  // =====================================
  // Pure normalization / join helpers (no DB — unit tested)
  // =====================================

  /** Collapses a name to a match key: lower-cased, trimmed, single-spaced. */
  static normalizeName(name: string): string {
    return (name || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  /**
   * Identity key for a relic from an item name, e.g. "Lith A1 Relic" -> "lith a1".
   * Returns null when the name isn't a relic. This is the join key between the
   * drop tables and the relic EV builder, so both judge "currently dropping" off
   * the SAME data the drop-locations dialog shows — not warframe.market's
   * per-relic `vaulted` flag, which reads non-vaulted for relics that no longer
   * drop (and vaulted for some that still do).
   */
  static relicKey(name: string): string | null {
    const n = DropService.normalizeName(name);
    if (!n.endsWith(' relic')) return null;
    return n.slice(0, -' relic'.length).trim() || null;
  }

  /**
   * Keys (see relicKey) of every relic that CURRENTLY drops from a mission node,
   * read off the flat drop index. A relic absent here is not farmable from a
   * fissure run right now — the authoritative "currently dropping" signal.
   */
  static droppingRelicKeys(entries: IDropIndexEntry[]): Set<string> {
    const keys = new Set<string>();
    for (const e of entries || []) {
      if (e.source !== 'mission') continue;
      const key = DropService.relicKey(e.itemName);
      if (key) keys.add(key);
    }
    return keys;
  }

  /**
   * Match keys for an item, tolerant of WFCD's "… Blueprint" suffix which the
   * market often omits (e.g. WFCD "Nova Prime Neuroptics Blueprint" vs market
   * "Nova Prime Neuroptics"). Also drops a trailing "Set" and parentheticals.
   */
  static matchKeys(name: string): string[] {
    let base = DropService.normalizeName(name);
    if (base.includes('(')) base = base.split('(')[0].trim();
    if (base.endsWith(' set')) base = base.slice(0, -4).trim();
    const keys = new Set<string>([base]);
    if (base.endsWith(' blueprint')) keys.add(base.slice(0, -' blueprint'.length).trim());
    else keys.add(`${base} blueprint`);
    return [...keys].filter(Boolean);
  }

  /**
   * Copies of an unranked arcane needed to build a maxed (Rank 5) one. A single
   * mission drop yields ONE unranked copy, so its per-drop worth is the maxed
   * market price divided by this — otherwise farming nodes that drop pricey
   * arcanes (e.g. Duviri) read absurdly high (each drop is ~1/21 of the sellable
   * maxed arcane, not a whole one).
   */
  static readonly ARCANE_BUILD_COPIES = 21;

  /** name-key -> price/url/thumb, from the market items collection. */
  static buildPriceMap(items: any[]): Map<string, IPriceInfo> {
    const map = new Map<string, IPriceInfo>();
    for (const item of items || []) {
      if (!item || !item.item_name) continue;
      let price = item.market?.sell ?? 0;
      // Arcanes: value a single drop as its share of the buildable maxed arcane.
      // Raw item docs keep tags nested under items_in_set[0].tags (ItemProcessor
      // only lifts them to top-level for display), so check both.
      const tags: unknown = Array.isArray(item?.tags)
        ? item.tags
        : item?.items_in_set?.[0]?.tags;
      if (price && Array.isArray(tags) && tags.includes('arcane_enhancement')) {
        price = price / DropService.ARCANE_BUILD_COPIES;
      }
      const info: IPriceInfo = {
        price,
        url_name: item.url_name ?? '',
        thumb: item.thumb ?? '',
      };
      map.set(DropService.normalizeName(item.item_name), info);
    }
    return map;
  }

  /** Resolves an item name to its market info, tolerant of the Blueprint suffix. */
  static resolvePrice(name: string, priceMap: Map<string, IPriceInfo>): IPriceInfo & { tradeable: boolean } {
    for (const key of DropService.matchKeys(name)) {
      const hit = priceMap.get(key);
      if (hit) return { ...hit, tradeable: true };
    }
    return { price: 0, url_name: '', thumb: '', tradeable: false };
  }

  /**
   * WFCD's flat (non-rotational) `rewards` array is sometimes several 100% drop
   * tables concatenated by an upstream parser bug (a `<th>` header with no "/"
   * fails to reset the location, so unrelated event tables — e.g. the
   * "Recall: Ten-Zero" anniversary tables under Duviri/Endless: Repeated Rewards
   * (Hard) — are appended to the previous real node). We keep only the FIRST
   * block: walk the array summing chance, close a block at >= 99.5 (rounding
   * tolerance), and if more than one block exists, return block 1 only. A clean
   * single-table array is one block and is returned whole. Exact
   * (itemName|rarity|chance) duplicates within the kept block are removed.
   */
  static splitFirstDropTable(rewards: IDropReward[]): IDropReward[] {
    const rows = rewards || [];
    let sum = 0;
    let cut = rows.length; // default: no split (single block)
    for (let i = 0; i < rows.length; i++) {
      sum += rows[i].chance || 0;
      if (sum >= 99.5) {
        cut = i + 1;
        break;
      }
    }
    const first = rows.slice(0, cut);
    const seen = new Set<string>();
    const out: IDropReward[] = [];
    for (const r of first) {
      const key = `${r.itemName}|${r.rarity}|${r.chance}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ itemName: r.itemName, rarity: r.rarity, chance: r.chance });
    }
    return out;
  }

  /** `missionRewards.json` -> normalized planets/nodes, rotations flattened consistently. */
  static normalizeMissionRewards(raw: IRawMissionRewards): IMapPlanet[] {
    const missionRewards = raw?.missionRewards ?? {};
    const planets: IMapPlanet[] = [];

    for (const planetName of Object.keys(missionRewards)) {
      const nodesRaw = missionRewards[planetName] ?? {};
      const nodes: IMapNode[] = [];

      for (const location of Object.keys(nodesRaw)) {
        const node = nodesRaw[location];
        if (!node || !node.rewards) continue;
        const rotations = DropService.normalizeRotations(node.rewards);
        if (!rotations.length) continue;
        nodes.push({
          location,
          gameMode: node.gameMode ?? 'Mission',
          isEvent: !!node.isEvent,
          rotations,
        });
      }

      if (nodes.length) planets.push({ planet: planetName, nodes });
    }

    return planets;
  }

  /** A node's `rewards` is either `{A,B,C}` (rotations) or a flat array (no rotation). */
  private static normalizeRotations(rewards: Record<string, IDropReward[]> | IDropReward[]): IMapRotation[] {
    if (Array.isArray(rewards)) {
      if (!rewards.length) return [];
      // Flat arrays can be mis-concatenated event tables (see splitFirstDropTable).
      const cleaned = DropService.splitFirstDropTable(DropService.cleanRewards(rewards));
      return cleaned.length ? [{ rotation: null, rewards: cleaned }] : [];
    }
    const out: IMapRotation[] = [];
    for (const rotation of Object.keys(rewards)) {
      const list = rewards[rotation];
      if (Array.isArray(list) && list.length) {
        out.push({ rotation, rewards: DropService.cleanRewards(list) });
      }
    }
    return out;
  }

  /** Keeps only the fields we serve, dropping WFCD's internal `_id`. */
  private static cleanRewards(rewards: IDropReward[]): IDropReward[] {
    return rewards.map((r) => ({ itemName: r.itemName, rarity: r.rarity, chance: r.chance }));
  }

  /** `relics.json` -> only Intact-state relics (the base drop table). */
  static normalizeRelics(raw: IRawRelics): IRawRelic[] {
    return (raw?.relics ?? []).filter((r) => r && r.state === 'Intact' && Array.isArray(r.rewards));
  }

  /**
   * Builds the flat searchable index: one entry per (item, place). Mission entries
   * carry the node; relic entries carry the relic. This is what getItemDrops filters.
   */
  static buildIndex(planets: IMapPlanet[], relics: IRawRelic[]): IDropIndexEntry[] {
    const entries: IDropIndexEntry[] = [];

    for (const planet of planets) {
      for (const node of planet.nodes) {
        for (const rot of node.rotations) {
          for (const reward of rot.rewards) {
            entries.push({
              itemName: reward.itemName,
              source: 'mission',
              planet: planet.planet,
              location: node.location,
              gameMode: node.gameMode,
              rotation: rot.rotation,
              rarity: reward.rarity,
              chance: reward.chance,
            });
          }
        }
      }
    }

    for (const relic of relics) {
      const relicName = `${relic.tier} ${relic.relicName}`;
      for (const reward of relic.rewards) {
        entries.push({
          itemName: reward.itemName,
          source: 'relic',
          relicTier: relic.tier,
          relicName,
          rarity: reward.rarity,
          chance: reward.chance,
        });
      }
    }

    return entries;
  }

  /** Σ (chance/100 × price) across a rotation's rewards. */
  static rotationValue(rewards: IEnrichedReward[]): number {
    return rewards.reduce((sum, r) => sum + (r.chance / 100) * r.price, 0);
  }

  /** Joins every reward to market prices and rolls up node/planet headline values. */
  static enrichMap(planets: IMapPlanet[], priceMap: Map<string, IPriceInfo>): IEnrichedPlanet[] {
    const out: IEnrichedPlanet[] = [];

    for (const planet of planets) {
      const nodes: IEnrichedNode[] = [];

      for (const node of planet.nodes) {
        const rotations: IEnrichedRotation[] = node.rotations.map((rot) => {
          const rewards = rot.rewards.map((r) => {
            const info = DropService.resolvePrice(r.itemName, priceMap);
            return {
              itemName: r.itemName,
              rarity: r.rarity,
              chance: r.chance,
              price: info.price,
              url_name: info.url_name,
              thumb: info.thumb,
              tradeable: info.tradeable,
            };
          });
          return { rotation: rot.rotation, value: DropService.rotationValue(rewards), rewards };
        });

        const nodeValue = rotations.reduce((max, r) => Math.max(max, r.value), 0);
        nodes.push({
          location: node.location,
          gameMode: node.gameMode,
          isEvent: node.isEvent,
          value: nodeValue,
          rotations,
        });
      }

      nodes.sort((a, b) => b.value - a.value);
      const best = nodes[0] ?? null;

      out.push({
        planet: planet.planet,
        value: best ? best.value : 0,
        nodeCount: nodes.length,
        bestNode: best ? { location: best.location, gameMode: best.gameMode, value: best.value } : null,
        nodes,
      });
    }

    return out;
  }

  /** Filters the flat index for one item and resolves relic sources to their farm nodes. */
  static lookupItem(name: string, entries: IDropIndexEntry[]): Omit<IItemDropsResult, 'meta'> {
    const wanted = new Set(DropService.matchKeys(name));
    const matches = (n: string) => DropService.matchKeys(n).some((k) => wanted.has(k));

    const missions: IItemDropsResult['missions'] = [];
    const relicMap = new Map<string, IItemRelicSource>();

    for (const e of entries) {
      if (!matches(e.itemName)) continue;
      if (e.source === 'mission') {
        missions.push({
          planet: e.planet ?? '',
          location: e.location ?? '',
          gameMode: e.gameMode ?? '',
          rotation: e.rotation ?? null,
          rarity: e.rarity,
          chance: e.chance,
        });
      } else if (e.relicName) {
        relicMap.set(e.relicName, {
          relicName: e.relicName,
          tier: e.relicTier ?? '',
          rarity: e.rarity,
          chance: e.chance,
          farmNodes: [],
        });
      }
    }

    // Second hop: where does each matched relic itself drop?
    for (const relic of relicMap.values()) {
      const relicKeys = new Set(DropService.matchKeys(`${relic.relicName} Relic`));
      for (const e of entries) {
        if (e.source !== 'mission') continue;
        if (!DropService.matchKeys(e.itemName).some((k) => relicKeys.has(k))) continue;
        relic.farmNodes.push({
          planet: e.planet ?? '',
          location: e.location ?? '',
          gameMode: e.gameMode ?? '',
          rotation: e.rotation ?? null,
          chance: e.chance,
        });
      }
      relic.farmNodes.sort((a, b) => b.chance - a.chance);
    }

    missions.sort((a, b) => b.chance - a.chance);
    const relics = [...relicMap.values()].sort((a, b) => b.chance - a.chance);
    return { itemName: name, missions, relics };
  }
}
