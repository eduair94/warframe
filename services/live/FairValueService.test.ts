import { FairValueService, median, coeffVariation } from './FairValueService';

describe('pure helpers', () => {
  it('median of odd and even length', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });
  it('coeffVariation returns null below 3 points', () => {
    expect(coeffVariation([10, 10])).toBeNull();
    expect(coeffVariation([10, 10, 10])).toBeCloseTo(0);
  });
});

describe('FairValueService.load', () => {
  it('builds FairValueInputs joining market snapshot + history median', async () => {
    const svc = new FairValueService({
      getItems: async () => [
        { url_name: 'a', market: { avg_price: 120, sell: 110, volume: 42 } },
      ],
      getHistory: async () => [
        { date: '2026-01-01', buy: 0, sell: 0, avg_price: 90, volume: 3 },
        { date: '2026-01-02', buy: 0, sell: 0, avg_price: 100, volume: 3 },
        { date: '2026-01-03', buy: 0, sell: 0, avg_price: 110, volume: 3 },
      ],
    });
    const map = await svc.load(['a']);
    const fv = map.get('a')!;
    expect(fv.avg_price).toBe(120);
    expect(fv.medianHistory).toBe(100);
    expect(fv.volume).toBe(42);
    expect(fv.dataDays).toBe(3);
    expect(svc.get('a')).toEqual(fv);
  });

  it('falls back to sell when avg_price is missing in history points', async () => {
    const svc = new FairValueService({
      getItems: async () => [{ url_name: 'b', market: { avg_price: 0, sell: 50, volume: 0 } }],
      getHistory: async () => [
        { date: '2026-01-01', buy: 0, sell: 40, avg_price: 0, volume: 0 },
        { date: '2026-01-02', buy: 0, sell: 60, avg_price: 0, volume: 0 },
        { date: '2026-01-03', buy: 0, sell: 50, avg_price: 0, volume: 0 },
      ],
    });
    const fv = (await svc.load(['b'])).get('b')!;
    expect(fv.medianHistory).toBe(50); // priceOf falls back to sell
  });
});
