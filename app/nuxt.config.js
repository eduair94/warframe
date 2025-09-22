import colors from 'vuetify/es5/util/colors'
import es from 'vuetify/lib/locale/es'
import pt from 'vuetify/lib/locale/pt'
import translations from './translations'

export default {
  type: 'module',
  loading: '~/components/LoadingBar.vue',
  // Global page headers: https://go.nuxtjs.dev/config-head

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

  server: {
    port: process.env.FRONTEND_PORT || 3312, // default: 3000
    host: '0.0.0.0' // default: localhost
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [{ src: '~/plugins/vue-plugins', mode: 'client' }],

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
    '@nuxtjs/google-fonts'
  ],

  googleFonts: {
    families: {
      'Open Sans': [400, 600, 700]
    }
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    'nuxt-leaflet',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@nuxtjs/axios',
  ],

  sentry: {
    dsn: process.env.SENTRY_DSN, // Enter your project's DSN.
    // Additional Module Options.
    config: {
      tracesSampleRate: 1.0,
      browserTracing: {},
      vueOptions: {
        trackComponents: true
      }
      // Optional Sentry SDK configuration.
      // Those options are shared by both the Browser and the Server instances.
      // Browser-onlsy and Server-only options should go
      // into `clientConfig` and `serverConfig` objects respectively.
    }
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/'
  },

  i18n: {
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'en',
        iso: 'en-US',
        name: 'English'
      },
      {
        code: 'es',
        iso: 'es-ES',
        name: 'Español'
      },
      {
        code: 'pt',
        iso: 'pt-BR',
        name: 'Português'
      }
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root' // recommended
    },
    vueI18n: {
      fallbackLocale: 'es',
      messages: translations
    }
  },

  router: {
    base: '/',
    mode: 'history'
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    icon: {
      purpose: 'maskable'
    },
    manifest: {
      theme_color: '#272727',
      // start_url: 'https://cambio-uruguay.com',
      crossorigin: 'use-credentials',
      name: 'Warframe Market Analytics App',
      short_name: 'Warframe Market Analytics',
      lang: 'es',
      categories: ['finance', 'business', 'currency'],
      description:
        'Warframe Market Analytics'
    },
    workbox: {
      workboxURL:
        'https://cdn.jsdelivr.net/npm/workbox-cdn/workbox/workbox-sw.js',
      importScripts:
        process.env.NODE_ENV === 'production'
          ? ['https://arc.io/arc-sw-core.js']
          : [],
      autoRegister: true
    }
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    lang: {
      locales: { pt, es }
    },
    treeShake: true,
    customVariables: ['~/assets/variables.scss'],
    defaultAssets: {
      font: {
        family: 'Open Sans'
      }
    },
    theme: {
      dark: false,
      themes: {
        dark: {
          primary: colors.blue.darken2,
          accent: colors.grey.darken3,
          secondary: colors.amber.darken3,
          info: colors.teal.lighten1,
          warning: colors.amber.base,
          error: colors.deepOrange.accent4,
          success: colors.green.accent3
        },
        light: {
          primary: '#1f1f2f'
        }
      }
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    extend(config, { isClient }) {
      // Extend only webpack config for client-bundle
      if (isClient) {
        config.devtool = 'source-map'
      }
    }
  }
}
