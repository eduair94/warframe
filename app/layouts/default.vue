<template>
  <v-app dark>
    <v-app-bar :clipped-left="clipped" fixed app>
      <v-img
        max-height="90%"
        max-width="65vw"
        contain
        alt="logo cambio uruguay"
        class="logo_image"
        position="left center"
        src="./img/logo.png"
        @click="scrollTop"
      >
        <template #sources>
          <source srcset="/img/logo.webp" />
        </template>
      </v-img>
      <v-spacer />
      <LanguageMenu />
    </v-app-bar>
    <v-main>
      <v-container>
        <Nuxt />
      </v-container>
    </v-main>
    <v-footer :fixed="false">
      <div class="d-flex footer_content">
        <span>Cambio Uruguay &copy; {{ new Date().getFullYear() }}</span>
        <v-spacer />
        <span
          >{{ $t('madeWith') }} <v-icon color="red">mdi-heart</v-icon>
          {{ $t('por') }}
          <a
            class="white--text"
            href="https://www.linkedin.com/in/eduardo-airaudo/"
            >Eduardo Airaudo</a
          >
          {{ $t('and') }}
          <a
            class="white--text"
            href="https://www.linkedin.com/in/reginascagliotti/"
            >Regina Scagliotti</a
          >
        </span>
      </div>
    </v-footer>
    <JoinTwitter />
  </v-app>
</template>

<script>
export default {
  name: 'DefaultLayout',
  components: {
    LanguageMenu: () => import('../components/LanguageMenu.vue'),
    JoinTwitter: () => import('../components/JoinTwitter.vue'),
  },
  data() {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-apps',
          title: 'Welcome',
          to: '/',
        },
        {
          icon: 'mdi-chart-bubble',
          title: 'Inspire',
          to: '/inspire',
        },
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'Cambio Uruguay - encuentra la mejor cotización',
    }
  },
  mounted() {
    this.$vuetify.lang.current = this.$i18n.locale
  },
  methods: {
    scrollTop() {
      window.scrollTo(0, 0)
    },
  },
}
</script>


<style>
.logo_image {
  cursor: pointer;
}
._hj_feedback_container {
  z-index: 1;
  position: relative;
}

.no_link {
  text-decoration: none;
}

.link_format {
  text-decoration: underline;
}

.no_link:hover {
  opacity: 0.8;
}

body .v-app-bar.v-app-bar--fixed {
  z-index: 1;
}

#suggestions {
  background: white;
  width: 384px;
  height: 264px;
}

@media (min-width: 768px) {
  .footer_content {
    max-width: calc(100vw - 150px);
    width: 100%;
  }
}

#arc-widget-container iframe {
  display: none !important;
  pointer-events: none !important;
}

@media (max-width: 768px) {
  body .v-footer {
    padding-bottom: 80px;
    height: auto !important;
  }
  body .v-data-table > .v-data-table__wrapper > table > tbody > tr > td,
  .v-data-table > .v-data-table__wrapper > table > thead > tr > td,
  .v-data-table > .v-data-table__wrapper > table > tfoot > tr > td {
    padding-bottom: 12px;
  }
}
</style>