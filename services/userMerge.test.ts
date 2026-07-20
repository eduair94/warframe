import { describe, it, expect } from '@jest/globals';
import { mergeUserData } from './userMerge';
import { USER_LIMITS } from './userTypes';

const T1 = '2026-01-01T00:00:00.000Z';
const T2 = '2026-02-01T00:00:00.000Z';
const NOW = '2026-07-20T00:00:00.000Z';

describe('mergeUserData — watchlist', () => {
  it('unions entries that exist on only one side', () => {
    const out = mergeUserData(
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T1 } } },
      { watchlist: { b_set: { url_name: 'b_set', addedAt: T1 } } },
      NOW
    );
    expect(Object.keys(out.watchlist).sort()).toEqual(['a_set', 'b_set']);
  });

  it('keeps the newer entry on a collision', () => {
    const out = mergeUserData(
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T1, alertBelow: 10 } } },
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T2, alertBelow: 99 } } },
      NOW
    );
    expect(out.watchlist.a_set.alertBelow).toBe(99);
  });

  it('keeps the server entry when the local one is older', () => {
    const out = mergeUserData(
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T2, alertBelow: 10 } } },
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T1, alertBelow: 99 } } },
      NOW
    );
    expect(out.watchlist.a_set.alertBelow).toBe(10);
  });
});

describe('mergeUserData — edits beat creation order', () => {
  it('keeps the entry that was EDITED most recently, not the one added last', () => {
    const out = mergeUserData(
      // Added first, but edited yesterday.
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T1, updatedAt: T2, alertBelow: 42 } } },
      // Added later, never edited since.
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T2, updatedAt: T2, alertBelow: 7 } } },
      NOW
    );
    // Same edit stamp -> tie -> the stored copy wins, never the uploader.
    expect(out.watchlist.a_set.alertBelow).toBe(42);
  });

  it('a fresh edit on the client wins over an older server edit', () => {
    const out = mergeUserData(
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T1, updatedAt: T1, alertBelow: 42 } } },
      { watchlist: { a_set: { url_name: 'a_set', addedAt: T1, updatedAt: T2, alertBelow: 7 } } },
      NOW
    );
    expect(out.watchlist.a_set.alertBelow).toBe(7);
  });

  it('does the same for goals', () => {
    const out = mergeUserData(
      { goals: [{ id: 'g1', url_name: 'a_set', createdAt: T1, updatedAt: T2, targetQty: 9 }] },
      { goals: [{ id: 'g1', url_name: 'a_set', createdAt: T1, updatedAt: T1, targetQty: 1 }] },
      NOW
    );
    expect(out.goals[0].targetQty).toBe(9);
  });
});

describe('mergeUserData — vault', () => {
  it('does NOT sum quantities (merge runs on every sign-in)', () => {
    const server = { vault: { a_set: { url_name: 'a_set', qty: 3, updatedAt: T1 } } };
    const local = { vault: { a_set: { url_name: 'a_set', qty: 3, updatedAt: T1 } } };
    const once = mergeUserData(server, local, NOW);
    expect(once.vault.a_set.qty).toBe(3);
    // idempotent: merging the result again still yields 3
    const twice = mergeUserData(once, local, NOW);
    expect(twice.vault.a_set.qty).toBe(3);
  });

  it('takes the more recently edited quantity', () => {
    const out = mergeUserData(
      { vault: { a_set: { url_name: 'a_set', qty: 1, updatedAt: T1 } } },
      { vault: { a_set: { url_name: 'a_set', qty: 9, updatedAt: T2 } } },
      NOW
    );
    expect(out.vault.a_set.qty).toBe(9);
  });

  it('drops the oldest entries when the union exceeds the cap', () => {
    const mk = (n: number, from: number, at: string) =>
      Object.fromEntries(
        Array.from({ length: n }, (_, i) => [
          `i_${from + i}`,
          { url_name: `i_${from + i}`, qty: 1, updatedAt: at },
        ])
      );
    const out = mergeUserData(
      { vault: mk(USER_LIMITS.VAULT, 0, T1) },
      { vault: mk(50, 100000, T2) },
      NOW
    );
    const keys = Object.keys(out.vault);
    expect(keys.length).toBe(USER_LIMITS.VAULT);
    // the newer (local) entries survive
    expect(keys).toContain('i_100000');
  });
});

describe('mergeUserData — goals & trades', () => {
  it('unions by id and keeps the newer version', () => {
    const out = mergeUserData(
      {
        goals: [{ id: 'g1', url_name: 'a_set', createdAt: T1, targetQty: 1 }],
        trades: [{ id: 't1', url_name: 'a_set', side: 'buy', qty: 1, price: 5, at: T1 }],
      },
      {
        goals: [
          { id: 'g1', url_name: 'a_set', createdAt: T2, targetQty: 4 },
          { id: 'g2', url_name: 'b_set', createdAt: T2, targetQty: 1 },
        ],
        trades: [{ id: 't2', url_name: 'b_set', side: 'sell', qty: 2, price: 9, at: T2 }],
      },
      NOW
    );
    expect(out.goals.map((g) => g.id).sort()).toEqual(['g1', 'g2']);
    expect(out.goals.find((g) => g.id === 'g1')!.targetQty).toBe(4);
    expect(out.trades.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('orders trades oldest to newest so the P/L curve reads left to right', () => {
    const out = mergeUserData(
      { trades: [{ id: 't2', url_name: 'a_set', side: 'buy', qty: 1, price: 1, at: T2 }] },
      { trades: [{ id: 't1', url_name: 'a_set', side: 'buy', qty: 1, price: 1, at: T1 }] },
      NOW
    );
    expect(out.trades.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('keeps the newest trades when over the cap', () => {
    const mk = (n: number, from: number, at: string) =>
      Array.from({ length: n }, (_, i) => ({
        id: `t${from + i}`,
        url_name: 'a_set',
        side: 'buy',
        qty: 1,
        price: 1,
        at,
      }));
    const out = mergeUserData(
      { trades: mk(USER_LIMITS.TRADES, 0, T1) },
      { trades: mk(10, 900000, T2) },
      NOW
    );
    expect(out.trades).toHaveLength(USER_LIMITS.TRADES);
    expect(out.trades[out.trades.length - 1].id).toBe('t900009');
  });
});

describe('mergeUserData — foundry', () => {
  it('takes the MAXIMUM of both sides — ticks are never lost', () => {
    const out = mergeUserData(
      {
        foundry: {
          items: { Ninja: { built: true, comp: { AshHelmetComponent: 1 } } },
          resources: { Ferrite: 900 },
          counters: { missions: 200 },
          excluded: ['X'],
        },
      },
      {
        foundry: {
          items: {
            Ninja: { mastered: true, comp: { AshHelmetComponent: 3 } },
            AshPrime: { built: true },
          },
          resources: { Ferrite: 100, Rubedo: 5 },
          counters: { missions: 100, junctions: 18 },
          excluded: ['Y'],
        },
      },
      NOW
    );
    // Mastery progress is monotonic, so a newest-wins pick would be wrong here:
    // the phone that is "newer" but less complete must not erase the desktop.
    expect(out.foundry.items.Ninja).toEqual({
      built: true,
      mastered: true,
      comp: { AshHelmetComponent: 3 },
    });
    expect(out.foundry.items.AshPrime).toEqual({ built: true });
    expect(out.foundry.resources).toEqual({ Ferrite: 900, Rubedo: 5 });
    expect(out.foundry.counters).toEqual({ missions: 200, junctions: 18 });
    expect(out.foundry.excluded.sort()).toEqual(['X', 'Y']);
  });

  it('is idempotent', () => {
    const local = { foundry: { items: { Ninja: { mastered: true } }, resources: { Ferrite: 5 } } };
    const once = mergeUserData({}, local, NOW);
    const twice = mergeUserData(once, local, NOW);
    expect(twice.foundry).toEqual(once.foundry);
  });

  it('yields an empty section when neither side has one', () => {
    expect(mergeUserData({}, {}, NOW).foundry).toEqual({
      items: {},
      resources: {},
      counters: {},
      excluded: [],
      updatedAt: NOW,
    });
  });
});

describe('mergeUserData — settings & hygiene', () => {
  it('lets the local device win for keys it defines', () => {
    const out = mergeUserData(
      { settings: { basis: 'sell', liquidityAdjust: false, platform: 'pc' } },
      { settings: { basis: 'median' } },
      NOW
    );
    expect(out.settings).toEqual({ basis: 'median', liquidityAdjust: false, platform: 'pc' });
  });

  it('sanitizes both sides — junk in, clean out', () => {
    const out = mergeUserData(
      { watchlist: { '../evil': { url_name: '../evil' } }, goals: 'nope' },
      { vault: [{ url_name: 'ok_set', qty: '2' }] },
      NOW
    );
    expect(out.watchlist).toEqual({});
    expect(out.goals).toEqual([]);
    expect(out.vault.ok_set.qty).toBe(2);
    expect(out.updatedAt).toBe(NOW);
  });

  it('handles a totally absent server document', () => {
    const out = mergeUserData(null, { vault: { a_set: { url_name: 'a_set', qty: 1 } } }, NOW);
    expect(out.vault.a_set.qty).toBe(1);
  });
});
