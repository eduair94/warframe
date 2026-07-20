/**
 * @fileoverview Unit tests for the /vault valuation logic. Runs under the
 * backend jest setup (jest.config moduleNameMapper stubs `vue` + `#imports`)
 * because the module is pure — no reactivity, no Nuxt.
 *
 * The point of the module, and so of these tests: a holding is worth what you
 * can actually SELL, not what the lowest ask says. An illiquid item must not
 * inflate a collection's headline value.
 */

import { describe, it, expect } from '@jest/globals';
import {
  VOL_K,
  liquidity,
  unitPrice,
  valueHolding,
  vaultTotals,
  verdictFor,
  type VaultMarket,
} from '../app/app/composables/useVaultValue';

const market = (over: Partial<VaultMarket> = {}): VaultMarket => ({
  sell: 100,
  buy: 80,
  avg_price: 95,
  median: 92,
  volume: 30,
  ...over,
});

describe('unitPrice', () => {
  it('defaults to the lowest ask', () => {
    expect(unitPrice(market())).toBe(100);
  });

  it('honours each basis', () => {
    expect(unitPrice(market(), 'buy')).toBe(80);
    expect(unitPrice(market(), 'avg')).toBe(95);
    expect(unitPrice(market(), 'median')).toBe(92);
  });

  it('falls back down the chain when a basis is missing', () => {
    expect(unitPrice(market({ sell: 0 }), 'sell')).toBe(95); // -> avg
    expect(unitPrice(market({ sell: 0, avg_price: 0 }), 'sell')).toBe(92); // -> median
    expect(unitPrice(market({ sell: 0, avg_price: 0, median: 0 }), 'sell')).toBe(80); // -> buy
    expect(unitPrice(market({ buy: 0 }), 'buy')).toBe(95);
  });

  it('is 0 when there is no market at all', () => {
    expect(unitPrice(null)).toBe(0);
    expect(unitPrice({})).toBe(0);
    expect(unitPrice({ sell: -5 } as VaultMarket)).toBe(0);
  });
});

describe('liquidity', () => {
  it('is 0.5 exactly at VOL_K', () => {
    expect(liquidity({ volume: VOL_K })).toBeCloseTo(0.5, 10);
  });

  it('is 0 with no volume and approaches 1 as volume grows', () => {
    expect(liquidity({ volume: 0 })).toBe(0);
    expect(liquidity({})).toBe(0);
    expect(liquidity({ volume: 10_000 })).toBeGreaterThan(0.99);
  });
});

describe('valueHolding', () => {
  it('discounts value by liquidity', () => {
    const row = valueHolding({ url_name: 'a_set', item_name: 'A', qty: 4 }, market({ volume: 10 }));
    expect(row.value).toBe(400); // headline: 100 x 4
    expect(row.realizable).toBeCloseTo(200, 6); // 50% liquidity weight
    expect(row.unitRealizable).toBeCloseTo(50, 6);
  });

  it('can be told not to discount', () => {
    const row = valueHolding(
      { url_name: 'a_set', item_name: 'A', qty: 4 },
      market({ volume: 10 }),
      'sell',
      false
    );
    expect(row.realizable).toBe(400);
    expect(row.liquidity).toBe(1);
  });

  it('measures P/L against the realizable value, not the headline ask', () => {
    // Bought 2 at 60p; ask 100p but only half of it is realistically obtainable.
    const row = valueHolding(
      { url_name: 'a_set', item_name: 'A', qty: 2, cost: 60 },
      market({ volume: VOL_K })
    );
    expect(row.realizable).toBeCloseTo(100, 6); // 50 x 2
    expect(row.pnl).toBeCloseTo(-20, 6); // 100 - 120 paid
    expect(row.pnlPct).toBeCloseTo(-20 / 120, 6);
  });

  it('leaves P/L null when no cost basis was recorded', () => {
    const row = valueHolding({ url_name: 'a_set', item_name: 'A', qty: 1 }, market());
    expect(row.pnl).toBeNull();
    expect(row.pnlPct).toBeNull();
  });

  it('rounds and floors quantity', () => {
    expect(valueHolding({ url_name: 'a', item_name: 'A', qty: 2.6 }, market()).qty).toBe(3);
    expect(valueHolding({ url_name: 'a', item_name: 'A', qty: -4 }, market()).qty).toBe(0);
  });

  it('survives a missing market', () => {
    const row = valueHolding({ url_name: 'a_set', item_name: 'A', qty: 3 }, null);
    expect(row.value).toBe(0);
    expect(row.realizable).toBe(0);
    expect(row.verdict).toBe('unknown');
  });
});

describe('verdictFor', () => {
  it('flags thin markets before anything else', () => {
    // Even sitting at its all-time high, a 1-volume item is not sellable.
    expect(verdictFor(market({ volume: 1, pctFromAth: 0 }))).toBe('thin');
    expect(verdictFor(market({ volume: 0 }))).toBe('thin');
  });

  it('says sell at/near the all-time high', () => {
    expect(verdictFor(market({ pctFromAth: -2 }))).toBe('sell');
    expect(verdictFor(market({ pctFromAth: 5 }))).toBe('sell');
  });

  it('says sell on a hard weekly run-up', () => {
    expect(verdictFor(market({ pctFromAth: -40, change7d: 22 }))).toBe('sell');
  });

  it('says hold otherwise', () => {
    expect(verdictFor(market({ pctFromAth: -40, change7d: 2 }))).toBe('hold');
  });

  it('says unknown with no usable price', () => {
    expect(verdictFor(market({ sell: 0, buy: 0, avg_price: 0, median: 0 }))).toBe('unknown');
    expect(verdictFor(null)).toBe('unknown');
  });
});

describe('vaultTotals', () => {
  it('aggregates units, value, realizable and P/L', () => {
    const rows = [
      valueHolding({ url_name: 'a', item_name: 'A', qty: 2, cost: 10 }, market({ volume: 1e6 })),
      valueHolding({ url_name: 'b', item_name: 'B', qty: 1 }, market({ sell: 50, volume: 1e6 })),
      valueHolding({ url_name: 'c', item_name: 'C', qty: 5 }, {}),
    ];
    const totals = vaultTotals(rows);
    expect(totals.items).toBe(3);
    expect(totals.units).toBe(8);
    expect(totals.value).toBeCloseTo(250, 4); // 200 + 50 + 0
    expect(totals.realizable).toBeCloseTo(250, 0);
    expect(totals.pnlRows).toBe(1);
    expect(totals.pnl).toBeCloseTo(180, 0); // ~200 realizable - 20 paid
    expect(totals.unpriced).toBe(1);
  });

  it('is all-zero for an empty vault', () => {
    expect(vaultTotals([])).toEqual({
      items: 0,
      units: 0,
      value: 0,
      realizable: 0,
      pnl: 0,
      pnlRows: 0,
      unpriced: 0,
    });
  });
});
