<template>
  <div class="an ac">
    <div class="an-console">
      <!-- Hero -->
      <header class="an-hero">
        <div class="an-hero__text">
          <div class="an-eyebrow">{{ t('account.eyebrow') }}</div>
          <i18n-t keypath="account.hero.title" tag="h1" class="an-title">
            <template #codex><span class="accent-b">{{ t('account.hero.titleCodex') }}</span></template>
            <template #anywhere><span class="accent-a">{{ t('account.hero.titleAnywhere') }}</span></template>
          </i18n-t>
          <p class="an-lede">{{ t('account.hero.lede') }}</p>
        </div>

        <!-- Identity card: the one panel that must never render on the server
             (Firebase resolves the session in the browser). -->
        <client-only>
          <div class="an-hero__deal ac-id">
            <template v-if="signedIn">
              <div class="an-hero__deal-label">{{ t('account.profile.title') }}</div>
              <div class="ac-id__row">
                <v-avatar size="46" class="ac-id__avatar">
                  <v-img v-if="auth.profile?.photoURL" :src="auth.profile.photoURL" alt="" />
                  <span v-else class="ac-id__initials">{{ auth.initials }}</span>
                </v-avatar>
                <div class="ac-id__who">
                  <div class="an-hero__deal-name">{{ auth.profile?.displayName || t('account.tenno') }}</div>
                  <div class="an-hero__deal-sub">{{ auth.profile?.email || t('account.profile.noEmail') }}</div>
                </div>
              </div>
              <div class="ac-id__sync" :class="'ac-id__sync--' + syncState">
                <v-icon size="14">{{ syncIcon }}</v-icon>
                {{ t('account.sync.' + syncState) }}
              </div>
            </template>
            <template v-else>
              <div class="an-hero__deal-label">{{ t('account.sync.off') }}</div>
              <div class="an-hero__deal-plat">{{ totalEntries }}<span>{{ t('account.stats.entries') }}</span></div>
              <div class="an-hero__deal-sub">{{ t('account.stats.caption') }}</div>
            </template>
          </div>
        </client-only>
      </header>

      <!-- What this browser is holding — proof that signing in loses nothing. -->
      <div class="an-stats">
        <div class="an-stat">
          <div class="an-stat__num">{{ counts.watchlist }}</div>
          <div class="an-stat__lbl">{{ t('account.stats.watchlist') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-alt">{{ counts.vault }}</div>
          <div class="an-stat__lbl">{{ t('account.stats.vault') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-gold">{{ counts.goals }}</div>
          <div class="an-stat__lbl">{{ t('account.stats.goals') }}</div>
        </div>
        <div class="an-stat">
          <div class="an-stat__num is-good">{{ counts.trades }}</div>
          <div class="an-stat__lbl">{{ t('account.stats.trades') }}</div>
        </div>
      </div>

      <!-- Signed out: the pitch. Rendered on the server too — this is the
           marketing view crawlers index. -->
      <section v-if="!signedIn" class="ac-sec">
        <h2 class="ac-sec__title">{{ t('account.signedOut.perksTitle') }}</h2>
        <p class="ac-sec__lede">{{ t('account.signedOut.lede') }}</p>

        <div class="ac-blocks">
          <div class="an-block">
            <div class="an-block__lbl">{{ t('account.signedOut.perks.devicesLbl') }}</div>
            <p class="ac-block__body">{{ t('account.signedOut.perks.devicesBody') }}</p>
          </div>
          <div class="an-block">
            <div class="an-block__lbl">{{ t('account.signedOut.perks.alertsLbl') }}</div>
            <p class="ac-block__body">{{ t('account.signedOut.perks.alertsBody') }}</p>
          </div>
          <div class="an-block">
            <div class="an-block__lbl">{{ t('account.signedOut.perks.backupLbl') }}</div>
            <p class="ac-block__body">{{ t('account.signedOut.perks.backupBody') }}</p>
          </div>
        </div>

        <!-- No Firebase config on this deployment: say so calmly and leave the
             rest of the page (export / import / delete) fully usable. -->
        <div v-if="!auth.configured" class="ac-note">
          <v-icon size="20" color="#8f95ab">mdi-cloud-off-outline</v-icon>
          <span>{{ t('account.notConfigured') }}</span>
        </div>
        <div v-else class="ac-cta">
          <button class="ac-btn ac-btn--gold" @click="openDialog">
            <v-icon size="19">mdi-login-variant</v-icon>
            <span>{{ t('account.signedOut.cta') }}</span>
          </button>
          <button class="ac-btn ac-btn--google" :disabled="auth.busy" @click="onGoogle">
            <svg class="ac-glogo" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.5 5.8c4.4-4 7-10 7-17.3z" />
              <path fill="#FBBC05" d="M10.4 28.7a14.7 14.7 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.4 0-11.7-3.7-13.6-8.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            <span>{{ t('account.signedOut.google') }}</span>
          </button>
        </div>
        <p v-if="authErrorText" class="ac-error">{{ authErrorText }}</p>
      </section>

      <!-- Signed in: identity detail + sync console. -->
      <client-only>
        <section v-if="signedIn" class="ac-sec">
          <h2 class="ac-sec__title">{{ t('account.syncPanel.title') }}</h2>
          <p class="ac-sec__lede">{{ t('account.syncPanel.help') }}</p>

          <div class="ac-blocks ac-blocks--two">
            <div class="an-block">
              <div class="an-block__lbl">{{ t('account.profile.title') }}</div>
              <div class="an-block__row"><span>{{ t('account.profile.email') }}</span><b class="ac-wrap">{{ auth.profile?.email || t('account.profile.noEmail') }}</b></div>
              <div class="an-block__row"><span>{{ t('account.profile.provider') }}</span><b>{{ providerLabel }}</b></div>
              <div class="an-block__row"><span>{{ t('account.profile.member') }}</span><b>{{ memberSince }}</b></div>
            </div>
            <div class="an-block">
              <div class="an-block__lbl">{{ t('account.syncPanel.title') }}</div>
              <div class="an-block__row">
                <span>{{ t('account.syncPanel.state') }}</span>
                <b class="ac-state" :class="'ac-state--' + syncState">
                  <v-icon size="14">{{ syncIcon }}</v-icon>
                  {{ t('account.sync.' + syncState) }}
                </b>
              </div>
              <div class="an-block__row"><span>{{ t('account.syncPanel.last') }}</span><b>{{ lastSyncedLabel }}</b></div>
              <div class="ac-blockcta">
                <button class="ac-btn ac-btn--ghost" :disabled="syncState === 'syncing'" @click="onSyncNow">
                  <v-icon size="17">mdi-cloud-sync-outline</v-icon>
                  <span>{{ t('account.syncPanel.now') }}</span>
                </button>
                <button class="ac-btn ac-btn--ghost" @click="onSignOut">
                  <v-icon size="17">mdi-logout-variant</v-icon>
                  <span>{{ t('account.signOut') }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="an-tablewrap">
            <table class="an-table is-cards">
              <thead>
                <tr>
                  <th class="col-name">{{ t('account.syncPanel.table.section') }}</th>
                  <th>{{ t('account.syncPanel.table.entries') }}</th>
                  <th>{{ t('account.syncPanel.table.open') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sectionRows" :key="row.key">
                  <td class="col-name" :data-label="t('account.syncPanel.table.section')">{{ row.label }}</td>
                  <td class="an-num" :data-label="t('account.syncPanel.table.entries')">{{ row.count }}</td>
                  <td :data-label="t('account.syncPanel.table.open')">
                    <nuxt-link class="ac-link" :to="localePath(row.to)">{{ t('account.syncPanel.table.open') }} →</nuxt-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="authErrorText" class="ac-error">{{ authErrorText }}</p>
        </section>
      </client-only>

      <!-- Data control — identical signed in or out. -->
      <section class="ac-sec">
        <h2 class="ac-sec__title">{{ t('account.data.title') }}</h2>
        <p class="ac-sec__lede">{{ t('account.data.lede') }}</p>

        <div class="ac-blocks">
          <div class="an-block">
            <div class="an-block__lbl">{{ t('account.data.exportLbl') }}</div>
            <p class="ac-block__body">{{ t('account.data.exportBody') }}</p>
            <button class="ac-btn ac-btn--ghost" @click="onExport">
              <v-icon size="17">mdi-tray-arrow-down</v-icon>
              <span>{{ t('account.data.exportBtn') }}</span>
            </button>
          </div>
          <div class="an-block">
            <div class="an-block__lbl">{{ t('account.data.importLbl') }}</div>
            <p class="ac-block__body">{{ t('account.data.importBody') }}</p>
            <button class="ac-btn ac-btn--ghost" @click="pickFile">
              <v-icon size="17">mdi-tray-arrow-up</v-icon>
              <span>{{ t('account.data.importBtn') }}</span>
            </button>
            <input
              ref="fileInput"
              class="ac-file"
              type="file"
              accept="application/json"
              tabindex="-1"
              aria-hidden="true"
              @change="onFile"
            />
          </div>
          <div class="an-block an-block--danger">
            <div class="an-block__lbl an-block__lbl--danger">{{ t('account.data.deleteLbl') }}</div>
            <p class="ac-block__body">{{ t('account.data.deleteBody') }}</p>
            <button class="ac-btn ac-btn--danger" @click="openConfirm">
              <v-icon size="17">mdi-delete-forever-outline</v-icon>
              <span>{{ t('account.data.deleteBtn') }}</span>
            </button>
          </div>
        </div>

        <p v-if="notice" class="ac-notice" :class="notice.ok ? 'is-ok' : 'is-bad'">{{ notice.text }}</p>
      </section>

      <!-- Valuation preferences: the one canonical place these live. -->
      <section class="ac-sec">
        <h2 class="ac-sec__title">{{ t('account.prefs.title') }}</h2>
        <p class="ac-sec__lede">{{ t('account.prefs.lede') }}</p>

        <div class="an-block an-block--full ac-prefs">
          <div class="ac-set">
            <div class="ac-set__lbl">{{ t('account.prefs.basis') }}</div>
            <v-btn-toggle v-model="basis" mandatory density="compact" class="ac-minitoggle">
              <v-btn value="sell" size="x-small">{{ t('account.prefs.basisOptions.sell') }}</v-btn>
              <v-btn value="buy" size="x-small">{{ t('account.prefs.basisOptions.buy') }}</v-btn>
              <v-btn value="avg" size="x-small">{{ t('account.prefs.basisOptions.avg') }}</v-btn>
              <v-btn value="median" size="x-small">{{ t('account.prefs.basisOptions.median') }}</v-btn>
            </v-btn-toggle>
            <div class="ac-set__help">{{ t('account.prefs.basisHelp') }}</div>
          </div>
          <div class="ac-set">
            <div class="ac-set__lbl">{{ t('account.prefs.liquidity') }}</div>
            <v-switch
              v-model="liquidityAdjust"
              hide-details
              density="compact"
              inset
              color="#4fb3bf"
              :label="t('account.prefs.liquidity')"
              class="ac-switch"
            ></v-switch>
            <div class="ac-set__help">{{ t('account.prefs.liquidityHelp') }}</div>
          </div>
        </div>
      </section>

      <!-- Privacy -->
      <section class="ac-sec ac-sec--last">
        <h2 class="ac-sec__title">{{ t('account.privacy.title') }}</h2>
        <p class="ac-privacy">{{ t('account.privacy.body') }}</p>
        <p class="ac-privacy ac-privacy--note">
          <v-icon size="15" color="#8f95ab">mdi-shield-lock-outline</v-icon>
          {{ t('account.privacy.notice') }}
        </p>
      </section>
    </div>

    <v-alert class="an-disclaimer" color="blue-darken-4" type="info" density="compact">
      {{ t('account.disclaimer') }}
    </v-alert>

    <client-only>
      <AuthDialog v-model="dialog" @signed-in="onDialogSignedIn" />

      <!-- Destructive confirm — same voidglass shell as AuthDialog. -->
      <v-dialog v-model="confirmOpen" :max-width="isMobile ? 340 : 460" content-class="ac-confirm-dialog">
        <div class="ac-confirm">
          <header class="ac-confirm__head">
            <span class="ac-confirm__node" aria-hidden="true"></span>
            <div class="ac-confirm__headtext">
              <div class="ac-confirm__eyebrow">{{ t('account.confirm.eyebrow') }}</div>
              <h2 class="ac-confirm__title">{{ t('account.confirm.title') }}</h2>
            </div>
            <button class="ac-confirm__close" :aria-label="t('account.confirm.close')" @click="confirmOpen = false">
              <v-icon>mdi-close</v-icon>
            </button>
          </header>
          <div class="ac-confirm__body">
            <p class="ac-confirm__lede">{{ t('account.confirm.body') }}</p>
            <p class="ac-confirm__warn">{{ t('account.confirm.warn') }}</p>
          </div>
          <footer class="ac-confirm__foot">
            <button class="ac-btn ac-btn--ghost" @click="confirmOpen = false">{{ t('account.confirm.cancel') }}</button>
            <button class="ac-btn ac-btn--danger" :disabled="deleting" @click="onDelete">
              <v-progress-circular v-if="deleting" indeterminate size="16" width="2" />
              <span v-else>{{ t('account.confirm.confirmBtn') }}</span>
            </button>
          </footer>
        </div>
      </v-dialog>

      <v-snackbar v-model="toastOpen" :timeout="4000" color="#12142a" class="ac-toast">
        {{ toastText }}
      </v-snackbar>
    </client-only>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import type { AccountUser } from '~/composables/useUserApi'
import type { UserData, UserSettings } from '~/utils/userStorage'

/**
 * "Codex Access" — the account surface.
 *
 * Three jobs in one page, deliberately:
 *  1. the sign-in pitch for signed-out visitors (server-rendered: this is the
 *     view crawlers index),
 *  2. the landing page a passwordless email link returns to (auth.store sends
 *     the link with `?magic=1` pointing here and completes it below),
 *  3. the data-control panel — export, import, delete, valuation preferences —
 *     which works IDENTICALLY signed out. Nothing on this site is ever gated
 *     behind an account.
 */

// dayjs plugins are global; register once even though setup runs per instance.
if (!(dayjs as any).__wfRelativeTime) {
  dayjs.extend(relativeTime)
  ;(dayjs as any).__wfRelativeTime = true
}

const { t } = useI18n()
const localePath = useLocalePath()
const { trackAction, trackDialog } = useAnalytics()
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

const auth = useAuthStore()
const ud = useUserData()
const userApi = useUserApi()

// Resolved on the SERVER as well as the client: it only reads runtime config,
// and knowing it during SSR is what keeps the "sign in" / "accounts are off"
// branch from flipping under the user on hydration.
auth.detect()

const dialog = ref(false)
const confirmOpen = ref(false)
const deleting = ref(false)
const toastOpen = ref(false)
const toastText = ref('')
const notice = ref<{ ok: boolean; text: string } | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
/** Server-side account record — only used for "member since". */
const record = ref<AccountUser | null>(null)

const signedIn = computed(() => auth.signedIn)
const syncState = computed(() => ud.syncState.value)

const counts = computed(() => ({
  watchlist: Object.keys(ud.watchlist.value).length,
  vault: Object.keys(ud.vault.value).length,
  goals: ud.goals.value.length,
  trades: ud.trades.value.length,
  // Foundry progress is per-item, so "entries" here means items with at least
  // one tick (built, mastered, or a partial component count).
  foundry: Object.keys(ud.foundry.value?.items || {}).length,
}))
const totalEntries = computed(
  () =>
    counts.value.watchlist +
    counts.value.vault +
    counts.value.goals +
    counts.value.trades +
    counts.value.foundry,
)

const sectionRows = computed(() => [
  { key: 'watchlist', label: t('account.stats.watchlist'), count: counts.value.watchlist, to: '/portfolio' },
  { key: 'vault', label: t('account.stats.vault'), count: counts.value.vault, to: '/vault' },
  { key: 'goals', label: t('account.stats.goals'), count: counts.value.goals, to: '/goals' },
  { key: 'trades', label: t('account.stats.trades'), count: counts.value.trades, to: '/ledger' },
  { key: 'foundry', label: t('account.stats.foundry'), count: counts.value.foundry, to: '/foundry' },
])

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

const lastSyncedLabel = computed(() =>
  ud.lastSyncedAt.value ? dayjs(ud.lastSyncedAt.value).fromNow() : t('account.syncPanel.never'),
)

const memberSince = computed(() =>
  record.value?.createdAt ? dayjs(record.value.createdAt).format('YYYY-MM-DD') : '—',
)

const providerLabel = computed(() => {
  const p = String(auth.profile?.provider || '')
  if (p.includes('google')) return t('account.profile.providers.google')
  if (p === 'password' || p.includes('email')) return t('account.profile.providers.emailLink')
  return t('account.profile.providers.other')
})

// Same friendly-copy mapping AuthDialog uses, so a magic link that fails here
// reads exactly like a sign-in that fails there.
const KNOWN_ERRORS = ['invalid-email', 'unauthorized-domain', 'expired-link', 'network']
const authErrorText = computed(() => {
  if (!auth.error || auth.error === 'cancelled') return ''
  return KNOWN_ERRORS.includes(auth.error) ? t(`auth.errors.${auth.error}`) : t('auth.errors.generic')
})

// ------------------------------------------------------------- preferences

const basis = computed<NonNullable<UserSettings['basis']>>({
  get: () => ud.settings.value.basis || 'sell',
  set: (value) => {
    ud.patchSettings({ basis: value })
    trackAction('account_setting', { setting: 'basis', value })
  },
})

// Defaults to ON — useVaultValue's own default, so an untouched account values
// holdings the same way the tools do.
const liquidityAdjust = computed<boolean>({
  get: () => ud.settings.value.liquidityAdjust !== false,
  set: (value) => {
    ud.patchSettings({ liquidityAdjust: value })
    trackAction('account_setting', { setting: 'liquidity_adjust', value })
  },
})

// ------------------------------------------------------------------ auth

function toast(text: string) {
  toastText.value = text
  toastOpen.value = true
}

function openDialog() {
  auth.clearError()
  dialog.value = true
  trackDialog('auth')
}

async function onGoogle() {
  trackAction('auth_signin_attempt', { method: 'google' })
  const res = await auth.signInGoogle()
  if (res === 'signed-in') {
    trackAction('auth_signin_success', { method: 'google' })
    toast(t('account.snack.signedIn'))
  }
}

function onDialogSignedIn() {
  toast(t('account.snack.signedIn'))
}

async function onSignOut() {
  await auth.signOut()
  trackAction('auth_signout')
  toast(t('account.snack.signedOut'))
}

async function onSyncNow() {
  await ud.syncNow()
  trackAction('account_sync_now', { state: syncState.value })
  notice.value =
    syncState.value === 'error'
      ? { ok: false, text: t('account.syncPanel.failed') }
      : { ok: true, text: t('account.syncPanel.done') }
}

// ---------------------------------------------------------- data control

function onExport() {
  const payload = ud.exportData()
  const file = `warframe-analytics-${dayjs().format('YYYY-MM-DD')}.json`
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = file
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick: Safari cancels an in-flight download if the object
  // URL disappears in the same frame as the click.
  setTimeout(() => URL.revokeObjectURL(url), 0)
  trackAction('account_export', { entries: totalEntries.value })
  notice.value = { ok: true, text: t('account.data.exported', { file }) }
}

function pickFile() {
  fileInput.value?.click()
}

/**
 * Structural check on a hand-supplied backup file. `adopt()` type-checks each
 * section too, but rejecting the file outright gives the user a real error
 * instead of silently discarding the half of it that had the wrong shape.
 */
function isImportable(parsed: any): boolean {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
  const isObj = (v: unknown) => v === undefined || (!!v && typeof v === 'object' && !Array.isArray(v))
  const isArr = (v: unknown) => v === undefined || Array.isArray(v)
  if (!isObj(parsed.watchlist) || !isObj(parsed.vault)) return false
  if (!isArr(parsed.goals) || !isArr(parsed.trades)) return false
  if (!isObj(parsed.settings) || !isObj(parsed.foundry)) return false
  return true
}

/** Never throws on a bad file — a wrong pick must not cost anyone their data. */
async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  // Reset immediately so re-picking the same file still fires `change`.
  input.value = ''
  if (!file) return
  try {
    const parsed = JSON.parse(await file.text())
    if (!isImportable(parsed)) {
      notice.value = { ok: false, text: t('account.importError') }
      return
    }
    const ok = await ud.importData(parsed as Partial<UserData>)
    trackAction('account_import', { entries: totalEntries.value, synced: ok })
    notice.value = ok
      ? { ok: true, text: t('account.data.imported', { n: totalEntries.value }) }
      : { ok: false, text: t('account.data.importSyncFailed') }
  } catch {
    notice.value = { ok: false, text: t('account.importError') }
  }
}

function openConfirm() {
  confirmOpen.value = true
  trackDialog('account_delete_confirm')
}

async function onDelete() {
  deleting.value = true
  try {
    // `true` = wipe the server copy as well, not just this browser.
    await ud.resetAll(true)
    trackAction('account_delete_data', { signed_in: signedIn.value })
    if (auth.signedIn) await auth.signOut()
    notice.value = { ok: true, text: t('account.data.deleted') }
  } finally {
    deleting.value = false
    confirmOpen.value = false
  }
}

// ------------------------------------------------------------- lifecycle

// "Member since" comes from the account record, which is only worth fetching
// once a session exists.
watch(
  () => auth.profile?.uid || '',
  async (uid) => {
    if (!import.meta.client) return
    record.value = uid ? await userApi.me() : null
  },
  // Immediate so arriving here by client-side navigation, with the session
  // already restored, still fills the record in.
  { immediate: true },
)

// Hide the global loading spinner once mounted (project rule). Bounded retry
// so a missing #spinner-wrapper element can't recurse forever.
function finishLoading(attempt = 0) {
  nextTick(() => {
    const el = document.getElementById('spinner-wrapper')
    if (el) el.style.display = 'none'
    else if (attempt < 20) finishLoading(attempt + 1)
  })
}

onMounted(async () => {
  ud.start()
  auth.detect()
  try {
    // No-op unless this URL *is* a sign-in link; the store strips the
    // single-use credential out of the address bar either way, so an
    // already-consumed `?magic=1` reload lands here harmlessly.
    const res = await auth.completeMagicLink()
    if (res === 'signed-in') {
      trackAction('auth_signin_success', { method: 'magic_link' })
      toast(t('account.snack.signedIn'))
    } else if (res === 'error') {
      // `authErrorText` renders auth.error with AuthDialog's own copy.
      trackAction('auth_signin_error', { method: 'magic_link', code: auth.error })
    }
  } finally {
    finishLoading()
  }
})
</script>

<style scoped>
/* ---- Sections ---------------------------------------------------------- */
.ac-sec {
  padding: 26px 30px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.16);
}
.ac-sec--last {
  border-bottom: none;
  padding-bottom: 32px;
}
.ac-sec__title {
  font-family: 'Cinzel', serif;
  font-size: 1.18rem;
  font-weight: 700;
  color: #e7cf95;
  margin: 0 0 8px;
}
.ac-sec__lede {
  font-family: 'Rajdhani', sans-serif;
  color: #868ca6;
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0 0 18px;
  max-width: 74ch;
}

/* ---- Identity card (hero right) ---------------------------------------- */
.ac-id {
  text-align: left;
  min-width: 260px;
}
.ac-id__row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 10px;
}
.ac-id__avatar {
  border: 1px solid rgba(200, 168, 92, 0.55);
  flex: none;
}
.ac-id__initials {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: #e7cf95;
  letter-spacing: 0.04em;
}
.ac-id__who {
  min-width: 0;
}
.ac-id .an-hero__deal-name,
.ac-id .an-hero__deal-sub {
  word-break: break-word;
}
.ac-id__sync,
.ac-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.68rem;
  font-weight: 600;
  color: #868ca6;
}
.ac-id__sync--idle,
.ac-state--idle {
  color: #35d6d0;
}
.ac-id__sync--error,
.ac-state--error {
  color: #d98a8a;
}

/* ---- Block grids ------------------------------------------------------- */
.ac-blocks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}
.ac-blocks--two {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-bottom: 6px;
}
.ac-block__body {
  font-family: 'Rajdhani', sans-serif;
  color: #b6bcd0;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0 0 12px;
}
.ac-blockcta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.an-block--danger {
  border-color: rgba(217, 138, 138, 0.32);
}
.an-block__lbl--danger {
  color: #d98a8a;
}
.ac-wrap {
  word-break: break-all;
  text-align: right;
}

/* ---- Buttons ----------------------------------------------------------- */
.ac-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
.ac-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 42px;
  padding: 0 18px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.86rem;
  cursor: pointer;
  border: 1px solid transparent;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.ac-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ac-btn--gold {
  background: #c8a85c;
  color: #17130a;
}
.ac-btn--gold:hover:not(:disabled) {
  background: #e7cf95;
}
.ac-btn--google {
  background: #ffffff;
  color: #1f1f2f;
}
.ac-btn--google:hover:not(:disabled) {
  background: #e9edf5;
}
.ac-glogo {
  width: 18px;
  height: 18px;
  flex: none;
}
.ac-btn--ghost {
  background: transparent;
  border-color: rgba(200, 168, 92, 0.4);
  color: #c8a85c;
}
.ac-btn--ghost:hover:not(:disabled) {
  background: rgba(200, 168, 92, 0.14);
  color: #e7cf95;
}
.ac-btn--danger {
  background: transparent;
  border-color: rgba(217, 138, 138, 0.5);
  color: #d98a8a;
}
.ac-btn--danger:hover:not(:disabled) {
  background: rgba(217, 138, 138, 0.16);
  color: #f0b6b6;
}

/* Hidden file input — the styled button owns the interaction. */
.ac-file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* ---- Notices ----------------------------------------------------------- */
.ac-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  color: #9aa0b8;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.92rem;
  line-height: 1.5;
}
.ac-notice {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.88rem;
  letter-spacing: 0.02em;
  margin: 16px 0 0;
}
.ac-notice.is-ok {
  color: #35d6d0;
}
.ac-notice.is-bad,
.ac-error {
  color: #d98a8a;
}
.ac-error {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.88rem;
  margin: 14px 0 0;
}
.ac-link {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #4fb3bf !important;
  text-decoration: none;
  white-space: nowrap;
}
.ac-link:hover {
  color: #e7cf95 !important;
}

/* ---- Preferences ------------------------------------------------------- */
.ac-prefs {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 40px;
}
.ac-set {
  flex: 1 1 260px;
  min-width: 0;
}
.ac-set__lbl {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #c8a85c;
  margin-bottom: 8px;
}
.ac-set__help {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #868ca6;
  margin-top: 6px;
}
.ac-minitoggle :deep(.v-btn-toggle) {
  border: 1px solid rgba(255, 255, 255, 0.12);
  overflow: hidden;
}
.ac-minitoggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0;
  border-radius: 0;
  color: #b6bcd0 !important;
  background: transparent !important;
}
.ac-minitoggle :deep(.v-btn.v-btn--active) {
  background: rgba(200, 168, 92, 0.9) !important;
  color: #17130a !important;
}
.ac-switch :deep(.v-label) {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.82rem;
  color: #b6bcd0;
  opacity: 1;
}

/* ---- Privacy ----------------------------------------------------------- */
.ac-privacy {
  font-family: 'Rajdhani', sans-serif;
  color: #868ca6;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 10px;
  max-width: 84ch;
}
.ac-privacy--note {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9aa0b8;
  margin: 0;
}

/* ---- Delete confirm — same voidglass shell as AuthDialog --------------- */
.ac-confirm {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(217, 138, 138, 0.34);
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  color: #eef1f8;
  display: flex;
  flex-direction: column;
}
.ac-confirm__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(217, 138, 138, 0.24);
}
.ac-confirm__node {
  width: 11px;
  height: 11px;
  background: #d98a8a;
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(217, 138, 138, 0.7);
  flex: none;
}
.ac-confirm__headtext {
  flex: 1;
  min-width: 0;
}
.ac-confirm__eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.64rem;
  color: #d98a8a;
}
.ac-confirm__title {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  color: #e7cf95;
  line-height: 1.15;
  margin: 0;
}
.ac-confirm__close {
  background: transparent;
  color: #868ca6;
  flex: none;
}
.ac-confirm__close:hover {
  color: #e7cf95;
}
.ac-confirm__body {
  padding: 18px 20px 4px;
}
.ac-confirm__lede {
  color: #c3c8dc;
  font-size: 0.9rem;
  line-height: 1.55;
  margin: 0 0 12px;
}
.ac-confirm__warn {
  font-family: 'Rajdhani', sans-serif;
  color: #d98a8a;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}
.ac-confirm__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 20px;
}
.ac-toast :deep(.v-snackbar__wrapper) {
  border: 1px solid rgba(200, 168, 92, 0.32);
  border-radius: 0;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.03em;
}

@media (max-width: 600px) {
  .ac-sec {
    padding: 22px 18px;
  }
  .ac-id {
    min-width: 0;
  }
  .ac-btn {
    flex: 1 1 100%;
  }
}
</style>
