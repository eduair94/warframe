// Drives the global #spinner-wrapper overlay (rendered by <LoadingBar/> in
// app.vue) on client-side navigation — the Nuxt 4 replacement for the old
// Nuxt 2 `loading` component. The old app showed the overlay on every route
// change so sidebar clicks (even to a cached chunk) gave feedback; pages then
// dismiss it in their own onMounted. Here `page:start` shows it and each page
// hides it on mount, with a `page:finish` backstop and a safety timeout so it
// can never get stuck.
export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const el = () => document.getElementById('spinner-wrapper')
  const show = () => {
    const e = el()
    if (e) e.style.display = 'flex'
  }
  const hide = () => {
    const e = el()
    if (e) e.style.display = 'none'
  }

  let shownAt = 0
  let safety: ReturnType<typeof setTimeout> | null = null
  let hideTimer: ReturnType<typeof setTimeout> | null = null

  nuxtApp.hook('page:start', () => {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    shownAt = Date.now()
    show()
    // Never let the overlay get stuck if a page never hides it.
    if (safety) clearTimeout(safety)
    safety = setTimeout(hide, 15000)
  })

  const finish = () => {
    if (safety) {
      clearTimeout(safety)
      safety = null
    }
    // Keep it visible a minimum time so instant/cached transitions read as a
    // deliberate loading state instead of a flash. Pages that finish sooner
    // (their onMounted hide) win — that's the correct content-ready timing.
    const MIN_VISIBLE = 350
    const elapsed = Date.now() - shownAt
    if (hideTimer) clearTimeout(hideTimer)
    hideTimer = setTimeout(hide, Math.max(0, MIN_VISIBLE - elapsed))
  }

  nuxtApp.hook('page:finish', finish)
})
