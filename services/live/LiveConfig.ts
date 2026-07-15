/**
 * Central env-driven config for the warframe-live process. Pure reader
 * (readLiveConfig) so it is unit-testable; LiveConfig is the frozen instance
 * built from process.env for real use.
 */
export interface LiveConfig {
  port: number;
  feedMode: 'socket' | 'poller' | 'off';
  maxSubscriptions: number;
  pollIntervalMs: number;
  platform: string;
  corsOrigin: string | string[];
  socketPath: string;     // engine.io mount path; the Nuxt app proxies this same path same-origin
  fvHalfVolume: number;   // volume at which avg_price gets 50% weight vs history median
  baseBandPct: number;    // base +/- band (fraction) around FV before a signal fires
  maxBandPct: number;     // cap on the volatility-widened band
  confMin: number;        // below this confidence -> verdict 'hold'
  thinVolume: number;     // 48h volume below this -> thin/rig-risk, verdict forced 'hold'
  pollConcurrency: number;// items fetched in parallel per poll sweep
  fvRefreshMs: number;    // how often the FV baseline is reloaded from Mongo
  hotFloorList: string[]; // always-on url_names regardless of viewers
  newOrders: boolean;     // consume wf.market's live socket for the market-pulse feed
}

function int(v: string | undefined, dflt: number): number {
  const n = v == null ? NaN : parseInt(v, 10);
  return Number.isFinite(n) ? n : dflt;
}
function csv(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

export function readLiveConfig(env: NodeJS.ProcessEnv): LiveConfig {
  const mode = env.LIVE_FEED_MODE;
  const feedMode: LiveConfig['feedMode'] =
    mode === 'socket' || mode === 'off' ? mode : 'poller';
  const origins = csv(env.LIVE_CORS_ORIGIN);
  return {
    port: int(env.LIVE_PORT, 3530),
    feedMode,
    maxSubscriptions: int(env.LIVE_MAX_SUBSCRIPTIONS, 150),
    pollIntervalMs: int(env.LIVE_POLL_INTERVAL_MS, 6000),
    platform: env.LIVE_PLATFORM || 'pc',
    corsOrigin: origins.length === 0 ? '*' : origins.length === 1 ? origins[0] : origins,
    socketPath: env.LIVE_SOCKET_PATH || '/live-io',
    fvHalfVolume: int(env.LIVE_FV_HALF_VOLUME, 50),
    baseBandPct: Number(env.LIVE_BASE_BAND_PCT) || 0.08,
    maxBandPct: Number(env.LIVE_MAX_BAND_PCT) || 0.25,
    confMin: Number(env.LIVE_CONF_MIN) || 0.25,
    thinVolume: Number(env.LIVE_THIN_VOLUME) || 3,
    pollConcurrency: int(env.LIVE_POLL_CONCURRENCY, 12),
    fvRefreshMs: int(env.LIVE_FV_REFRESH_MS, 10 * 60 * 1000),
    hotFloorList: csv(env.LIVE_HOT_FLOOR),
    newOrders: env.LIVE_NEWORDERS !== 'off',
  };
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const LiveConfig: LiveConfig = Object.freeze(readLiveConfig(process.env));
