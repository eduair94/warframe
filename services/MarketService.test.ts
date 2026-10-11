/**
 * @fileoverview Unit tests for MarketService
 * @module tests/services/MarketService.test
 */

import { describe, it, expect, jest } from '@jest/globals';
import { MarketService } from './MarketService';
import { IHttpClient } from '../interfaces/http.interface';

function makeHttpClient(responses: Record<string, any>): IHttpClient {
  return {
    get: jest.fn(async (url: string) => {
      for (const key of Object.keys(responses)) {
        if (url.includes(key)) return responses[key];
      }
      throw new Error(`Unmocked URL: ${url}`);
    }) as any,
    post: jest.fn() as any,
    addRandomDelay: jest.fn(async () => {}) as any
  };
}

const SET_ROOT = {
  id: 'set-id',
  slug: 'ash_prime_set',
  tags: ['set', 'prime', 'warframe'],
  setRoot: true,
  setParts: ['blueprint-id', 'chassis-id', 'set-id'],
  i18n: { en: { name: 'Ash Prime Set', icon: 'set.png', thumb: 'set_thumb.png' } }
};

const SET_PARTS_IDS = ['blueprint-id', 'chassis-id', 'set-id'];

const BULK_ITEMS = {
  data: [
    SET_ROOT,
    {
      id: 'blueprint-id',
      slug: 'ash_prime_blueprint',
      tags: ['blueprint', 'prime', 'warframe'],
      setParts: SET_PARTS_IDS,
      i18n: { en: { name: 'Ash Prime Blueprint', icon: 'bp.png', thumb: 'bp_thumb.png' } }
    },
    {
      id: 'chassis-id',
      slug: 'ash_prime_chassis_blueprint',
      tags: ['component', 'prime', 'warframe', 'blueprint'],
      setParts: SET_PARTS_IDS,
      i18n: { en: { name: 'Ash Prime Chassis Blueprint', icon: 'ch.png', thumb: 'ch_thumb.png' } }
    }
  ]
};

const STANDALONE_ITEM = {
  id: 'mod-id',
  slug: 'vitality',
  tags: ['mod'],
  i18n: { en: { name: 'Vitality', icon: 'mod.png', thumb: 'mod_thumb.png' } }
};

describe('MarketService', () => {
  describe('getItemDetails - items_in_set resolution', () => {
    it('resolves all sibling set parts (by id) via the bulk items list when setParts is present', async () => {
      const httpClient = makeHttpClient({
        '/v2/items/ash_prime_set': { data: SET_ROOT },
        '/v2/items': BULK_ITEMS
      });
      const service = new MarketService(httpClient);

      const result: any = await service.getItemDetails('ash_prime_set');
      const item = result.payload.item;

      expect(item.items_in_set).toHaveLength(3);
      const urlNames = item.items_in_set.map((entry: any) => entry.url_name).sort();
      expect(urlNames).toEqual(['ash_prime_blueprint', 'ash_prime_chassis_blueprint', 'ash_prime_set'].sort());
    });

    it('falls back to a single self entry when the item has no setParts (standalone item)', async () => {
      const httpClient = makeHttpClient({
        '/v2/items/vitality': { data: STANDALONE_ITEM }
      });
      const service = new MarketService(httpClient);

      const result: any = await service.getItemDetails('vitality');
      const item = result.payload.item;

      expect(item.items_in_set).toHaveLength(1);
      expect(item.items_in_set[0].url_name).toBe('vitality');
    });

    it('caches the bulk items list across multiple getItemDetails calls', async () => {
      const httpClient = makeHttpClient({
        '/v2/items/ash_prime_set': { data: SET_ROOT },
        '/v2/items/ash_prime_blueprint': { data: BULK_ITEMS.data[1] },
        '/v2/items': BULK_ITEMS
      });
      const service = new MarketService(httpClient);

      await service.getItemDetails('ash_prime_set');
      await service.getItemDetails('ash_prime_blueprint');

      const bulkListCalls = (httpClient.get as any).mock.calls.filter(
        ([url]: [string]) => url.endsWith('/v2/items')
      );
      expect(bulkListCalls).toHaveLength(1);
    });
  });

  describe('getItemPrices - statistics resilience', () => {
    const ORDERS_RESPONSE = {
      data: [
        { type: 'sell', platinum: 10, quantity: 1, user: { status: 'ingame', ingameName: 'a' } },
        { type: 'sell', platinum: 12, quantity: 1, user: { status: 'ingame', ingameName: 'b' } },
        { type: 'buy', platinum: 6, quantity: 1, user: { status: 'ingame', ingameName: 'c' } }
      ]
    };

    function makeUrlRouter(statsBehavior: () => any): IHttpClient {
      return {
        get: jest.fn(async (url: string) => {
          if (url.includes('/orders/item/')) return ORDERS_RESPONSE;
          if (url.includes('/statistics')) return statsBehavior();
          throw new Error(`Unmocked URL: ${url}`);
        }) as any,
        post: jest.fn() as any,
        addRandomDelay: jest.fn(async () => {}) as any
      };
    }

    it('keeps order-derived buy/sell prices when statistics fetch fails (non-429)', async () => {
      const httpClient = makeUrlRouter(() => {
        throw new Error('statistics 500');
      });
      const service = new MarketService(httpClient, {
        ordersMinDelay: 0,
        ordersMaxDelay: 0,
        statsMinDelay: 0,
        statsMaxDelay: 0,
        fetchStatistics: true
      });

      const result = await service.getItemPrices({ url_name: 'ash_prime_blueprint' });

      // buy/sell survive from the (successful) orders call
      expect(result.sell).toBeGreaterThan(0);
      expect(result.buy).toBeGreaterThan(0);
      // stats degrade to zero rather than nuking the whole result
      expect(result.volume).toBe(0);
      expect(result.avg_price).toBe(0);
      expect(result.last_completed).toBeNull();
      // NOT flagged not_found — this is valid, priced data
      expect(result.not_found).toBeUndefined();
    });

    it('returns all-zero (not partial) when the primary orders fetch itself fails', async () => {
      const httpClient: IHttpClient = {
        get: jest.fn(async (url: string) => {
          if (url.includes('/orders/item/')) throw new Error('orders 500');
          return { payload: { statistics_closed: { '48hours': [] } } };
        }) as any,
        post: jest.fn() as any,
        addRandomDelay: jest.fn(async () => {}) as any
      };
      const service = new MarketService(httpClient, {
        ordersMinDelay: 0, ordersMaxDelay: 0, statsMinDelay: 0, statsMaxDelay: 0, fetchStatistics: true
      });

      const result = await service.getItemPrices({ url_name: 'ash_prime_blueprint' });
      expect(result.buy).toBe(0);
      expect(result.sell).toBe(0);
    });

    it('keeps the headline on max rank while also storing every rank for expansion', async () => {
      const httpClient = makeUrlRouter(() => ({
        payload: {
          statistics_closed: {
            '48hours': [
              { datetime: '2026-07-22T00:00:00Z', volume: 100, avg_price: 6, mod_rank: 0, id: 'r0' },
              { datetime: '2026-07-22T01:00:00Z', volume: 25, avg_price: 105, mod_rank: 5, id: 'r5' }
            ]
          }
        }
      }));
      (httpClient.get as any).mockImplementation(async (url: string) => {
        if (url.includes('/orders/item/')) return {
          data: [
            { type: 'sell', platinum: 7, rank: 0, quantity: 1, user: { status: 'ingame' } },
            { type: 'buy', platinum: 5, rank: 0, quantity: 1, user: { status: 'ingame' } },
            { type: 'sell', platinum: 110, rank: 5, quantity: 1, user: { status: 'ingame' } },
            { type: 'buy', platinum: 100, rank: 5, quantity: 1, user: { status: 'ingame' } }
          ]
        };
        if (url.includes('/statistics')) return {
          payload: { statistics_closed: { '48hours': [
            { datetime: '2026-07-22T00:00:00Z', volume: 100, avg_price: 6, mod_rank: 0, id: 'r0' },
            { datetime: '2026-07-22T01:00:00Z', volume: 25, avg_price: 105, mod_rank: 5, id: 'r5' }
          ] } }
        };
        throw new Error(`Unmocked URL: ${url}`);
      });
      const service = new MarketService(httpClient, {
        ordersMinDelay: 0, ordersMaxDelay: 0, statsMinDelay: 0, statsMaxDelay: 0, fetchStatistics: true
      });

      const result = await service.getItemPrices({
        url_name: 'arcane_energize',
        items_in_set: [{ mod_max_rank: 5 }]
      });

      expect(result).toMatchObject({ buy: 100, sell: 110, volume: 25, avg_price: 105 });
      expect(result.rankPrices?.ranks[0]).toMatchObject({ rank: 0, bid: 5, ask: 7, volume: 100 });
      expect(result.rankPrices?.ranks[5]).toMatchObject({ rank: 5, bid: 100, ask: 110, volume: 25 });
    });

    it('keeps an Ayatan headline fully socketed and stores every star combination', async () => {
      const httpClient = makeUrlRouter(() => ({ payload: { statistics_closed: { '48hours': [] } } }));
      (httpClient.get as any).mockImplementation(async (url: string) => {
        if (url.includes('/orders/item/')) return {
          data: [
            { type: 'sell', platinum: 5, amberStars: 0, cyanStars: 0, quantity: 1, user: { status: 'ingame' } },
            { type: 'buy', platinum: 3, amberStars: 0, cyanStars: 0, quantity: 1, user: { status: 'ingame' } },
            { type: 'sell', platinum: 20, amberStars: 1, cyanStars: 2, quantity: 1, user: { status: 'ingame' } },
            { type: 'buy', platinum: 15, amberStars: 1, cyanStars: 2, quantity: 1, user: { status: 'ingame' } },
          ]
        };
        if (url.includes('/statistics')) return {
          payload: { statistics_closed: { '48hours': [
            { datetime: '2026-07-22T00:00:00Z', volume: 100, avg_price: 5, amber_stars: 0, cyan_stars: 0 },
            { datetime: '2026-07-22T01:00:00Z', volume: 12, avg_price: 18, amber_stars: 1, cyan_stars: 2 },
          ] } }
        };
        throw new Error(`Unmocked URL: ${url}`);
      });
      const service = new MarketService(httpClient, {
        ordersMinDelay: 0, ordersMaxDelay: 0, statsMinDelay: 0, statsMaxDelay: 0, fetchStatistics: true
      });

      const result = await service.getItemPrices({
        url_name: 'ayatan_test_sculpture',
        max_amber_stars: 1,
        max_cyan_stars: 2,
      });

      expect(result).toMatchObject({ buy: 15, sell: 20, volume: 12, avg_price: 18 });
      expect(result.ayatanPrices?.variants).toHaveLength(6);
      expect(result.ayatanPrices?.variants[0]).toMatchObject({ key: '0:0', bid: 3, ask: 5, volume: 100 });
      expect(result.ayatanPrices?.variants[5]).toMatchObject({ key: '1:2', bid: 15, ask: 20, volume: 12 });
      expect(result.rankPrices).toBeUndefined();
    });
  });

  describe('getItemPrices - v1 statistics retired (default)', () => {
    const ORDERS = {
      data: [
        { type: 'sell', platinum: 40, quantity: 1, user: { status: 'ingame', ingameName: 'a' } },
        { type: 'sell', platinum: 42, quantity: 1, user: { status: 'ingame', ingameName: 'b' } },
        { type: 'buy', platinum: 35, quantity: 1, user: { status: 'ingame', ingameName: 'c' } }
      ]
    };

    function ordersOnlyClient(): IHttpClient {
      return {
        get: jest.fn(async (url: string) => {
          if (url.includes('/orders/item/')) return ORDERS;
          throw new Error(`Unexpected request: ${url}`);
        }) as any,
        post: jest.fn() as any,
        addRandomDelay: jest.fn(async () => {}) as any
      };
    }

    it('never calls the deprecated v1 /statistics endpoint', async () => {
      const httpClient = ordersOnlyClient();
      const service = new MarketService(httpClient);

      await service.getItemPrices({ url_name: 'ash_prime_set' });

      const urls = (httpClient.get as any).mock.calls.map(([u]: [string]) => u);
      expect(urls.some((u: string) => u.includes('/statistics'))).toBe(false);
      expect(urls).toHaveLength(1);
    });

    it('carries the stored volume / avg_price / last_completed forward instead of zeroing them', async () => {
      const service = new MarketService(ordersOnlyClient());
      const lastCompleted = { datetime: '2026-10-02T17:00:00Z', avg_price: 41 };

      const result = await service.getItemPrices({
        url_name: 'ash_prime_set',
        market: { volume: 73, avg_price: 41, last_completed: lastCompleted }
      } as any);

      expect(result).toMatchObject({ buy: 35, sell: 40, volume: 73, avg_price: 41 });
      expect(result.last_completed).toEqual(lastCompleted);
    });

    it('falls back to zero stats for an item with no stored market data', async () => {
      const service = new MarketService(ordersOnlyClient());

      const result = await service.getItemPrices({ url_name: 'ash_prime_set' });

      expect(result).toMatchObject({ buy: 35, sell: 40, volume: 0, avg_price: 0 });
      expect(result.last_completed).toBeNull();
    });

    it('does not fence live prices against a stale stored average', async () => {
      // The market moved from ~10p to ~40p since stats froze. Against a stale
      // going rate of 10 the bait ceiling (10 × 1.5 = 15) would drop the real 35p
      // bid and leave the 12p one as the headline.
      const httpClient = ordersOnlyClient();
      (httpClient.get as any).mockImplementation(async () => ({
        data: [
          ...ORDERS.data,
          { type: 'buy', platinum: 12, quantity: 1, user: { status: 'ingame', ingameName: 'd' } }
        ]
      }));
      const service = new MarketService(httpClient);

      const result = await service.getItemPrices({
        url_name: 'ash_prime_set',
        market: { volume: 50, avg_price: 10, last_completed: null }
      } as any);

      expect(result.sell).toBe(40);
      expect(result.buy).toBe(35);
    });
  });
});
