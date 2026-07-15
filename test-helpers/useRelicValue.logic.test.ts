/**
 * @fileoverview Unit tests for the shared relic-valuation logic that powers the
 * /relic-farming and /relics-value pages. Runs under the backend jest setup with
 * a tiny `vue` stub (see jest.config moduleNameMapper) since the module only uses
 * `unref` from Vue.
 *
 * The point under test is the volume-awareness the pages gained: a drop nobody
 * is buying (0 volume) must contribute ~nothing to a relic's realizable payout,
 * and a vaulted relic must be identifiable so it can be filtered off the farming
 * board.
 */

import { describe, it, expect } from '@jest/globals';
import {
  VOL_K,
  rewardBasis,
  rewardLiquidity,
  effectivePrice,
  hasFullData,
  isVaulted,
  payoutLiquidity,
  relicSellNow,
  useRelicValue,
  type RelicRow,
} from '../app/app/composables/useRelicValue';
// demandTier moved to the shared marketFormat module (dedup of the identical
// endo/relic copies); import it from there now.
import { demandTier } from '../app/app/composables/marketFormat';

const reward = (over: Partial<RelicRow['rewards'][number]> = {}) => ({
  item_name: 'Part',
  rarity: 'Rare',
  price: 100,
  avgPrice: 90,
  volume: 10,
  ...over,
});

const relic = (over: Partial<RelicRow> = {}): RelicRow => ({
  url_name: 'meso_n11_relic',
  relicName: 'Meso N11',
  tier: 'Meso',
  thumb: '',
  vaulted: false,
  relic: { buy: 8, sell: 12, volume: 50, avgPrice: 11 },
  rewards: [reward()],
  ...over,
});

describe('rewardLiquidity', () => {
  it('is 0 for a zero-volume drop', () => {
    expect(rewardLiquidity(reward({ volume: 0 }))).toBe(0);
  });
  it('is 0.5 when volume equals VOL_K', () => {
    expect(rewardLiquidity(reward({ volume: VOL_K }))).toBeCloseTo(0.5, 6);
  });
  it('approaches 1 as volume grows', () => {
    expect(rewardLiquidity(reward({ volume: 1000 }))).toBeGreaterThan(0.98);
  });
});

describe('rewardBasis', () => {
  it('prefers the 48h average over the raw ask', () => {
    expect(rewardBasis(reward({ price: 100, avgPrice: 90 }))).toBe(90);
  });
  it('falls back to the raw ask when there is no average', () => {
    expect(rewardBasis(reward({ price: 100, avgPrice: 0 }))).toBe(100);
  });
});

describe('effectivePrice', () => {
  it('is ~0 for an overpriced, unsold drop regardless of ask', () => {
    expect(effectivePrice(reward({ price: 999, avgPrice: 0, volume: 0 }))).toBe(0);
  });
  it('discounts a liquid drop by its volume weight', () => {
    // basis 90, vol 10 -> 90 * 10/20 = 45
    expect(effectivePrice(reward({ price: 100, avgPrice: 90, volume: 10 }))).toBeCloseTo(45, 6);
  });
});

describe('hasFullData', () => {
  it('is true when the relic is on the market and every drop is priced', () => {
    expect(hasFullData(relic())).toBe(true);
  });
  it('is false when the relic itself is not listed', () => {
    expect(hasFullData(relic({ relic: { buy: 0, sell: 0, volume: 0, avgPrice: 0 } }))).toBe(false);
  });
  it('is false when a drop has no price', () => {
    expect(hasFullData(relic({ rewards: [reward({ price: 0, avgPrice: 0 })] }))).toBe(false);
  });
  it('treats Forma (untradeable) as priced', () => {
    expect(hasFullData(relic({ rewards: [reward({ item_name: 'Forma Blueprint', price: 0, avgPrice: 0, volume: 0 })] }))).toBe(true);
  });
});

describe('isVaulted', () => {
  it('flags a vaulted relic', () => {
    expect(isVaulted(relic({ vaulted: true }))).toBe(true);
  });
  it('treats a missing flag as not vaulted (never hides an unknown)', () => {
    expect(isVaulted(relic({ vaulted: undefined }))).toBe(false);
  });
});

describe('payoutLiquidity', () => {
  it('is 0 when no drop has any volume (dead market)', () => {
    const dead = relic({
      rewards: [
        reward({ rarity: 'Rare', price: 300, avgPrice: 0, volume: 0 }),
        reward({ rarity: 'Uncommon', price: 40, avgPrice: 0, volume: 0 }),
      ],
    });
    expect(payoutLiquidity(dead, 'Radiant')).toBe(0);
  });
  it('is 1 when every drop is fully liquid', () => {
    const liquid = relic({
      rewards: [
        reward({ rarity: 'Rare', price: 100, avgPrice: 100, volume: 100000 }),
        reward({ rarity: 'Common', price: 10, avgPrice: 10, volume: 100000 }),
      ],
    });
    expect(payoutLiquidity(liquid, 'Radiant')).toBeGreaterThan(0.99);
  });
  it('is bounded in [0,1] for a mixed relic', () => {
    const mixed = relic({
      rewards: [
        reward({ rarity: 'Rare', price: 200, avgPrice: 180, volume: 30 }),
        reward({ rarity: 'Common', price: 6, avgPrice: 6, volume: 0 }),
      ],
    });
    const l = payoutLiquidity(mixed, 'Radiant');
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThanOrEqual(1);
  });
});

describe('relicSellNow', () => {
  // The bug this fixes: wf.market relic bids are polluted with non-executable
  // high offers, so the top bid alone over-states what a relic sells for.
  it('caps a bait-high bid at the 48h clearing average', () => {
    // bid 130, ask 30, avg 30 -> you realistically get the going rate, not 130
    const r = relic({ relic: { buy: 130, sell: 30, volume: 1, avgPrice: 30 } });
    expect(relicSellNow(r)).toBe(30);
  });
  it('shows a genuine bid that sits below the going rate', () => {
    // normal book: bid 18 < avg 22 -> the buyer's real offer wins
    const r = relic({ relic: { buy: 18, sell: 25, volume: 40, avgPrice: 22 } });
    expect(relicSellNow(r)).toBe(18);
  });
  it('falls back to the lowest ask when the relic has not traded (no avg)', () => {
    const r = relic({ relic: { buy: 0, sell: 40, volume: 0, avgPrice: 0 } });
    expect(relicSellNow(r)).toBe(40);
  });
  it('uses the lowest ask as the rate when there is no 48h average but there are bids', () => {
    // avg 0 -> rate falls back to ask 12; bid 130 caps to 12
    const r = relic({ relic: { buy: 130, sell: 12, volume: 0, avgPrice: 0 } });
    expect(relicSellNow(r)).toBe(12);
  });
  it('is 0 for a relic with no market at all', () => {
    const r = relic({ relic: { buy: 0, sell: 0, volume: 0, avgPrice: 0 } });
    expect(relicSellNow(r)).toBe(0);
  });
  it('returns the bid when there is a bid but no ask/avg to anchor against', () => {
    const r = relic({ relic: { buy: 9, sell: 0, volume: 0, avgPrice: 0 } });
    expect(relicSellNow(r)).toBe(9);
  });
});

describe('demandTier', () => {
  it('buckets by liquidity fraction', () => {
    expect(demandTier(0.9).key).toBe('high');
    expect(demandTier(0.5).key).toBe('med');
    expect(demandTier(0.1).key).toBe('low');
    expect(demandTier(0).key).toBe('dead');
  });
});

describe('useRelicValue', () => {
  it('realizable EV is at or below raw EV (illiquid drops discounted)', () => {
    const { evLiquid, evRaw } = useRelicValue('Radiant');
    const r = relic({
      rewards: [
        reward({ rarity: 'Rare', price: 300, avgPrice: 0, volume: 0 }), // dead
        reward({ rarity: 'Uncommon', price: 20, avgPrice: 19, volume: 25 }), // liquid
      ],
    });
    expect(evLiquid(r)).toBeLessThan(evRaw(r));
  });

  it('a fully-dead relic has 0 realizable EV even with high sticker prices', () => {
    const { evLiquid } = useRelicValue('Radiant');
    const dead = relic({
      rewards: [reward({ rarity: 'Rare', price: 999, avgPrice: 0, volume: 0 })],
    });
    expect(evLiquid(dead)).toBe(0);
  });

  it('reacts to the refinement passed as a ref', () => {
    const ref = { value: 'Intact' } as { value: string };
    const { evLiquid } = useRelicValue(ref as any);
    const r = relic({ rewards: [reward({ rarity: 'Rare', price: 100, avgPrice: 100, volume: 1000 })] });
    const intact = evLiquid(r); // Rare @ Intact = 2%
    ref.value = 'Radiant'; // Rare @ Radiant = 10%
    const radiant = evLiquid(r);
    expect(radiant).toBeGreaterThan(intact);
  });

  it('topDrop returns the highest realizable contributor, not the priciest sticker', () => {
    const { topDrop } = useRelicValue('Radiant');
    const r = relic({
      rewards: [
        reward({ item_name: 'Sticker Trap', rarity: 'Rare', price: 999, avgPrice: 0, volume: 0 }),
        reward({ item_name: 'Real Earner', rarity: 'Rare', price: 120, avgPrice: 110, volume: 80 }),
      ],
    });
    expect(topDrop(r).item_name).toBe('Real Earner');
  });
});
