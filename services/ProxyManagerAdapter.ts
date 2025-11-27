/**
 * @fileoverview Adapter for the legacy Proxies class implementing IProxyManager
 * @module services/ProxyManagerAdapter
 * 
 * Single Responsibility: Adapt the legacy Proxies class to the IProxyManager interface.
 * This enables dependency injection and makes the proxy system testable.
 */

import { IProxyManager } from '../interfaces/http.interface';
import proxies from '../Express/Proxies';
import { ProxyRotation } from '../anti-detection';

// Debug mode - set DEBUG=true environment variable for verbose logging
const DEBUG = process.env.DEBUG === 'true';

/**
 * Adapter that wraps the legacy Proxies class
 * Implements IProxyManager interface for proper dependency injection
 * 
 * @implements {IProxyManager}
 * 
 * @example
 * ```typescript
 * const proxyManager = new ProxyManagerAdapter();
 * const proxy = proxyManager.getProxy();
 * const agent = proxyManager.getProxyAgent(proxy);
 * ```
 */
export class ProxyManagerAdapter implements IProxyManager {
  /** Whether proxies are enabled */
  private readonly enabled: boolean;

  /**
   * Creates a new ProxyManagerAdapter instance
   * 
   * @param useProxies - Whether to enable proxy usage (defaults to env variable)
   */
  constructor(useProxies?: boolean) {
    this.enabled = useProxies ?? (process.env.PROXY_LESS !== 'true');
    
    if (DEBUG) {
      if (this.enabled) {
        console.log('✓ ProxyManagerAdapter initialized with proxies enabled');
      } else {
        console.log('✓ ProxyManagerAdapter initialized - proxies disabled (PROXY_LESS=true)');
      }
    }
  }

  /**
   * Gets the next available proxy from the pool
   * 
   * @returns Proxy configuration string or null if disabled
   */
  getProxy(): string | null {
    if (!this.enabled) {
      return null;
    }
    return proxies.getProxy();
  }

  /**
   * Gets an HTTP agent configured for the specified proxy
   * 
   * @param proxy - Optional specific proxy to use
   * @returns Configured HTTP agent or null if disabled
   */
  getProxyAgent(proxy?: string | null): unknown {
    if (!this.enabled) {
      return null;
    }
    
    const proxyToUse = proxy ?? this.getProxy();
    if (!proxyToUse) {
      return null;
    }
    
    return proxies.getProxyAgent(proxyToUse);
  }

  /**
   * Records proxy performance for future selection
   * 
   * @param proxy - Proxy identifier
   * @param success - Whether the request was successful
   */
  recordPerformance(proxy: string, success: boolean): void {
    if (!this.enabled) return;
    ProxyRotation.recordProxyPerformance(proxy, success);
  }

  /**
   * Checks if a proxy should be avoided due to poor performance
   * 
   * @param proxy - Proxy identifier to check
   * @returns Whether the proxy should be avoided
   */
  shouldAvoid(proxy: string | null): boolean {
    if (!this.enabled || !proxy) return false;
    return ProxyRotation.shouldAvoidProxy(proxy);
  }

  /**
   * Refreshes the proxy list from source
   * Note: The legacy implementation loads proxies on startup
   * 
   * @returns Promise resolving when refresh is complete
   */
  async refresh(): Promise<void> {
    // The legacy Proxies class loads proxies in constructor
    // This is a placeholder for future implementation
    if (DEBUG) console.log('⟳ Proxy list refresh requested');
  }

  /**
   * Gets the current proxy index (for IProxyManager interface)
   */
  get idx(): number {
    return proxies.idx;
  }

  /**
   * Bans a proxy that is known to be bad
   * 
   * @param proxy - Proxy to ban
   */
  banProxy(proxy: string): void {
    if (!this.enabled) return;
    proxies.banProxy(proxy);
  }

  /**
   * Gets the current proxy index
   * 
   * @returns Current index in the proxy list
   */
  getCurrentIndex(): number {
    return proxies.idx;
  }

  /**
   * Checks if proxies are enabled
   * 
   * @returns Whether proxy usage is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
