import colors from 'vuetify/es5/util/colors'

export default {
  type: 'module',
  ssr: false,
  router: {
    base: '/cambio-uruguay/',
  },
  loading: '~/components/LoadingBar.vue',
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    htmlAttrs: {
      lang: 'es-ES',
    },
    titleTemplate: '%s - Cambio Uruguay',
    title: 'Cambio Uruguay',
    description:
      'Encuentra las mejores cotizaciones de cambio de divisas en Uruguay',
    meta: [
      { charset: 'utf-8' },
      {
        name: 'twitter:title',
        content: 'Cambio Uruguay',
      },
      {
        name: 'twitter:description',
        content:
          'Cambio Uruguay - Encuentra las mejores casas cambiarias del país, mejores cotizaciones de dólares (USD), pesos argentinos (ARS) y reales brasileños (BRL).',
      },
      {
        name: 'twitter:image',
        content: 'https://cambio-uruguay.com/img/banner.png',
      },
      {
        name: 'twitter:site',
        content: '@cambios_uy',
      },
      {
        name: 'twitter:creator',
        content: '@cambios_uy',
      },
      {
        name: 'og:site_name',
        content: 'Cambio Uruguay',
      },
      {
        name: 'robots',
        content: 'index, follow',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, user-scalable=no',
      },
      {
        hid: 'description',
        name: 'description',
        content:
          'Cambio Uruguay - Encuentra las mejores casas cambiarias del país, mejores cotizaciones de dólares (USD), pesos argentinos (ARS) y reales brasileros (BRL).',
      },
      {
        hid: 'og:title',
        property: 'og:title',
        content: `Cambio Uruguay`,
      },
      {
        hid: 'og:description',
        property: 'og:description',
        content: `Cambio Uruguay - Encuentra las mejores casas cambiarias del país, mejores cotizaciones de dólares (USD), pesos argentinos (ARS) y reales brasileros (BRL).`,
      },
      {
        hid: 'og:image',
        property: 'og:image',
        content: `https://cambio-uruguay.com/img/banner.png`,
      },
      {
        name: 'referrer',
        content: 'no-referrer',
      },
      {
        name: 'keywords',
        content:
          'cotizaciones uruguay, casa cambiaria, cambio moneda, cambio dólares, cambio pesos argentinos, cambio reales, cambio euros, varlix, prex, gales',
      },
    ],
    link: [
      {
        hid: 'icon',
        rel: 'icon',
        type: 'image/x-icon',
        href: '/icons/favicon-32x32.png',
      },
    ],
    script: [
      {
        src:
          process.env.NODE_ENV === 'production'
            ? 'https://arc.io/widget.min.js#63RUbX6J'
            : '',
        async: true,
      },
    ],
  },

  server: {
    port: 3311, // default: 3000
    host: '0.0.0.0', // default: localhost
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: false,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    '@nuxtjs/pwa',
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify',
    [
      '@nuxtjs/google-gtag',
      {
        id: 'G-F97PNVRMRF',
      },
    ],
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // '@nuxtjs/sitemap',
    [
      '@nuxtjs/robots',
      {
        UserAgent: '*',
        Disallow: '',
        Sitemap: 'http://cambio-uruguay.com/sitemap.xml',
      },
    ],
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/',
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      start_url: 'https://cambio-uruguay.com',
      crossorigin: 'use-credentials',
      name: 'Cambio Uruguay App',
      short_name: 'Cambio Uruguay',
      lang: 'es',
      description:
        'Encuentra las mejores cotizaciones de cambio de divisas en Uruguay',
    },
    workbox: {
      workboxURL:
        'https://cdn.jsdelivr.net/npm/workbox-cdn/workbox/workbox-sw.js',
      importScripts:
        process.env.NODE_ENV === 'production'
          ? ['https://arc.io/arc-sw-core.js']
          : [],
      autoRegister: true,
    },
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    customVariables: ['~/assets/variables.scss'],
    theme: {
      dark: true,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3,
        },
      },
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {},
}
