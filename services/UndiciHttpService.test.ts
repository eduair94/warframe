/**
 * @fileoverview UndiciHttpService behaviour against warframe.market blocks
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { Agent } from 'undici';

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
  const originalProxy = process.env.WFM_PROXY_URL;
  beforeEach(() => {
    requestMock.mockReset();
    delete process.env.WFM_PROXY_URL;
  });
  afterEach(() => {
    if (originalProxy === undefined) delete process.env.WFM_PROXY_URL;
    else process.env.WFM_PROXY_URL = originalProxy;
  });

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

  it('reports a 429 to the limiter so the whole process slows down, and each success', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const rateLimited = jest.spyOn(limiter, 'rateLimited').mockImplementation(() => {});
    const succeeded = jest.spyOn(limiter, 'succeeded');
    requestMock
      .mockResolvedValueOnce(response(429, '', { 'retry-after': '7' }))
      .mockResolvedValueOnce(response(200, '{"data":[]}', { 'content-type': 'application/json' }));

    await expect(makeService(limiter).get(WFM)).resolves.toEqual({ data: [] });
    expect(rateLimited).toHaveBeenCalledTimes(1);
    expect(rateLimited).toHaveBeenCalledWith(7_000);
    expect(succeeded).toHaveBeenCalledTimes(1);
  });

  it('does not pace non-warframe.market hosts', async () => {
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const acquire = jest.spyOn(limiter, 'acquire');
    requestMock.mockResolvedValue(response(200, '{"ok":true}'));

    await makeService(limiter).get('https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/info.json');
    expect(acquire).not.toHaveBeenCalled();
  });

  it('uses the fixed SOCKS egress despite disabled pool proxies, only for WFM', async () => {
    process.env.WFM_PROXY_URL = 'socks5://127.0.0.1:27028';
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const service = makeService(limiter);
    const dispatcher = jest.spyOn(service as any, 'createDispatcher');
    const pool = jest.spyOn(service.getProxyManager(), 'getProxy');
    requestMock.mockResolvedValue(response(200, '{"data":[]}'));

    await service.get(WFM);
    expect(dispatcher).toHaveBeenLastCalledWith('socks5h://127.0.0.1:27028');
    expect(pool).not.toHaveBeenCalled();

    await service.get('https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/info.json');
    expect(dispatcher).toHaveBeenLastCalledWith(null);
  });

  it('does not bypass or rotate a failed fixed proxy and retains the challenge breaker', async () => {
    process.env.WFM_PROXY_URL = 'socks5://127.0.0.1:27028';
    const limiter = new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 });
    const service = makeService(limiter);
    const pool = jest.spyOn(service.getProxyManager(), 'getProxy');
    const ban = jest.spyOn(service.getProxyManager(), 'banProxy');
    requestMock.mockResolvedValue(response(403, '<title>Just a moment</title>', { 'cf-mitigated': 'challenge' }));

    await expect(service.post(WFM, {})).rejects.toThrow(/Cloudflare challenge/);
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(pool).not.toHaveBeenCalled();
    expect(ban).not.toHaveBeenCalled();
    expect(limiter.isBlocked()).toBe(true);
  });
});

describe('UndiciHttpService request resource ownership', () => {
  const actualRequest = (jest.requireActual('undici') as typeof import('undici')).request;

  beforeEach(() => requestMock.mockReset());
  afterEach(() => jest.restoreAllMocks());

  it.each(['get', 'post'] as const)('%s releases sockets after success, parsing failure and an unread error body', async (method) => {
    const sockets = new Set<import('node:net').Socket>();
    const server = createServer((req, res) => {
      if (req.url === '/ok') res.end('{"ok":true}');
      else if (req.url === '/invalid') res.end('invalid-json');
      else {
        // A body with no end exposes leaks that keep-alive timeouts cannot fix.
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.write('missing');
      }
    });
    server.on('connection', socket => {
      sockets.add(socket);
      socket.once('close', () => sockets.delete(socket));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    requestMock.mockImplementation(actualRequest as any);
    const service = makeService(new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 }));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const run = (path: string) => method === 'get'
      ? service.get(origin + path, { maxRetries: 1 })
      : service.post(origin + path, {}, { maxRetries: 1 });
    try {
      await expect(run('/ok')).resolves.toEqual({ ok: true });
      await expect(run('/invalid')).rejects.toThrow(/JSON/);
      await expect(run('/missing')).rejects.toThrow('HTTP 404');
      for (let i = 0; i < 50 && sockets.size; i++) await new Promise(resolve => setTimeout(resolve, 10));
      expect(sockets.size).toBe(0);
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it.each(['get', 'post'] as const)('%s disposes each failed attempt before creating the retry dispatcher', async (method) => {
    const service = makeService(new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 }));
    const agents: Agent[] = [];
    jest.spyOn(service as any, 'createDispatcher').mockImplementation(() => {
      expect(agents.every(agent => agent.destroyed)).toBe(true);
      const agent = new Agent();
      agents.push(agent);
      return agent;
    });
    requestMock
      .mockResolvedValueOnce(response(500, 'upstream error'))
      .mockResolvedValueOnce(response(200, '{"ok":true}'));
    const result = method === 'get'
      ? await service.get('http://example.test', { maxRetries: 2 })
      : await service.post('http://example.test', {}, { maxRetries: 2 });
    expect(result).toEqual({ ok: true });
    expect(agents).toHaveLength(2);
    expect(agents.every(agent => agent.destroyed)).toBe(true);
  });

  it.each(['get', 'post'] as const)('%s destroys the dispatcher after connection failure or a non-retryable refusal', async (method) => {
    const service = makeService(new WfmRateLimiter({ maxRps: 100, cooldownMs: 60_000 }));
    const agents: Agent[] = [];
    jest.spyOn(service as any, 'createDispatcher').mockImplementation(() => {
      const agent = new Agent();
      agents.push(agent);
      return agent;
    });
    const run = () => method === 'get'
      ? service.get(WFM, { maxRetries: 1 })
      : service.post(WFM, {}, { maxRetries: 1 });
    requestMock.mockRejectedValueOnce(new Error('Socket closed'));
    await expect(run()).rejects.toThrow('Socket closed');
    requestMock.mockResolvedValueOnce(response(403, 'Deprecated'));
    await expect(run()).rejects.toThrow('Deprecated');
    expect(agents).toHaveLength(2);
    expect(agents.every(agent => agent.destroyed)).toBe(true);
  });
});
