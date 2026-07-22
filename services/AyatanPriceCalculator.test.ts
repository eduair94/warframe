import { buildAyatanPriceData } from './AyatanPriceCalculator';

const order = (
  type: 'buy' | 'sell', platinum: number, amber_stars: number, cyan_stars: number,
  status = 'ingame', visible = true,
) => ({ order_type: type, platinum, amber_stars, cyan_stars, visible, user: { status } });

describe('buildAyatanPriceData', () => {
  it('builds every exact amber/cyan variant from empty through fully socketed', () => {
    const snapshot = buildAyatanPriceData(
      [
        order('sell', 5, 0, 0),
        order('buy', 3, 0, 0),
        order('sell', 12, 1, 2, 'online'),
        order('sell', 10, 1, 2),
        order('buy', 8, 1, 2),
        order('sell', 1, 1, 2, 'offline'),
      ],
      [
        { datetime: '2026-07-22T00:00:00Z', volume: 20, avg_price: 4, amber_stars: 0, cyan_stars: 0 },
        { datetime: '2026-07-22T01:00:00Z', volume: 7, avg_price: 9, amber_stars: 1, cyan_stars: 2 },
      ],
      1,
      2,
      '2026-07-22T02:00:00Z',
    );

    expect(snapshot.variants).toHaveLength(6);
    expect(snapshot.variants.map((variant) => variant.key)).toEqual(['0:0', '0:1', '1:0', '0:2', '1:1', '1:2']);
    expect(snapshot.variants[0]).toMatchObject({ ask: 5, bid: 3, avg_price: 4, volume: 20 });
    expect(snapshot.variants[5]).toMatchObject({ ask: 10, bid: 8, avg_price: 9, volume: 7, sellCount: 2, buyCount: 1 });
  });
});
