/**
 * @fileoverview Unit tests for HeaderService
 * @module tests/services/HeaderService.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { HeaderService } from './HeaderService';

describe('HeaderService', () => {
  let headerService: HeaderService;

  beforeEach(() => {
    headerService = new HeaderService();
  });

  describe('constructor', () => {
    it('should create an instance with default user agents', () => {
      expect(headerService).toBeInstanceOf(HeaderService);
    });

    it('should accept custom user agents', () => {
      const customAgents = ['Custom Agent 1', 'Custom Agent 2'];
      const customService = new HeaderService(customAgents);
      expect(customService).toBeInstanceOf(HeaderService);
    });
  });

  describe('generateHeaders', () => {
    it('should return an object with required headers', () => {
      const headers = headerService.generateHeaders();
      
      expect(headers).toHaveProperty('accept');
      expect(headers).toHaveProperty('accept-language');
      expect(headers).toHaveProperty('accept-encoding');
      expect(headers).toHaveProperty('cache-control');
      expect(headers).toHaveProperty('sec-ch-ua');
      expect(headers).toHaveProperty('sec-ch-ua-mobile');
      expect(headers).toHaveProperty('sec-ch-ua-platform');
      expect(headers).toHaveProperty('sec-fetch-dest');
      expect(headers).toHaveProperty('sec-fetch-mode');
      expect(headers).toHaveProperty('sec-fetch-site');
      expect(headers).toHaveProperty('user-agent');
    });

    it('should return different user agents on multiple calls', () => {
      // Run multiple times to test randomness
      const userAgents = new Set<string>();
      
      for (let i = 0; i < 50; i++) {
        const headers = headerService.generateHeaders();
        userAgents.add(headers['user-agent']);
      }

      // With random selection, we should get more than 1 unique user agent
      // (statistically very likely with 50 iterations and multiple agents)
      expect(userAgents.size).toBeGreaterThan(1);
    });

    it('should return valid accept header', () => {
      const headers = headerService.generateHeaders();
      expect(headers['accept']).toContain('application/json');
    });

    it('should return valid accept-language header', () => {
      const headers = headerService.generateHeaders();
      // Accept-language is randomized, so just check it contains 'en'
      expect(headers['accept-language']).toContain('en');
    });

    it('should return valid accept-encoding header', () => {
      const headers = headerService.generateHeaders();
      expect(headers['accept-encoding']).toContain('gzip');
    });

    it('should return valid sec-ch-ua-platform header', () => {
      const headers = headerService.generateHeaders();
      expect(headers['sec-ch-ua-platform']).toBe('"Windows"');
    });

    it('should return valid sec-fetch-mode header', () => {
      const headers = headerService.generateHeaders();
      expect(headers['sec-fetch-mode']).toBe('cors');
    });
  });

  describe('getRandomUserAgent', () => {
    it('should return a string', () => {
      const userAgent = headerService.getRandomUserAgent();
      expect(typeof userAgent).toBe('string');
    });

    it('should return a non-empty string', () => {
      const userAgent = headerService.getRandomUserAgent();
      expect(userAgent.length).toBeGreaterThan(0);
    });

    it('should return user agents containing browser identifiers', () => {
      const userAgent = headerService.getRandomUserAgent();
      // Most modern user agents contain 'Mozilla' or browser identifiers
      expect(userAgent).toContain('Mozilla');
    });
  });

  describe('addUserAgents', () => {
    it('should add new user agents to the list', () => {
      const customAgents = ['New Agent 1', 'New Agent 2'];
      headerService.addUserAgents(customAgents);
      
      // Verify the agents were added by checking if they can be returned
      const allPossibleAgents = new Set<string>();
      for (let i = 0; i < 100; i++) {
        allPossibleAgents.add(headerService.getRandomUserAgent());
      }
      
      // At least one of the custom agents should appear
      const hasCustomAgent = customAgents.some(agent => allPossibleAgents.has(agent));
      expect(hasCustomAgent).toBe(true);
    });
  });

  describe('setUserAgents', () => {
    it('should replace all user agents', () => {
      const newAgents = ['Only Agent'];
      headerService.setUserAgents(newAgents);
      
      // All calls should return the same agent
      for (let i = 0; i < 10; i++) {
        expect(headerService.getRandomUserAgent()).toBe('Only Agent');
      }
    });
  });

  describe('getUserAgentCount', () => {
    it('should return the number of user agents', () => {
      const customAgents = ['Agent 1', 'Agent 2', 'Agent 3'];
      const customService = new HeaderService(customAgents);
      expect(customService.getUserAgentCount()).toBe(3);
    });
  });
});
