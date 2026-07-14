/**
 * Decides which items get a live subscription. hotFloor is always live; the rest
 * of the cap is filled by the most-viewed items. Anything subscribed beyond the
 * cap is "overflow" — LiveGateway routes it to the poller at a slower cadence
 * (or drops it entirely under mode=off).
 */
export class SubscriptionManager {
  private readonly viewers = new Map<string, number>();
  private readonly maxSubscriptions: number;
  private readonly hotFloor: string[];

  constructor(opts: { maxSubscriptions: number; hotFloor: string[] }) {
    this.maxSubscriptions = opts.maxSubscriptions;
    this.hotFloor = Array.from(new Set(opts.hotFloor));
  }

  addViewer(url: string): void {
    this.viewers.set(url, (this.viewers.get(url) ?? 0) + 1);
  }
  removeViewer(url: string): void {
    const n = (this.viewers.get(url) ?? 0) - 1;
    if (n <= 0) this.viewers.delete(url);
    else this.viewers.set(url, n);
  }
  viewerCount(url: string): number {
    return this.viewers.get(url) ?? 0;
  }

  private ranked(): string[] {
    const floor = new Set(this.hotFloor);
    const viewed = Array.from(this.viewers.entries())
      .filter(([url]) => !floor.has(url))
      .sort((a, b) => b[1] - a[1])
      .map(([url]) => url);
    return [...this.hotFloor, ...viewed];
  }

  liveSet(): string[] {
    return this.ranked().slice(0, this.maxSubscriptions);
  }
  overflow(): string[] {
    return this.ranked().slice(this.maxSubscriptions);
  }
}
