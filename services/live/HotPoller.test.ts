import { HotPoller } from './HotPoller';
import { FeedSnapshot, FeedStatus } from './WfmFeed';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe('HotPoller', () => {
  it('emits a normalized snapshot for each live item on tick', async () => {
    const calls: string[] = [];
    const poller = new HotPoller({
      intervalMs: 1000,
      fetchOrders: async (url) => {
        calls.push(url);
        return [{ id: 'o1', order_type: 'sell', platinum: 12, platform: 'pc', user: { id: 'u', status: 'ingame' } }];
      },
      setTimer: () => 0, clearTimer: () => {},
    });
    const snaps: FeedSnapshot[] = [];
    poller.on('snapshot', (s: FeedSnapshot) => snaps.push(s));
    poller.setLiveSet(['a', 'b']);
    await (poller as any).tick();
    expect(calls.sort()).toEqual(['a', 'b']);
    expect(snaps.map((s) => s.url_name).sort()).toEqual(['a', 'b']);
    expect(snaps[0].orders[0].platinum).toBe(12);
  });

  it('emits status down then up around a fetch failure', async () => {
    let fail = true;
    const statuses: FeedStatus[] = [];
    const poller = new HotPoller({
      intervalMs: 1000,
      fetchOrders: async () => { if (fail) throw new Error('boom'); return []; },
      setTimer: () => 0, clearTimer: () => {},
    });
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.setLiveSet(['a']);
    await (poller as any).tick();          // fails
    fail = false;
    await (poller as any).tick();          // recovers
    expect(statuses.some((s) => s.up === false)).toBe(true);
    expect(statuses.some((s) => s.up === true)).toBe(true);
  });

  it('reports its first successful fetch even when the valid order book is empty', async () => {
    const poller = new HotPoller({ intervalMs: 1000, fetchOrders: async () => [] });
    const statuses: FeedStatus[] = [];
    const snaps: FeedSnapshot[] = [];
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.on('snapshot', (s: FeedSnapshot) => snaps.push(s));
    poller.setLiveSet(['a']);
    await (poller as any).tick();
    await (poller as any).tick();
    expect(statuses.map((s) => s.up)).toEqual([true]);
    expect(snaps).toEqual([
      { url_name: 'a', orders: [] },
      { url_name: 'a', orders: [] },
    ]);
  });

  it('does not claim recovery when the live set is empty', async () => {
    const fetchOrders = jest.fn(async (): Promise<any[]> => { throw new Error('down'); });
    const poller = new HotPoller({ intervalMs: 1000, fetchOrders });
    const statuses: FeedStatus[] = [];
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    await (poller as any).tick();
    expect(fetchOrders).not.toHaveBeenCalled();
    expect(statuses.map((s) => s.up)).toEqual([false]);
    poller.setLiveSet(['a']);
    await (poller as any).tick();
    poller.setLiveSet([]);
    await (poller as any).tick();
    expect(statuses.map((s) => s.up)).toEqual([false]);
  });

  it('reports down when a previously successful live set becomes empty', async () => {
    const poller = new HotPoller({ intervalMs: 1000, fetchOrders: async () => [] });
    const statuses: FeedStatus[] = [];
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.setLiveSet(['a']);
    await (poller as any).tick();
    poller.setLiveSet([]);
    await (poller as any).tick();
    expect(statuses.map((s) => s.up)).toEqual([true, false]);
  });

  it('reports initial failure while another request remains pending, then recovers on success', async () => {
    const a = deferred<any[]>();
    const b = deferred<any[]>();
    const poller = new HotPoller({
      intervalMs: 1000, concurrency: 2,
      fetchOrders: (url) => url === 'a' ? a.promise : b.promise,
    });
    const statuses: FeedStatus[] = [];
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.setLiveSet(['a', 'b']);
    let settled = false;
    const sweep = (poller as any).tick().then(() => { settled = true; });
    a.reject(new Error('down'));
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(statuses.map((s) => s.up)).toEqual([false]);
    b.resolve([]);
    await sweep;
    expect(statuses.map((s) => s.up)).toEqual([false, true]);
  });

  it('reports first success while another request remains pending and keeps it after a later failure', async () => {
    const a = deferred<any[]>();
    const b = deferred<any[]>();
    const poller = new HotPoller({
      intervalMs: 1000, concurrency: 2,
      fetchOrders: (url) => url === 'a' ? a.promise : b.promise,
    });
    const statuses: FeedStatus[] = [];
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.setLiveSet(['a', 'b']);
    let settled = false;
    const sweep = (poller as any).tick().then(() => { settled = true; });
    a.resolve([]);
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(statuses.map((s) => s.up)).toEqual([true]);
    b.reject(new Error('down'));
    await sweep;
    expect(statuses.map((s) => s.up)).toEqual([true]);
  });

  it('does not carry a successful sweep into a later failing sweep', async () => {
    let fail = false;
    const poller = new HotPoller({
      intervalMs: 1000,
      fetchOrders: async () => { if (fail) throw new Error('down'); return []; },
    });
    const statuses: FeedStatus[] = [];
    const snaps: FeedSnapshot[] = [];
    poller.on('status', (s: FeedStatus) => statuses.push(s));
    poller.on('snapshot', (s: FeedSnapshot) => snaps.push(s));
    poller.setLiveSet(['a', 'b']);
    await (poller as any).tick();
    fail = true;
    await (poller as any).tick();
    expect(statuses.map((s) => s.up)).toEqual([true, false]);
    expect(snaps).toHaveLength(2);
  });
});
