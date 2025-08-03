import { AxiosRequestConfig } from "axios";
import crypto from "crypto";

export class AntiDetection {
  private static sessionId: string = "";
  private static requestCount: number = 0;
  private static lastRequestTime: number = 0;

  /**
   * Generate a consistent session ID that mimics browser behavior
   */
  static getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = crypto.randomBytes(16).toString("hex");
    }
    return this.sessionId;
  }

  /**
   * Add browser-like headers that help bypass detection
   */
  static getBrowserHeaders(): Record<string, string> {
    const sessionId = this.getSessionId();
    this.requestCount++;

    return {
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "x-requested-with": "XMLHttpRequest",
      origin: "https://warframe.market",
      "x-session-id": sessionId,
    };
  }

  /**
   * Simulate human-like request timing
   */
  static async simulateHumanTiming(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // If requests are too fast, add a delay
    if (timeSinceLastRequest < 500) {
      const delay = 500 + Math.random() * 1000; // 0.5-1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Add TLS fingerprint randomization
   */
  static getTLSOptions(): any {
    const ciphers = ["ECDHE-RSA-AES128-GCM-SHA256", "ECDHE-RSA-AES256-GCM-SHA384", "ECDHE-RSA-AES128-SHA256", "ECDHE-RSA-AES256-SHA384", "AES128-GCM-SHA256", "AES256-GCM-SHA384"];

    return {
      secureProtocol: "TLSv1_2_method",
      ciphers: ciphers.join(":"),
      honorCipherOrder: true,
      secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | crypto.constants.SSL_OP_NO_SSLv3,
    };
  }

  /**
   * Create request configuration with anti-detection measures
   */
  static async createRequestConfig(baseConfig: AxiosRequestConfig = {}): Promise<AxiosRequestConfig> {
    await this.simulateHumanTiming();

    const config: AxiosRequestConfig = {
      ...baseConfig,
      headers: {
        ...baseConfig.headers,
        ...this.getBrowserHeaders(),
      },
      // Add some randomization to timeout
      timeout: 15000 + Math.random() * 10000, // 15-25 seconds
    };

    return config;
  }

  /**
   * Reset session (useful when switching proxies)
   */
  static resetSession(): void {
    this.sessionId = "";
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

/**
 * Additional utility functions for advanced evasion
 */
export class ProxyRotation {
  private static bannedProxies: Set<string> = new Set();
  private static proxyPerformance: Map<string, { success: number; failures: number; lastUsed: number }> = new Map();

  /**
   * Mark a proxy as potentially banned
   */
  static markProxyAsBanned(proxy: string): void {
    this.bannedProxies.add(proxy);
    console.log(`Proxy marked as banned: ${proxy}`);
  }

  /**
   * Record proxy performance
   */
  static recordProxyPerformance(proxy: string, success: boolean): void {
    if (!this.proxyPerformance.has(proxy)) {
      this.proxyPerformance.set(proxy, { success: 0, failures: 0, lastUsed: 0 });
    }

    const stats = this.proxyPerformance.get(proxy)!;
    if (success) {
      stats.success++;
    } else {
      stats.failures++;
    }
    stats.lastUsed = Date.now();
  }

  /**
   * Check if proxy should be avoided
   */
  static shouldAvoidProxy(proxy: string): boolean {
    if (this.bannedProxies.has(proxy)) {
      return true;
    }

    const stats = this.proxyPerformance.get(proxy);
    if (!stats) return false;

    // Avoid proxy if failure rate is too high
    const failureRate = stats.failures / (stats.success + stats.failures);
    return failureRate > 0.7;
  }

  /**
   * Get proxy performance stats
   */
  static getProxyStats(proxy: string) {
    return this.proxyPerformance.get(proxy) || { success: 0, failures: 0, lastUsed: 0 };
  }
}
