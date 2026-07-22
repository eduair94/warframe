import { describe, expect, it } from '@jest/globals';
import { ItemProcessor } from './ItemProcessor';

describe('ItemProcessor.processForDisplay', () => {
  it('exposes maxRank without adding the heavy per-rank snapshot to the catalogue row', () => {
    const processed = ItemProcessor.processForDisplay({
      id: 'arcane-energize',
      item_name: 'Arcane Energize',
      url_name: 'arcane_energize',
      thumb: 'energize.png',
      market: {
        buy: 80,
        sell: 90,
        rankPrices: {
          maxRank: 5,
          updatedAt: '2026-07-22T00:00:00Z',
          ranks: [],
        },
      },
      items_in_set: [{
        id: 'arcane-energize',
        url_name: 'arcane_energize',
        thumb: 'energize.png',
        mod_max_rank: 5,
        rarity: 'Legendary',
        tags: ['arcane_enhancement'],
        trading_tax: 0,
        icon: 'energize.png',
        icon_format: 'land',
      }],
    });

    expect(processed).not.toBe('');
    expect(processed).toMatchObject({ maxRank: 5, tags: ['arcane_enhancement'] });
    expect((processed as any).market.rankPrices).toBeUndefined();
  });
});
