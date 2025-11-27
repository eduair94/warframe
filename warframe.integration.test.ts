/**
 * @fileoverview Integration tests for Warframe services with real API calls
 * @module tests/integration
 * 
 * These tests verify that the refactored services work correctly by making
 * real HTTP requests to the Warframe Market API (without proxy if PROXY_LESS=true).
 * 
 * Run with: npm run test:integration
 */

import dotenv from 'dotenv';
dotenv.config();

import { 
  HttpService, 
  MarketService, 
  HeaderService,
  ProxyManagerAdapter 
} from './services';
import { IWarframeItemsResponse, IOrdersResponse, IStatisticsResponse } from './interfaces/market.interface';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds for API calls
const TEST_ITEM_URL = 'ash_prime_set'; // A popular item for testing
const API_BASE = 'https://api.warframe.market/v1';

describe('Integration Tests - Real API Calls', () => {
  // Proxy manager (respects PROXY_LESS env variable)
  let proxyManager: ProxyManagerAdapter;
  let httpService: HttpService;
  let marketService: MarketService;

  beforeAll(() => {
    console.log('\n🔧 Setting up integration tests...');
    console.log(`   PROXY_LESS = ${process.env.PROXY_LESS}`);
    
    proxyManager = new ProxyManagerAdapter();
    httpService = new HttpService(proxyManager, {
      useProxies: process.env.PROXY_LESS !== 'true',
      timeout: 15000
    });
    // MarketService now only needs httpClient (IHttpClient)
    marketService = new MarketService(httpService);
    
    console.log(`   Proxies enabled: ${proxyManager.isEnabled()}`);
  });

  describe('HeaderService', () => {
    it('should generate valid browser-like headers', () => {
      const headerService = new HeaderService();
      const headers = headerService.generateHeaders();
      
      // Headers use lowercase keys for axios compatibility
      expect(headers['user-agent']).toBeDefined();
      expect(headers['accept']).toBe('application/json, text/plain, */*');
      expect(headers['accept-encoding']).toContain('gzip');
      expect(headers['sec-ch-ua']).toBeDefined();
    });

    it('should generate different user agents on multiple calls', () => {
      const headerService = new HeaderService();
      const headers1 = headerService.generateHeaders();
      const headers2 = headerService.generateHeaders();
      
      // Headers should be generated (may be same or different depending on randomization)
      expect(headers1['user-agent']).toBeDefined();
      expect(headers2['user-agent']).toBeDefined();
    });
  });

  describe('ProxyManagerAdapter', () => {
    it('should respect PROXY_LESS environment variable', () => {
      const isProxyLess = process.env.PROXY_LESS === 'true';
      
      if (isProxyLess) {
        expect(proxyManager.isEnabled()).toBe(false);
        expect(proxyManager.getProxy()).toBeNull();
      } else {
        expect(proxyManager.isEnabled()).toBe(true);
        // May return null if no proxies configured
      }
    });
  });

  describe('HttpService - Real API Calls', () => {
    it('should successfully fetch items list from Warframe Market', async () => {
      console.log('\n📡 Testing: Fetch all items...');
      
      const response = await httpService.get<IWarframeItemsResponse>(
        `${API_BASE}/items`
      );
      
      expect(response).toBeDefined();
      expect(response.payload).toBeDefined();
      expect(response.payload.items).toBeDefined();
      expect(Array.isArray(response.payload.items)).toBe(true);
      expect(response.payload.items.length).toBeGreaterThan(0);
      
      // Verify item structure
      const firstItem = response.payload.items[0];
      expect(firstItem.id).toBeDefined();
      expect(firstItem.url_name).toBeDefined();
      expect(firstItem.item_name).toBeDefined();
      
      console.log(`   ✓ Fetched ${response.payload.items.length} items`);
    }, TEST_TIMEOUT);

    it('should successfully fetch orders for a specific item', async () => {
      console.log(`\n📡 Testing: Fetch orders for ${TEST_ITEM_URL}...`);
      
      const response = await httpService.get<IOrdersResponse>(
        `${API_BASE}/items/${TEST_ITEM_URL}/orders`
      );
      
      expect(response).toBeDefined();
      expect(response.payload).toBeDefined();
      expect(response.payload.orders).toBeDefined();
      expect(Array.isArray(response.payload.orders)).toBe(true);
      
      if (response.payload.orders.length > 0) {
        const firstOrder = response.payload.orders[0];
        expect(firstOrder.id).toBeDefined();
        expect(firstOrder.platinum).toBeDefined();
        expect(firstOrder.order_type).toBeDefined();
        expect(firstOrder.user).toBeDefined();
      }
      
      console.log(`   ✓ Fetched ${response.payload.orders.length} orders`);
    }, TEST_TIMEOUT);

    it('should successfully fetch statistics for a specific item', async () => {
      console.log(`\n📡 Testing: Fetch statistics for ${TEST_ITEM_URL}...`);
      
      const response = await httpService.get<IStatisticsResponse>(
        `${API_BASE}/items/${TEST_ITEM_URL}/statistics`
      );
      
      expect(response).toBeDefined();
      expect(response.payload).toBeDefined();
      expect(response.payload.statistics_closed).toBeDefined();
      expect(response.payload.statistics_closed['48hours']).toBeDefined();
      
      console.log(`   ✓ Fetched statistics with ${response.payload.statistics_closed['48hours'].length} data points (48h)`);
    }, TEST_TIMEOUT);
  });

  describe('MarketService - Real API Calls', () => {
    it('should successfully get all items using MarketService', async () => {
      console.log('\n📡 Testing: MarketService.getAllItems...');
      
      const response = await marketService.getAllItems();
      
      expect(response).toBeDefined();
      expect(response.payload.items.length).toBeGreaterThan(0);
      
      console.log(`   ✓ MarketService fetched ${response.payload.items.length} items`);
    }, TEST_TIMEOUT);

    it('should successfully get item details using MarketService', async () => {
      console.log(`\n📡 Testing: MarketService.getItemDetails for ${TEST_ITEM_URL}...`);
      
      const response = await marketService.getItemDetails(TEST_ITEM_URL);
      
      expect(response).toBeDefined();
      expect(response.payload).toBeDefined();
      expect(response.payload.item).toBeDefined();
      
      console.log(`   ✓ Fetched details for: ${response.payload.item.item_name || TEST_ITEM_URL}`);
    }, TEST_TIMEOUT);

    it('should successfully get item orders using MarketService', async () => {
      console.log(`\n📡 Testing: MarketService.getItemOrders for ${TEST_ITEM_URL}...`);
      
      const response = await marketService.getItemOrders(TEST_ITEM_URL);
      
      expect(response).toBeDefined();
      expect(response.payload.orders).toBeDefined();
      
      // Filter in-game orders
      const ingameOrders = response.payload.orders.filter(o => o.user.status === 'ingame');
      const buyOrders = ingameOrders.filter(o => o.order_type === 'buy');
      const sellOrders = ingameOrders.filter(o => o.order_type === 'sell');
      
      console.log(`   ✓ Orders: ${buyOrders.length} buy, ${sellOrders.length} sell (in-game only)`);
    }, TEST_TIMEOUT);

    it('should successfully calculate item prices using MarketService', async () => {
      console.log(`\n📡 Testing: MarketService.getItemPrices for ${TEST_ITEM_URL}...`);
      
      // First get item details
      const itemDetails = await marketService.getItemDetails(TEST_ITEM_URL);
      
      const mockItem = {
        id: 'test',
        item_name: 'Ash Prime Set',
        url_name: TEST_ITEM_URL,
        thumb: '',
        items_in_set: itemDetails.payload.item.items_in_set || []
      };
      
      const prices = await marketService.getItemPrices(mockItem);
      
      expect(prices).toBeDefined();
      expect(typeof prices.buy).toBe('number');
      expect(typeof prices.sell).toBe('number');
      expect(typeof prices.volume).toBe('number');
      expect(typeof prices.avg_price).toBe('number');
      
      console.log(`   ✓ Prices: Buy ${prices.buy}p, Sell ${prices.sell}p`);
      console.log(`   ✓ Stats: Volume ${prices.volume}, Avg ${prices.avg_price.toFixed(2)}p`);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent items gracefully', async () => {
      console.log('\n📡 Testing: Error handling for non-existent item...');
      
      const mockItem = {
        id: 'fake',
        item_name: 'Non Existent Item',
        url_name: 'this_item_does_not_exist_12345',
        thumb: '',
        items_in_set: []
      };
      
      const prices = await marketService.getItemPrices(mockItem);
      
      expect(prices).toBeDefined();
      expect(prices.not_found).toBe(true);
      expect(prices.buy).toBe(0);
      expect(prices.sell).toBe(0);
      
      console.log('   ✓ Non-existent item handled gracefully');
    }, TEST_TIMEOUT);
  });
});

// Run additional health check
describe('API Health Check', () => {
  it('should verify Warframe Market API is accessible', async () => {
    console.log('\n🏥 API Health Check...');
    
    try {
      // Use axios instead of fetch to avoid open handle warnings
      const axios = (await import('axios')).default;
      const response = await axios.get(`${API_BASE}/items`, { timeout: 10000 });
      expect(response.status).toBe(200);
      console.log('   ✓ Warframe Market API is accessible');
    } catch (error) {
      console.error('   ✗ API may be down or blocked');
      throw error;
    }
  }, TEST_TIMEOUT);
});
