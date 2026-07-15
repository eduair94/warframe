// Per-route SEO copy (unique <title> + meta description for every page).
// Consumed once in layouts/default.vue via useSeoMeta so all pages get
// keyword-rich, non-duplicate titles/descriptions without editing 20+ files.
// resolveSeo() strips the i18n locale prefix (/es, /pt) and falls back to
// prefix matches for the dynamic /set, /relic and /guides routes.

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
  }
}

// Prefix fallbacks for dynamic child routes (/set/:set, /relic/:relic, ...)
const PREFIX_SEO: Array<[string, PageSeo]> = [
  ['/guides', PAGE_SEO['/guides/endo']],
  ['/set', PAGE_SEO['/set']],
  ['/relic-farming', PAGE_SEO['/relic-farming']],
  ['/relics-value', PAGE_SEO['/relics-value']],
  ['/relic', PAGE_SEO['/relic']]
]

export function resolveSeo(path: string): PageSeo {
  // Strip locale prefix and any trailing slash
  let p = path.replace(/^\/(es|pt)(?=\/|$)/, '') || '/'
  if (p.length > 1) p = p.replace(/\/+$/, '')
  if (PAGE_SEO[p]) return PAGE_SEO[p]
  for (const [prefix, seo] of PREFIX_SEO) {
    if (p === prefix || p.startsWith(prefix + '/')) return seo
  }
  return SITE_SEO
}
