# scripts/ — repo tooling

Backend/build tooling. Not the `sync_*.ts` importers (those live at repo root and run via
`npm run sync_*`).

## What's here

- **`gen-repo-index.mjs`** — regenerates `docs/repo-map.md` (routes, endpoints, services, i18n
  sizes) from source. `npm run repo:index` writes it; `npm run repo:index:check` (CI gate) fails
  if it's stale. Run the writer after adding a route/endpoint/page/service/i18n module.
- **i18n tooling** — `tr-file.mjs` (fill missing locale keys via Gemini), `i18n-gaps.mjs`,
  `i18n-verify.mjs`, `dump-i18n-en.mjs`, `seo-i18n-gen.mjs`, `translate-*.mjs`. Frontend i18n
  build (`build-locales.mts`, `i18n-check.mts`) lives under `app/scripts/`, not here.
- **`enrich-tools.ts`** — enriches the community-tools directory (whois/github/screenshots).
- **`refresh-guides.mjs`** — regenerates the guides content data.
- **`check-guides.mjs`** — offline guide shape/source/date validation (`npm run guides:check`);
  reports the 90-day review queue without changing dates. Translation follow-up also detects
  missing sections, FAQs and changed link/source/video metadata even when review dates match;
  prose-only corrections still require an honest source review-date update. `npm run guides:test` checks
  refresh integrity (literal parsing, renderer inputs, video outages, grounding, honest dates).
- **`lib/`**, **`.i18n-en/`** — helpers + cached English dump.
- **`dev/`** — throwaway probes (`debug-ayatan.ts`, `test-*.ts`). **Not jest tests** (jest matches
  `*.test.ts`); manual `ts-node` runs. Safe to ignore unless reproducing a scrape/proxy issue.
  (Root `debug.ts` is a real shared module — the `DEBUG` flag — not a probe; leave it at root.)

## Conventions

- Node scripts are `.mjs` (ESM) or `.mts`/`.ts` run via `ts-node`/`tsx`. `app/` is
  `type: module`; the repo root is CommonJS — `.mjs` is safe in both.
- Gemini scripts need `GEMINI_API_KEY` / `@google/genai` (already a devDependency).
- `translate-guides.mjs` defaults to one worker and spaces API requests at least 13 seconds
  apart, including retries. `TRANSLATE_INTERVAL_MS` can increase that interval. A daily quota
  or access error stops unstarted jobs while preserving completed snapshots; a transient 503
  or explicit per-minute limit gets one paced retry. `guides:test` covers this request gate.
  Batches that overwhelmingly echo English prose are rejected before replacing a locale;
  this conservative check supplements, rather than replaces, a factual translation review.
