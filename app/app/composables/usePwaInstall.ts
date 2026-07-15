/**
 * PWA install state. Captures the `beforeinstallprompt` event (Chromium) so the
 * app can offer install on its own button/banner, and detects iOS Safari (which
 * never fires that event and needs manual "Add to Home Screen" instructions).
 *
 * SSR-safe: all `window`/`navigator` access happens in onMounted.
 */
export function usePwaInstall() {
  const deferredPrompt = ref<any>(null)
  const canInstall = ref(false)
  const installed = ref(false)
  const isIos = ref(false)
  const isStandalone = ref(false)

  function computeStandalone() {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    )
  }

  const onBeforePrompt = (e: Event) => {
    // Stop Chromium's mini-infobar; we surface our own affordance instead.
    e.preventDefault()
    deferredPrompt.value = e
    canInstall.value = true
  }
  const onInstalled = () => {
    installed.value = true
    canInstall.value = false
    deferredPrompt.value = null
  }

  onMounted(() => {
    const ua = navigator.userAgent || ''
    // iPadOS 13+ reports as Macintosh; detect via touch support.
    isIos.value =
      /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/i.test(ua) && 'ontouchend' in document)
    isStandalone.value = computeStandalone()
    installed.value = isStandalone.value
    window.addEventListener('beforeinstallprompt', onBeforePrompt)
    window.addEventListener('appinstalled', onInstalled)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', onBeforePrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  /** Fire the native install prompt. Returns 'accepted' | 'dismissed' | null. */
  async function promptInstall(): Promise<string | null> {
    const p = deferredPrompt.value
    if (!p) return null
    p.prompt()
    let outcome: string | null = null
    try {
      const choice = await p.userChoice
      outcome = choice?.outcome ?? null
    } catch {
      outcome = null
    }
    deferredPrompt.value = null
    canInstall.value = false
    if (outcome === 'accepted') installed.value = true
    return outcome
  }

  return { canInstall, installed, isIos, isStandalone, promptInstall }
}
