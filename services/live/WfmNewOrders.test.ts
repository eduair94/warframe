import { WfmNewOrders, subscribeNewOrdersMsg } from './WfmNewOrders';

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

describe('WfmNewOrders', () => {
  it('tracks the online report', () => {
    const w = make(() => 1000);
    w.ingest(onlineMsg(52000, 27000));
    expect(w.getPulse().online).toEqual({ connections: 52000, authorizedUsers: 27000 });
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
    let t = 0;
    const w = make(() => t);
    w.ingest(orderMsg({ itemId: 'unknown', type: 'sell', platinum: 10, createdAt: '2026-07-14T23:00:00Z' }));
    w.ingest(orderMsg({ itemId: 'id1', type: 'buy', platinum: 20, createdAt: '2026-07-14T23:00:00Z' }));
    const pulse = w.getPulse();
    expect(pulse.ordersPerMin).toBe(2); // both counted
    expect(pulse.recent).toHaveLength(1); // only the resolvable one shown
    expect(pulse.recent[0].url_name).toBe('octavia_prime_set');
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
