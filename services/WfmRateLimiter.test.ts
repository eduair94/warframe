/**
 * @fileoverview Unit tests for WfmRateLimiter (warframe.market pacing + block breaker)
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  WfmRateLimiter,
  isWfmUrl,
  isCloudflareChallenge,
  parseRetryAfterMs,
} from './WfmRateLimiter';

/** Fake clock: sleep() advances virtual time instantly so tests stay fast. */
function fakeClock() {
  let t = 1_000_000;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      t += ms;
    },
    advance: (ms: number) => {
      t += ms;
    },
    sleeps,
  };
}

describe('WfmRateLimiter', () => {
  it('spaces request starts at 1000/maxRps ms', async () => {
    const c = fakeClock();
    const limiter = new WfmRateLimiter({ maxRps: 2, cooldownMs: 60_000, now: c.now, sleep: c.sleep });
    const starts: number[] = [];
    for (let i = 0; i < 4; i++) {
      await limiter.acquire();
      starts.push(c.now());
    }
    const gaps = starts.slice(1).map((s, i) => s - starts[i]);
    expect(gaps).toEqual([500, 500, 500]);
  });

  it('never lets concurrent callers exceed the rate', async () => {
    // Real timer semantics (a shared fake clock would wake every waiter at once).
    jest.useFakeTimers({ now: 1_000_000 });
    try {
      const limiter = new WfmRateLimiter({ maxRps: 4, cooldownMs: 60_000 });
      const starts: number[] = [];
      const all = Promise.all(
        Array.from({ length: 5 }, () => limiter.acquire().then(() => starts.push(Date.now())))
      );
      await jest.runAllTimersAsync();
      await all;
      starts.sort((a, b) => a - b);
      const gaps = starts.slice(1).map((s, i) => s - starts[i]);
      expect(gaps).toEqual([250, 250, 250, 250]);
    } finally {
      jest.useRealTimers();
    }
  });

  it('holds every caller until the cooldown ends once a block is tripped', async () => {
    const c = fakeClock();
    const limiter = new WfmRateLimiter({ maxRps: 10, cooldownMs: 15 * 60_000, now: c.now, sleep: c.sleep });
    await limiter.acquire();
    const trippedAt = c.now();
    limiter.tripBlocked();
    expect(limiter.isBlocked()).toBe(true);
    await limiter.acquire();
    expect(c.now() - trippedAt).toBeGreaterThanOrEqual(15 * 60_000);
    expect(limiter.isBlocked()).toBe(false);
  });

  it('pauseFor() delays the next request without opening the breaker', async () => {
    const c = fakeClock();
    const limiter = new WfmRateLimiter({ maxRps: 10, cooldownMs: 60_000, now: c.now, sleep: c.sleep });
    await limiter.acquire();
    const before = c.now();
    limiter.pauseFor(5_000);
    expect(limiter.isBlocked()).toBe(false);
    await limiter.acquire();
    expect(c.now() - before).toBeGreaterThanOrEqual(5_000);
  });

  it('clamps nonsense rates to a safe floor instead of dividing by zero', async () => {
    const c = fakeClock();
    const limiter = new WfmRateLimiter({ maxRps: 0, cooldownMs: 60_000, now: c.now, sleep: c.sleep });
    await limiter.acquire();
    const t0 = c.now();
    await limiter.acquire();
    expect(Number.isFinite(c.now() - t0)).toBe(true);
    expect(c.now() - t0).toBeGreaterThan(0);
  });
});

describe('isWfmUrl', () => {
  it('matches only the warframe.market API host', () => {
    expect(isWfmUrl('https://api.warframe.market/v2/orders/item/ash_prime_set')).toBe(true);
    expect(isWfmUrl('https://warframe.market/items/ash_prime_set')).toBe(false);
    expect(isWfmUrl('https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/all.json')).toBe(false);
    expect(isWfmUrl('not a url')).toBe(false);
  });
});

describe('isCloudflareChallenge', () => {
  it('detects the cf-mitigated header', () => {
    expect(isCloudflareChallenge(403, { 'cf-mitigated': 'challenge' })).toBe(true);
  });

  it('detects the "Just a moment" interstitial body', () => {
    expect(isCloudflareChallenge(403, {}, '<html><title>Just a moment...</title>')).toBe(true);
  });

  it('does not treat a plain API 403 (e.g. v1 "Deprecated") as a challenge', () => {
    expect(isCloudflareChallenge(403, { 'content-type': 'text/plain' }, 'Deprecated')).toBe(false);
  });

  it('ignores non-403 responses', () => {
    expect(isCloudflareChallenge(200, { 'cf-mitigated': 'challenge' })).toBe(false);
  });
});

describe('parseRetryAfterMs', () => {
  it('parses delta-seconds', () => {
    expect(parseRetryAfterMs('7')).toBe(7000);
  });

  it('returns null for missing or garbage values', () => {
    expect(parseRetryAfterMs(undefined)).toBeNull();
    expect(parseRetryAfterMs('soon')).toBeNull();
  });
});
