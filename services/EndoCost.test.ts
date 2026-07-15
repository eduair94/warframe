/**
 * @fileoverview Unit tests for the wiki-verified endo fusion / dissolve maths.
 * @module tests/services/EndoCost.test
 *
 * Anchors from the Warframe Wiki (cross-checked on individual mod pages,
 * 2026-07-14): Common r10 = 10,230; Serration (Uncommon r10) = 20,460; Hornet
 * Strike (Rare r5) = 930; Primed/Umbral/Archon r10 = 40,920.
 */

import { describe, it, expect } from '@jest/globals';
import {
  rarityTier,
  cumulativeEndo,
  endoToMax,
  creditsToMax,
  endoFromRankToMax,
  creditsFromRankToMax,
  dissolveEndo,
  isEndoRankableMod,
} from './EndoCost';

describe('EndoCost.endoToMax', () => {
  it('matches wiki totals for each rarity at rank 10', () => {
    expect(endoToMax('Common', 10)).toBe(10230);
    expect(endoToMax('Uncommon', 10)).toBe(20460); // Serration
    expect(endoToMax('Rare', 10)).toBe(30690); // Galvanized / corrupted r10
    expect(endoToMax('Legendary', 10)).toBe(40920); // Primed / Umbral
  });

  it('honours per-mod max rank (Hornet Strike is Rare but caps at r5)', () => {
    expect(endoToMax('Rare', 5)).toBe(930);
    expect(endoToMax('Uncommon', 5)).toBe(620); // aura r5 (Steel Charge)
    expect(endoToMax('Uncommon', 3)).toBe(140); // stance r3 (Blind Justice)
    expect(endoToMax('Common', 3)).toBe(70);
  });

  it('maps archon → Legendary and peculiar → Uncommon', () => {
    expect(rarityTier('archon')).toBe(4);
    expect(rarityTier('peculiar')).toBe(2);
    expect(endoToMax('archon', 10)).toBe(40920);
  });

  it('returns 0 for unknown rarity or non-rankable mods', () => {
    expect(endoToMax('mythic', 10)).toBe(0);
    expect(endoToMax('Rare', 0)).toBe(0);
    expect(rarityTier(undefined)).toBe(0);
  });
});

describe('EndoCost.creditsToMax', () => {
  it('matches wiki credit totals at rank 10', () => {
    expect(creditsToMax('Common', 10)).toBe(494109);
    expect(creditsToMax('Uncommon', 10)).toBe(988218);
    expect(creditsToMax('Rare', 10)).toBe(1482327);
    expect(creditsToMax('Legendary', 10)).toBe(1976436);
  });
});

describe('EndoCost.endoFromRankToMax', () => {
  it('finishing from a partial rank costs less than from unranked', () => {
    // Rare r10: full = 30,690. Buying an r5 copy skips the first 930 endo.
    expect(endoFromRankToMax('Rare', 0, 10)).toBe(endoToMax('Rare', 10));
    expect(endoFromRankToMax('Rare', 5, 10)).toBe(30690 - 930);
    // The saving IS the cumulative cost of the ranks you skipped.
    expect(endoFromRankToMax('Rare', 5, 10)).toBe(
      cumulativeEndo('Rare', 10) - cumulativeEndo('Rare', 5),
    );
  });

  it('the last rank-up alone (r9→r10) is half the whole climb + 30', () => {
    // Rare rank 9→10 increment = 30 * 2^9 = 15,360.
    expect(endoFromRankToMax('Rare', 9, 10)).toBe(15360);
    expect(creditsFromRankToMax('Rare', 9, 10)).toBe(1449 * 512);
  });

  it('is 0 when fromRank ≥ maxRank', () => {
    expect(endoFromRankToMax('Rare', 10, 10)).toBe(0);
    expect(endoFromRankToMax('Rare', 11, 10)).toBe(0);
  });
});

describe('EndoCost.dissolveEndo', () => {
  it('returns floor(0.75·cumulative) + tier·5', () => {
    // Common r10: 0.75·10,230 = 7,672.5 → 7,672 + base 5 = 7,677.
    expect(dissolveEndo('Common', 10)).toBe(7677);
    // Uncommon r10: 0.75·20,460 + 10 = 15,355.
    expect(dissolveEndo('Uncommon', 10)).toBe(15355);
    // Legendary r10: 0.75·40,920 + 20 = 30,710.
    expect(dissolveEndo('Legendary', 10)).toBe(30710);
  });
  it('an unranked mod dissolves for just its base (tier·5)', () => {
    expect(dissolveEndo('Common', 0)).toBe(5);
    expect(dissolveEndo('Rare', 0)).toBe(15);
  });
});

describe('EndoCost.isEndoRankableMod', () => {
  it('excludes Requiem/Kuva mods and their Invocation variants', () => {
    expect(isEndoRankableMod('xata', ['mod', 'rare', 'parazon'])).toBe(false);
    expect(isEndoRankableMod('vome', ['mod', 'rare', 'parazon'])).toBe(false);
    expect(isEndoRankableMod('xata_invocation', ['mod', 'rare', 'tome'])).toBe(false);
    expect(isEndoRankableMod('anything', ['mod', 'requiem'])).toBe(false);
  });
  it('keeps normal endo-rankable mods', () => {
    expect(isEndoRankableMod('serration', ['mod', 'uncommon'])).toBe(true);
    expect(isEndoRankableMod('narrow_minded', ['mod', 'rare', 'corrupted'])).toBe(true);
    expect(isEndoRankableMod('primed_continuity', ['mod', 'legendary'])).toBe(true);
  });
});
