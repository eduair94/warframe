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
