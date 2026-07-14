# Star Chart Market Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show full live market data (buy/sell/avg/volume/diff/updated) + a Warframe.Market link on Star Chart reward rows and in the shared DropLocationsDialog, so the user can judge whether a plat price is real without leaving the page.

**Architecture:** Pure client-side. A new pure util (`app/utils/marketLookup.ts`) resolves an item name to its live market data from the Vuex `all_items` store (populated app-wide by the layout) — mirroring the backend's `DropService.matchKeys` join so the browser resolves the same item the backend priced. The shared `DropLocationsDialog` renders a market snapshot; `star-chart.vue` adds an inline volume + "thin" signal to each reward row. No backend, sync, Mongo, or mock-api changes.

**Tech Stack:** Nuxt 2 / Vue 2 (Options API), Vuetify 2, TypeScript, Jest (ts-jest, root config), moment (in `app`).

## Global Constraints

- **No backend changes.** Do not touch `services/`, `sync_*`, Mongo docs, or mock-api. Data comes only from Vuex `all_items`.
- **Reuse existing Orokin styling** (`.dld__*` / `.sc-*` classes, Cinzel/Rajdhani fonts, void+gold+cyan). No new fonts or color systems.
- **Thresholds (exact):** `THIN_VOLUME = 3` (48h volume ≤ 3 → thin); `OVERPRICED_RATIO = 1.4` (overpriced = thin AND `avg_price > 0` AND `sell > 1.4 × avg_price`).
- **Name-match parity:** the client join must mirror `DropService.normalizeName` / `matchKeys` (tolerate trailing " Blueprint", drop trailing " Set" and parentheticals).
- **wf.market link:** `https://warframe.market/items/{url_name}`, `target="_blank" rel="noopener"`.
- **Frontend jest note:** root `jest.config.js` ignores `/app/`, so the util's test lives at repo root (`marketLookup.test.ts`) and imports `./app/utils/marketLookup`. Root `tsconfig.json` `include` already covers `app/`, so it compiles.
- Vue components have no test harness at the root; Tasks 2–3 are verified by running the app + code inspection, not unit tests.

---

### Task 1: Pure market-lookup util

**Files:**
- Create: `app/utils/marketLookup.ts`
- Test: `marketLookup.test.ts` (repo root)

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `THIN_VOLUME: number`, `OVERPRICED_RATIO: number`
  - `normalizeName(name: string): string`
  - `matchKeys(name: string): string[]`
  - `buildItemIndex(items: MarketItem[]): Map<string, MarketItem>`
  - `resolveMarketItem(name: string, index: Map<string, MarketItem>): MarketItem | null`
  - `marketSignal(market: MarketData | null | undefined): { thin: boolean; overpriced: boolean; note: string }`
  - types `MarketData`, `MarketItem`, `MarketSignal`

- [ ] **Step 1: Write the failing test**

Create `marketLookup.test.ts`:

```ts
import {
  normalizeName,
  matchKeys,
  buildItemIndex,
  resolveMarketItem,
  marketSignal,
  THIN_VOLUME,
  OVERPRICED_RATIO,
  MarketItem,
} from './app/utils/marketLookup'

describe('normalizeName', () => {
  it('lower-cases, trims, and collapses whitespace', () => {
    expect(normalizeName('  Nova   Prime  ')).toBe('nova prime')
  })
  it('handles null/undefined', () => {
    expect(normalizeName(undefined as any)).toBe('')
  })
})

describe('matchKeys', () => {
  it('adds the blueprint-less variant for a "… Blueprint" name', () => {
    expect(matchKeys('Nova Prime Neuroptics Blueprint')).toEqual(
      expect.arrayContaining(['nova prime neuroptics blueprint', 'nova prime neuroptics'])
    )
  })
  it('adds the blueprint variant for a bare name', () => {
    expect(matchKeys('Nova Prime Neuroptics')).toEqual(
      expect.arrayContaining(['nova prime neuroptics', 'nova prime neuroptics blueprint'])
    )
  })
  it('drops a trailing " Set" and parentheticals', () => {
    expect(matchKeys('Nova Prime Set')).toContain('nova prime')
    expect(matchKeys('Forma (Blueprint)')).toContain('forma')
  })
})

describe('buildItemIndex + resolveMarketItem', () => {
  const items: MarketItem[] = [
    { item_name: 'Nova Prime Neuroptics', url_name: 'nova_prime_neuroptics', market: { sell: 14, volume: 3 } },
    { item_name: 'Soma Prime Barrel', url_name: 'soma_prime_barrel', market: { sell: 5, volume: 40 } },
  ]
  const index = buildItemIndex(items)

  it('resolves a WFCD "… Blueprint" reward to the market item', () => {
    const hit = resolveMarketItem('Nova Prime Neuroptics Blueprint', index)
    expect(hit && hit.url_name).toBe('nova_prime_neuroptics')
  })
  it('resolves an exact name', () => {
    const hit = resolveMarketItem('Soma Prime Barrel', index)
    expect(hit && hit.url_name).toBe('soma_prime_barrel')
  })
  it('returns null for an unknown/untradeable item', () => {
    expect(resolveMarketItem('Forma Blueprint', index)).toBeNull()
  })
  it('skips items with no item_name and does not throw', () => {
    expect(() => buildItemIndex([null as any, { market: {} } as any])).not.toThrow()
  })
})

describe('marketSignal', () => {
  it('flags thin when volume is at or below the threshold', () => {
    expect(marketSignal({ volume: THIN_VOLUME, sell: 10, avg_price: 10 }).thin).toBe(true)
    expect(marketSignal({ volume: THIN_VOLUME + 1, sell: 10, avg_price: 10 }).thin).toBe(false)
  })
  it('flags overpriced only when thin AND sell exceeds ratio × avg', () => {
    const over = marketSignal({ volume: 1, sell: 100, avg_price: 50 }) // 100 > 1.4*50=70
    expect(over.overpriced).toBe(true)
    expect(over.note).toBe('price above recent avg')
    const fair = marketSignal({ volume: 1, sell: 60, avg_price: 50 }) // 60 < 70
    expect(fair.overpriced).toBe(false)
    expect(fair.note).toBe('thin')
  })
  it('never flags overpriced when avg_price is 0', () => {
    const s = marketSignal({ volume: 1, sell: 100, avg_price: 0 })
    expect(s.overpriced).toBe(false)
    expect(s.note).toBe('thin')
  })
  it('is healthy (no note) for a liquid item', () => {
    expect(marketSignal({ volume: 50, sell: 10, avg_price: 10 })).toEqual({ thin: false, overpriced: false, note: '' })
  })
  it('handles null market', () => {
    expect(marketSignal(null).thin).toBe(true) // volume 0 ≤ 3
  })
  it('exposes the documented threshold constants', () => {
    expect(THIN_VOLUME).toBe(3)
    expect(OVERPRICED_RATIO).toBe(1.4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest marketLookup`
Expected: FAIL — `Cannot find module './app/utils/marketLookup'`.

- [ ] **Step 3: Write minimal implementation**

Create `app/utils/marketLookup.ts`:

```ts
/**
 * @fileoverview Client-side market lookup for drop rewards.
 *
 * Resolves an item name to its live Warframe Market data straight from the Vuex
 * `all_items` store (populated app-wide by the layout). Mirrors the backend's
 * DropService.normalizeName/matchKeys so the browser resolves the same item the
 * backend priced — tolerant of WFCD's trailing " Blueprint" the market omits.
 */

export interface MarketData {
  buy?: number
  sell?: number
  diff?: number
  volume?: number
  avg_price?: number
  buyAvg?: number
  sellAvg?: number
  last_completed?: any
}

export interface MarketItem {
  item_name?: string
  url_name?: string
  thumb?: string
  tags?: string[]
  priceUpdate?: string | number
  market?: MarketData
}

export interface MarketSignal {
  thin: boolean
  overpriced: boolean
  note: string
}

/** Low-volume threshold (48h realized trades). At or below this = "thin". */
export const THIN_VOLUME = 3
/** Live ask this many × the 48h average → flagged as above recent average. */
export const OVERPRICED_RATIO = 1.4

/** Collapse a name to a match key: lower-cased, trimmed, single-spaced. */
export function normalizeName(name: string): string {
  return (name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Match keys for an item, tolerant of WFCD's "… Blueprint" suffix the market
 * often omits, a trailing " Set", and parentheticals. Parity with
 * DropService.matchKeys so the client join matches the backend price join.
 */
export function matchKeys(name: string): string[] {
  let base = normalizeName(name)
  if (base.includes('(')) base = base.split('(')[0].trim()
  if (base.endsWith(' set')) base = base.slice(0, -4).trim()
  const keys = new Set<string>([base])
  if (base.endsWith(' blueprint')) keys.add(base.slice(0, -' blueprint'.length).trim())
  else keys.add(`${base} blueprint`)
  return [...keys].filter(Boolean)
}

/**
 * Single-key index (normalized item_name -> item), mirroring the backend's
 * buildPriceMap. Blueprint tolerance is applied at resolve time, not here, so
 * two items can't clobber each other via an added variant key. First write wins.
 */
export function buildItemIndex(items: MarketItem[]): Map<string, MarketItem> {
  const map = new Map<string, MarketItem>()
  for (const item of items || []) {
    if (!item || !item.item_name) continue
    const key = normalizeName(item.item_name)
    if (!map.has(key)) map.set(key, item)
  }
  return map
}

/** Resolve an item name to its market item, tolerant of the Blueprint suffix. */
export function resolveMarketItem(
  name: string,
  index: Map<string, MarketItem>
): MarketItem | null {
  for (const key of matchKeys(name)) {
    const hit = index.get(key)
    if (hit) return hit
  }
  return null
}

/**
 * Subtle liquidity/price signal. `thin` when 48h volume is at or below
 * THIN_VOLUME; `overpriced` only when thin AND the live sell sits well above
 * the 48h realized average. Raw numbers are always shown by the caller — this
 * is only a muted flag, not a verdict.
 */
export function marketSignal(market: MarketData | null | undefined): MarketSignal {
  const volume = Number(market && market.volume) || 0
  const sell = Number(market && market.sell) || 0
  const avg = Number(market && market.avg_price) || 0
  const thin = volume <= THIN_VOLUME
  const overpriced = thin && avg > 0 && sell > OVERPRICED_RATIO * avg
  const note = overpriced ? 'price above recent avg' : thin ? 'thin' : ''
  return { thin, overpriced, note }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest marketLookup`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add app/utils/marketLookup.ts marketLookup.test.ts
git commit -m "feat(market): client-side market-lookup util (name join + thin signal)"
```

---

### Task 2: Market snapshot in DropLocationsDialog

**Files:**
- Modify: `app/components/DropLocationsDialog.vue`

**Interfaces:**
- Consumes: `buildItemIndex`, `resolveMarketItem`, `marketSignal` from `../utils/marketLookup`; Vuex getter `all_items`; `moment`.
- Produces: no new exports (self-contained component change).

- [ ] **Step 1: Add imports + Vuex getter + computeds (script block)**

In `<script lang="ts">`, replace the top `export default {` region so the file begins with imports and the component maps the store. Add these imports above `export default`:

```ts
import { mapGetters } from 'vuex'
import moment from 'moment'
import { buildItemIndex, resolveMarketItem, marketSignal, MarketItem } from '../utils/marketLookup'
```

Add `computed` (the component currently has `computed: { thumbUrl, hasResults }` — add these alongside):

```ts
computed: {
  ...mapGetters({ allItems: 'all_items' }),
  itemIndex(): Map<string, MarketItem> {
    return buildItemIndex((this.allItems as MarketItem[]) || [])
  },
  marketItem(): MarketItem | null {
    if (!this.itemName) return null
    return resolveMarketItem(this.itemName, this.itemIndex)
  },
  m(): any {
    return (this.marketItem && this.marketItem.market) || {}
  },
  lastTrade(): any {
    return this.m && this.m.last_completed ? this.m.last_completed : null
  },
  signal(): { thin: boolean; overpriced: boolean; note: string } {
    return marketSignal(this.marketItem && this.marketItem.market)
  },
  wmUrl(): string {
    return this.marketItem && this.marketItem.url_name
      ? 'https://warframe.market/items/' + this.marketItem.url_name
      : ''
  },
  // ...keep existing thumbUrl and hasResults below...
},
```

Add these `methods` (alongside existing `close`, `onImgError`, `load`, `fmt`, `rarityColor`):

```ts
fmtP(n: number): string {
  const v = Number(n) || 0
  return v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(v % 1 === 0 ? 0 : 1)
},
fmtInt(n: number): string {
  return String(Math.round(Number(n) || 0))
},
fromNow(d: any): string {
  if (!d) return ''
  const mm = moment(d)
  return mm.isValid() ? mm.fromNow() : ''
},
fmtTag(t: string): string {
  return (t || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
},
```

- [ ] **Step 2: Add the market strip to the template**

In `<template>`, insert this block immediately **after** `</header>` (line ~27) and **before** `<div class="dld__body">`:

```html
<!-- Live market snapshot (from the store; independent of the drops fetch) -->
<section v-if="marketItem" class="dld__market">
  <div class="dld__market-grid">
    <div class="dld__mstat"><span class="dld__mlbl">Buy</span><span class="dld__mval">{{ fmtP(m.buy) }}p</span></div>
    <div class="dld__mstat"><span class="dld__mlbl">Sell</span><span class="dld__mval">{{ fmtP(m.sell) }}p</span></div>
    <div class="dld__mstat"><span class="dld__mlbl">Avg 48h</span><span class="dld__mval">{{ fmtP(m.avg_price) }}p</span></div>
    <div class="dld__mstat"><span class="dld__mlbl">Diff</span><span class="dld__mval">{{ fmtP(m.diff) }}p</span></div>
    <div class="dld__mstat"><span class="dld__mlbl">Vol 48h</span><span class="dld__mval" :class="{ 'is-thin': signal.thin }">{{ fmtInt(m.volume) }}</span></div>
    <div v-if="marketItem.priceUpdate" class="dld__mstat"><span class="dld__mlbl">Updated</span><span class="dld__mval">{{ fromNow(marketItem.priceUpdate) }}</span></div>
  </div>
  <div class="dld__market-foot">
    <span v-if="signal.note" class="dld__flag" :class="{ 'is-warn': signal.overpriced }">⚠ {{ signal.note }}</span>
    <span v-if="lastTrade" class="dld__last">last trade {{ fmtP(lastTrade.avg_price) }}p · {{ fromNow(lastTrade.datetime) }}</span>
    <div v-if="marketItem.tags && marketItem.tags.length" class="dld__tags">
      <span v-for="(t, ti) in marketItem.tags.slice(0, 4)" :key="ti" class="dld__tag">{{ fmtTag(t) }}</span>
    </div>
    <a v-if="wmUrl" class="dld__wm" :href="wmUrl" target="_blank" rel="noopener">View on Warframe.Market ↗</a>
  </div>
</section>
<section v-else-if="itemName" class="dld__market dld__market--none">
  Not traded on Warframe Market
</section>
```

- [ ] **Step 3: Add scoped styles**

In `<style scoped>`, append (before the closing `</style>`):

```css
.dld__market {
  padding: 12px 20px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.16);
  background: rgba(200, 168, 92, 0.03);
}
.dld__market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(74px, 1fr));
  gap: 8px 14px;
}
.dld__mstat { display: flex; flex-direction: column; min-width: 0; }
.dld__mlbl {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase;
  letter-spacing: 0.1em; font-size: 0.6rem; color: #8f95ab;
}
.dld__mval { font-variant-numeric: tabular-nums; color: #eef1f8; font-size: 0.98rem; font-weight: 600; }
.dld__mval.is-thin { color: #e0a3a3; }
.dld__market-foot {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin-top: 10px;
}
.dld__flag {
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.06em;
  font-size: 0.68rem; color: #c8a85c;
}
.dld__flag.is-warn { color: #e0a3a3; }
.dld__last { font-size: 0.74rem; color: #8f95ab; }
.dld__tags { display: inline-flex; flex-wrap: wrap; gap: 5px; }
.dld__tag {
  font-family: 'Rajdhani', sans-serif; font-size: 0.66rem; color: #b6bcd0;
  border: 1px solid rgba(255,255,255,0.12); padding: 1px 6px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.04em;
}
.dld__wm {
  margin-left: auto;
  font-family: 'Rajdhani', sans-serif; text-transform: uppercase; letter-spacing: 0.08em;
  font-size: 0.74rem; color: #35d6d0; text-decoration: none; white-space: nowrap;
}
.dld__wm:hover { color: #7ff0eb; text-decoration: underline; }
.dld__market--none {
  font-family: 'Rajdhani', sans-serif; font-size: 0.82rem; color: #8f95ab; font-style: italic;
}
```

- [ ] **Step 4: Verify by running the app**

Run the dev app (see repo dev setup — Nuxt on :3000, API on :3529). Open the home page, click a **Drops** link on any tradeable item (e.g. a Prime part). Expected: the dialog shows the market strip with Buy/Sell/Avg 48h/Diff/Vol 48h/Updated matching that item's row in the home table, a working **View on Warframe.Market ↗** link, and (for a low-volume item) a muted `⚠ thin` / `⚠ price above recent avg` flag. Click Drops on an untradeable item (Forma) → shows "Not traded on Warframe Market". Drop-location sections below still load unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/components/DropLocationsDialog.vue
git commit -m "feat(drops-dialog): live market snapshot + Warframe.Market link"
```

---

### Task 3: Inline market signal on Star Chart reward rows

**Files:**
- Modify: `app/pages/star-chart.vue`

**Interfaces:**
- Consumes: `buildItemIndex`, `resolveMarketItem`, `marketSignal` from `../utils/marketLookup`; existing Vuex getter `all_items` (already mapped as `allItems`).
- Produces: no new exports.

- [ ] **Step 1: Add the import**

Below the existing `import DropLocationsDialog from '../components/DropLocationsDialog.vue'` (line ~211), add:

```ts
import { buildItemIndex, resolveMarketItem, marketSignal } from '../utils/marketLookup'
```

- [ ] **Step 2: Add computed index + a per-reward meta method**

In `computed` (which already has `...mapGetters({ allItems: 'all_items' })`), add:

```ts
itemIndex(): any {
  return buildItemIndex((this.allItems as any[]) || [])
},
```

In `methods`, add:

```ts
// Resolve a reward's live market from the store for the inline volume signal.
rewardMeta(rw: any): { vol: number | null; thin: boolean; note: string } {
  const item = resolveMarketItem(rw && rw.itemName, this.itemIndex)
  const market = item && item.market ? item.market : null
  const sig = marketSignal(market)
  return { vol: market ? Number(market.volume) || 0 : null, thin: sig.thin, note: sig.note }
},
```

- [ ] **Step 3: Update the reward row's plat cell (template)**

Replace the existing plat span (line ~171):

```html
<span class="sc-reward__plat">{{ rw.tradeable ? fmtPlat(rw.price) + 'p' : '—' }}</span>
```

with:

```html
<span class="sc-reward__plat">
  <template v-if="rw.tradeable">
    <span class="sc-reward__price">{{ fmtPlat(rw.price) }}p</span>
    <small v-if="rewardMeta(rw).vol !== null" class="sc-reward__vol" :class="{ 'is-thin': rewardMeta(rw).thin }" :title="rewardMeta(rw).note">
      vol {{ rewardMeta(rw).vol }}<template v-if="rewardMeta(rw).thin"> ⚠</template>
    </small>
  </template>
  <template v-else>—</template>
</span>
```

- [ ] **Step 4: Add scoped styles**

In `<style scoped>`, append before `/* ---- find ---- */`:

```css
.sc-reward__plat { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }
.sc-reward__price { font-family: 'Rajdhani', sans-serif; font-weight: 600; color: #e7cf95; font-size: 0.9rem; }
.sc-reward__vol {
  font-family: 'Rajdhani', sans-serif; font-size: 0.62rem; color: #8f95ab;
  text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
}
.sc-reward__vol.is-thin { color: #e0a3a3; }
```

(The existing `.sc-reward__plat` rule sets `color`/`font` — leave it; the new flex rule extends it. If duplicate selectors are undesirable, merge the two `.sc-reward__plat` declarations into one.)

- [ ] **Step 5: Verify by running the app**

Open `/star-chart`, select a rich planet, expand its top node. Expected: each tradeable reward shows `{price}p` with a small `vol N` beneath; low-volume rewards show `vol N ⚠` in muted red with the `note` as the hover title. Untradeable rewards still show `—`. Clicking a reward name opens the dialog with the Task 2 snapshot.

- [ ] **Step 6: Commit**

```bash
git add app/pages/star-chart.vue
git commit -m "feat(star-chart): inline volume + thin signal on reward rows"
```

---

## Self-Review

**Spec coverage:**
- Inline signal on star chart rows → Task 3. ✓
- Full market snapshot in shared dialog (all 4 pages, via store lookup) → Task 2. ✓
- Warframe.Market link → Task 2 (`wmUrl`). ✓
- Client-side Vuex lookup, no backend → all tasks; Global Constraints. ✓
- Name-match parity with DropService → Task 1 `matchKeys`/`normalizeName`. ✓
- Subtle thin/overpriced flag, thresholds 3 / 1.4 → Task 1 `marketSignal`; Tasks 2–3 render it. ✓
- Edge cases (untradeable → "Not traded" / `—`; missing priceUpdate hidden; missing last_completed omitted; avg_price 0 guard) → Task 1 tests + Task 2 template guards. ✓
- Unit tests for the pure util → Task 1. UI verified by app run → Tasks 2–3. ✓

**Placeholder scan:** none — every step has full code and exact commands.

**Type consistency:** `buildItemIndex`/`resolveMarketItem`/`marketSignal`/`matchKeys`/`normalizeName` signatures identical across Task 1 (definition) and Tasks 2–3 (consumers). `MarketItem` imported where used. Threshold constants (`THIN_VOLUME=3`, `OVERPRICED_RATIO=1.4`) consistent between plan, tests, and impl.
