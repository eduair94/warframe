/**
 * @fileoverview Type tests for interfaces
 * @module tests/interfaces.test
 * 
 * These tests ensure that interfaces are correctly defined and
 * type-safe by creating valid and checking for proper structure.
 */

import { describe, it, expect } from '@jest/globals';
import {
  IMarketItem,
  IOrder,
  IOrdersResponse,
  IProcessedItem,
  IOrderUser
} from './market.interface';
import {
  IRivenModDetails,
  IEndoCalculationParams
} from './riven.interface';
import {
  IRelic,
  IRelicReward
} from './relic.interface';

/**
 * Helper to create a valid order user
 */
function createOrderUser(overrides: Partial<IOrderUser> = {}): IOrderUser {
  return {
    id: 'user123',
    status: 'ingame',
    ingame_name: 'TestUser',
    reputation: 50,
    locale: 'en',
    region: 'en',
    last_seen: '2024-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('Market Interfaces', () => {
  describe('IMarketItem', () => {
    it('should accept valid market item structure', () => {
      const item: IMarketItem = {
        id: '123',
        item_name: 'Test Item',
        url_name: 'test_item',
        thumb: 'test.png'
      };

      expect(item.id).toBe('123');
      expect(item.item_name).toBe('Test Item');
      expect(item.url_name).toBe('test_item');
    });

    it('should accept optional properties', () => {
      const item: IMarketItem = {
        id: '123',
        item_name: 'Test Item',
        url_name: 'test_item',
        thumb: 'test.png',
        vaulted: true,
        market: { buy: 50, sell: 100 },
        items_in_set: []
      };

      expect(item.vaulted).toBe(true);
      expect(item.market?.buy).toBe(50);
    });
  });

  describe('IOrder', () => {
    it('should accept valid order structure', () => {
      const order: IOrder = {
        id: 'order123',
        order_type: 'sell',
        platinum: 100,
        quantity: 1,
        user: createOrderUser(),
        visible: true,
        creation_date: '2024-01-01',
        last_update: '2024-01-01',
        platform: 'pc',
        region: 'en'
      };

      expect(order.order_type).toBe('sell');
      expect(order.platinum).toBe(100);
      expect(order.user.status).toBe('ingame');
    });

    it('should accept order with mod_rank', () => {
      const order: IOrder = {
        id: 'order123',
        order_type: 'buy',
        platinum: 50,
        quantity: 1,
        user: createOrderUser({ status: 'online' }),
        visible: true,
        creation_date: '2024-01-01',
        last_update: '2024-01-01',
        platform: 'pc',
        region: 'en',
        mod_rank: 10
      };

      expect(order.mod_rank).toBe(10);
    });
  });

  describe('IOrdersResponse', () => {
    it('should accept valid orders response structure', () => {
      const response: IOrdersResponse = {
        payload: {
          orders: [
            {
              id: 'order123',
              order_type: 'sell',
              platinum: 100,
              quantity: 1,
              user: createOrderUser(),
              visible: true,
              creation_date: '2024-01-01',
              last_update: '2024-01-01',
              platform: 'pc',
              region: 'en'
            }
          ]
        }
      };

      expect(response.payload.orders.length).toBe(1);
    });
  });

  describe('IProcessedItem', () => {
    it('should accept valid processed item structure', () => {
      const item: IProcessedItem = {
        item_name: 'Test Item',
        url_name: 'test_item',
        thumb: 'test.png',
        tags: ['prime'],
        set: false,
        market: {
          buy: 50,
          sell: 100,
          diff: 50
        },
        priceUpdate: new Date()
      };

      expect(item.item_name).toBe('Test Item');
      expect(item.market.diff).toBe(50);
      expect(item.set).toBe(false);
    });
  });
});

describe('Riven Interfaces', () => {
  describe('IRivenModDetails', () => {
    it('should accept valid riven mod details structure', () => {
      const rivenMod: IRivenModDetails = {
        type: 'riven',
        weapon_url_name: 'test_weapon',
        name: 'Test Riven',
        re_rolls: 10,
        mastery_level: 16,
        mod_rank: 8,
        polarity: 'madurai',
        attributes: [
          {
            positive: true,
            value: 100,
            url_name: 'damage'
          }
        ]
      };

      expect(rivenMod.re_rolls).toBe(10);
      expect(rivenMod.mastery_level).toBe(16);
      expect(rivenMod.weapon_url_name).toBe('test_weapon');
    });
  });

  describe('IEndoCalculationParams', () => {
    it('should accept valid endo calculation params', () => {
      const params: IEndoCalculationParams = {
        mastery_level: 16,
        mod_rank: 8,
        re_rolls: 50
      };

      expect(params.mastery_level).toBe(16);
      expect(params.mod_rank).toBe(8);
      expect(params.re_rolls).toBe(50);
    });
  });
});

describe('Relic Interfaces', () => {
  describe('IRelic', () => {
    it('should accept valid relic structure', () => {
      const relic: IRelic = {
        tier: 'Lith',
        relicName: 'A1',
        state: 'Intact',
        rewards: [
          {
            itemName: 'Test Part',
            rarity: 'Common',
            chance: 25.33
          }
        ]
      };

      expect(relic.tier).toBe('Lith');
      expect(relic.relicName).toBe('A1');
      expect(relic.state).toBe('Intact');
      expect(relic.rewards.length).toBe(1);
    });
  });

  describe('IRelicReward', () => {
    it('should accept valid relic reward structure', () => {
      const reward: IRelicReward = {
        itemName: 'Prime Part',
        rarity: 'Rare',
        chance: 2.0
      };

      expect(reward.itemName).toBe('Prime Part');
      expect(reward.rarity).toBe('Rare');
      expect(reward.chance).toBe(2.0);
    });
  });
});

describe('Type Guards', () => {
  /**
   * Type guard for IMarketItem
   */
  function isMarketItem(obj: unknown): obj is IMarketItem {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'id' in obj &&
      'item_name' in obj &&
      'url_name' in obj
    );
  }

  /**
   * Type guard for IOrder
   */
  function isOrder(obj: unknown): obj is IOrder {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'order_type' in obj &&
      'platinum' in obj &&
      'user' in obj
    );
  }

  it('should correctly identify IMarketItem', () => {
    const validItem = {
      id: '123',
      item_name: 'Test',
      url_name: 'test'
    };
    const invalidItem = {
      id: '123'
    };

    expect(isMarketItem(validItem)).toBe(true);
    expect(isMarketItem(invalidItem)).toBe(false);
  });

  it('should correctly identify IOrder', () => {
    const validOrder = {
      order_type: 'sell',
      platinum: 100,
      user: { status: 'ingame' }
    };
    const invalidOrder = {
      platinum: 100
    };

    expect(isOrder(validOrder)).toBe(true);
    expect(isOrder(invalidOrder)).toBe(false);
  });
});
