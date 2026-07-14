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
  // @nuxtjs/i18n, @nuxtjs/sitemap, nuxt-gtag, @nuxtjs/google-fonts,
  // @vite-pwa/nuxt, @nuxtjs/leaflet.
  modules: []
})
