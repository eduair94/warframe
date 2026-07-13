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
        statsMaxDelay: 0
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
        ordersMinDelay: 0, ordersMaxDelay: 0, statsMinDelay: 0, statsMaxDelay: 0
      });

      const result = await service.getItemPrices({ url_name: 'ash_prime_blueprint' });
      expect(result.buy).toBe(0);
      expect(result.sell).toBe(0);
    });
  });
});
