# SEO, OG images, favicon & installable PWA — design

**Date:** 2026-07-15
**Status:** Approved (design), pending implementation plan
**Scope:** Frontend (`app/`, Nuxt 4.4.8)

## Goal

Make every page share-friendly and index-friendly, ship a distinctive brand
favicon, and make the app a first-class installable PWA.

Four workstreams:

1. **Dynamic per-page OG images** — every route gets a unique 1200×630 social card.
2. **Unified per-page SEO** — one helper sets title/description/OG/Twitter +
   canonical + hreflang consistently across all pages.
3. **New Orokin favicon** — a diamond-node brand mark, full icon set.
4. **Installable PWA** — custom install button + banner + iOS fallback, and a
   corrected manifest.

## Current state (what's broken)

- **OG image wrong ratio.** Global `og:image` is `img/banner.png` at 1584×396
  (4:1 LinkedIn banner). Social cards expect 1.91:1 (1200×630) → renders
  cropped/tiny on Facebook, Discord, Slack, Twitter/X.
- **No per-page OG.** Pages set `<title>` + `description` but never override
  `og:title` / `og:description` / `og:image`. All 21 routes share the single
  global card and global title/description.
- **Inconsistent canonical/hreflang.** Some pages call
  `useHead(useLocaleHead({ seo: true }))` (index, `set`, `relic`); most use a
  plain `useHead({ title, meta:[description] })` and therefore emit no canonical
  or hreflang alternates.
- **Favicon is generic.** A serviceable icon set exists (`favicon.ico` 16/32/48,
  `favicon-16/32`, `apple-touch-icon` 180, `android-chrome-192/384`,
  `maskable-512`) but it is not brand-distinctive and there is no SVG favicon.
- **PWA not install-friendly.** `@vite-pwa/nuxt` is wired but
  `client.installPrompt: false`, no custom install UX. Manifest
  `theme_color`/`background_color` are `#272727`, mismatching the
  `theme-color` meta (`#0b0c16`). No `shortcuts`, `screenshots`, `id`, or
  `start_url`.

## Architecture

### Component / file inventory

| File | Type | Purpose |
|---|---|---|
| `app/nuxt.config.ts` | edit | register `nuxt-og-image`; fix global head OG defaults; overhaul `pwa.manifest` |
| `app/app/components/OgImage/Void.vue` | new | satori OG card template (1200×630) |
| `app/app/composables/useSeoPage.ts` | new | single per-page SEO helper |
| `app/app/composables/usePwaInstall.ts` | new | install-prompt capture + state |
| `app/app/components/PwaInstall.vue` | new | install button + banner + iOS dialog |
| `app/public/favicon.svg` | new | master brand mark (source of truth) |
| `app/public/*` icons | regen | ico + png set regenerated from the mark |
| `app/scripts/gen-favicons.mjs` | new | reproducible favicon raster generation |
| all `app/app/pages/*.vue` (21) | edit | migrate ad-hoc head → `useSeoPage()` |

### 1. Dynamic OG images — `nuxt-og-image`

Add `nuxt-og-image` (nuxt-seo family; integrates with the existing `site.url`
and `@nuxtjs/sitemap` already configured). Register in `modules`.

`app/app/components/OgImage/Void.vue` is the shared template, rendered by satori
(Vercel's HTML→SVG) then resvg→PNG inside Nitro. Satori supports only a subset
of CSS: **inline `style` only** (no scoped classes), every element with >1 child
must be explicit `display: flex`, no external stylesheets, no CSS filters that
satori can't map.

Card design (Orokin "Void Ledger"):
- 1200×630, background linear-gradient `#0b0c16 → #12142a`.
- Gold hairline inner frame (`rgba(212,175,90,.5)`).
- Diamond-node glyph top-left (inline SVG or unicode ◆) + Cinzel eyebrow
  "WARFRAME MARKET ANALYTICS" in gold `#d4af5a`.
- Page **title** — large (≈64px), Rajdhani/Cinzel bold, near-white with a cyan
  `#4fb3bf` accent word where natural.
- **description** subline — muted `#9aa0b4`, clamped to ~2 lines.
- Footer: host `warframe-app.digitalshopuy.com`.

Props: `{ title: string, description?: string, variant?: 'default'|'entity' }`.
Fonts loaded via `ogImage.fonts` config: `Cinzel:700`, `Rajdhani:500`,
`Rajdhani:700`.

Rendering strategy: static routes prerender their card at build; dynamic routes
(`set/[[set]]`, `relic/[[relic]]`) render on demand in the Nitro node runtime
(pm2 prod). resvg wasm ships with the module — no system binary needed.

### 2. Unified SEO — `useSeoPage()`

`app/app/composables/useSeoPage.ts`:

```ts
interface SeoPageInput {
  title: string          // page title WITHOUT brand suffix (titleTemplate adds it)
  description: string
  ogType?: 'website' | 'article'   // default 'website'
  image?: string          // explicit override; when set, skip dynamic OG
  ogTitle?: string        // defaults to title
  noindex?: boolean       // rare, for thin/utility routes
}

export function useSeoPage(input: SeoPageInput): void
```

Behaviour (runs on every page that calls it):

1. `useHead(useLocaleHead({ seo: true }))` — canonical + hreflang alternates for
   the current route in all three locales. **This is the index-friendliness fix**
   applied uniformly.
2. `useSeoMeta({ title, description, ogTitle, ogDescription, ogType,
   twitterTitle, twitterDescription, twitterCard: 'summary_large_image' })` —
   per-page OG/Twitter text tags.
3. If `image` given → `useSeoMeta({ ogImage: image, twitterImage: image })`.
   Else → `defineOgImageComponent('Void', { title: ogTitle ?? title,
   description })` for the dynamic card.
4. If `noindex` → merge `robots: 'noindex, follow'`.

Migration: each of the 21 pages replaces its current `useHead(...)` /
`useHead(useLocaleHead(...))` with a single `useSeoPage({ title, description })`
call. Titles/descriptions already present in each page are reused verbatim (no
copy rewrite in this pass). Dynamic pages compute `title`/`description` from the
resolved entity (set name, relic name) so both the tags and the OG card are
entity-specific.

### 3. Favicon — Orokin diamond mark

Master `app/public/favicon.svg`: a diamond-node mark (gold/cyan diamond on a
dark rounded-square field), flat fills + at most linear gradients so
`convert` (ImageMagick) rasterizes it faithfully; no blur/filter primitives.

`app/scripts/gen-favicons.mjs` regenerates, from the 512 master:
- `favicon.ico` — multi-res 16/32/48
- `favicon-16x16.png`, `favicon-32x32.png`
- `apple-touch-icon.png` — 180, **solid** void bg + safe padding (iOS ignores
  transparency and squares the corners itself)
- `android-chrome-192x192.png`, `android-chrome-384x384.png`
- `maskable-icon-512x512.png` — mark within the inner 80% safe zone on solid bg

Primary rasterizer: `convert`. Fallback: add `sharp` as a **devDependency** used
only by the script if gradient fidelity is poor. Committed raster outputs are
the shipped artifacts — prod build needs no rasterizer.

Head links (global, `nuxt.config` app.head): add
`{ rel:'icon', type:'image/svg+xml', href:'/favicon.svg' }`, keep the `.ico`
and `apple-touch-icon` links as fallbacks.

### 4. Installable PWA

`app/app/composables/usePwaInstall.ts`:
- Listens for `beforeinstallprompt`, `preventDefault()`, stashes the event.
- Exposes `canInstall` (event captured & not installed), `promptInstall()`
  (calls `.prompt()`, awaits choice, clears), `installed` (from `appinstalled`
  event + `matchMedia('(display-mode: standalone)')`).
- `isIos` + `isStandalone` — iOS Safari never fires the event, so the UI falls
  back to instructions.
- SSR-safe (all `window` access guarded / `onMounted`).

`app/app/components/PwaInstall.vue`:
- "Install app" button rendered in the drawer/nav when `canInstall`, or on iOS
  when not already standalone.
- Dismissible bottom banner, shown once (localStorage flag), never in standalone.
- iOS path opens a small dialog: "Share → Add to Home Screen" with the share
  glyph.

Manifest overhaul (`nuxt.config` `pwa.manifest`):
- `theme_color` + `background_color` → `#0b0c16` (brand void; aligns with the
  `theme-color` meta).
- Add `id: '/'`, `start_url: '/?source=pwa'`, `scope: '/'`,
  `orientation: 'any'`, improved `description`.
- `shortcuts`: Screener, Movers, Relics value, Portfolio (name + url + icon).
- `screenshots`: one `form_factor: 'wide'` + one narrow → richer Chrome/Edge
  install dialog.
- `icons`: include the regenerated set (+ `favicon.svg` where allowed).
- Keep `registerType: 'autoUpdate'` and the NetworkFirst API cache.

### 5. SEO hardening (global head)

- Remove the stale `og:image` 1584×396 block from `app.head.meta`; the module
  emits correct 1200×630 `og:image` + `og:image:width/height` per page.
- Keep one static `1200×630` default card (regenerated) as an ultimate fallback
  referenced by the module's `defaults`.
- Canonical/hreflang now guaranteed on every page via `useSeoPage()`.
- Keep existing `robots`, `keywords`, JSON-LD (`app.vue`), `llms.txt`,
  `robots.txt`, sitemap.

## Out of scope (explicit)

- Injecting dynamic `set` / `relic` entity URLs into the sitemap (currently bare
  auto-discovery of static routes). Flagged; not done unless requested.
- Rewriting page copy / titles for keyword optimisation — this pass preserves
  existing strings and only fixes structure/coverage.
- Offline fallback page (SW stays `navigateFallback: null` for the SSR app).
- Sentry / analytics changes.

## Testing / verification

- **OG:** load `/__og-image__/image/<route>/og.png` (module debug route) for
  home, screener, a `set/*` and a `relic/*` route; confirm 1200×630 and correct
  baked title. Validate `<meta property="og:image">` resolves to an absolute URL
  on `SITE_URL`.
- **SEO:** view-source a plain page (e.g. `/screener`) and confirm it now emits
  `<link rel="canonical">`, `hreflang` alternates, and per-page `og:title` /
  `og:description`.
- **Favicon:** DevTools → Application → Manifest shows icons without warnings;
  favicon renders in the tab; `apple-touch-icon` has no transparency.
- **PWA install:** DevTools → Application → Manifest "Installability" passes;
  the custom install button fires the native prompt on desktop Chrome; iOS
  dialog shows on iOS Safari; banner dismissal persists.
- Run `npm run build` (or dev) and confirm no satori/module build errors.

## Risks

- Satori CSS subset — the card template must avoid unsupported CSS; verified via
  the module's debug route before wiring pages.
- ImageMagick SVG fidelity for the favicon gradient — mitigated by keeping the
  mark flat and the sharp fallback.
- On-demand OG rendering cost for dynamic routes — acceptable; module caches
  rendered images. Revisit if pm2 CPU spikes.
