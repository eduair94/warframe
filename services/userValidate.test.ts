import { describe, it, expect } from '@jest/globals';
import {
  foundryKey,
  iso,
  id,
  isSection,
  num,
  numOrNull,
  sanitizeFoundry,
  sanitizeGoals,
  sanitizeLocale,
  sanitizeSection,
  sanitizeSettings,
  sanitizeTrades,
  sanitizeUserData,
  sanitizeVault,
  sanitizeWatchlist,
  slug,
  str,
} from './userValidate';
import { USER_LIMITS } from './userTypes';

describe('userValidate primitives', () => {
  it('clamps strings and rejects non-strings', () => {
    expect(str('  hi  ')).toBe('hi');
    expect(str(123 as any)).toBe('');
    expect(str('x'.repeat(500)).length).toBe(USER_LIMITS.TEXT);
  });

  it('coerces numbers and rejects negatives / NaN / Infinity', () => {
    expect(num('12.5')).toBe(12.5);
    expect(num(-1, 7)).toBe(7);
    expect(num(Number.NaN, 3)).toBe(3);
    expect(num(Number.POSITIVE_INFINITY, 3)).toBe(3);
    expect(num(1e18)).toBe(USER_LIMITS.NUMBER);
  });

  it('treats empty / null as an unset threshold', () => {
    expect(numOrNull('')).toBeNull();
    expect(numOrNull(null)).toBeNull();
    expect(numOrNull(undefined)).toBeNull();
    expect(numOrNull('40')).toBe(40);
    expect(numOrNull(-5)).toBeNull();
  });

  it('normalises timestamps and falls back to now', () => {
    expect(iso('2026-01-02T03:04:05.000Z')).toBe('2026-01-02T03:04:05.000Z');
    expect(iso('not-a-date', 'FALLBACK')).toBe('FALLBACK');
    expect(iso(undefined, 'FALLBACK')).toBe('FALLBACK');
  });

  it('accepts only warframe.market style slugs', () => {
    expect(slug('mirage_prime_set')).toBe('mirage_prime_set');
    expect(slug('LITH_A1_RELIC')).toBe('lith_a1_relic');
    expect(slug('../../etc/passwd')).toBe('');
    expect(slug('has space')).toBe('');
    expect(slug({} as any)).toBe('');
  });

  it('accepts only opaque ids', () => {
    expect(id('a1-B2_c3')).toBe('a1-B2_c3');
    expect(id('bad id!')).toBe('');
    expect(id('x'.repeat(200))).toBe('');
  });

  it('knows the valid sections', () => {
    expect(isSection('vault')).toBe(true);
    expect(isSection('__proto__')).toBe(false);
    expect(isSection(7)).toBe(false);
  });
});

describe('sanitizeWatchlist', () => {
  it('keys by url_name and fills every field', () => {
    const out = sanitizeWatchlist({
      ash_prime_set: {
        url_name: 'ash_prime_set',
        item_name: 'Ash Prime Set',
        addedAt: '2026-01-01T00:00:00.000Z',
        ownedQty: '2',
        alertBelow: '100',
        alertAbove: null,
        notifiedBelow: 1,
        alertAtl: true,
      },
    });
    expect(out.ash_prime_set).toEqual({
      url_name: 'ash_prime_set',
      item_name: 'Ash Prime Set',
      addedAt: '2026-01-01T00:00:00.000Z',
      // No explicit edit stamp: defaults to the creation stamp so pre-existing
      // documents still compare sensibly in the merge.
      updatedAt: '2026-01-01T00:00:00.000Z',
      ownedQty: 2,
      alertBelow: 100,
      alertAbove: null,
      notifiedBelow: true,
      notifiedAbove: false,
      alertAtl: true,
      notifiedAtl: false,
    });
  });

  it('accepts an array as well as a keyed map', () => {
    const out = sanitizeWatchlist([{ url_name: 'a_set', item_name: 'A' }]);
    expect(Object.keys(out)).toEqual(['a_set']);
  });

  it('drops entries without a usable slug', () => {
    const out = sanitizeWatchlist([{ item_name: 'nameless' }, { url_name: 'ok_set' }, null, 5]);
    expect(Object.keys(out)).toEqual(['ok_set']);
    // item_name falls back to the slug rather than being empty.
    expect(out.ok_set.item_name).toBe('ok_set');
  });

  it('truncates at the cap', () => {
    const many = Array.from({ length: USER_LIMITS.WATCHLIST + 25 }, (_, i) => ({
      url_name: `item_${i}`,
    }));
    expect(Object.keys(sanitizeWatchlist(many)).length).toBe(USER_LIMITS.WATCHLIST);
  });
});

describe('sanitizeWatchlist — edit stamps', () => {
  it('keeps an explicit updatedAt so a later edit beats an untouched copy', () => {
    const out = sanitizeWatchlist([
      { url_name: 'a_set', addedAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-05-05T00:00:00.000Z' },
    ]);
    expect(out.a_set.updatedAt).toBe('2026-05-05T00:00:00.000Z');
  });
});

describe('prototype-pollution keys', () => {
  it('rejects __proto__ / constructor / prototype as slugs', () => {
    expect(slug('__proto__')).toBe('');
    expect(slug('constructor')).toBe('');
    expect(slug('prototype')).toBe('');
  });

  it('rejects them as foundry keys too, and bounds the key length', () => {
    expect(foundryKey('__proto__')).toBe('');
    expect(foundryKey('constructor')).toBe('');
    expect(foundryKey('Ninja')).toBe('Ninja');
    expect(foundryKey('x'.repeat(USER_LIMITS.FOUNDRY_KEY))).toHaveLength(USER_LIMITS.FOUNDRY_KEY);
    expect(foundryKey('x'.repeat(USER_LIMITS.FOUNDRY_KEY + 1))).toBe('');
  });

  it('drops such entries entirely rather than half-writing them', () => {
    expect(sanitizeWatchlist([{ url_name: '__proto__' }])).toEqual({});
    expect(sanitizeFoundry({ items: { __proto__: { built: true } } }).items).toEqual({});
    expect(({} as any).built).toBeUndefined();
  });
});

describe('sanitizeVault', () => {
  it('rounds quantities and keeps an optional cost basis', () => {
    const out = sanitizeVault([
      { url_name: 'a_set', item_name: 'A', qty: 2.7, cost: '15.5', note: ' held ' },
    ]);
    expect(out.a_set).toMatchObject({ qty: 3, cost: 15.5, note: 'held' });
  });

  it('omits note when blank and nulls an unparseable cost', () => {
    const out = sanitizeVault([{ url_name: 'a_set', note: '   ', cost: 'abc' }]);
    expect(out.a_set.cost).toBeNull();
    expect('note' in out.a_set).toBe(false);
  });

  it('truncates at the cap', () => {
    const many = Array.from({ length: USER_LIMITS.VAULT + 10 }, (_, i) => ({ url_name: `i_${i}` }));
    expect(Object.keys(sanitizeVault(many)).length).toBe(USER_LIMITS.VAULT);
  });
});

describe('sanitizeGoals', () => {
  it('defaults targetQty to at least 1 and dedupes by id', () => {
    const out = sanitizeGoals([
      { id: 'g1', url_name: 'mesa_prime_set', targetQty: 0 },
      { id: 'g1', url_name: 'mesa_prime_set', targetQty: 5 },
      { id: 'g2', url_name: 'nova_prime_set', targetQty: 2.4 },
    ]);
    expect(out.map((g) => [g.id, g.targetQty])).toEqual([
      ['g1', 1],
      ['g2', 2],
    ]);
  });

  it('falls back to the slug as id and drops slugless goals', () => {
    const out = sanitizeGoals([{ url_name: 'mesa_prime_set' }, { id: 'x' }]);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('mesa_prime_set');
  });

  it('is empty for non-arrays', () => {
    expect(sanitizeGoals({ a: 1 })).toEqual([]);
    expect(sanitizeGoals(null)).toEqual([]);
  });
});

describe('sanitizeTrades', () => {
  it('normalises side, qty and price', () => {
    const out = sanitizeTrades([
      { id: 't1', url_name: 'a_set', side: 'buy', qty: '3', price: '20' },
      { id: 't2', url_name: 'a_set', side: 'nonsense', qty: 0, price: -4 },
    ]);
    expect(out[0]).toMatchObject({ side: 'buy', qty: 3, price: 20 });
    // anything that isn't an explicit "buy" is a sell; qty floors at 1, price at 0
    expect(out[1]).toMatchObject({ side: 'sell', qty: 1, price: 0 });
  });

  it('requires an id (unlike goals) so ledger rows stay addressable', () => {
    expect(sanitizeTrades([{ url_name: 'a_set', side: 'buy' }])).toEqual([]);
  });

  it('keeps the most recent trades when over the cap', () => {
    const many = Array.from({ length: USER_LIMITS.TRADES + 5 }, (_, i) => ({
      id: `t${i}`,
      url_name: 'a_set',
      side: 'buy',
      qty: 1,
      price: 1,
    }));
    const out = sanitizeTrades(many);
    expect(out).toHaveLength(USER_LIMITS.TRADES);
    expect(out[out.length - 1].id).toBe(`t${USER_LIMITS.TRADES + 4}`);
  });
});

describe('sanitizeSettings', () => {
  it('whitelists the basis and keeps booleans', () => {
    expect(sanitizeSettings({ basis: 'median', liquidityAdjust: true, platform: 'PC' })).toEqual({
      platform: 'pc',
      basis: 'median',
      liquidityAdjust: true,
    });
  });

  it('drops unknown keys and an invalid basis', () => {
    expect(sanitizeSettings({ basis: 'wat', evil: 1 })).toEqual({});
  });
});

describe('sanitizeSection / sanitizeUserData', () => {
  it('returns undefined for an unknown section', () => {
    expect(sanitizeSection('__proto__', {})).toBeUndefined();
    expect(sanitizeSection('vault', [])).toEqual({});
  });

  it('rebuilds a whole payload and never trusts extra keys', () => {
    const out = sanitizeUserData(
      { watchlist: {}, vault: {}, goals: [], trades: [], settings: {}, hacked: true },
      'NOW'
    );
    expect(Object.keys(out).sort()).toEqual([
      'foundry',
      'goals',
      'settings',
      'trades',
      'updatedAt',
      'vault',
      'watchlist',
    ]);
    expect(out.updatedAt).toBe('NOW');
  });

  it('produces an empty payload from junk', () => {
    expect(sanitizeUserData(null, 'NOW')).toEqual({
      watchlist: {},
      vault: {},
      goals: [],
      trades: [],
      foundry: { items: {}, resources: {}, counters: {}, excluded: [], updatedAt: 'NOW' },
      settings: {},
      updatedAt: 'NOW',
    });
  });
});

describe('sanitizeFoundry', () => {
  it('keeps flags, component counts, resources and counters', () => {
    const out = sanitizeFoundry({
      items: {
        SapientPrimaryWeapon: { built: true, mastered: true, comp: { SapientPrimaryBlueprint: 1 } },
      },
      resources: { Ferrite: '900', Nanospores: 0 },
      counters: { missions: 220, junctions: 18, intrinsics: 40 },
      excluded: ['AshPrime', 'AshPrime', 'bad key!'],
    });
    expect(out.items.SapientPrimaryWeapon).toEqual({
      built: true,
      mastered: true,
      comp: { SapientPrimaryBlueprint: 1 },
    });
    // A zero count carries no information and is dropped.
    expect(out.resources).toEqual({ Ferrite: 900 });
    expect(out.counters).toEqual({ missions: 220, junctions: 18, intrinsics: 40 });
    expect(out.excluded).toEqual(['AshPrime']);
  });

  it('drops records with nothing ticked and keys that are not uniqueKeys', () => {
    const out = sanitizeFoundry({
      items: {
        Empty: {},
        'Bad Key!': { built: true },
        '../../etc': { built: true },
        Ok: { mastered: true },
      },
    });
    expect(Object.keys(out.items)).toEqual(['Ok']);
  });

  it('rejects junk component counts', () => {
    const out = sanitizeFoundry({
      items: { Ninja: { comp: { A: '3', B: -1, C: 'x', 'bad!': 5 } } },
    });
    expect(out.items.Ninja.comp).toEqual({ A: 3 });
  });

  it('caps the number of tracked items', () => {
    const items: Record<string, any> = {};
    for (let i = 0; i < USER_LIMITS.FOUNDRY_ITEMS + 50; i++) items[`Item${i}`] = { built: true };
    expect(Object.keys(sanitizeFoundry({ items }).items).length).toBe(USER_LIMITS.FOUNDRY_ITEMS);
  });

  it('is empty for junk input', () => {
    expect(sanitizeFoundry(null, 'NOW')).toEqual({
      items: {},
      resources: {},
      counters: {},
      excluded: [],
      updatedAt: 'NOW',
    });
    expect(sanitizeFoundry('nope' as any).items).toEqual({});
  });

  it('is reachable through sanitizeSection', () => {
    expect(sanitizeSection('foundry', { items: { Ok: { built: true } } })).toMatchObject({
      items: { Ok: { built: true } },
    });
    expect(isSection('foundry')).toBe(true);
  });
});

describe('sanitizeLocale', () => {
  it('whitelists the shipped locales and defaults to en', () => {
    expect(sanitizeLocale('zh-hans')).toBe('zh-hans');
    expect(sanitizeLocale('EN')).toBe('en');
    expect(sanitizeLocale('klingon')).toBe('en');
    expect(sanitizeLocale(undefined)).toBe('en');
  });
});
