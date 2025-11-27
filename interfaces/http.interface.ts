/**
 * @fileoverview HTTP client interfaces for network operations
 * @module interfaces/http
 * 
 * Defines interfaces for HTTP clients, proxy management, and request handling.
 * Enables dependency injection and testing through abstraction.
 */

/**
 * HTTP request options for customizing requests
 */
export interface IHttpRequestOptions {
  /** Custom request headers */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** HTTP agent for proxy support */
  httpAgent?: unknown;
  /** HTTPS agent for proxy support */
  httpsAgent?: unknown;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * HTTP client interface for making API requests
 * Allows for easy mocking in tests and swapping implementations
 */
export interface IHttpClient {
  /**
   * Perform a GET request
   * @template T - Expected response type
   * @param url - Request URL
   * @param options - Optional request configuration
   * @returns Promise resolving to typed response data
   */
  get<T>(url: string, options?: IHttpRequestOptions): Promise<T>;

  /**
   * Perform a POST request
   * @template T - Expected response type
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Optional request configuration
   * @returns Promise resolving to typed response data
   */
  post<T>(url: string, data: unknown, options?: IHttpRequestOptions): Promise<T>;

  /**
   * Add a random delay between requests for anti-detection
   * @param min - Minimum delay in ms
   * @param max - Maximum delay in ms
   */
  addRandomDelay(min?: number, max?: number): Promise<void>;
}

/**
 * Proxy configuration for HTTP requests
 */
export interface IProxyConfig {
  /** Proxy server host */
  host: string;
  /** Proxy server port */
  port: number;
  /** Proxy protocol */
  protocol: 'http' | 'https' | 'socks5';
  /** Optional authentication credentials */
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * Proxy manager interface for rotating proxies
 * Handles proxy selection, rotation, and health tracking
 */
export interface IProxyManager {
  /**
   * Get the next available proxy from the pool
   * @returns Proxy configuration string or null if none available
   */
  getProxy(): string | null;

  /**
   * Get an HTTP agent configured for the specified proxy
   * @param proxy - Optional specific proxy to use
   * @returns Configured HTTP agent or null
   */
  getProxyAgent(proxy?: string | null): unknown;

  /**
   * Record proxy performance for future selection
   * @param proxy - Proxy identifier
   * @param success - Whether the request was successful
   */
  recordPerformance(proxy: string, success: boolean): void;

  /**
   * Check if a proxy should be avoided due to poor performance
   * @param proxy - Proxy identifier to check
   * @returns Whether the proxy should be avoided
   */
  shouldAvoid(proxy: string): boolean;

  /**
   * Refresh the proxy list from source
   * @returns Promise resolving when refresh is complete
   */
  refresh(): Promise<void>;

  /** Current proxy index */
  idx: number;
}

/**
 * Rate limiter interface for controlling request frequency
 */
export interface IRateLimiter {
  /**
   * Wait for a rate limit slot to become available
   * @returns Promise resolving when slot is available
   */
  acquire(): Promise<void>;

  /**
   * Release a rate limit slot
   */
  release(): void;

  /**
   * Get the current wait time before next available slot
   * @returns Wait time in milliseconds
   */
  getWaitTime(): number;
}

/**
 * Browser-like headers for anti-detection measures
 * Mimics real browser request headers to avoid API blocking
 */
export interface IBrowserHeaders {
  /** User agent string */
  'User-Agent': string;
  /** Accepted content types */
  'Accept': string;
  /** Accepted languages */
  'Accept-Language': string;
  /** Accepted encodings */
  'Accept-Encoding': string;
  /** Do Not Track header */
  'DNT'?: string;
  /** Connection type */
  'Connection': string;
  /** Fetch destination */
  'Sec-Fetch-Dest': string;
  /** Fetch mode */
  'Sec-Fetch-Mode': string;
  /** Fetch site */
  'Sec-Fetch-Site': string;
  /** Client hints - User Agent */
  'sec-ch-ua'?: string;
  /** Client hints - Mobile */
  'sec-ch-ua-mobile'?: string;
  /** Client hints - Platform */
  'sec-ch-ua-platform'?: string;
  /** Referrer URL */
  'Referer'?: string;
  /** Origin URL */
  'Origin'?: string;
  /** Request priority */
  'Priority'?: string;
}

/**
 * HTTP service configuration options
 */
export interface IHttpServiceConfig {
  /** Base URL for all requests */
  baseUrl?: string;
  /** Default request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Minimum delay between requests (ms) */
  minDelay?: number;
  /** Maximum delay between requests (ms) */
  maxDelay?: number;
  /** Whether to use proxy rotation */
  useProxies?: boolean;
}

/**
 * Retry configuration for HTTP requests
 */
export interface IRetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Base delay between retries in milliseconds */
  baseDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
  /** Whether to use exponential backoff */
  exponentialBackoff: boolean;
}
