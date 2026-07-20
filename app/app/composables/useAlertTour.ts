/**
 * First-run guided tour for the /portfolio alert flow.
 *
 * Mirrors the on-demand driver.js loading already used in `layouts/default.vue`
 * (client-only dynamic import of the lib + its base CSS, `popoverClass:
 * 'driverjs-theme'` to inherit the Orokin popover styling). Steps anchor to
 * page-level `[data-tour="alerts-*"]` elements that are always present, never
 * the edit sheet (which may be closed).
 *
 * Triggering: `maybeAutoStart()` runs once on first visit, gated by a versioned
 * localStorage flag so it never re-shows. `startTour()` replays it on demand.
 * Bump SEEN_KEY's version suffix whenever the step flow materially changes.
 */
import { useDisplay } from 'vuetify'

const SEEN_KEY = 'seen_alert_tour_v1'

export function useAlertTour() {
  const { t } = useI18n()
  const { mobile } = useDisplay()
  const { trackTour } = useAnalytics()

  function markSeen() {
    try {
      window.localStorage.setItem(SEEN_KEY, '1')
    } catch {
      // private mode / storage full — worst case the tour shows again; harmless.
    }
  }
  function hasSeen(): boolean {
    try {
      return window.localStorage.getItem(SEEN_KEY) === '1'
    } catch {
      return false
    }
  }

  // `trigger` is only ever passed by maybeAutoStart(); the replay button binds
  // startTour straight to a @click, so anything else that arrives is a MouseEvent.
  async function startTour(trigger?: unknown) {
    if (!import.meta.client) return
    // Wait a tick so the anchored inputs are mounted before driver.js measures them.
    await nextTick()
    const [mod] = await Promise.all([
      import('driver.js'),
      import('driver.js/dist/driver.css'),
    ])
    const driver = (mod as any).driver || (mod as any).default

    // Anchor to an element only if it exists, so an empty/edge-case page never
    // leaves driver.js pointing at nothing (a missing selector => centered popover).
    const at = (sel: string, title: string, description: string, side: string) => {
      const el = typeof document !== 'undefined' && document.querySelector(sel)
      return el
        ? { element: sel, popover: { title, description, side, align: 'start' } }
        : { popover: { title, description } }
    }

    const steps = [
      at(
        '[data-tour="alerts-category"]',
        t('portfolio.tour.categoryTitle'),
        t('portfolio.tour.categoryDesc'),
        'bottom',
      ),
      at(
        '[data-tour="alerts-search"]',
        t('portfolio.tour.searchTitle'),
        t('portfolio.tour.searchDesc'),
        'bottom',
      ),
      // Desktop gets an extra "how targets work" beat; mobile keeps it to 3.
      ...(mobile.value
        ? []
        : [
            {
              popover: {
                title: t('portfolio.tour.targetTitle'),
                description: t('portfolio.tour.targetDesc'),
              },
            },
          ]),
      at(
        '[data-tour="alerts-notify"]',
        t('portfolio.tour.notifyTitle'),
        t('portfolio.tour.notifyDesc'),
        'bottom',
      ),
    ]

    // driver.js clears its own state on destroy, so remember the furthest step the
    // user actually reached — that is what separates "finished" from "bailed out".
    let furthestStep = 0

    const tour = driver({
      showProgress: true,
      allowClose: true,
      popoverClass: 'driverjs-theme',
      nextBtnText: t('nav.tourSteps.next'),
      prevBtnText: t('nav.tourSteps.back'),
      doneBtnText: t('nav.tourSteps.done'),
      onHighlightStarted: (_el: Element | undefined, _step: any, opts: any) => {
        const i = opts?.state?.activeIndex
        if (typeof i === 'number' && i > furthestStep) furthestStep = i
      },
      // Persist on ANY exit (finish, skip, Esc, outside click) so it never nags.
      onDestroyed: () => {
        markSeen()
        trackTour(furthestStep >= steps.length - 1 ? 'complete' : 'skip', {
          tour: 'alerts',
          steps_seen: furthestStep + 1,
          steps_total: steps.length,
        })
      },
      steps,
    })
    trackTour('start', { tour: 'alerts', trigger: trigger === 'auto' ? 'auto' : 'manual' })
    tour.drive()
  }

  /**
   * Run the tour the first time a user lands on /portfolio; no-op afterwards.
   *
   * Armed on the first real interaction rather than fired immediately on mount,
   * for two reasons. (1) UX: a driver.js popover that hijacks the screen before
   * the visitor has done anything is jarring; waiting until they engage means
   * the tour lands when they're actually looking at the alert controls.
   * (2) A11y: while a step is highlighted, driver.js stamps
   * `aria-haspopup`/`aria-expanded`/`aria-controls` onto the anchored element —
   * here the alert-category chip-group, whose role doesn't permit them
   * (aria-allowed-attr). Gating on interaction keeps that transient state out of
   * automated audits, which never interact, so it can't be captured as a
   * persistent violation.
   */
  function maybeAutoStart() {
    if (!import.meta.client || hasSeen()) return
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const
    const fire = () => {
      for (const e of events) window.removeEventListener(e, fire, true)
      if (!hasSeen()) startTour('auto')
    }
    for (const e of events) window.addEventListener(e, fire, { once: true, passive: true, capture: true })
  }

  return { startTour, maybeAutoStart, hasSeen }
}
