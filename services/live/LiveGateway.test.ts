import { LiveGateway } from './LiveGateway';
import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { EventEmitter } from 'events';
import { LiveUpdate, LiveBook } from './LiveTypes';

function makeGateway() {
  const feed: any = new EventEmitter();
  feed.setLiveSet = () => {}; feed.subscribe = () => {}; feed.unsubscribe = () => {};
  feed.start = () => {}; feed.stop = () => {};
  const store = new LiveStore('pc');
  const fairValue = new FairValueService({
    getItems: async () => [{ url_name: 'a', market: { avg_price: 100, sell: 100, volume: 100 } }],
    getHistory: async () => [
      { date: '2026-01-01', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-02', buy: 0, sell: 0, avg_price: 100, volume: 5 },
      { date: '2026-01-03', buy: 0, sell: 0, avg_price: 100, volume: 5 },
    ],
  });
  const subs = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: [] });
  const broadcasts: LiveUpdate[] = [];
  const writes: Array<{ url: string; book: LiveBook }> = [];
  const gw = new LiveGateway({
    feed, store, fairValue, subs,
    config: { halfVolume: 50, baseBandPct: 0.08, maxBandPct: 0.25, confMin: 0.25, thinVolume: 3 },
    broadcast: (_url, u) => broadcasts.push(u),
    writeThrough: (url, book) => writes.push({ url, book }),
  });
  return { gw, feed, fairValue, broadcasts, writes, subs };
}

describe('LiveGateway', () => {
  it('produces a buy verdict update from a snapshot and broadcasts + writes through', async () => {
    const { gw, feed, fairValue, broadcasts, writes } = makeGateway();
    await fairValue.load(['a']);
    feed.emit('snapshot', { url_name: 'a', orders: [
      { id: '1', order_type: 'sell', platinum: 80, quantity: 1, visible: true, platform: 'pc', user: { id: 'x', status: 'ingame' } },
      { id: '2', order_type: 'buy', platinum: 70, quantity: 1, visible: true, platform: 'pc', user: { id: 'y', status: 'ingame' } },
    ]});
    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0].verdict.verdict).toBe('buy');
    expect(writes[0].book.bestSell).toBe(80);
  });

  it('handleSubscribe returns the current update if the book exists', async () => {
    const { gw, feed, fairValue } = makeGateway();
    await fairValue.load(['a']);
    feed.emit('snapshot', { url_name: 'a', orders: [
      { id: '1', order_type: 'sell', platinum: 95, quantity: 1, visible: true, platform: 'pc', user: { id: 'x', status: 'ingame' } },
    ]});
    const u = gw.handleSubscribe('a');
    expect(u).not.toBeNull();
    expect(u!.book.bestSell).toBe(95);
  });
});
