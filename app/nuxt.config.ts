// https://nuxt.com/docs/api/configuration/nuxt-config
import { es, pt } from 'vuetify/locale'

// SITE_URL is the PUBLIC FRONTEND origin — NOT the API. The API lives at
// warframe.digitalshopuy.com (serves JSON); the app is served from
// warframe-app.digitalshopuy.com. This value powers canonical/hreflang links
// (via @nuxtjs/i18n), the sitemap <loc> entries and absolute OG image URLs, so
// it MUST be the frontend host or search engines canonicalise every page to the
// JSON API and drop the site from the index.
const SITE_URL = process.env.SITE_URL || 'https://warframe-app.digitalshopuy.com'
const SITE_TITLE = 'Warframe Market Analytics — Live Prime Prices & Platinum Tools'
const SITE_DESC =
  'Track live Warframe Market prices, prime set values, ducat efficiency, riven worth and trading signals. Free real-time platinum analytics and tools for Tenno.'

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  ssr: true,
  devtools: { enabled: true },

  // publicRuntimeConfig.apiURL (Nuxt 2) -> runtimeConfig.public.apiURL (Nuxt 4).
  // Consumers use: const base = useRuntimeConfig().public.apiURL
  runtimeConfig: {
    public: {
      apiURL: process.env.API_URL || 'http://localhost:3529',
      // Live Socket.IO server (warframe-live process) — separate port/origin from the REST API
      liveURL: process.env.LIVE_URL || 'http://localhost:3530'
    }
  },

  // Old server.port/host -> devServer (Vite). Prod port is set at `node .output` runtime.
  devServer: {
    port: Number(process.env.FRONTEND_PORT) || 3312,
    host: '0.0.0.0'
  },

  // Same-origin proxy for the live Socket.IO server (warframe-live process).
  // The browser connects to <origin>/live-io (see composables/useLiveFeed.ts) and
  // Nitro forwards engine.io polling/websocket to the internal live server. This
  // removes every cross-origin failure mode the direct localhost:3530 connection
  // hit — mixed content (https page -> ws://), CORS, and the need to expose the
  // live port publicly. LIVE_INTERNAL_URL is the server-side (private) target;
  // LIVE_SOCKET_PATH on the live server must match the '/live-io' path below.
  nitro: {
    routeRules: {
      '/live-io/**': {
        proxy: `${process.env.LIVE_INTERNAL_URL || 'http://127.0.0.1:3530'}/live-io/**`
      }
    }
  },

  // Global page head (Nuxt 2 `head{}` -> Nuxt 4 `app.head`). Ported verbatim
  // from app/nuxt.config.js:21-56. `addSeoAttributes` (i18n-only option) and
  // the root-level `description` (not a valid unhead field) were dropped.
  app: {
    head: {
      // Titles already carry the brand where natural; append it only when the
      // page title doesn't already mention Warframe (avoids "Warframe … Warframe").
      titleTemplate: (title?: string) =>
        !title
          ? SITE_TITLE
          : /warframe/i.test(title)
            ? title
            : `${title} — Warframe Market Analytics`,
      title: SITE_TITLE,
      // Default locale is English (i18n rewrites this per-locale via useLocaleHead).
      htmlAttrs: {
        lang: 'en'
      },
      // Warm up the cross-origin connections used on every page (item thumbnails
      // come from warframe.market; webfonts from Google's font CDN).
      link: [
        // Favicons — modern browsers prefer the scalable SVG mark; the .ico in
        // public/ is still auto-served as the legacy fallback.
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#d4af5a' },
        // Warm up the cross-origin connections used on every page (item thumbnails
        // come from warframe.market; webfonts from Google's font CDN).
        { rel: 'preconnect', href: 'https://warframe.market', crossorigin: '' },
        { rel: 'dns-prefetch', href: 'https://warframe.market' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: SITE_DESC },
        {
          name: 'keywords',
          content:
            'warframe market, warframe prices, warframe platinum, prime parts, prime set price, ducats, riven value, relic value, vaulted primes, warframe trading, warframe analytics'
        },
        { name: 'author', content: 'Eduardo Airaudo' },
        {
          name: 'robots',
          content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
        },
        { name: 'referrer', content: 'no-referrer' },
        { name: 'theme-color', content: '#0b0c16' },
        // Open Graph — site-level defaults. Per-page og:title/description come
        // from useSeoPage(); the og:image (+ dimensions) is injected per-route
        // by nuxt-og-image (the dynamic Void card), so no static og:image here.
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Warframe Market Analytics' },
        { property: 'og:title', content: SITE_TITLE },
        { property: 'og:description', content: SITE_DESC },
        // Twitter card defaults (per-page title/description/image overridden).
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: SITE_TITLE },
        { name: 'twitter:description', content: SITE_DESC }
      ]
    }
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    'nuxt-og-image',
    'nuxt-gtag',
    '@nuxtjs/google-fonts',
    '@vite-pwa/nuxt',
    'vuetify-nuxt-module'
  ],

  // Global stylesheets (Nuxt 2 `css: [...]` -> Nuxt 4 top-level `css`).
  // `base.css` sets the Open Sans body font (Vuetify 2's `defaultAssets.font`
  // has no V3 equivalent); `analytics.css` is the verbatim Orokin `.an-*`
  // design system (app/assets/analytics.css, byte-identical copy). The mdi
  // font stylesheet is NOT listed here: vuetify-nuxt-module auto-detects the
  // installed `@mdi/font` package and injects
  // `@mdi/font/css/materialdesignicons.css` itself when `icons.defaultSet`
  // is 'mdi' (see vuetify-nuxt-module/dist/module.mjs `resolvedIcons.local`);
  // adding it here too would double-load it. `driver.js/dist/driver.css`
  // (old app/nuxt.config.js line 64) is deferred to the driver.js/tour task.
  css: ['~/assets/base.css', '~/assets/analytics.css'],

  // Ported from app/nuxt.config.js `i18n` block. v9 breaking change vs the
  // old v7 config: locale objects use `language` (not `iso`). Messages stay
  // inline via `defineI18nConfig` (app-next/i18n/i18n.config.ts) to keep
  // parity with the old single-file `translations` object.
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'es', language: 'es-ES', name: 'Español' },
      { code: 'pt', language: 'pt-BR', name: 'Português' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    // baseUrl powers correct hreflang/canonical alternate links in SSR head —
    // must be the frontend origin (SITE_URL), never the API host.
    baseUrl: SITE_URL,
    vueI18n: './i18n.config.ts'
  },

  // Ported from app/nuxt.config.js `sitemap: '@nuxtjs/sitemap'` (bare module,
  // no config). v7 requires a site URL to emit absolute <loc> entries and
  // auto-discovers routes from the pages dir like the old default did.
  site: {
    url: SITE_URL
  },

  // nuxt-og-image — one branded Orokin card (components/OgImage/Void.vue) is
  // rendered per route (satori -> resvg). `defaults` makes EVERY page get a
  // Void card even if it doesn't explicitly call defineOgImageComponent;
  // useSeoPage() passes each page's clean title/description into it. Fonts are
  // fetched at build/first-render and cached.
  ogImage: {
    fonts: ['Cinzel:700', 'Rajdhani:500', 'Rajdhani:700'],
    defaults: {
      component: 'Void',
      width: 1200,
      height: 630
    }
  },

  // Ported from app/nuxt.config.js `buildModules` google-gtag entry,
  // consolidating both the GA4 property (G-) and the Google Ads account (AW-)
  // that were previously split across `id` + `additionalAccounts`.
  gtag: {
    tags: [{ id: 'G-F97PNVRMRF' }, { id: 'AW-972399920', config: { send_page_view: true } }]
  },

  // Ported verbatim from app/nuxt.config.js `googleFonts` block; v3 keeps the
  // same `families` shape.
  googleFonts: {
    families: {
      'Open Sans': [400, 600, 700]
    }
  },

  // PWA — @vite-pwa/nuxt (replaces @nuxtjs/pwa). Manifest ported verbatim from
  // the old pwa{} block (app/nuxt.config.js:174-204); API responses cached
  // NetworkFirst so last-loaded data survives offline / flaky connections.
  // The dead arc.io service worker (static/arc-sw.js) and the NekR
  // self-destroy stub (static/sw.js) are NOT ported — vite-pwa generates and
  // registers its own sw.js.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'Warframe Market Analytics',
      short_name: 'WF Analytics',
      description:
        'Live Warframe Market analytics — prime prices, ducat & relic value, riven pricing, flip finder and trading signals.',
      lang: 'en',
      dir: 'ltr',
      // Brand void — matches the theme-color meta (#0b0c16). The old #272727
      // mismatched it, giving a grey splash/titlebar that clashed with the UI.
      theme_color: '#0b0c16',
      background_color: '#0b0c16',
      categories: ['games', 'utilities', 'shopping', 'finance'],
      display: 'standalone',
      orientation: 'any',
      start_url: '/?source=pwa',
      scope: '/',
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/android-chrome-384x384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ],
      // App shortcuts (long-press the installed icon / jump list).
      shortcuts: [
        { name: 'Market Screener', short_name: 'Screener', url: '/screener', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }] },
        { name: 'Top Movers', short_name: 'Movers', url: '/movers', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }] },
        { name: 'Relic Value', short_name: 'Relics', url: '/relics-value', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }] },
        { name: 'My Portfolio', short_name: 'Portfolio', url: '/portfolio', icons: [{ src: '/android-chrome-192x192.png', sizes: '192x192' }] }
      ],
      // Enables the richer install dialog on Chromium desktop + Android.
      screenshots: [
        { src: '/img/screenshot-wide.png', sizes: '1280x672', type: 'image/png', form_factor: 'wide', label: 'Warframe Market Analytics dashboard' },
        { src: '/img/screenshot-narrow.png', sizes: '720x1232', type: 'image/png', form_factor: 'narrow', label: 'Warframe Market Analytics on mobile' }
      ]
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
            cacheableResponse: { statuses: [0, 200] }
          }
        }
      ]
    },
    client: {
      installPrompt: false
    },
    // Registers the SW in dev too (default is build-only) so DevTools ->
    // Application -> Service Workers/Manifest is verifiable via `npm run dev`.
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },

  // Ported from app/nuxt.config.js `vuetify: {...}` (lines 206-235), shaped
  // for vuetify-nuxt-module. V3 deltas vs the old @nuxtjs/vuetify config:
  //  - `dark: false` -> `defaultTheme: 'dark'`: the old layout forced
  //    `<v-app dark>` (app/layouts/default.vue:2) despite `dark: false`, so
  //    the live app always rendered dark. V3 has no `<v-app dark>` prop, so
  //    the default theme is set to 'dark' directly to preserve appearance.
  //  - `colors.blue.darken2` etc (vuetify/es5/util/colors, removed in V3)
  //    resolved to their literal Material hex values, nested under `colors`.
  //  - `treeShake` dropped: vite-plugin-vuetify tree-shakes automatically.
  //  - `customVariables: ['~/assets/variables.scss']` dropped: that file is
  //    comments-only (no active SASS overrides), so `moduleOptions.styles`
  //    is left at its default (`true`) rather than pointed at an empty file.
  //  - `defaultAssets.font` dropped (no V3 equivalent) — Open Sans is loaded
  //    by @nuxtjs/google-fonts (`googleFonts` above) and applied as the body
  //    font via `~/assets/base.css` in the `css` array.
  //  - `lang.locales: { pt, es }` -> `locale.messages: { es, pt }` using V3's
  //    `vuetify/locale` exports; `@nuxtjs/i18n` (already wired) takes over
  //    the active `locale`/`fallback` at runtime, so only the message packs
  //    are supplied here.
  vuetify: {
    vuetifyOptions: {
      icons: {
        defaultSet: 'mdi' // glyphs via @mdi/font, auto-injected by the module (see css comment above)
      },
      locale: {
        messages: { es, pt }
      },
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#1976D2', // colors.blue.darken2
              accent: '#424242', // colors.grey.darken3
              secondary: '#FF8F00', // colors.amber.darken3
              info: '#26A69A', // colors.teal.lighten1
              warning: '#FFC107', // colors.amber.base
              error: '#DD2C00', // colors.deepOrange.accent4
              success: '#00E676' // colors.green.accent3
            }
          },
          light: {
            dark: false,
            colors: {
              primary: '#1f1f2f'
            }
          }
        }
      }
    }
  }

  // (Sentry intentionally omitted — the Nuxt 2 config block was orphaned/inactive.
  //  Add @sentry/nuxt here later if error tracking is wanted.)
})
