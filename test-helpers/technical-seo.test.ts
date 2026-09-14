import { catalogueSitemapUrls, createSitemapLoader, missionSitemapUrls } from '../app/server/utils/sitemap';
import { entityPayloadStatus } from '../app/app/utils/seo-entity';

const catalogue = [
  { url_name: 'frost_prime_set', item_name: 'Frost Prime Set', set: true },
  { url_name: 'strun_wraith_receiver', item_name: 'Strun Wraith Receiver', set: true },
  { url_name: 'lith_a1_relic', item_name: 'Lith A1 Relic', tags: ['relic'] },
];
const missions = { rows: [{ slug: 'earth-everest', indexable: true }] };

describe('sitemap coverage', () => {
  it('includes assembled sets and relics, never set members, malformed paths or duplicates', () => {
    expect(catalogueSitemapUrls([
      ...catalogue, catalogue[0], null,
      { url_name: '../bad', item_name: 'Bad Set' },
      { url_name: 'bad?query=1', item_name: 'Bad Set' },
      { url_name: 'motus_setup', item_name: 'Motus Setup' },
      { url_name: 'grineer_settlement_reactor_scene', item_name: 'Grineer Settlement Reactor Scene' },
      { url_name: 'grineer_settlement_artillery_scene', item_name: 'Grineer Settlement Artillery Scene' },
    ])).toEqual([
      { loc: '/set/frost_prime_set', _i18nTransform: true },
      { loc: '/relic/lith_a1_relic', _i18nTransform: true },
    ]);
  });

  it('includes only indexable missions and rejects error envelopes', () => {
    expect(missionSitemapUrls({ rows: [
      ...missions.rows, ...missions.rows,
      { slug: 'empty-node', indexable: false },
      { slug: 'bad/node', indexable: true },
    ] })).toEqual([{ loc: '/mission/earth-everest', _i18nTransform: true }]);
    expect(() => catalogueSitemapUrls({ error: 'Database unavailable' })).toThrow();
    expect(() => missionSitemapUrls({ error: 'Database unavailable' })).toThrow();
  });

  it('keeps mission discovery independent of a failed or empty catalogue', async () => {
    for (const data of [[], { error: 'Database unavailable' }]) {
      const load = createSitemapLoader(async (url) => url.endsWith('/missions') ? missions : data);
      expect(await load('http://api/')).toEqual([{ loc: '/mission/earth-everest', _i18nTransform: true }]);
    }
  });

  it('starts both reads concurrently and shares them across locale sitemap requests', async () => {
    const pending = new Map<string, (data: unknown) => void>();
    const fetchJson = jest.fn((url: string) => new Promise<unknown>((resolve) => pending.set(url, resolve)));
    const load = createSitemapLoader(fetchJson);
    const first = load('http://api');
    const second = load('http://api');
    expect(fetchJson).toHaveBeenCalledTimes(2);
    expect([...pending.keys()]).toEqual(['http://api', 'http://api/missions']);
    pending.get('http://api')!(catalogue);
    pending.get('http://api/missions')!(missions);
    expect(await first).toEqual(await second);
    await load('http://api');
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });

  it('retains recent successful snapshots through outages, but expires them after one day', async () => {
    let clock = 0;
    let down = false;
    const fetchJson = jest.fn(async (url: string) => {
      if (down) throw new Error('Timeout');
      return url.endsWith('/missions') ? missions : catalogue;
    });
    const load = createSitemapLoader(fetchJson, () => clock);
    const original = await load('http://api');
    down = true;
    clock = 6 * 60_000;
    expect(await load('http://api')).toEqual(original);
    expect(fetchJson).toHaveBeenCalledTimes(4);
    await load('http://api');
    expect(fetchJson).toHaveBeenCalledTimes(4);
    clock = 25 * 60 * 60_000;
    await expect(load('http://api')).rejects.toThrow('temporarily unavailable');
  });

  it('does not carry cached URLs to a different configured API origin', async () => {
    const load = createSitemapLoader(async (url) => {
      if (url.startsWith('http://other')) throw new Error('Offline');
      return url.endsWith('/missions') ? missions : catalogue;
    });
    await load('http://api');
    await expect(load('http://other')).rejects.toThrow('temporarily unavailable');
  });
});

describe('entity page HTTP statuses', () => {
  it('recognizes only explicit absent entity responses as 404', () => {
    expect(entityPayloadStatus('relic', null)).toBe(404);
    expect(entityPayloadStatus('mission', null)).toBe(404);
    expect(entityPayloadStatus('set', { error: 'Set not found: unknown' })).toBe(404);
    expect(entityPayloadStatus('set', { error: 'Not a set: frost_prime_blueprint' })).toBe(404);
  });

  it('does not mistake upstream outages or incomplete data for removed pages', () => {
    for (const kind of ['relic', 'mission', 'set'] as const) {
      for (const payload of [{ error: 'Database timeout' }, {}, undefined, '<html>Gateway error</html>']) {
        expect(entityPayloadStatus(kind, payload)).toBe(503);
      }
    }
    expect(entityPayloadStatus('set', { error: 'Set has no market data: frost_prime_set' })).toBe(503);
    expect(entityPayloadStatus('set', null)).toBe(503);
    expect(entityPayloadStatus('mission', { rotations: [], error: 'Partial data' })).toBe(503);
  });

  it('accepts valid entities including valid zero-reward/part arrays', () => {
    expect(entityPayloadStatus('set', { set: { url_name: 'frost_prime_set' }, parts: [] })).toBe(200);
    expect(entityPayloadStatus('relic', { rewards: [] })).toBe(200);
    expect(entityPayloadStatus('mission', { rotations: [] })).toBe(200);
  });
});
