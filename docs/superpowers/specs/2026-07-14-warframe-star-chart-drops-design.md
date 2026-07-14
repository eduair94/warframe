# Star Chart — drop locations, in-app, ranked by plat

**Date:** 2026-07-14
**Status:** Design — awaiting review

## Problem

Two gaps:

1. The relic detail page sends players to an external site (`drops.warframestat.us`) via a
   new-tab link (`app/pages/relic/_relic.vue`, `getLink()`). It's a hard context switch off
   the product.
2. Players have no way to answer "where is this worth farming?" using the data this app
   already owns — live Warframe Market prices.

## Goal

Bring WFCD drop data in-app, and turn it into something no other tool does well: a star
chart that ranks every planet and mission by **expected platinum per run**, computed by
joining WFCD drop chances with the market prices already in Mongo.

Non-goals (YAGNI): pixel-accurate in-game node coordinates; Steel Path / fissure overlays;
editing or contributing drop data upstream; caching historical drop-table versions.

## Data sources (faithful to the game)

| Data | Source | Used for |
|------|--------|----------|
| Mission drop tables by planet/node/rotation | WFCD `missionRewards` (`all.json`) | Map + node reward tables |
| Relic contents | WFCD `relics` (`all.json`) | Resolving prime part → relic → node; relic detail |
| Node faction + mission type | WFCD worldstate-data `solNodes.json` (optional enrich) | Node badges |
| Planet order + Junction (Solar Rail) adjacency | Warframe Wiki `Junction` | Orbital layout + connection lines |
| Item plat value | existing `warframe-items` Mongo collection (`market.sell`) | Expected-value join |

**Confirmed WFCD shapes:**

```jsonc
// missionRewards[planet][location]
{ "gameMode": "Survival", "isEvent": false, "planet": "Earth", "location": "Cervantes",
  "rewards": { "A": [ { "_id","itemName","rarity","chance" } ], "B": [...], "C": [...] } }
// rewards may instead be a flat array when the mission has no rotation.

// relics[i]  (also /relics/{tier}/{name}.json)
{ "tier": "Lith", "name": "A1",
  "rewards": { "Intact":[...], "Exceptional":[...], "Flawless":[...],
               "Radiant": [ { "_id","itemName","rarity","chance" } ] } }
```

**Faithful star-chart topology** — real Junction progression, hardcoded as a small constant so
the orbital connections match the game's Solar Rail graph:

```
Earth→Mercury→Venus→Mars→Phobos→Ceres→Jupiter→Europa→Saturn→Uranus→Neptune→Pluto→Sedna→Eris
Earth↔Lua   Mars↔Deimos   Sedna↔Kuva Fortress   Void (unconnected)   Zariman / Deimos (open worlds)
```

The authoritative planet + node list comes from the drop data itself (`missionRewards` keys),
so the chart only ever shows zones we actually have drops for. Topology is layout metadata only.

## Architecture

Three units, each independently testable.

### 1. Backend — `DropService` (Mongo-backed) + sync

- **Collection:** `COLLECTIONS.DROPS = 'warframe-drops'` (constants/index.ts), `strict:false`.
  Stored as one document per source slice, or a single normalized index doc — see below.
- **`services/DropService.ts`** (mirrors `RelicService`, constructor takes
  `IDatabaseOperations<any>` + an `IHttpClient` for the live fallback). Responsibilities:
  - `syncDrops()` — fetch WFCD `all.json` (via the injected client's anti-detection `get`,
    since `drops.warframestat.us` is behind Cloudflare — WebFetch/plain axios gets 403).
    Normalize into a **flat drop index** and a **map structure**, then replace the collection
    contents (delete + `saveEntries`, or upsert by key). Last-good survives a WFCD outage.
  - `getDropsMap()` — read the map structure from Mongo, join each node's reward items with
    current `warframe-items` prices to compute expected plat/run, return planets → nodes →
    tables. If Mongo is empty (before first sync), fall back to a **live WFCD read** so the
    page still works — read-only, no write (respects "scheduled sync only").
  - `getItemDrops(name)` — filter the flat index for every location an item appears
    (as a direct node drop and, for prime parts, via the relics that contain it).
- **`BaseWarframeClient`**: build `dbDrops` + `dropService` in the constructor (inherited by
  both `WarframeFacade` and `WarframeUndici`); add delegates `getDropsMap()`,
  `getItemDrops(name)`, `syncDrops()`.
- **Endpoints (`server.ts`):**
  - `GET /drops/map` → `getJsonCache` (20s) → `m.getDropsMap()`
  - `GET /drops/item/:name` → `getJsonCache` → `m.getItemDrops(name)`
  - `GET /build_drops` → `getJsonProtected` (admin token, mirrors `/build_relics`) → `m.syncDrops()`
- **`sync_drops.ts`** (mirrors `sync_rivens.ts`): `import "./env"` → `startConnectionPromise()`
  → `new WarframeUndici(...)` → `m.syncDrops()` → `process.exit`. Registered as
  `"sync_drops": "ts-node sync_drops.ts"`. **User schedules it** (pm2/cron) — no auto-cron.

**Normalized shapes written to Mongo:**

```ts
// map structure (one doc, key: 'map')
{ key: 'map', planets: [ { planet, nodes: [
    { location, gameMode, rotations: [ { rotation: 'A'|'B'|'C'|null,
        rewards: [ { itemName, rarity, chance } ] } ] } ] } ] }
// flat index (one doc, key: 'index') — for item lookup
{ key: 'index', entries: [ { itemName, source: 'mission'|'relic',
    planet?, location?, gameMode?, rotation?, relicTier?, relicName?, relicState?,
    rarity, chance } ] }
```

Plat join is done at **read time** (prices move; drop tables don't), matched by normalized
item name against `warframe-items`. Non-tradeable drops (Forma, Orokin Cell, credits, endo)
match nothing → 0 plat, which is correct: they aren't plat farms. Relics and prime parts
match → real value. Name matching is best-effort (normalize case, strip trailing
"Blueprint" for non-main parts); unmatched items simply contribute 0 and are flagged so the
UI can show "untradeable".

**Expected plat/run** for a node rotation = `Σ (chance/100 × platSell(itemName))`. A node's
headline value = its best rotation. A planet's headline = its best node.

### 2. Frontend — `DropLocationsDialog.vue` (kills the redirect)

- `app/components/DropLocationsDialog.vue`: a `v-dialog`, Orokin-styled. Prop = item name;
  opens, `$axios.get(apiURL + '/drops/item/' + encodeURIComponent(name))`, renders every
  location grouped by planet: node · mission · rotation · chance · rarity, plus which relics
  contain it. States, in interface voice:
  - loading: skeleton rows
  - empty: "No drop sources found for this item. It may be vaulted, a shop-only item, or
    traded only between players."
  - error: "Couldn't load drop data. Retry." + retry button
  - footer: a small secondary "Open full data ↗" link to warframestat.us (escape hatch, not
    the primary path).
- Wire into `app/pages/relic/_relic.vue`: replace both `<a :href="getLink(item.item_name)">Drops</a>`
  cells (`#item.drops` templates) with a button that opens the dialog for that row's item.
  `getLink()` stays only as the dialog's footer link.

### 3. Frontend — `app/pages/star-chart.vue`

- Route `/star-chart`; nav link added to `default.vue` `navLinks` in the **Analytics** group,
  icon `mdi-orbit`, title "Star Chart".
- Uses the established `.an-*` console design system (hero / eyebrow / stats / filters) so it
  sits beside Ducats/Relic Value as one family. Hides `#spinner-wrapper` on mount via the
  standard recursive `finishLoading()` (per project convention).
- Fetches `/drops/map` in `mounted`/`fetch`.

**Signature — bespoke SVG orbital star chart** (the one bold thing; everything else quiet):

- Planets laid on concentric rings in the real Junction order; faint connection lines drawn
  along the real Junction adjacency. Special zones (Lua, Deimos, Void, Kuva Fortress) as
  satellites off their parent.
- Each planet's glow intensity / ring encodes its best-farm plat value (a legible heat scale,
  gold = richest). One ambient drift animation, **disabled under `prefers-reduced-motion`**.
- Planets are real `<button>`s: Tab/arrow-key navigable, visible focus ring, `aria-label`
  with planet + best value.
- Selecting a planet opens a **side panel** (desktop) / **bottom sheet** (mobile): its missions
  ranked by expected plat/run. Each row expands to the full drop table (item thumb, chance,
  rarity, rotation, plat each). Item rows link to market and can open `DropLocationsDialog`.
- Hero stats (real, not decorative): richest planet, top single farm node, best relic drop
  right now. A "where do I farm ___?" search that opens the same dialog.

## Error handling

- WFCD 403/timeout during sync → keep existing Mongo data, log, non-zero exit so a scheduler
  can alert. Never wipe good data on a failed fetch.
- `/drops/map` with empty Mongo and failed live fallback → return `{ planets: [] }`; page shows
  a first-run empty state ("Star chart data isn't loaded yet.").
- Price join: an item with no market match contributes 0 and is marked untradeable; never NaN.

## Testing

- `services/DropService.test.ts` (mirrors existing `RelicService.test.ts`,
  `SetService.test.ts`): normalization of `all.json` → map + index (rotation object vs flat
  array), expected-value math, name-match/normalization, untradeable → 0, empty-Mongo live
  fallback path (mocked client). Pure functions extracted so they test without Mongo.
- Manual verify: `npm run sync_drops` populates the collection; `/drops/map` and
  `/drops/item/:name` return joined data; dialog opens from a relic page; star chart renders,
  is keyboard-navigable, and respects reduced motion. Screenshot desktop + mobile.

## Files

**New:** `services/DropService.ts`, `services/DropService.test.ts`, `sync_drops.ts`,
`app/components/DropLocationsDialog.vue`, `app/pages/star-chart.vue`.
**Edited:** `constants/index.ts`, `services/BaseWarframeClient.ts`, `services/index.ts`,
`WarframeFacade.ts` + `warframe-undici.ts` (only if HTTP-client wiring needed), `server.ts`,
`package.json`, `app/layouts/default.vue`, `app/pages/relic/_relic.vue`.
