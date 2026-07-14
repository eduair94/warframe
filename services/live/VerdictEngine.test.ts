import { computeFairValue, computeVerdict } from './VerdictEngine';
import { LiveBook, FairValueInputs } from './LiveTypes';

const OPTS = { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25, thinVolume: 3 };
const book = (p: Partial<LiveBook>): LiveBook => ({
  url_name: 'x', bestBuy: 0, bestSell: 0, buyAvg: 0, sellAvg: 0,
  onlineBuyCount: 5, onlineSellCount: 5, updatedAt: 0, sellOrders: [], buyOrders: [], ...p,
});
const fv = (p: Partial<FairValueInputs>): FairValueInputs => ({
  url_name: 'x', avg_price: 100, medianHistory: 100, volatility: 5,
  dataDays: 40, volume: 100, ...p,
});

describe('computeFairValue', () => {
  it('blends avg_price and history median by liquidity weight', () => {
    // volume 50 == halfVolume -> w = 0.5 -> midpoint
    expect(computeFairValue(fv({ avg_price: 120, medianHistory: 80, volume: 50 }), 50)).toBeCloseTo(100);
  });
  it('leans on history when avg_price is 0 (no trades)', () => {
    expect(computeFairValue(fv({ avg_price: 0, medianHistory: 90, volume: 999 }), 50)).toBeCloseTo(90);
  });
  it('leans on avg_price when no history', () => {
    expect(computeFairValue(fv({ avg_price: 110, medianHistory: 0, volume: 1 }), 50)).toBeCloseTo(110);
  });
});

describe('computeVerdict', () => {
  it('flags a good BUY when bestSell is well below FV', () => {
    const v = computeVerdict(book({ bestSell: 80, bestBuy: 70 }), fv({ avg_price: 100, medianHistory: 100, volume: 100 }), OPTS);
    expect(v.verdict).toBe('buy');
    expect(v.dealPct).toBeCloseTo(0.2);
    expect(v.score).toBeGreaterThan(0);
    expect(v.flipMargin).toBe(10);
  });
  it('flags a good SELL when bestBuy is well above FV', () => {
    const v = computeVerdict(book({ bestSell: 130, bestBuy: 125 }), fv({ avg_price: 100, medianHistory: 100, volume: 100 }), OPTS);
    expect(v.verdict).toBe('sell');
    expect(v.score).toBeLessThan(0);
  });
  it('is fair inside the band', () => {
    const v = computeVerdict(book({ bestSell: 101, bestBuy: 99 }), fv({ volume: 100 }), OPTS);
    expect(v.verdict).toBe('fair');
    expect(v.score).toBe(0);
  });
  it('holds when confidence is too low (shallow book, no history) but volume is above thin', () => {
    const v = computeVerdict(
      book({ bestSell: 50, bestBuy: 40, onlineBuyCount: 1, onlineSellCount: 1 }),
      fv({ volume: 5, dataDays: 0 }), OPTS
    );
    expect(v.verdict).toBe('hold');
    expect(v.score).toBe(0);
    expect(v.thin).toBe(false); // volume 5 >= thinVolume 3
  });
  it('holds a THIN-volume item (rig risk) even with a strong buy signal', () => {
    const v = computeVerdict(
      book({ bestSell: 50, bestBuy: 40 }), // would be a huge buy vs fv 100
      fv({ avg_price: 100, medianHistory: 100, volume: 1 }), OPTS
    );
    expect(v.verdict).toBe('hold');
    expect(v.thin).toBe(true);
    expect(v.volume).toBe(1);
    expect(v.reason).toMatch(/thin volume/i);
    expect(v.score).toBe(0);
  });
  it('carries volume + thin=false on a normal verdict', () => {
    const v = computeVerdict(book({ bestSell: 80, bestBuy: 70 }), fv({ volume: 100 }), OPTS);
    expect(v.volume).toBe(100);
    expect(v.thin).toBe(false);
  });
  it('widens the band for volatile items (no buy signal at 8% when volatility is high)', () => {
    const v = computeVerdict(
      book({ bestSell: 93, bestBuy: 90 }),
      fv({ avg_price: 100, medianHistory: 100, volume: 100, volatility: 60 }), OPTS
    );
    expect(v.verdict).not.toBe('buy'); // 7% deal < widened band
  });
  it('crossed book (bestBuy > bestSell): sell verdict must carry a negative score', () => {
    const v = computeVerdict(book({ bestSell: 98, bestBuy: 150 }), fv({ avg_price: 100, medianHistory: 100, volume: 100 }), OPTS);
    expect(v.verdict).toBe('sell');
    expect(v.score).toBeLessThan(0);
  });
  it('does not NaN when volume and halfVolume are both 0 (fair-value + verdict stay finite)', () => {
    const fvIn = fv({ avg_price: 100, medianHistory: 100, volume: 0 });
    expect(Number.isFinite(computeFairValue(fvIn, 0))).toBe(true);
    const v = computeVerdict(book({ bestSell: 101, bestBuy: 99 }), fvIn, { ...OPTS, halfVolume: 0 });
    expect(Number.isFinite(v.fv)).toBe(true);
  });
});
