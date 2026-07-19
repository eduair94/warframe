/**
 * @fileoverview Unit tests for the set-vs-parts valuation that powers the set
 * detail page's pricing-basis toggle. Runs under the backend jest setup (pure
 * module — useSetPricing imports only useOrderBook).
 *
 * The scenarios are the ones that actually break a naive implementation:
 * a part needed 2× per set, a part missing data on the selected basis, and a
 * depth ladder too thin to fill the quantity at the best ask.
 */

import { describe, it, expect } from '@jest/globals';
import {
  priceOn,
  priceWithFallback,
  priceSet,
  priceAllBases,
  basisSupported,
  goingRateOf,
  EVEN_THRESHOLD_PCT,
  type SetNode,
} from '../app/app/composables/useSetPricing';

function node(url_name: string, market: any, over: Partial<SetNode> = {}): SetNode {
  return {
    item_name: url_name,
    url_name,
    quantity_for_set: 1,
    market,
    ...over,
  } as SetNode;
}

// Latron Prime-ish: the set asks 60p; the parts ask 63p in total once the
// barrel's 2× requirement is honoured (12×2 + 11 + 8 + 8 = 51 -> see below).
const setNode = () =>
  node('latron_prime_set', {
    buy: 55,
    sell: 60,
    buyAvg: 52,
    sellAvg: 64,
    avg_price: 58,
    volume: 120,
    last_completed: { median: 57 },
  });

const partNodes = (): SetNode[] => [
  node(
    'barrel',
    { buy: 10, sell: 12, buyAvg: 9, sellAvg: 13, avg_price: 11, last_completed: { median: 11 } },
    { quantity_for_set: 2 },
  ),
  node('receiver', { buy: 9, sell: 11, buyAvg: 8, sellAvg: 12, avg_price: 10, last_completed: { median: 10 } }),
  node('stock', { buy: 6, sell: 8, buyAvg: 5, sellAvg: 9, avg_price: 7, last_completed: { median: 7 } }),
  node('blueprint', { buy: 6, sell: 8, buyAvg: 5, sellAvg: 9, avg_price: 7, last_completed: { median: 7 } }),
];

describe('priceOn — basis selection', () => {
  const n = partNodes()[0]!;

  it('reads the correct side of the book per basis', () => {
    // acquire = lowest ask, resale = highest bid
    expect(priceOn(n, 'instant')).toEqual({ acquire: 12, resale: 10 });
    expect(priceOn(n, 'top5')).toEqual({ acquire: 13, resale: 9 });
    // a traded average has no bid/ask side — same number both ways
    expect(priceOn(n, 'avg48h')).toEqual({ acquire: 11, resale: 11 });
    expect(priceOn(n, 'median')).toEqual({ acquire: 11, resale: 11 });
  });

  it('returns zeros (not NaN) when a basis has no data', () => {
    const bare = node('bare', { buy: 5, sell: 6 });
    expect(priceOn(bare, 'top5')).toEqual({ acquire: 0, resale: 0 });
    expect(priceOn(bare, 'median')).toEqual({ acquire: 0, resale: 0 });
    expect(priceOn(bare, 'bulk')).toEqual({ acquire: 0, resale: 0 });
  });

  it('anchors the going rate on traded average before the live book', () => {
    expect(goingRateOf({ avg_price: 11, sell: 99, buy: 1 })).toBe(11);
    expect(goingRateOf({ sell: 9, buy: 1 })).toBe(9);
    expect(goingRateOf({ buy: 4 })).toBe(4);
    expect(goingRateOf({})).toBe(0);
  });
});

describe('priceOn — bulk basis walks the depth ladder', () => {
  it('prices 2 units above the best ask when the top level is thin', () => {
    const thin = node(
      'barrel',
      { buy: 10, sell: 12, avg_price: 12 },
      {
        quantity_for_set: 2,
        depth: {
          sell: [
            { price: 12, quantity: 1 },
            { price: 18, quantity: 5 },
          ],
          buy: [
            { price: 10, quantity: 1 },
            { price: 6, quantity: 9 },
          ],
        },
      },
    );

    // One unit clears at the best ask...
    expect(priceOn(thin, 'bulk', 1).acquire).toBe(12);
    // ...two units average (12 + 18) / 2 = 15, which "instant" cannot express.
    expect(priceOn(thin, 'bulk', 2).acquire).toBe(15);
    // Selling 2 walks down the bids: (10 + 6) / 2 = 8.
    expect(priceOn(thin, 'bulk', 2).resale).toBe(8);
  });

  it('ignores bait bids far above the going rate', () => {
    const baited = node(
      'relic',
      { buy: 125, sell: 30, avg_price: 30 },
      {
        depth: {
          // 125p x 9996 is the classic never-filling bait order.
          buy: [
            { price: 125, quantity: 9996 },
            { price: 28, quantity: 5 },
          ],
          sell: [{ price: 30, quantity: 5 }],
        },
      },
    );
    // The bait is skipped; the credible bid prices the sale.
    expect(priceOn(baited, 'bulk', 1).resale).toBe(28);
  });
});

describe('priceWithFallback', () => {
  it('flags nothing when the requested basis has data', () => {
    const r = priceWithFallback(partNodes()[0]!, 'median', 2);
    expect(r).toMatchObject({ acquire: 11, estimated: false, from: 'median' });
  });

  it('falls back to another basis and marks the row estimated', () => {
    const bare = node('bare', { buy: 5, sell: 6 });
    const r = priceWithFallback(bare, 'median');
    // median prefers the other TRADED basis first; with no avg_price either, it
    // drops to the live book.
    expect(r).toMatchObject({ acquire: 6, resale: 5, estimated: true, from: 'instant' });
  });

  it('fills a median gap from the traded average, not the live ask', () => {
    // ask 11 vs traded 10 — mixing the book into a traded-basis total inflates it.
    const noMedian = node('receiver', { buy: 9, sell: 11, avg_price: 10 });
    expect(priceWithFallback(noMedian, 'median')).toMatchObject({
      acquire: 10,
      from: 'avg48h',
    });
    // ...and the reverse: a missing top-5 is filled from the book, not a trade.
    const noTop5 = node('barrel', { buy: 9, sell: 11, avg_price: 10 });
    expect(priceWithFallback(noTop5, 'top5')).toMatchObject({ acquire: 11, from: 'instant' });
  });

  // REGRESSION: OrderCalculator stops its ingame/online walk as soon as EITHER
  // side has orders, so items with bidders but no sellers really are stored as
  // `sell: 0, buy: 20`. Accepting that whole quote priced the part's acquire
  // cost at 0p, dropped it from the parts total unflagged, and could invert the
  // verdict outright.
  it('fills a MISSING SIDE rather than accepting a one-sided quote', () => {
    const noAsks = node('blueprint', { buy: 20, sell: 0, avg_price: 30, last_completed: { median: 30 } });
    const r = priceWithFallback(noAsks, 'instant');
    expect(r.acquire).toBe(30); // borrowed, NOT left at 0
    expect(r.resale).toBe(20); // the side that had data is kept
    expect(r.estimated).toBe(true);
    expect(r.from).toBe('avg48h');

    // Mirror case: no bidders. The resale side must be filled, not zeroed.
    const noBids = node('avionics', { buy: 0, sell: 40, avg_price: 36 });
    const m = priceWithFallback(noBids, 'instant');
    expect(m.acquire).toBe(40);
    expect(m.resale).toBe(36);
    expect(m.estimated).toBe(true);
  });

  it('counts a one-sided part toward coverage so the incomplete warning fires', () => {
    const parts = partNodes();
    parts[3] = node('blueprint', { buy: 20, sell: 0, avg_price: 30, last_completed: { median: 30 } });
    const r = priceSet(setNode(), parts, 'instant');
    // 12x2 + 11 + 8 + 30(borrowed) = 73, NOT 43 with the blueprint counted as free.
    expect(r.partsCost).toBe(73);
    expect(r.coverage.estimated).toBe(1);
    expect(r.incomplete).toBe(true);
  });

  it('reports no source when the item has no usable price at all', () => {
    const dead = node('dead', { buy: 0, sell: 0 });
    expect(priceWithFallback(dead, 'instant')).toEqual({
      acquire: 0,
      resale: 0,
      estimated: true,
      from: null,
    });
  });
});

describe('priceSet', () => {
  it('multiplies each part by quantity_for_set', () => {
    const r = priceSet(setNode(), partNodes(), 'instant');
    // 12x2 + 11 + 8 + 8 = 51 -- the barrel's 2x is the part a naive sum misses.
    expect(r.partsCost).toBe(51);
    expect(r.partsValue).toBe(10 * 2 + 9 + 6 + 6);
    expect(r.rows.find((x) => x.node.url_name === 'barrel')!.acquireTotal).toBe(24);
  });

  it('computes savings and calls the verdict from the SET perspective', () => {
    const r = priceSet(setNode(), partNodes(), 'instant');
    expect(r.setCost).toBe(60);
    expect(r.save).toBe(9); // 60 - 51 -> parts are cheaper
    expect(r.savePct).toBeCloseTo(15, 5);
    expect(r.verdict).toBe('parts');
  });

  it('flips the verdict to "set" when parts cost more', () => {
    const cheapSet = node('s', { buy: 40, sell: 40, avg_price: 40 });
    const r = priceSet(cheapSet, partNodes(), 'instant');
    expect(r.save).toBe(40 - 51);
    expect(r.verdict).toBe('set');
  });

  // REGRESSION: savePct divided by setCost in BOTH directions. The `set` verdict
  // copy is "The assembled set costs {pct} less than buying every part", whose
  // baseline is the parts total — anchoring on the smaller setCost produced
  // impossible copy like "costs 150% less".
  it('measures each verdict against the correct baseline', () => {
    // Parts cheaper: baseline is the set. 60 vs 51 -> 15% off the set.
    const parts = priceSet(setNode(), partNodes(), 'instant');
    expect(parts.verdict).toBe('parts');
    expect(parts.savePct).toBeCloseTo(15, 5);

    // Set cheaper: baseline is the parts total. 40 vs 51 -> 21.6% off the parts.
    const set = priceSet(node('s', { buy: 38, sell: 40 }), partNodes(), 'instant');
    expect(set.verdict).toBe('set');
    expect(Math.abs(set.savePct)).toBeCloseTo(((51 - 40) / 51) * 100, 5);
  });

  it('never reports a discount of 100% or more', () => {
    // setCost 40 vs partsCost 100 — the old formula printed "150% less".
    const pricey = partNodes().map((p) => node(p.url_name, { buy: 20, sell: 25 }, { quantity_for_set: 1 }));
    const r = priceSet(node('s', { buy: 35, sell: 40 }), pricey, 'instant');
    expect(r.partsCost).toBe(100);
    expect(r.save).toBe(-60);
    expect(Math.abs(r.savePct)).toBeCloseTo(60, 5);
    expect(Math.abs(r.savePct)).toBeLessThan(100);
  });

  it('calls a sub-threshold difference "even" rather than a false edge', () => {
    // 52p set vs 51p parts = 1.9% — inside the spread, not a real saving.
    const r = priceSet(node('s', { buy: 50, sell: 52 }), partNodes(), 'instant');
    expect(Math.abs(r.savePct)).toBeLessThan(EVEN_THRESHOLD_PCT);
    expect(r.verdict).toBe('even');
  });

  it('changes the answer between bases — the whole point of the toggle', () => {
    const all = priceAllBases(setNode(), partNodes());
    expect(all.instant.partsCost).toBe(51);
    // top-5 asks are higher across the board, so parting out looks worse
    expect(all.top5.partsCost).toBe(13 * 2 + 12 + 9 + 9);
    expect(all.avg48h.partsCost).toBe(11 * 2 + 10 + 7 + 7);
    expect(all.top5.save).toBeLessThan(all.instant.save);
  });

  it('falls back per part instead of zeroing the total', () => {
    const parts = partNodes();
    // Strip the median from one part only.
    parts[1] = node('receiver', { buy: 9, sell: 11, buyAvg: 8, sellAvg: 12, avg_price: 10 });

    const r = priceSet(setNode(), parts, 'median');
    // 11x2 + 10 (fallback: avg48h) + 7 + 7 = 46 — the part is still counted.
    expect(r.partsCost).toBe(46);
    expect(r.coverage).toEqual({ priced: 3, total: 4, estimated: 1 });
    expect(r.incomplete).toBe(true);
    expect(r.rows.find((x) => x.node.url_name === 'receiver')!.estimated).toBe(true);
  });

  it('marks the result incomplete when the payload is missing declared parts', () => {
    const r = priceSet(setNode(), partNodes().slice(0, 3), 'instant', 4);
    expect(r.coverage.total).toBe(4);
    expect(r.coverage.priced).toBe(3);
    expect(r.incomplete).toBe(true);
  });

  it('reports a basis as unavailable when the SET itself has to fall back', () => {
    const bareSet = node('s', { buy: 55, sell: 60 }); // no median
    const r = priceSet(bareSet, partNodes(), 'median');
    expect(r.available).toBe(false);
    // ...but still produces usable numbers via the fallback, not zeros.
    expect(r.setCost).toBe(60);
  });

  it('does not invent savings when one side has no price', () => {
    const r = priceSet(node('s', { buy: 0, sell: 0 }), partNodes(), 'instant');
    expect(r.setCost).toBe(0);
    expect(r.save).toBe(0);
    expect(r.savePct).toBe(0);
    expect(r.verdict).toBe('even');
  });

  it('survives a null set and an empty parts list', () => {
    const r = priceSet(null, [], 'instant');
    expect(r.partsCost).toBe(0);
    expect(r.setCost).toBe(0);
    expect(r.rows).toEqual([]);
    expect(r.available).toBe(false);
  });
});

describe('basisSupported', () => {
  it('is true only when the set AND at least one part price natively', () => {
    expect(basisSupported(setNode(), partNodes(), 'instant')).toBe(true);
    expect(basisSupported(setNode(), partNodes(), 'median')).toBe(true);
    // No depth anywhere -> bulk is pure fallback, so it must not be offered.
    expect(basisSupported(setNode(), partNodes(), 'bulk')).toBe(false);
    // Set has no top-5 data.
    expect(basisSupported(node('s', { buy: 1, sell: 2 }), partNodes(), 'top5')).toBe(false);
    expect(basisSupported(null, partNodes(), 'instant')).toBe(false);
  });
});
