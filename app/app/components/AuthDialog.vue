<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    content-class="auth-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="auth">
      <header class="auth__head">
        <span class="auth__node" aria-hidden="true"></span>
        <div class="auth__headtext">
          <div class="auth__eyebrow">{{ t('auth.eyebrow') }}</div>
          <h2 class="auth__title">{{ t('auth.title') }}</h2>
        </div>
        <button class="auth__close" :aria-label="t('auth.close')" @click="close">
          <v-icon>mdi-close</v-icon>
        </button>
      </header>

      <div class="auth__body">
        <p class="auth__lede">{{ t('auth.lede') }}</p>

        <!-- Accounts not configured for this deployment: say so plainly rather
             than showing controls that can only fail. -->
        <div v-if="!auth.configured" class="auth__state">
          <v-icon size="20" color="#8f95ab">mdi-cloud-off-outline</v-icon>
          <span>{{ t('auth.notConfigured') }}</span>
        </div>

        <template v-else-if="sent">
          <div class="auth__sent">
            <v-icon size="34" color="#35d6d0">mdi-email-fast-outline</v-icon>
            <div class="auth__sent-title">{{ t('auth.sentTitle') }}</div>
            <p class="auth__sent-body">{{ t('auth.sentBody', { email: auth.pendingEmail || email }) }}</p>
            <button class="auth__ghost" @click="sent = false">{{ t('auth.useAnother') }}</button>
          </div>
        </template>

        <template v-else>
          <button class="auth__google" :disabled="auth.busy" @click="onGoogle">
            <svg class="auth__glogo" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.5 5.8c4.4-4 7-10 7-17.3z" />
              <path fill="#FBBC05" d="M10.4 28.7a14.7 14.7 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.4 0-11.7-3.7-13.6-8.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            <span>{{ t('auth.google') }}</span>
          </button>

          <div class="auth__or"><span>{{ t('auth.or') }}</span></div>

          <form class="auth__form" @submit.prevent="onMagic">
            <v-text-field
              v-model="email"
              type="email"
              autocomplete="email"
              density="compact"
              variant="outlined"
              hide-details
              :disabled="auth.busy"
              :label="t('auth.emailLabel')"
              prepend-inner-icon="mdi-email-outline"
            ></v-text-field>
            <button class="auth__primary" type="submit" :disabled="auth.busy || !email">
              <v-progress-circular v-if="auth.busy" indeterminate size="16" width="2" />
              <span v-else>{{ t('auth.sendLink') }}</span>
            </button>
            <p class="auth__hint">{{ t('auth.magicHint') }}</p>
          </form>
        </template>

        <p v-if="errorText" class="auth__error">{{ errorText }}</p>
      </div>

      <footer class="auth__foot">
        <v-icon size="15" color="#8f95ab">mdi-shield-lock-outline</v-icon>
        <span>{{ t('auth.privacy') }}</span>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * Sign-in dialog: Google, or a passwordless email "magic link".
 *
 * The dialog does NOT load Firebase on mount — the auth store imports the SDK
 * on the first real sign-in attempt, so opening this dialog costs nothing until
 * the user actually commits.
 */
const props = withDefaults(defineProps<{ modelValue?: boolean }>(), { modelValue: false })
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'signed-in'): void
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const { trackAction } = useAnalytics()

const email = ref('')
const sent = ref(false)

const errorText = computed(() => {
  if (!auth.error || auth.error === 'cancelled') return ''
  // Known codes get real copy; anything else falls back to the generic line.
  const known = ['invalid-email', 'unauthorized-domain', 'expired-link', 'network']
  return known.includes(auth.error)
    ? t(`auth.errors.${auth.error}`)
    : t('auth.errors.generic')
})

function close() {
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      auth.clearError()
      auth.detect()
      sent.value = false
    }
  }
)

async function onGoogle() {
  trackAction('auth_signin_attempt', { method: 'google' })
  const res = await auth.signInGoogle()
  if (res === 'signed-in') {
    trackAction('auth_signin_success', { method: 'google' })
    emit('signed-in')
    close()
  }
}

async function onMagic() {
  trackAction('auth_signin_attempt', { method: 'magic_link' })
  const res = await auth.sendMagicLink(email.value, localePath('/account'))
  if (res === 'sent') {
    sent.value = true
    trackAction('auth_magic_link_sent')
  }
}
</script>

<style scoped>
/* Orokin voidglass shell — same construction as DropLocationsDialog. */
.auth {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.32);
  clip-path: polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px);
  color: #eef1f8;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}
.auth__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(200, 168, 92, 0.22);
}
.auth__node {
  width: 11px;
  height: 11px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 12px rgba(200, 168, 92, 0.7);
  flex: none;
}
.auth__headtext {
  flex: 1;
  min-width: 0;
}
.auth__eyebrow {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.64rem;
  color: #8f95ab;
}
.auth__title {
  font-family: 'Cinzel', serif;
  font-size: 1.24rem;
  color: #e7cf95;
  line-height: 1.15;
  margin: 0;
}
.auth__close {
  background: transparent;
  color: #8f95ab;
  flex: none;
}
.auth__close:hover {
  color: #e7cf95;
}
.auth__body {
  padding: 18px 20px 6px;
  overflow-y: auto;
}
.auth__lede {
  color: #c3c8dc;
  font-size: 0.9rem;
  line-height: 1.55;
  margin: 0 0 18px;
}
.auth__state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  color: #9aa0b8;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.94rem;
}
.auth__google,
.auth__primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 46px;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.92rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
}
.auth__google {
  background: #ffffff;
  color: #1f1f2f;
  border: none;
}
.auth__google:hover:not(:disabled) {
  background: #e9edf5;
}
.auth__glogo {
  width: 19px;
  height: 19px;
  flex: none;
}
.auth__primary {
  background: #c8a85c;
  color: #17130a;
  border: none;
  margin-top: 12px;
}
.auth__primary:hover:not(:disabled) {
  background: #e7cf95;
}
.auth__google:disabled,
.auth__primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth__or {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 16px;
  color: #6f7593;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.66rem;
}
.auth__or::before,
.auth__or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(200, 168, 92, 0.2);
}
.auth__hint {
  color: #8f95ab;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.8rem;
  margin: 10px 0 0;
  line-height: 1.5;
}
.auth__sent {
  text-align: center;
  padding: 10px 0 4px;
}
.auth__sent-title {
  font-family: 'Cinzel', serif;
  color: #e7cf95;
  font-size: 1.05rem;
  margin: 10px 0 6px;
}
.auth__sent-body {
  color: #c3c8dc;
  font-size: 0.9rem;
  line-height: 1.55;
  margin: 0 0 14px;
  word-break: break-word;
}
.auth__ghost {
  background: transparent;
  border: 1px solid rgba(200, 168, 92, 0.4);
  color: #c8a85c;
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
  padding: 7px 14px;
  cursor: pointer;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.auth__ghost:hover {
  background: rgba(200, 168, 92, 0.14);
}
.auth__error {
  color: #d98a8a;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.86rem;
  margin: 14px 0 0;
}
.auth__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  margin-top: 10px;
  border-top: 1px solid rgba(200, 168, 92, 0.22);
  color: #8f95ab;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.76rem;
  line-height: 1.4;
}
</style>
