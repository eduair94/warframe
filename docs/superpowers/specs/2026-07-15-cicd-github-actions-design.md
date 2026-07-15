# CI/CD — GitHub Actions SSH deploy

**Date:** 2026-07-15
**Status:** Design (awaiting review)

## Goal

Automate what is today a manual "push `main` → SSH to prod → pull + build + pm2"
step. On every push to `main`, run quality gates and — if they pass — deploy the
monorepo (TypeScript API + Nuxt 4 frontend + workers) to the single pm2-managed
prod server, with zero manual steps.

## Context (current setup)

- **Monorepo, one prod server.** Root is the TS API + sync workers; `app/` is the
  Nuxt 4 SSR frontend. A single root `ecosystem.config.js` runs all pm2 apps:
  `warframe-server` (API), `warframe-app` (frontend), `warframe-live`, and the
  `warframe-sync-*` workers (some `cron_restart`-scheduled).
- **Build commands.** API: `npm ci && npm run build` (tsc → `dist/`). Frontend:
  `cd app && npm ci && npm run build` (Nuxt → `app/.output/`).
- **Runtime env** (API origin, ports, SITE_URL) already lives in
  `ecosystem.config.js` `env` blocks — the pipeline does not manage it.
- **Gates available.** Root: `npm run lint` (eslint), `npm run format:check`
  (prettier), `npm run test:unit` (jest, excludes `warframe.integration.test.ts`).
  App: `npm run typecheck` (nuxi), `npm run lint` (eslint).
- Both `package-lock.json` files are committed → `npm ci` is valid.
- Dockerfile targets `node:20-alpine`; no `.nvmrc`/`engines` today.

## Decisions

| Question | Decision |
|---|---|
| CI reaches prod via | **SSH from a GitHub-hosted runner** (`appleboy/ssh-action`) |
| Deploy trigger | **Push to `main`** → gates → auto-deploy when green |
| Gates | **Unit tests (API) BLOCK** the deploy. lint + format:check (API) and typecheck + lint (app) are **advisory** (`continue-on-error`) — they run and annotate but don't block, because the codebase carries pre-existing lint/format/type debt (17 lint errors at design time). Integration tests that hit live wf.market are **excluded** (flaky/rate-limited). Tighten the advisory gates to blocking once the debt is cleaned. |
| pm2 scope | **Reload all** — `pm2 reload ecosystem.config.js --update-env` |
| Node | **24** (`.nvmrc`). Nuxt 4.4.8 requires `^22.12 \|\| ^24.11 \|\| >=26`, so the Dockerfile's `node:20` is too old for the app. Node 24 ships **npm 11**, matching the dev machine (24.15 / npm 11.12) that authored `app/package-lock.json` — critical, because npm 10 (node 20/22) builds a different dependency tree and rejects the lock (`Missing @esbuild/... from lock file`). Prod must also be ≥24.11 for the deploy build. (Stale `Dockerfile` `node:20` should be bumped separately.) |

## Architecture

Single workflow: `.github/workflows/deploy.yml`.

**Triggers**
- `push` to `main` → run `ci`, then `deploy`.
- `pull_request` → run `ci` only (no deploy) so bad code is caught before merge.

**Job `ci`** — `ubuntu-latest`, Node 20:
1. `actions/checkout`
2. `actions/setup-node` (node 20, cache npm for both lockfiles)
3. `npm ci` (root) and `cd app && npm ci`
4. Gates (all run every time; advisory ones annotate but don't fail the job):
   - **advisory** (`continue-on-error`): root `npm run lint`, `npm run format:check`; app `npm run typecheck`, `npm run lint`
   - **blocking**: root `npm run test:unit` — its failure fails `ci` and stops `deploy`

**Job `deploy`** — `needs: ci`, `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`:
- `appleboy/ssh-action` runs on the server, one `&&`-chained script:
  ```sh
  cd "$DEPLOY_PATH" \
    && git pull --ff-only \
    && npm ci && npm run build \
    && (cd app && npm ci && npm run build) \
    && pm2 reload ecosystem.config.js --update-env
  ```
- `&&` chaining is deliberate: a failed build aborts **before** `pm2 reload`, so
  prod keeps serving the previous build.

**Concurrency** — keyed per ref so `main` and each PR are independent:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```
`main` runs **queue** (`cancel-in-progress: false`) so two deploys never overlap;
superseded PR check runs cancel. `main` receives frequent direct-to-`main`
pushes, so this serialization matters.

## Secrets (repo → Settings → Secrets and variables → Actions)

| Secret | Purpose |
|---|---|
| `SSH_HOST` | prod server hostname/IP |
| `SSH_USER` | deploy user |
| `SSH_KEY` | deploy user's **private** key (its public key in the server's `authorized_keys`) |
| `SSH_PORT` | optional, defaults to 22 |
| `DEPLOY_PATH` | absolute path to the repo checkout on the server (keeps the path out of the committed workflow) |

Plus one repo **variable** (Settings → Secrets and variables → Actions → Variables):

| Variable | Purpose |
|---|---|
| `DEPLOY_ENABLED` | Set to `true` to arm the `deploy` job. Until then the workflow lands and runs CI, but `deploy` stays dormant — so merging the workflow can't fire a deploy that would fail for missing secrets. |

**Activation order:** (1) add the 5 secrets, (2) set `DEPLOY_ENABLED=true`, (3)
next push to `main` deploys.

## Files changed / added

- **Add** `.github/workflows/deploy.yml`
- **Add** `.nvmrc` (`20`)

No `package.json` changes needed — all gate scripts already exist: root
`lint`, `format:check`, `test:unit`; app `typecheck`, `lint` (verified against
the current `package.json` files).

## Failure behavior

- Gate fails → red X on the commit/PR, **no deploy**, prod untouched.
- Deploy SSH step fails during build → prod still on previous build (reload never
  runs). Not fully atomic: a crash mid-`git pull` could leave source ahead of the
  running build; acceptable here and self-heals on the next green push.
- `pm2 reload` failure → surfaced as a red workflow; investigate on the box.

## Out of scope (YAGNI)

- Docker-based deploy (prod uses pm2, not containers).
- Building in CI + rsyncing artifacts (prod builds itself; simpler, and native
  deps rebuild against the server's node).
- DB migrations or running `sync_*` on deploy (workers self-schedule via
  `cron_restart`).
- Blue-green / canary / rollback automation (single-server pm2 reload is the
  agreed model; rollback = revert commit + push).

## Risks / notes

- **Deploy frequency.** Auto-deploy on every `main` push means every push (incl.
  automated ones) triggers a build+deploy. Concurrency queues them; if this proves
  noisy, revisit gating (e.g. path filters, or the "deploy on tag" variant).
- **First run needs the secrets set** or the `deploy` job fails at the SSH step.
- The deploy user needs `pm2` on its `PATH` (login shell) — verify during setup.
