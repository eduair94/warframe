import { StatisticsCalculator, IStatisticsDataPoint } from './StatisticsCalculator';

const pt = (p: Partial<IStatisticsDataPoint>): IStatisticsDataPoint => ({
  datetime: '2026-07-01T00:00:00.000Z',
  volume: 1,
  avg_price: 10,
  ...p,
});

describe('StatisticsCalculator subtype filtering', () => {
  it('volume-weighted-averages only the requested subtype', () => {
    const points: IStatisticsDataPoint[] = [
      pt({ subtype: 'radiant', volume: 10, avg_price: 30 }),
      pt({ subtype: 'radiant', volume: 10, avg_price: 40 }),
      pt({ subtype: 'intact', volume: 100, avg_price: 5 }), // excluded
    ];
    const r = StatisticsCalculator.calculate(points, { subtype: 'radiant' });
    expect(r.volume).toBe(20);
    expect(r.avg_price).toBe(35);
  });

  it('gracefully ignores the subtype filter when no point carries that subtype', () => {
    // stats endpoint may not split by subtype for some items -> do not zero out
    const points: IStatisticsDataPoint[] = [
      pt({ volume: 10, avg_price: 20 }),
      pt({ volume: 10, avg_price: 30 }),
    ];
    const r = StatisticsCalculator.calculate(points, { subtype: 'radiant' });
    expect(r.volume).toBe(20);
    expect(r.avg_price).toBe(25);
  });

  it('combines modRank and subtype filters', () => {
    const points: IStatisticsDataPoint[] = [
      pt({ mod_rank: 0, subtype: 'radiant', volume: 5, avg_price: 100 }), // wrong rank
      pt({ mod_rank: 5, subtype: 'radiant', volume: 10, avg_price: 50 }),
      pt({ mod_rank: 5, subtype: 'intact', volume: 10, avg_price: 5 }),   // wrong subtype
    ];
    const r = StatisticsCalculator.calculate(points, { modRank: 5, subtype: 'radiant' });
    expect(r.volume).toBe(10);
    expect(r.avg_price).toBe(50);
  });
});
