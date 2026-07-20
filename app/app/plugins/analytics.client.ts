/**
 * Global GA4 instrumentation that must not be duplicated per page:
 *
 *  1. `page_view` on the first render AND on every SPA route change. This is
 *     the important one: nuxt-gtag v3 has no router integration and the tag's
 *     own automatic page_view only fires on the hard page load, so before this
 *     plugin every client-side navigation on the site was invisible to GA4 —
 *     a 30+ page SPA was being reported as a handful of landing pages. The GA4
 *     tag is configured with `send_page_view: false` (nuxt.config.ts) so this
 *     is the single source of page views.
 *  2. `outbound_click` via one delegated listener, instead of touching the ~60
 *     anchors that leave for warframe.market / the wiki / drop tables / tools.
 *  3. `scroll_depth` (25/50/75/90), reset per route — the engagement signal GA4
 *     "enhanced measurement" would give us if it worked on SPA views.
 *  4. `exception` from Vue errors and unhandled rejections.
 *  5. `web_vitals` (LCP / CLS / INP) — real field performance per page.
 *  6. Sticky user properties (locale, display mode, PWA) so every report can be
 *     segmented by them.
 *
 * All of it is client-only, listener-passive and wrapped so that no analytics
 * failure can ever break navigation or a click.
 */
import { toolFromPath, trackEvent, setUserProperties, flushPendingEvents } from '~/composables/useAnalytics'

/** Outbound hosts we care enough about to label instead of lumping as "other". */
const DOMAIN_LABELS: Array<[RegExp, string]> = [
  [/(^|\.)warframe\.market$/i, 'warframe_market'],
  [/(^|\.)warframe\.fandom\.com$/i, 'wiki'],
  [/(^|\.)wiki\.warframe\.com$/i, 'wiki'],
  [/(^|\.)warframestat\.us$/i, 'drop_tables'],
  [/(^|\.)(youtube|youtube-nocookie|youtu)\.(com|be)$/i, 'youtube'],
  [/(^|\.)github\.com$/i, 'github'],
  [/(^|\.)reddit\.com$/i, 'reddit'],
  [/(^|\.)ko-fi\.com$/i, 'donation'],
  [/(^|\.)mpago\.la$/i, 'donation'],
  [/(^|\.)mercadopago\.[a-z.]+$/i, 'donation'],
  [/(^|\.)linkedin\.com$/i, 'social'],
  [/(^|\.)(twitter|x)\.com$/i, 'social'],
  [/(^|\.)discord\.(gg|com)$/i, 'social']
]

function labelFor(host: string): string {
  for (const [pattern, label] of DOMAIN_LABELS) if (pattern.test(host)) return label
  return 'external_tool'
}

export default defineNuxtPlugin((nuxtApp) => {
  if (!import.meta.client) return

  const router = useRouter()

  // ---- 0. lazy gtag.js boot -------------------------------------------------
  // The tag is configured `initMode: 'manual'` so nothing third-party runs while
  // the app hydrates: gtag.js is ~160 KB to fetch, parse and execute, and it was
  // the single largest item in Total Blocking Time — a cost paid on the main
  // thread, during the exact window in which the page is supposed to become
  // usable, for a script the visitor gains nothing from.
  //
  // It boots on the FIRST real interaction — a tap, a key, a scroll — which is
  // both the moment the visitor has actually engaged and the moment the main
  // thread is provably free. A long timer is the backstop for genuinely passive
  // sessions (a page left open, read without scrolling).
  //
  // Nothing is lost by waiting: useAnalytics buffers every event (including the
  // initial page_view) and flushPendingEvents replays the queue into dataLayer
  // as soon as the tag is up.
  const PASSIVE_BOOT_DELAY = 10_000
  const INTERACTION_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
  let gtagBooted = false
  const bootGtag = () => {
    if (gtagBooted) return
    gtagBooted = true
    for (const type of INTERACTION_EVENTS) window.removeEventListener(type, bootGtag, true)
    try {
      useGtag().initialize()
      flushPendingEvents()
    } catch {
      // A blocked or failed tag must never surface to the user.
    }
  }
  for (const type of INTERACTION_EVENTS) {
    window.addEventListener(type, bootGtag, { passive: true, capture: true })
  }
  nuxtApp.hook('app:mounted', () => {
    setTimeout(bootGtag, PASSIVE_BOOT_DELAY)
  })

  const config = useRuntimeConfig().public.gtag as { tags?: Array<{ id?: string } | string> }
  // page_view is routed to the GA4 property only: the Google Ads tag fires its
  // own on load and does not need one hit per SPA navigation.
  const rawTags = (config?.tags ?? []) as Array<{ id?: string } | string>
  const gaId = rawTags
    .map((t) => (typeof t === 'string' ? t : t?.id))
    .find((id): id is string => !!id && id.startsWith('G-'))

  // ---- 1. page_view ---------------------------------------------------------
  let lastPath = ''
  const sendPageView = (path: string) => {
    if (path === lastPath) return // guard against replace()/query-only churn double-firing
    lastPath = path
    trackEvent('page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
      tool: toolFromPath(path),
      locale: String((nuxtApp as any).$i18n?.locale?.value ?? ''),
      send_to: gaId
    })
  }

  // ---- 3. scroll depth ------------------------------------------------------
  const THRESHOLDS = [25, 50, 75, 90]
  let fired = new Set<number>()
  let scrollQueued = false
  const onScroll = () => {
    if (scrollQueued) return
    scrollQueued = true
    requestAnimationFrame(() => {
      scrollQueued = false
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable < 400) return // short pages: a "90% scroll" there means nothing
      const pct = ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100
      for (const t of THRESHOLDS) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t)
          trackEvent('scroll_depth', {
            percent_scrolled: t,
            page_path: router.currentRoute.value.path,
            tool: toolFromPath(router.currentRoute.value.path)
          })
        }
      }
    })
  }

  // Fires after the page component is mounted, so document.title is the new
  // page's (useHead has flushed) rather than the previous route's.
  nuxtApp.hook('page:finish', () => {
    const path = router.currentRoute.value.path
    fired = new Set()
    // One frame of slack for title/meta updates that land after page:finish.
    requestAnimationFrame(() => sendPageView(path))
  })

  // ---- 2. outbound clicks ---------------------------------------------------
  const onClick = (e: MouseEvent) => {
    try {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') || ''
      if (!/^https?:/i.test(href)) return
      const url = new URL(href, window.location.href)
      if (url.host === window.location.host) return
      const path = router.currentRoute.value.path
      trackEvent('outbound_click', {
        link_url: url.href,
        link_domain: url.host,
        link_target: labelFor(url.host),
        link_text: (anchor.textContent || anchor.getAttribute('aria-label') || '').trim().slice(0, 80),
        page_path: path,
        tool: toolFromPath(path)
      })
    } catch {
      // Never let tracking swallow or break a real navigation.
    }
  }

  // ---- 4. errors ------------------------------------------------------------
  const trackException = (description: string, fatal = false) =>
    trackEvent('exception', {
      description: description.slice(0, 100),
      fatal,
      page_path: router.currentRoute.value.path
    })

  nuxtApp.hook('vue:error', (err: any) => trackException(`vue: ${err?.message ?? err}`))
  nuxtApp.hook('app:error', (err: any) => trackException(`app: ${err?.message ?? err}`, true))
  const onRejection = (e: PromiseRejectionEvent) =>
    trackException(`unhandled: ${e.reason?.message ?? e.reason}`)

  // ---- 6. user properties ---------------------------------------------------
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true
  setUserProperties({
    app_locale: String((nuxtApp as any).$i18n?.locale?.value ?? 'en'),
    display_mode: standalone ? 'standalone' : 'browser',
    // Coarse device class — GA4's own device dimension is UA-based and does not
    // know about the mobile-card vs desktop-table split this app renders.
    viewport_class: window.innerWidth < 600 ? 'mobile' : window.innerWidth < 1280 ? 'tablet' : 'desktop'
  })

  // ---- 5. web vitals --------------------------------------------------------
  // Minimal in-house reporter (no web-vitals dependency): LCP and CLS are
  // reported once at page hide, INP is approximated by the worst event latency.
  // Values land in GA4 as `web_vitals` events with `metric_name`/`metric_value`,
  // which is enough to spot a page that regresses.
  const vitals = { lcp: 0, cls: 0, inp: 0 }
  const observers: PerformanceObserver[] = []
  const observe = (type: string, cb: (entries: PerformanceEntryList) => void, extra: any = {}) => {
    try {
      const po = new PerformanceObserver((list) => cb(list.getEntries()))
      po.observe({ type, buffered: true, ...extra })
      observers.push(po)
    } catch {
      // Unsupported entry type (Safari/Firefox for some of these) — skip it.
    }
  }
  observe('largest-contentful-paint', (entries) => {
    const last = entries[entries.length - 1] as any
    if (last) vitals.lcp = last.startTime
  })
  observe('layout-shift', (entries) => {
    for (const entry of entries as any[]) if (!entry.hadRecentInput) vitals.cls += entry.value
  })
  observe('event', (entries) => {
    for (const entry of entries as any[]) vitals.inp = Math.max(vitals.inp, entry.duration || 0)
  }, { durationThreshold: 40 })

  let vitalsSent = false
  const flushVitals = () => {
    if (vitalsSent) return
    vitalsSent = true
    const path = router.currentRoute.value.path
    const report = (name: string, value: number, good: number, poor: number) => {
      if (!value) return
      trackEvent('web_vitals', {
        metric_name: name,
        metric_value: Math.round(value * (name === 'CLS' ? 1000 : 1)) / (name === 'CLS' ? 1000 : 1),
        metric_rating: value <= good ? 'good' : value <= poor ? 'needs_improvement' : 'poor',
        page_path: path,
        tool: toolFromPath(path)
      })
    }
    report('LCP', vitals.lcp, 2500, 4000)
    report('CLS', vitals.cls, 0.1, 0.25)
    report('INP', vitals.inp, 200, 500)
  }
  // `visibilitychange` is the only reliable "page is going away" signal on
  // mobile; `pagehide` covers bfcache/Safari.
  const onHide = () => {
    if (document.visibilityState === 'hidden') flushVitals()
  }

  document.addEventListener('click', onClick, { capture: true, passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('unhandledrejection', onRejection)
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', flushVitals)

  // First view: `page:finish` does not fire for the SSR-hydrated initial route.
  nuxtApp.hook('app:mounted', () => {
    requestAnimationFrame(() => sendPageView(router.currentRoute.value.path))
  })
})
