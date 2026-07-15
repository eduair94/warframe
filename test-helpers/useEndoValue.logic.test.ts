/**
 * @fileoverview Unit tests for the shared endo mod-flip valuation that powers the
 * /endo Endo Exchange. Runs under the backend jest setup (see jest.config
 * moduleNameMapper: `vue` + `#imports` stubs) since the module is otherwise pure.
 *
 * Regression focus — the "phantom buy-in" bug: a rank with NO live ask but a lone
 * lowball buy order (e.g. a stray 1p bid on rank 1 of Primed Chamber) must never
 * be chosen as the best buy-in. Before the fix, buy-order mode priced that rank at
 * the 1p bid, giving an absurd plat-per-endo that won the ranking and displayed
 * "buy for 1p"; it also carried no seller, so the WTB whisper lost its `/w`.
 */

import { describe, it, expect } from '@jest/globals';
import { evalFlip, buyWhisper, type EndoFlipRow, type FlipRung } from '../app/app/composables/useEndoValue';

const rung = (over: Partial<FlipRung> & { rank: number }): FlipRung => ({
  ask: 0,
  bid: 0,
  askUser: '',
  sellCount: 0,
  buyCount: 0,
  ...over,
});

// Mirrors the live /endo_flip snapshot for Primed Chamber (rare, maxRank 3):
// rank 0 is the real market (ask 270 / bid 245, seller "Hunk.uss"); rank 1 is a
// single 1p troll buy order with nobody selling; rank 2 is empty.
const primedChamber = (): EndoFlipRow => ({
  item_name: 'Primed Chamber',
  url_name: 'primed_chamber',
  thumb: '',
  tags: ['mod'],
  flip: {
    rarity: 'rare',
    maxRank: 3,
    ranks: [
      rung({ rank: 0, ask: 270, bid: 245, askUser: 'Hunk.uss', sellCount: 7, buyCount: 24 }),
      rung({ rank: 1, ask: 0, bid: 1, buyCount: 1 }),
      rung({ rank: 2 }),
      rung({ rank: 3, ask: 275, bid: 230, askUser: 'arenjkeee', sellCount: 27, buyCount: 9 }),
    ],
    unranked: { avg_price: 252, volume: 289 },
    maxed: { avg_price: 263, volume: 229 },
  },
});

describe('evalFlip — phantom buy-in guard', () => {
  it('does not pick a rank with no ask, even when a lowball bid exists (buy-order mode)', () => {
    const ev = evalFlip(primedChamber(), { buyViaBid: true, sellBasis: 'avg' });
    expect(ev.best).not.toBeNull();
    // The 1p bid on the ask-less rank 1 must be ignored — best is the real rank 0.
    expect(ev.best!.rank).toBe(0);
    expect(ev.best!.buyIn).toBe(245); // competitive bid, capped at the 270 ask
    // No option should ever have a buy-in below the cheapest live ask on the mod.
    for (const o of ev.options) expect(o.buyIn).toBeGreaterThanOrEqual(230);
  });

  it('ignores a lowball bid even when the rank HAS an ask (real prod case)', () => {
    // The bug the ask>0 guard missed: rank 1 IS listed (someone selling ~230p)
    // but the top buy order is a 1p lowball that would never fill. Buy-order
    // mode must not treat 1p as the buy-in and mint a phantom +262p flip.
    const row = primedChamber();
    row.flip.ranks[1] = rung({ rank: 1, ask: 230, bid: 1, sellCount: 2, buyCount: 1 });
    const ev = evalFlip(row, { buyViaBid: true, sellBasis: 'avg' });
    const r1 = ev.options.find((o) => o.rank === 1);
    expect(r1).toBeDefined();
    expect(r1!.buyIn).toBe(230); // falls back to the ask, not the 1p bid
    for (const o of ev.options) expect(o.buyIn).toBeGreaterThanOrEqual(230);
  });

  it('carries the seller behind the ask so the WTB whisper gets a /w', () => {
    const ev = evalFlip(primedChamber(), { buyViaBid: true, sellBasis: 'avg' });
    expect(ev.best!.askUser).toBe('Hunk.uss');
    const msg = buyWhisper(ev.best!.askUser, 'Primed Chamber', ev.best!.ask || ev.best!.buyIn);
    expect(msg).toContain('/w Hunk.uss');
    expect(msg).toContain('270 platinum');
  });

  it('uses the ask when buy-order mode is off', () => {
    // Lift the maxed avg so buying at the 270 ask is actually profitable (at the
    // real 263 avg the instant flip is a loss, which correctly yields no best).
    const row = primedChamber();
    row.flip.maxed.avg_price = 340;
    const ev = evalFlip(row, { buyViaBid: false, sellBasis: 'avg' });
    expect(ev.best!.rank).toBe(0);
    expect(ev.best!.buyIn).toBe(270);
  });

  it('never prices a buy order above the ask (crossed book falls back to the ask)', () => {
    const row = primedChamber();
    row.flip.ranks[0] = rung({ rank: 0, ask: 100, bid: 140, askUser: 'x', sellCount: 3, buyCount: 5 });
    const ev = evalFlip(row, { buyViaBid: true, sellBasis: 'avg' });
    expect(ev.best!.buyIn).toBe(100);
  });

  it('exposes instantProfit (buy-at-ask) apart from the bid-based profit', () => {
    // The danger case: sell maxed 107, unranked ask 110 (seller), bid 92. In
    // buy-order mode the modelled buy-in is 92 → profit +15, but buying instantly
    // at the 110 ask is a 3p LOSS — the copy-whisper price. Both must be exposed.
    const row: EndoFlipRow = {
      item_name: 'Test Mod',
      url_name: 'test_mod',
      thumb: '',
      tags: ['mod'],
      flip: {
        rarity: 'rare',
        maxRank: 3,
        ranks: [
          rung({ rank: 0, ask: 110, bid: 92, askUser: 'mulinxinii', sellCount: 2, buyCount: 5 }),
          rung({ rank: 3, ask: 107, bid: 90, askUser: 'seller', sellCount: 4, buyCount: 3 }),
        ],
        unranked: { avg_price: 100, volume: 50 },
        maxed: { avg_price: 105, volume: 101 },
      },
    };
    const ev = evalFlip(row, { buyViaBid: true, sellBasis: 'ask' });
    expect(ev.best!.rank).toBe(0);
    expect(ev.best!.buyIn).toBe(92); // modelled via the bid
    expect(ev.best!.profit).toBe(15); // 107 − 92
    expect(ev.best!.ask).toBe(110);
    expect(ev.best!.instantProfit).toBe(-3); // 107 − 110: buying now loses plat
  });

  it('instantProfit equals profit when buy-order mode is off', () => {
    const row = primedChamber();
    row.flip.maxed.avg_price = 340;
    const ev = evalFlip(row, { buyViaBid: false, sellBasis: 'avg' });
    expect(ev.best!.instantProfit).toBe(ev.best!.profit);
  });
});

describe('buyWhisper', () => {
  it('prefixes /w when a seller is known', () => {
    expect(buyWhisper('Hunk.uss', 'Serration', 40)).toMatch(/^\/w Hunk\.uss /);
  });
  it('omits /w for an aggregate source with no single seller', () => {
    expect(buyWhisper('', 'Ayatan Anasa Sculpture', 50)).not.toContain('/w');
    expect(buyWhisper(undefined, 'Ayatan Anasa Sculpture', 50)).not.toContain('/w');
  });
  it('rounds the platinum price', () => {
    expect(buyWhisper('a', 'X', 262.99)).toContain('263 platinum');
  });
});
