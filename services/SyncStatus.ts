/**
 * @fileoverview Heartbeat of the price sync, readable from /health
 * @module services/SyncStatus
 *
 * Prices were frozen from 2026-11-04 to 2026-11-20. /health said how old the
 * newest price was, but not why: the sync runs on another host (see
 * ecosystem.sync.config.js), so the API could not tell "warframe.market's
 * Cloudflare is challenging the egress" from "the sync process is dead" or
 * "the database tunnel is down". The sync now writes one status document
 * (collection `warframe-sync-status`) about once a minute, and /health turns
 * it into `prices_sync`, which the uptime monitor quotes in its alert.
 */

export const SYNC_STATUS_COLLECTION = 'warframe-sync-status';
/** Document id of the price sync's status. */
export const PRICES_SYNC_ID = 'prices';

/** What a running sync reports. Dates are stored as BSON dates. */
export interface SyncStatusReport {
  host: string;
  /** Credential-free egress label (services/WfmProxy.ts proxyLabel). */
  egress: string;
  pid: number;
  clientVersion: string;
  budgetRps: number;
  startedAt: Date;
  heartbeatAt: Date;
  lastSavedAt: Date | null;
  /** Counters since `startedAt`. */
  saved: number;
  skipped: number;
  failed: number;
  removed: number;
  /** When warframe.market's breaker closes again, while a challenge is being waited out. */
  blockedUntil: Date | null;
  lastError: string | null;
  lastErrorAt: Date | null;
  /** Scheduler state (services/PriceRefreshScheduler.ts snapshot). */
  queue: { total: number; due: number; hot: number; never: number; oldestAgeS: number | null };
}

export type SyncState = 'syncing' | 'idle' | 'blocked' | 'stalled' | 'unknown';

/** /health view of the price sync. */
export interface PricesSyncHealth {
  state: SyncState;
  heartbeat_age_s: number | null;
  host: string | null;
  egress: string | null;
  blocked_until: string | null;
  last_saved_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  due: number | null;
  oldest_age_s: number | null;
}

/** A heartbeat older than this means the process is dead, hung or cannot reach the database. */
export const SYNC_STALLED_AFTER_MS = 10 * 60_000;

const iso = (value: unknown): string | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Pure: classifies a stored status document (or its absence). */
export function summarizeSyncStatus(doc: Partial<SyncStatusReport> | null | undefined, now: number): PricesSyncHealth {
  if (!doc || !doc.heartbeatAt) {
    return {
      state: 'unknown', heartbeat_age_s: null, host: null, egress: null, blocked_until: null,
      last_saved_at: null, last_error: null, last_error_at: null, due: null, oldest_age_s: null,
    };
  }
  const heartbeat = new Date(doc.heartbeatAt as any).getTime();
  const blockedUntil = doc.blockedUntil ? new Date(doc.blockedUntil as any).getTime() : 0;
  const ageMs = Number.isFinite(heartbeat) ? Math.max(0, now - heartbeat) : Infinity;
  let state: SyncState;
  if (ageMs > SYNC_STALLED_AFTER_MS) state = 'stalled';
  else if (blockedUntil > now) state = 'blocked';
  else state = (doc.queue?.due ?? 0) > 0 ? 'syncing' : 'idle';
  return {
    state,
    heartbeat_age_s: Number.isFinite(ageMs) ? Math.round(ageMs / 1000) : null,
    host: doc.host ?? null,
    egress: doc.egress ?? null,
    blocked_until: blockedUntil > now ? iso(doc.blockedUntil) : null,
    last_saved_at: iso(doc.lastSavedAt),
    last_error: doc.lastError ? String(doc.lastError).slice(0, 200) : null,
    last_error_at: iso(doc.lastErrorAt),
    due: doc.queue?.due ?? null,
    oldest_age_s: doc.queue?.oldestAgeS ?? null,
  };
}

/**
 * Returns a getter that reads the status at most once per `ttlMs` (the monitor
 * and watchdog poll /health) and never throws.
 */
export function createSyncStatusReader(
  fetchDoc: () => Promise<Partial<SyncStatusReport> | null>,
  ttlMs = 30_000,
  now: () => number = () => Date.now()
): () => Promise<PricesSyncHealth> {
  let cache: { at: number; doc: Partial<SyncStatusReport> | null } | null = null;
  return async () => {
    if (!cache || now() - cache.at >= ttlMs) {
      let doc: Partial<SyncStatusReport> | null = null;
      try {
        doc = await fetchDoc();
      } catch {
        doc = null;
      }
      cache = { at: now(), doc };
    }
    return summarizeSyncStatus(cache.doc, now());
  };
}
