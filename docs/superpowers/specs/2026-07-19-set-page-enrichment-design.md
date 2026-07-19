# Set detail page enrichment — design

Date: 2026-07-19
Scope: `/set/:slug` (all sets) — backend bundle endpoint, multi-basis pricing, Orokin rewrite.

## Problem

`/set/[[set]].vue` is one of the last unmigrated pages. Today it:

- Renders two nested `v-data-table`s in the pre-Orokin plain style.
- Shows exactly one pricing view: best bid / best ask ("instant"), via a synthetic
  server-side `"<Name> by Parts"` row.
- Links out to `drops.warframestat.us` instead of using the in-app
  `DropLocationsDialog`.
- Shows no data-freshness signal and offers no way to refetch.
- Carries ~120 lines of hand-rolled synced-horizontal-scrollbar code with
  listener-teardown bookkeeping (a past tab-freeze fix).
- Is client-only (`ClientOnly` + imperative `$fetch` on mount), so crawlers see
  an empty shell on every set page.

The `/set` API response also strips data that already exists on the Mongo
document: `quantity_for_set`, `last_completed.median`/`moving_avg`/`min_price`/
`max_price`, and the `depth` order-book ladder.

## Goals

1. Migrate the page to the Orokin "Void Ledger" design system, detail-page
   archetype (`/relic/[[relic]].vue`).
2. Compare set-vs-parts under **five** pricing bases, not just instant.
3. Per-part drop popup (`DropLocationsDialog`).
4. Show last-updated timestamp + a refresh button.
5. Enrich: 30-day price history sparkline + trend, ducats, vaulted, liquidity /
   demand signals, order-book-aware bulk cost.
6. SSR the page for SEO.

Non-goals: reskinning `PriceHistoryChart.vue` (index-only, Material blue);
live-socket per-item sync (deferred — see "Deferred").

---

## 1. Backend — `GET /set_full/:url_name`

New route, registered in `server.ts` with `server.getJson` (300 s Redis/L1 cache
+ existing edge headers). The old `GET /set/:url_name` is left byte-identical for
back-compat; nothing else in the app changes.

### Response

```ts
interface ISetFullResult {
  set: ISetFullNode          // the assembled set item
  parts: ISetFullNode[]      // every item_in_set entry except the set itself
  meta: {
    generatedAt: string      // ISO
    oldestPriceUpdate: string | null
    newestPriceUpdate: string | null
    historyDays: number      // max points across all nodes
    partsCount: number
    pricedParts: number
  }
}

interface ISetFullNode {
  item_name: string
  url_name: string
  thumb: string
  tags: string[]
  ducats?: number
  vaulted?: boolean
  priceUpdate?: Date
  quantity_for_set: number   // 1 for the set node itself
  market: ISetFullMarket
  depth?: { buy: BookLevel[]; sell: BookLevel[] }
  history: { points: IPricePoint[]; trend: ITrendResult }
}

interface ISetFullMarket {
  buy: number; sell: number; diff: number
  buyAvg?: number; sellAvg?: number
  volume?: number; avg_price?: number
  last_completed?: IStatisticsDataPoint | null   // median, moving_avg, min/max, wa_price
  subtype?: string
}
```

There is **no** synthetic `"by Parts"` node. Parts totals are derived on the
client per basis — which is precisely why `quantity_for_set` must ship.

### Implementation

- **`ItemProcessor.processForSetDetail(item, quantity)`** — new static method.
  `processForDisplay` is untouched: `/`, `/set`, `/relic` and the analytics
  aggregates all depend on its exact shape.
  - Same validity guards as `processForDisplay` (`market` required,
    `items_in_set` non-empty) so an unpriced part is dropped, not summed as 0.
  - Additionally passes through `market.last_completed` in full, `market.subtype`,
    `market.depth`, and the resolved `quantity_for_set`.
- **`PriceHistoryService.getManyHistories(urlNames, limit)`** — one
  `allEntries({ url_name: { $in: urlNames } })`, returns
  `Map<string, { points; trend }>` with each series trimmed to the last `limit`
  (default 30) points. Trend reuses `StatisticsCalculator.calculateTrend` on the
  trimmed window, and an item with no stored doc yields
  `{ points: [], trend: { direction: 'flat', changePercent: 0 } }`.
  No N+1: one Mongo read for the whole set.
- **`SetService.getSetFullData(urlName)`** — reuses `getItemByUrlName` +
  `getItemsByUrlNames` (same two reads `getSetData` already performs), then one
  history read. Throws `Set not found: <slug>` / `Set has no items: <slug>` with
  the same messages as `getSetData`, so `Express.getJson` surfaces
  `{ error: ... }` identically.
  - Also rejects a **part** slug with `Not a set: <slug>`. Every member of a set
    carries the same `items_in_set` roster, so without the guard
    `/set_full/<part>` returns a bundle whose "parts" are the parent set and the
    part's own siblings — a nonsense comparison rendered as if it were real.
    Uses the same predicate as `buildComparisonFromItems`.
- **`BaseWarframeClient.getSetFull(urlName)`** — thin delegate, mirroring
  `getSet`.

### Cost

Three Mongo reads per uncached request (set doc, parts docs, history docs) —
one more than `/set` today, cached 300 s, and it replaces what would otherwise be
5–12 client round-trips.

---

## 2. Pricing bases — `app/app/composables/useSetPricing.ts`

Pure, unit-tested. Client-side so the maths lives in one place (same
server-thin / client-rich split as `useRelicValue` and `useEndoValue`).

warframe.market semantics: `sell` = lowest **ask** = what you PAY to acquire;
`buy` = highest **bid** = what you RECEIVE when selling.

| key | acquire (you pay) | resale (you get) | source |
|---|---|---|---|
| `instant` | `market.sell` | `market.buy` | top of book — default |
| `top5` | `market.sellAvg` | `market.buyAvg` | mean of top-5 orders, kills single bait |
| `avg48h` | `market.avg_price` | `market.avg_price` | 48 h volume-weighted traded average |
| `median` | `last_completed.median` | `last_completed.median` | median of the last closed 48 h datapoint |
| `bulk` | `bulkBuy(depth, qty, goingRate)` | `bulkSell(depth, qty, goingRate)` | walks the depth ladder via `useOrderBook` |

`goingRate` for the bait/troll filters is `avg_price || sell || buy`, matching
the existing `useOrderBook` contract.

### Per-basis result

```ts
interface BasisResult {
  key: BasisKey
  available: boolean          // false when the set node itself has no value
  setCost: number             // acquire side, set node
  setValue: number            // resale side, set node
  partsCost: number           // Σ acquire × quantity_for_set
  partsValue: number          // Σ resale × quantity_for_set
  save: number                // setCost - partsCost  (>0 => parts cheaper)
  savePct: number             // save / setCost * 100
  resaleExtra: number         // partsValue - setValue
  verdict: 'parts' | 'set' | 'even'
  coverage: { priced: number; total: number; estimated: number }
  rows: PartPricing[]         // per-part acquire/resale/estimated flag
}
```

### Missing-data rule

A part with no value for the active basis falls back **per part and per side**,
the row is flagged `estimated: true`, and `coverage.estimated` increments. Totals
are never silently short a part. When `coverage.priced < coverage.total` the
basis section carries an "incomplete" note.

Fallback order is by KIND, not by display order: the book bases
(`instant`/`top5`/`bulk`) fall back within themselves before reaching for a
traded figure, and `avg48h`/`median` prefer each other. Filling a median gap
with a live ask would quietly mix the two and overstate the total.

**Per-side fallback is load-bearing.** `OrderCalculator` stops its
ingame/online status walk as soon as *either* side has orders, so an item with
bidders but no sellers is genuinely stored as `sell: 0, buy: 20` (~8% of the
live catalogue). Treating that as "has data" priced the part's acquire cost at
0 platinum, dropped it out of the parts total unflagged, and could invert the
verdict outright.

`verdict` is `even` when `|savePct| < 3` — below that, spread noise dominates.

### Percentages

`savePct` and `resaleExtraPct` normalise against the **expensive side**
(`Math.max(setCost, partsCost)`), which is direction-correct for both verdicts:
"parts are X% cheaper" is measured against the set, "the set is X% cheaper" is
measured against the parts total. Anchoring both on `setCost` produced
impossible copy ("costs 150% less") and made the even-threshold asymmetric.

Tested in `test-helpers/useSetPricing.logic.test.ts` (same harness as
`useOrderBook.logic.test.ts`): quantity multiplication, per-basis selection,
fallback chain, missing-part coverage, even-threshold, bulk-walk integration.

---

## 3. Page — `app/app/pages/set/[[set]].vue` (full rewrite)

Archetype: `/relic/[[relic]].vue` ledger detail page.

```
.an > .an-console
  <h1 class="an-sr">                                    screen-reader only
  topbar   set v-autocomplete (localized titles, url_name values)
           ⟳ Refresh   ·   "prices updated 4m ago"
  hero     .an-eyebrow / .an-title (set name) / .an-lede
           .an-hero__deal → verdict + save under the ACTIVE basis
  basis    v-btn-toggle: Instant | Top-5 | 48h Avg | Median | Bulk
           each with a tooltip explaining what it measures; persisted to
           localStorage under `wf.set.basis`
  .an-stats  Set cost · Parts cost · Save · 48h volume
  ledger   set row (.is-top) then one row per part
           desktop  .an-tablewrap > .an-table
             Part | Qty | Acquire | Resale | Δ | Vol | Ducats | 30d | actions
           mobile   .an-cards > .an-card (thumb+name, verdict pill, blocks)
           row click → expanded detail panel:
             all five bases side by side, 48h min/max, top-5 depth ladder,
             30-day series
  footer   disclaimer alert · donation block (restyled) · wf.market + wiki links
  <DropLocationsDialog v-model=... :item-name="..." :thumb="..." />
```

Details:

- **Drops popup**: reuse `DropLocationsDialog`, passing the English `item_name`
  (the component's matcher is name-based and blueprint/"set"-tolerant).
- **Sparkline**: new `app/app/components/PriceSpark.vue` — small inline SVG
  (Orokin cyan up / rose down / dim flat), props `points: number[]`,
  `direction`. No dependency, no external chart lib.
- **SSR**: `useAsyncData(() => 'set-full:' + slug, ...)` with `watch` on the
  route param, so `/set/a → /set/b` refetches without a remount.
- **Removed**: the synced-scrollbar block, the `hasScroll`/`scrollWidth`/
  `wrapper2` state, `setScrollBar`, `teardownScroll`, the `onResize` handler and
  the nested inner `v-data-table`. `.an-tablewrap` handles overflow with plain
  CSS.
- `#spinner-wrapper` is hidden on mount (project rule).
- The set picker keeps localized titles with `url_name` values, as today.

### Refresh button

`refresh()` re-runs the `useAsyncData` fetch with `?_ts=<Date.now()>` and
`cache: 'no-cache'`. The timestamp changes `req.originalUrl`, so it misses both
the Redis key and the edge cache and reads current Mongo.

- Throttled to one call per 10 s; the button shows a spinner and is disabled
  while in flight. The error-state **Retry** button bypasses the throttle — a
  button that silently does nothing for 10 s reads as broken.
- Tooltip states plainly that prices are synced in batches — the button gets you
  the newest stored snapshot, not a live warframe.market quote. No fake-live
  claim.
- On success the freshness label recomputes from `meta.newestPriceUpdate`.
- **A failed refresh must not blank the page.** `useAsyncData` resets `data` to
  null on a failed refetch, which dropped a fully-rendered ledger into the
  not-found state. The page keeps the last good bundle in a `lastGood` ref and
  renders from it, showing a "refresh failed" flag beside the button. The error
  *state* is reserved for "there is nothing to show at all", so `loadFailed`
  keys off the absence of a payload, never off `error`.
- The cache-buster is cleared after each attempt and on slug change, so ordinary
  navigation and SSR go back through the shared cache.

---

## 4. i18n

`app/i18n/messages/setDetail.ts` expands across all **13** locales
(`en es pt de fr ru ko ja zh-hans zh-hant pl it uk`): hero copy, five basis
labels + tooltips, verdict labels, column headers, row actions, refresh button +
freshness line, expanded-panel labels, empty/error states.

Constraints enforced by `npm run i18n:check` (blocking CI gate):
- single-brace `{name}` interpolation only;
- escape a literal `@` as `{'@'}` and `{` as `{'{'}`;
- no duplicate sibling keys.

Translations are produced by **`node scripts/tr-file.mjs app/i18n/messages/setDetail.ts`**,
added by this change: write the English block, run the script, and it fills every
missing key in the other 12 locales via Gemini — validating placeholders,
rejecting a literal `@`, falling back to English per string, and retrying on
429/503. `--dry` reports gaps, `--force` retranslates. This replaces fanning out
one agent per locale.

`PAGE_SEO['/set']` is unchanged, so no new SEO-parity entries are required.

## 5. SEO

- Keep `useSeoPage` with the existing per-set title/description getters.
- Add `useBreadcrumbsLd`: Home › Sets › {Set name}.
- Do **not** call `useLocaleHead` — canonical/hreflang stay central in the layout.

## 6. Verification

- `npm test` (API jest) — blocking CI gate. New: `SetService.getSetFullData`,
  `PriceHistoryService.getManyHistories`, `ItemProcessor.processForSetDetail`,
  `useSetPricing` logic.
- `npm run i18n:check` — blocking CI gate.
- `npm run build` in `app/`.
- Local dev DOM check of `/set/gauss_prime_set` (per project note, trust the DOM
  over Playwright overlay screenshots).

## Deferred

- Live per-item sync through the `warframe-live` socket (`HotPoller`). The UI
  seam is the basis toggle + freshness chip; a future spec can add a `LIVE`
  state that subscribes the set's `url_name`s and streams best bid/ask.
- Reskinning `PriceHistoryChart.vue` to Orokin (used only by `/`).

---

## Post-implementation review

A 5-dimension adversarial review (pricing, API, Vue runtime, i18n/a11y, design)
raised 32 findings; 27 were refuted against the code and 5 survived, all fixed
before release:

| Severity | Finding | Resolution |
|---|---|---|
| high | `priceWithFallback` accepted a one-sided quote, so a part with no asks cost 0p unflagged and could invert the verdict | fallback made per-side; regression test |
| high | `savePct` divided by `setCost` in both directions ("costs 150% less") | normalise against the expensive side; regression test |
| high | Expanded panel inherited `text-align: right` / `nowrap` from `.an-table td` | opt out on `.st-detailrow > td` and `.sid` |
| medium | `/set_full` accepted any item slug, so a part returned a bundle containing its own parent set | `Not a set:` guard; regression test |
| medium | A failed refresh wiped the ledger, and Retry was a 10 s no-op | `lastGood` fallback + stale flag; Retry bypasses the throttle |

Verified live against a seeded 4-part set: quantities (`×2`), per-side fallback,
the `est.` marker and incomplete warning, all five bases disagreeing as
expected, the expanded panel, the sparklines, the drop dialog, the failed-refresh
fallback, the `/set` empty state, and the Spanish locale.
