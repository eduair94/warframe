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

  // Modules added in later phases: vuetify-nuxt-module, @pinia/nuxt,
  // @nuxtjs/leaflet.
  modules: ['@nuxtjs/i18n', '@nuxtjs/sitemap', 'nuxt-gtag', '@nuxtjs/google-fonts', '@vite-pwa/nuxt'],

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
  }

  // (Sentry intentionally omitted — the Nuxt 2 config block was orphaned/inactive.
  //  Add @sentry/nuxt here later if error tracking is wanted.)
})
