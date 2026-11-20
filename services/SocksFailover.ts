/**
 * @fileoverview Local SOCKS5 front that fails over between upstream SOCKS5 egresses
 * @module services/SocksFailover
 *
 * The price sync talks to warframe.market through one SOCKS URL
 * (WFM_PROXY_URL). Since 2026-11-20 the sync host has two egresses:
 *  - a reverse tunnel from the owner's PC (residential IP: fast, but only up
 *    while the PC is on and awake), and
 *  - the gsearch SSH tunnel (always up, but warframe.market answers it slowly).
 *
 * This front listens on one local port and, per connection, uses the first
 * upstream that answers the client's SOCKS5 greeting within
 * `greetingTimeoutMs`. Each upstream's SOCKS server is the SSH client on the
 * far end, so a sleeping PC, a dead link or a stale listener all show up as a
 * missing greeting reply. A failed upstream is skipped for `cooldownMs`, then
 * tried again. Bytes are relayed untouched, so the SOCKS URL, the remote-DNS
 * hostname restrictions on each SSH key and the request pacing all stay as
 * they are.
 *
 * This is availability failover between egresses we operate. It never reacts
 * to warframe.market's answers: a Cloudflare challenge on one egress still
 * opens the client's breaker (services/WfmRateLimiter.ts) instead of moving
 * the traffic elsewhere.
 */

import net from 'net';

export interface SocksUpstream {
  name: string;
  host: string;
  port: number;
}

export interface SocksFailoverOptions {
  upstreams: SocksUpstream[];
  /** Max wait for an upstream to connect and answer the SOCKS5 greeting. */
  greetingTimeoutMs?: number;
  /** How long a failed upstream is skipped before it is tried again. */
  cooldownMs?: number;
  log?: (message: string) => void;
  now?: () => number;
}

/** Parses `name=host:port,name=host:port` (name optional). */
export function parseUpstreams(spec: string | undefined): SocksUpstream[] {
  if (!spec) return [];
  return spec.split(',').map((part, i) => {
    const raw = part.trim();
    if (!raw) throw new Error('Empty upstream in list');
    const eq = raw.indexOf('=');
    const name = eq > 0 ? raw.slice(0, eq).trim() : `upstream${i + 1}`;
    const address = eq > 0 ? raw.slice(eq + 1).trim() : raw;
    const m = /^([^:\s]+):(\d{1,5})$/.exec(address);
    const port = m ? Number(m[2]) : NaN;
    if (!m || port < 1 || port > 65535) throw new Error(`Invalid upstream "${raw}" (expected name=host:port)`);
    return { name, host: m[1]!, port };
  });
}

/** Parses `host:port`. */
export function parseListen(spec: string | undefined, fallback = '127.0.0.1:27030'): { host: string; port: number } {
  const value = (spec || fallback).trim();
  const m = /^([^:\s]+):(\d{1,5})$/.exec(value);
  const port = m ? Number(m[2]) : NaN;
  if (!m || port < 1 || port > 65535) throw new Error(`Invalid listen address "${value}"`);
  return { host: m[1]!, port };
}

export class SocksFailover {
  private readonly upstreams: SocksUpstream[];
  private readonly greetingTimeoutMs: number;
  private readonly cooldownMs: number;
  private readonly log: (message: string) => void;
  private readonly now: () => number;
  /** Upstream name -> time until which it is skipped. */
  private readonly downUntil = new Map<string, number>();
  private active: string | null = null;
  readonly server: net.Server;

  constructor(opts: SocksFailoverOptions) {
    if (!opts.upstreams.length) throw new Error('SocksFailover needs at least one upstream');
    this.upstreams = opts.upstreams;
    this.greetingTimeoutMs = opts.greetingTimeoutMs ?? 4_000;
    this.cooldownMs = opts.cooldownMs ?? 60_000;
    this.log = opts.log ?? ((m) => console.log(m));
    this.now = opts.now ?? (() => Date.now());
    this.server = net.createServer((client) => this.handle(client));
  }

  listen(port: number, host = '127.0.0.1'): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(port, host, () => {
        this.server.off('error', reject);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    return new Promise((resolve) => this.server.close(() => resolve()));
  }

  /** Name of the upstream the last connection used, or null before the first one. */
  activeUpstream(): string | null {
    return this.active;
  }

  /** Upstreams in try order: healthy ones first (configured order), then cooling ones. */
  private order(): SocksUpstream[] {
    const now = this.now();
    const healthy = this.upstreams.filter((u) => (this.downUntil.get(u.name) ?? 0) <= now);
    const cooling = this.upstreams.filter((u) => (this.downUntil.get(u.name) ?? 0) > now);
    return [...healthy, ...cooling];
  }

  private handle(client: net.Socket): void {
    client.on('error', () => client.destroy());
    let buffered = Buffer.alloc(0);
    const onData = (chunk: Buffer) => {
      buffered = Buffer.concat([buffered, chunk]);
      // SOCKS5 greeting = VER(5) NMETHODS METHODS... Wait for all of it, so a
      // split greeting is not mistaken for an upstream that does not answer.
      const complete = buffered[0] !== 5 || (buffered.length >= 2 && buffered.length >= 2 + buffered[1]!);
      if (!complete) return;
      client.off('data', onData);
      client.pause();
      this.tryNext(client, buffered, this.order(), 0);
    };
    client.on('data', onData);
  }

  private tryNext(client: net.Socket, greeting: Buffer, order: SocksUpstream[], index: number): void {
    if (client.destroyed) return;
    const upstream = order[index];
    if (!upstream) {
      this.log('egress failover: no upstream answered, dropping connection');
      client.destroy();
      return;
    }

    let settled = false;
    const up = net.connect({ host: upstream.host, port: upstream.port });
    const fail = (reason: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      up.destroy();
      this.markDown(upstream, reason);
      this.tryNext(client, greeting, order, index + 1);
    };
    const timer = setTimeout(() => fail('no SOCKS greeting reply'), this.greetingTimeoutMs);

    up.once('error', (err) => fail(err.message));
    up.once('close', () => fail('closed before replying'));
    up.once('connect', () => up.write(greeting));
    up.once('data', (reply: Buffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      up.removeAllListeners('close');
      up.removeAllListeners('error');
      this.markUp(upstream);
      if (client.destroyed) {
        up.destroy();
        return;
      }
      const teardown = () => {
        client.destroy();
        up.destroy();
      };
      up.on('error', teardown);
      up.on('close', teardown);
      client.on('close', teardown);
      client.write(reply);
      client.pipe(up);
      up.pipe(client);
      client.resume();
    });
  }

  private markDown(upstream: SocksUpstream, reason: string): void {
    const wasUp = (this.downUntil.get(upstream.name) ?? 0) <= this.now();
    this.downUntil.set(upstream.name, this.now() + this.cooldownMs);
    if (wasUp) this.log(`egress failover: ${upstream.name} unavailable (${reason}), skipping it for ${Math.round(this.cooldownMs / 1000)}s`);
  }

  private markUp(upstream: SocksUpstream): void {
    this.downUntil.delete(upstream.name);
    if (this.active !== upstream.name) {
      this.log(`egress failover: using ${upstream.name} (${upstream.host}:${upstream.port})`);
      this.active = upstream.name;
    }
  }
}
