/**
 * @fileoverview Main Warframe module exports
 * @module warframe
 * 
 * This file provides exports for all Warframe-related classes and services.
 * 
 * Main Classes:
 * - WarframeUndici: Main class using undici for HTTP requests (recommended)
 * - WarframeFacade: Alternative class using axios with full service architecture
 * 
 * Services (for advanced use):
 * - HttpService: HTTP client with retry logic and proxy rotation
 * - MarketService: Warframe Market API interactions
 * - ItemService: Item database CRUD operations
 * - RivenService: Riven mod operations and endo calculations
 * - RelicService: Relic data management
 * - SetService: Set price calculations
 * - HeaderService: Browser header generation for anti-detection
 * - ProxyManagerAdapter: Proxy rotation management
 * 
 * @example
 * ```typescript
 * // Use the undici-based class (recommended - main module)
 * import WarframeUndici from './warframe-undici';
 * const warframe = new WarframeUndici();
 * 
 * // Or use the facade with axios
 * import { WarframeFacade } from './WarframeFacade';
 * const warframe = new WarframeFacade();
 * ```
 */

// Main class - uses undici for HTTP requests
import WarframeUndici from './warframe-undici';
export default WarframeUndici;
export { WarframeUndici };

// Alternative facade using axios
import { WarframeFacade, WarframeFacadeConfig } from './WarframeFacade';
export { WarframeFacade, WarframeFacadeConfig };

// Backward compatibility alias
export type IWarframeFacadeConfig = WarframeFacadeConfig;
export { WarframeFacade as Warframe };

// Export all services for direct use
export * from './services';

// Export interfaces (excluding ENDO_CONSTANTS which conflicts with constants)
export {
  IMarketItem,
  IOrder,
  IOrderUser,
  IOrdersResponse,
  IProcessedItem,
  IPriceResult,
  ISetResult,
  IStatisticsDataPoint,
  IStatisticsResponse,
  IWarframeItemsResponse,
  IMarketData,
  IItemInSet
} from './interfaces/market.interface';

export {
  IRivenItem,
  IRivenAuction,
  IRivenModDetails,
  IAuctionOwner,
  IEndoCalculationParams,
  IProcessedRiven,
  IRivenSearchParams,
  IRivenItemsResponse,
  IRivenAuctionsResponse,
  IRivenAttribute
} from './interfaces/riven.interface';

export {
  IRelic,
  IRelicReward,
  IRelicSetResult,
  IRelicSyncResult,
  IParsedRelicName,
  IRelicsApiResponse,
  RelicTier,
  RelicState,
  RewardRarity
} from './interfaces/relic.interface';

export {
  IHttpClient,
  IHttpRequestOptions,
  IHttpServiceConfig,
  IProxyConfig,
  IProxyManager,
  IRateLimiter,
  IBrowserHeaders,
  IRetryConfig
} from './interfaces/http.interface';

export {
  IDatabaseOperations,
  IDatabaseConfig
} from './interfaces/database.interface';

// Export constants (primary source)
export * from './constants';
