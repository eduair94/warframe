/**
 * @fileoverview Unit tests for the set DETAIL bundle: ItemProcessor
 * .processForSetDetail, PriceHistoryService.getManyHistories and
 * SetService.getSetFullData.
 * @module tests/services/SetFull.test
 *
 * All three are exercised with stub repositories — no DB or network access.
 */

import { describe, it, expect } from '@jest/globals';
import { ItemProcessor } from './ItemProcessor';
import { PriceHistoryService, IPricePoint } from './PriceHistoryService';
import { SetService, isIncompleteSetRoster } from './SetService';
import { IMarketItem, ISetFullNode } from '../interfaces/market.interface';

// ---------------------------------------------------------------------------
// Fixtures — Latron Prime: 4 parts, and the BARREL is needed 2× per set. That
// quantity is the whole reason quantity_for_set has to survive into the payload.
// ---------------------------------------------------------------------------

const SET_URL = 'latron_prime_set';

// `any` on purpose: the fixture carries fields (depth, subtype, a partial
// last_completed) that IMarketData does not declare but the documents really do.
function marketOf(over: Partial<any> = {}): any {
  return {
    buy: 10,
    sell: 12,
    buyAvg: 9,
    sellAvg: 13,
    volume: 40,
    avg_price: 11,
    last_completed: { datetime: '2026-07-18T00:00:00Z', median: 11.5, moving_avg: 11.2, min_price: 9, max_price: 14 },
    subtype: undefined,
    depth: {
      buy: [{ price: 10, quantity: 3, orders: 2 }],
      sell: [{ price: 12, quantity: 4, orders: 3 }],
    },
    ...over,
  };
}

function partDoc(url_name: string, over: Partial<any> = {}): IMarketItem {
  return {
    id: url_name,
    url_name,
    item_name: url_name,
    thumb: `${url_name}.png`,
    ducats: 45,
    vaulted: false,
    priceUpdate: new Date('2026-07-19T10:00:00Z'),
    market: marketOf(),
    items_in_set: [{ tags: ['weapon', 'prime'] } as any],
    ...over,
  } as IMarketItem;
}

function setDoc(over: Partial<any> = {}): IMarketItem {
  return {
    id: SET_URL,
    url_name: SET_URL,
    item_name: 'Latron Prime Set',
    thumb: 'set.png',
    priceUpdate: new Date('2026-07-19T12:00:00Z'),
    market: marketOf({ buy: 55, sell: 60, avg_price: 58 }),
    items_in_set: [
      { url_name: SET_URL, tags: ['weapon', 'primary', 'prime'] } as any,
      { url_name: 'latron_prime_barrel', quantity_for_set: 2 } as any,
      { url_name: 'latron_prime_receiver', quantity_for_set: 1 } as any,
      { url_name: 'latron_prime_stock', quantity_for_set: 1 } as any,
      { url_name: 'latron_prime_blueprint' } as any, // no quantity => defaults to 1
    ],
    ...over,
  } as IMarketItem;
}

/** Minimal ItemService stub: only the two reads getSetFullData performs. */
function itemServiceStub(set: IMarketItem | null, parts: IMarketItem[]) {
  return {
    getItemByUrlName: async (url: string) => (set && set.url_name === url ? set : null),
    getItemsByUrlNames: async (urls: string[]) => parts.filter((p) => urls.includes(p.url_name)),
  } as any;
}

/** Minimal history repository stub honouring the `{ url_name: { $in: [...] } }` query. */
function historyRepoStub(docs: Array<{ url_name: string; points: IPricePoint[] }>) {
  return {
    allEntries: async (query: any) => {
      const wanted: string[] = query?.url_name?.$in ?? [];
      return docs.filter((d) => wanted.includes(d.url_name));
    },
  } as any;
}

function point(date: string, avg: number): IPricePoint {
  return { date, buy: avg - 1, sell: avg + 1, avg_price: avg, volume: 10 };
}

// ---------------------------------------------------------------------------

describe('ItemProcessor.processForSetDetail', () => {
  it('carries quantity, the full last_completed datapoint and the depth ladder', () => {
    const node = ItemProcessor.processForSetDetail(partDoc('latron_prime_barrel'), 2) as ISetFullNode;

    expect(typeof node).not.toBe('string');
    expect(node.quantity_for_set).toBe(2);
    expect(node.tags).toEqual(['weapon', 'prime']);
    expect(node.ducats).toBe(45);
    expect(node.market.diff).toBe(2); // sell 12 - buy 10
    // These four are exactly what processForDisplay strips, and what the
    // "median" and "bulk" pricing bases run on.
    expect(node.market.last_completed?.median).toBe(11.5);
    expect(node.market.last_completed?.moving_avg).toBe(11.2);
    expect(node.depth?.sell?.[0]?.price).toBe(12);
    expect(node.market.buyAvg).toBe(9);
  });

  it('defaults an absent/invalid quantity to 1 rather than 0', () => {
    const a = ItemProcessor.processForSetDetail(partDoc('a')) as ISetFullNode;
    const b = ItemProcessor.processForSetDetail(partDoc('b'), 0) as ISetFullNode;
    const c = ItemProcessor.processForSetDetail(partDoc('c'), NaN) as ISetFullNode;
    expect(a.quantity_for_set).toBe(1);
    // A 0 quantity would silently drop the part from every total.
    expect(b.quantity_for_set).toBe(1);
    expect(c.quantity_for_set).toBe(1);
  });

  it('rejects items that cannot be priced instead of emitting zeros', () => {
    expect(ItemProcessor.processForSetDetail(partDoc('x', { market: undefined }))).toBe('');
    expect(ItemProcessor.processForSetDetail(partDoc('x', { items_in_set: [] }))).toBe('');
    expect(ItemProcessor.processForSetDetail(null as any)).toBe('');
  });

  it('omits depth entirely when both ladder sides are empty', () => {
    const empty = ItemProcessor.processForSetDetail(
      partDoc('x', { market: marketOf({ depth: { buy: [], sell: [] } }) })
    ) as ISetFullNode;
    expect(empty.depth).toBeUndefined();

    const missing = ItemProcessor.processForSetDetail(
      partDoc('y', { market: marketOf({ depth: undefined }) })
    ) as ISetFullNode;
    expect(missing.depth).toBeUndefined();
  });
});

describe('PriceHistoryService.getManyHistories', () => {
  it('loads many items in ONE query and trims to the most recent points', async () => {
    let calls = 0;
    const repo = {
      allEntries: async (query: any) => {
        calls++;
        const wanted: string[] = query?.url_name?.$in ?? [];
        return [
          { url_name: 'a', points: [point('2026-07-01', 5), point('2026-07-02', 6), point('2026-07-03', 9)] },
          { url_name: 'b', points: [point('2026-07-03', 20)] },
        ].filter((d) => wanted.includes(d.url_name));
      },
    } as any;

    const svc = new PriceHistoryService(repo);
    const out = await svc.getManyHistories(['a', 'b', 'a', ''], 2);

    expect(calls).toBe(1); // no N+1
    expect(out.get('a')!.points.map((p) => p.date)).toEqual(['2026-07-02', '2026-07-03']);
    // Trend describes the TRIMMED window (6 -> 9 = +50%), not the full series.
    expect(out.get('a')!.trend.direction).toBe('up');
    expect(Math.round(out.get('a')!.trend.changePercent)).toBe(50);
    expect(out.get('b')!.points).toHaveLength(1);
  });

  it('returns an empty map for an empty request without querying', async () => {
    let calls = 0;
    const repo = { allEntries: async () => { calls++; return []; } } as any;
    const out = await new PriceHistoryService(repo).getManyHistories([]);
    expect(out.size).toBe(0);
    expect(calls).toBe(0);
  });

  it('omits items with no stored document (caller substitutes an empty series)', async () => {
    const svc = new PriceHistoryService(historyRepoStub([{ url_name: 'a', points: [point('2026-07-01', 5)] }]));
    const out = await svc.getManyHistories(['a', 'missing']);
    expect(out.has('a')).toBe(true);
    expect(out.has('missing')).toBe(false);
  });
});

describe('SetService.getSetFullData', () => {
  const parts = [
    partDoc('latron_prime_barrel'),
    partDoc('latron_prime_receiver'),
    partDoc('latron_prime_stock'),
    partDoc('latron_prime_blueprint'),
  ];

  function build(over: { set?: IMarketItem | null; parts?: IMarketItem[]; history?: any } = {}) {
    const history = over.history ?? new PriceHistoryService(historyRepoStub([]));
    return new SetService(
      itemServiceStub(over.set === undefined ? setDoc() : over.set, over.parts ?? parts),
      null as any,
      (i: any) => i,
      history
    );
  }

  it('returns the set plus every part, with quantities resolved from items_in_set', async () => {
    const result = await build().getSetFullData(SET_URL);

    expect(result.set.url_name).toBe(SET_URL);
    expect(result.parts).toHaveLength(4);
    // The set node itself is never one of the parts.
    expect(result.parts.some((p) => p.url_name === SET_URL)).toBe(false);

    const byUrl = new Map(result.parts.map((p) => [p.url_name, p]));
    expect(byUrl.get('latron_prime_barrel')!.quantity_for_set).toBe(2);
    expect(byUrl.get('latron_prime_receiver')!.quantity_for_set).toBe(1);
    // items_in_set entry carried no quantity_for_set -> 1.
    expect(byUrl.get('latron_prime_blueprint')!.quantity_for_set).toBe(1);
  });

  it('preserves the game\'s items_in_set part order regardless of DB order', async () => {
    const shuffled = [parts[3], parts[1], parts[0], parts[2]] as IMarketItem[];
    const result = await build({ parts: shuffled }).getSetFullData(SET_URL);
    expect(result.parts.map((p) => p.url_name)).toEqual([
      'latron_prime_barrel',
      'latron_prime_receiver',
      'latron_prime_stock',
      'latron_prime_blueprint',
    ]);
  });

  it('emits no synthetic "by Parts" node (the client derives totals per basis)', async () => {
    const result = await build().getSetFullData(SET_URL);
    expect(JSON.stringify(result)).not.toContain('by Parts');
  });

  it('attaches batched history and reports the longest series in meta', async () => {
    const history = new PriceHistoryService(
      historyRepoStub([
        { url_name: SET_URL, points: [point('2026-07-01', 50), point('2026-07-02', 60)] },
        { url_name: 'latron_prime_barrel', points: [point('2026-07-02', 12)] },
      ])
    );
    const result = await build({ history }).getSetFullData(SET_URL);

    expect(result.set.history.points).toHaveLength(2);
    expect(result.set.history.trend.direction).toBe('up');
    const barrel = result.parts.find((p) => p.url_name === 'latron_prime_barrel')!;
    expect(barrel.history.points).toHaveLength(1);
    // Items with no stored document keep the empty default.
    const stock = result.parts.find((p) => p.url_name === 'latron_prime_stock')!;
    expect(stock.history.points).toEqual([]);
    expect(stock.history.trend.direction).toBe('flat');
    expect(result.meta.historyDays).toBe(2);
  });

  it('reports the freshness window and flags parts that could not be priced', async () => {
    const unpriced = partDoc('latron_prime_stock', { market: undefined });
    const result = await build({ parts: [parts[0], parts[1], unpriced, parts[3]] }).getSetFullData(SET_URL);

    // The unpriced part is dropped rather than summed in as 0 platinum...
    expect(result.parts).toHaveLength(3);
    // ...and the gap is visible, so the client can mark totals incomplete.
    expect(result.meta.partsCount).toBe(4);
    expect(result.meta.pricedParts).toBe(3);

    expect(result.meta.oldestPriceUpdate).toBe('2026-07-19T10:00:00.000Z');
    expect(result.meta.newestPriceUpdate).toBe('2026-07-19T12:00:00.000Z'); // the set doc
  });

  it('works without a price-history service (degrades to empty series)', async () => {
    const svc = new SetService(itemServiceStub(setDoc(), parts), null as any, (i: any) => i);
    const result = await svc.getSetFullData(SET_URL);
    expect(result.set.history.points).toEqual([]);
    expect(result.meta.historyDays).toBe(0);
  });

  it('throws the same messages as getSetData for unknown or non-set slugs', async () => {
    await expect(build({ set: null }).getSetFullData('nope')).rejects.toThrow('Set not found: nope');

    const notASet = setDoc({ items_in_set: [] });
    await expect(build({ set: notASet }).getSetFullData(SET_URL)).rejects.toThrow(
      `Set has no items: ${SET_URL}`
    );

    const noMarket = setDoc({ market: undefined });
    await expect(build({ set: noMarket }).getSetFullData(SET_URL)).rejects.toThrow(
      `Set has no market data: ${SET_URL}`
    );
  });

  // REGRESSION: every member of a set carries the SAME items_in_set roster, so
  // without this guard /set_full/<a part> returned a bundle whose "parts" list
  // was the parent set plus the part's own siblings — nonsense rendered as real.
  it('rejects a part slug rather than comparing it against its own siblings', async () => {
    const partDocWithRoster = partDoc('latron_prime_barrel', {
      item_name: 'Latron Prime Barrel',
      items_in_set: setDoc().items_in_set,
    });
    const svc = build({ set: partDocWithRoster });
    await expect(svc.getSetFullData('latron_prime_barrel')).rejects.toThrow(
      'Not a set: latron_prime_barrel'
    );
  });

  it('rejects a single-member item that is merely named like a set', async () => {
    const lonely = setDoc({
      items_in_set: [{ url_name: SET_URL, tags: ['warframe'] } as any],
    });
    await expect(build({ set: lonely }).getSetFullData(SET_URL)).rejects.toThrow(
      `Not a set: ${SET_URL}`
    );
  });
});

// ---------------------------------------------------------------------------
// Degenerate-roster detection + self-heal. A set enriched before warframe.market
// published its `setParts` is stored with only its own entry — /set_full then
// 500s ("Not a set") forever because it is already flagged v2_enriched. These
// guard the predicate and the read-time repair-and-retry that unstick such docs.
// ---------------------------------------------------------------------------

describe('isIncompleteSetRoster', () => {
  it('flags a set-named item whose roster holds only itself', () => {
    expect(
      isIncompleteSetRoster({
        item_name: 'Styanax Prime Set',
        items_in_set: [{ url_name: 'styanax_prime_set' }],
      })
    ).toBe(true);
  });

  it('flags a set-named item with a missing/empty roster', () => {
    expect(isIncompleteSetRoster({ item_name: 'Styanax Prime Set' })).toBe(true);
    expect(
      isIncompleteSetRoster({ item_name: 'Styanax Prime Set', items_in_set: [] })
    ).toBe(true);
  });

  it('does NOT flag a healthy multi-part set', () => {
    expect(
      isIncompleteSetRoster({
        item_name: 'Ash Prime Set',
        items_in_set: [{}, {}, {}, {}, {}] as any[],
      })
    ).toBe(false);
  });

  it('does NOT flag a standalone non-set item with a single self entry', () => {
    // e.g. "Secura Dual Cestra" — legitimately one roster entry, not a set.
    expect(
      isIncompleteSetRoster({ item_name: 'Secura Dual Cestra', items_in_set: [{}] })
    ).toBe(false);
  });
});
