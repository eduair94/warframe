import { HotPoller } from './HotPoller';
import { FeedSnapshot, FeedStatus } from './WfmFeed';

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
});
