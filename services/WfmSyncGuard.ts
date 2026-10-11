/**
 * @fileoverview Parks warframe.market syncs on a host that should not run them
 * @module services/WfmSyncGuard
 *
 * The syncs that call warframe.market can run on a separate "sync host"
 * (ecosystem.sync.config.js) while the API host keeps serving. That was
 * needed after 2026-10-02, when Cloudflare challenged the API host's IP: the
 * paced syncs moved to `.10` and write to the prod database over an SSH
 * tunnel. Setting WFM_SYNC_ENABLED=false in the API host's .env parks its
 * copies so the same items are not synced twice:
 *
 * - long-running syncs stay up but idle (exiting would make pm2 restart-loop
 *   them, since they are `autorestart: true`);
 * - one-shot / cron syncs exit 0.
 */

export function wfmSyncEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.WFM_SYNC_ENABLED !== 'false';
}

export interface WfmSyncGuardDeps {
  env?: NodeJS.ProcessEnv;
  exit?: (code: number) => void;
  keepAlive?: () => void;
  log?: (msg: string) => void;
}

/**
 * Returns true when the caller must not run (it has been parked); the caller
 * should then return immediately from its entry point.
 */
export function parkIfWfmSyncOffHost(
  name: string,
  opts: { longRunning: boolean },
  deps: WfmSyncGuardDeps = {}
): boolean {
  const env = deps.env ?? process.env;
  if (wfmSyncEnabled(env)) return false;

  const log = deps.log ?? ((msg: string) => console.log(msg));
  log(`⏸ ${name}: warframe.market syncs run on the sync host (WFM_SYNC_ENABLED=false) - not running here`);

  if (opts.longRunning) {
    const keepAlive = deps.keepAlive ?? (() => setInterval(() => {}, 1 << 30));
    keepAlive();
  } else {
    const exit = deps.exit ?? ((code: number) => process.exit(code));
    exit(0);
  }
  return true;
}
