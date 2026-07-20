# app/i18n/ — translations (13 locales)

vue-i18n / @nuxtjs/i18n. **Some modules are 100 KB+** — read narrowly (grep a key, or
`offset`/`limit`), never whole. Sizes are in `docs/repo-map.md`.

## How it fits together

- **Source** = `messages/*.ts`, one module per feature (`nav`, `endo`, `foundry`, …). Each
  exports `{ en: {...}, es: {...}, ... }` — **all 13 locales for that namespace in one file.**
- **Generated** = `locales/*.json`, built from the modules by `scripts/build-locales.mts`
  (runs automatically on `predev`/`prebuild`). Do **not** hand-edit `locales/*.json`.
- `i18n.config.ts` — runtime config. `translations.ts` — shared/legacy strings.
- Locales: `en es pt de fr ru ko ja zh-hans zh-hant pl it uk` (defined in `nuxt.config.ts` `LOCALES`).

## Rules

- **Add a key to every locale**, not just `en`. Fill the missing ones with
  `node scripts/tr-file.mjs` (Gemini-backed) — never spawn per-locale hand translation.
- **`i18n:check` is a BLOCKING CI gate.** vue-i18n must compile every message. A literal `@`
  (linked-message marker), an unescaped `{`, or `{{double-brace}}` crashes the page in the prod
  build (this exact bug blanked `/endo`). Escape specials: `@` → `{'@'}`.
- Game nouns follow the glossary in `messages/README` (e.g. platinum→platino/platina,
  relic→reliquia/relíquia). Item/set display names come from the API (`useLocalizedName`),
  not from these files — English `item_name` stays the canonical key.
- After editing, `cd app && npm run i18n:check` before you trust it.
