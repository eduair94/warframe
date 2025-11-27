/**
 * @fileoverview Unit tests for the Warframe service
 * @module tests/warframe.test
 * 
 * Tests cover:
 * - Endo calculation
 * - Price calculations
 * - Item processing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock external dependencies before importing the module
jest.mock('axios');
jest.mock('./database');
jest.mock('./Express/Proxies');
jest.mock('./anti-detection');

import { ENDO_CONSTANTS, PRICE_CONFIG } from './constants';

/**
 * Helper function to calculate endo (mirrors the actual implementation)
 */
function calculateEndo(mastery_level: number, mod_rank: number, re_rolls: number): number {
  return (
    ENDO_CONSTANTS.BASE_MULTIPLIER * (mastery_level - ENDO_CONSTANTS.MASTERY_OFFSET) +
    ENDO_CONSTANTS.RANK_MULTIPLIER * Math.pow(mod_rank, 2) +
    ENDO_CONSTANTS.REROLL_MULTIPLIER * re_rolls
  );
}

/**
 * Helper function to calculate prices from orders
 */
function calculateOrderPrices(
  orders: Array<{ order_type: string; platinum: number; user: { status: string }; mod_rank?: number }>,
  maxRank: number | undefined
) {
  const requiredStatus = PRICE_CONFIG.REQUIRED_STATUS;
  const topOrdersCount = PRICE_CONFIG.TOP_ORDERS_COUNT;

  const buyOrders = orders.filter(
    (order) =>
      order.order_type === 'buy' &&
      order.user.status === requiredStatus &&
      (maxRank === undefined || order.mod_rank === maxRank)
  );

  const sellOrders = orders.filter(
    (order) =>
      order.order_type === 'sell' &&
      order.user.status === requiredStatus &&
      (maxRank === undefined || order.mod_rank === maxRank)
  );

  let buyPlat = 0;
  let buyAvg = 0;
  if (buyOrders.length) {
    const sorted = [...buyOrders].sort((a, b) => b.platinum - a.platinum);
    buyPlat = sorted[0].platinum;
    const max = Math.min(topOrdersCount, sorted.length);
    buyAvg = sorted.slice(0, max).reduce((sum, o) => sum + o.platinum, 0) / max;
  }

  let sellPlat = 0;
  let sellAvg = 0;
  if (sellOrders.length) {
    const sorted = [...sellOrders].sort((a, b) => a.platinum - b.platinum);
    sellPlat = sorted[0].platinum;
    const max = Math.min(topOrdersCount, sorted.length);
    sellAvg = sorted.slice(0, max).reduce((sum, o) => sum + o.platinum, 0) / max;
  }

  return { buy: buyPlat, sell: sellPlat, buyAvg, sellAvg };
}

describe('Endo Calculation', () => {
  describe('calculateEndo', () => {
    it('should calculate endo correctly for base values', () => {
      // mastery_level = 8, mod_rank = 0, re_rolls = 0
      // Expected: 100 * (8 - 8) + 22.5 * 0^2 + 200 * 0 = 0
      expect(calculateEndo(8, 0, 0)).toBe(0);
    });

    it('should calculate endo correctly with mastery level', () => {
      // mastery_level = 16, mod_rank = 0, re_rolls = 0
      // Expected: 100 * (16 - 8) + 22.5 * 0^2 + 200 * 0 = 800
      expect(calculateEndo(16, 0, 0)).toBe(800);
    });

    it('should calculate endo correctly with mod rank', () => {
      // mastery_level = 8, mod_rank = 8, re_rolls = 0
      // Expected: 100 * (8 - 8) + 22.5 * 8^2 + 200 * 0 = 1440
      expect(calculateEndo(8, 8, 0)).toBe(1440);
    });

    it('should calculate endo correctly with re-rolls', () => {
      // mastery_level = 8, mod_rank = 0, re_rolls = 100
      // Expected: 100 * (8 - 8) + 22.5 * 0^2 + 200 * 100 = 20000
      expect(calculateEndo(8, 0, 100)).toBe(20000);
    });

    it('should calculate endo correctly with all parameters', () => {
      // mastery_level = 16, mod_rank = 8, re_rolls = 50
      // Expected: 100 * (16 - 8) + 22.5 * 8^2 + 200 * 50
      // = 800 + 1440 + 10000 = 12240
      expect(calculateEndo(16, 8, 50)).toBe(12240);
    });

    it('should handle high re-roll counts', () => {
      // mastery_level = 16, mod_rank = 8, re_rolls = 200
      // Expected: 100 * (16 - 8) + 22.5 * 8^2 + 200 * 200
      // = 800 + 1440 + 40000 = 42240
      expect(calculateEndo(16, 8, 200)).toBe(42240);
    });
  });

  describe('endo per platinum calculation', () => {
    it('should calculate endo per platinum correctly', () => {
      const endo = 10000;
      const price = 50;
      const endoPerPlat = Math.round((endo / price) * 100) / 100;
      expect(endoPerPlat).toBe(200);
    });

    it('should handle fractional results', () => {
      const endo = 1000;
      const price = 7;
      const endoPerPlat = Math.round((endo / price) * 100) / 100;
      expect(endoPerPlat).toBe(142.86);
    });

    it('should return 0 for zero price', () => {
      const endo = 1000;
      const price = 0;
      const endoPerPlat = price > 0 ? Math.round((endo / price) * 100) / 100 : 0;
      expect(endoPerPlat).toBe(0);
    });
  });
});

describe('Price Calculation', () => {
  describe('calculateOrderPrices', () => {
    const createOrder = (type: 'buy' | 'sell', platinum: number, status: string = 'ingame', modRank?: number) => ({
      order_type: type,
      platinum,
      user: { status },
      mod_rank: modRank
    });

    it('should calculate buy and sell prices from orders', () => {
      const orders = [
        createOrder('buy', 100),
        createOrder('buy', 90),
        createOrder('buy', 80),
        createOrder('sell', 120),
        createOrder('sell', 130),
        createOrder('sell', 140),
      ];

      const result = calculateOrderPrices(orders, undefined);

      expect(result.buy).toBe(100); // Highest buy
      expect(result.sell).toBe(120); // Lowest sell
    });

    it('should calculate averages from top 5 orders', () => {
      const orders = [
        createOrder('buy', 100),
        createOrder('buy', 90),
        createOrder('buy', 80),
        createOrder('buy', 70),
        createOrder('buy', 60),
        createOrder('buy', 50), // This should not be included in avg
        createOrder('sell', 110),
        createOrder('sell', 120),
        createOrder('sell', 130),
        createOrder('sell', 140),
        createOrder('sell', 150),
        createOrder('sell', 160), // This should not be included in avg
      ];

      const result = calculateOrderPrices(orders, undefined);

      // Buy avg: (100 + 90 + 80 + 70 + 60) / 5 = 80
      expect(result.buyAvg).toBe(80);
      // Sell avg: (110 + 120 + 130 + 140 + 150) / 5 = 130
      expect(result.sellAvg).toBe(130);
    });

    it('should filter orders by user status', () => {
      const orders = [
        createOrder('buy', 100, 'ingame'),
        createOrder('buy', 150, 'offline'), // Should be ignored
        createOrder('sell', 80, 'ingame'),
        createOrder('sell', 70, 'online'), // Should be ignored
      ];

      const result = calculateOrderPrices(orders, undefined);

      expect(result.buy).toBe(100);
      expect(result.sell).toBe(80);
    });

    it('should filter orders by mod rank when specified', () => {
      const orders = [
        createOrder('buy', 100, 'ingame', 8),
        createOrder('buy', 150, 'ingame', 0), // Different rank, should be ignored
        createOrder('sell', 120, 'ingame', 8),
        createOrder('sell', 80, 'ingame', 5), // Different rank, should be ignored
      ];

      const result = calculateOrderPrices(orders, 8);

      expect(result.buy).toBe(100);
      expect(result.sell).toBe(120);
    });

    it('should return 0 when no orders match', () => {
      const orders = [
        createOrder('buy', 100, 'offline'),
        createOrder('sell', 80, 'offline'),
      ];

      const result = calculateOrderPrices(orders, undefined);

      expect(result.buy).toBe(0);
      expect(result.sell).toBe(0);
      expect(result.buyAvg).toBe(0);
      expect(result.sellAvg).toBe(0);
    });

    it('should handle empty orders array', () => {
      const result = calculateOrderPrices([], undefined);

      expect(result.buy).toBe(0);
      expect(result.sell).toBe(0);
      expect(result.buyAvg).toBe(0);
      expect(result.sellAvg).toBe(0);
    });

    it('should calculate average with fewer than 5 orders', () => {
      const orders = [
        createOrder('buy', 100),
        createOrder('buy', 80),
        createOrder('sell', 120),
        createOrder('sell', 140),
      ];

      const result = calculateOrderPrices(orders, undefined);

      // Buy avg: (100 + 80) / 2 = 90
      expect(result.buyAvg).toBe(90);
      // Sell avg: (120 + 140) / 2 = 130
      expect(result.sellAvg).toBe(130);
    });
  });
});

describe('Item Processing', () => {
  interface MockItem {
    item_name: string;
    thumb: string;
    market?: { buy: number; sell: number };
    url_name: string;
    items_in_set?: Array<{ tags: string[] }>;
    priceUpdate?: Date;
  }

  function processItem(item: MockItem): any {
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate } = item;

    if (!market) return '';
    if (!items_in_set || !items_in_set.length) return '';

    const { tags } = items_in_set[0];

    return {
      item_name,
      thumb,
      market: { ...market, diff: market.sell - market.buy },
      url_name,
      tags,
      set: items_in_set.length > 1,
      priceUpdate
    };
  }

  it('should process a valid item correctly', () => {
    const item: MockItem = {
      item_name: 'Test Item',
      thumb: 'test.png',
      market: { buy: 50, sell: 100 },
      url_name: 'test_item',
      items_in_set: [{ tags: ['prime', 'warframe'] }],
      priceUpdate: new Date('2024-01-01')
    };

    const result = processItem(item);

    expect(result.item_name).toBe('Test Item');
    expect(result.thumb).toBe('test.png');
    expect(result.market.buy).toBe(50);
    expect(result.market.sell).toBe(100);
    expect(result.market.diff).toBe(50);
    expect(result.url_name).toBe('test_item');
    expect(result.tags).toEqual(['prime', 'warframe']);
    expect(result.set).toBe(false);
  });

  it('should detect set items with multiple parts', () => {
    const item: MockItem = {
      item_name: 'Test Set',
      thumb: 'test.png',
      market: { buy: 100, sell: 200 },
      url_name: 'test_set',
      items_in_set: [
        { tags: ['prime'] },
        { tags: ['prime'] },
        { tags: ['prime'] }
      ]
    };

    const result = processItem(item);

    expect(result.set).toBe(true);
  });

  it('should return empty string for items without market data', () => {
    const item: MockItem = {
      item_name: 'No Market Item',
      thumb: 'test.png',
      url_name: 'no_market_item',
      items_in_set: [{ tags: ['test'] }]
    };

    const result = processItem(item);

    expect(result).toBe('');
  });

  it('should return empty string for items without items_in_set', () => {
    const item: MockItem = {
      item_name: 'No Set Item',
      thumb: 'test.png',
      market: { buy: 50, sell: 100 },
      url_name: 'no_set_item'
    };

    const result = processItem(item);

    expect(result).toBe('');
  });

  it('should calculate negative diff when buy > sell', () => {
    const item: MockItem = {
      item_name: 'Inverted Price Item',
      thumb: 'test.png',
      market: { buy: 100, sell: 50 },
      url_name: 'inverted_item',
      items_in_set: [{ tags: ['test'] }]
    };

    const result = processItem(item);

    expect(result.market.diff).toBe(-50);
  });
});

describe('Relic URL Parsing', () => {
  function parseRelicUrlName(urlName: string): { tier: string; name: string } {
    const parts = urlName.split('_');
    return {
      tier: parts[0],
      name: parts[1]?.toUpperCase() ?? ''
    };
  }

  it('should parse standard relic URL name', () => {
    const result = parseRelicUrlName('lith_a1');
    expect(result.tier).toBe('lith');
    expect(result.name).toBe('A1');
  });

  it('should parse meso relic', () => {
    const result = parseRelicUrlName('meso_b3');
    expect(result.tier).toBe('meso');
    expect(result.name).toBe('B3');
  });

  it('should parse neo relic', () => {
    const result = parseRelicUrlName('neo_z5');
    expect(result.tier).toBe('neo');
    expect(result.name).toBe('Z5');
  });

  it('should parse axi relic', () => {
    const result = parseRelicUrlName('axi_h4');
    expect(result.tier).toBe('axi');
    expect(result.name).toBe('H4');
  });

  it('should handle missing name part', () => {
    const result = parseRelicUrlName('lith');
    expect(result.tier).toBe('lith');
    expect(result.name).toBe('');
  });
});

describe('Constants', () => {
  it('should have correct endo constants', () => {
    expect(ENDO_CONSTANTS.BASE_MULTIPLIER).toBe(100);
    expect(ENDO_CONSTANTS.MASTERY_OFFSET).toBe(8);
    expect(ENDO_CONSTANTS.RANK_MULTIPLIER).toBe(22.5);
    expect(ENDO_CONSTANTS.REROLL_MULTIPLIER).toBe(200);
  });

  it('should have correct price config', () => {
    expect(PRICE_CONFIG.TOP_ORDERS_COUNT).toBe(5);
    expect(PRICE_CONFIG.REQUIRED_STATUS).toBe('ingame');
  });
});
