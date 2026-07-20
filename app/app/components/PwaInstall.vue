<script setup lang="ts">
// Non-invasive install affordance for the PWA: a single app-bar button.
// Chromium prompts inline via the captured beforeinstallprompt; iOS Safari has
// no such event, so it opens a small "Add to Home Screen" steps dialog on tap.
// No auto-showing banner — the button is the only entry point.
const { t } = useI18n()
const { canInstall, installed, isIos, isStandalone, promptInstall } = usePwaInstall()
const { trackPwa } = useAnalytics()

const iosDialog = ref(false)

const showButton = computed(
  () => !installed.value && (canInstall.value || (isIos.value && !isStandalone.value)),
)

async function onInstallClick() {
  if (canInstall.value) {
    trackPwa('prompt', { platform: 'chromium' })
    // The native dialog's outcome is the only install signal Chromium gives us
    // (appinstalled can fire much later, or never if the user dismisses).
    const outcome = await promptInstall()
    if (outcome === 'accepted' || outcome === 'dismissed') trackPwa(outcome)
  } else if (isIos.value) {
    // One event for one click: `pwa_prompt` is deliberately NOT fired here.
    // iOS has no native prompt, so it could never be followed by
    // pwa_accepted/pwa_dismissed and would silently deflate the
    // prompt -> install rate. `pwa_ios_hint` IS the iOS install-intent signal.
    trackPwa('ios_hint', { platform: 'ios' })
    iosDialog.value = true
  }
}
</script>

<template>
  <!-- App-bar trigger (icon-only until wide screens to keep the bar tidy) -->
  <v-btn
    v-if="showButton"
    icon
    size="small"
    variant="text"
    class="pwa-install-btn"
    :aria-label="t('components.pwa.installApp')"
    :title="t('components.pwa.installApp')"
    @click="onInstallClick"
  >
    <v-icon>mdi-download-outline</v-icon>
  </v-btn>

  <!-- iOS: no beforeinstallprompt event, so show manual steps on demand -->
  <v-dialog v-model="iosDialog" max-width="380">
    <div class="pwa-ios">
      <div class="pwa-ios__head">
        <span class="pwa-ios__node" aria-hidden="true"></span>
        {{ t('components.pwa.addToHome') }}
      </div>
      <ol class="pwa-ios__steps">
        <li>
          <i18n-t keypath="components.pwa.step1" tag="span">
            <template #share><strong>{{ t('components.pwa.shareLabel') }}</strong></template>
            <template #icon><v-icon size="18" color="#4fb3bf">mdi-export-variant</v-icon></template>
          </i18n-t>
        </li>
        <li>
          <i18n-t keypath="components.pwa.step2" tag="span">
            <template #add><strong>{{ t('components.pwa.addToHome') }}</strong></template>
            <template #icon><v-icon size="18" color="#4fb3bf">mdi-plus-box-outline</v-icon></template>
          </i18n-t>
        </li>
        <li>
          <i18n-t keypath="components.pwa.step3" tag="span">
            <template #add><strong>{{ t('components.pwa.addLabel') }}</strong></template>
          </i18n-t>
        </li>
      </ol>
      <button class="pwa-ios__close" @click="iosDialog = false">{{ t('components.pwa.gotIt') }}</button>
    </div>
  </v-dialog>
</template>

<style scoped>
/* App-bar button — Orokin gold, compact so it never crowds the header. */
.pwa-install-btn.v-btn {
  color: #c8a85c !important;
  flex: 0 0 auto;
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
.pwa-ios__node {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  background: #c8a85c;
  transform: rotate(45deg);
  box-shadow: 0 0 10px rgba(200, 168, 92, 0.6);
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
  font-family: 'Rajdhani', sans-serif;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 10px 14px;
  background: #c8a85c;
  color: #17130a;
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);
}
.pwa-ios__close:hover {
  background: #e7cf95;
}
</style>
