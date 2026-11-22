# Firebase setup — turning on Tenno accounts

The account layer (`/account`, `/vault`, `/goals`, `/ledger`, plus cloud-synced
watchlist/alerts) is **optional and off by default**. With no Firebase project
configured the site behaves exactly as it did before: every tool works, backed by
`localStorage`, and the sign-in entry point is hidden.

This document is the one-time operator checklist to switch it on.

---

## 1. Create the Firebase project

1. <https://console.firebase.google.com> → **Add project**. Analytics is not needed.
2. In the project, **Build → Authentication → Get started**.
3. Enable exactly two sign-in providers:
   - **Google** — set a public-facing name and a support email.
   - **Email/Password** → open it and switch on **Email link (passwordless sign-in)**.
     Leave "Password" itself enabled or not; the app only ever uses the link flow.

## 2. Authorized domains

**Authentication → Settings → Authorized domains** must list every origin the app is
served from, or sign-in fails with `auth/unauthorized-domain`:

```
localhost
warframe-app.digitalshopuy.com
```

(`*.firebaseapp.com` is added automatically — leave it.)

## 3. Get the web config

**Project settings → General → Your apps → Web app** (create one, nickname anything,
skip Hosting). Copy the `firebaseConfig` object.

These values are **public by design** — they identify the project, they do not
authorize anything. Access is governed by the enabled providers, the authorized-domain
list, and server-side ID-token verification. Shipping them in the client bundle is the
documented, intended usage.

Put them either in `app/app/utils/firebaseConfig.ts` (`FIREBASE_DEFAULTS`, committed) or,
per deployment and without a rebuild, as Nitro runtime env on the frontend process:

```
NUXT_PUBLIC_FIREBASE_API_KEY=AIza...
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NUXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NUXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

`NUXT_PUBLIC_*` is read by Nitro at **runtime**, so these belong in the frontend pm2
entry's `env:` block in `ecosystem.config.js` (they are not secrets) followed by
`pm2 reload … --update-env`. Anything read inside `nuxt.config.ts` is baked at build
time and will NOT pick these up — that is exactly why the runtime path exists.

## 4. Turn the API on

The API verifies Firebase ID tokens itself (`services/firebaseToken.ts`) using Google's
published public certificates. There is **no service-account key and no secret file** —
add one line to the repo-root `.env` on the server:

```
FIREBASE_PROJECT_ID=your-project
```

It must be the **same** project id as the web config, or every token is rejected with
`audience mismatch`. Then:

```
pm2 reload ecosystem.config.js --update-env
```

Verify:

```
curl -s https://warframe.digitalshopuy.com/auth/config
# {"enabled":true,"projectId":"your-project"}

curl -s -o /dev/null -w '%{http_code}\n' https://warframe.digitalshopuy.com/me
# 401   (unauthorized without a token — correct)
```

`enabled:false` means `FIREBASE_PROJECT_ID` is unset in the API's environment.
Note `/auth/config` is a cached route, so allow up to `CACHE_TTL_SECONDS` for the flag
to flip at the edge.

## 5. Smoke test

1. Load the site, open the account menu in the app bar (the person icon).
2. **Continue with Google** → should sign in and the icon becomes an avatar.
3. Sign out, then use **email link**: enter your address, open the email, click through.
   It lands on `/account?magic=1`, completes sign-in and strips the credential from the URL.
4. Add an item on `/vault` signed out, then sign in — the item must still be there
   (the first sign-in **merges**, it never replaces).
5. Open the site in another browser, sign in with the same account — the vault appears.
6. On `/foundry`, tick a couple of items, export the backup, and import it again —
   the counts must not double (the import is a max-wins union, not an append).

---

## What is stored

One Mongo document per Firebase uid in `warframe-users`:

```
{ uid, email, displayName, photoURL, provider, locale, createdAt, lastSeen,
  data: { watchlist, vault, goals, trades, foundry, settings, updatedAt } }
```

Nothing else. No passwords (Firebase holds the credential), no payment data, no game
account linkage. `/account` offers a full JSON export and a delete button that wipes the
document via `POST /me/delete`.

Server-side caps (`services/userTypes.ts` `USER_LIMITS`) bound the document: 500
watchlist entries, 3000 vault items, 200 goals, 3000 trades, 1500 Foundry items
(16 components each), 500 Foundry resource counts, 200-character strings. Those
caps are the only thing keeping the document under Mongo's 16 MB ceiling — do not
raise them without redoing that arithmetic.

## Cost

Firebase Authentication's Google and email-link providers are free at any volume this
site will see (the paid tier starts at phone auth / multi-factor / Identity Platform
features, none of which are used). No Firestore, Storage or Functions are used —
all user data lives in the project's own MongoDB.

## Current deployment (switched on 2026-11-21)

- Project **`wf-market-analytics`** (number 1015959223793), web app
  `1:1015959223793:web:bd6d206494f411afe5d850`, config baked into
  `app/app/utils/firebaseConfig.ts`; the API `.env` on `.11` has
  `FIREBASE_PROJECT_ID=wf-market-analytics`.
- **Spark plan with NO billing account linked** (`gcloud billing projects describe
  wf-market-analytics` → `billingEnabled: False`), so it cannot be charged: past a free
  quota a call fails, it is never billed. Keep it that way: do not link billing, do not
  "upgrade to Firebase Authentication with Identity Platform" (auth subtype must stay
  `FIREBASE_AUTH`). Programmatic `identityPlatform:initializeAuth` needs Blaze, which
  is why Authentication was started with the console's "Get started" button.
- Spark allows **5 email sign-in links per day for the whole project** (verification
  emails 1000/day). Google sign-in has no such cap, so it is the main path; a quota
  error tells the user to use Google or try tomorrow (`auth.errors['email-quota']`).
- The browser key ("Browser key (auto created by Firebase)") is restricted to
  `identitytoolkit.googleapis.com` + `securetoken.googleapis.com` and to the referrers
  `https://warframe-app.digitalshopuy.com/*`, `https://wf-market-analytics.firebaseapp.com/*`,
  `https://wf-market-analytics.web.app/*`, `http://localhost:3312/*`, `http://127.0.0.1:3312/*`.
  A new origin must be added there AND to Authentication → Settings → Authorized domains.
- Providers: Google, and Email/Password with email link (`passwordRequired: false`).
  Authorized domains: `localhost`, the two Firebase hosting domains, and
  `warframe-app.digitalshopuy.com`.

## Turning it back off

Remove `FIREBASE_PROJECT_ID` from the API `.env` and reload. The API immediately rejects
every `/me*` call with `503 auth disabled` and the UI hides sign-in. Local data is
untouched, so every tool keeps working; the stored documents remain in Mongo until
deleted.

---

## Edge cache — a hard requirement, not an optimisation

The account API is **per-user**, and the API host sits behind a Cloudflare cache
whose key is the URL alone (Cloudflare honours `Vary` only for `Accept-Encoding`).
A cached `/me` would therefore be one signed-in user's whole account document
served to everybody — and the Worker's 24-hour stale-on-error backup would serve
it to anonymous callers too, with no auth check at all.

Three layers guard against that. All three must stay in place:

1. **Origin** — `Express.getJsonAuth` / `postJsonAuth` bypass the shared
   `CacheService` entirely and send `Cache-Control: private, no-store, max-age=0`
   plus `Vary: Authorization`.
2. **Worker** (`cloudflare/worker.js`) — skips the cache for `/me`, `/me/*` and
   for any request carrying an `Authorization` header, and refuses to store any
   response whose origin `Cache-Control` contains `private` or `no-store`.
3. **Dashboard Cache Rule** (if you use it instead of the Worker) — the
   expression in `docs/cloudflare-cache.md` excludes `/me`, and the Edge TTL is
   set to "use cache-control header if present", which respects `no-store`.

After deploying, confirm the edge is not caching the account API:

```
curl -sI https://warframe.digitalshopuy.com/me | grep -i -E 'cache-control|cf-cache-status|x-edge-cache'
# expect: cache-control: private, no-store, max-age=0
#         x-edge-cache: (absent, or BYPASS)
#         cf-cache-status: DYNAMIC or BYPASS — never HIT
```
