/**
 * @fileoverview HttpService (axios path, used by the API server) against warframe.market blocks
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AxiosError } from 'axios';
import { SocksClient } from 'socks';
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
  const originalProxy = process.env.WFM_PROXY_URL;
  beforeEach(() => { delete process.env.WFM_PROXY_URL; });
  afterEach(() => {
    if (originalProxy === undefined) delete process.env.WFM_PROXY_URL;
    else process.env.WFM_PROXY_URL = originalProxy;
  });
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

  it('reports a 429 to the limiter so the whole process slows down, and each success', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const rateLimited = jest.spyOn(limiter, 'rateLimited').mockImplementation(() => {});
    const succeeded = jest.spyOn(limiter, 'succeeded');
    const service = makeService(limiter);
    withAdapter(service, [
      { status: 429, data: '', headers: { 'retry-after': '7' } },
      { status: 200, data: { data: [] } },
    ]);

    await expect(service.get(WFM)).resolves.toEqual({ data: [] });
    expect(rateLimited).toHaveBeenCalledWith(7_000);
    expect(succeeded).toHaveBeenCalledTimes(1);
  });

  it('pins WFM requests to the configured SOCKS proxy while leaving other hosts direct', async () => {
    process.env.WFM_PROXY_URL = 'socks5://127.0.0.1:27028';
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const service = makeService(limiter);
    const requests: any[] = [];
    service.getAxiosInstance().defaults.adapter = async (config: any) => {
      requests.push(config);
      return { status: 200, statusText: 'OK', data: {}, headers: {}, config };
    };

    await service.get(WFM);
    await service.post(WFM, {});
    await service.get('https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/info.json');

    expect(requests[0].proxy).toBe(false);
    expect(requests[0].httpAgent).toBe(requests[0].httpsAgent);
    expect(await requests[0].httpsAgent.getProxyForUrl(WFM)).toBe('socks5h://127.0.0.1:27028');
    expect(requests[1].httpsAgent).toBe(requests[0].httpsAgent);
    expect(requests[2].httpsAgent).toBeUndefined();

    // Exercise proxy-agent's actual SOCKS selection and hostname handling.
    // With socks5 (local DNS), this would send an IP and fail the SSH key's
    // permitopen="api.warframe.market:443" restriction.
    const socket = {};
    const socksConnect = jest.spyOn(SocksClient, 'createConnection').mockResolvedValue({ socket } as any);
    const lookup = jest.fn();
    try {
      const request = { getHeader: () => 'api.warframe.market', path: '/v2/items' };
      const socksAgent = await requests[0].httpsAgent.connect(request, { secureEndpoint: true });
      await socksAgent.connect(request, { host: 'api.warframe.market', port: 443, secureEndpoint: false, lookup });
      expect(lookup).not.toHaveBeenCalled();
      expect(socksConnect).toHaveBeenCalledWith(expect.objectContaining({
        destination: { host: 'api.warframe.market', port: 443 },
      }));
    } finally {
      socksConnect.mockRestore();
    }
  });

  it('keeps the fixed proxy and original breaker on a Cloudflare refusal', async () => {
    process.env.WFM_PROXY_URL = 'socks5://127.0.0.1:27028';
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const service = makeService(limiter);
    const calls = withAdapter(service, [
      { status: 403, data: '<title>Just a moment</title>', headers: { 'cf-mitigated': 'challenge' } },
    ]);
    await expect(service.get(WFM)).rejects.toThrow();
    expect(calls()).toBe(1);
    expect(limiter.isBlocked()).toBe(true);
  });
});
