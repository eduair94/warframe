/**
 * @fileoverview Age of the newest stored price, for /health
 * @module services/PriceFreshness
 *
 * From 2026-10-02 to 2026-10-11 the site stayed up while no price was
 * updated, and nothing noticed for 9 days: /health only reported the process
 * and mongo. /health now also carries the newest `priceUpdate` and its age, and
 * the uptime monitor opens a "prices stale" issue when the age passes its
 * threshold. `ok` deliberately does not depend on it - the watchdog restarts
 * the API when /health fails, and a restart cannot fix a stalled sync.
 */

export interface PriceFreshness {
  prices_updated_at: string | null;
  prices_age_s: number | null;
}

/**
 * Returns a getter that queries the newest price update at most once per
 * `ttlMs` (the monitor and watchdog poll /health) and never throws.
 */
export function createPriceFreshness(
  fetchNewest: () => Promise<Date | null>,
  ttlMs = 60_000,
  now: () => number = () => Date.now()
): () => Promise<PriceFreshness> {
  let cache: { at: number; newest: Date | null } | null = null;

  return async () => {
    if (!cache || now() - cache.at >= ttlMs) {
      let newest: Date | null = null;
      try {
        newest = await fetchNewest();
      } catch {
        newest = null;
      }
      cache = { at: now(), newest };
    }
    const newest = cache.newest;
    if (!newest || Number.isNaN(newest.getTime())) {
      return { prices_updated_at: null, prices_age_s: null };
    }
    return {
      prices_updated_at: newest.toISOString(),
      prices_age_s: Math.max(0, Math.round((now() - newest.getTime()) / 1000)),
    };
  };
}
