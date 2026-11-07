import { LiveGateway, LIVE_SOURCE_STALE_AFTER_MS } from './LiveGateway';
import { LiveStore } from './LiveStore';
import { FairValueService } from './FairValueService';
import { SubscriptionManager } from './SubscriptionManager';
import { EventEmitter } from 'events';
import { LiveUpdate, LiveBook } from './LiveTypes';
import { FeedStatus } from './WfmFeed';

function makeGateway(onStatus?: (status: FeedStatus) => void) {
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
    onStatus,
  });
  return { gw, feed, fairValue, broadcasts, writes, subs };
}

describe('LiveGateway', () => {
  it('requires both a confirmed source and an ingested snapshot before becoming available', async () => {
    const { gw, feed } = makeGateway();
    expect(gw.health()).toEqual({
      feedUp: false, feedSource: 'poller', liveItems: 0, bookCount: 0, lastUpdateAt: 0,
    });
    await gw.start();
    expect(gw.health().feedUp).toBe(false);
    feed.emit('status', { source: 'poller', up: true });
    expect(gw.health().feedUp).toBe(false);
    feed.emit('snapshot', { url_name: 'a', orders: [] });
    expect(gw.health().feedUp).toBe(true);
  });

  it('forwards source status only after updating its health', () => {
    const seen: Array<{ status: FeedStatus; feedUp: boolean; feedSource: string }> = [];
    const { gw, feed } = makeGateway((status) => {
      seen.push({ status, feedUp: gw.health().feedUp, feedSource: gw.health().feedSource });
    });
    const up: FeedStatus = { source: 'poller', up: true, detail: 'recovered' };
    const down: FeedStatus = { source: 'socket', up: false, detail: 'disconnected' };
    feed.emit('snapshot', { url_name: 'a', orders: [] });
    const lastUpdateAt = gw.health().lastUpdateAt;
    feed.emit('status', up);
    feed.emit('status', down);
    expect(seen).toEqual([
      { status: up, feedUp: true, feedSource: 'poller' },
      { status: down, feedUp: false, feedSource: 'socket' },
    ]);
    expect(gw.health().lastUpdateAt).toBe(lastUpdateAt);
  });

  it('does not forward a raw up status as available before any source data', () => {
    const onStatus = jest.fn();
    const { gw, feed } = makeGateway(onStatus);
    feed.emit('status', { source: 'poller', up: true, detail: 'recovered' });
    expect(onStatus).toHaveBeenLastCalledWith({ source: 'poller', up: false, detail: 'recovered' });
    expect(gw.health().lastUpdateAt).toBe(0);
  });

  it('expires after three minutes of silence without an error or rejuvenation on reads', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      const { gw, feed } = makeGateway();
      feed.emit('snapshot', { url_name: 'a', orders: [] });
      feed.emit('status', { source: 'poller', up: true });
      clock.mockReturnValue(1000 + LIVE_SOURCE_STALE_AFTER_MS);
      expect(gw.health().feedUp).toBe(true);
      clock.mockReturnValue(1001 + LIVE_SOURCE_STALE_AFTER_MS);
      expect(gw.health().feedUp).toBe(false);
      expect(gw.buildUpdate('a')!.book.updatedAt).toBe(1000);
      expect(gw.handleSubscribe('a')!.book.updatedAt).toBe(1000);
      expect(gw.health().lastUpdateAt).toBe(1000);
      expect(gw.health().feedUp).toBe(false);
    } finally {
      clock.mockRestore();
    }
  });

  it('rejects future source timestamps and reports the effective status to the callback', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(2000);
    try {
      const onStatus = jest.fn();
      const { gw, feed } = makeGateway(onStatus);
      feed.emit('snapshot', { url_name: 'a', orders: [] });
      clock.mockReturnValue(1000);
      feed.emit('status', { source: 'poller', up: true });
      expect(gw.health().feedUp).toBe(false);
      expect(gw.health().lastUpdateAt).toBe(2000);
      expect(onStatus).toHaveBeenLastCalledWith({ source: 'poller', up: false });
    } finally {
      clock.mockRestore();
    }
  });

  it.each(['snapshot', 'delta'])('renews a silent confirmed source when a new %s is ingested', (kind) => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      const { gw, feed } = makeGateway();
      feed.emit('snapshot', { url_name: 'a', orders: [] });
      expect(gw.health().feedUp).toBe(false);
      feed.emit('status', { source: 'poller', up: true });
      clock.mockReturnValue(2000 + LIVE_SOURCE_STALE_AFTER_MS);
      expect(gw.health().feedUp).toBe(false);
      feed.emit(kind, kind === 'snapshot'
        ? { url_name: 'a', orders: [] }
        : { url_name: 'a', upserts: [] });
      expect(gw.health().feedUp).toBe(true);
      expect(gw.health().lastUpdateAt).toBe(2000 + LIVE_SOURCE_STALE_AFTER_MS);
    } finally {
      clock.mockRestore();
    }
  });

  it('does not recover merely from a status event when the last snapshot is stale', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      const onStatus = jest.fn();
      const { gw, feed } = makeGateway(onStatus);
      feed.emit('snapshot', { url_name: 'a', orders: [] });
      feed.emit('status', { source: 'poller', up: false });
      clock.mockReturnValue(2000 + LIVE_SOURCE_STALE_AFTER_MS);
      feed.emit('status', { source: 'poller', up: true });
      expect(onStatus).toHaveBeenLastCalledWith({ source: 'poller', up: false });
      expect(gw.health().feedUp).toBe(false);
      expect(gw.health().lastUpdateAt).toBe(1000);
    } finally {
      clock.mockRestore();
    }
  });

  it('retains cached prices and their last ingestion time after a feed failure', () => {
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      const { gw, feed, broadcasts, writes } = makeGateway();
      feed.emit('snapshot', { url_name: 'a', orders: [
        { id: '1', order_type: 'sell', platinum: 95, quantity: 1, visible: true, platform: 'pc', user: { id: 'x', status: 'ingame' } },
      ]});
      feed.emit('status', { source: 'poller', up: true });
      const before = gw.health();
      expect(before.lastUpdateAt).toBe(1000);
      clock.mockReturnValue(60_000);
      feed.emit('status', { source: 'poller', up: false, detail: 'fetch failing' });
      expect(gw.health()).toEqual({ ...before, feedUp: false });
      expect(gw.buildUpdate('a')!.book.bestSell).toBe(95);
      expect(broadcasts).toHaveLength(1);
      expect(writes).toHaveLength(1);
      expect(gw.health().lastUpdateAt).toBe(1000);
    } finally {
      clock.mockRestore();
    }
  });

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
