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
