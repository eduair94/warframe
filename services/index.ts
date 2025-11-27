/**
 * @fileoverview Central export for all application services
 * @module services
 * 
 * This module provides a single entry point for all service classes,
 * following the Service Layer pattern for business logic encapsulation.
 * 
 * Services are organized into:
 * - HTTP Services: HttpService, UndiciHttpService (different HTTP backends)
 * - Domain Services: MarketService, RivenService, RelicService, ItemService, SetService
 * - Utility Services: HeaderService, ProxyManagerAdapter
 * - Calculators: OrderCalculator, StatisticsCalculator, ItemProcessor
 */

// HTTP Services
export { HttpService } from './HttpService';
export { UndiciHttpService } from './UndiciHttpService';

// Domain Services
export { MarketService } from './MarketService';
export { RivenService } from './RivenService';
export { RelicService } from './RelicService';
export { ItemService } from './ItemService';
export { SetService } from './SetService';

// Utility Services
export { HeaderService } from './HeaderService';
export { ProxyManagerAdapter } from './ProxyManagerAdapter';

// Calculators & Processors (Pure utilities, no dependencies)
export { OrderCalculator, type IOrderData, type IPriceCalculationResult, type IPriceCalculationOptions } from './OrderCalculator';
export { StatisticsCalculator, type IStatisticsDataPoint, type IStatisticsResult, type IStatisticsOptions } from './StatisticsCalculator';
export { ItemProcessor } from './ItemProcessor';

// Base Classes (for extension)
export { BaseWarframeClient } from './BaseWarframeClient';
