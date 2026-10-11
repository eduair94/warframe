/**
 * @fileoverview HttpService (axios path, used by the API server) against warframe.market blocks
 */

import { describe, it, expect, jest } from '@jest/globals';
import { AxiosError } from 'axios';
import { HttpService } from './HttpService';
import { WfmRateLimiter } from './WfmRateLimiter';

const WFM = 'https://api.warframe.market/v2/orders/item/ash_prime_set';

/** Installs a fake adapter that answers from `statuses` in order and counts calls. */
function withAdapter(service: HttpService, replies: Array<{ status: number; data: any; headers?: any }>) {
  let calls = 0;
  service.getAxiosInstance().defaults.adapter = async (config: any) => {
    const r = replies[Math.min(calls, replies.length - 1)]!;
    calls++;
    const response = { status: r.status, statusText: '', data: r.data, headers: r.headers ?? {}, config, request: {} };
    if (r.status >= 200 && r.status < 300) return response as any;
    throw new AxiosError(`Request failed with status code ${r.status}`, undefined, config, {}, response as any);
  };
  return () => calls;
}

function makeService(limiter: WfmRateLimiter) {
  return new HttpService(null, { maxRetries: 5, minDelay: 0, maxDelay: 0, useProxies: false, wfmLimiter: limiter });
}

describe('HttpService - warframe.market protection', () => {
  it('does not retry a Cloudflare challenge and opens the breaker', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const service = makeService(limiter);
    const calls = withAdapter(service, [
      { status: 403, data: '<title>Just a moment...</title>', headers: { 'cf-mitigated': 'challenge' } },
    ]);

    await expect(service.get(WFM)).rejects.toThrow();
    expect(calls()).toBe(1);
    expect(limiter.isBlocked()).toBe(true);
  });

  it('does not retry a plain warframe.market 403 (v1 "Deprecated")', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const service = makeService(limiter);
    const calls = withAdapter(service, [{ status: 403, data: 'Deprecated' }]);

    await expect(service.get('https://api.warframe.market/v1/items/x/statistics')).rejects.toThrow();
    expect(calls()).toBe(1);
    expect(limiter.isBlocked()).toBe(false);
  });

  it('paces warframe.market requests through the limiter', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const acquire = jest.spyOn(limiter, 'acquire');
    const service = makeService(limiter);
    withAdapter(service, [{ status: 200, data: { data: [] } }]);

    await expect(service.get(WFM)).resolves.toEqual({ data: [] });
    expect(acquire).toHaveBeenCalledTimes(1);
  });
});
