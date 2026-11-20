/**
 * @fileoverview SocksFailover: per-connection failover between SOCKS5 egresses
 */

import { describe, it, expect, afterEach } from '@jest/globals';
import net from 'net';
import { SocksFailover, parseListen, parseUpstreams } from './SocksFailover';

const GREETING = Buffer.from([5, 1, 0]);

/** Fake SOCKS upstream: answers the greeting with 05 00, then echoes "<tag>:<data>". */
function fakeSocks(tag: string, mode: 'ok' | 'silent' = 'ok'): Promise<{ server: net.Server; port: number; connections: () => number }> {
  let connections = 0;
  const server = net.createServer((socket) => {
    connections++;
    let greeted = false;
    socket.on('data', (data) => {
      if (mode === 'silent') return;
      if (!greeted) {
        greeted = true;
        socket.write(Buffer.from([5, 0]));
        const rest = data.subarray(GREETING.length);
        if (rest.length) socket.write(`${tag}:${rest.toString()}`);
        return;
      }
      socket.write(`${tag}:${data.toString()}`);
    });
    socket.on('error', () => {});
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    server,
    port: (server.address() as net.AddressInfo).port,
    connections: () => connections,
  })));
}

/** A port with nothing listening (connection refused). */
async function closedPort(): Promise<number> {
  const s = net.createServer();
  await new Promise<void>((r) => s.listen(0, '127.0.0.1', () => r()));
  const port = (s.address() as net.AddressInfo).port;
  await new Promise<void>((r) => s.close(() => r()));
  return port;
}

/** Connects through the failover, sends the greeting (optionally split) and a payload, collects the answer. */
function roundTrip(port: number, payload = 'ping', split = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    let out = Buffer.alloc(0);
    let sent = false;
    socket.on('connect', () => {
      if (split) {
        socket.write(GREETING.subarray(0, 1));
        setTimeout(() => socket.write(GREETING.subarray(1)), 30);
      } else socket.write(GREETING);
    });
    socket.on('data', (d) => {
      out = Buffer.concat([out, d]);
      if (!sent && out.length >= 2) {
        sent = true;
        socket.write(payload);
      }
      const text = out.subarray(2).toString();
      if (text.endsWith(payload)) {
        socket.end();
        resolve(out[0] === 5 && out[1] === 0 ? text : `bad-greeting:${text}`);
      }
    });
    socket.on('error', reject);
    socket.on('close', () => resolve(out.length ? out.subarray(2).toString() : 'closed'));
  });
}

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (cleanup.length) await cleanup.pop()!().catch(() => {});
});

async function start(failover: SocksFailover): Promise<number> {
  await failover.listen(0, '127.0.0.1');
  cleanup.push(() => failover.close());
  return (failover.server.address() as net.AddressInfo).port;
}

function track(server: net.Server) {
  cleanup.push(() => new Promise<void>((r) => server.close(() => r())));
}

describe('SocksFailover', () => {
  it('relays through the first upstream while it answers', async () => {
    const pc = await fakeSocks('pc');
    const gsearch = await fakeSocks('gsearch');
    track(pc.server); track(gsearch.server);
    const logs: string[] = [];
    const f = new SocksFailover({
      upstreams: [{ name: 'pc', host: '127.0.0.1', port: pc.port }, { name: 'gsearch', host: '127.0.0.1', port: gsearch.port }],
      log: (m) => logs.push(m),
    });
    const port = await start(f);

    await expect(roundTrip(port)).resolves.toBe('pc:ping');
    expect(gsearch.connections()).toBe(0);
    expect(f.activeUpstream()).toBe('pc');
    expect(logs.some((l) => l.includes('using pc'))).toBe(true);
  });

  it('falls back when the first upstream refuses connections', async () => {
    const gsearch = await fakeSocks('gsearch');
    track(gsearch.server);
    const f = new SocksFailover({
      upstreams: [{ name: 'pc', host: '127.0.0.1', port: await closedPort() }, { name: 'gsearch', host: '127.0.0.1', port: gsearch.port }],
      log: () => {},
    });
    const port = await start(f);
    await expect(roundTrip(port)).resolves.toBe('gsearch:ping');
    expect(f.activeUpstream()).toBe('gsearch');
  });

  it('falls back when the first upstream accepts but never answers (sleeping PC, stale listener)', async () => {
    const stale = await fakeSocks('stale', 'silent');
    const gsearch = await fakeSocks('gsearch');
    track(stale.server); track(gsearch.server);
    const f = new SocksFailover({
      upstreams: [{ name: 'pc', host: '127.0.0.1', port: stale.port }, { name: 'gsearch', host: '127.0.0.1', port: gsearch.port }],
      greetingTimeoutMs: 150,
      log: () => {},
    });
    const port = await start(f);
    const t0 = Date.now();
    await expect(roundTrip(port)).resolves.toBe('gsearch:ping');
    expect(Date.now() - t0).toBeLessThan(2_000);
  });

  it('skips a failed upstream during its cooldown and tries it again afterwards', async () => {
    let now = 1_000_000;
    const stale = await fakeSocks('stale', 'silent');
    const gsearch = await fakeSocks('gsearch');
    track(stale.server); track(gsearch.server);
    const f = new SocksFailover({
      upstreams: [{ name: 'pc', host: '127.0.0.1', port: stale.port }, { name: 'gsearch', host: '127.0.0.1', port: gsearch.port }],
      greetingTimeoutMs: 150,
      cooldownMs: 60_000,
      now: () => now,
      log: () => {},
    });
    const port = await start(f);

    await roundTrip(port);
    expect(stale.connections()).toBe(1);
    await expect(roundTrip(port)).resolves.toBe('gsearch:ping');
    expect(stale.connections()).toBe(1); // still cooling down: not tried
    now += 61_000;
    await roundTrip(port);
    expect(stale.connections()).toBe(2); // retried after the cooldown
  });

  it('waits for a greeting that arrives in pieces', async () => {
    const pc = await fakeSocks('pc');
    track(pc.server);
    const f = new SocksFailover({ upstreams: [{ name: 'pc', host: '127.0.0.1', port: pc.port }], greetingTimeoutMs: 1_000, log: () => {} });
    const port = await start(f);
    await expect(roundTrip(port, 'split', true)).resolves.toBe('pc:split');
  });

  it('drops the connection when no upstream answers', async () => {
    const f = new SocksFailover({
      upstreams: [{ name: 'a', host: '127.0.0.1', port: await closedPort() }, { name: 'b', host: '127.0.0.1', port: await closedPort() }],
      log: () => {},
    });
    const port = await start(f);
    await expect(roundTrip(port)).resolves.toBe('closed');
  });
});

describe('parseUpstreams / parseListen', () => {
  it('parses named and unnamed upstreams in order', () => {
    expect(parseUpstreams('pc=127.0.0.1:27040, gsearch=127.0.0.1:27028')).toEqual([
      { name: 'pc', host: '127.0.0.1', port: 27040 },
      { name: 'gsearch', host: '127.0.0.1', port: 27028 },
    ]);
    expect(parseUpstreams('localhost:1080')).toEqual([{ name: 'upstream1', host: 'localhost', port: 1080 }]);
    expect(parseUpstreams(undefined)).toEqual([]);
  });

  it('rejects malformed entries', () => {
    expect(() => parseUpstreams('pc=127.0.0.1')).toThrow(/Invalid upstream/);
    expect(() => parseUpstreams('pc=127.0.0.1:99999')).toThrow(/Invalid upstream/);
    expect(() => parseUpstreams('a=1.2.3.4:5,')).toThrow(/Empty upstream/);
  });

  it('parses the listen address with a default', () => {
    expect(parseListen(undefined)).toEqual({ host: '127.0.0.1', port: 27030 });
    expect(parseListen('127.0.0.1:27031')).toEqual({ host: '127.0.0.1', port: 27031 });
    expect(() => parseListen('nope')).toThrow(/Invalid listen/);
  });
});
