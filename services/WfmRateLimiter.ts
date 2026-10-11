/**
 * @fileoverview Process-wide pacing + block breaker for api.warframe.market
 * @module services/WfmRateLimiter
 *
 * warframe.market documents a limit of 3 requests per second per client and
 * warns that excessive RPS escalates from 429s to Cloudflare challenges and
 * outright blocks. On 2026-10-02 that happened: the price sync (50 parallel
 * requests rotated over ~3,500 proxies, 5 retries each), the live poller
 * (~50 RPS) and the auctions sync got the prod IP and the whole proxy pool
 * challenged, and prices froze for 9 days.
 *
 * Every warframe.market request now goes through one limiter per process:
 *
 * - `acquire()` hands out start slots spaced `1000 / maxRps` ms apart, shared
 *   by every concurrent caller, so the process can never exceed `WFM_MAX_RPS`
 *   no matter how many workers or retries are in flight.
 * - `tripBlocked()` opens a breaker after a Cloudflare challenge. While it is
 *   open `acquire()` waits (it does not throw), so a long-running sync goes
 *   quiet and sends at most one probe per cooldown instead of crash-looping
 *   under pm2 and re-triggering the block.
 * - `pauseFor()` honours a 429's Retry-After without opening the breaker.
 *
 * The per-process budgets are set in ecosystem.config.js so the processes
 * sharing the prod IP stay under the documented 3 RPS together.
 */

export interface WfmRateLimiterOptions {
  /** Max request starts per second for this process. */
  maxRps: number;
  /** How long to hold all requests after a Cloudflare challenge. */
  cooldownMs: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

/** Lowest rate accepted, so a bad env value cannot divide by zero or stall forever. */
const MIN_RPS = 0.05;

export class WfmRateLimiter {
  private readonly intervalMs: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;
  /** Earliest time the next request may start. */
  private nextSlot = 0;
  /** Breaker: no request may start before this time. */
  private blockedUntil = 0;

  constructor(opts: WfmRateLimiterOptions) {
    const rps = Number.isFinite(opts.maxRps) && opts.maxRps > MIN_RPS ? opts.maxRps : MIN_RPS;
    this.intervalMs = 1000 / rps;
    this.cooldownMs = Math.max(0, opts.cooldownMs);
    this.now = opts.now ?? (() => Date.now());
    this.sleep = opts.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  /** Waits for this caller's start slot (and for any open breaker to close). */
  async acquire(): Promise<void> {
    for (;;) {
      const now = this.now();
      if (this.blockedUntil > now) {
        await this.sleep(this.blockedUntil - now);
        continue;
      }
      // Reserve the slot synchronously so concurrent callers queue behind it.
      const slot = Math.max(now, this.nextSlot);
      this.nextSlot = slot + this.intervalMs;
      if (slot > now) await this.sleep(slot - now);
      // A block tripped while we waited invalidates the slot: wait it out.
      if (this.blockedUntil > this.now()) continue;
      return;
    }
  }

  /** Opens the breaker for the configured cooldown (Cloudflare challenge seen). */
  tripBlocked(): void {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + this.cooldownMs);
  }

  /** Delays every request by at least `ms` (429 Retry-After) without opening the breaker. */
  pauseFor(ms: number): void {
    this.nextSlot = Math.max(this.nextSlot, this.now() + Math.max(0, ms));
  }

  isBlocked(): boolean {
    return this.blockedUntil > this.now();
  }

  /** When the breaker closes (epoch ms), or 0 when it is closed. */
  blockedUntilMs(): number {
    return this.isBlocked() ? this.blockedUntil : 0;
  }
}

/** True only for the warframe.market API host (not the website, not WFCD/GitHub). */
export function isWfmUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'api.warframe.market';
  } catch {
    return false;
  }
}

/**
 * True when a response is a Cloudflare challenge/block rather than an API
 * answer. A plain API 403 (the v1 endpoints now answer `Deprecated`) is not.
 */
export function isCloudflareChallenge(
  statusCode: number,
  headers: Record<string, unknown>,
  body?: string
): boolean {
  if (statusCode !== 403 && statusCode !== 429 && statusCode !== 503) return false;
  if (String(headers['cf-mitigated'] ?? '').toLowerCase() === 'challenge') return true;
  return !!body && /<title>\s*(Just a moment|Attention Required)/i.test(body);
}

/** Parses a Retry-After header given in delta-seconds; null when absent/unparseable. */
export function parseRetryAfterMs(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const seconds = Number(String(value).trim());
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

/** Error for a request the caller must not retry (Cloudflare block, deprecated endpoint). */
export class WfmNonRetryableError extends Error {
  readonly nonRetryable = true;
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = 'WfmNonRetryableError';
  }
}

/** Shared limiter for this process; budget comes from WFM_MAX_RPS (see ecosystem.config.js). */
export const wfmRateLimiter = new WfmRateLimiter({
  maxRps: parseFloat(process.env.WFM_MAX_RPS || '0.5'),
  cooldownMs: parseInt(process.env.WFM_BLOCK_COOLDOWN_MS || '900000', 10),
});
