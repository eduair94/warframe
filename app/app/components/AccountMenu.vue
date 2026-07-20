<template>
  <client-only>
    <!-- When Firebase is not configured on this deployment there is nothing to
         sign in to, so the whole account affordance is hidden. The tools it
         links to (/vault, /goals, /ledger, /foundry) still work as local-only
         and stay reachable from the nav drawer. -->
    <div v-if="configured" class="acct">
      <v-menu location="bottom end" :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <v-btn
            v-bind="menuProps"
            icon
            variant="text"
            class="acct__btn"
            :aria-label="signedIn ? t('account.menuAria') : t('account.signInAria')"
            @click="onOpen"
          >
            <v-avatar v-if="signedIn" size="28" class="acct__avatar">
              <v-img v-if="auth.profile?.photoURL" :src="auth.profile.photoURL" alt="" />
              <span v-else class="acct__initials">{{ auth.initials }}</span>
            </v-avatar>
            <v-icon v-else>mdi-account-circle-outline</v-icon>
            <!-- Sync heartbeat: a tiny dot rather than a whole status row, so
                 the already-tight app-bar cluster keeps its width budget. -->
            <span
              v-if="signedIn && syncState !== 'idle'"
              class="acct__dot"
              :class="`acct__dot--${syncState}`"
            ></span>
          </v-btn>
        </template>

        <v-list class="acct__list" density="compact">
          <template v-if="signedIn">
            <div class="acct__head">
              <div class="acct__name">{{ auth.profile?.displayName || t('account.tenno') }}</div>
              <div class="acct__email">{{ auth.profile?.email }}</div>
              <div class="acct__sync" :class="`acct__sync--${syncState}`">
                <v-icon size="13">{{ syncIcon }}</v-icon>
                {{ t(`account.sync.${syncState}`) }}
              </div>
            </div>
            <v-divider class="acct__divider" />
          </template>

          <v-list-item
            v-for="link in links"
            :key="link.to"
            :to="localePath(link.to)"
            @click="trackAction('account_menu_click', { to: link.to })"
          >
            <template #prepend><v-icon size="19">{{ link.icon }}</v-icon></template>
            <v-list-item-title>{{ t(link.label) }}</v-list-item-title>
          </v-list-item>

          <v-divider class="acct__divider" />

          <v-list-item v-if="!signedIn" @click="openDialog">
            <template #prepend><v-icon size="19">mdi-login-variant</v-icon></template>
            <v-list-item-title>{{ t('account.signIn') }}</v-list-item-title>
          </v-list-item>
          <v-list-item v-else @click="onSignOut">
            <template #prepend><v-icon size="19">mdi-logout-variant</v-icon></template>
            <v-list-item-title>{{ t('account.signOut') }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <AuthDialog v-model="dialog" />
    </div>
  </client-only>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

/**
 * App-bar account entry point. Client-only: Firebase Auth is a browser API and
 * the whole account layer is local-first, so SSR always renders the signed-out
 * shell and this hydrates over it.
 *
 * It deliberately renders as a single 38x38 icon button — the mobile app-bar
 * cluster (menu, logo, tour, GitHub, PWA install, language) already runs tight
 * at 320px, so this adds exactly one slot and no label.
 */
const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const userData = useUserData()
const { trackAction } = useAnalytics()

// Read the runtime config NOW (safe on server and client — it only inspects
// runtimeConfig, it never touches Firebase or a browser API), so `configured`
// is correct in the very first render instead of flashing the menu in and out.
auth.detect()

const dialog = ref(false)
const signedIn = computed(() => auth.signedIn)
const configured = computed(() => auth.configured)
const syncState = computed(() => userData.syncState.value)

const syncIcon = computed(() => {
  switch (syncState.value) {
    case 'syncing':
      return 'mdi-cloud-sync-outline'
    case 'error':
      return 'mdi-cloud-alert-outline'
    case 'off':
      return 'mdi-cloud-off-outline'
    default:
      return 'mdi-cloud-check-outline'
  }
})

const links = [
  { to: '/vault', icon: 'mdi-treasure-chest', label: 'account.links.vault' },
  { to: '/goals', icon: 'mdi-target', label: 'account.links.goals' },
  { to: '/ledger', icon: 'mdi-notebook-outline', label: 'account.links.ledger' },
  { to: '/portfolio', icon: 'mdi-bell-ring-outline', label: 'account.links.alerts' },
  { to: '/account', icon: 'mdi-account-cog-outline', label: 'account.links.account' },
]

onMounted(() => {
  // Registers hydration + the sign-in reaction. Does NOT pull in Firebase
  // unless a previous session left a hint (see stores/auth.ts init()).
  userData.start()
})

function onOpen() {
  trackAction('account_menu_open', { signed_in: signedIn.value })
}

function openDialog() {
  auth.detect()
  dialog.value = true
}

async function onSignOut() {
  await auth.signOut()
  trackAction('auth_signout')
}
</script>

<style scoped>
.acct {
  display: inline-flex;
}
.acct__btn.v-btn {
  color: #c8a85c !important;
  position: relative;
}
.acct__avatar {
  border: 1px solid rgba(200, 168, 92, 0.55);
}
.acct__initials {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 0.82rem;
  color: #e7cf95;
  letter-spacing: 0.04em;
}
.acct__dot {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 8px;
  height: 8px;
  transform: rotate(45deg);
  box-shadow: 0 0 6px currentColor;
}
.acct__dot--syncing {
  background: #35d6d0;
  color: #35d6d0;
}
.acct__dot--error {
  background: #d98a8a;
  color: #d98a8a;
}
.acct__dot--off {
  background: #6f7593;
  color: #6f7593;
}
.acct__list {
  background: #12142a !important;
  border: 1px solid rgba(200, 168, 92, 0.28);
  min-width: 238px;
}
.acct__head {
  padding: 12px 16px 10px;
}
.acct__name {
  font-family: 'Cinzel', serif;
  color: #e7cf95;
  font-size: 0.98rem;
  line-height: 1.2;
}
.acct__email {
  font-family: 'Rajdhani', sans-serif;
  color: #8f95ab;
  font-size: 0.78rem;
  word-break: break-all;
  margin-top: 2px;
}
.acct__sync {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.66rem;
  color: #8f95ab;
}
.acct__sync--idle {
  color: #35d6d0;
}
.acct__sync--error {
  color: #d98a8a;
}
.acct__divider {
  border-color: rgba(200, 168, 92, 0.2) !important;
}
.acct__list :deep(.v-list-item-title) {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: 0.94rem;
  color: #c3c8dc;
}
.acct__list :deep(.v-list-item .v-icon) {
  color: #8f95ab;
}
.acct__list :deep(.v-list-item:hover) {
  background: rgba(200, 168, 92, 0.1);
}
</style>
