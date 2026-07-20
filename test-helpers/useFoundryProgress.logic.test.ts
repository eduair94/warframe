/**
 * @fileoverview Unit tests for the /foundry mastery, resource and cost maths.
 * Pure module; runs under the backend jest setup.
 *
 * The behaviours that matter:
 *  - the mastery formula matches the game (and warframe-foundry.app), so a
 *    migrating user does not see their rank change;
 *  - excluded items are HIDDEN, never counted as done — counting them would
 *    silently inflate progress;
 *  - resource needs come from what is NOT BUILT, not what is not mastered.
 */

import { describe, it, expect } from '@jest/globals';
import {
  counterPoints,
  keysUpToMasteryReq,
  missingCosts,
  rankInfo,
  rankThresholds,
  resourceNeeds,
  summarize,
  summarizeMissingCosts,
  type CatalogueItem,
  type CatalogueResource,
  type FoundryProgress,
} from '../app/app/composables/useFoundryProgress';

const item = (over: Partial<CatalogueItem> & { uniqueKey: string }): CatalogueItem => ({
  uniqueName: `/Lotus/${over.uniqueKey}`,
  name: over.uniqueKey,
  category: 'primary',
  masteryReq: 0,
  masteryPoints: 3000,
  components: [],
  ...over,
});

const empty = (): FoundryProgress => ({
  items: {},
  resources: {},
  counters: {},
  excluded: [],
});

describe('rank maths', () => {
  it('uses the 2500 x rank^2 curve up to 30', () => {
    const t = rankThresholds();
    expect(t[0]).toBe(0);
    expect(t[1]).toBe(2500);
    expect(t[10]).toBe(250_000);
    expect(t[30]).toBe(2_250_000);
  });

  it('adds a flat step per Legendary rank', () => {
    const t = rankThresholds();
    expect(t[31]).toBe(2_397_500);
    expect(t[34]).toBe(2_840_000);
  });

  it('reports the rank, the next threshold and the fraction towards it', () => {
    const info = rankInfo(3750); // rank 1 (2500) -> rank 2 (10 000)
    expect(info.rank).toBe(1);
    expect(info.label).toBe('1');
    expect(info.nextAt).toBe(10_000);
    expect(info.progress).toBeCloseTo(1250 / 7500, 10);
  });

  it('labels Legendary ranks and caps progress at the top', () => {
    expect(rankInfo(2_397_500).label).toBe('Legendary 1');
    const capped = rankInfo(9_999_999);
    expect(capped.rank).toBe(34);
    expect(capped.nextAt).toBeNull();
    expect(capped.progress).toBe(1);
  });

  it('floors at rank 0 for junk input', () => {
    expect(rankInfo(-100).rank).toBe(0);
    expect(rankInfo(Number.NaN as any).points).toBe(0);
  });
});

describe('counterPoints', () => {
  it('matches the game formula', () => {
    expect(
      counterPoints({
        missions: 10,
        steelMissions: 5,
        junctions: 2,
        steelJunctions: 1,
        intrinsics: 4,
      })
    ).toBe(63 * 10 + 63 * 5 + 1000 * 2 + 1000 * 1 + 1500 * 4);
  });

  it('treats missing / junk counters as zero', () => {
    expect(counterPoints({})).toBe(0);
    expect(counterPoints(undefined as any)).toBe(0);
    expect(counterPoints({ missions: -5, junctions: 'x' as any })).toBe(0);
  });
});

describe('summarize', () => {
  const catalogue = [
    item({ uniqueKey: 'A', category: 'primary' }),
    item({ uniqueKey: 'B', category: 'primary' }),
    item({ uniqueKey: 'W', category: 'warframes', masteryPoints: 6000 }),
  ];

  it('counts built and mastered separately', () => {
    const progress = empty();
    progress.items = { A: { built: true }, W: { built: true, mastered: true } };
    const s = summarize(catalogue, progress);
    expect(s.total).toBe(3);
    expect(s.built).toBe(2);
    expect(s.mastered).toBe(1);
    expect(s.itemPoints).toBe(6000);
    expect(s.maxItemPoints).toBe(12_000);
    expect(s.ratio).toBeCloseTo(1 / 3, 10);
  });

  it('adds the counters into the rank', () => {
    const progress = empty();
    progress.items = { W: { mastered: true } };
    progress.counters = { junctions: 2 };
    const s = summarize(catalogue, progress);
    expect(s.counterPoints).toBe(2000);
    expect(s.points).toBe(8000);
    expect(s.rank.rank).toBe(1);
  });

  it('HIDES excluded items rather than counting them as done', () => {
    const progress = empty();
    progress.excluded = ['B'];
    const s = summarize(catalogue, progress);
    expect(s.total).toBe(2);
    expect(s.mastered).toBe(0);
    expect(s.ratio).toBe(0);
    expect(s.maxItemPoints).toBe(9000);
  });

  it('hides founder-only gear unless asked for', () => {
    const withFounder = [...catalogue, item({ uniqueKey: 'ExcalPrime', founderOnly: true })];
    expect(summarize(withFounder, empty()).total).toBe(3);
    expect(summarize(withFounder, empty(), { includeFounder: true }).total).toBe(4);
  });

  it('breaks progress down per category', () => {
    const progress = empty();
    progress.items = { A: { mastered: true } };
    const s = summarize(catalogue, progress);
    const primary = s.byCategory.find((c) => c.category === 'primary')!;
    expect(primary).toMatchObject({ total: 2, mastered: 1, points: 3000, maxPoints: 6000 });
    expect(primary.ratio).toBe(0.5);
  });

  it('handles an empty catalogue without dividing by zero', () => {
    const s = summarize([], empty());
    expect(s.ratio).toBe(0);
    expect(s.rank.rank).toBe(0);
  });
});

describe('resourceNeeds', () => {
  const catalogue = [
    item({
      uniqueKey: 'A',
      components: [
        { uniqueKey: 'Ferrite', name: 'Ferrite', itemCount: 1000, resource: true },
        { uniqueKey: 'ABlueprint', name: 'Blueprint', itemCount: 1 },
      ],
    }),
    item({
      uniqueKey: 'B',
      components: [{ uniqueKey: 'Ferrite', name: 'Ferrite', itemCount: 500, resource: true }],
    }),
  ];
  const resources: CatalogueResource[] = [
    { uniqueKey: 'Ferrite', name: 'Ferrite', perCategory: {}, total: 1500 },
  ];

  it('sums what un-built items still consume', () => {
    const rows = resourceNeeds(catalogue, resources, empty());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ uniqueKey: 'Ferrite', needed: 1500, have: 0, short: 1500 });
  });

  it('stops counting an item once it is BUILT (not merely mastered)', () => {
    const progress = empty();
    progress.items = { A: { built: true }, B: { mastered: true } };
    const rows = resourceNeeds(catalogue, resources, progress);
    // A is built so its 1000 drops out; B is only "mastered" — its 500 remains,
    // because a mastered-but-never-built item still has to be crafted.
    expect(rows[0].needed).toBe(500);
  });

  it('subtracts what the player already has', () => {
    const progress = empty();
    progress.resources = { Ferrite: 1000 };
    const rows = resourceNeeds(catalogue, resources, progress);
    expect(rows[0]).toMatchObject({ needed: 1500, have: 1000, short: 500 });
  });

  it('never reports a negative shortfall', () => {
    const progress = empty();
    progress.resources = { Ferrite: 99_999 };
    expect(resourceNeeds(catalogue, resources, progress)[0].short).toBe(0);
  });

  it('scales the remainder by components already owned', () => {
    const partial = [
      item({
        uniqueKey: 'A',
        components: [
          { uniqueKey: 'Ferrite', name: 'Ferrite', itemCount: 4, resource: true },
        ],
      }),
    ];
    const progress = empty();
    progress.items = { A: { comp: { Ferrite: 3 } } };
    expect(resourceNeeds(partial, resources, progress)[0].needed).toBe(1);
  });

  it('ignores excluded items', () => {
    const progress = empty();
    progress.excluded = ['A', 'B'];
    expect(resourceNeeds(catalogue, resources, progress)).toEqual([]);
  });

  it('falls back to the raw key when the resource is not in the catalogue', () => {
    const rows = resourceNeeds(catalogue, [], empty());
    expect(rows[0].name).toBe('Ferrite');
  });
});

describe('missingCosts', () => {
  const catalogue = [
    item({ uniqueKey: 'A', market: 'a_set', masteryPoints: 3000 }),
    item({ uniqueKey: 'B', market: 'b_set', masteryPoints: 6000, category: 'warframes' }),
    item({ uniqueKey: 'C' }), // untradable, no market link
    item({ uniqueKey: 'D', market: 'd_set' }),
  ];
  const prices: Record<string, number> = { a_set: 60, b_set: 30, d_set: 0 };
  const priceOf = (u: string) => prices[u] ?? null;

  it('prices only what is not mastered yet', () => {
    const progress = empty();
    progress.items = { A: { mastered: true } };
    const rows = missingCosts(catalogue, progress, priceOf);
    expect(rows.map((r) => r.uniqueKey)).toEqual(['B', 'C', 'D']);
  });

  it('leaves plat null for untradable or unpriced items', () => {
    const rows = missingCosts(catalogue, empty(), priceOf);
    expect(rows.find((r) => r.uniqueKey === 'C')!.plat).toBeNull();
    // A zero price is "no live listing", not "free".
    expect(rows.find((r) => r.uniqueKey === 'D')!.plat).toBeNull();
  });

  it('computes plat per mastery point', () => {
    const rows = missingCosts(catalogue, empty(), priceOf);
    expect(rows.find((r) => r.uniqueKey === 'A')!.platPerPoint).toBeCloseTo(0.02, 10);
    expect(rows.find((r) => r.uniqueKey === 'B')!.platPerPoint).toBeCloseTo(0.005, 10);
  });

  it('totals only the priced rows and ranks the best value first', () => {
    const totals = summarizeMissingCosts(missingCosts(catalogue, empty(), priceOf));
    expect(totals.items).toBe(4);
    expect(totals.priced).toBe(2);
    expect(totals.plat).toBe(90);
    expect(totals.points).toBe(9000);
    // B buys 6000 mastery for 30p — far better value than A.
    expect(totals.bestValue[0].uniqueKey).toBe('B');
  });

  it('respects the exclusion list', () => {
    const progress = empty();
    progress.excluded = ['A', 'B', 'C', 'D'];
    expect(missingCosts(catalogue, progress, priceOf)).toEqual([]);
  });
});

describe('keysUpToMasteryReq', () => {
  const catalogue = [
    item({ uniqueKey: 'A', masteryReq: 0 }),
    item({ uniqueKey: 'B', masteryReq: 5 }),
    item({ uniqueKey: 'C', masteryReq: 12 }),
    item({ uniqueKey: 'F', masteryReq: 0, founderOnly: true }),
  ];

  it('returns everything at or below the cap, founder gear excluded', () => {
    expect(keysUpToMasteryReq(catalogue, 5)).toEqual(['A', 'B']);
    expect(keysUpToMasteryReq(catalogue, 0)).toEqual(['A']);
    expect(keysUpToMasteryReq(catalogue, 30)).toEqual(['A', 'B', 'C']);
  });

  it('can include founder gear on request', () => {
    expect(keysUpToMasteryReq(catalogue, 0, { includeFounder: true })).toEqual(['A', 'F']);
  });
});
