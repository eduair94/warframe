/**
 * Baked, hand-authored "how to get here" notes for the /mission pages. WFCD gives
 * reward tables and node facts; official guides and update notes supply the
 * unlock paths and access context. These fill that gap. English only
 * — page-body strings have no i18n parity gate.
 *
 * Resolution order: exact slug match, then a (planet, gameMode) pattern match, so
 * e.g. every Duviri "Hard" Undercroft tier shares the Steel Path Circuit note.
 */
export interface MissionNote {
  category: 'node' | 'circuit' | 'onslaught' | 'index' | 'proxima'
  /** "How to get here" prose — unlock path / prerequisites. */
  access: string
  tips?: string[]
  related?: { label: string; to: string }[]
}

/** Exact-slug notes (highest priority). */
// Duviri access and reward paths reviewed 2026-10-25 against:
// https://www.warframe.com/en/guides/quests/the-duviri-paradox
// https://www.warframe.com/en/patch-notes/pc/33-0-0
const BY_SLUG: Record<string, MissionNote> = {
  'duviri-the-circuit': {
    category: 'circuit',
    access:
      'Select The Circuit from Duviri in Navigation after completing The Duviri Paradox quest, ' +
      'unlocked through the Uranus Junction on Saturn. Choose your weekly reward path before ' +
      'entering, then select equipment in Teshin’s Cave. The normal Circuit offers a Warframe ' +
      'blueprint track; Steel Path has a separate Incarnon Genesis reward track.',
    tips: [
      'Choose one of the three weekly Warframes before starting the normal reward track. This choice is separate from the equipment offered for your run.',
      'Normal Circuit does not require Steel Path. Consult the rotation page below before confirming your weekly reward choice.',
    ],
    related: [
      { label: 'This week’s Circuit & Incarnon rotation', to: '/circuit' },
      { label: 'Duviri guide', to: '/guides/duviri' },
    ],
  },
}

/** (planet, gameMode) pattern notes — matched when no exact slug note exists. */
// Duviri Steel Path: official completion PSA, current base unlock and Armor changes:
// https://forums.warframe.com/topic/1360110-unlocking-duviri-steel-path-post-hotfix/
// https://www.warframe.com/en/patch-notes/pc/38-5-3
// https://www.warframe.com/en/patch-notes/pc/36-0-0
const BY_PATTERN: { planet: string; gameMode: string; note: MissionNote }[] = [
  {
    planet: 'Duviri',
    gameMode: 'Hard',
    note: {
      category: 'circuit',
      access:
        'This reward tier belongs to the Steel Path Circuit. Unlock the base Steel Path through the ' +
        'required pre-New War Star Chart missions and Teshin in a Relay. Then complete The Duviri ' +
        'Paradox, extract after at least one normal Circuit stage, and defeat the Orowyrm and extract ' +
        'from normal Lone Story. The quest records the Duviri Experience node as complete. Circuit ' +
        'enemies use Steel Path level, health and shield modifiers; Steel Path no longer adds an Armor ' +
        'multiplier. Past Tier 10, further progress draws from the repeated reward pool.',
      tips: [
        'Tier 9 awards 25 Steel Essence; Circuit stages do not each award Steel Essence, and Acolytes do not spawn here.',
        'Select two Incarnon Genesis adapters from the five offered that week. The first choice is earned at Tier 5 and the second at Tier 10.',
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
        'This is a normal Circuit reward tier. Complete The Duviri Paradox quest, then select The ' +
        'Circuit from Duviri in Navigation. Its main weekly track offers your chosen Warframe’s ' +
        'blueprints. Beyond Tier 10, repeated rewards are Credits or Endo; compare that extra ' +
        'progress with other farms once you have reached your weekly goal.',
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

