import { EventEmitter } from 'events';
import { WfmFeed, FeedStatus, mapV1OrdersToNormalized } from './WfmFeed';

export interface HotPollerDeps {
  fetchOrders(url: string): Promise<any[]>; // returns raw v1 orders (res.payload.orders)
  intervalMs: number;
  concurrency?: number; // items fetched in parallel per sweep (default 12)
  jitterMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => any;
  clearTimer?: (h: any) => void;
}

/**
 * Reliable near-real-time floor: on each tick, fetches orders for every item in
 * the live set through the existing proxy-backed HTTP stack and emits a full
 * snapshot. Fetches run with bounded concurrency so a full sweep stays fast (a
 * sequential sweep of ~40 items took ~20s -> updates felt static); this keeps the
 * proxy pool busy but bounded. This is the source that ships; the socket client
 * is an optional upgrade.
 */
export class HotPoller extends EventEmitter implements WfmFeed {
  private live: string[] = [];
  private timer: any = null;
  private running = false;
  private lastUp = true;
  private readonly concurrency: number;
  private readonly d: Required<Pick<HotPollerDeps, 'setTimer' | 'clearTimer' | 'now'>> & HotPollerDeps;

  constructor(deps: HotPollerDeps) {
    super();
    this.concurrency = Math.max(1, deps.concurrency ?? 12);
    this.d = {
      ...deps,
      now: deps.now ?? (() => Date.now()),
      setTimer: deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms)),
      clearTimer: deps.clearTimer ?? ((h) => clearTimeout(h)),
    };
  }

  setLiveSet(urls: string[]): void { this.live = Array.from(new Set(urls)); }
  subscribe(url: string): void { if (!this.live.includes(url)) this.live.push(url); }
  unsubscribe(url: string): void { this.live = this.live.filter((u) => u !== url); }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.tick().finally(() => {
        if (this.running) this.timer = this.d.setTimer(loop, this.d.intervalMs);
      });
    };
    loop();
  }
  stop(): void {
    this.running = false;
    if (this.timer) this.d.clearTimer(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    const urls = this.live.slice();
    let anyOk = false;
    let anyFail = false;
    let idx = 0;
    const worker = async (): Promise<void> => {
      while (idx < urls.length) {
        const url = urls[idx++];
        try {
          const raw = await this.d.fetchOrders(url);
          const orders = mapV1OrdersToNormalized(raw);
          this.emit('snapshot', { url_name: url, orders });
          anyOk = true;
        } catch (e: any) {
          anyFail = true;
          // one failed item shouldn't stop the rest; proxy layer already retried
        }
      }
    };
    const workers = Math.max(1, Math.min(this.concurrency, urls.length || 1));
    await Promise.all(Array.from({ length: workers }, () => worker()));
    const up = anyOk || (!anyFail && urls.length === 0);
    if (up !== this.lastUp) {
      this.lastUp = up;
      const status: FeedStatus = { source: 'poller', up, detail: up ? 'recovered' : 'fetch failing' };
      this.emit('status', status);
    }
  }
}
