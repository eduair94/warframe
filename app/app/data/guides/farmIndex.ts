// Curated "what do you want to farm?" index — maps a specific item, resource,
// currency or progression target to the guide (and section) that explains how to
// farm it. This is the data behind the item-type search on /guides/farming.
//
// Deliberately hand-curated (a few dozen high-intent targets) rather than a full
// drop-table dump — every entry deep-links to a real guide section that exists.
// The full item-level drop-data search is a separate, later phase (see
// FARM_DATASET_TODO at the bottom).
//
// Keep routes pointing at anchors that actually exist in the target guide's
// sections (see each guide's section ids). Aliases power fuzzy matching.

export type FarmKind = 'resource' | 'currency' | 'gear' | 'mod' | 'progression' | 'reputation'

export interface FarmTarget {
  /** Canonical display name of the thing you want to farm. */
  name: string
  /** Alternate spellings / plurals / related search terms. */
  aliases?: string[]
  kind: FarmKind
  /** Guide slug the answer lives in. */
  guide: string
  /** Route (with #anchor where a matching section exists). */
  route: string
  /** One-line where/how hint shown in the result card. */
  hint: string
  /** mdi icon name (without the leading `mdi-`). */
  icon: string
}

export const FARM_KIND_LABEL: Record<FarmKind, string> = {
  resource: 'Resource',
  currency: 'Currency',
  gear: 'Gear & Parts',
  mod: 'Mods',
  progression: 'Progression',
  reputation: 'Standing',
}

export const FARM_TARGETS: FarmTarget[] = [
  // ── Currencies ──────────────────────────────────────────────────────
  { name: 'Credits', aliases: ['credit', 'money', 'cash', 'hollars'], kind: 'currency', guide: 'credits', route: '/guides/credits#hollvania', hint: 'Höllvania Techrot safes (Chroma), the Index, Profit-Taker.', icon: 'mdi-circle-multiple-outline' },
  { name: 'Platinum', aliases: ['plat', 'premium currency'], kind: 'currency', guide: 'platinum', route: '/guides/platinum#what-sells', hint: 'Free-to-play: sell prime parts, mods and rivens.', icon: 'mdi-cash-multiple' },
  { name: 'Endo', aliases: ['ayatan', 'ayatan sculpture', 'ayatan star', 'mod upgrade currency'], kind: 'currency', guide: 'endo', route: '/guides/endo#best-farms', hint: 'Arbitrations, Ayatan sculptures, 1999 & Sedna arena; no booster affects Endo.', icon: 'mdi-hexagon-multiple-outline' },
  { name: 'Ducats', aliases: ['ducat', 'orokin ducats', 'baro currency', 'prime junk'], kind: 'currency', guide: 'relics', route: '/guides/relics#cash-out', hint: 'Sell unwanted prime parts to Baro for ducats.', icon: 'mdi-store' },
  { name: 'Focus', aliases: ['focus points', 'operator xp', 'focus school'], kind: 'currency', guide: 'focus', route: '/guides/focus#best-farms', hint: 'Lens a levelling weapon; ESO and Onslaught are the fast farms.', icon: 'mdi-eye-outline' },
  { name: 'Kuva', aliases: ['riven reroll', 'kuva fuel', 'lich currency'], kind: 'currency', guide: 'kuva', route: '/guides/kuva#core-farms', hint: 'Kuva Survival and Siphon/Flood missions on the Kuva Fortress.', icon: 'mdi-water-outline' },
  { name: 'Standing', aliases: ['reputation', 'rep', 'syndicate standing', 'faction rep'], kind: 'reputation', guide: 'standing', route: '/guides/standing#earning-main', hint: 'Cap daily standing per syndicate with medallions and tokens.', icon: 'mdi-handshake-outline' },
  { name: 'Steel Essence', aliases: ['essence', 'steel path currency', 'kuya'], kind: 'currency', guide: 'steel-path', route: '/guides/steel-path', hint: 'Acolyte drops and resource caches on the Steel Path.', icon: 'mdi-fire' },

  // ── Staple resources ────────────────────────────────────────────────
  { name: 'Orokin Cells', aliases: ['orokin cell', 'cells'], kind: 'resource', guide: 'resources', route: '/guides/resources#staples', hint: 'Saturn (Helene), Deimos and Orb Vallis; boss Kela De Thaym.', icon: 'mdi-hexagon-outline' },
  { name: 'Neurodes', aliases: ['neurode', 'sensor'], kind: 'resource', guide: 'resources', route: '/guides/resources#staples', hint: 'Deimos, Lua and Eris; Orb Vallis caches are reliable.', icon: 'mdi-sine-wave' },
  { name: 'Neural Sensors', aliases: ['neural sensor'], kind: 'resource', guide: 'resources', route: '/guides/resources#staples', hint: 'Jupiter (Io) and the Kuva Fortress.', icon: 'mdi-chip' },
  { name: 'Plastids', aliases: ['plastid'], kind: 'resource', guide: 'resources', route: '/guides/resources#staples', hint: 'Saturn, Uranus and Orb Vallis.', icon: 'mdi-cube-outline' },
  { name: 'Rubedo', aliases: [], kind: 'resource', guide: 'resources', route: '/guides/resources#staples', hint: 'Pluto, Earth and Orb Vallis.', icon: 'mdi-cube-outline' },
  { name: 'Argon Crystals', aliases: ['argon', 'argon crystal', 'decaying resource'], kind: 'resource', guide: 'resources', route: '/guides/resources#argon', hint: 'Void only, and it decays in ~24h — farm right before you build.', icon: 'mdi-diamond-outline' },
  { name: 'Tellurium', aliases: [], kind: 'resource', guide: 'resources', route: '/guides/resources#awkward-ones', hint: 'Archwing missions, Grineer Sealab, and Railjack wreckage.', icon: 'mdi-atom-variant' },
  { name: 'Oxium', aliases: ['oxium osprey'], kind: 'resource', guide: 'resources', route: '/guides/resources#awkward-ones', hint: 'Kill Oxium Ospreys before they self-destruct (Io, Outer Terminus).', icon: 'mdi-quadcopter' },
  { name: 'Nitain Extract', aliases: ['nitain'], kind: 'resource', guide: 'resources', route: '/guides/resources#awkward-ones', hint: 'Nightwave cred offerings, sabotage caches and alerts.', icon: 'mdi-flask-outline' },
  { name: 'Cryotic', aliases: ['cryotic'], kind: 'resource', guide: 'resources', route: '/guides/resources#cheat-sheet', hint: 'Any Excavation mission — the more excavators, the more cryotic.', icon: 'mdi-snowflake' },
  { name: 'Common resources', aliases: ['ferrite', 'alloy plate', 'salvage', 'nano spores', 'polymer bundle', 'circuits', 'gallium', 'morphics', 'control module', 'detonite', 'fieldron', 'mutagen'], kind: 'resource', guide: 'resources', route: '/guides/resources#cheat-sheet', hint: 'Use the resource cheat-sheet table for the best node per material.', icon: 'mdi-cube-scan' },

  // ── Gear, parts & progression ───────────────────────────────────────
  { name: 'Prime parts', aliases: ['prime', 'prime warframe', 'prime weapon', 'prime set', 'relic rewards'], kind: 'gear', guide: 'relics', route: '/guides/relics#relic-basics', hint: 'Crack the right Void Relics at fissures; refine to Radiant for odds.', icon: 'mdi-diamond-stone' },
  { name: 'Warframe parts', aliases: ['warframe', 'frame parts', 'new frame', 'farm a warframe'], kind: 'gear', guide: 'beginner-warframes', route: '/guides/beginner-warframes', hint: 'Which frame to farm first and where the easy ones drop.', icon: 'mdi-robot-outline' },
  { name: 'Rivens', aliases: ['riven', 'riven mod', 'veiled riven'], kind: 'mod', guide: 'riven', route: '/guides/riven', hint: 'Sorties and Steel Path; re-roll with Kuva.', icon: 'mdi-star-four-points-outline' },
  { name: 'Arcanes', aliases: ['arcane', 'arcane enhancement'], kind: 'gear', guide: 'arcanes', route: '/guides/arcanes', hint: 'Eidolons, Profit-Taker, Deep Archimedea and the open worlds.', icon: 'mdi-shimmer' },
  { name: 'Archon Shards', aliases: ['archon shard', 'shards', 'tauforged'], kind: 'progression', guide: 'archon-shards', route: '/guides/archon-shards', hint: 'The weekly Archon Hunt — one guaranteed shard per week.', icon: 'mdi-cards-diamond-outline' },
  { name: 'Mods', aliases: ['mod', 'mod farming', 'rare mods', 'primed mods'], kind: 'mod', guide: 'mods', route: '/guides/mods', hint: 'Which mods matter, where they drop, and how to rank them.', icon: 'mdi-view-grid-plus-outline' },
  { name: 'Forma', aliases: ['forma blueprint'], kind: 'gear', guide: 'relics', route: '/guides/relics#reward-pool', hint: 'A common Void Relic reward — bank spares while cracking relics.', icon: 'mdi-vector-triangle' },
  { name: 'Eidolon Shards', aliases: ['eidolon', 'brilliant shard', 'radiant eidolon shard', 'tridolon'], kind: 'progression', guide: 'eidolon', route: '/guides/eidolon', hint: 'Hunt Eidolons at night on the Plains of Eidolon.', icon: 'mdi-weather-night' },
  { name: 'Intrinsics', aliases: ['railjack', 'intrinsic', 'command intrinsic'], kind: 'progression', guide: 'railjack', route: '/guides/railjack', hint: 'Run Railjack missions to level Intrinsics and farm wreckage.', icon: 'mdi-rocket-launch-outline' },
  { name: 'Incarnon Genesis', aliases: ['incarnon', 'duviri rewards', 'circuit'], kind: 'gear', guide: 'duviri', route: '/guides/duviri', hint: 'The weekly Duviri Circuit rotates Incarnon Adapters and frames.', icon: 'mdi-horse-variant' },
]

/** Case-insensitive substring match over name + aliases. */
export function searchFarmTargets(query: string): FarmTarget[] {
  const q = query.trim().toLowerCase()
  if (!q) return FARM_TARGETS
  return FARM_TARGETS.filter((t) => {
    const hay = (t.name + ' ' + (t.aliases ?? []).join(' ') + ' ' + t.hint).toLowerCase()
    return hay.includes(q)
  })
}

// FARM_DATASET_TODO — Phase 2 (approved as a follow-up):
// Replace/augment this curated list with a generated item-level index built from
// the WFCD drop tables (see [[relic-dropping-source]] for the getDroppingRelic
// pattern and the raw-github mirror workaround for the Cloudflare wall). Bake a
// searchable {item -> best nodes} JSON at build time and merge its hits below the
// curated ones so specific items ("Braton Prime Barrel", "Hexis medallion")
// resolve to concrete nodes. Kept separate so the curated router never breaks.
