# Warframe Community Tools Guide — Design Spec

**Date:** 2026-07-17
**Route:** `/tools` (new nav section **Resources**)
**Status:** Design — awaiting spec review before implementation planning

## 1. Goal

Build the definitive, trustworthy directory of third‑party Warframe tools (the "ultimate tool guide") on our market‑analytics site, and wire the highest‑value external data into the product itself where the source's license/ToS allows.

Every listed tool must be **verified working** and carry evidence a Tenno can trust:

- what it does (description) + category + supported platforms
- a **real screenshot** of the site
- **how old / how alive it is** — domain age (whois) and, for open‑source tools, GitHub maintenance signals
- a **verified‑working** badge (only tools that pass an automated liveness check ship live)

Backed by deep research: 54 tools discovered across 8 ecosystem slices, 24 deep‑dived for integration feasibility, licensing, and ToS. Research artifacts: `scratchpad/wf_report.md`, `wf_curated.json`, `wf_assessments.json`.

## 2. Approach (chosen)

**Static‑baked data + live crawl/proxy for the two data layers ToS allows.**

- Tool facts (description, category, platforms, whois, GitHub, screenshot path, verified flag) are **baked into committed data** by a build‑time enrichment script. Fast SSR, SEO‑crawlable, and the snusbase whois token never reaches the client bundle. Re‑run the script to refresh.
- Only genuinely live data is proxied at runtime through the existing backend (Redis‑cached), matching the current `server.getJsonCache(...)` pattern.

Rejected: fully‑dynamic per‑request whois/GitHub (slow, token at runtime, rate‑limit risk); links‑only (user explicitly asked for live integration).

## 3. Curation decisions

Include only verified, maintained, player‑useful tools. From the 54 researched:

- **Exclude — dead:** `Riven.market` (riven DB returns 0 for every filter, auctions never shipped, backend frozen since 2018/2023) and `Semlar Riven Price Guide` (backing feed `10o.io/pricehistory.json` returns `[]`; genuine sunset). Listing either sends users to an empty/broken page — the opposite of a trustworthy guide.
- **Include with a warning badge:** `Odealo` (real‑money trading of items/plat). Card carries a prominent `⚠ RMT — against the Warframe EULA, ban risk` badge so users see the risk plainly. (Reviewer chose to list it warned rather than exclude.)
- **Include with caveat:** `Warframe Reliquary` — static relic/wishlist lookup works, but its live‑fissure highlighting has been frozen since 2026‑02‑02. Card notes "wishlist/relic lookup" and omits the fissure claim.
- **Everything else** that passes the liveness gate is included, grouped by the section taxonomy below. A tool that fails the automated HTTP/liveness check at build time is dropped (or held back) rather than shipped as a dead link.

## 4. Directory taxonomy (page sections)

Ordered by importance; canonical/most‑used first within each section (popularity rank from research).

1. **Marketplaces & Trading** — Warframe Market, Quantframe, Warframe Appraiser, WFM Price History (extension), Warframe‑Market‑Overlay
2. **Wikis & Game Databases** — Official WARFRAME Wiki, Fandom Wiki, browse.wf, `@wfcd/items`, warframe‑drop‑data, warframe‑public‑export‑plus
3. **Live World State & Alert Trackers** — Warframe Hub, Tenno Tools, Tenno Tracker
4. **Drop Tables & Farming Planners** — Official DE Drop Tables, drops.warframestat.us, WFInfo, Warframe Reliquary, The Relic Finder, Warframe Relic Tracker, droptable.wf, Warframe Drops PWA, Warframe Drop Optimizer, Relicarium
5. **Riven Tools** — Semlar Riven Calculator, RivenRadar, Warframe Riven Appraiser (Morrow Shore), Semlar Riven Comparator, Cephalon Sauron, Riven Price Tracker (WebUtilityKit)
6. **Build Planners & Theorycrafting** — Overframe, Underframe, Warframe Builder, Frame Hub, Arsenyx, KnightFrame, RE:FRAMED, FrameBuilder
7. **Desktop & Mobile Companion Apps** — AlecaFrame, **Warframe Companion (Official, Play Store/iOS)**, Cephalon Navis (Play Store), Warframe Helper (Overwolf)
8. **Discord Bots** — Genesis, Altair, Samodeus, WondyFrame, WarBot
9. **Developer Data Sources & APIs** — warframestat.us, DE Public Export, DE World State Protocol, warframe‑worldstate‑parser

## 5. Data model

Two committed files, separated so the enrichment script never clobbers hand edits:

- `app/app/data/tools.ts` — **hand‑authored** list: `slug`, `name`, `url`, `category`, `platforms`, `openSource`, `github`, `featured`, `caveat`.
- `app/app/data/tools.enriched.json` — **script‑generated**, keyed by `slug`: `verified`, `httpStatus`, `screenshot`, `domain`, `repo`, `enrichedAt`. A tiny helper merges the two at import time into the full `ToolMeta`.

One typed record per tool. Facts only; display copy is i18n (§8).

```ts
export type ToolCategory =
  | 'trading' | 'database' | 'worldstate' | 'farming'
  | 'riven' | 'builds' | 'apps' | 'bots' | 'api'
export type Platform = 'web' | 'android' | 'ios' | 'windows' | 'overlay' | 'discord' | 'extension'

export interface ToolMeta {
  slug: string            // stable key; also i18n key + screenshot filename
  name: string            // proper name (not localized)
  url: string             // canonical / deep-linkable homepage
  category: ToolCategory
  platforms: Platform[]
  openSource?: boolean
  github?: string         // owner/repo when applicable
  featured?: boolean      // canonical tools pinned to top
  caveat?: 'partial' | 'rmt' | null   // 'partial' = Reliquary frozen fissures; 'rmt' = Odealo real-money warning

  // --- baked by scripts/enrich-tools.ts (do not hand-edit) ---
  verified: boolean       // HTTP liveness passed at last enrichment
  httpStatus?: number
  screenshot?: string     // /img/tools/<slug>.webp (committed)
  domain?: {              // from snusbase whois; null fields where TLD omits them
    created?: string | null
    ageYears?: number | null
    registrar?: string | null
    expires?: string | null
  }
  repo?: {                // from GitHub API when github set
    stars?: number
    lastCommit?: string   // ISO
    archived?: boolean
    openIssues?: number
  }
  enrichedAt?: string     // ISO stamp of last enrichment run
}
```

Localized description/tagline live in i18n keyed by `slug`, not here.

## 6. Enrichment pipeline (build‑time, server‑side)

`scripts/enrich-tools.ts` — run manually / in CI, never in the client. Reads the hand‑authored `tools.ts` list and writes **only** `app/app/data/tools.enriched.json` (never touches the hand‑authored file). Steps per tool:

1. **Liveness** — `HEAD`/`GET` the URL with a normal Chrome UA (WFCD/Cloudflare hosts 403 named bots but 200 a normal UA — mirror the existing `DropService` UA + raw‑GitHub fallback). Record `httpStatus`, set `verified` = 2xx/3xx. Play Store / Chrome Web Store URLs are checked as store pages.
2. **Whois** — POST snusbase `tools/domain-whois` (auth header from `process.env.SNUSBASE_TOKEN`; **never** committed). Batch multiple domains per request (API accepts a `terms` array). Extract `date.created`, `registrar.name`, `date.expires`; compute `ageYears`. TLDs without RDAP dates (`.gg`, some others) leave `created` null → fall back to GitHub repo creation date or archive.org first‑seen (best‑effort; null is acceptable and the UI degrades gracefully).
3. **GitHub** — for `github`‑backed tools, GitHub REST `repos/{owner}/{repo}` → stars, `pushed_at` (last commit), `archived`, `open_issues_count`. Unauthenticated is fine at this volume; optional `GITHUB_TOKEN` for headroom.
4. Stamp `enrichedAt`; write the merged data.

Token handling: `SNUSBASE_TOKEN` (and optional `GITHUB_TOKEN`) read from env only. Add to `.env`/deploy secrets, never to the repo or the client bundle.

## 7. Screenshot pipeline

Real screenshots, captured once, committed and served from `app/public/img/tools/<slug>.webp`.

- Capture with Playwright (already an MCP tool in this environment): navigate desktop viewport (~1280×800), wait for network idle, full above‑the‑fold screenshot.
- Optimize to WebP (~1000px wide, quality ~70) to keep the repo/page light; lazy‑load in the grid.
- For store/GitHub/Overwolf entries where a homepage shot is meaningless, capture the store/repo page itself.
- A tool with no clean screenshot (blocked, blank) is treated like a failed liveness check — held back, not shipped broken.

*(Capture happens during implementation, after this spec is approved; the mechanism is fixed here.)*

## 8. Page implementation

`app/app/pages/tools.vue` — Orokin design system (`.an-*` from `analytics.css` + scoped `.ct-*`), mirroring `pages/guides/endo.vue`.

- **Hero** — title/lede: "Every Warframe tool worth using, verified and dated." Live counts: N tools, M open‑source, all verified.
- **Live World State strip** (see §9) — a thin Orokin band at the top: current Baro status, active fissure count, Cetus/Vallis/Cambion day‑night — proof the page is *live*, deep‑linking to the World State page.
- **Category sections** — each section header + responsive card grid.
- **Tool card** — screenshot thumb; name + category + platform chips; localized description; a meta row with **domain age** ("Est. 2014 · 11 yrs"), **maintenance** ("★ 1.2k · updated 3 days ago" or "⚠ stale · last commit 2023"), and a green **Verified** tick; primary **Visit** button (`rel="noopener nofollow"`, marked as leaving) deep‑linked where a pattern exists (e.g. Wiki `/w/{ItemName}`, Overframe `/search/?query=`); secondary **GitHub** / **Play Store** links where relevant.
- SSR‑rendered from baked data (no client fetch for the directory); the World State strip hydrates from the live endpoint.
- Hide `#spinner-wrapper` on mount (project rule).

## 9. Live integrations — **Phase 2 (fast follow)**

Build order (reviewer's call): **Phase 1** ships the verified directory page (§5–§8, §10 nav/i18n/SEO for `/tools`, §11 verification). **Phase 2** — this section — adds the two live layers as a fast follow, each detailed enough here to become its own implementation plan.

Two runtime‑live data layers, both crawl/proxy where ToS allows:

### 9a. Live World State layer  `api · high value`
- **Backend:** `server.getJsonCache('worldstate/:platform', …)` on the Warframe class. Source‑of‑truth: DE `https://api.warframe.com/cdn/worldState.php` parsed via `warframe-worldstate-parser` (npm); **fallback** `https://api.warframestat.us/{platform}/{locale}`. Cache 120s (matches upstream `max-age`). Note: the old `content.warframe.com/dynamic/worldState.php` URL is dead (404) — use the `api.warframe.com/cdn/` host; content‑type is mislabeled `text/html`, parse as JSON.
- **Frontend:** a new Orokin **World State** page (fissures, sortie, archon hunt, invasions, Nightwave, Baro, open‑world cycles) + the compact strip on `/tools`. `?language=` maps 1:1 to our 13 locales.
- **Seamless deep integrations** (the "into the site" part): overlay **active relic‑tier fissures** onto `/relic-farming` + `/relics-value` (tells users where to crack the relics we already value), and a **Baro ducat→plat** widget cross‑referencing `voidTrader` inventory against our live plat prices (fits `/ducats` + `/endo`). Attribution to DE + WFCD.

### 9b. Semlar riven stat‑range  `crawl · high value`
- **Crawl (daily, baked into cache/store):** `https://semlar.com/riven_weapon_data.json` (~27KB) + `https://10o.io/rivens/rivencalc.json` (~70KB, open CORS). Merge on UPPERCASE weapon name. No ToS found; light caching + courtesy attribution + optional "Verify on Semlar" deep‑link.
- **Frontend:** a `useRivenStatRange(weapon, rank, buffCount, curseCount)` composable (mirrors `useRelicValue`/`useEndoValue`), rendering an authoritative **Riven Stat Range** panel on `/riven-value` (and `/flip` riven rows). We reimplement the small formula ourselves (base × disposition × buff/curse multiplier × rank scaling × 0.9–1.1) — zero request‑time dependency.

**Deferred to a phase‑2 sub‑project** (noted, not built now): the `@wfcd/items` catalog enrichment (a daily pm2 sync mirroring `sync_translations` into a `warframe-catalog` Mongo collection for stats/ducats/images/i18n) and the outbound Wiki/Overframe deep‑link action row on item pages. High value, but each is its own spec.

## 10. Wiring

- **Nav** ([layouts/default.vue](../../app/app/layouts/default.vue)): add `Resources` to `SECTION_KEYS` + the `drawerSections` order array, and nav links `{ to:'/tools', key:'communityTools', icon:'mdi-tools', group:'Resources' }` (+ `{ to:'/worldstate', key:'worldState', icon:'mdi-earth', group:'Resources' }`).
- **i18n**: `nav.sections.resources` + `nav.items.communityTools` (+ `worldState`) added to all 13 locales in [nav.ts](../../app/i18n/messages/nav.ts); new module `app/i18n/messages/communityTools.ts` (page copy + per‑tool `slug` description/tagline) across 13 locales, English fallback covering any gaps.
- **SEO**: `PAGE_SEO['/tools']` (+ `/worldstate`) in [seo.ts](../../app/app/utils/seo.ts); default OG card.

## 11. Verification ("100% sure it's working")

- **Inclusion gate:** a tool ships live only if enrichment recorded a 2xx/3xx `httpStatus` **and** a clean screenshot exists. Dead/blocked → dropped or held.
- I present the **verified tool list** (with per‑tool status, domain age, GitHub state, screenshot) for your review before the page is built out.
- Post‑build: drive `/tools`, `/worldstate`, and the deep‑linked pages in a browser; confirm the live World State strip populates and riven stat‑range renders; spot‑check outbound deep‑links resolve.

## 12. Out of scope / follow‑ups

- `@wfcd/items` catalog sync + Wiki/Overframe item‑page deep‑links (phase‑2 spec).
- Porting the WFM Price History extension's MIT forecast + liquidity math onto our series (separate, touches `/screener` `/movers` `/flip`).
- Any ingestion of NonCommercial‑licensed Wiki content or Cloudflare‑reserved Overframe data (deep‑link only — hard ToS line).

## 13. Risks

- **Licensing:** Official Wiki is CC BY‑NC‑SA (NonCommercial) for post‑2025‑01‑31 revisions — deep‑link only, never ingest. Overframe reserves reuse (Cloudflare pay‑per‑crawl + TDM opt‑out) — redirect only, no iframe (X‑Frame‑Options DENY). Warframe Market: 3 req/s cap, must add value beyond mirroring, exact trade‑message format — already our posture.
- **Whois coverage:** some TLDs omit creation dates; UI degrades gracefully (shows registrar/age where available, hides when not).
- **Screenshot drift:** sites redesign; screenshots are refreshed by re‑running the pipeline (documented, not automatic).
- **DE fan policy:** stay non‑commercial in posture, attribute DE + WFCD, no paywall, no DE logos/asset resale. Passive advertising is permitted.
