<script setup lang="ts">
// Install affordances for the PWA: an app-bar button plus a one-time bottom
// banner (Chromium), and an "Add to Home Screen" dialog for iOS Safari.
const { canInstall, installed, isIos, isStandalone, promptInstall } = usePwaInstall()

const DISMISS_KEY = 'pwa-install-dismissed'
const iosDialog = ref(false)
// Hidden until onMounted resolves storage + a short delay (avoids SSR flash and
// a banner that slams in on first paint).
const dismissed = ref(true)
const ready = ref(false)

const eligible = computed(
  () => !installed.value && (canInstall.value || (isIos.value && !isStandalone.value)),
)
const showButton = computed(() => eligible.value)
const showBanner = computed(() => ready.value && eligible.value && !dismissed.value)

onMounted(() => {
  try {
    dismissed.value = localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    dismissed.value = false
  }
  // Let the install state settle before the banner may appear.
  setTimeout(() => (ready.value = true), 2500)
})

function onInstallClick() {
  if (canInstall.value) {
    promptInstall()
  } else if (isIos.value) {
    iosDialog.value = true
  }
  dismissed.value = true // hide the banner once acted on (not persisted)
}

function dismiss() {
  dismissed.value = true
  try {
    localStorage.setItem(DISMISS_KEY, '1')
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <!-- App-bar trigger -->
  <v-btn
    v-if="showButton"
    variant="text"
    class="pwa-install-btn mr-1"
    aria-label="Install app"
    @click="onInstallClick"
  >
    <v-icon>mdi-download-outline</v-icon>
    <span class="pwa-install-btn__label d-none d-md-inline">Install</span>
  </v-btn>

  <!-- One-time bottom banner -->
  <Transition name="pwa-banner">
    <div
      v-if="showBanner"
      class="pwa-banner"
      role="dialog"
      aria-label="Install Warframe Market Analytics"
    >
      <span class="pwa-banner__node" aria-hidden="true"></span>
      <div class="pwa-banner__text">
        <strong>Install Warframe Market Analytics</strong>
        <span>Add it to your device — fast, full-screen, offline-ready.</span>
      </div>
      <div class="pwa-banner__actions">
        <button class="pwa-banner__install" @click="onInstallClick">Install</button>
        <button class="pwa-banner__dismiss" @click="dismiss">Not now</button>
      </div>
    </div>
  </Transition>

  <!-- iOS: no beforeinstallprompt event, so show manual steps -->
  <v-dialog v-model="iosDialog" max-width="400">
    <div class="pwa-ios">
      <div class="pwa-ios__head">
        <span class="pwa-banner__node" aria-hidden="true"></span>
        Add to Home Screen
      </div>
      <ol class="pwa-ios__steps">
        <li>
          Tap the <strong>Share</strong> icon
          <v-icon size="18" color="#4fb3bf">mdi-export-variant</v-icon>
          in Safari's toolbar.
        </li>
        <li>
          Choose <strong>Add to Home Screen</strong>
          <v-icon size="18" color="#4fb3bf">mdi-plus-box-outline</v-icon>.
        </li>
        <li>Tap <strong>Add</strong> — it installs like a native app.</li>
      </ol>
      <button class="pwa-ios__close" @click="iosDialog = false">Got it</button>
    </div>
  </v-dialog>
</template>

<style scoped>
/* App-bar button — Orokin gold */
.pwa-install-btn.v-btn {
  color: #c8a85c !important;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  min-width: auto !important;
}
.pwa-install-btn__label {
  margin-left: 6px;
}

/* Bottom banner */
.pwa-banner {
  position: fixed;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 2400;
  display: flex;
  align-items: center;
  gap: 16px;
  width: min(560px, calc(100vw - 24px));
  padding: 14px 18px;
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.4);
  clip-path: polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.6);
}
.pwa-banner__node {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(200, 168, 92, 0.6);
}
.pwa-banner__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}
.pwa-banner__text strong {
  font-family: 'Cinzel', serif;
  font-size: 0.98rem;
  color: #e7cf95;
}
.pwa-banner__text span {
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.84rem;
  color: #9aa0b4;
}
.pwa-banner__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
.pwa-banner__install,
.pwa-banner__dismiss,
.pwa-ios__close {
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 8px 14px;
  border: 1px solid transparent;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.pwa-banner__install,
.pwa-ios__close {
  background: #c8a85c;
  color: #17130a;
}
.pwa-banner__install:hover,
.pwa-ios__close:hover {
  background: #e7cf95;
}
.pwa-banner__dismiss {
  background: transparent;
  color: #9aa0b4;
  border-color: rgba(200, 168, 92, 0.3);
}
.pwa-banner__dismiss:hover {
  color: #e7cf95;
  border-color: rgba(200, 168, 92, 0.55);
}

/* iOS dialog */
.pwa-ios {
  background: linear-gradient(180deg, #14162a 0%, #0c0d18 100%);
  border: 1px solid rgba(200, 168, 92, 0.4);
  padding: 22px 24px;
  color: #dfe3f0;
}
.pwa-ios__head {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: 'Cinzel', serif;
  font-size: 1.15rem;
  color: #e7cf95;
  margin-bottom: 14px;
}
.pwa-ios__steps {
  margin: 0 0 18px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: 'Rajdhani', sans-serif;
  font-size: 0.98rem;
  color: #c3c8dc;
  line-height: 1.4;
}
.pwa-ios__steps strong {
  color: #e7cf95;
}
.pwa-ios__close {
  width: 100%;
  border: none;
}

/* Banner transition */
.pwa-banner-enter-active,
.pwa-banner-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.pwa-banner-enter-from,
.pwa-banner-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}

@media (max-width: 560px) {
  .pwa-banner {
    flex-wrap: wrap;
    gap: 10px 12px;
    bottom: 12px;
  }
  .pwa-banner__actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
