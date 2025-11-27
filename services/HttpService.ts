/**
 * @fileoverview HTTP service with retry logic and anti-detection measures
 * @module services/HttpService
 * 
 * Single Responsibility: Handle all HTTP communication with external APIs
 * 
 * This service provides a robust HTTP client with:
 * - Automatic retry with exponential backoff
 * - Proxy rotation support
 * - Anti-detection headers
 * - Rate limiting respect
 */

import axios, { AxiosInstance, AxiosError, CreateAxiosDefaults } from 'axios';
import axiosRetry from 'axios-retry';
import { IHttpClient, IHttpRequestOptions, IHttpServiceConfig, IProxyManager } from '../interfaces/http.interface';
import { HeaderService } from './HeaderService';
import { sleep } from '../Express/config';
import { AntiDetection, ProxyRotation } from '../anti-detection';

// Debug mode - set DEBUG=true environment variable for verbose logging
const DEBUG = process.env.DEBUG === 'true';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<IHttpServiceConfig> = {
  baseUrl: '',
  timeout: 30000,
  maxRetries: 100,
  minDelay: 500,
  maxDelay: 2000,
  useProxies: true
};

/**
 * HTTP status codes that should trigger a retry
 */
const RETRYABLE_STATUS_CODES = [403, 429, 500, 502, 503, 504];

/**
 * HTTP Service implementing retry logic and anti-detection measures
 * 
 * @implements {IHttpClient}
 * 
 * @example
 * ```typescript
 * const httpService = new HttpService(proxyManager, {
 *   baseUrl: 'https://api.warframe.market/v1',
 *   maxRetries: 5
 * });
 * 
 * const items = await httpService.get<IWarframeItemsResponse>('/items');
 * ```
 */
export class HttpService implements IHttpClient {
  /** Axios instance for HTTP requests */
  private readonly axiosInstance: AxiosInstance;

  /** Header generation service */
  private readonly headerService: HeaderService;

  /** Service configuration */
  private readonly config: Required<IHttpServiceConfig>;

  /** Proxy manager for rotation */
  private readonly proxyManager: IProxyManager | null;

  /**
   * Creates a new HttpService instance
   * 
   * @param proxyManager - Optional proxy manager for rotating proxies
   * @param config - Service configuration options
   */
  constructor(
    proxyManager: IProxyManager | null = null,
    config: IHttpServiceConfig = {}
  ) {
    this.proxyManager = proxyManager;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.headerService = new HeaderService();

    // Create axios instance
    this.axiosInstance = this.createAxiosInstance();

    // Configure retry behavior
    this.configureRetry();
  }

  /**
   * Creates and configures the axios instance
   * 
   * @returns Configured axios instance
   * @private
   */
  private createAxiosInstance(): AxiosInstance {
    const axiosConfig: CreateAxiosDefaults = {
      timeout: this.config.timeout,
      headers: this.headerService.generateHeadersRecord(),
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 300,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      decompress: true
    };

    // Configure proxy if available
    if (this.proxyManager && this.config.useProxies) {
      const proxy = this.proxyManager.getProxy();
      const agent = this.proxyManager.getProxyAgent(proxy);

      if (agent) {
        axiosConfig.httpAgent = agent;
        axiosConfig.httpsAgent = agent;
        axiosConfig.proxy = false; // Disable axios proxy handling
        axiosConfig.timeout = 10000; // Shorter timeout for proxied requests
      }

      if (DEBUG) console.log('HttpService initialized with proxy:', proxy);
    }

    return axios.create(axiosConfig);
  }

  /**
   * Configures axios-retry behavior
   * 
   * @private
   */
  private configureRetry(): void {
    axiosRetry(this.axiosInstance, {
      retries: this.config.maxRetries,
      shouldResetTimeout: true,

      retryDelay: (retryCount) => {
        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, retryCount) * 1000;
        const jitter = Math.random() * 1000;
        return baseDelay + jitter;
      },

      retryCondition: (error) => {
        // Retry on network errors and specific status codes
        const status = error.response?.status;
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          (status !== undefined && RETRYABLE_STATUS_CODES.includes(status))
        );
      },

      onRetry: (retryCount, error, requestConfig) => {
        this.handleRetry(retryCount, error, requestConfig);
      }
    });
  }

  /**
   * Handles retry logic including proxy rotation and header refresh
   * 
   * @param retryCount - Current retry attempt number
   * @param error - The error that triggered the retry
   * @param requestConfig - The request configuration
   * @private
   */
  private handleRetry(
    retryCount: number,
    error: AxiosError,
    requestConfig: any
  ): void {
    const status = error.response?.status;
    if (DEBUG) console.log(`⟳ Retry attempt ${retryCount} for status ${status || 'network error'}`);

    // Rotate proxy on specific errors
    if (status === 403 || status === 429 || status === 503) {
      this.rotateProxyOnError(requestConfig, status);
    }
  }

  /**
   * Rotates to a new proxy after an error
   * 
   * @param requestConfig - The request configuration to update
   * @param status - The HTTP status that triggered rotation
   * @private
   */
  private rotateProxyOnError(requestConfig: any, status: number): void {
    if (!this.proxyManager) return;

    // Record failure for current proxy
    if (status === 403) {
      const currentProxy = requestConfig.httpAgent?.proxy?.toString();
      if (currentProxy) {
        ProxyRotation.recordProxyPerformance(currentProxy, false);
      }
    }

    // Get new proxy, avoiding problematic ones
    let newProxy = this.proxyManager.getProxy();
    let attempts = 0;
    while (ProxyRotation.shouldAvoidProxy(newProxy) && attempts < 5) {
      newProxy = this.proxyManager.getProxy();
      attempts++;
    }

    if (DEBUG) console.log('↻ Rotating proxy to:', newProxy);

    // Update request config with new proxy
    const proxyAgent = this.proxyManager.getProxyAgent(newProxy);
    requestConfig.httpAgent = proxyAgent;
    requestConfig.httpsAgent = proxyAgent;

    // Reset session and refresh headers
    AntiDetection.resetSession();
    requestConfig.headers = {
      ...requestConfig.headers,
      ...this.headerService.generateHeadersRecord(),
      ...AntiDetection.getBrowserHeaders()
    };
  }

  /**
   * Adds a random delay between requests to appear more human-like
   * 
   * @param min - Minimum delay in milliseconds
   * @param max - Maximum delay in milliseconds
   */
  async addRandomDelay(
    min: number = this.config.minDelay,
    max: number = this.config.maxDelay
  ): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await sleep(delay);
  }

  /**
   * Performs a GET request with retry logic
   * 
   * @template T - Expected response type
   * @param url - Request URL (relative to baseUrl if configured)
   * @param options - Request options
   * @returns Promise resolving to response data
   */
  async get<T>(url: string, options: IHttpRequestOptions = {}): Promise<T> {
    await this.addRandomDelay();

    const fullUrl = this.config.baseUrl ? `${this.config.baseUrl}${url}` : url;

    const requestConfig: any = {
      headers: {
        ...this.headerService.generateHeadersRecord(),
        ...options.headers
      },
      timeout: options.timeout ?? this.config.timeout
    };

    // Add proxy agent if provided in options
    if (options.httpAgent) {
      requestConfig.httpAgent = options.httpAgent;
      requestConfig.httpsAgent = options.httpsAgent ?? options.httpAgent;
    }

    const response = await this.axiosInstance.get<T>(fullUrl, requestConfig);
    return response.data;
  }

  /**
   * Performs a POST request with retry logic
   * 
   * @template T - Expected response type
   * @param url - Request URL (relative to baseUrl if configured)
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise resolving to response data
   */
  async post<T>(url: string, data: unknown, options: IHttpRequestOptions = {}): Promise<T> {
    await this.addRandomDelay();

    const fullUrl = this.config.baseUrl ? `${this.config.baseUrl}${url}` : url;

    const response = await this.axiosInstance.post<T>(fullUrl, data, {
      headers: {
        ...this.headerService.generateHeadersRecord(),
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout ?? this.config.timeout
    });

    return response.data;
  }

  /**
   * Gets the underlying axios instance for advanced use cases
   * 
   * @returns The axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }

  /**
   * Gets fresh headers for manual request configuration
   * 
   * @returns Current browser-like headers
   */
  getHeaders(): Record<string, string> {
    return this.headerService.generateHeadersRecord();
  }
}
