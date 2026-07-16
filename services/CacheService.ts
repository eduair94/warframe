/**
 * @fileoverview Two-tier read-through cache with stampede protection.
 * @module services/CacheService
 *
 * Why this exists
 * ----------------
 * The homepage (`/`) and every aggregate endpoint (market_analytics,
 * sets_comparison, relics_ev, endo_flip, drops/map, riven_weapons) each do a
 * FULL-collection Mongo read plus a heavy in-process transform. The only cache
 * used to be `route-cache` (in-memory, 20s, per-process, lost on every restart
 * and with NO stampede protection). On a restart or a traffic spike the cache
 * was cold, so N concurrent requests each ran the full catalogue scan at the
 * same time -> event loop + Mongo saturation -> SSR frontend timed out -> the
 * site went "down", and recovery was slow because the pileup kept the cache
 * cold. This is the outage the Redis layer is meant to end.
 *
 * What it does
 * ------------
 *  - L1: a tiny in-process cache + in-flight promise dedup. Collapses same-process
 *        concurrency instantly (the biggest amplifier when one worker gets flooded).
 *  - L2: Redis, shared across all pm2 workers and DURABLE across restarts, so a
 *        restart comes up warm. A `SET NX` lock gives cross-process single-flight:
 *        only ONE worker recomputes on a miss, the rest serve the stale copy.
 *  - Stale copy: every value is stored twice — a short "fresh" key and a long
 *        "stale" key. While one worker recomputes, everyone else is served stale
 *        instead of stampeding the DB. Stale also survives an origin outage.
 *  - Graceful degradation: Redis is NEVER a hard dependency. Any Redis error trips
 *        a short circuit-breaker and requests fall back to computing directly
 *        (exactly today's behaviour, just without the durability win). The site
 *        must never break *because* the cache is unreachable.
 */

import Redis from "ioredis";

/** Producer that computes the fresh value on a cache miss. */
type Producer<T> = () => Promise<T>;

interface L1Entry {
  v: any;
  /** epoch ms after which this L1 entry is stale */
  e: number;
}

const FRESH_NS = "wf:cache:fresh:v1:";
const STALE_NS = "wf:cache:stale:v1:";
const LOCK_NS = "wf:cache:lock:v1:";

function num(envVar: string | undefined, def: number): number {
  const n = parseInt(envVar || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

/**
 * Decides whether a produced value is worth caching. We must NOT cache error
 * envelopes (`{ error }` from bError) or empty aggregates (an empty items array
 * from `/` almost always means Mongo wasn't ready, not "no items") — caching
 * those would pin a failure state for the whole TTL.
 */
function isCacheable(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "object" && "error" in value) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export class CacheService {
  private static _instance: CacheService;

  private redis: Redis | null = null;
  /** true only when the Redis connection is 'ready' */
  private healthy = false;
  /** while now < circuitOpenUntil we skip Redis entirely (fast local fallback) */
  private circuitOpenUntil = 0;
  private lastErrLog = 0;

  private readonly l1 = new Map<string, L1Entry>();
  private readonly inflight = new Map<string, Promise<any>>();

  private readonly l1Ms: number;
  private readonly staleMs: number;
  private readonly lockMs: number;
  private readonly circuitMs: number;

  private constructor() {
    // L1 lifetime — deliberately short; L1 is only there to absorb bursts, the
    // shared truth lives in Redis.
    this.l1Ms = num(process.env.CACHE_L1_MS, 3000);
    // How long a stale copy is retained for serve-while-recompute / serve-on-outage.
    this.staleMs = num(process.env.CACHE_STALE_MS, 3600_000); // 1h
    // Single-flight lock lifetime — a safety cap; released explicitly on success.
    // Must comfortably exceed the slowest producer (some aggregates take ~20s on
    // prod) so the lock doesn't lapse mid-background-refresh and let a second
    // worker start a duplicate recompute.
    this.lockMs = num(process.env.CACHE_LOCK_MS, 30_000);
    // Circuit-breaker cooldown after a Redis error, so we don't pay a connect
    // timeout on every request while Redis is down.
    this.circuitMs = num(process.env.CACHE_CIRCUIT_MS, 10_000);
    this.initRedis();
  }

  static getInstance(): CacheService {
    if (!CacheService._instance) CacheService._instance = new CacheService();
    return CacheService._instance;
  }

  private initRedis(): void {
    const url = process.env.REDIS_URL || process.env.REDIS_URL_ALT;
    if (!url) {
      console.warn("[cache] REDIS_URL unset — running L1 (in-process) only");
      return;
    }
    try {
      this.redis = new Redis(url, {
        // Fail fast instead of hanging: if Redis is down, commands reject at once
        // and we degrade to computing directly rather than piling up queued ops.
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        keepAlive: 15000,
        // Bounded reconnect backoff; ioredis keeps trying in the background.
        retryStrategy: (times: number) => Math.min(times * 500, 5000),
        reconnectOnError: () => true,
      });
      this.redis.on("ready", () => {
        this.healthy = true;
        this.circuitOpenUntil = 0;
        console.log("[cache] Redis ready — L2 cache active");
      });
      this.redis.on("error", (e: Error) => this.onRedisError(e));
      this.redis.on("end", () => {
        this.healthy = false;
      });
    } catch (e: any) {
      console.warn("[cache] Redis init failed, L1-only:", e?.message);
      this.redis = null;
    }
  }

  private onRedisError(e: Error): void {
    this.healthy = false;
    this.circuitOpenUntil = Date.now() + this.circuitMs;
    // Throttle log spam to once per circuit window.
    const now = Date.now();
    if (now - this.lastErrLog > this.circuitMs) {
      this.lastErrLog = now;
      console.warn("[cache] Redis error — degrading to L1/direct:", e?.message);
    }
  }

  private redisUsable(): boolean {
    return !!this.redis && this.healthy && Date.now() >= this.circuitOpenUntil;
  }

  // ---- L1 helpers -------------------------------------------------------

  private l1Get(key: string): any | undefined {
    const e = this.l1.get(key);
    if (e && e.e > Date.now()) return e.v;
    if (e) this.l1.delete(key);
    return undefined;
  }

  private l1Set(key: string, v: any): void {
    this.l1.set(key, { v, e: Date.now() + this.l1Ms });
    // Cheap bound so a long-running process can't grow this without limit.
    if (this.l1.size > 500) {
      const cutoff = Date.now();
      for (const [k, ent] of this.l1) if (ent.e <= cutoff) this.l1.delete(k);
      if (this.l1.size > 500) this.l1.delete(this.l1.keys().next().value as string);
    }
  }

  // ---- Redis helpers (all swallow errors -> trip circuit) ----------------

  private async rGet(key: string): Promise<any | undefined> {
    if (!this.redisUsable()) return undefined;
    try {
      const raw = await this.redis!.get(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch (e: any) {
      this.onRedisError(e);
      return undefined;
    }
  }

  private async rSet(key: string, value: any, ttlMs: number): Promise<void> {
    if (!this.redisUsable()) return;
    try {
      await this.redis!.set(key, JSON.stringify(value), "PX", ttlMs);
    } catch (e: any) {
      this.onRedisError(e);
    }
  }

  /** SET NX — returns true iff we won the single-flight lock. */
  private async rLock(key: string): Promise<boolean> {
    if (!this.redisUsable()) return false;
    try {
      const r = await this.redis!.set(key, "1", "PX", this.lockMs, "NX");
      return r === "OK";
    } catch (e: any) {
      this.onRedisError(e);
      return false;
    }
  }

  private async rDel(key: string): Promise<void> {
    if (!this.redisUsable()) return;
    try {
      await this.redis!.del(key);
    } catch (e: any) {
      this.onRedisError(e);
    }
  }

  // ---- Public API --------------------------------------------------------

  /**
   * Read-through with stampede protection.
   *
   * @param key      logical cache key (Express passes req.originalUrl)
   * @param freshMs  how long the value stays "fresh" before a recompute
   * @param producer computes the value on a miss
   */
  async getOrSet<T>(key: string, freshMs: number, producer: Producer<T>): Promise<T> {
    // 1) L1 fresh hit — no Redis round-trip.
    const l1 = this.l1Get(key);
    if (l1 !== undefined) return l1 as T;

    // 2) A load is already running in THIS process — join it (per-process dedup).
    const running = this.inflight.get(key);
    if (running) return running as Promise<T>;

    const p = this.load<T>(key, freshMs, producer).finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  private async load<T>(key: string, freshMs: number, producer: Producer<T>): Promise<T> {
    const freshKey = FRESH_NS + key;
    const staleKey = STALE_NS + key;
    const lockKey = LOCK_NS + key;

    // Redis unhealthy -> compute directly, keep only an L1 copy.
    if (!this.redisUsable()) {
      const v = await producer();
      if (isCacheable(v)) this.l1Set(key, v);
      return v;
    }

    // L2 fresh hit.
    const fresh = await this.rGet(freshKey);
    if (fresh !== undefined) {
      this.l1Set(key, fresh);
      return fresh as T;
    }

    // Fresh expired. Serve the STALE copy INSTANTLY and refresh in the
    // background — no HTTP request ever blocks on the (potentially very slow,
    // ~20s on prod) recompute. Without this, whichever request wins the lock
    // waits the full recompute and times out through Cloudflare (504/500) every
    // time the fresh TTL lapses. This is stale-while-revalidate at the origin.
    const stale = await this.rGet(staleKey);
    if (stale !== undefined) {
      this.l1Set(key, stale);
      // Only ONE worker refreshes (single-flight via the NX lock); the rest just
      // serve stale. Fire-and-forget — we do NOT await it.
      if (await this.rLock(lockKey)) {
        this.refreshInBackground(key, freshKey, staleKey, lockKey, freshMs, producer);
      }
      return stale as T;
    }

    // COLD START: no fresh AND no stale (first ever hit for this key, or the
    // stale copy aged out). Someone has to block and compute — but only the lock
    // winner does; the rest wait briefly for it to publish rather than stampede.
    const gotLock = await this.rLock(lockKey);
    if (gotLock) {
      try {
        const v = await producer();
        if (isCacheable(v)) {
          this.l1Set(key, v);
          await this.rSet(freshKey, v, freshMs);
          await this.rSet(staleKey, v, this.staleMs);
        }
        return v;
      } finally {
        await this.rDel(lockKey);
      }
    }

    // Not the writer — wait for the winner to publish fresh (or a stale copy to
    // appear) instead of stampeding the DB ourselves.
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const nowFresh = await this.rGet(freshKey);
      if (nowFresh !== undefined) {
        this.l1Set(key, nowFresh);
        return nowFresh as T;
      }
      const nowStale = await this.rGet(staleKey);
      if (nowStale !== undefined) {
        this.l1Set(key, nowStale);
        return nowStale as T;
      }
    }

    // Writer is slow/dead — compute ourselves as a last resort (still publish it).
    const v = await producer();
    if (isCacheable(v)) {
      this.l1Set(key, v);
      await this.rSet(freshKey, v, freshMs);
      await this.rSet(staleKey, v, this.staleMs);
    }
    return v;
  }

  /**
   * Recompute a key off the request path and publish the result. Never throws
   * (a failed refresh just leaves the existing stale copy in place) and always
   * releases the lock.
   */
  private refreshInBackground<T>(
    key: string,
    freshKey: string,
    staleKey: string,
    lockKey: string,
    freshMs: number,
    producer: Producer<T>
  ): void {
    void (async () => {
      try {
        const v = await producer();
        if (isCacheable(v)) {
          this.l1Set(key, v);
          await this.rSet(freshKey, v, freshMs);
          await this.rSet(staleKey, v, this.staleMs);
        }
      } catch (e: any) {
        const now = Date.now();
        if (now - this.lastErrLog > this.circuitMs) {
          this.lastErrLog = now;
          console.warn("[cache] background refresh failed for", key, "-", e?.message);
        }
      } finally {
        await this.rDel(lockKey);
      }
    })();
  }

  /** For tests / graceful shutdown. */
  async close(): Promise<void> {
    this.l1.clear();
    this.inflight.clear();
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch {
        /* ignore */
      }
      this.redis = null;
      this.healthy = false;
    }
  }
}

export const cache = CacheService.getInstance();
