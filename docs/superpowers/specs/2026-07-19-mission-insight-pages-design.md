# Mission Insight Pages — `/mission`, wiki connection, and drop-data fixes

**Date:** 2026-07-19
**Status:** Design — approved, awaiting spec review

## Problem

The `DropLocationsDialog` shows *where* an item drops (e.g. `Duviri › Endless: Repeated
Rewards (Hard)`) but nothing about that place: how you unlock it, how hard it is, whether it
is worth farming. A player looking at "DUVIRI · Hard · 14%" has no path from the dialog to
understanding it. There is no owned content connecting a drop source to actionable insight.

Two data defects surfaced while scoping this and are folded in because they corrupt the very
rows this feature exposes:

1. **WFCD parser bug — phantom rows.** `Duviri/Endless: Repeated Rewards (Hard)` reports 62
   rewards summing to 600%. It is six concatenated drop tables: block 1 (11 items) is the real
   node; blocks 2–6 are the `Recall: Ten-Zero` anniversary event, mis-attributed. Root cause is
   upstream (`WFCD/warframe-drop-data` `lib/utils.js parseLocation()` returns `undefined` for a
   `<th>` header without a `/`, and `lib/missionRewards.js` never resets `location`, so every
   event row is appended to the last real node). Effect in our app: **406 byte-identical phantom
   mission entries** out of 10,309, five duplicate `Ayatan Cyan Star @ 14.29%` rows in the
   dialog, and inflated star-chart plat/run (a 5×-listed reward contributes 5× its EV).

2. **Dead wiki host.** `app/app/utils/wikiLinks.ts` links to `warframe.fandom.com/wiki/`. The
   wiki migrated to `wiki.warframe.com/w/` on 2025-01-31; Fandom is a stale fork returning 403.
   Every wiki link on the site is broken.

## Goal

Ship `/mission` (hub) and `/mission/<slug>` (detail) pages, data-driven from WFCD, that lead
with farm economics ("is this worth farming?") and answer access ("how do I get here?") via a
small baked, fact-checked notes layer. Make every dialog drop-row a link into the matching
page. Fix the two defects above app-wide.

**Non-goals (YAGNI):** wiki scraping; tilesets (wiki-only data); node-name localization in v1
(English display; WFCD locale files can be added later, free); enemy-level tables for
Railjack/Proxima beyond a generic note; editing WFCD upstream.

## Decisions (from brainstorming)

- **Shape:** full `/mission` pages + dialog deep-links (not dialog-only, not link-only).
- **Knowledge source:** hybrid — WFCD machine data + baked curated access notes.
- **Page purpose:** "Should I farm here?" leads; access/enemy data is secondary context.
- **Wiki data:** **WFCD-only.** The richest fields (tileset, unlock text, node graph) live only
  in the wiki's Lua module, whose `robots.txt` blocks `?action=` and named AI crawlers — we do
  not scrape it. Gaps are filled by our curated notes instead.
- **Bug fixes:** fix **both** the parser bug and the wiki host in this effort (they corrupt
  existing pages, not just the new ones).
- **Page universe:** **one page per `(planet, location)` drop key** (~445), graceful
  degradation. Real star-chart nodes (~269, join `Node.json`) render the full farm+access
  panel; activities (Circuit tiers, Sanctuary Onslaught, The Index, Proxima) render available
  data + curated note + cross-links. Thin pages (no valuable rewards **and** no curated note)
  get `robots: noindex` to avoid programmatic thin-content penalties.

## Data sources (faithful, WFCD-only)

| Data | Source | Used for |
|------|--------|----------|
| Reward tables by planet/node/rotation | existing `warframe-drops` collection (parser-bug fixed) | reward table + plat EV |
| Node faction / mission type / enemy levels | `raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Node.json` (269) | node facts panel, hub columns |
| Node name / faction / type (superset, incl. Proxima) | `.../WFCD/warframe-worldstate-data/master/data/solNodes.json` (452) | join + fallback facts |
| Steel Path enemy levels | **derived** `+100` (`+50` Archwing/Railjack, `+20` Duviri landscape) | SP level range (no SP node data exists) |
| Access / "how to get here" | **baked** `app/app/data/missionNotes.ts` (English, fact-checked) | unlock path, tips, related links |
| Freshness | `.../WFCD/warframe-drop-data/master/data/info.json` `modified` | "drop data as of …" banner |

**Join key:** `missionRewards` `(planet, location)` → `Node.json` by `systemName === planet &&
name === location`; `uniqueName` (`SolNodeNNN`) is the stable id. No join → activity page.

**`Node.json` enum decode** (join to `solNodes` to confirm): `systemIndex`→planet,
`factionIndex` (0 Grineer, 1 Corpus, 2 Infested, 3 Corrupted, 5 Sentient, 7 The Murmur, 8
Scaldra, 9 Techrot, 10 Duviri/Dax), `missionIndex`→mission type. These are stored decoded at
sync time so the frontend never sees an index.

## The parser-bug fix (block-split)

In `DropService.normalizeRotations`, the flat-array branch currently keeps the whole array. New
behaviour — a pure, deterministic block-split:

1. Walk the array accumulating `chance`. Close a block when the running sum reaches ~100
   (`>= 99.5`, tolerance for WFCD rounding, e.g. 99.99).
2. If the array yields **more than one** closed block, it is a mis-concatenation (the parser
   bug) → **keep only block 1**. A clean non-rotational table is a single block and is kept
   whole. Any trailing remainder after the last full block, when >1 block existed, is dropped
   with the event tables.
3. As a belt-and-suspenders, dedup exact `(itemName|rarity|chance)` tuples within the kept set.

This is extracted as `DropService.splitFirstDropTable(rewards)` so it unit-tests without a DB.
Rotational (`{A,B,C}`) tables are untouched — the bug only affects flat arrays. Fix flows
through `buildIndex` (removes phantom index entries), `enrichMap` (corrects plat/run), and
`lookupItem` (removes duplicate dialog rows) with no further changes.

Steel Path stays keyed off `gameMode === "Hard"`, **never** the `(Hard)` name suffix — the
suffix is only a collision de-dup marker, so `Endless: Tier 2/7/8` are Hard with no suffix.

## The wiki-host fix

`app/app/utils/wikiLinks.ts`:

- `WIKI_BASE = 'https://wiki.warframe.com/w/'` (was `warframe.fandom.com/wiki/`).
- `INTERACTIVE_MAPS` paths (`Map:Plains_of_Eidolon` …) are Fandom-only; on the new wiki the
  open-world articles are plain pages, so `worldWikiMap` targets the article (e.g.
  `/w/Plains_of_Eidolon`) or is dropped where no equivalent exists. Verify each of the four
  against the new host before shipping; drop any that 404.
- `ARTICLE_OVERRIDES` re-verified against `wiki.warframe.com` (`The_Void`, `Zariman_Ten_Zero`,
  `Sanctuary_Onslaught`, `Deimos` still hold).
- **Node deep-links use a disambiguated title, not the bare node name** — 22 node names collide
  with items/frames on the wiki (`/w/War` → weapon, `/w/Titania` → frame). MissionService stores
  a `wikiLink` per node (bare name, plus a `(Node)` suffix for the known-collision set derived
  from `Node.json`); the mission page links `wiki.warframe.com/w/${wikiLink}`.

## Architecture

Three units, each independently testable.

### 1. Backend — `MissionService` + node sync

- **Collection:** reuse `warframe-drops` (schema `{ key: String unique }`, `strict:false`). Add
  one doc `{ key: 'nodes', updatedAt, count, nodes: INodeMeta[] }`. No new collection.
- **`services/MissionService.ts`** (constructor `(db, httpClient)`, mirrors `DropService`).
  Static pure builders (DB-free, unit-tested):
  - `slugFor(planet, location)` — `kebab(planet + ' ' + location)`, e.g.
    `duviri-endless-repeated-rewards-hard`. `(planet, location)` is unique (verified: no planet
    dupes, location keys unique per planet), so slugs are unique.
  - `normalizeNodes(rawNodeJson, rawSolNodes)` — decode enums, join, produce `INodeMeta`.
  - `joinNode(planet, location, nodesIndex)` — returns `INodeMeta | null`.
  - `deriveSteelPath(min, max, category)` — SP level range.
  - `buildMissionList(enrichedPlanets, nodesIndex, notes)` — hub rows + `indexable` flag.
  - `buildMissionDetail(slug, enrichedPlanets, nodesIndex, note)` — one page's full payload.
  - Instance: `syncNodes()` (fetch Node.json + solNodes via injected anti-detection client with
    raw-GitHub mirror fallback, replace the `nodes` doc; last-good survives a WFCD outage),
    `getMissionList()`, `getMissionDetail(slug)`.
- **`INodeMeta`:** `{ uniqueName, slug, planet, location, faction, missionType, minLevel,
  maxLevel, wikiLink }`.
- **`BaseWarframeClient`:** build `missionService` in the constructor; delegate `getMissionList()`,
  `getMissionDetail(slug)`, `syncNodes()`.
- **`services/DropService.ts` `lookupItem`:** add `slug: MissionService.slugFor(planet, location)`
  to each mission entry it returns, so `DropData.missions[]` carries a `slug`.
- **Endpoints (`server.ts`):**
  - `GET /missions` → `getJsonCache` → `m.getMissionList()`
  - `GET /mission/:slug` → `getJsonCache` → `m.getMissionDetail(slug)` (slug is `[a-z0-9-]+`,
    whitelisted before use — the cache key is `req.originalUrl`)
  - `GET /build_nodes` → `getJsonProtected` → `m.syncNodes()`
- **`sync_nodes.ts`** (mirrors `sync_drops.ts`): `import "./env"` → connect → `new
  WarframeUndici(...)` → `m.syncNodes()` → exit. Registered `"sync_nodes": "ts-node
  sync_nodes.ts"`. User schedules it.
- **`CacheWarmer` `DEFAULT_WARM_PATHS`:** add `/missions`.

**Detail payload shape (`/mission/:slug`):**

```jsonc
{ slug, planet, location, gameMode, isEvent,
  node: { faction, missionType, minLevel, maxLevel,
          steelPath: { minLevel, maxLevel } | null, wikiLink } | null,   // null = activity
  rotations: [ { rotation: 'A'|'B'|'C'|null,
                 rewards: [ { itemName, url_name, thumb, rarity, chance, price, ev, tradeable } ] } ],
  bestValue: number,            // best rotation's Σ EV — the "should I farm" headline
  indexable: boolean,           // false => page emits robots:noindex
  freshness: { modified: ISO } }
```

The curated note is merged **client-side** from the baked file (keeps the note layer in the
frontend, next to `data/circuit.ts` / `data/toolResearch.ts`, and off the API).

### 2. Curated notes — `app/app/data/missionNotes.ts`

Baked, English, fact-checked from the research in this spec. Keyed by slug OR by a matcher
(planet + gameMode pattern, so all Duviri Hard tiers share one note). Shape:

```ts
interface MissionNote {
  category: 'node' | 'circuit' | 'onslaught' | 'index' | 'proxima'
  access: string          // "How to get here" prose (unlock path, prerequisites)
  tips?: string[]         // farming tips
  related?: { label: string; to: string }[]   // internal links: /circuit, /guides/steel-path, …
}
```

v1 coverage: the activities (Duviri Circuit normal + hard, Sanctuary/Elite Onslaught, The
Index, a generic Proxima note) + the top ~20 farm nodes. Everything else renders pure data with
no note (and is `noindex` if it also has no valuable rewards). Example — Duviri Hard Circuit
note carries: unlock = Duviri Paradox quest + base Steel Path unlock + three Duviri nodes
cleared in normal; structure = weekly Tier ladder, Tier 11+ re-rolls the Repeated-Rewards pool
every 1,400 progress; `related` → `/circuit`, `/guides/duviri`, `/guides/steel-path`.

### 3. Frontend — `pages/mission/[[slug]].vue` (`.an ms`)

Optional catch-all so `/mission` is the hub and `/mission/<slug>` the detail (mirrors
`relic/[[relic]].vue`). SSR-rendered (no `<client-only>`) for SEO. Hides `#spinner-wrapper` on
mount via the bounded-retry `finishLoading()`.

- **Hub (no slug):** `useAsyncData('missions', $fetch /missions)`. Searchable/filterable table
  grouped by planet: node · mission type · faction · enemy level · best plat/run. Rows link to
  detail. Hero stats: richest node, best activity, count. `.an-*` console styling.
- **Detail (slug):** `useAsyncData(() => \`mission-${slug}\`, $fetch /mission/${slug}, { watch:
  [slug] })`, shape-validated (the cache wrapper answers a failed producer with `200 { error }`).
  Layout, farm-first:
  1. Hero — node name, planet, `bestValue` plat/run verdict, gameMode/SP badge.
  2. Reward table — rotations, per-item thumb/plat/EV/rarity; each item row opens
     `DropLocationsDialog` ("where else does this drop").
  3. Node facts — faction, mission type, enemy level range, derived SP range (or "Activity — no
     fixed star-chart node" for un-joined).
  4. **How to get here** — the curated `access` prose + `tips` + `related` internal links.
  5. Footer — `wiki.warframe.com/w/${wikiLink}` deep link + freshness date.
  - Unknown/dataless slug → in-page soft not-found (like `/relic`), not HTTP 404.
  - `indexable === false` (or no note + no value) → `useHead({ meta:[{ name:'robots',
    content:'noindex' }] })`.

**Dialog wiring (`DropLocationsDialog.vue`):** the "Drops directly at" row (`.dld__place`)
becomes `<NuxtLink :to="localePath('/mission/' + m.slug)">` when `m.slug` is present. `DropMission`
gains `slug?: string`. Block-split already removed the phantom duplicate rows.

**Star-chart (light touch):** node rows in `/star-chart` and `/star-chart-3d` panels gain a
"details →" link to `/mission/<slug>` (compute slug client-side with the same kebab rule). Optional
in v1 if it complicates those large files.

## SEO / i18n / sitemap / nav

- **`PAGE_SEO['/mission']`** in `utils/seo.ts` (hub copy) + `PREFIX_SEO` entry `['/mission',
  '/mission']` so detail children inherit copy and breadcrumbs prettify the leaf. **One new key.**
- **Detail titles** via `useSeoPage({ title, description })` (runtime, node name baked in) — not
  `PAGE_SEO` keys, so **no per-node locale parity** is required.
- **i18n:check parity:** the one `/mission` key needs a localized `title`+`description` in all 12
  non-English locales (`seo-i18n.ts` overlay). **Hand-authored, no paid translation** — short,
  simple strings, satisfying the blocking gate. UI-string namespace `i18n/messages/mission.ts`
  (English filled; other locales English-placeholder — body strings have no parity gate).
- **Sitemap:** extend `app/server/api/__sitemap__/urls.ts` to `$fetch /missions` and emit `{ loc:
  \`/mission/${slug}\`, _i18nTransform: true }` **only for `indexable` rows**.
- **routeRules (`nuxt.config.ts`):** `'/mission/**': { cache: false }` + the per-locale variants
  (high cardinality, per the `/relic` / `/set` precedent).
- **Nav:** add a "Missions" link to `layouts/default.vue` `navLinks` (Reference/Analytics group,
  icon e.g. `mdi-map-search-outline`) + `nav.items.missions` key. Add the label to all locales in
  `nav.ts` (one short noun; English where a faithful translation isn't obvious — no API).

## Error handling

- WFCD 403/timeout during `syncNodes` → keep the existing `nodes` doc, log, non-zero exit for a
  scheduler alert. Never wipe good data on a failed fetch.
- `/mission/:slug` unknown slug → `null`; page shows soft not-found. Cache wrapper won't pin
  `null`.
- Price join: item with no market match contributes 0 EV, flagged untradeable; never NaN.
- Block-split on a genuinely single-block array is a no-op (one block, kept whole).

## Testing

- **`services/MissionService.test.ts`** (DB-free, static builders): `slugFor` uniqueness/edge
  cases; `normalizeNodes` enum decode + join (present, Proxima-only-in-solNodes, no-join);
  `deriveSteelPath` (+100 / +50 / +20); `buildMissionList` `indexable` flag; `buildMissionDetail`
  reward join + bestValue + soft-miss.
- **`services/DropService.test.ts`** (extend): `splitFirstDropTable` — clean single-block kept
  whole; the real Duviri 6-block fixture keeps only block 1 (11 items, no Ayatan/Riven); exact-
  dupe dedup; rotational untouched. Assert `buildIndex`/`enrichMap` no longer emit the 5×
  `Ayatan Cyan Star` rows and that plat/run drops accordingly.
- **Manual:** `npm run sync_nodes` populates the `nodes` doc; `/missions` + `/mission/<slug>`
  return joined data; dialog row links to a mission page; a real node shows levels/faction, an
  activity shows the curated note; wiki footer opens `wiki.warframe.com/w/…`; thin page carries
  `noindex`. `cd app && npm run i18n:check` passes. Screenshot desktop + mobile.

## Files

**New:** `services/MissionService.ts`, `services/MissionService.test.ts`, `sync_nodes.ts`,
`app/app/pages/mission/[[slug]].vue`, `app/app/data/missionNotes.ts`,
`app/i18n/messages/mission.ts`.

**Edited:** `services/DropService.ts` (block-split + `slug` in `lookupItem`),
`services/DropService.test.ts`, `services/BaseWarframeClient.ts`, `services/index.ts`,
`services/CacheWarmer.ts`, `WarframeFacade.ts` (+ `warframe-undici.ts` if the HTTP-client wiring
needs it), `server.ts`, `package.json` (root, `sync_nodes` script),
`app/app/utils/wikiLinks.ts` (host + node-collision handling),
`app/app/components/DropLocationsDialog.vue` (row link, `slug` field),
`app/app/utils/seo.ts` (`PAGE_SEO` + `PREFIX_SEO`), `app/app/utils/seo-i18n.ts` (localized
`/mission` copy), `app/server/api/__sitemap__/urls.ts` (mission slugs),
`app/nuxt.config.ts` (routeRules), `app/app/layouts/default.vue` (nav),
`app/i18n/messages/nav.ts` (nav label). Optional: `app/app/pages/star-chart.vue`,
`app/app/pages/star-chart-3d.vue` (detail links).
