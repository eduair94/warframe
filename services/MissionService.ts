/**
 * @fileoverview Mission/node metadata service — the "/mission" pages.
 * @module services/MissionService
 *
 * DropService owns the reward tables (chance × price). This service owns the
 * NODE: faction, mission type, enemy-level range, and the wiki deep-link — from
 * WFCD's Node.json (269 star-chart nodes) enriched by solNodes (name/enemy/type).
 * It stores one doc ({ key: 'nodes' }) in the shared warframe-drops collection,
 * then joins that metadata onto the enriched drop map at read time to build the
 * /missions hub list and each /mission/<slug> detail page.
 *
 * WFCD-only by design: tileset, unlock text and the node graph live only in the
 * wiki's Lua module (robots-blocked), so those gaps are filled by the frontend's
 * baked curated notes, not here.
 */
import axios from 'axios';
import { API_URLS } from '../constants';
import { IDatabaseOperations } from '../interfaces/database.interface';
import { IEnrichedPlanet, IEnrichedRotation } from './DropService';
import { missionSlug } from './missionSlug';

/** Star-chart node metadata, joined and stored. */
export interface INodeMeta {
  uniqueName: string;
  slug: string;
  planet: string;
  location: string;
  faction: string;
  missionType: string;
  minLevel: number;
  maxLevel: number;
  /** Wiki article title (disambiguated for names that collide with items/frames). */
  wikiLink: string;
}

/** One row of the /missions hub table. */
export interface IMissionListRow {
  slug: string;
  planet: string;
  location: string;
  gameMode: string;
  faction: string | null;
  missionType: string | null;
  minLevel: number | null;
  maxLevel: number | null;
  bestValue: number;
  indexable: boolean;
}

/** The /mission/<slug> detail payload. */
export interface IMissionDetail {
  slug: string;
  planet: string;
  location: string;
  gameMode: string;
  isEvent: boolean;
  node:
    | {
        faction: string;
        missionType: string;
        minLevel: number;
        maxLevel: number;
        steelPath: { minLevel: number; maxLevel: number };
        wikiLink: string;
      }
    | null;
  rotations: IEnrichedRotation[];
  bestValue: number;
  indexable: boolean;
}

/**
 * Node names that collide with an item/Warframe/weapon article on the wiki, where
 * the bare title resolves to the wrong page. The wiki disambiguates these with a
 * " (Node)" suffix. Sourced from the WFCD data cross-check (2026-07).
 */
const WIKI_NODE_COLLISIONS = new Set<string>([
  'War', 'Titania', 'Caliban', 'Lex', 'Isos', 'Oro',
]);

export class MissionService {
  /** Browser-like headers so raw.githubusercontent.com/warframestat.us serve us the JSON. */
  private static readonly FETCH_HEADERS = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  constructor(private readonly nodesRepository: IDatabaseOperations<any>) {}

  // ===== Sync (the only writer) =====

  /**
   * Fetches Node.json + solNodes, normalizes, and replaces the { key: 'nodes' }
   * doc. Throws without touching Mongo on a failed fetch (last-good survives).
   */
  async syncNodes(): Promise<{ success: boolean; nodes: number }> {
    const [rawNodes, rawSolNodes] = await Promise.all([
      this.fetchJson<any[]>([API_URLS.WARFRAME_NODES]),
      this.fetchJson<Record<string, any>>([API_URLS.WARFRAME_SOLNODES, API_URLS.WARFRAME_SOLNODES_FALLBACK]),
    ]);
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    await this.nodesRepository.getAnUpdateEntry(
      { key: 'nodes' },
      { nodes, count: nodes.length, updatedAt: new Date().toISOString() },
    );
    return { success: true, nodes: nodes.length };
  }

  // ===== Read =====

  /** The stored node-metadata list ([] before the first sync). */
  async getNodesIndex(): Promise<INodeMeta[]> {
    const doc = await this.nodesRepository.findEntry({ key: 'nodes' });
    return doc && Array.isArray(doc.nodes) ? doc.nodes : [];
  }

  // ===== Fetch (with fallback) =====

  private async fetchJson<T>(urls: string[]): Promise<T> {
    let lastError: Error | null = null;
    for (const url of urls) {
      try {
        const res = await axios.get<T>(url, { headers: MissionService.FETCH_HEADERS, timeout: 30000 });
        return res.data;
      } catch (error) {
        lastError = error as Error;
      }
    }
    throw new Error(`Failed to fetch node data from all sources: ${lastError?.message ?? 'unknown error'}`);
  }

  // ===== Pure builders (no DB — unit tested) =====

  /** Node.json (levels/uniqueName) joined to solNodes (enemy/type by uniqueName). */
  static normalizeNodes(rawNodes: any[], rawSolNodes: Record<string, any>): INodeMeta[] {
    const out: INodeMeta[] = [];
    for (const n of rawNodes || []) {
      if (!n || !n.name || !n.systemName) continue;
      const sol = rawSolNodes?.[n.uniqueName] ?? {};
      out.push({
        uniqueName: n.uniqueName ?? '',
        slug: missionSlug(n.systemName, n.name),
        planet: n.systemName,
        location: n.name,
        faction: sol.enemy ?? '',
        missionType: sol.type ?? '',
        minLevel: typeof n.minEnemyLevel === 'number' ? n.minEnemyLevel : 0,
        maxLevel: typeof n.maxEnemyLevel === 'number' ? n.maxEnemyLevel : 0,
        wikiLink: WIKI_NODE_COLLISIONS.has(n.name) ? `${n.name} (Node)` : n.name,
      });
    }
    return out;
  }

  /** Steel Path is the same node at +100 enemy levels (no SP node data exists). */
  static deriveSteelPath(min: number, max: number): { minLevel: number; maxLevel: number } {
    return { minLevel: (min || 0) + 100, maxLevel: (max || 0) + 100 };
  }

  /** slug -> INodeMeta index for O(1) joins. */
  private static indexNodes(nodes: INodeMeta[]): Map<string, INodeMeta> {
    const m = new Map<string, INodeMeta>();
    for (const n of nodes || []) m.set(n.slug, n);
    return m;
  }

  /** A page is indexable when it has real node metadata OR valuable rewards. */
  private static isIndexable(meta: INodeMeta | undefined, bestValue: number): boolean {
    return !!meta || bestValue >= 1;
  }

  static buildMissionList(planets: IEnrichedPlanet[], nodes: INodeMeta[]): IMissionListRow[] {
    const idx = MissionService.indexNodes(nodes);
    const rows: IMissionListRow[] = [];
    for (const planet of planets || []) {
      for (const node of planet.nodes) {
        const slug = missionSlug(planet.planet, node.location);
        const meta = idx.get(slug);
        rows.push({
          slug,
          planet: planet.planet,
          location: node.location,
          gameMode: node.gameMode,
          faction: meta?.faction ?? null,
          missionType: meta?.missionType ?? null,
          minLevel: meta?.minLevel ?? null,
          maxLevel: meta?.maxLevel ?? null,
          bestValue: node.value,
          indexable: MissionService.isIndexable(meta, node.value),
        });
      }
    }
    rows.sort((a, b) => b.bestValue - a.bestValue);
    return rows;
  }

  static buildMissionDetail(
    slug: string,
    planets: IEnrichedPlanet[],
    nodes: INodeMeta[],
  ): IMissionDetail | null {
    const idx = MissionService.indexNodes(nodes);
    for (const planet of planets || []) {
      for (const node of planet.nodes) {
        if (missionSlug(planet.planet, node.location) !== slug) continue;
        const meta = idx.get(slug);
        return {
          slug,
          planet: planet.planet,
          location: node.location,
          gameMode: node.gameMode,
          isEvent: node.isEvent,
          node: meta
            ? {
                faction: meta.faction,
                missionType: meta.missionType,
                minLevel: meta.minLevel,
                maxLevel: meta.maxLevel,
                steelPath: MissionService.deriveSteelPath(meta.minLevel, meta.maxLevel),
                wikiLink: meta.wikiLink,
              }
            : null,
          rotations: node.rotations,
          bestValue: node.value,
          indexable: MissionService.isIndexable(meta, node.value),
        };
      }
    }
    return null;
  }
}
