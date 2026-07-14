import { readLiveConfig } from './LiveConfig';

describe('readLiveConfig', () => {
  it('applies defaults when env is empty', () => {
    const c = readLiveConfig({});
    expect(c.port).toBe(3530);
    expect(c.feedMode).toBe('poller'); // poller is the shippable default until the socket spike lands
    expect(c.maxSubscriptions).toBe(150);
    expect(c.pollIntervalMs).toBe(6000);
    expect(c.platform).toBe('pc');
    expect(c.confMin).toBeCloseTo(0.25);
    expect(c.thinVolume).toBe(3);
    expect(c.pollConcurrency).toBe(12);
    expect(c.hotFloorList).toEqual([]);
  });

  it('parses overrides and CSV lists', () => {
    const c = readLiveConfig({
      LIVE_PORT: '4000',
      LIVE_FEED_MODE: 'socket',
      LIVE_MAX_SUBSCRIPTIONS: '50',
      LIVE_POLL_INTERVAL_MS: '3000',
      LIVE_PLATFORM: 'ps4',
      LIVE_CORS_ORIGIN: 'https://a.com,https://b.com',
      LIVE_HOT_FLOOR: 'mirage_prime_set, octavia_prime_set',
    });
    expect(c.port).toBe(4000);
    expect(c.feedMode).toBe('socket');
    expect(c.maxSubscriptions).toBe(50);
    expect(c.corsOrigin).toEqual(['https://a.com', 'https://b.com']);
    expect(c.hotFloorList).toEqual(['mirage_prime_set', 'octavia_prime_set']);
  });

  it('falls back to poller on an invalid feed mode', () => {
    expect(readLiveConfig({ LIVE_FEED_MODE: 'bogus' }).feedMode).toBe('poller');
  });
});
