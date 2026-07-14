/**
 * @fileoverview Unit tests for SetService.buildComparisonFromItems
 * @module tests/services/SetService.test
 *
 * Focused on the pure "set vs parts" comparison builder: no DB / network access,
 * so the service is constructed with stub dependencies it never touches.
 */

import { describe, it, expect } from '@jest/globals';
import { SetService } from './SetService';
import { IMarketItem } from '../interfaces/market.interface';

// The builder only reads its `items` argument, never the injected services.
const service = new SetService(null as any, null as any, (i: any) => i);

function part(
  url_name: string,
  sell: number,
  buy: number
): IMarketItem {
  return {
    id: url_name,
    url_name,
    item_name: url_name,
    thumb: `${url_name}.png`,
    market: { buy, sell, volume: 1 },
    items_in_set: [{ tags: ['part'] } as any],
  } as IMarketItem;
}

describe('SetService.buildComparisonFromItems', () => {
  it('sums parts by quantity, computes savings, and flags missing parts', () => {
    const latronSet: IMarketItem = {
      id: 'latron_prime_set',
      url_name: 'latron_prime_set',
      item_name: 'Latron Prime Set',
      thumb: 'set.png',
      market: { buy: 40, sell: 45, volume: 100 },
      items_in_set: [
        // items_in_set[0] carries the tags used to categorise the set
        { url_name: 'latron_prime_set', tags: ['weapon', 'primary', 'prime'] } as any,
        { url_name: 'latron_prime_barrel', quantity_for_set: 2 } as any,
        { url_name: 'latron_prime_receiver', quantity_for_set: 1 } as any,
        { url_name: 'latron_prime_blueprint', quantity_for_set: 1 } as any,
        { url_name: 'latron_prime_stock', quantity_for_set: 1 } as any,
      ],
    } as IMarketItem;

    const items: IMarketItem[] = [
      latronSet,
      part('latron_prime_barrel', 12, 10),
      part('latron_prime_receiver', 11, 9),
      part('latron_prime_blueprint', 8, 6),
      // latron_prime_stock intentionally absent -> counted as a missing part
    ];

    const rows = service.buildComparisonFromItems(items);
    expect(rows).toHaveLength(1);
    const row = rows[0];

    expect(row.url_name).toBe('latron_prime_set');
    expect(row.item_name).toBe('Latron Prime Set');
    expect(row.tags).toEqual(['weapon', 'primary', 'prime']);
    expect(row.partsCount).toBe(4);
    expect(row.pricedParts).toBe(3);
    expect(row.missingParts).toBe(1);

    // barrel counts twice (quantity_for_set: 2)
    expect(row.byParts.sell).toBe(12 * 2 + 11 + 8); // 43
    expect(row.byParts.buy).toBe(10 * 2 + 9 + 6); // 35

    // acquire: buy assembled set (45) vs buy the parts (43) -> parts save 2
    expect(row.acquire.setCost).toBe(45);
    expect(row.acquire.partsCost).toBe(43);
    expect(row.acquire.save).toBe(2);
    expect(row.acquire.savePct).toBeCloseTo((2 / 45) * 100, 5);

    // resale: sell assembled set (40) vs sell the parts (35) -> parts worth 5 less
    expect(row.resale.setValue).toBe(40);
    expect(row.resale.partsValue).toBe(35);
    expect(row.resale.extra).toBe(-5);
    expect(row.resale.extraPct).toBeCloseTo((-5 / 40) * 100, 5);
  });

  it('produces one row per qualifying set and handles set-cheaper cases', () => {
    const ashSet: IMarketItem = {
      id: 'ash_prime_set',
      url_name: 'ash_prime_set',
      item_name: 'Ash Prime Set',
      thumb: 'ash.png',
      market: { buy: 55, sell: 60, volume: 50 },
      items_in_set: [
        { url_name: 'ash_prime_set', tags: ['warframe', 'prime'] } as any,
        { url_name: 'ash_prime_chassis', quantity_for_set: 1 } as any,
        { url_name: 'ash_prime_systems', quantity_for_set: 1 } as any,
        { url_name: 'ash_prime_neuroptics', quantity_for_set: 1 } as any,
        { url_name: 'ash_prime_blueprint', quantity_for_set: 1 } as any,
      ],
    } as IMarketItem;

    const items: IMarketItem[] = [
      ashSet,
      part('ash_prime_chassis', 20, 18),
      part('ash_prime_systems', 15, 13),
      part('ash_prime_neuroptics', 18, 16),
      part('ash_prime_blueprint', 10, 8),
    ];

    const rows = service.buildComparisonFromItems(items);
    expect(rows).toHaveLength(1);
    // parts cost 63 vs set 60 -> buying the set is cheaper (negative save)
    expect(rows[0].acquire.partsCost).toBe(63);
    expect(rows[0].acquire.save).toBe(-3);
    // parts resale 55 equals set resale 55 -> no difference
    expect(rows[0].resale.extra).toBe(0);
  });

  it('excludes non-sets, single-part sets, and items without market data', () => {
    const items: IMarketItem[] = [
      // plain item (no " Set" in name)
      part('latron_prime_barrel', 12, 10),
      // named a Set but only one entry in items_in_set
      {
        id: 'fake_set',
        url_name: 'fake_set',
        item_name: 'Fake Set',
        thumb: 'x.png',
        market: { buy: 1, sell: 2, volume: 0 },
        items_in_set: [{ url_name: 'fake_set', tags: ['x'] } as any],
      } as IMarketItem,
      // a Set with no market data
      {
        id: 'no_market_set',
        url_name: 'no_market_set',
        item_name: 'No Market Set',
        thumb: 'y.png',
        items_in_set: [
          { url_name: 'no_market_set', tags: ['x'] } as any,
          { url_name: 'some_part', quantity_for_set: 1 } as any,
        ],
      } as IMarketItem,
    ];

    expect(service.buildComparisonFromItems(items)).toHaveLength(0);
  });
});
