/**
 * Baked, hand-authored "how to get here" notes for the /mission pages. WFCD gives
 * reward tables and node facts; it does NOT give unlock paths or access context,
 * which live only on the (robots-blocked) wiki. These fill that gap. English only
 * â€” page-body strings have no i18n parity gate.
 *
 * Resolution order: exact slug match, then a (planet, gameMode) pattern match, so
 * e.g. every Duviri "Hard" Undercroft tier shares the Steel Path Circuit note.
 */
export interface MissionNote {
  category: 'node' | 'circuit' | 'onslaught' | 'index' | 'proxima'
  /** "How to get here" prose â€” unlock path / prerequisites. */
  access: string
  tips?: string[]
  related?: { label: string; to: string }[]
}

/** Exact-slug notes (highest priority). */
const BY_SLUG: Record<string, MissionNote> = {
  'duviri-the-circuit': {
    category: 'circuit',
    access:
      'The Circuit is an endless, Warframe-only mode inside Duviri’s Undercroft, reached from the ' +
      'Duviri landscape via Undercroft Portals. It unlocks after completing The Duviri Paradox quest. ' +
      'You pick from 3 offered Warframes and battle an endless chain of Undercroft missions; a weekly ' +
      'Tier ladder (resets Monday 00:00 UTC) pays Warframe parts and, at Tiers 5 and 10, an Incarnon ' +
      'Genesis adapter you choose.',
    tips: [
      'Normal Circuit rewards Warframe component blueprints on a 12-week rotation.',
      'You do not need Steel Path for normal Circuit â€” only the Duviri Paradox quest.',
    ],
    related: [
      { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
      { label: 'Duviri guide', to: '/guides/duviri' },
    ],
  },
}

/** (planet, gameMode) pattern notes â€” matched when no exact slug note exists. */
const BY_PATTERN: { planet: string; gameMode: string; note: MissionNote }[] = [
  {
    planet: 'Duviri',
    gameMode: 'Hard',
    note: {
      category: 'circuit',
      access:
        'This is the Steel Path Circuit (the Undercroft at full Steel Path scaling: +100 enemy levels, ' +
        '250% health/shield/armor). To access it you need the base Steel Path unlock â€” all pre-New War ' +
        'star-chart nodes cleared, then talk to Teshin â€” PLUS The Duviri Paradox quest and the three base ' +
        'Duviri nodes cleared in normal mode. Past Tier 10 you reach Tier 11+, and every additional 1,400 ' +
        'Circuit progress re-rolls the "Repeated Rewards" pool â€” the Steel Path arcanes shown below.',
      tips: [
        'Tier 9 (Hard) awards 25Ã— Steel Essence.',
        'Steel Path Circuit runs a separate 9-week Incarnon Genesis rotation (5 weapons/week).',
      ],
      related: [
        { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
        { label: 'Steel Path guide', to: '/guides/steel-path' },
        { label: 'Duviri guide', to: '/guides/duviri' },
      ],
    },
  },
  {
    planet: 'Duviri',
    gameMode: 'Normal',
    note: {
      category: 'circuit',
      access:
        'A normal-mode Duviri Undercroft tier, reached via The Circuit after completing The Duviri ' +
        'Paradox quest. The "Repeated Rewards" (normal) pool is near-worthless (Credits / Endo); the ' +
        'valuable Circuit farm is the Steel Path (Hard) tiers.',
      related: [
        { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
        { label: 'Duviri guide', to: '/guides/duviri' },
      ],
    },
  },
  {
    planet: 'Sanctuary',
    gameMode: '',
    note: {
      category: 'onslaught',
      access:
        'Sanctuary Onslaught (and Elite Sanctuary Onslaught) is Cephalon Simaris’s endless efficiency ' +
        'gauntlet, entered from the Simaris terminal in any Relay. Elite requires Mastery Rank 5+. Keep ' +
        'the Efficiency gauge up by killing quickly and moving through the conduits.',
      related: [{ label: 'Relic value board', to: '/relics-value' }],
    },
  },
  {
    planet: 'Veil Proxima',
    gameMode: '',
    note: {
      category: 'proxima',
      access:
        'A Railjack (Empyrean) region. Reached with a Railjack from the Dry Dock in your Clan Dojo or on ' +
        'the Plexus, after the Rising Tide quest. Proxima enemy levels scale with the region, not a fixed ' +
        'star-chart node.',
    },
  },
]

/** Resolve the best note for a mission page, or null. */
export function missionNote(slug: string, gameMode: string, planet: string): MissionNote | null {
  if (BY_SLUG[slug]) return BY_SLUG[slug]
  for (const p of BY_PATTERN) {
    if (p.planet === planet && (p.gameMode === '' || p.gameMode === gameMode)) return p.note
  }
  return null
}

