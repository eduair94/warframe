/**
 * GA4 event layer.
 *
 * Everything the app reports to Google Analytics goes through here, so the
 * event names and parameter shapes live in ONE place instead of being spelled
 * out (and mistyped) at 40 call sites. `docs/analytics.md` documents every
 * event and which parameters must be registered as GA4 custom dimensions to be
 * usable in reports.
 *
 * Why not call nuxt-gtag's `useTrackEvent()` directly?
 *  1. It resolves `useRuntimeConfig()` on every call, so it can only run inside
 *     a Nuxt context — most of our tracking happens in async callbacks (fetch
 *     `.then`, dialog callbacks, `setTimeout`) where that context is gone and
 *     `useRuntimeConfig()` throws. Pushing to `window.dataLayer` ourselves is
 *     context-free and cannot break the feature it is measuring.
 *  2. GA4 silently drops events with malformed params (>25 params, >100-char
 *     values, NaN, nested objects). `sanitize()` below normalizes before send.
 *
 * SSR-safe: every function is a no-op on the server and when the tag never
 * loaded (ad blockers, consent tooling), so tracking can never break a render
 * or a click handler.
 */

/** GA4 hard limits (https://support.google.com/analytics/answer/9267744). */
const MAX_EVENT_NAME = 40
const MAX_PARAM_NAME = 40
const MAX_PARAM_VALUE = 100
const MAX_PARAMS = 25

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>

/**
 * Events recorded before gtag.js has booted.
 *
 * gtag.js is loaded lazily (nuxt.config `gtag.initMode: 'manual'` + the idle /
 * first-interaction boot in plugins/analytics.client.ts) because it was the
 * single largest contributor to Total Blocking Time. Until it boots there is no
 * `window.dataLayer` to push to, and the first `page_view` — the most important
 * hit on the page — happens well before that. So it is buffered here and
 * replayed by `flushPendingEvents()` the moment the tag comes up.
 *
 * Capped: if the tag never loads at all (ad blocker, consent tooling, offline)
 * this must not grow for the lifetime of the tab.
 */
const MAX_PENDING = 50
const pending: IArguments[] = []

/**
 * gtag's transport. Must be a `function` (not an arrow) — gtag.js reads the
 * live `arguments` object off the pushed value, so a spread array would be
 * ignored. Same trick nuxt-gtag uses internally.
 */
function gtag(..._args: any[]) {
  // eslint-disable-next-line prefer-rest-params
  const args = arguments
  const dataLayer = (window as any).dataLayer
  if (dataLayer) dataLayer.push(args)
  else if (pending.length < MAX_PENDING) pending.push(args)
}

/**
 * Replays everything recorded before gtag.js booted. Called once by
 * plugins/analytics.client.ts, immediately after the tag is initialized (so the
 * `js` + `config` commands nuxt-gtag queues are already in front of them).
 */
export function flushPendingEvents() {
  const dataLayer = (window as any).dataLayer
  if (!dataLayer) return
  while (pending.length) dataLayer.push(pending.shift()!)
}

/** Drop empty values, flatten to primitives, clamp to GA4's limits. */
function sanitize(params: AnalyticsParams = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  let count = 0
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (rawValue === null || rawValue === undefined || rawValue === '') continue
    if (typeof rawValue === 'number' && !Number.isFinite(rawValue)) continue
    if (count >= MAX_PARAMS) break
    const key = rawKey.slice(0, MAX_PARAM_NAME)
    if (typeof rawValue === 'number') {
      // Keep 2 decimals: GA4 stores numbers as doubles but reports read far
      // better without 12 decimal places of float noise.
      out[key] = Math.round(rawValue * 100) / 100
    } else if (typeof rawValue === 'boolean') {
      out[key] = rawValue
    } else {
      out[key] = String(rawValue).slice(0, MAX_PARAM_VALUE)
    }
    count++
  }
  return out
}

/**
 * Send one GA4 event. Safe to call from anywhere, at any time — before the tag
 * has loaded the command queues in `dataLayer` and flushes on load.
 */
export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!import.meta.client) return
  if (!(window as any).dataLayer) return
  gtag('event', name.slice(0, MAX_EVENT_NAME), sanitize(params))
}

/** Set sticky user properties (available as GA4 user-scoped dimensions). */
export function setUserProperties(props: AnalyticsParams) {
  if (!import.meta.client) return
  if (!(window as any).dataLayer) return
  gtag('set', 'user_properties', sanitize(props))
}

/**
 * The "tool" a hit belongs to — the first path segment with the i18n locale
 * prefix stripped (`/es/flip` → `flip`, `/set/ash-prime-set` → `set`, `/` →
 * `home`). Every event carries it so GA4 can slice ANY interaction by tool
 * without needing a separate event name per page.
 */
export function toolFromPath(path: string): string {
  const segments = path.split('?')[0]!.split('#')[0]!.split('/').filter(Boolean)
  // i18n uses `prefix_except_default`, so a leading 2-5 char locale code
  // ('es', 'pt', 'zh-hans') is a prefix, not the tool.
  if (segments.length && /^[a-z]{2}(-[a-z]+)?$/i.test(segments[0]!) && segments[0]!.length <= 7) {
    const KNOWN_TOOLS = new Set(['set', 'relic', 'live', 'faq'])
    if (!KNOWN_TOOLS.has(segments[0]!.toLowerCase())) segments.shift()
  }
  return segments[0]?.toLowerCase() || 'home'
}

/**
 * Typed helpers for the interactions worth measuring. Grouped by what question
 * they answer in GA4:
 *  - acquisition/engagement: page_view (plugin), scroll_depth, share, donate
 *  - tool usage: search, filter_apply, sort_change, calc_run, tool_action
 *  - item funnel: select_item -> view_item -> market_open / trade_message_copy
 *  - retention features: watchlist_*, alert_*, push_*, pwa_*, tour_*
 */
export function useAnalytics() {
  const route = useRoute()
  const tool = () => toolFromPath(route.path)

  return {
    /** Escape hatch for one-off events; prefer a named helper below. */
    track: (name: string, params: AnalyticsParams = {}) =>
      trackEvent(name, { tool: tool(), ...params }),

    /** GA4 recommended `search`. `results` powers "searches with no results". */
    trackSearch: (term: string, results?: number, extra: AnalyticsParams = {}) =>
      trackEvent('search', {
        tool: tool(),
        search_term: term,
        results_count: results,
        has_results: results === undefined ? undefined : results > 0,
        ...extra
      }),

    /** A row/card was clicked in a list — the top of the item funnel. */
    trackSelectItem: (item: string, extra: AnalyticsParams = {}) =>
      trackEvent('select_item', { tool: tool(), item_name: item, ...extra }),

    /** A single item's detail was rendered (dedicated page or dialog). */
    trackViewItem: (item: string, extra: AnalyticsParams = {}) =>
      trackEvent('view_item', { tool: tool(), item_name: item, ...extra }),

    /** Filter/toggle/threshold change. One event, filter name as a param. */
    trackFilter: (name: string, value: string | number | boolean, extra: AnalyticsParams = {}) =>
      trackEvent('filter_apply', { tool: tool(), filter_name: name, filter_value: value, ...extra }),

    /** Column sort change on any of the ledger tables. */
    trackSort: (by: string, dir?: string) =>
      trackEvent('sort_change', { tool: tool(), sort_by: by, sort_dir: dir }),

    /** A calculator/estimator produced a result (endo, ducats, relic EV, set). */
    trackCalc: (kind: string, extra: AnalyticsParams = {}) =>
      trackEvent('calc_run', { tool: tool(), calc_kind: kind, ...extra }),

    /** Any other page-specific action worth a funnel step. */
    trackAction: (action: string, extra: AnalyticsParams = {}) =>
      trackEvent('tool_action', { tool: tool(), action, ...extra }),

    /** Dialog/sheet opened (drop locations, relic details, guide, order book). */
    trackDialog: (dialog: string, extra: AnalyticsParams = {}) =>
      trackEvent('dialog_open', { tool: tool(), dialog, ...extra }),

    /**
     * The site's real conversion: the user leaves for warframe.market to act on
     * a price we surfaced. Tracked separately from generic outbound clicks.
     */
    trackMarketOpen: (item: string, extra: AnalyticsParams = {}) =>
      trackEvent('market_open', { tool: tool(), item_name: item, ...extra }),

    /** In-game trade message copied to clipboard — intent to trade. */
    trackTradeCopy: (item: string, extra: AnalyticsParams = {}) =>
      trackEvent('trade_message_copy', { tool: tool(), item_name: item, ...extra }),

    trackWatchlist: (action: 'add' | 'remove', item: string, extra: AnalyticsParams = {}) =>
      trackEvent(action === 'add' ? 'watchlist_add' : 'watchlist_remove', {
        tool: tool(),
        item_name: item,
        ...extra
      }),

    trackAlert: (action: 'create' | 'update' | 'delete' | 'fire', extra: AnalyticsParams = {}) =>
      trackEvent(`alert_${action}`, { tool: tool(), ...extra }),

    trackPush: (action: 'subscribe' | 'unsubscribe' | 'denied' | 'error', extra: AnalyticsParams = {}) =>
      trackEvent(`push_${action}`, { tool: tool(), ...extra }),

    trackPwa: (action: 'prompt' | 'accepted' | 'dismissed' | 'ios_hint', extra: AnalyticsParams = {}) =>
      trackEvent(`pwa_${action}`, { tool: tool(), ...extra }),

    trackTour: (action: 'start' | 'complete' | 'skip', extra: AnalyticsParams = {}) =>
      trackEvent(`tour_${action}`, { tool: tool(), ...extra }),

    /** GA4 recommended `share`. `method` = twitter | github | copy_link | … */
    trackShare: (method: string, extra: AnalyticsParams = {}) =>
      trackEvent('share', { tool: tool(), method, ...extra }),

    /** Locale switcher — tells us which translations actually get used. */
    trackLocaleChange: (from: string, to: string) =>
      trackEvent('locale_change', { tool: tool(), locale_from: from, locale_to: to }),

    /** Guide/FAQ/creator content engagement. */
    trackContent: (action: string, id: string, extra: AnalyticsParams = {}) =>
      trackEvent('content_engage', { tool: tool(), action, content_id: id, ...extra })
  }
}
