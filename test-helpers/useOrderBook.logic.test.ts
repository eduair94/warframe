/**
 * @fileoverview Unit tests for the "bulk buy/sell" order-book walker that powers
 * the details dialogs. Runs under the backend jest setup (pure module).
 *
 * The scenario under test is the real Meso V6 book: the bid side is polluted with
 * meme-quantity bait (125p × 9,996) far above the ~30p going rate, while the ask
 * side is thin and cheap. Walking to SELL must skip the bait and price into the
 * genuine bids; walking to BUY must climb the real asks as the cheap ones run out.
 */

import { describe, it, expect } from '@jest/globals';
import {
  walkBook,
  bulkBuy,
  bulkSell,
  availableUnits,
  type OrderBook,
} from '../app/app/composables/useOrderBook';

// Meso V6, trimmed: bids include 9,996-unit and 6,660-unit bait at 125/150p; the
// credible bids are 36/10/8/6p. Asks are cheap and thin.
const mesoV6 = (): OrderBook => ({
  url_name: 'meso_v6_relic',
  subtype: 'intact',
  buy: [
    { price: 150, quantity: 6660 },
    { price: 125, quantity: 9996 },
    { price: 36, quantity: 3 },
    { price: 10, quantity: 5 },
    { price: 8, quantity: 4 },
    { price: 6, quantity: 20 },
  ],
  sell: [
    { price: 30, quantity: 2 },
    { price: 40, quantity: 5 },
    { price: 60, quantity: 6 },
    { price: 85, quantity: 1 },
  ],
});

describe('walkBook', () => {
  it('fills across levels and volume-weights the average', () => {
    const q = walkBook([{ price: 30, quantity: 2 }, { price: 40, quantity: 5 }], 4);
    expect(q.units).toBe(4);
    expect(q.cost).toBe(30 * 2 + 40 * 2); // 140
    expect(q.avg).toBeCloseTo(35, 6);
    expect(q.best).toBe(30);
    expect(q.filled).toBe(true);
    expect(q.levels).toEqual([{ price: 30, take: 2 }, { price: 40, take: 2 }]);
  });
  it('reports a partial fill when depth runs out', () => {
    const q = walkBook([{ price: 30, quantity: 2 }], 10);
    expect(q.units).toBe(2);
    expect(q.filled).toBe(false);
  });
  it('is empty (not NaN) for a zero request', () => {
    const q = walkBook([{ price: 30, quantity: 2 }], 0);
    expect(q.units).toBe(0);
    expect(q.avg).toBe(0);
    expect(q.filled).toBe(false);
  });
});

describe('bulkBuy', () => {
  it('climbs the real asks as the cheap ones run out', () => {
    // Buy 8: 30×2 + 40×5 + 60×1 = 60 + 200 + 60 = 320 over 8 units -> 40 avg
    const q = bulkBuy(mesoV6(), 8, 30);
    expect(q.units).toBe(8);
    expect(q.cost).toBe(320);
    expect(q.avg).toBeCloseTo(40, 6);
    expect(q.best).toBe(30);
    expect(q.filled).toBe(true);
  });
  it('skips a troll-low ask below the going-rate floor', () => {
    const book = mesoV6();
    book.sell.unshift({ price: 1, quantity: 50 }); // 1p troll on a 30p relic
    const q = bulkBuy(book, 2, 30);
    expect(q.best).toBe(30); // the 1p troll is excluded, not taken
    expect(q.excluded).toBe(1);
  });
});

describe('bulkSell', () => {
  it('skips meme-quantity bait bids and prices into the genuine ones', () => {
    // Sell 5: credible bids are 36×3, 10×5... -> 36×3 + 10×2 = 108+20 = 128 /5 = 25.6
    const q = bulkSell(mesoV6(), 5, 30);
    expect(q.best).toBe(36); // NOT the 125/150p bait
    expect(q.units).toBe(5);
    expect(q.cost).toBe(36 * 3 + 10 * 2);
    expect(q.avg).toBeCloseTo(25.6, 6);
    expect(q.excluded).toBe(2); // the 150p and 125p bait levels dropped
  });
  it('without a going rate it cannot judge bait, so it walks the raw book', () => {
    const q = bulkSell(mesoV6(), 2, 0);
    expect(q.best).toBe(150); // no anchor -> no bait filtering
    expect(q.excluded).toBe(0);
  });
});

describe('availableUnits', () => {
  it('counts only credible depth on each side', () => {
    // Sell side (bids) credible depth = 3 + 5 + 4 + 20 = 32 (bait excluded)
    expect(availableUnits(mesoV6(), 'sell', 30)).toBe(32);
    // Buy side (asks) credible depth = 2 + 5 + 6 + 1 = 14
    expect(availableUnits(mesoV6(), 'buy', 30)).toBe(14);
  });
});
