/**
 * @fileoverview Decides which item's price to refresh next
 * @module services/PriceRefreshScheduler
 *
 * The price sync used to re-download every item's order book in a loop,
 * oldest first, around the clock: ~3,900 items, two requests each, so roughly
 * 100k+ requests a day whether or not anything had changed. warframe.market's
 * rules ask clients to "minimize unnecessary API calls", to "prefer incremental
 * updates" and say they may restrict "data mirrors"
 * (https://docs.warframe.market/docs/rules/overview/).
 *
 * This scheduler makes the sync incremental. The request RATE is still capped by
 * the process limiter (WfmRateLimiter); the scheduler only picks WHAT to fetch,
 * and returns nothing when nothing is due, so quiet periods cost no requests.
 *
 * Priority (highest first):
 *  - new     never priced: fetch as soon as possible
 *  - hot     warframe.market's `/v2/orders/recent` feed showed an order newer
 *            than our last fetch: refresh, at most once per `hotMinIntervalMs`
 *  - liquid  traded a lot (48h volume >= `liquidVolume`): at most `liquidMaxAgeMs` old
 *  - active  has a price or some volume: at most `activeMaxAgeMs` old
 *  - idle    empty market: at most `idleMaxAgeMs` old
 *
 * Among due items the most overdue one (age / its target age) goes first, so an
 * over-subscribed budget stretches every tier proportionally instead of starving
 * the idle tail.
 */

export type RefreshTier = 'new' | 'hot' | 'liquid' | 'active' | 'idle';
export type RefreshOutcome = 'saved' | 'skipped' | 'removed' | 'failed';

/** The fields the scheduler reads from a stored catalogue item. */
export interface RefreshItem {
  /** warframe.market item id; matches `itemId` in `/v2/orders/recent`. */
  id?: string;
  url_name: string;
  priceUpdate?: Date | string | number | null;
  market?: { sell?: number; buy?: number; volume?: number } | null;
}

export interface PriceRefreshPolicy {
  /** 48h volume at which an item counts as liquid. */
  liquidVolume: number;
  liquidMaxAgeMs: number;
  activeMaxAgeMs: number;
  idleMaxAgeMs: number;
  /** Minimum time between two refreshes of an item the recent feed shows as active. */
  hotMinIntervalMs: number;
  /** Wait after a failed fetch before that item may be tried again. */
  failureBackoffMs: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const DEFAULT_PRICE_REFRESH_POLICY: PriceRefreshPolicy = {
  liquidVolume: 20,
  liquidMaxAgeMs: 2 * HOUR,
  activeMaxAgeMs: 6 * HOUR,
  idleMaxAgeMs: 24 * HOUR,
  hotMinIntervalMs: 15 * MINUTE,
  failureBackoffMs: 10 * MINUTE,
};

/** Reads optional overrides (in minutes / units) from the environment. */
export function readPriceRefreshPolicy(env: NodeJS.ProcessEnv = process.env): PriceRefreshPolicy {
  const minutes = (name: string, fallbackMs: number, minMs: number): number => {
    const value = Number(env[name]);
    return Number.isFinite(value) && value > 0 ? Math.max(minMs, value * MINUTE) : fallbackMs;
  };
  const d = DEFAULT_PRICE_REFRESH_POLICY;
  const volume = Number(env.PRICE_LIQUID_VOLUME);
  return {
    liquidVolume: Number.isFinite(volume) && volume > 0 ? volume : d.liquidVolume,
    liquidMaxAgeMs: minutes('PRICE_LIQUID_MAX_AGE_MIN', d.liquidMaxAgeMs, 15 * MINUTE),
    activeMaxAgeMs: minutes('PRICE_ACTIVE_MAX_AGE_MIN', d.activeMaxAgeMs, 30 * MINUTE),
    idleMaxAgeMs: minutes('PRICE_IDLE_MAX_AGE_MIN', d.idleMaxAgeMs, HOUR),
    hotMinIntervalMs: minutes('PRICE_HOT_MIN_INTERVAL_MIN', d.hotMinIntervalMs, 5 * MINUTE),
    failureBackoffMs: minutes('PRICE_FAILURE_BACKOFF_MIN', d.failureBackoffMs, MINUTE),
  };
}

interface Entry<T extends RefreshItem> {
  item: T;
  /** Start of the last fetch whose result we hold (stored or deliberately skipped); 0 = never. */
  refreshedAt: number;
  /** Newest order activity seen for this item in the recent feed. */
  activityAt: number;
  /** No attempt may start before this (cooldown after an attempt or failure). */
  notBefore: number;
  inFlight: boolean;
}

export interface SchedulerSnapshot {
  total: number;
  inFlight: number;
  /** Items that could be fetched right now. */
  due: number;
  hot: number;
  never: number;
  /** Age of the stalest item we hold a result for (ms), or null. */
  oldestAgeMs: number | null;
}

function toMs(value: RefreshItem['priceUpdate']): number {
  if (value === null || value === undefined) return 0;
  const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

export class PriceRefreshScheduler<T extends RefreshItem = RefreshItem> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly byId = new Map<string, string>();

  constructor(
    private readonly policy: PriceRefreshPolicy = DEFAULT_PRICE_REFRESH_POLICY,
    private readonly now: () => number = () => Date.now()
  ) {}

  /**
   * Replaces the catalogue (initial load and periodic reloads). Keeps what this
   * process already knows about an item: a newer in-memory refresh (a skipped
   * item is never written back), feed activity, cooldowns and in-flight state.
   * Items missing from `items` are dropped unless a fetch is in flight.
   */
  load(items: T[]): void {
    const seen = new Set<string>();
    for (const item of items) {
      if (!item?.url_name) continue;
      seen.add(item.url_name);
      const prev = this.entries.get(item.url_name);
      this.entries.set(item.url_name, {
        item,
        refreshedAt: Math.max(toMs(item.priceUpdate), prev?.refreshedAt ?? 0),
        activityAt: prev?.activityAt ?? 0,
        notBefore: prev?.notBefore ?? 0,
        inFlight: prev?.inFlight ?? false,
      });
    }
    for (const [urlName, entry] of this.entries) {
      if (!seen.has(urlName) && !entry.inFlight) this.entries.delete(urlName);
    }
    this.byId.clear();
    for (const [urlName, entry] of this.entries) {
      if (entry.item.id) this.byId.set(entry.item.id, urlName);
    }
  }

  /** Records an order seen in the recent feed. Returns true when it is news for that item. */
  noteActivity(itemId: string, atMs: number): boolean {
    const urlName = this.byId.get(itemId);
    const entry = urlName ? this.entries.get(urlName) : undefined;
    if (!entry || !Number.isFinite(atMs) || atMs <= entry.activityAt) return false;
    entry.activityAt = atMs;
    return atMs > entry.refreshedAt;
  }

  tierOf(urlName: string): RefreshTier | null {
    const entry = this.entries.get(urlName);
    return entry ? this.tier(entry) : null;
  }

  /** Highest-priority due item (marked in flight), or null when nothing is due. */
  next(): T | null {
    const now = this.now();
    let best: Entry<T> | null = null;
    let bestScore = -Infinity;
    for (const entry of this.entries.values()) {
      if (entry.inFlight || entry.notBefore > now) continue;
      const interval = this.intervalOf(this.tier(entry));
      if (entry.refreshedAt + interval > now) continue;
      const score = interval === 0 ? Infinity : (now - entry.refreshedAt) / interval;
      // Ties (e.g. several never-priced items) go to the older one.
      if (score > bestScore || (score === bestScore && best && entry.refreshedAt < best.refreshedAt)) {
        best = entry;
        bestScore = score;
      }
    }
    if (!best) return null;
    best.inFlight = true;
    return best.item;
  }

  /**
   * Finishes an attempt started at `startedAtMs`. `saved`/`skipped` count as a
   * refresh (a skipped all-zero market must not be re-fetched in a tight loop);
   * `failed` keeps the item due after a back-off; `removed` forgets it. Pass the
   * updated item after a save so tiers follow the new market data.
   */
  complete(urlName: string, outcome: RefreshOutcome, startedAtMs: number, updated?: T): void {
    const entry = this.entries.get(urlName);
    if (!entry) return;
    entry.inFlight = false;
    const now = this.now();
    if (outcome === 'removed') {
      this.entries.delete(urlName);
      if (entry.item.id) this.byId.delete(entry.item.id);
      return;
    }
    if (outcome === 'failed') {
      entry.notBefore = now + this.policy.failureBackoffMs;
      return;
    }
    entry.refreshedAt = Math.max(entry.refreshedAt, startedAtMs);
    entry.notBefore = now + Math.min(this.policy.hotMinIntervalMs, this.policy.liquidMaxAgeMs);
    if (updated) entry.item = updated;
  }

  snapshot(): SchedulerSnapshot {
    const now = this.now();
    let inFlight = 0, due = 0, hot = 0, never = 0;
    let oldest: number | null = null;
    for (const entry of this.entries.values()) {
      const tier = this.tier(entry);
      if (entry.inFlight) inFlight++;
      if (tier === 'hot') hot++;
      if (tier === 'new') never++;
      else oldest = oldest === null ? entry.refreshedAt : Math.min(oldest, entry.refreshedAt);
      if (!entry.inFlight && entry.notBefore <= now && entry.refreshedAt + this.intervalOf(tier) <= now) due++;
    }
    return { total: this.entries.size, inFlight, due, hot, never, oldestAgeMs: oldest === null ? null : now - oldest };
  }

  private tier(entry: Entry<T>): RefreshTier {
    if (entry.refreshedAt === 0) return 'new';
    if (entry.activityAt > entry.refreshedAt) return 'hot';
    const market = entry.item.market ?? {};
    const volume = Number(market.volume) || 0;
    if (volume >= this.policy.liquidVolume) return 'liquid';
    if (volume > 0 || (Number(market.sell) || 0) > 0 || (Number(market.buy) || 0) > 0) return 'active';
    return 'idle';
  }

  private intervalOf(tier: RefreshTier): number {
    switch (tier) {
      case 'new': return 0;
      case 'hot': return this.policy.hotMinIntervalMs;
      case 'liquid': return this.policy.liquidMaxAgeMs;
      case 'active': return this.policy.activeMaxAgeMs;
      default: return this.policy.idleMaxAgeMs;
    }
  }
}
