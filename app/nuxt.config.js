import colors from 'vuetify/es5/util/colors'
import es from 'vuetify/lib/locale/es'
import pt from 'vuetify/lib/locale/pt'
import translations from './translations'

export default {
  type: 'module',
  loading: '~/components/LoadingBar.vue',
  
  // Runtime config
  publicRuntimeConfig: {
    apiURL: process.env.API_URL || 'http://localhost:3529',
    liveURL: process.env.LIVE_URL || 'http://localhost:3530'
  },

  privateRuntimeConfig: {
    apiURL: process.env.API_URL || 'http://localhost:3529',
    liveURL: process.env.LIVE_URL || 'http://localhost:3530'
  },

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
  css: ['driver.js/dist/driver.css', '~/assets/analytics.css'],

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
  // Previously carried leftover config from a sibling currency-exchange
  // project: wrong manifest categories/lang, `crossorigin: use-credentials`
  // (can silently block the install prompt without a matching CORS setup),
  // and a workbox importScripts pointing at an unrelated third-party
  // (arc.io) service-worker script that has nothing to do with this app.
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
      // Activate a new service worker (and its fresh precache) IMMEDIATELY on
      // the next visit instead of waiting for every tab to close. Without this,
      // a returning visitor kept running the previous build's cached JS/CSS —
      // deployed fixes appeared to "not take" until the app was fully closed.
      skipWaiting: true,
      clientsClaim: true,
      // Cache the API responses this app actually depends on so the PWA is
      // usable (last-loaded data, at least) when offline or on a flaky
      // connection - previously nothing beyond the Nuxt shell was cached.
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
      // The whole app is a dark "Void Ledger" design (dark backgrounds via
      // .main + analytics.css). With dark:false, Vuetify's light theme paints
      // default text rgba(0,0,0,.87) — near-black on dark surfaces — so any
      // component that doesn't set its own color (v-card, v-dialog, page
      // headings on /portfolio, etc.) rendered as unreadable black text.
      // The design was clearly built for dark (pages sprinkle `dark` props to
      // force it per-component); make it the global default.
      dark: true,
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
    // driver.js ships ESM — transpile so Nuxt 2 (webpack) can bundle it
    transpile: ['driver.js'],
    extend(config, { isClient }) {
      // Let webpack 4 parse .mjs ESM modules (e.g. driver.js) instead of
      // choking on the `export` keyword.
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      })
      // driver.js resolves (via package "main") to dist/driver.js.cjs, which
      // uses optional chaining / nullish coalescing. `build.transpile` only
      // patches the `.js$` babel rule, so a `.cjs` file slips through untouched
      // and webpack 4's parser chokes ("Module parse failed: Unexpected token").
      // Run babel (preset-env) on driver.js's .cjs so it downlevels.
      config.module.rules.push({
        test: /\.cjs$/,
        include: [/node_modules[\\/]driver\.js/],
        type: 'javascript/auto',
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            configFile: false,
            // Target IE11 so preset-env fully downlevels optional chaining /
            // nullish coalescing (a modern "defaults" target leaves them in,
            // and webpack 4's parser can't handle them).
            presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
          },
        },
      })
      // Extend only webpack config for client-bundle
      if (isClient) {
        config.devtool = 'source-map'
      }
    }
  }
}
