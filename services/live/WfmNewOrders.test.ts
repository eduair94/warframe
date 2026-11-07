import { WfmNewOrders, subscribeNewOrdersMsg, wfmSocketReconnectDelayMs } from './WfmNewOrders';

const items: Record<string, { url_name: string; item_name: string; thumb: string }> = {
  id1: { url_name: 'octavia_prime_set', item_name: 'Octavia Prime Set', thumb: 't1.png' },
  id2: { url_name: 'arcane_energize', item_name: 'Arcane Energize', thumb: 't2.png' },
};

function make(now: () => number) {
  return new WfmNewOrders({ resolveItem: (id) => items[id] || null, recentCap: 3, now });
}
const onlineMsg = (c: number, a: number) =>
  JSON.stringify({ route: '@wfm|event/reports/online', payload: { connections: c, authorizedUsers: a } });
const orderMsg = (p: any) =>
  JSON.stringify({ route: '@wfm|event/subscriptions/newOrder', payload: p });

describe('subscribeNewOrdersMsg', () => {
  it('builds the exact subscribe command wf.market expects', () => {
    expect(JSON.parse(subscribeNewOrdersMsg('pc'))).toEqual({
      route: '@wfm|cmd/subscribe/newOrders',
      payload: { platform: 'pc', crossplay: true },
      id: 'live',
    });
  });
});

describe('wfmSocketReconnectDelayMs', () => {
  it('backs off from 4 s, doubling per consecutive failure, capped at 15 minutes', () => {
    // A refused handshake used to retry every 4 s forever (~21,600 a day from a
    // Cloudflare-challenged IP).
    expect([0, 1, 2, 3].map(wfmSocketReconnectDelayMs)).toEqual([4_000, 8_000, 16_000, 32_000]);
    expect(wfmSocketReconnectDelayMs(50)).toBe(15 * 60_000);
  });
});

describe('WfmNewOrders', () => {
  it('has no source timestamp until valid data arrives, even across repeated reads', () => {
    let t = 1000;
    const w = make(() => t);
    expect(w.getPulse().updatedAt).toBe(0);
    expect(w.getPulse().onlineUpdatedAt).toBe(0);
    t = 60_000;
    expect(w.getPulse().updatedAt).toBe(0);
    expect(w.getPulse().onlineUpdatedAt).toBe(0);
  });

  it('tracks the online report', () => {
    const w = make(() => 1000);
    w.ingest(onlineMsg(52000, 27000));
    expect(w.getPulse().online).toEqual({ connections: 52000, authorizedUsers: 27000 });
    expect(w.getPulse().updatedAt).toBe(1000);
    expect(w.getPulse().onlineUpdatedAt).toBe(1000);
  });

  it('does not certify the initial zero online counts when the first message is an order', () => {
    let t = 1000;
    const w = make(() => t);
    w.ingest(orderMsg({ itemId: 'id1', type: 'sell', platinum: 10 }));
    const pulse = w.getPulse();
    expect(pulse.updatedAt).toBe(1000);
    expect(pulse.onlineUpdatedAt).toBe(0);
    expect(pulse.online).toEqual({ connections: 0, authorizedUsers: 0 });
    t = 10_000;
    expect(w.getPulse().onlineUpdatedAt).toBe(0);
  });

  it('does not rejuvenate the online report with later orders or pulse reads', () => {
    let t = 1000;
    const w = make(() => t);
    w.ingest(onlineMsg(12, 8));
    t = 2000;
    w.ingest(orderMsg({ itemId: 'unknown', type: 'sell', platinum: 10 }));
    expect(w.getPulse()).toMatchObject({ updatedAt: 2000, onlineUpdatedAt: 1000, online: { connections: 12, authorizedUsers: 8 } });
    t = 300_000;
    expect(w.getPulse()).toMatchObject({ updatedAt: 2000, onlineUpdatedAt: 1000 });
    w.ingest(onlineMsg(20, 15));
    expect(w.getPulse()).toMatchObject({ updatedAt: 300_000, onlineUpdatedAt: 300_000, online: { connections: 20, authorizedUsers: 15 } });
  });

  it('captures the online report arrival time once for both freshness fields', () => {
    const now = jest.fn().mockReturnValueOnce(1000).mockReturnValue(2000);
    const w = make(now);
    w.ingest(onlineMsg(12, 8));
    expect(now).toHaveBeenCalledTimes(1);
    expect(w.getPulse()).toMatchObject({ updatedAt: 1000, onlineUpdatedAt: 1000 });
  });

  it('preserves the source timestamp when the pulse is read later', () => {
    let t = 1000;
    const w = make(() => t);
    w.ingest(onlineMsg(52000, 27000));
    t = 2000;
    w.ingest(orderMsg({ itemId: 'id1', type: 'sell', platinum: 10, createdAt: '2026-07-14T23:00:00Z' }));
    expect(w.getPulse().updatedAt).toBe(2000);
    t = 70_000;
    const pulse = w.getPulse();
    expect(pulse.updatedAt).toBe(2000);
    expect(pulse.onlineUpdatedAt).toBe(1000);
    expect(pulse.ordersPerMin).toBe(0);
    expect(pulse.recent).toHaveLength(1);
    expect(pulse.online.connections).toBe(52000);
  });

  it('accepts a valid zero-count online report as newly observed source data', () => {
    const w = make(() => 1000);
    w.ingest(onlineMsg(0, 0));
    expect(w.getPulse().updatedAt).toBe(1000);
    expect(w.getPulse().online).toEqual({ connections: 0, authorizedUsers: 0 });
  });

  it('accepts numeric source strings while rejecting empty coercions', () => {
    const w = make(() => 1000);
    w.ingest(JSON.stringify({ route: '@wfm|event/reports/online', payload: { connections: '12', authorizedUsers: '8' } }));
    w.ingest(orderMsg({ itemId: 'id1', type: 'buy', platinum: '20', quantity: '2' }));
    const pulse = w.getPulse();
    expect(pulse.online).toEqual({ connections: 12, authorizedUsers: 8 });
    expect(pulse.recent[0]).toMatchObject({ platinum: 20, quantity: 2 });
    expect(pulse.updatedAt).toBe(1000);
  });

  it.each([
    ['invalid JSON', 'not json'],
    ['null frame', 'null'],
    ['array frame', '[]'],
    ['zero frame', '0'],
    ['acknowledgement', JSON.stringify({ route: '@wfm|cmd/subscribe/newOrders', payload: { success: true } })],
    ['missing online counters', JSON.stringify({ route: '@wfm|event/reports/online', payload: {} })],
    ['null online payload', JSON.stringify({ route: '@wfm|event/reports/online', payload: null })],
    ['array online payload', JSON.stringify({ route: '@wfm|event/reports/online', payload: [] })],
    ['zero online payload', JSON.stringify({ route: '@wfm|event/reports/online', payload: 0 })],
    ['negative online counter', onlineMsg(-1, 2)],
    ['null online counter', JSON.stringify({ route: '@wfm|event/reports/online', payload: { connections: null, authorizedUsers: 2 } })],
    ['blank online counter', JSON.stringify({ route: '@wfm|event/reports/online', payload: { connections: ' ', authorizedUsers: 2 } })],
    ['nonfinite online counter', JSON.stringify({ route: '@wfm|event/reports/online', payload: { connections: 'Infinity', authorizedUsers: 2 } })],
    ['NaN online counter', JSON.stringify({ route: '@wfm|event/reports/online', payload: { connections: 'NaN', authorizedUsers: 2 } })],
    ['null order payload', orderMsg(null)],
    ['array order payload', orderMsg([])],
    ['invalid order type', orderMsg({ itemId: 'id1', type: 'other', platinum: 10 })],
    ['missing item identity', orderMsg({ type: 'sell', platinum: 10 })],
    ['blank item identity', orderMsg({ itemId: ' ', type: 'sell', platinum: 10 })],
    ['missing order price', orderMsg({ itemId: 'id1', type: 'sell' })],
    ['nonfinite order price', orderMsg({ itemId: 'id1', type: 'sell', platinum: 'Infinity' })],
    ['zero order price', orderMsg({ itemId: 'id1', type: 'sell', platinum: 0 })],
    ['boolean order price', orderMsg({ itemId: 'id1', type: 'sell', platinum: true })],
    ['zero order quantity', orderMsg({ itemId: 'id1', type: 'sell', platinum: 10, quantity: 0 })],
  ])('does not refresh data or freshness for %s', (_name, frame) => {
    let t = 1000;
    const w = make(() => t);
    w.ingest(onlineMsg(12, 8));
    const before = w.getPulse();
    t = 2000;
    expect(() => w.ingest(frame)).not.toThrow();
    expect(w.getPulse()).toEqual(before);
  });

  it('adds resolvable orders to the ticker, newest first, capped', () => {
    let t = 0;
    const w = make(() => t);
    w.ingest(orderMsg({ itemId: 'id1', type: 'sell', platinum: 50, quantity: 1, createdAt: '2026-07-14T23:00:00Z' }));
    w.ingest(orderMsg({ itemId: 'id2', type: 'buy', platinum: 90, quantity: 2, rank: 5, createdAt: '2026-07-14T23:00:01Z' }));
    w.ingest(orderMsg({ itemId: 'id1', type: 'sell', platinum: 55, quantity: 1, createdAt: '2026-07-14T23:00:02Z' }));
    w.ingest(orderMsg({ itemId: 'id2', type: 'sell', platinum: 88, quantity: 1, createdAt: '2026-07-14T23:00:03Z' }));
    const recent = w.getPulse().recent;
    expect(recent).toHaveLength(3); // capped at 3
    expect(recent[0].platinum).toBe(88); // newest first
    expect(recent[0].item_name).toBe('Arcane Energize');
    expect(recent[1].platinum).toBe(55);
  });

  it('counts unresolved orders toward orders/min but keeps them out of the ticker', () => {
    let t = 1000;
    const w = make(() => t);
    w.ingest(orderMsg({ itemId: 'unknown', type: 'sell', platinum: 10, createdAt: '2026-07-14T23:00:00Z' }));
    expect(w.getPulse().updatedAt).toBe(1000);
    expect(w.getPulse().recent).toHaveLength(0);
    t = 2000;
    w.ingest(orderMsg({ itemId: 'id1', type: 'buy', platinum: 20, createdAt: '2026-07-14T23:00:00Z' }));
    const pulse = w.getPulse();
    expect(pulse.ordersPerMin).toBe(2); // both counted
    expect(pulse.recent).toHaveLength(1); // only the resolvable one shown
    expect(pulse.recent[0].url_name).toBe('octavia_prime_set');
    expect(pulse.updatedAt).toBe(2000);
  });

  it('orders/min is a 60s sliding window', () => {
    let t = 0;
    const w = make(() => t);
    w.ingest(orderMsg({ itemId: 'id1', type: 'sell', platinum: 10, createdAt: '2026-07-14T23:00:00Z' })); // t=0
    t = 30_000;
    w.ingest(orderMsg({ itemId: 'id1', type: 'sell', platinum: 11, createdAt: '2026-07-14T23:00:30Z' })); // t=30s
    t = 65_000; // first order now older than 60s
    expect(w.getPulse().ordersPerMin).toBe(1);
  });

  it('ignores malformed frames and non-order/online routes', () => {
    const w = make(() => 0);
    expect(w.ingest('not json')).toBeNull();
    expect(w.ingest(JSON.stringify({ route: '@wfm|something/else', payload: {} }))).toBe('@wfm|something/else');
    const pulse = w.getPulse();
    expect(pulse.recent).toHaveLength(0);
    expect(pulse.ordersPerMin).toBe(0);
  });
});
