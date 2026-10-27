jest.mock('dotenv', () => ({ config: jest.fn() }));

describe('production WFM request budgets', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('keeps all syncs plus API/live sharing the fixed egress below 3 RPS', () => {
    delete process.env.WFM_EGRESS_SSH_TARGET;
    const main = require('./ecosystem.config.js').apps;
    const sync = require('./ecosystem.sync.config.js').apps;
    const callers = [
      ...main.filter((app: any) => ['warframe-server', 'warframe-live'].includes(app.name)),
      ...sync.filter((app: any) => app.env?.WFM_MAX_RPS),
    ];
    expect(callers).toHaveLength(8);
    const budget = callers.reduce((total: number, app: any) => total + Number(app.env.WFM_MAX_RPS), 0);
    expect(budget).toBeGreaterThan(0);
    expect(budget).toBeLessThan(3);
    expect(callers.every((app: any) => app.env.PROXY_LESS === 'true')).toBe(true);
  });

  it('keeps the riven auctions search at or below 0.1 RPS on both hosts', () => {
    // v1 /auctions/search answered ~1,000 429s a day at 0.3 RPS; Cloudflare then
    // challenged the sync host (2026-10-18) and the fixed egress (2026-10-25).
    delete process.env.WFM_EGRESS_SSH_TARGET;
    const apps = [
      ...require('./ecosystem.config.js').apps,
      ...require('./ecosystem.sync.config.js').apps,
    ].filter((app: any) => /sync-auctions$/.test(app.name));
    expect(apps).toHaveLength(2);
    expect(apps.every((app: any) => Number(app.env.WFM_MAX_RPS) <= 0.1)).toBe(true);
  });

  it('registers only a loopback SOCKS listener with reconnect supervision', () => {
    process.env.WFM_EGRESS_SSH_TARGET = 'sync@example.test';
    process.env.WFM_EGRESS_SSH_KEY = '/keys/egress';
    process.env.WFM_EGRESS_PORT = '27028';
    const [tunnel] = require('./ecosystem.egress.config.js').apps;
    expect(tunnel.args).toEqual(expect.arrayContaining([
      '-D', '127.0.0.1:27028', '-N', 'BatchMode=yes',
      'ServerAliveInterval=15', 'ServerAliveCountMax=3', 'ExitOnForwardFailure=yes',
    ]));
    expect(tunnel.autorestart).toBe(true);
    expect(tunnel.restart_delay).toBeGreaterThanOrEqual(5000);
  });
});
