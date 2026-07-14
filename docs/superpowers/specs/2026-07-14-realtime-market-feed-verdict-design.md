# Real-time Market Feed + Buy/Sell Verdict Engine — Design

**Date:** 2026-07-14
**Status:** Approved-pending (brainstorming output; awaiting user spec review before writing-plans)

## Problem

warframe.market shows a live price that updates in real-time as orders and seller
presence change. Our app only has **daily** snapshots: `sync_prices.ts` fetches the
full order list per item, computes best ingame buy/sell, but saves **only
aggregates** (`buy/sell/volume/avg_price`) plus one daily history point — the live
order book and per-user online status are discarded. There is no websocket anywhere.

We want two things:

1. **Real-time updates** like warframe.market — live best buy/sell as orders and
   presence change.
2. An **analytics layer** on top that says whether an item is **worth buying**
   (underpriced now) or **worth selling** (overpriced now), with confidence.

Both must be **integrated into the existing monitoring** (price sync + portfolio
watchlist/alerts) and "work flawlessly" — i.e. degrade gracefully, never go dark.

## How warframe.market does real-time (research)

- Single **Socket.IO** websocket (`wss://warframe.market/socket.io/?EIO=4&transport=websocket`),
  authenticated by the site `JWT` cookie, sitting **behind Cloudflare**.
- On opening an item the client subscribes; the server then pushes **event deltas**,
  not periodic snapshots:
  - order **created / updated / deleted** for the subscribed item,
  - **user online-status** changes (`ingame` / `online` / `offline`).
- The displayed price is the client re-sorting **lowest sell / highest buy among
  online users** whenever an order or presence event arrives. So "real-time price"
  is **order-book + presence deltas re-sorted client-side**, not new trades.

> **Honest limitation:** a live network capture was attempted but Cloudflare's
> interactive challenge blocks headless automation (consistent with the REST side,
> which only gets through via the proxy pool + anti-detection). The exact push-event
> **names/schema therefore remain unconfirmed** and MUST be discovered at
> implementation time by logging raw frames from the first authenticated socket
> connection. The socket client is deliberately isolated behind an adapter so this
> discovery does not ripple through the rest of the system.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Real-time source | **Server-side live wf.market socket** (true real-time), with a **fast-poll fallback** under the same internal feed so it degrades instead of going dark. |
| Auth | **Dedicated wf.market account.** Credentials in `.env` as `WARFRAME_EMAIL` / `WARFRAME_PASWORD` (spelling matches the user's .env). |
| Live coverage ("hot set") | **As many as feasible** — a live-slot ceiling; overflow + down-socket items degrade to the poller; the long tail stays on the existing daily sync. |
| Verdict UI | **Reusable badge everywhere** (item/set/screener/flip/portfolio) **+ one new dedicated live page.** |
| Fair-value basis | **Blended:** liquidity-weighted wf.market 48h `avg_price` + rolling median of our daily history, band-scaled by volatility. |
| WS routing | **Separate public subdomain** (e.g. `live.warframe.digitalshopuy.com`) via a **Cloudflare Tunnel** the user manages, pointing at the live process port. |

## Architecture

New **isolated PM2 process `warframe-live`** owns the risky, stateful, real-time
part so a socket crash never touches REST/SSR. It:

- holds the wf.market connection(s) via the dedicated account,
- keeps a live **order book + online presence** per hot item **in memory**,
- computes verdicts (fair value vs live book),
- runs **our own Socket.IO server** that the front subscribes to,
- **write-through**: pushes upgraded best-buy/sell/volume into the existing Mongo
  `market` snapshot so the rest of the app gets fresher data for free,
- fires **watchlist/portfolio alerts in real-time** instead of on the daily cron.

```
warframe.market ──Socket.IO(deltas)──┐  (dedicated acct JWT + cf_clearance, via proxy pool)
REST orders (fallback poll, proxies) ─┤
                                      ▼
                      ┌───────────────────────────────┐
                      │        warframe-live (NEW)     │
                      │  WfmFeed adapter (socket|poll) │
                      │  LiveStore (book + presence)   │
                      │  VerdictEngine (blended FV)    │
                      │  our Socket.IO server          │
                      │  write-through → Mongo         │
                      │  alert trigger → portfolio     │
                      └──────┬───────────────┬─────────┘
       our WS (Cloudflare    │               │ Mongo (snapshot upgrade, alerts)
       Tunnel → /subdomain)  ▼               ▼
              Nuxt front (badge + live page)   existing app / monitoring
```

### Component boundaries

Each unit has one purpose, a defined interface, and is testable in isolation.

- **`WfmFeed` (adapter/interface)** — the only thing consumers see. Emits normalized
  delta events: `orderUpsert`, `orderRemove`, `presence`, `snapshot`. Two
  implementations behind it:
  - **`WfmSocketClient`** (`socket.io-client`): logs in via REST `signin` through the
    proxy + anti-detection stack to obtain JWT + `cf_clearance`, opens the socket,
    subscribes per item, translates raw frames → normalized events. **Logs raw
    frames on first authed connect** (schema discovery). Auto-reconnect + re-subscribe.
  - **`HotPoller`**: reuses existing `UndiciHttpService` / `MarketService` orders
    endpoint through the proxy pool; polls at a configurable interval; diffs against
    last state to emit the same normalized events. Covers overflow + socket-down.
- **`SubscriptionManager`** — decides which items are live vs polled vs dormant.
  Live-slot ceiling `LIVE_MAX_SUBSCRIPTIONS`. Priority: watchlisted ∪ currently-viewed
  ∪ top-volume/value. Items nobody is viewing drop from live back to daily sync.
- **`LiveStore`** — in-memory per-item state: `{ buyOrders[], sellOrders[], presence,
  bestBuy, bestSell, volumeHint, updatedAt }`. Applies normalized deltas; recomputes
  best online buy/sell using the **same status-priority logic already in
  `OrderCalculator`** (`ingame` → `online`). Pure, unit-testable.
- **`VerdictEngine`** — pure function `(liveState, fairValueInputs) → Verdict`. No I/O.
- **`LiveGateway`** — our Socket.IO server. Clients `subscribe(url_name)` /
  `unsubscribe`; gateway feeds subscriptions into `SubscriptionManager` and streams
  `{ liveState, verdict }` on change. Heartbeat/ping enabled (survives Cloudflare
  Tunnel ~100s idle timeout).
- **`LiveMonitorBridge`** — subscribes to store changes to (a) write-through to Mongo
  and (b) evaluate portfolio/watchlist alert thresholds in real-time.

## Verdict engine — "worth buying / worth selling"

**Fair Value (FV)** per item = liquidity-weighted blend:

```
fvAvg    = wf.market 48h avg_price (realized trades — truest single signal)
fvMedian = rolling median of stored daily-history price (MarketAnalyticsService.priceOf)
w        = liquidity weight from volume + book depth + dataDays  (0..1)
FV       = w * fvAvg + (1 - w) * fvMedian    // thin/no-avg items lean on history
band k   = base_k * volatilityFactor          // jumpy items get wider bands
```

**Live inputs** (online-only, from `LiveStore`): `bestSell` (what you pay to buy now),
`bestBuy` (what you get selling now), depth/liquidity.

**Output** (per item, streamed to the front):

```ts
interface Verdict {
  verdict: 'buy' | 'sell' | 'fair' | 'hold'
  score: number        // -100 (overpriced) .. +100 (bargain)
  confidence: number   // 0..1 from volume + book depth + dataDays
  fv: number
  bestBuy: number
  bestSell: number
  dealPct: number      // (fv - bestSell)/fv, how far below FV you can buy
  flipMargin: number   // bestSell - bestBuy, instant-flip spread
  reason: string       // human-readable, e.g. "sell 18% below 7d fair value"
}
```

- **Buy signal**: `bestSell < FV·(1−k)` → underpriced, good buy. `dealPct=(FV−bestSell)/FV`.
- **Sell signal**: `bestBuy > FV·(1+k)` (or listable above FV) → overpriced, good sell.
- **`hold`/`fair`**: inside the band, or confidence too low to advertise.
- **Low liquidity → greyed/weak verdict.** Never advertise a signal we can't back —
  same honesty rule as the relic-farming `completeOnly` filter.

## Frontend — DEFERRED to the Nuxt 4 + Vuetify 3 migration

**Decision (2026-07-14):** the app is still Nuxt 2 and the Nuxt 4 migration
([2026-07-14-nuxt4-vuetify3-migration-design.md](2026-07-14-nuxt4-vuetify3-migration-design.md))
is only spec'd, not built. To avoid throwaway Nuxt 2 UI, the live-feed **frontend is
built natively as part of that migration**, against the finished, framework-agnostic
backend below. The Nuxt-2 `liveFeed.ts`/`nuxt.config` client was reverted; only the
`socket.io-client` dependency remains in `app/`. `LIVE_URL` front wiring is deferred too.

### Consumption contract the Nuxt 4 UI must implement

**Runtime config:** add `liveURL` to `runtimeConfig.public` (Nuxt 4: `useRuntimeConfig().public.liveURL`,
env `LIVE_URL`, default `http://localhost:3530`).

**`useLiveFeed` composable** — one shared `socket.io-client` connection to `liveURL`, browser-only:
- `subscribe(url_name, cb): () => void` — emits socket `subscribe {url_name}` to the server
  **only for the first listener of a url**; returns an unsubscribe fn that emits `unsubscribe {url_name}`
  **only when the last listener is removed**.
- Emit the first `subscribe` only when `socket.connected`; otherwise let the `connect` handler
  re-emit `subscribe` for every active url (this is the single-emit fix — a naive direct emit
  double-counts viewers server-side). On reconnect, re-subscribe all active urls.
- Server pushes `update` events carrying `LiveUpdate = { url_name, book: LiveBook, verdict: Verdict }`
  (shapes exactly mirror `services/live/LiveTypes.ts`).
- **Fallback:** if the socket is unavailable, read the REST `/market_analytics` snapshot so pages never break.

**`<MarketVerdictBadge>`** (reusable, Vuetify 3): colored chip (buy = cyan/green, sell = gold,
fair = grey, hold = muted), `dealPct`, confidence dot, tooltip with FV / bestBuy / bestSell / reason.
Dropped into item/set/screener/flip/portfolio.

**New `/live` page**: searchable item list; per visible row the live best buy/sell, FV, and verdict
badge, updating in place; cap the number of simultaneously-subscribed rows (~40). wf.market-style
real-time view plus the analytics layer wf.market does not expose.

**Real-time alerts (portfolio):** drive the existing client-side `checkAlerts()` off live-feed
`update` events (overlay live sell price onto a component-local map, never mutate store getters),
keeping the periodic interval as a backstop. No server-side web-push in scope.

> Reference implementation (Nuxt 2 idiom, reverted): the original `app/services/liveFeed.ts`
> is recoverable from git history (commits `0e6be3a`, `ab935be`) as a design reference; rewrite
> it for Nuxt 4 (`useRuntimeConfig` instead of `window.$nuxt.$config`).

## Monitoring integration

- **Real-time alerts**: `LiveMonitorBridge` evaluates existing portfolio/watchlist
  thresholds on each verdict update and fires immediately (reuses the current
  portfolio alert model — no new alert store).
- **Write-through**: keeps Mongo `market` snapshots hot for the rest of the app.
- **Health/metrics**: `warframe-live` exposes `/health` (socket state, live-slot
  usage, poll rate, last-frame age, reconnect count) so the feed is observable and
  PM2 can restart on stall.

## Configuration (new `.env` keys)

| Key | Purpose | Default |
|---|---|---|
| `WARFRAME_EMAIL` / `WARFRAME_PASWORD` | dedicated account login (spelling per user .env) | — |
| `LIVE_PORT` | port the live Socket.IO server binds (Cloudflare Tunnel → this) | `3530` |
| `LIVE_FEED_MODE` | `socket` \| `poller` \| `off` — kill-switch / force fallback | `socket` |
| `LIVE_MAX_SUBSCRIPTIONS` | live-slot ceiling; overflow → poller | tuned in impl |
| `LIVE_POLL_INTERVAL_MS` | fast-poll cadence for polled items | tuned in impl |
| `LIVE_CORS_ORIGIN` | allowed front origin(s) for the WS server | app origin |

## Risk mitigations (socket ban-risk accepted)

- **Dedicated account** isolates any flag from the user's main account.
- **Single shared socket**, not one per user.
- Respectful subscribe/unsubscribe churn; proxy-routed like the rest of the stack.
- **Auto-degrade to poller** on disconnect / Cloudflare challenge → product never
  goes dark.
- **`LIVE_FEED_MODE=off/poller`** kill-switch to disable the socket instantly.
- Cloudflare Tunnel WS: **socket.io heartbeat/ping enabled** to survive the idle
  timeout; tunnel ingress → `LIVE_PORT`.

## Scope guard (YAGNI)

- **In-memory** live store (single PM2 process). **No Redis** until multi-instance
  scale is actually needed (documented as the future scale-out seam).
- One new process, one new page, one badge component, one composable, one adapter
  with two implementations.
- **Out of scope:** placing/managing orders on wf.market; multi-instance horizontal
  scaling; per-user wf.market logins; historical backfill of the live book.

## Testing strategy

- **`LiveStore`** — pure unit tests: apply delta sequences, assert bestBuy/bestSell
  and presence transitions (reuse `OrderCalculator` status-priority expectations).
- **`VerdictEngine`** — pure unit tests: table of (FV inputs, live book) → expected
  verdict/score/confidence, incl. low-liquidity greying and volatility band scaling.
- **`WfmFeed` adapter** — contract tests with a recorded/mock frame fixture (captured
  during the implementation-time schema-discovery step); both socket and poller
  implementations must emit identical normalized events for the same underlying data.
- **`HotPoller`** — diffing logic tested against before/after order snapshots.
- **Frontend** — `useLiveFeed` fallback path (socket down → REST snapshot) and badge
  rendering per verdict type.

## Open items to resolve during implementation

1. Confirm wf.market socket **event schema** by logging first authed connection.
2. Confirm the socket accepts a **server-held session** (vs browser-only); if not,
   run **poller-primary** — still near-real-time (seconds), still ships.
3. Tune `LIVE_MAX_SUBSCRIPTIONS` / `LIVE_POLL_INTERVAL_MS` against proxy-pool
   headroom and observed rate-limit behavior.
