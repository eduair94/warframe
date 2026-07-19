// Registry of every knowledge-center guide: the lightweight metadata the hub
// (/guides), the nav and the SEO map need, WITHOUT importing each guide's full
// content object. `route` is where the page lives (all under /guides/<slug>).
// The heavy content objects live in ./<slug>.ts and are loaded only by the
// individual guide pages.
import { KNOWLEDGE_CATEGORIES } from './types'
export { KNOWLEDGE_CATEGORIES }

export interface GuideMeta {
  slug: string
  route: string
  title: string
  blurb: string
  category: string
  icon: string
  readMins: number
  /** Marks the handful of highest-traffic "start here" guides. */
  featured?: boolean
}

export const GUIDES_INDEX: GuideMeta[] = [
  // ── Getting Started ──────────────────────────────────────────────────
  { slug: 'new-player', route: '/guides/new-player', title: 'Complete New Player Guide', blurb: 'Your first 100 hours: what to do, what to ignore, and when the game opens up.', category: 'start', icon: 'mdi-flag-checkered', readMins: 12, featured: true },
  { slug: 'beginner-warframes', route: '/guides/beginner-warframes', title: 'Best Beginner Warframes', blurb: 'Which starter to pick, which frame to farm first, and where the easy ones drop.', category: 'start', icon: 'mdi-robot-outline', readMins: 8, featured: true },
  { slug: 'progression', route: '/guides/progression', title: 'Progression Roadmap', blurb: 'Star chart, Junctions and Mastery — the "what should I do now?" checklist.', category: 'start', icon: 'mdi-map-marker-path', readMins: 10 },
  { slug: 'mastery-rank', route: '/guides/mastery-rank', title: 'Mastery Rank & Fast Leveling', blurb: 'What MR unlocks, how affinity works, and the fastest ways to level.', category: 'start', icon: 'mdi-chevron-triple-up', readMins: 8 },
  { slug: 'quests', route: '/guides/quests', title: 'Quest & Story Order', blurb: 'The recommended order to play the story quests, spoiler-light.', category: 'start', icon: 'mdi-book-open-page-variant-outline', readMins: 7 },

  // ── Farming & Resources ─────────────────────────────────────────────
  { slug: 'platinum', route: '/guides/platinum', title: 'How to Make Platinum (F2P)', blurb: 'Earn platinum without paying — what sells, how to trade, and how to price it.', category: 'farming', icon: 'mdi-cash-multiple', readMins: 11, featured: true },
  { slug: 'credits', route: '/guides/credits', title: 'Credit Farming', blurb: 'The best 2026 credit farms — Höllvania safes, the Index, Profit-Taker — plus what got nerfed.', category: 'farming', icon: 'mdi-circle-multiple-outline', readMins: 13 },
  { slug: 'endo', route: '/guides/endo', title: 'Endo Farming', blurb: 'Every un-nerfed way to farm Endo in 2026 — Arbitrations, Ayatan sculptures, 1999 & Sedna, plus the free Endo hiding in your mods.', category: 'farming', icon: 'mdi-hexagon-multiple-outline', readMins: 11 },
  { slug: 'focus', route: '/guides/focus', title: 'Focus Farming', blurb: 'Unlock the Operator, pick a school and farm Focus efficiently.', category: 'farming', icon: 'mdi-eye-outline', readMins: 8 },
  { slug: 'kuva', route: '/guides/kuva', title: 'Kuva Farming', blurb: 'Fuel for riven re-rolls and Kuva weapons — the best farms and rates.', category: 'farming', icon: 'mdi-water-outline', readMins: 7 },
  { slug: 'relics', route: '/guides/relics', title: 'Relics & Void Traces', blurb: 'Crack relics, refine with traces, and run efficient fissure squads.', category: 'farming', icon: 'mdi-diamond-stone', readMins: 9 },
  { slug: 'forma', route: '/guides/forma', title: 'Forma Farming', blurb: 'Cracked relics and got zero Forma? Run them right, plus every non-relic source — Nightwave, Sorties, the Market and Plague Star.', category: 'farming', icon: 'mdi-vector-triangle', readMins: 10 },
  { slug: 'resources', route: '/guides/resources', title: 'Resource Farming Reference', blurb: 'Where to farm Orokin Cells, Neurodes, Argon, Tellurium, Nitain and more.', category: 'farming', icon: 'mdi-cube-scan', readMins: 9 },
  { slug: 'standing', route: '/guides/standing', title: 'Standing & Syndicates', blurb: 'Cap your daily standing across every syndicate and open-world faction.', category: 'farming', icon: 'mdi-handshake-outline', readMins: 8 },

  // ── Systems & Builds ────────────────────────────────────────────────
  { slug: 'mods', route: '/guides/mods', title: 'Essential Mods & Survivability', blurb: 'How modding works, the must-have mods, and shield-gating to stop dying.', category: 'systems', icon: 'mdi-cog-outline', readMins: 11, featured: true },
  { slug: 'builds', route: '/guides/builds', title: 'Best Builds & Build Planners', blurb: 'Find, copy and pressure-test builds with Overframe & Underframe — and read them critically.', category: 'systems', icon: 'mdi-hammer-screwdriver', readMins: 12, featured: true },
  { slug: 'helminth', route: '/guides/helminth', title: 'Helminth & Subsumes', blurb: 'Unlock Helminth, subsume abilities and the best powers to graft on.', category: 'systems', icon: 'mdi-dna', readMins: 9 },
  { slug: 'arcanes', route: '/guides/arcanes', title: 'Arcanes Guide', blurb: 'What arcanes do, where they drop, and the staples worth farming.', category: 'systems', icon: 'mdi-shimmer', readMins: 8 },
  { slug: 'riven', route: '/guides/riven', title: 'Riven Mods Explained', blurb: 'Disposition, rolling, grading and why bad rivens are cheap Endo.', category: 'systems', icon: 'mdi-star-four-points-outline', readMins: 9 },

  // ── Endgame ─────────────────────────────────────────────────────────
  { slug: 'steel-path', route: '/guides/steel-path', title: 'Steel Path & Steel Essence', blurb: 'Unlock the hard mode, survive it, and farm Steel Essence for the good stuff.', category: 'endgame', icon: 'mdi-fire', readMins: 9 },
  { slug: 'eidolon', route: '/guides/eidolon', title: 'Eidolon Hunting', blurb: 'Amps, the meta comp and how to go from solo Teralyst to full Tridolon.', category: 'endgame', icon: 'mdi-weather-night', readMins: 10 },
  { slug: 'railjack', route: '/guides/railjack', title: 'Railjack Guide', blurb: 'Get your ship, level Intrinsics and turn space combat into a farm.', category: 'endgame', icon: 'mdi-rocket-launch-outline', readMins: 9 },
  { slug: 'duviri', route: '/guides/duviri', title: 'The Duviri Paradox', blurb: 'The roguelike Circuit, Decrees and weekly frame/incarnon rewards.', category: 'endgame', icon: 'mdi-horse-variant', readMins: 8 },
  { slug: 'archon-shards', route: '/guides/archon-shards', title: 'Archon Shards', blurb: 'Permanent stat boosts, the weekly Archon Hunt and how to prioritize.', category: 'endgame', icon: 'mdi-cards-diamond-outline', readMins: 7 },

  // ── Reference ───────────────────────────────────────────────────────
  { slug: 'tier-list', route: '/guides/tier-list', title: 'Warframe Tier List — How to Read It', blurb: 'Why tier lists disagree, what "good" means per activity, and who to trust.', category: 'reference', icon: 'mdi-format-list-numbered', readMins: 7 },
]

export function guidesByCategory(cat: string): GuideMeta[] {
  return GUIDES_INDEX.filter((g) => g.category === cat)
}
