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
  WARFRAME_DROPS: 'https://drops.warframestat.us/data/relics.json',

  /** Mission reward tables by planet/node — powers the Star Chart */
  WARFRAME_DROPS_MISSIONS: 'https://drops.warframestat.us/data/missionRewards.json',

  /** Raw-GitHub mirrors, used as a fallback when drops.warframestat.us is unreachable */
  WARFRAME_DROPS_RELICS_MIRROR: 'https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/relics.json',
  WARFRAME_DROPS_MISSIONS_MIRROR: 'https://raw.githubusercontent.com/WFCD/warframe-drop-data/master/data/missionRewards.json',

  /** Star-chart node metadata (name/planet/enemy levels), WFCD warframe-items */
  WARFRAME_NODES: 'https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/Node.json',

  /** Node name/enemy/type by SolNodeNNN, WFCD warframe-worldstate-data (+ warframestat fallback) */
  WARFRAME_SOLNODES: 'https://raw.githubusercontent.com/WFCD/warframe-worldstate-data/master/data/solNodes.json',
  WARFRAME_SOLNODES_FALLBACK: 'https://api.warframestat.us/solNodes'
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
 * Riven auction sync retry/pacing defaults
 *
 * Auction search requests are unauthenticated and easy to rate-limit
 * (Cloudflare 429s observed after only a handful of back-to-back requests).
 * These bound retry attempts with backoff instead of retrying forever, and
 * pace successive weapon syncs so the limit isn't hit in the first place.
 */
export const RIVEN_SYNC_DEFAULTS = {
  /** Max attempts before giving up syncing a single riven's auctions and moving on */
  MAX_SYNC_ATTEMPTS: 5,

  /** Base delay (ms) for exponential backoff between sync retries */
  RETRY_BASE_DELAY: 2000,

  /** Max delay (ms) cap for sync retry backoff */
  RETRY_MAX_DELAY: 30000,

  /** Minimum delay (ms) between syncing successive rivens */
  INTER_WEAPON_MIN_DELAY: 300,

  /** Maximum delay (ms) between syncing successive rivens */
  INTER_WEAPON_MAX_DELAY: 800
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
  RELICS: 'warframe-relics',

  /** Daily price history points, one document per item (see PriceHistoryService) */
  PRICE_HISTORY: 'warframe-price-history',

  /** WFCD drop-data backup: two documents (map + index), see DropService */
  DROPS: 'warframe-drops',

  /** Localized game-noun name dictionaries: one document per (scope, lang), see TranslationService */
  TRANSLATIONS: 'warframe-translations',

  /** Web Push subscriptions + their price-alert thresholds, one doc per anonymous deviceId (see PushSubscriptionService) */
  PUSH_SUBSCRIPTIONS: 'warframe-push-subscriptions',

  /**
   * Signed-in player accounts: ONE document per Firebase uid holding the whole
   * synced payload (watchlist, vault, goals, trades, settings). One read serves
   * every account page — see UserDataService.
   */
  USERS: 'warframe-users',

  /**
   * Mastery / build catalogue for the Foundry tracker: one document
   * ({ key: 'catalogue' }) holding every masterable item, its components and the
   * aggregated resource requirements. See FoundryService.
   */
  FOUNDRY: 'warframe-foundry'
} as const;

/**
 * i18n: locale codes warframe.market's v2 API serves with real (non-sparse)
 * translations. English is the canonical/base language (already stored as
 * `item_name`), so these are the NON-EN languages the translation collector
 * fetches and the frontend can localize into. Probed `sv`, `cs`, `th` return
 * sparse/empty content and are intentionally excluded.
 *
 * NOTE: these codes are sent verbatim as the `Language:` request header to
 * warframe.market AND used as the frontend i18n locale codes, so the two must
 * stay identical (esp. `zh-hans` / `zh-hant`).
 */
export const TRANSLATION_LANGS = [
  'de', 'fr', 'ru', 'ko', 'ja', 'zh-hans', 'zh-hant', 'pt', 'es', 'pl', 'it', 'uk'
] as const;

export type TranslationLang = typeof TRANSLATION_LANGS[number];

/**
 * i18n: every warframe.market v2 collection whose entity names we localize.
 * `path` is appended to API_URLS.WARFRAME_MARKET_V2; `nameField` is the i18n
 * sub-field holding the display name (locations use `nodeName`, everything else
 * `name`). `keyField` is the stable, language-independent lookup key stored in
 * the dictionary (always the entity `slug`).
 */
export const TRANSLATION_SCOPES = [
  { scope: 'items',            path: '/items',             nameField: 'name' },
  { scope: 'riven-weapons',    path: '/riven/weapons',     nameField: 'name' },
  { scope: 'riven-attributes', path: '/riven/attributes',  nameField: 'name' },
  { scope: 'lich-weapons',     path: '/lich/weapons',      nameField: 'name' },
  { scope: 'lich-quirks',      path: '/lich/quirks',       nameField: 'name' },
  { scope: 'lich-ephemeras',   path: '/lich/ephemeras',    nameField: 'name' },
  { scope: 'sister-weapons',   path: '/sister/weapons',    nameField: 'name' },
  { scope: 'sister-quirks',    path: '/sister/quirks',     nameField: 'name' },
  { scope: 'sister-ephemeras', path: '/sister/ephemeras',  nameField: 'name' },
  { scope: 'npcs',             path: '/npcs',              nameField: 'name' },
  { scope: 'missions',         path: '/missions',          nameField: 'name' },
  // locations additionally yield a `systemName` (planet) captured as the
  // synthetic `location-systems` scope in the collector — same single fetch.
  { scope: 'locations',        path: '/locations',         nameField: 'nodeName' }
] as const;

/** All valid dictionary scope strings (the fetched scopes + the synthetic system-name scope). */
export const TRANSLATION_SCOPE_NAMES = [
  ...TRANSLATION_SCOPES.map((s) => s.scope),
  'location-systems'
] as const;

export type TranslationScope = typeof TRANSLATION_SCOPE_NAMES[number];

/**
 * Price history retention (README Roadmap: "Historical price charts")
 */
export const PRICE_HISTORY_CONFIG = {
  /** Max stored points per item (roughly 180 days at one point/day) */
  MAX_POINTS: 180
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
 * Rate limiting configuration for OUTBOUND requests to warframe.market
 */
export const RATE_LIMITING = {
  /** Delay after 429 response (minimum, ms) */
  RATE_LIMIT_MIN_DELAY: 2000,

  /** Delay after 429 response (maximum additional, ms) */
  RATE_LIMIT_JITTER: 3000
} as const;

/**
 * Rate limiting configuration for INBOUND requests to this app's own API
 */
export const INBOUND_RATE_LIMIT = {
  /** Window size for the general API limiter (ms) */
  WINDOW_MS: 60_000,

  /** Max requests per IP per window for general read endpoints */
  MAX_REQUESTS: 60,

  /** Window size for the build_relics limiter (ms) */
  BUILD_RELICS_WINDOW_MS: 60 * 60_000,

  /** Max build_relics requests per IP per window (it triggers a real DB sync) */
  BUILD_RELICS_MAX_REQUESTS: 2,

  /** Window size for the authenticated /me* limiter (ms) */
  AUTH_WINDOW_MS: 5 * 60_000,

  /**
   * Max authenticated requests per IP per window. Generous because a normal
   * session does one GET /me plus a debounced sync per edit burst, but low
   * enough that a runaway client can't hammer Mongo with unbounded writes.
   */
  AUTH_MAX_REQUESTS: 240
} as const;

/**
 * Aggregation pipeline limits
 */
export const AGGREGATION = {
  /** Default limit for top results queries */
  DEFAULT_LIMIT: 10
} as const;
