# Express/ — route registration wrapper

Thin layer over Express. You rarely edit this — you *use* it from `server.ts`. Endpoints are
registered by calling methods on the `server` instance; the method name picks caching + auth.

## Route methods (`Express/Express.ts`)

| Method | Verb | Caching | Auth | Use for |
| --- | --- | --- | --- | --- |
| `getJson(path, fn)` | GET | none | none | live/per-request reads (order book, price history) |
| `getJsonCache(path, fn)` | GET | shared cache | none | heavy aggregates (analytics, catalogues) |
| `getJsonProtected(path, fn)` | GET | — | admin token | `build_*` rebuild triggers |
| `getJsonAuth(path, fn)` | GET | **never cached** | Firebase | per-user reads (`/me`) |
| `postJson(path, fn)` | POST | — | none | anonymous writes (push subscribe) |
| `postJsonAuth(path, fn)` | POST | — | Firebase | per-user writes (`/me/sync`) |
| `postJsonRecaptcha(path, fn)` | POST | — | reCAPTCHA | spam-guarded writes |

Handlers return a plain value → serialized to JSON. Return `null` to reject (e.g. failed slug
whitelist). Per-user routes must use the `*Auth` variants so responses never hit the shared cache.

## Files

- `Express.ts` — the wrapper class (rate limiting, cache keys = `req.originalUrl`, validation).
- `ExpressSetup.ts` / `ExpressCustomSetup.ts` — server bootstrap.
- `config.ts` — `serverConfig.port` (`API_PORT`, default `3529`).
- `Proxies.ts` — proxy wiring. `Express.interface.ts` — `AuthedRequest` and handler types.

## After adding an endpoint

Regenerate the map: `npm run repo:index` (CI gate `repo:index:check` parses `server.ts` for
these method calls, so a new route must be reflected in `docs/repo-map.md`).
