# Set vs Parts Comparison — Design

**Date:** 2026-07-13
**Status:** Approved

## Goal

Give players a single view to decide **buy the assembled set vs buy the individual
parts** (and, for sellers, sell-as-set vs sell-parts) — data warframe.market
analytics does not surface directly. Each row links to the existing per-set detail
page (`/set/<url_name>`, e.g. `/set/latron_prime_set`).

## Decisions (from brainstorming)

- **Placement:** new top-level route `/comparison`, linked from the nav. `/set/<slug>`
  stays the detail page.
- **Perspective:** show **both** prominently — acquire cost (buyer) and resale value
  (seller) as two grouped column blocks.
- **Scope:** all multi-part sets (Prime, Vandal, Wraith, syndicate, …), i.e. any item
  whose `item_name` includes `" Set"` and has `items_in_set.length > 1`.

## warframe.market price semantics

- `market.sell` = lowest **sell order** = the price you PAY to acquire an item.
- `market.buy` = highest **buy order** = the price you RECEIVE when selling.

Therefore:
- **Acquire cost** of a set = `set.sell`; of the parts = `Σ(part.sell × quantity_for_set)`.
  Buying by parts is cheaper when `partsCost < setCost`.
- **Resale value** of a set = `set.buy`; of the parts = `Σ(part.buy × quantity_for_set)`.
  Selling by parts yields more when `partsValue > setValue`.

## Backend

New endpoint: `GET /sets_comparison` (registered via `server.getJsonCache`, 20s cache
like sibling routes).

New method `SetService.buildComparisonFromItems(items)` — a **pure** function over an
already-loaded item array (no per-set DB queries):

1. Build `Map<url_name, item>` from all items.
2. Select set items (`item_name` includes `" Set"` && `items_in_set?.length > 1`).
3. For each set: resolve its parts from `items_in_set` (excluding the set's own
   url_name), look each up in the map, sum by `quantity_for_set`. Skip parts with no
   `market`; count them in `missingParts`.
4. Emit a row:

```ts
{
  item_name, url_name, thumb, tags, partsCount, missingParts,
  set:     { buy, sell, volume },
  byParts: { buy, sell },
  acquire: { setCost, partsCost, save, savePct },   // save = setCost - partsCost (>0 => parts cheaper)
  resale:  { setValue, partsValue, extra, extraPct } // extra = partsValue - setValue (>0 => parts worth more)
}
```

Facade exposes `getSetsComparison()` → one `getAllItems()` read → `buildComparisonFromItems`.
Endpoint returns `{ sets: Row[], generatedAt }`.

Unit test: `SetService.buildComparisonFromItems` with a fixture (set + parts w/
quantities, a missing part) asserting sums, savings sign, and `missingParts`.

## Frontend

New page `app/pages/comparison.vue`:

- SSR fetch via `asyncData({ $axios, $config })` → `${apiURL}/sets_comparison`, wrapped
  in try/catch; empty state on failure.
- Nav entry added in `app/layouts/default.vue`.
- i18n: reuse existing `$t` where present; literal English fallbacks acceptable
  (matches current pages which already mix English literals).

### UI

- **Hero**: title + one-line value pitch.
- **Stat cards** (3): # sets cheaper by parts · biggest plat saving (with set name) ·
  average save %.
- **Filter bar**: name search (autocomplete), category/tag select, min-volume input,
  toggle "parts cheaper to buy", toggle "parts resell higher", sort select
  (save% / save plat / volume / name).
- **Desktop** (`!$vuetify.breakpoint.mobile`): grouped-column `v-data-table`:
  `Set | Acquire(set / parts / save Δ+%) | Resale(set / parts / extra Δ+%) | Volume | View`.
- **Mobile**: card list — each card shows thumb + name + parts count, an Acquire block
  and a Resale block (colored), and a `View parts →` button. Grouped columns are
  unreadable on narrow screens, so cards replace the table below the breakpoint.
- **Color**: green when parts win the comparison, red when the set wins; neutral when
  ~equal. "Best deal" badge on the top savers.
- Every row/card links to `/set/<url_name>`.

## Non-goals (YAGNI)

- No new DB writes, no auth, no new sync job.
- No historical trend on this page (detail page already has price history).
- Reuse existing by-parts math and the existing `/set/<slug>` detail page as-is.

## Testing / verification

- Unit test for `buildComparisonFromItems`.
- Run backend + frontend, load `/comparison`, verify rows, filters, sort, mobile cards,
  and that a row link opens the correct `/set/<slug>` detail.
