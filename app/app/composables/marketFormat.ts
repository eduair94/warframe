/**
 * Shared market-display primitives used by BOTH valuation modules
 * (`useEndoValue`, `useRelicValue`) and their pages.
 *
 * These previously lived — identically — in each of those two composables, so
 * Nuxt's auto-import saw two `fmtPlat`/`demandTier`/`DemandTier` exports and
 * silently kept one while warning about the collision. Defining them once here
 * (the single auto-import source) removes that ambiguity. Domain-specific values
 * that legitimately differ (e.g. each module's `VOL_K` liquidity weight) stay in
 * their own module.
 */

import { useNuxtApp } from '#imports'

/** Demand badge derived from a payout-liquidity fraction in [0, 1]. */
export interface DemandTier {
  key: 'high' | 'med' | 'low' | 'dead'
  label: string
  cls: string
}

/**
 * Resolve a UI label through the global i18n `t` by key, falling back to the
 * English string when i18n isn't available (e.g. called outside a Nuxt render
 * context or in a unit test). Called during component render, so the `t` read
 * tracks the locale ref and the badge re-labels on language switch.
 */
export function tLabel(key: string, fallback: string): string {
  try {
    const t = useNuxtApp().$i18n?.t as ((k: string) => string) | undefined
    if (t) {
      const s = t(key)
      if (s && s !== key) return s
    }
  } catch {
    /* no Nuxt/i18n context — use the English fallback */
  }
  return fallback
}

/** Buckets a liquidity fraction into a demand badge. */
export function demandTier(frac: number): DemandTier {
  if (frac >= 0.66) return { key: 'high', label: tLabel('common.demand.high', 'High demand'), cls: 'dem--high' }
  if (frac >= 0.33) return { key: 'med', label: tLabel('common.demand.med', 'Fair demand'), cls: 'dem--med' }
  if (frac > 0) return { key: 'low', label: tLabel('common.demand.low', 'Thin demand'), cls: 'dem--low' }
  return { key: 'dead', label: tLabel('common.demand.dead', 'No demand'), cls: 'dem--dead' }
}

/** Platinum formatter: rounded, thousands-separated (en-US). */
export function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
