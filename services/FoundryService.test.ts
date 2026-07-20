import { describe, it, expect } from '@jest/globals';
import {
  FoundryService,
  masteryPointsFor,
  rankForPoints,
  rankThresholds,
  uniqueKeyOf,
} from './FoundryService';

/**
 * Fixtures mirror the real WFCD `warframe-items` shape: an item's `components`
 * array mixes CRAFTED PARTS (`/Lotus/Types/Recipes/...`) with RAW RESOURCES
 * (`/Lotus/Types/Items/...`) — telling those apart is the whole job of the
 * classifier, because parts get a tick box and resources get a "how many do I
 * still need" row.
 */
const warframes = [
  {
    uniqueName: '/Lotus/Powersuits/Ninja/Ninja',
    name: 'Ash',
    masteryReq: 0,
    imageName: 'ash.png',
    components: [
      { uniqueName: '/Lotus/Types/Recipes/WarframeRecipes/AshBlueprint', name: 'Blueprint', itemCount: 1 },
      { uniqueName: '/Lotus/Types/Recipes/WarframeRecipes/AshChassisComponent', name: 'Chassis', itemCount: 1 },
      { uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCell', name: 'Orokin Cell', itemCount: 5 },
    ],
  },
  {
    uniqueName: '/Lotus/Powersuits/Excalibur/ExcaliburPrime',
    name: 'Excalibur Prime',
    masteryReq: 0,
    components: [],
  },
  // No masteryReq -> not masterable gear, must be skipped entirely.
  { uniqueName: '/Lotus/Powersuits/Junk/Junk', name: 'Junk', components: [] },
];

const primary = [
  {
    uniqueName: '/Lotus/Weapons/Tenno/LongGuns/SapientPrimary/SapientPrimaryWeapon',
    name: 'Acceltra',
    masteryReq: 9,
    vaulted: false,
    components: [
      { uniqueName: '/Lotus/Types/Recipes/Weapons/SapientPrimaryBlueprint', name: 'Blueprint', itemCount: 1 },
      { uniqueName: '/Lotus/Types/Items/MiscItems/Nanospores', name: 'Nano Spores', itemCount: 8000 },
      { uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCell', name: 'Orokin Cell', itemCount: 2 },
    ],
  },
  {
    uniqueName: '/Lotus/Weapons/Grineer/LongGuns/KuvaKarak/KuvaKarakWeapon',
    name: 'Kuva Karak',
    masteryReq: 10,
    components: [],
  },
];

const misc = [
  // Only modular parts count; Exalted weapons come free with a frame.
  {
    uniqueName: '/Lotus/Weapons/Ostron/Amp/AmpPrismA',
    name: 'Raplak Prism',
    masteryReq: 0,
    type: 'Amp',
    components: [],
  },
  {
    uniqueName: '/Lotus/Powersuits/Excalibur/ExaltedBlade',
    name: 'Exalted Blade',
    masteryReq: 0,
    type: 'Exalted Weapon',
    components: [],
  },
];

const resourcesFile = [
  { uniqueName: '/Lotus/Types/Items/MiscItems/OrokinCell', name: 'Orokin Cell' },
  { uniqueName: '/Lotus/Types/Items/MiscItems/Nanospores', name: 'Nano Spores' },
];

function build(marketByName: Record<string, string> = {}) {
  return FoundryService.buildCatalogue(
    { Warframes: warframes, Primary: primary, Misc: misc },
    resourcesFile,
    marketByName
  );
}

describe('uniqueKeyOf', () => {
  it('is the last path segment — the key warframe-foundry.app exports', () => {
    expect(uniqueKeyOf('/Lotus/Powersuits/Ninja/Ninja')).toBe('Ninja');
    expect(uniqueKeyOf('/Lotus/Weapons/Tenno/LongGuns/SapientPrimary/SapientPrimaryWeapon')).toBe(
      'SapientPrimaryWeapon'
    );
    expect(uniqueKeyOf('/Lotus/Types/Items/MiscItems/Ferrite')).toBe('Ferrite');
  });

  it('is empty for junk', () => {
    expect(uniqueKeyOf('')).toBe('');
    expect(uniqueKeyOf(null as any)).toBe('');
    expect(uniqueKeyOf('/')).toBe('');
  });
});

describe('masteryPointsFor', () => {
  it('gives warframes and companions double a weapon', () => {
    expect(masteryPointsFor('Ash', 'warframes')).toBe(6000);
    expect(masteryPointsFor('Carrier', 'companions')).toBe(6000);
    expect(masteryPointsFor('Acceltra', 'primary')).toBe(3000);
  });

  it('gives Kuva / Tenet / Coda weapons 4000', () => {
    expect(masteryPointsFor('Kuva Karak', 'primary')).toBe(4000);
    expect(masteryPointsFor('Tenet Envoy', 'primary')).toBe(4000);
    expect(masteryPointsFor('Coda Motovore', 'melee')).toBe(4000);
    // The prefix must be a whole word — "Kuvamander" is not a Kuva weapon.
    expect(masteryPointsFor('Kuvamander', 'primary')).toBe(3000);
  });

  it('lets an explicit value win', () => {
    expect(masteryPointsFor('Anything', 'primary', 12_345)).toBe(12_345);
  });
});

describe('rank maths', () => {
  it('follows the 2500 x rank^2 curve to 30, then flat Legendary steps', () => {
    const t = rankThresholds();
    expect(t[0]).toBe(0);
    expect(t[10]).toBe(250_000);
    expect(t[30]).toBe(2_250_000);
    expect(t[34]).toBe(2_840_000);
  });

  it('resolves a point total to the rank actually reached', () => {
    expect(rankForPoints(0)).toBe(0);
    expect(rankForPoints(2499)).toBe(0);
    expect(rankForPoints(2500)).toBe(1);
    expect(rankForPoints(2_250_000)).toBe(30);
    expect(rankForPoints(99_999_999)).toBe(34);
  });
});

describe('buildCatalogue', () => {
  it('buckets items and skips anything without a mastery requirement', () => {
    const built = build();
    expect(built.counts.warframes).toBe(2); // Ash + Excalibur Prime; "Junk" skipped
    expect(built.counts.primary).toBe(2);
    expect(built.items.find((i) => i.name === 'Junk')).toBeUndefined();
  });

  it('keeps only modular parts out of the Misc grab-bag', () => {
    const built = build();
    expect(built.items.find((i) => i.name === 'Raplak Prism')).toBeTruthy();
    // Exalted weapons come with their frame — they are not a build target.
    expect(built.items.find((i) => i.name === 'Exalted Blade')).toBeUndefined();
    expect(built.counts.miscellaneous).toBe(1);
  });

  it('separates crafted parts from raw resources', () => {
    const ash = build().items.find((i) => i.uniqueKey === 'Ninja')!;
    const byKey = Object.fromEntries(ash.components.map((c) => [c.uniqueKey, c]));
    expect(byKey.AshBlueprint.resource).toBeUndefined();
    expect(byKey.AshChassisComponent.resource).toBeUndefined();
    expect(byKey.OrokinCell.resource).toBe(true);
    expect(byKey.OrokinCell.itemCount).toBe(5);
  });

  it('aggregates resource demand across every item and category', () => {
    const built = build();
    const cell = built.resources.find((r) => r.uniqueKey === 'OrokinCell')!;
    // 5 for Ash (warframes) + 2 for Acceltra (primary)
    expect(cell.total).toBe(7);
    expect(cell.perCategory.warframes).toBe(5);
    expect(cell.perCategory.primary).toBe(2);
    expect(cell.perCategory.melee).toBe(0);
  });

  it('sorts resources by total demand, biggest first', () => {
    const built = build();
    expect(built.resources[0].uniqueKey).toBe('Nanospores'); // 8000 vs 7
  });

  it('flags founder-only gear so it can be hidden', () => {
    const built = build();
    expect(built.items.find((i) => i.name === 'Excalibur Prime')!.founderOnly).toBe(true);
    expect(built.items.find((i) => i.name === 'Ash')!.founderOnly).toBeUndefined();
  });

  it('links items to warframe.market, preferring the tradable SET', () => {
    const built = build({
      'ash prime set': 'ash_prime_set',
      acceltra: 'acceltra',
      'acceltra blueprint': 'acceltra_blueprint',
    });
    // Acceltra itself is listed under its own name (not a prime set).
    expect(built.items.find((i) => i.uniqueKey === 'SapientPrimaryWeapon')!.market).toBe('acceltra');
    expect(built.items.find((i) => i.uniqueKey === 'Ninja')!.market).toBeUndefined();
  });

  it('links a component under "<Item> <Part>", the way the market lists parts', () => {
    const built = build({ 'ash chassis': 'ash_chassis' });
    const ash = built.items.find((i) => i.uniqueKey === 'Ninja')!;
    expect(ash.components.find((c) => c.uniqueKey === 'AshChassisComponent')!.market).toBe(
      'ash_chassis'
    );
  });

  it('totals the mastery available and reports meta', () => {
    const built = build();
    // Ash 6000 + Excalibur Prime 6000 + Acceltra 3000 + Kuva Karak 4000 + Raplak 3000
    expect(built.meta.maxItemPoints).toBe(22_000);
    expect(built.meta.total).toBe(5);
    expect(built.meta.resourceCount).toBe(2);
    expect(typeof built.meta.updatedAt).toBe('string');
  });

  it('never emits the same uniqueKey twice', () => {
    const built = FoundryService.buildCatalogue(
      { Warframes: warframes, Primary: warframes as any },
      resourcesFile
    );
    const keys = built.items.map((i) => i.uniqueKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('tolerates missing files and malformed rows', () => {
    const built = FoundryService.buildCatalogue(
      { Warframes: [null, 42, { name: 'x' }] as any, Primary: undefined as any },
      []
    );
    expect(built.items).toEqual([]);
    expect(built.resources).toEqual([]);
    expect(built.meta.total).toBe(0);
  });
});
