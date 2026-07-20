# Mission Insight Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/mission` (hub) + `/mission/<slug>` (detail) pages, data-driven from WFCD, that lead with farm value and answer "how do I get here?", with every `DropLocationsDialog` drop-row linking in — and fix the two data defects those pages expose (the WFCD phantom-row parser bug and the dead Fandom wiki host).

**Architecture:** Backend adds a `MissionService` (node metadata from WFCD `Node.json` + `solNodes`, stored as a third doc in the existing `warframe-drops` collection) and composes it with the existing enriched drop map into `/missions` + `/mission/:slug` endpoints. A `DropService` block-split fix removes phantom rewards app-wide. Frontend adds one optional-catch-all page, a baked curated "how to get here" notes file, and repoints wiki links to `wiki.warframe.com/w/`.

**Tech Stack:** TypeScript, Express (repo root), Mongoose, Jest (ts-jest) for backend; Nuxt 4, Vue 3 `<script setup>`, Vuetify 4, `@nuxtjs/i18n`, `@nuxtjs/sitemap` for the `app/` frontend.

## Global Constraints

- Node 24 required. Backend tests: `npm run test:unit` (from repo root). Frontend gate: `cd app && npm run i18n:check` (BLOCKING).
- **No paid translation.** New page-body i18n strings may be English in non-en locales (no parity gate). The ONE gated addition is `PAGE_SEO['/mission']`, which needs a non-empty localized `title`+`description` in all 12 non-en locales — hand-authored (es/pt real, other 10 English-placeholder), no API.
- Frontend data fetching: `useApiBase()` + `useAsyncData` + `$fetch`, and **validate response shape, not truthiness** (the cache wrapper answers a failed producer with `200 { error }`).
- Every page hides `#spinner-wrapper` on mount.
- Internal logic (lookups, slugs, URL building) uses the **English** `item_name`/`location`; only display is localized.
- Steel Path is keyed off `gameMode === "Hard"`, **never** the `(Hard)` name suffix.
- Backend services expose **static, DB-free** pure builders so they unit-test without Mongo. Colocated `services/<Name>.test.ts`, `import { describe, it, expect } from '@jest/globals'`.
- Commit after each task's tests pass.

---

## File Structure

**New:**
- `services/missionSlug.ts` — one pure `missionSlug(planet, location)` helper (shared by DropService + MissionService).
- `services/MissionService.ts` — node metadata sync + join + mission list/detail builders.
- `services/MissionService.test.ts` — DB-free unit tests.
- `sync_nodes.ts` — CLI node-metadata sync (mirrors `sync_drops.ts`).
- `app/app/data/missionNotes.ts` — baked curated "how to get here" notes.
- `app/app/utils/missionSlug.ts` — frontend copy of the slug rule (for star-chart links; keeps one source per side).
- `app/app/pages/mission/[[slug]].vue` — hub + detail page.
- `app/i18n/messages/mission.ts` — page UI strings (13 locales, English body copy).

**Modified:**
- `services/DropService.ts` — `splitFirstDropTable` block-split in `normalizeRotations`; `slug` on `lookupItem` mission rows.
- `services/DropService.test.ts` — block-split + slug tests.
- `constants/index.ts` — `WARFRAME_NODES`, `WARFRAME_SOLNODES` URLs.
- `services/BaseWarframeClient.ts` — build `missionService`; delegate `getMissionList()`, `getMissionDetail(slug)`, `syncNodes()`.
- `services/index.ts` — export `MissionService`.
- `services/CacheWarmer.ts` — add `/missions`.
- `server.ts` — `GET /missions`, `GET /mission/:slug`, `GET /build_nodes`.
- `package.json` (root) — `"sync_nodes"` script.
- `app/app/utils/wikiLinks.ts` — host → `wiki.warframe.com/w/`; node-name collision handling.
- `app/app/components/DropLocationsDialog.vue` — mission row → `NuxtLink` to `/mission/<slug>`; `DropMission.slug?`.
- `app/app/utils/seo.ts` — `PAGE_SEO['/mission']` + `PREFIX_SEO` entry.
- `app/app/utils/seo-i18n-pages.ts` — `/mission` localized copy (12 locales).
- `app/server/api/__sitemap__/urls.ts` — emit indexable mission slugs.
- `app/nuxt.config.ts` — `/mission/**` routeRules.
- `app/app/layouts/default.vue` — nav link.
- `app/i18n/messages/nav.ts` — `nav.items.missions`.

`WarframeFacade.ts` needs **no** edit — `MissionService` is built in the `BaseWarframeClient` constructor (like `DropService`), so both facades inherit it.

---

## Task 1: DropService block-split fix (phantom-row parser bug)

**Files:**
- Modify: `services/DropService.ts` (`normalizeRotations` ~468-481; add `splitFirstDropTable`)
- Test: `services/DropService.test.ts`

**Interfaces:**
- Produces: `DropService.splitFirstDropTable(rewards: IDropReward[]): IDropReward[]` — static, pure.

- [ ] **Step 1: Write the failing tests**

Add to `services/DropService.test.ts`:

```typescript
describe('DropService.splitFirstDropTable', () => {
  it('keeps a clean single-block flat array whole', () => {
    const clean = [
      { itemName: 'A', rarity: 'Common', chance: 50 },
      { itemName: 'B', rarity: 'Common', chance: 50 },
    ];
    expect(DropService.splitFirstDropTable(clean)).toEqual(clean);
  });

  it('keeps only block 1 when several ~100% tables are concatenated (the WFCD bug)', () => {
    // Two 100% tables glued together (mirrors Duviri Repeated Rewards (Hard)).
    const glued = [
      { itemName: 'Real1', rarity: 'Rare', chance: 60 },
      { itemName: 'Real2', rarity: 'Rare', chance: 40 }, // block 1 closes at 100
      { itemName: 'Event1', rarity: 'Uncommon', chance: 70 },
      { itemName: 'Event2', rarity: 'Uncommon', chance: 30 }, // block 2 (dropped)
    ];
    expect(DropService.splitFirstDropTable(glued)).toEqual([
      { itemName: 'Real1', rarity: 'Rare', chance: 60 },
      { itemName: 'Real2', rarity: 'Rare', chance: 40 },
    ]);
  });

  it('tolerates WFCD rounding (block closes at >= 99.5)', () => {
    const glued = [
      { itemName: 'R1', rarity: 'Rare', chance: 9.09 },
      { itemName: 'R2', rarity: 'Rare', chance: 90.9 }, // 99.99 -> close
      { itemName: 'E1', rarity: 'Common', chance: 100 },
    ];
    expect(DropService.splitFirstDropTable(glued)).toEqual([
      { itemName: 'R1', rarity: 'Rare', chance: 9.09 },
      { itemName: 'R2', rarity: 'Rare', chance: 90.9 },
    ]);
  });

  it('dedupes exact (itemName|rarity|chance) rows within the kept block', () => {
    const dupes = [
      { itemName: 'X', rarity: 'Rare', chance: 25 },
      { itemName: 'X', rarity: 'Rare', chance: 25 },
      { itemName: 'Y', rarity: 'Rare', chance: 50 },
    ];
    expect(DropService.splitFirstDropTable(dupes)).toEqual([
      { itemName: 'X', rarity: 'Rare', chance: 25 },
      { itemName: 'Y', rarity: 'Rare', chance: 50 },
    ]);
  });
});

describe('DropService.normalizeMissionRewards block-split integration', () => {
  it('drops the phantom event rows from a mis-concatenated flat node', () => {
    const raw = {
      missionRewards: {
        Duviri: {
          'Endless: Repeated Rewards (Hard)': {
            gameMode: 'Hard',
            rewards: [
              { _id: 'a', itemName: 'SP Arcane', rarity: 'Rare', chance: 100 }, // block 1
              { _id: 'b', itemName: 'Ayatan Cyan Star', rarity: 'Uncommon', chance: 14.29 }, // event
              { _id: 'c', itemName: 'Filler', rarity: 'Common', chance: 85.71 },
            ],
          },
        },
      },
    } as any;
    const planets = DropService.normalizeMissionRewards(raw);
    const node = planets[0].nodes[0];
    expect(node.rotations[0].rewards).toEqual([{ itemName: 'SP Arcane', rarity: 'Rare', chance: 100 }]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- DropService`
Expected: FAIL — `DropService.splitFirstDropTable is not a function`.

- [ ] **Step 3: Add the `splitFirstDropTable` helper**

In `services/DropService.ts`, add this static method directly above `normalizeMissionRewards` (~line 440):

```typescript
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
```

- [ ] **Step 4: Wire it into `normalizeRotations`**

In `services/DropService.ts`, change the flat-array branch of `normalizeRotations` (~line 470-472) from:

```typescript
    if (Array.isArray(rewards)) {
      return rewards.length ? [{ rotation: null, rewards: DropService.cleanRewards(rewards) }] : [];
    }
```

to:

```typescript
    if (Array.isArray(rewards)) {
      if (!rewards.length) return [];
      // Flat arrays can be mis-concatenated event tables (see splitFirstDropTable).
      const cleaned = DropService.splitFirstDropTable(DropService.cleanRewards(rewards));
      return cleaned.length ? [{ rotation: null, rewards: cleaned }] : [];
    }
```

(Rotational `{A,B,C}` tables are untouched — the bug only affects flat arrays.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:unit -- DropService`
Expected: PASS (all DropService suites, including the existing `normalizeMissionRewards` flat-array test — its single-block `Meso B2 Relic` array is returned whole).

- [ ] **Step 6: Commit**

```bash
git add services/DropService.ts services/DropService.test.ts
git commit -m "fix(drops): split mis-concatenated flat reward tables, keep block 1

Removes the ~406 phantom Ayatan/Riven rows (WFCD parser bug appends event
tables to the prior node) and un-inflates star-chart plat/run."
```

---

## Task 2: mission slug helper + slug on dialog rows

**Files:**
- Create: `services/missionSlug.ts`
- Test: `services/missionSlug.test.ts` (new)
- Modify: `services/DropService.ts` (`lookupItem` ~601-608; `IItemDropsResult.missions` ~164-171)
- Modify: `services/DropService.test.ts`

**Interfaces:**
- Produces: `missionSlug(planet: string, location: string): string`.
- Produces: `IItemDropsResult.missions[i].slug: string`.

- [ ] **Step 1: Write the failing test**

Create `services/missionSlug.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals';
import { missionSlug } from './missionSlug';

describe('missionSlug', () => {
  it('kebab-cases planet + location deterministically', () => {
    expect(missionSlug('Sedna', 'Hydron')).toBe('sedna-hydron');
    expect(missionSlug('Duviri', 'Endless: Repeated Rewards (Hard)')).toBe(
      'duviri-endless-repeated-rewards-hard',
    );
  });

  it('collapses punctuation/whitespace and trims stray dashes', () => {
    expect(missionSlug('Dark Refractory, Deimos', 'Nex')).toBe('dark-refractory-deimos-nex');
    expect(missionSlug('Void', 'Ani (Extra)')).toBe('void-ani-extra');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:unit -- missionSlug`
Expected: FAIL — cannot find module `./missionSlug`.

- [ ] **Step 3: Create the helper**

Create `services/missionSlug.ts`:

```typescript
/**
 * @fileoverview Stable URL slug for a mission drop source.
 * @module services/missionSlug
 *
 * `(planet, location)` is unique across the WFCD mission-reward tables (no
 * duplicate planet keys; location keys are unique within a planet), so a kebab
 * of the two is a stable, collision-free id for the /mission/<slug> page. Shared
 * by DropService (stamps it on dialog rows) and MissionService (page lookup).
 */
export function missionSlug(planet: string, location: string): string {
  return `${planet || ''} ${location || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm run test:unit -- missionSlug`
Expected: PASS.

- [ ] **Step 5: Add `slug` to `lookupItem` mission rows**

In `services/DropService.ts`:

1. Add the import at the top (after the `IDatabaseOperations` import, ~line 23):

```typescript
import { missionSlug } from './missionSlug';
```

2. Extend the `missions` shape in `IItemDropsResult` (~line 164-171) — add `slug: string;`:

```typescript
  missions: Array<{
    planet: string;
    location: string;
    gameMode: string;
    rotation: string | null;
    rarity: string;
    chance: number;
    slug: string;
  }>;
```

3. In `lookupItem`, the mission-source push (~line 601-608), add the slug:

```typescript
        missions.push({
          planet: e.planet ?? '',
          location: e.location ?? '',
          gameMode: e.gameMode ?? '',
          rotation: e.rotation ?? null,
          rarity: e.rarity,
          chance: e.chance,
          slug: missionSlug(e.planet ?? '', e.location ?? ''),
        });
```

- [ ] **Step 6: Update the existing lookupItem test**

In `services/DropService.test.ts`, the `resolves a relic to the nodes that drop it directly` test (~line 146-149) now gets a `slug`. Change the expectation to:

```typescript
    expect(res.missions).toEqual([
      {
        planet: 'Earth', location: 'Cervantes', gameMode: 'Survival',
        rotation: 'A', rarity: 'Common', chance: 10, slug: 'earth-cervantes',
      },
    ]);
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm run test:unit -- DropService missionSlug`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add services/missionSlug.ts services/missionSlug.test.ts services/DropService.ts services/DropService.test.ts
git commit -m "feat(drops): stamp a mission slug on drop-dialog rows"
```

---

## Task 3: MissionService pure builders (node join, list, detail)

**Files:**
- Create: `services/MissionService.ts`
- Test: `services/MissionService.test.ts`

**Interfaces:**
- Consumes: `IEnrichedPlanet` (from `DropService`), `missionSlug`.
- Produces:
  - `INodeMeta { uniqueName, slug, planet, location, faction, missionType, minLevel, maxLevel, wikiLink }`
  - `MissionService.normalizeNodes(rawNodes: any[], rawSolNodes: Record<string, any>): INodeMeta[]`
  - `MissionService.deriveSteelPath(min: number, max: number): { minLevel: number; maxLevel: number }`
  - `MissionService.buildMissionList(planets: IEnrichedPlanet[], nodes: INodeMeta[]): IMissionListRow[]`
  - `MissionService.buildMissionDetail(slug, planets, nodes): IMissionDetail | null`

- [ ] **Step 1: Write the failing tests**

Create `services/MissionService.test.ts`:

```typescript
/**
 * @fileoverview Unit tests for MissionService pure builders (no DB).
 * @module tests/services/MissionService.test
 */
import { describe, it, expect } from '@jest/globals';
import { MissionService } from './MissionService';

const rawNodes = [
  {
    uniqueName: 'SolNode195', name: 'Hydron', systemName: 'Sedna',
    missionIndex: 8, factionIndex: 0, minEnemyLevel: 30, maxEnemyLevel: 40,
  },
  {
    uniqueName: 'SolNode888', name: 'War', systemName: 'Sedna', // collides with the weapon
    missionIndex: 0, factionIndex: 0, minEnemyLevel: 30, maxEnemyLevel: 35,
  },
];
const rawSolNodes = {
  SolNode195: { value: 'Hydron (Sedna)', enemy: 'Grineer', type: 'Defense' },
  SolNode888: { value: 'War (Sedna)', enemy: 'Grineer', type: 'Assassination' },
};

// Minimal enriched planets (as DropService.enrichMap returns).
const planets = [
  {
    planet: 'Sedna', value: 12, nodeCount: 1,
    bestNode: { location: 'Hydron', gameMode: 'Defense', value: 12 },
    nodes: [
      {
        location: 'Hydron', gameMode: 'Defense', isEvent: false, value: 12,
        rotations: [
          { rotation: 'A', value: 12, rewards: [
            { itemName: 'X Prime', rarity: 'Rare', chance: 10, price: 120, url_name: 'x_prime', thumb: 'x.png', tradeable: true },
          ] },
        ],
      },
    ],
  },
  {
    planet: 'Duviri', value: 30, nodeCount: 1,
    bestNode: { location: 'Endless: Repeated Rewards (Hard)', gameMode: 'Hard', value: 30 },
    nodes: [
      {
        location: 'Endless: Repeated Rewards (Hard)', gameMode: 'Hard', isEvent: false, value: 30,
        rotations: [{ rotation: null, value: 30, rewards: [] }],
      },
    ],
  },
] as any;

describe('MissionService.normalizeNodes', () => {
  it('joins Node.json to solNodes and disambiguates colliding wiki titles', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    const hydron = nodes.find((n) => n.slug === 'sedna-hydron')!;
    expect(hydron).toMatchObject({
      uniqueName: 'SolNode195', planet: 'Sedna', location: 'Hydron',
      faction: 'Grineer', missionType: 'Defense', minLevel: 30, maxLevel: 40,
      wikiLink: 'Hydron',
    });
    const war = nodes.find((n) => n.slug === 'sedna-war')!;
    expect(war.wikiLink).toBe('War (Node)'); // collision -> (Node) suffix
  });
});

describe('MissionService.deriveSteelPath', () => {
  it('adds +100 to the level range', () => {
    expect(MissionService.deriveSteelPath(30, 40)).toEqual({ minLevel: 130, maxLevel: 140 });
  });
});

describe('MissionService.buildMissionList', () => {
  it('emits one row per drop source, joined to node meta, with an indexable flag', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    const rows = MissionService.buildMissionList(planets, nodes);

    const hydron = rows.find((r) => r.slug === 'sedna-hydron')!;
    expect(hydron).toMatchObject({
      planet: 'Sedna', location: 'Hydron', faction: 'Grineer',
      missionType: 'Defense', minLevel: 30, maxLevel: 40, bestValue: 12, indexable: true,
    });

    // Activity with no node join but valuable rewards -> indexable via value.
    const duviri = rows.find((r) => r.slug === 'duviri-endless-repeated-rewards-hard')!;
    expect(duviri.faction).toBeNull();
    expect(duviri.bestValue).toBe(30);
    expect(duviri.indexable).toBe(true);
  });
});

describe('MissionService.buildMissionDetail', () => {
  it('returns the full node payload with joined meta + steel path', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    const detail = MissionService.buildMissionDetail('sedna-hydron', planets, nodes)!;
    expect(detail.planet).toBe('Sedna');
    expect(detail.node).toMatchObject({
      faction: 'Grineer', missionType: 'Defense', minLevel: 30, maxLevel: 40,
      steelPath: { minLevel: 130, maxLevel: 140 }, wikiLink: 'Hydron',
    });
    expect(detail.rotations[0].rewards[0]).toMatchObject({ itemName: 'X Prime', price: 120 });
    expect(detail.bestValue).toBe(12);
    expect(detail.indexable).toBe(true);
  });

  it('renders an activity (no node join) with node = null', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    const detail = MissionService.buildMissionDetail('duviri-endless-repeated-rewards-hard', planets, nodes)!;
    expect(detail.node).toBeNull();
    expect(detail.gameMode).toBe('Hard');
  });

  it('returns null for an unknown slug', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    expect(MissionService.buildMissionDetail('nope-nope', planets, nodes)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit -- MissionService`
Expected: FAIL — cannot find module `./MissionService`.

- [ ] **Step 3: Create `MissionService.ts` (types + pure builders)**

Create `services/MissionService.ts`:

```typescript
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
  /** Browser-like headers so the raw GitHub / warframestat hosts serve JSON. */
  private static readonly FETCH_HEADERS = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  constructor(private readonly nodesRepository: IDatabaseOperations<any>) {}

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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:unit -- MissionService`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/MissionService.ts services/MissionService.test.ts
git commit -m "feat(mission): MissionService node join + list/detail builders"
```

---

## Task 4: MissionService sync + wiring + endpoints + CLI

**Files:**
- Modify: `constants/index.ts` (`API_URLS`, ~line 27)
- Modify: `services/MissionService.ts` (add instance sync/read + private fetch)
- Modify: `services/index.ts` (export)
- Modify: `services/BaseWarframeClient.ts` (build + delegates)
- Modify: `services/CacheWarmer.ts` (`DEFAULT_WARM_PATHS`)
- Modify: `server.ts` (routes)
- Create: `sync_nodes.ts`
- Modify: `package.json` (root script)

**Interfaces:**
- Consumes: `INodeMeta`, `MissionService.normalizeNodes`, `buildMissionList`, `buildMissionDetail`.
- Produces: `m.getMissionList()`, `m.getMissionDetail(slug)`, `m.syncNodes()`.

- [ ] **Step 1: Add the source URLs**

In `constants/index.ts`, inside `API_URLS` (after line 27, before the closing `} as const;`), add a comma to the previous line and append:

```typescript
  ,
  /** Star-chart node metadata (name/planet/enemy levels), WFCD warframe-items */
  WARFRAME_NODES: 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Node.json',

  /** Node name/enemy/type by SolNodeNNN, WFCD warframe-worldstate-data (+ warframestat fallback) */
  WARFRAME_SOLNODES: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/solNodes.json',
  WARFRAME_SOLNODES_FALLBACK: 'https://api.warframestat.us/solNodes'
```

- [ ] **Step 2: Add the sync + read instance methods to `MissionService`**

In `services/MissionService.ts`, add these methods to the class (after the constructor, before the pure builders):

```typescript
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
```

- [ ] **Step 3: Export it from the barrel**

In `services/index.ts`, add alongside the other service exports:

```typescript
export { MissionService } from './MissionService';
```

- [ ] **Step 4: Build the service + delegates in `BaseWarframeClient`**

In `services/BaseWarframeClient.ts`:

1. Import (with the other service imports near the top):

```typescript
import { MissionService } from './MissionService';
```

2. Declare the field (after `dropService`, ~line 116):

```typescript
  /** Star-chart node metadata + /mission pages (joins DropService's map). */
  protected readonly missionService: MissionService;
```

3. Construct it (in the constructor, right after `this.dropService = ...`, ~line 172). It reuses the same `dbDrops` collection (a third doc, key `'nodes'`):

```typescript
    this.missionService = new MissionService(this.dbDrops as any);
```

4. Add the delegate methods (next to `getDropsMap` / `getItemDrops` / `syncDrops`, ~line 604-622):

```typescript
  /** /missions hub: every drop source with node facts + best plat/run. */
  async getMissionList() {
    const [map, nodes] = await Promise.all([
      this.dropService.getDropsMap(),
      this.missionService.getNodesIndex(),
    ]);
    return { rows: MissionService.buildMissionList(map.planets, nodes), meta: map.meta };
  }

  /** /mission/<slug> detail, or null for an unknown slug. */
  async getMissionDetail(slug: string) {
    const [map, nodes] = await Promise.all([
      this.dropService.getDropsMap(),
      this.missionService.getNodesIndex(),
    ]);
    return MissionService.buildMissionDetail(slug, map.planets, nodes);
  }

  /** Refreshes the node-metadata backup (Node.json + solNodes). */
  async syncNodes() {
    return this.missionService.syncNodes();
  }
```

- [ ] **Step 5: Warm the /missions route**

In `services/CacheWarmer.ts`, add `"/missions"` to `DEFAULT_WARM_PATHS` (after `"/drops/map"`):

```typescript
  "/drops/map",
  "/missions",
```

- [ ] **Step 6: Add the endpoints**

In `server.ts`, after the `build_drops` route (~line 94), add:

```typescript
    // Mission hub: every drop source with node facts + best plat/run.
    server.getJsonCache('missions', async (req: Request): Promise<any> => {
        return m.getMissionList();
    });
    // Mission detail: one node/activity — reward table, facts, freshness.
    server.getJsonCache('mission/:slug', async (req: Request): Promise<any> => {
        const slug = String(req.params.slug || '');
        // Whitelist the slug: the cache key is req.originalUrl, so reject junk.
        if (!/^[a-z0-9-]+$/.test(slug)) return null;
        return m.getMissionDetail(slug);
    });
    // Refreshes the node-metadata backup in Mongo (protected: triggers a real fetch).
    server.getJsonProtected('build_nodes', async (req: Request): Promise<any> => {
        return m.syncNodes();
    });
```

- [ ] **Step 7: Create the CLI sync**

Create `sync_nodes.ts` (mirrors `sync_drops.ts`):

```typescript
import "./env";
import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m', magenta: '\x1b[35m',
};

function log(icon: string, message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

/**
 * Refreshes the star-chart node-metadata backup ({ key: 'nodes' } in
 * warframe-drops): faction, mission type and enemy-level range from WFCD
 * Node.json + solNodes. Powers the /mission pages. WFCD only changes on a game
 * patch, so schedule this (pm2/cron); a failed fetch throws without touching Mongo.
 */
async function main() {
  log('🚀', 'Starting Node Metadata Sync...', colors.bright);
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected', colors.green);

    const m = new WarframeUndici();
    const result = await m.syncNodes();

    log('🛰️', `Nodes synced: ${result.nodes}`, colors.magenta);
    log('🎉', 'NODE SYNC COMPLETE', colors.bright + colors.green);
    process.exit(0);
  } catch (error: any) {
    log('💥', `Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 8: Register the script**

In `package.json` (root), add to `scripts` after `"sync_drops"`:

```json
    "sync_nodes": "ts-node sync_nodes.ts",
```

- [ ] **Step 9: Verify the build + full unit suite**

Run: `npm run build`
Expected: `tsc` succeeds (no type errors from the new wiring).

Run: `npm run test:unit`
Expected: PASS (all suites).

- [ ] **Step 10: Manual smoke test**

Run: `npm run sync_nodes`
Expected: logs `Nodes synced: 269` (±, as WFCD changes), exit 0.

Then with the API running (`npm run dev`):
```bash
curl -s "http://localhost:3529/missions" | head -c 400
curl -s "http://localhost:3529/mission/sedna-hydron" | head -c 600
```
Expected: `/missions` returns `{ rows: [...], meta: {...} }`; `/mission/sedna-hydron` returns a detail object with `node.faction === "Grineer"`, `node.steelPath`, and a `rotations` array.

- [ ] **Step 11: Commit**

```bash
git add constants/index.ts services/MissionService.ts services/index.ts services/BaseWarframeClient.ts services/CacheWarmer.ts server.ts sync_nodes.ts package.json
git commit -m "feat(mission): node-metadata sync, /missions + /mission/:slug endpoints"
```

---

## Task 5: Fix the dead wiki host

**Files:**
- Modify: `app/app/utils/wikiLinks.ts`

**Interfaces:**
- Produces: `nodeWikiUrl(wikiLink: string): string` (new export, used by the mission page).
- `worldWikiUrl`, `itemWikiUrl`, `worldWikiMap` signatures unchanged (host swapped).

- [ ] **Step 1: Verify the new host resolves (sanity)**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" "https://wiki.warframe.com/w/Hydron"
curl -s -o /dev/null -w "%{http_code}\n" "https://wiki.warframe.com/w/The_Circuit"
```
Expected: `200` for both.

- [ ] **Step 2: Repoint the host and add the node helper**

Replace the top of `app/app/utils/wikiLinks.ts` (lines 1-42) with:

```typescript
/**
 * Warframe wiki links for star-chart worlds, nodes, and items. The wiki migrated
 * off Fandom to wiki.warframe.com (path prefix /w/) on 2025-01-31 — Fandom is a
 * stale fork that 403s, so all links target the official host.
 *
 * Node deep-links use a disambiguated title (some node names collide with an
 * item/frame article) — the backend supplies that title as `wikiLink`.
 */

const WIKI_BASE = 'https://wiki.warframe.com/w/'

/** Worlds whose wiki article title differs from the drop-map name. */
const ARTICLE_OVERRIDES: Record<string, string> = {
  Void: 'The Void',
  Zariman: 'Zariman Ten Zero',
  Sanctuary: 'Sanctuary Onslaught',
  'Dark Refractory, Deimos': 'Deimos',
}

/**
 * Open-world articles on the new wiki (the old Fandom Special:AllMaps interactive
 * maps do not exist there, so these point at the landscape's article page).
 */
const INTERACTIVE_MAPS: Record<string, { title: string; path: string }> = {
  Earth: { title: 'Plains of Eidolon', path: 'Plains_of_Eidolon' },
  Venus: { title: 'Orb Vallis', path: 'Orb_Vallis' },
  Deimos: { title: 'Cambion Drift', path: 'Cambion_Drift' },
  Duviri: { title: 'Duviri', path: 'Duviri' },
}

function wikiUrl(title: string): string {
  return WIKI_BASE + encodeURIComponent(title.replace(/ /g, '_'))
}

/** Wiki article URL for a world (always resolvable — falls back to the name). */
export function worldWikiUrl(world: string): string {
  return wikiUrl(ARTICLE_OVERRIDES[world] ?? world)
}

/** Wiki article for a world's open-world landscape, or null when it has none. */
export function worldWikiMap(world: string): { title: string; url: string } | null {
  const m = INTERACTIVE_MAPS[world]
  return m ? { title: m.title, url: wikiUrl(m.path) } : null
}

/** Wiki article for a mission node, using the backend's disambiguated title. */
export function nodeWikiUrl(wikiLink: string): string {
  const s = (wikiLink || '').trim()
  return s ? wikiUrl(s) : ''
}
```

(The `itemWikiUrl` function below line 42 is unchanged — it now inherits the new `WIKI_BASE`.)

- [ ] **Step 3: Verify the frontend type-checks**

Run: `cd app && npm run i18n:check`
Expected: PASS (this also confirms the module imports cleanly; no SEO gaps introduced yet).

- [ ] **Step 4: Commit**

```bash
git add app/app/utils/wikiLinks.ts
git commit -m "fix(wiki): repoint links from dead Fandom host to wiki.warframe.com"
```

---

## Task 6: Link dialog rows to mission pages

**Files:**
- Modify: `app/app/components/DropLocationsDialog.vue` (`DropMission` interface ~178; mission row ~87-97)

**Interfaces:**
- Consumes: `DropData.missions[i].slug` (from the `/drops/item/:name` endpoint, Task 2).

- [ ] **Step 1: Add `slug` to the `DropMission` interface**

In `app/app/components/DropLocationsDialog.vue`, find the `interface DropMission` block (~line 178) and add `slug?: string`:

```typescript
interface DropMission { location: string; planet: string; gameMode: string; rotation?: string; rarity: string; chance: number; slug?: string }
```

- [ ] **Step 2: Ensure `localePath` is available**

In the `<script setup>` block, confirm/add (near the other Nuxt composable calls, e.g. beside `useI18n()`):

```typescript
const localePath = useLocalePath()
```

- [ ] **Step 3: Make the mission row a link**

Replace the mission row's `.dld__where` block (~lines 88-91) with a linked variant that falls back to plain text when no slug is present:

```vue
                <NuxtLink
                  v-if="m.slug"
                  class="dld__where dld__where--link"
                  :to="localePath('/mission/' + m.slug)"
                  @click="close()"
                >
                  <span class="dld__place">{{ m.location }}</span>
                  <span class="dld__planet">{{ m.planet }}</span>
                </NuxtLink>
                <div v-else class="dld__where">
                  <span class="dld__place">{{ m.location }}</span>
                  <span class="dld__planet">{{ m.planet }}</span>
                </div>
```

- [ ] **Step 4: Style the link (scoped)**

In the component's `<style scoped>` block, add:

```css
.dld__where--link { text-decoration: none; cursor: pointer; border-radius: 6px; transition: background 120ms ease; }
.dld__where--link:hover .dld__place { color: var(--energy-hi, #7af0ea); }
.dld__where--link:hover { background: rgba(255, 255, 255, 0.03); }
```

- [ ] **Step 5: Verify the frontend still checks out**

Run: `cd app && npm run i18n:check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/app/components/DropLocationsDialog.vue
git commit -m "feat(mission): link drop-dialog rows to their mission page"
```

---

## Task 7: Baked curated "how to get here" notes

**Files:**
- Create: `app/app/data/missionNotes.ts`

**Interfaces:**
- Produces: `missionNote(slug: string, gameMode: string, planet: string): MissionNote | null`.

- [ ] **Step 1: Create the notes module**

Create `app/app/data/missionNotes.ts`. Content is baked, English, fact-checked from the spec's research (Duviri Circuit / Steel Path Circuit, Onslaught, The Index, Proxima). Matched first by exact slug, then by a `(planet, gameMode)` pattern so all Duviri Hard tiers share one note:

```typescript
/**
 * Baked, hand-authored "how to get here" notes for the /mission pages. WFCD gives
 * reward tables and node facts; it does NOT give unlock paths or access context,
 * which live only on the (robots-blocked) wiki. These fill that gap. English only
 * — page-body strings have no i18n parity gate.
 *
 * Resolution order: exact slug match, then a (planet, gameMode) pattern match, so
 * e.g. every Duviri "Hard" Undercroft tier shares the Steel Path Circuit note.
 */
export interface MissionNote {
  category: 'node' | 'circuit' | 'onslaught' | 'index' | 'proxima'
  /** "How to get here" prose — unlock path / prerequisites. */
  access: string
  tips?: string[]
  related?: { label: string; to: string }[]
}

/** Exact-slug notes (highest priority). */
const BY_SLUG: Record<string, MissionNote> = {
  'duviri-the-circuit': {
    category: 'circuit',
    access:
      'The Circuit is an endless, Warframe-only mode inside Duviri’s Undercroft, reached from the ' +
      'Duviri landscape via Undercroft Portals. It unlocks after completing The Duviri Paradox quest. ' +
      'You pick from 3 offered Warframes and battle an endless chain of Undercroft missions; a weekly ' +
      'Tier ladder (resets Monday 00:00 UTC) pays Warframe parts and, at Tiers 5 and 10, an Incarnon ' +
      'Genesis adapter you choose.',
    tips: [
      'Normal Circuit rewards Warframe component blueprints on a 12-week rotation.',
      'You do not need Steel Path for normal Circuit — only the Duviri Paradox quest.',
    ],
    related: [
      { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
      { label: 'Duviri guide', to: '/guides/duviri' },
    ],
  },
}

/** (planet, gameMode) pattern notes — matched when no exact slug note exists. */
const BY_PATTERN: { planet: string; gameMode: string; note: MissionNote }[] = [
  {
    planet: 'Duviri',
    gameMode: 'Hard',
    note: {
      category: 'circuit',
      access:
        'This is the Steel Path Circuit (the Undercroft at full Steel Path scaling: +100 enemy levels, ' +
        '250% health/shield/armor). To access it you need the base Steel Path unlock — all pre-New War ' +
        'star-chart nodes cleared, then talk to Teshin — PLUS The Duviri Paradox quest and the three base ' +
        'Duviri nodes cleared in normal mode. Past Tier 10 you reach Tier 11+, and every additional 1,400 ' +
        'Circuit progress re-rolls the "Repeated Rewards" pool — the Steel Path arcanes shown below.',
      tips: [
        'Tier 9 (Hard) awards 25× Steel Essence.',
        'Steel Path Circuit runs a separate 9-week Incarnon Genesis rotation (5 weapons/week).',
      ],
      related: [
        { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
        { label: 'Steel Path guide', to: '/guides/steel-path' },
        { label: 'Duviri guide', to: '/guides/duviri' },
      ],
    },
  },
  {
    planet: 'Duviri',
    gameMode: 'Normal',
    note: {
      category: 'circuit',
      access:
        'A normal-mode Duviri Undercroft tier, reached via The Circuit after completing The Duviri ' +
        'Paradox quest. The "Repeated Rewards" (normal) pool is near-worthless (Credits / Endo); the ' +
        'valuable Circuit farm is the Steel Path (Hard) tiers.',
      related: [
        { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
        { label: 'Duviri guide', to: '/guides/duviri' },
      ],
    },
  },
  {
    planet: 'Sanctuary',
    gameMode: '',
    note: {
      category: 'onslaught',
      access:
        'Sanctuary Onslaught (and Elite Sanctuary Onslaught) is Cephalon Simaris’s endless efficiency ' +
        'gauntlet, entered from the Simaris terminal in any Relay. Elite requires Mastery Rank 5+. Keep ' +
        'the Efficiency gauge up by killing quickly and moving through the conduits.',
      related: [{ label: 'Relic value board', to: '/relics-value' }],
    },
  },
  {
    planet: 'Veil Proxima',
    gameMode: '',
    note: {
      category: 'proxima',
      access:
        'A Railjack (Empyrean) region. Reached with a Railjack from the Dry Dock in your Clan Dojo or on ' +
        'the Plexus, after the Rising Tide quest. Proxima enemy levels scale with the region, not a fixed ' +
        'star-chart node.',
    },
  },
]

/** Resolve the best note for a mission page, or null. */
export function missionNote(slug: string, gameMode: string, planet: string): MissionNote | null {
  if (BY_SLUG[slug]) return BY_SLUG[slug]
  for (const p of BY_PATTERN) {
    if (p.planet === planet && (p.gameMode === '' || p.gameMode === gameMode)) return p.note
  }
  return null
}
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `cd app && npm run i18n:check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/app/data/missionNotes.ts
git commit -m "feat(mission): baked curated access notes (Circuit, Onslaught, Proxima)"
```

---

## Task 8: The `/mission` page (hub + detail) + UI strings

**Files:**
- Create: `app/app/utils/missionSlug.ts`
- Create: `app/app/pages/mission/[[slug]].vue`
- Create: `app/i18n/messages/mission.ts`

**Interfaces:**
- Consumes: `/missions` + `/mission/:slug` endpoints; `missionNote`; `nodeWikiUrl`; `missionSlug` (frontend).

- [ ] **Step 1: Frontend slug helper (for star-chart parity, Task 10)**

Create `app/app/utils/missionSlug.ts`:

```typescript
/** Same rule as the backend services/missionSlug.ts — keep them in sync. */
export function missionSlug(planet: string, location: string): string {
  return `${planet || ''} ${location || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 2: UI-string namespace (English body copy, all 13 locales)**

Create `app/i18n/messages/mission.ts`. Body strings are English in every locale (no parity gate); only the top-level namespace must exist per locale. Define the English tree once and reuse it:

```typescript
// /mission page UI strings. Body copy is English across all locales (page-body
// strings have no i18n parity gate — only PAGE_SEO is gated). Real translations
// can be layered later without touching the page.
const en = {
  mission: {
    eyebrow: 'Mission Insight',
    hubTitle: 'Warframe Mission Drop Guide',
    hubLede: 'Every drop source in Warframe, ranked by platinum per run — with enemy levels, faction, and how to get there.',
    searchPlaceholder: 'Search a node, planet or mission type…',
    col: {
      node: 'Node', planet: 'Planet', type: 'Mission', faction: 'Faction',
      level: 'Enemy level', value: 'Plat / run',
    },
    steelPath: 'Steel Path',
    facts: 'Mission facts',
    faction: 'Faction',
    missionType: 'Mission type',
    enemyLevel: 'Enemy level',
    activity: 'Activity — no fixed star-chart node',
    rewards: 'Rewards',
    rotation: 'Rotation {r}',
    bestValue: 'Best plat / run',
    howToGet: 'How to get here',
    relatedLinks: 'Related',
    wiki: 'Open on the Warframe Wiki',
    freshness: 'Drop data as of {date}',
    notFound: 'No mission data for “{slug}”.',
    browseAll: 'Browse all missions',
    noRewards: 'No tradeable rewards at this source.',
  },
}

export default { en, es: en, fr: en, de: en, it: en, pt: en, pl: en, ru: en, uk: en, ja: en, ko: en, 'zh-hans': en, 'zh-hant': en }
```

- [ ] **Step 3: Create the page**

Create `app/app/pages/mission/[[slug]].vue`:

```vue
<!-- /mission — hub (searchable drop-source table) and /mission/<slug> — detail
     (farm value first, then node facts, then "how to get here"). Data-driven from
     WFCD via /missions + /mission/:slug; curated access notes merged client-side. -->
<template>
  <div class="an ms">
    <h1 class="ms-sr">{{ slug ? displayTitle : t('mission.hubTitle') }}</h1>

    <!-- ===== DETAIL ===== -->
    <template v-if="slug">
      <div v-if="detailError || !detail" class="an-console ms-state">
        <p>{{ t('mission.notFound', { slug: prettify(slug) }) }}</p>
        <nuxt-link :to="localePath('/mission')">{{ t('mission.browseAll') }} →</nuxt-link>
      </div>

      <div v-else class="an-console ms-detail">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ detail.planet }}</div>
            <h2 class="an-title accent-a">{{ detail.location }}</h2>
            <p class="an-lede">
              <span v-if="detail.gameMode && detail.gameMode !== 'Normal'" class="ms-badge">{{ detail.gameMode }}</span>
              <span v-if="detail.node?.missionType">{{ detail.node.missionType }}</span>
            </p>
          </div>
          <div class="an-hero__deal">
            <div class="an-hero__deal-label">{{ t('mission.bestValue') }}</div>
            <div class="an-hero__deal-plat">{{ fmtPlat(detail.bestValue) }}p</div>
          </div>
        </header>

        <!-- Node facts -->
        <div class="an-stats">
          <div class="an-stat">
            <div class="an-stat__num">{{ detail.node ? detail.node.faction : '—' }}</div>
            <div class="an-stat__lbl">{{ t('mission.faction') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num">{{ detail.node ? detail.node.missionType : '—' }}</div>
            <div class="an-stat__lbl">{{ t('mission.missionType') }}</div>
          </div>
          <div class="an-stat">
            <div class="an-stat__num is-alt">
              {{ detail.node ? detail.node.minLevel + '–' + detail.node.maxLevel : '—' }}
            </div>
            <div class="an-stat__lbl">{{ t('mission.enemyLevel') }}</div>
          </div>
          <div class="an-stat" v-if="detail.node">
            <div class="an-stat__num is-gold">
              {{ detail.node.steelPath.minLevel }}–{{ detail.node.steelPath.maxLevel }}
            </div>
            <div class="an-stat__lbl">{{ t('mission.steelPath') }}</div>
          </div>
        </div>
        <p v-if="!detail.node" class="ms-activity">{{ t('mission.activity') }}</p>

        <!-- Rewards -->
        <section class="ms-rewards">
          <h3 class="ms-h3">{{ t('mission.rewards') }}</h3>
          <div v-for="(rot, ri) in detail.rotations" :key="'rot' + ri" class="ms-rot">
            <div v-if="rot.rotation" class="ms-rot__lbl">{{ t('mission.rotation', { r: rot.rotation }) }}</div>
            <ul class="ms-list">
              <li v-for="(rw, wi) in rot.rewards" :key="'rw' + wi" class="ms-row">
                <img class="an-thumb" :src="itemThumb({ itemName: rw.itemName, thumb: rw.thumb, urlName: rw.url_name })" :alt="rw.itemName" @error="onImgError" />
                <button class="ms-row__name" type="button" @click="openDrops(rw.itemName, rw.thumb)">{{ localName('items', rw.url_name, rw.itemName) }}</button>
                <span class="ms-row__chance"><i class="ms-dot" :style="{ background: rarityColor(rw.rarity) }"></i>{{ fmtChance(rw.chance) }}%</span>
                <span class="ms-row__plat">{{ rw.tradeable ? fmtPlat(rw.price) + 'p' : '—' }}</span>
              </li>
            </ul>
            <p v-if="!rot.rewards.length" class="an-empty">{{ t('mission.noRewards') }}</p>
          </div>
        </section>

        <!-- How to get here (curated) -->
        <section v-if="note" class="ms-note">
          <h3 class="ms-h3">{{ t('mission.howToGet') }}</h3>
          <p class="ms-note__access">{{ note.access }}</p>
          <ul v-if="note.tips?.length" class="ms-note__tips">
            <li v-for="(tip, ti) in note.tips" :key="'tip' + ti">{{ tip }}</li>
          </ul>
          <div v-if="note.related?.length" class="ms-note__rel">
            <span class="ms-note__rel-lbl">{{ t('mission.relatedLinks') }}</span>
            <nuxt-link v-for="(r, xi) in note.related" :key="'rel' + xi" :to="localePath(r.to)" class="an-chip">{{ r.label }}</nuxt-link>
          </div>
        </section>

        <footer class="ms-foot">
          <a v-if="wikiHref" :href="wikiHref" target="_blank" rel="noopener noreferrer" class="ms-foot__wiki">{{ t('mission.wiki') }} ↗</a>
        </footer>
      </div>
    </template>

    <!-- ===== HUB ===== -->
    <template v-else>
      <div class="an-console ms-hub">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">{{ t('mission.eyebrow') }}</div>
            <h2 class="an-title">{{ t('mission.hubTitle') }}</h2>
            <p class="an-lede">{{ t('mission.hubLede') }}</p>
          </div>
        </header>
        <div class="an-filters"><div class="an-filters__row">
          <input v-model="q" class="an-search an-field" :placeholder="t('mission.searchPlaceholder')" />
        </div></div>
        <div class="an-tablewrap">
          <table class="an-table">
            <thead><tr>
              <th class="col-name">{{ t('mission.col.node') }}</th>
              <th>{{ t('mission.col.planet') }}</th>
              <th>{{ t('mission.col.type') }}</th>
              <th>{{ t('mission.col.faction') }}</th>
              <th>{{ t('mission.col.level') }}</th>
              <th class="an-num">{{ t('mission.col.value') }}</th>
            </tr></thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.slug">
                <td><nuxt-link :to="localePath('/mission/' + row.slug)" class="ms-link">{{ row.location }}</nuxt-link></td>
                <td>{{ row.planet }}</td>
                <td>{{ row.missionType || (row.gameMode !== 'Normal' ? row.gameMode : '—') }}</td>
                <td>{{ row.faction || '—' }}</td>
                <td>{{ row.minLevel != null ? row.minLevel + '–' + row.maxLevel : '—' }}</td>
                <td class="an-num an-strong">{{ fmtPlat(row.bestValue) }}p</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { missionNote } from '~/data/missionNotes'

interface Reward { itemName: string; url_name: string; thumb: string; rarity: string; chance: number; price: number; tradeable: boolean }
interface Rotation { rotation: string | null; value: number; rewards: Reward[] }
interface Detail {
  slug: string; planet: string; location: string; gameMode: string; isEvent: boolean
  node: { faction: string; missionType: string; minLevel: number; maxLevel: number; steelPath: { minLevel: number; maxLevel: number }; wikiLink: string } | null
  rotations: Rotation[]; bestValue: number; indexable: boolean
}
interface ListRow { slug: string; planet: string; location: string; gameMode: string; faction: string | null; missionType: string | null; minLevel: number | null; maxLevel: number | null; bestValue: number; indexable: boolean }

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const base = useApiBase() as string
const { localName } = useLocalizedName()
const { itemThumb } = useItemThumb()

const slug = computed(() => route.params.slug as string | undefined)

// Hub list
const { data: listData } = await useAsyncData('missions', async () => {
  const r = await $fetch<any>(`${base}/missions`)
  return r && Array.isArray(r.rows) ? r : { rows: [] }
})
const rows = computed<ListRow[]>(() => listData.value?.rows ?? [])
const q = ref('')
const filteredRows = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return rows.value
  return rows.value.filter((r) =>
    (r.location + ' ' + r.planet + ' ' + (r.missionType || '') + ' ' + (r.faction || '')).toLowerCase().includes(s),
  )
})

// Detail
const { data: detail, error: detailErr } = await useAsyncData<Detail | null>(
  () => `mission-${slug.value || 'none'}`,
  async () => {
    if (!slug.value) return null
    const r = await $fetch<any>(`${base}/mission/${encodeURIComponent(slug.value)}`)
    return r && Array.isArray(r.rotations) ? (r as Detail) : null
  },
  { watch: [slug] },
)
const detailError = computed(() => !!detailErr.value)
const displayTitle = computed(() => (detail.value ? `${detail.value.location} — ${detail.value.planet}` : ''))

const note = computed(() =>
  detail.value ? missionNote(detail.value.slug, detail.value.gameMode, detail.value.planet) : null,
)
const wikiHref = computed(() => (detail.value?.node ? nodeWikiUrl(detail.value.node.wikiLink) : ''))

// A page is noindex when it has no node facts AND no curated note AND no value.
const shouldIndex = computed(
  () => !slug.value || !!(detail.value && (detail.value.indexable || note.value)),
)

// SEO: runtime title from the node; robots noindex for thin activity pages.
const missionSeo = PAGE_SEO['/mission']
useSeoPage({
  title: () =>
    slug.value && detail.value
      ? `${detail.value.location} (${detail.value.planet}) — Drops, Enemy Levels & Access | Warframe`
      : missionSeo?.title ?? '',
  description: () =>
    slug.value && detail.value
      ? `Where ${detail.value.location} sits on the Warframe star chart: full reward table with platinum value, enemy levels, faction, Steel Path scaling and how to unlock it.`
      : missionSeo?.description ?? '',
})
useHead(() => (shouldIndex.value ? {} : { meta: [{ name: 'robots', content: 'noindex' }] }))

// Reused helpers
function prettify(s?: string) { return prettifySlug(s) }
function rarityColor(r: string): string {
  const k = (r || '').toLowerCase()
  if (k === 'legendary') return '#35d6d0'
  if (k === 'rare') return '#e7cf95'
  if (k === 'uncommon') return '#b6c0cc'
  return '#c08457'
}
function fmtChance(v: number) { return v >= 10 ? v.toFixed(0) : v.toFixed(2) }
function onImgError(e: Event) { (e.target as HTMLImageElement).src = THUMB_PLACEHOLDER }

// Drop dialog reuse
const dropsDialog = ref(false)
const dropsItem = ref('')
const dropsThumb = ref('')
function openDrops(name: string, thumb: string) { dropsItem.value = name; dropsThumb.value = thumb || ''; dropsDialog.value = true }

onMounted(() => {
  const el = document.getElementById('spinner-wrapper')
  if (el) el.style.display = 'none'
})
</script>

<style scoped>
.ms-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.ms-badge { display: inline-block; padding: 1px 8px; margin-right: 8px; border-radius: 4px; background: var(--orokin-dim); color: var(--gold-ink); font-family: var(--font-hud); font-size: 0.8rem; }
.ms-activity { color: var(--ink-dim); font-style: italic; margin: 4px 0 0; }
.ms-h3 { font-family: var(--font-display); color: var(--gold-ink); font-size: 1.1rem; margin: 24px 0 12px; }
.ms-rot__lbl { color: var(--energy); font-family: var(--font-hud); font-size: 0.85rem; margin: 12px 0 6px; }
.ms-list { list-style: none; margin: 0; padding: 0; }
.ms-row { display: grid; grid-template-columns: 34px 1fr auto auto; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid var(--line); }
.ms-row__name { background: none; border: none; color: var(--ink); text-align: left; cursor: pointer; font: inherit; padding: 0; }
.ms-row__name:hover { color: var(--energy-hi, #7af0ea); }
.ms-row__chance { color: var(--ink-dim); font-family: var(--font-hud); }
.ms-row__plat { color: var(--gold-ink); font-family: var(--font-hud); min-width: 56px; text-align: right; }
.ms-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.ms-note__access { color: var(--ink); line-height: 1.6; }
.ms-note__tips { color: var(--ink-dim); }
.ms-note__rel { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 12px; }
.ms-note__rel-lbl { color: var(--ink-dim); font-family: var(--font-hud); font-size: 0.85rem; }
.ms-foot { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--orokin-line); }
.ms-foot__wiki { color: var(--energy); text-decoration: none; font-family: var(--font-hud); }
.ms-link, .ms-link:visited { color: var(--gold-ink); text-decoration: none; }
.ms-link:hover { color: var(--energy-hi, #7af0ea); }
.ms-state { text-align: center; padding: 48px 16px; }
</style>
```

Add the drop dialog at the end of the template (inside the root `<div class="an ms">`, before its close):

```vue
    <DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" :thumb="dropsThumb" />
```

- [ ] **Step 4: Verify the frontend checks out**

Run: `cd app && npm run i18n:check`
Expected: FAIL with a `/mission` SEO-parity gap (expected — Task 9 adds the SEO copy). Confirm the ONLY failures mention `/mission`. If any other error appears (compile/duplicate), fix it before moving on.

- [ ] **Step 5: Commit**

```bash
git add app/app/utils/missionSlug.ts app/app/pages/mission/[[slug]].vue app/i18n/messages/mission.ts
git commit -m "feat(mission): /mission hub + detail page with curated access notes"
```

---

## Task 9: SEO wiring, nav, routeRules, sitemap (turns the gate green)

**Files:**
- Modify: `app/app/utils/seo.ts` (`PAGE_SEO` + `PREFIX_SEO`)
- Modify: `app/app/utils/seo-i18n-pages.ts` (`/mission` in 12 locales)
- Modify: `app/app/layouts/default.vue` (nav)
- Modify: `app/i18n/messages/nav.ts` (`nav.items.missions`)
- Modify: `app/nuxt.config.ts` (routeRules)
- Modify: `app/server/api/__sitemap__/urls.ts` (mission slugs)

**Interfaces:**
- Produces: `PAGE_SEO['/mission']`; localized `/mission` in every locale (satisfies `i18n:check`).

- [ ] **Step 1: English SEO copy + prefix fallback**

In `app/app/utils/seo.ts`:

1. Add to `PAGE_SEO` (after the `/star-chart-3d` entry, ~line 112):

```typescript
  '/mission': {
    title: 'Warframe Mission Drop Guide — Farm Value, Levels & Access',
    description:
      'Every Warframe mission and activity ranked by platinum per run: full reward tables, drop chances, enemy levels, faction, Steel Path scaling and how to unlock each one.'
  },
```

2. Add to `PREFIX_SEO` (~line 316), so `/mission/<slug>` children inherit copy + breadcrumb label:

```typescript
  ['/mission', '/mission'],
```

- [ ] **Step 2: Localized `/mission` copy for all 12 non-en locales**

In `app/app/utils/seo-i18n-pages.ts`, add a `'/mission'` entry inside EACH locale block. `es` and `pt` get real copy; the other ten (`de, fr, ru, ko, ja, zh-hans, zh-hant, pl, it, uk`) get the English copy as a soft-duplicate placeholder (no paid translation). Also add the `en` entry for completeness.

`en` block:
```typescript
    "/mission": {
      "title": "Warframe Mission Drop Guide — Farm Value, Levels & Access",
      "description": "Every Warframe mission and activity ranked by platinum per run: full reward tables, drop chances, enemy levels, faction, Steel Path scaling and how to unlock each one."
    },
```

`es` block:
```typescript
    "/mission": {
      "title": "Guía de misiones de Warframe — Valor de farmeo, niveles y acceso",
      "description": "Cada misión y actividad de Warframe ordenada por platino por partida: tablas de recompensas completas, probabilidades de drop, niveles de enemigos, facción, escalado de Steel Path y cómo desbloquear cada una."
    },
```

`pt` block:
```typescript
    "/mission": {
      "title": "Guia de missões do Warframe — Valor de farm, níveis e acesso",
      "description": "Cada missão e atividade do Warframe classificada por platina por run: tabelas de recompensa completas, chances de drop, níveis de inimigos, facção, escalonamento do Steel Path e como desbloquear cada uma."
    },
```

For `de, fr, ru, ko, ja, zh-hans, zh-hant, pl, it, uk` blocks, add the **English** entry (verbatim copy of the `en` block above). If any of these locale blocks does not yet exist in the file, create it as `"<code>": { "/mission": { ...english... } },`.

- [ ] **Step 3: Nav link**

In `app/app/layouts/default.vue`, add to `navLinks` (after the `/star-chart-3d` entry, ~line 199):

```typescript
  { to: '/mission', key: 'missions', icon: 'mdi-map-search-outline', group: 'Analytics' },
```

- [ ] **Step 4: Nav label**

In `app/i18n/messages/nav.ts`, add a `missions` key under `nav.items` for each locale. English `'Missions'` for all is acceptable (nav has no parity gate); add it to at least the `en` block and any locale blocks present:

```typescript
        missions: 'Missions',
```

- [ ] **Step 5: routeRules for the high-cardinality detail route**

In `app/nuxt.config.ts`, inside `nitro.routeRules` (after the `/relic/**` entries, ~line 107), add:

```typescript
      '/mission/**': { cache: false },
```

And extend the per-locale generator (the `NON_DEFAULT_LOCALES.flatMap` block, ~line 108-113) to include mission:

```typescript
      ...Object.fromEntries(
        NON_DEFAULT_LOCALES.flatMap((c) => [
          [`/${c}/set/**`, { cache: false }],
          [`/${c}/relic/**`, { cache: false }],
          [`/${c}/mission/**`, { cache: false }]
        ])
      ),
```

- [ ] **Step 6: Sitemap source**

In `app/server/api/__sitemap__/urls.ts`, after the catalogue loop populates `urls` (before `return urls`, ~line 34), fetch the mission list and append indexable slugs:

```typescript
  const config2 = useRuntimeConfig()
  const missionBase = (config2.apiInternal as string) || (config2.public.apiURL as string)
  const missions = await $fetch<{ rows?: Array<{ slug?: string; indexable?: boolean }> }>(
    `${missionBase}/missions`,
    { timeout: 20000, retry: 1 },
  ).catch(() => ({ rows: [] as Array<{ slug?: string; indexable?: boolean }> }))
  for (const row of missions?.rows ?? []) {
    if (row?.slug && row.indexable) {
      urls.push({ loc: `/mission/${row.slug}`, _i18nTransform: true, changefreq: 'weekly', priority: 0.5 })
    }
  }
```

(`config`/`base` already exist at the top of the handler; the `config2`/`missionBase` locals avoid redeclaring them.)

- [ ] **Step 7: Run the blocking gate**

Run: `cd app && npm run i18n:check`
Expected: PASS — `✓ all i18n messages compile — no duplicate keys` (the `/mission` SEO gap is now filled in every locale).

- [ ] **Step 8: Manual smoke test**

With API + app running (`npm run dev` at root, `cd app && npm run dev`):
- Visit `/mission` → searchable table, rows sorted by plat/run.
- Visit `/mission/sedna-hydron` → Grineer / Defense / 30–40 / SP 130–140, reward table, wiki link resolves to `wiki.warframe.com/w/Hydron`.
- Visit `/mission/duviri-endless-repeated-rewards-hard` → no node facts, "Activity" note, the Steel Path Circuit "how to get here" block, related links to `/circuit` + `/guides/steel-path`.
- Open any `DropLocationsDialog` (e.g. from `/relics-value`) → a "Drops directly at" row navigates to its mission page.

- [ ] **Step 9: Commit**

```bash
git add app/app/utils/seo.ts app/app/utils/seo-i18n-pages.ts app/app/layouts/default.vue app/i18n/messages/nav.ts app/nuxt.config.ts app/server/api/__sitemap__/urls.ts
git commit -m "feat(mission): SEO, nav, routeRules and sitemap for /mission pages"
```

---

## Task 10 (optional): Star-chart "details →" links

**Files:**
- Modify: `app/app/pages/star-chart.vue` (node panel)
- Modify: `app/app/pages/star-chart-3d.vue` (node panel)

**Interfaces:**
- Consumes: frontend `missionSlug(planet, location)` (Task 8).

- [ ] **Step 1: Add a link in the 2D star-chart node panel**

In `app/app/pages/star-chart.vue`, where a selected node's header/title renders (`node.location`), add a link next to it:

```vue
<nuxt-link :to="localePath('/mission/' + missionSlug(selectedPlanet, node.location))" class="sc-node-details">details →</nuxt-link>
```

Ensure `missionSlug` is available (it auto-imports from `app/app/utils/missionSlug.ts`) and `localePath` exists in the page (add `const localePath = useLocalePath()` if absent). Use the page's actual variable for the current planet name in place of `selectedPlanet`.

- [ ] **Step 2: Same for the 3D page**

In `app/app/pages/star-chart-3d.vue`, in the node panel (`node.gameMode` / `bestNode` area, ~line 207/296), add the same `nuxt-link` using that page's planet + node variables.

- [ ] **Step 3: Verify + commit**

Run: `cd app && npm run i18n:check`
Expected: PASS.

```bash
git add app/app/pages/star-chart.vue app/app/pages/star-chart-3d.vue
git commit -m "feat(mission): link star-chart node panels to /mission pages"
```

---

## Self-Review

**Spec coverage:**
- Parser-bug fix (spec §"The parser-bug fix") → Task 1. ✓
- Slug on dialog rows → Task 2. ✓
- MissionService builders + node join + SP derive + list/detail (spec §Architecture 1) → Task 3. ✓
- Node sync, endpoints, facade wiring, CLI, warmer (spec §Architecture 1, §Files) → Task 4. ✓
- Wiki-host fix + node-collision disambiguation (spec §"The wiki-host fix") → Task 5. ✓
- Dialog row link (spec §Architecture 3 "Dialog wiring") → Task 6. ✓
- Curated notes (spec §Architecture 2) → Task 7. ✓
- Page hub+detail, farm-first layout, noindex thin pages, soft-404, spinner hide (spec §Architecture 3) → Task 8. ✓
- SEO PAGE_SEO+PREFIX_SEO, localized parity, nav, routeRules, sitemap (spec §"SEO/i18n/sitemap/nav") → Task 9. ✓
- Star-chart light touch (spec §Architecture 3 "Star-chart") → Task 10 (optional). ✓
- Freshness banner (spec §Data sources) → **partial**: backend does not yet surface `info.json`; the page shows drop data via the endpoint. Freshness date is a nice-to-have deferred (the `mission.freshness` i18n key exists for a later wire-up). Noted, not blocking.

**Placeholder scan:** No TBD/TODO; every code step shows real code. ✓

**Type consistency:** `INodeMeta`, `IMissionListRow`, `IMissionDetail` defined in Task 3 and consumed unchanged in Tasks 4/8. `missionSlug` identical in `services/missionSlug.ts` (Task 2) and `app/app/utils/missionSlug.ts` (Task 8). `getMissionList` returns `{ rows, meta }` (Task 4) — the page reads `r.rows` (Task 8) and the sitemap reads `rows` (Task 9). `splitFirstDropTable` name consistent (Task 1). `nodeWikiUrl` defined (Task 5) and consumed (Task 8). ✓

**Note on freshness:** the `mission.freshness` string is defined but not rendered in v1 (deferred). Left in place intentionally so a follow-up can surface the WFCD `info.json` date without an i18n change.
