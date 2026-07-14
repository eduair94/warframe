import { LiveGateway } from './LiveGateway';
import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { HotPoller } from './HotPoller';
import { LiveUpdate } from './LiveTypes';

it('poller tick flows all the way to a broadcast verdict', async () => {
  const orders = [
    { id: '1', order_type: 'sell', platinum: 70, visible: true, platform: 'pc', user: { id: 'a', status: 'ingame' } },
    { id: '2', order_type: 'buy', platinum: 60, visible: true, platform: 'pc', user: { id: 'b', status: 'ingame' } },
  ];
  const poller = new HotPoller({
    intervalMs: 10_000,
    fetchOrders: async () => orders,
    setTimer: () => 0, clearTimer: () => {},
  });
  const store = new LiveStore('pc');
  const fairValue = new FairValueService({
    getItems: async () => [{ url_name: 'a', market: { avg_price: 100, sell: 100, volume: 80 } }],
    getHistory: async () => [
      { date: '2026-01-01', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-02', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-03', buy: 0, sell: 0, avg_price: 100, volume: 5 },
    ],
  });
  const subs = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: ['a'] });
  const broadcasts: LiveUpdate[] = [];
  const gw = new LiveGateway({
    feed: poller, store, fairValue, subs,
    config: { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25, thinVolume: 3 },
    broadcast: (_u, u) => broadcasts.push(u),
    writeThrough: () => {},
  });
  await fairValue.load(['a']);
  await gw.start();
  await (poller as any).tick();

  expect(broadcasts.length).toBeGreaterThan(0);
  const last = broadcasts[broadcasts.length - 1];
  expect(last.url_name).toBe('a');
  expect(last.book.bestSell).toBe(70);
  expect(last.verdict.verdict).toBe('buy'); // 30% below FV of 100
});
