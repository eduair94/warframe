# Warframe Market Analytics — project guide

Read this first. It is the map; **[docs/repo-map.md](docs/repo-map.md)** is the index
(every route, endpoint, service — auto-generated). Per-directory `CLAUDE.md` files load
automatically when you touch that directory and hold the local detail.

## What this is

Two apps in one repo, sharing data through MongoDB:

1. **Backend API** (repo root, TypeScript + Express) — scrapes warframe.market + WFCD
   drop data, computes market/relic/riven/foundry analytics, serves cached JSON.
2. **Frontend** (`app/`, Nuxt 4 + Vuetify + Pinia) — the "Void Ledger" site that renders
   those analytics. **Live code is in `app/app/`** (Nuxt 4 `srcDir`), _not_ `app/pages/`.
3. **Live feed** (`live.ts` + `services/live/`) — separate long-running process, real-time
   wf.market socket + verdict engine.

## Ports & environments

| Thing | Local port | Prod domain (Cloudflare tunnel, not nginx) |
| --- | --- | --- |
| API | `3529` (`API_PORT`) | `warframe.digitalshopuy.com` |
| Nuxt app | `3312` | `warframe-app.digitalshopuy.com` |
| Live feed | `3530` | — |
| MongoDB | `27017` | — |

Node **24** required (`.nvmrc`). Copy `.env.example` → `.env` before running.

## Commands

Backend (repo root):

```bash
npm run dev            # API, ts-node-dev watch, :3529
npm run dev:live       # live feed process
npm test               # jest (all)
npm run test:unit      # jest minus integration — BLOCKING CI gate
npm run build          # tsc -> dist/
npm run repo:index     # regenerate docs/repo-map.md (run after adding routes/pages)
npm run sync_items     # data importers: sync_{items,prices,drops,rivens,nodes,foundry,...}
```

Frontend (`cd app`):

```bash
npm run dev            # Nuxt, :3312 (runs i18n:build first)
npm run build          # nuxt build (runs i18n:build first)
npm run i18n:check     # vue-i18n compile guard — BLOCKING CI gate
npm run typecheck      # advisory
```

## CI / deploy

`.github/workflows/deploy.yml`: push to `main` → gates → SSH pull+build+pm2 on prod.
**Deploy is ARMED** — merging to `main` ships to production.

- **BLOCKING gates** (fail = no deploy): API `test:unit`, app `i18n:check`, API `repo:index:check`.
- **Advisory** (annotate only): lint, format:check, typecheck.

So: keep unit tests green, keep i18n messages compiling, and **rerun `npm run repo:index`
whenever you add/rename a route, endpoint, service, or i18n module** — CI checks it is current.

## Directory map

| Path | What | Local guide |
| --- | --- | --- |
| `server.ts` | API entry — every endpoint is registered here | — |
| `warframe.ts`, `WarframeFacade.ts` | top-level orchestration the endpoints call | — |
| `services/` | business logic + external clients (one `*.ts` + `*.test.ts` each) | `services/CLAUDE.md` |
| `Express/` | thin route-registration wrapper (`getJson`, `getJsonCache`, `*Auth`) | `Express/CLAUDE.md` |
| `interfaces/`, `*.interface.ts` (root) | shared TS types | — |
| `constants/` | shared constants | — |
| `sync_*.ts` (root) | data importers (Mongo populators) | — |
| `scripts/` | tooling: i18n + gemini translate + `gen-repo-index.mjs` | `scripts/CLAUDE.md` |
| `scripts/dev/` | throwaway probes (`debug-ayatan`, `test-*` — not jest tests) | — |
| `app/app/` | **Nuxt 4 frontend source** (pages, components, stores, composables) | `app/app/CLAUDE.md` |
| `app/i18n/` | translations, 13 locales, some modules 100 KB+ | `app/i18n/CLAUDE.md` |
| `cloudflare/worker.js` | edge cache worker (stale-if-error, fail-open) | — |
| `docs/` | human docs + `repo-map.md` (generated) | — |

## Token traps — read narrowly, never whole

These are huge and greping/reading them blind burns 100k+ tokens:

- `app/i18n/messages/*.ts` — up to **135 KB** each (see repo-map.md table). Grep for a key
  or read with `offset`/`limit`; never read the whole file.
- `app/app/utils/seo-i18n-guides.ts` (110 KB), `seo-i18n.ts` (78 KB) — generated SEO overlays.
- `app/app/data/` — 362 baked data files. Know the filename before reading.

## Conventions that bite if you miss them

- **Frontend edits go in `app/app/`**, not `app/pages/` (deleted Nuxt-2 tree).
- **`<head>` is central**: `app/app/utils/seo.ts` map + the default layout. No per-page `useHead`.
- **New page must hide the spinner**: call the `#spinner-wrapper` hide on mount or it spins forever.
- **i18n = add the key to all locales.** Use `node scripts/tr-file.mjs`, never hand-edit per locale.
- **Design system = Orokin "Void Ledger"**: `app/app/assets/analytics.css` `.an-*` classes,
  Cinzel/Rajdhani fonts, void+gold+cyan palette. Match it on new pages.
- WFCD is Cloudflare-walled in this environment — use the raw-github mirror for drop data.
