import sources from './tools.source.json'
import enriched from './tools.enriched.json'

export type ToolCategory =
  | 'trading' | 'database' | 'worldstate' | 'farming'
  | 'riven' | 'builds' | 'apps' | 'bots' | 'api'
export type Platform = 'web' | 'android' | 'ios' | 'windows' | 'overlay' | 'discord' | 'extension'

export interface ToolMeta {
  slug: string
  name: string
  url: string
  category: ToolCategory
  platforms: Platform[]
  openSource?: boolean
  github?: string
  featured?: boolean
  caveat?: 'partial' | 'rmt' | null
  verified: boolean
  httpStatus?: number
  screenshot?: string
  domain?: { created: string | null; ageYears: number | null; registrar: string | null; expires: string | null }
  repo?: { stars: number; lastCommit: string; archived: boolean; openIssues: number }
  enrichedAt?: string
}

const enrichedMap = enriched as Record<string, Partial<ToolMeta>>

export const TOOLS: ToolMeta[] = (sources as any[]).map((s) => ({
  ...s,
  ...(enrichedMap[s.slug] || {}),
  verified: enrichedMap[s.slug]?.verified ?? false,
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
