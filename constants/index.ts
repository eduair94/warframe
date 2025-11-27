/**
 * @fileoverview Application-wide constants
 * @module constants
 * 
 * Centralizes all magic numbers and strings used throughout the application.
 * This improves maintainability and makes the codebase easier to understand.
 */

/**
 * API URLs used by the application
 */
export const API_URLS = {
  /** Warframe Market API v1 base URL */
  WARFRAME_MARKET: 'https://api.warframe.market/v1',
  
  /** Warframe Market API v2 base URL (for orders) */
  WARFRAME_MARKET_V2: 'https://api.warframe.market/v2',
  
  /** Warframe stat drops API for relic data */
  WARFRAME_DROPS: 'https://drops.warframestat.us/data/relics.json'
} as const;

/**
 * API endpoint paths (to be combined with API_URLS.WARFRAME_MARKET)
 */
export const API_ENDPOINTS = {
  /** Base URL for Warframe Market API */
  BASE: 'https://api.warframe.market/v1',
  
  /** Items endpoint path */
  ITEMS: '/items',
  
  /** Riven items endpoint path */
  RIVENS: '/riven/items',
  
  /** Auctions search endpoint path */
  AUCTIONS: '/auctions/search'
} as const;

/**
 * HTTP configuration constants
 */
export const HTTP_CONFIG = {
  /** Default request timeout in milliseconds */
  DEFAULT_TIMEOUT: 30000,
  
  /** Shorter timeout for proxied requests */
  PROXY_TIMEOUT: 10000,
  
  /** Maximum retry attempts */
  MAX_RETRIES: 100,
  
  /** Minimum delay between requests (ms) */
  MIN_DELAY: 500,
  
  /** Maximum delay between requests (ms) */
  MAX_DELAY: 2000,
  
  /** Maximum redirects to follow */
  MAX_REDIRECTS: 5,
  
  /** HTTP status codes that trigger retry */
  RETRYABLE_STATUSES: [403, 429, 500, 502, 503, 504] as const
} as const;

/**
 * Price calculation configuration
 */
export const PRICE_CONFIG = {
  /** Number of top orders to include in average */
  TOP_ORDERS_COUNT: 5,
  
  /** Required user status for order consideration */
  REQUIRED_STATUS: 'ingame' as const
} as const;

/**
 * Endo calculation constants for rivens
 */
export const ENDO_CONSTANTS = {
  /** Base multiplier for mastery level calculation */
  BASE_MULTIPLIER: 100,
  
  /** Mastery level offset in formula */
  MASTERY_OFFSET: 8,
  
  /** Multiplier for mod rank squared */
  RANK_MULTIPLIER: 22.5,
  
  /** Multiplier for number of re-rolls */
  REROLL_MULTIPLIER: 200
} as const;

/**
 * Riven auction search defaults
 */
export const RIVEN_DEFAULTS = {
  /** Default minimum re-rolls for auction search */
  MIN_REROLLS: 50,
  
  /** Default polarity filter */
  POLARITY: 'any' as const,
  
  /** Default buyout policy */
  BUYOUT_POLICY: 'direct' as const,
  
  /** Default sort order */
  SORT_BY: 'price_asc' as const
} as const;

/**
 * Database collection names
 */
export const COLLECTIONS = {
  /** Items collection */
  ITEMS: 'warframe-items',
  
  /** Rivens collection */
  RIVENS: 'warframe-rivens',
  
  /** Relics collection */
  RELICS: 'warframe-relics'
} as const;

/**
 * User agent and browser simulation constants
 */
export const BROWSER_SIMULATION = {
  /** Common referrer URLs for anti-detection */
  COMMON_REFERERS: [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://duckduckgo.com/',
    'https://warframe.market/',
    'https://warframe.market/items',
    ''
  ] as const,
  
  /** Accepted language strings */
  ACCEPT_LANGUAGES: [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.9',
    'en-US,en;q=0.8,es;q=0.6',
    'en-US,en;q=0.9,fr;q=0.8',
    'en-US,en;q=0.9,de;q=0.8'
  ] as const,
  
  /** Chrome user-agent version strings */
  CHROME_VERSIONS: [
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    '"Google Chrome";v="130", "Chromium";v="130", "Not_A Brand";v="24"',
    '"Google Chrome";v="129", "Chromium";v="129", "Not_A Brand";v="24"'
  ] as const,
  
  /** Default origin for requests */
  DEFAULT_ORIGIN: 'https://warframe.market'
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITING = {
  /** Delay after 429 response (minimum, ms) */
  RATE_LIMIT_MIN_DELAY: 2000,
  
  /** Delay after 429 response (maximum additional, ms) */
  RATE_LIMIT_JITTER: 3000
} as const;

/**
 * Aggregation pipeline limits
 */
export const AGGREGATION = {
  /** Default limit for top results queries */
  DEFAULT_LIMIT: 10
} as const;
