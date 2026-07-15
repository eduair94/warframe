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

describe('RelicService.buildRelicEvFromData — currently-dropping (WFCD drop-table authority)', () => {
  // warframe.market's per-relic `vaulted` flag is unreliable: it read non-vaulted
  // for dozens of relics that no longer drop, and vaulted for a relic that still
  // does. The authoritative "currently dropping" signal is the WFCD drop table —
  // the same source the drop-locations dialog shows — passed in as a key set.
  const relics: IRelic[] = [
    // Drops right now per WFCD, but the market wrongly flags its relic vaulted.
    { relicName: 'neo V12', tier: 'Neo', state: 'Intact', rewards: [{ itemName: 'Part A', rarity: 'Common', chance: 25.33 }] },
    // NOT in the drop table, yet the market flags it non-vaulted — the reported bug.
    { relicName: 'axi A2', tier: 'Axi', state: 'Intact', rewards: [{ itemName: 'Part B', rarity: 'Common', chance: 25.33 }] },
    // Resurgence (non-fissure tier), absent from the drop table.
    { relicName: 'vanguard C1', tier: 'Vanguard', state: 'Intact', rewards: [{ itemName: 'Part C', rarity: 'Common', chance: 25.33 }] },
  ];
  const items: IMarketItem[] = [
    { url_name: 'neo_v12_relic', item_name: 'Neo V12 Relic', vaulted: true, market: { buy: 0, sell: 3, volume: 12, avg_price: 2 } } as IMarketItem,
    { url_name: 'axi_a2_relic', item_name: 'Axi A2 Relic', vaulted: false, market: { buy: 3, sell: 5, volume: 6, avg_price: 10 } } as IMarketItem,
    { url_name: 'vanguard_c1_relic', item_name: 'Vanguard C1 Relic', vaulted: false, market: { buy: 42, sell: 11, volume: 17, avg_price: 8.5 } } as IMarketItem,
  ];
  // Only Neo V12 currently drops (keyed as normalized "<tier> <code>").
  const dropping = new Set(['neo v12']);

  it('judges "currently dropping" off the WFCD drop set, overriding the market flag', () => {
    const byName = Object.fromEntries(
      service.buildRelicEvFromData(relics, items, dropping).map((r) => [r.relicName, r]),
    );
    // In the drop set -> dropping, even though the market says vaulted.
    expect(byName['Neo V12'].vaulted).toBe(false);
    // Not in the drop set, though the market says non-vaulted -> vaulted (the fix).
    expect(byName['Axi A2'].vaulted).toBe(true);
    // A resurgence tier stays resurgence (not vaulted) so its own badge wins.
    expect(byName['Vanguard C1'].resurgence).toBe(true);
    expect(byName['Vanguard C1'].vaulted).toBe(false);
  });

  it('derives per-drop vaulted from currently-dropping relics only', () => {
    const byName = Object.fromEntries(
      service.buildRelicEvFromData(relics, items, dropping).map((r) => [r.relicName, r]),
    );
    // Part A comes from the dropping Neo V12 -> not vaulted.
    expect(byName['Neo V12'].rewards[0].vaulted).toBe(false);
    // Part B only in the non-dropping Axi A2 -> vaulted.
    expect(byName['Axi A2'].rewards[0].vaulted).toBe(true);
  });

  it('falls back to the market vaulted flag when no drop data is supplied', () => {
    // No / empty drop set -> keep the legacy market-flag behavior so the board
    // still renders before the first drops sync (never nuke every relic to vaulted).
    const legacy = Object.fromEntries(
      service.buildRelicEvFromData(relics, items).map((r) => [r.relicName, r]),
    );
    expect(legacy['Neo V12'].vaulted).toBe(true); // market flag
    expect(legacy['Axi A2'].vaulted).toBe(false); // market flag
    const empty = Object.fromEntries(
      service.buildRelicEvFromData(relics, items, new Set<string>()).map((r) => [r.relicName, r]),
    );
    expect(empty['Neo V12'].vaulted).toBe(true);
    expect(empty['Axi A2'].vaulted).toBe(false);
  });
});
