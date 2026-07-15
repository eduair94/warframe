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
      {
        // A currently-dropping (non-vaulted) relic that ALSO drops Nova Prime
        // Neuroptics — so that part must read as not-vaulted even inside the
        // vaulted Lith A1 above.
        relicName: 'meso B1',
        tier: 'Meso',
        state: 'Intact',
        rewards: [
          { itemName: 'Nova Prime Neuroptics', rarity: 'Rare', chance: 2 },
          { itemName: 'Some Common Part', rarity: 'Common', chance: 25.33 },
        ],
      },
    ];

    const items: IMarketItem[] = [
      // relic market items (listed as "<tier>_<code>_relic"); vaulted flag lives here
      { url_name: 'lith_a1_relic', item_name: 'Lith A1 Relic', thumb: 'relic.png', vaulted: true, market: { buy: 10, sell: 15, volume: 100, avg_price: 14 } } as IMarketItem,
      { url_name: 'meso_b1_relic', item_name: 'Meso B1 Relic', thumb: 'relic2.png', vaulted: false, market: { buy: 3, sell: 6, volume: 40, avg_price: 5 } } as IMarketItem,
      { url_name: 'ash_prime_blueprint', item_name: 'Ash Prime Blueprint', thumb: 'bp.png', market: { buy: 45, sell: 50, volume: 8, avg_price: 47 } } as IMarketItem,
      { url_name: 'nova_prime_neuroptics', item_name: 'Nova Prime Neuroptics', thumb: 'neu.png', market: { buy: 18, sell: 22, volume: 0 } } as IMarketItem,
      // 'Unlisted Part' / 'Some Common Part' intentionally absent -> price 0
    ];

    const rows = service.buildRelicEvFromData(relics, items);
    expect(rows).toHaveLength(2);
    const row = rows[0];

    expect(row.relicName).toBe('Lith A1');
    expect(row.url_name).toBe('lith_a1_relic');
    expect(row.tier).toBe('Lith');
    expect(row.thumb).toBe('relic.png');
    expect(row.vaulted).toBe(true);
    expect(row.relic).toEqual({ buy: 10, sell: 15, volume: 100, avgPrice: 14 });

    expect(row.rewards).toHaveLength(3);
    // Ash Prime BP drops ONLY from the vaulted Lith A1 -> effectively vaulted.
    expect(row.rewards[0]).toEqual({
      item_name: 'Ash Prime Blueprint',
      url_name: 'ash_prime_blueprint',
      thumb: 'bp.png',
      rarity: 'Rare',
      price: 50,
      avgPrice: 47,
      volume: 8,
      vaulted: true,
    });
    // Nova Prime Neuroptics also drops from the NON-vaulted Meso B1 -> not
    // vaulted, even though it's listed here inside a vaulted relic. (Untraded:
    // volume 0, avgPrice 0, so it falls out of the realizable EV client-side.)
    expect(row.rewards[1]).toEqual({
      item_name: 'Nova Prime Neuroptics',
      url_name: 'nova_prime_neuroptics',
      thumb: 'neu.png',
      rarity: 'Uncommon',
      price: 22,
      avgPrice: 0,
      volume: 0,
      vaulted: false,
    });
    // unlisted reward -> price 0, empty url/thumb; only in the vaulted relic -> vaulted
    expect(row.rewards[2]).toEqual({
      item_name: 'Unlisted Part',
      url_name: '',
      thumb: '',
      rarity: 'Common',
      price: 0,
      avgPrice: 0,
      volume: 0,
      vaulted: true,
    });

    // The non-vaulted Meso B1's own drops are all currently-dropping.
    const meso = rows[1];
    expect(meso.relicName).toBe('Meso B1');
    expect(meso.vaulted).toBe(false);
    expect(meso.rewards.every((r) => r.vaulted === false)).toBe(true);
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
    // an unlisted relic has no market item -> not flagged vaulted (unknown), so
    // it is never hidden by the "currently dropping" filter.
    expect(rows[0].vaulted).toBe(false);
    expect(rows[0].relic).toEqual({ buy: 0, sell: 0, volume: 0, avgPrice: 0 });
    expect(rows[0].rewards[0].price).toBe(0);
    expect(rows[0].rewards[0].volume).toBe(0);
    expect(rows[0].rewards[0].avgPrice).toBe(0);
    expect(rows[0].rewards[0].vaulted).toBe(false);
  });

  it('skips relics with no rewards', () => {
    const relics: IRelic[] = [
      { relicName: 'neo c3', tier: 'Neo', state: 'Intact', rewards: [] },
    ];
    expect(service.buildRelicEvFromData(relics, [])).toHaveLength(0);
  });

  it('flags non-fissure tiers (Prime Resurgence / Varzia) as resurgence', () => {
    const relics: IRelic[] = [
      // The "Vanguard" tier is Prime Resurgence-only: bought from Varzia with
      // Aya, never dropped by a fissure — so it can't be farmed by running one.
      {
        relicName: 'vanguard C1',
        tier: 'Vanguard',
        state: 'Intact',
        rewards: [{ itemName: 'Ash Prime Systems Blueprint', rarity: 'Uncommon', chance: 11 }],
      },
      { relicName: 'requiem I', tier: 'Requiem', state: 'Intact', rewards: [{ itemName: 'Part', rarity: 'Common', chance: 25.33 }] },
      { relicName: 'lith a1', tier: 'Lith', state: 'Intact', rewards: [{ itemName: 'Part', rarity: 'Common', chance: 25.33 }] },
    ];
    // The Vanguard relic IS listed and flagged NOT vaulted (Aya-obtainable) —
    // the exact case that used to slip past the "currently dropping" filter.
    const items: IMarketItem[] = [
      { url_name: 'vanguard_c1_relic', item_name: 'Vanguard C1 Relic', vaulted: false, market: { buy: 42, sell: 11, volume: 17, avg_price: 8.5 } } as IMarketItem,
    ];

    const byName = Object.fromEntries(
      service.buildRelicEvFromData(relics, items).map((r) => [r.relicName, r]),
    );
    // Non-fissure tier -> resurgence, even though its market flag says not vaulted.
    expect(byName['Vanguard C1'].resurgence).toBe(true);
    expect(byName['Vanguard C1'].vaulted).toBe(false);
    // Real fissure tiers (incl. Requiem, farmed from Kuva Siphon/Flood) -> not resurgence.
    expect(byName['Requiem I'].resurgence).toBe(false);
    expect(byName['Lith A1'].resurgence).toBe(false);
  });
});
