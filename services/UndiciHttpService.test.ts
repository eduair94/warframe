/**
 * @fileoverview UndiciHttpService behaviour against warframe.market blocks
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const requestMock = jest.fn<(...args: any[]) => Promise<any>>();
jest.mock('undici', () => {
  const actual = jest.requireActual('undici') as Record<string, unknown>;
  return { ...actual, request: (...args: any[]) => requestMock(...args) };
});

import { UndiciHttpService } from './UndiciHttpService';
import { WfmRateLimiter } from './WfmRateLimiter';

function response(statusCode: number, body: string, headers: Record<string, string> = {}) {
  return {
    statusCode,
    headers,
    body: {
      text: async () => body,
      dump: async () => {},
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(body);
      },
    },
  };
}

function makeService(limiter: WfmRateLimiter) {
  return new UndiciHttpService(
    { maxRetries: 5, minDelay: 0, maxDelay: 0, useProxies: false, wfmLimiter: limiter }
  );
}

const WFM = 'https://api.warframe.market/v2/orders/item/ash_prime_set';

describe('UndiciHttpService - warframe.market protection', () => {
  beforeEach(() => requestMock.mockReset());

  it('stops after one request on a Cloudflare challenge and opens the breaker', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    requestMock.mockResolvedValue(
      response(403, '<html><title>Just a moment...</title>', { 'cf-mitigated': 'challenge' })
    );

    await expect(makeService(limiter).get(WFM)).rejects.toThrow(/Cloudflare challenge/);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(limiter.isBlocked()).toBe(true);
  });

  it('does not retry a plain 403 (v1 "Deprecated") and leaves the breaker closed', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    requestMock.mockResolvedValue(response(403, 'Deprecated', { 'content-type': 'text/plain' }));

    await expect(
      makeService(limiter).get('https://api.warframe.market/v1/items/ash_prime_set/statistics')
    ).rejects.toThrow(/Deprecated/);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(limiter.isBlocked()).toBe(false);
  });

  it('paces every attempt through the limiter, including retries', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const acquire = jest.spyOn(limiter, 'acquire');
    requestMock
      .mockResolvedValueOnce(response(500, ''))
      .mockResolvedValueOnce(response(200, '{"data":[]}', { 'content-type': 'application/json' }));

    await expect(makeService(limiter).get(WFM)).resolves.toEqual({ data: [] });
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(acquire).toHaveBeenCalledTimes(2);
  });

  it('does not pace non-warframe.market hosts', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const acquire = jest.spyOn(limiter, 'acquire');
    requestMock.mockResolvedValue(response(200, '{"ok":true}'));

    await makeService(limiter).get('https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/info.json');
    expect(acquire).not.toHaveBeenCalled();
  });
});
