export type ToolCategory =
  | 'trading' | 'database' | 'worldstate' | 'farming'
  | 'riven' | 'builds' | 'apps' | 'bots' | 'api'
export type Platform = 'web' | 'android' | 'ios' | 'windows' | 'overlay' | 'discord' | 'extension'

export interface ToolSource {
  slug: string
  name: string
  url: string
  category: ToolCategory
  platforms: Platform[]
  openSource?: boolean
  github?: string
  featured?: boolean
  caveat?: 'partial' | 'rmt' | null
}
export interface ToolEnriched {
  verified: boolean
  httpStatus?: number
  screenshot?: string
  domain?: { created: string | null; ageYears: number | null; registrar: string | null; expires: string | null }
  repo?: { stars: number; lastCommit: string; archived: boolean; openIssues: number }
  enrichedAt?: string
}
export type ToolMeta = ToolSource & Partial<ToolEnriched> & { verified: boolean }

const PLATFORM_HOSTS = [
  'github.com', 'play.google.com', 'chromewebstore.google.com',
  'top.gg', 'discordbotlist.com', 'overwolf.com', 'apps.apple.com',
]

export function registrableDomain(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, '')
  const parts = host.split('.')
  if (parts.length <= 2) return host
  return parts.slice(-2).join('.')
}

export function isOwnDomain(url: string): boolean {
  const host = new URL(url).hostname.replace(/^www\./, '')
  return !PLATFORM_HOSTS.some((p) => host === p || host.endsWith('.' + p))
}

export function computeAgeYears(createdIso: string, nowMs: number): number {
  return Math.floor((nowMs - Date.parse(createdIso)) / (365.25 * 24 * 3600 * 1000))
}

export function parseWhois(result: any, nowMs: number) {
  const created = result?.date?.created ?? null
  const expires = result?.date?.expires ?? null
  const registrar = result?.registrar?.name ?? null
  const ageYears = created ? computeAgeYears(created, nowMs) : null
  return { created, ageYears, registrar, expires }
}

export function mergeTool(source: ToolSource, enriched?: ToolEnriched): ToolMeta {
  return { ...source, ...(enriched || {}), verified: enriched?.verified ?? false }
}
