// Per-route SEO copy (unique <title> + meta description for every page).
// Consumed once in layouts/default.vue via useSeoMeta so all pages get
// keyword-rich, non-duplicate titles/descriptions without editing 20+ files.
// resolveSeo() strips the i18n locale prefix (/es, /pt) and falls back to
// prefix matches for the dynamic /set, /relic and /guides routes.

// Localized copy overlay (English fallback lives in PAGE_SEO below).
import { PAGE_SEO_I18N } from './seo-i18n'
// Generated overlay for the guide / faq / creators / tools pages (all 12 locales).
import { PAGE_SEO_I18N_GUIDES } from './seo-i18n-guides'

// Merge the hand-curated market/tool overlay with the generated guide/faq/tools
// overlay into one localized map. No key overlap by construction; if one ever
// appeared in both, the hand-curated PAGE_SEO_I18N wins.
const LOCALIZED_SEO: Record<string, Record<string, PageSeo>> = (() => {
  const merged: Record<string, Record<string, PageSeo>> = {}
  for (const loc of new Set([...Object.keys(PAGE_SEO_I18N), ...Object.keys(PAGE_SEO_I18N_GUIDES)])) {
    merged[loc] = { ...(PAGE_SEO_I18N_GUIDES[loc] || {}), ...(PAGE_SEO_I18N[loc] || {}) }
  }
  return merged
})()

export interface PageSeo {
  title: string
  description: string
}

export const SITE_SEO: PageSeo = {
  title: 'Warframe Market Analytics — Live Prime Prices & Platinum Tools',
  description:
    'Track live Warframe Market prices, prime set values, ducat efficiency, riven worth and trading signals. Free real-time platinum analytics and tools for Tenno.'
}

// Exact-path map (no locale prefix, no trailing slash)
export const PAGE_SEO: Record<string, PageSeo> = {
  '/': SITE_SEO,
  '/comparison': {
    title: 'Set vs Parts Calculator — Warframe Prime Sets',
    description:
      'Is a Warframe prime set cheaper assembled or bought part-by-part? Compare live Warframe Market prices and see exactly how much platinum you save.'
  },
  '/ducats': {
    title: 'Ducat Value Calculator — Best Prime Parts for Ducats',
    description:
      "Find the best ducats-per-platinum prime parts to stockpile for Baro Ki'Teer. Live Warframe Market ducat efficiency rankings, updated continuously."
  },
  '/endo': {
    title: 'Endo & Platinum Value — Ayatan Sculpture Calculator',
    description:
      'Compare endo vs platinum value for Ayatan sculptures and mods in Warframe. Decide what to dissolve for endo and what to sell for platinum.'
  },
  '/flip': {
    title: 'Flip Finder — Best Warframe Trading Spreads',
    description:
      'Spot the widest, most liquid buy/sell spreads on Warframe Market. Buy at the bid, relist at the ask, and earn platinum flipping prime parts.'
  },
  '/live': {
    title: 'Live Market Signals — Real-Time Warframe Trades',
    description:
      'Real-time Warframe Market order feed with buy, sell and flip signals plus worth-it verdicts. Never miss an underpriced prime part or riven.'
  },
  '/movers': {
    title: 'Top Movers — Warframe Prices Rising & Falling',
    description:
      'See which Warframe Market items are spiking or crashing over 24h and 7d. Catch platinum price trends before the rest of the market does.'
  },
  '/portfolio': {
    title: 'Portfolio Tracker — Your Warframe Platinum Holdings',
    description:
      'Track the platinum value of your Warframe prime and riven inventory over time, with a watchlist and price alerts. Know your net worth in plat.'
  },
  '/relic-farming': {
    title: 'Relic Farming Value — Best Warframe Relics to Farm',
    description:
      'Rank Warframe relics by realizable platinum value per run, weighted by market liquidity. Farm the relics that actually pay out in plat.'
  },
  '/relics-value': {
    title: 'Relic Value Calculator — Crack or Sell?',
    description:
      'Expected platinum payout of every Warframe relic, Intact and Radiant. Decide whether to crack a relic for parts or sell it outright.'
  },
  '/riven-value': {
    title: 'Riven Value Estimator — Warframe Riven Prices',
    description:
      'Estimate what a Warframe riven mod is worth in platinum by weapon disposition and roll. Price your rivens before you trade or bid.'
  },
  '/screener': {
    title: 'Market Screener — Filter Warframe Prime Prices',
    description:
      'Screen every Warframe Market item by price, volume, spread and tags. Build custom filters to find your next platinum-earning play.'
  },
  '/star-chart': {
    title: 'Star Chart Drop Map — Warframe Relic & Part Drops',
    description:
      'Interactive Warframe star chart showing where every prime part and relic drops. Plan the fastest farming route by mission node.'
  },
  '/star-chart-3d': {
    title: '3D Drop Map — Warframe Relic Drop Explorer',
    description:
      'Explore Warframe prime and relic drop locations on an interactive 3D star chart. Find the best node for the part or relic you need.'
  },
  '/timing': {
    title: 'Buy & Sell Timing — Best Time to Trade in Warframe',
    description:
      'Find the best hours to buy and sell each Warframe Market item, based on historical price and trade-volume patterns. Time your trades in plat.'
  },
  '/tools': {
    title: 'Warframe Tools Directory — Best Community Apps & Sites',
    description:
      'The verified directory of the best third-party Warframe tools: trading, build planners, drop tables, riven calculators, world-state trackers, apps and Discord bots.'
  },
  '/tools/best': {
    title: 'Best Warframe Tools 2026 — Ranked & Verified',
    description:
      'The best third-party Warframe tools, ranked and verified: trading and price checkers, build planners, drop tables, riven and world-state trackers. What to use and why.'
  },
  '/vault-spikes': {
    title: 'Vault Spikes — Warframe Prime Price Jumps',
    description:
      'Track vaulted Warframe primes whose prices are spiking right now. Spot which vaulted sets are climbing and cash in on the scarcity.'
  },
  '/vaulted': {
    title: 'Vaulted Primes — Track Rising Warframe Prices',
    description:
      "Every vaulted Warframe prime you can no longer farm, ranked by price trend. Watch what's appreciating in platinum and sell smart."
  },
  '/volatility': {
    title: 'Price Volatility — Most Volatile Warframe Items',
    description:
      'Rank Warframe Market items by price volatility. Find stable stores of platinum or high-swing items for aggressive flipping.'
  },
  '/set': {
    title: 'Set Prices — Warframe Prime Set Values',
    description:
      'Browse live platinum prices for every Warframe prime set. Compare set vs parts and find the best deals across Warframe Market.'
  },
  '/relic': {
    title: 'Relic Prices — Warframe Relic Values',
    description:
      'Live platinum prices and expected payouts for Warframe relics. Find which relics are worth cracking, keeping or trading.'
  },
  '/guides/endo': {
    title: 'Endo Farming Guide — Warframe',
    description:
      'A complete guide to farming Endo efficiently in Warframe, plus how to value Ayatan sculptures and mods against platinum.'
  },
  '/guides': {
    title: 'Warframe Guides — Farming, Builds, Platinum & Beginner Help',
    description:
      'Every Warframe guide in one place: new-player help, platinum and resource farming, builds, endgame and a searchable FAQ. Grounded in r/Warframe, free for Tenno.'
  },
  '/guides/farming': {
    title: 'Warframe Farming Hub — Search Any Item, Resource or Currency',
    description:
      'What do you want to farm? Search by item type — Orokin Cells, Kuva, prime parts, Argon, credits, Endo — and jump to the best farm. Every Warframe farming guide in one hub.'
  },
  '/faq': {
    title: 'Warframe FAQ — Answers to the Questions Everyone Asks',
    description:
      'The r/Warframe FAQ, answered: starter frames, making platinum, trading, farming, Steel Path, mods and more. Searchable, cross-linked and always free.'
  },
  '/creators': {
    title: 'Best Warframe YouTubers & Content Creators to Follow',
    description:
      'A verified directory of the best Warframe content creators — build masters, tier-list makers, farming specialists and beginner guides worth following on YouTube.'
  },
  '/guides/new-player': {
    title: 'Warframe New Player Guide 2026: What to Do First',
    description:
      'A complete Warframe beginner guide: what to do first, how the star chart works, which frame to farm, and the mistakes to avoid. Start Warframe the right way.'
  },
  '/guides/beginner-warframes': {
    title: 'Best Beginner Warframes 2026 — Which to Pick First',
    description:
      'Which starter Warframe to choose (Excalibur, Mag, Volt), which frame to farm first (Rhino), and where the easy early frames drop. A beginner’s roadmap.'
  },
  '/guides/progression': {
    title: 'Warframe Progression Guide 2026 — What to Do Next',
    description:
      'The Warframe progression roadmap: star chart, Junctions, Mastery Rank and a stage-by-stage checklist of what to do next. Stop feeling lost, Tenno.'
  },
  '/guides/mastery-rank': {
    title: 'Warframe Mastery Rank Guide — Fast Leveling & Affinity',
    description:
      'What Mastery Rank unlocks, how affinity works and shares, and the fastest ways to level weapons and frames in Warframe. Rank up your MR efficiently.'
  },
  '/guides/quests': {
    title: 'Warframe Quest Order — Story Guide (Spoiler-Light)',
    description:
      'The recommended order to play Warframe’s story quests, from Vor’s Prize to The New War and 1999 — which quests unlock what, with minimal spoilers.'
  },
  '/guides/platinum': {
    title: 'How to Make Platinum in Warframe (Free-to-Play)',
    description:
      'Earn Warframe platinum for free: what sells, how trading works, and how to price prime parts, mods and rivens. Free-to-play platinum farming, explained.'
  },
  '/guides/credits': {
    title: 'Warframe Credit Farming — Best Methods & Nodes',
    description:
      'The best Warframe credit farms by stage — the Index, Profit-Taker and boosters — plus where the millions come from. Farm credits fast and reliably.'
  },
  '/guides/focus': {
    title: 'Warframe Focus Farming Guide — Best Methods',
    description:
      'How to farm Focus in Warframe: unlock the Operator, pick a school and use the best focus farms, lenses and convergence orbs. Level your schools efficiently.'
  },
  '/guides/kuva': {
    title: 'Warframe Kuva Farming Guide — Fast Methods',
    description:
      'The best ways to farm Kuva in Warframe for riven re-rolls and Kuva weapons — Survival, Siphon and Flood missions, boosters and realistic rates.'
  },
  '/guides/relics': {
    title: 'Warframe Relic & Void Trace Farming Guide',
    description:
      'How Void Relics and Void Traces work in Warframe: cracking fissures, refining to Radiant, shared rewards and efficient farming for prime parts.'
  },
  '/guides/resources': {
    title: 'Warframe Resource Farming — Where to Farm Everything',
    description:
      'Where to farm every key Warframe resource: Orokin Cells, Neurodes, Argon Crystals, Tellurium, Oxium, Nitain and more. A complete farming reference table.'
  },
  '/guides/standing': {
    title: 'Warframe Standing & Syndicate Farming Guide',
    description:
      'Cap your daily standing across every Warframe syndicate and open-world faction. How the reputation cap works and the fastest ways to max it out.'
  },
  '/guides/mods': {
    title: 'Warframe Mods Guide — Essential Mods & Survivability',
    description:
      'How modding works in Warframe, the must-have mods, and shield-gating to stop dying. Understand mod capacity, polarities and the damage multipliers.'
  },
  '/guides/helminth': {
    title: 'Warframe Helminth Guide — Subsume & Best Abilities',
    description:
      'How the Warframe Helminth system works: unlocking it, subsuming abilities, and the best powers to graft onto your frames. Buildcrafting, explained.'
  },
  '/guides/arcanes': {
    title: 'Warframe Arcanes Guide — Best Arcanes & How to Farm',
    description:
      'What arcanes do in Warframe, how to rank them, where they drop, and the staple arcanes worth farming. Boost your frames, weapons and operator.'
  },
  '/guides/riven': {
    title: 'Warframe Riven Mods Explained — Disposition & Rolling',
    description:
      'Everything about Warframe riven mods: disposition, rolling with Kuva, grading, veiled rivens and why bad rivens are cheap Endo. Riven trading basics.'
  },
  '/guides/steel-path': {
    title: 'Warframe Steel Path Guide — Unlock & Steel Essence',
    description:
      'How to unlock the Steel Path in Warframe, survive it, and farm Steel Essence for incarnon adapters, arcanes, kuva and more. The hard-mode rewards guide.'
  },
  '/guides/eidolon': {
    title: 'Warframe Eidolon Hunting Guide — Tridolon Basics',
    description:
      'How to hunt Eidolons in Warframe: amps, the meta squad, and going from a solo Teralyst to the full Tridolon. Farm arcanes and focus fast.'
  },
  '/guides/railjack': {
    title: 'Warframe Railjack Guide — Unlock, Intrinsics & Farming',
    description:
      'How to unlock and use Railjack in Warframe: build your ship, level Intrinsics, and turn space combat into an affinity and resource farm.'
  },
  '/guides/duviri': {
    title: 'Warframe Duviri Paradox Guide — Circuit & Decrees',
    description:
      'How the Duviri Paradox works in Warframe: the roguelike Circuit, Decrees, and the weekly Warframe and Incarnon rewards. Playable from the very start.'
  },
  '/guides/archon-shards': {
    title: 'Warframe Archon Shards Guide — Farming & Best Stats',
    description:
      'What Archon Shards do in Warframe, how to farm them from the weekly Archon Hunt, and which stats to prioritize. The endgame power boost, explained.'
  },
  '/guides/tier-list': {
    title: 'Warframe Tier List 2026 — How to Actually Read It',
    description:
      'Why Warframe tier lists disagree, what “good” really means per activity, and a few broadly strong frames. Build what you enjoy, not just the meta.'
  }
}

// Prefix fallbacks for dynamic child routes (/set/:set, /relic/:relic, ...).
// Stored as [prefix, pageKey] so the localized overlay can be consulted by key.
const PREFIX_SEO: Array<[string, string]> = [
  ['/guides', '/guides'],
  ['/set', '/set'],
  ['/relic-farming', '/relic-farming'],
  ['/relics-value', '/relics-value'],
  ['/relic', '/relic']
]

// All non-default i18n locale codes (kept in sync with nuxt.config LOCALES).
// Used to strip the locale prefix from a path before resolving its SEO entry.
const LOCALE_PREFIX_RE =
  /^\/(es|pt|de|fr|ru|ko|ja|zh-hans|zh-hant|pl|it|uk)(?=\/|$)/

/** Turn a route slug like "ash_prime_set" into a readable "Ash Prime Set". */
export function prettifySlug(slug?: string | null): string {
  if (!slug) return ''
  return decodeURIComponent(slug)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Resolves a route to its SEO copy, localized into `locale` when a translation
 * exists (PAGE_SEO_I18N), otherwise the English copy (PAGE_SEO). Strips the
 * locale URL prefix first so /de/comparison and /comparison resolve identically.
 */
export function resolveSeo(path: string, locale = 'en'): PageSeo {
  // Strip locale prefix and any trailing slash
  let p = path.replace(LOCALE_PREFIX_RE, '') || '/'
  if (p.length > 1) p = p.replace(/\/+$/, '')

  const pick = (key: string): PageSeo | undefined =>
    LOCALIZED_SEO[locale]?.[key] ?? PAGE_SEO[key]

  const exact = pick(p)
  if (exact) return exact

  for (const [prefix, key] of PREFIX_SEO) {
    if (p === prefix || p.startsWith(prefix + '/')) {
      const fromPrefix = pick(key)
      if (fromPrefix) return fromPrefix
    }
  }
  return LOCALIZED_SEO[locale]?.['/'] ?? SITE_SEO
}
