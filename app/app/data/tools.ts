import sources from './tools.source.json'
import enriched from './tools.enriched.json'
import socials from './tools.socials.json'

export type ToolCategory =
  | 'trading' | 'database' | 'worldstate' | 'farming'
  | 'riven' | 'builds' | 'apps' | 'bots' | 'api'
export type Platform = 'web' | 'android' | 'ios' | 'windows' | 'overlay' | 'discord' | 'extension'

/**
 * Official social / community links for a tool. Every field is a full https URL
 * (or absent). Hand-curated in tools.source.json from each tool's own site —
 * see the tool-socials research flow. Never fabricated: absent = not found.
 */
export interface ToolSocial {
  discord?: string
  x?: string
  youtube?: string
  reddit?: string
  patreon?: string
  kofi?: string
  steam?: string
  telegram?: string
  /** GitHub org/user page (distinct from the code `github` "owner/repo"). */
  githubOrg?: string
  /** A secondary official site / docs / blog, when distinct from `url`. */
  website?: string
}

/** Ordered social kinds, used to render the icon row consistently. */
export const SOCIAL_KINDS = [
  'discord', 'x', 'youtube', 'reddit', 'patreon', 'kofi', 'steam', 'telegram', 'githubOrg', 'website',
] as const
export type SocialKind = typeof SOCIAL_KINDS[number]

export interface ToolMeta {
  slug: string
  name: string
  url: string
  category: ToolCategory
  platforms: Platform[]
  openSource?: boolean
  github?: string
  social?: ToolSocial
  featured?: boolean
  caveat?: 'partial' | 'rmt' | null
  /** This site itself — flagged for transparent self-listing + cross-references. */
  self?: boolean
  verified: boolean
  httpStatus?: number
  screenshot?: string
  domain?: { created: string | null; ageYears: number | null; registrar: string | null; expires: string | null }
  repo?: { stars: number; lastCommit: string; archived: boolean; openIssues: number }
  enrichedAt?: string
}

const enrichedMap = enriched as Record<string, Partial<ToolMeta>>
// Curated official social/community links, keyed by slug (see the tool-socials
// research flow). Merged in like enrichment; an explicit `social` in the source
// still wins.
const socialsMap = socials as Record<string, ToolSocial>

export const TOOLS: ToolMeta[] = (sources as any[]).map((s) => ({
  ...s,
  ...(enrichedMap[s.slug] || {}),
  // Enriched data wins, but fall back to any value declared in the source
  // (used by the self-listing, which isn't part of the enrichment run).
  verified: enrichedMap[s.slug]?.verified ?? s.verified ?? false,
  screenshot: enrichedMap[s.slug]?.screenshot ?? s.screenshot,
  social: (s.social as ToolSocial | undefined) ?? socialsMap[s.slug],
}))

// Directory sections, in display order (see spec §4).
export const TOOL_SECTIONS: { key: ToolCategory }[] = [
  { key: 'trading' }, { key: 'database' }, { key: 'worldstate' },
  { key: 'farming' }, { key: 'riven' }, { key: 'builds' },
  { key: 'apps' }, { key: 'bots' }, { key: 'api' },
]

export function toolsByCategory(cat: ToolCategory): ToolMeta[] {
  return TOOLS.filter((t) => t.category === cat)
    .sort((a, b) => Number(b.featured || false) - Number(a.featured || false))
}
