# app/app/ — Nuxt 4 frontend source

This **is** the frontend (`srcDir: 'app'` in `nuxt.config.ts`). Ignore `app/pages/` at the
`app/` root — the old Nuxt-2 tree is gone. Vue 3 `<script setup>`, Vuetify 4, Pinia, dayjs.

## Structure

| Dir | What |
| --- | --- |
| `pages/` | file-based routes (see `docs/repo-map.md` for the route→file table) |
| `components/` | shared components; dialogs, cards, the design-system pieces |
| `composables/` | `use*` logic — one concern each (`useVaultValue`, `useEndoValue`, `useUserApi`, …) |
| `stores/` | Pinia: `items` (`useItemsStore` — market data), `auth`, `translations` |
| `utils/` | `seo.ts` (central head map), `catalogue.ts`, formatters, generated `seo-i18n*.ts` |
| `services/` | client-side API/portfolio services |
| `assets/` | `analytics.css` (the `.an-*` Orokin design system), `vuetify-orokin.css` |
| `layouts/` | `default.vue` — wraps every page, owns global chrome + head |
| `plugins/` | `analytics.client.ts` (GA4 page_view), pinia payload trim, firebase |
| `data/` | 362 baked static data files — know the filename before reading |

## Rules that bite

- **`<head>` is central.** Add SEO via the `app/app/utils/seo.ts` map (keyed by route) + the
  default layout — **not** per-page `useHead`. Dynamic OG cards via nuxt-og-image takumi.
- **New page must hide the loading spinner** on mount (`#spinner-wrapper`), or it spins forever.
- **Design system = Orokin "Void Ledger":** `analytics.css` `.an-*` classes, Cinzel (headings) +
  Rajdhani (body), void-black + gold + cyan, diamond-node motif, drawer nav. New pages match it.
  A few legacy pages (`/portfolio`, `/set`) are still on the old plain design.
- **Data comes from the API**, base URL configured in `nuxt.config.ts` (internal base for SSR).
  Market data flows through `useItemsStore`; don't refetch per component.
- **i18n**: display names localized via `useLocalizedName`; English `item_name`/`url_name` stays
  the canonical key. UI strings live in `app/i18n/` — see `app/i18n/CLAUDE.md`.
- After adding a page, run `npm run repo:index` (repo root) so the route map stays current.

## Big files — read narrowly

`pages/endo.vue` (67 KB), `pages/foundry/[[tab]].vue` (62 KB), `pages/star-chart-3d.vue` (52 KB),
`utils/seo-i18n-guides.ts` (110 KB), `utils/seo-i18n.ts` (78 KB). Grep or `offset`/`limit`.
