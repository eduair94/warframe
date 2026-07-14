import { SubscriptionManager } from './SubscriptionManager';

describe('SubscriptionManager', () => {
  it('tracks viewer counts and drops to zero', () => {
    const m = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: [] });
    m.addViewer('a'); m.addViewer('a'); m.removeViewer('a');
    expect(m.viewerCount('a')).toBe(1);
    m.removeViewer('a');
    expect(m.viewerCount('a')).toBe(0);
    expect(m.liveSet()).not.toContain('a');
  });

  it('always keeps hotFloor items live', () => {
    const m = new SubscriptionManager({ maxSubscriptions: 10, hotFloor: ['floor1', 'floor2'] });
    expect(m.liveSet().sort()).toEqual(['floor1', 'floor2']);
  });

  it('caps live set and prioritizes hotFloor then most-viewed', () => {
    const m = new SubscriptionManager({ maxSubscriptions: 2, hotFloor: ['floor'] });
    m.addViewer('x'); m.addViewer('x'); m.addViewer('y');
    const live = m.liveSet();
    expect(live).toContain('floor');   // hotFloor always in
    expect(live).toContain('x');       // most-viewed wins the remaining slot
    expect(live).not.toContain('y');
    expect(m.overflow()).toContain('y');
  });
});
