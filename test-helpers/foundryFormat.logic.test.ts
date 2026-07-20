/**
 * @fileoverview Interop tests for the warframe-foundry.app backup format.
 *
 * These matter more than most: the whole migration pitch is "bring your
 * warframe-foundry.json and never lose it again". If the parser drops a tick or
 * the exporter writes a file their app rejects, that promise is broken. The
 * fixtures below are the REAL shapes confirmed against the live application —
 * component counts stored as siblings of `built`/`mastered`, the per-category
 * version-1 layout, and the always-complete resources block.
 *
 * Runs under the backend jest setup (jest.config maps `vue` and `#imports`);
 * the module is pure.
 */

import { describe, it, expect } from '@jest/globals';
import {
  isFoundryExport,
  mergeFoundryData,
  parseFoundryExport,
  toFoundryExport,
} from '../app/app/utils/foundryFormat';

// Verbatim shape of a v2 export (one item ticked, resources all present).
const V2 = {
  items: {
    data: {
      SapientPrimaryWeapon: { SapientPrimaryBlueprint: 1, built: true, mastered: true },
      Ninja: { AshChassisComponent: 1, AshHelmetComponent: 1 },
    },
  },
  resources: { Ferrite: 12345, Nanospores: 0, OrokinCell: 3 },
  settings: {
    showImages: true,
    showComponents: true,
    hideBuiltItems: false,
    hideMasteredItems: false,
    showFounderItems: false,
    pagination: { descending: false, page: 1, rowsPerPage: 24, sortBy: null, totalItems: 219 },
    missionCount: 220,
    junctionCount: 18,
    steelMissionCount: 5,
    steelJunctionCount: 2,
    intrinsicsCount: 40,
    excludedSearchTerm: null,
    excludedItems: ['AshPrime'],
  },
  version: 2,
};

// The legacy layout: seven per-category maps instead of one items.data.
const V1 = {
  primary: { data: { SapientPrimaryWeapon: { built: true, mastered: true } } },
  secondary: { data: { AcidDartPistol: { built: true } } },
  melee: { data: {} },
  warframes: { data: { Ninja: { mastered: true } } },
  companions: { data: {} },
  archwing: { data: { SupportJetPack: { SupportJetPackBlueprint: 1 } } },
  miscellaneous: { data: {} },
  resources: { Ferrite: 100 },
  settings: { missionCount: 10, excludedItems: [] },
  version: 1,
};

describe('isFoundryExport', () => {
  it('recognises both file versions', () => {
    expect(isFoundryExport(V2)).toBe(true);
    expect(isFoundryExport(V1)).toBe(true);
  });

  it('rejects anything else, including our own export', () => {
    expect(isFoundryExport(null)).toBe(false);
    expect(isFoundryExport({})).toBe(false);
    expect(isFoundryExport({ version: 2 })).toBe(false);
    expect(isFoundryExport({ watchlist: {}, vault: {}, version: 1 })).toBe(false);
  });
});

describe('parseFoundryExport — version 2', () => {
  const { data, stats } = parseFoundryExport(V2);

  it('lifts component counts out of the flag namespace', () => {
    expect(data.items.SapientPrimaryWeapon).toEqual({
      built: true,
      mastered: true,
      comp: { SapientPrimaryBlueprint: 1 },
    });
    expect(data.items.Ninja).toEqual({
      comp: { AshChassisComponent: 1, AshHelmetComponent: 1 },
    });
  });

  it('keeps only non-zero resource counts', () => {
    expect(data.resources).toEqual({ Ferrite: 12345, OrokinCell: 3 });
  });

  it('maps their settings counters onto ours', () => {
    expect(data.counters).toEqual({
      missions: 220,
      junctions: 18,
      steelMissions: 5,
      steelJunctions: 2,
      intrinsics: 40,
    });
  });

  it('carries the exclusion list across', () => {
    expect(data.excluded).toEqual(['AshPrime']);
  });

  it('reports what it understood', () => {
    expect(stats).toMatchObject({
      version: 2,
      items: 2,
      built: 1,
      mastered: 1,
      components: 3,
      resources: 2,
      excluded: 1,
    });
  });
});

describe('parseFoundryExport — version 1', () => {
  it('merges the seven category maps into one', () => {
    const { data, stats } = parseFoundryExport(V1);
    expect(Object.keys(data.items).sort()).toEqual([
      'AcidDartPistol',
      'Ninja',
      'SapientPrimaryWeapon',
      'SupportJetPack',
    ]);
    expect(stats.version).toBe(1);
  });

  it('keeps a record that has only partial component progress', () => {
    const { data } = parseFoundryExport({
      ...V1,
      archwing: { data: { SupportJetPack: { SupportJetPackBlueprint: 2 } } },
    });
    expect(data.items.SupportJetPack).toEqual({ comp: { SupportJetPackBlueprint: 2 } });
  });
});

describe('parseFoundryExport — hostile / malformed input', () => {
  it('never throws and reports nothing understood', () => {
    for (const junk of [null, undefined, 42, 'nope', [], {}]) {
      const { data, stats } = parseFoundryExport(junk as any);
      expect(stats.items).toBe(0);
      expect(data.items).toEqual({});
    }
  });

  it('drops keys that are not uniqueKeys and records with nothing ticked', () => {
    const { data } = parseFoundryExport({
      version: 2,
      items: {
        data: {
          'Bad Key!': { built: true },
          '../etc/passwd': { built: true },
          Empty: {},
          Ok: { built: true },
        },
      },
    });
    expect(Object.keys(data.items)).toEqual(['Ok']);
  });

  it('coerces junk counts rather than trusting them', () => {
    const { data } = parseFoundryExport({
      version: 2,
      items: { data: { Ninja: { AshHelmetComponent: '2', Bad: -5, Worse: 'x' } } },
    });
    expect(data.items.Ninja.comp).toEqual({ AshHelmetComponent: 2 });
  });
});

describe('toFoundryExport', () => {
  it('writes the exact v2 shape their importer expects', () => {
    const out = toFoundryExport({
      items: {
        SapientPrimaryWeapon: { built: true, mastered: true, comp: { SapientPrimaryBlueprint: 1 } },
      },
      resources: { Ferrite: 900 },
      counters: { missions: 220, junctions: 18 },
      excluded: ['AshPrime'],
    });
    expect(out.version).toBe(2);
    // Component counts go back to being siblings of the flags.
    expect(out.items.data.SapientPrimaryWeapon).toEqual({
      SapientPrimaryBlueprint: 1,
      built: true,
      mastered: true,
    });
    expect(out.settings.missionCount).toBe(220);
    expect(out.settings.junctionCount).toBe(18);
    expect(out.settings.excludedItems).toEqual(['AshPrime']);
    // Their UI reads these cosmetic keys; sending defaults keeps it consistent.
    expect(out.settings).toHaveProperty('pagination.rowsPerPage', 24);
  });

  it('writes every catalogue resource key, zeros included, like they do', () => {
    const out = toFoundryExport(
      { items: {}, resources: { Ferrite: 900 }, counters: {}, excluded: [] },
      { resourceKeys: ['Ferrite', 'Nanospores', 'OrokinCell'] }
    );
    expect(out.resources).toEqual({ Ferrite: 900, Nanospores: 0, OrokinCell: 0 });
  });

  it('keeps a resource the catalogue does not know about', () => {
    const out = toFoundryExport(
      { items: {}, resources: { SomeNewThing: 5 }, counters: {}, excluded: [] },
      { resourceKeys: ['Ferrite'] }
    );
    expect(out.resources).toEqual({ Ferrite: 0, SomeNewThing: 5 });
  });

  it('omits items with nothing ticked, matching their exporter', () => {
    const out = toFoundryExport({
      items: { Nothing: {}, Ninja: { built: true } },
      resources: {},
      counters: {},
      excluded: [],
    });
    expect(Object.keys(out.items.data)).toEqual(['Ninja']);
  });

  it('survives an empty / missing payload', () => {
    expect(toFoundryExport(null).items.data).toEqual({});
    expect(toFoundryExport(undefined).version).toBe(2);
  });
});

describe('round trip', () => {
  it('parse -> export -> parse is stable', () => {
    const once = parseFoundryExport(V2).data;
    const file = toFoundryExport(once, { resourceKeys: ['Ferrite', 'Nanospores', 'OrokinCell'] });
    const twice = parseFoundryExport(file).data;
    expect(twice.items).toEqual(once.items);
    expect(twice.resources).toEqual(once.resources);
    expect(twice.counters).toEqual(once.counters);
    expect(twice.excluded).toEqual(once.excluded);
  });
});

describe('mergeFoundryData', () => {
  it('takes the higher value everywhere — an import never loses a tick', () => {
    const a = {
      items: { Ninja: { built: true, comp: { AshHelmetComponent: 1 } } },
      resources: { Ferrite: 100 },
      counters: { missions: 200 },
      excluded: ['X'],
    };
    const b = {
      items: { Ninja: { mastered: true, comp: { AshHelmetComponent: 3 } }, AshPrime: { built: true } },
      resources: { Ferrite: 50, Rubedo: 10 },
      counters: { missions: 100, junctions: 18 },
      excluded: ['Y'],
    };
    const merged = mergeFoundryData(a, b);
    expect(merged.items.Ninja).toEqual({
      built: true,
      mastered: true,
      comp: { AshHelmetComponent: 3 },
    });
    expect(merged.items.AshPrime).toEqual({ built: true });
    expect(merged.resources).toEqual({ Ferrite: 100, Rubedo: 10 });
    expect(merged.counters).toEqual({ missions: 200, junctions: 18 });
    expect(merged.excluded.sort()).toEqual(['X', 'Y']);
  });

  it('is idempotent', () => {
    const a = {
      items: { Ninja: { mastered: true } },
      resources: { Ferrite: 5 },
      counters: { missions: 3 },
      excluded: ['X'],
    };
    const once = mergeFoundryData(a, a);
    const twice = mergeFoundryData(once, a);
    expect(twice.items).toEqual(once.items);
    expect(twice.resources).toEqual(once.resources);
  });
});
