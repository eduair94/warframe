# Warframe Community Tools Guide — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a verified, SSR-rendered directory page at `/tools` listing ~52 real Warframe third-party tools, each card carrying a real screenshot, domain age (whois), GitHub maintenance signal, and a verified-working badge.

**Architecture:** Hand-authored tool facts in `tools.source.json`; a root `ts-node` enrichment script writes `tools.enriched.json` (liveness + snusbase whois + GitHub API); the app merges both into a typed `ToolMeta[]` and renders Orokin-styled cards. Screenshots captured with Playwright, optimized to WebP with `sharp`, committed under `app/public/img/tools/`. No secrets reach the client — enrichment runs at build time only.

**Tech Stack:** Node 24, TypeScript, ts-node + jest (backend/scripts), Nuxt 4 + Vuetify 3 + vue-i18n (frontend), sharp + tsx (image tooling), Playwright MCP (screenshots).

## Global Constraints

- **Node 24** (npm 11 lockfile). Global `fetch` is available — no `node-fetch`.
- **Secrets env-only:** `SNUSBASE_TOKEN` (and optional `GITHUB_TOKEN`) read from `process.env` in the enrichment script. Never commit them; never import them into any `app/` file or client bundle.
- **Design system:** Orokin `.an-*` classes from `app/app/assets/analytics.css` (globally loaded via `nuxt.config` `css`); CSS vars `--gold-ink #e7cf95`, `--orokin #c8a85c`, `--energy #35d6d0`, `--rose #d98a8a`, `--ink`, `--ink-dim`, `--font-display` (Cinzel), `--font-hud` (Rajdhani). Scoped page classes prefixed `.ct-`.
- **Spinner rule:** every page hides `#spinner-wrapper` on mount via a bounded retry (copy the exact `finishLoading` from `app/app/pages/guides/endo.vue`).
- **i18n:** 13 locale codes — `en es pt de fr ru ko ja zh-hans zh-hant pl it uk`. Nav labels added to **all 13**. Page/module copy: English authored now; missing locales fall back to English via `fallbackLocale: 'en'` (config already set). Single-brace interpolation (`{count}`).
- **Verified gate:** a tool ships only if enrichment recorded a 2xx/3xx `httpStatus` AND a screenshot file exists. Others are held back (kept in source but `verified:false` → card shows an "unverified" state, not a broken live link).
- **Outbound links:** every external Visit link uses `target="_blank" rel="noopener nofollow"`.
- **Excluded (research-verified dead):** `Riven.market`, `Semlar Riven Price Guide`. **Odealo** listed with an `⚠ RMT — against Warframe EULA` badge (`caveat:'rmt'`).

## File Structure

- Create `app/app/data/tools.source.json` — hand-authored source records (facts a human curates).
- Create `app/app/data/tools.enriched.json` — script-generated, keyed by slug (starts as `{}`).
- Create `app/app/data/tools.ts` — types (`ToolMeta`, `ToolCategory`, `Platform`) + merged `TOOLS: ToolMeta[]` + `TOOL_SECTIONS` ordering.
- Create `scripts/lib/toolEnrich.ts` — pure helpers (no IO): `registrableDomain`, `isOwnDomain`, `computeAgeYears`, `parseWhois`, `mergeTool`.
- Create `scripts/lib/toolEnrich.test.ts` — jest unit tests for the helpers.
- Create `scripts/enrich-tools.ts` — enrichment runner (IO: fetch + whois + GitHub → writes enriched.json).
- Create `app/scripts/tool-shots.mts` — sharp PNG→WebP batch converter (tsx).
- Create `app/i18n/messages/communityTools.ts` — page copy module (namespaced `communityTools.*`).
- Create `app/app/pages/tools.vue` — the directory page.
- Modify `package.json` — add `"enrich_tools": "ts-node scripts/enrich-tools.ts"`.
- Modify `app/i18n/messages/nav.ts` — add `sections.resources` + `items.communityTools` to all 13 locales.
- Modify `app/app/layouts/default.vue` — nav link + `SECTION_KEYS.Resources` + drawer order.
- Modify `app/app/utils/seo.ts` — `PAGE_SEO['/tools']`.
- Create `.env.example` entry note for `SNUSBASE_TOKEN`.

---

### Task 1: Enrichment pure helpers (TDD)

**Files:**
- Create: `scripts/lib/toolEnrich.ts`
- Test: `scripts/lib/toolEnrich.test.ts`

**Interfaces:**
- Produces:
  - `registrableDomain(url: string): string` — hostname reduced to registrable domain (`hub.warframestat.us` → `warframestat.us`, strips `www.`).
  - `isOwnDomain(url: string): boolean` — false for platform hosts (`github.com`, `play.google.com`, `chromewebstore.google.com`, `top.gg`, `discordbotlist.com`, `overwolf.com`, `apps.apple.com`).
  - `computeAgeYears(createdIso: string, nowMs: number): number` — whole years, floored.
  - `parseWhois(result: any): { created: string|null; ageYears: number|null; registrar: string|null; expires: string|null }` — reads the snusbase per-domain object shape (`{ date?: { created, expires }, registrar?: { name } }`); `nowMs` supplied by caller.
  - `mergeTool(source: ToolSource, enriched?: ToolEnriched): ToolMeta` — spread merge; `verified` defaults false when enriched missing.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/toolEnrich.test.ts
import { registrableDomain, isOwnDomain, computeAgeYears, parseWhois, mergeTool } from './toolEnrich'

describe('registrableDomain', () => {
  it('reduces subdomains and strips www', () => {
    expect(registrableDomain('https://hub.warframestat.us/')).toBe('warframestat.us')
    expect(registrableDomain('https://www.warframe.com/droptables')).toBe('warframe.com')
    expect(registrableDomain('https://warframe.market/')).toBe('warframe.market')
  })
})

describe('isOwnDomain', () => {
  it('is false for known platform hosts', () => {
    expect(isOwnDomain('https://github.com/WFCD/warframe-items')).toBe(false)
    expect(isOwnDomain('https://play.google.com/store/apps/details?id=x')).toBe(false)
    expect(isOwnDomain('https://alecaframe.com/')).toBe(true)
  })
})

describe('computeAgeYears', () => {
  it('floors to whole years', () => {
    const now = Date.parse('2026-07-17T00:00:00Z')
    expect(computeAgeYears('2014-11-13T16:24:23Z', now)).toBe(11)
  })
})

describe('parseWhois', () => {
  it('extracts date/registrar and computes age', () => {
    const now = Date.parse('2026-07-17T00:00:00Z')
    const r = parseWhois({ date: { created: '2014-11-13T16:24:23.470Z', expires: '2026-11-13T16:24:23.470Z' }, registrar: { name: 'cloudflare, inc' } }, now)
    expect(r.created).toBe('2014-11-13T16:24:23.470Z')
    expect(r.ageYears).toBe(11)
    expect(r.registrar).toBe('cloudflare, inc')
    expect(r.expires).toBe('2026-11-13T16:24:23.470Z')
  })
  it('returns nulls when the TLD omits dates (e.g. .gg)', () => {
    const r = parseWhois({ nameserver: ['x'] }, Date.now())
    expect(r.created).toBeNull()
    expect(r.ageYears).toBeNull()
  })
})

describe('mergeTool', () => {
  it('defaults verified false when no enrichment', () => {
    const m = mergeTool({ slug: 'x', name: 'X', url: 'https://x.io/', category: 'trading', platforms: ['web'] })
    expect(m.verified).toBe(false)
    expect(m.name).toBe('X')
  })
  it('overlays enriched fields', () => {
    const m = mergeTool(
      { slug: 'x', name: 'X', url: 'https://x.io/', category: 'trading', platforms: ['web'] },
      { verified: true, httpStatus: 200, domain: { created: '2014-01-01', ageYears: 12, registrar: 'r', expires: null } }
    )
    expect(m.verified).toBe(true)
    expect(m.domain?.ageYears).toBe(12)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest scripts/lib/toolEnrich.test.ts`
Expected: FAIL — "Cannot find module './toolEnrich'".

- [ ] **Step 3: Write the implementation**

```ts
// scripts/lib/toolEnrich.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest scripts/lib/toolEnrich.test.ts`
Expected: PASS (5 suites).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/toolEnrich.ts scripts/lib/toolEnrich.test.ts
git commit -m "feat(tools): enrichment pure helpers (whois/domain/merge) + tests"
```

---

### Task 2: Enrichment runner script

**Files:**
- Create: `scripts/enrich-tools.ts`
- Modify: `package.json` (add `enrich_tools` script)
- Create: `.env.example` note

**Interfaces:**
- Consumes: helpers from `scripts/lib/toolEnrich.ts`; reads `app/app/data/tools.source.json`; env `SNUSBASE_TOKEN`, optional `GITHUB_TOKEN`.
- Produces: writes `app/app/data/tools.enriched.json` — `Record<slug, ToolEnriched>`.

- [ ] **Step 1: Write the script**

```ts
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
      verified: httpStatus >= 200 && httpStatus < 400 && !!screenshot,
      httpStatus, screenshot, domain, repo,
      enrichedAt: new Date(now).toISOString(),
    }
    console.log(`${s.slug.padEnd(28)} http=${httpStatus} age=${domain?.ageYears ?? '-'} stars=${repo?.stars ?? '-'} shot=${!!screenshot}`)
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2))
  console.log(`\nWrote ${Object.keys(out).length} entries -> ${OUT}`)
}
main()
```

- [ ] **Step 2: Add the npm script**

In `package.json` `scripts`, after the `sync_translations` line add:

```json
    "enrich_tools": "ts-node scripts/enrich-tools.ts",
```

- [ ] **Step 3: Document the env var**

Append to `.env.example` (create if missing):

```
# Domain-age enrichment for the /tools guide (build-time only, never shipped to client)
SNUSBASE_TOKEN=
# Optional: raises GitHub API rate limit for repo maintenance stats
GITHUB_TOKEN=
```

- [ ] **Step 4: Smoke-test with a 2-tool source stub**

Temporarily create `app/app/data/tools.source.json` with two entries and run:

```bash
SNUSBASE_TOKEN="$SNUSBASE_TOKEN" npm run enrich_tools   # token from .env / shell env, never inline
```

Expected: console prints `warframe-market http=200 age=11 ...`, writes `tools.enriched.json`. (Real full run happens in Task 4 after the full source list + screenshots exist.)

- [ ] **Step 5: Commit**

```bash
git add scripts/enrich-tools.ts package.json .env.example
git commit -m "feat(tools): build-time enrichment runner (liveness + whois + github)"
```

---

### Task 3: Tool source data + merged typed export

**Files:**
- Create: `app/app/data/tools.source.json`
- Create: `app/app/data/tools.enriched.json` (initial `{}`)
- Create: `app/app/data/tools.ts`
- Test: `scripts/lib/toolsSource.test.ts` (validates the JSON at root, since jest ignores `/app/`)

**Interfaces:**
- Produces: `TOOLS: ToolMeta[]` (merged, source order), `TOOL_SECTIONS: { key: ToolCategory; }[]` ordering, re-exported types.

- [ ] **Step 1: Write the full source list**

Create `app/app/data/tools.source.json` (52 records — exclusions applied, Odealo `caveat:"rmt"`, Reliquary `caveat:"partial"`):

```json
[
  { "slug": "warframe-market", "name": "Warframe Market", "url": "https://warframe.market/", "category": "trading", "platforms": ["web"], "featured": true },
  { "slug": "warframe-wiki", "name": "WARFRAME Wiki (Official)", "url": "https://wiki.warframe.com/", "category": "database", "platforms": ["web"], "featured": true },
  { "slug": "overframe", "name": "Overframe", "url": "https://overframe.gg/", "category": "builds", "platforms": ["web"], "featured": true },
  { "slug": "warframestat-api", "name": "Warframe Status API", "url": "https://docs.warframestat.us/", "category": "api", "platforms": ["web"], "openSource": true, "featured": true },
  { "slug": "wfinfo", "name": "WFInfo", "url": "https://wfinfo.warframestat.us/", "category": "farming", "platforms": ["windows", "overlay"], "openSource": true, "github": "WFCD/WFInfo" },
  { "slug": "warframe-hub", "name": "Warframe Hub", "url": "https://hub.warframestat.us/", "category": "worldstate", "platforms": ["web"], "openSource": true },
  { "slug": "de-drop-tables", "name": "Official Warframe Drop Tables", "url": "https://www.warframe.com/droptables", "category": "farming", "platforms": ["web"], "featured": true },
  { "slug": "alecaframe", "name": "AlecaFrame", "url": "https://alecaframe.com/", "category": "apps", "platforms": ["windows", "overlay"] },
  { "slug": "semlar-rivencalc", "name": "Semlar Riven Calculator", "url": "https://semlar.com/rivencalc", "category": "riven", "platforms": ["web"], "featured": true },
  { "slug": "fandom-wiki", "name": "WARFRAME Wiki on Fandom", "url": "https://warframe.fandom.com/wiki/WARFRAME_Wiki", "category": "database", "platforms": ["web"] },
  { "slug": "wfcd-drop-data", "name": "WFCD warframe-drop-data", "url": "https://github.com/WFCD/warframe-drop-data", "category": "database", "platforms": ["web"], "openSource": true, "github": "WFCD/warframe-drop-data" },
  { "slug": "drops-warframestat", "name": "Warframe Drop Data (drops.warframestat.us)", "url": "https://drops.warframestat.us/", "category": "farming", "platforms": ["web"], "openSource": true },
  { "slug": "wfcd-items", "name": "WFCD warframe-items", "url": "https://github.com/WFCD/warframe-items", "category": "database", "platforms": ["web"], "openSource": true, "github": "WFCD/warframe-items" },
  { "slug": "warframe-companion", "name": "Warframe Companion (Official)", "url": "https://play.google.com/store/apps/details?id=com.digitalextremes.warframenexus", "category": "apps", "platforms": ["android", "ios"], "featured": true },
  { "slug": "de-public-export", "name": "Warframe Public Export (DE)", "url": "https://wiki.warframe.com/w/Public_Export", "category": "api", "platforms": ["web"] },
  { "slug": "worldstate-parser", "name": "warframe-worldstate-parser (WFCD)", "url": "https://github.com/WFCD/warframe-worldstate-parser", "category": "api", "platforms": ["web"], "openSource": true, "github": "WFCD/warframe-worldstate-parser" },
  { "slug": "public-export-plus", "name": "warframe-public-export-plus", "url": "https://github.com/calamity-inc/warframe-public-export-plus", "category": "database", "platforms": ["web"], "openSource": true, "github": "calamity-inc/warframe-public-export-plus" },
  { "slug": "warframe-builder", "name": "Warframe Builder", "url": "https://warframe-builder.com/", "category": "builds", "platforms": ["web"] },
  { "slug": "browse-wf", "name": "browse.wf", "url": "https://browse.wf/", "category": "database", "platforms": ["web"], "openSource": true },
  { "slug": "quantframe", "name": "Quantframe", "url": "https://quantframe.app/", "category": "trading", "platforms": ["windows"], "openSource": true },
  { "slug": "underframe", "name": "Underframe", "url": "https://www.underframe.site/", "category": "builds", "platforms": ["web"] },
  { "slug": "tenno-tools", "name": "Tenno Tools", "url": "https://tenno.tools/", "category": "worldstate", "platforms": ["web"] },
  { "slug": "tenno-tracker", "name": "Tenno Tracker", "url": "https://www.tennotracker.com/", "category": "worldstate", "platforms": ["web"] },
  { "slug": "cephalon-navis", "name": "Cephalon Navis", "url": "https://play.google.com/store/apps/details?id=com.cephalon.navis", "category": "apps", "platforms": ["android"] },
  { "slug": "genesis", "name": "Genesis (Cephalon Genesis)", "url": "https://genesis.warframestat.us/", "category": "bots", "platforms": ["discord", "web"], "openSource": true },
  { "slug": "rivenradar", "name": "RivenRadar", "url": "https://rivenradar.com/", "category": "riven", "platforms": ["web"] },
  { "slug": "warframe-reliquary", "name": "Warframe Reliquary", "url": "https://wf.xuerian.net/", "category": "farming", "platforms": ["web"], "caveat": "partial" },
  { "slug": "warframe-appraiser", "name": "Warframe Appraiser", "url": "https://warframeappraiser.com/", "category": "trading", "platforms": ["web"] },
  { "slug": "morrowshore-riven", "name": "Warframe Riven Appraiser (Morrow Shore)", "url": "https://morrowshore.com/tool/riven/", "category": "riven", "platforms": ["web"] },
  { "slug": "altair", "name": "Altair", "url": "https://empx.cc/", "category": "bots", "platforms": ["discord", "web"] },
  { "slug": "samodeus", "name": "Samodeus", "url": "https://top.gg/bot/333058936859000832", "category": "bots", "platforms": ["discord"] },
  { "slug": "frame-hub", "name": "Frame Hub", "url": "https://frame-hub.com/", "category": "builds", "platforms": ["web"] },
  { "slug": "semlar-comp", "name": "Semlar Riven Comparator", "url": "https://semlar.com/comp", "category": "riven", "platforms": ["web"] },
  { "slug": "wfm-price-history", "name": "WFM Price History (extension)", "url": "https://chromewebstore.google.com/detail/wfm-price-history/aejobloolfcoipjfbhflgnamhlnmhnlb", "category": "trading", "platforms": ["extension"], "openSource": true },
  { "slug": "de-worldstate", "name": "DE World State Protocol", "url": "https://api.warframe.com/cdn/worldState.php", "category": "api", "platforms": ["web"] },
  { "slug": "wfm-overlay", "name": "Warframe-Market-Overlay", "url": "https://github.com/JonathanSourdough/Warframe-Market-Overlay", "category": "trading", "platforms": ["windows", "overlay"], "openSource": true, "github": "JonathanSourdough/Warframe-Market-Overlay" },
  { "slug": "relic-finder", "name": "The Relic Finder", "url": "https://warframerelics.com/", "category": "farming", "platforms": ["web"] },
  { "slug": "wf-relic-tracker", "name": "Warframe Relic Tracker", "url": "https://www.wfrelictracker.com/", "category": "farming", "platforms": ["web"] },
  { "slug": "reframed", "name": "RE:FRAMED", "url": "https://reframed.site/", "category": "builds", "platforms": ["web"] },
  { "slug": "arsenyx", "name": "Arsenyx", "url": "https://www.arsenyx.com/", "category": "builds", "platforms": ["web"] },
  { "slug": "knightframe", "name": "KnightFrame", "url": "https://knightsaeterna.com/builds", "category": "builds", "platforms": ["web"] },
  { "slug": "cephalon-sauron", "name": "Cephalon Sauron", "url": "https://cephalon-sauron.de/stat-range", "category": "riven", "platforms": ["web"] },
  { "slug": "webutilitykit-riven", "name": "Riven Price Tracker (WebUtilityKit)", "url": "https://lab.webutilitykit.com/apps/RivenTracker/en/", "category": "riven", "platforms": ["web"] },
  { "slug": "relicarium", "name": "Relicarium", "url": "https://relicarium.vercel.app/", "category": "farming", "platforms": ["web"] },
  { "slug": "droptable-wf", "name": "droptable.wf", "url": "https://droptable.wf/", "category": "farming", "platforms": ["web"] },
  { "slug": "warframe-drops-pwa", "name": "Warframe Drops PWA", "url": "https://warframedrops.netlify.app/", "category": "farming", "platforms": ["web"] },
  { "slug": "warframe-drop-optimizer", "name": "Warframe Drop Optimizer", "url": "https://warframedrop.com/", "category": "farming", "platforms": ["web"] },
  { "slug": "warframe-helper", "name": "Warframe Helper", "url": "https://www.overwolf.com/app/azerpug-warframe_helper", "category": "apps", "platforms": ["overlay"] },
  { "slug": "framebuilder", "name": "FrameBuilder", "url": "https://framebuilder.pages.dev/", "category": "builds", "platforms": ["web"] },
  { "slug": "wondyframe", "name": "WondyFrame", "url": "https://discordbotlist.com/bots/wondyframe", "category": "bots", "platforms": ["discord"] },
  { "slug": "warbot", "name": "WarBot", "url": "https://github.com/PYROP3/WarBot", "category": "bots", "platforms": ["discord"], "openSource": true, "github": "PYROP3/WarBot" },
  { "slug": "odealo", "name": "Odealo", "url": "https://odealo.com/games/warframe/marketplace", "category": "trading", "platforms": ["web"], "caveat": "rmt" }
]
```

- [ ] **Step 2: Write the initial enriched file**

Create `app/app/data/tools.enriched.json` with `{}` (real data written by Task 4).

- [ ] **Step 3: Write the merged typed export**

```ts
// app/app/data/tools.ts
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
```

Note: this requires `resolveJsonModule` in the app tsconfig — Nuxt enables it by default, so no config change needed.

- [ ] **Step 4: Write a validation test for the source JSON**

```ts
// scripts/lib/toolsSource.test.ts
import { readFileSync } from 'fs'
import { join } from 'path'

const sources = JSON.parse(readFileSync(join(process.cwd(), 'app/app/data/tools.source.json'), 'utf8'))
const CATS = ['trading','database','worldstate','farming','riven','builds','apps','bots','api']
const PLATS = ['web','android','ios','windows','overlay','discord','extension']

describe('tools.source.json', () => {
  it('has unique slugs', () => {
    const slugs = sources.map((s: any) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('every record has valid category, platforms, and an http(s) url', () => {
    for (const s of sources) {
      expect(CATS).toContain(s.category)
      expect(Array.isArray(s.platforms) && s.platforms.length).toBeTruthy()
      for (const p of s.platforms) expect(PLATS).toContain(p)
      expect(s.url).toMatch(/^https?:\/\//)
    }
  })
  it('excludes the dead tools', () => {
    const names = sources.map((s: any) => s.name.toLowerCase())
    expect(names.some((n: string) => n.includes('riven.market'))).toBe(false)
    expect(names.some((n: string) => n.includes('price guide'))).toBe(false)
  })
})
```

- [ ] **Step 5: Run tests**

Run: `npx jest scripts/lib/toolsSource.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add app/app/data/tools.source.json app/app/data/tools.enriched.json app/app/data/tools.ts scripts/lib/toolsSource.test.ts
git commit -m "feat(tools): curated source list (52 tools) + merged typed export"
```

---

### Task 4: Run full enrichment

**Files:**
- Modify: `app/app/data/tools.enriched.json` (generated output — committed)

- [ ] **Step 1: Run enrichment against the full list**

```bash
SNUSBASE_TOKEN="$SNUSBASE_TOKEN" npm run enrich_tools   # token from .env / shell env, never inline
```

Expected: one console line per tool with `http=`, `age=`, `stars=`. Most `http=200/301/302`. Note any `http=0` or `4xx/5xx` — investigate the URL (fix in `tools.source.json` and re-run). Screenshots don't exist yet, so `verified` is false for all this pass — that's expected; Task 5 adds shots and re-runs.

- [ ] **Step 2: Sanity-check the output**

Open `app/app/data/tools.enriched.json`; confirm `warframe-market` shows `domain.ageYears` ~11 and known GitHub tools show `repo.stars`. Confirm no secrets are in the file.

- [ ] **Step 3: Commit the interim enrichment**

```bash
git add app/app/data/tools.enriched.json
git commit -m "chore(tools): enrichment pass — whois + github + liveness"
```

---

### Task 5: Capture + optimize screenshots

**Files:**
- Create: `app/scripts/tool-shots.mts`
- Create: `app/public/img/tools/*.webp` (one per verified tool)
- Modify: `app/app/data/tools.enriched.json` (re-run picks up screenshots)

- [ ] **Step 1: Write the WebP converter**

```ts
// app/scripts/tool-shots.mts
// Converts raw PNG captures in app/public/img/tools/_raw/<slug>.png
// to optimized WebP at app/public/img/tools/<slug>.webp, then removes the raw dir.
import { readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = join(process.cwd(), 'public/img/tools')
const RAW = join(OUT, '_raw')
mkdirSync(OUT, { recursive: true })
if (!existsSync(RAW)) { console.error('No _raw dir; capture PNGs first'); process.exit(1) }

for (const f of readdirSync(RAW).filter((f) => f.endsWith('.png'))) {
  const slug = f.replace(/\.png$/, '')
  await sharp(join(RAW, f)).resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 72 }).toFile(join(OUT, `${slug}.webp`))
  console.log(`webp ${slug}`)
}
rmSync(RAW, { recursive: true, force: true })
```

- [ ] **Step 2: Capture PNGs with Playwright (executor action)**

For each tool with `httpStatus` 2xx/3xx in `tools.enriched.json`, using the Playwright MCP tools:
`browser_navigate` → the tool's `url`; `browser_resize` to 1280×800; wait ~2s / `browser_wait_for` network idle; `browser_take_screenshot` saving to `app/public/img/tools/_raw/<slug>.png` (viewport shot, not full-page). For Play Store / Chrome Web Store / GitHub / Overwolf / top.gg / discordbotlist URLs, screenshot the store/repo page itself. Skip (leave unshot) any URL that fails to load or renders blank — that tool stays `verified:false`.

- [ ] **Step 3: Convert to WebP**

```bash
cd app && npx tsx scripts/tool-shots.mts
```

Expected: `webp <slug>` per capture; `_raw/` removed; `app/public/img/tools/*.webp` populated.

- [ ] **Step 4: Re-run enrichment so screenshots register + verified flips true**

```bash
cd .. && SNUSBASE_TOKEN="$SNUSBASE_TOKEN" npm run enrich_tools   # token from .env / shell env, never inline
```

Expected: tools with a WebP now show `shot=true` and `verified:true`.

- [ ] **Step 5: Commit**

```bash
git add app/scripts/tool-shots.mts app/public/img/tools app/app/data/tools.enriched.json
git commit -m "feat(tools): site screenshots (webp) + verified flags"
```

---

### Task 6: i18n — nav keys + page copy module

**Files:**
- Modify: `app/i18n/messages/nav.ts`
- Create: `app/i18n/messages/communityTools.ts`

**Interfaces:**
- Produces i18n keys: `nav.sections.resources`, `nav.items.communityTools`; `communityTools.hero.*`, `communityTools.stats.*`, `communityTools.sections.<category>`, `communityTools.card.*`, `communityTools.platform.<platform>`, `communityTools.caveat.rmt`, `communityTools.caveat.partial`, `communityTools.verified`, `communityTools.unverified`, `communityTools.visit`, `communityTools.openSource`.

- [ ] **Step 1: Add nav labels to all 13 locales**

In `app/i18n/messages/nav.ts`, for **each** locale block add `resources` to `sections` and `communityTools` to `items`. English:

```ts
        // sections:
        resources: 'Resources',
        // items:
        communityTools: 'Community Tools',
```

Use these translations (sections.resources / items.communityTools) per locale:
- es: `Recursos` / `Herramientas de la Comunidad`
- pt: `Recursos` / `Ferramentas da Comunidade`
- de: `Ressourcen` / `Community-Tools`
- fr: `Ressources` / `Outils communautaires`
- ru: `Ресурсы` / `Инструменты сообщества`
- ko: `리소스` / `커뮤니티 도구`
- ja: `リソース` / `コミュニティツール`
- zh-hans: `资源` / `社区工具`
- zh-hant: `資源` / `社群工具`
- pl: `Zasoby` / `Narzędzia społeczności`
- it: `Risorse` / `Strumenti della community`
- uk: `Ресурси` / `Інструменти спільноти`

- [ ] **Step 2: Create the page copy module (English; other locales fall back)**

```ts
// app/i18n/messages/communityTools.ts
export default {
  en: {
    communityTools: {
      hero: {
        eyebrow: 'Resources',
        title: 'The Warframe Tool Vault',
        lede: 'Every third-party Warframe tool worth using — verified working, dated, and rated. Trading, builds, drop data, rivens, world-state trackers, apps and bots.',
      },
      stats: { tools: 'Tools listed', openSource: 'Open source', verified: 'Verified live' },
      sections: {
        trading: 'Marketplaces & Trading',
        database: 'Wikis & Game Databases',
        worldstate: 'Live World State & Alerts',
        farming: 'Drop Tables & Farming',
        riven: 'Riven Tools',
        builds: 'Build Planners',
        apps: 'Desktop & Mobile Apps',
        bots: 'Discord Bots',
        api: 'Developer Data & APIs',
      },
      platform: {
        web: 'Web', android: 'Android', ios: 'iOS', windows: 'Windows',
        overlay: 'Overlay', discord: 'Discord', extension: 'Extension',
      },
      card: {
        established: 'Est. {year}',
        openSource: 'Open source',
      },
      caveat: {
        rmt: 'Real-money trading — against the Warframe EULA; ban risk.',
        partial: 'Partly maintained — live fissure data is frozen; use for wishlist/relic lookup.',
      },
      verified: 'Verified working',
      unverified: 'Not verified',
      visit: 'Visit',
      viewGithub: 'GitHub',
      viewStore: 'Store',
      disclaimer: 'Third-party tools are community-made and not affiliated with Digital Extremes or this site. Always follow the Warframe EULA.',
    },
  },
}
```

- [ ] **Step 3: Verify i18n integrity**

Run: `cd app && npm run i18n:check`
Expected: passes (or only reports the intentionally English-only `communityTools` keys as untranslated — that is acceptable per Global Constraints; nav keys must be present for all 13).

- [ ] **Step 4: Commit**

```bash
git add app/i18n/messages/nav.ts app/i18n/messages/communityTools.ts
git commit -m "feat(i18n): community-tools nav labels (13 locales) + page copy"
```

---

### Task 7: SEO entry

**Files:**
- Modify: `app/app/utils/seo.ts`

- [ ] **Step 1: Add the PAGE_SEO entry**

In `app/app/utils/seo.ts`, inside `PAGE_SEO`, add (alphabetical-ish, near `/timing`):

```ts
  '/tools': {
    title: 'Warframe Tools Directory — Best Community Apps & Sites',
    description:
      'The verified directory of the best third-party Warframe tools: trading, build planners, drop tables, riven calculators, world-state trackers, apps and Discord bots.'
  },
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npx nuxi typecheck`
Expected: no new errors from `seo.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/app/utils/seo.ts
git commit -m "feat(seo): /tools directory title + description"
```

---

### Task 8: The directory page

**Files:**
- Create: `app/app/pages/tools.vue`

**Interfaces:**
- Consumes: `TOOLS`, `TOOL_SECTIONS`, `toolsByCategory`, `ToolMeta` from `~/data/tools`; `useI18n`; dayjs (`import dayjs from 'dayjs'`, already a dep) for relative "updated" text.

- [ ] **Step 1: Write the page**

```vue
<!-- app/app/pages/tools.vue -->
<template>
  <div class="an ct">
    <article class="an-console">
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('communityTools.hero.eyebrow') }}</div>
          <h1 class="an-title">{{ t('communityTools.hero.title') }}</h1>
          <p class="an-lede">{{ t('communityTools.hero.lede') }}</p>
        </div>
      </header>

      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ TOOLS.length }}</div>
          <div class="an-stat__lbl">{{ t('communityTools.stats.tools') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">{{ openSourceCount }}</div>
          <div class="an-stat__lbl">{{ t('communityTools.stats.openSource') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ verifiedCount }}</div>
          <div class="an-stat__lbl">{{ t('communityTools.stats.verified') }}</div>
        </div>
      </div>

      <section v-for="sec in sections" :key="sec.key" class="ct-section">
        <div class="ct-section__title">{{ t('communityTools.sections.' + sec.key) }}</div>
        <div class="ct-grid">
          <article v-for="tool in sec.tools" :key="tool.slug" class="an-card ct-card" :class="{ 'is-top': tool.featured }">
            <div class="ct-card__shot">
              <img v-if="tool.screenshot" :src="tool.screenshot" :alt="tool.name" loading="lazy" width="1000" height="625" />
              <div v-else class="ct-card__shot--none">{{ tool.name }}</div>
              <span v-if="tool.verified" class="ct-verified" :title="t('communityTools.verified')">✓</span>
            </div>
            <div class="ct-card__body">
              <div class="ct-card__head">
                <h3 class="ct-card__name">{{ tool.name }}</h3>
                <span class="ct-plats">
                  <span v-for="p in tool.platforms" :key="p" class="an-chip ct-plat">{{ t('communityTools.platform.' + p) }}</span>
                </span>
              </div>
              <p class="ct-card__desc">{{ t('communityTools.desc.' + tool.slug) }}</p>

              <div v-if="tool.caveat === 'rmt'" class="ct-warn ct-warn--rmt">⚠ {{ t('communityTools.caveat.rmt') }}</div>
              <div v-else-if="tool.caveat === 'partial'" class="ct-warn ct-warn--partial">{{ t('communityTools.caveat.partial') }}</div>

              <div class="ct-meta">
                <span v-if="tool.domain?.created" class="ct-meta__i">
                  {{ t('communityTools.card.established', { year: yearOf(tool.domain.created) }) }}
                  <template v-if="tool.domain.ageYears != null"> · {{ tool.domain.ageYears }}y</template>
                </span>
                <span v-if="tool.repo" class="ct-meta__i" :class="{ 'is-stale': isStale(tool.repo.lastCommit) }">
                  ★ {{ tool.repo.stars }} · {{ rel(tool.repo.lastCommit) }}
                  <template v-if="tool.repo.archived"> · archived</template>
                </span>
                <span v-if="tool.openSource" class="ct-meta__i is-alt">{{ t('communityTools.card.openSource') }}</span>
              </div>

              <div class="ct-actions">
                <a class="ct-visit" :href="tool.url" target="_blank" rel="noopener nofollow">{{ t('communityTools.visit') }}</a>
                <a v-if="tool.github" class="ct-sub" :href="'https://github.com/' + tool.github" target="_blank" rel="noopener nofollow">{{ t('communityTools.viewGithub') }}</a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <v-alert class="an-disclaimer" type="info" density="compact">{{ t('communityTools.disclaimer') }}</v-alert>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { TOOLS, TOOL_SECTIONS, toolsByCategory } from '~/data/tools'

dayjs.extend(relativeTime)
const { t } = useI18n()

const openSourceCount = computed(() => TOOLS.filter((x) => x.openSource).length)
const verifiedCount = computed(() => TOOLS.filter((x) => x.verified).length)
const sections = computed(() =>
  TOOL_SECTIONS.map((s) => ({ key: s.key, tools: toolsByCategory(s.key) })).filter((s) => s.tools.length),
)

function yearOf(iso: string) { return new Date(iso).getUTCFullYear() }
function rel(iso: string) { return dayjs(iso).fromNow() }
function isStale(iso: string) { return dayjs().diff(dayjs(iso), 'month') >= 12 }

function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}
onMounted(() => finishLoading())
</script>

<style scoped>
.ct-section { padding: 8px 30px 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.ct-section__title { font-family: var(--font-display); font-size: 1.3rem; color: var(--gold-ink); margin: 22px 0 14px; }
.ct-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.ct-card { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.ct-card__shot { position: relative; aspect-ratio: 16 / 10; background: rgba(0, 0, 0, 0.35); overflow: hidden; }
.ct-card__shot img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }
.ct-card__shot--none { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ink-dim); font-family: var(--font-hud); padding: 10px; text-align: center; }
.ct-verified { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: var(--energy); color: #06201f; font-weight: 800; clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px); }
.ct-card__body { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.ct-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.ct-card__name { font-family: var(--font-display); color: var(--ink); font-size: 1.06rem; margin: 0; }
.ct-plats { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.ct-plat.an-chip { font-size: 0.62rem !important; padding: 1px 7px !important; }
.ct-card__desc { color: #cdd2e4; font-size: 0.88rem; line-height: 1.5; margin: 0; flex: 1; }
.ct-warn { font-size: 0.78rem; line-height: 1.4; padding: 7px 10px; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.ct-warn--rmt { background: rgba(217, 138, 138, 0.14); border: 1px solid rgba(217, 138, 138, 0.5); color: #f0d2d2; }
.ct-warn--partial { background: rgba(200, 168, 92, 0.1); border: 1px solid var(--orokin-line); color: #ece4d0; }
.ct-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; font-family: var(--font-hud); font-size: 0.74rem; color: var(--ink-dim); }
.ct-meta__i.is-alt { color: var(--energy); }
.ct-meta__i.is-stale { color: var(--rose); }
.ct-actions { display: flex; gap: 8px; margin-top: 4px; }
.ct-visit { flex: 1; text-align: center; font-family: var(--font-hud); font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; font-size: 0.82rem; color: #17130a; background: var(--orokin); text-decoration: none; padding: 9px 14px; clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
.ct-visit:hover { background: var(--gold-ink); }
.ct-sub { font-family: var(--font-hud); font-size: 0.82rem; color: var(--gold-ink); text-decoration: none; padding: 9px 12px; border: 1px solid var(--orokin-line); }
.ct-sub:hover { background: rgba(200, 168, 92, 0.12); }
@media (max-width: 600px) { .ct-section { padding-left: 16px; padding-right: 16px; } .ct-grid { grid-template-columns: 1fr; } }
</style>
```

Note on descriptions: the card renders `t('communityTools.desc.' + tool.slug)`. Add a `desc` object **inside** `communityTools` (i.e. `en.communityTools.desc.<slug>`) with the English tool descriptions (source them from `scratchpad/wf_curated.json`). Keep each ~1 sentence. (These are content, not chrome — English-only is fine; fallback covers other locales.)

- [ ] **Step 2: Add the `communityTools.desc.<slug>` block**

In `app/i18n/messages/communityTools.ts`, inside the `en.communityTools` object add a `desc` object mapping every slug in `tools.source.json` to its one-line description (from `wf_curated.json`). Example entries:

```ts
      desc: {
        'warframe-market': 'The dominant player-to-player marketplace for prime parts, sets, mods, rivens and relics, with live buy/sell orders and price stats.',
        'overframe': 'The largest community build hub: in-browser arsenal builder, live DPS math, a searchable item database, and community-voted tier lists.',
        // ... one line per slug (52 total)
      },
```

- [ ] **Step 3: Typecheck + drive the page**

Run: `cd app && npx nuxi typecheck` — expect no errors.
Then start the app and drive it (use the `run` skill / dev server on port 3312) → open `/tools`. Confirm: sections render, cards show screenshots + domain age + GitHub stars + verified tick, Odealo shows the RMT warning, Reliquary shows the partial caveat, Visit opens in a new tab.

- [ ] **Step 4: Commit**

```bash
git add app/app/pages/tools.vue app/i18n/messages/communityTools.ts
git commit -m "feat(tools): /tools community directory page (Orokin cards)"
```

---

### Task 9: Nav wiring

**Files:**
- Modify: `app/app/layouts/default.vue`

- [ ] **Step 1: Add the nav link**

In the `navLinks` array (after the `endoGuide` entry), add:

```ts
  { to: '/tools', key: 'communityTools', icon: 'mdi-tools', group: 'Resources' },
```

- [ ] **Step 2: Register the section**

In `SECTION_KEYS`, add:

```ts
  Resources: 'resources',
```

And in the `drawerSections` `order` array, append `'Resources'`:

```ts
  const order: (string | null)[] = [null, 'Prices', 'Analytics', 'Tools', 'Guides', 'Resources']
```

- [ ] **Step 3: Drive the nav**

Start the app; open the drawer. Expect a new **Resources** section with **Community Tools** linking to `/tools`; active-state highlights when on the page.

- [ ] **Step 4: Commit**

```bash
git add app/app/layouts/default.vue
git commit -m "feat(nav): Resources section + Community Tools link"
```

---

## Self-Review

**Spec coverage:**
- Directory page + 9 categories → Tasks 3, 8. ✅
- Per-tool screenshot / domain age / GitHub maintenance / verified badge → Tasks 1,2,4,5,8. ✅
- Baked data, token server-side → Tasks 1,2 (env-only). ✅
- Play Store / apps / bots included → Task 3 source list. ✅
- Odealo RMT warning, Reliquary caveat, dead-tool exclusions → Task 3 + Task 8 rendering + Task 3 test. ✅
- Nav Resources / i18n 13-locale nav / SEO → Tasks 6, 7, 9. ✅
- **Phase 2 (live World State + Semlar riven)** → intentionally NOT in this plan (separate plan per spec §9). ✅

**Placeholder scan:** the only deliberate "fill many entries" step is the `desc.<slug>` block (Task 8 Step 2) — content sourced verbatim from `wf_curated.json`, not a code placeholder. No `TODO`/`TBD`/"add error handling" left.

**Type consistency:** `ToolMeta`/`ToolSource`/`ToolEnriched` defined in `scripts/lib/toolEnrich.ts` (Task 1) and mirrored in `app/app/data/tools.ts` (Task 3) — same field names/types. `verified`/`httpStatus`/`domain.ageYears`/`repo.stars`/`screenshot` used consistently across script, data, and page. Category enum (9 values) identical in helper, data, `TOOL_SECTIONS`, and i18n `sections.*`.

## Notes for the executor

- The app is `"type":"module"` (tsx/nuxt); the root scripts are CommonJS (ts-node). The two share data only through JSON files (never TS imports across the boundary).
- WFCD / Cloudflare hosts 403 named crawler UAs but 200 a normal Chrome UA — the enrichment script already sends one. If any `http=403` appears for a WFCD host, that's the bot filter, not a dead site; screenshot still proves liveness.
- Re-running enrichment is idempotent; commit its output.
