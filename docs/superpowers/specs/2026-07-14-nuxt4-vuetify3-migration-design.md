# Nuxt 2 → Nuxt 4 + Vuetify 2 → Vuetify 3 Migration — Design

Date: 2026-07-14
Status: Approved design, pending implementation plan
Scope: `app/` frontend only (the Nuxt 2 client). The Express/Mongo backend at repo root is untouched.

## 1. Goal & constraints

Migrate the Warframe Market Analytics frontend from Nuxt 2.15 / Vue 2.6 / Vuetify 2.6
to Nuxt 4 / Vue 3 / Vuetify 3, keeping the site functionally intact.

Decisions locked with the user:

- **Approach:** Fresh Nuxt 4 scaffold, port pages/components; keep the old app runnable
  side-by-side for visual diffing.
- **Execution:** Full spec + phased plan first, execute in stages with a verify gate per phase.
- **Fidelity:** Functional parity + close visual. Accept Vuetify 3's default spacing/style
  shifts; do not chase pixel-identical output. Keep the app shell and theme close.
- **Src layout:** Nuxt 4 default (nested `app/` srcDir).
- **Date lib:** Swap `moment` → `dayjs` during the port (2 files).
- **SSR:** Kept (`ssr: true`) — SEO depends on it (i18n alternate langs, sitemap, robots, per-page meta).

Non-goals: no feature changes, no redesign, no backend changes, no unrelated refactors.

## 2. Current state (audited)

- Nuxt 2.15.8, Vue 2.6.14, Vuetify 2.6.1 (via `@nuxtjs/vuetify` buildModule).
- Webpack 4 + `NODE_OPTIONS=--openssl-legacy-provider` (legacy-Node crutch).
- 37 `.vue` files, ~11.6k LOC. Options API throughout; 24 files use `<script lang="ts">`.
- **Clean of deep Vue-2-isms:** no template filters, no `$on/$off` event bus, no `Vue.prototype`
  mutation. This makes the Vue 2→3 side mostly Vuetify component-API changes, not reactivity rewrites.
- **Data fetching:** 9 pages use Nuxt 2 `asyncData({ $axios, $config })` to SSR-fetch from
  `${apiURL}/...` (e.g. `/market_analytics`). `head()` Options method for per-page SEO meta.
- **Store:** tiny Vuex store (`items`, `locations`, `fortex`) with getters
  `all_items` / `all_relics` / `all_sets` / `locations` / `fortex`. Consumed via `mapGetters` in
  6 pages (ducats, endo, flip, index, portfolio, relic/_relic). **The code path that fills
  `items` was not located** during audit — must be resolved in P3 before porting the store.
- **i18n:** `@nuxtjs/i18n` v7, `prefix_except_default`, locales en/es/pt, `translations` module.
  `$t()` is used (e.g. footer). Vuetify locales pt/es also configured.
- **Backend for verification:** repo-root `npm run dev` (ts-node-dev `server.ts`) serves the API on
  `:3529`. Frontend dev port `:3312`. `API_URL=http://localhost:3529`.
- **Registered modules (active):** buildModules `@nuxtjs/pwa`, `@nuxt/typescript-build`,
  `@nuxtjs/vuetify`, `@nuxtjs/google-gtag`, `@nuxtjs/google-fonts`; modules `nuxt-leaflet`,
  `@nuxtjs/i18n`, `@nuxtjs/sitemap`, `@nuxtjs/axios`.
- **Installed but NOT registered / unreferenced in code (likely dead):** `@nuxtjs/robots`,
  `@nuxtjs/sentry` (+`@sentry/vue`, `@sentry/tracing`), `@nuxtjs/google-analytics`,
  `@netsells/nuxt-hotjar`, `vue-tawk`. There is a `sentry:` config block but the module is not in
  the modules array. **All are drop candidates pending a P1 confirmation grep.**
- **Leaflet:** used in exactly one component (`components/LocationPopup.vue`).

## 3. Target stack

| Concern | From | To |
| --- | --- | --- |
| Framework | Nuxt 2.15 | Nuxt 4 (Vite + Nitro) |
| Vue | 2.6 | 3.x |
| UI kit | Vuetify 2.6 (`@nuxtjs/vuetify`) | Vuetify 3 (`vuetify-nuxt-module`) |
| Bundler | Webpack 4 | Vite (Nuxt default) |
| State | Vuex | Pinia (`@pinia/nuxt`) |
| HTTP | `@nuxtjs/axios` | built-in `$fetch` / `useFetch` (ofetch) |
| Data fetch | `asyncData` | `useAsyncData` in `<script setup>` |
| Head/SEO | Options `head()` | `useHead` / `useSeoMeta` |
| Dates | moment | dayjs |
| TS | `@nuxt/typescript-build` + `-runtime` | built-in |
| Node flag | `--openssl-legacy-provider` | none (Vite) |

## 4. Dependency plan

| Old dependency | Fate | Replacement / note |
| --- | --- | --- |
| `@nuxtjs/axios` | remove | `$fetch` / `useFetch` (built-in) |
| `@nuxtjs/vuetify` | replace | `vuetify-nuxt-module` (Vuetify 3) |
| `@nuxt/typescript-build`, `@nuxt/typescript-runtime` | remove | built into Nuxt 4 |
| `@nuxtjs/pwa` | replace | `@vite-pwa/nuxt` |
| `@nuxtjs/i18n` v7 | upgrade | `@nuxtjs/i18n` v9 (API changed) |
| `@nuxtjs/sitemap` v2 | upgrade | `@nuxtjs/sitemap` v7 |
| `nuxt-leaflet` | replace | `@nuxtjs/leaflet` |
| `@nuxtjs/google-gtag` + `@nuxtjs/google-analytics` | consolidate | `nuxt-gtag` |
| `@nuxtjs/google-fonts` | upgrade | `@nuxtjs/google-fonts` v3 |
| `@nuxtjs/sentry` (+`@sentry/vue`, `@sentry/tracing`) | replace **or drop** | `@sentry/nuxt` if active; else drop (P1 audit) |
| `@nuxtjs/robots` | upgrade **or drop** | `@nuxtjs/robots` v5 if active; else drop |
| `@netsells/nuxt-hotjar` | drop | unreferenced; re-add manually only if wanted |
| `vue-tawk` | drop | unreferenced; manual script only if wanted |
| `moment` | replace | `dayjs` (2 files) |
| `driver.js` | keep | Vue-agnostic; tour |
| `autolinker` | keep | Vue-agnostic |
| `core-js`, `vue-template-compiler`, `vue-server-renderer`, `webpack` | remove | Nuxt 4 manages these |

Anything registered/used only through config gets its config rewritten in P1/P2; anything neither
registered nor referenced is deleted with a one-line note in the phase's commit.

## 5. Mechanical conversion rules

Applied file-by-file so the port is repeatable, not improvised.

### Nuxt / routing
- `asyncData({ $axios, $config })` → `<script setup>` with
  `const { apiURL } = useRuntimeConfig().public` +
  `const { data } = await useAsyncData('key', () => $fetch(\`${apiURL}/...\`))`.
  Preserve the try/catch → `loadError` flag semantics per page.
- Options `head()` → `useHead({...})` / `useSeoMeta({...})` in setup.
- `$config.apiURL` → `useRuntimeConfig().public.apiURL`.
- Layout `<Nuxt />` → `<slot />`. Add `app.vue` with `<NuxtLayout><NuxtPage /></NuxtLayout>`.
- Dynamic routes: `pages/relic/_relic.vue` → `pages/relic/[relic].vue`;
  `pages/set/_set.vue` → `pages/set/[set].vue`. `this.$route.params.relic` unchanged.

### Vue 3
- `.sync` (4 occurrences) → `v-model:prop`.
- Data/head pages → `<script setup lang="ts">`. Presentational components with no `asyncData`/`head`
  stay Options API (Vue 3 supports it) — only their Vuetify template APIs are fixed, to minimise churn.

### Vuetify 2 → 3
- `v-simple-table` → `v-table`.
- `v-data-table` (9 tables — highest-risk surface): headers `text`→`title`, `value`→`key`;
  audit `items-per-page`, sort, and any server-pagination props per table; verify `#item.<x>`
  and `#header.<x>` slot names.
- `<v-btn text>` / `outlined` (and similar attrs) → `variant="text"` / `variant="outlined"`.
- `v-subheader` → `v-list-subheader`.
- `v-list-item-icon` + `v-list-item-title` → `v-list-item` with `#prepend` slot / `title` prop
  (`v-list-item-icon` is removed in V3).
- `dense` → `density="compact"`.
- `this.$vuetify.breakpoint.mobile` → `useDisplay().mobile` (setup) or `this.$vuetify.display.mobile`.
- App shell: `<v-app dark>` → `<v-app>` + theme config; `v-app-bar` drop `app` / `fixed` /
  `clipped-left` (V3 auto-layouts via `v-main`); `v-footer :fixed` → `app` / `location`.
- Display helpers `hidden-xs-only` / `hidden-sm-and-down` → `d-none d-sm-flex` / responsive `d-*`.
- Colors: `vuetify/es5/util/colors` → `vuetify/lib/util/colors`; theme themes rewritten to the
  flatter V3 `theme.themes.<name>.colors` shape (keep dark default + current palette).
- Icons: keep the **mdi font** (`@mdi/font`) for parity — no per-icon svg conversion.
- Vuetify locale (pt/es) → V3 `locale` option.
- Keep `assets/analytics.css` (`.an-*` Orokin design system) untouched; only fix bits that depended
  on Vuetify 2 SASS variables.

## 6. Where it lives & cutover

- Scaffold the new project at sibling **`app-next/`** (nested `app/` srcDir per Nuxt 4 default).
- Old `app/` stays fully runnable throughout — the visual-diff reference.
- **Cutover (final phase):** move `app/` → `app_nuxt2_archive/` (or delete once satisfied), move
  `app-next/` → `app/`, then update everything that references the frontend dir:
  `app/Dockerfile`, `ecosystem.config.js`, repo-root `setup` script, any CI. Remove the
  `--openssl-legacy-provider` flag. No downstream file changes until this deliberate step.

## 7. Phased plan (each phase ends at a green verify gate)

- **P0 — Scaffold.** `app-next` with Nuxt 4 + `vuetify-nuxt-module` + `@pinia/nuxt` + TS. Blank app
  boots; `dev` and `build` both succeed.
- **P1 — Config & modules.** `runtimeConfig` (apiURL), default `app.head`, i18n v9
  (3 locales, `prefix_except_default`, translations), sitemap v7, `nuxt-gtag`, google-fonts v3,
  `@vite-pwa/nuxt` (rewrite workbox `runtimeCaching` for the API), robots/sentry **only if the
  audit grep proves them active** (else drop). Verify: build clean, home route renders shell.
- **P2 — Theme & assets.** Vuetify 3 dark theme + current palette, `analytics.css` + variables,
  `@mdi/font`, `public/img` (logo etc.). Verify: shell styled ~as before.
- **P3 — Store → Pinia.** First resolve how `items` is filled today; port `all_items` /
  `all_relics` / `all_sets` / `locations` / `fortex` into a Pinia store (or simplify if the getter
  proves dead). Update the 6 consumer pages. Verify: consumers read data.
- **P4 — App shell.** `app.vue`, `layouts/default` + `error`, and shell components
  (`LanguageMenu`, `GitHubButton`/`GitHubShare`, `Tutorial` + driver.js, `LoadingBar`). Verify:
  navigation drawer, header, footer, i18n language switch all work.
- **P5…PN — Pages in risk-ordered batches.** Each page: convert script (setup + `useAsyncData` +
  `useHead`), fix Vuetify components, verify route loads with no console errors + screenshot-diff.
  1. Static/simple: `index`, `vaulted`, `endo`, `ducats`.
  2. Table-heavy: `movers`, `volatility`, `screener`, `timing`, `vault-spikes`, `relics-value`,
     `riven-value`, `comparison`, `relic-farming`.
  3. Dynamic routes: `relic/[relic]`, `set/[set]`.
  4. Map: `star-chart` + `LocationPopup` (leaflet → `@nuxtjs/leaflet`).
  5. Stateful: `portfolio` (localStorage watchlist/alerts), `flip`.
- **PZ — Cutover & cleanup.** Swap dirs, fix Dockerfile/pm2/root scripts, delete dead deps,
  full production build, smoke-test every route.

## 8. Verification strategy

- **Per phase:** `nuxt build` clean, `nuxt dev` boots, `nuxi typecheck` passes, eslint passes.
- **Per page:** run the backend (`npm run dev` at repo root → `:3529`), load the route in the new app
  via Playwright / chrome-devtools MCP, assert zero console errors, and screenshot-diff against the
  same route in the old `app/`. Functional-parity bar: data loads, controls work, layout is close.
- **Final:** every route smoke-tested against a production build before cutover.

## 9. Top risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Vuetify 3 `v-data-table` rewrite (9 tables, headers + slots + pagination) | Treat each table as its own unit; verify sort/paginate/filter per page. Highest care budget. |
| i18n v7 → v9 API + SEO (localePath, alternate-lang head) | Port config early (P1), verify language switch and per-locale meta before pages depend on it. |
| `asyncData` → `useAsyncData` error semantics (`loadError`) | Preserve each page's try/catch → flag behavior explicitly; test the error path (backend down). |
| Store fill path unknown | Resolve in P3 before porting; do not assume the getter is populated. |
| PWA workbox → vite-pwa cache config | Rewrite `runtimeCaching` for the API origin; verify offline/last-data behavior. |
| Sentry config drift | Only re-add via `@sentry/nuxt` if the audit shows it was active; otherwise drop. |
| Visual drift from Vuetify 3 defaults | Accepted per fidelity decision; keep shell/theme close, don't chase pixels. |

## 10. Open items to resolve during implementation

1. Confirm (grep + config read) that robots/sentry/hotjar/tawk/google-analytics are truly inactive
   before dropping — P1.
2. Locate the store-fill path for `items` — P3.
3. Confirm dayjs format tokens match the moment usages in the 2 affected files — during those pages.
