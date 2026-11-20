/**
 * Incremental warframe.market price sync (long-running; pm2 restarts it).
 *
 * Until 2026-11 this re-downloaded every item's order book in a loop, oldest
 * first, around the clock, while impersonating browsers. warframe.market's rules
 * ask for the opposite (https://docs.warframe.market/docs/rules/overview/):
 * identify yourself, minimize calls, prefer incremental updates. Every egress IP
 * that carried the old traffic was challenged by Cloudflare and stayed
 * challenged for weeks; prices froze from 2026-11-04 to 2026-11-20.
 *
 * Now:
 *  - one `/v2/orders/recent` call a minute says which items just got orders;
 *  - services/PriceRefreshScheduler.ts picks what to refresh: never-priced
 *    items, items with fresh orders (at most every 15 min), then each tier by
 *    age (liquid 2 h, active 6 h, empty 24 h). Nothing due = no requests;
 *  - the request rate is capped by WFM_MAX_RPS (services/WfmRateLimiter.ts),
 *    and every request carries the honest identity (services/WfmIdentity.ts);
 *  - a heartbeat in `warframe-sync-status` lets /health say why prices stop.
 */
import "./env";
import os from "os";
import mongoose from "mongoose";
import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";
import { parkIfWfmSyncOffHost } from "./services/WfmSyncGuard";
import { PriceRefreshScheduler, RefreshOutcome, readPriceRefreshPolicy } from "./services/PriceRefreshScheduler";
import { wfmRateLimiter } from "./services/WfmRateLimiter";
import { proxyLabel, readWfmProxyUrl } from "./services/WfmProxy";
import { WFM_CLIENT_VERSION } from "./services/WfmIdentity";
import { PRICES_SYNC_ID, SYNC_STATUS_COLLECTION, SyncStatusReport } from "./services/SyncStatus";

const int = (value: string | undefined, fallback: number, min: number): number => {
  const n = parseInt(value || "", 10);
  return Number.isFinite(n) ? Math.max(min, n) : fallback;
};

// Throughput is capped by the limiter (WFM_MAX_RPS), not by concurrency: a few
// workers keep that budget busy. Was 50 with proxy rotation until 2026-10-02.
const CONCURRENCY = int(process.env.CONCURRENCY, 4, 1);
/** `/v2/orders/recent` is refreshed upstream once a minute; polling faster gains nothing. */
const FEED_INTERVAL_MS = int(process.env.PRICE_FEED_INTERVAL_S, 60, 60) * 1000;
const RELOAD_INTERVAL_MS = int(process.env.PRICE_CATALOGUE_RELOAD_MIN, 30, 5) * 60_000;
const STATUS_INTERVAL_MS = 60_000;
const IDLE_POLL_MS = 5_000;
/** Exit cleanly after this long; pm2 starts a fresh process. */
const MAX_RUN_MS = int(process.env.PRICE_SYNC_MAX_RUN_MIN, 360, 10) * 60_000;
/** Consecutive database failures before exiting so pm2 restarts the process (e.g. tunnel down). */
const MAX_DB_ERRORS = 20;

const stamp = () => new Date().toISOString().replace("T", " ").split(".")[0];
const log = (icon: string, message: string) => console.log(`[${stamp()}] ${icon} ${message}`);

let running = true;
const wakers = new Set<() => void>();
/** Sleep that ends early on shutdown. */
function nap(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => { clearTimeout(timer); wakers.delete(done); resolve(); };
    const timer = setTimeout(done, ms);
    wakers.add(done);
  });
}
function stop(reason: string) {
  if (!running) return;
  running = false;
  log("🛑", `Stopping: ${reason}`);
  for (const wake of [...wakers]) wake();
}

/** Never overwrite good data with an empty answer. */
function isValidMarket(market: any): boolean {
  if (!market || market.not_found || market.failed) return false;
  return !(market.buy === 0 && market.sell === 0 && market.volume === 0 && market.avg_price === 0);
}

async function main() {
  // Runs on the sync host instead when WFM_SYNC_ENABLED=false (see ecosystem.sync.config.js).
  if (parkIfWfmSyncOffHost("sync-prices", { longRunning: true })) return;

  const policy = readPriceRefreshPolicy();
  const budgetRps = parseFloat(process.env.WFM_MAX_RPS || "0.5");
  log("🚀", `Incremental price sync v${WFM_CLIENT_VERSION} | budget ${budgetRps} req/s | ${CONCURRENCY} workers | ` +
    `liquid ${policy.liquidMaxAgeMs / 60_000}m, active ${policy.activeMaxAgeMs / 60_000}m, ` +
    `idle ${policy.idleMaxAgeMs / 60_000}m, hot every ${policy.hotMinIntervalMs / 60_000}m`);

  await MongooseServer.startConnectionPromise();
  log("✅", "MongoDB connected");

  const m = new WarframeUndici({
    minDelay: 0,
    maxDelay: 0,
    maxRetries: 5,
    // Pacing happens per request in the HTTP client's limiter.
    priceConfig: { ordersMinDelay: 0, ordersMaxDelay: 0, statsMinDelay: 0, statsMaxDelay: 0 },
  });

  const scheduler = new PriceRefreshScheduler<any>(policy);
  scheduler.load(await m.getItemsDatabaseDate());
  log("📦", `Catalogue loaded: ${scheduler.snapshot().total} items`);

  const startedAt = new Date();
  const totals = { saved: 0, skipped: 0, failed: 0, removed: 0 };
  let window = { saved: 0, skipped: 0, failed: 0, removed: 0, feedNew: 0 };
  let lastSavedAt: Date | null = null;
  let lastError: string | null = null;
  let lastErrorAt: Date | null = null;
  let dbErrors = 0;
  let logged = 0;

  const noteError = (message: string) => {
    lastError = message.slice(0, 200);
    lastErrorAt = new Date();
  };

  const writeStatus = async () => {
    const snap = scheduler.snapshot();
    const blocked = wfmRateLimiter.blockedUntilMs();
    const report: SyncStatusReport = {
      host: os.hostname(),
      egress: proxyLabel(readWfmProxyUrl()),
      pid: process.pid,
      clientVersion: WFM_CLIENT_VERSION,
      budgetRps,
      startedAt,
      heartbeatAt: new Date(),
      lastSavedAt,
      ...totals,
      blockedUntil: blocked ? new Date(blocked) : null,
      lastError,
      lastErrorAt,
      queue: {
        total: snap.total, due: snap.due, hot: snap.hot, never: snap.never,
        oldestAgeS: snap.oldestAgeMs === null ? null : Math.round(snap.oldestAgeMs / 1000),
      },
    };
    await mongoose.connection.db!
      .collection<{ _id: string }>(SYNC_STATUS_COLLECTION)
      .updateOne({ _id: PRICES_SYNC_ID }, { $set: report }, { upsert: true });
    return { snap, blocked };
  };

  async function refresh(item: any): Promise<{ outcome: RefreshOutcome; updated?: any }> {
    const t0 = Date.now();
    const market: any = await m.getWarframeItemOrders(item);
    if (!market || market.failed) {
      noteError(`${item.url_name}: ${market?.error || "no result"}`);
      return { outcome: "failed" };
    }
    if (market.not_found) {
      await m.removeItemDB(item.id);
      log("🗑️", `Removed (not on warframe.market): ${item.url_name}`);
      return { outcome: "removed" };
    }
    if (!isValidMarket(market)) return { outcome: "skipped" };
    const priceUpdate = new Date();
    await m.saveItem(item.id, { market, priceUpdate });
    // One history point per item per day; never fails the sync.
    m.recordPriceHistoryPoint(item.url_name, {
      buy: market.buy, sell: market.sell, avg_price: market.avg_price, volume: market.volume,
    }).catch(() => {});
    lastSavedAt = priceUpdate;
    if (logged < 5) {
      logged++;
      log("✓", `${item.url_name} saved (${Date.now() - t0}ms)`);
    }
    return { outcome: "saved", updated: { ...item, market, priceUpdate } };
  }

  async function worker() {
    while (running) {
      const item = scheduler.next();
      if (!item) {
        await nap(IDLE_POLL_MS);
        continue;
      }
      const started = Date.now();
      let result: { outcome: RefreshOutcome; updated?: any } = { outcome: "failed" };
      try {
        result = await refresh(item);
        dbErrors = 0;
      } catch (error: any) {
        // HTTP failures come back as `failed` results; a throw here is the database.
        noteError(`${item.url_name}: ${error?.message || error}`);
        log("❌", `Error: ${item.url_name} - ${error?.message || error}`);
        if (++dbErrors >= MAX_DB_ERRORS) stop(`${dbErrors} consecutive database errors`);
      }
      scheduler.complete(item.url_name, result.outcome, started, result.updated);
      totals[result.outcome]++;
      window[result.outcome]++;
    }
  }

  async function feedLoop() {
    while (running) {
      try {
        const orders = await m.getRecentOrders();
        for (const order of orders) {
          const at = Date.parse(order.updatedAt || order.createdAt || "");
          // Only an order that can move the stored price makes the item hot.
          if (scheduler.noteActivity(order.itemId, at, order)) window.feedNew++;
        }
      } catch (error: any) {
        noteError(`recent feed: ${error?.message || error}`);
      }
      await nap(FEED_INTERVAL_MS);
    }
  }

  async function reloadLoop() {
    while (running) {
      await nap(RELOAD_INTERVAL_MS);
      if (!running) break;
      try {
        scheduler.load(await m.getItemsDatabaseDate());
      } catch (error: any) {
        noteError(`catalogue reload: ${error?.message || error}`);
      }
    }
  }

  async function statusLoop() {
    while (running) {
      try {
        const { snap, blocked } = await writeStatus();
        const oldest = snap.oldestAgeMs === null ? "-" : `${(snap.oldestAgeMs / 3_600_000).toFixed(1)}h`;
        log("📈", `last min: saved ${window.saved}, skipped ${window.skipped}, failed ${window.failed}, ` +
          `removed ${window.removed}, feed news ${window.feedNew} | queue: due ${snap.due}, hot ${snap.hot}, ` +
          `new ${snap.never}, oldest ${oldest}` +
          (blocked ? ` | ⛔ warframe.market challenge, paused until ${new Date(blocked).toISOString()}` : ""));
      } catch (error: any) {
        log("⚠️", `Status write failed: ${error?.message || error}`);
      }
      window = { saved: 0, skipped: 0, failed: 0, removed: 0, feedNew: 0 };
      await nap(STATUS_INTERVAL_MS);
    }
  }

  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));
  const deadline = setTimeout(() => stop(`planned restart after ${MAX_RUN_MS / 60_000} min`), MAX_RUN_MS);

  await Promise.all([
    feedLoop(),
    reloadLoop(),
    statusLoop(),
    ...Array.from({ length: CONCURRENCY }, () => worker()),
  ]);
  clearTimeout(deadline);

  await writeStatus().catch(() => {});
  log("🏁", `Done: saved ${totals.saved}, skipped ${totals.skipped}, failed ${totals.failed}, removed ${totals.removed}`);
  process.exit(dbErrors >= MAX_DB_ERRORS ? 1 : 0);
}

main().catch((error) => {
  log("💥", `Fatal error: ${error?.message || error}`);
  console.error(error);
  process.exit(1);
});
