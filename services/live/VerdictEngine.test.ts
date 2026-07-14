import { computeFairValue, computeVerdict } from './VerdictEngine';
import { LiveBook, FairValueInputs } from './LiveTypes';

const OPTS = { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25 };
const book = (p: Partial<LiveBook>): LiveBook => ({
  url_name: 'x', bestBuy: 0, bestSell: 0, buyAvg: 0, sellAvg: 0,
  onlineBuyCount: 5, onlineSellCount: 5, updatedAt: 0, ...p,
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
  });
  it('holds when confidence is too low (thin book, no history)', () => {
    const v = computeVerdict(
      book({ bestSell: 50, bestBuy: 40, onlineBuyCount: 1, onlineSellCount: 1 }),
      fv({ volume: 1, dataDays: 0 }), OPTS
    );
    expect(v.verdict).toBe('hold');
  });
  it('widens the band for volatile items (no buy signal at 8% when volatility is high)', () => {
    const v = computeVerdict(
      book({ bestSell: 93, bestBuy: 90 }),
      fv({ avg_price: 100, medianHistory: 100, volume: 100, volatility: 60 }), OPTS
    );
    expect(v.verdict).not.toBe('buy'); // 7% deal < widened band
  });
});
