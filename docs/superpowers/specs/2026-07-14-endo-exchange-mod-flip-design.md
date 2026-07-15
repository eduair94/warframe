# Endo Exchange — mod-flipping tool + `/endo` rebuild

**Date:** 2026-07-14
**Status:** approved (user auto-approved design + implementation)

## Problem

A player who has already maxed their mods accumulates **excess endo** and wants
the *reverse* of the current `/endo` page: not "buy endo cheap" but "spend endo
to make plat." The proven play is **buy a mod unranked, max it with endo, resell
it maxed** for the price gap. Today this is done by hand in a spreadsheet; the
site has all the market data to surface it automatically — including the mods a
manual list misses.

Two secondary issues on the current `/endo` page:

1. **Column sorting is broken.** It uses a Vuetify `v-data-table` whose
   header-click sort doesn't move the rows (mixed `'-'`/number cells +
   custom scroll-sync interference).
2. The user wants **normal mods benchmarked next to rivens/sculptures** on the
   endo-source side, to see whether any normal mod keeps up with sculptures and
   how far ahead high-rolled rivens sit.

## Goal

Rebuild `/endo` in the Orokin "Void Ledger" design (same `an-*` system as `/flip`
and `/relic-farming`) as a **two-direction Endo Exchange**, and add the mod-flip
tool. The rebuild replaces the broken Vuetify sort with the proven client-side
`sortKey` + `sorters{}` pattern from `relic-farming.vue`.

- **Direction A — Spend Endo → Plat (Mod Flip).** NEW, default. Ranks every
  tradeable mod by *plat per 1000 endo*: `(maxedSell − unrankedBuy) / endoToMax`.
- **Direction B — Get Endo cheap: Plat → Endo (Endo Sources).** The current
  page's job, upgraded into a unified leaderboard (endo-per-plat) of Ayatan
  sculptures + rivens + normal mods (dissolve), so strategies compare directly.

## Verified economics (Warframe Wiki, cross-checked on 10+ mod pages + live WFM)

### Endo/credit cost to max a mod — computable from stored metadata, no fetch

Per-rank cost **doubles** each rank. Cumulative cost rank 0 → rank N:

```
endoToMax    = EBC(rarity) × (2^maxRank − 1)
creditsToMax = CrBC(rarity) × (2^maxRank − 1)
```

- **EBC** (Endo Base Cost) = rarityTier × 10 → Common 10, Uncommon 20, Rare 30, Legendary 40
- **CrBC** (Credit Base Cost) = rarityTier × 483 → Common 483, Uncommon 966, Rare 1449, Legendary 1932
- `rarityTier`: Common 1, Uncommon 2, Rare 3, Legendary 4

**Rarity sets only the per-rank cost; max rank is an independent per-mod
property** (commonly 3, 5, 8, 10). Both `rarity` and `mod_max_rank` are already
stored on each item doc (`items_in_set[0]`), so cost-to-max needs **zero extra
API calls**. Class mapping: Primed/Umbral/Archon = Legendary; Galvanized = Rare;
Riven = Rare base but caps at rank 8 (7,650 endo). Confirmed totals: Common r10
= 10,230 endo; Serration (Uncommon r10) = 20,460; Hornet Strike (Rare **r5**) =
930; Primed/Umbral/Archon r10 = 40,920.

### Trade cost reality

Warframe has **no platinum trade tax** and warframe.market takes no cut. The only
cost besides the unranked buy is **endo + credits to max** (credits are often the
bigger bottleneck than endo). So profit = `maxedSell − unrankedBuy`; the ranking
resource is endo (and we surface credits as a secondary column).

### Flip meta (drives copy + guardrails)

- Biggest **absolute** profit: Rare/Legendary **rank-10** mods (Serration,
  corrupted like Narrow Minded/Blind Rage/Heavy Caliber, Galvanized, Primed).
- Biggest **plat-per-endo**: **rank-5** corrupted mods (Overextended, Fleeting
  Expertise) — near-free to max (~620 endo) for a ~2× price.
- Rank-3 mods (nightmare, commons) barely move — buyers just max those
  themselves. Maxed buyer pool is **thinner/slower** than unranked → liquidity
  weighting matters.

## Data pipeline

**The only missing data is the per-rank price** (unranked buy + volume). Today
each mod stores one `market` block = the max-rank price; `getItemPrices` already
downloads *all* orders + *all* 48h stats for the item and then discards
non-max-rank data. The rank-0 side is therefore obtainable for **free**.

- **`MarketService.getItemPrices`** (extend): after computing the maxed block,
  if the item is a mod (`mod_max_rank > 0`), also compute an `unranked` block
  from the **same** already-fetched orders + stats arrays —
  `OrderCalculator.calculatePrices(orders, { maxRank: 0, fallbackToAnyRank: false })`
  (strict rank-0, never falls back to maxed) and
  `StatisticsCalculator.calculate(stats48h, { modRank: 0 })`. Return
  `unranked: { buy, sell, buyAvg, sellAvg, volume, avg_price }`. Additive — the
  daily `sync_prices` persists it via the existing `saveItem({ market })`
  (Mongo schema is `strict:false`).
- **`sync_mod_flip.ts`** (new): mods-only bootstrap so the board populates
  immediately without waiting for a full-catalog sync; reuses the exact same
  `getWarframeItemOrders` call.
- **`Warframe.getEndoFlip()`** (new, on BaseWarframeClient): read all items once,
  keep mods (`tags` includes `mod`, `mod_max_rank > 0`, and a real `unranked` +
  `market`), compute endo/credits-to-max from `rarity` + `mod_max_rank`, emit
  `IEndoFlipRow[]`. In-memory join, one read — same shape as `getRelicsEv` /
  `getMarketAnalytics`.
- **`GET /endo_flip`** route in `server.ts` (cached like the other aggregates).
- Sculptures already arrive via the item store (`/`); rivens via `/rivens`.

## Frontend

- **`app/app/composables/useEndoValue.ts`** — the single source of truth for endo
  math (mirrors `useRelicValue`): `endoToMax(rarity, maxRank)`,
  `creditsToMax`, flip profit / plat-per-1k-endo, liquidity weight
  (`vol/(vol+K)`, reused so a maxed mod nobody buys can't show phantom profit),
  and endo-source `endoPerPlat`. Unit-tested with Vitest (like
  `RelicService.test.ts`) against the verified totals.
- **`app/app/pages/endo.vue`** — rebuilt: hero, stat tiles, direction toggle
  (Mod Flip / Endo Sources), search + filters, **client-side sortable** table
  (fixes the bug), mobile cards, pager, disclaimer, donation block + endo-guide
  link preserved. SEO meta preserved.
  - Mod Flip columns: Mod · Unranked buy · Maxed sell · Profit · Endo to max ·
    **Plat / 1k endo** (primary sort) · maxed volume. Instant-sell (top buy
    order) shown alongside the patient (48h-avg) sell. Guardrail toggles ("full
    data only", "hide thin demand") default on.
  - Endo Sources: unified rows (sculpture / riven / mod) ranked by endo-per-plat.
- **i18n** keys added to en/es/pt (single-brace interpolation).

## Testing / verification

- Vitest on `useEndoValue`: endo/credit totals for known mods (Common r10 =
  10,230; Serration = 20,460; Hornet Strike r5 = 930; Primed r10 = 40,920; Riven
  r8 = 7,650); profit + plat-per-endo; liquidity weighting.
- Typecheck backend + app.
- Drive the rebuilt `/endo` page: both directions render, every column sorts.

## Out of scope

- Non-PC platforms (site is PC-only).
- Endo *farming route* optimization (Arbitration/Steel Path) — link the guide.
