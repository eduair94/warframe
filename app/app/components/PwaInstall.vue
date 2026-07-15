<script setup lang="ts">
// Non-invasive install affordance for the PWA: a single app-bar button.
// Chromium prompts inline via the captured beforeinstallprompt; iOS Safari has
// no such event, so it opens a small "Add to Home Screen" steps dialog on tap.
// No auto-showing banner — the button is the only entry point.
const { canInstall, installed, isIos, isStandalone, promptInstall } = usePwaInstall()

const iosDialog = ref(false)

const showButton = computed(
  () => !installed.value && (canInstall.value || (isIos.value && !isStandalone.value)),
)

function onInstallClick() {
  if (canInstall.value) promptInstall()
  else if (isIos.value) iosDialog.value = true
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
    aria-label="Install app"
    title="Install app"
    @click="onInstallClick"
  >
    <v-icon>mdi-download-outline</v-icon>
  </v-btn>

  <!-- iOS: no beforeinstallprompt event, so show manual steps on demand -->
  <v-dialog v-model="iosDialog" max-width="380">
    <div class="pwa-ios">
      <div class="pwa-ios__head">
        <span class="pwa-ios__node" aria-hidden="true"></span>
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
