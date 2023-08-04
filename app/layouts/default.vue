<template>
  <v-app dark>
    <v-app-bar color="#1f1f2f" :clipped-left="clipped" fixed app>
      <v-img
        max-height="90%"
        max-width="65vw"
        contain
        alt="logo warframe analytics"
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
    <v-main class="main">
      <v-container>
        <div id="menu">
          <v-btn color="primary" link to="/">Home</v-btn>
          <v-btn color="primary" link to="/set">Set Price Calculator</v-btn>
          <v-btn color="primary" link to="/endo">Endo / Plat</v-btn>
        </div>
        <Nuxt />
      </v-container>
    </v-main>
    <v-footer :fixed="false">
      <div class="d-flex footer_content">
        <span
          >Warframe Market Analytics &copy; {{ new Date().getFullYear() }}</span
        >
        <v-spacer />
        <span
          >{{ $t('madeWith') }} <v-icon color="red">mdi-heart</v-icon>
          {{ $t('por') }}
          <a href="https://www.linkedin.com/in/eduardo-airaudo/"
            >Eduardo Airaudo</a
          >
          {{ $t('and') }}
          <a href="https://www.linkedin.com/in/reginascagliotti/"
            >Regina Scagliotti</a
          >
        </span>
      </div>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'DefaultLayout',
  components: {
    LanguageMenu: () => import('../components/LanguageMenu.vue'),
  },
  async middleware({ store, redirect, $axios, $i18n, query }) {
    if (process.server) {
      const data = await $axios
        .get('https://warframe.digitalshopuy.com')
        .then((res) => res.data)
      store.dispatch('setItems', data)
    }
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
.main {
  background: #dedfdf;
}
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

#menu {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

body {
  font-family: 'Open Sans', sans-serif;
}

.no_link {
  text-decoration: none;
  color: #399ea5;
}
.website_link {
  word-break: break-all;
  max-width: 100%;
  min-width: 150px;
}

.button_section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (min-width: 768px) {
  .website_link {
    min-width: 200px;
  }
}

@media (max-width: 1750px) {
  body .container {
    max-width: 100% !important;
  }
}

.v-data-table__mobile-row {
  width: 100%;
}

.money_table
  .v-data-table__mobile-table-row
  > .v-data-table__mobile-row:nth-child(10) {
  flex-direction: column;
  justify-content: flex-start;
  .v-data-table__mobile-row__header {
    width: 100%;
  }
  .v-data-table__mobile-row__cell {
    text-align: left;
    div {
      margin-bottom: 12px;
    }
  }
}

.top_container {
  gap: 12px;
}

.donation_logo {
  transition: ease-in-out 0.3s;
}
.donation_logo:hover {
  transform: scale(1.05);
  filter: drop-shadow(0px 0px 3px black);
}

.gap-10 {
  gap: 10px;
}

#wrapper2 {
  width: 100%;
  overflow-x: scroll;
  overflow-y: hidden;
}

/* This div allow to make the scroll function and show the scrollbar */
#div2 {
  height: 1px;
  overflow: scroll;
}

.text_info {
  max-width: 490px;
}

@media (max-width: 768px) {
  .button_section {
    gap: 5px !important;
    button,
    a {
      min-width: 30px !important;
      max-width: calc(80vw / 5);
    }
  }
}

#form_warframe {
  max-width: 100%;
  gap: 10px;
}

tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>