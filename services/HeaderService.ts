/**
 * @fileoverview Service for generating browser-like HTTP headers
 * @module services/HeaderService
 * 
 * Single Responsibility: Generate realistic browser headers for anti-detection
 * 
 * This service creates randomized but realistic HTTP headers that mimic
 * actual browser requests to avoid being blocked by the Warframe Market API.
 */

import UserAgent from 'user-agents';
import { IBrowserHeaders } from '../interfaces/http.interface';

/** Default user agents for browser simulation */
const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0'
];

/**
 * Configuration for header generation
 */
export interface IHeaderServiceConfig {
  /** Target origin for requests */
  origin?: string;
  /** Whether to include DNT header randomly */
  randomizeDnt?: boolean;
}

/**
 * Service for generating anti-detection HTTP headers
 * 
 * @example
 * ```typescript
 * const headerService = new HeaderService();
 * const headers = headerService.generateHeaders();
 * ```
 */
export class HeaderService {
  /** User agent generator instance */
  private readonly userAgent: UserAgent;

  /** Custom user agents list */
  private userAgents: string[];

  /** Configuration options */
  private readonly config: Required<IHeaderServiceConfig>;

  /** Common referrer URLs to simulate organic traffic */
  private static readonly COMMON_REFERERS: readonly string[] = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://duckduckgo.com/',
    'https://warframe.market/',
    'https://warframe.market/items',
    ''
  ];

  /** Supported browser language configurations */
  private static readonly ACCEPT_LANGUAGES: readonly string[] = [
    'en-US,en;q=0.9',
    'en-GB,en;q=0.9',
    'en-US,en;q=0.8,es;q=0.6',
    'en-US,en;q=0.9,fr;q=0.8',
    'en-US,en;q=0.9,de;q=0.8'
  ];

  /** Chrome version strings for sec-ch-ua header */
  private static readonly CHROME_VERSIONS: readonly string[] = [
    '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    '"Google Chrome";v="130", "Chromium";v="130", "Not_A Brand";v="24"',
    '"Google Chrome";v="129", "Chromium";v="129", "Not_A Brand";v="24"'
  ];

  /**
   * Creates a new HeaderService instance
   * 
   * @param userAgents - Optional custom user agents array
   * @param config - Optional configuration options
   */
  constructor(userAgents?: string[], config: IHeaderServiceConfig = {}) {
    this.userAgent = new UserAgent({ deviceCategory: 'desktop' });
    this.userAgents = userAgents ?? [...DEFAULT_USER_AGENTS];
    this.config = {
      origin: config.origin ?? 'https://warframe.market',
      randomizeDnt: config.randomizeDnt ?? true
    };
  }

  /**
   * Selects a random element from an array
   * 
   * @template T - Array element type
   * @param array - Array to select from
   * @returns Random element from the array
   * @private
   */
  private selectRandom<T>(array: readonly T[] | T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generates a random referer URL
   * 
   * @returns Random referer URL or undefined
   * @private
   */
  private generateReferer(): string | undefined {
    const referer = this.selectRandom(HeaderService.COMMON_REFERERS);
    return referer || undefined;
  }

  /**
   * Generates complete browser-like headers
   * 
   * @returns Object containing all browser headers (lowercase keys for axios)
   */
  generateHeaders(): Record<string, string> {
    const referer = this.generateReferer();

    const headers: Record<string, string> = {
      'user-agent': this.getRandomUserAgent(),
      'accept': 'application/json, text/plain, */*',
      'accept-language': this.selectRandom(HeaderService.ACCEPT_LANGUAGES),
      'accept-encoding': 'gzip, deflate, br, zstd',
      'connection': 'keep-alive',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'sec-ch-ua': this.selectRandom(HeaderService.CHROME_VERSIONS),
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'priority': 'u=1, i',
      'origin': this.config.origin,
      'cache-control': 'no-cache'
    };

    // Randomly include DNT header
    if (this.config.randomizeDnt && Math.random() > 0.5) {
      headers['dnt'] = '1';
    }

    // Add referer if available
    if (referer) {
      headers['referer'] = referer;
    }

    return headers;
  }

  /**
   * Gets a random user agent string
   * 
   * @returns Random user agent string
   */
  getRandomUserAgent(): string {
    if (this.userAgents.length > 0) {
      return this.selectRandom(this.userAgents);
    }
    return this.userAgent.random().toString();
  }

  /**
   * Adds additional user agents to the list
   * 
   * @param agents - Array of user agent strings to add
   */
  addUserAgents(agents: string[]): void {
    this.userAgents.push(...agents);
  }

  /**
   * Replaces all user agents with a new list
   * 
   * @param agents - Array of user agent strings
   */
  setUserAgents(agents: string[]): void {
    this.userAgents = [...agents];
  }

  /**
   * Gets the count of available user agents
   * 
   * @returns Number of user agents
   */
  getUserAgentCount(): number {
    return this.userAgents.length;
  }

  /**
   * Generates headers as IBrowserHeaders for type-safe usage
   * 
   * @returns Headers as IBrowserHeaders
   */
  generateBrowserHeaders(): IBrowserHeaders {
    const referer = this.generateReferer();

    const headers: IBrowserHeaders = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': this.selectRandom(HeaderService.ACCEPT_LANGUAGES),
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'sec-ch-ua': this.selectRandom(HeaderService.CHROME_VERSIONS),
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Priority': 'u=1, i',
      'Origin': this.config.origin
    };

    // Randomly include DNT header
    if (this.config.randomizeDnt && Math.random() > 0.5) {
      headers['DNT'] = '1';
    }

    // Add referer if available
    if (referer) {
      headers['Referer'] = referer;
    }

    return headers;
  }

  /**
   * Generates headers as a plain object for axios compatibility
   * 
   * @returns Headers as Record<string, string>
   */
  generateHeadersRecord(): Record<string, string> {
    return this.generateHeaders();
  }

  /**
   * Refreshes the user agent to a new random value
   * Useful for long-running sessions
   */
  refreshUserAgent(): void {
    // UserAgent library generates new random UA on each .random() call
    // This method exists for explicit refresh indication
  }

  /**
   * Gets the current configured origin
   * 
   * @returns The origin URL
   */
  getOrigin(): string {
    return this.config.origin;
  }
}
