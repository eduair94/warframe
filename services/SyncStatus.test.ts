/**
 * @fileoverview /health's prices_sync: why prices are (not) updating
 */

import { describe, it, expect, jest } from '@jest/globals';
import { SYNC_STALLED_AFTER_MS, createSyncStatusReader, summarizeSyncStatus } from './SyncStatus';

const NOW = Date.parse('2026-11-20T12:00:00Z');

function doc(overrides: Record<string, unknown> = {}) {
  return {
    host: 'sync-host',
    egress: 'socks5h://127.0.0.1:27028',
    heartbeatAt: new Date(NOW - 30_000),
    lastSavedAt: new Date(NOW - 45_000),
    blockedUntil: null,
    lastError: null,
    lastErrorAt: null,
    queue: { total: 3900, due: 12, hot: 4, never: 0, oldestAgeS: 7200 },
    ...overrides,
  } as any;
}

describe('summarizeSyncStatus', () => {
  it('is unknown when the sync never reported', () => {
    expect(summarizeSyncStatus(null, NOW)).toMatchObject({ state: 'unknown', heartbeat_age_s: null });
  });

  it('is syncing with a fresh heartbeat and due work', () => {
    expect(summarizeSyncStatus(doc(), NOW)).toEqual({
      state: 'syncing',
      heartbeat_age_s: 30,
      host: 'sync-host',
      egress: 'socks5h://127.0.0.1:27028',
      blocked_until: null,
      last_saved_at: '2026-11-20T11:59:15.000Z',
      last_error: null,
      last_error_at: null,
      due: 12,
      oldest_age_s: 7200,
    });
  });

  it('is idle when nothing is due', () => {
    expect(summarizeSyncStatus(doc({ queue: { total: 1, due: 0, hot: 0, never: 0, oldestAgeS: 60 } }), NOW).state).toBe('idle');
  });

  it('is blocked while warframe.market challenges the egress', () => {
    const s = summarizeSyncStatus(doc({
      blockedUntil: new Date(NOW + 600_000),
      lastError: 'Cloudflare challenge from warframe.market (403)',
      lastErrorAt: new Date(NOW - 300_000),
    }), NOW);
    expect(s.state).toBe('blocked');
    expect(s.blocked_until).toBe('2026-11-20T12:10:00.000Z');
    expect(s.last_error).toMatch(/Cloudflare challenge/);
  });

  it('is stalled when the heartbeat is old, whatever else it says', () => {
    const s = summarizeSyncStatus(doc({
      heartbeatAt: new Date(NOW - SYNC_STALLED_AFTER_MS - 1000),
      blockedUntil: new Date(NOW + 600_000),
    }), NOW);
    expect(s.state).toBe('stalled');
  });

  it('truncates long error messages', () => {
    expect(summarizeSyncStatus(doc({ lastError: 'x'.repeat(500) }), NOW).last_error).toHaveLength(200);
  });
});

describe('createSyncStatusReader', () => {
  it('reads at most once per ttl and survives a failing read', async () => {
    let now = NOW;
    const fetchDoc = jest.fn(async () => { throw new Error('mongo down'); });
    const read = createSyncStatusReader(fetchDoc as any, 30_000, () => now);

    await expect(read()).resolves.toMatchObject({ state: 'unknown' });
    now += 10_000;
    await read();
    expect(fetchDoc).toHaveBeenCalledTimes(1);
    now += 30_000;
    await read();
    expect(fetchDoc).toHaveBeenCalledTimes(2);
  });
});
