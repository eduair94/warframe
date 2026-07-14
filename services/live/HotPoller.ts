import { EventEmitter } from 'events';
import { WfmFeed, FeedStatus, mapV1OrdersToNormalized } from './WfmFeed';

export interface HotPollerDeps {
  fetchOrders(url: string): Promise<any[]>; // returns raw v1 orders (res.payload.orders)
  intervalMs: number;
  jitterMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => any;
  clearTimer?: (h: any) => void;
}

/**
 * Reliable near-real-time floor: on each tick, fetches orders for every item in
 * the live set through the existing proxy-backed HTTP stack and emits a full
 * snapshot. Sequential fetches with a small gap keep the proxy pool happy. This
 * is the source that ships; the socket client is an optional upgrade.
 */
export class HotPoller extends EventEmitter implements WfmFeed {
  private live: string[] = [];
  private timer: any = null;
  private running = false;
  private lastUp = true;
  private readonly d: Required<Pick<HotPollerDeps, 'setTimer' | 'clearTimer' | 'now'>> & HotPollerDeps;

  constructor(deps: HotPollerDeps) {
    super();
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
    let anyOk = false;
    let anyFail = false;
    for (const url of this.live) {
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
    const up = anyOk || (!anyFail && this.live.length === 0);
    if (up !== this.lastUp) {
      this.lastUp = up;
      const status: FeedStatus = { source: 'poller', up, detail: up ? 'recovered' : 'fetch failing' };
      this.emit('status', status);
    }
  }
}
