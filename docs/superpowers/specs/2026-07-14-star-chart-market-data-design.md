# Star Chart — full market data on rewards + Warframe.Market link

**Date:** 2026-07-14
**Status:** Approved design, pre-implementation

## Problem

The Star Chart detail panel ([app/pages/star-chart.vue](../../../app/pages/star-chart.vue))
shows each mission reward as `thumb · name · chance% · plat`. Plat alone is
misleading: an item can list at 70p only because it has **0 volume and is
overpriced** — a stale ask nobody buys. To judge whether a price is real, the
user currently has to leave the page, go to the home table, and search the item
by hand. There is also no direct link to the item on warframe.market to
cross-reference.

## Goal

Surface the same "all relevant market data" the home table shows —
Buy (live), Sell (live), Avg Sold (48h), Diff, Volume (48h), Updated — plus a
**View on Warframe.Market** link, where the user already is:

1. **Inline signal** on each Star Chart reward row (at-a-glance volume + a
   subtle "thin" warning).
2. **Full market snapshot** in the `DropLocationsDialog` that already opens when
   a reward name is clicked — reused across every page that opens that dialog
   (home, star chart, relic, set).

Low-volume / overpriced items get a **muted warning flag**, not a hard verdict;
raw numbers are always shown so the user judges.

## Reference: what "all market data" means

The home table ([app/pages/index.vue](../../../app/pages/index.vue)) already
renders these from the processed item (`ItemProcessor.processForDisplay`):

| Column (home)         | Field                                   |
|-----------------------|-----------------------------------------|
| Buy (live listing)    | `market.buy`                            |
| Sell (live listing)   | `market.sell`                           |
| Avg Sold (48h)        | `market.avg_price`                      |
| Diff                  | `market.diff` (`sell - buy`)            |
| Volume (Last 48hrs)   | `market.volume`                         |
| Latest 48h Trades     | `market.last_completed` (rich object)   |
| Tags                  | `tags`                                  |
| Updated               | `priceUpdate` (relative, `moment().fromNow()`) |
| wf.market link        | `https://warframe.market/items/{url_name}` |

`market` shape: `{ buy, sell, diff, buyAvg, sellAvg, volume, avg_price, last_completed }`.
Item shape adds: `item_name, thumb, url_name, tags, ducats, vaulted, priceUpdate, set`.

## Architecture decision — client-side Vuex lookup (Approach A)

The layout dispatches `setItems` on every page
([app/layouts/default.vue:132](../../../app/layouts/default.vue#L132)), so the
Vuex getter `all_items` (the full processed items, same source as the home
table) is available app-wide. The dialog already knows the item's name; the
star chart page already injects `all_items` via `mapGetters`.

**Therefore: resolve market data on the client from the store. No backend,
sync, Mongo, or mock-api changes.** Freshness equals the home table (identical
source). Rejected alternatives:

- **B — backend enrich `/drops/map` + `/drops/item`:** touches DropService,
  sync, both Mongo backup docs, and mock-api; larger surface, more risk, no
  freshness gain.
- **C — per-caller prop:** each of the 4 call sites must pass market in; easy to
  miss one; repetitive.

### Name matching

Reward names come from WFCD and sometimes carry a trailing " Blueprint" the
market omits (e.g. WFCD `Nova Prime Neuroptics Blueprint` vs market
`Nova Prime Neuroptics`). The client join must mirror
`DropService.matchKeys` / `normalizeName` so it resolves the same way the
backend price join does. The name handed to the dialog varies by caller
(reward `itemName` from star chart; market `item_name` from home), so matching
must be tolerant on both sides.

## Components

### 1. `app/utils/marketLookup.ts` (new — pure, unit-tested, no Vue)

Mirror of the backend join logic, shared by the dialog and the star chart so
both resolve identically and the thresholds live in one place.

```
normalizeName(name): string          // lower, single-spaced, trimmed
matchKeys(name): string[]            // + / − " blueprint", drop "(...)" and trailing " set"
buildItemIndex(items): Map<string, item>   // every item under all its matchKeys
resolveMarketItem(name, index): item | null
marketSignal(market): { thin: boolean, overpriced: boolean, note: string }
```

`marketSignal` thresholds (subtle, volume-first):
- `thin` = `volume <= THIN_VOLUME` (**THIN_VOLUME = 3**, 48h).
- `overpriced` = `thin && avg_price > 0 && sell > 1.4 * avg_price`
  (live ask well above the realized 48h average).
- `note`: `''` when healthy; `'thin'` when thin only; `'price above recent avg'`
  when overpriced.

`buildItemIndex` skips items with no `item_name`; when two items map to the same
key, first write wins (matches backend `buildPriceMap`).

### 2. `DropLocationsDialog.vue` (edit — the shared snapshot; covers all 4 pages)

- Add `mapGetters({ allItems: 'all_items' })`.
- Computed `marketItem` = `resolveMarketItem(itemName, buildItemIndex(allItems))`.
  Index built in a computed so it memoizes per `allItems` change, not per open.
- New `dld__market` strip rendered **under the title, above the drop sections**:
  - Resolved & tradeable: stat cells **Buy · Sell · Avg 48h · Diff · Vol 48h ·
    Updated** (`moment(priceUpdate).fromNow()`), a compact last-trade line from
    `market.last_completed` (`avg_price` + relative datetime) when present, tag
    chips, the `marketSignal` flag (muted), and a **View on Warframe.Market ↗**
    link to `https://warframe.market/items/{url_name}` (`target="_blank"`,
    `rel="noopener"`).
  - Unresolved / untradeable (Forma, resources, or name not on market):
    muted line "Not traded on Warframe Market" — no link, no stats.
- Drop-locations loading/error/empty/results below are **unchanged**. The
  snapshot renders from the store independently of the `/drops/item` fetch, so
  it shows immediately even while drops load.
- Reuse the existing Orokin styling tokens (`.dld__*`, Cinzel/Rajdhani, void +
  gold + cyan). No new fonts/colors.

### 3. `star-chart.vue` (edit — inline row signal)

- Computed `itemIndex` = `buildItemIndex(this.allItems)` (already injected).
- Helper `rewardMarket(reward)` = `resolveMarketItem(reward.itemName, itemIndex)`.
- In each `sc-reward`, augment the plat cell: keep `{price}p`, add a small muted
  `vol {volume}` sub-line, and a `⚠` marker when `marketSignal(...).thin`
  (title/aria: the `note`). Untradeable rewards keep `—`, no volume.
- Minimal template + scoped-style change; grid stays `30px 1fr auto auto`
  (the plat cell becomes a two-line stack).

## Data flow

```
Vuex all_items (layout setItems, app-wide)
        │  buildItemIndex (matchKeys)
        ▼
resolveMarketItem(name) ──► marketSignal(market)
        │                         │
        ├── DropLocationsDialog ──┤ snapshot strip + wf.market link + flag  (home/star/relic/set)
        └── star-chart row     ───┘ inline vol + ⚠ flag
```

## Edge cases

- **Item not on market** → `resolveMarketItem` returns null → "Not traded"
  message / row shows `—`. (Forma, resources, credits.)
- **Blueprint suffix mismatch** → handled by `matchKeys` parity.
- **`priceUpdate` missing** → hide the Updated cell (don't render "Invalid date").
- **`last_completed` missing** → omit the last-trade line.
- **`avg_price` = 0** → `overpriced` cannot trigger (guarded); show `thin` only.
- **SSR:** `all_items` populated in layout; dialog snapshot is `client-only`
  territory already (dialog opens on interaction). Guard against empty
  `allItems` (returns null gracefully).

## Testing

- **Unit (pure util):** `matchKeys` parity with `DropService` (blueprint ±, set,
  parens); `buildItemIndex` first-write-wins; `resolveMarketItem` blueprint
  tolerance + miss → null; `marketSignal` thresholds (thin boundary at 3,
  overpriced needs thin + `sell > 1.4×avg`, `avg_price=0` guard).
- **Manual / app run:** open Star Chart, pick a rich planet, confirm inline
  `vol`/`⚠` on rows; click a reward name, confirm the snapshot strip (numbers
  match the home table for the same item) and the working wf.market link;
  confirm an untradeable reward (Forma) shows "Not traded". Spot-check the
  dialog from the home table and a relic page (scope = all pages).

## Out of scope

- Backend / `sync_drops` / Mongo / mock-api changes.
- Reward EV / plat-per-run math (`DropService.rotationValue`) — untouched.
- The full "Latest 48h Trades" chart modal (home already has it); the snapshot
  shows only a one-line last-trade summary.
- Any new market fields not already computed by `ItemProcessor`.
