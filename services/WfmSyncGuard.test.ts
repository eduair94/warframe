/**
 * @fileoverview Unit tests for WfmSyncGuard (warframe.market syncs parked on the API host)
 */

import { describe, it, expect, jest } from '@jest/globals';
import { parkIfWfmSyncOffHost, wfmSyncEnabled } from './WfmSyncGuard';

function deps() {
  return {
    exit: jest.fn<(code: number) => void>(),
    keepAlive: jest.fn<() => void>(),
    log: jest.fn<(msg: string) => void>(),
  };
}

describe('wfmSyncEnabled', () => {
  it('defaults to enabled', () => {
    expect(wfmSyncEnabled({})).toBe(true);
    expect(wfmSyncEnabled({ WFM_SYNC_ENABLED: 'true' })).toBe(true);
  });

  it('is disabled only by an explicit "false"', () => {
    expect(wfmSyncEnabled({ WFM_SYNC_ENABLED: 'false' })).toBe(false);
  });
});

describe('parkIfWfmSyncOffHost', () => {
  it('lets the sync run when enabled', () => {
    const d = deps();
    expect(parkIfWfmSyncOffHost('sync-prices', { longRunning: true }, { env: {}, ...d })).toBe(false);
    expect(d.exit).not.toHaveBeenCalled();
    expect(d.keepAlive).not.toHaveBeenCalled();
  });

  it('keeps a long-running sync alive but idle, so pm2 does not restart-loop it', () => {
    const d = deps();
    const parked = parkIfWfmSyncOffHost(
      'sync-prices',
      { longRunning: true },
      { env: { WFM_SYNC_ENABLED: 'false' }, ...d }
    );
    expect(parked).toBe(true);
    expect(d.keepAlive).toHaveBeenCalledTimes(1);
    expect(d.exit).not.toHaveBeenCalled();
    expect(d.log.mock.calls[0]![0]).toMatch(/sync-prices/);
  });

  it('exits a one-shot sync cleanly', () => {
    const d = deps();
    const parked = parkIfWfmSyncOffHost(
      'sync-items',
      { longRunning: false },
      { env: { WFM_SYNC_ENABLED: 'false' }, ...d }
    );
    expect(parked).toBe(true);
    expect(d.exit).toHaveBeenCalledWith(0);
    expect(d.keepAlive).not.toHaveBeenCalled();
  });
});
