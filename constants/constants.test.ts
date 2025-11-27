/**
 * @fileoverview Unit tests for constants
 * @module tests/constants.test
 */

import { describe, it, expect } from '@jest/globals';
import {
  API_URLS,
  HTTP_CONFIG,
  PRICE_CONFIG,
  ENDO_CONSTANTS,
  RIVEN_DEFAULTS,
  COLLECTIONS,
  BROWSER_SIMULATION,
  RATE_LIMITING,
  AGGREGATION
} from './index';

describe('Constants', () => {
  describe('API_URLS', () => {
    it('should have valid market URL', () => {
      expect(API_URLS.WARFRAME_MARKET).toBe('https://api.warframe.market/v1');
    });

    it('should have valid drops API URL', () => {
      expect(API_URLS.WARFRAME_DROPS).toBe('https://drops.warframestat.us/data/relics.json');
    });
  });

  describe('HTTP_CONFIG', () => {
    it('should have positive default timeout', () => {
      expect(HTTP_CONFIG.DEFAULT_TIMEOUT).toBeGreaterThan(0);
    });

    it('should have positive proxy timeout', () => {
      expect(HTTP_CONFIG.PROXY_TIMEOUT).toBeGreaterThan(0);
    });

    it('should have positive max retries', () => {
      expect(HTTP_CONFIG.MAX_RETRIES).toBeGreaterThan(0);
    });

    it('should have positive min delay', () => {
      expect(HTTP_CONFIG.MIN_DELAY).toBeGreaterThan(0);
    });

    it('should have max delay greater than min delay', () => {
      expect(HTTP_CONFIG.MAX_DELAY).toBeGreaterThan(HTTP_CONFIG.MIN_DELAY);
    });

    it('should have acceptable timeout range (5-60 seconds)', () => {
      expect(HTTP_CONFIG.DEFAULT_TIMEOUT).toBeGreaterThanOrEqual(5000);
      expect(HTTP_CONFIG.DEFAULT_TIMEOUT).toBeLessThanOrEqual(60000);
    });

    it('should have retryable status codes', () => {
      expect(HTTP_CONFIG.RETRYABLE_STATUSES).toContain(403);
      expect(HTTP_CONFIG.RETRYABLE_STATUSES).toContain(429);
      expect(HTTP_CONFIG.RETRYABLE_STATUSES).toContain(500);
    });
  });

  describe('PRICE_CONFIG', () => {
    it('should have positive top orders count', () => {
      expect(PRICE_CONFIG.TOP_ORDERS_COUNT).toBeGreaterThan(0);
    });

    it('should have valid required status', () => {
      expect(['ingame', 'online', 'offline']).toContain(PRICE_CONFIG.REQUIRED_STATUS);
    });

    it('should have reasonable top orders count (1-20)', () => {
      expect(PRICE_CONFIG.TOP_ORDERS_COUNT).toBeGreaterThanOrEqual(1);
      expect(PRICE_CONFIG.TOP_ORDERS_COUNT).toBeLessThanOrEqual(20);
    });
  });

  describe('ENDO_CONSTANTS', () => {
    it('should have all required properties', () => {
      expect(ENDO_CONSTANTS).toHaveProperty('BASE_MULTIPLIER');
      expect(ENDO_CONSTANTS).toHaveProperty('MASTERY_OFFSET');
      expect(ENDO_CONSTANTS).toHaveProperty('RANK_MULTIPLIER');
      expect(ENDO_CONSTANTS).toHaveProperty('REROLL_MULTIPLIER');
    });

    it('should have correct base multiplier', () => {
      expect(ENDO_CONSTANTS.BASE_MULTIPLIER).toBe(100);
    });

    it('should have correct mastery offset', () => {
      expect(ENDO_CONSTANTS.MASTERY_OFFSET).toBe(8);
    });

    it('should have correct rank multiplier', () => {
      expect(ENDO_CONSTANTS.RANK_MULTIPLIER).toBe(22.5);
    });

    it('should have correct reroll multiplier', () => {
      expect(ENDO_CONSTANTS.REROLL_MULTIPLIER).toBe(200);
    });

    it('should produce valid endo calculation', () => {
      // Test the formula: BASE_MULTIPLIER * (mastery - MASTERY_OFFSET) + RANK_MULTIPLIER * rank^2 + REROLL_MULTIPLIER * rerolls
      const mastery = 16;
      const rank = 8;
      const rerolls = 10;
      
      const endo = 
        ENDO_CONSTANTS.BASE_MULTIPLIER * (mastery - ENDO_CONSTANTS.MASTERY_OFFSET) +
        ENDO_CONSTANTS.RANK_MULTIPLIER * Math.pow(rank, 2) +
        ENDO_CONSTANTS.REROLL_MULTIPLIER * rerolls;

      // 100 * (16-8) + 22.5 * 64 + 200 * 10 = 800 + 1440 + 2000 = 4240
      expect(endo).toBe(4240);
    });
  });

  describe('RIVEN_DEFAULTS', () => {
    it('should have valid sort by value', () => {
      expect(typeof RIVEN_DEFAULTS.SORT_BY).toBe('string');
    });

    it('should have valid polarity value', () => {
      expect(typeof RIVEN_DEFAULTS.POLARITY).toBe('string');
    });

    it('should have valid buyout policy value', () => {
      expect(typeof RIVEN_DEFAULTS.BUYOUT_POLICY).toBe('string');
    });

    it('should have minimum re-rolls defined', () => {
      expect(RIVEN_DEFAULTS.MIN_REROLLS).toBeGreaterThanOrEqual(0);
    });
  });

  describe('COLLECTIONS', () => {
    it('should have items collection name', () => {
      expect(COLLECTIONS.ITEMS).toBe('warframe-items');
    });

    it('should have rivens collection name', () => {
      expect(COLLECTIONS.RIVENS).toBe('warframe-rivens');
    });

    it('should have relics collection name', () => {
      expect(COLLECTIONS.RELICS).toBe('warframe-relics');
    });
  });

  describe('BROWSER_SIMULATION', () => {
    it('should have non-empty common referers array', () => {
      expect(Array.isArray(BROWSER_SIMULATION.COMMON_REFERERS)).toBe(true);
      expect(BROWSER_SIMULATION.COMMON_REFERERS.length).toBeGreaterThan(0);
    });

    it('should have non-empty accept languages array', () => {
      expect(Array.isArray(BROWSER_SIMULATION.ACCEPT_LANGUAGES)).toBe(true);
      expect(BROWSER_SIMULATION.ACCEPT_LANGUAGES.length).toBeGreaterThan(0);
    });

    it('should have non-empty chrome versions array', () => {
      expect(Array.isArray(BROWSER_SIMULATION.CHROME_VERSIONS)).toBe(true);
      expect(BROWSER_SIMULATION.CHROME_VERSIONS.length).toBeGreaterThan(0);
    });

    it('should have valid accept language format', () => {
      BROWSER_SIMULATION.ACCEPT_LANGUAGES.forEach(lang => {
        expect(typeof lang).toBe('string');
        expect(lang.length).toBeGreaterThan(0);
        expect(lang).toContain('en');
      });
    });

    it('should have valid default origin', () => {
      expect(BROWSER_SIMULATION.DEFAULT_ORIGIN).toBe('https://warframe.market');
    });
  });

  describe('RATE_LIMITING', () => {
    it('should have positive rate limit min delay', () => {
      expect(RATE_LIMITING.RATE_LIMIT_MIN_DELAY).toBeGreaterThan(0);
    });

    it('should have positive rate limit jitter', () => {
      expect(RATE_LIMITING.RATE_LIMIT_JITTER).toBeGreaterThan(0);
    });
  });

  describe('AGGREGATION', () => {
    it('should have valid default limit', () => {
      expect(AGGREGATION.DEFAULT_LIMIT).toBeGreaterThan(0);
    });
  });
});
