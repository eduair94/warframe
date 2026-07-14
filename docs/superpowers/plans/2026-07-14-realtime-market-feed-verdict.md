# Real-time Market Feed + Buy/Sell Verdict Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a near-real-time market feed (live best online buy/sell per item) plus a buy/sell "worth it" verdict, streamed to the Nuxt front over our own Socket.IO server, with the existing daily sync untouched.

**Architecture:** A new isolated PM2 process `warframe-live` reuses the existing proxy-backed HTTP stack to fast-poll a bounded "hot set" of items (the shippable real-time floor), maintains an in-memory order book + presence, computes a blended fair-value verdict, and broadcasts `{book, verdict}` over a Socket.IO server. A later, kill-switched `WfmSocketClient` upgrades the feed to a true wf.market socket behind the same adapter, auto-degrading to the poller. The front adds a singleton `liveFeed` client, a reusable `MarketVerdictBadge`, and a `/live` page; write-through keeps Mongo snapshots hot.

**Tech Stack:** TypeScript (Node 24, CommonJS, tsc `-p tsconfig.production.json`), Mongoose 6 (legacy callback style), `socket.io` v4 (server) / `socket.io-client` v4 (front + wfm client), existing `WarframeUndici`/`MarketService`/`OrderCalculator`/`ItemService`/`PriceHistoryService`, Nuxt 2 + Vuetify 2 (Options API), Jest + ts-jest.

## Global Constraints

- **Node 24; no `engines` field.** Use `socket.io@^4.8` and `socket.io-client@^4.8` (bundle their own engine.io/ws). Do NOT reuse the app's transitive `ws@7.5.9`.
- **New root entrypoint `live.ts` auto-compiles** to `dist/live.js` (tsconfig `include: ["./**/*.ts"]`, no `rootDir`). Keep it at repo root; keep new backend modules under `services/live/` (compiles to `dist/services/live/`).
- **Bootstrap order is load-bearing:** every entrypoint's FIRST line is `import "./env";`, THEN `await MongooseServer.startConnectionPromise();` before any DB access, THEN work; file ends with a bare `main()` call.
- **Do NOT import `./Express/ExpressSetup` or `./Express/Express` from `live.ts`** — the `Express` constructor calls `this.start()` and binds port 3529. Build a plain `http.createServer()` + `new Server(httpServer, {cors})` on `LIVE_PORT`.
- **wf.market API bases** (`constants/index.ts` `API_URLS`): orders/items = `WARFRAME_MARKET_V2` (`https://api.warframe.market/v2`); statistics = `WARFRAME_MARKET` (`https://api.warframe.market/v1`). Reuse `MarketService`, never hand-roll URLs.
- **Mongo write-through replaces the whole `market` subdoc** (`getAnUpdateEntry` is not a deep merge) — always pass the complete `market` object. `priceUpdate` is a top-level item field, not inside `market`.
- **Front is Nuxt 2 / Vuetify 2, `components: false`** — every component is manually imported + registered in a local `components: {}`. Data fetch via `asyncData({$axios,$config})` or `this.$axios`/`this.$config`. Every page MUST hide `#spinner-wrapper` on mount via the recursive `finishLoading()` idiom or it spins forever.
- **Order status semantics:** best online price uses `OrderCalculator.calculatePrices(orders, {requiredStatus:'ingame', fallbackStatuses:['online'], topOrdersCount:5})` — `ingame` preferred, `online` fallback. Missing status defaults to `'offline'`.
- **Alerts stay client-side.** No server-side web-push/service-worker in scope. Real-time alerting = drive the existing `checkAlerts()` off live-feed events.
- **Secrets:** `WARFRAME_EMAIL` / `WARFRAME_PASWORD` (spelling per user's `.env`), plus socket cookies, live only in `.env` (gitignored). Document every new key in `.env.example` with placeholder values only.

---

## Phase 0 — Dependencies & config scaffold

### Task 0: Install deps, add config module, env docs

**Files:**
- Modify: `package.json` (root deps + scripts)
- Modify: `app/package.json` (front dep)
- Create: `services/live/LiveConfig.ts`
- Test: `services/live/LiveConfig.test.ts`
- Modify: `.env.example`
- Modify: `ecosystem.config.js`

**Interfaces:**
- Produces: `LiveConfig` (frozen object) with fields `port:number`, `feedMode:'socket'|'poller'|'off'`, `maxSubscriptions:number`, `pollIntervalMs:number`, `platform:string`, `corsOrigin:string|string[]`, `fvHalfVolume:number`, `baseBandPct:number`, `maxBandPct:number`, `confMin:number`, `fvRefreshMs:number`, `hotFloorList:string[]`.
- Produces: `readLiveConfig(env: NodeJS.ProcessEnv): LiveConfig` (pure, for tests).

- [ ] **Step 1: Install packages**

Run:
```bash
npm install socket.io@^4.8
cd app && npm install socket.io-client@^4.8 && cd ..
```
Expected: both `package.json` files gain the dep; no peer errors on Node 24.

- [ ] **Step 2: Write the failing test for `readLiveConfig`**

Create `services/live/LiveConfig.test.ts`:
```ts
import { readLiveConfig } from './LiveConfig';

describe('readLiveConfig', () => {
  it('applies defaults when env is empty', () => {
    const c = readLiveConfig({});
    expect(c.port).toBe(3530);
    expect(c.feedMode).toBe('poller'); // poller is the shippable default until the socket spike lands
    expect(c.maxSubscriptions).toBe(150);
    expect(c.pollIntervalMs).toBe(6000);
    expect(c.platform).toBe('pc');
    expect(c.confMin).toBeCloseTo(0.25);
    expect(c.hotFloorList).toEqual([]);
  });

  it('parses overrides and CSV lists', () => {
    const c = readLiveConfig({
      LIVE_PORT: '4000',
      LIVE_FEED_MODE: 'socket',
      LIVE_MAX_SUBSCRIPTIONS: '50',
      LIVE_POLL_INTERVAL_MS: '3000',
      LIVE_PLATFORM: 'ps4',
      LIVE_CORS_ORIGIN: 'https://a.com,https://b.com',
      LIVE_HOT_FLOOR: 'mirage_prime_set, octavia_prime_set',
    });
    expect(c.port).toBe(4000);
    expect(c.feedMode).toBe('socket');
    expect(c.maxSubscriptions).toBe(50);
    expect(c.corsOrigin).toEqual(['https://a.com', 'https://b.com']);
    expect(c.hotFloorList).toEqual(['mirage_prime_set', 'octavia_prime_set']);
  });

  it('falls back to poller on an invalid feed mode', () => {
    expect(readLiveConfig({ LIVE_FEED_MODE: 'bogus' }).feedMode).toBe('poller');
  });
});
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npx jest services/live/LiveConfig.test.ts`
Expected: FAIL — cannot find module `./LiveConfig`.

- [ ] **Step 4: Implement `LiveConfig.ts`**

Create `services/live/LiveConfig.ts`:
```ts
/**
 * Central env-driven config for the warframe-live process. Pure reader
 * (readLiveConfig) so it is unit-testable; LiveConfig is the frozen instance
 * built from process.env for real use.
 */
export interface LiveConfig {
  port: number;
  feedMode: 'socket' | 'poller' | 'off';
  maxSubscriptions: number;
  pollIntervalMs: number;
  platform: string;
  corsOrigin: string | string[];
  fvHalfVolume: number;   // volume at which avg_price gets 50% weight vs history median
  baseBandPct: number;    // base +/- band (fraction) around FV before a signal fires
  maxBandPct: number;     // cap on the volatility-widened band
  confMin: number;        // below this confidence -> verdict 'hold'
  fvRefreshMs: number;    // how often the FV baseline is reloaded from Mongo
  hotFloorList: string[]; // always-on url_names regardless of viewers
}

function int(v: string | undefined, dflt: number): number {
  const n = v == null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? n : dflt;
}
function csv(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

export function readLiveConfig(env: NodeJS.ProcessEnv): LiveConfig {
  const mode = env.LIVE_FEED_MODE;
  const feedMode: LiveConfig['feedMode'] =
    mode === 'socket' || mode === 'off' ? mode : 'poller';
  const origins = csv(env.LIVE_CORS_ORIGIN);
  return {
    port: int(env.LIVE_PORT, 3530),
    feedMode,
    maxSubscriptions: int(env.LIVE_MAX_SUBSCRIPTIONS, 150),
    pollIntervalMs: int(env.LIVE_POLL_INTERVAL_MS, 6000),
    platform: env.LIVE_PLATFORM || 'pc',
    corsOrigin: origins.length === 0 ? '*' : origins.length === 1 ? origins[0] : origins,
    fvHalfVolume: int(env.LIVE_FV_HALF_VOLUME, 50),
    baseBandPct: Number(env.LIVE_BASE_BAND_PCT) || 0.08,
    maxBandPct: Number(env.LIVE_MAX_BAND_PCT) || 0.25,
    confMin: Number(env.LIVE_CONF_MIN) || 0.25,
    fvRefreshMs: int(env.LIVE_FV_REFRESH_MS, 10 * 60 * 1000),
    hotFloorList: csv(env.LIVE_HOT_FLOOR),
  };
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const LiveConfig: LiveConfig = Object.freeze(readLiveConfig(process.env));
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npx jest services/live/LiveConfig.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Document env keys in `.env.example`**

Append to `.env.example`:
```bash
# --- Real-time live feed (warframe-live process) ---
LIVE_PORT=3530
# socket | poller | off  (poller = reliable near-real-time floor; socket = spike upgrade)
LIVE_FEED_MODE=poller
LIVE_MAX_SUBSCRIPTIONS=150
LIVE_POLL_INTERVAL_MS=6000
LIVE_PLATFORM=pc
# comma-separated allowed origins for the Socket.IO server (blank = allow all)
LIVE_CORS_ORIGIN=
# comma-separated url_names to keep live even with no viewers
LIVE_HOT_FLOOR=
# fair-value / verdict tuning (safe defaults; leave blank to use them)
LIVE_FV_HALF_VOLUME=50
LIVE_BASE_BAND_PCT=0.08
LIVE_MAX_BAND_PCT=0.25
LIVE_CONF_MIN=0.25
LIVE_FV_REFRESH_MS=600000
# dedicated wf.market account for the socket spike (Phase B). Programmatic login is
# unreliable through Cloudflare; the reliable path is pasting cookies exported from a
# logged-in browser session of this account.
WARFRAME_EMAIL=
WARFRAME_PASWORD=
WARFRAME_JWT=
WARFRAME_CF_CLEARANCE=
```

- [ ] **Step 7: Add the PM2 app entry**

In `ecosystem.config.js`, add to the `apps` array (copy the `warframe-server` shape):
```js
{
    name: "warframe-live",
    autorestart: true,
    script: "dist/live.js",
    log_date_format: "YYYY-MM-DD HH:mm Z",
},
```

- [ ] **Step 8: Add root dev script**

In `package.json` `scripts`, add:
```json
"dev:live": "ts-node-dev --respawn --transpile-only live.ts",
```

- [ ] **Step 9: Commit**

```bash
git add package.json app/package.json package-lock.json app/package-lock.json services/live/LiveConfig.ts services/live/LiveConfig.test.ts .env.example ecosystem.config.js
git commit -m "chore(live): scaffold warframe-live config, deps, pm2 entry"
```

---

## Phase 1 — Core domain (pure, fully unit-tested)

### Task 1: Shared live types

**Files:**
- Create: `services/live/LiveTypes.ts`

**Interfaces:**
- Produces: the types every later task imports. No logic, no test (types only).

- [ ] **Step 1: Create `LiveTypes.ts`**

```ts
/** Normalized order — the snake_case subset of transformV2OrdersToV1 output we need. */
export interface NormalizedOrder {
  id: string;
  order_type: 'buy' | 'sell';
  platinum: number;
  quantity: number;
  visible: boolean;
  platform: string;
  mod_rank?: number;
  subtype?: string;
  user: { id?: string; ingame_name?: string; status: 'ingame' | 'online' | 'offline' };
}

/** Best online prices + depth for one item, recomputed on every delta. */
export interface LiveBook {
  url_name: string;
  bestBuy: number;   // highest online buy (what you get selling now)
  bestSell: number;  // lowest online sell (what you pay buying now)
  buyAvg: number;
  sellAvg: number;
  onlineBuyCount: number;
  onlineSellCount: number;
  updatedAt: number; // epoch ms
}

/** Fair-value baseline inputs, loaded from Mongo (no extra HTTP). */
export interface FairValueInputs {
  url_name: string;
  avg_price: number;      // wf.market 48h realized average (item.market.avg_price)
  medianHistory: number;  // rolling median of stored daily-history price
  volatility: number | null;
  dataDays: number;
  volume: number;
}

export type VerdictKind = 'buy' | 'sell' | 'fair' | 'hold';

export interface Verdict {
  url_name: string;
  verdict: VerdictKind;
  score: number;       // -100 (overpriced) .. +100 (bargain)
  confidence: number;  // 0..1
  fv: number;
  bestBuy: number;
  bestSell: number;
  dealPct: number;     // (fv - bestSell) / fv
  flipMargin: number;  // bestSell - bestBuy
  reason: string;
}

/** What the Socket.IO server streams to the front for one item. */
export interface LiveUpdate {
  url_name: string;
  book: LiveBook;
  verdict: Verdict;
}

/** Normalized events emitted by any WfmFeed implementation. */
export interface FeedSnapshot { url_name: string; orders: NormalizedOrder[]; }
export interface PresenceChange { userId: string; status: 'ingame' | 'online' | 'offline'; }
export interface FeedDelta {
  url_name: string;
  upserts?: NormalizedOrder[];
  removeIds?: string[];
  presence?: PresenceChange[];
}
```

- [ ] **Step 2: Commit**

```bash
git add services/live/LiveTypes.ts
git commit -m "feat(live): shared live-feed types"
```

---

### Task 2: LiveStore — in-memory order book + presence

**Files:**
- Create: `services/live/LiveStore.ts`
- Test: `services/live/LiveStore.test.ts`

**Interfaces:**
- Consumes: `NormalizedOrder`, `LiveBook`, `FeedSnapshot`, `FeedDelta` from `LiveTypes`; `OrderCalculator.calculatePrices` from `../OrderCalculator`.
- Produces: `class LiveStore` with `applySnapshot(s: FeedSnapshot): LiveBook`, `applyDelta(d: FeedDelta): LiveBook`, `getBook(url_name: string): LiveBook | null`, `has(url_name: string): boolean`, `drop(url_name: string): void`, `size(): number`. Constructor `new LiveStore(platform: string)`.

- [ ] **Step 1: Write the failing test**

Create `services/live/LiveStore.test.ts`:
```ts
import { LiveStore } from './LiveStore';
import { NormalizedOrder } from './LiveTypes';

const ord = (p: Partial<NormalizedOrder> & { id: string }): NormalizedOrder => ({
  order_type: 'sell', platinum: 10, quantity: 1, visible: true, platform: 'pc',
  user: { id: 'u' + p.id, status: 'ingame' }, ...p,
});

describe('LiveStore', () => {
  it('computes best online buy/sell from a snapshot (ingame preferred)', () => {
    const s = new LiveStore('pc');
    const book = s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 20, user: { id: 'a', status: 'ingame' } }),
      ord({ id: '2', order_type: 'sell', platinum: 15, user: { id: 'b', status: 'ingame' } }),
      ord({ id: '3', order_type: 'sell', platinum: 9,  user: { id: 'c', status: 'offline' } }), // ignored
      ord({ id: '4', order_type: 'buy',  platinum: 12, user: { id: 'd', status: 'ingame' } }),
      ord({ id: '5', order_type: 'buy',  platinum: 8,  user: { id: 'e', status: 'ingame' } }),
    ]});
    expect(book.bestSell).toBe(15);
    expect(book.bestBuy).toBe(12);
    expect(book.onlineSellCount).toBe(2);
    expect(book.onlineBuyCount).toBe(2);
  });

  it('raises bestSell when the cheapest seller goes offline (presence delta)', () => {
    const s = new LiveStore('pc');
    s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 15, user: { id: 'b', status: 'ingame' } }),
      ord({ id: '2', order_type: 'sell', platinum: 20, user: { id: 'a', status: 'ingame' } }),
    ]});
    const book = s.applyDelta({ url_name: 'x', presence: [{ userId: 'b', status: 'offline' }] });
    expect(book.bestSell).toBe(20);
  });

  it('applies upserts and removes', () => {
    const s = new LiveStore('pc');
    s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 20, user: { id: 'a', status: 'ingame' } }),
    ]});
    let book = s.applyDelta({ url_name: 'x', upserts: [
      ord({ id: '2', order_type: 'sell', platinum: 11, user: { id: 'b', status: 'ingame' } }),
    ]});
    expect(book.bestSell).toBe(11);
    book = s.applyDelta({ url_name: 'x', removeIds: ['2'] });
    expect(book.bestSell).toBe(20);
  });

  it('ignores wrong-platform and invisible orders', () => {
    const s = new LiveStore('pc');
    const book = s.applySnapshot({ url_name: 'x', orders: [
      ord({ id: '1', order_type: 'sell', platinum: 5, platform: 'xbox', user: { id: 'a', status: 'ingame' } }),
      ord({ id: '2', order_type: 'sell', platinum: 7, visible: false, user: { id: 'b', status: 'ingame' } }),
      ord({ id: '3', order_type: 'sell', platinum: 13, user: { id: 'c', status: 'ingame' } }),
    ]});
    expect(book.bestSell).toBe(13);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/LiveStore.test.ts`
Expected: FAIL — cannot find module `./LiveStore`.

- [ ] **Step 3: Implement `LiveStore.ts`**

```ts
import { OrderCalculator, IOrderData } from '../OrderCalculator';
import { NormalizedOrder, LiveBook, FeedSnapshot, FeedDelta } from './LiveTypes';

/**
 * In-memory order book + presence for the hot set. One instance holds every
 * subscribed item, each as a Map<orderId, NormalizedOrder>. Best online prices
 * are recomputed with the SAME OrderCalculator the sync uses (ingame preferred,
 * online fallback), so live numbers match the daily snapshot's methodology.
 */
export class LiveStore {
  private readonly books = new Map<string, Map<string, NormalizedOrder>>();

  constructor(private readonly platform: string) {}

  applySnapshot(s: FeedSnapshot): LiveBook {
    const m = new Map<string, NormalizedOrder>();
    for (const o of s.orders) m.set(o.id, o);
    this.books.set(s.url_name, m);
    return this.compute(s.url_name);
  }

  applyDelta(d: FeedDelta): LiveBook {
    const m = this.books.get(d.url_name) ?? new Map<string, NormalizedOrder>();
    if (d.upserts) for (const o of d.upserts) m.set(o.id, o);
    if (d.removeIds) for (const id of d.removeIds) m.delete(id);
    if (d.presence) {
      for (const p of d.presence) {
        for (const o of m.values()) {
          if (o.user.id === p.userId) o.user.status = p.status;
        }
      }
    }
    this.books.set(d.url_name, m);
    return this.compute(d.url_name);
  }

  getBook(url_name: string): LiveBook | null {
    return this.books.has(url_name) ? this.compute(url_name) : null;
  }
  has(url_name: string): boolean { return this.books.has(url_name); }
  drop(url_name: string): void { this.books.delete(url_name); }
  size(): number { return this.books.size; }

  private compute(url_name: string): LiveBook {
    const m = this.books.get(url_name) ?? new Map<string, NormalizedOrder>();
    const usable = Array.from(m.values()).filter(
      (o) => o.visible && o.platform === this.platform
    );
    const orders: IOrderData[] = usable.map((o) => ({
      order_type: o.order_type,
      platinum: o.platinum,
      mod_rank: o.mod_rank,
      subtype: o.subtype,
      user: { status: o.user.status },
    }));
    const prices = OrderCalculator.calculatePrices(orders, {
      requiredStatus: 'ingame',
      fallbackStatuses: ['online'],
      topOrdersCount: 5,
    });
    // Raw liquidity metric: total ingame+online orders on each side. Note this is
    // a UNION of both statuses, whereas bestBuy/bestSell come from OrderCalculator's
    // ingame-first-then-online-only-if-empty bucket — so a count can be >0 while the
    // matching best price is 0 (e.g. ingame sells exist but only online buys). That's
    // intentional: the count reflects book depth, the price reflects the tradeable tier.
    const onlineOf = (t: 'buy' | 'sell') =>
      usable.filter((o) => o.order_type === t && (o.user.status === 'ingame' || o.user.status === 'online')).length;
    return {
      url_name,
      bestBuy: prices.buy,
      bestSell: prices.sell,
      buyAvg: prices.buyAvg,
      sellAvg: prices.sellAvg,
      onlineBuyCount: onlineOf('buy'),
      onlineSellCount: onlineOf('sell'),
      updatedAt: Date.now(),
    };
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/LiveStore.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/LiveStore.ts services/live/LiveStore.test.ts
git commit -m "feat(live): in-memory order book + presence (LiveStore)"
```

---

### Task 3: VerdictEngine — blended fair value + buy/sell signal

**Files:**
- Create: `services/live/VerdictEngine.ts`
- Test: `services/live/VerdictEngine.test.ts`

**Interfaces:**
- Consumes: `LiveBook`, `FairValueInputs`, `Verdict` from `LiveTypes`; `LiveConfig` shape (pass the relevant knobs in, so the function stays pure).
- Produces: `computeFairValue(fv: FairValueInputs, halfVolume: number): number`; `computeVerdict(book: LiveBook, fv: FairValueInputs, opts: VerdictOpts): Verdict` where `VerdictOpts = { halfVolume: number; baseBandPct: number; maxBandPct: number; confMin: number }`.

- [ ] **Step 1: Write the failing test**

Create `services/live/VerdictEngine.test.ts`:
```ts
import { computeFairValue, computeVerdict } from './VerdictEngine';
import { LiveBook, FairValueInputs } from './LiveTypes';

const OPTS = { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25 };
const book = (p: Partial<LiveBook>): LiveBook => ({
  url_name: 'x', bestBuy: 0, bestSell: 0, buyAvg: 0, sellAvg: 0,
  onlineBuyCount: 5, onlineSellCount: 5, updatedAt: 0, ...p,
});
const fv = (p: Partial<FairValueInputs>): FairValueInputs => ({
  url_name: 'x', avg_price: 100, medianHistory: 100, volatility: 5,
  dataDays: 40, volume: 100, ...p,
});

describe('computeFairValue', () => {
  it('blends avg_price and history median by liquidity weight', () => {
    // volume 50 == halfVolume -> w = 0.5 -> midpoint
    expect(computeFairValue(fv({ avg_price: 120, medianHistory: 80, volume: 50 }), 50)).toBeCloseTo(100);
  });
  it('leans on history when avg_price is 0 (no trades)', () => {
    expect(computeFairValue(fv({ avg_price: 0, medianHistory: 90, volume: 999 }), 50)).toBeCloseTo(90);
  });
  it('leans on avg_price when no history', () => {
    expect(computeFairValue(fv({ avg_price: 110, medianHistory: 0, volume: 1 }), 50)).toBeCloseTo(110);
  });
});

describe('computeVerdict', () => {
  it('flags a good BUY when bestSell is well below FV', () => {
    const v = computeVerdict(book({ bestSell: 80, bestBuy: 70 }), fv({ avg_price: 100, medianHistory: 100, volume: 100 }), OPTS);
    expect(v.verdict).toBe('buy');
    expect(v.dealPct).toBeCloseTo(0.2);
    expect(v.score).toBeGreaterThan(0);
    expect(v.flipMargin).toBe(10);
  });
  it('flags a good SELL when bestBuy is well above FV', () => {
    const v = computeVerdict(book({ bestSell: 130, bestBuy: 125 }), fv({ avg_price: 100, medianHistory: 100, volume: 100 }), OPTS);
    expect(v.verdict).toBe('sell');
    expect(v.score).toBeLessThan(0);
  });
  it('is fair inside the band', () => {
    const v = computeVerdict(book({ bestSell: 101, bestBuy: 99 }), fv({ volume: 100 }), OPTS);
    expect(v.verdict).toBe('fair');
  });
  it('holds when confidence is too low (thin book, no history)', () => {
    const v = computeVerdict(
      book({ bestSell: 50, bestBuy: 40, onlineBuyCount: 1, onlineSellCount: 1 }),
      fv({ volume: 1, dataDays: 0 }), OPTS
    );
    expect(v.verdict).toBe('hold');
  });
  it('widens the band for volatile items (no buy signal at 8% when volatility is high)', () => {
    const v = computeVerdict(
      book({ bestSell: 93, bestBuy: 90 }),
      fv({ avg_price: 100, medianHistory: 100, volume: 100, volatility: 60 }), OPTS
    );
    expect(v.verdict).not.toBe('buy'); // 7% deal < widened band
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/VerdictEngine.test.ts`
Expected: FAIL — cannot find module `./VerdictEngine`.

- [ ] **Step 3: Implement `VerdictEngine.ts`**

```ts
import { LiveBook, FairValueInputs, Verdict, VerdictKind } from './LiveTypes';

export interface VerdictOpts {
  halfVolume: number;
  baseBandPct: number;
  maxBandPct: number;
  confMin: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Liquidity-weighted blend of realized avg_price and history median.
 * w = volume / (volume + halfVolume): high volume trusts realized trades,
 * thin items lean on the slower history median. Degenerate inputs (missing
 * avg_price or missing history) collapse to the side that has data.
 */
export function computeFairValue(fv: FairValueInputs, halfVolume: number): number {
  const avg = fv.avg_price > 0 ? fv.avg_price : 0;
  const med = fv.medianHistory > 0 ? fv.medianHistory : 0;
  if (avg <= 0 && med <= 0) return 0;
  if (avg <= 0) return med;
  if (med <= 0) return avg;
  const w = fv.volume / (fv.volume + halfVolume);
  return w * avg + (1 - w) * med;
}

/** Confidence 0..1 from realized volume, live book depth, and history depth. */
function confidenceOf(book: LiveBook, fv: FairValueInputs): number {
  const vol = clamp(fv.volume / 30, 0, 1);
  const depth = clamp((book.onlineBuyCount + book.onlineSellCount) / 6, 0, 1);
  const hist = clamp(fv.dataDays / 30, 0, 1);
  return clamp(0.4 * vol + 0.3 * depth + 0.3 * hist, 0, 1);
}

/** Volatility widens the neutral band so jumpy items don't cry wolf. */
function bandOf(fv: FairValueInputs, o: VerdictOpts): number {
  const factor = 1 + clamp((fv.volatility ?? 0) / 50, 0, 1); // up to 2x
  return Math.min(o.baseBandPct * factor, o.maxBandPct);
}

export function computeVerdict(book: LiveBook, fvIn: FairValueInputs, o: VerdictOpts): Verdict {
  const fair = computeFairValue(fvIn, o.halfVolume);
  const confidence = confidenceOf(book, fvIn);
  const band = bandOf(fvIn, o);

  const buySignal = fair > 0 && book.bestSell > 0 ? (fair - book.bestSell) / fair : 0;   // + = cheap to buy
  const sellSignal = fair > 0 && book.bestBuy > 0 ? (book.bestBuy - fair) / fair : 0;     // + = rich to sell
  const dealPct = fair > 0 && book.bestSell > 0 ? (fair - book.bestSell) / fair : 0;
  const flipMargin = book.bestSell > 0 && book.bestBuy > 0 ? book.bestSell - book.bestBuy : 0;
  const score = Math.round(clamp(buySignal / (band || 1), -1, 1) * 100);

  let verdict: VerdictKind;
  let reason: string;
  if (fair <= 0 || confidence < o.confMin) {
    verdict = 'hold';
    reason = fair <= 0 ? 'no fair-value baseline yet' : 'insufficient liquidity/history to trust a signal';
  } else if (buySignal >= band) {
    verdict = 'buy';
    reason = `sell price ${Math.round(buySignal * 100)}% below fair value (${Math.round(fair)}p)`;
  } else if (sellSignal >= band) {
    verdict = 'sell';
    reason = `buyers paying ${Math.round(sellSignal * 100)}% above fair value (${Math.round(fair)}p)`;
  } else {
    verdict = 'fair';
    reason = `within ${Math.round(band * 100)}% of fair value (${Math.round(fair)}p)`;
  }

  return {
    url_name: book.url_name,
    verdict, score, confidence,
    fv: fair, bestBuy: book.bestBuy, bestSell: book.bestSell,
    dealPct, flipMargin, reason,
  };
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/VerdictEngine.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/VerdictEngine.ts services/live/VerdictEngine.test.ts
git commit -m "feat(live): blended fair-value + buy/sell verdict engine"
```

---

### Task 4: FairValueService — load FV baselines from Mongo

**Files:**
- Create: `services/live/FairValueService.ts`
- Test: `services/live/FairValueService.test.ts`

**Interfaces:**
- Consumes: `FairValueInputs` from `LiveTypes`; `ItemService` (`getItemsByUrlNames`), `PriceHistoryService` (`getHistory`), `MarketAnalyticsService` (`priceOf` is private — instead reuse its logic locally via a small median/volatility helper), all from `../`.
- Produces: `class FairValueService` with `constructor(deps: { getItems(urls: string[]): Promise<any[]>; getHistory(url: string): Promise<IPricePoint[]> })`, `async load(urls: string[]): Promise<Map<string, FairValueInputs>>`, `get(url: string): FairValueInputs | null`. Dependency-injected so it unit-tests without Mongo.
- Also produces pure helpers `median(nums: number[]): number` and `coeffVariation(nums: number[]): number | null` (exported for tests).

- [ ] **Step 1: Write the failing test**

Create `services/live/FairValueService.test.ts`:
```ts
import { FairValueService, median, coeffVariation } from './FairValueService';

describe('pure helpers', () => {
  it('median of odd and even length', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(0);
  });
  it('coeffVariation returns null below 3 points', () => {
    expect(coeffVariation([10, 10])).toBeNull();
    expect(coeffVariation([10, 10, 10])).toBeCloseTo(0);
  });
});

describe('FairValueService.load', () => {
  it('builds FairValueInputs joining market snapshot + history median', async () => {
    const svc = new FairValueService({
      getItems: async () => [
        { url_name: 'a', market: { avg_price: 120, sell: 110, volume: 42 } },
      ],
      getHistory: async () => [
        { date: '2026-01-01', buy: 0, sell: 0, avg_price: 90, volume: 3 },
        { date: '2026-01-02', buy: 0, sell: 0, avg_price: 100, volume: 3 },
        { date: '2026-01-03', buy: 0, sell: 0, avg_price: 110, volume: 3 },
      ],
    });
    const map = await svc.load(['a']);
    const fv = map.get('a')!;
    expect(fv.avg_price).toBe(120);
    expect(fv.medianHistory).toBe(100);
    expect(fv.volume).toBe(42);
    expect(fv.dataDays).toBe(3);
    expect(svc.get('a')).toEqual(fv);
  });

  it('falls back to sell when avg_price is missing in history points', async () => {
    const svc = new FairValueService({
      getItems: async () => [{ url_name: 'b', market: { avg_price: 0, sell: 50, volume: 0 } }],
      getHistory: async () => [
        { date: '2026-01-01', buy: 0, sell: 40, avg_price: 0, volume: 0 },
        { date: '2026-01-02', buy: 0, sell: 60, avg_price: 0, volume: 0 },
        { date: '2026-01-03', buy: 0, sell: 50, avg_price: 0, volume: 0 },
      ],
    });
    const fv = (await svc.load(['b'])).get('b')!;
    expect(fv.medianHistory).toBe(50); // priceOf falls back to sell
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/FairValueService.test.ts`
Expected: FAIL — cannot find module `./FairValueService`.

- [ ] **Step 3: Implement `FairValueService.ts`**

```ts
import { IPricePoint } from '../PriceHistoryService';
import { FairValueInputs } from './LiveTypes';

export function median(nums: number[]): number {
  const v = nums.filter((n) => n > 0).sort((a, b) => a - b);
  if (v.length === 0) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function coeffVariation(nums: number[]): number | null {
  const v = nums.filter((n) => n > 0);
  if (v.length < 3) return null;
  const mean = v.reduce((s, n) => s + n, 0) / v.length;
  if (mean <= 0) return null;
  const variance = v.reduce((s, n) => s + (n - mean) ** 2, 0) / v.length;
  return (Math.sqrt(variance) / mean) * 100;
}

/** Same rule as MarketAnalyticsService.priceOf: avg_price is truest, else sell. */
function priceOf(p: { avg_price?: number; sell?: number }): number {
  const avg = Number(p.avg_price) || 0;
  return avg > 0 ? avg : Number(p.sell) || 0;
}

export interface FairValueDeps {
  getItems(urls: string[]): Promise<any[]>;
  getHistory(url: string): Promise<IPricePoint[]>;
}

/**
 * Loads the fair-value baseline (realized avg_price + history median + volatility)
 * for a set of items straight from Mongo — no wf.market HTTP. Cached in memory and
 * refreshed on a timer by LiveGateway.
 */
export class FairValueService {
  private cache = new Map<string, FairValueInputs>();
  constructor(private readonly deps: FairValueDeps) {}

  async load(urls: string[]): Promise<Map<string, FairValueInputs>> {
    if (urls.length === 0) return this.cache;
    const items = await this.deps.getItems(urls);
    const byUrl = new Map<string, any>();
    for (const it of items) if (it && it.url_name) byUrl.set(it.url_name, it);

    for (const url of urls) {
      const it = byUrl.get(url);
      const market = (it && it.market) || {};
      let points: IPricePoint[] = [];
      try { points = (await this.deps.getHistory(url)) || []; } catch { points = []; }
      const prices = points.map((p) => priceOf(p));
      this.cache.set(url, {
        url_name: url,
        avg_price: Number(market.avg_price) || 0,
        medianHistory: median(prices),
        volatility: coeffVariation(prices),
        dataDays: points.length,
        volume: Number(market.volume) || 0,
      });
    }
    return this.cache;
  }

  get(url: string): FairValueInputs | null {
    return this.cache.get(url) ?? null;
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/FairValueService.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/FairValueService.ts services/live/FairValueService.test.ts
git commit -m "feat(live): fair-value baseline loader (Mongo-only, injectable)"
```

---

### Task 5: SubscriptionManager — bounded live slots + priority

**Files:**
- Create: `services/live/SubscriptionManager.ts`
- Test: `services/live/SubscriptionManager.test.ts`

**Interfaces:**
- Produces: `class SubscriptionManager` with `constructor(opts: { maxSubscriptions: number; hotFloor: string[] })`, `addViewer(url: string): void`, `removeViewer(url: string): void`, `liveSet(): string[]` (viewers + hotFloor, capped at `maxSubscriptions`, hotFloor always included, then by viewer count desc), `overflow(): string[]` (subscribed-but-over-cap → poller-only), `viewerCount(url: string): number`.

- [ ] **Step 1: Write the failing test**

Create `services/live/SubscriptionManager.test.ts`:
```ts
import { SubscriptionManager } from './SubscriptionManager';

describe('SubscriptionManager', () => {
  it('tracks viewer counts and drops to zero', () => {
    const m = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: [] });
    m.addViewer('a'); m.addViewer('a'); m.removeViewer('a');
    expect(m.viewerCount('a')).toBe(1);
    m.removeViewer('a');
    expect(m.viewerCount('a')).toBe(0);
    expect(m.liveSet()).not.toContain('a');
  });

  it('always keeps hotFloor items live', () => {
    const m = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: ['floor1', 'floor2'] });
    expect(m.liveSet().sort()).toEqual(['floor1', 'floor2']);
  });

  it('caps live set and prioritizes hotFloor then most-viewed', () => {
    const m = new SubscriptionManager({ maxSubscriptions: 2, hotFloor: ['floor'] });
    m.addViewer('x'); m.addViewer('x'); m.addViewer('y');
    const live = m.liveSet();
    expect(live).toContain('floor');   // hotFloor always in
    expect(live).toContain('x');       // most-viewed wins the remaining slot
    expect(live).not.toContain('y');
    expect(m.overflow()).toContain('y');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/SubscriptionManager.test.ts`
Expected: FAIL — cannot find module `./SubscriptionManager`.

- [ ] **Step 3: Implement `SubscriptionManager.ts`**

```ts
/**
 * Decides which items get a live subscription. hotFloor is always live; the rest
 * of the cap is filled by the most-viewed items. Anything subscribed beyond the
 * cap is "overflow" — LiveGateway routes it to the poller at a slower cadence
 * (or drops it entirely under mode=off).
 */
export class SubscriptionManager {
  private readonly viewers = new Map<string, number>();
  private readonly maxSubscriptions: number;
  private readonly hotFloor: string[];

  constructor(opts: { maxSubscriptions: number; hotFloor: string[] }) {
    this.maxSubscriptions = opts.maxSubscriptions;
    this.hotFloor = Array.from(new Set(opts.hotFloor));
  }

  addViewer(url: string): void {
    this.viewers.set(url, (this.viewers.get(url) ?? 0) + 1);
  }
  removeViewer(url: string): void {
    const n = (this.viewers.get(url) ?? 0) - 1;
    if (n <= 0) this.viewers.delete(url);
    else this.viewers.set(url, n);
  }
  viewerCount(url: string): number {
    return this.viewers.get(url) ?? 0;
  }

  private ranked(): string[] {
    const floor = new Set(this.hotFloor);
    const viewed = Array.from(this.viewers.entries())
      .filter(([url]) => !floor.has(url))
      .sort((a, b) => b[1] - a[1])
      .map(([url]) => url);
    return [...this.hotFloor, ...viewed];
  }

  liveSet(): string[] {
    return this.ranked().slice(0, this.maxSubscriptions);
  }
  overflow(): string[] {
    return this.ranked().slice(this.maxSubscriptions);
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/SubscriptionManager.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/SubscriptionManager.ts services/live/SubscriptionManager.test.ts
git commit -m "feat(live): bounded subscription manager with hotFloor priority"
```

---

## Phase 2 — Feed adapter + poller

### Task 6: WfmFeed adapter interface + order mapping

**Files:**
- Create: `services/live/WfmFeed.ts`
- Test: `services/live/WfmFeed.test.ts`

**Interfaces:**
- Consumes: `NormalizedOrder`, `FeedSnapshot`, `FeedDelta` from `LiveTypes`.
- Produces: `interface WfmFeed extends EventEmitter` (documented events `'snapshot' | 'delta' | 'status'`); `type FeedStatus = { source: 'poller' | 'socket'; up: boolean; detail?: string }`; pure mapper `mapV1OrdersToNormalized(v1Orders: any[]): NormalizedOrder[]` (maps the `{payload:{orders}}` rows MarketService returns).

- [ ] **Step 1: Write the failing test**

Create `services/live/WfmFeed.test.ts`:
```ts
import { mapV1OrdersToNormalized } from './WfmFeed';

describe('mapV1OrdersToNormalized', () => {
  it('maps the MarketService v1 order shape into NormalizedOrder', () => {
    const out = mapV1OrdersToNormalized([
      { id: 'o1', order_type: 'sell', platinum: 15, quantity: 2, visible: true, platform: 'pc',
        mod_rank: 3, subtype: 'radiant', user: { id: 'u1', ingame_name: 'Bob', status: 'ingame' } },
      { id: 'o2', order_type: 'buy', platinum: 9, /* quantity missing */ platform: 'pc',
        user: { status: 'online' } },
    ]);
    expect(out[0]).toEqual({
      id: 'o1', order_type: 'sell', platinum: 15, quantity: 2, visible: true, platform: 'pc',
      mod_rank: 3, subtype: 'radiant', user: { id: 'u1', ingame_name: 'Bob', status: 'ingame' },
    });
    expect(out[1].quantity).toBe(1);       // defaulted
    expect(out[1].visible).toBe(true);      // defaulted
    expect(out[1].user.status).toBe('online');
  });

  it('coerces an unknown status to offline and drops rows with no id', () => {
    const out = mapV1OrdersToNormalized([
      { order_type: 'sell', platinum: 5, platform: 'pc', user: { status: 'weird' } }, // no id -> dropped
      { id: 'o3', order_type: 'sell', platinum: 5, platform: 'pc', user: {} },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].user.status).toBe('offline');
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/WfmFeed.test.ts`
Expected: FAIL — cannot find module `./WfmFeed`.

- [ ] **Step 3: Implement `WfmFeed.ts`**

```ts
import { EventEmitter } from 'events';
import { NormalizedOrder, FeedSnapshot, FeedDelta } from './LiveTypes';

export type FeedStatus = { source: 'poller' | 'socket'; up: boolean; detail?: string };

/**
 * A source of live order data for the hot set. Implementations (HotPoller,
 * WfmSocketClient) emit the SAME normalized events so LiveGateway never cares
 * which one is running.
 *   emit('snapshot', FeedSnapshot)  — full order list for one item
 *   emit('delta', FeedDelta)        — incremental change for one item
 *   emit('status', FeedStatus)      — source up/down (drives poller fallback)
 */
export interface WfmFeed extends EventEmitter {
  subscribe(url_name: string): void;
  unsubscribe(url_name: string): void;
  setLiveSet(urls: string[]): void;
  start(): void;
  stop(): void;
}

const STATUSES = new Set(['ingame', 'online', 'offline']);

/** Maps the v1 `{payload:{orders}}` rows MarketService returns into NormalizedOrder[]. */
export function mapV1OrdersToNormalized(v1Orders: any[]): NormalizedOrder[] {
  const out: NormalizedOrder[] = [];
  for (const o of v1Orders || []) {
    if (!o || o.id == null) continue;
    const status = STATUSES.has(o?.user?.status) ? o.user.status : 'offline';
    out.push({
      id: String(o.id),
      order_type: o.order_type === 'buy' ? 'buy' : 'sell',
      platinum: Number(o.platinum) || 0,
      quantity: Number(o.quantity) || 1,
      visible: o.visible !== false,
      platform: o.platform || 'pc',
      mod_rank: o.mod_rank,
      subtype: o.subtype,
      user: { id: o?.user?.id, ingame_name: o?.user?.ingame_name, status },
    });
  }
  return out;
}

export type { FeedSnapshot, FeedDelta };
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/WfmFeed.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/WfmFeed.ts services/live/WfmFeed.test.ts
git commit -m "feat(live): WfmFeed adapter interface + v1 order mapper"
```

---

### Task 7: HotPoller — poll the v2 orders endpoint, emit snapshots

**Files:**
- Create: `services/live/HotPoller.ts`
- Test: `services/live/HotPoller.test.ts`

**Interfaces:**
- Consumes: `WfmFeed`, `FeedStatus`, `mapV1OrdersToNormalized` from `WfmFeed`; `NormalizedOrder` from `LiveTypes`.
- Produces: `class HotPoller extends EventEmitter implements WfmFeed`, `constructor(deps: { fetchOrders(url: string): Promise<any[]>; intervalMs: number; jitterMs?: number; now?: () => number; setTimer?: (fn, ms) => any; clearTimer?: (h) => void })`. `fetchOrders` returns the raw v1 orders array (`res.payload.orders`). Emits `'snapshot'` per polled item and `'status'` on fetch failure/recovery. Timer + clock are injected so it tests without real time.

- [ ] **Step 1: Write the failing test**

Create `services/live/HotPoller.test.ts`:
```ts
import { HotPoller } from './HotPoller';
import { FeedSnapshot, FeedStatus } from './WfmFeed';

describe('HotPoller', () => {
  it('emits a normalized snapshot for each live item on tick', async () => {
    const calls: string[] = [];
    const poller = new HotPoller({
      intervalMs: 1000,
      fetchOrders: async (url) => {
        calls.push(url);
        return [{ id: 'o1', order_type: 'sell', platinum: 12, platform: 'pc', user: { id: 'u', status: 'ingame' } }];
      },
      setTimer: () => 0, clearTimer: () => {},
    });
    const snaps: FeedSnapshot[] = [];
    poller.on('snapshot', (s: FeedSnapshot) => snaps.push(s));
    poller.setLiveSet(['a', 'b']);
    await (poller as any).tick();
    expect(calls.sort()).toEqual(['a', 'b']);
    expect(snaps.map((s) => s.url_name).sort()).toEqual(['a', 'b']);
    expect(snaps[0].orders[0].platinum).toBe(12);
  });

  it('emits status down then up around a fetch failure', async () => {
    let fail = true;
    const statuses: FeedStatus[] = [];
    const poller = new HotPoller({
      intervalMs: 1000,
      fetchOrders: async () => { if (fail) throw new Error('boom'); return []; },
      setTimer: () => 0, clearTimer: () => {},
    });
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.setLiveSet(['a']);
    await (poller as any).tick();          // fails
    fail = false;
    await (poller as any).tick();          // recovers
    expect(statuses.some((s) => s.up === false)).toBe(true);
    expect(statuses.some((s) => s.up === true)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/HotPoller.test.ts`
Expected: FAIL — cannot find module `./HotPoller`.

- [ ] **Step 3: Implement `HotPoller.ts`**

```ts
import { EventEmitter } from 'events';
import { WfmFeed, FeedStatus, mapV1OrdersToNormalized } from './WfmFeed';

export interface HotPollerDeps {
  fetchOrders(url: string): Promise<any[]>; // returns raw v1 orders (res.payload.orders)
  intervalMs: number;
  jitterMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => any;
  clearTimer?: (h: any) => void;
}

/**
 * Reliable near-real-time floor: on each tick, fetches orders for every item in
 * the live set through the existing proxy-backed HTTP stack and emits a full
 * snapshot. Sequential fetches with a small gap keep the proxy pool happy. This
 * is the source that ships; the socket client is an optional upgrade.
 */
export class HotPoller extends EventEmitter implements WfmFeed {
  private live: string[] = [];
  private timer: any = null;
  private running = false;
  private lastUp = true;
  private readonly d: Required<Pick<HotPollerDeps, 'setTimer' | 'clearTimer' | 'now'>> & HotPollerDeps;

  constructor(deps: HotPollerDeps) {
    super();
    this.d = {
      ...deps,
      now: deps.now ?? (() => Date.now()),
      setTimer: deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
      clearTimer: deps.clearTimer ?? ((h) => clearTimeout(h)),
    };
  }

  setLiveSet(urls: string[]): void { this.live = Array.from(new Set(urls)); }
  subscribe(url: string): void { if (!this.live.includes(url)) this.live.push(url); }
  unsubscribe(url: string): void { this.live = this.live.filter((u) => u !== url); }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.tick().finally(() => {
        if (this.running) this.timer = this.d.setTimer(loop, this.d.intervalMs);
      });
    };
    loop();
  }
  stop(): void {
    this.running = false;
    if (this.timer) this.d.clearTimer(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    let anyOk = false;
    let anyFail = false;
    for (const url of this.live) {
      try {
        const raw = await this.d.fetchOrders(url);
        const orders = mapV1OrdersToNormalized(raw);
        this.emit('snapshot', { url_name: url, orders });
        anyOk = true;
      } catch (e: any) {
        anyFail = true;
        // one failed item shouldn't stop the rest; proxy layer already retried
      }
    }
    const up = anyOk || (!anyFail && this.live.length === 0);
    if (up !== this.lastUp) {
      this.lastUp = up;
      const status: FeedStatus = { source: 'poller', up, detail: up ? 'recovered' : 'fetch failing' };
      this.emit('status', status);
    }
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/HotPoller.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/HotPoller.ts services/live/HotPoller.test.ts
git commit -m "feat(live): HotPoller — proxy-backed order polling feed"
```

---

## Phase 3 — Gateway wiring + entrypoint (integration)

### Task 8: LiveGateway — wire feed → store → verdict → Socket.IO + write-through

**Files:**
- Create: `services/live/LiveGateway.ts`
- Test: `services/live/LiveGateway.test.ts`

**Interfaces:**
- Consumes: `LiveStore`, `VerdictEngine` (`computeVerdict`), `FairValueService`, `SubscriptionManager`, `WfmFeed`, `LiveConfig` shape, `LiveTypes`.
- Produces: `class LiveGateway` with `constructor(deps: LiveGatewayDeps)`, `handleSubscribe(url: string): LiveUpdate | null`, `handleUnsubscribe(url: string): void`, `onSnapshot(s: FeedSnapshot): LiveUpdate | null`, `buildUpdate(url: string): LiveUpdate | null`, `health(): LiveHealth`, `start(): Promise<void>`. `LiveGatewayDeps = { feed: WfmFeed; store: LiveStore; fairValue: FairValueService; subs: SubscriptionManager; config: {...knobs}; broadcast(url: string, u: LiveUpdate): void; writeThrough(url: string, book: LiveBook): void }`.
- The Socket.IO server itself lives in `live.ts` (Task 9); LiveGateway takes `broadcast`/`writeThrough` callbacks so it is testable without sockets or Mongo.

- [ ] **Step 1: Write the failing test**

Create `services/live/LiveGateway.test.ts`:
```ts
import { LiveGateway } from './LiveGateway';
import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { EventEmitter } from 'events';
import { LiveUpdate, LiveBook } from './LiveTypes';

function makeGateway() {
  const feed: any = new EventEmitter();
  feed.setLiveSet = () => {}; feed.subscribe = () => {}; feed.unsubscribe = () => {};
  feed.start = () => {}; feed.stop = () => {};
  const store = new LiveStore('pc');
  const fairValue = new FairValueService({
    getItems: async () => [{ url_name: 'a', market: { avg_price: 100, sell: 100, volume: 100 } }],
    getHistory: async () => [
      { date: '2026-01-01', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-02', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-03', buy: 0, sell: 0, avg_price: 100, volume: 5 },
    ],
  });
  const subs = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: [] });
  const broadcasts: LiveUpdate[] = [];
  const writes: Array<{ url: string; book: LiveBook }> = [];
  const gw = new LiveGateway({
    feed, store, fairValue, subs,
    config: { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25 },
    broadcast: (_url, u) => broadcasts.push(u),
    writeThrough: (url, book) => writes.push({ url, book }),
  });
  return { gw, feed, fairValue, broadcasts, writes, subs };
}

describe('LiveGateway', () => {
  it('produces a buy verdict update from a snapshot and broadcasts + writes through', async () => {
    const { gw, feed, fairValue, broadcasts, writes } = makeGateway();
    await fairValue.load(['a']);
    feed.emit('snapshot', { url_name: 'a', orders: [
      { id: '1', order_type: 'sell', platinum: 80, quantity: 1, visible: true, platform: 'pc', user: { id: 'x', status: 'ingame' } },
      { id: '2', order_type: 'buy', platinum: 70, quantity: 1, visible: true, platform: 'pc', user: { id: 'y', status: 'ingame' } },
    ]});
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].verdict.verdict).toBe('buy');
    expect(writes[0].book.bestSell).toBe(80);
  });

  it('handleSubscribe returns the current update if the book exists', async () => {
    const { gw, feed, fairValue } = makeGateway();
    await fairValue.load(['a']);
    feed.emit('snapshot', { url_name: 'a', orders: [
      { id: '1', order_type: 'sell', platinum: 95, quantity: 1, visible: true, platform: 'pc', user: { id: 'x', status: 'ingame' } },
    ]});
    const u = gw.handleSubscribe('a');
    expect(u).not.toBeNull();
    expect(u!.book.bestSell).toBe(95);
  });
});
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx jest services/live/LiveGateway.test.ts`
Expected: FAIL — cannot find module `./LiveGateway`.

- [ ] **Step 3: Implement `LiveGateway.ts`**

```ts
import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { computeVerdict, VerdictOpts } from './VerdictEngine';
import { WfmFeed, FeedSnapshot, FeedDelta, FeedStatus } from './WfmFeed';
import { LiveUpdate, LiveBook } from './LiveTypes';

export interface LiveHealth {
  feedUp: boolean;
  feedSource: 'poller' | 'socket';
  liveItems: number;
  bookCount: number;
  lastUpdateAt: number;
}

export interface LiveGatewayDeps {
  feed: WfmFeed;
  store: LiveStore;
  fairValue: FairValueService;
  subs: SubscriptionManager;
  config: VerdictOpts;
  broadcast(url: string, u: LiveUpdate): void;
  writeThrough(url: string, book: LiveBook): void;
}

/**
 * The hub. Wires feed events into the store, computes a verdict against the
 * cached fair value, and fans the result out via injected broadcast/writeThrough
 * callbacks. No socket/Mongo code here so it unit-tests cleanly.
 */
export class LiveGateway {
  private health_: LiveHealth = {
    feedUp: true, feedSource: 'poller', liveItems: 0, bookCount: 0, lastUpdateAt: 0,
  };

  constructor(private readonly d: LiveGatewayDeps) {
    d.feed.on('snapshot', (s: FeedSnapshot) => this.onSnapshot(s));
    d.feed.on('delta', (delta: FeedDelta) => this.onDelta(delta));
    d.feed.on('status', (st: FeedStatus) => {
      this.health_.feedUp = st.up;
      this.health_.feedSource = st.source;
    });
  }

  onSnapshot(s: FeedSnapshot): LiveUpdate | null {
    this.d.store.applySnapshot(s);
    return this.emitFor(s.url_name);
  }
  onDelta(delta: FeedDelta): LiveUpdate | null {
    this.d.store.applyDelta(delta);
    return this.emitFor(delta.url_name);
  }

  buildUpdate(url: string): LiveUpdate | null {
    const book = this.d.store.getBook(url);
    if (!book) return null;
    const fv = this.d.fairValue.get(url) ?? {
      url_name: url, avg_price: 0, medianHistory: 0, volatility: null, dataDays: 0, volume: 0,
    };
    const verdict = computeVerdict(book, fv, this.d.config);
    return { url_name: url, book, verdict };
  }

  private emitFor(url: string): LiveUpdate | null {
    const update = this.buildUpdate(url);
    if (!update) return null;
    this.d.broadcast(url, update);
    this.d.writeThrough(url, update.book);
    this.health_.bookCount = this.d.store.size();
    this.health_.lastUpdateAt = update.book.updatedAt;
    return update;
  }

  handleSubscribe(url: string): LiveUpdate | null {
    this.d.subs.addViewer(url);
    this.syncLiveSet();
    return this.buildUpdate(url);
  }
  handleUnsubscribe(url: string): void {
    this.d.subs.removeViewer(url);
    this.syncLiveSet();
  }

  private syncLiveSet(): void {
    const live = this.d.subs.liveSet();
    this.health_.liveItems = live.length;
    this.d.feed.setLiveSet(live);
  }

  health(): LiveHealth { return { ...this.health_ }; }

  async start(): Promise<void> {
    this.syncLiveSet();
    this.d.feed.start();
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx jest services/live/LiveGateway.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add services/live/LiveGateway.ts services/live/LiveGateway.test.ts
git commit -m "feat(live): LiveGateway wiring feed->store->verdict->broadcast"
```

---

### Task 9: `live.ts` entrypoint — Socket.IO server + real deps + FV refresh loop

**Files:**
- Create: `live.ts` (repo root)
- Manual verification (no unit test — this is IO glue; verified by running it)

**Interfaces:**
- Consumes: everything above; `WarframeUndici` (`./warframe-undici`), `MarketService` via `WarframeUndici`, `ItemService`, `PriceHistoryService`, `MongooseServer` (`./database`), `readLiveConfig`/`LiveConfig`.
- Produces: the running process. Socket.IO contract: client emits `subscribe`/`unsubscribe` with `{ url_name }`; server emits `update` (`LiveUpdate`) to the room `item:<url_name>`, and replies to `subscribe` with the current `update` if available. HTTP `GET /health` returns `LiveGateway.health()` JSON.

- [ ] **Step 1: Implement `live.ts`**

```ts
import './env';
import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { MongooseServer } from './database';
import WarframeUndici from './warframe-undici';
import { ItemService } from './services/ItemService';
import { PriceHistoryService } from './services/PriceHistoryService';
import { readLiveConfig } from './services/live/LiveConfig';
import { LiveStore } from './services/live/LiveStore';
import { FairValueService } from './services/live/FairValueService';
import { SubscriptionManager } from './services/live/SubscriptionManager';
import { HotPoller } from './services/live/HotPoller';
import { LiveGateway } from './services/live/LiveGateway';
import { LiveUpdate, LiveBook } from './services/live/LiveTypes';

async function main() {
  const cfg = readLiveConfig(process.env);
  console.log('[live] starting', { port: cfg.port, feedMode: cfg.feedMode });
  await MongooseServer.startConnectionPromise();

  if (cfg.feedMode === 'off') {
    console.log('[live] LIVE_FEED_MODE=off — feed disabled, health-only server');
  }

  // --- domain services reusing the proven stack ---
  const wf = new WarframeUndici({ useProxies: process.env.PROXY_LESS !== 'true' });
  const itemService = new ItemService();
  // WarframeUndici already registers the price-history collection (BaseWarframeClient
  // exposes it as `dbPriceHistory`); reuse it rather than re-registering the model.
  const priceHistory = new PriceHistoryService((wf as any).dbPriceHistory);

  const store = new LiveStore(cfg.platform);
  const fairValue = new FairValueService({
    getItems: (urls) => itemService.getItemsByUrlNames(urls),
    getHistory: (url) => priceHistory.getHistory(url),
  });
  const subs = new SubscriptionManager({
    maxSubscriptions: cfg.maxSubscriptions,
    hotFloor: cfg.hotFloorList,
  });

  // Poller is the shippable source. BaseWarframeClient.getItemOrders(url) already
  // delegates to MarketService.getItemOrders and returns { payload: { orders } }.
  const poller = new HotPoller({
    intervalMs: cfg.pollIntervalMs,
    fetchOrders: async (url) => {
      const res: any = await (wf as any).getItemOrders(url);
      return (res && res.payload && res.payload.orders) || [];
    },
  });

  const io = new Server({ cors: { origin: cfg.corsOrigin } });

  const gateway = new LiveGateway({
    feed: poller,
    store, fairValue, subs,
    config: {
      halfVolume: cfg.fvHalfVolume,
      baseBandPct: cfg.baseBandPct,
      maxBandPct: cfg.maxBandPct,
      confMin: cfg.confMin,
    },
    broadcast: (url: string, u: LiveUpdate) => io.to(`item:${url}`).emit('update', u),
    writeThrough: (url: string, book: LiveBook) => writeThrough(itemService, url, book).catch(() => {}),
  });

  io.on('connection', (socket: Socket) => {
    socket.on('subscribe', (msg: { url_name?: string }) => {
      const url = (msg && msg.url_name || '').toString();
      if (!url) return;
      socket.join(`item:${url}`);
      const current = gateway.handleSubscribe(url);
      if (current) socket.emit('update', current);
    });
    socket.on('unsubscribe', (msg: { url_name?: string }) => {
      const url = (msg && msg.url_name || '').toString();
      if (!url) return;
      socket.leave(`item:${url}`);
      gateway.handleUnsubscribe(url);
    });
  });

  // Health endpoint on the same http server.
  const httpServer = http.createServer((req, res) => {
    if (req.url && req.url.startsWith('/health')) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(gateway.health()));
      return;
    }
    res.statusCode = 404;
    res.end('not found');
  });
  io.attach(httpServer);
  httpServer.listen(cfg.port, () => console.log(`[live] listening on ${cfg.port}`));

  // Prime + periodically refresh the fair-value baseline for the live set.
  const refresh = async () => {
    try { await fairValue.load(subs.liveSet()); } catch (e: any) { console.error('[live] FV refresh failed', e?.message); }
  };
  await refresh();
  setInterval(refresh, cfg.fvRefreshMs);

  if (cfg.feedMode !== 'off') await gateway.start();
}

async function writeThrough(itemService: ItemService, url: string, book: LiveBook): Promise<void> {
  if (!book || (book.bestBuy <= 0 && book.bestSell <= 0)) return;
  await itemService.saveItemByUrlName(url, {
    market: {
      buy: book.bestBuy,
      sell: book.bestSell,
      buyAvg: Math.round(book.buyAvg),
      sellAvg: Math.round(book.sellAvg),
    } as any,
    // NB: getAnUpdateEntry replaces the whole `market` subdoc. We intentionally
    // do NOT clobber volume/avg_price/last_completed here — see Task 9 Step 2.
    priceUpdate: new Date(),
  } as any);
}

main().catch((e) => {
  console.error('[live] fatal', e);
  process.exit(1);
});
```

- [ ] **Step 2: Fix the write-through subdoc-merge hazard**

The `market` subdoc is replaced wholesale by `getAnUpdateEntry`, so the naive `writeThrough` above would drop `volume`/`avg_price`/`last_completed`. Read the current item first and merge. Replace `writeThrough` with:
```ts
async function writeThrough(itemService: ItemService, url: string, book: LiveBook): Promise<void> {
  if (!book || (book.bestBuy <= 0 && book.bestSell <= 0)) return;
  const current = await itemService.getItemByUrlName(url);
  const prevMarket = (current && (current as any).market) || {};
  await itemService.saveItemByUrlName(url, {
    market: {
      ...prevMarket,
      buy: book.bestBuy,
      sell: book.bestSell,
      buyAvg: Math.round(book.buyAvg),
      sellAvg: Math.round(book.sellAvg),
    },
    priceUpdate: new Date(),
  } as any);
}
```

- [ ] **Step 3: Confirm the orders passthrough (no code change)**

The poller uses `wf.getItemOrders(url)`. Confirm `BaseWarframeClient.getItemOrders` (around `services/BaseWarframeClient.ts:212`) is public and returns `{ payload: { orders } }` (it delegates to `MarketService.getItemOrders`). Verified during review — no getter needs adding (a public `getMarketService()` already exists at `BaseWarframeClient.ts:546` if a raw service handle is ever wanted). The `(wf as any)` cast covers the generic typing.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: `dist/live.js` and `dist/services/live/*.js` emitted, no TS errors. If `market`/`getMarketService` typing complains, cast via `(wf as any)` at the call site only.

- [ ] **Step 5: Smoke-run the process**

Run (poller mode, uses real proxies + Mongo — run where `.env` is configured):
```bash
LIVE_FEED_MODE=poller LIVE_HOT_FLOOR=mirage_prime_set LIVE_MAX_SUBSCRIPTIONS=5 node dist/live.js
```
Expected logs: `[live] starting`, Mongo connect, `[live] listening on 3530`. Then:
```bash
curl -s http://localhost:3530/health
```
Expected JSON like `{"feedUp":true,"feedSource":"poller","liveItems":1,"bookCount":1,...}` within ~1 poll interval (bookCount rises once the first snapshot lands).

- [ ] **Step 6: Commit**

```bash
git add live.ts
git commit -m "feat(live): warframe-live entrypoint — Socket.IO server, poller feed, FV refresh, write-through"
```

---

### Task 10: Backend integration test — end-to-end feed to update

**Files:**
- Create: `services/live/live.integration.test.ts`

**Interfaces:**
- Consumes: `LiveGateway`, `HotPoller`, `LiveStore`, `FairValueService`, `SubscriptionManager` — assembled with a fake `fetchOrders`, no Mongo/sockets.

- [ ] **Step 1: Write the integration test**

Create `services/live/live.integration.test.ts`:
```ts
import { LiveGateway } from './LiveGateway';
import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { HotPoller } from './HotPoller';
import { LiveUpdate } from './LiveTypes';

it('poller tick flows all the way to a broadcast verdict', async () => {
  const orders = [
    { id: '1', order_type: 'sell', platinum: 70, visible: true, platform: 'pc', user: { id: 'a', status: 'ingame' } },
    { id: '2', order_type: 'buy', platinum: 60, visible: true, platform: 'pc', user: { id: 'b', status: 'ingame' } },
  ];
  const poller = new HotPoller({
    intervalMs: 10_000,
    fetchOrders: async () => orders,
    setTimer: () => 0, clearTimer: () => {},
  });
  const store = new LiveStore('pc');
  const fairValue = new FairValueService({
    getItems: async () => [{ url_name: 'a', market: { avg_price: 100, sell: 100, volume: 80 } }],
    getHistory: async () => [
      { date: '2026-01-01', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-02', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-03', buy: 0, sell: 0, avg_price: 100, volume: 5 },
    ],
  });
  const subs = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: ['a'] });
  const broadcasts: LiveUpdate[] = [];
  const gw = new LiveGateway({
    feed: poller, store, fairValue, subs,
    config: { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25 },
    broadcast: (_u, u) => broadcasts.push(u),
    writeThrough: () => {},
  });
  await fairValue.load(['a']);
  await gw.start();
  await (poller as any).tick();

  expect(broadcasts.length).toBeGreaterThan(0);
  const last = broadcasts[broadcasts.length - 1];
  expect(last.url_name).toBe('a');
  expect(last.book.bestSell).toBe(70);
  expect(last.verdict.verdict).toBe('buy'); // 30% below FV of 100
});
```

- [ ] **Step 2: Run it, verify pass**

Run: `npx jest services/live/live.integration.test.ts`
Expected: PASS (1 test).

- [ ] **Step 3: Run the whole live suite**

Run: `npx jest services/live`
Expected: all live unit + integration tests green.

- [ ] **Step 4: Commit**

```bash
git add services/live/live.integration.test.ts
git commit -m "test(live): end-to-end poller->gateway->verdict integration"
```

---

## Phase 4 — Frontend

### Task 11: `liveFeed` client — singleton Socket.IO wrapper

**Files:**
- Create: `app/services/liveFeed.ts`
- Modify: `app/nuxt.config.js` (add `publicRuntimeConfig.liveURL` + `privateRuntimeConfig.liveURL`)

**Interfaces:**
- Produces: named exports `subscribe(url_name: string, cb: (u: LiveUpdate) => void): () => void` (returns an unsubscribe fn), `getLiveUrl(): string`, `isConnected(): boolean`, and `type LiveUpdate` (mirror of backend shape). Browser-only (guards `typeof window`).
- Consumes: `socket.io-client` (added in Task 0).

- [ ] **Step 1: Add the front runtime config**

In `app/nuxt.config.js`, extend the runtime configs:
```js
publicRuntimeConfig: {
  apiURL: process.env.API_URL || 'http://localhost:3529',
  liveURL: process.env.LIVE_URL || 'http://localhost:3530'
},
privateRuntimeConfig: {
  apiURL: process.env.API_URL || 'http://localhost:3529',
  liveURL: process.env.LIVE_URL || 'http://localhost:3530'
},
```

- [ ] **Step 2: Implement `app/services/liveFeed.ts`**

```ts
/**
 * Browser-only singleton wrapper over one Socket.IO connection to the
 * warframe-live server. Pages subscribe by url_name and get {book, verdict}
 * pushes; the socket auto-reconnects. SSR-safe: every entry short-circuits
 * off-browser so asyncData/SSR never touches it.
 */
import { io, Socket } from 'socket.io-client';

export interface LiveBook {
  url_name: string; bestBuy: number; bestSell: number; buyAvg: number; sellAvg: number;
  onlineBuyCount: number; onlineSellCount: number; updatedAt: number;
}
export interface Verdict {
  url_name: string; verdict: 'buy' | 'sell' | 'fair' | 'hold'; score: number; confidence: number;
  fv: number; bestBuy: number; bestSell: number; dealPct: number; flipMargin: number; reason: string;
}
export interface LiveUpdate { url_name: string; book: LiveBook; verdict: Verdict; }

type Cb = (u: LiveUpdate) => void;

const isBrowser = () => typeof window !== 'undefined';
let socket: Socket | null = null;
const listeners = new Map<string, Set<Cb>>();

export function getLiveUrl(): string {
  if (isBrowser() && (window as any).$nuxt?.$config?.liveURL) return (window as any).$nuxt.$config.liveURL;
  return 'http://localhost:3530';
}

function ensureSocket(): Socket | null {
  if (!isBrowser()) return null;
  if (socket) return socket;
  socket = io(getLiveUrl(), { transports: ['websocket'], reconnection: true });
  socket.on('update', (u: LiveUpdate) => {
    const set = listeners.get(u.url_name);
    if (set) set.forEach((cb) => cb(u));
  });
  socket.on('connect', () => {
    // re-subscribe every active room after a reconnect
    listeners.forEach((_set, url) => socket!.emit('subscribe', { url_name: url }));
  });
  return socket;
}

export function subscribe(url_name: string, cb: Cb): () => void {
  if (!isBrowser() || !url_name) return () => {};
  const s = ensureSocket();
  let set = listeners.get(url_name);
  if (!set) { set = new Set(); listeners.set(url_name, set); }
  const firstForUrl = set.size === 0;
  set.add(cb);
  if (s && firstForUrl) s.emit('subscribe', { url_name });
  return () => {
    const cur = listeners.get(url_name);
    if (!cur) return;
    cur.delete(cb);
    if (cur.size === 0) {
      listeners.delete(url_name);
      if (s) s.emit('unsubscribe', { url_name });
    }
  };
}

export function isConnected(): boolean {
  return !!socket && socket.connected;
}
```

- [ ] **Step 3: Type-check the app build compiles the module**

Run:
```bash
cd app && npx nuxt build --standalone 2>&1 | tail -20 && cd ..
```
Expected: build completes (the module is tree-shaken into the client bundle; no SSR error because every export guards `isBrowser()`). If the full build is too slow in this environment, instead run `cd app && npx tsc --noEmit -p tsconfig.json` and confirm no errors in `services/liveFeed.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/services/liveFeed.ts app/nuxt.config.js
git commit -m "feat(app): liveFeed singleton socket.io client + liveURL config"
```

---

### Task 12: `MarketVerdictBadge` reusable component

**Files:**
- Create: `app/components/MarketVerdictBadge.vue`
- Test (manual): rendered on the `/live` page in Task 13; no unit harness (the app has no component test runner configured).

**Interfaces:**
- Props: `verdict: Object` (the `Verdict` shape, nullable), `compact: Boolean` (default false).
- Renders a colored chip + deal% + confidence dot + tooltip. Uses only Vuetify 2 tags.

- [ ] **Step 1: Implement `app/components/MarketVerdictBadge.vue`**

```vue
<template>
  <v-tooltip bottom v-if="v">
    <template #activator="{ on, attrs }">
      <span class="an-badge mvb" :class="'mvb--' + v.verdict" v-bind="attrs" v-on="on">
        <v-icon size="14" :color="iconColor">{{ icon }}</v-icon>
        <strong>{{ label }}</strong>
        <span v-if="!compact && dealText" class="mvb__deal">{{ dealText }}</span>
        <span class="mvb__conf" :style="{ opacity: confOpacity }" title="confidence">●</span>
      </span>
    </template>
    <div class="mvb__tip">
      <div><strong>{{ label }}</strong> — {{ v.reason }}</div>
      <div>Fair value: {{ round(v.fv) }}p</div>
      <div>Best sell: {{ round(v.bestSell) }}p · Best buy: {{ round(v.bestBuy) }}p</div>
      <div>Flip margin: {{ round(v.flipMargin) }}p · Confidence: {{ Math.round(v.confidence * 100) }}%</div>
    </div>
  </v-tooltip>
</template>

<script lang="ts">
export default {
  name: 'MarketVerdictBadge',
  props: {
    verdict: { type: Object, default: null },
    compact: { type: Boolean, default: false },
  },
  computed: {
    v(): any { return this.verdict; },
    label(): string {
      return ({ buy: 'BUY', sell: 'SELL', fair: 'FAIR', hold: '—' } as any)[this.v?.verdict] || '—';
    },
    icon(): string {
      return ({ buy: 'mdi-trending-down', sell: 'mdi-trending-up', fair: 'mdi-approximately-equal', hold: 'mdi-help' } as any)[this.v?.verdict] || 'mdi-help';
    },
    iconColor(): string {
      return ({ buy: '#26d07c', sell: '#f0b429', fair: '#8aa', hold: '#667' } as any)[this.v?.verdict] || '#667';
    },
    dealText(): string {
      if (!this.v || this.v.verdict === 'hold') return '';
      if (this.v.verdict === 'buy') return `${Math.round(this.v.dealPct * 100)}% under`;
      if (this.v.verdict === 'sell') return `${Math.round(((this.v.bestBuy - this.v.fv) / this.v.fv) * 100)}% over`;
      return '';
    },
    confOpacity(): number {
      return 0.35 + 0.65 * (this.v?.confidence || 0);
    },
  },
  methods: {
    round(n: number): number { return Math.round(n || 0); },
  },
};
</script>

<style scoped>
.mvb { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 10px; font-size: 12px; line-height: 18px; }
.mvb--buy { background: rgba(38, 208, 124, 0.14); color: #26d07c; }
.mvb--sell { background: rgba(240, 180, 41, 0.14); color: #f0b429; }
.mvb--fair { background: rgba(136, 170, 170, 0.12); color: #9fb3b3; }
.mvb--hold { background: rgba(102, 119, 119, 0.12); color: #8895a0; }
.mvb__deal { opacity: 0.85; }
.mvb__conf { font-size: 9px; }
.mvb__tip { font-size: 12px; line-height: 1.5; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/MarketVerdictBadge.vue
git commit -m "feat(app): reusable MarketVerdictBadge component"
```

---

### Task 13: `/live` page + nav registration

**Files:**
- Create: `app/pages/live.vue`
- Modify: `app/layouts/default.vue` (add nav link)

**Interfaces:**
- Consumes: `subscribe` from `~/services/liveFeed`, `MarketVerdictBadge` component, `$axios`/`$config` for the initial item list (reuses `/market_analytics` to seed the searchable list).

- [ ] **Step 1: Register the nav link**

In `app/layouts/default.vue`, add one entry to the `navLinks` array (keep the existing shape/group values):
```js
{ to: '/live', title: 'Live', icon: 'mdi-access-point', group: 'Analytics' },
```

- [ ] **Step 2: Implement `app/pages/live.vue`**

```vue
<template>
  <div class="an">
    <client-only>
      <div class="an-console">
        <header class="an-hero">
          <div class="an-hero__text">
            <div class="an-eyebrow">Real-time</div>
            <h1 class="an-title"><span class="accent-a">Live</span> <span class="accent-b">Signals</span></h1>
            <p class="an-lede">Live best online buy/sell with a buy/sell verdict vs fair value. {{ connState }}.</p>
          </div>
        </header>

        <div class="an-filters">
          <div class="an-filters__row">
            <v-text-field v-model="search" dark dense hide-details clearable
              prepend-inner-icon="mdi-magnify" label="Search items" class="an-field" />
          </div>
          <div class="an-count">Watching {{ watched.length }} · {{ results.length }} matches</div>
        </div>

        <div class="an-tablewrap" v-if="!isMobile">
          <table class="an-table">
            <thead>
              <tr>
                <th class="col-name">Item</th>
                <th class="an-num">Best buy</th>
                <th class="an-num">Best sell</th>
                <th class="an-num">Fair value</th>
                <th>Signal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in results" :key="row.url_name">
                <td class="col-name"><span class="an-name">{{ row.item_name }}</span></td>
                <td class="an-num">{{ live[row.url_name] ? round(live[row.url_name].book.bestBuy) : '—' }}</td>
                <td class="an-num">{{ live[row.url_name] ? round(live[row.url_name].book.bestSell) : '—' }}</td>
                <td class="an-num">{{ live[row.url_name] ? round(live[row.url_name].verdict.fv) : '—' }}</td>
                <td><MarketVerdictBadge :verdict="live[row.url_name] ? live[row.url_name].verdict : null" /></td>
                <td>
                  <v-btn x-small text @click="toggleWatch(row)">
                    {{ isWatched(row.url_name) ? 'Unwatch' : 'Watch' }}
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="an-cards" v-else>
          <div class="an-card" v-for="row in results" :key="row.url_name">
            <div class="an-card__head">
              <span class="an-card__name">{{ row.item_name }}</span>
              <MarketVerdictBadge :verdict="live[row.url_name] ? live[row.url_name].verdict : null" />
            </div>
            <div class="an-card__blocks">
              <div class="an-block"><span class="an-block__lbl">Buy</span>{{ live[row.url_name] ? round(live[row.url_name].book.bestBuy) : '—' }}</div>
              <div class="an-block"><span class="an-block__lbl">Sell</span>{{ live[row.url_name] ? round(live[row.url_name].book.bestSell) : '—' }}</div>
              <div class="an-block"><span class="an-block__lbl">Fair</span>{{ live[row.url_name] ? round(live[row.url_name].verdict.fv) : '—' }}</div>
            </div>
          </div>
        </div>

        <v-alert class="an-disclaimer blue darken-4" type="info" dense dark>
          Signals compare the lowest online sell against a blended fair value. Low-liquidity items are held, not advised.
        </v-alert>
      </div>
    </client-only>
  </div>
</template>

<script lang="ts">
import MarketVerdictBadge from '../components/MarketVerdictBadge.vue';
import { subscribe, isConnected, LiveUpdate } from '~/services/liveFeed';

export default {
  name: 'LivePage',
  components: { MarketVerdictBadge },
  async asyncData({ $axios, $config }: any) {
    try {
      const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((r: any) => r.data);
      const items = ((data && data.items) || []).map((i: any) => ({ url_name: i.url_name, item_name: i.item_name }));
      return { items, loadError: false };
    } catch (e) {
      return { items: [], loadError: true };
    }
  },
  data() {
    return {
      items: [] as any[],
      loadError: false,
      search: '',
      live: {} as Record<string, LiveUpdate>,
      watched: [] as string[],
      unsubs: {} as Record<string, () => void>,
      connState: 'connecting…',
      connTimer: null as ReturnType<typeof setInterval> | null,
    };
  },
  head() {
    return { title: 'Live Signals', meta: [{ hid: 'description', name: 'description', content: 'Real-time Warframe market buy/sell signals' }] };
  },
  computed: {
    isMobile(): boolean { return (this as any).$vuetify.breakpoint.mobile; },
    results(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase();
      const base = q ? this.items.filter((i: any) => i.item_name.toLowerCase().includes(q)) : this.items;
      // Cap the visible/subscribed rows so we don't open thousands of subscriptions.
      return base.slice(0, 40);
    },
  },
  watch: {
    results: {
      immediate: true,
      handler(rows: any[]) { this.syncSubscriptions(rows); },
    },
  },
  mounted() {
    this.finishLoading();
    this.connTimer = setInterval(() => {
      this.connState = isConnected() ? 'live' : 'reconnecting…';
    }, 1500);
  },
  beforeDestroy() {
    Object.values(this.unsubs).forEach((fn: any) => fn && fn());
    this.unsubs = {};
    if (this.connTimer) clearInterval(this.connTimer);
  },
  methods: {
    round(n: number): number { return Math.round(n || 0); },
    isWatched(url: string): boolean { return this.watched.includes(url); },
    toggleWatch(row: any): void {
      const i = this.watched.indexOf(row.url_name);
      if (i >= 0) this.watched.splice(i, 1);
      else this.watched.push(row.url_name);
    },
    syncSubscriptions(rows: any[]): void {
      const want = new Set(rows.map((r: any) => r.url_name));
      // drop stale
      Object.keys(this.unsubs).forEach((url) => {
        if (!want.has(url)) { this.unsubs[url](); this.$delete(this.unsubs, url); }
      });
      // add new
      rows.forEach((r: any) => {
        if (this.unsubs[r.url_name]) return;
        const off = subscribe(r.url_name, (u: LiveUpdate) => { this.$set(this.live, u.url_name, u); });
        this.$set(this.unsubs, r.url_name, off);
      });
    },
    finishLoading(): void {
      this.$nextTick(() => {
        const el = document.getElementById('spinner-wrapper');
        if (el) (el as HTMLElement).style.display = 'none';
        else this.finishLoading();
      });
    },
  },
};
</script>

<style scoped>
.an-block__lbl { display: block; opacity: 0.6; font-size: 11px; }
</style>
```

- [ ] **Step 3: Verify the page renders against a running backend**

With `warframe-live` running (Task 9 Step 5) and the API up, run the front dev server:
```bash
cd app && API_URL=http://localhost:3529 LIVE_URL=http://localhost:3530 npm run dev
```
Open `http://localhost:3312/live`. Expected: the table lists items; within a few seconds `Best buy/sell`, `Fair value`, and a colored BUY/SELL/FAIR badge populate for the visible rows; the lede shows "live". Confirm the spinner is gone (page not stuck loading).

- [ ] **Step 4: Commit**

```bash
git add app/pages/live.vue app/layouts/default.vue
git commit -m "feat(app): /live real-time signals page + nav link"
```

---

### Task 14: Real-time alerts — drive `checkAlerts` off the live feed

**Files:**
- Modify: `app/pages/portfolio.vue`

**Interfaces:**
- Consumes: `subscribe` from `~/services/liveFeed`, existing `checkAlerts`/`getWatchlist` from `~/services/portfolio`.
- Keeps alerts fully client-side (no server changes). Replaces the "only every 60s" latency with event-driven checks when a watched item's live price updates. The existing 60s `setInterval` stays as a backstop.

- [ ] **Step 1: Subscribe watched items to the live feed on mount**

In `app/pages/portfolio.vue`, in the component `mounted()` (after the existing alert-interval setup), add live subscriptions for every watchlist entry and run `checkAlerts` on each push. Add to `<script>` imports:
```ts
import { subscribe, LiveUpdate } from '~/services/liveFeed';
```
Add `liveUnsubs: {}` and `livePrices: {}` fields to `data()`, then in `mounted()`:
```ts
// Real-time alert path: when a watched item's live price updates, re-run the
// SAME client-side checkAlerts immediately (the 60s interval remains a backstop).
this.subscribeWatchlistLive();
```
Add methods. Do NOT mutate the Vuex `all_items` getter object — keep live prices in a
component-local map and overlay them onto a shallow copy before checking:
```ts
subscribeWatchlistLive(): void {
  const list = getWatchlist().map((w: any) => w.url_name);
  list.forEach((url: string) => {
    if (this.liveUnsubs[url]) return;
    const off = subscribe(url, (u: LiveUpdate) => {
      this.$set(this.livePrices, u.url_name, u.book.bestSell);
      this.runLiveAlertCheck();
    });
    this.$set(this.liveUnsubs, url, off);
  });
},
// Overlay live sell prices onto a shallow copy of the store items, then run the
// SAME client-side checkAlerts (reuses this.analyticsByUrl exactly as runAlertCheck does).
runLiveAlertCheck(): void {
  const overlaid = this.allItems.map((it: any) =>
    this.livePrices[it.url_name] != null
      ? { ...it, market: { ...(it.market || {}), sell: this.livePrices[it.url_name] } }
      : it
  );
  checkAlerts(overlaid, this.analyticsByUrl);
},
```
`checkAlerts`, `getWatchlist`, `allItems` (getter `all_items`), `analyticsByUrl`, and
`runAlertCheck` are all already present in `portfolio.vue` (verified in review) — reuse
them; match any name exactly while editing.

- [ ] **Step 2: Re-subscribe when the watchlist changes and clean up**

Wherever the page adds/removes a watch entry, call `this.subscribeWatchlistLive()` again after the change, and in `beforeDestroy()` add:
```ts
Object.values(this.liveUnsubs).forEach((fn: any) => fn && fn());
this.liveUnsubs = {};
```

- [ ] **Step 3: Verify real-time firing**

Run the backend + front. Add a watchlist item with an `alertBelow` set just above its current live sell. With the live feed pushing, confirm the browser Notification fires within seconds of a qualifying price (not up to 60s later). Confirm no duplicate spam (the existing `notifiedBelow` one-shot guard still applies).

- [ ] **Step 4: Commit**

```bash
git add app/pages/portfolio.vue
git commit -m "feat(app): real-time watchlist alerts via live feed (client-side)"
```

---

## Phase 5 — (Spike, optional) True wf.market socket upgrade

> This phase is **gated and non-blocking**: the product already ships on the poller. Build it only when Phase 1–4 are green and deployed. It stays behind the `WfmFeed` adapter + `LIVE_FEED_MODE`, and MUST auto-degrade to the poller.

### Task 15: WfmSocketClient behind the adapter (spike)

**Files:**
- Create: `services/live/WfmSocketClient.ts`
- Create: `services/live/WfmSocketClient.frames.md` (schema-discovery notes)
- Modify: `live.ts` (select feed by `LIVE_FEED_MODE`, wrap in a `FeedSupervisor` that falls back to the poller)

**Interfaces:**
- Produces: `class WfmSocketClient extends EventEmitter implements WfmFeed`, constructed with `{ cookies: string; platform: string }`. Emits the same `snapshot`/`delta`/`status` events.

- [ ] **Step 1: Obtain a session (documented reality)**

Programmatic login through Cloudflare's interactive challenge is not reliably automatable (confirmed: the challenge blocks headless browsers). The reliable path: log into warframe.market in a real browser as the dedicated account, export the `JWT` and `cf_clearance` cookies, and set them as `WARFRAME_JWT` / `WARFRAME_CF_CLEARANCE` in `.env`. `WfmSocketClient` reads `process.env.WARFRAME_JWT`/`WARFRAME_CF_CLEARANCE` and sends them as the `Cookie` header on the socket handshake. (A best-effort programmatic `POST /v1/auth/signin` via `UndiciHttpService.post` capturing `set-cookie` may be attempted first, but treat the manual cookie as the supported path.)

- [ ] **Step 2: Discover the frame schema**

Connect `socket.io-client` to `wss://warframe.market` (engine.io v4) with the `Cookie` header, subscribe to one item, and log every inbound event name + payload to `WfmSocketClient.frames.md` for ~2 minutes on an active item. Confirm the actual event names for order create/update/delete and user status. Map them to `FeedSnapshot`/`FeedDelta` (emit the snake_case `NormalizedOrder` shape directly — skip the v2→v1 rename). Do NOT guess event names in code; encode exactly what the capture shows.

- [ ] **Step 3: Implement + supervise with fallback**

Implement `WfmSocketClient` mapping the discovered frames. In `live.ts`, when `LIVE_FEED_MODE=socket`, construct a `FeedSupervisor` that starts the socket, listens for `status {up:false}` (disconnect / auth challenge / repeated errors) and transparently starts the `HotPoller` for the live set until the socket recovers. `LIVE_FEED_MODE=poller` skips the socket entirely; `off` disables both.

- [ ] **Step 4: Verify degradation**

Start in `socket` mode; kill network to wf.market (or feed bad cookies). Confirm `GET /health` flips `feedSource` to `poller` and updates keep flowing; restore and confirm it returns to `socket`.

- [ ] **Step 5: Commit**

```bash
git add services/live/WfmSocketClient.ts services/live/WfmSocketClient.frames.md live.ts
git commit -m "feat(live): wf.market socket client behind adapter with poller fallback (spike)"
```

---

## Phase 6 — Deploy

### Task 16: Build, ship, run the new process

- [ ] **Step 1: Full build + test gate**

Run:
```bash
npm run build
npx jest services/live
```
Expected: clean build, all live tests green.

- [ ] **Step 2: Set production env**

On the server, add all Phase-0 keys to `.env` (real values), especially `LIVE_PORT`, `LIVE_FEED_MODE=poller`, `LIVE_CORS_ORIGIN=https://<front-origin>`, `LIVE_HOT_FLOOR=<curated top items>`. Point the Cloudflare Tunnel ingress for the live subdomain (e.g. `live.warframe.digitalshopuy.com`) at `http://localhost:${LIVE_PORT}`, and set the front's `LIVE_URL=https://live.warframe.digitalshopuy.com` in the `warframe-app` PM2 `env` block (baked into `publicRuntimeConfig` at start). Ensure socket.io heartbeat survives the tunnel: default `pingInterval`/`pingTimeout` are fine, but confirm the tunnel does not buffer WebSocket upgrades.

- [ ] **Step 3: Start under PM2**

Run:
```bash
pm2 start ecosystem.config.js --only warframe-live
pm2 save
curl -s https://live.warframe.digitalshopuy.com/health
```
Expected: health JSON reachable through the tunnel; `feedUp:true`.

- [ ] **Step 4: Verify end-to-end in production**

Open the deployed `/live` page. Confirm live prices + verdict badges populate and update, and that closing the tab unsubscribes (watch `liveItems` in `/health` drop after viewers leave).

- [ ] **Step 5: Commit any deploy-doc updates**

```bash
git add ecosystem.config.js .env.example
git commit -m "chore(live): production deploy wiring for warframe-live"
```

---

## Self-Review

**Spec coverage:**
- Real-time source (live socket + poller fallback) → Tasks 6–7 (poller floor), 15 (socket spike + supervisor fallback). ✔ (Sequencing adjusted: poller ships first because no auth infra exists — documented in the plan intro and Task 15 Step 1.)
- Dedicated account auth → Task 0 (env keys), Task 15 Step 1 (cookie path, honest about Cloudflare). ✔
- "As many as feasible" hot set → Task 5 (`SubscriptionManager` cap + hotFloor + overflow). ✔
- Blended fair value → Task 3/4. ✔
- Reusable badge + new live page → Tasks 12, 13. ✔
- Write-through → Task 9 Step 2 (with subdoc-merge fix). ✔
- Monitoring/alerts → Task 14 (client-side event-driven; **deviation from spec's server-fired alerts** — recon showed alerts are 100% client-side localStorage, so server firing would be green-field web-push; called out explicitly). ✔ (deviation documented)
- Health/metrics → Task 9 (`/health`), Task 16 Step 3. ✔
- Risk mitigations (kill-switch, degrade) → `LIVE_FEED_MODE` (Task 0), FeedSupervisor (Task 15). ✔
- Cloudflare Tunnel + heartbeat → Task 16 Step 2. ✔
- YAGNI (in-memory, no Redis) → honored; `SubscriptionManager`/`LiveStore` are in-memory. ✔

**Placeholder scan:** No "TBD"/"handle appropriately". Task 9 Step 3 and Task 14 Steps 1–2 ask the implementer to confirm one accessor/getter name against the real file before wiring — these are explicit verification steps with the fallback spelled out (add a getter), not vague placeholders.

**Type consistency:** `NormalizedOrder`, `LiveBook`, `Verdict`, `FairValueInputs`, `LiveUpdate`, `FeedSnapshot`/`FeedDelta` are defined once in `LiveTypes.ts` and imported everywhere. `VerdictOpts` fields (`halfVolume`, `baseBandPct`, `maxBandPct`, `confMin`) match between `VerdictEngine`, `LiveGateway` deps, and `live.ts` config mapping. `WfmFeed` event names (`snapshot`/`delta`/`status`) are consistent across `HotPoller`, `LiveGateway`, and `WfmSocketClient`. Front `LiveUpdate`/`Verdict`/`LiveBook` mirror the backend shapes.
