import { mapV1OrdersToNormalized } from './WfmFeed';

describe('mapV1OrdersToNormalized', () => {
  it('maps the MarketService v1 order shape into NormalizedOrder', () => {
    const out = mapV1OrdersToNormalized([
      { id: 'o1', order_type: 'sell', platinum: 15, quantity: 2, visible: true, platform: 'pc',
        mod_rank: 3, subtype: 'radiant', user: { id: 'u1', ingame_name: 'Bob', status: 'ingame' } },
      { id: 'o2', order_type: 'buy', platinum: 9, /* quantity missing */ platform: 'pc',
        user: { status: 'online' } },
    ]);
    expect(out[0]).toEqual({
      id: 'o1', order_type: 'sell', platinum: 15, quantity: 2, visible: true, platform: 'pc',
      mod_rank: 3, subtype: 'radiant', user: { id: 'u1', ingame_name: 'Bob', status: 'ingame' },
    });
    expect(out[1].quantity).toBe(1);       // defaulted
    expect(out[1].visible).toBe(true);      // defaulted
    expect(out[1].user.status).toBe('online');
  });

  it('coerces an unknown status to offline and drops rows with no id', () => {
    const out = mapV1OrdersToNormalized([
      { order_type: 'sell', platinum: 5, platform: 'pc', user: { status: 'weird' } }, // no id -> dropped
      { id: 'o3', order_type: 'sell', platinum: 5, platform: 'pc', user: {} },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].user.status).toBe('offline');
  });
});
