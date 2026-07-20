# Tenno Account Layer — Firebase Auth + Cloud-Synced Player Tools

Status: Approved (user directive: "Do not make questions, always follow recommendations, keep
iterating until fully implemented and ready to deploy.")
Date: 2026-07-20

---

## 1. Goal

Add optional user accounts (Firebase Auth: **email magic link** + **Google**) and build the
player-facing tools that only make sense once a user has an identity: a synced watchlist, a
tracked inventory ("Vault"), prime-set farming goals with a concrete farm plan, and a trade
ledger with realized P/L.

Non-goal: making the site require an account. Every tool must stay fully usable signed out.

---

## 2. Core architectural decision — local-first, cloud-sync

The app already stores the watchlist in `localStorage` (`app/app/services/portfolio.ts`,
key `warframe_portfolio_v1`). We keep that model and generalize it:

```
useUserData()  ──►  localStorage  (always, immediately — source of truth for the UI)
       │
       └──► debounced PUT to the API   (only when signed in)
```

* Signed out → identical to today's behaviour; every new page works.
* Sign in → one-time **merge** of the local snapshot with the server doc, then continuous sync.
* Sign out → local data stays; sync stops.

Consequences: no SSR auth, no route guards, no flash-of-empty. Pages render their marketing/
explainer hero server-side (good for SEO) and hydrate the user's data on the client.

---

## 3. Authentication

### 3.1 Token verification (backend) — no Firebase Admin SDK

Firebase ID tokens are RS256 JWTs signed by Google. We verify them directly:

* fetch + cache `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`
  (respect `Cache-Control: max-age`),
* verify signature by `kid`, then assert `iss === https://securetoken.google.com/<projectId>`,
  `aud === <projectId>`, `exp > now`, `iat <= now`, `sub` non-empty.

Rationale: the prod box has **no secret-file deploy path** (`ecosystem.config.js` is in git;
the API `.env` is hand-managed). This approach needs only a *public* `FIREBASE_PROJECT_ID`,
adds one small pure-JS dependency (`jsonwebtoken`), and avoids `firebase-admin`'s large
optional-native dependency tree on a memory-bound build box.

New dep (root): `jsonwebtoken@^9.0.3`, `@types/jsonwebtoken@^9.0.10` (dev).

Feature flag: **disabled unless `FIREBASE_PROJECT_ID` is set** — mirrors the VAPID pattern.
When disabled, `/auth/config` reports `enabled: false`, every `/me*` route returns
`{ error: 'auth disabled' }`, and the UI hides the sign-in entry point.

### 3.2 Express plumbing

`Express/Express.ts` gains two wrappers. Both are **uncached** — `getJson`/`getJsonCache`
key the shared cache on `req.originalUrl`, so routing per-user data through them would leak
one user's vault to another. They also emit `Cache-Control: private, no-store`.

```ts
public getJsonAuth(requestUrl: string, f: AuthedFunction): void
public postJsonAuth(requestUrl: string, f: AuthedFunction): void
```

`AuthedFunction = (req: AuthedRequest, res: Response) => Promise<any>` where
`AuthedRequest = Request & { user: { uid: string; email: string | null; ... } }`.

Missing/invalid token → HTTP 401 `{ error: 'unauthorized' }`.
A dedicated stricter rate limiter (120 req / 5 min / IP) guards the write routes.

Note: `postJson`'s existing express-validator branch `return`s instead of responding
(hangs the request). The new wrappers validate inside the handler, like `pushValidate.ts`.

### 3.3 Client

`firebase@^12` (only `firebase/app` + `firebase/auth`, tree-shaken, loaded **dynamically**
so it never enters the main bundle for signed-out visitors).

Firebase web config is public by design. Defaults live in
`app/app/utils/firebaseConfig.ts` and are overridable at runtime via
`NUXT_PUBLIC_FIREBASE_*` → `runtimeConfig.public.firebase` (so the prod box can point at a
different project without a rebuild).

Flows:
* **Google** — `signInWithPopup`, automatic fallback to `signInWithRedirect` when the popup
  is blocked or on in-app browsers.
* **Magic link** — `sendSignInLinkToEmail` with
  `actionCodeSettings.url = <origin><localePath('/account')>?magic=1`; email cached in
  `localStorage['wf_magic_email']`; `/account` completes with `signInWithEmailLink` when
  `isSignInWithEmailLink(location.href)`.

`browserLocalPersistence` so the session survives reloads.

---

## 4. Data model

One document per user, one collection — `warframe-users` (`COLLECTIONS.USERS`), unique
sparse index on `uid`. A single `GET /me` returns the whole state, so every page loads from
one already-in-memory store.

```ts
interface UserDoc {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
  locale?: string
  createdAt: string
  lastSeen: string
  data: {
    watchlist: Record<string, WatchlistEntry>   // == today's localStorage shape
    vault: Record<string, VaultEntry>
    goals: GoalEntry[]
    trades: TradeEntry[]
    settings: UserSettings
    updatedAt: string
  }
}

interface VaultEntry  { url_name: string; item_name: string; qty: number
                        cost?: number | null      // avg plat paid, optional
                        note?: string; updatedAt: string }
interface GoalEntry   { id: string; url_name: string; item_name: string
                        targetQty: number; createdAt: string; note?: string
                        done?: boolean }
interface TradeEntry  { id: string; url_name: string; item_name: string
                        side: 'buy' | 'sell'; qty: number; price: number   // plat per unit
                        at: string; note?: string }
interface UserSettings{ platform?: string; basis?: 'sell' | 'buy' | 'avg' | 'median'
                        liquidityAdjust?: boolean; publicProfile?: boolean }
```

Hard caps enforced server-side (`services/userValidate.ts`), silently truncating rather
than erroring: watchlist 500, vault 3000, goals 200, trades 3000. Strings clamped to 200
chars, numbers finite and non-negative. This bounds the document far below Mongo's 16 MB.

### 4.1 Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/auth/config` | `{ enabled, projectId }` — public, cached |
| GET  | `/me` | Full profile + data. Creates the doc on first call. |
| POST | `/me/sync` | `{ section, value }` — replace one section (`watchlist`/`vault`/`goals`/`trades`/`settings`) |
| POST | `/me/merge` | `{ data }` — union of local + server (first sign-in migration) |
| POST | `/me/profile` | `{ displayName, locale }` |
| POST | `/me/delete` | Wipes the user document (data-deletion right) |

Merge semantics (`services/UserDataService.mergeData`): per-key union; for
`watchlist`/`vault` the entry with the newer `updatedAt`/`addedAt` wins, quantities are NOT
summed (avoids double counting on repeat merges); `goals`/`trades` union by `id`.

### 4.2 Push alerts

`push/subscribe` accepts an optional `idToken`; when valid, the subscription document is
tagged with `uid`. This makes future per-account alert evaluation possible and lets a user
see which devices are subscribed. Existing anonymous behaviour is unchanged.

---

## 5. Frontend surfaces

### 5.1 Shell

* `app/app/stores/auth.ts` (Pinia) — `{ user, ready, configured, enabled }`, actions
  `init`, `signInGoogle`, `sendMagicLink`, `completeMagicLink`, `signOut`, `getIdToken`.
* `app/app/composables/useUserApi.ts` — `$fetch` wrapper attaching `Authorization: Bearer`.
* `app/app/composables/useUserData.ts` — **the** data layer. Reactive `watchlist`, `vault`,
  `goals`, `trades`, `settings` + mutators. Writes localStorage synchronously, schedules a
  1.2 s-debounced server sync when signed in. Exposes `syncState` (`idle|syncing|error|off`).
* `app/app/components/AccountMenu.vue` — app-bar avatar/`mdi-account-circle` button →
  `v-menu` with profile, links to the four pages, sync status, sign out. Inserted between
  `<PwaInstall />` and `<LanguageMenu />`; mobile cluster budget respected (icon-only,
  38×38 like its siblings).
* `app/app/components/AuthDialog.vue` — Orokin dialog shell (`.auth` custom shell, 16 px
  bevel) with Google button, email field, "send magic link", sent/error states.

`portfolio.ts` (the legacy service) is refactored to delegate to the same storage the new
composable uses so the watchlist has exactly one source of truth, keeping its existing
exported function signatures so `portfolio.vue`, `AlertCard`, `AlertEditSheet` and the
`push-eval` tests are untouched.

### 5.2 Pages (all Orokin `.an-*`, all local-first, all usable signed out)

**`/account` — Tenno Codex Access**
Sign-in surface + magic-link callback handler. Signed in: profile card, sync status, data
counts, export JSON, import JSON, "sync now", sign out, delete account data.

**`/vault` — Prime Vault (inventory tracker)**
Add any tradable item with a quantity and optional cost basis. Computes per row: current
`sell`, liquidity-adjusted realizable value (`basis × vol/(vol+10)`, the project's
established `VOL_K`), unrealized P/L vs cost, `pctFromAth`/`pctFromAtl` context, and a
sell-timing verdict pill (`SELL NOW` / `HOLD` / `THIN`). Header stats: total items, total
plat (raw), realizable plat, unrealized P/L. Sorting, search, category chips, mobile cards,
CSV export. Data sources: catalogue (Pinia store) + `/market_analytics`.

**`/goals` — Farming Goals**
Pick a prime **set** as a goal. Using `/set_full/:url_name` (parts + `quantity_for_set`),
the vault (owned quantities) and `/relics_ev` (which relic yields which part, at which
chance), each goal renders:
* a progress bar (parts owned / parts required),
* a missing-parts table with buy-price vs "farm it" guidance,
* **the farm plan**: the relics that drop the missing parts ranked by how many missing
  parts they cover × drop chance, each linking to `DropLocationsDialog` for the actual
  missions,
* buy-the-set vs buy-remaining-parts cost comparison.
Marking a part owned writes straight into the Vault.

**`/ledger` — Trade Ledger**
Record buys/sells (`side`, `qty`, `price`, date, note). Computes realized P/L with weighted
average cost basis per item, total bought/sold plat, best & worst trades, plat/day, a
30-day equity curve (inline SVG, same idiom as `PriceSpark`), and per-item breakdown.
Recording a buy optionally increments the Vault; recording a sell decrements it.

### 5.3 Registration chores per page

For each of `/account`, `/vault`, `/goals`, `/ledger`:
1. `app/i18n/messages/<page>.ts` self-contained literal, English first, then
   `node scripts/tr-file.mjs app/i18n/messages/<page>.ts` for the other 12 locales.
2. `PAGE_SEO['/<page>']` in `app/app/utils/seo.ts`.
3. Localized SEO for all 12 non-English locales in a **new** overlay
   `app/app/utils/seo-i18n-account.ts`, merged into `LOCALIZED_SEO` (lowest precedence,
   alongside the other generated overlays). Required or the blocking `i18n:check`
   SEO-parity gate fails.
4. Nav entry in `layouts/default.vue` `navLinks` under a new `Account` group +
   `nav.items.*` / `nav.sections.account` keys in `app/i18n/messages/nav.ts`.
5. `finishLoading()` on mount (or the spinner never hides).

---

## 6. Testing

Backend (blocking `npm run test:unit`), pure-function style, `import { describe, it, expect }
from '@jest/globals'`, no DB/HTTP:
* `services/userValidate.test.ts` — clamping, caps, rejection of junk shapes, numeric
  coercion.
* `services/userMerge.test.ts` — merge semantics: newer-wins, no double counting, union by
  id, cap enforcement after merge.
* `services/firebaseToken.test.ts` — claim validation (`iss`/`aud`/`exp`/`sub`) against a
  locally generated RSA keypair; signature verification with an injected key source (no
  network).

Frontend pure logic is unit-tested through the existing `test-helpers/*.logic.test.ts`
mechanism (jest maps `vue` and `#imports` to stubs):
* `test-helpers/useVaultValue.logic.test.ts` — realizable value, P/L, verdicts.
* `test-helpers/useLedger.logic.test.ts` — weighted-average cost basis and realized P/L.

Verification before "done": `npm run test:unit`, `npm run build` (root tsc),
`cd app && npm run i18n:check`, `cd app && npm run build`.

---

## 7. Environment / deploy

New API `.env` keys (documented in `.env.example`):
```
FIREBASE_PROJECT_ID=            # public project id; empty ⇒ accounts disabled
FIREBASE_JWKS_TTL_MS=3600000    # optional cert cache floor
```
New frontend build/runtime keys (all PUBLIC Firebase web config, safe in git as defaults in
`app/app/utils/firebaseConfig.ts`; overridable at runtime via Nitro's `NUXT_PUBLIC_`
mechanism):
`NUXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._APP_ID`,
`..._MESSAGING_SENDER_ID`, `..._STORAGE_BUCKET`.

Deploy checklist for the operator is written to `docs/firebase-setup.md`: create the
Firebase project, enable Google + Email-link providers, add
`warframe-app.digitalshopuy.com` (and `localhost`) to Authorized domains, paste the web
config, set `FIREBASE_PROJECT_ID` in the API `.env`, `pm2 reload … --update-env`.

Both lockfiles must be regenerated on node 24 / npm 11 and committed, or `npm ci` fails in
CI and on the box.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Per-user data served from the shared response cache | New auth wrappers bypass `cache.getOrSet` entirely and set `private, no-store` |
| Firebase not configured yet (no project) | Everything gated on `enabled`; app behaves exactly as today when off |
| Bundle bloat for signed-out visitors | `firebase/*` imported dynamically inside the auth store's `init()`, which only runs on user intent or a persisted session hint |
| Blocking i18n SEO-parity gate | New overlay file with all 12 locales generated before the build gate is run |
| Doc growth | Server-side caps + truncation |
| Losing local data on first sign-in | Merge, never replace; `/account` exports JSON |

---

# Addendum — The Foundry (mastery & build tracker)

Added after the account layer landed, in response to: *"create a space in the site that mimics
warframe-foundry.app but keeps the data stored for the logged in account (using MongoDB) so they can
restore it on login … allow users to export data and make it compatible with warframe-foundry.app."*

## Why it fits here

`warframe-foundry.app` is a well-liked mastery/build checklist whose only persistence is browser
localStorage — its author's standing advice to users is *"export your data at some point, just to be
200% safe"*, multi-device sync was requested in 2019 and never shipped, and the feature set has been
frozen for years. The account layer this branch just built is exactly the missing half. And because
this is a **market** site, we can answer the question a pure checklist structurally cannot: what the
gear you are still missing would **cost in platinum**, and which of it is the cheapest mastery you can buy.

## Catalogue (server side)

`services/FoundryService.ts` builds one document (`warframe-foundry`, `{ key: 'catalogue' }`) from
WFCD `warframe-items` raw JSON:

* **916 masterable items** in seven buckets — warframes 120, primary 219, secondary 148, melee 269,
  companions 55, archwing 33, miscellaneous 72. The four biggest buckets match
  warframe-foundry.app's own tab counts exactly, so a migrating user sees the same shape.
* each item carries its components, split into **crafted parts** (tick boxes) and **raw resources**
  (the "what do I still need" table), plus `masteryReq`, `masteryPoints`, `vaulted`, `founderOnly`.
* **169 resources** with per-category demand totals.
* every item and part is linked to its `warframe.market` `url_name` by name matching against this
  app's own catalogue — that link is what makes the platinum features possible.

Identity is WFCD's `uniqueKey` (last segment of `uniqueName`: `/Lotus/Powersuits/Ninja/Ninja` →
`Ninja`) — **the exact key warframe-foundry.app writes in its export**, which is what makes a lossless
import possible.

Endpoints: `GET /foundry/catalogue` (cached like the other aggregates), `GET /build_foundry`
(protected). Refreshed daily by `sync_foundry.ts` (pm2 `warframe-sync-foundry`, 05:00, staggered after
the translations sync). A failed fetch throws without touching Mongo, so the last good copy keeps serving.

## Per-user progress

A sixth section on the account document: `foundry: { items, resources, counters, excluded }`.
`items` is `uniqueKey -> { built?, mastered?, comp?: { componentKey: ownedCount } }`.

The merge rule differs from every other section on purpose: **maximum wins, not newest wins**
(`services/userMerge.ts` `mergeFoundry`). Mastery progress is monotonic — a player ticks things off,
they do not un-master gear — so a phone that synced later but has fewer ticks must never erase a
desktop's progress. `excluded` is a union for the same reason.

Caps: 4000 items, 1000 resources, 40 components per item.

## warframe-foundry.json interop

`app/app/utils/foundryFormat.ts` (pure, unit-tested):

* `parseFoundryExport` reads **both** file versions — v2's single `items.data` map and v1's seven
  per-category maps — and lifts component counts out of their flag namespace (they store counts as
  siblings of `built`/`mastered`).
* `toFoundryExport` writes a v2 file their app imports verbatim, including the full resources block
  with zeros, the way their exporter does.
* `mergeFoundryData` is a max-wins union, so importing an old backup on top of newer progress never
  loses a tick.

Known quirk documented in the module: their own resource importer is broken, so real users' "Have"
numbers are usually all zeros. We read them anyway; it costs nothing.

## What we add that they do not

Implemented in `app/app/composables/useFoundryProgress.ts`:

* **Plat to finish** — `missingCosts` prices every unmastered item against live market data and
  `summarizeMissingCosts` totals it: "437 items left, 4 180 platinum for the tradable ones".
* **Mastery per platinum** — rank the missing gear by `plat / masteryPoints` and surface the cheapest
  rank-ups. Nobody publishes this.
* **Bulk "mark everything up to MR X"** — `keysUpToMasteryReq` + `bulkFoundryMastered`. The
  single loudest complaint about the original was the hand-ticking onboarding wall.
* **Cloud sync + a real account**, which is the whole reason this addendum exists.

## Surface

`/foundry/[[tab]]` — overview (rank estimate, per-category bars, plat-to-finish, counters, import /
export), one tab per category (card grid with Built / Mastered and cycling component chips), and a
resources tab (needed vs have vs short). Local-first like every other tool: fully usable signed out.
