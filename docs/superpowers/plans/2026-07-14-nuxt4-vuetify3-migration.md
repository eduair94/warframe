# Nuxt 2 → Nuxt 4 + Vuetify 2 → Vuetify 3 Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Warframe Market Analytics frontend (`app/`) from Nuxt 2.15 / Vue 2.6 / Vuetify 2.6 to Nuxt 4 / Vue 3 / Vuetify 3, keeping every page functional and visually close, via a fresh scaffold ported side-by-side.

**Architecture:** Scaffold a clean Nuxt 4 project at sibling `app-next/` (nested `app/` srcDir, Vite/Nitro, SSR kept). Port config, theme, store, shell, then pages in risk-ordered batches. The old `app/` stays runnable the whole time for visual diffing; a final cutover phase swaps directories and updates Docker/pm2/root tooling.

**Tech Stack:** Nuxt 4, Vue 3, Vuetify 3 (`vuetify-nuxt-module`), Pinia (`@pinia/nuxt`), `$fetch`/`useFetch` (ofetch, no axios), `@nuxtjs/i18n` v9, `@nuxtjs/sitemap` v7, `nuxt-gtag`, `@vite-pwa/nuxt`, `@nuxtjs/leaflet`, dayjs, `@mdi/font`, TypeScript (built-in).

## Global Constraints

- **Fidelity:** Functional parity + close visual. Accept Vuetify 3 default spacing/style shifts; do not redesign or chase pixel-identical output. Keep the Orokin `.an-*` design system (`assets/analytics.css`) and shell markup intact.
- **SSR:** `ssr: true` — required for SEO (i18n alternate langs, sitemap, robots, per-page meta). Do not switch to SPA.
- **Src layout:** Nuxt 4 default nested `app/` srcDir. Source paths are `app-next/app/pages`, `app-next/app/components`, `app-next/app/layouts`, `app-next/app/stores`, `app-next/app/app.vue`; config `app-next/nuxt.config.ts`; static → `app-next/public`.
- **Locales:** en (default), es, pt. Strategy `prefix_except_default`. `en` is `defaultLocale`. Keep `translations.ts` content verbatim (it carries stale currency-exchange keys — parity over cleanup).
- **API base:** `useRuntimeConfig().public.apiURL`, from `API_URL` env, default `http://localhost:3529`. All data via `$fetch`.
- **Store getter renames:** Vuex `all_items`/`all_relics`/`all_sets` → Pinia `allItems`/`allRelics`/`allSets`; `locations`/`fortex` keep names.
- **Icons:** keep the mdi **font** (`@mdi/font`); no per-icon SVG conversion.
- **Do not touch** the repo-root Express/Mongo backend. No feature changes. No unrelated refactors.
- **Node:** drop `--openssl-legacy-provider` everywhere (Vite doesn't need it).

## Verification model (every task)

Migrations are verified behaviorally, not by new unit tests. Each task ends with:
1. `cd app-next && npx nuxi typecheck` — clean for the touched file(s).
2. Backend up: repo-root `npm run dev` (ts-node-dev `server.ts` → `:3529`). Frontend: `cd app-next && npm run dev`.
3. Load the affected route (or a page exercising the component) via Playwright / chrome-devtools MCP: assert renders, **zero console errors**, data loads.
4. Screenshot-diff against the same route in the old `app/` (running on its own port) — must be visually close.
5. Commit.

## Phase map

| Phase | Scope | Depends on |
| --- | --- | --- |
| **P0** | Scaffold `app-next` (Nuxt 4 + Vuetify 3 + Pinia + TS), boots blank | — |
| **P1** | Config: runtime/head, module audit + sitemap/robots/gtag/fonts/sentry, i18n v9, PWA | P0 |
| **P2** | Vuetify 3 theme + assets (analytics.css, mdi, img) | P0, P1 |
| **P3** | Vuex → Pinia items store (+ resolve fill path) | P0 |
| **P4** | App shell: `app.vue`, layouts, shell components (LanguageMenu, GitHub*, Tutorial, LoadingBar) | P1–P3 |
| **P5** | Static pages (index, vaulted, endo, ducats) + shared components | P4 |
| **P6** | Table-heavy pages (movers, volatility, screener, timing, vault-spikes, relics-value, riven-value, comparison, relic-farming) | P4 |
| **P7** | Dynamic routes (`relic/[relic]`, `set/[set]`) | P4 |
| **P8** | Map page (star-chart + LocationPopup, leaflet) | P4 |
| **P9** | Stateful pages (portfolio, flip) | P4 |
| **PZ** | Cutover: swap dirs, fix Dockerfile/pm2/root scripts, drop dead deps, full-build smoke | all |

---

## Cross-cutting execution notes (authoritative — resolves conflicts between task bodies)

The per-file tasks below were drafted in parallel; where a task body disagrees with a rule here, **this section wins.**

1. **Global items catalog fetch — implement exactly ONCE, in `app-next/app/app.vue`.** The old app filled the Vuex store from a `middleware()` in `layouts/default.vue` (`$axios.get($config.apiURL)` → `dispatch('setItems')`). Reproduce it in `app.vue` with `const base = useRuntimeConfig().public.apiURL; const { data } = await useAsyncData('app-items', () => $fetch(base)); if (data.value) useItemsStore().setItems(data.value)`. Use the key **`app-items`** everywhere. Ignore any task text (e.g. the P3 store task's Step 4) implying a separate default-layout fetch or the key `items-catalog` — the default layout does **not** refetch the catalog. Without this, every `allItems`/`allRelics`/`allSets` consumer renders empty.

2. **Store consumers = 10 pages, not 6.** Every page that read Vuex `mapGetters('all_items'|'all_relics'|'all_sets')` must swap to `const items = useItemsStore(); const allItems = computed(() => items.allItems)` in its own task: **ducats, endo, flip, index, portfolio, relic/[relic] (all_relics), set/[set] (all_sets), screener, vaulted, star-chart.** The P3 store task's "6 in-scope pages" line is superseded by this list. `locations`/`fortex` are dead (state-only, no getter, nothing fills or reads them) — keep for parity, don't wire anything.

3. **Dead dependencies — confirmed inactive, DROP (do not port or replace):** `@nuxtjs/robots`, `@netsells/nuxt-hotjar`, `@nuxtjs/google-analytics`, `vue-tawk`, `@nuxtjs/sentry` (+`@sentry/vue`, `@sentry/tracing`). None are registered in the old `nuxt.config` or referenced in code. The `window.Tawk_API`/`hideWidgets()` guards in index/endo/relic/set pages are permanent no-ops (Tawk was never initialized) — leave as harmless no-ops or strip in each page's task; do not re-add Tawk.

4. **SEO site origin:** the frontend public origin is `https://warframe.digitalshopuy.com`. Use it for `@nuxtjs/sitemap` v7 `site: { url }` and the i18n `baseUrl` (hreflang). The API base is separate (`API_URL`, default `http://localhost:3529`).

5. **`nuxi init` app.vue placement:** the scaffold may drop a starter `app-next/app.vue`; the real root belongs at the nested `app-next/app/app.vue`. Remove any duplicate at the wrong level.

<!-- TASK BLOCKS SPLICED BELOW FROM AUDIT WORKFLOW -->

## Phase P0 — Scaffold


---

### Task P0.1: Scaffold Nuxt 4 project (app-next)

**Files:**
- Create: `app-next/` (via `nuxi init`), then overwrite `app-next/package.json`, `app-next/nuxt.config.ts`, `app-next/app/app.vue`, `app-next/tsconfig.json`
- Delete/superseded (reference only; old app stays until cutover): `app/package.json`, `app/nuxt.config.js`, `app/vue-shim.d.ts` (obsolete Vue-2 `*.vue` shim — do NOT recreate), `app/plugins/vue-plugins.ts` (EMPTY dead client plugin — do NOT recreate)

**Depends on:** nothing — this is the first migration unit. Everything else depends on P0.1.

**Steps:**

- [ ] Step 1: Scaffold the Nuxt 4 skeleton from the repo root (`c:/Users/airau/Desktop/My Proyects/warframe`). This creates `app-next/` with the Nuxt 4 nested `app/` srcDir (`app-next/app/app.vue`) and a git-ignored `.nuxt`.
  ```bash
  cd "c:/Users/airau/Desktop/My Proyects/warframe"
  npx nuxi@latest init app-next --packageManager npm --no-install --gitInit=false
  ```
  If the CLI prompts for a template/package-manager despite the flags, accept the default (`v4`/official) template and `npm`.

- [ ] Step 2: Replace the generated `app-next/package.json` with the full target dependency set. **BEFORE** (the OLD `app/package.json`, Nuxt-2 deps + openssl scripts):
  ```json
  {
    "scripts": {
      "dev": "cross-env NODE_OPTIONS=--openssl-legacy-provider nuxt",
      "build": "cross-env NODE_OPTIONS=--openssl-legacy-provider nuxt build --modern=server",
      "start": "cross-env NODE_OPTIONS=--openssl-legacy-provider nuxt start",
      "generate": "cross-env NODE_OPTIONS=--openssl-legacy-provider nuxt generate"
    },
    "dependencies": {
      "@nuxtjs/axios": "^5.13.6",
      "@nuxtjs/google-analytics": "^2.4.0",
      "@nuxtjs/google-gtag": "^1.0.4",
      "@nuxtjs/i18n": "^7.3.0",
      "@nuxtjs/sitemap": "^2.4.0",
      "core-js": "^3.19.3",
      "moment": "^2.29.4",
      "nuxt": "^2.15.8",
      "nuxt-leaflet": "^0.0.27",
      "vue": "^2.6.14",
      "vue-server-renderer": "^2.6.14",
      "vue-template-compiler": "^2.6.14",
      "vuetify": "^2.6.1",
      "webpack": "^4.46.0"
    },
    "devDependencies": {
      "@nuxt/typescript-build": "^2.1.0",
      "@nuxt/typescript-runtime": "^2.1.0",
      "@nuxtjs/pwa": "^3.3.5",
      "@nuxtjs/vuetify": "^1.12.3",
      "cross-env": "^7.0.3",
      "ts-loader": "^8.2.0",
      "typescript": "^4.8.4"
    }
  }
  ```
  **AFTER** (new `app-next/package.json` — openssl flag removed, axios/typescript-build+runtime/core-js/webpack/vue-template-compiler/vue-server-renderer/moment/ts-loader/cross-env dropped; vuetify-nuxt-module + @pinia/nuxt + i18n@9 + sitemap@7 + nuxt-gtag + PWA + leaflet + mdi/font + dayjs added):
  ```json
  {
    "name": "app-next",
    "version": "1.0.0",
    "private": true,
    "type": "module",
    "scripts": {
      "dev": "nuxt dev",
      "build": "nuxt build",
      "generate": "nuxt generate",
      "preview": "nuxt preview",
      "start": "node .output/server/index.mjs",
      "postinstall": "nuxt prepare",
      "typecheck": "nuxi typecheck",
      "lint": "eslint .",
      "lint:prettier": "prettier --check ."
    },
    "dependencies": {
      "@mdi/font": "^7.4.47",
      "@nuxtjs/i18n": "^9.5.0",
      "@nuxtjs/leaflet": "^1.2.6",
      "@nuxtjs/sitemap": "^7.4.0",
      "@pinia/nuxt": "^0.11.0",
      "@vite-pwa/nuxt": "^1.0.0",
      "autolinker": "^4.0.0",
      "dayjs": "^1.11.13",
      "driver.js": "^1.7.0",
      "nuxt": "^4.0.0",
      "nuxt-gtag": "^3.0.2",
      "pinia": "^3.0.0",
      "vue": "^3.5.0",
      "vue-router": "^4.5.0",
      "vuetify": "^3.7.0",
      "vuetify-nuxt-module": "^0.18.0"
    },
    "devDependencies": {
      "@nuxtjs/google-fonts": "^3.2.0",
      "eslint": "^9.0.0",
      "prettier": "^3.3.0",
      "typescript": "^5.6.0",
      "vue-tsc": "^2.1.0"
    }
  }
  ```
  Note: `@nuxtjs/google-fonts` v3 is the Nuxt-3+ line (old app pinned v2). Version ranges are floors — `npm install` will resolve the latest compatible patch/minor.

- [ ] Step 3: Delete the generated starter `app-next/app.vue` if `nuxi` placed one at the wrong level, and write the blank-boot root at the Nuxt-4 path `app-next/app/app.vue`. This is a placeholder so the scaffold boots with zero module wiring; layouts/pages/vuetify get added in later phases.
  ```vue
  <template>
    <div style="padding: 2rem; font-family: sans-serif">
      <h1>app-next scaffold OK</h1>
      <p>Nuxt {{ 4 }} boots. API base: {{ apiURL }}</p>
    </div>
  </template>

  <script setup lang="ts">
  const config = useRuntimeConfig()
  const apiURL = config.public.apiURL
  </script>
  ```

- [ ] Step 4: Replace `app-next/nuxt.config.ts` with a minimal config that boots blank while preserving the old app's runtime-config and dev-server intent. **BEFORE** (relevant slice of OLD `app/nuxt.config.js`):
  ```js
  publicRuntimeConfig: {
    apiURL: process.env.API_URL || 'http://localhost:3529'
  },
  server: {
    port: process.env.FRONTEND_PORT || 3312,
    host: '0.0.0.0'
  },
  ```
  **AFTER** (`app-next/nuxt.config.ts` — `publicRuntimeConfig` → `runtimeConfig.public`; `server` → `devServer`; NO modules yet so it boots clean):
  ```ts
  // https://nuxt.com/docs/api/configuration/nuxt-config
  export default defineNuxtConfig({
    compatibilityDate: '2026-07-01',
    ssr: true,
    devtools: { enabled: true },

    // publicRuntimeConfig.apiURL (Nuxt 2) -> runtimeConfig.public.apiURL (Nuxt 4).
    // Consumers use: const base = useRuntimeConfig().public.apiURL
    runtimeConfig: {
      public: {
        apiURL: process.env.API_URL || 'http://localhost:3529'
      }
    },

    // Old server.port/host -> devServer (Vite). Prod port is set at `node .output` runtime.
    devServer: {
      port: Number(process.env.FRONTEND_PORT) || 3312,
      host: '0.0.0.0'
    },

    // Modules added in later phases: vuetify-nuxt-module, @pinia/nuxt,
    // @nuxtjs/i18n, @nuxtjs/sitemap, nuxt-gtag, @nuxtjs/google-fonts,
    // @vite-pwa/nuxt, @nuxtjs/leaflet.
    modules: []
  })
  ```

- [ ] Step 5: Ensure `app-next/tsconfig.json` is the Nuxt-4 thin extend (nuxi usually writes this — create/confirm it matches). Do NOT port `app/vue-shim.d.ts` (the Vue-2 `declare module '*.vue'` shim is obsolete — Volar/vue-tsc handle SFC types).
  ```json
  {
    "extends": "./.nuxt/tsconfig.json"
  }
  ```

- [ ] Step 6: Install dependencies from `app-next/`.
  ```bash
  cd "c:/Users/airau/Desktop/My Proyects/warframe/app-next"
  npm install
  ```
  Expect a clean resolve (no peer-dep ERESOLVE). If any dev tool 404s on the pinned floor, drop the caret pin to the latest published and re-run — do not add `--legacy-peer-deps`.

- [ ] Step 7: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors (blank app.vue + empty modules array; `useRuntimeConfig` is auto-imported and typed).

- [ ] Step 8: Verify in browser: `cd app-next && npm run dev`, open `http://localhost:3312/` — expect the "app-next scaffold OK" page renders with `API base: http://localhost:3529`, zero console errors, and the terminal shows Nuxt 4 + Vite (no `--openssl-legacy-provider`, no webpack). The backend does NOT need to be up for this step (no fetch yet).

- [ ] Step 9: Commit: `git add app-next && git commit -m "chore(app-next): scaffold Nuxt 4 project with target dependency set"`

---


## Phase P1 — Config & modules (runtime, i18n, SEO/gtag/sitemap/robots/sentry, PWA)


---

### Task P1.1: Runtime config + global head in nuxt.config.ts

**Files:**
- Create/Edit: app-next/nuxt.config.ts (add `runtimeConfig` + `app.head`)
- Delete/superseded: app/nuxt.config.js `publicRuntimeConfig` / `privateRuntimeConfig` / `head` blocks (reference only; old app stays until cutover)

**Depends on:** P0 scaffold (app-next/ with nuxt.config.ts + Nuxt 4 nested srcDir already generated)

**Steps:**

- [ ] Step 1: Port runtime config. Nuxt 4 has a single `runtimeConfig` (server-private) with a `public` sub-object (client-exposed). The old config duplicated the same value into public + private; only `apiURL` is read on the client (`this.$config.apiURL`), so put it under `public` and keep the key name `apiURL` to match the shared convention `config.public.apiURL`.

  BEFORE (app/nuxt.config.js:11-17):
  ```js
  // Runtime config
  publicRuntimeConfig: {
    apiURL: process.env.API_URL || 'http://localhost:3529'
  },

  privateRuntimeConfig: {
    apiURL: process.env.API_URL || 'http://localhost:3529'
  },
  ```

  AFTER (add to the `defineNuxtConfig({ ... })` object in app-next/nuxt.config.ts):
  ```ts
  runtimeConfig: {
    public: {
      // Read anywhere via: const config = useRuntimeConfig(); const base = config.public.apiURL
      apiURL: process.env.API_URL || 'http://localhost:3529',
    },
  },
  ```

- [ ] Step 2: Port the global `head` defaults into `app.head`. In Nuxt 4 global head lives under `app.head`. Carry over `titleTemplate`, `title`, `htmlAttrs.lang`, and the full `meta[]` array verbatim. Drop `addSeoAttributes` (an i18n option, not a head field — handled by the i18n module task) and the root-level `description` (not a valid unhead field; there is no matching meta tag). Keep `link`/`script` out since both were empty.

  BEFORE (app/nuxt.config.js:21-56):
  ```js
  head: {
    addSeoAttributes: true,
    htmlAttrs: {
      lang: 'es-ES'
    },
    titleTemplate: '%s - Warframe',
    title: 'Warframe Market Analytics',
    description:
      'Warframe Market Analytics',
    meta: [
      { charset: 'utf-8' },
      {
        name: 'twitter:title',
        content: 'Warframe Market Analytics'
      },
      {
        name: 'twitter:description',
        content:
          'Warframe Market Analytics'
      },
      {
        name: 'referrer',
        content: 'no-referrer'
      },
      {
        name: 'theme-color',
        content: '#3B9B85'
      }
    ],
    link: [

    ],
    script: [

    ]
  },
  ```

  AFTER (add to the `defineNuxtConfig({ ... })` object in app-next/nuxt.config.ts):
  ```ts
  app: {
    head: {
      titleTemplate: '%s - Warframe',
      title: 'Warframe Market Analytics',
      htmlAttrs: {
        lang: 'es-ES',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'twitter:title', content: 'Warframe Market Analytics' },
        { name: 'twitter:description', content: 'Warframe Market Analytics' },
        { name: 'referrer', content: 'no-referrer' },
        { name: 'theme-color', content: '#3B9B85' },
      ],
    },
  },
  ```
  Note: `viewport` + `charset` defaults are auto-injected by Nuxt; the explicit `{ charset: 'utf-8' }` above is harmless and preserved for parity.

- [ ] Step 3: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors introduced by these two config blocks.

- [ ] Step 4: Verify in browser: start backend from repo root (`npm run dev` on :3529) + `cd app-next && npm run dev`; load `/`. In devtools console run `useRuntimeConfig?.()` is N/A client-side, so instead confirm: the document `<title>` renders as `... - Warframe` (titleTemplate applied), `<html lang="es-ES">`, and `<meta name="theme-color" content="#3B9B85">` are present in the DOM `<head>`; zero console errors. Compare `<head>` against old app same route (close).

- [ ] Step 5: Commit: `git add app-next/nuxt.config.ts && git commit -m "feat(config): port runtimeConfig.public.apiURL + global app.head to Nuxt 4"`

---

### Task P1.2: Carry over framework-agnostic services verbatim

**Files:**
- Create: app-next/app/services/portfolio.ts
- Create: app-next/app/services/not_found.ts
- Delete/superseded: app/services/portfolio.ts, app/services/not_found.ts (reference only; old app stays until cutover)

**Depends on:** P0 scaffold (app-next/app/ nested srcDir exists)

**Note:** Both files are pure TypeScript with NO Vue/Nuxt/Vuetify imports — they use ZERO breaking patterns and are copied byte-for-byte. `portfolio.ts` (186 lines: localStorage watchlist + price-alert helpers) and `not_found.ts` (2 lines: a hard-coded url_name exclusion list). Relative import specifiers in the eventual consumers (`app/pages/portfolio.vue` → `../services/portfolio`; `app/components/SearchExchange.vue` → `../services/not_found`) stay valid once those files land under `app-next/app/`.

**Steps:**

- [ ] Step 1: Copy `not_found.ts` verbatim to `app-next/app/services/not_found.ts`. Full contents (unchanged):
  ```ts
  const notFound = ['cambio_rynder', 'cambio_openn', 'cambilex']
  export { notFound }
  ```

- [ ] Step 2: Copy `portfolio.ts` verbatim to `app-next/app/services/portfolio.ts`. Do NOT alter any code — the SSR guard `isBrowser()` (checks `typeof window`) already makes it SSR-safe under Nuxt 4. Command (from repo root): `cp "app/services/portfolio.ts" "app-next/app/services/portfolio.ts"`.

- [ ] Step 3: Fix ONLY the stale Vuex comments (comments-only edit; no behavior change). In `app-next/app/services/portfolio.ts` the header docblock and the line-8 inline comment reference the old "Vuex store". Update the two mentions to "Pinia store" for accuracy:

  BEFORE (portfolio.ts:7-9):
  ```ts
   * alert thresholds are checked against live prices already in the Vuex
   * store (no server push/polling infrastructure needed).
   */
  ```
  AFTER:
  ```ts
   * alert thresholds are checked against live prices already in the Pinia
   * store (no server push/polling infrastructure needed).
   */
  ```

- [ ] Step 4: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for either service file (they are self-contained; `Notification`/`window`/`localStorage` are DOM lib types available under the default `tsconfig`).

- [ ] Step 5: Verify (deferred to consumer pages): these modules have no route of their own. Confirm import resolution only — from `app-next/`, run `npx tsc --noEmit app/services/portfolio.ts app/services/not_found.ts` OR rely on Step 4 typecheck passing. Full behavioral verification (watchlist toggle, alerts) happens in the P-portfolio page task that imports them.

- [ ] Step 6: Commit: `git add app-next/app/services/portfolio.ts app-next/app/services/not_found.ts && git commit -m "chore(services): carry over portfolio + not_found services to app-next (Vuex comment→Pinia)"`

---

### Task P1.3: i18n v9 (@nuxtjs/i18n) + translations port


**Files:**
- Create: `app-next/i18n/i18n.config.ts`, `app-next/i18n/translations.ts`
- Modify: `app-next/nuxt.config.ts` (register `@nuxtjs/i18n`, add `i18n` block)
- Delete/superseded (reference only): `app/nuxt.config.js` `i18n`/`modules` blocks, `app/translations.ts`

**Depends on:** P0 scaffold (nuxt.config.ts exists), P1 runtime-config task (nuxt.config.ts modules array exists)

**Context:** `@nuxtjs/i18n` v9 is the Nuxt 3/4 line. Breaking vs the old v7 config: locale objects use `language` (not `iso`); the module resolves config/locale files under `<rootDir>/i18n/` by default (rootDir = `app-next`, i.e. beside `nuxt.config.ts`, NOT under the nested `app/` srcDir); composables `useI18n`, `useSwitchLocalePath`, `useLocalePath`, `useLocaleHead` are auto-imported. Messages stay inline via `defineI18nConfig` to keep parity with the current single-file `translations` object.

**Steps:**

- [ ] Step 1: Copy the translations verbatim. Copy `app/translations.ts` → `app-next/i18n/translations.ts` unchanged (it exports `default` a `{ en, es, pt }` object; it carries stale currency-exchange keys — keep them, parity over cleanup).
  ```bash
  cp "app/translations.ts" "app-next/i18n/translations.ts"
  ```

- [ ] Step 2: Create `app-next/i18n/i18n.config.ts`. **BEFORE** (old inline config in `app/nuxt.config.js`):
  ```js
  vueI18n: {
    fallbackLocale: 'es',
    messages: translations
  }
  ```
  **AFTER** (`app-next/i18n/i18n.config.ts`):
  ```ts
  import translations from './translations'

  export default defineI18nConfig(() => ({
    legacy: false,
    fallbackLocale: 'es',
    messages: translations,
  }))
  ```

- [ ] Step 3: Register the module + i18n block in `app-next/nuxt.config.ts`. **BEFORE** (old `app/nuxt.config.js`):
  ```js
  modules: ['nuxt-leaflet', '@nuxtjs/i18n', '@nuxtjs/sitemap', '@nuxtjs/axios'],
  i18n: {
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', iso: 'en-US', name: 'English' },
      { code: 'es', iso: 'es-ES', name: 'Español' },
      { code: 'pt', iso: 'pt-BR', name: 'Português' }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true, cookieKey: 'i18n_redirected', redirectOn: 'root'
    },
    vueI18n: { fallbackLocale: 'es', messages: translations }
  }
  ```
  **AFTER** (in `app-next/nuxt.config.ts` — add `'@nuxtjs/i18n'` to `modules`, then):
  ```ts
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'es', language: 'es-ES', name: 'Español' },
      { code: 'pt', language: 'pt-BR', name: 'Português' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    // baseUrl powers correct hreflang alternate links in SSR head
    baseUrl: process.env.SITE_URL || 'http://localhost:3312',
    vueI18n: './i18n.config.ts',
  },
  ```
  Note: `vueI18n` path is resolved relative to the `i18n/` restructure dir; if the installed v9 patch resolves differently, point it at `./i18n/i18n.config.ts`. Verify the exact dir with the installed module's docs (`node_modules/@nuxtjs/i18n`).

- [ ] Step 4: Confirm the Vuetify UI-string locale (pt/es) is wired in the Vuetify module config (done in the P2 theme task via `vuetify-nuxt-module`'s `locale` option). The old app set `$vuetify.lang.current` on language switch — that behavior is re-created in the `LanguageMenu.vue` task (P4), not here.

- [ ] Step 5: Typecheck: `cd app-next && npx nuxi typecheck` — expect no i18n type errors.

- [ ] Step 6: Verify in browser: `cd app-next && npm run dev`. Load `/` (English, no prefix), `/es`, `/pt`. Expect the routes resolve, `$t`/`t()` keys used in the shell footer render translated, and no console errors. (Full shell renders after P4; here a temporary `{{ $t('madeWith') }}` in `app.vue` is enough to prove messages load — remove it after.)

- [ ] Step 7: Commit:
  ```bash
  git add app-next/i18n app-next/nuxt.config.ts
  git commit -m "feat(i18n): port @nuxtjs/i18n to v9 with inline translations"
  ```

---

#### Audit summary (grep across `app/` excluding node_modules)

| Dep (app/package.json) | Wired? | Decision |
|---|---|---|
| `@nuxtjs/robots` ^2.5.0 | No (not in modules, no config, no robots.txt) | **DROP** |
| `@netsells/nuxt-hotjar` ^0.1.3 | No (zero refs) | **DROP** |
| `@nuxtjs/google-analytics` ^2.4.0 | No (deprecated; gtag used instead) | **DROP** |
| `vue-tawk` ^1.0.1 | No (empty vue-plugins.ts; only no-op `window.Tawk_API` guards) | **DROP** |
| `@nuxtjs/sentry` ^7.0.2 (+@sentry/tracing,@sentry/vue) | No (config block orphaned; module not in modules/buildModules; no SENTRY_DSN) | **DROP** (no `@sentry/nuxt`) |
| `@nuxtjs/google-gtag` ^1.0.4 | Yes (2 ids) | **PORT → `nuxt-gtag`** |
| `@nuxtjs/google-fonts` ^2 | Yes (Open Sans 400/600/700) | **PORT → v3** |
| `@nuxtjs/sitemap` ^2 | Yes (no config) | **PORT → v7 (+ `site.url`)** |

---

### Task P1.4: Prune dead deps + add SEO/analytics deps in app-next/package.json
**Files:**
- Edit: app-next/package.json
- Delete/superseded (reference only; old app stays): app/package.json entries for `@nuxtjs/robots`, `@netsells/nuxt-hotjar`, `@nuxtjs/google-analytics`, `@nuxtjs/google-gtag`, `vue-tawk`, `@nuxtjs/sentry`, `@sentry/tracing`, `@sentry/vue`
**Depends on:** P0/P1 app-next scaffold task (creates app-next/package.json)
**Steps:**
- [ ] Step 1: Do NOT copy the following dead deps from `app/package.json` into `app-next/package.json` (BEFORE — the old deps block, verified present):
```jsonc
// app/package.json (current)
"@netsells/nuxt-hotjar": "^0.1.3",
"@nuxtjs/google-analytics": "^2.4.0",
"@nuxtjs/google-gtag": "^1.0.4",
"@nuxtjs/robots": "^2.5.0",
"@nuxtjs/sentry": "^7.0.2",
"@sentry/tracing": "^7.30.0",
"@sentry/vue": "^7.32.0",
"vue-tawk": "^1.0.1",
```
- [ ] Step 2: Add the ported SEO/analytics deps to `app-next/package.json` `devDependencies` (AFTER — Nuxt 4 module versions):
```jsonc
// app-next/package.json  (add under devDependencies)
"@nuxtjs/sitemap": "^7.0.0",
"@nuxtjs/google-fonts": "^3.2.0",
"nuxt-gtag": "^3.0.2"
```
(No robots, hotjar, google-analytics, tawk, or sentry packages are added.)
- [ ] Step 3: Install: `cd app-next && npm install` — expect a clean lockfile with the three modules resolved and none of the dropped packages present (`npm ls @nuxtjs/robots @sentry/vue vue-tawk` → "not found").
- [ ] Step 4: Commit: `git add app-next/package.json app-next/package-lock.json && git commit -m "chore(app-next): add sitemap/gtag/google-fonts modules, drop dead robots/hotjar/GA/tawk/sentry deps"`

---

### Task P1.5: Wire sitemap v7 + nuxt-gtag + google-fonts v3 in app-next/nuxt.config.ts; drop Sentry
**Files:**
- Edit: app-next/nuxt.config.ts
- Delete/superseded (reference only): app/nuxt.config.js lines 79–100 (google-gtag/google-fonts buildModules + googleFonts), line 106 (`@nuxtjs/sitemap`), lines 110–124 (orphaned `sentry:` block)
**Depends on:** P1.1; app-next/nuxt.config.ts scaffold task
**Steps:**
- [ ] Step 1: Port google-gtag → nuxt-gtag, consolidating BOTH ids. BEFORE (app/nuxt.config.js, in `buildModules`):
```js
[
  '@nuxtjs/google-gtag',
  {
    id: 'G-F97PNVRMRF',
    additionalAccounts: [
      {
        id: 'AW-972399920',
        config: {
          send_page_view: true // optional configurations
        }
      }
    ]
  }
],
```
AFTER (app-next/nuxt.config.ts — add `nuxt-gtag` to `modules`, add top-level `gtag` block):
```ts
modules: [
  '@nuxtjs/sitemap',
  'nuxt-gtag',
  '@nuxtjs/google-fonts',
  // ...existing app-next modules (vuetify-nuxt-module, @pinia/nuxt, @nuxtjs/i18n, nuxt-leaflet)
],

gtag: {
  tags: [
    { id: 'G-F97PNVRMRF' },
    { id: 'AW-972399920', config: { send_page_view: true } },
  ],
},
```
- [ ] Step 2: Port google-fonts verbatim (v3 keeps the `googleFonts.families` shape). BEFORE (app/nuxt.config.js):
```js
googleFonts: {
  families: {
    'Open Sans': [400, 600, 700]
  }
},
```
AFTER (app-next/nuxt.config.ts — unchanged shape):
```ts
googleFonts: {
  families: {
    'Open Sans': [400, 600, 700],
  },
},
```
- [ ] Step 3: Give sitemap v7 its required site URL. BEFORE (app/nuxt.config.js — bare module string, no config):
```js
modules: [
  'nuxt-leaflet',
  '@nuxtjs/i18n',
  '@nuxtjs/sitemap',
  '@nuxtjs/axios',
],
```
AFTER (app-next/nuxt.config.ts — `@nuxtjs/sitemap` already added in Step 1; add the `site.url` v7 needs, using the frontend public origin):
```ts
site: {
  url: process.env.SITE_URL || 'https://warframe.digitalshopuy.com',
},
```
(No `sitemap: {}` overrides — v7 auto-discovers routes like the old default. `@nuxtjs/axios` is dropped in the HTTP-migration task, not here.)
- [ ] Step 4: DROP Sentry. Confirm the orphaned block below from app/nuxt.config.js is NOT carried into app-next/nuxt.config.ts (BEFORE — dead config, module was never registered):
```js
sentry: {
  dsn: process.env.SENTRY_DSN,
  config: {
    tracesSampleRate: 1.0,
    browserTracing: {},
    vueOptions: { trackComponents: true }
  }
},
```
AFTER: no `sentry` key and no `@sentry/nuxt` module in app-next/nuxt.config.ts. Leave a one-line comment marker for future error tracking:
```ts
// (Sentry intentionally omitted — the Nuxt 2 config block was orphaned/inactive.
//  Add @sentry/nuxt here later if error tracking is wanted.)
```
- [ ] Step 5: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors related to nuxt.config.ts / module option types.
- [ ] Step 6: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. (a) Load `/` — DevTools Network shows the gtag script `googletagmanager.com/gtag/js?id=G-F97PNVRMRF` loaded once and a config call for `AW-972399920`; Open Sans 400/600/700 faces load (Network → font requests / computed `font-family`); zero console errors. (b) Load `/sitemap.xml` — returns valid XML with absolute `https://warframe.digitalshopuy.com/...` locs. (c) Confirm NO requests to hotjar/tawk/sentry. Screenshot-diff `/` vs old app (close).
- [ ] Step 7: Commit: `git add app-next/nuxt.config.ts && git commit -m "feat(app-next): sitemap v7 + nuxt-gtag (2 ids) + google-fonts v3; drop inactive sentry"`

---

### Task P1.6: PWA via @vite-pwa/nuxt

**Files:**
- Create/Edit: `app-next/nuxt.config.ts` (add `@vite-pwa/nuxt` module + `pwa{}` block)
- Edit: `app-next/package.json` (add `@vite-pwa/nuxt` devDep; do NOT carry `@nuxtjs/pwa`)
- Create (copy binaries): `app-next/public/android-chrome-192x192.png`, `app-next/public/android-chrome-384x384.png`, `app-next/public/apple-touch-icon.png`, `app-next/public/favicon.ico`, `app-next/public/favicon-32x32.png`, `app-next/public/favicon-16x16.png`, `app-next/public/maskable-icon-512x512.png`
- Delete/superseded (reference only; old app stays until cutover): `app/static/arc-sw.js` (dead arc.io SW), `app/static/sw.js` (NekR self-destroy stub), `app/static/site.webmanifest` (empty/stale), `@nuxtjs/pwa` buildModule in `app/nuxt.config.js:74`, whole `pwa{}` + `workbox{}` block `app/nuxt.config.js:174-204`

**Depends on:** P1 base `app-next/nuxt.config.ts` (runtimeConfig.public.apiURL + modules array) must exist first.

**Steps:**

- [ ] Step 1: Add the module + devDependency. `@nuxtjs/pwa` is Nuxt-2-only — it is NOT ported. In `app-next/package.json` add to `devDependencies`:
```jsonc
"@vite-pwa/nuxt": "^0.10.6"
```
Then register the module in `app-next/nuxt.config.ts` `modules` array (add alongside the other P1 modules):
```ts
modules: [
  '@vite-pwa/nuxt',
  // ...vuetify-nuxt-module, @pinia/nuxt, @nuxtjs/i18n, etc.
],
```

- [ ] Step 2: Port the manifest + workbox runtimeCaching. BEFORE — the old buildModule config, `app/nuxt.config.js:174-204`:
```js
pwa: {
  icon: {
    purpose: 'maskable'
  },
  manifest: {
    theme_color: '#272727',
    name: 'Warframe Market Analytics App',
    short_name: 'Warframe Analytics',
    lang: 'en',
    categories: ['games', 'utilities', 'shopping'],
    description:
      'Warframe Market Analytics'
  },
  workbox: {
    workboxURL:
      'https://cdn.jsdelivr.net/npm/workbox-cdn/workbox/workbox-sw.js',
    importScripts: [],
    autoRegister: true,
    runtimeCaching: [
      {
        urlPattern: new RegExp(`^${(process.env.API_URL || 'http://localhost:3529').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`),
        handler: 'NetworkFirst',
        method: 'GET',
        strategyOptions: { cacheableResponse: { statuses: [0, 200] } }
      }
    ]
  }
},
```
AFTER — add this top-level `pwa` key to `app-next/nuxt.config.ts` (vite-pwa schema: `registerType` replaces `autoRegister`, workbox is bundled so `workboxURL` is dropped, and runtimeCaching uses `options` not `strategyOptions`; explicit `manifest.icons` because vite-pwa does NOT auto-generate the icon set):
```ts
// PWA — @vite-pwa/nuxt (replaces @nuxtjs/pwa). Manifest ported verbatim from
// the old pwa{} block; API responses cached NetworkFirst so last-loaded data
// survives offline / flaky connections. The dead arc.io service worker
// (static/arc-sw.js) and the NekR self-destroy stub (static/sw.js) are NOT
// ported — vite-pwa generates and registers its own sw.js.
pwa: {
  registerType: 'autoUpdate',
  manifest: {
    name: 'Warframe Market Analytics App',
    short_name: 'Warframe Analytics',
    description: 'Warframe Market Analytics',
    lang: 'en',
    theme_color: '#272727',
    background_color: '#272727',
    categories: ['games', 'utilities', 'shopping'],
    display: 'standalone',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/android-chrome-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    navigateFallback: null,
    globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
    runtimeCaching: [
      {
        // Cache the API origin (build-time env, same as the old config).
        urlPattern: new RegExp(
          `^${(process.env.API_URL || 'http://localhost:3529').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`
        ),
        handler: 'NetworkFirst',
        method: 'GET',
        options: {
          cacheName: 'warframe-api',
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
  client: {
    installPrompt: false,
  },
},
```

- [ ] Step 3: Provide icon files. `@vite-pwa/nuxt` requires physical icon files in `public/` (it does NOT regenerate them from a master like `@nuxtjs/pwa` did). Copy the existing PNGs and author the maskable icon:
```bash
# from repo root
mkdir -p app-next/public
cp "app/static/android-chrome-192x192.png" app-next/public/
cp "app/static/android-chrome-384x384.png" app-next/public/
cp "app/static/apple-touch-icon.png"       app-next/public/
cp "app/static/favicon.ico"                app-next/public/
cp "app/static/favicon-32x32.png"          app-next/public/
cp "app/static/favicon-16x16.png"          app-next/public/
```
Icon requirements to satisfy the manifest above:
  - `maskable-icon-512x512.png` — 512x512 PNG, the logo centered inside the maskable **safe zone** (~40% radius / keep art within the central 80%, transparent or #272727 padding). Author it from the 500x500 master `app/static/icon.png`. Fastest path: `npx @vite-pwa/assets-generator --preset minimal-2023 app/static/icon.png` then copy its `maskable-icon-512x512.png` into `app-next/public/`. (Do NOT reuse the un-padded `android-chrome-*` PNGs as maskable — their art reaches the edge and gets clipped by the OS mask.)
  - `android-chrome-192x192.png` (192x192) and `android-chrome-384x384.png` (384x384) — copied above, used as `purpose: 'any'`.
  - `apple-touch-icon.png` (180x180) and `favicon.ico` are picked up automatically by vite-pwa/Nuxt head defaults; keep them in `public/`.

- [ ] Step 4: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors (the `pwa` key is typed by `@vite-pwa/nuxt`'s module augmentation once the module is registered).

- [ ] Step 5: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load `/`, open DevTools → Application → Manifest: confirm name "Warframe Market Analytics App", short_name "Warframe Analytics", theme_color #272727, categories games/utilities/shopping, and the maskable icon shows with no clipping in the maskable preview. Application → Service Workers: one active worker registered by vite-pwa (no `arc.io` importScripts, no reference to `arc-sw.js`). Network tab: hit a page that calls the API, confirm the request is served/handled by the SW (`warframe-api` cache populated under Cache Storage), zero console errors.

- [ ] Step 6: Commit: `git add app-next/nuxt.config.ts app-next/package.json app-next/public && git commit -m "feat(pwa): port manifest + API NetworkFirst caching to @vite-pwa/nuxt"`

---


## Phase P2 — Vuetify 3 theme & assets


---

### Task P2.1: Vuetify 3 theme + assets

**Files:**
- Create/Edit: `app-next/nuxt.config.ts` (add `vuetify` module block + Open Sans + css registration)
- Create: `app-next/app/assets/analytics.css` (verbatim copy of the Orokin `.an-*` system)
- Create: `app-next/public/img/*` (copied from `app/static/img/*`)
- Edit: `app-next/package.json` (add `@mdi/font`)
- Delete/superseded: `app/nuxt.config.js` vuetify/googleFonts blocks, `app/assets/analytics.css`, `app/static/img/*` (reference only; old app stays until cutover)
- Note only (do NOT copy): `app/assets/variables.scss` — inert (comments only, no active SASS overrides)

**Depends on:** P1 scaffold task (app-next created with `vuetify-nuxt-module` + `@pinia/nuxt` installed and a base `nuxt.config.ts`). This task fills in the theme/assets; it assumes the module is already in `modules`/`buildModules`.

**Steps:**

- [ ] Step 1: Add the mdi font dependency. In `app-next/package.json`, add to `dependencies` (the old app relied on `@nuxtjs/vuetify` to pull mdi transitively; V3 needs it explicit):
```jsonc
// BEFORE (app-next/package.json dependencies — mdi absent)
"dependencies": {
  "vuetify": "^3.7.0"
}
// AFTER
"dependencies": {
  "vuetify": "^3.7.0",
  "@mdi/font": "^7.4.47"
}
```
Then run `cd app-next && npm install`.

- [ ] Step 2: Copy the Orokin stylesheet verbatim. Copy `app/assets/analytics.css` -> `app-next/app/assets/analytics.css` byte-for-byte (it @imports Cinzel + Rajdhani itself and defines the entire `.an-*` void-gold system — do not edit it):
```bash
cp "app/assets/analytics.css" "app-next/app/assets/analytics.css"
```

- [ ] Step 3: Copy static images into the Nuxt 4 public dir (Nuxt 2 `static/` -> Nuxt 4 `public/`; `/img/...` URLs stay identical in templates):
```bash
mkdir -p app-next/public/img
cp -r app/static/img/. app-next/public/img/
```
Confirm: `banner.png logo.png mercadopago_icon.png mercadopago_icon.webp paypal_donate.png paypal_donate.webp paypal_icon.png paypal_icon.webp` land in `app-next/public/img/`.

- [ ] Step 4: Register the analytics CSS in `nuxt.config.ts`. Port ONLY analytics.css here (driver.css belongs to the driver.js/tour task).
```ts
// BEFORE (app/nuxt.config.js line 64)
css: ['driver.js/dist/driver.css', '~/assets/analytics.css'],
// AFTER (app-next/nuxt.config.ts — path unchanged, driver.css deferred to its own task)
css: ['~/assets/analytics.css'],
```

- [ ] Step 5: Port the Vuetify config into the `vuetify` module option (vuetify-nuxt-module shape). BEFORE is the whole old `vuetify: {...}` block (`app/nuxt.config.js` lines 206-235) plus the `googleFonts` block (lines 96-100). Note the V3 changes: `dark: false` -> `defaultTheme: 'dark'` (because `layouts/default.vue` line 2 is `<v-app dark>`, so the live app is dark); `colors.*` shortcuts -> resolved Material hex; colors nested under `colors:`; `treeShake` dropped (auto in V3); `customVariables` dropped (variables.scss is empty); `defaultAssets.font` dropped (module has no font injection — Open Sans handled in Step 6); `lang.locales` -> `locale` with V3 `vuetify/locale` imports.
```js
// BEFORE (app/nuxt.config.js)
import colors from 'vuetify/es5/util/colors'
import es from 'vuetify/lib/locale/es'
import pt from 'vuetify/lib/locale/pt'
// ...
googleFonts: {
  families: { 'Open Sans': [400, 600, 700] }
},
// ...
vuetify: {
  lang: { locales: { pt, es } },
  treeShake: true,
  customVariables: ['~/assets/variables.scss'],
  defaultAssets: { font: { family: 'Open Sans' } },
  theme: {
    dark: false,
    themes: {
      dark: {
        primary: colors.blue.darken2,      // #1976D2
        accent: colors.grey.darken3,       // #424242
        secondary: colors.amber.darken3,   // #FF8F00
        info: colors.teal.lighten1,        // #26A69A
        warning: colors.amber.base,        // #FFC107
        error: colors.deepOrange.accent4,  // #DD2C00
        success: colors.green.accent3      // #00E676
      },
      light: { primary: '#1f1f2f' }
    }
  }
}
```
```ts
// AFTER (app-next/nuxt.config.ts)
import { es, pt } from 'vuetify/locale'

export default defineNuxtConfig({
  // ...existing scaffold config (modules, i18n, runtimeConfig, css from Step 4)...
  vuetify: {
    moduleOptions: {
      // vite-plugin-vuetify tree-shakes automatically — no `treeShake` flag needed
      styles: { configFile: undefined }, // no SASS overrides (variables.scss is empty)
    },
    vuetifyOptions: {
      icons: { defaultSet: 'mdi' }, // mdi FONT via @mdi/font (Step 1 + Step 6 css)
      locale: {
        locale: 'en',
        fallback: 'es',
        messages: { es, pt },
      },
      theme: {
        defaultTheme: 'dark', // old <v-app dark> made the live app dark despite dark:false
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#1976D2',   // blue.darken2
              accent: '#424242',    // grey.darken3
              secondary: '#FF8F00', // amber.darken3
              info: '#26A69A',      // teal.lighten1
              warning: '#FFC107',   // amber.base
              error: '#DD2C00',     // deepOrange.accent4
              success: '#00E676',   // green.accent3
            },
          },
          light: {
            dark: false,
            colors: { primary: '#1f1f2f' },
          },
        },
      },
    },
  },
})
```

- [ ] Step 6: Load Open Sans + register the mdi font CSS. The module does NOT inject either, so add both to the top-level `css` array (extends Step 4) and load Open Sans via a head `<link>`:
```ts
// app-next/nuxt.config.ts
export default defineNuxtConfig({
  css: [
    '@mdi/font/css/materialdesignicons.css', // mdi glyphs for icons.defaultSet:'mdi'
    '~/assets/analytics.css',
  ],
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
        },
      ],
    },
  },
})
```
Then set Open Sans as the base body font (Vuetify 3 no longer applies it via defaultAssets). Add to the top of `app-next/app/assets/analytics.css` OR a small global rule — put it in a new `app-next/app/assets/base.css` added to `css`, keeping analytics.css a verbatim copy:
```css
/* app-next/app/assets/base.css */
html, body, .v-application { font-family: 'Open Sans', sans-serif; }
```
(add `'~/assets/base.css'` to the `css` array before analytics.css).

- [ ] Step 7: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors from `nuxt.config.ts` (verify the `vuetify/locale` import and the `vuetify` key both resolve against vuetify-nuxt-module types).

- [ ] Step 8: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load `/` (or any migrated analytics page once P3 exists; for now a temporary page rendering an `.an-console` block + a `<v-btn color="primary">` + a `<v-icon>mdi-magnify</v-icon>`). Expect: dark background by default, primary button renders `#1976D2`, mdi icon glyph shows (not a tofu box), Cinzel/Rajdhani apply inside `.an-title`/`.an-eyebrow`, Open Sans applies to plain body text, zero console errors. Screenshot-diff the Orokin console panel vs old app (close — accept V3 default spacing shifts).

- [ ] Step 9: Commit: `git add app-next/nuxt.config.ts app-next/app/assets/ app-next/public/img app-next/package.json app-next/package-lock.json && git commit -m "feat(app-next): port Vuetify 3 dark theme, mdi font, Open Sans, and Orokin analytics.css assets"`

---


## Phase P3 — Vuex → Pinia store


---

### Task P3.1: Pinia items store (convert Vuex `store/index.ts`)

**Files:**
- Create: `app-next/app/stores/items.ts`
- Delete/superseded: `app/store/index.ts` (reference only; old app stays until cutover)

**Depends on:** `@pinia/nuxt` registered in `app-next/nuxt.config.ts` (P0 scaffold — enables auto-import of `useItemsStore`). The store is only *filled* by the ported default-layout SSR fetch (separate P-layout task); see audit note below.

**Audit summary (read before coding):**
- **Fill path:** `app/store/index.ts` `state.items` is populated in exactly one place — `app/layouts/default.vue` middleware, SSR-only: `$axios.get($config.apiURL)` → `store.dispatch('setItems', data)`. Nothing else fills items. The new default layout MUST reproduce this (`items.setItems(data)`), or every getter returns `[]`.
- **Dead state:** `locations` and `fortex` are **never dispatched anywhere** in `app/` (only the store's own action→mutation self-wiring references `setLocations`/`setFortex`). No page reads them. They are dead — ported for parity only.
- **Pinia collision:** getters `locations`/`fortex` would clash with the same-named state keys (illegal in Pinia). Kept as **state-only**, accessed directly (`items.locations`), which is identical consumer syntax. Only `allItems`/`allRelics`/`allSets` are real getters.

**Steps:**

- [ ] Step 1: Create the store. BEFORE — current Vuex module (`app/store/index.ts`, whole file):
  ```ts
  export const state = () => ({
    items: [],
    locations: [],
    fortex: {}
  })

  export const mutations = {
    setItems(state: any, payload: any) { state.items = payload },
    setLocations(state: any, payload: any) { state.locations = payload },
    setFortex(state: any, payload: any) { state.fortex = payload },
  }

  export const actions = {
    setItems(vuexContext: any, payload: any) { vuexContext.commit('setItems', payload) },
    setLocations(vuexContext: any, payload: any) { vuexContext.commit('setLocations', payload) },
    setFortex(vuexContext: any, payload: any) { vuexContext.commit('setFortex', payload) },
  }

  export const getters = {
    all_items(state: any): any { return state.items },
    all_relics(state: any): any { return state.items.filter(el => el.tags.includes('relic')); },
    all_sets(state: any): any { return state.items.filter(el=>el.item_name.includes(' Set')) },
    locations(state: any) { return state.locations },
    fortex(state: any) { return state.fortex }
  }
  ```
  AFTER — `app-next/app/stores/items.ts` (defineStore; mutations+actions collapse into Pinia actions; snake_case getters → camelCase; `locations`/`fortex` demoted to direct state access to avoid the Pinia name collision):
  ```ts
  import { defineStore } from 'pinia'

  export interface WarframeItem {
    item_name: string
    tags: string[]
    [key: string]: any
  }

  interface ItemsState {
    items: WarframeItem[]
    locations: any[]
    fortex: Record<string, any>
  }

  export const useItemsStore = defineStore('items', {
    state: (): ItemsState => ({
      items: [],
      locations: [], // dead: never filled anywhere in the app (parity only)
      fortex: {},     // dead: never filled anywhere in the app (parity only)
    }),
    getters: {
      // old snake_case getter names -> camelCase (see SHARED CODE CONVENTIONS)
      allItems: (state): WarframeItem[] => state.items,
      allRelics: (state): WarframeItem[] =>
        state.items.filter((el) => el.tags.includes('relic')),
      allSets: (state): WarframeItem[] =>
        state.items.filter((el) => el.item_name.includes(' Set')),
      // NOTE: old getters `locations`/`fortex` cannot be Pinia getters — they would
      // collide with the same-named state keys. They are dead passthroughs, so consumers
      // read `store.locations` / `store.fortex` directly off state (identical syntax).
    },
    actions: {
      // sole live fill path: default-layout SSR fetch calls this (was store.dispatch('setItems', data))
      setItems(payload: WarframeItem[]) {
        this.items = payload
      },
      // dead parity actions — no caller exists; keep so a future feature can fill them
      setLocations(payload: any[]) {
        this.locations = payload
      },
      setFortex(payload: Record<string, any>) {
        this.fortex = payload
      },
    },
  })
  ```

- [ ] Step 2: Record the consumer access pattern (used by every page task that depended on `mapGetters`). Old Vuex consumer (e.g. `app/pages/ducats.vue:155`):
  ```js
  import { mapGetters } from 'vuex'
  // ...
  computed: { ...mapGetters({ allItems: 'all_items' }) }
  ```
  New `<script setup lang="ts">` consumer:
  ```ts
  const items = useItemsStore()            // auto-imported by @pinia/nuxt
  const allItems = computed(() => items.allItems)
  // relic/[relic].vue instead: const allSets = computed(() => items.allRelics)  // old mapped all_relics
  // set/[set].vue instead:     const allSets = computed(() => items.allSets)
  ```
  Pages that read `locations`/`fortex` (none currently) would use `computed(() => items.locations)` — direct state.

- [ ] Step 3: (documentation only — no edit here) The 6 in-scope consumer pages whose page tasks must swap `mapGetters(... 'all_items'/'all_relics')` → the Step 2 pattern:
  1. `app/pages/ducats.vue` (`ducats`, all_items)
  2. `app/pages/endo.vue` (`endo`, all_items)
  3. `app/pages/flip.vue` (`flip`, all_items)
  4. `app/pages/index.vue` (`index`, all_items)
  5. `app/pages/portfolio.vue` (`portfolio`, all_items)
  6. `app/pages/relic/_relic.vue` → `relic/[relic].vue` (all_relics, mapped to local `allSets`)
  ⚠ Also breaking but out of this list (flag for their own tasks): `set/_set.vue` (all_sets), `screener.vue`, `vaulted.vue`, `star-chart.vue` (all_items).

- [ ] Step 4: Ensure the fill path survives. The new `app-next/app/layouts/default.vue` (P-layout task) must replace the old SSR middleware `store.dispatch('setItems', data)` with:
  ```ts
  const config = useRuntimeConfig()
  const base = config.public.apiURL
  const items = useItemsStore()
  const { data } = await useAsyncData('items-catalog', () => $fetch(`${base}`))
  if (data.value) items.setItems(data.value as WarframeItem[])
  ```
  (Reference only in this task — implemented in the layout task; noted here so the store's `setItems` action has a caller.)

- [ ] Step 5: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/stores/items.ts` (`useItemsStore`, `defineStore`, `computed` all resolve via auto-imports).

- [ ] Step 6: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Because the store has no direct route, verify through the first migrated consumer + the layout fill task: load `/`, open Vue devtools → Pinia → `items` store, confirm `items` array is populated (non-empty) after SSR and `allRelics`/`allSets` getters return filtered subsets; expect zero console errors. (If verifying before any consumer page is migrated, add a throwaway `console.log(useItemsStore().allItems.length)` in `app.vue`, confirm > 0, then remove.)

- [ ] Step 7: Commit: `git add app-next/app/stores/items.ts && git commit -m "feat(store): port Vuex items module to Pinia useItemsStore"`

---


## Phase P4 — App shell & shell components


---

Three tasks. P4.1 creates the app root + SSR items bootstrap; P4.2 is the high-risk default layout; P4.3 is the error page. Old `layouts/error.vue` (a `layout:'empty'` component in Nuxt 2) becomes Nuxt 4's app-root `error.vue`.

### Task P4.1: app.vue root + SSR items bootstrap
**Files:**
- Create: app-next/app/app.vue
- Create: app-next/public/img/logo.png (copy of app/static/img/logo.png)
- Delete/superseded: app/layouts/default.vue `middleware()` block (moves here; old app stays until cutover)
**Depends on:** P0 scaffold (nuxt.config.ts with runtimeConfig.public.apiURL, @pinia/nuxt, vuetify-nuxt-module); items store task exposing `useItemsStore` with a `setItems(payload)` action.
**Steps:**
- [ ] Step 1: Copy the logo asset so `/img/logo.png` resolves: `cp "app/static/img/logo.png" "app-next/public/img/logo.png"` (create app-next/public/img/ first). Do NOT copy a webp — none exists.
- [ ] Step 2: Create `app-next/app/app.vue`. It renders the layout/page shell and performs the SSR items fetch that the OLD default.vue did in `middleware()`.
  BEFORE (app/layouts/default.vue, the middleware that loads the global store):
  ```js
  async middleware({ store, redirect, $axios, $i18n, query, $config }) {
    if (process.server) {
      const data = await $axios
        .get($config.apiURL)
        .then((res) => res.data)
      store.dispatch('setItems', data)
    }
  },
  ```
  AFTER (`app-next/app/app.vue`):
  ```vue
  <template>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </template>

  <script setup lang="ts">
  const config = useRuntimeConfig()
  const base = config.public.apiURL
  const items = useItemsStore()

  // Global bootstrap: was default.vue middleware ($axios.get($config.apiURL) -> dispatch setItems)
  const { data } = await useAsyncData('app-items', () => $fetch(base))
  if (data.value) items.setItems(data.value)
  </script>
  ```
- [ ] Step 3: Confirm the items store has the action this calls. If missing, that is the items-store task's job — verify `useItemsStore().setItems` exists (see findings). Do not proceed to browser check until it does.
- [ ] Step 4: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for app.vue (useItemsStore must be auto-imported by @pinia/nuxt; runtimeConfig.public.apiURL must be typed).
- [ ] Step 5: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`, load `/`; expect the page shell renders, the items store is populated (nav/home data loads), zero console errors, and the SSR HTML (view-source) already contains item data (no client-only flash).
- [ ] Step 6: Commit: `git add app-next/app/app.vue app-next/public/img/logo.png && git commit -m "feat(app-next): app root + SSR items bootstrap"`

### Task P4.2: default.vue layout (Vuetify 2 -> 3, Orokin shell)
**Files:**
- Create: app-next/app/layouts/default.vue
- Delete/superseded: app/layouts/default.vue (old app stays until cutover)
**Depends on:** P4.1 (app.vue provides `<NuxtLayout>`); LanguageMenu + GitHubButton component migration (referenced here, auto-imported); items store (not consumed directly here); i18n v9 configured.
**Steps:**
- [ ] Step 1: App bar — drop V3-removed layout props (`app`, `fixed`, `:clipped-left`), keep Orokin color/class/style.
  BEFORE:
  ```html
  <v-app dark>
    <v-app-bar color="#0b0c16" class="app-bar-orokin" :clipped-left="clipped" fixed app style="z-index: 100">
  ```
  AFTER:
  ```html
  <v-app>
    <v-app-bar color="#0b0c16" class="app-bar-orokin" style="z-index: 100">
  ```
- [ ] Step 2: Menu button — `text` -> `variant="text"`; `hidden-xs-only` -> responsive display util.
  BEFORE:
  ```html
  <v-btn text class="app-menu-btn mr-2" aria-label="Open navigation menu" @click.stop="drawer = !drawer">
    <v-icon>mdi-menu</v-icon>
    <span class="app-menu-btn__label hidden-xs-only">Menu</span>
  </v-btn>
  ```
  AFTER:
  ```html
  <v-btn variant="text" class="app-menu-btn mr-2" aria-label="Open navigation menu" @click.stop="drawer = !drawer">
    <v-icon>mdi-menu</v-icon>
    <span class="app-menu-btn__label d-none d-sm-inline">Menu</span>
  </v-btn>
  ```
- [ ] Step 3: Logo — remove the dead `#sources` webp slot (no v-img #sources in V3; logo.webp does not exist); point at the copied public asset.
  BEFORE:
  ```html
  <v-img max-height="90%" max-width="65vw" contain alt="logo warframe analytics" class="logo_image" position="left center" src="./img/logo.png" @click="scrollTop">
    <template #sources>
      <source srcset="/img/logo.webp" />
    </template>
  </v-img>
  ```
  AFTER:
  ```html
  <v-img max-height="90%" max-width="65vw" contain alt="logo warframe analytics" class="logo_image" position="left center" src="/img/logo.png" @click="scrollTop" />
  ```
- [ ] Step 4: Tour button — `text` -> `variant="text"`; `hidden-sm-and-down` -> `d-none d-md-inline`.
  BEFORE:
  ```html
  <v-btn text class="app-tour-btn mr-1" aria-label="Take a guided tour" @click="startTour">
    <v-icon>mdi-compass-outline</v-icon>
    <span class="app-tour-btn__label hidden-sm-and-down">Tour</span>
  </v-btn>
  ```
  AFTER:
  ```html
  <v-btn variant="text" class="app-tour-btn mr-1" aria-label="Take a guided tour" @click="startTour">
    <v-icon>mdi-compass-outline</v-icon>
    <span class="app-tour-btn__label d-none d-md-inline">Tour</span>
  </v-btn>
  ```
- [ ] Step 5: Navigation drawer — drop `app` prop (V3 auto-layout via v-main), keep everything else.
  BEFORE: `<v-navigation-drawer v-model="drawer" app temporary color="#0a0b14" width="278" class="nav-drawer">`
  AFTER: `<v-navigation-drawer v-model="drawer" temporary color="#0a0b14" width="278" class="nav-drawer">`
- [ ] Step 6: Nav list — `dense` -> `density="compact"`; `v-subheader` -> `v-list-subheader`; restructure each item (v-list-item-icon REMOVED, v-list-item-title -> #prepend icon + default slot text). Keep the `:key`/Orokin classes and the section grouping.
  BEFORE:
  ```html
  <v-list nav dense class="nav-drawer__list">
    <template v-for="section in drawerSections">
      <v-subheader v-if="section.title" :key="'h-' + section.title" class="nav-drawer__sub">
        {{ section.title }}
      </v-subheader>
      <v-list-item v-for="link in section.items" :key="link.to" :to="link.to" :exact="link.exact" :data-tour="link.to" color="#e7cf95" @click="drawer = false">
        <v-list-item-icon>
          <v-icon>{{ link.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title>{{ link.title }}</v-list-item-title>
      </v-list-item>
    </template>
    <v-divider class="nav-drawer__divider" />
    <v-list-item href="https://github.com/eduair94/warframe" target="_blank" rel="noopener noreferrer">
      <v-list-item-icon><v-icon>mdi-github</v-icon></v-list-item-icon>
      <v-list-item-title>Source Code</v-list-item-title>
    </v-list-item>
  </v-list>
  ```
  AFTER:
  ```html
  <v-list nav density="compact" class="nav-drawer__list">
    <template v-for="section in drawerSections" :key="section.title || 'root'">
      <v-list-subheader v-if="section.title" class="nav-drawer__sub">
        {{ section.title }}
      </v-list-subheader>
      <v-list-item v-for="link in section.items" :key="link.to" :to="link.to" :exact="link.exact" :data-tour="link.to" color="#e7cf95" @click="drawer = false">
        <template #prepend>
          <v-icon>{{ link.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ link.title }}</v-list-item-title>
      </v-list-item>
    </template>
    <v-divider class="nav-drawer__divider" />
    <v-list-item href="https://github.com/eduair94/warframe" target="_blank" rel="noopener noreferrer">
      <template #prepend><v-icon>mdi-github</v-icon></template>
      <v-list-item-title>Source Code</v-list-item-title>
    </v-list-item>
  </v-list>
  ```
  (Note: `:key` moves to the `<template>` in V3 since fragments can't key the inner v-if/v-for separately; the old `:key="'h-'+..."` on v-subheader is folded into the template key.)
- [ ] Step 7: Main content — `<Nuxt />` -> `<slot />`; v-main/v-container unchanged.
  BEFORE:
  ```html
  <v-main class="main">
    <v-container>
      <Nuxt />
    </v-container>
  </v-main>
  ```
  AFTER:
  ```html
  <v-main class="main">
    <v-container>
      <slot />
    </v-container>
  </v-main>
  ```
- [ ] Step 8: Footer — drop `:fixed="false"` (default is inline in V3); `$t()` -> `t()`.
  BEFORE:
  ```html
  <v-footer :fixed="false">
    <div class="d-flex footer_content">
      <span>Warframe Market Analytics &copy; {{ new Date().getFullYear() }}</span>
      <v-spacer />
      <span>{{ $t('madeWith') }} <v-icon color="red">mdi-heart</v-icon>
        {{ $t('por') }}
        <a href="https://www.linkedin.com/in/eduardo-airaudo/">Eduardo Airaudo</a>
        {{ $t('and') }}
        <a href="https://www.linkedin.com/in/reginascagliotti/">Regina Scagliotti</a>
      </span>
    </div>
  </v-footer>
  ```
  AFTER:
  ```html
  <v-footer>
    <div class="d-flex footer_content">
      <span>Warframe Market Analytics &copy; {{ new Date().getFullYear() }}</span>
      <v-spacer />
      <span>{{ t('madeWith') }} <v-icon color="red">mdi-heart</v-icon>
        {{ t('por') }}
        <a href="https://www.linkedin.com/in/eduardo-airaudo/">Eduardo Airaudo</a>
        {{ t('and') }}
        <a href="https://www.linkedin.com/in/reginascagliotti/">Regina Scagliotti</a>
      </span>
    </div>
  </v-footer>
  ```
- [ ] Step 9: Rewrite the script as `<script setup lang="ts">`. Drop dead data (`items`, `miniVariant`, `right`, `rightDrawer`, `title`, `clipped`, `fixed`), the dead nav-scroll methods (`setupNav`/`centerActiveNav`/`updateNavFades`), the `$route` watch, and the `$vuetify.lang` line (see findings). Keep only `drawer`, `navLinks`, `drawerSections`, `scrollTop`, `startTour`. Move component imports to auto-import.
  BEFORE (script excerpts that change): the whole Options API block — `components: { LanguageMenu: () => import(...), GitHubButton: () => import(...) }`, `middleware(){...}` (moved to app.vue in P4.1), `data(){ return { clipped, drawer, fixed, items:[...], miniVariant, right, rightDrawer, title, navLinks:[...] } }`, `computed:{ drawerSections(){...} }`, `mounted(){ this.$vuetify.lang.current = this.$i18n.locale; this.setupNav() }`, `watch:{ $route(){...} }`, `methods:{ scrollTop, startTour, setupNav, centerActiveNav, updateNavFades }`.
  AFTER (`<script setup lang="ts">`):
  ```ts
  // LanguageMenu / GitHubButton auto-import from app/components — no manual import
  const { t } = useI18n()

  const drawer = ref(false)

  const navLinks = [
    { to: '/', title: 'Home', icon: 'mdi-home-variant', exact: true, group: null },
    { to: '/set', title: 'Set Prices', icon: 'mdi-cube-outline', group: 'Prices' },
    { to: '/relic', title: 'Relic Prices', icon: 'mdi-diamond-stone', group: 'Prices' },
    { to: '/comparison', title: 'Set vs Parts', icon: 'mdi-scale-balance', group: 'Analytics' },
    { to: '/relics-value', title: 'Relic Value', icon: 'mdi-treasure-chest-outline', group: 'Analytics' },
    { to: '/flip', title: 'Flip Finder', icon: 'mdi-trending-up', group: 'Analytics' },
    { to: '/screener', title: 'Screener', icon: 'mdi-table-search', group: 'Analytics' },
    { to: '/movers', title: 'Top Movers', icon: 'mdi-swap-vertical-bold', group: 'Analytics' },
    { to: '/volatility', title: 'Volatility', icon: 'mdi-pulse', group: 'Analytics' },
    { to: '/timing', title: 'Buy / Sell Timing', icon: 'mdi-clock-alert-outline', group: 'Analytics' },
    { to: '/vault-spikes', title: 'Vault Spikes', icon: 'mdi-rocket-launch-outline', group: 'Analytics' },
    { to: '/vaulted', title: 'Vaulted', icon: 'mdi-lock-outline', group: 'Analytics' },
    { to: '/star-chart', title: 'Star Chart', icon: 'mdi-orbit', group: 'Analytics' },
    { to: '/ducats', title: 'Ducats', icon: 'mdi-cash-multiple', group: 'Analytics' },
    { to: '/endo', title: 'Endo / Plat', icon: 'mdi-swap-horizontal', group: 'Tools' },
    { to: '/relic-farming', title: 'Relic Farming', icon: 'mdi-timer-sand', group: 'Tools' },
    { to: '/riven-value', title: 'Riven Value', icon: 'mdi-star-four-points-outline', group: 'Tools' },
    { to: '/portfolio', title: 'Portfolio', icon: 'mdi-briefcase-variant-outline', group: 'Tools' },
  ]

  const drawerSections = computed(() => {
    const order = [null, 'Prices', 'Analytics', 'Tools']
    return order
      .map((g) => ({ title: g, items: navLinks.filter((l) => (l.group || null) === g) }))
      .filter((s) => s.items.length)
  })

  function scrollTop() {
    window.scrollTo(0, 0)
  }

  async function startTour() {
    drawer.value = true
    await nextTick()
    const mod = await import('driver.js')
    const driver = (mod as any).driver || (mod as any).default
    const step = (to: string, title: string, description: string) => ({
      element: `[data-tour="${to}"]`,
      popover: { title, description, side: 'right', align: 'start' },
    })
    const tour = driver({
      showProgress: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      onDestroyed: () => { drawer.value = false },
      steps: [
        { popover: { title: 'Welcome, Tenno', description: 'This is your void-trade console — every tool for spending and earning platinum smarter. Take the quick tour?' } },
        { element: '.app-menu-btn', popover: { title: 'Everything lives in the menu', description: 'Open it any time. Tools are grouped into Prices, Analytics and Tools.', side: 'bottom', align: 'start' } },
        step('/comparison', 'Set vs Parts', 'Buy the assembled set, or the parts and combine? We show which is cheaper right now, and by how much.'),
        step('/relics-value', 'Relic Value', 'Crack a relic or sell it? The expected platinum payout of every relic, for Intact and Radiant.'),
        step('/flip', 'Flip Finder', 'The widest, most liquid buy/sell spreads — buy at the bid, relist at the ask.'),
        step('/ducats', 'Ducat Efficiency', "The best ducats-per-platinum parts to stock up for Baro Ki'Teer."),
        step('/vaulted', 'Vaulted', "Prime gear you can no longer farm — track what's climbing in value."),
        { popover: { title: "You're set", description: 'Open the menu whenever you want to dig in. Happy trading, Tenno.' } },
      ],
    })
    tour.drive()
  }
  ```
- [ ] Step 10: Copy the ENTIRE `<style>` block verbatim from app/layouts/default.vue lines 295-909 into the new file (unscoped, global `<style>`). It defines all the Orokin `.app-bar-orokin`, `.nav-drawer*`, footer, data-table, alert, menu, filter-container theming. Do NOT trim it — many rules target child pages. Note the `.v-menu__content` / `.v-list-item__title` / `.v-data-table__wrapper` selectors reference V2 internal class names that V3 renames; leave them (harmless if unmatched) and let per-page migration tasks re-verify table/menu theming. Flag `.v-app-bar--fixed` rule (line 406) as now-inert (no fixed bar) but keep it.
- [ ] Step 11: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors (useI18n from @nuxtjs/i18n, ref/computed/nextTick auto-imported; driver.js dynamic import typed as any).
- [ ] Step 12: Verify in browser: backend on :3529 + `cd app-next && npm run dev`, load `/`; expect: app bar with logo + Menu/Tour/GitHub/Language controls; clicking Menu opens the Orokin drawer with grouped sections (Prices/Analytics/Tools subheaders + items with icons); footer renders with translated madeWith/por/and; the Tour button launches driver.js and highlights `.app-menu-btn`; zero console errors. Screenshot-diff the shell vs old app `/` (accept V3 spacing shifts; drawer/footer/app-bar must read as the same Orokin design).
- [ ] Step 13: Commit: `git add app-next/app/layouts/default.vue app-next/public/img/logo.png && git commit -m "feat(app-next): migrate default layout to Vuetify 3 (Orokin shell)"`

### Task P4.3: error.vue (app-root error page)
**Files:**
- Create: app-next/app/error.vue
- Delete/superseded: app/layouts/error.vue (Nuxt 2 `layout:'empty'` component; old app stays until cutover)
**Depends on:** P4.1 (Vuetify registered so `<v-app>` context exists).
**Steps:**
- [ ] Step 1: In Nuxt 4 the error component lives at the app root as `error.vue` and receives an `error` prop of type `NuxtError` (has `statusCode`). Port the 404/other-error text and the Home link; wrap in `<v-app>` so Vuetify styling context exists (old wrapped in `<v-app dark>` — drop `dark`, darkness comes from theme config). Port `head()` to `useHead`.
  BEFORE (app/layouts/error.vue, full file):
  ```vue
  <template>
    <v-app dark>
      <h1 v-if="error.statusCode === 404">{{ pageNotFound }}</h1>
      <h1 v-else>{{ otherError }}</h1>
      <NuxtLink to="/"> Home page </NuxtLink>
    </v-app>
  </template>

  <script>
  export default {
    name: 'EmptyLayout',
    layout: 'empty',
    props: { error: { type: Object, default: null } },
    data() {
      return { pageNotFound: '404 Not Found', otherError: 'An error occurred' }
    },
    head() {
      const title = this.error.statusCode === 404 ? this.pageNotFound : this.otherError
      return { title }
    },
  }
  </script>

  <style scoped>
  h1 { font-size: 20px; }
  </style>
  ```
  AFTER (`app-next/app/error.vue`):
  ```vue
  <template>
    <v-app>
      <h1 v-if="error.statusCode === 404">{{ pageNotFound }}</h1>
      <h1 v-else>{{ otherError }}</h1>
      <NuxtLink to="/"> Home page </NuxtLink>
    </v-app>
  </template>

  <script setup lang="ts">
  import type { NuxtError } from '#app'

  const props = defineProps<{ error: NuxtError }>()

  const pageNotFound = '404 Not Found'
  const otherError = 'An error occurred'

  useHead({
    title: computed(() => (props.error.statusCode === 404 ? pageNotFound : otherError)),
  })
  </script>

  <style scoped>
  h1 { font-size: 20px; }
  </style>
  ```
- [ ] Step 2: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors (NuxtError from #app, computed auto-imported).
- [ ] Step 3: Verify in browser: `cd app-next && npm run dev`, navigate to a non-existent route e.g. `/this-does-not-exist`; expect the "404 Not Found" heading, a working "Home page" link back to `/`, tab title = "404 Not Found", zero console errors. Trigger a non-404 (e.g. throw in a page) to confirm the else branch shows "An error occurred".
- [ ] Step 4: Commit: `git add app-next/app/error.vue && git commit -m "feat(app-next): migrate error page to Nuxt 4 app-root error.vue"`

---

### Task P4.4: Port LanguageMenu.vue to Vue 3 / Vuetify 3 / i18n v9

**Files:**
- Create: app-next/app/components/LanguageMenu.vue
- Delete/superseded: app/components/LanguageMenu.vue (reference only; old app stays until cutover)

**Depends on:** P0-P3 infra — Vuetify 3 (vuetify-nuxt-module), @nuxtjs/i18n v9 configured (exposing `useI18n` + `useSwitchLocalePath`), shell layout that mounts this component.

**Steps:**

- [ ] Step 1: Rewrite the `<script>` block as `<script setup lang="ts">`. The old Options API mirrored `$i18n.locale` into a local `locale` data ref (via `mounted` + `watch`) purely to display it and to push `$vuetify.lang.current`. In i18n v9, `locale` is already a reactive ref and Vuetify's locale is wired through nuxt config, so the data ref, `mounted`, and `watch` are all dropped.

  BEFORE (app/components/LanguageMenu.vue, lines 24-46):
  ```vue
  <script>
  export default {
    data() {
      return {
        locale: '',
      }
    },
    computed: {
      availableLocales() {
        return this.$i18n.locales.filter((i) => i.code !== this.$i18n.locale)
      },
    },
    watch: {
      '$i18n.locale'(val) {
        this.locale = val
        this.$vuetify.lang.current = val
      },
    },
    mounted() {
      this.locale = this.$i18n.locale
    },
  }
  </script>
  ```

  AFTER:
  ```vue
  <script setup lang="ts">
  const { locale, locales } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const availableLocales = computed(() =>
    (locales.value as Array<{ code: string; name?: string }>).filter(
      (i) => i.code !== locale.value,
    ),
  )
  </script>
  ```
  Notes: `locales` from useI18n v9 is a `ComputedRef` of locale objects (`{ code, name, ... }`) — access via `.value`. `locale` is a `Ref<string>`. Keep the same filter semantics (exclude the currently active locale). `switchLocalePath` is now a composable, not a global injected method.

- [ ] Step 2: Update the `v-menu` activator slot to the Vuetify 3 API. V3 removed the `{ on, attrs }` / `v-on` pattern in favor of a single `props` object bound with `v-bind`. Also drop the `dark` attr on `v-btn` (theme-driven in V3; the button already uses `color="primary"`). The `locale` reference in the template now resolves to the `locale` ref auto-unwrapped in `<script setup>`.

  BEFORE (app/components/LanguageMenu.vue, lines 3-8):
  ```vue
  <v-menu offset-y>
    <template #activator="{ on, attrs }">
      <v-btn color="primary" dark v-bind="attrs" v-on="on">
        {{ locale }} <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
    </template>
  ```

  AFTER:
  ```vue
  <v-menu>
    <template #activator="{ props }">
      <v-btn color="primary" v-bind="props">
        {{ locale }} <v-icon>mdi-chevron-down</v-icon>
      </v-btn>
    </template>
  ```
  Note: `offset-y` is dropped — V3 `v-menu` defaults to opening below the activator (location="bottom"); no explicit prop is needed to reproduce the old offset-y behavior.

- [ ] Step 3: The `v-list` / `v-list-item` block needs no structural change — it already uses `v-list-item` with `v-list-item-title` in the default slot and `:to="switchLocalePath(item.code)"`, all valid in V3 (no `v-list-item-icon`/`v-list-item-content`/`v-subheader` here). Keep it verbatim:

  ```vue
  <v-list>
    <v-list-item
      v-for="(item, index) in availableLocales"
      :key="index"
      link
      :to="switchLocalePath(item.code)"
    >
      <v-list-item-title>{{ item.name }}</v-list-item-title>
    </v-list-item>
  </v-list>
  ```

- [ ] Step 4: Full ported file (app-next/app/components/LanguageMenu.vue):
  ```vue
  <template>
    <div class="text-center">
      <v-menu>
        <template #activator="{ props }">
          <v-btn color="primary" v-bind="props">
            {{ locale }} <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            v-for="(item, index) in availableLocales"
            :key="index"
            link
            :to="switchLocalePath(item.code)"
          >
            <v-list-item-title>{{ item.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
  </template>

  <script setup lang="ts">
  const { locale, locales } = useI18n()
  const switchLocalePath = useSwitchLocalePath()

  const availableLocales = computed(() =>
    (locales.value as Array<{ code: string; name?: string }>).filter(
      (i) => i.code !== locale.value,
    ),
  )
  </script>
  ```

- [ ] Step 5: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (verify `locales.value` cast and `useSwitchLocalePath`/`useI18n` auto-imports resolve).

- [ ] Step 6: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load any page whose layout/header includes LanguageMenu; expect the button renders the current locale code + chevron, clicking opens the menu below it listing the OTHER locales, and selecting one navigates via `switchLocalePath` and switches the app language. Zero console errors. Screenshot-diff the header vs old app (close; accept V3 default button/menu spacing).

- [ ] Step 7: Commit: `git add app-next/app/components/LanguageMenu.vue && git commit -m "feat(migration): port LanguageMenu to Vue3/Vuetify3/i18n v9"`

---

### Task P4.5: Port GitHubButton.vue to Vue 3 / Vuetify 3

**Files:**
- Create: app-next/app/components/GitHubButton.vue
- Delete/superseded: app/components/GitHubButton.vue (reference only; old app stays until cutover)

**Depends on:** P0 (Vuetify 3 via vuetify-nuxt-module + theme; @nuxtjs/i18n v9 configured with `globalInjection: true` so `$t` resolves in templates), P4 shell (default layout renders the header where this button lives)

**Notes / breaking surface:** Purely presentational component (no `asyncData`/`head`/Vuex) so it STAYS Options API. Two classes of change only: (1) the removed Vue 3 core API `$listeners`, and (2) the removed Vuetify 3 `small`/`left` props on `v-btn`/`v-icon`. The `outlined` prop is declared but never referenced in the template — keep it declared for API parity (it would map to `variant="outlined"` in V3 if ever wired up); do NOT delete it. `$t('view_source_code')` keeps working via vue-i18n v9 global injection — no change to the i18n call itself.

**Steps:**

- [ ] Step 1: Fix the template. Remove `v-on="$listeners"` (removed in Vue 3 — listeners are part of `$attrs` now, and `v-bind="$attrs"` already forwards them), swap `:small` on `v-btn` for `size="small"`, swap `:small` on `v-icon` for `size="small"`, and replace `:left` on `v-icon` (removed in V3) with the `me-2` margin utility applied only when it is not an icon-only button.

  BEFORE (`app/components/GitHubButton.vue`):
  ```vue
  <template>
    <v-btn
      :class="buttonClass"
      :color="color"
      :icon="icon"
      :small="small"
      :href="githubUrl"
      target="_blank"
      rel="noopener noreferrer"
      v-bind="$attrs"
      v-on="$listeners"
    >
      <v-icon :left="!icon" :small="small">mdi-github</v-icon>
      <span v-if="!icon">{{ text || $t('view_source_code') }}</span>
    </v-btn>
  </template>
  ```

  AFTER:
  ```vue
  <template>
    <v-btn
      :class="buttonClass"
      :color="color"
      :icon="icon"
      :size="small ? 'small' : undefined"
      :href="githubUrl"
      target="_blank"
      rel="noopener noreferrer"
      v-bind="$attrs"
    >
      <v-icon :class="{ 'me-2': !icon }" :size="small ? 'small' : undefined">mdi-github</v-icon>
      <span v-if="!icon">{{ text || $t('view_source_code') }}</span>
    </v-btn>
  </template>
  ```

- [ ] Step 2: Script block — no logic changes needed, but drop the now-defunct `v-on="$listeners"` reliance by making the component forward attrs cleanly. Keep Options API and all props (including the unused `outlined`) exactly as-is. Optionally add `inheritAttrs: false` so `$attrs` is applied once (via the explicit `v-bind="$attrs"`) rather than also being auto-applied to the root — this matches single-root intent and avoids duplicate attribute binding in Vue 3.

  BEFORE:
  ```vue
  <script>
  export default {
    name: 'GitHubButton',
    props: {
      color: {
        type: String,
        default: 'white'
      },
      text: {
        type: String,
        default: ''
      },
      icon: {
        type: Boolean,
        default: false
      },
      outlined: {
        type: Boolean,
        default: false
      },
      small: {
        type: Boolean,
        default: false
      },
      buttonClass: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        githubUrl: 'https://github.com/eduair94/warframe'
      }
    }
  }
  </script>
  ```

  AFTER:
  ```vue
  <script>
  export default {
    name: 'GitHubButton',
    inheritAttrs: false,
    props: {
      color: {
        type: String,
        default: 'white'
      },
      text: {
        type: String,
        default: ''
      },
      icon: {
        type: Boolean,
        default: false
      },
      outlined: {
        type: Boolean,
        default: false
      },
      small: {
        type: Boolean,
        default: false
      },
      buttonClass: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        githubUrl: 'https://github.com/eduair94/warframe'
      }
    }
  }
  </script>
  ```

- [ ] Step 3: Copy the `<style scoped>` block verbatim — no changes. The `.v-btn` hover transform/box-shadow still targets Vuetify 3's `.v-btn` root class.

  ```vue
  <style scoped>
  .v-btn {
    transition: all 0.2s ease;
  }

  .v-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  </style>
  ```

- [ ] Step 4: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file.

- [ ] Step 5: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load any route whose layout header renders GitHubButton (e.g. `/`). Expect: the GitHub button renders with the `mdi-github` icon + localized "view source code" label (or a `text` override), `size="small"` variant matches the old app's `small` button when used that way, the icon has correct right-margin spacing (`me-2`), clicking opens `https://github.com/eduair94/warframe` in a new tab, and there are zero console errors (specifically no `$listeners is not defined` / attrs warnings). Screenshot-diff the header vs the old app on the same route — expect a close match (accept Vuetify 3 default sizing/spacing shifts).

- [ ] Step 6: Commit: `git add app-next/app/components/GitHubButton.vue && git commit -m "feat(app-next): port GitHubButton to Vue 3 / Vuetify 3"`

---

### Task P4.6: Port GitHubShare.vue to Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/components/GitHubShare.vue`
- Delete/superseded: `app/components/GitHubShare.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (Vuetify 3 module + `@nuxtjs/i18n` v9 with `globalInjection` so template/instance `$t` resolves), P4 shell/layout exists

**Notes:** Purely presentational — no `asyncData`/`head`, no Vuex `mapGetters`, no `$vuetify.breakpoint`, no dynamic route. It **stays Options API** (Vue 3 supports it); only Vuetify 2 template APIs and one Nuxt-2 event-bus call change. Template `$t` and script `this.$t` keep working via i18n `globalInjection`, so **no `useI18n()` conversion is needed**. The `this.$nuxt.$emit('show-snackbar', ...)` call is **dead code**: a repo-wide grep for `show-snackbar` and for any `$nuxt.$on` / snackbar listener finds only this file — nothing consumes the event today, so no snackbar ever renders. Drop it (Nuxt 3 removed `$nuxt.$emit` entirely). The `copied` check-icon feedback is the actual UX and is preserved.

**Steps:**

- [ ] Step 1: Copy `app/components/GitHubShare.vue` to `app-next/app/components/GitHubShare.vue`, then apply the edits below.

- [ ] Step 2: Fix the `v-tooltip` activator slot (V3 removes `{ on, attrs }`/`v-on`).
  BEFORE:
  ```vue
      <template #activator="{ on, attrs }">
        <v-btn
          icon
          color="white"
          v-bind="attrs"
          class="github-btn"
          v-on="on"
          @click="openGitHub"
        >
          <v-icon>mdi-github</v-icon>
        </v-btn>
      </template>
  ```
  AFTER:
  ```vue
      <template #activator="{ props }">
        <v-btn
          icon
          color="white"
          v-bind="props"
          class="github-btn"
          @click="openGitHub"
        >
          <v-icon>mdi-github</v-icon>
        </v-btn>
      </template>
  ```

- [ ] Step 3: Drop `dark` from `v-card` (darkness is theme-driven; card already sets its own gradient in scoped CSS).
  BEFORE:
  ```vue
      <v-card dark class="github-card">
  ```
  AFTER:
  ```vue
      <v-card class="github-card">
  ```

- [ ] Step 4: Rename typography helper classes on the title and description (`headline` → `text-h5`, `body-1` → `text-body-1`).
  BEFORE:
  ```vue
        <v-card-title class="headline d-flex align-center">
          <v-icon large class="mr-3" color="white">mdi-github</v-icon>
          {{ $t('open_source_project') }}
        </v-card-title>
  ```
  AFTER:
  ```vue
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon size="large" class="mr-3" color="white">mdi-github</v-icon>
          {{ $t('open_source_project') }}
        </v-card-title>
  ```
  BEFORE:
  ```vue
            <p class="body-1 mb-4">
  ```
  AFTER:
  ```vue
            <p class="text-body-1 mb-4">
  ```

- [ ] Step 5: Fix the URL row — color background helper (`grey darken-3` → `bg-grey-darken-3`), `v-icon left` → `start`, and the copy `v-btn small` / `v-icon small` → `size="small"`.
  BEFORE:
  ```vue
            <div class="d-flex align-center justify-center mb-4 pa-3 grey darken-3 rounded">
              <v-icon left color="white">mdi-link</v-icon>
              <span class="font-weight-bold">{{ githubUrl }}</span>
              <v-btn
                icon
                small
                color="primary"
                class="ml-2"
                :disabled="copied"
                @click="copyToClipboard"
              >
                <v-icon small>{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              </v-btn>
            </div>
  ```
  AFTER:
  ```vue
            <div class="d-flex align-center justify-center mb-4 pa-3 bg-grey-darken-3 rounded">
              <v-icon start color="white">mdi-link</v-icon>
              <span class="font-weight-bold">{{ githubUrl }}</span>
              <v-btn
                icon
                size="small"
                color="primary"
                class="ml-2"
                :disabled="copied"
                @click="copyToClipboard"
              >
                <v-icon size="small">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              </v-btn>
            </div>
  ```

- [ ] Step 6: Change the three action `v-btn` icons from `left` → `start` (buttons themselves keep `color`/`:href`/`target`/`rel` unchanged).
  BEFORE:
  ```vue
                <v-icon left>mdi-github</v-icon>
                {{ $t('view_on_github') }}
  ```
  ```vue
                <v-icon left>mdi-source-fork</v-icon>
                {{ $t('fork_project') }}
  ```
  ```vue
                <v-icon left>mdi-bug</v-icon>
                {{ $t('report_issue') }}
  ```
  AFTER (only the icon lines change):
  ```vue
                <v-icon start>mdi-github</v-icon>
                {{ $t('view_on_github') }}
  ```
  ```vue
                <v-icon start>mdi-source-fork</v-icon>
                {{ $t('fork_project') }}
  ```
  ```vue
                <v-icon start>mdi-bug</v-icon>
                {{ $t('report_issue') }}
  ```

- [ ] Step 7: Rename the features list typography class (`body-2` → `text-body-2`).
  BEFORE:
  ```vue
              <ul class="body-2">
  ```
  AFTER:
  ```vue
              <ul class="text-body-2">
  ```

- [ ] Step 8: Convert the close-button `text` attr to the `variant` prop.
  BEFORE:
  ```vue
          <v-btn text @click="dialog = false">
            {{ $t('cerrar') }}
          </v-btn>
  ```
  AFTER:
  ```vue
          <v-btn variant="text" @click="dialog = false">
            {{ $t('cerrar') }}
          </v-btn>
  ```

- [ ] Step 9: Remove the dead Nuxt-2 event-bus call in `copyToClipboard` (`$nuxt.$emit` does not exist in Nuxt 3 and nothing listens for `show-snackbar`). Keep everything else — the `copied` state toggle and the clipboard fallback are unchanged.
  BEFORE:
  ```js
        await navigator.clipboard.writeText(this.githubUrl)
        this.copied = true
        this.$nuxt.$emit('show-snackbar', {
          message: this.$t('url_copied'),
          color: 'success'
        })
        setTimeout(() => {
          this.copied = false
        }, 3000)
  ```
  AFTER:
  ```js
        await navigator.clipboard.writeText(this.githubUrl)
        this.copied = true
        setTimeout(() => {
          this.copied = false
        }, 3000)
  ```
  (Leave the `<script>` block as Options API — no `<script setup>` conversion, no `useI18n()`. `name`, `data()` with `dialog`/`copied`/`githubUrl`, and `openGitHub` stay verbatim. The `<style scoped>` block is unchanged.)

- [ ] Step 10: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file.

- [ ] Step 11: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load a page/layout that renders `<GitHubShare />` (the shell header/app-bar). Expect: GitHub icon button renders with hover-scale; tooltip shows the localized `view_source_code` text; clicking opens the dialog (gradient card, title, description, the URL row with `bg-grey-darken-3` background, three colored action buttons with left-aligned icons, features list, close button); clicking the copy button flips the icon to `mdi-check` and back after 3s with no console errors; the three action buttons open GitHub in a new tab. Zero console errors/warnings (no Vuetify "left"/"dark"/"attrs" deprecation warnings). Screenshot-diff vs old app header + open dialog (close).

- [ ] Step 12: Commit: `git add app-next/app/components/GitHubShare.vue && git commit -m "feat(app-next): port GitHubShare to Vue 3 / Vuetify 3"`

---

### Task P4.7: Drop the stock Nuxt scaffold `Tutorial.vue`

**Files:**
- Delete/superseded: `app/components/Tutorial.vue` (reference only; old app stays until cutover)
- Create: *(none — do NOT re-create this file in `app-next/`)*

**Depends on:** none (P4 shell scaffold assumed to exist)

**Context / rationale:**
`app/components/Tutorial.vue` is the untouched Nuxt 2 starter scaffold. Its very first line is `<!-- Please remove this file from your project -->`, its body just renders the Nuxt logo + "Welcome to your Nuxt Application" card, and it pulls Tailwind from a jsDelivr CDN `<link>` inside the template. It uses **none** of the migration's breaking surfaces:
- No `asyncData` / `head()` / `useAsyncData`.
- No Vuetify components at all (pure Tailwind utility classes + inline SVG).
- No `$vuetify.breakpoint`, no `$i18n`, no Vuex `mapGetters`, no `.sync`, no `v-data-table` / `v-simple-table` / `v-list-item-icon` / `v-subheader` / `v-menu` activator, no `moment` / `leaflet` / `driver.js`.
- Options API only, with a `name`:
  ```vue
  <script>
  export default {
    name: 'NuxtTutorial',
  }
  </script>
  ```
  (Vue 3 supports Options API, so even if kept verbatim it would compile.)

It is dead code — grep confirms it is a leftover scaffold, not part of the real UI shell. The correct migration action is to **not carry it over**.

**Steps:**
- [ ] Step 1: Confirm the component is unreferenced in the OLD app before dropping it. Run from `app/`:
  ```bash
  cd "c:/Users/airau/Desktop/My Proyects/warframe/app" && grep -rn "Tutorial" --include=*.vue --include=*.js --include=*.ts . | grep -v "components/Tutorial.vue"
  ```
  Expect **no matches** (auto-import means it would appear as `<Tutorial />`/`<NuxtTutorial />` in a page/layout if used). If — and only if — a match appears, STOP and escalate: the file is actually in use and must instead be ported verbatim into `app-next/app/components/Tutorial.vue` (it needs no code changes; Options API + Tailwind classes work as-is under Vue 3 — just keep the external `<link href="…tailwindcss@2.1.2…">` or inline the two utility classes it relies on).
- [ ] Step 2: Do NOT create `app-next/app/components/Tutorial.vue`. Verify it is absent so a stray auto-import cannot resurrect it:
  ```bash
  test ! -e "c:/Users/airau/Desktop/My Proyects/warframe/app-next/app/components/Tutorial.vue" && echo "OK: not present in app-next"
  ```
  Expect `OK: not present in app-next`.
- [ ] Step 3: Typecheck (sanity — proves nothing in `app-next` references the dropped component): `cd app-next && npx nuxi typecheck` — expect no new errors mentioning `Tutorial` / `NuxtTutorial`.
- [ ] Step 4: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/` and confirm the app renders with zero console errors and no "Failed to resolve component: Tutorial/NuxtTutorial" warning. There is no old route to screenshot-diff (the scaffold card was never wired into a real page).
- [ ] Step 5: Commit (records the deliberate drop): `git add -A && git commit -m "chore(migration): drop stock Nuxt scaffold Tutorial.vue (unused)"`

---

### Task P4.8: Port LoadingBar.vue spinner overlay (no API changes)

**Files:**
- Create: `app-next/app/components/LoadingBar.vue`
- Delete/superseded: `app/components/LoadingBar.vue` (reference only; old app stays until cutover)

**Depends on:** P0 scaffold (`app-next/` nested srcDir + `nuxt.config.ts`). No store/composable/shell deps.

**Breaking-pattern audit:** NONE. This file is a purely presentational component — a single `<div id="spinner-wrapper">` with a CSS spinner and a plain `<style>` block. There is **no** `<script>`, no `asyncData`/`head()`, no `$vuetify`/`$i18n`/Vuex, no `.sync`, no Vuetify components (`v-*`), no `hidden-*` classes, no `moment`/leaflet/driver.js. Nothing needs a Vue 2 → Vue 3 or Vuetify 2 → Vuetify 3 conversion. This is a straight copy.

Note (from memory): `#spinner-wrapper` is the global loading overlay that Nuxt pages hide on mount; keep the id and z-index exactly so existing spinner-hide logic keeps working.

**Steps:**
- [ ] Step 1: Copy the file verbatim into the new tree. Create `app-next/app/components/LoadingBar.vue` with the SAME content as `app/components/LoadingBar.vue` (template + `<style>`). No edits required.

  BEFORE (`app/components/LoadingBar.vue`) — full current file:
  ```vue
  <template>
    <div id="spinner-wrapper">
      <div class="lds-ring">
        <div></div>
      </div>
    </div>
  </template>

  <style>
  #spinner-wrapper {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1021;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .lds-ring div {
    box-sizing: border-box;
    display: block;
    width: 51px;
    height: 51px;
    margin: 6px;
    border: 6px solid #fff;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #fff transparent transparent transparent;
  }

  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }

  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }

  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  </style>
  ```

  AFTER (`app-next/app/components/LoadingBar.vue`) — identical (kept the global, non-`scoped` `<style>` on purpose so `#spinner-wrapper` stays a global overlay, and kept `z-index: 1021`):
  ```vue
  <template>
    <div id="spinner-wrapper">
      <div class="lds-ring">
        <div></div>
      </div>
    </div>
  </template>

  <style>
  #spinner-wrapper {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1021;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .lds-ring div {
    box-sizing: border-box;
    display: block;
    width: 51px;
    height: 51px;
    margin: 6px;
    border: 6px solid #fff;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #fff transparent transparent transparent;
  }

  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }

  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }

  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  </style>
  ```

- [ ] Step 2: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors introduced by this file (it has no script, so it contributes no TS surface).
- [ ] Step 3: Verify in browser: with the backend up (repo-root `npm run dev` on :3529) and `cd app-next && npm run dev`, load any route that renders the shell (e.g. `/`). Because Nuxt 4 auto-imports components, `<LoadingBar />` resolves without an explicit import wherever the layout/app uses it. Expect: the spinner overlay renders (full-screen dark scrim + rotating white ring) while data loads, then disappears once pages run their on-mount `#spinner-wrapper` hide logic; zero console errors. Screenshot-diff the overlay vs the old app — should be pixel-identical.
- [ ] Step 4: Commit: `git add app-next/app/components/LoadingBar.vue && git commit -m "feat(app-next): port LoadingBar spinner overlay component"`

---

### Task P4.9: Port `LoadingBar copy.vue` (static spinner overlay) verbatim

**Files:**
- Create: `app-next/app/components/LoadingBarCopy.vue` (rename to drop the space in the filename; Vue 3 SFC component names cannot contain a space and the space breaks auto-import references)
- Delete/superseded: `app/components/LoadingBar copy.vue` (reference only; old app stays until cutover)

**Depends on:** P4 shell (app-next scaffold + `app-next/app/components/` directory exists)

**Breaking-pattern audit:** This file uses NONE of the Vue2/Nuxt2/Vuetify2 breaking patterns. There is no `<script>` block (no asyncData/head/mapGetters/$vuetify/$i18n), no Vuetify components (no v-data-table/v-simple-table/v-list-item-icon/v-subheader/v-btn/v-menu), no `hidden-*` classes, no `.sync`, no moment/leaflet/driver.js. It is a plain `<template>` + plain (non-scoped) `<style>` block. Migration is a verbatim copy; the ONLY change is the filename (removing the space). Keep the `<style>` global (NOT scoped) — it targets the fixed `#spinner-wrapper` id and matches the original behavior.

**Steps:**
- [ ] Step 1: Create `app-next/app/components/LoadingBarCopy.vue` with the ACTUAL current content copied verbatim.

  BEFORE (`app/components/LoadingBar copy.vue`, full file):
  ```vue
  <template>
    <div id="spinner-wrapper">
      <div class="lds-ring">
        <div></div>
      </div>
    </div>
  </template>

  <style>
  #spinner-wrapper {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1021;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .lds-ring div {
    box-sizing: border-box;
    display: block;
    width: 51px;
    height: 51px;
    margin: 6px;
    border: 6px solid #fff;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #fff transparent transparent transparent;
  }

  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }

  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }

  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  </style>
  ```

  AFTER (`app-next/app/components/LoadingBarCopy.vue`, identical content — filename is the only change):
  ```vue
  <template>
    <div id="spinner-wrapper">
      <div class="lds-ring">
        <div></div>
      </div>
    </div>
  </template>

  <style>
  #spinner-wrapper {
    position: fixed;
    background-color: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 1021;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .lds-ring div {
    box-sizing: border-box;
    display: block;
    width: 51px;
    height: 51px;
    margin: 6px;
    border: 6px solid #fff;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: #fff transparent transparent transparent;
  }

  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }

  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }

  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
  </style>
  ```

  Note: `.lds-ring` renders a single child `<div>`, so the `:nth-child(1/2/3)` delay rules and the `-0.45s/-0.3s/-0.15s` staggering are effectively dead rules (only one child exists). Preserve them anyway for byte-for-byte parity — do NOT "clean up" during migration.

- [ ] Step 2: Confirm no consumer wiring is needed. Auto-import will expose this as `<LoadingBarCopy />` (Nuxt component auto-import PascalCases the filename). Grep the new app for references to the old spaced name and update if any exist: `cd app-next && rg -n "LoadingBar copy|LoadingBarCopy" app/` — expect either no hits (component was unused, which is likely since it is a `copy` duplicate) or update the tag to `<LoadingBarCopy />`.

- [ ] Step 3: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors (no script block means nothing to type; this only confirms the SFC parses).

- [ ] Step 4: Verify in browser: with backend up (repo-root `npm run dev` on :3529) and `cd app-next && npm run dev`, temporarily drop `<LoadingBarCopy />` into `app-next/app/app.vue` (or any loaded page), load the route, and confirm a full-viewport 50%-black overlay with a white spinning ring renders with zero console errors; screenshot-diff the overlay vs the old app's `#spinner-wrapper` spinner (must match — same ring size 51px, 6px white border, 1.2s spin). Remove the temporary usage after confirming.

- [ ] Step 5: Commit: `git add "app-next/app/components/LoadingBarCopy.vue" && git commit -m "feat(migration): port LoadingBar copy spinner component to Nuxt4 (LoadingBarCopy.vue)"`

---


## Phase P5 — Static pages & shared components


---

### Task P5.1: Port JoinTwitter.vue social bottom-sheet (Vuetify 2→3 props/classes + Vue 3 lifecycle)

**Files:**
- Create: `app-next/app/components/JoinTwitter.vue`
- Delete/superseded: `app/components/JoinTwitter.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (app-next scaffold + Vuetify 3 via vuetify-nuxt-module), P3 (vue-i18n v9 with global `$t` injection enabled), and the layout shell that mounts this component.

This component is **purely presentational** — no `asyncData`, no `head()`, no Vuex, no `$vuetify.breakpoint`. Per conventions it **stays Options API**; only the Vuetify 2→3 template APIs and the Vue 2→3 lifecycle hook change. `v-bottom-sheet`, `v-sheet`, `v-icon`, `v-btn` all still exist in Vuetify 3. `localStorage` is only touched inside `mounted()`/`close()` (client-only), so SSR is safe — no guard needed.

**Steps:**

- [ ] Step 1: Convert both `<v-btn text>` to the Vuetify 3 `variant="text"` prop.

  BEFORE (`app/components/JoinTwitter.vue` lines 5-15):
  ```html
  <v-btn text class="font-weight-bold" color="warning" @click="close"
    >{{ $t('no_mostrar_nuevo') }}
  </v-btn>
  <v-btn
    text
    class="font-weight-bold"
    color="error"
    @click="sheet = false"
  >
    {{ $t('cerrar') }}
  </v-btn>
  ```

  AFTER:
  ```html
  <v-btn variant="text" class="font-weight-bold" color="warning" @click="close"
    >{{ $t('no_mostrar_nuevo') }}
  </v-btn>
  <v-btn
    variant="text"
    class="font-weight-bold"
    color="error"
    @click="sheet = false"
  >
    {{ $t('cerrar') }}
  </v-btn>
  ```

- [ ] Step 2: Update the `v-sheet` background color class — Vuetify 3 replaces bare `grey darken-3` with the `bg-` prefixed token.

  BEFORE (line 4):
  ```html
  <v-sheet class="text-center py-2 grey darken-3" height="auto">
  ```

  AFTER:
  ```html
  <v-sheet class="text-center py-2 bg-grey-darken-3" height="auto">
  ```

- [ ] Step 3: Update the two text-color utility classes on the `<a>` links — Vuetify 3 replaces `white--text` with `text-white`. (Custom classes `no_link` / `link_format` are global and unchanged.)

  BEFORE (lines 18-22 and 31-35):
  ```html
  <a
    class="no_link white--text"
    href="https://twitter.com/cambio_uruguay"
    target="_blank"
  >
  ```
  ```html
  <a
    class="no_link white--text"
    href="https://www.linkedin.com/company/cambio-uruguay/"
    target="_blank"
  >
  ```

  AFTER:
  ```html
  <a
    class="no_link text-white"
    href="https://twitter.com/cambio_uruguay"
    target="_blank"
  >
  ```
  ```html
  <a
    class="no_link text-white"
    href="https://www.linkedin.com/company/cambio-uruguay/"
    target="_blank"
  >
  ```

- [ ] Step 4: Rename the Vue 2 `beforeDestroy` lifecycle hook to Vue 3 `beforeUnmount`. Everything else in `<script>` (data/mounted/methods, the `timeoutFunction` on the instance, `localStorage`) is unchanged.

  BEFORE (lines 47-76):
  ```html
  <script>
  export default {
    data() {
      return {
        sheet: false,
      }
    },
    beforeDestroy() {
      if (this.timeoutFunction) {
        clearTimeout(this.timeoutFunction)
      }
    },
    mounted() {
      this.show()
    },
    methods: {
      close() {
        localStorage.setItem('not_show_twitter', true)
        this.sheet = false
      },
      show() {
        if (localStorage.getItem('not_show_twitter')) return
        const randomSeconds = Math.floor(Math.random() * 60) + 20
        const time = randomSeconds * 1000
        this.timeoutFunction = setTimeout(() => {
          this.sheet = true
        }, time)
      },
    },
  }
  </script>
  ```

  AFTER:
  ```html
  <script>
  export default {
    data() {
      return {
        sheet: false,
      }
    },
    beforeUnmount() {
      if (this.timeoutFunction) {
        clearTimeout(this.timeoutFunction)
      }
    },
    mounted() {
      this.show()
    },
    methods: {
      close() {
        localStorage.setItem('not_show_twitter', true)
        this.sheet = false
      },
      show() {
        if (localStorage.getItem('not_show_twitter')) return
        const randomSeconds = Math.floor(Math.random() * 60) + 20
        const time = randomSeconds * 1000
        this.timeoutFunction = setTimeout(() => {
          this.sheet = true
        }, time)
      },
    },
  }
  </script>
  ```

  The `<template>` block from Steps 1-3 sits above this unchanged otherwise.

- [ ] Step 5: Confirm `$t` global injection is available. This component keeps template `$t('no_mostrar_nuevo')`, `$t('cerrar')`, `$t('join_twitter')`, `$t('join_linkedin')`. These resolve only if the P3 i18n config has `globalInjection: true` (default for @nuxtjs/i18n v9 with vue-i18n). If P3 did NOT enable global injection, instead convert to Composition API for this component: add `<script setup>`? No — keep Options API and use `setup()` returning `{ t }` from `const { t } = useI18n()`, then change the four `$t(` calls to `t(`. Verify which path P3 took before finalizing.

- [ ] Step 6: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file.

- [ ] Step 7: Verify in browser: start backend (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load any page that renders the layout containing `<JoinTwitter />`. Because the sheet appears after a random 20-80s timer, temporarily lower `randomSeconds` (or clear `localStorage.removeItem('not_show_twitter')` then wait) to force the bottom sheet open. Expect: sheet slides up from bottom, both buttons render as flat/text variant, dark-grey background, white link text with twitter/linkedin icons, zero console errors. Clicking "no_mostrar_nuevo" sets `not_show_twitter` in localStorage and closes; "cerrar" just closes. Screenshot-diff vs old app (close match; accept Vuetify 3 default spacing shifts).

- [ ] Step 8: Commit: `git add app-next/app/components/JoinTwitter.vue && git commit -m "feat(migrate): port JoinTwitter to Vue 3 / Vuetify 3"`

---

### Task P5.2: Migrate SearchExchange.vue (dialog + branch data-table)

**Files:**
- Create: `app-next/app/components/SearchExchange.vue`
- Create/verify: `app-next/app/services/not_found.ts` (ported dependency — see Step 0)
- Delete/superseded: `app/components/SearchExchange.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (vuetify-nuxt-module + Vuetify 3 theme), P1 ($fetch/runtimeConfig), P2 (@nuxtjs/i18n v9), app shell.

**Notes:** Presentational component with NO asyncData/head, but it reads `$vuetify.breakpoint`, calls `$axios`, and uses `$t`/`$i18n.locale`. Those are composables/removed globals in V3, so this file MUST convert to `<script setup lang="ts">`. There is also a latent bug in `getMaps` (bare `origin` instead of `this.origin` — always `undefined`); port it to `props.origin` (clearly the intent).

**Steps:**

- [ ] Step 0: Ensure the `not_found` dependency exists under app-next. The component imports `import { notFound } from '../services/not_found'`. Copy `app/services/not_found.ts` (or `.js`) to `app-next/app/services/not_found.ts` verbatim if not already present from an earlier phase. Import path stays `'../services/not_found'`.

- [ ] Step 1: Convert the `<v-dialog>` activator + breakpoint fullscreen. The V2 activator slot uses `{ on, attrs }` with `v-on="on"`; V3 removes `v-on` and exposes a single `props` object.
  BEFORE:
  ```vue
  <v-dialog
    v-model="dialog"
    :fullscreen="$vuetify.breakpoint.mobile"
    width="1500px"
  >
    <template #activator="{ on, attrs }">
      <a
        class="white--text"
        :href="maps"
        target="_blank"
        v-bind="attrs"
        @click.prevent="get_data"
        v-on="on"
        >{{ $t('buscarSucursal') }}</a
      >
    </template>
  ```
  AFTER:
  ```vue
  <v-dialog
    v-model="dialog"
    :fullscreen="mobile"
    width="1500"
  >
    <template #activator="{ props: activatorProps }">
      <a
        class="text-white"
        :href="maps"
        target="_blank"
        v-bind="activatorProps"
        @click.prevent="getData"
        >{{ t('buscarSucursal') }}</a
      >
    </template>
  ```

- [ ] Step 2: Port the toolbar (drop `dark` on `v-toolbar` → `theme="dark"`; `blue darken-4` → `blue-darken-4`; breakpoint; drop `dark` on the icon button).
  BEFORE:
  ```vue
  <v-toolbar dark color="primary">
    <v-toolbar-title>
      <div class="d-flex align-center">
        <span class="mr-4">Sucursales{{ getLocation() }}</span>
        <v-btn
          v-if="!$vuetify.breakpoint.mobile"
          color="blue darken-4"
          link
          target="_blank"
          :href="maps"
          >GOOGLE MAPS</v-btn
        >
      </div>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn icon dark @click="dialog = false">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-toolbar>
  ```
  AFTER:
  ```vue
  <v-toolbar theme="dark" color="primary">
    <v-toolbar-title>
      <div class="d-flex align-center">
        <span class="mr-4">Sucursales{{ getLocation() }}</span>
        <v-btn
          v-if="!mobile"
          color="blue-darken-4"
          link
          target="_blank"
          :href="maps"
          >GOOGLE MAPS</v-btn
        >
      </div>
    </v-toolbar-title>
    <v-spacer></v-spacer>
    <v-btn icon @click="dialog = false">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </v-toolbar>
  ```

- [ ] Step 3: Port the mobile maps button (`tile` → `rounded="0"`, breakpoint, color).
  BEFORE:
  ```vue
  <v-btn
    v-if="$vuetify.breakpoint.mobile"
    class="w-100 mt-0 elevation-0"
    tile
    color="blue darken-4"
    link
    target="_blank"
    :href="maps"
    >GOOGLE MAPS</v-btn
  >
  <div v-if="!loaded" class="px-4 pt-3 text-h5">
    {{ $t('cargando') }}...
  </div>
  ```
  AFTER:
  ```vue
  <v-btn
    v-if="mobile"
    class="w-100 mt-0 elevation-0"
    rounded="0"
    color="blue-darken-4"
    link
    target="_blank"
    :href="maps"
    >GOOGLE MAPS</v-btn
  >
  <div v-if="!loaded" class="px-4 pt-3 text-h5">
    {{ t('cargando') }}...
  </div>
  ```

- [ ] Step 4: Port the `v-data-table`: replace `:sort-by.sync`/`:sort-desc.sync` with `v-model:sort-by` (V3 sort model is an array of `{ key, order }`), replace `:footer-props` with the top-level `:items-per-page-options` prop, and swap all `white--text` → `text-white`. Slot names `#item.<x>` stay identical in V3.
  BEFORE:
  ```vue
  <v-data-table
    :sort-by.sync="sortBy"
    :sort-desc.sync="sortDesc"
    mobile-breakpoint="1100"
    :headers="getHeaders()"
    :items="d"
    :footer-props="{
      'items-per-page-options': [10, 20, 30, 40, 50],
    }"
    :items-per-page="10"
    class="elevation-0 search_exchange"
  >
    <template #item.Direccion="{ item }">
      <a target="_blank" class="white--text" :href="getHref(item)">
        {{ item.Direccion }}
      </a>
    </template>
    <template #item.CorreoElectronico="{ item }">
      <a
        v-if="item.CorreoElectronico"
        class="white--text"
        :href="'mailto:' + item.CorreoElectronico"
      >
        {{ item.CorreoElectronico }}
      </a>
    </template>
    <template #item.Telefono="{ item }">
      <span v-if="item.Telefono">
        <a
          v-for="(x, index) in getPhones(item.Telefono)"
          :key="index"
          class="white--text"
          :href="'tel:' + x.phone"
        >
          <span>{{ x.phone }}</span>
          <span v-if="x.int">int. {{ x.int }}</span>
        </a>
      </span>
    </template>
    <template #item.distance="{ item }">
      <a class="white--text" :href="getMaps(item)" target="_blank">
        {{ formatDistance(item.distance) }}</a
      >
    </template>
  </v-data-table>
  ```
  AFTER:
  ```vue
  <v-data-table
    v-model:sort-by="sortBy"
    mobile-breakpoint="1100"
    :headers="getHeaders()"
    :items="d"
    :items-per-page-options="[
      { value: 10, title: '10' },
      { value: 20, title: '20' },
      { value: 30, title: '30' },
      { value: 40, title: '40' },
      { value: 50, title: '50' },
    ]"
    :items-per-page="10"
    class="elevation-0 search_exchange"
  >
    <template #item.Direccion="{ item }">
      <a target="_blank" class="text-white" :href="getHref(item)">
        {{ item.Direccion }}
      </a>
    </template>
    <template #item.CorreoElectronico="{ item }">
      <a
        v-if="item.CorreoElectronico"
        class="text-white"
        :href="'mailto:' + item.CorreoElectronico"
      >
        {{ item.CorreoElectronico }}
      </a>
    </template>
    <template #item.Telefono="{ item }">
      <span v-if="item.Telefono">
        <a
          v-for="(x, index) in getPhones(item.Telefono)"
          :key="index"
          class="text-white"
          :href="'tel:' + x.phone"
        >
          <span>{{ x.phone }}</span>
          <span v-if="x.int">int. {{ x.int }}</span>
        </a>
      </span>
    </template>
    <template #item.distance="{ item }">
      <a class="text-white" :href="getMaps(item)" target="_blank">
        {{ formatDistance(item.distance) }}</a
      >
    </template>
  </v-data-table>
  ```
  (Also update the loading/message `$t` usages in the surrounding `<div>`s to `t(...)` — see Step 3 for the loading div; change `{{ $t('cargando') }}` → `{{ t('cargando') }}`. The `message` interpolation has no `$t`.)

- [ ] Step 5: Replace the entire `<script lang="ts">` Options block with `<script setup lang="ts">`. Convert props → `withDefaults(defineProps<...>())`, data → refs, methods → plain functions, and swap globals: `this.$t`→`t`, `this.$i18n.locale`→`locale.value`, `this.$axios.get(url).then(r=>r.data)`→`$fetch(url)`, `this.<x>`→`<x>`/`props.<x>`, breakpoint→`useDisplay()`. Fix the bare `origin` bug in `getMaps` → `props.origin`. Sort model becomes `[{ key: 'distance', order: 'asc' }]`.
  BEFORE (full block, abridged head):
  ```ts
  import { notFound } from '../services/not_found'
  export default {
    props: {
      type: { type: String, required: true },
      maps: { type: String, required: true },
      origin: { type: String, required: true },
      location: { type: String, required: true },
      latitude: { type: Number, required: false, default: 0 },
      longitude: { type: Number, required: false, default: 0 },
      localData: { type: Object, required: true },
    },
    data() {
      return { message: '', sortBy: undefined, sortDesc: undefined, dialog: false, loaded: false, d: null }
    },
    methods: {
      getMaps(item: any) {
        if (item.map) return item.map
        const latitude = item.latitude
        const longitude = item.longitude
        if (!notFound.includes(origin)) {
          return `https://www.google.com.uy/maps/search/${encodeURI(this.localData.name)}/@${latitude},${longitude},18.77z`
        } else {
          return `https://www.google.com.uy/maps/search/${latitude},${longitude}`
        }
      },
      // ...formatDistance, capitalize, getLocation, getInt, getPhones, getHref unchanged except this.->props.
      async get_data() {
        this.loaded = false
        this.message = ''
        if (this.origin === 'prex') { /* ... */ this.message = loc[this.$i18n.locale] }
        else if (this.type === 'EBROU') { /* ... */ this.message = loc[this.$i18n.locale] }
        else {
          let url = 'https://cambio.shellix.cc/exchanges/' + this.origin + '/' + this.location
          if (this.latitude && this.longitude) {
            url += `?latitude=${this.latitude}&longitude=${this.longitude}`
            this.sortBy = 'distance'
            this.sortDesc = false
          }
          this.d = await this.$axios.get(url).then((res) => res.data)
        }
        this.loaded = true
      },
    },
  }
  ```
  AFTER (complete replacement script):
  ```ts
  import { ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useI18n } from 'vue-i18n'
  import { notFound } from '../services/not_found'

  const props = withDefaults(
    defineProps<{
      type: string
      maps: string
      origin: string
      location: string
      latitude?: number
      longitude?: number
      localData: Record<string, any>
    }>(),
    { latitude: 0, longitude: 0 }
  )

  const { mobile } = useDisplay()
  const { t, locale } = useI18n()

  type SortItem = { key: string; order: 'asc' | 'desc' }
  const message = ref('')
  const sortBy = ref<SortItem[]>([])
  const dialog = ref(false)
  const loaded = ref(false)
  const d = ref<any>(null)

  function getMaps(item: any) {
    if (item.map) return item.map
    const latitude = item.latitude
    const longitude = item.longitude
    if (!notFound.includes(props.origin)) {
      return `https://www.google.com.uy/maps/search/${encodeURI(
        props.localData.name
      )}/@${latitude},${longitude},18.77z`
    } else {
      return `https://www.google.com.uy/maps/search/${latitude},${longitude}`
    }
  }

  function formatDistance(item: number) {
    if (!item || item === 9999999) return '-'
    if (item >= 1000) return Math.round(item / 1000.0) + ' km'
    else if (item >= 100) return Math.round(item) + ' m'
    else return item.toFixed(1) + ' m'
  }

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  function getLocation() {
    return props.location !== 'TODOS' ? ' de ' + capitalize(props.location) : ''
  }

  function getPhones(phones: string) {
    return phones.split(/y|-/g).map((el) => {
      const arrEl = el.trim().split('int.')
      return { phone: arrEl[0], int: arrEl[1] }
    })
  }

  function getHref(item: any) {
    if (item.map) return item.map
    // Fix BUG Cambial in BCU.
    if (props.origin === 'cambial') {
      return (
        'https://www.google.com.uy/maps/search/' +
        encodeURI(item.Direccion.trim())
      )
    }
    if (!item.Direccion) item.Direccion = ''
    if (!item.Localidad) item.Localidad = ''
    if (!item.Departamento) item.Departamento = ''
    const loc =
      item.Direccion.trim() +
      ', ' +
      item.Localidad.trim() +
      ', ' +
      item.Departamento.trim()
    return 'https://www.google.com.uy/maps/search/' + encodeURI(loc)
  }

  function getHeaders() {
    const toReturn: any[] = [
      { title: t('codigo'), key: 'NroSucursal', width: '30px', sortable: false },
      { title: t('nombre'), align: 'start', sortable: false, width: 'auto', key: 'Nombre' },
      { title: t('departamento'), key: 'Departamento' },
      { title: t('localidad'), key: 'Localidad' },
      { title: t('direccion'), key: 'Direccion' },
      { title: t('telefono'), key: 'Telefono' },
      { title: t('email'), key: 'CorreoElectronico', sortable: false },
      { title: t('horarios'), key: 'Horarios', sortable: false },
      { title: t('observaciones'), key: 'Observaciones', width: 'auto' },
    ]
    if (props.latitude && props.longitude) {
      toReturn.push({ title: t('distancia'), key: 'distance', width: 'auto' })
    }
    return toReturn
  }

  async function getData() {
    loaded.value = false
    message.value = ''
    if (props.origin === 'prex') {
      const loc = {
        es: 'Se requiere la tarjeta prex y realizar el trámite por la aplicación',
        en: 'A prex card is required and the application must be completed.',
        pt: 'O cartão prex é necessário e o requerimento deve ser preenchido através do requerimento.',
      }
      message.value = loc[locale.value as 'es' | 'en' | 'pt']
    } else if (props.type === 'EBROU') {
      const loc = {
        es: 'Se requiere una cuenta de EBROU, una caja de ahorro en dólares y realizar el cambio por la aplicación',
        en: 'It requires an EBROU account, a savings account in US dollars and exchange through the application.',
        pt: 'É necessária uma conta EBROU, uma conta poupança em dólares e troca através da aplicação.',
      }
      message.value = loc[locale.value as 'es' | 'en' | 'pt']
    } else {
      let url =
        'https://cambio.shellix.cc/exchanges/' +
        props.origin +
        '/' +
        props.location
      if (props.latitude && props.longitude) {
        url += `?latitude=${props.latitude}&longitude=${props.longitude}`
        sortBy.value = [{ key: 'distance', order: 'asc' }]
      }
      d.value = await $fetch<any>(url)
    }
    loaded.value = true
  }
  ```
  Note: `get_data` was renamed to `getData` (Step 1 template `@click.prevent` already updated). `getInt` was unused in the template and script — dropped. `$fetch` is a Nuxt auto-import (no import line needed).

- [ ] Step 6: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/components/SearchExchange.vue` (watch for the `locale.value` index cast and the `SortItem[]` model type).

- [ ] Step 7: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Render a page/parent that mounts `<SearchExchange>` (pass required props `type`, `maps`, `origin`, `location`, `localData`; optionally `latitude`/`longitude`). Click the activator link → dialog opens, `getData` fires, either the `message` branch (prex/EBROU) shows the localized text or the `v-data-table` loads rows from `https://cambio.shellix.cc/exchanges/...`. Confirm: sort-by works (distance ascending when lat/long provided), items-per-page selector shows 10/20/30/40/50, mobile fullscreen + mobile GOOGLE MAPS button appear at narrow width, zero console errors. Screenshot-diff vs old app (close).

- [ ] Step 8: Commit: `git add app-next/app/components/SearchExchange.vue app-next/app/services/not_found.ts && git commit -m "feat(app-next): migrate SearchExchange dialog + data-table to Vue 3/Vuetify 3"`

---

### Task P5.3: Port LastTransactionCell.vue to Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/components/LastTransactionCell.vue`
- Delete/superseded: `app/components/LastTransactionCell.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (Nuxt 4 / Vite scaffold + TS), P1 (vuetify-nuxt-module registered, theme configured so `color="primary"` resolves)

**Notes:** Purely presentational component — NO asyncData, head(), $vuetify.breakpoint, $i18n, Vuex, .sync, v-data-table, v-simple-table, v-list-item-icon, v-subheader, v-menu, moment, leaflet, driver.js. It STAYS Options API (Vue 3 supports it); only two things break: `Vue.extend` and the Vuetify 2 boolean `small` prop on `v-icon`. The `@click="$emit('click')"` pattern works unchanged in Vue 3.

**Steps:**

- [ ] Step 1: Convert the script block from the Vue 2 `Vue.extend` factory to `defineComponent`, and switch the default `Vue` import to the named import. Keep the `LastCompleted` interface, all three props, and `fixPrice` verbatim.

  BEFORE (`app/components/LastTransactionCell.vue`, lines 15-51):
  ```vue
  <script lang="ts">
  import Vue, { PropType } from 'vue';

  interface LastCompleted {
    datetime: string;
    volume: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    open_price: number;
    closed_price: number;
  }

  export default Vue.extend({
    name: 'LastTransactionCell',
    props: {
      lastCompleted: {
        type: Object as PropType<LastCompleted | null>,
        default: null,
      },
      showIcon: {
        type: Boolean,
        default: false,
      },
      clickable: {
        type: Boolean,
        default: false,
      },
    },
    methods: {
      fixPrice(price: number): number {
        if (!price) return 0;
        return Math.round(price * 100) / 100;
      },
    },
  });
  </script>
  ```

  AFTER:
  ```vue
  <script lang="ts">
  import { defineComponent, PropType } from 'vue';

  interface LastCompleted {
    datetime: string;
    volume: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    open_price: number;
    closed_price: number;
  }

  export default defineComponent({
    name: 'LastTransactionCell',
    emits: ['click'],
    props: {
      lastCompleted: {
        type: Object as PropType<LastCompleted | null>,
        default: null,
      },
      showIcon: {
        type: Boolean,
        default: false,
      },
      clickable: {
        type: Boolean,
        default: false,
      },
    },
    methods: {
      fixPrice(price: number): number {
        if (!price) return 0;
        return Math.round(price * 100) / 100;
      },
    },
  });
  </script>
  ```
  (Adding `emits: ['click']` declares the forwarded event — Vue 3 best practice and silences the extraneous-attribute warning; behavior is otherwise identical.)

- [ ] Step 2: Fix the Vuetify 2 boolean `small` prop on `v-icon` (removed in Vuetify 3 — sizing is now the `size` prop). The template is otherwise valid in Vue 3.

  BEFORE (lines 3-10):
  ```vue
  <div
    v-if="lastCompleted"
    :class="{ 'last-transaction-cell': clickable || showIcon }"
    @click="$emit('click')"
  >
    {{ fixPrice(lastCompleted.avg_price) }}
    <v-icon v-if="showIcon" small color="primary">mdi-information-outline</v-icon>
  </div>
  ```

  AFTER:
  ```vue
  <div
    v-if="lastCompleted"
    :class="{ 'last-transaction-cell': clickable || showIcon }"
    @click="$emit('click')"
  >
    {{ fixPrice(lastCompleted.avg_price) }}
    <v-icon v-if="showIcon" size="small" color="primary">mdi-information-outline</v-icon>
  </div>
  ```

- [ ] Step 3: Copy the `<style scoped>` block unchanged (plain CSS, no Vuetify-2 selectors):
  ```css
  .last-transaction-cell {
    cursor: pointer;
    text-decoration: underline;
    color: #1976d2;
  }
  ```

- [ ] Step 4: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (`PropType<LastCompleted | null>` and `fixPrice` resolve cleanly).

- [ ] Step 5: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load a route that renders this cell (e.g. the screener/movers table that uses `<LastTransactionCell>`); confirm the price value renders, the info icon appears at small size when `show-icon` is set, the underline/pointer style shows when `clickable`/`show-icon`, and clicking emits `click` (parent handler fires). Expect zero console errors; screenshot-diff vs old app same route (close).

- [ ] Step 6: Commit: `git add app-next/app/components/LastTransactionCell.vue && git commit -m "feat(migration): port LastTransactionCell to Vue 3 / Vuetify 3"`

---

### Task P5.4: Port PriceHistoryChart.vue to Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/components/PriceHistoryChart.vue`
- Delete/superseded: `app/components/PriceHistoryChart.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (Vuetify 3 via vuetify-nuxt-module configured; `@mdi/font` icons). No store/composable deps — this is a pure presentational component (props in, SVG out). It has NO `asyncData`, `head()`, `$vuetify.breakpoint`, `$i18n`, Vuex, `.sync`, `v-data-table`, `v-list-*`, `v-menu`, `moment`, or leaflet. It STAYS Options API — only the Vue 2 factory and 3 Vuetify template APIs change.

**Steps:**

- [ ] Step 1: Copy the file verbatim to `app-next/app/components/PriceHistoryChart.vue`, then apply the edits below. The `<template>` SVG logic, all `computed` (`reversedPoints`, `priceRange`, `linePoints`, `lastX`, `lastY`, `trend*`), the `fixPrice` method, and the entire `<style scoped>` block carry over UNCHANGED.

- [ ] Step 2: Replace the Vue 2 `Vue.extend` component factory with `defineComponent` (Options API is fully supported in Vue 3; keep the same options object).
  BEFORE:
  ```ts
  import Vue, { PropType } from 'vue';

  interface PricePoint {
    date: string;
    buy: number;
    sell: number;
    avg_price: number;
    volume: number;
  }

  interface Trend {
    direction: 'up' | 'down' | 'flat';
    changePercent: number;
  }

  export default Vue.extend({
    name: 'PriceHistoryChart',
    props: {
  ```
  AFTER:
  ```ts
  import { defineComponent, type PropType } from 'vue';

  interface PricePoint {
    date: string;
    buy: number;
    sell: number;
    avg_price: number;
    volume: number;
  }

  interface Trend {
    direction: 'up' | 'down' | 'flat';
    changePercent: number;
  }

  export default defineComponent({
    name: 'PriceHistoryChart',
    props: {
  ```

- [ ] Step 3: Migrate `v-simple-table` (removed in Vuetify 3) to `v-table`, and `dense` -> `density="compact"`. The `#default` slot with hand-written `<thead>/<tbody>` markup is unchanged.
  BEFORE:
  ```html
        <details class="table-fallback">
          <summary>View as table</summary>
          <v-simple-table dense>
            <template #default>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Avg Price</th>
                  <th>Buy</th>
                  <th>Sell</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in reversedPoints" :key="p.date">
                  <td>{{ p.date }}</td>
                  <td>{{ fixPrice(p.avg_price) }}</td>
                  <td>{{ fixPrice(p.buy) }}</td>
                  <td>{{ fixPrice(p.sell) }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </details>
  ```
  AFTER:
  ```html
        <details class="table-fallback">
          <summary>View as table</summary>
          <v-table density="compact">
            <template #default>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Avg Price</th>
                  <th>Buy</th>
                  <th>Sell</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in reversedPoints" :key="p.date">
                  <td>{{ p.date }}</td>
                  <td>{{ fixPrice(p.avg_price) }}</td>
                  <td>{{ fixPrice(p.buy) }}</td>
                  <td>{{ fixPrice(p.sell) }}</td>
                </tr>
              </tbody>
            </template>
          </v-table>
        </details>
  ```

- [ ] Step 4: Replace the boolean `small` prop on both `<v-icon>` tags with `size="small"` (Vuetify 3 removed the `small`/`large`/`x-large` boolean shorthands in favor of the `size` prop).
  BEFORE (empty-state icon, line ~4):
  ```html
        <v-icon small color="grey">mdi-chart-line</v-icon>
  ```
  AFTER:
  ```html
        <v-icon size="small" color="grey">mdi-chart-line</v-icon>
  ```
  BEFORE (trend badge icon, line ~10):
  ```html
          <v-icon small :color="trendColor">{{ trendIcon }}</v-icon>
  ```
  AFTER:
  ```html
          <v-icon size="small" :color="trendColor">{{ trendIcon }}</v-icon>
  ```

- [ ] Step 5: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/components/PriceHistoryChart.vue` (the `type PropType` import and `defineComponent` generic infer prop types the same way `Vue.extend` did).

- [ ] Step 6: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Render a page/parent that mounts `<PriceHistoryChart :points="..." :trend="..." />` (this component is consumed by the price/analytics views, e.g. an item detail or portfolio page). Confirm: SVG polyline + endpoint circle draw, the trend badge shows the correct icon/color/label, the "View as table" `<details>` expands to a compact `v-table` with Date/Avg/Buy/Sell rows, and the empty-state renders when fewer than 2 points. Expect zero console errors. Screenshot-diff the chart block vs the old app (close; accept Vuetify 3 default table spacing shift).

- [ ] Step 7: Commit: `git add app-next/app/components/PriceHistoryChart.vue && git commit -m "feat(app-next): port PriceHistoryChart to Vue 3 / Vuetify 3"`

---

### Task P5.5: Port TradeMessageButtons.vue to Vue 3 / Vuetify 3

**Files:**
- Create: app-next/app/components/TradeMessageButtons.vue
- Delete/superseded: app/components/TradeMessageButtons.vue (reference only; old app stays until cutover)

**Depends on:** P0 (Vuetify 3 via vuetify-nuxt-module + app shell). No store/composable/i18n dependencies — purely presentational.

**Scope note:** This component has NO asyncData/head/$vuetify.breakpoint/i18n/Vuex/.sync/v-data-table/v-simple-table/v-list/v-menu/moment/leaflet/driver.js. Per convention it STAYS Options API (Vue 3 supports it) — only the `Vue.extend` wrapper, the Vuetify 2 template attrs (`outlined`, `small`, v-icon `left`/`small`), and the `*--text` color helper classes change. Props (`itemName`/`sellPrice`/`buyPrice`), `data().copied`, and all clipboard/`buildMessage` logic are copied verbatim.

**Steps:**

- [ ] Step 1: Swap the Vue 2 `Vue.extend` factory for Vue 3 `defineComponent` (Options API kept intact).

  BEFORE (`app/components/TradeMessageButtons.vue` lines 21-24):
  ```ts
  <script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    name: 'TradeMessageButtons',
  ```

  AFTER:
  ```ts
  <script lang="ts">
  import { defineComponent } from 'vue';

  export default defineComponent({
    name: 'TradeMessageButtons',
  ```

  Everything from `props: { ... }` through `methods: { buildMessage, copy }` (lines 26-66) is copied unchanged — the clipboard logic, `navigator.clipboard` fallback, and `setTimeout` reset all work identically in Vue 3.

- [ ] Step 2: Port the two `v-btn` attrs (`small` + `outlined`) to the Vuetify 3 `size` / `variant` props, and the `v-icon` `left small` attrs to `start` / `size`. Also convert the caption's `grey--text` color class to `text-grey`.

  BEFORE (lines 3-15):
  ```html
  <p class="text-caption grey--text mb-1">
    Warframe has no public API for its in-game chat, so nothing can post there automatically -
    copy a ready-to-paste trade message instead.
  </p>
  <div class="d-flex flex-wrap gap-10">
    <v-btn small outlined color="green" :disabled="!sellPrice" @click="copy('sell')">
      <v-icon left small>mdi-content-copy</v-icon>
      Copy WTS message
    </v-btn>
    <v-btn small outlined color="blue" :disabled="!buyPrice" @click="copy('buy')">
      <v-icon left small>mdi-content-copy</v-icon>
      Copy WTB message
    </v-btn>
  ```

  AFTER:
  ```html
  <p class="text-caption text-grey mb-1">
    Warframe has no public API for its in-game chat, so nothing can post there automatically -
    copy a ready-to-paste trade message instead.
  </p>
  <div class="d-flex flex-wrap gap-10">
    <v-btn size="small" variant="outlined" color="green" :disabled="!sellPrice" @click="copy('sell')">
      <v-icon start size="small">mdi-content-copy</v-icon>
      Copy WTS message
    </v-btn>
    <v-btn size="small" variant="outlined" color="blue" :disabled="!buyPrice" @click="copy('buy')">
      <v-icon start size="small">mdi-content-copy</v-icon>
      Copy WTB message
    </v-btn>
  ```

  Note: `left` is removed in Vuetify 3 → `start` provides the same right-margin spacing when the icon precedes text; `small` on both `v-btn` and `v-icon` → `size="small"`.

- [ ] Step 3: Port the "Copied!" indicator's `green--text` color class to `text-green` (logic/`v-if` unchanged).

  BEFORE (line 16):
  ```html
  <span v-if="copied" class="text-caption green--text align-self-center">Copied!</span>
  ```

  AFTER:
  ```html
  <span v-if="copied" class="text-caption text-green align-self-center">Copied!</span>
  ```

- [ ] Step 4: Keep the scoped `<style>` block (`.gap-10 { gap: 10px; }`, lines 70-74) verbatim — no Vuetify-2-specific CSS, nothing to change.

- [ ] Step 5: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file.

- [ ] Step 6: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load a page that renders `<TradeMessageButtons>` (it is auto-imported; e.g. embed it once on a scratch route or open the item/detail view that uses it), pass `item-name`, `sell-price`, `buy-price` props. Expect: both buttons render outlined+green/blue with the copy icon, disabled when the matching price is 0, clicking copies the `WTS/WTB <name> :platinum: <price> (price check warframe.market)` string to the clipboard, and "Copied!" flashes green for ~2s. Zero console errors; screenshot-diff vs old app (close — Vuetify 3 default button height/padding will differ slightly, acceptable).

- [ ] Step 7: Commit: `git add app-next/app/components/TradeMessageButtons.vue && git commit -m "feat(migrate): port TradeMessageButtons to Vue 3 / Vuetify 3"`

---

### Task P5.6: Migrate ItemComparison.vue dialog to Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/components/ItemComparison.vue`
- Delete/superseded: `app/components/ItemComparison.vue` (reference only; old app stays until cutover)

**Depends on:** P0-P3 infra (vuetify-nuxt-module + Vuetify 3 theme). P5 sibling `LastTransactionCell.vue` migrated (imported here). The parent that mounts this dialog (comparison page / main items table) must already pass **Vuetify 3 header objects** `{ title, key }` — this component filters and reads `h.key`.

**Why this file breaks:** It is a `Vue.extend` Options-API component whose entire job is a `v-model` dialog. Vue 3 changes the default `v-model` prop/event from `value`/`input` to `modelValue`/`update:modelValue`, so the getter/setter computed + `$emit('input', …)` must be rewritten (use `defineModel`). It also uses `$vuetify.breakpoint.mobile`, `v-btn … text`, `v-card dark`, and a `compareHeaders` computed that filters headers by the removed `h.value` field (V3 uses `h.key`). Converting to `<script setup>` is required so `useDisplay()` is available (there is no `$vuetify` proxy in V3 Options components without extra plumbing).

**Steps:**

- [ ] Step 1: Convert the `v-model` contract and drop `$vuetify.breakpoint` in the template. The dialog binds `v-model="dialog"` and `:fullscreen="$vuetify.breakpoint.mobile"`.

  BEFORE:
  ```vue
  <v-dialog
    v-model="dialog"
    max-width="90vw"
    :fullscreen="$vuetify.breakpoint.mobile"
    @click:outside="close"
  >
    <v-card dark>
  ```
  AFTER:
  ```vue
  <v-dialog
    v-model="dialog"
    max-width="90vw"
    :fullscreen="mobile"
    @click:outside="close"
  >
    <v-card>
  ```
  (`v-model="dialog"` stays; `dialog` is now a `defineModel` ref — see Step 5. `v-card dark` → `<v-card>`, darkness comes from the V3 theme config.)

- [ ] Step 2: Migrate the close `v-btn` to the `variant` prop. Vuetify 3 removed the boolean `text` attr.

  BEFORE:
  ```vue
  <v-btn color="primary" text @click="close">Close</v-btn>
  ```
  AFTER:
  ```vue
  <v-btn color="primary" variant="text" @click="close">Close</v-btn>
  ```
  (The header close button `<v-btn icon @click="close"><v-icon>mdi-close</v-icon></v-btn>` is valid in V3 — `icon` as a boolean with a `<v-icon>` in the default slot still renders an icon button. Leave it unchanged.)

- [ ] Step 3: Leave the `v-data-table` element and its per-column slots as-is — they are already V3-compatible. Confirm no change to:
  ```vue
  <v-data-table
    :headers="compareHeaders"
    :items="items"
    hide-default-footer
    class="elevation-1"
  >
    <template #item.item_name="{ item }"> … </template>
    <template #item.market.buyAvg="{ item }"> {{ fixPrice(item.market.buyAvg) }} </template>
    <template #item.market.sellAvg="{ item }"> {{ fixPrice(item.market.sellAvg) }} </template>
    <template #item.market.avg_price="{ item }"> {{ fixPrice(item.market.avg_price) }} </template>
    <template #item.market.last_completed="{ item }">
      <LastTransactionCell :last-completed="item.market.last_completed" />
    </template>
  </v-data-table>
  ```
  `#item.<key>` slot names are unchanged in V3 and match on the header `key`. `hide-default-footer` is still valid. No template edit needed here — the header *shape* is fixed in Step 6, not the slots. (Keep the `no_link white--text` anchor classes as-is; `white--text` is a Vuetify 2 helper but it is only a color class and the parent app CSS / `white--text` shim is handled globally — do not invent a replacement here.)

- [ ] Step 4: Replace the `<script lang="ts">` `Vue.extend(...)` block header with `<script setup lang="ts">` and the import.

  BEFORE:
  ```ts
  import Vue from 'vue';
  import LastTransactionCell from './LastTransactionCell.vue';

  export default Vue.extend({
    name: 'ItemComparison',
    components: {
      LastTransactionCell,
    },
  ```
  AFTER:
  ```ts
  import { computed } from 'vue';
  import { useDisplay } from 'vuetify';
  import LastTransactionCell from './LastTransactionCell.vue';

  const { mobile } = useDisplay();
  ```
  (Nuxt auto-imports components, but an explicit import of a sibling component in `<script setup>` is fine and keeps the reference unambiguous. `name:` and the `components:` option are dropped — not needed in `<script setup>`.)

- [ ] Step 5: Port props + the `dialog` v-model computed. The old `value` prop + `input` event become `defineModel`; `items`/`headers` become `defineProps`.

  BEFORE:
  ```ts
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
    headers: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    dialog: {
      get(): boolean {
        return this.value
      },
      set(val: boolean) {
        this.$emit('input', val)
      },
    },
  ```
  AFTER:
  ```ts
  const dialog = defineModel<boolean>({ required: true });

  const props = defineProps<{
    items?: any[];
    headers?: { title: string; key: string; [k: string]: any }[];
  }>();
  ```
  `defineModel` replaces the `value` prop + `get`/`set` computed AND updates the Vue 3 v-model wiring (`modelValue` / `update:modelValue`) automatically. **The parent must be updated in its own task to keep `v-model="…"` on `<ItemComparison>` — the emitted event is now `update:modelValue`, not `input`.** Since `items`/`headers` use `default: () => []`, reference them defensively as `props.items ?? []` where iterated (the template `:items="items"` → `:items="props.items ?? []"`).

- [ ] Step 6: Port the `compareHeaders` computed, switching the filter key from V2 `h.value` to V3 `h.key`.

  BEFORE:
  ```ts
  compareHeaders(): any[] {
    const allowed = [
      'item_name',
      'market.buy',
      'market.sell',
      'market.buyAvg',
      'market.sellAvg',
      'market.avg_price',
      'market.last_completed',
      'market.diff',
      'market.volume',
    ]
    return (this.headers as any[]).filter((h) => allowed.includes(h.value))
  },
  ```
  AFTER:
  ```ts
  const compareHeaders = computed(() => {
    // The parent hands us the full main-table header set. Drop the columns this
    // dialog has no cell slot for: tags/priceUpdate/drops.
    const allowed = [
      'item_name',
      'market.buy',
      'market.sell',
      'market.buyAvg',
      'market.sellAvg',
      'market.avg_price',
      'market.last_completed',
      'market.diff',
      'market.volume',
    ];
    return (props.headers ?? []).filter((h) => allowed.includes(h.key));
  });
  ```
  (The `allowed` values are column keys — they are identical between V2 and V3 because the parent's `value` becomes `key` with the SAME string. Only the property read on `h` changes: `h.value` → `h.key`.)

- [ ] Step 7: Port `close()` and `fixPrice()` to plain functions (no `this`).

  BEFORE:
  ```ts
  methods: {
    close() {
      this.$emit('input', false)
    },
    fixPrice(price: number) {
      if (!price) return 0
      return Math.round(price * 100) / 100
    },
  },
  ```
  AFTER:
  ```ts
  function close() {
    dialog.value = false;
  }

  function fixPrice(price: number) {
    if (!price) return 0;
    return Math.round(price * 100) / 100;
  }
  ```
  (`this.$emit('input', false)` → set the `defineModel` ref to `false`, which emits `update:modelValue`. `<template #item.item_name>` still calls `fixPrice(...)` for the price columns.)

- [ ] Step 8: Update the template `:items` binding to the defensive default from Step 5.

  BEFORE:
  ```vue
  <v-data-table :headers="compareHeaders" :items="items" hide-default-footer class="elevation-1">
  ```
  AFTER:
  ```vue
  <v-data-table :headers="compareHeaders" :items="props.items ?? []" hide-default-footer class="elevation-1">
  ```

- [ ] Step 9: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/components/ItemComparison.vue` (verify `useDisplay` import resolves from `vuetify` and `defineModel`/`defineProps` generics compile).

- [ ] Step 10: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Open the page that renders the main items table (e.g. `/comparison` or the index table), select items, and trigger the "Item Comparison" dialog. Expect: dialog opens (and goes fullscreen on a narrow viewport via `mobile`), the filtered columns render, thumbnails + market.warframe.market links resolve, `LastTransactionCell` shows prices, "Close" and the X button both dismiss it, and zero console errors. Screenshot-diff the open dialog vs the old app's same dialog (close match; accept V3 default spacing/density shifts).

- [ ] Step 11: Commit: `git add app-next/app/components/ItemComparison.vue && git commit -m "feat(migration): port ItemComparison dialog to Vue 3 / Vuetify 3"`

---

### Task P5.7: Migrate DropLocationsDialog.vue to script setup + Vue 3 v-model + $fetch

**Files:**
- Create: app-next/app/components/DropLocationsDialog.vue
- Delete/superseded: app/components/DropLocationsDialog.vue (reference only; old app stays until cutover)

**Depends on:** P0 (runtimeConfig.public.apiURL), P1 (Vuetify 3 module: v-dialog/v-icon), P3 ($fetch replacing @nuxtjs/axios). Consumed by P5 pages star-chart.vue and relic/[relic].vue (both bind `v-model="dropsDialog"` :item-name="dropsItem" — unchanged by this task).

**Notes:** This component does data fetching (`load()` via `$axios`/`$config`), so it is NOT purely presentational — convert to `<script setup lang="ts">`. The `<template>` HTML/CSS (BEM `.dld*` classes, skeleton, chips) and `<style scoped>` are pure and carried over VERBATIM. Only the `v-dialog` binding line and the whole `<script>` change. `v-icon` with slot text / `size` / `color` props is still valid in Vuetify 3 — leave every `<v-icon>` untouched.

**Steps:**

- [ ] Step 1: Convert the `v-dialog` v-model + drop `dark`. BEFORE:
```html
  <v-dialog
    :value="value"
    max-width="760"
    scrollable
    dark
    content-class="dld-dialog"
    @input="$emit('input', $event)"
  >
```
AFTER (Vuetify 3 uses `model-value`/`update:model-value`; `dark` removed — the panel is already hard-styled dark via `.dld` CSS):
```html
  <v-dialog
    :model-value="modelValue"
    max-width="760"
    scrollable
    content-class="dld-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
```
(No other template line changes. `@click="close"`, `@click="load"`, all `.dld*` markup, and every `<v-icon>` stay exactly as-is.)

- [ ] Step 2: Replace the entire Options-API `<script lang="ts">` block. BEFORE (full block):
```html
<script lang="ts">
export default {
  name: 'DropLocationsDialog',
  props: {
    value: { type: Boolean, default: false },
    itemName: { type: String, default: '' },
  },
  data() {
    return {
      loading: false,
      error: false,
      data: { missions: [], relics: [], itemName: '' } as any,
      lastLoaded: '',
    }
  },
  computed: {
    hasResults(): boolean {
      return !!(this.data && (this.data.missions.length || this.data.relics.length))
    },
    externalLink(): string {
      let s = '^' + (this.itemName || '')
      if (s.includes('(')) s = s.split('(')[0].trim()
      if (s.includes('Set')) s = s.replace('Set', '').trim()
      return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
    },
  },
  watch: {
    value(open: boolean) {
      if (open && this.itemName && this.itemName !== this.lastLoaded) this.load()
    },
    itemName(name: string) {
      if (this.value && name && name !== this.lastLoaded) this.load()
    },
  },
  methods: {
    close() {
      this.$emit('input', false)
    },
    async load() {
      const name = this.itemName
      if (!name) return
      this.loading = true
      this.error = false
      try {
        const url = `${this.$config.apiURL}/drops/item/${encodeURIComponent(name)}`
        const res = await this.$axios.get(url)
        this.data = res.data || { missions: [], relics: [] }
        this.lastLoaded = name
      } catch (e) {
        this.error = true
      } finally {
        this.loading = false
      }
    },
    fmt(n: number): string {
      const v = Number(n) || 0
      return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
    },
    rarityColor(rarity: string): string {
      const r = (rarity || '').toLowerCase()
      if (r === 'legendary') return '#35d6d0'
      if (r === 'rare') return '#e7cf95'
      if (r === 'uncommon') return '#b6c0cc'
      return '#c08457'
    },
  },
}
</script>
```
AFTER (`<script setup lang="ts">`; `value`→`modelValue`, emit `input`→`update:modelValue`, `this.$config.apiURL`→`useRuntimeConfig().public.apiURL`, `this.$axios.get(url)` [which returned `res.data`]→`$fetch(url)` [returns the body directly]):
```html
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface DropData {
  missions: any[]
  relics: any[]
  itemName?: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    itemName?: string
  }>(),
  { modelValue: false, itemName: '' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const config = useRuntimeConfig()
const base = config.public.apiURL

const loading = ref(false)
const error = ref(false)
const data = ref<DropData>({ missions: [], relics: [], itemName: '' })
const lastLoaded = ref('')

const hasResults = computed(
  () => !!(data.value && (data.value.missions.length || data.value.relics.length)),
)
const externalLink = computed(() => {
  let s = '^' + (props.itemName || '')
  if (s.includes('(')) s = s.split('(')[0].trim()
  if (s.includes('Set')) s = s.replace('Set', '').trim()
  return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
})

function close() {
  emit('update:modelValue', false)
}

async function load() {
  const name = props.itemName
  if (!name) return
  loading.value = true
  error.value = false
  try {
    const res = await $fetch<DropData>(`${base}/drops/item/${encodeURIComponent(name)}`)
    data.value = res || { missions: [], relics: [], itemName: '' }
    lastLoaded.value = name
  } catch (e) {
    error.value = true
  } finally {
    loading.value = false
  }
}

function fmt(n: number): string {
  const v = Number(n) || 0
  return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
}

function rarityColor(rarity: string): string {
  const r = (rarity || '').toLowerCase()
  if (r === 'legendary') return '#35d6d0'
  if (r === 'rare') return '#e7cf95'
  if (r === 'uncommon') return '#b6c0cc'
  return '#c08457'
}

watch(
  () => props.modelValue,
  (open) => {
    if (open && props.itemName && props.itemName !== lastLoaded.value) load()
  },
)
watch(
  () => props.itemName,
  (name) => {
    if (props.modelValue && name && name !== lastLoaded.value) load()
  },
)
</script>
```
(Template still references `loading`, `error`, `data.missions`, `data.relics`, `hasResults`, `externalLink`, `fmt`, `rarityColor`, `load`, `close` — all exposed automatically by `<script setup>`. `data.value` unwrapping in template is automatic.)

- [ ] Step 3: Copy the `<style scoped>` block (lines 171-360) VERBATIM — no Vuetify-2 selectors inside, pure `.dld*` BEM + keyframes, nothing to change.

- [ ] Step 4: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (verify `$fetch`/`useRuntimeConfig` auto-imports resolve and `defineProps`/`defineEmits` typecheck clean).

- [ ] Step 5: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`. Load `/star-chart` (or `/relic/<some-relic>`), trigger the drop-locations dialog (the control that sets `dropsItem` + opens `dropsDialog`); expect the dialog opens, shows the skeleton then real mission/relic drop sections (data from `${apiURL}/drops/item/<name>`), close button + retry work, "Open full data" link points at drops.warframestat.us; zero console errors; screenshot-diff the open dialog vs old app same action (close — Vuetify 3 default overlay spacing may differ slightly).

- [ ] Step 6: Commit: `git add app-next/app/components/DropLocationsDialog.vue && git commit -m "feat(p5): migrate DropLocationsDialog to Vue 3 script setup + \$fetch"`

---

### Task P5.8: Migrate home page (item market table) to Vue 3 / Vuetify 3

**Files:**
- Create: app-next/app/pages/index.vue
- Delete/superseded: app/pages/index.vue (reference only; old app stays until cutover)

**Depends on:**
- P0 infra: nuxt.config.ts (vuetify-nuxt-module, @pinia/nuxt, i18n v9, `runtimeConfig.public.apiURL`)
- P3 Pinia store: app-next/app/stores/items.ts (`useItemsStore` with `allItems` getter)
- P4 components (already ported/registered via auto-import): GitHubButton, GitHubShare, ItemComparison, LastTransactionCell, PriceHistoryChart, TradeMessageButtons

**Steps:**

- [ ] Step 1: Replace the whole `<script lang="ts">` Options-API block header (imports + `Vue.extend` + `components` + `data`) with a `<script setup lang="ts">` head. This file HAS asyncData-equivalent state (`head()`, Vuex, `$axios`) so it converts to `<script setup>`. Components are auto-imported in Nuxt 4, so drop the `components` map entirely.

  BEFORE:
  ```ts
  <script lang="ts">
  import moment from 'moment';
  import Vue from 'vue';
  import { mapGetters } from 'vuex';

  export default Vue.extend({
    name: 'HomePage',
    components: {
      GitHubButton: () => import('../components/GitHubButton.vue'),
      GitHubShare: () => import('../components/GitHubShare.vue'),
      ItemComparison: () => import('../components/ItemComparison.vue'),
      LastTransactionCell: () => import('../components/LastTransactionCell.vue'),
      PriceHistoryChart: () => import('../components/PriceHistoryChart.vue'),
      TradeMessageButtons: () => import('../components/TradeMessageButtons.vue'),
    },
    data() {
      return {
        all_items: [],
        min_volume: 0,
        search: '',
        avgPrice: false,
        selection: 'All',
        hasScroll: false,
        scrollWidth: 0,
        includedTags: [],
        excludedTags: [],
        tagLogic: 'AND',
        selectedItems: [],
        compareDialog: false,
        sortBy: ['market.volume'],
        sortDesc: [true],
        multiSort: false,
        transactionDialog: false,
        selectedTransactionItem: null,
        priceHistoryPoints: [],
        priceHistoryTrend: null,
        priceHistoryLoading: false,
      }
    },
  ```

  AFTER:
  ```ts
  <script setup lang="ts">
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { useGoTo } from 'vuetify'

  dayjs.extend(relativeTime)

  const config = useRuntimeConfig()
  const base = config.public.apiURL
  const { t, locale } = useI18n()
  const goTo = useGoTo()

  const items = useItemsStore()
  const allItems = computed<any[]>(() => items.allItems)

  const all_items = ref<any[]>([])
  const min_volume = ref(0)
  const search = ref('')
  const avgPrice = ref(false)
  const selection = ref('All')
  const hasScroll = ref(false)
  const scrollWidth = ref<string | number>(0)
  const includedTags = ref<string[]>([])
  const excludedTags = ref<string[]>([])
  const tagLogic = ref('AND')
  const selectedItems = ref<any[]>([])
  const compareDialog = ref(false)
  // Vuetify 3 merges sort-by + sort-desc into ONE model of { key, order } objects.
  const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([
    { key: 'market.volume', order: 'desc' },
  ])
  const multiSort = ref(false)
  const transactionDialog = ref(false)
  const selectedTransactionItem = ref<any>(null)
  const priceHistoryPoints = ref<any[]>([])
  const priceHistoryTrend = ref<any>(null)
  const priceHistoryLoading = ref(false)

  // template refs (were this.$refs.*)
  const wrapper2 = ref<HTMLElement | null>(null)
  ```
  Note: `sortDesc` is GONE — its `true` is folded into `order: 'desc'` above.

- [ ] Step 2: Port `head()`. Old used the nuxt-i18n helper `this.$nuxtI18nHead`; i18n v9 exposes `useLocaleHead`.

  BEFORE:
  ```ts
  head() {
    return this.$nuxtI18nHead({
      addSeoAttributes: true,
    })
  },
  ```
  AFTER (top-level in `<script setup>`):
  ```ts
  useHead(useLocaleHead({ addSeoAttributes: true }))
  ```
  If the installed @nuxtjs/i18n build errors on `addSeoAttributes`, use `useLocaleHead({ seo: true })` (renamed key) — same output.

- [ ] Step 3: Port the `availableTags` computed. `mapGetters` is gone; read the Pinia getter via `allItems.value`.

  BEFORE:
  ```ts
  computed: {
    ...mapGetters({
      allItems: 'all_items',
    }),
    availableTags() {
      const tags = new Set()
      this.allItems.forEach(item => {
        if (item.tags) item.tags.forEach(tag => tags.add(tag))
      })
      return Array.from(tags).sort().map(tag => ({
        text: this.formatTag(tag),
        value: tag,
      }))
    }
  },
  ```
  AFTER:
  ```ts
  const availableTags = computed(() => {
    const tags = new Set<string>()
    allItems.value.forEach((item: any) => {
      if (item.tags) item.tags.forEach((tag: string) => tags.add(tag))
    })
    // item-title reads `text`, item-value matches `value` (see v-autocomplete edit)
    return Array.from(tags).sort().map((tag) => ({
      text: formatTag(tag),
      value: tag,
    }))
  })
  ```

- [ ] Step 4: Port the `headers` builder. `getHeaders()` returns Vuetify-2 `{ text, value }` header objects — convert to Vuetify-3 `{ title, key }`. It depends on `avgPrice`, so make it a `computed`. Custom `sort` compare fn stays valid in V3.

  BEFORE (method):
  ```ts
  getHeaders() {
    const toReturn = [
      { text: 'Name', value: 'item_name', width: 'auto' },
      { text: 'Buy (live listing)', value: 'market.buy', width: 'auto' },
      { text: 'Sell (live listing)', value: 'market.sell', width: 'auto' },
      { text: 'Avg Sold (48h)', value: 'market.avg_price', width: 'auto' },
      {
        text: 'Latest 48h Trades',
        value: 'market.last_completed',
        width: 'auto',
        sort: (a, b) => {
          const priceA = a ? a.avg_price : -1;
          const priceB = b ? b.avg_price : -1;
          return priceA - priceB;
        },
      },
      { text: 'Diff', value: 'market.diff', width: 'auto' },
      { text: 'Volume (Last 48hrs)', value: 'market.volume', width: 'auto' },
      { text: 'Tags', value: 'tags' },
      { text: 'Updated', value: 'priceUpdate' },
      { text: 'Drops', value: 'drops' },
    ]
    if (this.avgPrice) {
      toReturn[1] = { text: 'Buy (live avg)', value: 'market.buyAvg', width: 'auto' }
      toReturn[2] = { text: 'Sell (live avg)', value: 'market.sellAvg', width: 'auto' }
    }
    return toReturn
  },
  ```
  AFTER (computed):
  ```ts
  const headers = computed(() => {
    const toReturn: any[] = [
      { title: 'Name', key: 'item_name', width: 'auto' },
      { title: 'Buy (live listing)', key: 'market.buy', width: 'auto' },
      { title: 'Sell (live listing)', key: 'market.sell', width: 'auto' },
      { title: 'Avg Sold (48h)', key: 'market.avg_price', width: 'auto' },
      {
        title: 'Latest 48h Trades',
        key: 'market.last_completed',
        width: 'auto',
        sort: (a: any, b: any) => {
          const priceA = a ? a.avg_price : -1
          const priceB = b ? b.avg_price : -1
          return priceA - priceB
        },
      },
      { title: 'Diff', key: 'market.diff', width: 'auto' },
      { title: 'Volume (Last 48hrs)', key: 'market.volume', width: 'auto' },
      { title: 'Tags', key: 'tags' },
      { title: 'Updated', key: 'priceUpdate' },
      { title: 'Drops', key: 'drops' },
    ]
    if (avgPrice.value) {
      toReturn[1] = { title: 'Buy (live avg)', key: 'market.buyAvg', width: 'auto' }
      toReturn[2] = { title: 'Sell (live avg)', key: 'market.sellAvg', width: 'auto' }
    }
    return toReturn
  })
  ```

- [ ] Step 5: Port the watchers. `avgPrice`/`multiSort` now operate on the single `[{key,order}]` model (remap `.key`; trimming slices the same array). `tagLogic`/`includedTags`/`excludedTags` still call `filter()`.

  BEFORE:
  ```ts
  watch: {
    includedTags() { this.filter() },
    excludedTags() { this.filter() },
    tagLogic() { this.filter() },
    avgPrice(val) {
      this.sortBy = this.sortBy.map(key => {
        if (val) {
          if (key === 'market.buy') return 'market.buyAvg'
          if (key === 'market.sell') return 'market.sellAvg'
        } else {
          if (key === 'market.buyAvg') return 'market.buy'
          if (key === 'market.sellAvg') return 'market.sell'
        }
        return key
      })
    },
    multiSort(val) {
      if (!val && this.sortBy.length > 1) {
        this.sortBy = this.sortBy.slice(0, 1)
        this.sortDesc = this.sortDesc.slice(0, 1)
      }
    }
  },
  ```
  AFTER:
  ```ts
  watch(includedTags, () => filter())
  watch(excludedTags, () => filter())
  watch(tagLogic, () => filter())

  watch(avgPrice, (val) => {
    sortBy.value = sortBy.value.map((s) => {
      const key = s.key
      let next = key
      if (val) {
        if (key === 'market.buy') next = 'market.buyAvg'
        else if (key === 'market.sell') next = 'market.sellAvg'
      } else {
        if (key === 'market.buyAvg') next = 'market.buy'
        else if (key === 'market.sellAvg') next = 'market.sell'
      }
      return { ...s, key: next }
    })
  })

  watch(multiSort, (val) => {
    if (!val && sortBy.value.length > 1) {
      sortBy.value = sortBy.value.slice(0, 1)
    }
  })
  ```

- [ ] Step 6: Port `openTransactionDetails` — drop `$axios`/`$config`, use `$fetch` (returns the body directly, no `.data`).

  BEFORE:
  ```ts
  async openTransactionDetails(item) {
    this.selectedTransactionItem = item;
    this.transactionDialog = true;
    this.priceHistoryPoints = [];
    this.priceHistoryTrend = null;
    if (!item.url_name) return;
    this.priceHistoryLoading = true;
    try {
      const data = await this.$axios
        .get(`${this.$config.apiURL}/price_history/${item.url_name}`)
        .then((r) => r.data);
      this.priceHistoryPoints = data.points || [];
      this.priceHistoryTrend = data.trend || null;
    } catch (e) {
      this.priceHistoryPoints = [];
    } finally {
      this.priceHistoryLoading = false;
    }
  },
  ```
  AFTER:
  ```ts
  async function openTransactionDetails(item: any) {
    selectedTransactionItem.value = item
    transactionDialog.value = true
    priceHistoryPoints.value = []
    priceHistoryTrend.value = null
    if (!item.url_name) return
    priceHistoryLoading.value = true
    try {
      const data: any = await $fetch(`${base}/price_history/${item.url_name}`)
      priceHistoryPoints.value = data.points || []
      priceHistoryTrend.value = data.trend || null
    } catch (e) {
      priceHistoryPoints.value = []
    } finally {
      priceHistoryLoading.value = false
    }
  }
  ```

- [ ] Step 7: Port the remaining LIVE methods as plain functions, dropping `this.`. Keep exactly: `fixPrice`, `formatTag`, `fixDate` (moment->dayjs), `getLink`, `addTagToFilter`, `clearTags`, `reset`, `filterSelect`, `filter`, `row_classes`, `finishLoading`, `setScrollBar`. DELETE the dead currency-app leftovers not referenced anywhere in the template or lifecycle: `changeCode`, `formatNumber`, `hideFeedback`, `hideWidgets`, `fixTitle`, `capitalize`, `install_app`, `get_text`, `getColor`, `formatMoney`, `plusUy` (they reference undefined state like `this.items`/`this.code`/`this.amount`/`this.day`).

  BEFORE (representative):
  ```ts
  fixPrice(price: number) {
    if (!price) return 0
    return Math.round(price * 100) / 100
  },
  fixDate(date) {
    return moment(date).fromNow()
  },
  reset() {
    this.selection = 'All'
    this.search = ''
    this.min_volume = 0
    this.includedTags = []
    this.excludedTags = []
    this.tagLogic = 'AND'
    this.selectedItems = []
    this.all_items = this.allItems
  },
  filter() {
    this.all_items = this.allItems.filter((el) => { /* ...unchanged body... */ })
  },
  row_classes(item) {
    if (item.isInterBank) return 'purple darken-4'
    if (item.condition) return 'grey darken-3'
    return ''
  },
  ```
  AFTER (representative — same logic, refs + V3 color class names in `row_classes`):
  ```ts
  function fixPrice(price: number) {
    if (!price) return 0
    return Math.round(price * 100) / 100
  }
  function formatTag(tag: string) {
    if (!tag) return ''
    return tag.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  function fixDate(date: any) {
    return dayjs(date).fromNow()
  }
  function getLink(name: string) {
    let s = '^' + name
    if (s.includes('(')) s = s.split('(')[0].trim()
    if (s.includes('Set')) s = s.replace('Set', '').trim()
    return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
  }
  function addTagToFilter(tag: string) {
    if (includedTags.value.includes(tag)) {
      includedTags.value = includedTags.value.filter((tt) => tt !== tag)
    } else {
      includedTags.value.push(tag)
    }
    filter()
  }
  function clearTags() {
    includedTags.value = []
    excludedTags.value = []
    tagLogic.value = 'AND'
  }
  function reset() {
    selection.value = 'All'
    search.value = ''
    min_volume.value = 0
    includedTags.value = []
    excludedTags.value = []
    tagLogic.value = 'AND'
    selectedItems.value = []
    all_items.value = allItems.value
  }
  function filterSelect(el: any) {
    const sel = selection.value
    let val = true
    switch (sel) {
      case 'Warframe':
        val = el.set === true && el.item_name.includes(' Set') &&
          (el.tags.includes('component') || el.tags.includes('blueprint')) &&
          el.tags.includes('warframe'); break
      case 'Arcane': val = el.tags.includes('arcane_enhancement'); break
      case 'Weapon':
        val = (el.set === true && el.item_name.includes(' Set') && el.tags.includes('weapon')) ||
          (el.tags.includes('weapon') && el.tags.length === 2 && !el.tags.includes('component')); break
      case 'Sentinel': val = el.tags.includes('sentinel') && el.item_name.includes(' Set'); break
      case 'Imprint': val = el.item_name.includes('Imprint'); break
      case 'Mod': val = el.tags.includes('mod'); break
      case 'Relic': val = el.tags.includes('relic'); break
      default: break
    }
    return val
  }
  function filter() {
    all_items.value = allItems.value.filter((el: any) => {
      const basicMatch = el.market.volume >= min_volume.value &&
        filterSelect(el) &&
        (!search.value || el.item_name.toLowerCase().includes(search.value.toLowerCase()))
      if (!basicMatch) return false
      const itemTags = el.tags || []
      if (excludedTags.value.length > 0) {
        if (excludedTags.value.some((tag) => itemTags.includes(tag))) return false
      }
      if (includedTags.value.length > 0) {
        if (tagLogic.value === 'AND') {
          if (!includedTags.value.every((tag) => itemTags.includes(tag))) return false
        } else {
          if (!includedTags.value.some((tag) => itemTags.includes(tag))) return false
        }
      }
      return true
    })
  }
  function row_classes(item: any) {
    if (item.isInterBank) return 'bg-purple-darken-4'
    if (item.condition) return 'bg-grey-darken-3'
    return ''
  }
  // V3 replaces item-class with row-props
  function rowProps({ item }: { item: any }) {
    return { class: row_classes(item) }
  }
  function onPageUpdate() {
    goTo('.money_table')
  }
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  ```

- [ ] Step 8: Port `setScrollBar` (the manual dual-scrollbar DOM hack). Vuetify 3 renamed the table scroll wrapper class `.v-data-table__wrapper` -> `.v-table__wrapper`; `.v-data-table--mobile` is unchanged. Replace `this.$refs.wrapper2` with the `wrapper2` ref and `this.$nextTick`/`this.hasScroll`/`this.scrollWidth` with refs.

  BEFORE (the class-name + refs lines that change):
  ```ts
  const tableWrapper = document.querySelector('.money_table .v-data-table__wrapper')
  ...
  const isMobile = document.querySelector('.money_table.v-data-table--mobile')
  this.hasScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth
  ...
  wrapper1 = document.querySelector('.money_table .v-data-table__wrapper')
  wrapper2 = this.$refs.wrapper2
  ...
  this.scrollWidth = table.clientWidth + 10 + 'px'
  ```
  AFTER:
  ```ts
  function setScrollBar() {
    const tableWrapper = document.querySelector('.money_table .v-table__wrapper') as HTMLElement | null
    if (!tableWrapper) { nextTick(() => setScrollBar()); return }
    const isMobile = document.querySelector('.money_table.v-data-table--mobile')
    hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
    let wp1: any = null, wp2: any = null
    let wrapper1: any = null, w2: any = null
    if (hasScroll.value && !isMobile) {
      wrapper1 = document.querySelector('.money_table .v-table__wrapper')
      w2 = wrapper2.value
      if (!w2 || !wrapper1) { nextTick(() => setScrollBar()); return }
      const table = document.querySelector('.money_table table') as HTMLElement
      scrollWidth.value = table.clientWidth + 10 + 'px'
      let scrolling = false
      wp1 = function () { if (scrolling) { scrolling = false; return true } scrolling = true; w2.scrollLeft = wrapper1.scrollLeft }
      wp2 = function () { if (scrolling) { scrolling = false; return true } scrolling = true; wrapper1.scrollLeft = w2.scrollLeft }
      wrapper1.addEventListener('scroll', wp1)
      w2.addEventListener('scroll', wp2)
    }
    addEventListener('resize', () => {
      if (wrapper1) { wrapper1.removeEventListener('scroll', wp1); w2.removeEventListener('scroll', wp2) }
      setScrollBar()
    }, { once: true })
  }
  ```
  Note: `.v-table__wrapper` only exists once the table's `client-only` content is mounted; the `nextTick` retry already covers that.

- [ ] Step 9: Port the lifecycle. Old `beforeMount(){ this.beforeMount() }` calls a same-named method that seeds `all_items` + hides the spinner + wires the PWA prompt; `mounted()` installs `startLoading`/`stopLoading` and calls `setScrollBar`. Fold both into `onMounted` (the spinner MUST be hidden on mount per project rule).

  BEFORE:
  ```ts
  beforeMount() { this.beforeMount() },
  mounted() {
    ;(window as any).startLoading = () => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display = 'flex' }
    ;(window as any).stopLoading = () => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display = 'none' }
    this.setScrollBar()
  },
  // ...method:
  beforeMount() {
    let pwaInstall = false
    try { if (!window.matchMedia('(display-mode: standalone)').matches) pwaInstall = true } catch (e) { console.error(e) }
    if (pwaInstall) {
      ;(window as any).deferredPrompt = null
      window.addEventListener('beforeinstallprompt', (e) => { ;(window as any).deferredPrompt = e; if (e !== null) this.show_install = true })
    }
    this.all_items = this.allItems
    this.finishLoading()
  },
  ```
  AFTER:
  ```ts
  onMounted(() => {
    ;(window as any).startLoading = () => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display = 'flex' }
    ;(window as any).stopLoading = () => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display = 'none' }
    try {
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        ;(window as any).deferredPrompt = null
        window.addEventListener('beforeinstallprompt', (e: any) => { ;(window as any).deferredPrompt = e })
      }
    } catch (e) { console.error(e) }
    all_items.value = allItems.value
    finishLoading()
    setScrollBar()
  })
  ```
  Note: dropped `this.show_install` (undefined in this component — dead) and the `capitalize`/`$i18n.locale` path (its method was dead code). `locale` is still destructured for any residual template use; if typecheck flags it unused, remove it.

- [ ] Step 10: Fix the `<v-data-table>` root props. Convert `.sync` sort bindings to the single `v-model:sort-by`, `item-key`->`item-value` + `return-object`, `:item-class`->`:row-props`, `:headers="getHeaders()"`->`:headers="headers"`, and `$vuetify.goTo` -> `onPageUpdate`.

  BEFORE:
  ```html
  <v-data-table
    ref="dataTable"
    color="#f5f5f5"
    show-select
    item-key="url_name"
    v-model="selectedItems"
    :multi-sort="multiSort"
    :sort-by.sync="sortBy"
    :sort-desc.sync="sortDesc"
    :item-class="row_classes"
    :headers="getHeaders()"
    :items="all_items"
    :footer-props="{ 'items-per-page-options': [10, 20, 30, 40, 50] }"
    :items-per-page="50"
    class="elevation-1 money_table"
    @update:page="$vuetify.goTo($refs.dataTable)"
  >
  ```
  AFTER:
  ```html
  <v-data-table
    show-select
    return-object
    item-value="url_name"
    v-model="selectedItems"
    :multi-sort="multiSort"
    v-model:sort-by="sortBy"
    :row-props="rowProps"
    :headers="headers"
    :items="all_items"
    :items-per-page="50"
    :items-per-page-options="[10, 20, 30, 40, 50]"
    class="elevation-1 money_table"
    @update:page="onPageUpdate"
  >
  ```
  Note: `color="#f5f5f5"` and the `ref="dataTable"` are dropped (`color` is not a v-data-table prop in V3; the ref was only used by the old `$vuetify.goTo`). `footer-props` is replaced by the top-level `:items-per-page-options`.

- [ ] Step 11: Rewrite the `#top` slot. V3's top slot no longer receives `{ pagination, options, updateOptions }`, and `<v-data-footer>` is REMOVED. Keep the filter UI; drop the manually-rendered top footer (the default bottom footer/pagination remains). Wrap the filter block in `<v-theme-provider theme="dark">` to preserve the dark filter look after removing `dark` attrs.

  BEFORE (slot signature + the removed footer):
  ```html
  <template #top="{ pagination, options, updateOptions }">
    <div>
      <div v-show="hasScroll" id="wrapper2" ref="wrapper2" class="scroll-style-1">
        <div id="div2" :style="{ width: scrollWidth }" class="width-scroll"></div>
      </div>
    </div>
    <div>
      <div class="filter-container pa-3 white--text">
        ...filters...
      </div>
      <v-data-footer
        :pagination="pagination"
        :options="options"
        items-per-page-text="$vuetify.dataTable.itemsPerPageText"
        @update:options="updateOptions"
      />
    </div>
  </template>
  ```
  AFTER (signature + the deleted footer):
  ```html
  <template #top>
    <div>
      <div v-show="hasScroll" id="wrapper2" ref="wrapper2" class="scroll-style-1">
        <div id="div2" :style="{ width: scrollWidth }" class="width-scroll"></div>
      </div>
    </div>
    <v-theme-provider theme="dark" with-background>
      <div class="filter-container pa-3 text-white">
        ...filters (see Step 12 edits)...
      </div>
    </v-theme-provider>
  </template>
  ```
  Accepted shift: the duplicated pagination bar that used to sit ABOVE the table is gone; pagination now shows only in the default footer below the table.

- [ ] Step 12: Convert the filter form controls inside the slot. `dense`->`density="compact"`, drop every `dark` attr (covered by the theme-provider), `item-text`->`item-title`, expansion panel header/content tags, `small` sizes, `row`->`inline`, chip props, and helper color classes. The `:items="allItems.map((el) => el.item_name)"` binding is unchanged (works against the computed ref in template).

  BEFORE (representative controls):
  ```html
  <v-text-field v-model="min_volume" dark type="number" class="filter-input mr-2" label="Min Volume" hide-details dense></v-text-field>
  <v-combobox v-model="search" label="Search" class="filter-input mr-2" dark :items="allItems.map((el) => el.item_name)" hide-details dense></v-combobox>
  ...
  <v-expansion-panels class="mt-2 mb-2 transparent" flat dark>
    <v-expansion-panel class="transparent">
      <v-expansion-panel-header>Advanced Filters (Tags & Logic)</v-expansion-panel-header>
      <v-expansion-panel-content>
        ...
        <v-autocomplete v-model="includedTags" :items="availableTags" item-text="text" item-value="value" label="Include Tags" multiple chips small-chips deletable-chips dark dense hide-details></v-autocomplete>
        ...
        <v-radio-group v-model="tagLogic" row dark dense hide-details class="mt-0">
        ...
        <v-btn small color="error" @click="clearTags" :disabled="includedTags.length === 0 && excludedTags.length === 0">Clear Tags</v-btn>
  ```
  AFTER:
  ```html
  <v-text-field v-model="min_volume" type="number" class="filter-input mr-2" label="Min Volume" hide-details density="compact"></v-text-field>
  <v-combobox v-model="search" label="Search" class="filter-input mr-2" :items="allItems.map((el) => el.item_name)" hide-details density="compact"></v-combobox>
  ...
  <v-expansion-panels class="mt-2 mb-2" flat>
    <v-expansion-panel>
      <v-expansion-panel-title>Advanced Filters (Tags & Logic)</v-expansion-panel-title>
      <v-expansion-panel-text>
        ...
        <v-autocomplete v-model="includedTags" :items="availableTags" item-title="text" item-value="value" label="Include Tags" multiple chips closable-chips density="compact" hide-details></v-autocomplete>
        ...
        <v-radio-group v-model="tagLogic" inline density="compact" hide-details class="mt-0">
        ...
        <v-btn size="small" color="error" @click="clearTags" :disabled="includedTags.length === 0 && excludedTags.length === 0">Clear Tags</v-btn>
  ```
  Also update the search buttons and the selected-count/checkbox bars in the same slot:
  ```html
  <!-- BEFORE -->
  <v-btn type="submit" color="primary" class="mr-2 my-1"> Search </v-btn>
  <v-btn color="primary" @click.prevent="reset" class="my-1"><v-icon>mdi-restore</v-icon></v-btn>
  ...
  <div v-if="selectedItems.length > 0" class="d-flex align-center my-2 pa-2 blue darken-4 rounded">
    <span class="white--text mr-4">{{ selectedItems.length }} items selected</span>
    <v-btn small color="white" light @click="compareDialog = true">Compare Selected</v-btn>
    <v-btn icon small color="white" class="ml-2" @click="selectedItems = []"><v-icon>mdi-close</v-icon></v-btn>
  </div>
  <div class="d-flex">
    <v-checkbox v-model="avgPrice" dark label="Average Prices (top 5 orders)" class="mr-4"></v-checkbox>
    <v-checkbox v-model="multiSort" dark label="Multi-Sort (click several column headers)"></v-checkbox>
  </div>
  <!-- AFTER -->
  <v-btn type="submit" color="primary" class="mr-2 my-1"> Search </v-btn>
  <v-btn color="primary" @click.prevent="reset" class="my-1"><v-icon>mdi-restore</v-icon></v-btn>
  ...
  <div v-if="selectedItems.length > 0" class="d-flex align-center my-2 pa-2 bg-blue-darken-4 rounded">
    <span class="text-white mr-4">{{ selectedItems.length }} items selected</span>
    <v-btn size="small" color="white" @click="compareDialog = true">Compare Selected</v-btn>
    <v-btn icon size="small" variant="text" color="white" class="ml-2" @click="selectedItems = []"><v-icon>mdi-close</v-icon></v-btn>
  </div>
  <div class="d-flex">
    <v-checkbox v-model="avgPrice" label="Average Prices (top 5 orders)" class="mr-4"></v-checkbox>
    <v-checkbox v-model="multiSort" label="Multi-Sort (click several column headers)"></v-checkbox>
  </div>
  ```
  Notes: `row`->`inline` on v-radio-group; `small-chips`/`deletable-chips`->`closable-chips`.

- [ ] Step 13: Fix the `#item.*` cell slots — slot NAMES (`#item.item_name`, `#item.market.buyAvg`, `#item.tags`, `#item.drops`, etc.) are unchanged in V3, but the inline `<v-btn small ... link>` and `<v-chip small>` need attr fixes.

  BEFORE:
  ```html
  <v-btn v-if="item.set && item.item_name.includes(' Set')" small target="_blank" link color="primary" class="mt-1" :to="'/set/' + item.url_name">Set vs Parts</v-btn>
  <v-btn v-if="item.tags.includes('relic')" small target="_blank" link color="primary" class="mt-1" :to="'/relic/' + item.url_name">Relic calculator</v-btn>
  ...
  <v-chip v-for="(tag, index) in item.tags" :key="index" small @click.stop="addTagToFilter(tag)" style="cursor: pointer" :color="includedTags.includes(tag) ? 'primary' : ''">{{ formatTag(tag) }}</v-chip>
  ```
  AFTER:
  ```html
  <v-btn v-if="item.set && item.item_name.includes(' Set')" size="small" color="primary" class="mt-1" :to="'/set/' + item.url_name">Set vs Parts</v-btn>
  <v-btn v-if="item.tags.includes('relic')" size="small" color="primary" class="mt-1" :to="'/relic/' + item.url_name">Relic calculator</v-btn>
  ...
  <v-chip v-for="(tag, index) in item.tags" :key="index" size="small" @click.stop="addTagToFilter(tag)" style="cursor: pointer" :color="includedTags.includes(tag) ? 'primary' : undefined">{{ formatTag(tag) }}</v-chip>
  ```
  Notes: `link` is dropped (a `:to` v-btn is already a link in V3); `target="_blank"` on an internal `:to` route was a no-op and is dropped; empty `color=""` -> `undefined`. The `#item.thumb` empty slot and the `LastTransactionCell`/`fixPrice`/`fixDate` slots need no structural change.

- [ ] Step 14: Fix the Transaction dialog + trailing content. `<v-simple-table dense>`->`<v-table density="compact">`; `<v-btn color="primary" text>`->`variant="text"`; `ItemComparison :headers="getHeaders()"`->`:headers="headers"`; color helper classes and `$t`->`t`; `v-icon left`->`start`, `v-icon large`->`size="large"`; `v-alert dense`->`density="compact"` and drop `dark`.

  BEFORE:
  ```html
  <ItemComparison v-model="compareDialog" :items="selectedItems" :headers="getHeaders()" />
  ...
  <v-card-title class="headline grey lighten-2">Latest 48h Trade Data</v-card-title>
  ...
  <v-simple-table dense>
    <template #default> ...tbody... </template>
  </v-simple-table>
  ...
  <v-btn color="primary" text @click="transactionDialog = false">Close</v-btn>
  ...
  <v-alert color="#ff4500" dark icon="mdi-reddit" prominent class="mt-4 mb-3">
  ...
  <v-btn href="..." target="_blank" color="white" light class="mt-2 mt-sm-0 ml-sm-4">
    <v-icon left color="#ff4500">mdi-reddit</v-icon> Join Discussion
  </v-btn>
  ...
  <v-card class="mt-4 mb-3" color="#2c2c54" dark>
    ...
    <v-icon large class="mr-3" color="white">mdi-open-source-initiative</v-icon>
    <h3>{{ $t('open_source_project') }}</h3>
    ...
    <p class="mb-3">{{ $t('github_description') }}</p>
  ...
  <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 blue darken-4" type="info" dense>
    {{ $t('disclaimer') }}
  </v-alert>
  ```
  AFTER:
  ```html
  <ItemComparison v-model="compareDialog" :items="selectedItems" :headers="headers" />
  ...
  <v-card-title class="text-h6 bg-grey-lighten-2">Latest 48h Trade Data</v-card-title>
  ...
  <v-table density="compact">
    <template #default> ...tbody... </template>
  </v-table>
  ...
  <v-btn color="primary" variant="text" @click="transactionDialog = false">Close</v-btn>
  ...
  <v-alert color="#ff4500" icon="mdi-reddit" prominent class="mt-4 mb-3">
  ...
  <v-btn href="..." target="_blank" color="white" class="mt-2 mt-sm-0 ml-sm-4">
    <v-icon start color="#ff4500">mdi-reddit</v-icon> Join Discussion
  </v-btn>
  ...
  <v-card class="mt-4 mb-3" color="#2c2c54">
    ...
    <v-icon size="large" class="mr-3" color="white">mdi-open-source-initiative</v-icon>
    <h3>{{ t('open_source_project') }}</h3>
    ...
    <p class="mb-3">{{ t('github_description') }}</p>
  ...
  <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4" type="info" density="compact">
    {{ t('disclaimer') }}
  </v-alert>
  ```
  Notes: `headline`->`text-h6`; `grey lighten-2`->`bg-grey-lighten-2`; `blue darken-4`->`bg-blue-darken-4`. `dark` on the colored `v-card`/`v-alert` is dropped; if the text no longer reads white on those surfaces, wrap the card/alert content in `<v-theme-provider theme="dark">`. The two `<v-img>` donation logos keep their `<template #sources>` slot — V3 v-img still supports it; verify the webp swap in browser.

- [ ] Step 15: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for app/pages/index.vue (watch for: `sortBy` object shape mismatch, unused `locale`, and `$fetch`/`useLocaleHead`/`useItemsStore` auto-import resolution).

- [ ] Step 16: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/`. Expect: table renders with items from the Pinia store, spinner hides, sorting (single + Multi-Sort checkbox) works, the Average-Prices toggle swaps the Buy/Sell columns AND keeps the active sort, tag include/exclude + AND/OR filtering works, row select -> "Compare Selected" opens the dialog, the "Latest 48h Trades" cell opens the transaction dialog with the price-history chart, zero console errors. Screenshot-diff vs old app `/` (close; the top pagination bar is intentionally gone).

- [ ] Step 17: Commit: `git add app-next/app/pages/index.vue && git commit -m "feat(migration): port home page item table to Vue 3 / Vuetify 3"`

---

### Task P5.9: Migrate pages/vaulted.vue (vaulted-items list) to Nuxt 4 / Vue 3 / Vuetify 3

**Files:**
- Create: app-next/app/pages/vaulted.vue
- Delete/superseded: app/pages/vaulted.vue (reference only; old app stays until cutover)

**Depends on:** P0 scaffold + nuxt.config.ts (vuetify-nuxt-module, ssr:true); P2 app-next/app/stores/items.ts exporting `useItemsStore` with an `allItems` getter; P3 default layout providing the `#spinner-wrapper` element; `useDisplay` composable (Vuetify).

**Notes:** This page has **no asyncData and no head fetch** — all data comes from the Pinia items store on the client (the whole console is wrapped in `<client-only>`). So there is NO `useAsyncData`/`loadError` here; only the store getter changes. All computed/methods logic is pure and ports 1:1; the work is (a) Vuex→Pinia getter, (b) Options API→`<script setup>`, (c) `$vuetify.breakpoint`→`useDisplay`, (d) `head()`→`useHead`, (e) Vuetify 2→3 template prop cleanup.

**Steps:**

- [ ] Step 1: Replace the Vuex import + Options-API `data()`/`head()`/`computed` header with `<script setup lang="ts">`, the Pinia store, `useDisplay`, `useHead`, and reactive refs. 

  BEFORE (lines 122–158):
  ```vue
  <script lang="ts">
  import { mapGetters } from 'vuex'

  export default {
    name: 'VaultedPage',
    data() {
      return {
        search: '',
        minPrice: 0,
        category: 'All',
        sortKey: 'price',
        setsOnly: false,
        page: 1,
        perPage: 25,
        placeholderImg:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
        sortOptions: [
          { text: 'Price (high → low)', value: 'price' },
          { text: 'Volume', value: 'volume' },
          { text: 'Name (A–Z)', value: 'name' },
        ],
      }
    },
    head() {
      return {
        title: 'Vaulted Investment — priciest vaulted Warframe primes',
        meta: [{ hid: 'description', name: 'description', content: 'Every vaulted (unfarmable) Warframe prime item ranked by market value — track what is appreciating while it can no longer be farmed.' }],
      }
    },
    computed: {
      ...mapGetters({ allItems: 'all_items' }),
      isMobile(): boolean {
        return (this as any).$vuetify.breakpoint.mobile
      },
      vaultedItems(): any[] {
        return (this.allItems as any[]).filter((i) => i && i.vaulted === true && i.market && i.market.sell > 0)
      },
  ```

  AFTER (top of `<script setup>`):
  ```vue
  <script setup lang="ts">
  import { computed, ref, watch, onMounted, nextTick } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useItemsStore } from '~/stores/items'

  useHead({
    title: 'Vaulted Investment — priciest vaulted Warframe primes',
    meta: [{ name: 'description', content: 'Every vaulted (unfarmable) Warframe prime item ranked by market value — track what is appreciating while it can no longer be farmed.' }],
  })

  const itemsStore = useItemsStore()
  const allItems = computed(() => itemsStore.allItems)

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  // filter/sort/pager state (was data())
  const search = ref('')
  const minPrice = ref<number>(0)
  const category = ref('All')
  const sortKey = ref('price')
  const setsOnly = ref(false)
  const page = ref(1)
  const perPage = 25
  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
  const sortOptions = [
    { title: 'Price (high → low)', value: 'price' },
    { title: 'Volume', value: 'volume' },
    { title: 'Name (A–Z)', value: 'name' },
  ]

  const vaultedItems = computed<any[]>(() =>
    (allItems.value as any[]).filter((i) => i && i.vaulted === true && i.market && i.market.sell > 0)
  )
  ```
  Note the `sortOptions` `text:` → `title:` change: Vuetify 3 `v-select` reads the label from `item-title` which defaults to `title` (was `text` in v2).

- [ ] Step 2: Port the remaining computed properties (`categoryOptions`, `filtered`, `pageCount`, `paged`, `topDeal`, `topDealUrl`, `stats`) from Options `computed` to standalone `computed(() => …)` consts, replacing every `this.` with the local ref/computed and calling `categoryOf(...)` directly.

  BEFORE (lines 159–210, representative slice):
  ```ts
    categoryOptions(): string[] {
      const present = new Set<string>()
      for (const r of this.vaultedItems) present.add(this.categoryOf(r.tags))
      const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
      return ['All', ...order.filter((c) => present.has(c))]
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      const minP = Number(this.minPrice) || 0
      let list = this.vaultedItems.filter((r) => {
        if (q && !r.item_name.toLowerCase().includes(q)) return false
        if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
        if ((r.market.sell || 0) < minP) return false
        if (this.setsOnly && !r.set) return false
        return true
      })
      const dir = (a: number, b: number) => b - a
      const sorters: Record<string, (a: any, b: any) => number> = {
        price: (a, b) => dir(a.market.sell, b.market.sell),
        volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
        name: (a, b) => a.item_name.localeCompare(b.item_name),
      }
      return list.slice().sort(sorters[this.sortKey] || sorters.price)
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
    },
    paged(): any[] {
      const start = (this.page - 1) * this.perPage
      return this.filtered.slice(start, start + this.perPage)
    },
    topDeal(): any {
      let best: any = null
      for (const r of this.vaultedItems) if (!best || r.market.sell > best.market.sell) best = r
      return best
    },
    topDealUrl(): string {
      let best: any = null
      for (const r of this.filtered) if (!best || r.market.sell > best.market.sell) best = r
      return best ? best.url_name : ''
    },
    stats(): any {
      const list = this.vaultedItems
      const prices = list.map((r) => r.market.sell)
      return {
        total: list.length,
        priciest: prices.length ? Math.max(...prices) : 0,
        avg: prices.length ? prices.reduce((s, v) => s + v, 0) / prices.length : 0,
        sets: list.filter((r) => r.set).length,
      }
    },
  ```

  AFTER:
  ```ts
  const categoryOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of vaultedItems.value) present.add(categoryOf(r.tags))
    const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
    return ['All', ...order.filter((c) => present.has(c))]
  })

  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const minP = Number(minPrice.value) || 0
    const list = vaultedItems.value.filter((r) => {
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
      if ((r.market.sell || 0) < minP) return false
      if (setsOnly.value && !r.set) return false
      return true
    })
    const dir = (a: number, b: number) => b - a
    const sorters: Record<string, (a: any, b: any) => number> = {
      price: (a, b) => dir(a.market.sell, b.market.sell),
      volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
      name: (a, b) => a.item_name.localeCompare(b.item_name),
    }
    return list.slice().sort(sorters[sortKey.value] || sorters.price)
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })

  const topDeal = computed<any>(() => {
    let best: any = null
    for (const r of vaultedItems.value) if (!best || r.market.sell > best.market.sell) best = r
    return best
  })

  const topDealUrl = computed<string>(() => {
    let best: any = null
    for (const r of filtered.value) if (!best || r.market.sell > best.market.sell) best = r
    return best ? best.url_name : ''
  })

  const stats = computed<any>(() => {
    const list = vaultedItems.value
    const prices = list.map((r) => r.market.sell)
    return {
      total: list.length,
      priciest: prices.length ? Math.max(...prices) : 0,
      avg: prices.length ? prices.reduce((s, v) => s + v, 0) / prices.length : 0,
      sets: list.filter((r) => r.set).length,
    }
  })
  ```

- [ ] Step 3: Port the `watch`, `mounted`, and `methods` to Composition API. The spinner-hide loop keeps its self-recursive retry.

  BEFORE (lines 211–253):
  ```ts
    watch: {
      filtered() {
        this.page = 1
      },
    },
    mounted() {
      this.finishLoading()
    },
    methods: {
      assetUrl(thumb: string): string {
        return 'https://warframe.market/static/assets/' + (thumb || '')
      },
      mkt(urlName: string): string {
        return 'https://warframe.market/items/' + urlName
      },
      onImgError(e: any) {
        const img = e.target
        if (!img || img.dataset.fallback) return
        img.dataset.fallback = '1'
        img.src = this.placeholderImg
      },
      categoryOf(tags: string[] = []): string {
        const t = (tags || []).map((x) => (x || '').toLowerCase())
        if (t.includes('warframe')) return 'Warframe'
        if (t.includes('primary')) return 'Primary'
        if (t.includes('secondary')) return 'Secondary'
        if (t.includes('melee')) return 'Melee'
        if (t.includes('sentinel')) return 'Sentinel'
        if (t.includes('companion') || t.includes('pet')) return 'Companion'
        return 'Other'
      },
      fmtPlat(n: number): string {
        return Math.round(Number(n) || 0).toLocaleString('en-US')
      },
      finishLoading() {
        this.$nextTick(() => {
          const el = document.getElementById('spinner-wrapper')
          if (el) el.style.display = 'none'
          else this.finishLoading()
        })
      },
    },
  }
  </script>
  ```

  AFTER (finish `<script setup>`):
  ```ts
  watch(filtered, () => {
    page.value = 1
  })

  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function mkt(urlName: string): string {
    return 'https://warframe.market/items/' + urlName
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function categoryOf(tags: string[] = []): string {
    const t = (tags || []).map((x) => (x || '').toLowerCase())
    if (t.includes('warframe')) return 'Warframe'
    if (t.includes('primary')) return 'Primary'
    if (t.includes('secondary')) return 'Secondary'
    if (t.includes('melee')) return 'Melee'
    if (t.includes('sentinel')) return 'Sentinel'
    if (t.includes('companion') || t.includes('pet')) return 'Companion'
    return 'Other'
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(() => {
    finishLoading()
  })
  </script>
  ```
  (`categoryOf` is hoisted as a function declaration, so it is safely callable from the `computed`s defined earlier in the file.)

- [ ] Step 4: Copy the `<template>` verbatim, then apply the Vuetify 2→3 attribute fixes below. The filter row `v-text-field`/`v-select`/`v-switch`: drop `dark`, change `dense` → `density="compact"`.

  BEFORE (lines 34–42):
  ```vue
  <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  <v-text-field v-model.number="minPrice" dark dense hide-details type="number" min="0" label="Min price (plat)" class="an-field"></v-text-field>
  <v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
  ...
  <v-switch v-model="setsOnly" dark dense hide-details inset color="#4caf7d" label="Full sets only"></v-switch>
  ```

  AFTER:
  ```vue
  <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  <v-text-field v-model.number="minPrice" density="compact" hide-details type="number" min="0" label="Min price (plat)" class="an-field"></v-text-field>
  <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
  ...
  <v-switch v-model="setsOnly" density="compact" hide-details inset color="#4caf7d" label="Full sets only"></v-switch>
  ```

- [ ] Step 5: Fix the chip group. `active-class` → `selected-class`; `small` → `size="small"`.

  BEFORE (lines 38–40):
  ```vue
  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
  </v-chip-group>
  ```

  AFTER:
  ```vue
  <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
  </v-chip-group>
  ```
  (In Vuetify 3 the selected class is owned by the group via `selected-class`, not per-`v-chip`.)

- [ ] Step 6: Fix the row action `v-btn` icon button: `small` → `size="small"` (keep `icon` + `<v-icon>` slot).

  BEFORE (lines 80–82):
  ```vue
  <v-btn icon small color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
    <v-icon>mdi-open-in-new</v-icon>
  </v-btn>
  ```

  AFTER:
  ```vue
  <v-btn icon size="small" color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
    <v-icon>mdi-open-in-new</v-icon>
  </v-btn>
  ```

- [ ] Step 7: Fix the pager (`v-pagination`): drop `dark` (theme-driven now); keep `color` and `:total-visible`.

  BEFORE (lines 109–111):
  ```vue
  <div v-if="filtered.length > perPage" class="an-pager">
    <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  </div>
  ```

  AFTER:
  ```vue
  <div v-if="filtered.length > perPage" class="an-pager">
    <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  </div>
  ```

- [ ] Step 8: Fix the disclaimer `v-alert`: `dense` → `density="compact"`, and the Vuetify-2 background color utility `blue darken-4` → the Vuetify-3 form `bg-blue-darken-4`.

  BEFORE (lines 114–117):
  ```vue
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    Vault status comes from Warframe Market. Prices are today's orders — not a
    guarantee of future value. Low-volume items can swing hard.
  </v-alert>
  ```

  AFTER:
  ```vue
  <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
    Vault status comes from Warframe Market. Prices are today's orders — not a
    guarantee of future value. Low-volume items can swing hard.
  </v-alert>
  ```
  (All other template markup — the plain `<table class="an-table">`, `<img @error="onImgError">`, `an-*` classes, `<client-only>` wrapper — is native HTML / project CSS and carries over unchanged. `<client-only>` is a valid Nuxt 3 built-in.)

- [ ] Step 9: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for app/pages/vaulted.vue (watch for any `this.` left behind or a store getter-name mismatch against stores/items.ts).

- [ ] Step 10: Verify in browser: start backend from repo root `npm run dev` (:3529), then `cd app-next && npm run dev`; open `/vaulted`. Expect: spinner clears on mount, hero "Priciest vaulted" card + 4 stat tiles populate, search/min-price/sort/category chips/"Full sets only" switch all filter live, desktop table vs mobile cards toggle at the breakpoint, pagination appears when >25 matches, zero console errors. Screenshot-diff vs old app `/vaulted` (close — accept Vuetify 3 spacing shifts on fields/chips/pagination).

- [ ] Step 11: Commit: `git add app-next/app/pages/vaulted.vue && git commit -m "feat(migration): port vaulted page to Nuxt4/Vue3/Vuetify3"`

---

### Task P5.10: Migrate pages/endo.vue (endo / riven deals) to Nuxt4 + Vue3 + Vuetify3

**Files:**
- Create: `app-next/app/pages/endo.vue`
- Delete/superseded: `app/pages/endo.vue` (reference only; old app stays until cutover)

**Depends on:** P0 infra (nuxt.config.ts with vuetify-nuxt-module, @pinia/nuxt, @nuxtjs/i18n v9, `runtimeConfig.public.apiURL`); `app-next/app/stores/items.ts` (`useItemsStore` with `allItems` getter); P1 layout/app.vue shell + `#spinner-wrapper` markup; dayjs.

> NOTE: The old file carries a large block of DEAD methods left over from a currency-converter (`get_text`, `formatMoney`, `install_app`, `changeCode`, `capitalize`, `fixTitle`, `getColor`, `plusUy`, `hideWidgets`, `hideFeedback`, `filter`, `filterSelect`, `reset`, `formatNumber`) that reference state which does not exist in `data()` (`this.code`, `this.items`, `this.amount`, `this.wantTo`, `this.day`, `this.lastPos`). None are referenced by the template or lifecycle. They are dropped in this migration (functional parity preserved — they were never callable). The template only uses: `getHeadersRivens`, `getHeaders`, `rivens`, `all_items`, `avgPrice`, `loadItems`, `fixPrice`, `fixDate`, `getLink`, `row_classes`, plus `hasScroll`/`scrollWidth` and `setScrollBar`.

**Steps:**

- [ ] Step 1: Replace the whole `<script lang="ts">` Options block with `<script setup lang="ts">`. Set up imports, composables, store, and reactive state.
  BEFORE (top of script):
  ```ts
  <script lang="ts">
  import moment from 'moment'
  import { mapGetters } from 'vuex'
  export default {
    name: 'HomePage',
    components: {},
    data() {
      return {
        all_items: [],
        min_volume: 0,
        search: '',
        avgPrice: false,
        selection: 'All',
        hasScroll: false,
        scrollWidth: 0,
        sculptures: {
          anasa: 3450, ayr: 1425, hemakara: 2600, kitha: 3000, orta: 2700,
          piv: 1725, sah: 1500, valana: 1575, vaya: 1800, zambuka: 2600,
        },
        maxEndoPerPlat: 0,
        rivens: [],
      }
    },
  ```
  AFTER:
  ```ts
  <script setup lang="ts">
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  dayjs.extend(relativeTime)

  const config = useRuntimeConfig()
  const base = config.public.apiURL
  const { t } = useI18n()
  const goTo = useGoTo()

  // Vuex all_items getter -> Pinia store
  const store = useItemsStore()
  const allItems = computed(() => store.allItems)

  // template refs (replace this.$refs.dataTable / this.$refs.wrapper2)
  const dataTable = ref<any>(null)
  const wrapper2 = ref<HTMLElement | null>(null)

  // reactive state (only fields actually used remain)
  const all_items = ref<any[]>([])
  const avgPrice = ref(false)
  const hasScroll = ref(false)
  const scrollWidth = ref<string | number>(0)
  const maxEndoPerPlat = ref(0)
  const rivens = ref<any[]>([])

  const sculptures: Record<string, number> = {
    anasa: 3450, ayr: 1425, hemakara: 2600, kitha: 3000, orta: 2700,
    piv: 1725, sah: 1500, valana: 1575, vaya: 1800, zambuka: 2600,
  }
  ```

- [ ] Step 2: Port `head()` (Nuxt2 i18n `$nuxtI18nHead`) to the i18n v9 head composables.
  BEFORE:
  ```ts
  head() {
    return this.$nuxtI18nHead({
      addSeoAttributes: true,
    })
  },
  ```
  AFTER (place in `<script setup>`):
  ```ts
  const i18nHead = useLocaleHead({ addSeoAttributes: true })
  useHead(i18nHead)
  ```

- [ ] Step 3: Port `getRivens` (`this.$axios` + `this.$config.apiURL` -> `$fetch` + `base`) and `loadItems` (`this.allItems`/`this.all_items` -> refs).
  BEFORE:
  ```ts
  async getRivens() {
    const rivens = await this.$axios
      .get(`${this.$config.apiURL}/rivens`)
      .then((res) => res.data)
    this.rivens = rivens
  },
  loadItems() {
    this.all_items = this.allItems
      .filter((el) => el.item_name.includes('Sculpture'))
      .map((el) => {
        const name = el.url_name.split(/_/g)[1]
        const endo = this.sculptures[name]
        const buy = this.avgPrice ? el.market.buyAvg : el.market.buy
        const sell = this.avgPrice ? el.market.sellAvg : el.market.sell
        return {
          ...el,
          market: {
            ...el.market,
            endo,
            endoPlatBuy: buy ? Math.round((endo / buy) * 100) / 100 : '-',
            endoPlatSell: sell ? Math.round((endo / sell) * 100) / 100 : '-',
          },
        }
      })
    this.maxEndoPerPlat = this.all_items.reduce((prev, current) =>
      prev.market.endoPlatSell > current.market.endoPlatSell ? prev : current
    ).market.endoPlatSell
    this.getRivens()
  },
  ```
  AFTER:
  ```ts
  async function getRivens() {
    rivens.value = await $fetch<any[]>(`${base}/rivens`)
  }
  function loadItems() {
    all_items.value = allItems.value
      .filter((el: any) => el.item_name.includes('Sculpture'))
      .map((el: any) => {
        const name = el.url_name.split(/_/g)[1]
        const endo = sculptures[name]
        const buy = avgPrice.value ? el.market.buyAvg : el.market.buy
        const sell = avgPrice.value ? el.market.sellAvg : el.market.sell
        return {
          ...el,
          market: {
            ...el.market,
            endo,
            endoPlatBuy: buy ? Math.round((endo / buy) * 100) / 100 : '-',
            endoPlatSell: sell ? Math.round((endo / sell) * 100) / 100 : '-',
          },
        }
      })
    if (all_items.value.length) {
      maxEndoPerPlat.value = all_items.value.reduce((prev, current) =>
        prev.market.endoPlatSell > current.market.endoPlatSell ? prev : current
      ).market.endoPlatSell
    }
    getRivens()
  }
  ```

- [ ] Step 4: Port the small helpers `fixPrice`, `fixDate` (moment -> dayjs), `getLink`, `row_classes` to plain functions.
  BEFORE:
  ```ts
  fixPrice(price: number) {
    if (!price) return 0
    return Math.round(price * 100) / 100
  },
  fixDate(date) {
    return moment(date).fromNow()
  },
  getLink(name: string) {
    let s = '^' + name
    if (s.includes('(')) { s = s.split('(')[0].trim() }
    if (s.includes('Set')) { s = s.replace('Set', '').trim() }
    const encoded = encodeURIComponent(s)
    const url = `https://drops.warframestat.us/#/search/${encoded}/items/regex`
    return url
  },
  ...
  row_classes(item) {
    if (item.isInterBank) { return 'purple darken-4' }
    if (item.condition) { return 'grey darken-3' }
    return ''
  },
  ```
  AFTER (note V3 color-class rename inside row_classes: `grey darken-3` -> `bg-grey-darken-3`, `purple darken-4` -> `bg-purple-darken-4`):
  ```ts
  function fixPrice(price: number) {
    if (!price) return 0
    return Math.round(price * 100) / 100
  }
  function fixDate(date: string | number | Date) {
    return dayjs(date).fromNow()
  }
  function getLink(name: string) {
    let s = '^' + name
    if (s.includes('(')) s = s.split('(')[0].trim()
    if (s.includes('Set')) s = s.replace('Set', '').trim()
    const encoded = encodeURIComponent(s)
    return `https://drops.warframestat.us/#/search/${encoded}/items/regex`
  }
  function row_classes(item: any) {
    if (item.isInterBank) return 'bg-purple-darken-4'
    if (item.condition) return 'bg-grey-darken-3'
    return ''
  }
  ```

- [ ] Step 5: Port `getHeadersRivens()` and `getHeaders()` — Vuetify2 `{ text, value }` header objects become V3 `{ title, key }`. Keep `width`.
  BEFORE (getHeadersRivens):
  ```ts
  getHeadersRivens() {
    return [
      { text: 'Riven Weapon', value: 'item_name' },
      { text: 'Re rolls', value: 'items.item.re_rolls' },
      { text: 'Buy', value: 'items.buyout_price' },
      { text: 'Endo', value: 'items.endo', width: 'auto' },
      { text: 'Endo/Plat Sell', value: 'items.endoPerPlat', width: 'auto' },
    ]
  },
  ```
  AFTER:
  ```ts
  function getHeadersRivens() {
    return [
      { title: 'Riven Weapon', key: 'item_name' },
      { title: 'Re rolls', key: 'items.item.re_rolls' },
      { title: 'Buy', key: 'items.buyout_price' },
      { title: 'Endo', key: 'items.endo', width: 'auto' },
      { title: 'Endo/Plat Sell', key: 'items.endoPerPlat', width: 'auto' },
    ]
  }
  ```
  BEFORE (getHeaders, `text`->`title`, `value`->`key`):
  ```ts
  getHeaders() {
    const toReturn: any = [
      { text: 'Name', value: 'item_name', width: 'auto' },
      { text: 'Buy', value: 'market.buy', width: 'auto' },
      { text: 'Sell', value: 'market.sell', width: 'auto' },
      { text: 'Endo', value: 'market.endo', width: 'auto' },
      { text: 'Endo/Plat Buy', value: 'market.endoPlatBuy', width: 'auto' },
      { text: 'Endo/Plat Sell', value: 'market.endoPlatSell', width: 'auto' },
      { text: 'Updated', value: 'priceUpdate' },
      { text: 'Drops', value: 'drops' },
    ]
    if (this.avgPrice) {
      toReturn[1] = { text: 'Buy', value: 'market.buyAvg', width: 'auto' }
      toReturn[2] = { text: 'Sell', value: 'market.sellAvg', width: 'auto' }
    }
    return toReturn
  },
  ```
  AFTER:
  ```ts
  function getHeaders() {
    const toReturn: any[] = [
      { title: 'Name', key: 'item_name', width: 'auto' },
      { title: 'Buy', key: 'market.buy', width: 'auto' },
      { title: 'Sell', key: 'market.sell', width: 'auto' },
      { title: 'Endo', key: 'market.endo', width: 'auto' },
      { title: 'Endo/Plat Buy', key: 'market.endoPlatBuy', width: 'auto' },
      { title: 'Endo/Plat Sell', key: 'market.endoPlatSell', width: 'auto' },
      { title: 'Updated', key: 'priceUpdate' },
      { title: 'Drops', key: 'drops' },
    ]
    if (avgPrice.value) {
      toReturn[1] = { title: 'Buy', key: 'market.buyAvg', width: 'auto' }
      toReturn[2] = { title: 'Sell', key: 'market.sellAvg', width: 'auto' }
    }
    return toReturn
  }
  ```

- [ ] Step 6: Port the scrollbar-sync helper `setScrollBar` — key change: Vuetify3 renamed the scroll container from `.v-data-table__wrapper` to `.v-table__wrapper`; `this.$refs.wrapper2` -> `wrapper2.value`; `this.$nextTick` -> `nextTick`; `this.scrollWidth`/`this.hasScroll` -> refs.
  BEFORE (excerpt):
  ```ts
  setScrollBar() {
    const tableWrapper = document.querySelector(
      '.money_table .v-data-table__wrapper'
    )
    if (!tableWrapper) {
      this.$nextTick(() => { this.setScrollBar() })
      return
    }
    const isMobile = document.querySelector('.money_table.v-data-table--mobile')
    this.hasScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth
    let wp1 = null; let wp2 = null; let wrapper1 = null; let wrapper2 = null
    if (this.hasScroll && !isMobile) {
      wrapper1 = document.querySelector('.money_table .v-data-table__wrapper')
      wrapper2 = this.$refs.wrapper2
      if (!wrapper2 || !wrapper1) {
        this.$nextTick(() => { this.setScrollBar() })
        return
      }
      const table = document.querySelector('.money_table table')
      this.scrollWidth = table.clientWidth + 10 + 'px'
      ...
      wrapper1.addEventListener('scroll', wp1)
      wrapper2.addEventListener('scroll', wp2)
    }
    addEventListener('resize', () => { ...; this.setScrollBar() }, { once: true })
  },
  ```
  AFTER (full function; `.v-data-table__wrapper` -> `.v-table__wrapper`, local var renamed `w2El` to avoid clashing with the `wrapper2` template ref):
  ```ts
  function setScrollBar() {
    const tableWrapper = document.querySelector('.money_table .v-table__wrapper')
    if (!tableWrapper) {
      nextTick(() => setScrollBar())
      return
    }
    const isMobile = document.querySelector('.money_table.v-data-table--mobile')
    hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
    let wp1: any = null
    let wp2: any = null
    let wrapper1: any = null
    let w2El: any = null
    if (hasScroll.value && !isMobile) {
      wrapper1 = document.querySelector('.money_table .v-table__wrapper')
      w2El = wrapper2.value
      if (!w2El || !wrapper1) {
        nextTick(() => setScrollBar())
        return
      }
      const table = document.querySelector('.money_table table') as HTMLElement
      scrollWidth.value = table.clientWidth + 10 + 'px'

      let scrolling = false
      wp1 = function () {
        if (scrolling) { scrolling = false; return true }
        scrolling = true
        w2El.scrollLeft = wrapper1.scrollLeft
      }
      wp2 = function () {
        if (scrolling) { scrolling = false; return true }
        scrolling = true
        wrapper1.scrollLeft = w2El.scrollLeft
      }
      wrapper1.addEventListener('scroll', wp1)
      w2El.addEventListener('scroll', wp2)
    }
    addEventListener(
      'resize',
      () => {
        if (wrapper1) {
          wrapper1.removeEventListener('scroll', wp1)
          w2El.removeEventListener('scroll', wp2)
        }
        setScrollBar()
      },
      { once: true }
    )
  }
  ```

- [ ] Step 7: Port lifecycle. Old `beforeMount()` lifecycle called the `beforeMount` METHOD (PWA prompt + `loadItems()` + `finishLoading()`); old `mounted()` installed window `startLoading`/`stopLoading` and called `setScrollBar()`. Convert to `onBeforeMount`/`onMounted` + a `finishLoading` function.
  BEFORE:
  ```ts
  beforeMount() { this.beforeMount() },
  mounted() {
    ;(window as any).startLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'flex'
    }
    ;(window as any).stopLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
    }
    this.setScrollBar()
  },
  ...
  beforeMount() {  // the METHOD
    let pwaInstall = false
    try {
      if (!window.matchMedia('(display-mode: standalone)').matches) { pwaInstall = true }
    } catch (e) { console.error(e) }
    if (pwaInstall) {
      ;(window as any).deferredPrompt = null
      window.addEventListener('beforeinstallprompt', (e) => {
        ;(window as any).deferredPrompt = e
        if (e !== null) { this.show_install = true }
      })
    }
    this.loadItems()
    this.finishLoading()
  },
  ...
  finishLoading() {
    this.$nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else { this.finishLoading() }
    })
  },
  ```
  AFTER (drop the dead `this.show_install` assignment — no such state; keep the prompt capture for parity):
  ```ts
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }

  onBeforeMount(() => {
    let pwaInstall = false
    try {
      if (!window.matchMedia('(display-mode: standalone)').matches) pwaInstall = true
    } catch (e) { console.error(e) }
    if (pwaInstall) {
      ;(window as any).deferredPrompt = null
      window.addEventListener('beforeinstallprompt', (e) => {
        ;(window as any).deferredPrompt = e
      })
    }
    loadItems()
    finishLoading()
  })

  onMounted(() => {
    ;(window as any).startLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'flex'
    }
    ;(window as any).stopLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
    }
    setScrollBar()
  })
  ```
  > `loadItems`/`setScrollBar` touch `document`/`window`; they run only in `onBeforeMount`/`onMounted` (client), so SSR is safe. Content is already wrapped in `<client-only>`.

- [ ] Step 8: Rivens `v-data-table` — headers call stays; slot `#item.item_name` stays valid in V3. No prop breakage here (only `:hide-default-footer`, which V3 still accepts). Leave template as-is EXCEPT it lives inside the same `<client-only>`. No change needed to this block beyond it being under the new script. (Confirm `#item.item_name` renders.)

- [ ] Step 9: Main money `v-data-table` — fix the V3-breaking props. 
  BEFORE:
  ```html
  <v-data-table
    ref="dataTable"
    color="#f5f5f5"
    sort-by="market.endoPlatSell"
    sort-desc
    :item-class="row_classes"
    :headers="getHeaders()"
    :items="all_items"
    :footer-props="{
      'items-per-page-options': [10, 20, 30, 40, 50],
    }"
    :items-per-page="50"
    :hide-default-footer="true"
    class="elevation-1 money_table"
    @update:page="$vuetify.goTo($refs.dataTable)"
  >
  ```
  AFTER (`sort-by`/`sort-desc` -> array form; `:item-class` -> `:row-props`; drop `:footer-props` (V3 removed, footer hidden anyway) and `color` (unused on V3 table); `$vuetify.goTo($refs..)` -> `goTo(dataTable?.$el)`):
  ```html
  <v-data-table
    ref="dataTable"
    :sort-by="[{ key: 'market.endoPlatSell', order: 'desc' }]"
    :row-props="({ item }) => ({ class: row_classes(item) })"
    :headers="getHeaders()"
    :items="all_items"
    :items-per-page="50"
    :hide-default-footer="true"
    class="elevation-1 money_table"
    @update:page="goTo(dataTable?.$el)"
  >
  ```

- [ ] Step 10: Main table `#top` slot — remove the removed scoped props `{ pagination, options, updateOptions }` (unused in the body) and fix `v-checkbox` (`dark` removed, `@change` -> `@update:model-value`) and `white--text` -> `text-white`.
  BEFORE:
  ```html
  <template #top="{ pagination, options, updateOptions }">
    <div>
      <div v-show="hasScroll" id="wrapper2" ref="wrapper2" class="scroll-style-1">
        <div id="div2" :style="{ width: scrollWidth }" class="width-scroll"></div>
      </div>
    </div>
    <div>
      <div style="background: #1f1f2f" class="pa-3 white--text">
        <div>
          <v-checkbox
            v-model="avgPrice"
            dark
            label="Average Prices (5 lowest prices)"
            @change="loadItems"
          ></v-checkbox>
        </div>
      </div>
    </div>
  </template>
  ```
  AFTER:
  ```html
  <template #top>
    <div>
      <div v-show="hasScroll" id="wrapper2" ref="wrapper2" class="scroll-style-1">
        <div id="div2" :style="{ width: scrollWidth }" class="width-scroll"></div>
      </div>
    </div>
    <div>
      <div style="background: #1f1f2f" class="pa-3 text-white">
        <div>
          <v-checkbox
            v-model="avgPrice"
            label="Average Prices (5 lowest prices)"
            @update:model-value="loadItems"
          ></v-checkbox>
        </div>
      </div>
    </div>
  </template>
  ```

- [ ] Step 11: Main table body item slots — `#item.item_name` fix the `v-btn` (`small` -> `size="small"`, drop `link` since `:to` already makes it a link; keep `color`/`target`). `#item.thumb`, `#item.market.buyAvg`, `#item.market.sellAvg`, `#item.priceUpdate`, `#item.drops` slot NAMES stay valid in V3 — no change to their bodies.
  BEFORE (v-btn only):
  ```html
  <v-btn
    v-if="item.set && item.item_name.includes(' Set')"
    small
    target="_blank"
    link
    color="primary"
    class="mt-1"
    :to="'/set/' + item.url_name"
    >Set vs Parts</v-btn
  >
  ```
  AFTER:
  ```html
  <v-btn
    v-if="item.set && item.item_name.includes(' Set')"
    size="small"
    target="_blank"
    color="primary"
    class="mt-1"
    :to="'/set/' + item.url_name"
    >Set vs Parts</v-btn
  >
  ```

- [ ] Step 12: Donation block + disclaimer — rename Vuetify2 color helper classes and `$t`. `white--text` -> `text-white`; `grey darken-3` -> `bg-grey-darken-3`; the alert `blue darken-4` -> `bg-blue-darken-4`; `dense` -> `density="compact"`; `$t('disclaimer')` -> `t('disclaimer')`. (`v-img` `contain` + `#sources` slot are unchanged in V3.)
  BEFORE:
  ```html
  <div class="my-3 mb-0 md-md-3 grey darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
    ...
    <div class="white--text mr-3">Help us donating!</div>
    <a ... class="white--text d-flex mr-4 align-center justify-content-left donation_logo" ...>
  ...
  <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 blue darken-4" type="info" dense>
    {{ $t('disclaimer') }}
  </v-alert>
  ```
  AFTER:
  ```html
  <div class="my-3 mb-0 md-md-3 bg-grey-darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
    ...
    <div class="text-white mr-3">Help us donating!</div>
    <a ... class="text-white d-flex mr-4 align-center justify-content-left donation_logo" ...>
  ...
  <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4" type="info" density="compact">
    {{ t('disclaimer') }}
  </v-alert>
  ```
  (Repeat `white--text` -> `text-white` on BOTH donation `<a>` anchors, lines ~136 and ~152 of the old file.)

- [ ] Step 13: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/endo.vue` (watch for `store.allItems` typing and the `any`-typed table callbacks).

- [ ] Step 14: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/endo`. Expect: page renders, spinner hides (`finishLoading`), sculpture table populates and sorts by Endo/Plat Sell desc, "Average Prices" checkbox toggles buy/sell columns and reloads, rivens table loads from `${base}/rivens`, "Drops" links + "Set vs Parts" buttons work, horizontal scroll-sync bar appears when the money table overflows, zero console errors. Screenshot-diff vs old app `/endo` (close; accept Vuetify3 spacing shifts).

- [ ] Step 15: Commit: `git add app-next/app/pages/endo.vue && git commit -m "feat(migration): port pages/endo.vue to Nuxt4/Vue3/Vuetify3"`

---

### Task P5.11: Migrate Ducat Efficiency page (pages/ducats.vue)

**Files:**
- Create: app-next/app/pages/ducats.vue
- Delete/superseded: app/pages/ducats.vue (reference only; old app stays until cutover)

**Depends on:**
- P0 nuxt.config.ts + vuetify-nuxt-module (theme, mdi font, `config.public.apiURL`)
- analytics.css ported to app-next (every `.an-*` class used here lives there)
- P3 Pinia store `app-next/app/stores/items.ts` — `useItemsStore` with getter `allItems`

**Notes:** This page has **no** asyncData/$fetch (all data comes from the items store), **no** i18n, **no** v-data-table / v-simple-table, **no** v-list-item-icon / v-subheader, **no** v-menu, **no** moment / leaflet / driver.js, **no** `.sync`, and **no** `<style>` block. Work is: convert Options API → `<script setup>`, swap Vuex→Pinia + breakpoint + head(), and fix Vuetify-2 prop APIs on the form controls, chips, icon button, pagination and alert.

**Steps:**

- [ ] **Step 1: Convert `<script>` to `<script setup lang="ts">` — store, breakpoint, head, state.** Replace the Vuex getter with the Pinia store, `$vuetify.breakpoint.mobile` with `useDisplay()`, `head()` with `useHead()`, and lift `data()` fields to refs/consts.

  BEFORE (`<script lang="ts">` ... `data()` / `head()` / first computeds):
  ```ts
  import { mapGetters } from 'vuex'

  export default {
    name: 'DucatsPage',
    data() {
      return {
        search: '',
        maxPrice: 0,
        category: 'All',
        sortKey: 'efficiency',
        page: 1,
        perPage: 25,
        placeholderImg:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
        sortOptions: [
          { text: 'Ducats per plat', value: 'efficiency' },
          { text: 'Most ducats', value: 'ducats' },
          { text: 'Cheapest', value: 'cheapest' },
          { text: 'Volume', value: 'volume' },
        ],
      }
    },
    head() {
      return {
        title: 'Ducat Efficiency — best ducats per platinum (Warframe)',
        meta: [{ hid: 'description', name: 'description', content: 'Warframe prime parts ranked by ducats earned per platinum spent — the cheapest way to stock ducats for Baro Ki\'Teer.' }],
      }
    },
    computed: {
      ...mapGetters({ allItems: 'all_items' }),
      isMobile(): boolean {
        return (this as any).$vuetify.breakpoint.mobile
      },
      ducatItems(): any[] {
        return (this.allItems as any[]).filter((i) => i && i.ducats > 0 && i.market && i.market.sell > 0)
      },
  ```

  AFTER (top of new `<script setup lang="ts">`):
  ```ts
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useItemsStore } from '~/stores/items'

  useHead({
    title: 'Ducat Efficiency — best ducats per platinum (Warframe)',
    meta: [
      {
        hid: 'description',
        name: 'description',
        content:
          "Warframe prime parts ranked by ducats earned per platinum spent — the cheapest way to stock ducats for Baro Ki'Teer.",
      },
    ],
  })

  const items = useItemsStore()
  const allItems = computed(() => items.allItems)

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  const search = ref('')
  const maxPrice = ref<number>(0)
  const category = ref('All')
  const sortKey = ref('efficiency')
  const page = ref(1)
  const perPage = 25

  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

  // NOTE: key renamed text -> title for Vuetify 3 v-select (default item-title is 'title')
  const sortOptions = [
    { title: 'Ducats per plat', value: 'efficiency' },
    { title: 'Most ducats', value: 'ducats' },
    { title: 'Cheapest', value: 'cheapest' },
    { title: 'Volume', value: 'volume' },
  ]
  ```

- [ ] **Step 2: Port the plain helper methods to module-scope functions.** These have no `this` dependency on reactive state and are referenced by both template and computeds.

  BEFORE (inside `methods`):
  ```ts
    assetUrl(thumb: string): string {
      return 'https://warframe.market/static/assets/' + (thumb || '')
    },
    mkt(urlName: string): string {
      return 'https://warframe.market/items/' + urlName
    },
    onImgError(e: any) {
      const img = e.target
      if (!img || img.dataset.fallback) return
      img.dataset.fallback = '1'
      img.src = this.placeholderImg
    },
    categoryOf(tags: string[] = []): string {
      const t = (tags || []).map((x) => (x || '').toLowerCase())
      if (t.includes('warframe')) return 'Warframe'
      if (t.includes('primary')) return 'Primary'
      if (t.includes('secondary')) return 'Secondary'
      if (t.includes('melee')) return 'Melee'
      if (t.includes('sentinel')) return 'Sentinel'
      if (t.includes('companion') || t.includes('pet')) return 'Companion'
      return 'Other'
    },
    eff(row: any): number {
      return row.market.sell > 0 ? row.ducats / row.market.sell : 0
    },
    fmtPlat(n: number): string {
      return Math.round(Number(n) || 0).toLocaleString('en-US')
    },
  ```

  AFTER (module-scope functions in `<script setup>`):
  ```ts
  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function mkt(urlName: string): string {
    return 'https://warframe.market/items/' + urlName
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function categoryOf(tags: string[] = []): string {
    const t = (tags || []).map((x) => (x || '').toLowerCase())
    if (t.includes('warframe')) return 'Warframe'
    if (t.includes('primary')) return 'Primary'
    if (t.includes('secondary')) return 'Secondary'
    if (t.includes('melee')) return 'Melee'
    if (t.includes('sentinel')) return 'Sentinel'
    if (t.includes('companion') || t.includes('pet')) return 'Companion'
    return 'Other'
  }
  function eff(row: any): number {
    return row.market.sell > 0 ? row.ducats / row.market.sell : 0
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }
  ```

- [ ] **Step 3: Port the remaining computeds** (`ducatItems`, `categoryOptions`, `filtered`, `pageCount`, `paged`, `topDeal`, `topDealUrl`, `stats`) to `computed(...)`, replacing every `this.x` with the ref/computed value (`.value` where needed) and `this.eff/this.categoryOf` with the plain functions.

  BEFORE:
  ```ts
      ducatItems(): any[] {
        return (this.allItems as any[]).filter((i) => i && i.ducats > 0 && i.market && i.market.sell > 0)
      },
      categoryOptions(): string[] {
        const present = new Set<string>()
        for (const r of this.ducatItems) present.add(this.categoryOf(r.tags))
        const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
        return ['All', ...order.filter((c) => present.has(c))]
      },
      filtered(): any[] {
        const q = (this.search || '').toString().trim().toLowerCase()
        const maxP = Number(this.maxPrice) || 0
        let list = this.ducatItems.filter((r) => {
          if (q && !r.item_name.toLowerCase().includes(q)) return false
          if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
          if (maxP > 0 && (r.market.sell || 0) > maxP) return false
          return true
        })
        const dir = (a: number, b: number) => b - a
        const sorters: Record<string, (a: any, b: any) => number> = {
          efficiency: (a, b) => dir(this.eff(a), this.eff(b)),
          ducats: (a, b) => dir(a.ducats, b.ducats),
          cheapest: (a, b) => a.market.sell - b.market.sell,
          volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
        }
        return list.slice().sort(sorters[this.sortKey] || sorters.efficiency)
      },
      pageCount(): number {
        return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
      },
      paged(): any[] {
        const start = (this.page - 1) * this.perPage
        return this.filtered.slice(start, start + this.perPage)
      },
      topDeal(): any {
        let best: any = null
        for (const r of this.ducatItems) if (!best || this.eff(r) > this.eff(best)) best = r
        return best
      },
      topDealUrl(): string {
        let best: any = null
        for (const r of this.filtered) if (!best || this.eff(r) > this.eff(best)) best = r
        return best ? best.url_name : ''
      },
      stats(): any {
        const list = this.ducatItems
        const effs = list.map((r) => this.eff(r))
        return {
          total: list.length,
          best: effs.length ? Math.max(...effs) : 0,
          avg: effs.length ? effs.reduce((s, v) => s + v, 0) / effs.length : 0,
          cheap: list.filter((r) => r.market.sell <= 15).length,
        }
      },
    },
  ```

  AFTER:
  ```ts
  const ducatItems = computed<any[]>(() =>
    (allItems.value as any[]).filter((i) => i && i.ducats > 0 && i.market && i.market.sell > 0),
  )

  const categoryOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of ducatItems.value) present.add(categoryOf(r.tags))
    const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Other']
    return ['All', ...order.filter((c) => present.has(c))]
  })

  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const maxP = Number(maxPrice.value) || 0
    const list = ducatItems.value.filter((r) => {
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
      if (maxP > 0 && (r.market.sell || 0) > maxP) return false
      return true
    })
    const dir = (a: number, b: number) => b - a
    const sorters: Record<string, (a: any, b: any) => number> = {
      efficiency: (a, b) => dir(eff(a), eff(b)),
      ducats: (a, b) => dir(a.ducats, b.ducats),
      cheapest: (a, b) => a.market.sell - b.market.sell,
      volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
    }
    return list.slice().sort(sorters[sortKey.value] || sorters.efficiency)
  })

  const pageCount = computed<number>(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })

  const topDeal = computed<any>(() => {
    let best: any = null
    for (const r of ducatItems.value) if (!best || eff(r) > eff(best)) best = r
    return best
  })

  const topDealUrl = computed<string>(() => {
    let best: any = null
    for (const r of filtered.value) if (!best || eff(r) > eff(best)) best = r
    return best ? best.url_name : ''
  })

  const stats = computed<any>(() => {
    const list = ducatItems.value
    const effs = list.map((r) => eff(r))
    return {
      total: list.length,
      best: effs.length ? Math.max(...effs) : 0,
      avg: effs.length ? effs.reduce((s, v) => s + v, 0) / effs.length : 0,
      cheap: list.filter((r) => r.market.sell <= 15).length,
    }
  })
  ```

- [ ] **Step 4: Port `watch` and `mounted`/spinner logic.**

  BEFORE:
  ```ts
    watch: {
      filtered() {
        this.page = 1
      },
    },
    mounted() {
      this.finishLoading()
    },
    methods: {
      // ...
      finishLoading() {
        this.$nextTick(() => {
          const el = document.getElementById('spinner-wrapper')
          if (el) el.style.display = 'none'
          else this.finishLoading()
        })
      },
    },
  }
  ```

  AFTER (end of `<script setup>`):
  ```ts
  watch(filtered, () => {
    page.value = 1
  })

  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }

  onMounted(() => {
    finishLoading()
  })
  ```
  (Per the frontend-loading-spinner memory: hiding `#spinner-wrapper` on mount is mandatory or the loader spins forever.)

- [ ] **Step 5: Fix the filter controls — drop `dark`, `dense` -> `density="compact"`.** The `<template>` stays otherwise identical; only the Vuetify props change.

  BEFORE:
  ```html
  <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a part" class="an-search"></v-text-field>
  <v-text-field v-model.number="maxPrice" dark dense hide-details type="number" min="0" label="Max price (plat)" class="an-field"></v-text-field>
  <v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
  ```

  AFTER:
  ```html
  <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a part" class="an-search"></v-text-field>
  <v-text-field v-model.number="maxPrice" density="compact" hide-details type="number" min="0" label="Max price (plat)" class="an-field"></v-text-field>
  <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
  ```
  (`sortOptions` already switched to `{ title, value }` in Step 1, so the default V3 `item-title` resolves correctly.)

- [ ] **Step 6: Fix the chip group — per-chip `active-class` -> group `selected-class`, `small` -> `size="small"`.**

  BEFORE:
  ```html
  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
  </v-chip-group>
  ```

  AFTER:
  ```html
  <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
  </v-chip-group>
  ```

- [ ] **Step 7: Fix the desktop-table open-in-new icon button — `icon small` (with icon slot) -> `icon="…"` + `size` + `variant`.**

  BEFORE:
  ```html
  <v-btn icon small color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
    <v-icon>mdi-open-in-new</v-icon>
  </v-btn>
  ```

  AFTER:
  ```html
  <v-btn icon="mdi-open-in-new" size="small" variant="text" color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name"></v-btn>
  ```
  (The mobile-card `<v-icon color="#4fb3bf">mdi-open-in-new</v-icon>` is unchanged — plain `v-icon` with a slot is valid in V3.)

- [ ] **Step 8: Fix pagination — drop `dark`.** `color` and `total-visible` stay.

  BEFORE:
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ```

  AFTER:
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ```

- [ ] **Step 9: Fix the footer alert — `dense` -> `density="compact"`, background class `blue darken-4` -> `bg-blue-darken-4`.**

  BEFORE:
  ```html
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    Ducats/plat = ducat value ÷ lowest sell order. Baro's ducat prices are fixed
    by the game; platinum prices are today's Warframe Market orders.
  </v-alert>
  ```

  AFTER:
  ```html
  <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
    Ducats/plat = ducat value ÷ lowest sell order. Baro's ducat prices are fixed
    by the game; platinum prices are today's Warframe Market orders.
  </v-alert>
  ```
  (Everything else in the template — the `<client-only>` wrapper, hero, `an-stats`, the `an-table`/`an-cards` markup, all `an-*` classes, `assetUrl`/`mkt`/`eff`/`fmtPlat` bindings — is plain HTML/CSS and carries over verbatim.)

- [ ] **Step 10: Typecheck:** `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/ducats.vue` (watch for: unresolved `useItemsStore` import path, `.value` misses on refs, `item-title` key mismatch on `sortOptions`).

- [ ] **Step 11: Verify in browser:** start backend from repo root (`npm run dev` on :3529), then `cd app-next && npm run dev`; load `/ducats`. Expect: spinner clears, hero "Best ducat value" deal renders, the 4 stat tiles populate, search/max-price/sort/category chips filter the list, desktop table vs. mobile cards switch at the breakpoint, pagination appears when `filtered.length > 25`, and the open-in-new buttons link to `warframe.market/items/<url_name>`. Zero console errors. Screenshot-diff `/ducats` vs the old app (accept Vuetify 3 spacing shifts on inputs/chips/alert).

- [ ] **Step 12: Commit:** `git add app-next/app/pages/ducats.vue && git commit -m "feat(app-next): migrate ducat efficiency page to vue3/pinia/vuetify3"`

---


## Phase P6 — Table-heavy pages


---

### Task P6.1: Migrate Top Movers page (pages/movers.vue) to script-setup + Vuetify 3

**Files:**
- Create: `app-next/app/pages/movers.vue`
- Delete/superseded: `app/pages/movers.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (scaffold + vuetify-nuxt-module, ssr:true), P1 (`runtimeConfig.public.apiURL`), P2 (global `analytics.css` with `.an-*` classes in `nuxt.config.ts` `css[]`), P3 (default layout + `#spinner-wrapper`)

**Notes:** This page uses a **raw HTML `<table>`**, not `v-data-table`/`v-simple-table` — no header-map or slot migration needed. No leaflet / moment / driver.js / Vuex / i18n / .sync here. The work is: Options-API → `<script setup lang="ts">`, the `asyncData`/`head`/`$vuetify.breakpoint` trio, and a set of Vuetify-2 prop renames in the template + `>>>` deep selectors.

**Steps:**

- [ ] **Step 1: Convert the `<script lang="ts">` Options block to `<script setup lang="ts">`.**
  BEFORE (data + asyncData + head + mounted, lines 151-186 & 245-253 & 321-329):
  ```ts
  export default {
    name: 'TopMoversPage',
    async asyncData({ $axios, $config }: any) {
      try {
        const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data)
        return {
          items: (data && data.items) || [],
          meta: (data && data.meta) || { count: 0, maxHistoryDays: 0 },
          loadError: false,
        }
      } catch (e) {
        return { items: [], meta: { count: 0, maxHistoryDays: 0 }, loadError: true }
      }
    },
    data() {
      return {
        items: [] as any[],
        meta: { count: 0, maxHistoryDays: 0 } as any,
        loadError: false,
        search: '',
        mode: 'gainers',
        timeframe: 'change7d',
        category: 'All',
        page: 1,
        perPage: 25,
        placeholderImg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
      }
    },
    head() {
      return {
        title: 'Top Movers — Warframe Market gainers, losers & volume',
        meta: [{ hid: 'description', name: 'description', content: "Warframe Market's biggest price gainers and losers over 24h / 7d / 30d plus the volume leaderboard, from long-term daily price history." }],
      }
    },
  ```
  AFTER (top of `<script setup lang="ts">` — SSR fetch, SEO, reactive state):
  ```ts
  import { computed, onMounted, nextTick, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'

  const config = useRuntimeConfig()
  const base = config.public.apiURL

  const { data, error } = await useAsyncData('market-analytics-movers', () =>
    $fetch<any>(`${base}/market_analytics`),
  )
  const loadError = computed(() => !!error.value)
  const items = computed<any[]>(() => (data.value && data.value.items) || [])
  const meta = computed<any>(() => (data.value && data.value.meta) || { count: 0, maxHistoryDays: 0 })

  useSeoMeta({
    title: 'Top Movers — Warframe Market gainers, losers & volume',
    description:
      "Warframe Market's biggest price gainers and losers over 24h / 7d / 30d plus the volume leaderboard, from long-term daily price history.",
  })

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  const search = ref('')
  const mode = ref('gainers')
  const timeframe = ref('change7d')
  const category = ref('All')
  const page = ref(1)
  const perPage = 25
  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
  ```
  Note: `items`/`meta`/`loadError` become `computed` off `data.value` (replacing both the `asyncData` return AND the `data()` seeds — the old client `data()` copies were only fallbacks). `isMobile` replaces `this.$vuetify.breakpoint.mobile`.

- [ ] **Step 2: Port the computed getters** (lines 187-244) verbatim, dropping `this.` and reading `.value` on refs/computed. BEFORE (representative, `changeKey`/`timeframeLabel`/`filtered`):
  ```ts
    changeKey(): string {
      return this.timeframe
    },
    timeframeLabel(): string {
      return { change24h: '24h', change7d: '7d', change30d: '30d' }[this.timeframe as string] || '7d'
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      const key = this.changeKey
      let list = (this.items as any[]).filter((r) => {
        if (q && !r.item_name.toLowerCase().includes(q)) return false
        if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
        if (this.mode !== 'volume' && (r[key] === null || r[key] === undefined)) return false
        return true
      })
      if (this.mode === 'gainers') list = list.filter((r) => r[key] > 0).sort((a, b) => b[key] - a[key])
      else if (this.mode === 'losers') list = list.filter((r) => r[key] < 0).sort((a, b) => a[key] - b[key])
      else list = list.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))
      return list
    },
  ```
  AFTER:
  ```ts
  const changeKey = computed(() => timeframe.value)
  const timeframeLabel = computed(
    () => ({ change24h: '24h', change7d: '7d', change30d: '30d' } as any)[timeframe.value] || '7d',
  )

  const categoryOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of items.value) present.add(categoryOf(r.tags))
    const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
    return ['All', ...order.filter((c) => present.has(c))]
  })

  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const key = changeKey.value
    let list = items.value.filter((r) => {
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
      if (mode.value !== 'volume' && (r[key] === null || r[key] === undefined)) return false
      return true
    })
    if (mode.value === 'gainers') list = list.filter((r) => r[key] > 0).sort((a, b) => b[key] - a[key])
    else if (mode.value === 'losers') list = list.filter((r) => r[key] < 0).sort((a, b) => a[key] - b[key])
    else list = list.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))
    return list
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })
  const topDeal = computed<any>(() => (filtered.value.length ? filtered.value[0] : null))
  const topDealUrl = computed(() => (topDeal.value ? topDeal.value.url_name : ''))
  const emptyMessage = computed(() => {
    if (mode.value === 'volume') return 'No items match these filters.'
    return `No items have ${timeframeLabel.value} history yet. The movers board fills in as daily snapshots accumulate — check back soon.`
  })
  const stats = computed<any>(() => {
    const key = changeKey.value
    const withHistory = items.value.filter((r) => r.dataDays > 1).length
    const changes = items.value.map((r) => r[key]).filter((v) => v !== null && v !== undefined)
    return {
      withHistory,
      topGain: changes.length ? Math.max(...changes) : 0,
      topLoss: changes.length ? Math.min(...changes) : 0,
    }
  })
  ```

- [ ] **Step 3: Port the watcher + methods** (lines 245-328). Methods become plain functions (they are template helpers — keep them as-is minus `this.`). BEFORE (`watch` + a couple of methods that use `this`):
  ```ts
    watch: {
      filtered() {
        this.page = 1
      },
    },
    methods: {
      priceOf(row: any): number {
        return Number(row.avg_price) > 0 ? row.avg_price : row.sell
      },
      onImgError(e: any) {
        const img = e.target
        if (!img || img.dataset.fallback) return
        img.dataset.fallback = '1'
        img.src = this.placeholderImg
      },
      finishLoading() {
        this.$nextTick(() => {
          const el = document.getElementById('spinner-wrapper')
          if (el) el.style.display = 'none'
          else this.finishLoading()
        })
      },
    },
    mounted() {
      this.finishLoading()
    },
  ```
  AFTER (watch `filtered` resets page; `onImgError` reads module-level `placeholderImg`; `finishLoading` uses imported `nextTick`; keep `assetUrl`/`mkt`/`categoryOf`/`changeClass`/`trendArrow`/`trendClass`/`sparkSvg`/`fmtPlat`/`fmtSignedPct` as free functions, unchanged bodies with `this.` stripped):
  ```ts
  watch(filtered, () => {
    page.value = 1
  })

  function priceOf(row: any): number {
    return Number(row.avg_price) > 0 ? row.avg_price : row.sell
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(finishLoading)
  ```
  (Also port unchanged helpers `assetUrl`, `mkt`, `categoryOf`, `changeClass`, `trendArrow`, `trendClass`, `sparkSvg`, `fmtPlat`, `fmtSignedPct` as `function` declarations — bodies identical, none reference `this`.)

- [ ] **Step 4: Template — v-text-field search field** (line 52). BEFORE:
  ```html
  <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  ```
  AFTER (`dark` removed — theme is dark by config; `dense` → `density="compact"`):
  ```html
  <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  ```

- [ ] **Step 5: Template — both `v-btn-toggle` groups + their `v-btn small`** (lines 55-59 and 63-67). BEFORE (Board group; Window group is identical shape):
  ```html
  <v-btn-toggle v-model="mode" mandatory dense dark>
    <v-btn value="gainers" small>Gainers</v-btn>
    <v-btn value="losers" small>Losers</v-btn>
    <v-btn value="volume" small>Volume</v-btn>
  </v-btn-toggle>
  ```
  AFTER (`dense`→`density="compact"`, drop `dark`, `small`→`size="small"`):
  ```html
  <v-btn-toggle v-model="mode" mandatory density="compact">
    <v-btn value="gainers" size="small">Gainers</v-btn>
    <v-btn value="losers" size="small">Losers</v-btn>
    <v-btn value="volume" size="small">Volume</v-btn>
  </v-btn-toggle>
  ```
  Apply the same transform to the Window toggle (`v-model="timeframe"`, values `change24h`/`change7d`/`change30d`).

- [ ] **Step 6: Template — `v-chip-group` + `v-chip`** (lines 70-72). In V3 the selected-class moves from the per-chip `active-class` to the group's `selected-class`, and `small`→`size="small"`. BEFORE:
  ```html
  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
  </v-chip-group>
  ```
  AFTER:
  ```html
  <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
  </v-chip-group>
  ```

- [ ] **Step 7: Template — the two `v-alert`s** (lines 76-78 and 141-146) and the `v-pagination` (line 137). BEFORE:
  ```html
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
  ...
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ...
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
  ```
  AFTER (`dark` removed everywhere; `dense`→`density="compact"`; `color`/`length`/`total-visible`/`type` unchanged; keep the `blue darken-4` utility class — it still resolves via Vuetify color classes):
  ```html
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
  ...
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ...
  <v-alert class="an-disclaimer blue darken-4" type="info" density="compact">
  ```
  (The `<client-only>` wrapper, the raw `<table class="an-table">`, `v-html="sparkSvg(...)"`, and `.an-*` markup all carry over unchanged.)

- [ ] **Step 8: `<style scoped>` — replace `>>>` deep combinator with `:deep()`** (lines 341-374, 4 occurrences). BEFORE:
  ```css
  .an-refine >>> .v-btn-toggle { ... }
  .an-refine >>> .v-btn-toggle .v-btn { ... }
  .an-refine >>> .v-btn-toggle .v-btn.v-btn--active { ... }
  .an-spark--wide >>> svg { ... }
  ```
  AFTER:
  ```css
  .an-refine :deep(.v-btn-toggle) { ... }
  .an-refine :deep(.v-btn-toggle .v-btn) { ... }
  .an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) { ... }
  .an-spark--wide :deep(svg) { ... }
  ```
  Note: the V3 active class is still `v-btn--active`, so `.v-btn.v-btn--active` styling continues to apply to the selected toggle button. Keep the rest of the rule bodies verbatim.

- [ ] **Step 9: Typecheck:** `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/movers.vue`.

- [ ] **Step 10: Verify in browser:** start backend from repo root (`npm run dev` on :3529) + `cd app-next && npm run dev`; load `/movers`. Expect: hero + 4 stat tiles render, `/market_analytics` data loads (table populates), Board/Window toggles and category chips filter, pagination works, spinner clears, zero console errors. Toggle a narrow viewport to confirm the mobile `.an-cards` path (`isMobile`) renders. Screenshot-diff vs old app `/movers` (close — accept Vuetify 3 default spacing/chip/toggle style shifts).

- [ ] **Step 11: Commit:** `git add app-next/app/pages/movers.vue && git commit -m "feat(migration): port Top Movers page to Nuxt4/Vue3/Vuetify3"`

---

### Task P6.2: Migrate pages/volatility.vue (Volatility Index page)

**Files:**
- Create: app-next/app/pages/volatility.vue
- Delete/superseded: app/pages/volatility.vue (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config runtimeConfig.public.apiURL, vuetify-nuxt-module, ssr:true), P1 (global analytics.css `.an-*` styles + Orokin Vuetify theme), P2 (default layout providing `#spinner-wrapper`)

**Scope note:** No Vuex, i18n, moment, leaflet, driver.js, v-data-table, v-simple-table, v-list-item-icon, v-subheader, v-menu, `.sync`, or `hidden-*` classes in this file. The table is a plain `<table class="an-table">`, so there is NO v-data-table header remap. Breaking surface is limited to data-fetching (asyncData/head/$config), the breakpoint helper, Vuetify-2 boolean attrs (`dark`/`dense`/`small`), and the scoped `>>>` deep combinator.

**Steps:**

- [ ] Step 1: Create the file and port `asyncData` + `head()` + Options API to `<script setup lang="ts">`. BEFORE (app/pages/volatility.vue lines 149-183):
```ts
export default {
  name: 'VolatilityPage',
  async asyncData({ $axios, $config }: any) {
    try {
      const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data)
      return {
        items: (data && data.items) || [],
        meta: (data && data.meta) || { count: 0, maxHistoryDays: 0 },
        loadError: false,
      }
    } catch (e) {
      return { items: [], meta: { count: 0, maxHistoryDays: 0 }, loadError: true }
    }
  },
  data() {
    return {
      items: [] as any[],
      meta: { count: 0, maxHistoryDays: 0 } as any,
      loadError: false,
      search: '',
      mode: 'volatile',
      category: 'All',
      page: 1,
      perPage: 25,
      placeholderImg: "data:image/svg+xml,...",
    }
  },
  head() {
    return {
      title: 'Volatility Index — Warframe Market price stability ranking',
      meta: [{ hid: 'description', name: 'description', content: "Rank every Warframe Market item by price volatility ..." }],
    }
  },
```
AFTER (top of `<script setup lang="ts">`; keeps the exact SVG placeholder string and description verbatim):
```ts
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useDisplay } from 'vuetify'

const config = useRuntimeConfig()
const base = config.public.apiURL

// SSR fetch — preserve old try/catch -> loadError intent
const { data, error } = await useAsyncData('market-analytics-volatility', () =>
  $fetch<any>(`${base}/market_analytics`),
)
const loadError = computed(() => !!error.value)

// map old asyncData return fields onto refs with the SAME defaults
const items = computed<any[]>(() => (data.value && data.value.items) || [])
const meta = computed<any>(() => (data.value && data.value.meta) || { count: 0, maxHistoryDays: 0 })

// old data() locals
const search = ref('')
const mode = ref('volatile')
const category = ref('All')
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

const { mobile } = useDisplay()

useSeoMeta({
  title: 'Volatility Index — Warframe Market price stability ranking',
  description:
    "Rank every Warframe Market item by price volatility (coefficient of variation) from long-term daily price history — see what's stable to hold or farm and what's swingy and arbitrage-rich.",
})
```

- [ ] Step 2: Port the breakpoint helper. BEFORE (lines 185-187):
```ts
isMobile(): boolean {
  return (this as any).$vuetify.breakpoint.mobile
},
```
AFTER: delete this computed entirely and reference `mobile` (the `useDisplay()` ref from Step 1) directly in the template (`v-else-if="!mobile"`, `v-else`, `:total-visible="mobile ? 5 : 9"`). No `isMobile` computed is needed.

- [ ] Step 3: Port the remaining computeds verbatim as standalone `computed(...)` using `.value` on refs. The logic is unchanged; only `this.X` -> `X.value` and `this.items` -> `items.value`. Example — BEFORE (lines 194-206):
```ts
filtered(): any[] {
  const q = (this.search || '').toString().trim().toLowerCase()
  let list = (this.items as any[]).filter((r) => {
    if (r.volatility === null || r.volatility === undefined) return false
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
    if (this.mode === 'stable' && (r.dataDays || 0) < 7) return false
    return true
  })
  if (this.mode === 'stable') list = list.slice().sort((a, b) => a.volatility - b.volatility)
  else list = list.slice().sort((a, b) => b.volatility - a.volatility)
  return list
},
```
AFTER:
```ts
const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  let list = items.value.filter((r) => {
    if (r.volatility === null || r.volatility === undefined) return false
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if (mode.value === 'stable' && (r.dataDays || 0) < 7) return false
    return true
  })
  if (mode.value === 'stable') list = list.slice().sort((a, b) => a.volatility - b.volatility)
  else list = list.slice().sort((a, b) => b.volatility - a.volatility)
  return list
})
```
Do the same mechanical `this.` -> ref/`.value` port for `categoryOptions`, `pageCount`, `paged`, `topDeal`, `topDealUrl`, `emptyMessage`, `stats` (lines 188-239). `topDeal` stays a computed returning `any` (template guards it with `v-if="topDeal"`).

- [ ] Step 4: Port `watch` + `mounted`. BEFORE (lines 241-248):
```ts
watch: {
  filtered() {
    this.page = 1
  },
},
mounted() {
  this.finishLoading()
},
```
AFTER:
```ts
watch(filtered, () => {
  page.value = 1
})

onMounted(() => {
  finishLoading()
})
```

- [ ] Step 5: Port all `methods` to plain functions (drop `this.`; `this.$nextTick` -> imported `nextTick`; recursion self-refers by name). `assetUrl`, `mkt`, `onImgError`, `priceOf`, `categoryOf`, `volClass`, `volLabel`, `trendArrow`, `trendClass`, `sparkSvg`, `fmtPlat`, `fmtVol` are pure — copy their bodies verbatim as `function name(...) { ... }`. `onImgError` uses `this.placeholderImg` -> `placeholderImg`. `finishLoading` — BEFORE (lines 319-325):
```ts
finishLoading() {
  this.$nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else this.finishLoading()
  })
},
```
AFTER:
```ts
function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) (el as HTMLElement).style.display = 'none'
    else finishLoading()
  })
}
```

- [ ] Step 6: Fix Vuetify-2 boolean attrs in the `<template>`. The template markup and `.an-*` classes are otherwise unchanged. Apply these edits:
  - Line 51 — BEFORE: `<v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>` — AFTER: drop `dark`, `dense` -> `density="compact"`: `<v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>`
  - Lines 54-57 — BEFORE:
```html
<v-btn-toggle v-model="mode" mandatory dense dark>
  <v-btn value="volatile" small>Most volatile</v-btn>
  <v-btn value="stable" small>Most stable</v-btn>
</v-btn-toggle>
```
  AFTER (drop `dark`, `dense` -> `density="compact"`, `small` -> `size="small"`):
```html
<v-btn-toggle v-model="mode" mandatory density="compact">
  <v-btn value="volatile" size="small">Most volatile</v-btn>
  <v-btn value="stable" size="small">Most stable</v-btn>
</v-btn-toggle>
```
  - Line 61 — BEFORE: `<v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>` — AFTER: `small` -> `size="small"`: `<v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ c }}</v-chip>`
  - Line 66 — BEFORE: `<v-alert v-if="loadError" type="error" dark dense class="ma-4">` — AFTER: `<v-alert v-if="loadError" type="error" density="compact" class="ma-4">`
  - Lines 73 & 112 — replace `!isMobile` / else usage: `v-else-if="!isMobile"` -> `v-else-if="!mobile"` (line 73). Line 112 `v-else` unchanged.
  - Line 135 — BEFORE: `<v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>` — AFTER (drop `dark`, `isMobile` -> `mobile`): `<v-pagination v-model="page" :length="pageCount" :total-visible="mobile ? 5 : 9" color="#d4af5a"></v-pagination>`
  - Line 139 — BEFORE: `<v-alert class="an-disclaimer blue darken-4" type="info" dense>` — AFTER: `<v-alert class="an-disclaimer blue darken-4" type="info" density="compact">` (the `blue darken-4` legacy color classes render as plain CSS class names; keep as-is for visual parity).

- [ ] Step 7: Fix scoped-style deep selectors. Vuetify 3 + Vite drops the `>>>` combinator; use `:deep()`. BEFORE (lines 339-354 & 368-371):
```css
.an-refine >>> .v-btn-toggle { ... }
.an-refine >>> .v-btn-toggle .v-btn { ... }
.an-refine >>> .v-btn-toggle .v-btn.v-btn--active { ... }
.an-spark--wide >>> svg { width: 100%; height: 34px; }
```
AFTER (wrap the deep portion in `:deep()`; keep every declaration body identical):
```css
.an-refine :deep(.v-btn-toggle) { ... }
.an-refine :deep(.v-btn-toggle .v-btn) { ... }
.an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) { ... }
.an-spark--wide :deep(svg) { width: 100%; height: 34px; }
```
Leave the non-deep scoped rules (`.an-refine`, `.an-refine__lbl`, `.an-stat__num.is-bad`, `.pill--bad`, `.an-spark`) unchanged.

- [ ] Step 8: Keep `<client-only>` wrapper as-is — Nuxt 3 provides the `<ClientOnly>` component and the kebab-case `<client-only>` alias resolves. The `v-html="sparkSvg(...)"` bindings are unchanged.

- [ ] Step 9: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (watch for `data.value` possibly-undefined access — the computeds already guard with `(data.value && data.value.items) || []`).

- [ ] Step 10: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/volatility`. Expect: hero + stats + filters render, the table (desktop width) and card layout (narrow width) both render, search/board-toggle/category-chips filter live, pager appears when `filtered.length > 25`, sparklines draw, zero console errors, `#spinner-wrapper` hidden after mount, and `loadError` alert shows only when the API is down. Screenshot-diff `/volatility` vs old app (close; accept Vuetify 3 default spacing shifts on the text-field/btn-toggle/chips/alert/pagination).

- [ ] Step 11: Commit: `git add app-next/app/pages/volatility.vue && git commit -m "feat(migration): port volatility page to Nuxt4/Vue3/Vuetify3"`

---

### Task P6.3: Port pages/screener.vue to Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/pages/screener.vue`
- Delete/superseded: `app/pages/screener.vue` (reference only; old app stays until cutover)

**Depends on:** P0-P3 infra (vuetify-nuxt-module, V3 theme, global `analytics.css`, `#spinner-wrapper`); P4 store `app-next/app/stores/items.ts` exposing `useItemsStore().allItems`. No asyncData / useAsyncData needed (all data comes from the store). No `moment` / `leaflet` / `driver.js` in this file.

**Notes:** This page has **no `<style>` block** — every `.an-*` class comes from the global `analytics.css`, so the whole `<style>` porting concern does not apply. All business logic (priced/filtered/sorters/stats/formatters) ports verbatim; only framework bindings change. Copy the `<template>` unchanged **except** the specific tags in Steps 1-5.

**Steps:**

- [ ] Step 1: Fix the filter-row inputs — drop `dark`, change `dense` → `density="compact"`. BEFORE:
```html
<v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
<v-text-field v-model.number="minVolume" dark dense hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
<v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 240px"></v-select>
```
AFTER (V3: `v-select` default item title key is `title`; `sortOptions` is remapped to `{title,value}` in Step 6, so no `item-title` override needed):
```html
<v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
<v-text-field v-model.number="minVolume" density="compact" hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
<v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 240px"></v-select>
```

- [ ] Step 2: Fix the chip group — move `active-class` off the chip onto the group as `selected-class`, and `small` → `size="small"`. BEFORE:
```html
<v-chip-group v-model="category" mandatory column class="an-cats">
  <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
</v-chip-group>
```
AFTER:
```html
<v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
  <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
</v-chip-group>
```

- [ ] Step 3: Fix the switches — drop `dark`, `dense` → `density="compact"`. BEFORE:
```html
<v-switch v-model="onlyVaulted" dark dense hide-details inset color="#4fb3bf" label="Only vaulted"></v-switch>
<v-switch v-model="onlyDucats" dark dense hide-details inset color="#d4af5a" label="Only ducat items"></v-switch>
```
AFTER:
```html
<v-switch v-model="onlyVaulted" density="compact" hide-details inset color="#4fb3bf" label="Only vaulted"></v-switch>
<v-switch v-model="onlyDucats" density="compact" hide-details inset color="#d4af5a" label="Only ducat items"></v-switch>
```

- [ ] Step 4: Fix pagination (drop `dark`) and the two `isMobile` template refs → `mobile` (see Step 6 `useDisplay`). BEFORE:
```html
<div v-else-if="!isMobile" class="an-tablewrap">
```
```html
<v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
```
AFTER:
```html
<div v-else-if="!mobile" class="an-tablewrap">
```
```html
<v-pagination v-model="page" :length="pageCount" :total-visible="mobile ? 5 : 9" color="#d4af5a"></v-pagination>
```
(Also update the mobile-cards branch: BEFORE `<div v-else class="an-cards">` stays the same — it is the `v-else` to `!mobile`, no edit needed. Only the two `isMobile` occurrences above change.)

- [ ] Step 5: Fix the disclaimer alert — `dense` → `density="compact"`, color class `blue darken-4` → `bg-blue-darken-4`. BEFORE:
```html
<v-alert class="an-disclaimer blue darken-4" type="info" dense>
```
AFTER:
```html
<v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
```

- [ ] Step 6: Replace the entire `<script lang="ts"> … </script>` (Options API + Vuex + head + $vuetify) with `<script setup lang="ts">`. BEFORE (the current block, abridged — Vuex getter, head(), breakpoint):
```ts
import { mapGetters } from 'vuex'
export default {
  name: 'MarketScreenerPage',
  data() { return { search:'', minVolume:0, category:'All', sortKey:'discount', onlyVaulted:false, onlyDucats:false, page:1, perPage:25, placeholderImg:'…', sortOptions:[{ text:'Biggest discount', value:'discount' }, …] } },
  head() { return { title:'Market Screener — scan every Warframe Market item', meta:[{ hid:'description', name:'description', content:'…' }] } },
  computed: { ...mapGetters({ allItems:'all_items' }), isMobile(){ return this.$vuetify.breakpoint.mobile }, priced(){…}, … },
  watch: { filtered(){ this.page = 1 } },
  mounted() { this.finishLoading() },
  methods: { …, finishLoading(){ this.$nextTick(() => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display='none'; else this.finishLoading() }) } },
}
```
AFTER (full replacement — paste verbatim):
```ts
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useHead } from '#imports'
import { useItemsStore } from '~/stores/items'

useHead({
  title: 'Market Screener — scan every Warframe Market item',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content:
        'Sortable whole-catalogue Warframe Market screener: bid/ask spread, discount vs average price, 48h volume and ducat value across every tradeable item.',
    },
  ],
})

const store = useItemsStore()
const allItems = computed<any[]>(() => store.allItems)

const { mobile } = useDisplay()

const search = ref('')
const minVolume = ref(0)
const category = ref('All')
const sortKey = ref('discount')
const onlyVaulted = ref(false)
const onlyDucats = ref(false)
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

// NOTE: V3 v-select default item-title key is `title` (was `text` in V2)
const sortOptions = [
  { title: 'Biggest discount', value: 'discount' },
  { title: 'Widest spread', value: 'spread' },
  { title: 'Spread %', value: 'spreadPct' },
  { title: 'Volume', value: 'volume' },
  { title: 'Ducats per plat', value: 'ducatEff' },
  { title: 'Price (sell)', value: 'price' },
  { title: 'Name (A–Z)', value: 'name' },
]

// ---- helpers (were methods) ----
function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function mkt(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function categoryOf(tags: string[] = []): string {
  const t = (tags || []).map((x) => (x || '').toLowerCase())
  if (t.includes('warframe')) return 'Warframe'
  if (t.includes('primary')) return 'Primary'
  if (t.includes('secondary')) return 'Secondary'
  if (t.includes('melee')) return 'Melee'
  if (t.includes('mod')) return 'Mod'
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
  return 'Other'
}
function discountOf(row: any): number {
  const avg = Number(row.market.avg_price) || 0
  const sell = Number(row.market.sell) || 0
  if (avg <= 0 || sell <= 0) return 0
  return ((avg - sell) / avg) * 100
}
function spreadPct(row: any): number {
  const sell = Number(row.market.sell) || 0
  return sell > 0 ? ((row.market.diff || 0) / sell) * 100 : 0
}
function ducatEff(row: any): number {
  const sell = Number(row.market.sell) || 0
  const ducats = Number(row.ducats) || 0
  return sell > 0 && ducats > 0 ? ducats / sell : 0
}
function discountClass(discount: number): string {
  if (discount > 1) return 'up'
  if (discount < -1) return 'down'
  return 'flat'
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmtPct(n: number): string {
  return `${(Number(n) || 0).toFixed(0)}%`
}
function fmtSignedPct(n: number): string {
  const v = Number(n) || 0
  return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
}

// ---- derived state (were computed) ----
const priced = computed<any[]>(() =>
  allItems.value
    .filter((i) => i && i.market && (i.market.sell > 0 || i.market.buy > 0))
    .map((i) => ({ ...i, discount: discountOf(i) }))
)

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of priced.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const list = priced.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if ((r.market.volume || 0) < minV) return false
    if (onlyVaulted.value && !r.vaulted) return false
    if (onlyDucats.value && !r.ducats) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    discount: (a, b) => dir(a.discount, b.discount),
    spread: (a, b) => dir(a.market.diff, b.market.diff),
    spreadPct: (a, b) => dir(spreadPct(a), spreadPct(b)),
    volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
    ducatEff: (a, b) => dir(ducatEff(a), ducatEff(b)),
    price: (a, b) => dir(a.market.sell || 0, b.market.sell || 0),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.discount)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of priced.value) if (!best || r.discount > best.discount) best = r
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) if (!best || r.discount > best.discount) best = r
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = priced.value
  const spreads = list.map((r) => r.market.diff || 0)
  return {
    total: list.length,
    underpriced: list.filter((r) => r.discount > 0).length,
    avgSpread: spreads.length ? spreads.reduce((s, v) => s + v, 0) / spreads.length : 0,
    vaulted: list.filter((r) => r.vaulted).length,
  }
})

// reset page when the filtered result set changes
watch(filtered, () => {
  page.value = 1
})

// hide the global loading spinner (per frontend-loading-spinner memory)
function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}
onMounted(finishLoading)
</script>
```

- [ ] Step 7: Confirm the template still references only names that now exist in setup scope: `topDeal`, `stats`, `search`, `minVolume`, `sortKey`, `sortOptions`, `category`, `categoryOptions`, `onlyVaulted`, `onlyDucats`, `filtered`, `mobile`, `paged`, `topDealUrl`, `page`, `pageCount`, `perPage`, and helpers `fmtPct/fmtPlat/fmtSignedPct/mkt/assetUrl/onImgError/spreadPct/discountClass`. All are exposed by `<script setup>` automatically. Keep `<client-only>` (Nuxt 3 built-in) as-is.

- [ ] Step 8: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/screener.vue` (the `any`-typed rows mirror the source; no new type holes introduced).

- [ ] Step 9: Verify in browser: start backend at repo root `npm run dev` (:3529) + `cd app-next && npm run dev`; load `/screener`. Expect: table renders with item thumbnails, the "Deepest discount" hero card and the 4 stat tiles populate, search/min-volume/sort-select/category-chips/vaulted+ducat switches all filter live, pagination appears when >25 rows, and resizing to a narrow viewport swaps the table for the `.an-cards` layout. Zero console errors; global spinner disappears. Screenshot-diff `/screener` vs the old app at the same route (close match; accept V3 default spacing on inputs/chips/switches).

- [ ] Step 10: Commit: `git add app-next/app/pages/screener.vue && git commit -m "feat(app-next): port screener page to Vue 3 / Vuetify 3"`

---

### Task P6.4: Migrate pages/timing.vue (Buy / Sell Timing) to Nuxt 4 / Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/pages/timing.vue`
- Delete/superseded: `app/pages/timing.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config.ts: `runtimeConfig.public.apiURL`, vuetify-nuxt-module, `ssr:true`), P1 (default layout + `#spinner-wrapper`), P2 (`analytics.css` `.an-*` styles imported globally), P3 (composable conventions).

Notes: this page uses **no** Vuex/store, **no** i18n, **no** moment/leaflet/driver.js, **no** `.sync`, **no** `v-data-table`/`v-simple-table` (it renders a raw `<table>`), and **no** dynamic route. Breakage is limited to `asyncData`/`head`/`$vuetify.breakpoint` and Vuetify-2 prop/class shims.

**Steps:**

- [ ] **Step 1: Convert the whole `<script>` from Options API to `<script setup lang="ts">`.**
  BEFORE (`app/pages/timing.vue`, lines 158-192 — the asyncData/data/head block):
  ```ts
  export default {
    name: 'TimingPage',
    async asyncData({ $axios, $config }: any) {
      try {
        const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data)
        return {
          items: (data && data.items) || [],
          meta: (data && data.meta) || { count: 0, maxHistoryDays: 0 },
          loadError: false,
        }
      } catch (e) {
        return { items: [], meta: { count: 0, maxHistoryDays: 0 }, loadError: true }
      }
    },
    data() {
      return {
        items: [] as any[],
        meta: { count: 0, maxHistoryDays: 0 } as any,
        loadError: false,
        search: '',
        mode: 'all',
        category: 'All',
        page: 1,
        perPage: 25,
        placeholderImg: "data:image/svg+xml,%3Csvg ... %3E",
      }
    },
    head() {
      return {
        title: 'Buy / Sell Timing — Warframe Market all-time-low & high flags',
        meta: [{ hid: 'description', name: 'description', content: "Time your Warframe Market trades: ..." }],
      }
    },
  ```
  AFTER (replace the entire `<script lang="ts"> ... </script>` block, lines 158-343, with this `<script setup>`; the method/computed bodies are ported verbatim, only `this.` → local refs/fns):
  ```ts
  <script setup lang="ts">
  import { ref, computed, watch, onMounted, nextTick } from 'vue'
  import { useDisplay } from 'vuetify'

  const config = useRuntimeConfig()
  const base = config.public.apiURL

  const { data, error } = await useAsyncData('market-analytics-timing', () =>
    $fetch<any>(`${base}/market_analytics`),
  )
  const loadError = computed(() => !!error.value)
  const items = computed<any[]>(() => (data.value && data.value.items) || [])
  const meta = computed<any>(() => (data.value && data.value.meta) || { count: 0, maxHistoryDays: 0 })

  useSeoMeta({
    title: 'Buy / Sell Timing — Warframe Market all-time-low & high flags',
    description:
      "Time your Warframe Market trades: our long-term daily price history flags when an item is near its all-time low (a buy) or all-time high (a sell), with a plain buy / hold / sell read.",
  })

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  const search = ref('')
  const mode = ref('all')
  const category = ref('All')
  const page = ref(1)
  const perPage = 25
  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

  // --- methods -> functions (bodies verbatim, this. dropped) ---
  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function mkt(urlName: string): string {
    return 'https://warframe.market/items/' + urlName
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function priceOf(row: any): number {
    return Number(row.avg_price) > 0 ? row.avg_price : row.sell
  }
  function categoryOf(tags: string[] = []): string {
    const t = (tags || []).map((x) => (x || '').toLowerCase())
    if (t.includes('warframe')) return 'Warframe'
    if (t.includes('primary')) return 'Primary'
    if (t.includes('secondary')) return 'Secondary'
    if (t.includes('melee')) return 'Melee'
    if (t.includes('mod')) return 'Mod'
    if (t.includes('sentinel')) return 'Sentinel'
    if (t.includes('companion') || t.includes('pet')) return 'Companion'
    if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
    return 'Other'
  }
  function signalable(row: any): boolean {
    return !!row && row.dataDays >= 7 && row.atl != null && row.ath != null && row.pctFromAtl != null && row.pctFromAth != null
  }
  function signal(row: any): { label: string; cls: string; note: string } {
    if (!signalable(row)) return { label: 'Hold', cls: 'pill--even', note: 'mid-range' }
    if (row.pctFromAtl <= 5) return { label: 'Buy', cls: 'pill--good', note: 'near its low' }
    if (row.pctFromAth >= -5) return { label: 'Sell', cls: 'pill--alt', note: 'near its high' }
    return { label: 'Hold', cls: 'pill--even', note: 'mid-range' }
  }
  function vsLowClass(row: any): string {
    return row.pctFromAtl != null && row.pctFromAtl <= 5 ? 'up' : 'flat'
  }
  function vsHighClass(row: any): string {
    return row.pctFromAth != null && row.pctFromAth >= -5 ? 'down' : 'flat'
  }
  function trendArrow(t: string): string {
    return t === 'up' ? '▲' : t === 'down' ? '▼' : '▬'
  }
  function trendClass(t: string): string {
    return t === 'up' ? 'up' : t === 'down' ? 'down' : 'flat'
  }
  function sparkSvg(spark: number[], change: number): string {
    const pts = (spark || []).filter((n) => typeof n === 'number')
    if (pts.length < 2) return ''
    const w = 88
    const h = 24
    const pad = 2
    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const range = max - min || 1
    const step = (w - pad * 2) / (pts.length - 1)
    const coords = pts
      .map((v, i) => {
        const x = pad + i * step
        const y = pad + (h - pad * 2) * (1 - (v - min) / range)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    const color = change > 0 ? '#4caf7d' : change < 0 ? '#e57373' : '#9aa0b4'
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="${coords}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }

  // --- computed -> computed(); this.X -> X.value / fn() ---
  const signalItems = computed<any[]>(() => items.value.filter((r) => signalable(r)))
  const categoryOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of signalItems.value) present.add(categoryOf(r.tags))
    const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
    return ['All', ...order.filter((c) => present.has(c))]
  })
  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    let list = signalItems.value.filter((r) => {
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
      const label = signal(r).label
      if (mode.value === 'buy' && label !== 'Buy') return false
      if (mode.value === 'sell' && label !== 'Sell') return false
      return true
    })
    if (mode.value === 'sell') list = list.slice().sort((a, b) => b.pctFromAth - a.pctFromAth)
    else list = list.slice().sort((a, b) => a.pctFromAtl - b.pctFromAtl)
    return list
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })
  const topDeal = computed<any>(() => {
    let best: any = null
    for (const r of signalItems.value) {
      if (signal(r).label !== 'Buy') continue
      if (!(Number(r.volume) > 0)) continue
      if (!best || r.pctFromAtl < best.pctFromAtl) best = r
    }
    return best
  })
  const topDealUrl = computed(() => (topDeal.value ? topDeal.value.url_name : ''))
  const emptyMessage = computed(
    () => 'No items have enough price history for a timing call yet — this fills in as daily snapshots accumulate.',
  )
  const stats = computed<any>(() => {
    const sig = signalItems.value
    let buy = 0
    let sell = 0
    for (const r of sig) {
      const label = signal(r).label
      if (label === 'Buy') buy++
      else if (label === 'Sell') sell++
    }
    return { withSignal: sig.length, buy, sell }
  })

  watch(filtered, () => {
    page.value = 1
  })

  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(() => finishLoading())
  </script>
  ```
  (Note: `useAsyncData` + `useRuntimeConfig` + `useSeoMeta` are Nuxt auto-imports — no import line needed. Template already references `items`, `meta`, `filtered`, `paged`, `isMobile`, etc. by the same names, so no `<template>` binding renames are required for script identifiers.)

- [ ] **Step 2: `v-text-field` — drop `dark`, `dense` → `density="compact"`.**
  BEFORE (line 50):
  ```html
  <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  ```
  AFTER:
  ```html
  <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  ```

- [ ] **Step 3: `v-btn-toggle` — drop `dark`, `dense` → `density="compact"`; child `v-btn small` → `size="small"`.**
  BEFORE (lines 53-57):
  ```html
  <v-btn-toggle v-model="mode" mandatory dense dark>
    <v-btn value="all" small>All</v-btn>
    <v-btn value="buy" small>Buy signals</v-btn>
    <v-btn value="sell" small>Sell signals</v-btn>
  </v-btn-toggle>
  ```
  AFTER:
  ```html
  <v-btn-toggle v-model="mode" mandatory density="compact">
    <v-btn value="all" size="small">All</v-btn>
    <v-btn value="buy" size="small">Buy signals</v-btn>
    <v-btn value="sell" size="small">Sell signals</v-btn>
  </v-btn-toggle>
  ```

- [ ] **Step 4: `v-chip-group` — move selection styling to `selected-class`; `v-chip small active-class` → `size="small"`, drop `active-class` (Vuetify 3 chip-group uses `selected-class`).**
  BEFORE (lines 60-62):
  ```html
  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
  </v-chip-group>
  ```
  AFTER:
  ```html
  <v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
  </v-chip-group>
  ```

- [ ] **Step 5: Error `v-alert` — drop `dark`, `dense` → `density="compact"`.**
  BEFORE (lines 66-68):
  ```html
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
    Couldn't load analytics. The market service may be waking up — try a refresh.
  </v-alert>
  ```
  AFTER:
  ```html
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
    Couldn't load analytics. The market service may be waking up — try a refresh.
  </v-alert>
  ```

- [ ] **Step 6: `v-pagination` — drop `dark` (color prop kept).**
  BEFORE (line 144):
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ```
  AFTER:
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ```

- [ ] **Step 7: Disclaimer `v-alert` — `dense` → `density="compact"`; replace removed `blue darken-4` background helper classes with the `color` prop.**
  BEFORE (lines 148-153):
  ```html
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    Bands are built from our own daily price series (average trade price,
    falling back to the sell order). An item needs at least 7 days of history
    to get a call, and "near its low / high" means within 5% of the extreme we
    have on record — coverage deepens every day the sync runs.
  </v-alert>
  ```
  AFTER:
  ```html
  <v-alert class="an-disclaimer" type="info" color="blue-darken-4" density="compact">
    Bands are built from our own daily price series (average trade price,
    falling back to the sell order). An item needs at least 7 days of history
    to get a call, and "near its low / high" means within 5% of the extreme we
    have on record — coverage deepens every day the sync runs.
  </v-alert>
  ```

- [ ] **Step 8: Scoped styles — replace `>>>` deep combinator with `:deep()`.**
  BEFORE (lines 354-378, the four `>>>` selectors):
  ```css
  .an-refine >>> .v-btn-toggle { ... }
  .an-refine >>> .v-btn-toggle .v-btn { ... }
  .an-refine >>> .v-btn-toggle .v-btn.v-btn--active { ... }
  .an-spark--wide >>> svg { width: 100%; height: 34px; }
  ```
  AFTER:
  ```css
  .an-refine :deep(.v-btn-toggle) { ... }
  .an-refine :deep(.v-btn-toggle .v-btn) { ... }
  .an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) { ... }
  .an-spark--wide :deep(svg) { width: 100%; height: 34px; }
  ```
  (Keep every declaration body verbatim; only the combinator changes. `client-only`, `v-alert`, `v-chip`, `v-text-field`, `v-html`, and the raw `<table>` markup otherwise stay as-is.)

- [ ] **Step 9: Typecheck:** `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/timing.vue`.

- [ ] **Step 10: Verify in browser:** start backend from repo root (`npm run dev` on :3529), then `cd app-next && npm run dev`; load `/timing`. Expect: hero + stat tiles render, table (desktop) / cards (mobile via devtools responsive) render, search box / signal toggle / category chips filter live, pagination works, sparklines draw, spinner disappears, zero console errors, `loadError` alert only appears if the API is down. Screenshot-diff against old app `/timing` (close match; accept Vuetify 3 default spacing shifts on chips/toggle/alerts).

- [ ] **Step 11: Commit:** `git add app-next/app/pages/timing.vue && git commit -m "feat(migration): port timing.vue to Nuxt4/Vue3/Vuetify3"`

---

### Task P6.5: Migrate vault-spikes.vue to Nuxt 4 / Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/pages/vault-spikes.vue`
- Delete/superseded: `app/pages/vault-spikes.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config.ts + vuetify-nuxt-module + analytics.css), P1 (app.vue/default layout owning `#spinner-wrapper`), P2 (`runtimeConfig.public.apiURL`).

**Notes on scope:** No Vuex, no i18n, no moment/leaflet/driver.js, no `v-data-table`/`v-simple-table` (the table is hand-rolled `<table class="an-table">`), no `v-list-item-icon`, no `v-subheader`, no `.sync`, no `v-menu` activator. The work is: convert asyncData/head/Options-API to `<script setup>`, swap `$vuetify.breakpoint` for `useDisplay`, and clean up Vuetify-2 attrs on the form controls + the `blue darken-4` class + `>>>` deep selectors.

**Steps:**

- [ ] Step 1: Replace the entire `<script lang="ts">` Options block with `<script setup lang="ts">`. Port `asyncData` to `useAsyncData` + `$fetch`, keeping the same defaults and mapping `loadError` off `error`.

  BEFORE:
  ```ts
  export default {
    name: 'VaultSpikesPage',
    async asyncData({ $axios, $config }: any) {
      try {
        const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data)
        return {
          items: (data && data.items) || [],
          meta: (data && data.meta) || { count: 0, maxHistoryDays: 0 },
          loadError: false,
        }
      } catch (e) {
        return { items: [], meta: { count: 0, maxHistoryDays: 0 }, loadError: true }
      }
    },
    data() {
      return {
        items: [] as any[],
        meta: { count: 0, maxHistoryDays: 0 } as any,
        loadError: false,
        search: '',
        timeframe: 'change7d',
        onlyClimbing: true,
        category: 'All',
        page: 1,
        perPage: 25,
        placeholderImg:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
      }
    },
  ```

  AFTER (top of script setup — imports, data fetch, reactive state):
  ```ts
  import { ref, computed, watch, onMounted, nextTick } from 'vue'
  import { useDisplay } from 'vuetify'

  const config = useRuntimeConfig()
  const base = config.public.apiURL

  const { data, error } = await useAsyncData('vault-spikes-market-analytics', () =>
    $fetch<any>(`${base}/market_analytics`),
  )
  const loadError = computed(() => !!error.value)
  const items = computed<any[]>(() => (data.value && data.value.items) || [])
  // meta preserved for parity (unused in template but part of the old asyncData return)
  const meta = computed<any>(() => (data.value && data.value.meta) || { count: 0, maxHistoryDays: 0 })

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  const search = ref('')
  const timeframe = ref<'change7d' | 'change30d'>('change7d')
  const onlyClimbing = ref(true)
  const category = ref('All')
  const page = ref(1)
  const perPage = 25
  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
  ```

- [ ] Step 2: Port `head()` to `useHead` verbatim (title + description meta).

  BEFORE:
  ```ts
  head() {
    return {
      title: 'Vault Spike Feed — rising vaulted Warframe prime prices',
      meta: [{ hid: 'description', name: 'description', content: 'Every vaulted Warframe prime whose plat price is spiking, ranked by 7-day and 30-day change from our own daily price history. Catch the post-vault sell window before the spike fades.' }],
    }
  },
  ```

  AFTER:
  ```ts
  useHead({
    title: 'Vault Spike Feed — rising vaulted Warframe prime prices',
    meta: [
      {
        name: 'description',
        content:
          'Every vaulted Warframe prime whose plat price is spiking, ranked by 7-day and 30-day change from our own daily price history. Catch the post-vault sell window before the spike fades.',
      },
    ],
  })
  ```

- [ ] Step 3: Convert every `computed` getter to a standalone `computed()`. Drop `this.`, and read the refs' `.value` in script (templates auto-unwrap). Watch out: `changeKey` returns `timeframe.value`; all `this.items`/`this.category`/`this.search`/`this.onlyClimbing` become the corresponding refs/computeds.

  BEFORE (representative — `isMobile`, `changeKey`, `filtered`, `stats`):
  ```ts
  isMobile(): boolean {
    return (this as any).$vuetify.breakpoint.mobile
  },
  changeKey(): string {
    return this.timeframe
  },
  ...
  filtered(): any[] {
    const q = (this.search || '').toString().trim().toLowerCase()
    const key = this.changeKey
    let list = (this.items as any[]).filter((r) => {
      if (!r.vaulted) return false
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
      return true
    })
    if (this.onlyClimbing) list = list.filter((r) => Number(r[key]) > 0)
    const nz = (v: any) => (v === null || v === undefined ? -Infinity : Number(v))
    return list.slice().sort((a, b) => nz(b[key]) - nz(a[key]))
  },
  stats(): any {
    const key = this.changeKey
    const vault = (this.items as any[]).filter((r) => r.vaulted)
    const changes = vault.map((r) => r[key]).filter((v) => v !== null && v !== undefined).map(Number)
    const positives = changes.filter((v) => v > 0)
    return { vaultedTracked: vault.length, climbingNow: positives.length, biggestSpike: changes.length ? Math.max(...changes) : 0, avgSpike: positives.length ? positives.reduce((s, v) => s + v, 0) / positives.length : 0 }
  },
  ```

  AFTER (`isMobile` already defined in Step 1; port the rest — full list: `changeKey`, `timeframeLabel`, `categoryOptions`, `filtered`, `pageCount`, `paged`, `topDeal`, `topDealUrl`, `emptyMessage`, `stats`):
  ```ts
  const changeKey = computed(() => timeframe.value)
  const timeframeLabel = computed(
    () => ({ change7d: '7d', change30d: '30d' } as any)[timeframe.value] || '7d',
  )
  const categoryOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of items.value) present.add(categoryOf(r.tags))
    const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
    return ['All', ...order.filter((c) => present.has(c))]
  })
  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const key = changeKey.value
    let list = items.value.filter((r) => {
      if (!r.vaulted) return false
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
      return true
    })
    if (onlyClimbing.value) list = list.filter((r) => Number(r[key]) > 0)
    const nz = (v: any) => (v === null || v === undefined ? -Infinity : Number(v))
    return list.slice().sort((a, b) => nz(b[key]) - nz(a[key]))
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })
  const topDeal = computed<any>(() => (filtered.value.length ? filtered.value[0] : null))
  const topDealUrl = computed(() => (topDeal.value ? topDeal.value.url_name : ''))
  const emptyMessage = computed(
    () =>
      "No vaulted items are climbing right now — either prices are flat or history is still accumulating. Toggle off 'Only climbing' to see every vaulted item.",
  )
  const stats = computed<any>(() => {
    const key = changeKey.value
    const vault = items.value.filter((r) => r.vaulted)
    const changes = vault.map((r) => r[key]).filter((v) => v !== null && v !== undefined).map(Number)
    const positives = changes.filter((v) => v > 0)
    return {
      vaultedTracked: vault.length,
      climbingNow: positives.length,
      biggestSpike: changes.length ? Math.max(...changes) : 0,
      avgSpike: positives.length ? positives.reduce((s, v) => s + v, 0) / positives.length : 0,
    }
  })
  ```

- [ ] Step 4: Port the `watch` (reset page on filter change) and `mounted`/`finishLoading` spinner-hide. Use imported `nextTick`, not `this.$nextTick`.

  BEFORE:
  ```ts
  watch: {
    filtered() {
      this.page = 1
    },
  },
  mounted() {
    this.finishLoading()
  },
  ...
    finishLoading() {
      this.$nextTick(() => {
        const el = document.getElementById('spinner-wrapper')
        if (el) el.style.display = 'none'
        else this.finishLoading()
      })
    },
  ```

  AFTER:
  ```ts
  watch(filtered, () => {
    page.value = 1
  })

  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(finishLoading)
  ```

- [ ] Step 5: Convert the remaining `methods` to plain functions (no `this.`). These are all used by the template (`assetUrl`, `mkt`, `onImgError`, `priceOf`, `categoryOf`, `fromLow`, `changeClass`, `sparkSvg`, `fmtPlat`, `fmtSignedPct`) plus the unused-but-kept `trendArrow`/`trendClass`. Only `onImgError` references a ref (`placeholderImg` — now a module const, so no change needed there).

  BEFORE (representative):
  ```ts
  onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = this.placeholderImg
  },
  priceOf(row: any): number {
    return Number(row.avg_price) > 0 ? row.avg_price : row.sell
  },
  ```

  AFTER (each `method` → `function`, `this.placeholderImg` → `placeholderImg`; keep the rest byte-identical bodies):
  ```ts
  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function mkt(urlName: string): string {
    return 'https://warframe.market/items/' + urlName
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function priceOf(row: any): number {
    return Number(row.avg_price) > 0 ? row.avg_price : row.sell
  }
  function categoryOf(tags: string[] = []): string {
    const t = (tags || []).map((x) => (x || '').toLowerCase())
    if (t.includes('warframe')) return 'Warframe'
    if (t.includes('primary')) return 'Primary'
    if (t.includes('secondary')) return 'Secondary'
    if (t.includes('melee')) return 'Melee'
    if (t.includes('mod')) return 'Mod'
    if (t.includes('sentinel')) return 'Sentinel'
    if (t.includes('companion') || t.includes('pet')) return 'Companion'
    if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
    return 'Other'
  }
  function fromLow(v: number): string {
    if (v === null || v === undefined) return '—'
    return `+${Number(v).toFixed(0)}%`
  }
  function changeClass(v: number): string {
    if (v === null || v === undefined) return 'flat'
    if (v > 0) return 'up'
    if (v < 0) return 'down'
    return 'flat'
  }
  function trendArrow(t: string): string {
    return t === 'up' ? '▲' : t === 'down' ? '▼' : '▬'
  }
  function trendClass(t: string): string {
    return t === 'up' ? 'up' : t === 'down' ? 'down' : 'flat'
  }
  function sparkSvg(spark: number[], change: number): string {
    const pts = (spark || []).filter((n) => typeof n === 'number')
    if (pts.length < 2) return ''
    const w = 88
    const h = 24
    const pad = 2
    const min = Math.min(...pts)
    const max = Math.max(...pts)
    const range = max - min || 1
    const step = (w - pad * 2) / (pts.length - 1)
    const coords = pts
      .map((v, i) => {
        const x = pad + i * step
        const y = pad + (h - pad * 2) * (1 - (v - min) / range)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    const color = change > 0 ? '#4caf7d' : change < 0 ? '#e57373' : '#9aa0b4'
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="${coords}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }
  function fmtSignedPct(n: number): string {
    if (n === null || n === undefined) return '—'
    const v = Number(n) || 0
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
  }
  ```

- [ ] Step 6: Clean Vuetify-2 attrs on the filter controls in `<template>`. Drop `dark` everywhere (theme handles darkness), map `dense` → `density="compact"`, `small` → `size="small"`.

  BEFORE:
  ```html
  <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  ...
  <v-btn-toggle v-model="timeframe" mandatory dense dark>
    <v-btn value="change7d" small>7d</v-btn>
    <v-btn value="change30d" small>30d</v-btn>
  </v-btn-toggle>
  ...
  <v-switch v-model="onlyClimbing" dark dense inset hide-details color="#d4af5a" label="Only climbing" class="an-switch"></v-switch>
  ...
  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
  </v-chip-group>
  ```

  AFTER:
  ```html
  <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
  ...
  <v-btn-toggle v-model="timeframe" mandatory density="compact">
    <v-btn value="change7d" size="small">7d</v-btn>
    <v-btn value="change30d" size="small">30d</v-btn>
  </v-btn-toggle>
  ...
  <v-switch v-model="onlyClimbing" density="compact" inset hide-details color="#d4af5a" label="Only climbing" class="an-switch"></v-switch>
  ...
  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small" active-class="an-chip--on">{{ c }}</v-chip>
  </v-chip-group>
  ```

- [ ] Step 7: Clean the two `v-alert`s and the `v-pagination`. Drop `dark`/`dense` → `density="compact"`; replace the removed-in-V3 background helper class `blue darken-4` with an explicit color/style (keep the `an-disclaimer` custom class).

  BEFORE:
  ```html
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
    Couldn't load analytics. The market service may be waking up — try a refresh.
  </v-alert>
  ...
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ...
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    Change is measured on our own daily price series ...
  </v-alert>
  ```

  AFTER:
  ```html
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
    Couldn't load analytics. The market service may be waking up — try a refresh.
  </v-alert>
  ...
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ...
  <v-alert class="an-disclaimer" type="info" density="compact" style="background-color:#0d47a1;color:#fff">
    Change is measured on our own daily price series ...
  </v-alert>
  ```
  (`#0d47a1` is Vuetify's old `blue darken-4`. Alternatively add `.an-disclaimer{background:#0d47a1;color:#fff}` to the scoped style — either is fine; keep whichever the reviewer prefers.)

- [ ] Step 8: In `<style scoped>`, convert every Vue-2 deep combinator `>>>` to Vue-3 `:deep()`. Four occurrences.

  BEFORE:
  ```css
  .an-refine >>> .v-btn-toggle { ... }
  .an-refine >>> .v-btn-toggle .v-btn { ... }
  .an-refine >>> .v-btn-toggle .v-btn.v-btn--active { ... }
  .an-switch >>> .v-label { ... }
  .an-spark--wide >>> svg { width: 100%; height: 34px; }
  ```

  AFTER:
  ```css
  .an-refine :deep(.v-btn-toggle) { ... }
  .an-refine :deep(.v-btn-toggle .v-btn) { ... }
  .an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) { ... }
  .an-switch :deep(.v-label) { ... }
  .an-spark--wide :deep(svg) { width: 100%; height: 34px; }
  ```
  (That's 5 combinators total — count them in the file; keep each rule body byte-identical.)

- [ ] Step 9: Leave the hand-rolled `<table class="an-table">`, the `<client-only>` wrapper, the `v-html` sparklines, and all `an-*` markup untouched — none of it uses breaking Vuetify component APIs. Confirm `client-only` still resolves (Nuxt 4 keeps `<ClientOnly>`; the kebab `<client-only>` alias still works).

- [ ] Step 10: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file.

- [ ] Step 11: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/vault-spikes`. Expect: page renders, spinner hides, `market_analytics` data populates the hero deal + stat tiles + table (desktop) / cards (mobile), search/window-toggle/only-climbing switch/category chips/pagination all react, zero console errors. Screenshot-diff vs old app `/vault-spikes` (close — accept Vuetify-3 spacing on the text-field/switch/toggle/chips).

- [ ] Step 12: Commit: `git add app-next/app/pages/vault-spikes.vue && git commit -m "feat(migration): port vault-spikes page to Nuxt 4 / Vue 3 / Vuetify 3"`

---

### Task P6.6: Migrate pages/relics-value.vue (Relic Value: crack-vs-sell EV table)

**Files:**
- Create: `app-next/app/pages/relics-value.vue`
- Delete/superseded: `app/pages/relics-value.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (Vuetify 3 + theme), P1 (layout + `#spinner-wrapper`), P2 (`runtimeConfig.public.apiURL`), P3 (composable conventions)

**Notes / scope:** The desktop grid is a hand-rolled native HTML `<table class="an-table">`, NOT `v-data-table`/`v-simple-table`, so there are **no header `{text,value}` / slot / density conversions** for the table. Breaking surface is the script (asyncData/head/breakpoint) plus Vuetify-2 form props (`dark`/`dense`/`small`, `{text,value}` select items, `blue darken-4` helper class) and the Vue-2 `>>>` deep CSS selector.

**Steps:**

- [ ] Step 1: Convert the `<script lang="ts">` Options API to `<script setup lang="ts">`. Keep the module-level `CHANCES` constant as-is. Port `asyncData` -> `useAsyncData`+`$fetch`, `head()` -> `useHead`, `$vuetify.breakpoint.mobile` -> `useDisplay()`, and all `data`/`computed`/`methods`/`watch`/`mounted` into setup refs.

  BEFORE:
  ```ts
  <script lang="ts">
  // Fixed refinement drop-chance table (per rarity), shared by all relics.
  const CHANCES: Record<string, Record<string, number>> = {
    Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
    Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
  }

  export default {
    name: 'RelicsValuePage',
    async asyncData({ $axios, $config }: any) {
      try {
        const data = await $axios
          .get(`${$config.apiURL}/relics_ev`)
          .then((res: any) => res.data)
        return { relics: (data && data.relics) || [], loadError: false }
      } catch (e) {
        return { relics: [], loadError: true }
      }
    },
    data() {
      return {
        relics: [] as any[],
        loadError: false,
        search: '',
        tier: 'All',
        refinement: 'Radiant',
        sortKey: 'ev',
        onlyOpenWins: false,
        page: 1,
        perPage: 20,
        placeholderImg:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
        sortOptions: [
          { text: 'Best payout (EV)', value: 'ev' },
          { text: 'Crack margin', value: 'margin' },
          { text: 'Volume', value: 'volume' },
          { text: 'Name (A–Z)', value: 'name' },
        ],
      }
    },
    head() {
      return {
        title: 'Relic Value — open vs sell (Warframe Market)',
        meta: [
          {
            hid: 'description',
            name: 'description',
            content:
              'Expected platinum value of cracking every Warframe void relic (Intact & Radiant) versus selling it. Per-relic drop breakdown and best relics to open.',
          },
        ],
      }
    },
    computed: {
      isMobile(): boolean {
        return (this as any).$vuetify.breakpoint.mobile
      },
      tierOptions(): string[] { /* ... */ },
      filtered(): any[] { /* ... */ },
      pageCount(): number { /* ... */ },
      paged(): any[] { /* ... */ },
      topDeal(): any { /* ... */ },
      topDealUrl(): string { /* ... */ },
      stats(): any { /* ... */ },
    },
    watch: {
      filtered() {
        this.page = 1
      },
    },
    mounted() {
      this.finishLoading()
    },
    methods: {
      assetUrl(thumb: string): string { /* ... */ },
      onImgError(e: any) { /* ... */ },
      ev(relic: any): number { /* ... */ },
      topDrop(relic: any): any { /* ... */ },
      fmtPlat(n: number): string { /* ... */ },
      verdict(relic: any) { /* ... */ },
      finishLoading() { /* ... */ },
    },
  }
  </script>
  ```

  AFTER (full ported script — logic is a verbatim move; only `this.` bindings, asyncData, head, and breakpoint change):
  ```ts
  <script setup lang="ts">
  import { computed, nextTick, onMounted, ref, watch } from 'vue'
  import { useDisplay } from 'vuetify'

  // Fixed refinement drop-chance table (per rarity), shared by all relics.
  const CHANCES: Record<string, Record<string, number>> = {
    Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
    Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
  }

  const config = useRuntimeConfig()
  const base = config.public.apiURL

  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  useHead({
    title: 'Relic Value — open vs sell (Warframe Market)',
    meta: [
      {
        hid: 'description',
        name: 'description',
        content:
          'Expected platinum value of cracking every Warframe void relic (Intact & Radiant) versus selling it. Per-relic drop breakdown and best relics to open.',
      },
    ],
  })

  // SSR fetch — preserve old asyncData try/catch -> loadError intent.
  const { data, error } = await useAsyncData('relics-ev', () =>
    $fetch<any>(`${base}/relics_ev`)
  )
  const relics = computed<any[]>(() => (data.value && data.value.relics) || [])
  const loadError = computed(() => !!error.value)

  // UI state (former data())
  const search = ref('')
  const tier = ref('All')
  const refinement = ref('Radiant')
  const sortKey = ref('ev')
  const onlyOpenWins = ref(false)
  const page = ref(1)
  const perPage = 20
  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
  const sortOptions = [
    { text: 'Best payout (EV)', value: 'ev' },
    { text: 'Crack margin', value: 'margin' },
    { text: 'Volume', value: 'volume' },
    { text: 'Name (A–Z)', value: 'name' },
  ]

  // methods
  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function ev(relic: any): number {
    const table = CHANCES[refinement.value] || CHANCES.Intact
    return (relic.rewards || []).reduce((sum: number, r: any) => {
      const chance = table[r.rarity] || 0
      return sum + (chance / 100) * (r.price || 0)
    }, 0)
  }
  function topDrop(relic: any): any {
    let best = { item_name: '—', price: 0, rarity: '' }
    for (const r of relic.rewards || []) {
      if (r.price > best.price) best = r
    }
    return best
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }
  function verdict(relic: any): { label: string; amount: string; cls: string } {
    const open = ev(relic)
    const sell = relic.relic.buy || 0
    if (open > sell + 0.5) {
      return { label: 'Crack it', amount: `+${fmtPlat(open - sell)}p vs selling`, cls: 'pill--good' }
    }
    if (sell > open + 0.5) {
      return { label: 'Sell it', amount: `+${fmtPlat(sell - open)}p vs cracking`, cls: 'pill--alt' }
    }
    return { label: 'Even', amount: '', cls: 'pill--even' }
  }

  // computed
  const tierOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of relics.value) present.add(r.tier)
    const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
    return ['All', ...order.filter((t) => present.has(t))]
  })
  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const list = relics.value.filter((r) => {
      if (q && !r.relicName.toLowerCase().includes(q)) return false
      if (tier.value !== 'All' && r.tier !== tier.value) return false
      if (onlyOpenWins.value && ev(r) <= r.relic.buy) return false
      return true
    })
    const dir = (a: number, b: number) => b - a
    const sorters: Record<string, (a: any, b: any) => number> = {
      ev: (a, b) => dir(ev(a), ev(b)),
      margin: (a, b) => dir(ev(a) - a.relic.buy, ev(b) - b.relic.buy),
      volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
      name: (a, b) => a.relicName.localeCompare(b.relicName),
    }
    return list.slice().sort(sorters[sortKey.value] || sorters.ev)
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })
  const topDeal = computed<any>(() => {
    let best: any = null
    for (const r of relics.value) {
      if (!best || ev(r) > ev(best)) best = r
    }
    return best
  })
  const topDealUrl = computed<string>(() => {
    let best: any = null
    for (const r of filtered.value) {
      if (!best || ev(r) > ev(best)) best = r
    }
    return best ? best.url_name : ''
  })
  const stats = computed<any>(() => {
    const list = relics.value
    const evs = list.map((r) => ev(r))
    const openWins = list.filter((r) => ev(r) > r.relic.buy).length
    return {
      total: list.length,
      openWins,
      biggest: evs.length ? Math.max(...evs) : 0,
      avg: evs.length ? evs.reduce((s, v) => s + v, 0) / evs.length : 0,
    }
  })

  // reset paging when the filtered set changes
  watch(filtered, () => {
    page.value = 1
  })

  // hide global spinner once mounted
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(finishLoading)
  </script>
  ```
  Note: `relics` and `loadError` are now computed off `data`/`error`; the template references (`relics`, `loadError`, `topDeal`, `stats`, `filtered`, `paged`, `isMobile`, `ev`, `topDrop`, `fmtPlat`, `verdict`, `assetUrl`, `onImgError`, plus refs `search/tier/refinement/sortKey/onlyOpenWins/page/perPage/sortOptions`) are all auto-exposed by `<script setup>`.

- [ ] Step 2: Fix the filter-row Vuetify form controls — drop `dark` (theme-driven now), `dense` -> `density="compact"`, and on `v-select` add `item-title`/`item-value` because Vuetify 3 no longer reads `{ text, value }` shapes.

  BEFORE:
  ```html
  <v-text-field
    v-model="search"
    dark
    dense
    hide-details
    clearable
    prepend-inner-icon="mdi-magnify"
    label="Search a relic"
    class="an-search"
  ></v-text-field>
  <div class="an-refine">
    <div class="an-refine__lbl">Refinement</div>
    <v-btn-toggle v-model="refinement" mandatory dense dark>
      <v-btn value="Intact" small>Intact</v-btn>
      <v-btn value="Radiant" small>Radiant</v-btn>
    </v-btn-toggle>
  </div>
  <v-select
    v-model="sortKey"
    :items="sortOptions"
    dark
    dense
    hide-details
    label="Sort by"
    class="an-field"
    style="flex: 0 1 220px"
  ></v-select>
  ```

  AFTER:
  ```html
  <v-text-field
    v-model="search"
    density="compact"
    hide-details
    clearable
    prepend-inner-icon="mdi-magnify"
    label="Search a relic"
    class="an-search"
  ></v-text-field>
  <div class="an-refine">
    <div class="an-refine__lbl">Refinement</div>
    <v-btn-toggle v-model="refinement" mandatory density="comfortable">
      <v-btn value="Intact" size="small">Intact</v-btn>
      <v-btn value="Radiant" size="small">Radiant</v-btn>
    </v-btn-toggle>
  </div>
  <v-select
    v-model="sortKey"
    :items="sortOptions"
    item-title="text"
    item-value="value"
    density="compact"
    hide-details
    label="Sort by"
    class="an-field"
    style="flex: 0 1 220px"
  ></v-select>
  ```

- [ ] Step 3: Fix the tier chip group — `v-chip small` -> `size="small"`. `v-chip-group` `column`/`mandatory` and `active-class` are unchanged in Vuetify 3.

  BEFORE:
  ```html
  <v-chip-group v-model="tier" mandatory column class="an-cats">
    <v-chip
      v-for="t in tierOptions"
      :key="t"
      :value="t"
      small
      active-class="an-chip--on"
    >
      {{ t }}
    </v-chip>
  </v-chip-group>
  ```

  AFTER:
  ```html
  <v-chip-group v-model="tier" mandatory column class="an-cats">
    <v-chip
      v-for="t in tierOptions"
      :key="t"
      :value="t"
      size="small"
      active-class="an-chip--on"
    >
      {{ t }}
    </v-chip>
  </v-chip-group>
  ```

- [ ] Step 4: Fix the `v-switch` — drop `dark`, `dense` -> `density="compact"` (keep `inset`, `color`, `label`, `hide-details`).

  BEFORE:
  ```html
  <v-switch
    v-model="onlyOpenWins"
    dark
    dense
    hide-details
    inset
    color="#4caf7d"
    label="Only where cracking beats selling"
  ></v-switch>
  ```

  AFTER:
  ```html
  <v-switch
    v-model="onlyOpenWins"
    density="compact"
    hide-details
    inset
    color="#4caf7d"
    label="Only where cracking beats selling"
  ></v-switch>
  ```

- [ ] Step 5: Fix the two `v-alert`s — drop `dark`, `dense` -> `density="compact"`; convert the Vuetify-2 `blue darken-4` background helper class (removed in V3) to the `color="blue-darken-4"` prop. The native HTML `<table>` and `<nuxt-link>`/`<client-only>`/`<v-icon>` usages need no change.

  BEFORE:
  ```html
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
    Couldn't load relic data. The market service may be waking up — try a refresh.
  </v-alert>
  ```
  ```html
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    EV = expected value: each drop's market price weighted by its
    {{ refinement }} chance. Radiant costs 100 void traces to refine. Selling
    value uses the relic's highest buy order.
  </v-alert>
  ```

  AFTER:
  ```html
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
    Couldn't load relic data. The market service may be waking up — try a refresh.
  </v-alert>
  ```
  ```html
  <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
    EV = expected value: each drop's market price weighted by its
    {{ refinement }} chance. Radiant costs 100 void traces to refine. Selling
    value uses the relic's highest buy order.
  </v-alert>
  ```

- [ ] Step 6: Fix the two remaining inline Vuetify controls — the row action `v-btn icon small` -> `size="small"` (the `icon` boolean and inner `<v-icon>` slot still work in V3) and the pager `v-pagination dark` -> drop `dark`.

  BEFORE:
  ```html
  <v-btn icon small color="#4fb3bf" :to="'/relic/' + row.url_name" :aria-label="'View ' + row.relicName">
    <v-icon>mdi-arrow-right-circle</v-icon>
  </v-btn>
  ```
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ```

  AFTER:
  ```html
  <v-btn icon size="small" color="#4fb3bf" :to="'/relic/' + row.url_name" :aria-label="'View ' + row.relicName">
    <v-icon>mdi-arrow-right-circle</v-icon>
  </v-btn>
  ```
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ```

- [ ] Step 7: Convert the scoped-CSS Vue-2 deep combinator `>>>` to Vue-3 `:deep()` (3 rules under `.an-refine`). Everything else in `<style scoped>` is plain CSS and stays.

  BEFORE:
  ```css
  .an-refine >>> .v-btn-toggle {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    overflow: hidden;
  }
  .an-refine >>> .v-btn-toggle .v-btn {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
    color: #b6bcd0 !important;
    background: transparent !important;
  }
  .an-refine >>> .v-btn-toggle .v-btn.v-btn--active {
    background: rgba(212, 175, 90, 0.9) !important;
    color: #17131f !important;
  }
  ```

  AFTER:
  ```css
  .an-refine :deep(.v-btn-toggle) {
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    overflow: hidden;
  }
  .an-refine :deep(.v-btn-toggle .v-btn) {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 600;
    color: #b6bcd0 !important;
    background: transparent !important;
  }
  .an-refine :deep(.v-btn-toggle .v-btn.v-btn--active) {
    background: rgba(212, 175, 90, 0.9) !important;
    color: #17131f !important;
  }
  ```

- [ ] Step 8: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/relics-value.vue`.

- [ ] Step 9: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/relics-value`. Expect: hero "Best relic to crack" card renders, 4 stat tiles populate, search/refinement toggle (Intact/Radiant)/sort select/tier chips/`onlyOpenWins` switch all filter live, desktop `<table>` rows render with EV/verdict pills and pagination, and at a narrow viewport the mobile `.an-cards` layout shows instead. Zero console errors; `#spinner-wrapper` disappears on mount; data loads. Screenshot-diff vs old app `/relics-value` (close).

- [ ] Step 10: Commit: `git add app-next/app/pages/relics-value.vue && git commit -m "feat(migration): port relics-value page to Nuxt4/Vue3/Vuetify3"`

---

### Task P6.7: Migrate riven-value.vue to script setup + Vuetify 3

**Files:**
- Create: app-next/app/pages/riven-value.vue
- Delete/superseded: app/pages/riven-value.vue (reference only; old app stays until cutover)

**Depends on:** P0 (Vuetify 3 module + dark theme), P1 (runtimeConfig.public.apiURL), P3 (default layout that owns #spinner-wrapper). No Pinia/i18n dependency.

**Orientation:** The `<template>` is ~95% plain HTML/CSS — custom `.rv-*` / `.an-*` classes, a native `<table>`, native `<button>` chips, `<client-only>` (kebab still valid in Nuxt 3). Only THREE Vuetify components break: `v-autocomplete`, the two `v-alert`, and `v-pagination`. All the estimator/grade logic (statValues, positiveOptions, estimate, gradedAuctions, percentile, statPercentile, grade) is framework-agnostic and ports 1:1. The entire `<style scoped>` block (lines 415–599) is copied UNCHANGED.

**Steps:**

- [ ] Step 1: Fix the `v-autocomplete` (template lines 29–42). `item-text` → `item-title`, drop `dark`, `dense` → `density="compact"`, and `@change` (removed in Vuetify 3 for autocomplete) → `@update:model-value`.

  BEFORE:
  ```html
  <v-autocomplete
    v-model="selected"
    :items="weaponOptions"
    item-text="label"
    item-value="url_name"
    dark
    dense
    hide-details
    clearable
    prepend-inner-icon="mdi-sword"
    label="Choose a weapon"
    class="an-search"
    @change="onWeaponChange"
  ></v-autocomplete>
  ```

  AFTER:
  ```html
  <v-autocomplete
    v-model="selected"
    :items="weaponOptions"
    item-title="label"
    item-value="url_name"
    density="compact"
    hide-details
    clearable
    prepend-inner-icon="mdi-sword"
    label="Choose a weapon"
    class="an-search"
    @update:model-value="onWeaponChange"
  ></v-autocomplete>
  ```

- [ ] Step 2: Fix the inline load-error `v-alert` (template line 52). Drop `dark`, `dense` → `density="compact"`.

  BEFORE:
  ```html
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
  ```

  AFTER:
  ```html
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
  ```

- [ ] Step 3: Fix the `v-pagination` (template line 192). Drop `dark` (theme handles it); keep `color` and `total-visible`.

  BEFORE:
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ```

  AFTER:
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ```

- [ ] Step 4: Fix the bottom disclaimer `v-alert` (template line 197). `dense` → `density="compact"` (it has no `dark`, keep the utility classes).

  BEFORE:
  ```html
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
  ```

  AFTER:
  ```html
  <v-alert class="an-disclaimer blue darken-4" type="info" density="compact">
  ```

  (The rest of the `<template>` — hero, filters block, estimator chips, native table, cards, `<client-only>` wrapper — is unchanged. `isMobile` referenced in the template is now provided by the ported script below.)

- [ ] Step 5: Replace the ENTIRE `<script lang="ts"> … </script>` Options block (lines 208–413) with the `<script setup lang="ts">` port below. Every computed/method moves verbatim; `this.` prefixes drop; `asyncData`→`useAsyncData`, `head()`→`useSeoMeta`, `$vuetify.breakpoint.mobile`→`useDisplay`, `$axios`→`$fetch`.

  BEFORE (the asyncData + head + isMobile + onWeaponChange fragments that carry Nuxt2/Vue2 APIs):
  ```ts
  async asyncData({ $axios, $config }: any) {
    try {
      const data = await $axios.get(`${$config.apiURL}/riven_weapons`).then((res: any) => res.data)
      return { weapons: (data && data.weapons) || [], loadError: false }
    } catch (e) {
      return { weapons: [], loadError: true }
    }
  },
  // ...
  head() {
    return {
      title: 'Riven Fair Value — price & grade any Warframe riven',
      meta: [{ hid: 'description', name: 'description', content: 'Estimate a fair platinum price...' }],
    }
  },
  // ...
  isMobile(): boolean {
    return (this as any).$vuetify.breakpoint.mobile
  },
  // ...
  async onWeaponChange(urlName: string) {
    // ...
    const cfg = (this as any).$config
    const data = await (this as any).$axios.get(`${cfg.apiURL}/riven_value/${urlName}`).then((res: any) => res.data)
    // ...
  },
  ```

  AFTER (full replacement script):
  ```html
  <script setup lang="ts">
  import { ref, computed, watch, onMounted, nextTick } from 'vue'
  import { useDisplay } from 'vuetify'

  const config = useRuntimeConfig()
  const base = config.public.apiURL
  const { mobile } = useDisplay()
  const isMobile = mobile

  // ---- SSR load: riven weapons list ----
  const { data, error } = await useAsyncData('riven-weapons', () =>
    $fetch<any>(`${base}/riven_weapons`)
  )
  const weapons = computed<any[]>(() => (data.value && data.value.weapons) || [])
  const loadError = computed(() => !!error.value)

  // ---- local state (old data()) ----
  const selected = ref<string>('')
  const weaponData = ref<any>(null)
  const loadingWeapon = ref(false)
  const selectedPositives = ref<string[]>([])
  const selectedNegative = ref<string>('')
  const page = ref(1)
  const perPage = 20

  // ---- helpers used by computeds (declared first) ----
  function attrLabel(urlName: string): string {
    return (urlName || '')
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
      .replace(/\bDamage\b/, 'Dmg')
  }
  function percentile(sortedAsc: number[], p: number): number {
    if (!sortedAsc.length) return 0
    const idx = (p / 100) * (sortedAsc.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.ceil(idx)
    if (lo === hi) return Math.round(sortedAsc[lo])
    const frac = idx - lo
    return Math.round(sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac)
  }

  // ---- computeds ----
  const weaponOptions = computed<any[]>(() =>
    weapons.value
      .filter((w) => (w.auctionCount || 0) > 0)
      .map((w) => ({
        url_name: w.url_name,
        label: `${w.item_name} — ${w.auctionCount} live${w.disposition ? ' · disp ' + w.disposition.toFixed(2) : ''}`,
      }))
  )
  const weaponItems = computed<any[]>(() => {
    const items = (weaponData.value && weaponData.value.items) || []
    return items.filter((a: any) => a && a.item && Array.isArray(a.item.attributes))
  })
  const statValues = computed<Record<string, number[]>>(() => {
    const map: Record<string, number[]> = {}
    for (const a of weaponItems.value) {
      for (const at of a.item.attributes) {
        if (!at.positive) continue
        if (!map[at.url_name]) map[at.url_name] = []
        map[at.url_name].push(at.value)
      }
    }
    Object.keys(map).forEach((k) => map[k].sort((x, y) => x - y))
    return map
  })
  const positiveOptions = computed<string[]>(() => {
    const set = new Set<string>()
    for (const a of weaponItems.value) for (const at of a.item.attributes) if (at.positive) set.add(at.url_name)
    return Array.from(set).sort((a, b) => attrLabel(a).localeCompare(attrLabel(b)))
  })
  const negativeOptions = computed<string[]>(() => {
    const set = new Set<string>()
    for (const a of weaponItems.value) for (const at of a.item.attributes) if (!at.positive) set.add(at.url_name)
    return Array.from(set).sort((a, b) => attrLabel(a).localeCompare(attrLabel(b)))
  })
  const estimate = computed<any>(() => {
    const pos = selectedPositives.value
    if (!pos.length) return { count: 0 }
    const hasAll = (a: any, needed: string[]) => {
      const names = a.item.attributes.filter((x: any) => x.positive).map((x: any) => x.url_name)
      return needed.every((n) => names.includes(n))
    }
    const hasNeg = (a: any) => {
      if (!selectedNegative.value) return true
      return a.item.attributes.some((x: any) => !x.positive && x.url_name === selectedNegative.value)
    }
    const priced = weaponItems.value.filter((a: any) => a.buyout_price > 0)
    let matches = priced.filter((a: any) => hasAll(a, pos) && hasNeg(a))
    let approx = false
    if (matches.length < 3 && pos.length > 1) {
      approx = true
      matches = priced.filter((a: any) => {
        const names = a.item.attributes.filter((x: any) => x.positive).map((x: any) => x.url_name)
        const overlap = pos.filter((n) => names.includes(n)).length
        return overlap >= pos.length - 1 && hasNeg(a)
      })
    }
    if (!matches.length) return { count: 0 }
    const prices = matches.map((a: any) => a.buyout_price).sort((a: number, b: number) => a - b)
    return {
      count: prices.length,
      approx,
      p25: percentile(prices, 25),
      median: percentile(prices, 50),
      p75: percentile(prices, 75),
      cheapest: prices[0],
    }
  })
  const gradedAuctions = computed<any[]>(() => {
    const median = estimate.value.count ? estimate.value.median : 0
    return weaponItems.value
      .filter((a: any) => a.buyout_price > 0)
      .slice()
      .sort((a: any, b: any) => a.buyout_price - b.buyout_price)
      .map((a: any) => ({ ...a, _deal: median > 0 && a.buyout_price < median * 0.9 }))
  })
  const pageCount = computed(() => Math.max(1, Math.ceil(gradedAuctions.value.length / perPage)))
  const pagedAuctions = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return gradedAuctions.value.slice(start, start + perPage)
  })

  // reset to page 1 when the graded list changes (old watch)
  watch(gradedAuctions, () => {
    page.value = 1
  })

  // ---- methods ----
  async function onWeaponChange(urlName: string) {
    selectedPositives.value = []
    selectedNegative.value = ''
    weaponData.value = null
    if (!urlName) return
    loadingWeapon.value = true
    try {
      const res = await $fetch<any>(`${base}/riven_value/${urlName}`)
      weaponData.value = res || { url_name: urlName, items: [] }
    } catch (e) {
      weaponData.value = { url_name: urlName, items: [] }
    } finally {
      loadingWeapon.value = false
    }
  }
  function togglePositive(opt: string) {
    const i = selectedPositives.value.indexOf(opt)
    if (i >= 0) selectedPositives.value.splice(i, 1)
    else selectedPositives.value.push(opt)
  }
  function positives(a: any): any[] {
    return a.item.attributes.filter((x: any) => x.positive)
  }
  function negatives(a: any): any[] {
    return a.item.attributes.filter((x: any) => !x.positive)
  }
  function statPercentile(urlName: string, value: number): number {
    const vals = statValues.value[urlName]
    if (!vals || vals.length < 2) return 0.5
    let below = 0
    for (const v of vals) if (v <= value) below++
    return below / vals.length
  }
  function grade(a: any): { letter: string; cls: string } {
    const pos = positives(a)
    if (!pos.length) return { letter: '—', cls: 'rv-grade--f' }
    let sum = 0
    for (const at of pos) sum += statPercentile(at.url_name, at.value)
    const score = sum / pos.length
    if (score >= 0.85) return { letter: 'S', cls: 'rv-grade--s' }
    if (score >= 0.7) return { letter: 'A', cls: 'rv-grade--a' }
    if (score >= 0.5) return { letter: 'B', cls: 'rv-grade--b' }
    if (score >= 0.3) return { letter: 'C', cls: 'rv-grade--c' }
    if (score >= 0.15) return { letter: 'D', cls: 'rv-grade--d' }
    return { letter: 'F', cls: 'rv-grade--f' }
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }

  // ---- SEO (old head()) ----
  useSeoMeta({
    title: 'Riven Fair Value — price & grade any Warframe riven',
    description:
      'Estimate a fair platinum price for any Warframe riven by attribute combination, and grade every live listing against the field. Built from the live auction corpus.',
  })

  // ---- hide the global loading spinner on mount ----
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(finishLoading)
  </script>
  ```

- [ ] Step 6: Copy the `<style scoped>` block (old lines 415–599) verbatim into the new file — no changes; all selectors are custom classes.

- [ ] Step 7: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for app/pages/riven-value.vue. (If `useAsyncData`/`$fetch`/`useRuntimeConfig`/`useSeoMeta` report as undefined, confirm P1 Nuxt auto-imports are on; `useDisplay` must come from the explicit `vuetify` import shown.)

- [ ] Step 8: Verify in browser: start backend from repo root `npm run dev` (port 3529), then `cd app-next && npm run dev`; load `/riven-value`. Expect: page renders, `#spinner-wrapper` disappears, weapon autocomplete populates. Pick a weapon → auctions load, tick a positive stat → estimate + fair-value range appears, listings table grades (S/A/B…) and DEAL badges show, pagination works, mobile card view via devtools narrow width. Zero console errors. Screenshot-diff `/riven-value` vs old app at `app/` route (close; accept Vuetify 3 default input/alert/pagination spacing shifts).

- [ ] Step 9: Commit: `git add app-next/app/pages/riven-value.vue && git commit -m "feat(migrate): port riven-value page to Nuxt4/Vue3/Vuetify3"`

---

### Task P6.8: Migrate Set-vs-Parts comparison page to Nuxt 4 / Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/pages/comparison.vue`
- Delete/superseded: `app/pages/comparison.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config `runtimeConfig.public.apiURL` + Vuetify 3 theme), P1 (vuetify-nuxt-module registered), P3 (default layout + `#spinner-wrapper` spinner convention). No store/composable dependency — this page fetches `/sets_comparison` directly and uses NO Vuex/i18n/moment/leaflet/driver.js.

**Notes on scope:** This page uses a **native `<table>`** (not `v-data-table`), so there are NO header-object or slot conversions. There are NO `v-simple-table`, `v-list-item-icon`, `v-subheader`, `v-menu`, `hidden-*` classes, `.sync`, i18n, or Vuex patterns. Breakage is limited to the `<script>` data-lifecycle (asyncData/head/breakpoint) and a set of Vuetify-2 control attributes.

**Steps:**

- [ ] Step 1: Convert `<script lang="ts">` Options API to `<script setup lang="ts">`. Replace the whole `asyncData` + `head` + `data`/`computed`/`watch`/`mounted`/`methods` block.

  BEFORE (data fetch — lines 250-262, 286-298):
  ```ts
  export default {
    name: 'ComparisonPage',
    async asyncData({ $axios, $config }: any) {
      try {
        const data = await $axios
          .get(`${$config.apiURL}/sets_comparison`)
          .then((res: any) => res.data)
        return { sets: (data && data.sets) || [], loadError: false }
      } catch (e) {
        return { sets: [], loadError: true }
      }
    },
    // ...
    head() {
      return {
        title: 'Set vs Parts — Warframe Market price comparison',
        meta: [
          {
            hid: 'description',
            name: 'description',
            content:
              'Compare buying a Warframe Prime set whole vs buying the parts and combining. Live platinum savings, resale value and per-set breakdowns.',
          },
        ],
      }
    },
  ```

  AFTER (top of `<script setup lang="ts">`):
  ```ts
  const config = useRuntimeConfig()
  const base = config.public.apiURL

  const { data, error } = await useAsyncData('sets-comparison', () =>
    $fetch<{ sets: any[] }>(`${base}/sets_comparison`)
  )
  // preserve old try/catch -> loadError intent
  const loadError = computed(() => !!error.value)
  const sets = computed<any[]>(() => data.value?.sets || [])

  useHead({
    title: 'Set vs Parts — Warframe Market price comparison',
    meta: [
      {
        hid: 'description',
        name: 'description',
        content:
          'Compare buying a Warframe Prime set whole vs buying the parts and combining. Live platinum savings, resale value and per-set breakdowns.',
      },
    ],
  })
  ```

- [ ] Step 2: Port `data()` state to refs/consts. `sets` is now the computed from Step 1 (drop the `sets: []` state field).

  BEFORE (lines 263-285):
  ```ts
  data() {
    return {
      sets: [] as any[],
      loadError: false,
      search: '',
      minVolume: 0,
      category: 'All',
      sortKey: 'dealPct',
      onlyPartsCheaper: false,
      onlyResellHigher: false,
      page: 1,
      perPage: 20,
      placeholderImg: "data:image/svg+xml,%3Csvg ... %3C/svg%3E",
      sortOptions: [
        { text: 'Best parts deal (%)', value: 'dealPct' },
        { text: 'Biggest saving (plat)', value: 'dealPlat' },
        { text: 'Resale edge (parts)', value: 'resale' },
        { text: 'Volume', value: 'volume' },
        { text: 'Name (A–Z)', value: 'name' },
      ],
    }
  },
  ```

  AFTER (note `text` -> `title` in sortOptions for Vuetify 3 `v-select`; keep the exact placeholder SVG string from the original file):
  ```ts
  const search = ref('')
  const minVolume = ref(0)
  const category = ref('All')
  const sortKey = ref('dealPct')
  const onlyPartsCheaper = ref(false)
  const onlyResellHigher = ref(false)
  const page = ref(1)
  const perPage = 20

  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"

  const sortOptions = [
    { title: 'Best parts deal (%)', value: 'dealPct' },
    { title: 'Biggest saving (plat)', value: 'dealPlat' },
    { title: 'Resale edge (parts)', value: 'resale' },
    { title: 'Volume', value: 'volume' },
    { title: 'Name (A–Z)', value: 'name' },
  ]
  ```

- [ ] Step 3: Replace `isMobile` computed (which read `$vuetify.breakpoint`) with `useDisplay()`.

  BEFORE (lines 300-302):
  ```ts
  isMobile(): boolean {
    return (this as any).$vuetify.breakpoint.mobile
  },
  ```

  AFTER (near top of `<script setup>`; template references `isMobile` will be updated to `mobile` in Step 8):
  ```ts
  const { mobile } = useDisplay()
  ```

- [ ] Step 4: Port helper methods to plain functions (they are pure — just drop `this.`). Convert `categoryOf`, `assetUrl`, `onImgError`, `fmtPlat`, `fmtPct`, `signed`, `deltaCls`, `verdict`.

  AFTER (verbatim logic; `this.fmtPlat`/`this.fmtPct` inside `verdict` become bare calls, `this.placeholderImg` -> `placeholderImg`):
  ```ts
  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function categoryOf(tags: string[] = []): string {
    const t = (tags || []).map((x) => (x || '').toLowerCase())
    if (t.includes('warframe')) return 'Warframe'
    if (t.includes('primary')) return 'Primary'
    if (t.includes('secondary')) return 'Secondary'
    if (t.includes('melee')) return 'Melee'
    if (t.includes('sentinel')) return 'Sentinel'
    if (t.includes('companion') || t.includes('pet')) return 'Companion'
    if (t.includes('archwing')) return 'Archwing'
    return 'Other'
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }
  function fmtPct(n: number): string {
    const v = Number(n) || 0
    return `${v > 0 ? '+' : ''}${v.toFixed(0)}%`
  }
  function signed(n: number): string {
    const v = Math.round(Number(n) || 0)
    return `${v > 0 ? '+' : ''}${v.toLocaleString('en-US')}`
  }
  function deltaCls(n: number): string {
    if (n > 0.5) return 'up'
    if (n < -0.5) return 'down'
    return 'flat'
  }
  function verdict(row: any): { label: string; amount: string; cls: string } {
    const save = row.acquire.save
    if (save > 0.5) {
      return {
        label: 'Buy parts',
        amount: `save ${fmtPlat(save)}p (${fmtPct(row.acquire.savePct)})`,
        cls: 'pill--good',
      }
    }
    if (save < -0.5) {
      return { label: 'Buy set', amount: `save ${fmtPlat(-save)}p`, cls: 'pill--alt' }
    }
    return { label: 'Even', amount: '', cls: 'pill--even' }
  }
  ```

- [ ] Step 5: Port the derived computeds (`categoryOptions`, `filtered`, `pageCount`, `paged`, `topDeal`, `topDealUrl`, `stats`) — replace `this.<x>` with the ref/computed name (`.value` auto-unwraps inside `computed`), and `this.sets` -> `sets.value`.

  AFTER (logic unchanged from lines 303-364):
  ```ts
  const categoryOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of sets.value) present.add(categoryOf(r.tags))
    const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companion', 'Archwing', 'Other']
    return ['All', ...order.filter((c) => present.has(c))]
  })

  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const minV = Number(minVolume.value) || 0
    const list = sets.value.filter((r) => {
      if (q && !r.item_name.toLowerCase().includes(q)) return false
      if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
      if ((r.set.volume || 0) < minV) return false
      if (onlyPartsCheaper.value && r.acquire.save <= 0) return false
      if (onlyResellHigher.value && r.resale.extra <= 0) return false
      return true
    })
    const dir = (a: number, b: number) => b - a
    const sorters: Record<string, (a: any, b: any) => number> = {
      dealPct: (a, b) => dir(a.acquire.savePct, b.acquire.savePct),
      dealPlat: (a, b) => dir(a.acquire.save, b.acquire.save),
      resale: (a, b) => dir(a.resale.extra, b.resale.extra),
      volume: (a, b) => dir(a.set.volume || 0, b.set.volume || 0),
      name: (a, b) => a.item_name.localeCompare(b.item_name),
    }
    return list.slice().sort(sorters[sortKey.value] || sorters.dealPct)
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })

  const topDeal = computed<any>(() => {
    let best: any = null
    for (const r of sets.value) {
      if (r.acquire.save > 0 && (!best || r.acquire.save > best.acquire.save)) best = r
    }
    return best
  })
  const topDealUrl = computed<string>(() => {
    let best: any = null
    for (const r of filtered.value) {
      if (r.acquire.save > 0 && (!best || r.acquire.savePct > best.acquire.savePct)) best = r
    }
    return best ? best.url_name : ''
  })
  const stats = computed<any>(() => {
    const list = sets.value
    const partsCheaper = list.filter((r) => r.acquire.save > 0)
    const setCheaper = list.filter((r) => r.acquire.save < 0)
    const avgSavePct = partsCheaper.length
      ? partsCheaper.reduce((s, r) => s + r.acquire.savePct, 0) / partsCheaper.length
      : 0
    return { total: list.length, partsCheaper: partsCheaper.length, setCheaper: setCheaper.length, avgSavePct }
  })
  ```

- [ ] Step 6: Port `watch` (reset page on filter change) and `mounted` spinner hide.

  BEFORE (lines 366-373, 425-431):
  ```ts
  watch: {
    filtered() {
      this.page = 1
    },
  },
  mounted() {
    this.finishLoading()
  },
  // ...
  finishLoading() {
    this.$nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else this.finishLoading()
    })
  },
  ```

  AFTER:
  ```ts
  watch(filtered, () => {
    page.value = 1
  })

  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  onMounted(() => {
    finishLoading()
  })
  ```

- [ ] Step 7: Fix Vuetify 2 attrs on the FILTER controls (lines 51-114). Drop every `dark`, change `dense` -> `density="compact"`, and move the chip `active-class` up to the group as `selected-class` while dropping the removed `column` prop and switching `small` -> `size="small"`.

  BEFORE (search field + select + chip group + switches, condensed):
  ```html
  <v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a set" class="an-search"></v-text-field>
  <v-text-field v-model.number="minVolume" dark dense hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
  <v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>

  <v-chip-group v-model="category" mandatory column class="an-cats">
    <v-chip v-for="cat in categoryOptions" :key="cat" :value="cat" small active-class="an-chip--on">
      {{ cat }}
    </v-chip>
  </v-chip-group>

  <v-switch v-model="onlyPartsCheaper" dark dense hide-details inset color="#35d6d0" label="Only where parts are cheaper to buy"></v-switch>
  <v-switch v-model="onlyResellHigher" dark dense hide-details inset color="#c8a85c" label="Only where parts resell for more"></v-switch>
  ```

  AFTER:
  ```html
  <v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search a set" class="an-search"></v-text-field>
  <v-text-field v-model.number="minVolume" density="compact" hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
  <v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>

  <v-chip-group v-model="category" mandatory selected-class="an-chip--on" class="an-cats">
    <v-chip v-for="cat in categoryOptions" :key="cat" :value="cat" size="small">
      {{ cat }}
    </v-chip>
  </v-chip-group>

  <v-switch v-model="onlyPartsCheaper" density="compact" hide-details inset color="#35d6d0" label="Only where parts are cheaper to buy"></v-switch>
  <v-switch v-model="onlyResellHigher" density="compact" hide-details inset color="#c8a85c" label="Only where parts resell for more"></v-switch>
  ```
  Note: `.an-cats` CSS must provide `flex-wrap: wrap` to replace the removed `column` prop (add `flex-wrap: wrap;` to that rule when porting the `<style>`/analytics.css). Confirm the `an-chip--on` selected style still applies (Vuetify 3 adds `selected-class` to the chip root, same as old `active-class`).

- [ ] Step 8: Fix the two `isMobile` template references (desktop-table `v-else-if` and pagination `total-visible`) to use `mobile` from `useDisplay()`.

  BEFORE (lines 127 and 238):
  ```html
  <div v-else-if="!isMobile" class="an-tablewrap">
  ...
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#c8a85c"></v-pagination>
  ```

  AFTER (also drop `dark` on the pagination):
  ```html
  <div v-else-if="!mobile" class="an-tablewrap">
  ...
  <v-pagination v-model="page" :length="pageCount" :total-visible="mobile ? 5 : 9" color="#c8a85c"></v-pagination>
  ```

- [ ] Step 9: Fix the in-row/action Vuetify controls: `v-btn icon small` -> `icon size="small"` and the two `v-alert` elements (`dark dense` -> `density="compact"`; the `blue darken-4` background helper -> `bg-blue-darken-4`).

  BEFORE (row action button line 181-183, error alert 120-122, disclaimer 242-245):
  ```html
  <v-btn icon small color="#35d6d0" :to="'/set/' + row.url_name" :aria-label="'View ' + row.item_name + ' parts'">
    <v-icon>mdi-arrow-right-circle</v-icon>
  </v-btn>
  ...
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
    Couldn't load comparison data. The market service may be waking up — try a refresh.
  </v-alert>
  ...
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    Prices are lowest sell orders (cost to buy) and highest buy orders (resale),
    pulled from Warframe Market. Trading tax and set bonuses aren't included.
  </v-alert>
  ```

  AFTER:
  ```html
  <v-btn icon size="small" color="#35d6d0" :to="'/set/' + row.url_name" :aria-label="'View ' + row.item_name + ' parts'">
    <v-icon>mdi-arrow-right-circle</v-icon>
  </v-btn>
  ...
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
    Couldn't load comparison data. The market service may be waking up — try a refresh.
  </v-alert>
  ...
  <v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
    Prices are lowest sell orders (cost to buy) and highest buy orders (resale),
    pulled from Warframe Market. Trading tax and set bonuses aren't included.
  </v-alert>
  ```
  Everything else in the template — the native `<table>` (lines 128-187), the `<client-only>` wrapper, `<nuxt-link>`s, `<img @error="onImgError">`, the mobile `an-cards` block, and all `an-*` CSS classes — is Vue-3-compatible and stays byte-for-byte identical.

- [ ] Step 10: Port the page's scoped styles / analytics.css usage. This page relies on the shared `.an-*` "Void Ledger" classes (from `app/assets/analytics.css`). Ensure that stylesheet is imported globally in P0/P3 (or add `import '~/assets/analytics.css'` per the migration's asset convention). Apply the `flex-wrap: wrap` note from Step 7 to `.an-cats`.

- [ ] Step 11: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/comparison.vue` (watch for `data.value?.sets` typing and the `any[]` computeds).

- [ ] Step 12: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/comparison`. Expect: hero + stats render, `{{ filtered.length }} sets match` count populates, desktop table renders (resize narrow to confirm the `an-cards` mobile branch via `useDisplay().mobile`), search/min-volume/sort/category-chips/switches all filter live, pagination works, spinner hides, zero console errors. Force the error path (stop backend, reload) to confirm the `loadError` alert shows. Screenshot-diff `/comparison` vs old app at `app/pages/comparison.vue` route (close — accept Vuetify 3 default control spacing shifts on fields/switches/chips).

- [ ] Step 13: Commit: `git add app-next/app/pages/comparison.vue && git commit -m "feat(migration): port comparison page to Nuxt 4 / Vue 3 / Vuetify 3"`

---

### Task P6.9: Migrate relic-farming.vue (plat/hour relic ranker) to script setup + Vuetify 3

**Files:**
- Create: `app-next/app/pages/relic-farming.vue`
- Delete/superseded: `app/pages/relic-farming.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config, vuetify-nuxt-module, `runtimeConfig.public.apiURL`), P1 ($fetch/useAsyncData conventions), P2 (`app/assets/analytics.css` `.an-*` classes globally registered), P3 (default layout renders `#spinner-wrapper`)

**Steps:**

- [ ] Step 1: Convert the whole `<script lang="ts">` Options API block to `<script setup lang="ts">`. Replace `asyncData` + `data()` + `head()` with composables, refs, and `useSeoMeta`.

  BEFORE (lines 219-271):
  ```ts
  <script lang="ts">
  // Fixed refinement drop-chance table (per rarity), shared by all relics.
  const CHANCES: Record<string, Record<string, number>> = {
    Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
    Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
  }

  export default {
    name: 'RelicFarmingPage',
    async asyncData({ $axios, $config }: any) {
      try {
        const data = await $axios
          .get(`${$config.apiURL}/relics_ev`)
          .then((res: any) => res.data)
        return { relics: (data && data.relics) || [], loadError: false }
      } catch (e) {
        return { relics: [], loadError: true }
      }
    },
    data() {
      return {
        relics: [] as any[],
        loadError: false,
        search: '',
        tier: 'All',
        refinement: 'Radiant',
        sortKey: 'pph',
        missionMinutes: 3,
        page: 1,
        perPage: 20,
        placeholderImg:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
        sortOptions: [
          { text: 'Plat / hour', value: 'pph' },
          { text: 'Payout (EV)', value: 'ev' },
          { text: 'Volume', value: 'volume' },
          { text: 'Name (A–Z)', value: 'name' },
        ],
      }
    },
    head() {
      return {
        title: 'Relic Farming — best relics by platinum per hour (Warframe)',
        meta: [
          {
            hid: 'description',
            name: 'description',
            content:
              'Rank every Warframe void relic by platinum per hour: expected Intact or Radiant payout divided by your minutes-per-run. Find the best relic to farm plat right now.',
          },
        ],
      }
    },
  ```

  AFTER (top of `<script setup lang="ts">`):
  ```ts
  <script setup lang="ts">
  import { ref, computed, watch, nextTick, onMounted } from 'vue'
  import { useDisplay } from 'vuetify'

  // Fixed refinement drop-chance table (per rarity), shared by all relics.
  const CHANCES: Record<string, Record<string, number>> = {
    Intact: { Common: 25.33, Uncommon: 11, Rare: 2 },
    Radiant: { Common: 16.67, Uncommon: 20, Rare: 10 },
  }

  const config = useRuntimeConfig()
  const base = config.public.apiURL

  // asyncData GET /relics_ev -> useAsyncData; preserve try/catch -> loadError intent
  const { data, error } = await useAsyncData('relic-farming-ev', () =>
    $fetch<{ relics: any[] }>(`${base}/relics_ev`)
  )
  const loadError = computed(() => !!error.value)
  const relics = computed<any[]>(() => data.value?.relics ?? [])

  const search = ref('')
  const tier = ref('All')
  const refinement = ref('Radiant')
  const sortKey = ref('pph')
  const missionMinutes = ref(3)
  const page = ref(1)
  const perPage = 20
  const placeholderImg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
  const sortOptions = [
    { text: 'Plat / hour', value: 'pph' },
    { text: 'Payout (EV)', value: 'ev' },
    { text: 'Volume', value: 'volume' },
    { text: 'Name (A–Z)', value: 'name' },
  ]

  useSeoMeta({
    title: 'Relic Farming — best relics by platinum per hour (Warframe)',
    description:
      'Rank every Warframe void relic by platinum per hour: expected Intact or Radiant payout divided by your minutes-per-run. Find the best relic to farm plat right now.',
  })
  ```

- [ ] Step 2: Port the methods to plain functions (they must exist BEFORE the computeds that call them). Convert every `this.<reactiveState>` to `<ref>.value`; `this.<method>(x)` to `<fn>(x)`.

  BEFORE (lines 339-377, methods block):
  ```ts
    methods: {
      assetUrl(thumb: string): string {
        return 'https://warframe.market/static/assets/' + (thumb || '')
      },
      onImgError(e: any) {
        const img = e.target
        if (!img || img.dataset.fallback) return
        img.dataset.fallback = '1'
        img.src = this.placeholderImg
      },
      ev(relic: any): number {
        const table = CHANCES[this.refinement] || CHANCES.Intact
        return (relic.rewards || []).reduce((sum: number, r: any) => {
          const chance = table[r.rarity] || 0
          return sum + (chance / 100) * (r.price || 0)
        }, 0)
      },
      platPerHour(relic: any): number {
        const minutes = Number(this.missionMinutes) || 1
        return (this.ev(relic) / minutes) * 60
      },
      topDrop(relic: any): any {
        let best = { item_name: '—', price: 0, rarity: '' }
        for (const r of relic.rewards || []) {
          if (r.price > best.price) best = r
        }
        return best
      },
      fmtPlat(n: number): string {
        return Math.round(Number(n) || 0).toLocaleString('en-US')
      },
      finishLoading() {
        this.$nextTick(() => {
          const el = document.getElementById('spinner-wrapper')
          if (el) el.style.display = 'none'
          else this.finishLoading()
        })
      },
    },
  ```

  AFTER (plain functions):
  ```ts
  function assetUrl(thumb: string): string {
    return 'https://warframe.market/static/assets/' + (thumb || '')
  }
  function onImgError(e: any) {
    const img = e.target
    if (!img || img.dataset.fallback) return
    img.dataset.fallback = '1'
    img.src = placeholderImg
  }
  function ev(relic: any): number {
    const table = CHANCES[refinement.value] || CHANCES.Intact
    return (relic.rewards || []).reduce((sum: number, r: any) => {
      const chance = table[r.rarity] || 0
      return sum + (chance / 100) * (r.price || 0)
    }, 0)
  }
  function platPerHour(relic: any): number {
    const minutes = Number(missionMinutes.value) || 1
    return (ev(relic) / minutes) * 60
  }
  function topDrop(relic: any): any {
    let best = { item_name: '—', price: 0, rarity: '' }
    for (const r of relic.rewards || []) {
      if (r.price > best.price) best = r
    }
    return best
  }
  function fmtPlat(n: number): string {
    return Math.round(Number(n) || 0).toLocaleString('en-US')
  }
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }
  ```

- [ ] Step 3: Port the computeds. Replace `isMobile` (`$vuetify.breakpoint.mobile`) with `useDisplay()`, and convert all `this.` refs/methods. Keep the `watch(filtered)` page-reset and `onMounted(finishLoading)`.

  BEFORE (lines 272-338, computed/watch/mounted):
  ```ts
    computed: {
      isMobile(): boolean {
        return (this as any).$vuetify.breakpoint.mobile
      },
      tierOptions(): string[] {
        const present = new Set<string>()
        for (const r of this.relics as any[]) present.add(r.tier)
        const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
        return ['All', ...order.filter((t) => present.has(t))]
      },
      filtered(): any[] {
        const q = (this.search || '').toString().trim().toLowerCase()
        const list = (this.relics as any[]).filter((r) => {
          if (q && !r.relicName.toLowerCase().includes(q)) return false
          if (this.tier !== 'All' && r.tier !== this.tier) return false
          return true
        })
        const dir = (a: number, b: number) => b - a
        const sorters: Record<string, (a: any, b: any) => number> = {
          pph: (a, b) => dir(this.platPerHour(a), this.platPerHour(b)),
          ev: (a, b) => dir(this.ev(a), this.ev(b)),
          volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
          name: (a, b) => a.relicName.localeCompare(b.relicName),
        }
        return list.slice().sort(sorters[this.sortKey] || sorters.pph)
      },
      pageCount(): number {
        return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
      },
      paged(): any[] {
        const start = (this.page - 1) * this.perPage
        return this.filtered.slice(start, start + this.perPage)
      },
      topDeal(): any {
        let best: any = null
        for (const r of this.relics as any[]) {
          if (!best || this.platPerHour(r) > this.platPerHour(best)) best = r
        }
        return best
      },
      topDealUrl(): string {
        let best: any = null
        for (const r of this.filtered) {
          if (!best || this.platPerHour(r) > this.platPerHour(best)) best = r
        }
        return best ? best.url_name : ''
      },
      stats(): any {
        const list = this.relics as any[]
        const pphs = list.map((r) => this.platPerHour(r))
        const evs = list.map((r) => this.ev(r))
        return {
          total: list.length,
          bestPph: pphs.length ? Math.max(...pphs) : 0,
          avgPph: pphs.length ? pphs.reduce((s, v) => s + v, 0) / pphs.length : 0,
          biggest: evs.length ? Math.max(...evs) : 0,
        }
      },
    },
    watch: {
      filtered() {
        this.page = 1
      },
    },
    mounted() {
      this.finishLoading()
    },
  ```

  AFTER:
  ```ts
  const { mobile } = useDisplay()
  const isMobile = computed(() => mobile.value)

  const tierOptions = computed<string[]>(() => {
    const present = new Set<string>()
    for (const r of relics.value) present.add(r.tier)
    const order = ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem']
    return ['All', ...order.filter((t) => present.has(t))]
  })

  const filtered = computed<any[]>(() => {
    const q = (search.value || '').toString().trim().toLowerCase()
    const list = relics.value.filter((r) => {
      if (q && !r.relicName.toLowerCase().includes(q)) return false
      if (tier.value !== 'All' && r.tier !== tier.value) return false
      return true
    })
    const dir = (a: number, b: number) => b - a
    const sorters: Record<string, (a: any, b: any) => number> = {
      pph: (a, b) => dir(platPerHour(a), platPerHour(b)),
      ev: (a, b) => dir(ev(a), ev(b)),
      volume: (a, b) => dir(a.relic.volume || 0, b.relic.volume || 0),
      name: (a, b) => a.relicName.localeCompare(b.relicName),
    }
    return list.slice().sort(sorters[sortKey.value] || sorters.pph)
  })

  const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

  const paged = computed<any[]>(() => {
    const start = (page.value - 1) * perPage
    return filtered.value.slice(start, start + perPage)
  })

  const topDeal = computed<any>(() => {
    let best: any = null
    for (const r of relics.value) {
      if (!best || platPerHour(r) > platPerHour(best)) best = r
    }
    return best
  })

  const topDealUrl = computed<string>(() => {
    let best: any = null
    for (const r of filtered.value) {
      if (!best || platPerHour(r) > platPerHour(best)) best = r
    }
    return best ? best.url_name : ''
  })

  const stats = computed<any>(() => {
    const list = relics.value
    const pphs = list.map((r) => platPerHour(r))
    const evs = list.map((r) => ev(r))
    return {
      total: list.length,
      bestPph: pphs.length ? Math.max(...pphs) : 0,
      avgPph: pphs.length ? pphs.reduce((s, v) => s + v, 0) / pphs.length : 0,
      biggest: evs.length ? Math.max(...evs) : 0,
    }
  })

  watch(filtered, () => {
    page.value = 1
  })

  onMounted(finishLoading)
  </script>
  ```
  Note: template auto-unwraps refs, so `refinement.toLowerCase()`, `stats.total`, `filtered.length`, `paged`, `topDeal.url_name`, `isMobile`, etc. in the template need NO changes — the ref/computed names are identical to the old Options API names.

- [ ] Step 4: Fix `v-text-field` (search) — drop `dark`, `dense` -> `density="compact"`.

  BEFORE (lines 54-63):
  ```html
  <v-text-field
    v-model="search"
    dark
    dense
    hide-details
    clearable
    prepend-inner-icon="mdi-magnify"
    label="Search a relic"
    class="an-search"
  ></v-text-field>
  ```
  AFTER:
  ```html
  <v-text-field
    v-model="search"
    density="compact"
    hide-details
    clearable
    prepend-inner-icon="mdi-magnify"
    label="Search a relic"
    class="an-search"
  ></v-text-field>
  ```

- [ ] Step 5: Fix `v-btn-toggle` refinement selector — drop `dark`, `dense` -> `density="compact"`; `v-btn small` -> `size="small"`.

  BEFORE (lines 66-69):
  ```html
  <v-btn-toggle v-model="refinement" mandatory dense dark>
    <v-btn value="Intact" small>Intact</v-btn>
    <v-btn value="Radiant" small>Radiant</v-btn>
  </v-btn-toggle>
  ```
  AFTER:
  ```html
  <v-btn-toggle v-model="refinement" mandatory density="compact">
    <v-btn value="Intact" size="small">Intact</v-btn>
    <v-btn value="Radiant" size="small">Radiant</v-btn>
  </v-btn-toggle>
  ```

- [ ] Step 6: Fix `v-slider` (minutes per run) — drop `dark` (V3 keeps `min`/`max`/`step`/`thumb-label`/`color`/`track-color`/`hide-details`).

  BEFORE (lines 75-86):
  ```html
  <v-slider
    v-model="missionMinutes"
    :min="1"
    :max="10"
    :step="0.5"
    thumb-label
    dark
    hide-details
    color="#d4af5a"
    track-color="rgba(255,255,255,0.14)"
    class="an-mins__slider"
  ></v-slider>
  ```
  AFTER:
  ```html
  <v-slider
    v-model="missionMinutes"
    :min="1"
    :max="10"
    :step="0.5"
    thumb-label
    hide-details
    color="#d4af5a"
    track-color="rgba(255,255,255,0.14)"
    class="an-mins__slider"
  ></v-slider>
  ```

- [ ] Step 7: Fix `v-select` (sort) — drop `dark`, `dense`; the `sortOptions` items use `{text,value}` so add `item-title="text"` and `item-value="value"` (V3 defaults are `title`/`value`).

  BEFORE (lines 88-97):
  ```html
  <v-select
    v-model="sortKey"
    :items="sortOptions"
    dark
    dense
    hide-details
    label="Sort by"
    class="an-field"
    style="flex: 0 1 220px"
  ></v-select>
  ```
  AFTER:
  ```html
  <v-select
    v-model="sortKey"
    :items="sortOptions"
    item-title="text"
    item-value="value"
    density="compact"
    hide-details
    label="Sort by"
    class="an-field"
    style="flex: 0 1 220px"
  ></v-select>
  ```

- [ ] Step 8: Fix `v-chip-group` / `v-chip` tier chips — `v-chip small` -> `size="small"` (`column`, `mandatory`, `value`, `active-class` unchanged).

  BEFORE (lines 100-110):
  ```html
  <v-chip-group v-model="tier" mandatory column class="an-cats">
    <v-chip
      v-for="t in tierOptions"
      :key="t"
      :value="t"
      small
      active-class="an-chip--on"
    >
      {{ t }}
    </v-chip>
  </v-chip-group>
  ```
  AFTER:
  ```html
  <v-chip-group v-model="tier" mandatory column class="an-cats">
    <v-chip
      v-for="t in tierOptions"
      :key="t"
      :value="t"
      size="small"
      active-class="an-chip--on"
    >
      {{ t }}
    </v-chip>
  </v-chip-group>
  ```

- [ ] Step 9: Fix the error `v-alert` — drop `dark`, `dense` -> `density="compact"`.

  BEFORE (lines 117-119):
  ```html
  <v-alert v-if="loadError" type="error" dark dense class="ma-4">
    Couldn't load relic data. The market service may be waking up — try a refresh.
  </v-alert>
  ```
  AFTER:
  ```html
  <v-alert v-if="loadError" type="error" density="compact" class="ma-4">
    Couldn't load relic data. The market service may be waking up — try a refresh.
  </v-alert>
  ```

- [ ] Step 10: Fix `v-pagination` — drop `dark` (`length`/`total-visible`/`color` kept). `isMobile` in the template resolves to the new computed.

  BEFORE (line 206):
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
  ```
  AFTER:
  ```html
  <v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
  ```

- [ ] Step 11: Fix the disclaimer `v-alert` — drop `dense` -> `density="compact"`; the `blue darken-4` color helper classes are REMOVED in Vuetify 3, replace with the `color="blue-darken-4"` prop (keep the `an-disclaimer` class).

  BEFORE (lines 210-214):
  ```html
  <v-alert class="an-disclaimer blue darken-4" type="info" dense>
    Plat/hr = expected {{ refinement }} payout ÷ your minutes-per-run × 60.
    Radiant costs 100 void traces to refine; actual run time varies by
    fissure and squad. Payout uses each drop's lowest sell order.
  </v-alert>
  ```
  AFTER:
  ```html
  <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
    Plat/hr = expected {{ refinement }} payout ÷ your minutes-per-run × 60.
    Radiant costs 100 void traces to refine; actual run time varies by
    fissure and squad. Payout uses each drop's lowest sell order.
  </v-alert>
  ```

- [ ] Step 12: Leave the rest of the template as-is. `<client-only>`, `<nuxt-link :to="...">`, `<img @error="onImgError">`, the raw `<table class="an-table">` markup, `<v-icon color="#4fb3bf">mdi-chevron-right</v-icon>`, and the `.an-*` class hooks are all Nuxt 3 / Vuetify 3 compatible and need no change. Copy the `<style scoped>` block verbatim — but note the deep selector `>>>` is deprecated; if the typecheck/build warns, rename `.an-refine >>> .v-btn-toggle` to `.an-refine :deep(.v-btn-toggle)` (3 occurrences at lines 390/395/402). Prefer leaving `>>>` if the Vite build accepts it silently.

- [ ] Step 13: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (watch for `data.value` possibly-undefined — the `?.relics ?? []` guard covers it).

- [ ] Step 14: Verify in browser: start backend from repo root `npm run dev` (:3529), then `cd app-next && npm run dev`; load `/relic-farming`. Expect: hero + 4 stat tiles render, best-plat/hr deal card shows, desktop table (or mobile cards under `useDisplay` mobile) lists relics, search/refinement-toggle/minutes-slider/sort-select/tier-chips all filter and re-sort live, pagination appears when >20 rows, `#spinner-wrapper` hides on mount, zero console errors. Screenshot-diff vs old app `/relic-farming` (close; accept Vuetify 3 default control spacing shifts on the toggle/slider/select/chips).

- [ ] Step 15: Commit: `git add app-next/app/pages/relic-farming.vue && git commit -m "feat(migration): port relic-farming page to Nuxt4/Vue3/Vuetify3"`

---


## Phase P7 — Dynamic routes


---

### Task P7.1: Migrate dynamic relic page (pages/relic/_relic.vue → relic/[relic].vue)

**Files:**
- Create: `app-next/app/pages/relic/[relic].vue`
- Delete/superseded: `app/pages/relic/_relic.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config, vuetify-nuxt-module, built-in `$fetch`), P1 (@nuxtjs/i18n v9 + `useLocaleHead`), P2 (Pinia `useItemsStore` with `allRelics` getter), P3 (default layout + `#spinner-wrapper`), and the migrated `DropLocationsDialog.vue` (auto-imported).

**Notes on scope:** The old file carries a large block of DEAD methods that reference data props that never exist (`this.items`, `this.wantTo`, `this.amount`, `this.code`, `this.code_with`, `this.day`, `this.lastPos`): `get_text`, `getColor`, `formatMoney`, `plusUy`, `fixTitle`, `capitalize`, `changeCode`, `install_app`, `hideWidgets`, `hideFeedback`, `formatNumber`. None are referenced by the template or any live method — DROP them. Live surface is: the two `v-data-table`s, the search form, the sell/earn alert, the donation block, the disclaimer alert, `loadFilters`/`filter`/`reset`, the scroll-sync hack, `openDrops` + `DropLocationsDialog`, and the spinner wiring.

**Steps:**

- [ ] Step 1: Create the new dynamic-route file at `app-next/app/pages/relic/[relic].vue` (Nuxt 4 renames `_relic.vue` → `[relic].vue`). Everything below goes in this one file.

- [ ] Step 2: Convert the `<v-data-table>` headers. BEFORE (`getHeaders()` method, lines 428-465):
```js
getHeaders() {
  const toReturn = [
    { text: 'Name', value: 'item_name', width: 'auto' },
    { text: 'Buy', value: 'market.buy', width: 'auto' },
    { text: 'Sell', value: 'market.sell', width: 'auto' },
    { text: 'Diff', value: 'market.diff', width: 'auto' },
    { text: 'Volume (Last 48hrs)', value: 'market.volume', width: 'auto' },
    { text: 'Tags', value: 'tags' },
    { text: 'Drops', value: 'drops' },
  ]
  return toReturn
}
```
AFTER (module-scope const in `<script setup>`; `text`→`title`, `value`→`key`, dotted keys still resolve nested `market.*`):
```ts
const headers = [
  { title: 'Name', key: 'item_name', width: 'auto' },
  { title: 'Buy', key: 'market.buy', width: 'auto' },
  { title: 'Sell', key: 'market.sell', width: 'auto' },
  { title: 'Diff', key: 'market.diff', width: 'auto' },
  { title: 'Volume (Last 48hrs)', key: 'market.volume', width: 'auto' },
  { title: 'Tags', key: 'tags' },
  { title: 'Drops', key: 'drops' },
] as const
```
In the template, both `:headers="getHeaders()"` occurrences (lines 13, 66) become `:headers="headers"`.

- [ ] Step 3: Fix sort props + goTo + item-class + the `#top` slot on the OUTER data table. BEFORE (lines 6-22):
```html
<v-data-table
  ref="dataTable"
  color="#f5f5f5"
  :hide-default-footer="true"
  sort-by="market.sell"
  sort-desc
  :item-class="row_classes"
  :headers="getHeaders()"
  :items="all_items"
  :footer-props="{ 'items-per-page-options': [10, 20, 30, 40, 50] }"
  :items-per-page="50"
  class="elevation-1 money_table"
  @update:page="$vuetify.goTo($refs.dataTable)"
>
  <template #top="{ pagination, options, updateOptions }">
```
AFTER (`sort-by`+`sort-desc` → `:sort-by` array of `{key,order}`; `:item-class` removed → `:row-props`; `$vuetify.goTo` → `useGoTo()`; `#top` loses its now-removed slot props; V3 has no `footer-props`, the per-page options belong on `:items-per-page-options`):
```html
<v-data-table
  ref="dataTable"
  :hide-default-footer="true"
  :sort-by="sortBy"
  :row-props="rowProps"
  :headers="headers"
  :items="all_items"
  :items-per-page-options="[10, 20, 30, 40, 50]"
  :items-per-page="50"
  class="elevation-1 money_table"
  @update:page="goTo(dataTable)"
>
  <template #top>
```
Drop the `color="#f5f5f5"` prop (no longer a valid v-data-table prop in V3; it had no visible effect on the table body).

- [ ] Step 4: Port `row_classes` → `rowProps` and swap Vuetify-2 color helper classes for V3 `bg-*`. BEFORE (lines 509-517):
```js
row_classes(item) {
  if (item.isInterBank) { return 'purple darken-4' }
  if (item.condition) { return 'grey darken-3' }
  return ''
}
```
AFTER:
```ts
const rowProps = ({ item }: { item: any }) => ({ class: row_classes(item) })
function row_classes(item: any) {
  if (item.isInterBank) return 'bg-purple-darken-4'
  if (item.condition) return 'bg-grey-darken-3'
  return ''
}
```

- [ ] Step 5: Port the item slots. `#item.item_name`, `#item.tags`, `#item.drops` keep their names (slot name = column `key`). REMOVE both empty `#item.thumb` slots (lines 89, 126) — there is no `thumb` column so they never render. `v-chip-group selected-class="text-primary" column` and `v-icon small` stay valid in V3. The inner `<v-data-table>` (lines 65-106) gets the same `:headers="headers"` swap and keeps `:hide-default-footer="true"` / `:items="set"` / `:items-per-page="50"`.

- [ ] Step 6: Fix the search `v-autocomplete`. BEFORE (lines 44-52):
```html
<v-autocomplete
  v-model="search"
  label="Search"
  width="200px"
  :items="allSets"
  dark
  item-text="item_name"
  item-value="url_name"
></v-autocomplete>
```
AFTER (`item-text`→`item-title`; drop `dark` — darkness comes from theme; `width` is not a v-autocomplete prop in V3, move to style):
```html
<v-autocomplete
  v-model="search"
  label="Search"
  style="max-width: 200px"
  :items="allSets"
  item-title="item_name"
  item-value="url_name"
></v-autocomplete>
```
The two `<v-btn ... color="primary">` in the form use no `text`/`outlined` attrs, so they need no variant change.

- [ ] Step 7: Fix the alerts + color utility classes across the template. Changes:
  - Line 38: `<div style="background: #1f1f2f" class="pa-3 white--text">` → `class="pa-3 text-white"`.
  - Line 60: `<v-alert dense>` → `<v-alert density="compact">`.
  - Line 155: `<div class="white--text mr-3">` → `text-white mr-3`.
  - Lines 159, 175: `class="white--text d-flex ..."` → `text-white d-flex ...`.
  - Lines 196-198 BEFORE:
```html
<v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 blue darken-4" type="info" dense>
  {{ $t('disclaimer') }}
</v-alert>
```
  AFTER (`blue darken-4`→`bg-blue-darken-4`, `dense`→`density="compact"`, `$t`→`t`):
```html
<v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4" type="info" density="compact">
  {{ t('disclaimer') }}
</v-alert>
```
  - Line 152 keeps `grey darken-3 pa-3 ...` → change `grey darken-3` to `bg-grey-darken-3` (rest of that class list is spacing/typography utilities that are still valid).

- [ ] Step 8: The two donation `<v-img>` blocks (lines 162-171, 179-188) use a `#sources` webp slot that V3 removed. BEFORE:
```html
<v-img max-width="50px" height="50px" contain src="/img/paypal_icon.png">
  <template #sources>
    <source srcset="/img/paypal_icon.webp" />
  </template>
</v-img>
```
AFTER (V3 v-img has no `sources` slot; keep the png `src`, drop the webp `<source>` — png is the existing fallback so it is a no-op visually):
```html
<v-img max-width="50" height="50" src="/img/paypal_icon.png" />
```
Apply the same to the mercadopago block. (`contain` is still valid but redundant here; keep or drop.)

- [ ] Step 9: `<client-only>` (line 5) → `<ClientOnly>` (Nuxt 3 built-in) and `<DropLocationsDialog v-model="dropsDialog" :item-name="dropsItem" />` (line 145) stays — but DELETE the explicit `import DropLocationsDialog from '../../components/DropLocationsDialog.vue'` (line 204); Nuxt 3 auto-imports it from `app-next/app/components/`.

- [ ] Step 10: Replace the whole Options-API `<script lang="ts">` block (lines 202-545) with `<script setup lang="ts">`. Port data → refs, computed getter, methods, and the `beforeMount`/`mounted` lifecycle (the old hook `beforeMount()` calls a same-named method — flatten it into `onMounted`). BEFORE (representative pieces — Vuex getter, head, axios loader, lifecycle):
```js
import { mapGetters } from 'vuex'
computed: { ...mapGetters({ allSets: 'all_relics' }) },
head() { return this.$nuxtI18nHead({ addSeoAttributes: true }) },
async loadFilters() {
  const search = this.$route.params.relic
  if (search) {
    this.search = search
    const data = await this.$axios.get(`${this.$config.apiURL}/relic/${search}`).then((res) => res.data)
    const hasMarket = (item) => item && typeof item === 'object' && item.market
    this.all_items = (data.items || []).filter(hasMarket)
    this.set = (data.set || []).filter(hasMarket)
    this.priceRelic = this.set.length ? this.set[0].market.sell || this.set[0].market.buy : 0
    this.maxEarn = this.all_items.length ? this.all_items.reduce((a, b) => a.market.sell > b.market.sell ? a : b).market.sell : 0
  }
},
filter() { this.$router.push('/relic/' + this.search) },
reset() { this.$router.push('/relic') },
beforeMount() { this.beforeMount() },   // -> method: all_items = allItems; loadFilters(); finishLoading()
mounted() { /* startLoading/stopLoading window fns */ this.setScrollBar() },
```
AFTER (full `<script setup>` — note `search` ref renamed-safe, `all_items`/`set` kept as names the template already binds, the dead `$route` watcher is replaced by a functional reload watcher since `filter`/`reset` push param-only route changes that do not remount the page):
```ts
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const config = useRuntimeConfig()
const base = config.public.apiURL as string
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const goTo = useGoTo()

const items = useItemsStore()
const allSets = computed(() => items.allRelics)

// SEO / i18n head (ports this.$nuxtI18nHead({ addSeoAttributes: true }))
useHead(useLocaleHead({ addSeoAttributes: true }))

const search = ref('')
const all_items = ref<any[]>([])
const set = ref<any[]>([])
const priceRelic = ref<number>(0)
const maxEarn = ref<number>(0)
const hasScroll = ref(false)
const scrollWidth = ref<string | number>(0)
const dropsDialog = ref(false)
const dropsItem = ref('')
const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([{ key: 'market.sell', order: 'desc' }])
const dataTable = ref<any>(null)
const wrapper2 = ref<HTMLElement | null>(null)

async function loadFilters() {
  const s = route.params.relic as string
  if (!s) return
  search.value = s
  const data: any = await $fetch(`${base}/relic/${s}`)
  const hasMarket = (item: any) => item && typeof item === 'object' && item.market
  all_items.value = (data.items || []).filter(hasMarket)
  set.value = (data.set || []).filter(hasMarket)
  priceRelic.value = set.value.length ? (set.value[0].market.sell || set.value[0].market.buy) : 0
  maxEarn.value = all_items.value.length
    ? all_items.value.reduce((a: any, b: any) => (a.market.sell > b.market.sell ? a : b)).market.sell
    : 0
}

function filter() { router.push('/relic/' + search.value) }
function reset() { router.push('/relic') }
function openDrops(name: string) { dropsItem.value = name; dropsDialog.value = true }

function row_classes(item: any) {
  if (item.isInterBank) return 'bg-purple-darken-4'
  if (item.condition) return 'bg-grey-darken-3'
  return ''
}
const rowProps = ({ item }: { item: any }) => ({ class: row_classes(item) })

function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}

function setScrollBar() {
  // V3 DOM: the scrollable wrapper class is .v-table__wrapper (was .v-data-table__wrapper in V2)
  const tableWrapper = document.querySelector('.money_table .v-table__wrapper') as HTMLElement | null
  if (!tableWrapper) { nextTick(() => setScrollBar()); return }
  const isMobile = document.querySelector('.money_table.v-data-table--mobile')
  hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
  let wp1: any = null
  let wp2: any = null
  let wrapper1: HTMLElement | null = null
  let w2: HTMLElement | null = null
  if (hasScroll.value && !isMobile) {
    wrapper1 = document.querySelector('.money_table .v-table__wrapper')
    w2 = wrapper2.value
    if (!w2 || !wrapper1) { nextTick(() => setScrollBar()); return }
    const table = document.querySelector('.money_table table') as HTMLElement
    scrollWidth.value = table.clientWidth + 10 + 'px'
    let scrolling = false
    wp1 = () => { if (scrolling) { scrolling = false; return } scrolling = true; w2!.scrollLeft = wrapper1!.scrollLeft }
    wp2 = () => { if (scrolling) { scrolling = false; return } scrolling = true; wrapper1!.scrollLeft = w2!.scrollLeft }
    wrapper1.addEventListener('scroll', wp1)
    w2.addEventListener('scroll', wp2)
  }
  window.addEventListener('resize', () => {
    if (wrapper1) { wrapper1.removeEventListener('scroll', wp1); w2?.removeEventListener('scroll', wp2) }
    setScrollBar()
  }, { once: true })
}

onMounted(() => {
  ;(window as any).startLoading = () => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display = 'flex' }
  ;(window as any).stopLoading = () => { const el = document.getElementById('spinner-wrapper'); if (el) el.style.display = 'none' }
  loadFilters()
  finishLoading()
  setScrollBar()
})

// param-only navigation (/relic/x -> /relic/y) does not remount the page; reload data
watch(() => route.params.relic, () => loadFilters())
```
Also update the two template refs: keep `ref="dataTable"` on the outer table and `ref="wrapper2"` on the `#wrapper2` div (line 27) — `<script setup>` binds them by matching variable name. `v-show="hasScroll"` (line 25) and `:style="{ width: scrollWidth }"` (line 32) now read the refs directly.

- [ ] Step 11: Sanity-check the full ported `<template>`: `{{ $t('disclaimer') }}` → `{{ t('disclaimer') }}`; `all_items`, `set`, `priceRelic`, `maxEarn`, `search`, `allSets`, `hasScroll`, `scrollWidth`, `dropsDialog`, `dropsItem` all resolve to the new refs/computed; `@submit.prevent="filter"`, `@click.prevent="reset"`, `@click="openDrops(item.item_name)"` unchanged. Keep the `<style scoped>` block (the `.drops-btn` rules, lines 547-575) verbatim.

- [ ] Step 12: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (watch for `market.*` header key typing and the `useGoTo`/`useLocaleHead` auto-imports resolving).

- [ ] Step 13: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/relic/lith_a1` (or any valid relic url_name). Expect: spinner hides on mount, outer table renders with the sell/earn alert, the inner "set" table renders, search autocomplete lists relics, Search navigates + reloads data, Reset returns to `/relic`, the Drops button opens `DropLocationsDialog`, and the top horizontal scrollbar syncs with the table when it overflows. Zero console errors. Screenshot-diff vs old app `/relic/lith_a1` (close; accept V3 table spacing/density shifts).

- [ ] Step 14: Commit: `git add app-next/app/pages/relic/[relic].vue && git commit -m "feat(migration): port relic/[relic] page to Nuxt4/Vue3/Vuetify3"`

---

### Task P7.2: Migrate set/_set.vue (set price comparator) to Nuxt 4 / Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/pages/set/[set].vue`
- Delete/superseded: `app/pages/set/_set.vue` (reference only; old app stays until cutover)

**Depends on:** P0-P3 infra (nuxt.config.ts, vuetify-nuxt-module, @nuxtjs/i18n v9, `runtimeConfig.public.apiURL`); P4 Pinia store `app-next/app/stores/items.ts` (`useItemsStore().allSets`); default layout providing `#spinner-wrapper`.

**Notes:** This page never used `asyncData` — it fetches client-side inside `<client-only>` from route param `set`. Preserve that: fetch in `onMounted` + `watch(() => route.params.set)`. Almost every Vuetify 2 data-table / color-class pattern in the codebase appears here; it is a near-twin of `relic/_relic.vue`, so keep the two migrations consistent.

**Steps:**

- [ ] Step 1: Rename to a V3 dynamic route. `pages/set/_set.vue` -> `app-next/app/pages/set/[set].vue`. Param access changes from `this.$route.params.set` to `route.params.set` (see Step 6).

- [ ] Step 2: Convert `<script>` to `<script setup lang="ts">` and replace the Vuex getter + reactive state.
  BEFORE:
  ```ts
  <script lang="ts">
  import { mapGetters } from 'vuex'
  export default {
    name: 'HomePage',
    components: {},
    data() {
      return {
        save: 0,
        allItems: [],
        all_items: [],
        set: [],
        min_volume: 0,
        search: '',
        selection: 'All',
        hasScroll: false,
        scrollWidth: 0,
      }
    },
    ...
    computed: {
      ...mapGetters({
        allSets: 'all_sets',
      }),
    },
  ```
  AFTER:
  ```ts
  <script setup lang="ts">
  import { ref, computed, nextTick, onMounted, watch } from 'vue'
  import { useGoTo } from 'vuetify'
  import { useDisplay } from 'vuetify'
  import { useItemsStore } from '~/stores/items'

  const route = useRoute()
  const router = useRouter()
  const config = useRuntimeConfig()
  const base = config.public.apiURL
  const { t, locale } = useI18n()
  const goTo = useGoTo()
  const { mobile } = useDisplay()
  const itemsStore = useItemsStore()
  const allSets = computed(() => itemsStore.allSets)

  const save = ref(0)
  const all_items = ref<any[]>([])
  const set = ref<any[]>([])
  const search = ref('')
  const hasScroll = ref(false)
  const scrollWidth = ref<string | number>(0)

  const dataTable = ref<HTMLElement | null>(null)
  const wrapper2 = ref<HTMLElement | null>(null)
  ```
  (Dropped dead state: `allItems`, `min_volume`, `selection`, and the unused `changeCode/get_text/getColor/formatMoney/formatNumber/capitalize/fixTitle/plusUy/install_app/hideWidgets/hideFeedback` helpers that reference fields this page never defines — see Step 10.)

- [ ] Step 3: Port `head()` (nuxt-i18n) to `useLocaleHead` + `useHead`.
  BEFORE:
  ```ts
  head() {
    return this.$nuxtI18nHead({
      addSeoAttributes: true,
    })
  },
  ```
  AFTER (in `<script setup>`):
  ```ts
  const localeHead = useLocaleHead()
  useHead(() => ({
    htmlAttrs: localeHead.value.htmlAttrs,
    link: localeHead.value.link,
    meta: localeHead.value.meta,
  }))
  ```

- [ ] Step 4: Replace `$axios`/`$config` data fetch with `$fetch`, and make it re-run on route change. This subsumes the old `beforeMount`/`loadFilters` chain.
  BEFORE:
  ```ts
  async loadFilters() {
    const search = this.$route.params.set
    if (search) {
      this.search = search
      if (search) {
        const data = await this.$axios
          .get(`${this.$config.apiURL}/set/${search}`)
          .then((res) => res.data)
        const hasMarket = (item) => item && typeof item === 'object' && item.market
        this.all_items = (data.items || []).filter(hasMarket)
        this.set = (data.set || []).filter(hasMarket)
        this.save =
          this.set.length === 2
            ? this.set[0].market.sell - this.set[1].market.sell
            : 0
      }
    }
  },
  ```
  AFTER:
  ```ts
  async function loadFilters() {
    const s = route.params.set as string | undefined
    if (!s) return
    search.value = s
    const data: any = await $fetch(`${base}/set/${s}`)
    const hasMarket = (item: any) =>
      item && typeof item === 'object' && item.market
    all_items.value = (data.items || []).filter(hasMarket)
    set.value = (data.set || []).filter(hasMarket)
    save.value =
      set.value.length === 2
        ? set.value[0].market.sell - set.value[1].market.sell
        : 0
  }
  watch(() => route.params.set, () => loadFilters())
  ```

- [ ] Step 5: Rework lifecycle. Old code had a recursive `beforeMount()` method called from the `beforeMount` hook, plus `mounted()` spinner wiring and `finishLoading()`. Collapse into `onMounted`.
  BEFORE:
  ```ts
  beforeMount() {
    this.beforeMount()
  },
  mounted() {
    ;(window as any).startLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'flex'
    }
    ;(window as any).stopLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
    }
    this.setScrollBar()
  },
  ...
  beforeMount() {   // the method
    let pwaInstall = false
    try { ... } catch (e) { console.error(e) }
    if (pwaInstall) { ... window.addEventListener('beforeinstallprompt', ...) }
    this.all_items = this.allItems
    this.loadFilters()
    this.finishLoading()
  },
  ...
  finishLoading() {
    this.$nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else { this.finishLoading() }
    })
  },
  ```
  AFTER:
  ```ts
  function finishLoading() {
    nextTick(() => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
      else finishLoading()
    })
  }

  onMounted(async () => {
    ;(window as any).startLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'flex'
    }
    ;(window as any).stopLoading = () => {
      const el = document.getElementById('spinner-wrapper')
      if (el) el.style.display = 'none'
    }
    await loadFilters()
    finishLoading()          // memory: new pages MUST hide #spinner-wrapper on mount
    setScrollBar()
  })
  ```
  (The `beforeinstallprompt`/PWA block set `this.show_install`, which this page never renders — drop it.)

- [ ] Step 6: Port the remaining methods to plain functions. `reset`, `filter`, `getHeaders`, `row_classes`(-> `rowProps`), `getLink`.
  BEFORE:
  ```ts
  reset() { this.$router.push('/set') },
  filter() {
    const search = this.search
    this.$router.push('/set/' + search)
  },
  getHeaders() {
    const toReturn = [
      { text: 'Name', value: 'item_name', width: 'auto' },
      { text: 'Buy', value: 'market.buy', width: 'auto' },
      { text: 'Sell', value: 'market.sell', width: 'auto' },
      { text: 'Diff', value: 'market.diff', width: 'auto' },
      { text: 'Volume (Last 48hrs)', value: 'market.volume', width: 'auto' },
      { text: 'Tags', value: 'tags' },
      { text: 'Drops', value: 'drops' },
    ]
    return toReturn
  },
  row_classes(item) {
    if (item.isInterBank) { return 'purple darken-4' }
    if (item.condition) { return 'grey darken-3' }
    return ''
  },
  getLink(name: string) {
    let s = '^' + name
    if (s.includes('(')) { s = s.split('(')[0].trim() }
    if (s.includes('Set')) { s = s.replace('Set', '').trim() }
    const encoded = encodeURIComponent(s)
    const url = `https://drops.warframestat.us/#/search/${encoded}/items/regex`
    return url
  },
  ```
  AFTER:
  ```ts
  function reset() { router.push('/set') }
  function filter() { router.push('/set/' + search.value) }

  const headers = [
    { title: 'Name', key: 'item_name', width: 'auto' },
    { title: 'Buy', key: 'market.buy', width: 'auto' },
    { title: 'Sell', key: 'market.sell', width: 'auto' },
    { title: 'Diff', key: 'market.diff', width: 'auto' },
    { title: 'Volume (Last 48hrs)', key: 'market.volume', width: 'auto' },
    { title: 'Tags', key: 'tags' },
    { title: 'Drops', key: 'drops' },
  ]

  function rowProps({ item }: { item: any }) {
    if (item.isInterBank) return { class: 'bg-purple-darken-4' }
    if (item.condition) return { class: 'bg-grey-darken-3' }
    return {}
  }

  function getLink(name: string) {
    let s = '^' + name
    if (s.includes('(')) s = s.split('(')[0].trim()
    if (s.includes('Set')) s = s.replace('Set', '').trim()
    return `https://drops.warframestat.us/#/search/${encodeURIComponent(s)}/items/regex`
  }
  ```
  (`getHeaders()` becomes a static `headers` const with `{ title, key }` — bind `:headers="headers"` in template instead of `getHeaders()`.)

- [ ] Step 7: Port `setScrollBar` — the V3 DOM class changed from `.v-data-table__wrapper` to `.v-table__wrapper`, and `.v-data-table--mobile` no longer exists (use `useDisplay().mobile`). `this.$nextTick`/`this.$refs` become `nextTick`/refs.
  BEFORE:
  ```ts
  setScrollBar() {
    const tableWrapper = document.querySelector(
      '.money_table .v-data-table__wrapper'
    )
    if (!tableWrapper) {
      this.$nextTick(() => { this.setScrollBar() })
      return
    }
    const isMobile = document.querySelector(
      '.money_table.v-data-table--mobile'
    )
    this.hasScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth
    let wp1 = null; let wp2 = null; let wrapper1 = null; let wrapper2 = null
    if (this.hasScroll && !isMobile) {
      wrapper1 = document.querySelector('.money_table .v-data-table__wrapper')
      wrapper2 = this.$refs.wrapper2
      if (!wrapper2 || !wrapper1) {
        this.$nextTick(() => { this.setScrollBar() })
        return
      }
      const table = document.querySelector('.money_table table')
      this.scrollWidth = table.clientWidth + 10 + 'px'
      ...
      wrapper1.addEventListener('scroll', wp1)
      wrapper2.addEventListener('scroll', wp2)
    }
    addEventListener('resize', () => { ... this.setScrollBar() }, { once: true })
  },
  ```
  AFTER:
  ```ts
  function setScrollBar() {
    const tableWrapper = document.querySelector(
      '.money_table .v-table__wrapper'
    ) as HTMLElement | null
    if (!tableWrapper) {
      nextTick(() => setScrollBar())
      return
    }
    hasScroll.value = tableWrapper.scrollWidth > tableWrapper.clientWidth
    let wp1: any = null
    let wp2: any = null
    let wrapper1: HTMLElement | null = null
    if (hasScroll.value && !mobile.value) {
      wrapper1 = document.querySelector(
        '.money_table .v-table__wrapper'
      ) as HTMLElement | null
      const w2 = wrapper2.value
      if (!w2 || !wrapper1) {
        nextTick(() => setScrollBar())
        return
      }
      const table = document.querySelector('.money_table table') as HTMLElement
      scrollWidth.value = table.clientWidth + 10 + 'px'
      let scrolling = false
      wp1 = () => {
        if (scrolling) { scrolling = false; return }
        scrolling = true
        w2.scrollLeft = wrapper1!.scrollLeft
      }
      wp2 = () => {
        if (scrolling) { scrolling = false; return }
        scrolling = true
        wrapper1!.scrollLeft = w2.scrollLeft
      }
      wrapper1.addEventListener('scroll', wp1)
      w2.addEventListener('scroll', wp2)
    }
    addEventListener('resize', () => {
      if (wrapper1) {
        wrapper1.removeEventListener('scroll', wp1)
        wrapper2.value?.removeEventListener('scroll', wp2)
      }
      setScrollBar()
    }, { once: true })
  }
  ```

- [ ] Step 8: Migrate the outer `v-data-table` template APIs — headers binding, `item-class`->`row-props`, sort props, `#top` slot signature, `$vuetify.goTo`, and item slots (unchanged names, re-verified).
  BEFORE:
  ```html
  <v-data-table
    ref="dataTable"
    color="#f5f5f5"
    :hide-default-footer="true"
    sort-by="market.volume"
    sort-desc
    :item-class="row_classes"
    :headers="getHeaders()"
    :items="all_items"
    :footer-props="{ 'items-per-page-options': [10, 20, 30, 40, 50] }"
    :items-per-page="50"
    class="elevation-1 money_table"
    @update:page="$vuetify.goTo($refs.dataTable)"
  >
    <template #top="{ pagination, options, updateOptions }">
  ```
  AFTER:
  ```html
  <v-data-table
    ref="dataTable"
    :hide-default-footer="true"
    :sort-by="[{ key: 'market.volume', order: 'desc' }]"
    :row-props="rowProps"
    :headers="headers"
    :items="all_items"
    :items-per-page="50"
    class="elevation-1 money_table"
    @update:page="goTo(dataTable)"
  >
    <template #top>
  ```
  (Dropped `color="#f5f5f5"` — not a V3 v-data-table prop; `footer-props` dropped because footer is hidden. Item slots `#item.item_name`, `#item.thumb`, `#item.tags`, `#item.drops` keep the same names.)

- [ ] Step 9: Fix the inner filter form + inner `v-data-table` template APIs: `v-autocomplete` `item-text`->`item-title` and drop `dark`; `v-alert dense`->`density="compact"`; inner table `:headers="getHeaders()"`->`:headers="headers"`; color/text helper classes.
  BEFORE:
  ```html
  <div style="background: #1f1f2f" class="pa-3 white--text">
    <form id="form_warframe" class="d-flex align-center flex-wrap" @submit.prevent="filter">
      <v-autocomplete
        v-model="search"
        label="Search"
        width="200px"
        :items="allSets"
        dark
        item-text="item_name"
        item-value="url_name"
      ></v-autocomplete>
      <v-btn type="submit" color="primary"> Search </v-btn>
      <v-btn color="primary" @click.prevent="reset">
        <v-icon>mdi-restore</v-icon>
      </v-btn>
    </form>
  </div>
  <div>
    <v-alert dense>
      Purchasing by parts can save you up to: <b>{{ save }}</b> platinum
    </v-alert>
  </div>
  <v-data-table :headers="getHeaders()" :hide-default-footer="true" :items="set" :items-per-page="50">
  ```
  AFTER:
  ```html
  <div style="background: #1f1f2f" class="pa-3 text-white">
    <form id="form_warframe" class="d-flex align-center flex-wrap" @submit.prevent="filter">
      <v-autocomplete
        v-model="search"
        label="Search"
        width="200px"
        :items="allSets"
        item-title="item_name"
        item-value="url_name"
      ></v-autocomplete>
      <v-btn type="submit" color="primary"> Search </v-btn>
      <v-btn color="primary" @click.prevent="reset">
        <v-icon>mdi-restore</v-icon>
      </v-btn>
    </form>
  </div>
  <div>
    <v-alert density="compact">
      Purchasing by parts can save you up to: <b>{{ save }}</b> platinum
    </v-alert>
  </div>
  <v-data-table :headers="headers" :hide-default-footer="true" :items="set" :items-per-page="50">
  ```

- [ ] Step 10: Sweep remaining Vuetify-2 color helper classes and the i18n `$t` in template.
  BEFORE:
  ```html
  <div class="my-3 mb-0 md-md-3 grey darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
  ...
  <div class="white--text mr-3">Help us donating!</div>
  <a ... class="white--text d-flex mr-4 align-center justify-content-left donation_logo" ...>
  ...
  <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 blue darken-4" type="info" dense>
    {{ $t('disclaimer') }}
  </v-alert>
  ```
  AFTER:
  ```html
  <div class="my-3 mb-0 md-md-3 bg-grey-darken-3 pa-3 px-lg-5 text-subtitle-1 d-flex align-center flex-wrap donation_container">
  ...
  <div class="text-white mr-3">Help us donating!</div>
  <a ... class="text-white d-flex mr-4 align-center justify-content-left donation_logo" ...>
  ...
  <v-alert class="mt-3 mt-md-4 mb-0 mb-md-3 bg-blue-darken-4" type="info" density="compact">
    {{ t('disclaimer') }}
  </v-alert>
  ```
  (Also change `<client-only>` -> `<ClientOnly>` and the two donation `v-img` `<template #sources>` blocks stay valid in V3. Remove the empty `#item.thumb` slots only if you want; keeping them is harmless.)

- [ ] Step 11: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/set/[set].vue` (watch for `any`-typed data-table item props and the `route.params.set` cast).

- [ ] Step 12: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/set/ash_prime_set` (a two-part set so the "save" alert shows). Expect: table renders both aggregate + per-part rows, autocomplete lists sets, Search navigates to `/set/<url_name>`, restore button returns to `/set`, Drops links resolve, spinner hides, zero console errors, and the top scrollbar syncs with the table horizontal scroll on desktop. Screenshot-diff vs old app `/set/ash_prime_set` (close).

- [ ] Step 13: Commit: `git add app-next/app/pages/set/[set].vue && git commit -m "feat(migration): port set/[set].vue to Nuxt4/Vue3/Vuetify3"`

---


## Phase P8 — Map page


---

### Task P8.1: Port LocationPopup.vue (geolocation + Leaflet map) to Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/components/LocationPopup.vue`
- Delete/superseded: `app/components/LocationPopup.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (nuxt.config.ts, `vuetify-nuxt-module`, `@nuxtjs/i18n` v9), P3 (app shell). This component is NOT imported by any current page (only `translations.ts` holds its i18n keys), so verify with a throwaway harness page. Requires NEW deps + a client-only global:
- `cd app-next && npm i leaflet @vue-leaflet/vue-leaflet && npm i -D @types/leaflet` (replaces `vue2-leaflet`).
- The `maptiler` geocoding global (`new maptiler.Geocoder(...)`) and `startLoading/stopLoading` were app-wide globals in the old app; here `startLoading/stopLoading` are replaced by Nuxt's `useLoadingIndicator()`, and `maptiler` is still referenced as a `window` global (must be injected by a client plugin/script exactly as before — out of scope for this task, keep the reference).

**Steps:**

- [ ] Step 1: Convert the whole `<script>` from Options API to `<script setup lang="ts">`, with Vuetify-3 template fixes on the `v-tooltip` activator, `v-toolbar`, `v-dialog`, and Leaflet components.

BEFORE (template, lines 3-26):
```html
<v-tooltip top>
  <template #activator="{ on, attrs }">
    <v-btn
      color="primary"
      v-bind="attrs"
      :loading="loadingDistances"
      v-on="on"
      @click="geoLocation"
    >
      <v-icon class="mr-1">mdi-map-marker</v-icon>
      <span>{{ $t('loadDistances') }}</span>
    </v-btn>
  </template>
  <span>{{ $t('locationTooltip') }}</span>
</v-tooltip>
<v-dialog v-model="dialog" persistent fullscreen width="700px" hide-overlay>
  <v-card>
    <v-toolbar dark color="primary">
      <v-toolbar-title>{{ $t('confirmarUbicacion') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon dark @click="dialog = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
```

AFTER:
```html
<v-tooltip location="top">
  <template #activator="{ props }">
    <v-btn
      color="primary"
      v-bind="props"
      :loading="loadingDistances"
      @click="geoLocation"
    >
      <v-icon class="mr-1">mdi-map-marker</v-icon>
      <span>{{ t('loadDistances') }}</span>
    </v-btn>
  </template>
  <span>{{ t('locationTooltip') }}</span>
</v-tooltip>
<v-dialog v-model="dialog" persistent fullscreen width="700px" :scrim="false">
  <v-card>
    <v-toolbar color="primary">
      <v-toolbar-title>{{ t('confirmarUbicacion') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="dialog = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
```

- [ ] Step 2: Fix the Leaflet block + map ref + remaining `$t`. BEFORE (template, lines 27-83):
```html
<v-card-text v-if="latitude">
  <div class="adress_lookup mt-3 d-flex">
    <input
      id="search"
      ref="search"
      v-model="search"
      :placeholder="$t('direccion')"
      type="text"
      @keyup.enter="onEnter(search)"
    />
    <v-btn
      class="adress_lookup_btn"
      color="primary"
      @click="onEnter(search)"
    >
      Search
    </v-btn>
  </div>
  <div class="location_map">
    <client-only>
      <l-map
        ref="map"
        :zoom="13"
        :center="[latitude, longitude]"
        @click="changeMarker"
      >
        <l-tile-layer
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        ></l-tile-layer>
        <l-circle
          v-if="radius"
          :lat-lng="[latitude, longitude]"
          :radius="radius * 1000"
        ></l-circle>
        <l-marker :lat-lng="[latitude, longitude]"></l-marker>
      </l-map>
    </client-only>
  </div>
  <v-text-field
    v-model="radius"
    type="number"
    class="mt-2 search_range"
    :label="$t('search_radius')"
    clearable
    hide-details
  ></v-text-field>
</v-card-text>
<v-card-actions>
  <v-spacer></v-spacer>
  <v-btn color="primary" @click="reset">Reset</v-btn>
  <v-btn color="red" @click="dialog = false">{{ $t('cerrar') }}</v-btn>
  <v-btn color="green darken-3" @click="confirmGeo">{{
    $t('confirmar')
  }}</v-btn>
</v-card-actions>
```

AFTER (`ref="search"` -> `ref="searchEl"`; `ref="map"` stays as a script ref; `$t`->`t`; `green darken-3`->`green-darken-3`; `client-only`->`ClientOnly`; `l-map @click` still forwards the Leaflet event, keep it):
```html
<v-card-text v-if="latitude">
  <div class="adress_lookup mt-3 d-flex">
    <input
      id="search"
      ref="searchEl"
      v-model="search"
      :placeholder="t('direccion')"
      type="text"
      @keyup.enter="onEnter(search)"
    />
    <v-btn
      class="adress_lookup_btn"
      color="primary"
      @click="onEnter(search)"
    >
      Search
    </v-btn>
  </div>
  <div class="location_map">
    <ClientOnly>
      <l-map
        ref="map"
        :zoom="13"
        :center="[latitude, longitude]"
        @click="changeMarker"
      >
        <l-tile-layer
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
        ></l-tile-layer>
        <l-circle
          v-if="radius"
          :lat-lng="[latitude, longitude]"
          :radius="Number(radius) * 1000"
        ></l-circle>
        <l-marker :lat-lng="[latitude, longitude]"></l-marker>
      </l-map>
    </ClientOnly>
  </div>
  <v-text-field
    v-model="radius"
    type="number"
    class="mt-2 search_range"
    :label="t('search_radius')"
    clearable
    hide-details
  ></v-text-field>
</v-card-text>
<v-card-actions>
  <v-spacer></v-spacer>
  <v-btn color="primary" @click="reset">Reset</v-btn>
  <v-btn color="red" @click="dialog = false">{{ t('cerrar') }}</v-btn>
  <v-btn color="green-darken-3" @click="confirmGeo">{{
    t('confirmar')
  }}</v-btn>
</v-card-actions>
```

- [ ] Step 3: Replace the entire `<script>` (BEFORE = old Options API lines 87-234). AFTER = `<script setup lang="ts">`:
```html
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import L from 'leaflet'
import { LMap, LTileLayer, LCircle, LMarker } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'

const { t, locale } = useI18n()
const loading = useLoadingIndicator() // Nuxt built-in; replaces global startLoading/stopLoading

const emit = defineEmits<{
  geoLocationSuccess: [
    distances: any,
    latitude: number,
    longitude: number,
    distanceData: any,
    radius: number,
  ]
}>()

const radius = ref<string | number>('')
const loadingDistances = ref(false)
const dialog = ref(false)
const latitude = ref(0)
const longitude = ref(0)
const search = ref('')
const apiKey = 'XFXIuNUKjvNkruE6DSkR'

// template refs
const map = ref<any>(null)          // @vue-leaflet LMap instance (exposes .leafletObject)
const searchEl = ref<HTMLInputElement | null>(null)

watch(dialog, (val) => {
  if (val) setMap()
})

async function onEnter(value: string) {
  loading.start()
  const data = await $fetch<any[]>('https://cambio.shellix.cc/geocoding', {
    method: 'POST',
    body: { address: value },
  }).catch((e) => {
    console.log(e)
    return null
  })
  if (data && data.length) {
    latitude.value = parseFloat(data[0].lat)
    longitude.value = parseFloat(data[0].lon)
    loading.finish()
    return true
  }
  loading.finish()
  return false
}

function searchAddress() {
  // `maptiler` is a client-side global injected by a plugin/script (unchanged from old app)
  const geocoder = new (window as any).maptiler.Geocoder({
    input: 'search',
    key: apiKey,
  })
  geocoder.setLanguage(locale.value)
  geocoder.setProximity([longitude.value, latitude.value])
  geocoder.on('select', async (item: any) => {
    nextTick(() => {
      if (searchEl.value) searchEl.value.value = search.value
      latitude.value = item.center[1]
      longitude.value = item.center[0]
    })
  })
}

function setMap() {
  if (!map.value || !map.value.leafletObject) return setTimeout(setMap, 1000)
  L.tileLayer(
    `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}`,
    {
      tileSize: 512,
      zoomOffset: -1,
      minZoom: 1,
      attribution:
        '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>, ' +
        '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
      crossOrigin: true,
    }
  ).addTo(map.value.leafletObject)
  searchAddress()
}

function changeMarker(e: any) {
  latitude.value = e.latlng.lat
  longitude.value = e.latlng.lng
  reverseGeo()
}

async function reverseGeo() {
  const url = `https://cambio.shellix.cc/position_stack?query=${latitude.value},${longitude.value}&limit=1`
  const res = await $fetch<any>(url).catch(() => null)
  if (res) {
    const data = res.data
    if (data.length) {
      search.value = data[0].label
    }
  }
}

async function geoLocationSuccess(info: GeolocationPosition) {
  latitude.value = info.coords.latitude
  longitude.value = info.coords.longitude
  dialog.value = true
  loadingDistances.value = false
  await reverseGeo()
  setMap()
}

async function confirmGeo() {
  const distances = await $fetch<any>(
    `https://cambio.shellix.cc/distances?latitude=${latitude.value}&longitude=${longitude.value}`
  )
  const distanceData = distances.distanceData
  emit(
    'geoLocationSuccess',
    distances,
    latitude.value,
    longitude.value,
    distanceData,
    Number(radius.value) * 1000
  )
  dialog.value = false
}

function geoLocationError() {
  loadingDistances.value = false
  latitude.value = -34.88073035118606
  longitude.value = -56.167630709298805
  search.value =
    '2532 Boulevard General Jose Gervasio Artigas, Montevideo, Uruguay'
  setMap()
}

function reset() {
  search.value = ''
  navigator.geolocation.getCurrentPosition(geoLocationSuccess, geoLocationError)
}

function geoLocation() {
  if (!latitude.value) {
    loadingDistances.value = true
    navigator.geolocation.getCurrentPosition(
      geoLocationSuccess,
      geoLocationError
    )
  } else {
    dialog.value = true
    loadingDistances.value = false
    setMap()
  }
  dialog.value = true
}
</script>
```

Key equivalences to double-check while porting:
- `this.$axios.post(url,{address}).then(r=>r.data)` -> `$fetch(url,{method:'POST',body:{address}})` returns the **body directly** (no `.data` wrapper). Same for the two GET calls: old `.then(r=>r.data)` maps to the `$fetch` return value; then `res.data` / `distances.distanceData` still index into that body object, unchanged.
- `this.$L` -> module `import L from 'leaflet'`.
- `this.$refs.map.mapObject` (vue2-leaflet) -> `map.value.leafletObject` (@vue-leaflet).
- `this.$i18n.locale` -> `locale.value`.
- global `startLoading()/stopLoading()` -> `loading.start()/loading.finish()`.

- [ ] Step 4: Keep the `<style>` block (lines 236-263) byte-for-byte — it is plain CSS with no Vuetify-2 selectors that break. Copy it verbatim into the new file.

- [ ] Step 5: Leaflet default-marker icon fix (bundlers strip the icon URLs; `l-marker` renders a broken image without this). Confirm it is not already handled globally in P0; if not, add near the top of `<script setup>` after the leaflet import:
```ts
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
// @ts-expect-error _getIconUrl is internal
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })
```

- [ ] Step 6: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for this file (`@types/leaflet` must be installed).

- [ ] Step 7: Verify in browser. Because no page currently mounts this component, create a throwaway harness `app-next/app/pages/_locpopup-test.vue` with `<LocationPopup @geoLocationSuccess="(...a)=>console.log(a)" />`. Start backend (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`, load `/_locpopup-test`. Expect: the "Load distances" button + tooltip render; clicking prompts for geolocation and opens the fullscreen dialog with a Leaflet map (deny permission -> falls back to Montevideo coords, map still renders); the radius circle appears when a radius is typed; zero console errors. Screenshot-diff the button + open dialog vs the old app's usage (close match acceptable). Delete `_locpopup-test.vue` before committing.

- [ ] Step 8: Commit: `git add app-next/app/components/LocationPopup.vue app-next/package.json app-next/package-lock.json && git commit -m "feat(app-next): port LocationPopup to Vue 3 / Vuetify 3 + @vue-leaflet"`

---

### Task P8.2: Migrate Star Chart page to Vue 3 / script setup

**Files:**
- Create: `app-next/app/pages/star-chart.vue`
- Delete/superseded: `app/pages/star-chart.vue` (reference only; old app stays until cutover)

**Depends on:** P0-P3 infra (runtime `public.apiURL`, `vuetify-nuxt-module`, `@pinia/nuxt`); `app-next/app/stores/items.ts` exporting `useItemsStore` with an `allItems` getter; `app-next/app/components/DropLocationsDialog.vue` (component-group task).

**Notes:** This page loads its data **client-side in `mounted`** (in-page loading orbit + `#spinner-wrapper` teardown), NOT via `asyncData`. Preserve that: port `load()` into `onMounted` and keep the try/catch->`planets=[]` intent. Do NOT convert to `useAsyncData` (that changes the loading UX). The `<style scoped>` block (lines 490-793) is plain CSS — copy it VERBATIM, no changes. The `<template>` is almost entirely bespoke SVG + native elements; only the two Vuetify components near the bottom (`v-autocomplete`, `v-alert`) and the `ref="panel"` binding change. `v-icon` usages (lines 46, 128, 152) are unchanged in V3.

**Steps:**

- [ ] Step 1: Copy the ENTIRE current file to `app-next/app/pages/star-chart.vue`, then apply the edits below. Keep `<template>`, the module-scope constants/helpers (`CHAIN`, `SATELLITES`, `CHAIN_EDGES`, `SPECIAL_EDGES`, `VB`, `CX`, `polar`, `makeStars`, `PLACEHOLDER_IMG`, lines 213-260) and the whole `<style scoped>` block as-is unless a step says otherwise.

- [ ] Step 2: Fix the `ref="panel"` binding is unchanged in template, but the detail panel `<aside>` keeps `ref="panel"` (line 126) — a string ref still binds to a `ref()` named `panel` in script setup. No template edit here; just noted so Step 8 wires it.

- [ ] Step 3: Port the `v-autocomplete` (lines 187-195). BEFORE:
```html
      <v-autocomplete
        v-model="findItem"
        :items="itemNames"
        dark dense hide-details clearable
        prepend-inner-icon="mdi-magnify"
        label="Search any prime part, relic or item"
        class="sc-find__input"
        @change="onFind"
      ></v-autocomplete>
```
AFTER (drop `dark`; `dense` -> `density="compact"`; `@change` -> `@update:model-value`):
```html
      <v-autocomplete
        v-model="findItem"
        :items="itemNames"
        density="compact"
        hide-details
        clearable
        prepend-inner-icon="mdi-magnify"
        label="Search any prime part, relic or item"
        class="sc-find__input"
        @update:model-value="onFind"
      ></v-autocomplete>
```

- [ ] Step 4: Port the `v-alert` (lines 200-205). BEFORE:
```html
    <v-alert v-if="!loading && planets.length" class="sc-disclaimer blue darken-4" type="info" dense>
```
AFTER (`dense` -> `density="compact"`; V2 color helper `blue darken-4` -> V3 `bg-blue-darken-4`):
```html
    <v-alert v-if="!loading && planets.length" class="sc-disclaimer bg-blue-darken-4" type="info" density="compact">
```

- [ ] Step 5: Replace the script open + imports. BEFORE (lines 209-211):
```html
<script lang="ts">
import { mapGetters } from 'vuex'
import DropLocationsDialog from '../components/DropLocationsDialog.vue'
```
AFTER (switch to `setup`; drop Vuex; component auto-imported via Nuxt so drop the manual import; the module-scope const block that follows on lines 213-260 stays exactly where it is, before `export default`):
```html
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useDisplay } from 'vuetify'
```
(Keep everything from line 213 `// --- Faithful Star Chart topology ---` through line 260 `PLACEHOLDER_IMG = ...` unchanged — it lives at module scope above the old `export default`.)

- [ ] Step 6: Delete the `export default {` header + `data()` (lines 262-277) and replace with reactive state + store/display/config wiring. BEFORE:
```js
export default {
  name: 'StarChartPage',
  components: { DropLocationsDialog },
  data() {
    return {
      VB,
      loading: true,
      planets: [] as any[],
      selected: '' as string,
      openNode: '' as string,
      dropsDialog: false,
      dropsItem: '',
      findItem: '',
      starfield: makeStars(90),
    }
  },
```
AFTER (note `VB` and `starfield` are constants — expose them directly; the template references `VB` and `starfield`, both in scope in `<script setup>`):
```js
const items = useItemsStore()
const { mobile } = useDisplay()
const config = useRuntimeConfig()
const base = config.public.apiURL

const starfield = makeStars(90)

const loading = ref(true)
const planets = ref<any[]>([])
const selected = ref('')
const openNode = ref('')
const dropsDialog = ref(false)
const dropsItem = ref('')
const findItem = ref('')
const panel = ref<HTMLElement | null>(null)
```

- [ ] Step 7: Replace the `head()` hook (lines 278-290) with `useHead` (port title + description meta verbatim). BEFORE:
```js
  head() {
    return {
      title: 'Star Chart — what to farm in Warframe, ranked by platinum',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'An interactive Warframe Star Chart that ranks every planet and mission by expected platinum per run — drop chances joined with live Warframe Market prices.',
        },
      ],
    }
  },
```
AFTER:
```js
useHead({
  title: 'Star Chart — what to farm in Warframe, ranked by platinum',
  meta: [
    {
      hid: 'description',
      name: 'description',
      content:
        'An interactive Warframe Star Chart that ranks every planet and mission by expected platinum per run — drop chances joined with live Warframe Market prices.',
    },
  ],
})
```

- [ ] Step 8: Convert every entry of the `computed: { ... }` block (lines 291-384) to standalone `const … = computed(...)`, dropping `this.`. The `allItems` getter comes from the store. BEFORE (head of block):
```js
  computed: {
    ...mapGetters({ allItems: 'all_items' }),
    planetsByName(): Record<string, any> {
      const map: Record<string, any> = {}
      for (const p of this.planets) map[p.planet] = p
      return map
    },
    maxValue(): number {
      return this.planets.reduce((m, p) => Math.max(m, p.value || 0), 0) || 1
    },
    richest(): any {
      return this.planets.slice().sort((a, b) => b.value - a.value)[0] || null
    },
    stats(): any {
      let topNode: any = null
      let nodes = 0
      for (const p of this.planets) {
        nodes += p.nodeCount
        if (p.bestNode && (!topNode || p.bestNode.value > topNode.value)) {
          topNode = { ...p.bestNode, planet: p.planet }
        }
      }
      return {
        planets: this.planets.length,
        nodes,
        topValue: this.richest ? this.richest.value : 0,
        topNode,
      }
    },
    selectedData(): any {
      return this.selected ? this.planetsByName[this.selected] : null
    },
    itemNames(): string[] {
      return (this.allItems as any[]).map((i) => i && i.item_name).filter(Boolean)
    },
```
AFTER (`this.planets` -> `planets.value`, computeds referenced with `.value`, store getter via `items.allItems`):
```js
const allItems = computed(() => items.allItems)

const planetsByName = computed<Record<string, any>>(() => {
  const map: Record<string, any> = {}
  for (const p of planets.value) map[p.planet] = p
  return map
})
const maxValue = computed(() =>
  planets.value.reduce((m, p) => Math.max(m, p.value || 0), 0) || 1,
)
const richest = computed(
  () => planets.value.slice().sort((a, b) => b.value - a.value)[0] || null,
)
const stats = computed(() => {
  let topNode: any = null
  let nodes = 0
  for (const p of planets.value) {
    nodes += p.nodeCount
    if (p.bestNode && (!topNode || p.bestNode.value > topNode.value)) {
      topNode = { ...p.bestNode, planet: p.planet }
    }
  }
  return {
    planets: planets.value.length,
    nodes,
    topValue: richest.value ? richest.value.value : 0,
    topNode,
  }
})
const selectedData = computed(() =>
  selected.value ? planetsByName.value[selected.value] : null,
)
const itemNames = computed<string[]>(() =>
  (allItems.value as any[]).map((i) => i && i.item_name).filter(Boolean),
)
```

- [ ] Step 9: Convert the `scene` computed (lines 326-383). It calls the `discColor` method — in script setup that is a plain function; define `discColor` (Step 11) so it exists at module-init, or just reference it (function declarations hoist). BEFORE (key `this.` sites):
```js
    scene(): any {
      const chainPolar: Record<string, { r: number; deg: number }> = {}
      CHAIN.forEach((name, i) => {
        chainPolar[name] = { r: R0 + i * RSTEP, deg: A0 + i * STEP }
      })
      const maxR = R0 + (CHAIN.length - 1) * RSTEP
      ...
      const specials = this.planets.filter((p) => !chainPolar[p.planet] && !SATELLITES[p.planet])
      const nodes = this.planets.map((p) => {
        ...
        const t = Math.min(1, (p.value || 0) / this.maxValue)
        ...
          color: this.discColor(t, type),
      ...
```
AFTER: wrap in `const scene = computed(() => { … })`, and replace `this.planets` -> `planets.value`, `this.maxValue` -> `maxValue.value`, `this.discColor(...)` -> `discColor(...)`. Body logic (chainPolar / posOf / specials / nodes / byName / edges / return) is otherwise unchanged. Close the old `computed: {` object — the trailing `},` on line 384 that ended `computed` is removed.

- [ ] Step 10: Convert `mounted()` (lines 385-388) to `onMounted`. BEFORE:
```js
  mounted() {
    this.load()
    this.finishLoading()
  },
```
AFTER:
```js
onMounted(() => {
  load()
  finishLoading()
})
```

- [ ] Step 11: Convert every entry of the `methods: { ... }` block (lines 389-486) into standalone `function`s / `async function`s, dropping `this.`, replacing `this.$axios`/`this.$config`, `this.$vuetify.breakpoint.mobile`, `this.$nextTick`, `this.$refs.panel`, and refs with `.value`. BEFORE (the sites that actually change):
```js
    async load() {
      this.loading = true
      try {
        const res = await this.$axios.get(`${this.$config.apiURL}/drops/map`)
        this.planets = (res.data && res.data.planets) || []
      } catch (e) {
        this.planets = []
      } finally {
        this.loading = false
      }
    },
    selectPlanet(name: string) {
      this.selected = name
      this.openNode = ''
      const first = this.planetsByName[name]
      if (first && first.nodes && first.nodes.length) this.openNode = first.nodes[0].location
      if (this.$vuetify.breakpoint.mobile) {
        this.$nextTick(() => {
          const el = this.$refs.panel as HTMLElement
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
    },
```
AFTER (`$axios.get` -> `$fetch` returns the body directly, so read `.planets` off the result; `$config.apiURL` -> `base`; `breakpoint.mobile` -> `mobile.value`; `$refs.panel` -> `panel.value`):
```js
async function load() {
  loading.value = true
  try {
    const res: any = await $fetch(`${base}/drops/map`)
    planets.value = (res && res.planets) || []
  } catch (e) {
    planets.value = []
  } finally {
    loading.value = false
  }
}
function selectPlanet(name: string) {
  selected.value = name
  openNode.value = ''
  const first = planetsByName.value[name]
  if (first && first.nodes && first.nodes.length) openNode.value = first.nodes[0].location
  if (mobile.value) {
    nextTick(() => {
      const el = panel.value
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }
}
```

- [ ] Step 12: Convert the remaining methods (lines 413-485) the same mechanical way — they only touch refs/computeds and other methods, no Vuetify/Nuxt globals. Replace `this.scene` -> `scene.value`, `this.selected` -> `selected.value`, `this.maxValue` -> `maxValue.value`, `this.openNode` -> `openNode.value`, `this.dropsItem`/`this.dropsDialog` -> `.value`, and call sites like `this.selectPlanet(next)` -> `selectPlanet(next)`, `this.openDrops(name)` -> `openDrops(name)`, `this.finishLoading()` -> `finishLoading()`. Representative BEFORE (`onSvgKey`, `openDrops`, `onFind`, `finishLoading`):
```js
    onSvgKey(e: KeyboardEvent) {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
      if (!keys.includes(e.key)) return
      const order = this.scene.nodes.map((n: any) => n.planet)
      if (!order.length) return
      e.preventDefault()
      const cur = order.indexOf(this.selected)
      const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
      const next = order[(cur + dir + order.length) % order.length] || order[0]
      this.selectPlanet(next)
    },
    openDrops(name: string) {
      this.dropsItem = name
      this.dropsDialog = true
    },
    onFind(name: string) {
      if (name) this.openDrops(name)
    },
    finishLoading() {
      this.$nextTick(() => {
        const el = document.getElementById('spinner-wrapper')
        if (el) el.style.display = 'none'
        else this.finishLoading()
      })
    },
```
AFTER:
```js
function onPlanetFocus(name: string) {
  selected.value = name
}
function onSvgKey(e: KeyboardEvent) {
  const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']
  if (!keys.includes(e.key)) return
  const order = scene.value.nodes.map((n: any) => n.planet)
  if (!order.length) return
  e.preventDefault()
  const cur = order.indexOf(selected.value)
  const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1
  const next = order[(cur + dir + order.length) % order.length] || order[0]
  selectPlanet(next)
}
function toggleNode(location: string) {
  openNode.value = openNode.value === location ? '' : location
}
function sortedRewards(rewards: any[]): any[] {
  return rewards.slice().sort((a, b) => (b.chance / 100) * b.price - (a.chance / 100) * a.price || b.chance - a.chance)
}
function openDrops(name: string) {
  dropsItem.value = name
  dropsDialog.value = true
}
function onFind(name: string) {
  if (name) openDrops(name)
}
function discColor(t: number, type: string): string {
  if (type === 'special') return t >= 0.4 ? '#35d6d0' : '#2b8f8b'
  if (t >= 0.66) return '#e7cf95'
  if (t >= 0.33) return '#c8a85c'
  if (t >= 0.1) return '#9a8f6a'
  return '#5a6178'
}
function valueClass(v: number): string {
  const t = v / maxValue.value
  if (t >= 0.5) return 'is-gold'
  if (t >= 0.2) return 'is-mid'
  return 'is-low'
}
function rarityColor(rarity: string): string {
  const r = (rarity || '').toLowerCase()
  if (r === 'legendary') return '#35d6d0'
  if (r === 'rare') return '#e7cf95'
  if (r === 'uncommon') return '#b6c0cc'
  return '#c08457'
}
function thumbUrl(thumb: string): string {
  if (!thumb) return PLACEHOLDER_IMG
  return 'https://warframe.market/static/assets/' + thumb
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = PLACEHOLDER_IMG
}
function fmtPlat(n: number): string {
  const v = Number(n) || 0
  return v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)
}
function fmtChance(n: number): string {
  const v = Number(n) || 0
  return v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, '')
}
function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}
```
Then delete the trailing `},\n}` that closed `methods` and `export default` (old lines 486-487). `useItemsStore`, `useRuntimeConfig`, `useHead`, and `$fetch` are Nuxt auto-imports — no import statements needed for them.

- [ ] Step 13: Sanity-check leftovers: grep the new file for `this.`, `mapGetters`, `$axios`, `$config`, `$vuetify`, `$refs`, `export default`, `computed: {`, `methods: {` — all must be gone. Confirm `DropLocationsDialog` is used in-template (auto-imported) and `v-model="dropsDialog"` / `:item-name="dropsItem"` still bind (V3 `v-model` on a custom component is unchanged if the dialog was authored with `modelValue`/`update:modelValue` in its own migration).

- [ ] Step 14: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/star-chart.vue` (watch for `any` fallbacks on `$fetch` result and `scene`/`stats` shapes — they are intentionally `any`).

- [ ] Step 15: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/star-chart`. Expect: the SVG spiral renders with planets glowing, clicking a planet opens the detail panel + first node, node expand shows rewards with thumbs, the `v-autocomplete` reverse-lookup opens `DropLocationsDialog`, the `#spinner-wrapper` disappears, zero console errors, data loads from `/drops/map`. On a narrow viewport confirm selecting a planet scrolls the panel into view (mobile branch). Screenshot-diff vs old app `/star-chart` (close).

- [ ] Step 16: Commit: `git add app-next/app/pages/star-chart.vue && git commit -m "feat(app-next): migrate star-chart page to Vue 3 script setup"`

---


## Phase P9 — Stateful pages


---

### Task P9.1: Migrate portfolio.vue to script setup + Pinia + Vuetify 3

**Files:**
- Create: app-next/app/pages/portfolio.vue
- Create: app-next/app/services/portfolio.ts (verbatim copy of app/services/portfolio.ts — it is framework-agnostic localStorage code with no Vue/Vuex imports)
- Delete/superseded: app/pages/portfolio.vue (reference only; old app stays until cutover)

**Depends on:** P0-P3 infra (`useRuntimeConfig().public.apiURL`, vuetify-nuxt-module, ssr:true); P4 Pinia store `app-next/app/stores/items.ts` exposing `useItemsStore().allItems`.

**Steps:**

- [ ] Step 1: Copy the service. `cp app/services/portfolio.ts app-next/app/services/portfolio.ts` (no code change — it imports nothing from Vue/Vuex; only reads `localStorage`, `Notification`, and takes the items array + analytics map as plain args).

- [ ] Step 2: Replace the `<script lang="ts">` Options API block with `<script setup lang="ts">`. Kill `import Vue from 'vue'` and `mapGetters`, wire the Pinia store + `useAsyncData`.

  BEFORE:
  ```ts
  <script lang="ts">
  import Vue from 'vue';
  import { mapGetters } from 'vuex';
  import {
    checkAlerts,
    getWatchlist,
    removeFromWatchlist,
    requestNotificationPermission,
    toggleWatch,
    updateEntry,
    WatchlistEntry,
  } from '../services/portfolio';

  export default Vue.extend({
    name: 'PortfolioPage',
    async asyncData({ $axios, $config }: any) {
      // Long-history analytics (atl / pctFromAtl) power the all-time-low alert -
      // a signal warframe.market can't give (its chart caps at 90 days).
      try {
        const data = await $axios.get(`${$config.apiURL}/market_analytics`).then((res: any) => res.data);
        return { analytics: (data && data.items) || [] };
      } catch (e) {
        return { analytics: [] };
      }
    },
    data() {
      return {
        watchlist: [] as WatchlistEntry[],
        analytics: [] as any[],
        itemToAdd: '',
        notificationPermission: 'default' as string,
        alertInterval: null as ReturnType<typeof setInterval> | null,
      };
    },
    computed: {
      ...mapGetters({ allItems: 'all_items' }),
      itemsByName(): Record<string, any> {
        const map: Record<string, any> = {};
        (this.allItems as any[]).forEach((i) => {
          map[i.item_name] = i;
        });
        return map;
      },
      itemsByUrlName(): Record<string, any> {
        const map: Record<string, any> = {};
        (this.allItems as any[]).forEach((i) => {
          map[i.url_name] = i;
        });
        return map;
      },
      analyticsByUrl(): Record<string, any> {
        const map: Record<string, any> = {};
        (this.analytics as any[]).forEach((a) => {
          map[a.url_name] = { atl: a.atl, pctFromAtl: a.pctFromAtl };
        });
        return map;
      },
      enrichedWatchlist() {
        return this.watchlist.map((entry) => {
          const live = this.itemsByUrlName[entry.url_name];
          const currentSell = live?.market?.sell ?? null;
          const a = this.analyticsByUrl[entry.url_name];
          return {
            ...entry,
            currentSell,
            value: currentSell != null ? currentSell * (entry.ownedQty || 0) : null,
            pctFromAtl: a && typeof a.pctFromAtl === 'number' ? a.pctFromAtl : null,
          };
        });
      },
      totalValue(): number {
        return this.enrichedWatchlist.reduce((sum, e) => sum + (e.value || 0), 0);
      },
    },
    mounted() {
      this.refresh();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        this.notificationPermission = Notification.permission;
      } else {
        this.notificationPermission = 'unsupported';
      }
      if (this.notificationPermission === 'granted') {
        this.runAlertCheck();
        this.alertInterval = setInterval(() => this.runAlertCheck(), 60000);
      }
    },
    beforeDestroy() {
      if (this.alertInterval) clearInterval(this.alertInterval);
    },
    methods: {
      refresh() {
        this.watchlist = getWatchlist();
      },
      addItem() {
        const item = this.itemsByName[this.itemToAdd as any];
        if (!item) return;
        toggleWatch({ url_name: item.url_name, item_name: item.item_name });
        this.itemToAdd = '';
        this.refresh();
      },
      removeItem(urlName: string) {
        removeFromWatchlist(urlName);
        this.refresh();
      },
      setField(urlName: string, field: keyof WatchlistEntry, value: any) {
        updateEntry(urlName, { [field]: value } as any);
        this.refresh();
      },
      async enableAlerts() {
        const result = await requestNotificationPermission();
        this.notificationPermission = result;
        if (result === 'granted') {
          this.runAlertCheck();
          if (!this.alertInterval) {
            this.alertInterval = setInterval(() => this.runAlertCheck(), 60000);
          }
        }
      },
      runAlertCheck() {
        checkAlerts(this.allItems as any[], this.analyticsByUrl);
      },
    },
  });
  </script>
  ```

  AFTER:
  ```ts
  <script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import {
    checkAlerts,
    getWatchlist,
    removeFromWatchlist,
    requestNotificationPermission,
    toggleWatch,
    updateEntry,
    type WatchlistEntry,
  } from '~/services/portfolio';
  import { useItemsStore } from '~/stores/items';

  const config = useRuntimeConfig();
  const base = config.public.apiURL;

  // Long-history analytics (atl / pctFromAtl) power the all-time-low alert -
  // a signal warframe.market can't give (its chart caps at 90 days).
  const { data, error } = await useAsyncData('portfolio-market-analytics', () =>
    $fetch<any>(`${base}/market_analytics`),
  );
  const loadError = computed(() => !!error.value);
  const analytics = computed<any[]>(() => (data.value && data.value.items) || []);

  const itemsStore = useItemsStore();
  const allItems = computed<any[]>(() => itemsStore.allItems as any[]);

  const watchlist = ref<WatchlistEntry[]>([]);
  const itemToAdd = ref('');
  const notificationPermission = ref<string>('default');
  let alertInterval: ReturnType<typeof setInterval> | null = null;

  const itemsByName = computed<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    allItems.value.forEach((i) => {
      map[i.item_name] = i;
    });
    return map;
  });
  const itemsByUrlName = computed<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    allItems.value.forEach((i) => {
      map[i.url_name] = i;
    });
    return map;
  });
  const analyticsByUrl = computed<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    analytics.value.forEach((a) => {
      map[a.url_name] = { atl: a.atl, pctFromAtl: a.pctFromAtl };
    });
    return map;
  });
  const enrichedWatchlist = computed(() =>
    watchlist.value.map((entry) => {
      const live = itemsByUrlName.value[entry.url_name];
      const currentSell = live?.market?.sell ?? null;
      const a = analyticsByUrl.value[entry.url_name];
      return {
        ...entry,
        currentSell,
        value: currentSell != null ? currentSell * (entry.ownedQty || 0) : null,
        pctFromAtl: a && typeof a.pctFromAtl === 'number' ? a.pctFromAtl : null,
      };
    }),
  );
  const totalValue = computed<number>(() =>
    enrichedWatchlist.value.reduce((sum, e) => sum + (e.value || 0), 0),
  );

  function refresh() {
    watchlist.value = getWatchlist();
  }
  function addItem() {
    const item = itemsByName.value[itemToAdd.value];
    if (!item) return;
    toggleWatch({ url_name: item.url_name, item_name: item.item_name });
    itemToAdd.value = '';
    refresh();
  }
  function removeItem(urlName: string) {
    removeFromWatchlist(urlName);
    refresh();
  }
  function setField(urlName: string, field: keyof WatchlistEntry, value: any) {
    updateEntry(urlName, { [field]: value } as any);
    refresh();
  }
  function runAlertCheck() {
    checkAlerts(allItems.value, analyticsByUrl.value);
  }
  async function enableAlerts() {
    const result = await requestNotificationPermission();
    notificationPermission.value = result;
    if (result === 'granted') {
      runAlertCheck();
      if (!alertInterval) {
        alertInterval = setInterval(() => runAlertCheck(), 60000);
      }
    }
  }

  onMounted(() => {
    // repo convention: kill the global loading spinner or it spins forever
    document.getElementById('spinner-wrapper')?.style.setProperty('display', 'none');
    refresh();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      notificationPermission.value = Notification.permission;
    } else {
      notificationPermission.value = 'unsupported';
    }
    if (notificationPermission.value === 'granted') {
      runAlertCheck();
      // Re-check periodically while the tab stays open - no push infra, so
      // this only fires while the page is open.
      alertInterval = setInterval(() => runAlertCheck(), 60000);
    }
  });
  onBeforeUnmount(() => {
    if (alertInterval) clearInterval(alertInterval);
  });
  </script>
  ```
  Note: `loadError` is derived per convention; the old page silently defaulted analytics to `[]` on failure and rendered no error banner, so nothing in the template consumes `loadError` (keeping parity). `analytics` uses `data.value.items` exactly as the old `asyncData` did.

- [ ] Step 3: `v-card` / `v-alert` attribute props. Fix the outlined card and the dense/outlined alert.

  BEFORE:
  ```html
  <v-card class="pa-4 mb-4" outlined>
  ```
  ```html
  <v-alert v-if="notificationPermission === 'unsupported'" type="info" dense outlined>
  ```
  AFTER:
  ```html
  <v-card class="pa-4 mb-4" variant="outlined">
  ```
  ```html
  <v-alert v-if="notificationPermission === 'unsupported'" type="info" density="compact" variant="outlined">
  ```

- [ ] Step 4: `v-combobox` + the two add-row `v-btn`s + their `v-icon`s.

  BEFORE:
  ```html
  <v-combobox
    v-model="itemToAdd"
    label="Add an item to your portfolio"
    class="add-input"
    :items="allItems.map((el) => el.item_name)"
    hide-details
    dense
    outlined
  ></v-combobox>
  <v-btn color="primary" :disabled="!itemToAdd" @click="addItem">
    <v-icon left small>mdi-plus</v-icon> Add
  </v-btn>
  <v-btn
    v-if="notificationPermission !== 'granted'"
    color="secondary"
    outlined
    @click="enableAlerts"
  >
    <v-icon left small>mdi-bell-outline</v-icon>
    Enable price alerts
  </v-btn>
  <span v-else class="text-caption d-flex align-center">
    <v-icon small color="green" class="mr-1">mdi-bell-check</v-icon>
    Alerts enabled - checked whenever this page is open
  </span>
  ```
  AFTER:
  ```html
  <v-combobox
    v-model="itemToAdd"
    label="Add an item to your portfolio"
    class="add-input"
    :items="allItems.map((el) => el.item_name)"
    hide-details
    density="compact"
    variant="outlined"
  ></v-combobox>
  <v-btn color="primary" :disabled="!itemToAdd" @click="addItem">
    <v-icon size="small" class="mr-1">mdi-plus</v-icon> Add
  </v-btn>
  <v-btn
    v-if="notificationPermission !== 'granted'"
    color="secondary"
    variant="outlined"
    @click="enableAlerts"
  >
    <v-icon size="small" class="mr-1">mdi-bell-outline</v-icon>
    Enable price alerts
  </v-btn>
  <span v-else class="text-caption d-flex align-center">
    <v-icon size="small" color="green" class="mr-1">mdi-bell-check</v-icon>
    Alerts enabled - checked whenever this page is open
  </span>
  ```
  (`left` is removed in V3 — replaced by a `mr-1` utility to keep the icon-to-label gap; `small` -> `size="small"`.)

- [ ] Step 5: `v-simple-table` -> `v-table`, and swap `grey--text` -> `text-grey`.

  BEFORE:
  ```html
  <div v-if="!watchlist.length" class="text-body-2 grey--text">
    Your portfolio is empty. Search for an item above to start tracking it.
  </div>

  <v-simple-table v-else class="portfolio-table">
    <template #default>
      ...
    </template>
  </v-simple-table>
  ```
  AFTER:
  ```html
  <div v-if="!watchlist.length" class="text-body-2 text-grey">
    Your portfolio is empty. Search for an item above to start tracking it.
  </div>

  <v-table v-else class="portfolio-table">
    <template #default>
      ...
    </template>
  </v-table>
  ```

- [ ] Step 6: The `Owned Qty` / `Alert Below` / `Alert Above` `v-text-field`s. In Vuetify 3 `:value` is `:model-value`, `dense` is `density="compact"`, and `@change` now hands you the **native DOM event**, not the value — read `event.target.value`.

  BEFORE:
  ```html
  <v-text-field
    :value="entry.ownedQty"
    type="number"
    dense
    hide-details
    style="width: 80px"
    @change="(v) => setField(entry.url_name, 'ownedQty', Number(v) || 0)"
  ></v-text-field>
  ```
  ```html
  <v-text-field
    :value="entry.alertBelow"
    type="number"
    dense
    hide-details
    placeholder="none"
    style="width: 90px"
    @change="(v) => setField(entry.url_name, 'alertBelow', v === '' ? null : Number(v))"
  ></v-text-field>
  ```
  ```html
  <v-text-field
    :value="entry.alertAbove"
    type="number"
    dense
    hide-details
    placeholder="none"
    style="width: 90px"
    @change="(v) => setField(entry.url_name, 'alertAbove', v === '' ? null : Number(v))"
  ></v-text-field>
  ```
  AFTER:
  ```html
  <v-text-field
    :model-value="entry.ownedQty"
    type="number"
    density="compact"
    hide-details
    style="width: 80px"
    @change="(e) => setField(entry.url_name, 'ownedQty', Number((e.target as HTMLInputElement).value) || 0)"
  ></v-text-field>
  ```
  ```html
  <v-text-field
    :model-value="entry.alertBelow"
    type="number"
    density="compact"
    hide-details
    placeholder="none"
    style="width: 90px"
    @change="(e) => { const val = (e.target as HTMLInputElement).value; setField(entry.url_name, 'alertBelow', val === '' ? null : Number(val)); }"
  ></v-text-field>
  ```
  ```html
  <v-text-field
    :model-value="entry.alertAbove"
    type="number"
    density="compact"
    hide-details
    placeholder="none"
    style="width: 90px"
    @change="(e) => { const val = (e.target as HTMLInputElement).value; setField(entry.url_name, 'alertAbove', val === '' ? null : Number(val)); }"
  ></v-text-field>
  ```
  (Native `change` preserves the old on-blur/on-enter commit semantics rather than firing on every keystroke.)

- [ ] Step 7: The all-time-low `v-checkbox` + its caption class. `:input-value` -> `:model-value`; `dense` -> `density="compact"`; use `@update:model-value` which emits a boolean (V3 `@change` emits the native event). Swap `green--text` -> `text-green`, `grey--text` -> `text-grey`.

  BEFORE:
  ```html
  <div class="d-flex align-center">
    <v-checkbox
      :input-value="entry.alertAtl"
      dense
      hide-details
      class="ma-0 pa-0 atl-check"
      color="#4caf7d"
      @change="(v) => setField(entry.url_name, 'alertAtl', !!v)"
    ></v-checkbox>
    <span v-if="entry.pctFromAtl != null" class="text-caption" :class="entry.pctFromAtl <= 3 ? 'green--text' : 'grey--text'">
      {{ entry.pctFromAtl <= 3 ? 'at low!' : '+' + entry.pctFromAtl.toFixed(0) + '%' }}
    </span>
    <span v-else class="text-caption grey--text">—</span>
  </div>
  ```
  AFTER:
  ```html
  <div class="d-flex align-center">
    <v-checkbox
      :model-value="entry.alertAtl"
      density="compact"
      hide-details
      class="ma-0 pa-0 atl-check"
      color="#4caf7d"
      @update:model-value="(v) => setField(entry.url_name, 'alertAtl', !!v)"
    ></v-checkbox>
    <span v-if="entry.pctFromAtl != null" class="text-caption" :class="entry.pctFromAtl <= 3 ? 'text-green' : 'text-grey'">
      {{ entry.pctFromAtl <= 3 ? 'at low!' : '+' + entry.pctFromAtl.toFixed(0) + '%' }}
    </span>
    <span v-else class="text-caption text-grey">—</span>
  </div>
  ```

- [ ] Step 8: The remove-row `v-btn icon` + its icon. `icon` + `small` in V3: keep `icon` as a boolean, add `size="small"`, `variant="text"`; icon `small` -> `size="small"`. `nuxt-link` stays valid in Nuxt 3 (lowercase resolves), leave the `<nuxt-link :to="'/set/' + entry.url_name">` untouched.

  BEFORE:
  ```html
  <td>
    <v-btn icon small @click="removeItem(entry.url_name)">
      <v-icon small>mdi-close</v-icon>
    </v-btn>
  </td>
  ```
  AFTER:
  ```html
  <td>
    <v-btn icon variant="text" size="small" @click="removeItem(entry.url_name)">
      <v-icon size="small">mdi-close</v-icon>
    </v-btn>
  </td>
  ```

- [ ] Step 9: Leave `<style scoped>` unchanged — `.add-input`, `.portfolio-table th/td`, `.atl-check` are plain CSS with no Vuetify-2 selectors. The `gap-10` utility class on the add row is a project class; confirm it exists in the ported global CSS (it is used verbatim in the old app), otherwise keep it as-is.

- [ ] Step 10: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for portfolio.vue (watch for the `event.target` casts and the `WatchlistEntry` type-only import).

- [ ] Step 11: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/portfolio`. Expect: page renders with the add-item combobox populated from the items store, empty-state text shows when watchlist is empty; add an item -> row appears; edit Owned Qty / Alert Below / Alert Above (values commit on blur), toggle the all-time-low checkbox, remove an item; total-value footer updates; zero console errors; spinner gone. Click "Enable price alerts" -> browser permission prompt. Screenshot-diff `/portfolio` vs old app (close; accept V3 density/spacing shifts on the table and inputs).

- [ ] Step 12: Commit: `git add app-next/app/pages/portfolio.vue app-next/app/services/portfolio.ts && git commit -m \"feat(migrate): port portfolio page to Nuxt4/Vue3/Vuetify3\"`

---

### Task P9.2: Migrate Flip Finder page to Nuxt 4 / Vue 3 / Vuetify 3

**Files:**
- Create: `app-next/app/pages/flip.vue`
- Delete/superseded: `app/pages/flip.vue` (reference only; old app stays until cutover)

**Depends on:** P0 (scaffold + `nuxt.config.ts` + `vuetify-nuxt-module`), P1 (`analytics.css` `.an-*` classes loaded globally + `#spinner-wrapper` present), P2 (`app-next/app/stores/items.ts` → `useItemsStore` with `allItems` getter)

**Notes:** This page has **no `asyncData`** — every value comes from the store getter `all_items`, so **no `useAsyncData` / no `loadError`** is needed. Also absent (nothing to port): i18n, `.sync`, `v-data-table`, `v-simple-table`, `v-list-item-icon`, `v-subheader`, `v-menu`, `hidden-*` classes, moment, leaflet, driver.js. The table is a plain HTML `<table class="an-table">`, so no data-table header remap. Work = Vuex→Pinia getter, `head()`→`useHead`, `$vuetify.breakpoint`→`useDisplay`, spinner hack→`onMounted`, and Vuetify 2→3 attribute fixes on the form/chip/btn/pagination/alert.

**Steps:**

- [ ] Step 1: Convert `<script lang="ts">` Options API to `<script setup lang="ts">`, replacing Vuex `mapGetters` with the Pinia store. BEFORE:
```ts
<script lang="ts">
import { mapGetters } from 'vuex'

export default {
  name: 'FlipFinderPage',
  data() {
    return {
      search: '',
      minVolume: 0,
      category: 'All',
      sortKey: 'spread',
      page: 1,
      perPage: 25,
      placeholderImg:
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E",
      sortOptions: [
        { text: 'Widest spread', value: 'spread' },
        { text: 'Best margin %', value: 'margin' },
        { text: 'Volume', value: 'volume' },
        { text: 'Name (A–Z)', value: 'name' },
      ],
    }
  },
```
AFTER (open script setup, bring in composables/store, declare reactive state as refs — note `sortOptions` for `v-select` items uses `title`/`value` shape in Vuetify 3, was `text`/`value`):
```ts
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useDisplay } from 'vuetify'
import { useItemsStore } from '~/stores/items'

const itemsStore = useItemsStore()
const allItems = computed(() => itemsStore.allItems)

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const search = ref('')
const minVolume = ref<number>(0)
const category = ref('All')
const sortKey = ref('spread')
const page = ref(1)
const perPage = 25
const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' rx='8' fill='%232a2a3d'/%3E%3Cpath d='M22 11 L31 22 L22 33 L13 22 Z' fill='none' stroke='%234fb3bf' stroke-width='2' opacity='0.75'/%3E%3C/svg%3E"
const sortOptions = [
  { title: 'Widest spread', value: 'spread' },
  { title: 'Best margin %', value: 'margin' },
  { title: 'Volume', value: 'volume' },
  { title: 'Name (A–Z)', value: 'name' },
]
```

- [ ] Step 2: Port `head()` to `useHead()`. BEFORE:
```ts
  head() {
    return {
      title: 'Flip Finder — widest Warframe Market spreads',
      meta: [{ hid: 'description', name: 'description', content: 'Live buy/sell spread ranking across Warframe Market items — the widest, most liquid margins to flip for platinum.' }],
    }
  },
```
AFTER (place after state; drop `hid`, v3 dedupes by `name`):
```ts
useHead({
  title: 'Flip Finder — widest Warframe Market spreads',
  meta: [
    {
      name: 'description',
      content:
        'Live buy/sell spread ranking across Warframe Market items — the widest, most liquid margins to flip for platinum.',
    },
  ],
})
```

- [ ] Step 3: Convert the `computed` block (including the `isMobile`/`allItems` already moved in Step 1) to standalone `computed()` refs. Helper methods referenced inside (`categoryOf`, `marginPct`) are hoisted plain functions — declare them BEFORE the computeds that call them, or as function declarations (hoisted). BEFORE:
```ts
  computed: {
    ...mapGetters({ allItems: 'all_items' }),
    isMobile(): boolean {
      return (this as any).$vuetify.breakpoint.mobile
    },
    priced(): any[] {
      return (this.allItems as any[]).filter(
        (i) => i && i.market && i.market.buy > 0 && i.market.sell > 0 && i.market.sell > i.market.buy
      )
    },
    categoryOptions(): string[] {
      const present = new Set<string>()
      for (const r of this.priced) present.add(this.categoryOf(r.tags))
      const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
      return ['All', ...order.filter((c) => present.has(c))]
    },
    filtered(): any[] {
      const q = (this.search || '').toString().trim().toLowerCase()
      const minV = Number(this.minVolume) || 0
      let list = this.priced.filter((r) => {
        if (q && !r.item_name.toLowerCase().includes(q)) return false
        if (this.category !== 'All' && this.categoryOf(r.tags) !== this.category) return false
        if ((r.market.volume || 0) < minV) return false
        return true
      })
      const dir = (a: number, b: number) => b - a
      const sorters: Record<string, (a: any, b: any) => number> = {
        spread: (a, b) => dir(a.market.diff, b.market.diff),
        margin: (a, b) => dir(this.marginPct(a), this.marginPct(b)),
        volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
        name: (a, b) => a.item_name.localeCompare(b.item_name),
      }
      return list.slice().sort(sorters[this.sortKey] || sorters.spread)
    },
    pageCount(): number {
      return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
    },
    paged(): any[] {
      const start = (this.page - 1) * this.perPage
      return this.filtered.slice(start, start + this.perPage)
    },
    topDeal(): any {
      let best: any = null
      for (const r of this.priced) if (!best || r.market.diff > best.market.diff) best = r
      return best
    },
    topDealUrl(): string {
      let best: any = null
      for (const r of this.filtered) if (!best || r.market.diff > best.market.diff) best = r
      return best ? best.url_name : ''
    },
    stats(): any {
      const list = this.priced
      const diffs = list.map((r) => r.market.diff)
      return {
        total: list.length,
        biggest: diffs.length ? Math.max(...diffs) : 0,
        avg: diffs.length ? diffs.reduce((s, v) => s + v, 0) / diffs.length : 0,
        profitable: list.filter((r) => r.market.diff >= 10).length,
      }
    },
  },
```
AFTER (`this.X` → `X.value` for refs/computeds; store getter already `allItems.value`; helpers called plainly):
```ts
const priced = computed<any[]>(() =>
  (allItems.value as any[]).filter(
    (i) => i && i.market && i.market.buy > 0 && i.market.sell > 0 && i.market.sell > i.market.buy
  )
)

const categoryOptions = computed<string[]>(() => {
  const present = new Set<string>()
  for (const r of priced.value) present.add(categoryOf(r.tags))
  const order = ['Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Sentinel', 'Companion', 'Arcane', 'Other']
  return ['All', ...order.filter((c) => present.has(c))]
})

const filtered = computed<any[]>(() => {
  const q = (search.value || '').toString().trim().toLowerCase()
  const minV = Number(minVolume.value) || 0
  const list = priced.value.filter((r) => {
    if (q && !r.item_name.toLowerCase().includes(q)) return false
    if (category.value !== 'All' && categoryOf(r.tags) !== category.value) return false
    if ((r.market.volume || 0) < minV) return false
    return true
  })
  const dir = (a: number, b: number) => b - a
  const sorters: Record<string, (a: any, b: any) => number> = {
    spread: (a, b) => dir(a.market.diff, b.market.diff),
    margin: (a, b) => dir(marginPct(a), marginPct(b)),
    volume: (a, b) => dir(a.market.volume || 0, b.market.volume || 0),
    name: (a, b) => a.item_name.localeCompare(b.item_name),
  }
  return list.slice().sort(sorters[sortKey.value] || sorters.spread)
})

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))

const paged = computed<any[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const topDeal = computed<any>(() => {
  let best: any = null
  for (const r of priced.value) if (!best || r.market.diff > best.market.diff) best = r
  return best
})

const topDealUrl = computed<string>(() => {
  let best: any = null
  for (const r of filtered.value) if (!best || r.market.diff > best.market.diff) best = r
  return best ? best.url_name : ''
})

const stats = computed<any>(() => {
  const list = priced.value
  const diffs = list.map((r) => r.market.diff)
  return {
    total: list.length,
    biggest: diffs.length ? Math.max(...diffs) : 0,
    avg: diffs.length ? diffs.reduce((s, v) => s + v, 0) / diffs.length : 0,
    profitable: list.filter((r) => r.market.diff >= 10).length,
  }
})
```

- [ ] Step 4: Port the `watch` (reset page when the filter set changes) and the methods to top-level functions; replace the spinner recursion in `mounted()`. BEFORE:
```ts
  watch: {
    filtered() {
      this.page = 1
    },
  },
  mounted() {
    this.finishLoading()
  },
  methods: {
    assetUrl(thumb: string): string {
      return 'https://warframe.market/static/assets/' + (thumb || '')
    },
    mkt(urlName: string): string {
      return 'https://warframe.market/items/' + urlName
    },
    onImgError(e: any) {
      const img = e.target
      if (!img || img.dataset.fallback) return
      img.dataset.fallback = '1'
      img.src = this.placeholderImg
    },
    categoryOf(tags: string[] = []): string {
      const t = (tags || []).map((x) => (x || '').toLowerCase())
      if (t.includes('warframe')) return 'Warframe'
      if (t.includes('primary')) return 'Primary'
      if (t.includes('secondary')) return 'Secondary'
      if (t.includes('melee')) return 'Melee'
      if (t.includes('mod')) return 'Mod'
      if (t.includes('sentinel')) return 'Sentinel'
      if (t.includes('companion') || t.includes('pet')) return 'Companion'
      if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
      return 'Other'
    },
    fmtPlat(n: number): string {
      return Math.round(Number(n) || 0).toLocaleString('en-US')
    },
    fmtPct(n: number): string {
      const v = Number(n) || 0
      return `${v.toFixed(0)}%`
    },
    marginPct(row: any): number {
      return row.market.buy > 0 ? (row.market.diff / row.market.buy) * 100 : 0
    },
    finishLoading() {
      this.$nextTick(() => {
        const el = document.getElementById('spinner-wrapper')
        if (el) el.style.display = 'none'
        else this.finishLoading()
      })
    },
  },
}
</script>
```
AFTER (use `function` declarations so `categoryOf`/`marginPct` are hoisted for Step 3's computeds; `watch(filtered, ...)`; `onMounted` hides spinner. Keep the retry-until-present intent but guard against infinite recursion in SSR by only running client-side inside `onMounted`):
```ts
watch(filtered, () => {
  page.value = 1
})

function assetUrl(thumb: string): string {
  return 'https://warframe.market/static/assets/' + (thumb || '')
}
function mkt(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}
function onImgError(e: any) {
  const img = e.target
  if (!img || img.dataset.fallback) return
  img.dataset.fallback = '1'
  img.src = placeholderImg
}
function categoryOf(tags: string[] = []): string {
  const t = (tags || []).map((x) => (x || '').toLowerCase())
  if (t.includes('warframe')) return 'Warframe'
  if (t.includes('primary')) return 'Primary'
  if (t.includes('secondary')) return 'Secondary'
  if (t.includes('melee')) return 'Melee'
  if (t.includes('mod')) return 'Mod'
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
  return 'Other'
}
function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
function fmtPct(n: number): string {
  const v = Number(n) || 0
  return `${v.toFixed(0)}%`
}
function marginPct(row: any): number {
  return row.market.buy > 0 ? (row.market.diff / row.market.buy) * 100 : 0
}

function finishLoading() {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else finishLoading()
  })
}
onMounted(() => {
  finishLoading()
})
</script>
```

- [ ] Step 5: Fix the filter form Vuetify 2 attrs. BEFORE (both `v-text-field` + the `v-select`):
```html
<v-text-field v-model="search" dark dense hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
<v-text-field v-model.number="minVolume" dark dense hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
<v-select v-model="sortKey" :items="sortOptions" dark dense hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
```
AFTER (drop `dark`; `dense` → `density="compact"`; `sortOptions` now uses `title`/`value` — v-select item-title default is `title`, no extra props needed):
```html
<v-text-field v-model="search" density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" label="Search an item" class="an-search"></v-text-field>
<v-text-field v-model.number="minVolume" density="compact" hide-details type="number" min="0" label="Min volume (48h)" class="an-field"></v-text-field>
<v-select v-model="sortKey" :items="sortOptions" density="compact" hide-details label="Sort by" class="an-field" style="flex: 0 1 220px"></v-select>
```

- [ ] Step 6: Fix `v-chip-group` / `v-chip`. In Vuetify 3 `active-class` is not a `v-chip` prop for group selection — the group's selected styling is set via `selected-class` on `v-chip-group`; `small` → `size="small"`. BEFORE:
```html
<v-chip-group v-model="category" mandatory column class="an-cats">
  <v-chip v-for="c in categoryOptions" :key="c" :value="c" small active-class="an-chip--on">{{ c }}</v-chip>
</v-chip-group>
```
AFTER:
```html
<v-chip-group v-model="category" mandatory column selected-class="an-chip--on" class="an-cats">
  <v-chip v-for="c in categoryOptions" :key="c" :value="c" size="small">{{ c }}</v-chip>
</v-chip-group>
```

- [ ] Step 7: Fix the row action `v-btn` in the desktop table. BEFORE:
```html
<v-btn icon small color="#4fb3bf" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
  <v-icon>mdi-open-in-new</v-icon>
</v-btn>
```
AFTER (`small` → `size="small"`; `icon` stays boolean; keep the `v-icon` child so mdi font icon renders; `color` still valid):
```html
<v-btn icon size="small" color="#4fb3bf" variant="text" :href="mkt(row.url_name)" target="_blank" :aria-label="'Open ' + row.item_name">
  <v-icon>mdi-open-in-new</v-icon>
</v-btn>
```

- [ ] Step 8: Fix `v-pagination` — drop `dark`, keep `color` + `total-visible`. BEFORE:
```html
<v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" dark color="#d4af5a"></v-pagination>
```
AFTER:
```html
<v-pagination v-model="page" :length="pageCount" :total-visible="isMobile ? 5 : 9" color="#d4af5a"></v-pagination>
```

- [ ] Step 9: Fix the `v-alert` — `dense` → `density="compact"`, and the Vuetify 2 color helper `blue darken-4` → Vuetify 3 background utility `bg-blue-darken-4`. BEFORE:
```html
<v-alert class="an-disclaimer blue darken-4" type="info" dense>
  Spread = lowest sell order − highest buy order, from Warframe Market. Wide
  spreads on low-volume items may not fill quickly — check the volume column.
</v-alert>
```
AFTER:
```html
<v-alert class="an-disclaimer bg-blue-darken-4" type="info" density="compact">
  Spread = lowest sell order − highest buy order, from Warframe Market. Wide
  spreads on low-volume items may not fill quickly — check the volume column.
</v-alert>
```
The rest of the template (the `<client-only>` wrapper — still valid as `<ClientOnly>` in Nuxt 3/4, plain HTML `an-table`, hero/stats/cards markup, `v-icon` usages) needs **no changes**; all bindings reference the refs/computeds/functions ported above with identical names.

- [ ] Step 10: Typecheck: `cd app-next && npx nuxi typecheck` — expect no errors for `app/pages/flip.vue`. Common catch: `sortOptions` shape (`title` not `text`), and any lingering `this.` references.

- [ ] Step 11: Verify in browser: backend up (repo-root `npm run dev` on :3529) + `cd app-next && npm run dev`; load `/flip`. Expect: hero + 4 stat tiles render, item table (desktop) / cards (mobile) populate from the store, search/min-volume/sort/category-chip filters work, pagination appears when >25 matches and resets to page 1 on filter change, spinner disappears, zero console errors. Toggle a narrow viewport to confirm `isMobile` card layout + `total-visible=5`. Screenshot-diff vs old app `/flip` (close; accept Vuetify 3 spacing shifts on the field/chip/alert).

- [ ] Step 12: Commit: `git add app-next/app/pages/flip.vue && git commit -m "feat(migration): port flip.vue to Nuxt4/Vue3/Vuetify3"`

---


## Phase PZ — Cutover


---

### Task PZ.1: Cutover — promote app-next to app, fix Docker/pm2/root tooling, drop dead deps


**Files:**
- Rename: `app/` → `app_nuxt2_archive/` (kept until the deploy is confirmed green, then deleted in a follow-up commit)
- Rename: `app-next/` → `app/`
- Modify: `app/Dockerfile`, `ecosystem.config.js` (repo-root and/or `app/ecosystem.config.js`), repo-root `package.json` (`setup` script), `.github/` workflows if any reference the frontend build, `README.md` (dev commands/ports)

**Depends on:** every page/component/infra task (P0–P9) verified green.

**Context:** Do this only after all routes pass their per-page verification against a production build. The Nuxt 4 build output is `.output/` (Nitro) with server entry `.output/server/index.mjs` — different from Nuxt 2's `nuxt start`. This is the only step that touches files outside `app-next/`.

**Steps:**

- [ ] Step 1: Full production build smoke-test BEFORE swapping. With the backend up (`npm run dev` at repo root → `:3529`):
  ```bash
  cd app-next && npm run build && npm run preview
  ```
  Load every route (`/`, `/vaulted`, `/endo`, `/ducats`, `/movers`, `/volatility`, `/screener`, `/timing`, `/vault-spikes`, `/relics-value`, `/riven-value`, `/comparison`, `/relic-farming`, `/relic/<sample>`, `/set/<sample>`, `/star-chart`, `/portfolio`, `/flip`, plus `/es` and `/pt` prefixes on a couple) and confirm zero console errors. Expected: all render with live data.

- [ ] Step 2: Swap directories (git-aware). Expected: working tree now has the Nuxt 4 project at `app/`.
  ```bash
  cd "c:/Users/airau/Desktop/My Proyects/warframe"
  git mv app app_nuxt2_archive
  git mv app-next app
  ```

- [ ] Step 3: Update `app/Dockerfile`. **BEFORE** (Nuxt 2 pattern — openssl flag, `nuxt build`, `nuxt start`):
  ```dockerfile
  # e.g. RUN NODE_OPTIONS=--openssl-legacy-provider npm run build
  # CMD ["npm", "run", "start"]   # nuxt start
  ```
  **AFTER** (Nuxt 4 / Nitro — no openssl, build to `.output`, run the Nitro server):
  ```dockerfile
  # build stage
  RUN npm ci && npm run build
  # runtime: copy .output and run
  # CMD ["node", ".output/server/index.mjs"]
  # ENV needed at runtime: API_URL, NUXT_PUBLIC_API_URL (see runtimeConfig), PORT/HOST
  ```
  Read the current `app/Dockerfile` first and port each stage; drop any `--openssl-legacy-provider` and `--modern=server`.

- [ ] Step 4: Update `ecosystem.config.js` (pm2). Change the frontend app's `script`/`args`/`cwd` from `nuxt start` to the Nitro entry. **AFTER** (illustrative):
  ```js
  {
    name: 'warframe-frontend',
    script: '.output/server/index.mjs',
    cwd: './app',
    env: { PORT: 3312, HOST: '0.0.0.0', API_URL: 'http://localhost:3529' },
  }
  ```
  Read the current file first and preserve the existing app name and any other pm2 apps (the Express API entry is unchanged).

- [ ] Step 5: Update repo-root `package.json` `setup` script — it already does `npm install && cd app && npm install && cd ..`, which stays valid after the rename (the frontend is at `app/` again). Confirm no script still references `app-next` or the old openssl flag.

- [ ] Step 6: Grep the repo (excluding node_modules and `app_nuxt2_archive`) for stale references and fix them:
  ```bash
  grep -rn "openssl-legacy-provider\|nuxt start\|--modern=server\|app-next" --include=*.js --include=*.ts --include=*.json --include=Dockerfile --include=*.yml . | grep -v node_modules | grep -v app_nuxt2_archive
  ```
  Expected after fixes: no hits outside the archive.

- [ ] Step 7: Final full build from the new `app/`, and confirm the dead top-level deps are gone (they were never carried into `app-next`): `@nuxtjs/axios`, `@nuxt/typescript-build`, `@nuxt/typescript-runtime`, `ts-loader`, `core-js`, `webpack`, `vue-template-compiler`, `vue-server-renderer`, `moment`, `cross-env`, and the confirmed-dead integrations (`@netsells/nuxt-hotjar`, `vue-tawk`, `@nuxtjs/sentry`, `@sentry/vue`, `@sentry/tracing`, `@nuxtjs/robots`, `@nuxtjs/google-analytics`) unless the P1 module-audit found one active.
  ```bash
  cd app && npm run build
  ```

- [ ] Step 8: Commit the cutover:
  ```bash
  git add -A
  git commit -m "feat: cut over frontend to Nuxt 4 + Vuetify 3 (promote app-next to app)"
  ```

- [ ] Step 9 (follow-up, after the deploy is confirmed healthy): delete the archive.
  ```bash
  git rm -r app_nuxt2_archive && git commit -m "chore: remove archived Nuxt 2 app"
  ```
