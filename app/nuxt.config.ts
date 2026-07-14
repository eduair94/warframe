// https://nuxt.com/docs/api/configuration/nuxt-config
import { es, pt } from 'vuetify/locale'

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

  // Global page head (Nuxt 2 `head{}` -> Nuxt 4 `app.head`). Ported verbatim
  // from app/nuxt.config.js:21-56. `addSeoAttributes` (i18n-only option) and
  // the root-level `description` (not a valid unhead field) were dropped.
  app: {
    head: {
      titleTemplate: '%s - Warframe',
      title: 'Warframe Market Analytics',
      htmlAttrs: {
        lang: 'es-ES'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'twitter:title', content: 'Warframe Market Analytics' },
        { name: 'twitter:description', content: 'Warframe Market Analytics' },
        { name: 'referrer', content: 'no-referrer' },
        { name: 'theme-color', content: '#3B9B85' }
      ]
    }
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
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
    // baseUrl powers correct hreflang alternate links in SSR head
    baseUrl: process.env.SITE_URL || 'http://localhost:3312',
    vueI18n: './i18n.config.ts'
  },

  // Ported from app/nuxt.config.js `sitemap: '@nuxtjs/sitemap'` (bare module,
  // no config). v7 requires a site URL to emit absolute <loc> entries and
  // auto-discovers routes from the pages dir like the old default did.
  site: {
    url: process.env.SITE_URL || 'https://warframe.digitalshopuy.com'
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
        { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
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
