/**
 * @fileoverview High-performance Warframe Market API client using undici
 * @module WarframeUndici
 * 
 * This class extends BaseWarframeClient to provide a high-performance
 * implementation using the undici HTTP library for optimal HTTP/2 support.
 * 
 * All API methods are inherited from BaseWarframeClient which delegates
 * to MarketService - eliminating duplicate code between clients.
 * 
 * @example
 * ```typescript
 * const client = new WarframeUndici();
 * const items = await client.getWarframeItems();
 * const orders = await client.getItemOrders('mesa_prime_set');
 * ```
 */

import {
  UndiciHttpService,
  RelicService,
  RivenService,
  SetService
} from "./services";
import { MarketService } from "./services/MarketService";
import { BaseWarframeClient, WarframeClientConfig } from "./services/BaseWarframeClient";

// Debug mode - set DEBUG=true environment variable for verbose logging
const DEBUG = process.env.DEBUG === 'true';

/**
 * High-performance Warframe Market API client using undici
 * 
 * Extends BaseWarframeClient with undici HTTP client.
 * All API methods are inherited - no duplicate code.
 * 
 * @extends BaseWarframeClient
 */
export default class WarframeUndici extends BaseWarframeClient {
  /** HTTP service using undici */
  private readonly httpClient: UndiciHttpService;

  /** Market service for API operations */
  protected readonly marketService: MarketService;

  /** Relic data service */
  protected readonly relicService: RelicService;

  /** Riven mod operations service */
  protected readonly rivenService: RivenService;

  /** Set calculation service */
  protected readonly setService: SetService;

  /**
   * Creates a new WarframeUndici instance
   * 
   * @param config - Configuration options
   */
  constructor(config: WarframeClientConfig = {}) {
    super(config);

    // Initialize HTTP client with undici
    this.httpClient = new UndiciHttpService({
      maxRetries: config.maxRetries ?? 10,
      minDelay: config.minDelay ?? 500,
      maxDelay: config.maxDelay ?? 2000,
      useProxies: config.useProxies
    });

    // Initialize MarketService with undici HTTP client
    // All API methods in base class delegate to this service
    this.marketService = new MarketService(this.httpClient, config.priceConfig);

    // Initialize other services with the same HTTP client
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

    if (DEBUG) console.log('✓ WarframeUndici initialized with undici HTTP client');
  }

  // =====================================
  // SERVICE ACCESSOR
  // =====================================

  /**
   * Gets the HTTP service instance
   */
  getHttpService(): UndiciHttpService {
    return this.httpClient;
  }

  /**
   * Gets proxy statistics
   */
  getProxyStats(): any {
    return {
      message: "Proxy stats are managed by ProxyRotation static class",
      available: "Use ProxyRotation.getProxyStats(proxy) for individual proxy stats"
    };
  }
}
