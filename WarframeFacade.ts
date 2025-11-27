/**
 * @fileoverview Warframe Market Facade using axios HTTP client
 * @module WarframeFacade
 * 
 * This class extends BaseWarframeClient to provide an implementation
 * using axios for HTTP requests with advanced proxy management.
 * 
 * All API methods are inherited from BaseWarframeClient which delegates
 * to MarketService - eliminating duplicate code between clients.
 * 
 * @example
 * ```typescript
 * const warframe = new WarframeFacade();
 * const items = await warframe.getWarframeItems();
 * const prices = await warframe.getWarframeItemOrders(item);
 * ```
 */

import { 
  HttpService, 
  RelicService, 
  RivenService, 
  SetService,
  ProxyManagerAdapter
} from './services';
import { MarketService } from './services/MarketService';
import { BaseWarframeClient, WarframeClientConfig } from './services/BaseWarframeClient';

// Debug mode - set DEBUG=true environment variable for verbose logging
const DEBUG = process.env.DEBUG === 'true';

/**
 * Extended configuration for WarframeFacade
 */
export type WarframeFacadeConfig = WarframeClientConfig & {
  /** Custom HTTP timeout in milliseconds */
  timeout?: number;
};

/**
 * Warframe Market Facade using axios HTTP client
 * 
 * Extends BaseWarframeClient with axios HTTP client.
 * All API methods are inherited - no duplicate code.
 * 
 * @extends BaseWarframeClient
 */
export class WarframeFacade extends BaseWarframeClient {
  /** HTTP client service using axios */
  private readonly httpClient: HttpService;

  /** Proxy management adapter */
  private readonly proxyManager: ProxyManagerAdapter;

  /** Market service for API operations */
  protected readonly marketService: MarketService;

  /** Relic data service */
  protected readonly relicService: RelicService;

  /** Riven mod operations service */
  protected readonly rivenService: RivenService;

  /** Set calculation service */
  protected readonly setService: SetService;

  /**
   * Creates a new WarframeFacade instance
   * 
   * @param config - Configuration options
   */
  constructor(config: WarframeFacadeConfig = {}) {
    super(config);

    // Initialize proxy manager
    this.proxyManager = new ProxyManagerAdapter(config.useProxies);

    // Initialize HTTP client with axios and proxy manager
    this.httpClient = new HttpService(this.proxyManager, {
      useProxies: config.useProxies ?? (process.env.PROXY_LESS !== 'true'),
      timeout: config.timeout
    });

    // Initialize MarketService with axios HTTP client
    // All API methods in base class delegate to this service
    this.marketService = new MarketService(this.httpClient);

    // Initialize other services
    this.relicService = new RelicService(
      this.dbRelics as any,
      this.db as any
    );

    this.rivenService = new RivenService(
      this.httpClient,
      this.dbRivens as any
    );

    // Initialize set service (uses base class helper)
    this.setService = this.createSetService();

    if (DEBUG) console.log('✓ WarframeFacade initialized with axios HTTP client');
  }

  // =====================================
  // SERVICE ACCESSORS
  // =====================================

  /**
   * Gets the HTTP service instance
   */
  getHttpService(): HttpService {
    return this.httpClient;
  }

  /**
   * Gets the Proxy manager instance
   */
  getProxyManager(): ProxyManagerAdapter {
    return this.proxyManager;
  }
}
