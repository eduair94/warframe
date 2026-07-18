// scripts/enrich-tools.ts
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ToolSource, ToolEnriched, registrableDomain, isOwnDomain, parseWhois } from './lib/toolEnrich'

const ROOT = process.cwd()
const SRC = join(ROOT, 'app/app/data/tools.source.json')
const OUT = join(ROOT, 'app/app/data/tools.enriched.json')
const SHOTS_DIR = join(ROOT, 'app/public/img/tools')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36'
const SNUS = process.env.SNUSBASE_TOKEN || ''
const GH = process.env.GITHUB_TOKEN || ''

async function liveness(url: string): Promise<number> {
  try {
    const r = await fetch(url, { method: 'GET', headers: { 'user-agent': UA }, redirect: 'follow' })
    return r.status
  } catch { return 0 }
}

async function whoisBatch(domains: string[]): Promise<Record<string, any>> {
  if (!SNUS || !domains.length) return {}
  const out: Record<string, any> = {}
  // snusbase accepts a terms[] array; chunk to be polite
  for (let i = 0; i < domains.length; i += 10) {
    const terms = domains.slice(i, i + 10)
    try {
      const r = await fetch('https://api.snusbase.com/tools/domain-whois', {
        method: 'POST',
        headers: { 'auth': SNUS, 'content-type': 'application/json', 'accept': '*/*' },
        body: JSON.stringify({ terms }),
      })
      const j: any = await r.json()
      Object.assign(out, j?.results || {})
    } catch { /* leave missing */ }
  }
  return out
}

async function githubRepo(slug: string) {
  try {
    const r = await fetch(`https://api.github.com/repos/${slug}`, {
      headers: { 'user-agent': UA, 'accept': 'application/vnd.github+json', ...(GH ? { authorization: `Bearer ${GH}` } : {}) },
    })
    if (!r.ok) return undefined
    const j: any = await r.json()
    return { stars: j.stargazers_count ?? 0, lastCommit: j.pushed_at, archived: !!j.archived, openIssues: j.open_issues_count ?? 0 }
  } catch { return undefined }
}

async function main() {
  const now = Date.now()
  const sources: ToolSource[] = JSON.parse(readFileSync(SRC, 'utf8'))
  const domains = [...new Set(sources.filter((s) => isOwnDomain(s.url)).map((s) => registrableDomain(s.url)))]
  const whois = await whoisBatch(domains)
  const out: Record<string, ToolEnriched> = {}

  for (const s of sources) {
    const httpStatus = await liveness(s.url)
    const shot = join(SHOTS_DIR, `${s.slug}.webp`)
    const screenshot = existsSync(shot) ? `/img/tools/${s.slug}.webp` : undefined
    const domain = isOwnDomain(s.url) ? parseWhois(whois[registrableDomain(s.url)] || {}, now) : undefined
    const repo = s.github ? await githubRepo(s.github) : undefined
    out[s.slug] = {
      // A real-browser screenshot is the ground truth for "working": many live sites
      // (Cloudflare-fronted — wiki.warframe.com, overframe, rivenradar, fandom) refuse
      // datacenter server-fetches with 403/503 yet load fine in a real browser, so a
      // captured screenshot proves liveness where httpStatus can't. httpStatus is kept
      // as an informational reachability signal, not the gate.
      verified: !!screenshot,
      httpStatus, screenshot, domain, repo,
      enrichedAt: new Date(now).toISOString(),
    }
    console.log(`${s.slug.padEnd(28)} http=${httpStatus} age=${domain?.ageYears ?? '-'} stars=${repo?.stars ?? '-'} shot=${!!screenshot}`)
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`\nWrote ${Object.keys(out).length} entries -> ${OUT}`)
}
main()
