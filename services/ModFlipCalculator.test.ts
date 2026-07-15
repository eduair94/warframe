/**
 * @fileoverview Unit tests for the per-rank flip ladder builder.
 * @module tests/services/ModFlipCalculator.test
 */

import { describe, it, expect } from '@jest/globals';
import { buildLadder, buildModFlipData, IFlipOrder } from './ModFlipCalculator';

function sell(rank: number, plat: number, status = 'ingame'): IFlipOrder {
  return { order_type: 'sell', platinum: plat, mod_rank: rank, visible: true, user: { status } };
}
function buy(rank: number, plat: number, status = 'ingame'): IFlipOrder {
  return { order_type: 'buy', platinum: plat, mod_rank: rank, visible: true, user: { status } };
}

describe('ModFlipCalculator.buildLadder', () => {
  it('picks lowest ask and highest bid per rank, dense from 0..maxRank', () => {
    const orders: IFlipOrder[] = [
      sell(0, 12), sell(0, 8), buy(0, 5),
      sell(10, 90), sell(10, 70), buy(10, 60), buy(10, 55),
      sell(5, 30),
    ];
    const ladder = buildLadder(orders, 10);
    expect(ladder).toHaveLength(11); // ranks 0..10
    expect(ladder[0]).toMatchObject({ rank: 0, ask: 8, bid: 5, sellCount: 2, buyCount: 1 });
    expect(ladder[5]).toMatchObject({ rank: 5, ask: 30, bid: 0 });
    expect(ladder[10]).toMatchObject({ rank: 10, ask: 70, bid: 60 });
    // A rank with no orders still appears with zeros.
    expect(ladder[3]).toMatchObject({ rank: 3, ask: 0, bid: 0, sellCount: 0, buyCount: 0 });
  });

  it('ignores offline and invisible orders', () => {
    const orders: IFlipOrder[] = [
      sell(0, 5, 'offline'), // ignored
      { order_type: 'sell', platinum: 6, mod_rank: 0, visible: false, user: { status: 'ingame' } }, // ignored
      sell(0, 9, 'online'), // kept
    ];
    const ladder = buildLadder(orders, 3);
    expect(ladder[0]).toMatchObject({ ask: 9, sellCount: 1 });
  });
});

describe('ModFlipCalculator.buildModFlipData', () => {
  it('assembles ladder + rank-0/max stat blocks from one orders+stats fetch', () => {
    const orders: IFlipOrder[] = [sell(0, 10), sell(10, 85), buy(10, 60)];
    const stats = [
      { datetime: '2026-07-14T00:00:00Z', volume: 4, avg_price: 11, mod_rank: 0, id: 'a' } as any,
      { datetime: '2026-07-14T01:00:00Z', volume: 6, avg_price: 82, mod_rank: 10, id: 'b' } as any,
    ];
    const flip = buildModFlipData(orders, stats, { rarity: 'Uncommon', maxRank: 10 }, '2026-07-14T02:00:00Z');
    expect(flip.rarity).toBe('Uncommon');
    expect(flip.maxRank).toBe(10);
    expect(flip.ranks[0].ask).toBe(10);
    expect(flip.ranks[10]).toMatchObject({ ask: 85, bid: 60 });
    expect(flip.unranked).toEqual({ avg_price: 11, volume: 4 });
    expect(flip.maxed).toEqual({ avg_price: 82, volume: 6 });
    expect(flip.updatedAt).toBe('2026-07-14T02:00:00Z');
  });

  it('tolerates missing stats (degrades to zero-volume blocks)', () => {
    const flip = buildModFlipData([sell(0, 10)], null, { rarity: 'Common', maxRank: 3 });
    expect(flip.unranked).toEqual({ avg_price: 0, volume: 0 });
    expect(flip.maxed).toEqual({ avg_price: 0, volume: 0 });
    expect(flip.ranks).toHaveLength(4);
  });
});
