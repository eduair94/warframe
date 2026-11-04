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

function sampleSet(
  refs: Array<{ url_name: string; quantity_for_set?: unknown }> = [
    { url_name: 'part_a' }, { url_name: 'part_b' },
  ],
  market: Record<string, unknown> = { sell: 100, buy: 80, volume: 25 },
): IMarketItem {
  return {
    ...part('sample_set', 100, 80),
    item_name: 'Sample Set',
    market,
    items_in_set: [{ url_name: 'sample_set', tags: ['primary'] }, ...refs],
  } as unknown as IMarketItem;
}

describe('SetService.buildComparisonFromItems', () => {
  it('retains partial legacy subtotals but never compares them when a part document is missing', () => {
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

    // The absent stock has an unknown cost/value, not a free price.
    expect(row.acquire).toEqual({
      missingParts: 1, setCost: 45, partsCost: null, save: null, savePct: null,
    });
    expect(row.resale).toEqual({
      missingParts: 1, setValue: 40, partsValue: null, extra: null, extraPct: null,
    });
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
    expect(rows[0].resale.extraPct).toBe(0);
    expect(rows[0].acquire.missingParts).toBe(0);
    expect(rows[0].resale.missingParts).toBe(0);
  });

  it('excludes non-sets and sets without component references', () => {
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
    ];

    expect(service.buildComparisonFromItems(items)).toHaveLength(0);
  });

  it('preserves complete arithmetic, repeated quantities, absent quantity defaults and fractional quotes', () => {
    const set = sampleSet([
      { url_name: 'part_a', quantity_for_set: 2 },
      { url_name: 'part_b' },
    ]);
    const [row] = service.buildComparisonFromItems([set, part('part_a', 20.5, 12), part('part_b', 9, 16)]);

    expect(row.byParts).toEqual({ sell: 50, buy: 40 });
    expect(row.acquire).toEqual({ missingParts: 0, setCost: 100, partsCost: 50, save: 50, savePct: 50 });
    expect(row.resale).toEqual({ missingParts: 0, setValue: 80, partsValue: 40, extra: -40, extraPct: -50 });
    expect(row.pricedParts).toBe(2);
    expect(row.missingParts).toBe(0);
  });

  it('keeps acquisition comparable when every ask exists but a bid is missing', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(), part('part_a', 30, 0), part('part_b', 20, 10),
    ]);
    expect(row.byParts).toEqual({ sell: 50, buy: 10 });
    expect(row.acquire).toEqual({ missingParts: 0, setCost: 100, partsCost: 50, save: 50, savePct: 50 });
    expect(row.resale).toEqual({ missingParts: 1, setValue: 80, partsValue: null, extra: null, extraPct: null });
    expect(row.pricedParts).toBe(2);
    expect(row.missingParts).toBe(0);
  });

  it('keeps resale comparable when every bid exists but an ask is missing', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(), part('part_a', 0, 50), part('part_b', 20, 50),
    ]);
    expect(row.byParts).toEqual({ sell: 20, buy: 100 });
    expect(row.acquire).toEqual({ missingParts: 1, setCost: 100, partsCost: null, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 0, setValue: 80, partsValue: 100, extra: 20, extraPct: 25 });
    expect(row.pricedParts).toBe(2);
    expect(row.missingParts).toBe(0);
  });

  it('does not confuse any-direction coverage with complete coverage on either side', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(), part('part_a', 30, 0), part('part_b', 0, 40),
    ]);
    expect(row.pricedParts).toBe(2);
    expect(row.missingParts).toBe(0);
    expect(row.byParts).toEqual({ sell: 30, buy: 40 });
    expect(row.acquire).toEqual({ missingParts: 1, setCost: 100, partsCost: null, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 1, setValue: 80, partsValue: null, extra: null, extraPct: null });
  });

  it('does not advertise a 100% saving when no component has a market quote', () => {
    const unpricedPart = part('part_b', 0, 0);
    delete unpricedPart.market;
    const [row] = service.buildComparisonFromItems([sampleSet(), part('part_a', 0, 0), unpricedPart]);
    expect(row.pricedParts).toBe(0);
    expect(row.missingParts).toBe(2);
    expect(row.byParts).toEqual({ sell: 0, buy: 0 });
    expect(row.acquire).toEqual({ missingParts: 2, setCost: 100, partsCost: null, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 2, setValue: 80, partsValue: null, extra: null, extraPct: null });
  });

  it.each([undefined, null, 0, -5, NaN, Infinity, -Infinity, '12', true, {}, []])(
    'rejects malformed or absent component quotes: %p',
    (quote) => {
      const [row] = service.buildComparisonFromItems([
        sampleSet(), part('part_a', quote as number, quote as number), part('part_b', 20, 10),
      ]);
      expect(row.byParts).toEqual({ sell: 20, buy: 10 });
      expect(row.pricedParts).toBe(1);
      expect(row.missingParts).toBe(1);
      expect(row.acquire).toEqual({ missingParts: 1, setCost: 100, partsCost: null, save: null, savePct: null });
      expect(row.resale).toEqual({ missingParts: 1, setValue: 80, partsValue: null, extra: null, extraPct: null });
    },
  );

  it.each([null, 0, -1, 0.5, NaN, Infinity, -Infinity, '2', true])(
    'requires a positive integer quantity and does not silently default %p to one',
    (quantity) => {
      const [row] = service.buildComparisonFromItems([
        sampleSet([{ url_name: 'part_a', quantity_for_set: quantity }, { url_name: 'part_b' }]),
        part('part_a', 30, 20), part('part_b', 20, 10),
      ]);
      expect(row.byParts).toEqual({ sell: 20, buy: 10 });
      expect(row.pricedParts).toBe(2); // Legacy quote availability is independent of quantity.
      expect(row.missingParts).toBe(0);
      expect(row.acquire).toEqual({ missingParts: 1, setCost: 100, partsCost: null, save: null, savePct: null });
      expect(row.resale).toEqual({ missingParts: 1, setValue: 80, partsValue: null, extra: null, extraPct: null });
    },
  );

  it('preserves known component costs and resale when the set ask is missing', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(undefined, { sell: 0, buy: 80 }), part('part_a', 30, 50), part('part_b', 20, 50),
    ]);
    expect(row.set.sell).toBe(0);
    expect(row.acquire).toEqual({ missingParts: 0, setCost: null, partsCost: 50, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 0, setValue: 80, partsValue: 100, extra: 20, extraPct: 25 });
  });

  it('preserves known component values and acquisition when the set bid is missing', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(undefined, { sell: 100 }), part('part_a', 30, 50), part('part_b', 20, 50),
    ]);
    expect(row.set.buy).toBe(0);
    expect(row.acquire).toEqual({ missingParts: 0, setCost: 100, partsCost: 50, save: 50, savePct: 50 });
    expect(row.resale).toEqual({ missingParts: 0, setValue: null, partsValue: 100, extra: null, extraPct: null });
  });

  it('retains a set with no market block without discarding its known component totals', () => {
    const set = sampleSet();
    delete set.market;
    const [row] = service.buildComparisonFromItems([set, part('part_a', 30, 50), part('part_b', 20, 50)]);
    expect(row.set).toEqual({ sell: 0, buy: 0, volume: 0 });
    expect(row.acquire).toEqual({ missingParts: 0, setCost: null, partsCost: 50, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 0, setValue: null, partsValue: 100, extra: null, extraPct: null });
  });

  it.each([NaN, Infinity, -Infinity, -1, '50', true])('sanitizes invalid set quotes: %p', (quote) => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(undefined, { sell: quote, buy: quote, volume: quote }),
      part('part_a', 30, 50), part('part_b', 20, 50),
    ]);
    expect(row.set).toEqual({ sell: 0, buy: 0, volume: 0 });
    expect(row.acquire).toEqual({ missingParts: 0, setCost: null, partsCost: 50, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 0, setValue: null, partsValue: 100, extra: null, extraPct: null });
  });

  it('marks a quantity multiplication overflow unavailable without corrupting the other side', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet([{ url_name: 'part_a', quantity_for_set: 2 }, { url_name: 'part_b' }]),
      part('part_a', Number.MAX_VALUE, 20), part('part_b', 10, 40),
    ]);
    expect(row.byParts).toEqual({ sell: 10, buy: 80 });
    expect(row.acquire).toEqual({ missingParts: 0, setCost: 100, partsCost: null, save: null, savePct: null });
    expect(row.resale).toEqual({ missingParts: 0, setValue: 80, partsValue: 80, extra: 0, extraPct: 0 });
  });

  it('marks an overflowing sum unavailable while retaining finite legacy subtotals', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet(), part('part_a', Number.MAX_VALUE, Number.MAX_VALUE), part('part_b', Number.MAX_VALUE, Number.MAX_VALUE),
    ]);
    expect(row.byParts).toEqual({ sell: Number.MAX_VALUE, buy: Number.MAX_VALUE });
    expect(row.acquire.partsCost).toBeNull();
    expect(row.acquire.save).toBeNull();
    expect(row.acquire.savePct).toBeNull();
    expect(row.resale.partsValue).toBeNull();
    expect(row.resale.extra).toBeNull();
    expect(row.resale.extraPct).toBeNull();
  });

  it('returns null for an unrepresentable percentage but retains finite known totals and differences', () => {
    const [row] = service.buildComparisonFromItems([
      sampleSet([{ url_name: 'part_a' }], { sell: Number.MIN_VALUE, buy: Number.MIN_VALUE }),
      part('part_a', Number.MAX_VALUE, Number.MAX_VALUE),
    ]);
    expect(row.acquire.partsCost).toBe(Number.MAX_VALUE);
    expect(row.acquire.save).toBe(-Number.MAX_VALUE);
    expect(row.acquire.savePct).toBeNull();
    expect(row.resale.partsValue).toBe(Number.MAX_VALUE);
    expect(row.resale.extra).toBe(Number.MAX_VALUE);
    expect(row.resale.extraPct).toBeNull();
  });
});
