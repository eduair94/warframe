/**
 * @fileoverview Unit tests for the /ledger realized-P/L engine. Runs under the
 * backend jest setup (jest.config moduleNameMapper stubs `vue` + `#imports`)
 * because the module is pure.
 *
 * The behaviour that matters: weighted-average cost basis, chronological replay
 * regardless of input order, and NEVER dropping a sale that exceeds the logged
 * position (players start logging after they already own things).
 */

import { describe, it, expect } from '@jest/globals';
import {
  equityCurve,
  positionRows,
  replayLedger,
  summarize,
  type LedgerTrade,
} from '../app/app/composables/useLedger';

let seq = 0;
const trade = (over: Partial<LedgerTrade>): LedgerTrade => ({
  id: `t${++seq}`,
  url_name: 'ash_prime_set',
  item_name: 'Ash Prime Set',
  side: 'buy',
  qty: 1,
  price: 10,
  at: '2026-01-01T00:00:00.000Z',
  ...over,
});

describe('replayLedger — weighted average cost', () => {
  it('averages two buys at different prices', () => {
    const { positions } = replayLedger([
      trade({ side: 'buy', qty: 1, price: 40, at: '2026-01-01T00:00:00.000Z' }),
      trade({ side: 'buy', qty: 3, price: 60, at: '2026-01-02T00:00:00.000Z' }),
    ]);
    const pos = positions.ash_prime_set;
    expect(pos.qty).toBe(4);
    expect(pos.avgCost).toBeCloseTo((40 + 180) / 4, 10); // 55
    expect(pos.spent).toBe(220);
  });

  it('books realized profit against the average, not the last buy', () => {
    const { positions, results } = replayLedger([
      trade({ side: 'buy', qty: 1, price: 40, at: '2026-01-01T00:00:00.000Z' }),
      trade({ side: 'buy', qty: 1, price: 60, at: '2026-01-02T00:00:00.000Z' }),
      trade({ side: 'sell', qty: 1, price: 70, at: '2026-01-03T00:00:00.000Z' }),
    ]);
    const sale = results[results.length - 1];
    expect(sale.costAtSale).toBeCloseTo(50, 10);
    expect(sale.realized).toBeCloseTo(20, 10);
    expect(positions.ash_prime_set.qty).toBe(1);
    // The remaining unit still carries the same average cost.
    expect(positions.ash_prime_set.avgCost).toBeCloseTo(50, 10);
  });

  it('replays in chronological order regardless of input order', () => {
    const shuffled = [
      trade({ side: 'sell', qty: 1, price: 70, at: '2026-01-03T00:00:00.000Z' }),
      trade({ side: 'buy', qty: 1, price: 40, at: '2026-01-01T00:00:00.000Z' }),
      trade({ side: 'buy', qty: 1, price: 60, at: '2026-01-02T00:00:00.000Z' }),
    ];
    const { positions } = replayLedger(shuffled);
    // If the sale had been replayed first it would be a fully uncovered 70p win.
    expect(positions.ash_prime_set.realized).toBeCloseTo(20, 10);
    expect(positions.ash_prime_set.uncoveredUnits).toBe(0);
  });

  it('treats a sale beyond the logged position as zero-cost, not an error', () => {
    const { positions, results } = replayLedger([
      trade({ side: 'buy', qty: 1, price: 40, at: '2026-01-01T00:00:00.000Z' }),
      trade({ side: 'sell', qty: 3, price: 50, at: '2026-01-02T00:00:00.000Z' }),
    ]);
    const sale = results[1];
    // 1 covered unit (50 - 40) + 2 uncovered units at full price.
    expect(sale.realized).toBeCloseTo(10 + 100, 10);
    expect(sale.uncovered).toBe(true);
    expect(positions.ash_prime_set.uncoveredUnits).toBe(2);
    expect(positions.ash_prime_set.qty).toBe(0);
  });

  it('keeps items independent', () => {
    const { positions } = replayLedger([
      trade({ url_name: 'a_set', side: 'buy', qty: 1, price: 10 }),
      trade({ url_name: 'b_set', side: 'buy', qty: 1, price: 100 }),
      trade({ url_name: 'b_set', side: 'sell', qty: 1, price: 150, at: '2026-01-05T00:00:00.000Z' }),
    ]);
    expect(positions.a_set.realized).toBe(0);
    expect(positions.b_set.realized).toBeCloseTo(50, 10);
    expect(positions.a_set.qty).toBe(1);
    expect(positions.b_set.qty).toBe(0);
  });

  it('ignores rows with no slug or a zero quantity', () => {
    const { results } = replayLedger([
      trade({ url_name: '' as any }),
      trade({ qty: 0 }),
      trade({ qty: 2, price: 5 }),
    ]);
    expect(results).toHaveLength(1);
  });

  it('handles an empty / missing log', () => {
    expect(replayLedger([]).results).toEqual([]);
    expect(replayLedger(null as any).results).toEqual([]);
  });
});

describe('summarize', () => {
  it('totals spend, receipts and realized profit', () => {
    const s = summarize([
      trade({ side: 'buy', qty: 2, price: 50, at: '2026-01-01T00:00:00.000Z' }),
      trade({ side: 'sell', qty: 1, price: 80, at: '2026-01-11T00:00:00.000Z' }),
    ]);
    expect(s.trades).toBe(2);
    expect(s.buys).toBe(1);
    expect(s.sells).toBe(1);
    expect(s.spent).toBe(100);
    expect(s.received).toBe(80);
    expect(s.realized).toBeCloseTo(30, 10);
    expect(s.realizedPct).toBeCloseTo(30 / 50, 10);
    // 10 days between first and last trade.
    expect(s.platPerDay).toBeCloseTo(3, 6);
  });

  it('identifies the best and worst sale', () => {
    const s = summarize([
      trade({ side: 'buy', qty: 2, price: 50, at: '2026-01-01T00:00:00.000Z' }),
      trade({ id: 'good', side: 'sell', qty: 1, price: 90, at: '2026-01-02T00:00:00.000Z' }),
      trade({ id: 'bad', side: 'sell', qty: 1, price: 20, at: '2026-01-03T00:00:00.000Z' }),
    ]);
    expect(s.bestTrade?.id).toBe('good');
    expect(s.worstTrade?.id).toBe('bad');
    expect(s.worstTrade!.realized).toBeCloseTo(-30, 10);
  });

  it('reports nothing meaningful for an empty log', () => {
    const s = summarize([]);
    expect(s).toMatchObject({
      trades: 0,
      realized: 0,
      realizedPct: null,
      bestTrade: null,
      worstTrade: null,
      platPerDay: null,
      firstAt: null,
      lastAt: null,
    });
  });

  it('leaves realizedPct null when every sale was uncovered', () => {
    const s = summarize([trade({ side: 'sell', qty: 1, price: 40 })]);
    expect(s.realized).toBeCloseTo(40, 10);
    expect(s.realizedPct).toBeNull();
  });
});

describe('equityCurve', () => {
  it('accumulates realized P/L per day, sales only', () => {
    const curve = equityCurve([
      trade({ side: 'buy', qty: 2, price: 10, at: '2026-01-01T00:00:00.000Z' }),
      trade({ side: 'sell', qty: 1, price: 30, at: '2026-01-02T00:00:00.000Z' }),
      trade({ side: 'sell', qty: 1, price: 20, at: '2026-01-04T09:00:00.000Z' }),
    ]);
    expect(curve).toEqual([
      { date: '2026-01-02', realized: 20 },
      { date: '2026-01-04', realized: 30 },
    ]);
  });

  it('collapses same-day sales into one point', () => {
    const curve = equityCurve([
      trade({ side: 'sell', qty: 1, price: 10, at: '2026-02-01T01:00:00.000Z' }),
      trade({ side: 'sell', qty: 1, price: 5, at: '2026-02-01T23:00:00.000Z' }),
    ]);
    expect(curve).toHaveLength(1);
    expect(curve[0].realized).toBeCloseTo(15, 10);
  });

  it('is empty when nothing was sold', () => {
    expect(equityCurve([trade({ side: 'buy' })])).toEqual([]);
  });
});

describe('positionRows', () => {
  it('sorts items by realized profit, best first', () => {
    const rows = positionRows([
      trade({ url_name: 'a_set', side: 'buy', qty: 1, price: 10 }),
      trade({ url_name: 'a_set', side: 'sell', qty: 1, price: 20, at: '2026-01-02T00:00:00.000Z' }),
      trade({ url_name: 'b_set', side: 'buy', qty: 1, price: 100 }),
      trade({ url_name: 'b_set', side: 'sell', qty: 1, price: 300, at: '2026-01-02T00:00:00.000Z' }),
    ]);
    expect(rows.map((r) => r.url_name)).toEqual(['b_set', 'a_set']);
    expect(rows[0].realized).toBeCloseTo(200, 10);
  });
});
