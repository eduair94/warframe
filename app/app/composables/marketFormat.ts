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

/** Demand badge derived from a payout-liquidity fraction in [0, 1]. */
export interface DemandTier {
  key: 'high' | 'med' | 'low' | 'dead'
  label: string
  cls: string
}

/** Buckets a liquidity fraction into a demand badge. */
export function demandTier(frac: number): DemandTier {
  if (frac >= 0.66) return { key: 'high', label: 'High demand', cls: 'dem--high' }
  if (frac >= 0.33) return { key: 'med', label: 'Fair demand', cls: 'dem--med' }
  if (frac > 0) return { key: 'low', label: 'Thin demand', cls: 'dem--low' }
  return { key: 'dead', label: 'No demand', cls: 'dem--dead' }
}

/** Platinum formatter: rounded, thousands-separated (en-US). */
export function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
