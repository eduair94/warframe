/**
 * Pure threshold-evaluation core for Web Push alerts (Spec B). No I/O — imported
 * by both the runtime service (PushAlertService) and the unit tests
 * (push-eval.test.ts), so it must stay free of DB / web-push / env imports.
 *
 * Semantics match the existing client-side `checkAlerts` (services/portfolio.ts):
 *   below  -> sell <= below
 *   above  -> sell >= above
 *   atl    -> pctFromAtl <= NEAR_ATL_PCT
 * with a per-direction `notified*` flag so each arming fires once. Unlike the
 * client (which only re-arms when the user edits the threshold), the background
 * evaluator adds HYSTERESIS: once the price moves back to the non-triggering
 * side, the flag resets so the alert can fire again on the next crossing —
 * otherwise a background "tell me when it drops below X" would fire only once
 * ever. `mergeAlerts` additionally re-arms when the user changes a threshold.
 */
import { buildPushMessage } from './pushMessages'

export const NEAR_ATL_PCT = 3

export interface StoredAlert {
  url_name: string
  item_name: string
  below: number | null
  above: number | null
  atl: boolean
  notifiedBelow: boolean
  notifiedAbove: boolean
  notifiedAtl: boolean
}

/** What the client sends on subscribe/sync (no notified flags — server owns those). */
export interface IncomingAlert {
  url_name: string
  item_name: string
  below?: number | null
  above?: number | null
  atl?: boolean
}

export interface PriceInfo {
  sell?: number | null
  pctFromAtl?: number | null
  atl?: number | null
}
export type PriceMap = Record<string, PriceInfo>

export interface PushPayload {
  title: string
  body: string
  url: string
  tag: string
}

export interface EvalResult {
  pushes: PushPayload[]
  /** true if any notified flag flipped (fire or re-arm) — the doc must be persisted */
  changed: boolean
  /** the alerts with updated notified flags (a fresh copy; inputs are not mutated) */
  alerts: StoredAlert[]
}

/**
 * Evaluate one subscription's alerts against the latest prices. Returns the
 * notifications to send plus the updated alert state. Does not mutate `alerts`.
 */
export function evaluateSubscription(alerts: StoredAlert[], priceMap: PriceMap, locale = 'en'): EvalResult {
  const next = alerts.map((a) => ({ ...a }))
  const pushes: PushPayload[] = []
  let changed = false

  for (const a of next) {
    const p = priceMap[a.url_name]
    if (!p) continue
    const url = `/set/${a.url_name}`
    const sell = typeof p.sell === 'number' ? p.sell : null

    // --- below ---
    if (a.below != null && sell != null) {
      if (sell <= a.below && !a.notifiedBelow) {
        const m = buildPushMessage('below', { item: a.item_name, price: sell, target: a.below }, locale)
        pushes.push({ ...m, url, tag: `${a.url_name}-below` })
        a.notifiedBelow = true
        changed = true
      } else if (sell > a.below && a.notifiedBelow) {
        a.notifiedBelow = false // re-arm on hysteresis
        changed = true
      }
    }

    // --- above ---
    if (a.above != null && sell != null) {
      if (sell >= a.above && !a.notifiedAbove) {
        const m = buildPushMessage('above', { item: a.item_name, price: sell, target: a.above }, locale)
        pushes.push({ ...m, url, tag: `${a.url_name}-above` })
        a.notifiedAbove = true
        changed = true
      } else if (sell < a.above && a.notifiedAbove) {
        a.notifiedAbove = false
        changed = true
      }
    }

    // --- all-time low ---
    if (a.atl && typeof p.pctFromAtl === 'number') {
      if (p.pctFromAtl <= NEAR_ATL_PCT && !a.notifiedAtl) {
        const m = buildPushMessage('atl', { item: a.item_name, atl: typeof p.atl === 'number' ? Math.round(p.atl) : null }, locale)
        pushes.push({ ...m, url, tag: `${a.url_name}-atl` })
        a.notifiedAtl = true
        changed = true
      } else if (p.pctFromAtl > NEAR_ATL_PCT && a.notifiedAtl) {
        a.notifiedAtl = false
        changed = true
      }
    }
  }

  return { pushes, changed, alerts: next }
}

/**
 * Merge an incoming alert list (from the client) with the stored one, preserving
 * `notified*` flags for alerts whose thresholds are UNCHANGED and resetting them
 * (re-arming) for new or edited thresholds. Drops alerts no longer in `incoming`.
 */
export function mergeAlerts(existing: StoredAlert[], incoming: IncomingAlert[]): StoredAlert[] {
  const byUrl = new Map(existing.map((a) => [a.url_name, a]))
  return incoming.map((inc) => {
    const below = inc.below ?? null
    const above = inc.above ?? null
    const atl = !!inc.atl
    const prev = byUrl.get(inc.url_name)
    const same = !!prev && prev.below === below && prev.above === above && prev.atl === atl
    return {
      url_name: inc.url_name,
      item_name: inc.item_name,
      below,
      above,
      atl,
      notifiedBelow: same ? prev!.notifiedBelow : false,
      notifiedAbove: same ? prev!.notifiedAbove : false,
      notifiedAtl: same ? prev!.notifiedAtl : false,
    }
  })
}

/** Keep only alerts that actually arm something (used to prune empty rows). */
export function hasAnyCondition(a: IncomingAlert): boolean {
  return (a.below != null) || (a.above != null) || !!a.atl
}
