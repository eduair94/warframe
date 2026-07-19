# Spec B — Background Web Push price alerts

Date: 2026-07-19
Status: Approved (auto-approved by user; "do it all")
Depends on: Spec A (alert data shape / /portfolio UX). Same branch `feat/portfolio-alerts-ux`.

## Goal

Make price alerts fire with the tab **closed**. Today `checkAlerts` only runs
foreground (`new Notification` while /portfolio is open). This adds real
Web Push: a service worker, VAPID, a server-side subscription store, and a
periodic evaluator that pushes when a watched item crosses a threshold.

No user accounts (matches the app's design). A subscription is keyed by an
anonymous, client-generated **deviceId** (localStorage) + the browser's
PushSubscription. The watchlist + thresholds — which live only in localStorage
today — are **synced to the server** so the evaluator can run without the client.

## Architecture

```
browser (SW: push-sw.js)  ──subscribe──▶  POST /push/subscribe {deviceId, subscription, alerts, locale}
        ▲                                        │ upsert (merge, preserve notified flags)
        │ push                                   ▼
   web-push  ◀── PushAlertService (server.ts interval, ~90s) ── push_subscriptions (Mongo)
                     │ fetch localhost /market_analytics → {url_name: {sell, pctFromAtl}}
                     │ evaluate each sub's alerts (pure pushEval)
                     └ send + persist notified flags + prune dead endpoints (404/410)
```

### Where the evaluator runs

`server.ts` (the REST process — single pm2 instance), on a `setInterval`, like
`CacheWarmer`. It self-fetches the already-cached/warmed `/market_analytics`
(one cheap request) for `sell` + `pctFromAtl` per item — no new heavy compute,
and ATL support comes free. Runs only if VAPID keys are configured (feature
flag = keys present).

### Threshold semantics (unchanged from client)

- `below`: `sell <= below`
- `above`: `sell >= above`
- `atl`: `pctFromAtl <= 3` (the existing `NEAR_ATL_PCT`)
- One-shot per arming: a `notified*` flag per direction prevents re-notifying
  every cycle. Editing a threshold **re-arms** it.

### Re-arm on the server

The client resends the full alerts list on every change **without** notified
flags. `PushSubscriptionService.upsert` merges: for each incoming alert, if an
existing alert for the same `url_name` has identical `below/above/atl`, keep its
notified flags; otherwise reset them. So changing a target re-arms exactly that
alert, and unchanged ones don't re-fire.

## Files

### Backend (new)
- `services/pushEval.ts` — **PURE, no I/O imports**: `evaluateSubscription(sub,
  priceMap)` → `{ pushes, changed }`, `mergeAlerts(existing, incoming)` (re-arm),
  types. Unit-tested.
- `services/pushMessages.ts` — **pure** localized push copy (`below/above/atl`
  templates), en/es/pt + English fallback; `locale` stored per subscription.
- `services/PushSubscriptionService.ts` — Mongo wrapper
  (`MongooseServer.getInstance(COLLECTIONS.PUSH_SUBSCRIPTIONS, …)`): `upsert`,
  `all`, `remove`, `saveAlerts`.
- `services/PushAlertService.ts` — `web-push` init from env; `runOnce()` (fetch
  analytics → build priceMap → evaluate all subs → send → persist → prune),
  `startInterval(ms)`, `getPublicKey()`.
- `push-eval.test.ts` — unit tests for the pure evaluator + merge (covered by the
  blocking `test:unit` gate).

### Backend (changed)
- `constants/index.ts` — add `PUSH_SUBSCRIPTIONS: 'warframe-push-subscriptions'`.
- `server.ts` — register `POST /push/subscribe`, `POST /push/unsubscribe`,
  `GET /push/public-key`; validate **inside** the handler (the `postJson`
  validation param has a latent no-response bug); `startPushAlerts(port)`.
- `package.json` — add `web-push` + `@types/web-push`.
- `.env.example` — `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
  `PUSH_EVAL_INTERVAL_MS`.

### Frontend (new)
- `app/public/push-sw.js` — `push` + `notificationclick` listeners (imported into
  the vite-pwa SW via `workbox.importScripts`).
- `app/app/composables/usePushAlerts.ts` — deviceId, fetch public key,
  `subscribe()`, `unsubscribe()`, `syncAlerts(list)`, permission + supported state.

### Frontend (changed)
- `app/nuxt.config.ts` — `pwa.workbox.importScripts: ['/push-sw.js']`.
- `app/app/pages/portfolio.vue` — `enableAlerts()` now subscribes to push and
  syncs the watchlist; `saveAlert`/`removeItem` re-sync; when push is active,
  skip the foreground `checkAlerts` interval (server owns delivery); banner text
  reflects background push.
- `app/i18n/messages/portfolio.ts` — `pushOn` / `pushBlocked` states × 13 locales.

## Security

- **Can't push to a stranger:** web-push requires the endpoint's own
  `p256dh`/`auth` keys, which only that browser holds — subscribing someone else
  is infeasible. Endpoint is a capability URL.
- Validate payload inside the handler: `deviceId` non-empty string, `subscription`
  has `endpoint` + `keys.p256dh` + `keys.auth`, `alerts` is an array **capped**
  (≤ 250) with numeric/bool fields coerced. Reject otherwise.
- Global inbound rate limiter already applies (`Express.ts`).
- VAPID **private** key is a secret: `.env` only, never committed;
  `.env.example` carries placeholders. Feature stays off until keys are set.
- Prune on `404`/`410` so dead endpoints don't accumulate.

## Non-goals
- Localized push copy beyond en/es/pt (fallback English; `locale` stored for
  later fill-in).
- Multi-instance dedupe (single pm2 REST instance today; note the seam).
- Email channel.

## Verification
- `npm run test:unit` (root) — green incl. new `push-eval.test.ts` (blocking gate).
- `npm run build` (app) — SW + importScripts + templates compile.
- `npm run i18n:check` — pass (new keys).
- Manual: subscribe on desktop+mobile, close tab, cross a threshold in Mongo /
  wait for a real move → push arrives; edit threshold re-arms; unsubscribe stops.
