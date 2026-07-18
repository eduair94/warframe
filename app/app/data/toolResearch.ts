import research from './tools.research.json'

// Per-tool deep-research data (Reddit / YouTube / Trustpilot / community feedback),
// gathered from real external sources and baked at build time (see
// scripts/enrich-tools flow / the research workflow). Keyed by tool slug.
// English content — sourced from English-language communities; the page CHROME
// localizes via the `toolDetail.*` i18n namespace, research prose stays English.

export type Tier = 'essential' | 'recommended' | 'situational' | 'niche' | 'avoid'
export type Sentiment = 'positive' | 'mixed' | 'negative'
export type SafetyRating = 'safe' | 'caution' | 'risky'

export interface RedditRef {
  title: string
  url: string
  subreddit?: string
  snippet?: string
  sentiment: Sentiment
}
export interface YoutubeRef {
  title: string
  url: string
  channel?: string
}
export interface OtherReview {
  source: string
  url: string
  snippet?: string
  rating?: string | null
}
export interface Trustpilot {
  rating: number | null
  reviewCount: number | null
  url: string
}

export interface ToolResearch {
  slug: string
  oneLiner: string
  overview: string
  keyFeatures: string[]
  bestFor: string
  pros?: string[]
  cons?: string[]
  reddit?: RedditRef[]
  youtube?: YoutubeRef[]
  trustpilot?: Trustpilot | null
  otherReviews?: OtherReview[]
  sentimentSummary: string
  safety: { rating: SafetyRating; notes: string }
  tier: Tier
  tierReason: string
  dataConfidence: 'high' | 'medium' | 'low'
}

export const RESEARCH = research as unknown as Record<string, ToolResearch>

export function getResearch(slug: string): ToolResearch | undefined {
  return RESEARCH[slug]
}

/** Rank order for the "best tools" guide and tier badges (lower = higher tier). */
export const TIER_ORDER: Record<Tier, number> = {
  essential: 0,
  recommended: 1,
  situational: 2,
  niche: 3,
  avoid: 4,
}

export function researchedSlugs(): string[] {
  return Object.keys(RESEARCH)
}

/** This site's own tool slug (see the self-listing in tools.source.json). */
export const SELF_SLUG = 'warframe-market-analytics'

export interface SelfRelation {
  /** enhancer = we add a layer on top of that tool; alternative = overlapping feature. */
  type: 'enhancer' | 'alternative'
  /** The most relevant page of THIS site to send the reader to (locale-prefixed at render). */
  href: string
  /** Short English reason shown in the cross-reference callout. */
  reason: string
}

/**
 * Cross-references from other tools to THIS site. On a related tool's detail
 * page we surface a transparent "enhance / alternative" callout linking to the
 * most relevant part of our own app. Only genuine overlaps are listed.
 */
export const SELF_RELATIONS: Record<string, SelfRelation> = {
  'warframe-market': {
    type: 'enhancer',
    href: '/',
    reason:
      "Built on Warframe.market's own data — adds set-vs-parts, ducat/relic/riven value, flip signals and vaulted tracking on top of the raw order board.",
  },
  'wfm-price-history': {
    type: 'alternative',
    href: '/',
    reason: 'Also charts Warframe.market price history, plus set, relic, ducat and riven analytics in one place.',
  },
  'quantframe': {
    type: 'alternative',
    href: '/flip',
    reason: 'Web-based flip finder and price analytics over the same market data — no install required.',
  },
  'warframe-appraiser': {
    type: 'alternative',
    href: '/comparison',
    reason: 'Values sets and parts from live Warframe.market prices, with set-vs-parts and 48h volume.',
  },
  'semlar-rivencalc': {
    type: 'alternative',
    href: '/riven-value',
    reason: 'Estimates riven platinum fair value from live auction data.',
  },
  'rivenradar': {
    type: 'alternative',
    href: '/riven-value',
    reason: 'Estimates riven platinum fair value from live auction data.',
  },
  'morrowshore-riven': {
    type: 'alternative',
    href: '/riven-value',
    reason: 'Estimates riven platinum fair value from live auction data.',
  },
  'webutilitykit-riven': {
    type: 'alternative',
    href: '/riven-value',
    reason: 'Tracks riven prices and estimates fair value from live auction data.',
  },
  'relic-finder': {
    type: 'alternative',
    href: '/relics-value',
    reason: 'Ranks relics by expected platinum payout (crack vs sell) and where to farm them.',
  },
  'wf-relic-tracker': {
    type: 'alternative',
    href: '/relic-farming',
    reason: 'Ranks relics by realizable platinum value per run, weighted by market liquidity.',
  },
  'relicarium': {
    type: 'alternative',
    href: '/relics-value',
    reason: 'Expected platinum payout of every relic, Intact and Radiant.',
  },
  'droptable-wf': {
    type: 'alternative',
    href: '/star-chart',
    reason: 'Interactive drop map joining WFCD drop chances with live market prices.',
  },
  'warframe-drop-optimizer': {
    type: 'alternative',
    href: '/star-chart',
    reason: 'Ranks mission nodes by expected platinum per run from drop chances + live prices.',
  },
}

export function selfRelation(slug: string): SelfRelation | undefined {
  return SELF_RELATIONS[slug]
}
