<!--
  Browser-language suggestion banner. Auto-redirect stays DISABLED
  (detectBrowserLanguage:false in nuxt.config) so `/` renders the default locale
  deterministically and stays edge-cacheable. Instead, this CLIENT-ONLY component
  detects the visitor's browser language after hydration and, if it maps to a
  supported locale different from the current one, offers a one-tap switch. The
  prompt is shown in the DETECTED language. The choice (switch OR dismiss) is
  remembered in a cookie so we never nag again.

  Client-only (.client.vue): navigator isn't available on the server, and keeping
  it out of SSR means no per-visitor banner is ever baked into cached HTML.
-->
<template>
  <v-snackbar
    v-model="show"
    location="bottom"
    :timeout="-1"
    color="#12142a"
    min-height="68"
    class="locale-suggest"
    :aria-label="ariaText"
  >
    <span class="locale-suggest__text">{{ promptText }}</span>
    <template #actions>
      <v-btn variant="text" color="#9aa0b4" @click="decline">{{ dismissText }}</v-btn>
      <v-btn variant="flat" color="#d4af5a" class="ml-2" @click="accept">{{ switchText }}</v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const { trackAction } = useAnalytics()

// Remembers the visitor's language decision (a locale code) for a year, so the
// banner asks at most once. Written on both accept and dismiss.
const pref = useCookie<string | null>('wf_locale_pref', {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: 'lax',
  path: '/',
})

const show = ref(false)
const target = ref('')
const targetName = ref('')

/** Map a browser language tag list to a supported locale code (or ''). */
function mapNavToLocale(codes: readonly string[]): string {
  const supported = locales.value.map((l: any) => l.code)
  for (const raw of codes) {
    const low = (raw || '').toLowerCase()
    if (!low) continue
    // Chinese needs script disambiguation (Simplified vs Traditional).
    if (low.startsWith('zh')) {
      if (/(hant|tw|hk|mo)/.test(low)) return supported.includes('zh-hant') ? 'zh-hant' : ''
      return supported.includes('zh-hans') ? 'zh-hans' : ''
    }
    if (supported.includes(low)) return low
    const primary = low.split('-')[0]
    if (supported.includes(primary)) return primary
  }
  return ''
}

const promptText = computed(() =>
  t('localeSuggest.prompt', { lang: targetName.value }, { locale: target.value || 'en' }),
)
const switchText = computed(() =>
  t('localeSuggest.switch', { lang: targetName.value }, { locale: target.value || 'en' }),
)
const dismissText = computed(() =>
  t('localeSuggest.dismiss', {}, { locale: target.value || 'en' }),
)
const ariaText = computed(() =>
  t('localeSuggest.aria', {}, { locale: target.value || 'en' }),
)

onMounted(() => {
  // Already decided (switched or dismissed) — never ask again.
  if (pref.value) return
  const navs =
    (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language]) || []
  const detected = mapNavToLocale(navs)
  if (!detected || detected === locale.value) return
  const lo = locales.value.find((l: any) => l.code === detected)
  target.value = detected
  targetName.value = (lo as any)?.name || detected
  show.value = true
  // Impression is tracked too: accept/dismiss are only readable against how
  // often the banner actually appeared.
  trackAction('locale_suggestion_shown', { detected })
})

function accept() {
  trackAction('locale_suggestion_accept', { detected: target.value })
  pref.value = target.value
  const path = switchLocalePath(target.value as any)
  show.value = false
  if (path) navigateTo(path)
}

function decline() {
  trackAction('locale_suggestion_dismiss', { detected: target.value })
  // Remember they want the current locale so the banner stays quiet.
  pref.value = locale.value
  show.value = false
}
</script>

<style scoped>
.locale-suggest__text {
  font-family: 'Rajdhani', sans-serif;
  font-size: 1rem;
  color: #eef1f8;
}
</style>
