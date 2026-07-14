/**
 * @fileoverview HTTP service using undici for high-performance HTTP requests
 * @module services/UndiciHttpService
 *
 * Single Responsibility: Handle all HTTP communication using undici library
 *
 * This service provides a robust HTTP client with:
 * - Native HTTP/2 support via undici
 * - Automatic retry with exponential backoff
 * - Proxy rotation support
 * - Anti-detection headers
 * - Compression handling (gzip, deflate, brotli)
 *
 * @example
 * ```typescript
 * const httpService = new UndiciHttpService();
 * const data = await httpService.get<IWarframeItemsResponse>('https://api.warframe.market/v1/items');
 * ```
 */

import { Agent, Dispatcher, ProxyAgent, request } from 'undici';
import { createBrotliDecompress, createGunzip, createInflate } from 'zlib';
import { AntiDetection, ProxyRotation } from '../anti-detection';
import { sleep } from '../Express/config';
import { IHttpClient, IHttpRequestOptions } from '../interfaces/http.interface';
import { HeaderService } from './HeaderService';
import { ProxyManagerAdapter } from './ProxyManagerAdapter';
import { createSocksConnector } from './SocksConnector';

// Debug mode - set DEBUG=true or DEBUG=warframe:* for verbose logging
import { DEBUG } from '../debug';

/**
 * Configuration options for UndiciHttpService
 */
export interface IUndiciHttpServiceConfig {
  /** Maximum retry attempts (default: 10) */
  maxRetries?: number;
  /** Minimum delay between requests in ms (default: 500) */
  minDelay?: number;
  /** Maximum delay between requests in ms (default: 2000) */
  maxDelay?: number;
  /** Whether to use proxies (default: true unless PROXY_LESS=true) */
  useProxies?: boolean;
  /** Keep-alive timeout in ms (default: 10000) */
  keepAliveTimeout?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<IUndiciHttpServiceConfig> = {
  maxRetries: 10,
  minDelay: 500,
  maxDelay: 2000,
  useProxies: true,
  keepAliveTimeout: 10000
};

/** How many requests between periodic proxy-stats log lines (D11, DEBUG-gated) */
const STATS_LOG_INTERVAL = 50;

/**
 * HTTP Service using undici for high-performance requests
 *
 * @implements {IHttpClient}
 */
export class UndiciHttpService implements IHttpClient {
  /** Service configuration */
  private readonly config: Required<IUndiciHttpServiceConfig>;

  /** Header generation service */
  private readonly headerService: HeaderService;

  /** Proxy manager for rotation */
  private readonly proxyManager: ProxyManagerAdapter;

  /** Requests handled so far, for periodic stats logging (D11) */
  private requestCount = 0;

  /**
   * Creates a new UndiciHttpService instance
   *
   * @param config - Service configuration options
   * @param proxyManager - Optional custom proxy manager
   */
  constructor(
    config: IUndiciHttpServiceConfig = {},
    proxyManager?: ProxyManagerAdapter
  ) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      useProxies: config.useProxies ?? (process.env.PROXY_LESS !== 'true')
    };
    this.headerService = new HeaderService();
    this.proxyManager = proxyManager ?? new ProxyManagerAdapter(this.config.useProxies);

    if (DEBUG) {
      console.log(`✓ UndiciHttpService initialized - Proxies: ${this.config.useProxies ? 'enabled' : 'disabled'}`);
    }
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
   * Picks the next proxy, skipping ones with a poor recent success rate
   * (ProxyRotation.shouldAvoidProxy) for up to 5 attempts before giving up
   * and using whatever came back last - mirrors HttpService's axios-path
   * avoidance loop, previously only wired on that path.
   *
   * @private
   */
  private getUsableProxy(): string | null {
    let proxy = this.proxyManager.getProxy();
    let attempts = 0;
    while (proxy && this.proxyManager.shouldAvoid(proxy) && attempts < 5) {
      proxy = this.proxyManager.getProxy();
      attempts++;
    }
    return proxy;
  }

  /**
   * Records a failed request against a proxy and bans it once its failure
   * rate crosses the ProxyRotation threshold, persisting to banned.txt via
   * the legacy Proxies class. Previously ProxyRotation tracked performance
   * but nothing ever called banProxy, so banned.txt never self-populated.
   *
   * @private
   */
  private recordProxyFailure(proxy: string): void {
    ProxyRotation.recordProxyPerformance(proxy, false);
    if (ProxyRotation.shouldAvoidProxy(proxy)) {
      this.proxyManager.banProxy(proxy);
      if (DEBUG) console.log(`🚫 Proxy banned after repeated failures: ${proxy}`);
    }
  }

  /**
   * Logs a compact proxy-performance snapshot every STATS_LOG_INTERVAL
   * requests (D11 monitoring - previously only retry status codes were
   * logged; rotations, bans and aggregate stats were invisible).
   *
   * @private
   */
  private maybeLogStats(proxy: string | null): void {
    this.requestCount++;
    if (!DEBUG || !proxy || this.requestCount % STATS_LOG_INTERVAL !== 0) return;
    const stats = ProxyRotation.getProxyStats(proxy);
    console.log(`📊 Proxy stats @request ${this.requestCount} [${proxy}]: ${stats.success} ok / ${stats.failures} failed`);
  }

  /**
   * Creates a dispatcher for the request: a SOCKS5-aware Agent when the
   * proxy is socks5://, a ProxyAgent for http(s):// proxies, or a plain
   * Agent for the direct/proxyless path. Every branch applies rotated TLS
   * options (D9) - previously getTLSOptions() was defined but never called
   * from any dispatcher, so no request actually varied its TLS fingerprint.
   *
   * @param proxy - Proxy URL string, or null for a direct connection
   * @returns undici Dispatcher
   * @private
   */
  private createDispatcher(proxy: string | null): Dispatcher {
    const tlsOptions = AntiDetection.getTLSOptions();

    if (proxy && this.config.useProxies) {
      if (proxy.startsWith('socks5://') || proxy.startsWith('socks4://')) {
        return new Agent({
          connect: createSocksConnector(proxy, tlsOptions),
          keepAliveTimeout: this.config.keepAliveTimeout,
          keepAliveMaxTimeout: this.config.keepAliveTimeout
        });
      }
      return new ProxyAgent({
        uri: proxy,
        keepAliveTimeout: this.config.keepAliveTimeout,
        keepAliveMaxTimeout: this.config.keepAliveTimeout,
        // requestTls is the connector undici's ProxyAgent uses for the final
        // TLS handshake to the origin through the tunnel (see undici's
        // proxy-agent.js kConnectEndpoint) - the generic `connect` option is
        // not read by ProxyAgent at all, so this must be requestTls.
        requestTls: tlsOptions as any
      });
    }

    return new Agent({
      connect: tlsOptions,
      keepAliveTimeout: this.config.keepAliveTimeout,
      keepAliveMaxTimeout: this.config.keepAliveTimeout
    });
  }

  /**
   * Generates request headers combining browser simulation and anti-detection
   *
   * @param customHeaders - Optional custom headers to merge
   * @returns Complete headers object
   * @private
   */
  private getRequestHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const browserHeaders = this.headerService.generateHeaders();
    const antiDetectionHeaders = AntiDetection.getBrowserHeaders();

    return {
      ...browserHeaders,
      ...antiDetectionHeaders,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      ...customHeaders
    };
  }

  /**
   * Decompresses response body based on content encoding
   *
   * @param body - Response body stream
   * @param contentEncoding - Content-Encoding header value
   * @returns Decompressed string
   * @private
   */
  private async decompressResponse(
    body: AsyncIterable<Uint8Array>,
    contentEncoding: string | undefined
  ): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body) {
      chunks.push(chunk as Uint8Array);
    }
    const buffer = Buffer.concat(chunks);

    if (contentEncoding === 'gzip') {
      return this.decompressGzip(buffer);
    } else if (contentEncoding === 'deflate') {
      return this.decompressDeflate(buffer);
    } else if (contentEncoding === 'br') {
      return this.decompressBrotli(buffer);
    }

    return buffer.toString('utf8');
  }

  /**
   * Decompresses gzip content
   * @private
   */
  private async decompressGzip(buffer: Buffer): Promise<string> {
    const gunzip = createGunzip();
    gunzip.write(buffer);
    gunzip.end();

    const decompressed: Uint8Array[] = [];
    for await (const chunk of gunzip) {
      decompressed.push(chunk as Uint8Array);
    }
    return Buffer.concat(decompressed).toString('utf8');
  }

  /**
   * Decompresses deflate content
   * @private
   */
  private async decompressDeflate(buffer: Buffer): Promise<string> {
    const inflate = createInflate();
    inflate.write(buffer);
    inflate.end();

    const decompressed: Uint8Array[] = [];
    for await (const chunk of inflate) {
      decompressed.push(chunk as Uint8Array);
    }
    return Buffer.concat(decompressed).toString('utf8');
  }

  /**
   * Decompresses brotli content
   * @private
   */
  private async decompressBrotli(buffer: Buffer): Promise<string> {
    const brotli = createBrotliDecompress();
    brotli.write(buffer);
    brotli.end();

    const decompressed: Uint8Array[] = [];
    for await (const chunk of brotli) {
      decompressed.push(chunk as Uint8Array);
    }
    return Buffer.concat(decompressed).toString('utf8');
  }

  /**
   * Calculates retry delay with jittered exponential backoff (D8 - previously
   * this was pure exponential with no randomization, making retry timing
   * predictable). Uses "half jitter": uniformly random within the top half
   * of the exponential window, so waits stay meaningful while avoiding both
   * a predictable fixed delay and a near-zero degenerate case.
   *
   * @param attempt - Current attempt number
   * @param statusCode - HTTP status code
   * @returns Delay in milliseconds
   * @private
   */
  private getRetryDelay(attempt: number, statusCode: number): number {
    const baseDelay = statusCode === 429 ? 2000 : 1000;
    const maxDelay = statusCode === 429 ? 30000 : 10000;
    const capped = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    return capped / 2 + Math.random() * (capped / 2);
  }

  /**
   * Performs a GET request with retry logic
   *
   * @template T - Expected response type
   * @param url - Request URL
   * @param options - Request options
   * @returns Promise resolving to response data
   */
  async get<T>(url: string, options: IHttpRequestOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    // Paced once per logical request (not per retry - retries use their own
    // error-driven backoff below). Previously only MarketService/RivenService
    // added this at the orchestration layer for orders/stats/weapon pacing,
    // so any other call site (e.g. getAllItems) got no delay at all.
    await this.addRandomDelay();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let proxy: string | null = null;
      try {
        proxy = this.getUsableProxy();
        const dispatcher = this.createDispatcher(proxy);
        const headers = this.getRequestHeaders(options.headers);
        this.maybeLogStats(proxy);

        if (DEBUG) {
          const proxyInfo = proxy
            ? proxy.includes('@') ? proxy.split('@')[1] : proxy
            : 'direct (proxyless)';
          console.log(`Attempt ${attempt} using: ${proxyInfo}`);
        }

        const response = await request(url, {
          dispatcher,
          headers
        });

        if (DEBUG) {
          console.log(`Response status: ${response.statusCode}`);
        }

        // Handle retryable status codes
        if (response.statusCode === 403 || response.statusCode === 429 || response.statusCode >= 500) {
          const statusName = response.statusCode === 403 ? 'Cloudflare block'
            : response.statusCode === 429 ? 'Rate limit'
            : 'Server error';

          console.log(`⚠️  ${response.statusCode} ${statusName} (attempt ${attempt}/${maxRetries})`);

          if (proxy) {
            this.recordProxyFailure(proxy);
          }
          // Reset session on block/rotation (D10) - previously only wired on
          // the axios path, so undici (the client every sync script uses)
          // kept reusing the same session id/counter after a block.
          AntiDetection.resetSession();

          if (attempt < maxRetries) {
            const delay = this.getRetryDelay(attempt, response.statusCode);
            if (DEBUG) {
              console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
            }
            await sleep(delay);
            continue;
          }
          throw new Error(`All ${maxRetries} attempts failed with ${response.statusCode} errors`);
        }

        if (response.statusCode >= 400) {
          throw new Error(`HTTP ${response.statusCode}`);
        }

        // Decompress and parse response
        const contentEncoding = response.headers['content-encoding'] as string | undefined;
        const responseText = await this.decompressResponse(
          response.body as AsyncIterable<Uint8Array>,
          contentEncoding
        );

        let data: T;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log('Response text (first 200 chars):', responseText.substring(0, 200));
          throw new Error(`Failed to parse JSON: ${(parseError as Error).message}`);
        }

        // Mark proxy as successful
        if (proxy) {
          ProxyRotation.recordProxyPerformance(proxy, true);
        }

        if (DEBUG) {
          console.log(`✅ Success! Got data with keys: [${Object.keys(data as object).map(k => `'${k}'`).join(', ')}]`);
        }
        return data;

      } catch (error) {
        lastError = error as Error;
        if (DEBUG) {
          console.log(`❌ Attempt ${attempt} failed:`, (error as Error).message);
        }

        if (attempt < maxRetries) {
          const base = Math.min(1000 * attempt, 5000);
          const delay = base / 2 + Math.random() * (base / 2);
          if (DEBUG) {
            console.log(`⏳ Waiting ${Math.round(delay)}ms before next attempt...`);
          }
          await sleep(delay);
        }
      }
    }

    throw lastError || new Error(`All ${maxRetries} attempts failed`);
  }

  /**
   * Performs a POST request with retry logic
   *
   * @template T - Expected response type
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options
   * @returns Promise resolving to response data
   */
  async post<T>(url: string, data: unknown, options: IHttpRequestOptions = {}): Promise<T> {
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    let lastError: Error | null = null;

    await this.addRandomDelay();

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let proxy: string | null = null;
      try {
        proxy = this.getUsableProxy();
        const dispatcher = this.createDispatcher(proxy);
        const headers = this.getRequestHeaders({
          'Content-Type': 'application/json',
          ...options.headers
        });
        this.maybeLogStats(proxy);

        const response = await request(url, {
          method: 'POST',
          dispatcher,
          headers,
          body: JSON.stringify(data)
        });

        if (response.statusCode === 403 || response.statusCode === 429 || response.statusCode >= 500) {
          if (proxy) this.recordProxyFailure(proxy);
          AntiDetection.resetSession();
          if (attempt < maxRetries) {
            await sleep(this.getRetryDelay(attempt, response.statusCode));
            continue;
          }
          throw new Error(`All ${maxRetries} attempts failed with ${response.statusCode} errors`);
        }

        if (response.statusCode >= 400) {
          throw new Error(`HTTP ${response.statusCode}`);
        }

        if (proxy) {
          ProxyRotation.recordProxyPerformance(proxy, true);
        }

        const contentEncoding = response.headers['content-encoding'] as string | undefined;
        const responseText = await this.decompressResponse(
          response.body as AsyncIterable<Uint8Array>,
          contentEncoding
        );

        return JSON.parse(responseText);

      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const base = Math.min(1000 * attempt, 5000);
          await sleep(base / 2 + Math.random() * (base / 2));
        }
      }
    }

    throw lastError || new Error(`All ${maxRetries} attempts failed`);
  }

  /**
   * Gets the proxy manager instance
   *
   * @returns ProxyManagerAdapter instance
   */
  getProxyManager(): ProxyManagerAdapter {
    return this.proxyManager;
  }

  /**
   * Gets the header service instance
   *
   * @returns HeaderService instance
   */
  getHeaderService(): HeaderService {
    return this.headerService;
  }
}
