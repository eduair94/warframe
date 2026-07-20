# services/ — backend business logic

Domain logic + external clients the API endpoints call. `server.ts` builds a `Warframe`
facade (`warframe.ts` / `WarframeFacade.ts`) that composes these. `services/index.ts` is the
barrel export.

## Layout

- **HTTP clients** — `HttpService` (axios), `UndiciHttpService` (undici). Both implement
  `IHttpClient`; services get one by DI so the same logic runs on either backend.
- **`BaseWarframeClient`** — abstract Template-Method base; subclasses pick the HTTP client.
  Shared fetch/proxy/anti-detection lives here. Extend it, don't fork it.
- **Domain services** — `Market`, `Riven`, `Relic`, `Item`, `Set`, `Drop`, `Mission`,
  `Foundry`, `MarketAnalytics`, `PriceHistory`, `Translation`. One responsibility each.
- **Pure calculators** (no I/O, easiest to test) — `OrderCalculator`, `StatisticsCalculator`,
  `ItemProcessor`, `ModFlipCalculator`, `EndoCost`.
- **Caching** — `CacheService` (Redis L1+L2, stale-serve, bg refresh), `CacheWarmer`
  (keeps heavy aggregates warm so a cold recompute never reaches Cloudflare → 502).
- **Auth/push** — `firebaseToken`, `UserDataService`, `userMerge/userValidate/userTypes`,
  `PushAlertService`, `PushSubscriptionService`, `push{Eval,Messages,Validate}`.
- **Proxy/transport** — `ProxyManagerAdapter`, `SocksConnector`, `HeaderService`.
- **`live/`** — real-time feed engine (own process, `live.ts`).

## Conventions

- Every service `Foo.ts` has a sibling `Foo.test.ts` (jest, `*.test.ts`). Add/keep tests —
  `npm run test:unit` is a **blocking** CI gate.
- Imports are **relative** (`../constants`, `../database`). The `@services/*` aliases exist
  only in jest's `moduleNameMapper`, not in app code.
- Pure calculators take data in / return data out — test those directly, no mocks.
- Keep a service to one concern; if it grows two, split it (mirrors how it's already sliced).
