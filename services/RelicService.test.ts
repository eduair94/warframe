/**
 * @fileoverview Unit tests for RelicService.buildRelicEvFromData
 * @module tests/services/RelicService.test
 *
 * Focused on the pure relic "open vs sell" EV builder: no DB access, so the
 * service is constructed with stub repositories it never touches.
 */

import { describe, it, expect } from '@jest/globals';
import { RelicService } from './RelicService';
import { IRelic } from '../interfaces/relic.interface';
import { IMarketItem } from '../interfaces/market.interface';

const service = new RelicService(null as any, null as any);

describe('RelicService.buildRelicEvFromData', () => {
  it('joins rewards to prices, resolves the relic market entry, and formats names', () => {
    const relics: IRelic[] = [
      {
        relicName: 'lith A1',
        tier: 'Lith',
        state: 'Intact',
        rewards: [
          { itemName: 'Ash Prime Blueprint', rarity: 'Rare', chance: 2 },
          { itemName: 'Nova Prime Neuroptics', rarity: 'Uncommon', chance: 11 },
          { itemName: 'Unlisted Part', rarity: 'Common', chance: 25.33 },
        ],
      },
    ];

    const items: IMarketItem[] = [
      // the relic's own market item (listed as "<tier>_<code>_relic")
      { url_name: 'lith_a1_relic', item_name: 'Lith A1 Relic', thumb: 'relic.png', market: { buy: 10, sell: 15, volume: 100 } } as IMarketItem,
      { url_name: 'ash_prime_blueprint', item_name: 'Ash Prime Blueprint', thumb: 'bp.png', market: { buy: 45, sell: 50, volume: 0 } } as IMarketItem,
      { url_name: 'nova_prime_neuroptics', item_name: 'Nova Prime Neuroptics', thumb: 'neu.png', market: { buy: 18, sell: 22, volume: 0 } } as IMarketItem,
      // 'Unlisted Part' intentionally absent -> price 0, url/thumb empty
    ];

    const rows = service.buildRelicEvFromData(relics, items);
    expect(rows).toHaveLength(1);
    const row = rows[0];

    expect(row.relicName).toBe('Lith A1');
    expect(row.url_name).toBe('lith_a1_relic');
    expect(row.tier).toBe('Lith');
    expect(row.thumb).toBe('relic.png');
    expect(row.relic).toEqual({ buy: 10, sell: 15, volume: 100 });

    expect(row.rewards).toHaveLength(3);
    expect(row.rewards[0]).toEqual({
      item_name: 'Ash Prime Blueprint',
      url_name: 'ash_prime_blueprint',
      thumb: 'bp.png',
      rarity: 'Rare',
      price: 50,
    });
    // unlisted reward -> price 0, empty url/thumb
    expect(row.rewards[2]).toEqual({
      item_name: 'Unlisted Part',
      url_name: '',
      thumb: '',
      rarity: 'Common',
      price: 0,
    });
  });

  it('defaults the relic market to zeros when the relic is not listed', () => {
    const relics: IRelic[] = [
      {
        relicName: 'meso b2',
        tier: 'Meso',
        state: 'Intact',
        rewards: [{ itemName: 'Some Part', rarity: 'Common', chance: 25.33 }],
      },
    ];
    const rows = service.buildRelicEvFromData(relics, []);
    expect(rows).toHaveLength(1);
    expect(rows[0].relicName).toBe('Meso B2');
    expect(rows[0].url_name).toBe('meso_b2_relic');
    expect(rows[0].relic).toEqual({ buy: 0, sell: 0, volume: 0 });
    expect(rows[0].rewards[0].price).toBe(0);
  });

  it('skips relics with no rewards', () => {
    const relics: IRelic[] = [
      { relicName: 'neo c3', tier: 'Neo', state: 'Intact', rewards: [] },
    ];
    expect(service.buildRelicEvFromData(relics, [])).toHaveLength(0);
  });
});
