<template>
  <v-app>
    <v-app-bar color="#0b0c16" class="app-bar-orokin" style="z-index: 100">
      <v-btn
        variant="text"
        class="app-menu-btn mr-2"
        aria-label="Open navigation menu"
        @click.stop="drawer = !drawer"
      >
        <v-icon>mdi-menu</v-icon>
        <span class="app-menu-btn__label d-none d-sm-inline">Menu</span>
      </v-btn>
      <v-img
        max-height="90%"
        max-width="65vw"
        contain
        alt="logo warframe analytics"
        class="logo_image"
        position="left center"
        src="/img/logo.png"
        @click="scrollTop"
      />
      <v-spacer />
      <v-btn
        variant="text"
        class="app-tour-btn mr-1"
        aria-label="Take a guided tour"
        @click="startTour"
      >
        <v-icon>mdi-compass-outline</v-icon>
        <span class="app-tour-btn__label d-none d-md-inline">Tour</span>
      </v-btn>
      <GitHubButton icon color="white" class="mr-2" />
      <LanguageMenu />
    </v-app-bar>

    <!-- Mobile / tablet navigation: full page list, grouped and visible at once -->
    <v-navigation-drawer
      v-model="drawer"
      :temporary="!tourActive"
      color="#0a0b14"
      width="278"
      class="nav-drawer"
    >
      <div class="nav-drawer__head">
        <span class="nav-drawer__node"></span>
        <div>
          <div class="nav-drawer__eyebrow">Warframe Market</div>
          <div class="nav-drawer__title">Navigation</div>
        </div>
      </div>
      <v-list nav density="compact" class="nav-drawer__list">
        <template
          v-for="section in drawerSections"
          :key="section.title || 'root'"
        >
          <v-list-subheader
            v-if="section.title"
            class="nav-drawer__sub"
          >
            {{ section.title }}
          </v-list-subheader>
          <v-list-item
            v-for="link in section.items"
            :key="link.to"
            :to="link.to"
            :exact="link.exact"
            :data-tour="link.to"
            color="#e7cf95"
            @click="drawer = false"
          >
            <template #prepend>
              <v-icon>{{ link.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ link.title }}</v-list-item-title>
          </v-list-item>
        </template>
        <v-divider class="nav-drawer__divider" />
        <v-list-item
          href="https://github.com/eduair94/warframe"
          target="_blank"
          rel="noopener noreferrer"
        >
          <template #prepend><v-icon>mdi-github</v-icon></template>
          <v-list-item-title>Source Code</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main class="main">
      <v-container>
        <slot />
      </v-container>
    </v-main>
    <v-footer>
      <div class="d-flex footer_content">
        <span
          >Warframe Market Analytics &copy; {{ new Date().getFullYear() }}</span
        >
        <v-spacer />
        <span
          >{{ t('madeWith') }} <v-icon color="red">mdi-heart</v-icon>
          {{ t('por') }}
          <a href="https://www.linkedin.com/in/eduardo-airaudo/"
            >Eduardo Airaudo</a
          >
          {{ t('and') }}
          <a href="https://www.linkedin.com/in/reginascagliotti/"
            >Regina Scagliotti</a
          >
        </span>
      </div>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
// LanguageMenu / GitHubButton auto-import from app/components — no manual import
const { t } = useI18n()

interface NavLink {
  to: string
  title: string
  icon: string
  exact?: boolean
  group?: string | null
}

const drawer = ref(false)
// While the guided tour runs the drawer must stay open and NOT auto-close on
// outside clicks (clicking driver.js's "Next" counts as one) — a temporary
// drawer slid shut after step 1, leaving every nav-item step pointing at an
// off-screen element. Non-temporary during the tour keeps the nav visible and
// static so each step highlights correctly.
const tourActive = ref(false)

// Single source of truth for the grouped mobile/tablet drawer
const navLinks: NavLink[] = [
  { to: '/', title: 'Home', icon: 'mdi-home-variant', exact: true, group: null },
  { to: '/set', title: 'Set Prices', icon: 'mdi-cube-outline', group: 'Prices' },
  { to: '/relic', title: 'Relic Prices', icon: 'mdi-diamond-stone', group: 'Prices' },
  { to: '/comparison', title: 'Set vs Parts', icon: 'mdi-scale-balance', group: 'Analytics' },
  { to: '/relics-value', title: 'Relic Value', icon: 'mdi-treasure-chest-outline', group: 'Analytics' },
  { to: '/flip', title: 'Flip Finder', icon: 'mdi-trending-up', group: 'Analytics' },
  { to: '/screener', title: 'Screener', icon: 'mdi-table-search', group: 'Analytics' },
  { to: '/movers', title: 'Top Movers', icon: 'mdi-swap-vertical-bold', group: 'Analytics' },
  { to: '/volatility', title: 'Volatility', icon: 'mdi-pulse', group: 'Analytics' },
  { to: '/timing', title: 'Buy / Sell Timing', icon: 'mdi-clock-alert-outline', group: 'Analytics' },
  { to: '/vault-spikes', title: 'Vault Spikes', icon: 'mdi-rocket-launch-outline', group: 'Analytics' },
  { to: '/vaulted', title: 'Vaulted', icon: 'mdi-lock-outline', group: 'Analytics' },
  { to: '/star-chart', title: 'Star Chart', icon: 'mdi-orbit', group: 'Analytics' },
  { to: '/ducats', title: 'Ducats', icon: 'mdi-cash-multiple', group: 'Analytics' },
  { to: '/endo', title: 'Endo / Plat', icon: 'mdi-swap-horizontal', group: 'Tools' },
  { to: '/relic-farming', title: 'Relic Farming', icon: 'mdi-timer-sand', group: 'Tools' },
  { to: '/riven-value', title: 'Riven Value', icon: 'mdi-star-four-points-outline', group: 'Tools' },
  { to: '/portfolio', title: 'Portfolio', icon: 'mdi-briefcase-variant-outline', group: 'Tools' },
]

// Groups the nav links for the drawer, in a fixed section order
const drawerSections = computed(() => {
  const order: (string | null)[] = [null, 'Prices', 'Analytics', 'Tools']
  return order
    .map((g) => ({
      title: g,
      items: navLinks.filter((l) => (l.group || null) === g),
    }))
    .filter((s) => s.items.length)
})

function scrollTop() {
  window.scrollTo(0, 0)
}

async function startTour() {
  // Open the menu (and pin it open for the tour) so the steps can point at the
  // real navigation items without the temporary drawer sliding shut.
  tourActive.value = true
  drawer.value = true
  await nextTick()
  // driver.js touches the DOM — load it (and its base popover CSS) only on the
  // client, on demand. The `.driverjs-theme` overrides live in the <style> block.
  const [mod] = await Promise.all([
    import('driver.js'),
    import('driver.js/dist/driver.css'),
  ])
  const driver = (mod as any).driver || (mod as any).default
  const step = (to: string, title: string, description: string) => ({
    element: `[data-tour="${to}"]`,
    popover: { title, description, side: 'right', align: 'start' },
  })
  const tour = driver({
    showProgress: true,
    allowClose: true,
    popoverClass: 'driverjs-theme',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    // Belt & suspenders: whenever a step that targets a drawer nav item is
    // highlighted, make sure the drawer is open.
    onHighlightStarted: (_el: Element | undefined, step: any) => {
      const target = step && step.element
      if (typeof target === 'string' && target.indexOf('[data-tour') === 0) {
        drawer.value = true
      }
    },
    onDestroyed: () => {
      tourActive.value = false
      drawer.value = false
    },
    steps: [
      {
        popover: {
          title: 'Welcome, Tenno',
          description:
            'This is your void-trade console — every tool for spending and earning platinum smarter. Take the quick tour?',
        },
      },
      {
        element: '.app-menu-btn',
        popover: {
          title: 'Everything lives in the menu',
          description:
            'Open it any time. Tools are grouped into Prices, Analytics and Tools.',
          side: 'bottom',
          align: 'start',
        },
      },
      step('/comparison', 'Set vs Parts', 'Buy the assembled set, or the parts and combine? We show which is cheaper right now, and by how much.'),
      step('/relics-value', 'Relic Value', 'Crack a relic or sell it? The expected platinum payout of every relic, for Intact and Radiant.'),
      step('/flip', 'Flip Finder', 'The widest, most liquid buy/sell spreads — buy at the bid, relist at the ask.'),
      step('/ducats', 'Ducat Efficiency', "The best ducats-per-platinum parts to stock up for Baro Ki'Teer."),
      step('/vaulted', 'Vaulted', "Prime gear you can no longer farm — track what's climbing in value."),
      {
        popover: {
          title: "You're set",
          description:
            'Open the menu whenever you want to dig in. Happy trading, Tenno.',
        },
      },
    ],
  })
  tour.drive()
}
</script>


<style>
.main {
  background:
    radial-gradient(100% 55% at 50% 0%, rgba(200, 168, 92, 0.06), transparent 62%),
    radial-gradient(80% 50% at 90% 100%, rgba(53, 214, 208, 0.05), transparent 60%),
    linear-gradient(180deg, #0c0d17 0%, #080910 100%);
  min-height: 100vh;
}
.logo_image {
  cursor: pointer;
}

/* Orokin app-bar: voidglass with a gold underline */
.app-bar-orokin.v-app-bar {
  border-bottom: 1px solid rgba(200, 168, 92, 0.35) !important;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.5) !important;
}
/* Primary nav trigger — always visible, opens the grouped drawer */
.app-menu-btn.v-btn {
  color: #c8a85c !important;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  height: 40px !important;
  padding: 0 14px !important;
  min-width: auto !important;
  border: 1px solid rgba(200, 168, 92, 0.4);
  border-radius: 0 !important;
  clip-path: polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px);
}
.app-menu-btn.v-btn:hover {
  background: rgba(200, 168, 92, 0.14) !important;
}
.app-menu-btn__label {
  margin-left: 8px;
}
/* Guided-tour trigger */
.app-tour-btn.v-btn {
  color: #35d6d0 !important;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  min-width: auto !important;
}
.app-tour-btn__label {
  margin-left: 6px;
}

/* driver.js popover → Orokin */
.driver-popover.driverjs-theme {
  background: #12142a;
  color: #dfe3f0;
  border: 1px solid rgba(200, 168, 92, 0.45);
  border-radius: 0;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.6);
}
.driver-popover.driverjs-theme .driver-popover-title {
  color: #e7cf95;
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
}
.driver-popover.driverjs-theme .driver-popover-description {
  color: #c3c8dc;
  font-family: 'Open Sans', sans-serif;
}
.driver-popover.driverjs-theme .driver-popover-progress-text {
  color: #8f95ab;
  font-family: 'Rajdhani', sans-serif;
}
.driver-popover.driverjs-theme button {
  background: #c8a85c;
  color: #17130a;
  text-shadow: none;
  border: none;
  border-radius: 0;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.driver-popover.driverjs-theme button:hover {
  background: #e7cf95;
}
.driver-popover.driverjs-theme .driver-popover-close-btn {
  background: transparent;
  color: #8f95ab;
}
.driver-popover.driverjs-theme .driver-popover-arrow-side-right.driver-popover-arrow {
  border-right-color: #12142a;
}
.driver-popover.driverjs-theme .driver-popover-arrow-side-bottom.driver-popover-arrow {
  border-bottom-color: #12142a;
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

/* Primary navigation — Orokin voidglass bar (desktop), scrollable */
.app-nav {
  position: relative;
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.28);
  clip-path: polygon(
    14px 0, 100% 0, 100% calc(100% - 14px),
    calc(100% - 14px) 100%, 0 100%, 0 14px
  );
  margin: 8px 0 26px;
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45));
  overflow: hidden;
}
/* Scroll affordance: edge fades appear only when there's more to scroll */
.app-nav::before,
.app-nav::after {
  content: '';
  position: absolute;
  top: 1px;
  bottom: 1px;
  width: 44px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;
}
.app-nav::after {
  right: 1px;
  background: linear-gradient(90deg, rgba(12, 13, 24, 0), rgba(12, 13, 24, 0.96));
}
.app-nav::before {
  left: 1px;
  background: linear-gradient(270deg, rgba(12, 13, 24, 0), rgba(12, 13, 24, 0.96));
}
.app-nav.has-more-right::after {
  opacity: 1;
}
.app-nav.has-more-left::before {
  opacity: 1;
}
.app-nav__scroll {
  display: flex;
  gap: 2px;
  padding: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}
.app-nav__scroll::-webkit-scrollbar {
  display: none;
}
.app-nav__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  white-space: nowrap;
  color: #b6bcd0 !important;
  text-decoration: none;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
  transition: color 0.15s ease, background 0.15s ease;
}
.app-nav__item .v-icon {
  font-size: 18px !important;
}
.app-nav__item .v-icon {
  color: inherit !important;
}
.app-nav__item:hover {
  color: #e7cf95 !important;
  background: rgba(200, 168, 92, 0.12);
}
.app-nav__item:focus-visible {
  outline: 2px solid #35d6d0;
  outline-offset: -2px;
}
.app-nav__item.nuxt-link-exact-active {
  color: #17130a !important;
  background: #c8a85c;
  font-weight: 700;
}
.app-nav__item--ghost {
  margin-left: auto;
  color: #8f95ab !important;
}
@media (max-width: 700px) {
  .app-nav__item--ghost {
    margin-left: 0;
  }
}

/* ---- Mobile navigation drawer (Orokin void) --------------------------- */
.nav-drawer {
  border-right: 1px solid rgba(200, 168, 92, 0.28) !important;
}
.nav-drawer__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px 14px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.2);
}
.nav-drawer__node {
  width: 10px;
  height: 10px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(200, 168, 92, 0.6);
}
.nav-drawer__eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.66rem;
  color: #8f95ab;
}
.nav-drawer__title {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: #e7cf95;
  line-height: 1.1;
}
.nav-drawer__sub {
  font-family: 'Rajdhani', sans-serif !important;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.68rem !important;
  color: #c8a85c !important;
  height: auto !important;
  padding: 14px 16px 6px !important;
}
.nav-drawer .v-list-item {
  color: #c3c8dc !important;
  border-radius: 0 !important;
  margin: 1px 6px !important;
  min-height: 44px;
}
.nav-drawer .v-list-item .v-icon {
  color: #8f95ab !important;
}
.nav-drawer .v-list-item:hover {
  background: rgba(200, 168, 92, 0.08) !important;
}
.nav-drawer .v-list-item--active {
  background: rgba(200, 168, 92, 0.16) !important;
  box-shadow: inset 3px 0 0 #c8a85c;
}
.nav-drawer .v-list-item--active .v-icon,
.nav-drawer .v-list-item--active .v-list-item__title {
  color: #e7cf95 !important;
}
.nav-drawer .v-list-item__title {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: 1rem;
}
.nav-drawer__divider {
  border-color: rgba(200, 168, 92, 0.2) !important;
  margin: 8px 0;
}

/* ---- All Vuetify data tables → dark voidglass (fixes light nested tables) */
.v-main .v-data-table {
  background: transparent !important;
  color: #e6e9f2 !important;
  border-radius: 0 !important;
}
.v-main .v-data-table .v-data-table__wrapper {
  background: transparent !important;
}
.money_table.v-data-table {
  border: 1px solid rgba(200, 168, 92, 0.18);
}
.v-main .v-data-table > .v-data-table__wrapper > table > thead > tr > th {
  background: transparent !important;
  color: #c8a85c !important;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(200, 168, 92, 0.28) !important;
}
.v-main .v-data-table > .v-data-table__wrapper > table > thead > tr > th .v-icon {
  color: #c8a85c !important;
}
.v-main .v-data-table > .v-data-table__wrapper > table > tbody > tr > td {
  color: #dfe3f0 !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}
.v-main .v-data-table > .v-data-table__wrapper > table > tbody > tr:hover {
  background: rgba(200, 168, 92, 0.05) !important;
}
.v-main .v-data-table tbody tr:nth-of-type(odd) {
  background-color: rgba(255, 255, 255, 0.015);
}
.v-main .v-data-table a:not(.v-btn) {
  color: #e7cf95 !important;
  font-weight: 600;
}
.v-main .v-data-table a:not(.v-btn):hover {
  color: #f4e2b4 !important;
}
.v-main .v-data-table__empty-wrapper,
.v-main .v-data-table .v-data-footer {
  color: #9aa0b8 !important;
  border-color: rgba(200, 168, 92, 0.2) !important;
}

/* ---- Plain (uncoloured) content alerts → gold voidglass callout -------- */
.v-main .v-alert:not(.an-disclaimer):not(.blue):not(.error):not(.success):not(.warning):not([class*='darken']) {
  background: rgba(200, 168, 92, 0.1) !important;
  border: 1px solid rgba(200, 168, 92, 0.3) !important;
  color: #ece4d0 !important;
  border-radius: 0 !important;
}

/* ---- Info / blue alerts → cyan voidglass (consistent everywhere) ------- */
.v-main .v-alert.blue,
.v-main .v-alert.info,
.v-main .v-alert.blue[class*='darken'] {
  background: rgba(53, 214, 208, 0.1) !important;
  border: 1px solid rgba(53, 214, 208, 0.32) !important;
  color: #dbe9ef !important;
  border-radius: 0 !important;
}
.v-main .v-alert.blue .v-icon,
.v-main .v-alert.info .v-icon {
  color: #35d6d0 !important;
}
.v-main .v-alert.error {
  background: rgba(217, 138, 138, 0.12) !important;
  border: 1px solid rgba(217, 138, 138, 0.42) !important;
  color: #f2dcdc !important;
  border-radius: 0 !important;
}
.v-main .v-alert.error .v-icon {
  color: #d98a8a !important;
}

/* ---- Checkboxes / radios → Orokin (fixes low-contrast boxes) ----------- */
.v-main .v-icon.mdi-checkbox-marked,
.v-main .v-icon.mdi-checkbox-marked-outline,
.v-main .v-icon.mdi-radiobox-marked,
.v-main .v-icon.mdi-minus-box {
  color: #c8a85c !important;
}
.v-main .v-icon.mdi-checkbox-blank-outline,
.v-main .v-icon.mdi-radiobox-blank {
  color: #8f95ab !important;
}
.v-main .v-input--selection-controls .v-label {
  color: #c3c8dc !important;
}

/* ---- Select / autocomplete / menu dropdowns → dark voidglass ----------- */
.v-menu__content {
  background: #12142a !important;
  border: 1px solid rgba(200, 168, 92, 0.25) !important;
  border-radius: 0 !important;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.55) !important;
}
.v-menu__content .v-list,
.v-menu__content .v-select-list {
  background: transparent !important;
}
.v-menu__content .v-list-item__title,
.v-menu__content .v-list-item__content,
.v-menu__content .v-list-item {
  color: #e6e9f2 !important;
}
.v-menu__content .v-list-item:hover,
.v-menu__content .v-list-item--active,
.v-menu__content .v-list-item--highlighted {
  background: rgba(200, 168, 92, 0.14) !important;
  color: #e7cf95 !important;
}
.v-menu__content .v-list-item--active .v-list-item__title {
  color: #e7cf95 !important;
}
/* Value shown in the closed select field */
.v-main .v-select__selection--comma {
  color: #eef1f8 !important;
}

/* ---- Data-table multi-sort priority badge (was black on dark) --------- */
.v-main .v-data-table-header__sort-badge {
  background: #c8a85c !important;
  color: #17130a !important;
  border: none !important;
  height: 18px;
  min-width: 18px;
}

/* ---- Homepage / detail filter bars → Orokin ---------------------------- */
.filter-container {
  background: linear-gradient(180deg, #14162a 0%, #0e0f1c 100%) !important;
  border: 1px solid rgba(200, 168, 92, 0.22);
  clip-path: polygon(
    14px 0, 100% 0, 100% calc(100% - 14px),
    calc(100% - 14px) 100%, 0 100%, 0 14px
  );
  padding: 18px 20px !important;
}
.filter-container .v-label {
  color: #9aa0b8 !important;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.05em;
}
.filter-container .v-label--active {
  color: #c8a85c !important;
}
.filter-container input,
.filter-container .v-select__selection,
.filter-container .v-select .v-icon {
  color: #eef1f8 !important;
}
.filter-container .v-input__slot::before {
  border-color: rgba(200, 168, 92, 0.3) !important;
}
.filter-container .v-input__slot::after {
  border-color: #c8a85c !important;
}
.filter-container .primary.v-btn {
  background: #c8a85c !important;
  color: #17130a !important;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 0 !important;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.filter-container .primary.v-btn .v-icon {
  color: #17130a !important;
}
.filter-container .v-expansion-panel {
  background: transparent !important;
}
.filter-container .v-expansion-panel-header {
  color: #c8a85c !important;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.04em;
}

/* ---- Footer (Orokin void) --------------------------------------------- */
body .v-footer {
  background: #0a0b14 !important;
  border-top: 1px solid rgba(200, 168, 92, 0.28) !important;
  color: #9aa0b8 !important;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.03em;
}
body .v-footer a {
  color: #c8a85c !important;
  text-decoration: none;
}
body .v-footer a:hover {
  color: #e7cf95 !important;
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
