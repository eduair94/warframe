/**
 * @fileoverview Unit tests for DropService's pure helpers
 * @module tests/services/DropService.test
 *
 * All the interesting logic — normalizing WFCD data, the expected-value join,
 * blueprint-tolerant name matching, and the relic "second hop" — is static and
 * DB-free, so these tests never touch Mongo.
 */

import { describe, it, expect } from '@jest/globals';
import { DropService } from './DropService';

const rawMissions = {
  missionRewards: {
    Earth: {
      // rotation object form (A/B/C)
      Cervantes: {
        gameMode: 'Survival',
        isEvent: false,
        rewards: {
          A: [{ _id: 'x1', itemName: 'Lith A1 Relic', rarity: 'Common', chance: 10 }],
          C: [{ _id: 'x2', itemName: 'Forma Blueprint', rarity: 'Legendary', chance: 0.5 }],
        },
      },
      // flat-array form (no rotation)
      Gaia: {
        gameMode: 'Defense',
        rewards: [{ _id: 'x3', itemName: 'Meso B2 Relic', rarity: 'Uncommon', chance: 20 }],
      },
    },
    Venus: {
      Fossa: {
        gameMode: 'Assassination',
        rewards: { A: [{ _id: 'x4', itemName: 'Nova Prime Neuroptics Blueprint', rarity: 'Uncommon', chance: 11 }] },
      },
    },
  },
} as any;

const rawRelics = {
  relics: [
    {
      tier: 'Lith',
      relicName: 'A1',
      state: 'Intact',
      rewards: [
        { itemName: 'Nova Prime Neuroptics Blueprint', rarity: 'Uncommon', chance: 11 },
        { itemName: 'Forma Blueprint', rarity: 'Common', chance: 25 },
      ],
    },
    // non-Intact states must be filtered out
    { tier: 'Meso', relicName: 'B2', state: 'Radiant', rewards: [{ itemName: 'Something', rarity: 'Rare', chance: 2 }] },
  ],
} as any;

const priceItems = [
  { item_name: 'Lith A1 Relic', url_name: 'lith_a1_relic', thumb: 'lith.png', market: { sell: 15 } },
  // market omits the "Blueprint" suffix WFCD uses -> exercises matchKeys tolerance
  { item_name: 'Nova Prime Neuroptics', url_name: 'nova_prime_neuroptics', thumb: 'nova.png', market: { sell: 22 } },
  { item_name: 'Meso B2 Relic', url_name: 'meso_b2_relic', thumb: 'meso.png', market: { sell: 8 } },
  // 'Forma Blueprint' intentionally absent -> untradeable, price 0
];

describe('DropService.normalizeMissionRewards', () => {
  it('handles both rotation-object and flat-array reward shapes', () => {
    const planets = DropService.normalizeMissionRewards(rawMissions);
    const earth = planets.find((p) => p.planet === 'Earth')!;
    const cervantes = earth.nodes.find((n) => n.location === 'Cervantes')!;
    const gaia = earth.nodes.find((n) => n.location === 'Gaia')!;

    expect(cervantes.rotations.map((r) => r.rotation)).toEqual(['A', 'C']);
    expect(cervantes.gameMode).toBe('Survival');
    expect(gaia.rotations).toHaveLength(1);
    expect(gaia.rotations[0].rotation).toBeNull();
    // _id is stripped from rewards
    expect(gaia.rotations[0].rewards[0]).toEqual({ itemName: 'Meso B2 Relic', rarity: 'Uncommon', chance: 20 });
  });
});

describe('DropService.normalizeRelics', () => {
  it('keeps only Intact-state relics', () => {
    const relics = DropService.normalizeRelics(rawRelics);
    expect(relics).toHaveLength(1);
    expect(relics[0].tier).toBe('Lith');
  });
});

describe('DropService.matchKeys', () => {
  it('is tolerant of the Blueprint suffix, Set suffix, and parentheticals', () => {
    expect(DropService.matchKeys('Nova Prime Neuroptics Blueprint')).toContain('nova prime neuroptics');
    expect(DropService.matchKeys('Nova Prime Neuroptics')).toContain('nova prime neuroptics blueprint');
    expect(DropService.matchKeys('Ash Prime Set')).toContain('ash prime');
    expect(DropService.matchKeys('Excalibur Prime (Something)')).toContain('excalibur prime');
  });
});

describe('DropService.enrichMap', () => {
  it('computes expected plat/run per rotation and rolls up node/planet headline values', () => {
    const planets = DropService.normalizeMissionRewards(rawMissions);
    const priceMap = DropService.buildPriceMap(priceItems);
    const enriched = DropService.enrichMap(planets, priceMap);

    const earth = enriched.find((p) => p.planet === 'Earth')!;
    const gaia = earth.nodes.find((n) => n.location === 'Gaia')!;
    const cervantes = earth.nodes.find((n) => n.location === 'Cervantes')!;

    // Gaia: 20% × 8p = 1.6 ; Cervantes best rotation: 10% × 15p = 1.5 (Forma untradeable -> 0)
    expect(gaia.value).toBeCloseTo(1.6, 5);
    expect(cervantes.value).toBeCloseTo(1.5, 5);

    // planet headline = richest node; nodes sorted by value desc
    expect(earth.value).toBeCloseTo(1.6, 5);
    expect(earth.bestNode!.location).toBe('Gaia');
    expect(earth.nodes[0].location).toBe('Gaia');

    // untradeable reward -> price 0, tradeable false
    const forma = cervantes.rotations.find((r) => r.rotation === 'C')!.rewards[0];
    expect(forma).toMatchObject({ itemName: 'Forma Blueprint', price: 0, tradeable: false });

    // blueprint-suffixed WFCD name matched to the market's suffix-less listing
    const venus = enriched.find((p) => p.planet === 'Venus')!;
    const fossa = venus.nodes[0].rotations[0].rewards[0];
    expect(fossa).toMatchObject({ price: 22, url_name: 'nova_prime_neuroptics', tradeable: true });
    expect(venus.value).toBeCloseTo(2.42, 5);
  });
});

describe('DropService.lookupItem', () => {
  const planets = DropService.normalizeMissionRewards(rawMissions);
  const relics = DropService.normalizeRelics(rawRelics);
  const index = DropService.buildIndex(planets, relics);

  it('resolves a prime part to its relics and where those relics drop (second hop)', () => {
    const res = DropService.lookupItem('Nova Prime Neuroptics', index);

    // contained in Lith A1
    expect(res.relics).toHaveLength(1);
    expect(res.relics[0].relicName).toBe('Lith A1');
    // Lith A1 itself drops at Earth/Cervantes rotation A
    expect(res.relics[0].farmNodes).toEqual([
      { planet: 'Earth', location: 'Cervantes', gameMode: 'Survival', rotation: 'A', chance: 10 },
    ]);
  });

  it('resolves a relic to the nodes that drop it directly', () => {
    const res = DropService.lookupItem('Lith A1 Relic', index);
    expect(res.missions).toEqual([
      {
        planet: 'Earth', location: 'Cervantes', gameMode: 'Survival',
        rotation: 'A', rarity: 'Common', chance: 10, slug: 'earth-cervantes',
      },
    ]);
    expect(res.relics).toHaveLength(0);
  });

  it('returns empty results for an unknown item', () => {
    const res = DropService.lookupItem('Nonexistent Widget', index);
    expect(res.missions).toHaveLength(0);
    expect(res.relics).toHaveLength(0);
  });
});

describe('DropService.relicKey / droppingRelicKeys', () => {
  it('relicKey normalizes a relic item name and strips the trailing " Relic"', () => {
    expect(DropService.relicKey('Lith A1 Relic')).toBe('lith a1');
    expect(DropService.relicKey('  Neo   V12   Relic ')).toBe('neo v12');
    // Not a relic -> no key.
    expect(DropService.relicKey('Ash Prime Blueprint')).toBeNull();
    expect(DropService.relicKey('')).toBeNull();
  });

  it('collects currently-dropping relic keys from mission-source index entries only', () => {
    const planets = DropService.normalizeMissionRewards(rawMissions);
    const relics = DropService.normalizeRelics(rawRelics);
    const index = DropService.buildIndex(planets, relics);
    const keys = DropService.droppingRelicKeys(index);

    // Lith A1 Relic (Earth/Cervantes) + Meso B2 Relic (Earth/Gaia) drop from nodes.
    expect(keys.has('lith a1')).toBe(true);
    expect(keys.has('meso b2')).toBe(true);
    // Prime parts and Forma are mission drops but not relics -> excluded.
    // Relic-source entries (a relic's own contents) are not mission drops -> excluded.
    expect(keys.size).toBe(2);
  });
});

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
