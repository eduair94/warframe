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
      {
        location: 'Unknown Vault', gameMode: 'Exterminate', isEvent: false, value: 0,
        rotations: [{ rotation: 'A', value: 0, rewards: [] }],
      },
    ],
  },
  {
    planet: 'Duviri', value: 30, nodeCount: 1,
    bestNode: { location: 'Endless: Repeated Rewards (Hard)', gameMode: 'Hard', value: 30 },
    nodes: [
      {
        location: 'Endless: Repeated Rewards (Hard)', gameMode: 'Hard', isEvent: false, value: 30,
        rotations: [{ rotation: null, value: 30, rewards: [
          { itemName: '1,000 Endo', rarity: 'Common', chance: 50, price: 0, url_name: '', thumb: '', tradeable: false },
          { itemName: 'Arcane Blessing', rarity: 'Rare', chance: 50, price: 60, url_name: 'arcane_blessing', thumb: '', tradeable: true },
        ] }],
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

    // An activity with no node join still has a useful reward comparison.
    const duviri = rows.find((r) => r.slug === 'duviri-endless-repeated-rewards-hard')!;
    expect(duviri.faction).toBeNull();
    expect(duviri.bestValue).toBe(30);
    expect(duviri.indexable).toBe(true);
  });

  it('marks activities with no node metadata and no reward content as non-indexable', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    const rows = MissionService.buildMissionList(planets, nodes);

    const unknown = rows.find((r) => r.slug === 'sedna-unknown-vault')!;
    expect(unknown).toMatchObject({
      planet: 'Sedna', location: 'Unknown Vault', faction: null,
      missionType: null, minLevel: null, maxLevel: null, bestValue: 0, indexable: false,
    });
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

  it('marks activities with no node metadata and no reward content as non-indexable', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    const detail = MissionService.buildMissionDetail('sedna-unknown-vault', planets, nodes)!;
    expect(detail.node).toBeNull();
    expect(detail.bestValue).toBe(0);
    expect(detail.indexable).toBe(false);
  });

  it('returns null for an unknown slug', () => {
    const nodes = MissionService.normalizeNodes(rawNodes, rawSolNodes);
    expect(MissionService.buildMissionDetail('nope-nope', planets, nodes)).toBeNull();
  });
});

describe('MissionService content-based indexability', () => {
  const reward = (itemName: string, chance = 50) => ({
    itemName, chance, rarity: 'Common', price: 0, url_name: '', thumb: '', tradeable: false,
  });
  const outcomes = [reward('150 Endo'), reward('Ash Systems Blueprint')];
  function results(rotations: unknown, value = 0, withMetadata = false) {
    const node = { location: 'Hydron', gameMode: 'Defense', isEvent: false, value, rotations };
    const input = [{ planet: 'Sedna', value, nodeCount: 1, bestNode: null, nodes: [node] }] as any;
    const metadata = withMetadata ? MissionService.normalizeNodes(rawNodes, rawSolNodes) : [];
    return {
      row: MissionService.buildMissionList(input, metadata)[0],
      detail: MissionService.buildMissionDetail('sedna-hydron', input, metadata)!,
    };
  }
  function expectIndexable(rotations: unknown, expected: boolean, value = 0) {
    const { row, detail } = results(rotations, value);
    expect(row.indexable).toBe(expected);
    expect(detail.indexable).toBe(expected);
    expect(row.slug).toBe(detail.slug);
    expect(row.bestValue).toBe(value);
    expect(detail.bestValue).toBe(value);
    expect(detail.rotations).toBe(rotations);
  }

  it.each([30, 0.6, 0])('keeps non-tradeable reward tables indexable at %s platinum', (value) => {
    expectIndexable([{ rotation: 'A', value, rewards: outcomes }], true, value);
  });

  it('accepts distinct guaranteed rewards in separate rotations', () => {
    expectIndexable([
      { rotation: 'A', value: 0, rewards: [reward('100 Endo', 100)] },
      { rotation: 'B', value: 0, rewards: [reward('150 Endo', 100)] },
    ], true);
  });

  it('preserves node facts as sufficient content even with an empty reward table', () => {
    const { row, detail } = results([], 0, true);
    expect(row.indexable).toBe(true);
    expect(detail.indexable).toBe(true);
    expect(detail.node?.faction).toBe('Grineer');
  });

  it('does not treat price alone as content when rewards are empty or malformed', () => {
    for (const rotations of [undefined, null, {}, [], [null], [{ rewards: null }], [{ rewards: {} }], [{ rewards: [] }]]) {
      expectIndexable(rotations, false, 500);
    }
  });

  it('does not count a duplicated reward as multiple outcomes across rotations', () => {
    expectIndexable([
      { rotation: 'A', rewards: [reward('150 Endo'), reward('150 Endo')] },
      { rotation: 'B', rewards: [reward(' 150   ENDO '), reward('１５０ Endo')] },
    ], false, 500);
  });

  it('does not qualify one reward plus invalid probabilities', () => {
    for (const chance of [undefined, null, '50', NaN, Infinity, -Infinity, -1, 0, 100.01]) {
      expectIndexable([{ rotation: null, rewards: [outcomes[0], { ...outcomes[1], chance }] }], false);
    }
  });

  it('does not qualify blank, non-text or markup reward names', () => {
    for (const itemName of [undefined, null, 123, {}, '', '   ', '---', '12345', '<b>Blueprint</b>']) {
      expectIndexable([{ rotation: null, rewards: [outcomes[0], { ...outcomes[1], itemName }] }], false);
    }
  });

  it('keeps valid named outcomes usable alongside malformed rows', () => {
    expectIndexable([
      null,
      { rotation: 'A', rewards: [null, reward('Blueprint', 0), ...outcomes] },
    ], true);
  });
});
