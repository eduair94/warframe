import { ProxyAgent, request } from "undici";
import { createBrotliDecompress, createGunzip, createInflate } from "zlib";
import { AntiDetection, ProxyRotation } from "./anti-detection";
import proxies from "./Express/Proxies";

export default class WarframeUndici {
  private maxRetries: number = 10;
  private apiBase: string = "https://api.warframe.market/v1";

  constructor() {
    // No need to instantiate static classes
  }

  private getRandomProxy(): string {
    const proxy = proxies.getProxy();
    console.log("proxy", proxy);
    // For now, use the working HTTP proxy that we tested
    // Later you can implement rotation between multiple HTTP proxies
    return proxy;
  }

  private async makeRequest(url: string, options: any = {}): Promise<any> {
    const maxRetries = options.maxRetries || this.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get proxy and headers
        const proxy = this.getRandomProxy();
        const headers = AntiDetection.getBrowserHeaders();

        console.log(`Attempt ${attempt} using proxy: ${proxy.split("@")[1] || proxy}`);

        // Create proxy agent
        const dispatcher = new ProxyAgent({
          uri: proxy,
          keepAliveTimeout: 10000,
          keepAliveMaxTimeout: 10000,
        });

        // Make request with undici
        const response = await request(url, {
          dispatcher,
          headers: {
            ...headers,
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            DNT: "1",
            Pragma: "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "cross-site",
            "Sec-GPC": "1",
          },
        });

        console.log(`Response status: ${response.statusCode}`);

        // Check if we should retry based on status code
        if (response.statusCode === 403) {
          console.log(`❌ Got 403 Cloudflare block on attempt ${attempt}`);
          ProxyRotation.recordProxyPerformance(proxy, false);

          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`All ${maxRetries} attempts failed with 403 Cloudflare errors`);
        }

        if (response.statusCode === 429) {
          console.log(`❌ Got 429 Rate Limit on attempt ${attempt}`);
          ProxyRotation.recordProxyPerformance(proxy, false);

          if (attempt < maxRetries) {
            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 30000);
            console.log(`⏳ Waiting ${delay}ms for rate limit...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`All ${maxRetries} attempts failed with 429 Rate Limit`);
        }

        if (response.statusCode >= 500) {
          console.log(`❌ Got ${response.statusCode} Server Error on attempt ${attempt}`);

          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`All ${maxRetries} attempts failed with server errors`);
        }

        if (response.statusCode >= 400) {
          throw new Error(`HTTP ${response.statusCode}`);
        }

        // Handle response decompression
        const contentType = response.headers["content-type"];
        const contentEncoding = response.headers["content-encoding"];

        console.log(`Content-Type: ${contentType}`);
        console.log(`Content-Encoding: ${contentEncoding}`);

        let responseText: string;

        // Handle different compression types
        if (contentEncoding === "gzip") {
          console.log("Decompressing gzip...");
          const chunks: Buffer[] = [];
          for await (const chunk of response.body) {
            chunks.push(chunk as Buffer);
          }
          // @ts-ignore
          const compressed = Buffer.concat(chunks);
          const gunzip = createGunzip();
          gunzip.write(compressed);
          gunzip.end();

          const decompressed: Buffer[] = [];
          for await (const chunk of gunzip) {
            decompressed.push(chunk as Buffer);
          }
          // @ts-ignore
          responseText = Buffer.concat(decompressed).toString("utf8");
        } else if (contentEncoding === "deflate") {
          console.log("Decompressing deflate...");
          const chunks: Buffer[] = [];
          for await (const chunk of response.body) {
            chunks.push(chunk as Buffer);
          }
          // @ts-ignore
          const compressed = Buffer.concat(chunks);
          const inflate = createInflate();
          inflate.write(compressed);
          inflate.end();

          const decompressed: Buffer[] = [];
          for await (const chunk of inflate) {
            decompressed.push(chunk as Buffer);
          }
          // @ts-ignore
          responseText = Buffer.concat(decompressed).toString("utf8");
        } else if (contentEncoding === "br") {
          console.log("Decompressing brotli...");
          const chunks: Buffer[] = [];
          for await (const chunk of response.body) {
            chunks.push(chunk as Buffer);
          }
          // @ts-ignore
          const compressed = Buffer.concat(chunks);
          const brotli = createBrotliDecompress();
          brotli.write(compressed);
          brotli.end();

          const decompressed: Buffer[] = [];
          for await (const chunk of brotli) {
            decompressed.push(chunk as Buffer);
          }
          // @ts-ignore
          responseText = Buffer.concat(decompressed).toString("utf8");
        } else {
          // No compression or unknown compression
          console.log("No compression detected, reading as text...");
          responseText = await response.body.text();
        }

        // Parse response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.log("Decompressed text (first 200 chars):", responseText.substring(0, 200));
          throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }

        // Mark proxy as successful
        ProxyRotation.recordProxyPerformance(proxy, true);

        console.log(
          `✅ Success! Got data with keys: [`,
          Object.keys(data)
            .map((k) => `'${k}'`)
            .join(", "),
          "]"
        );
        return data;
      } catch (error) {
        lastError = error as Error;
        console.log(`❌ Attempt ${attempt} failed:`, error.message);

        // If it's a network/proxy error, try next proxy
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * attempt, 5000);
          console.log(`⏳ Waiting ${delay}ms before next attempt...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`All ${maxRetries} attempts failed`);
  }

  async getItems(): Promise<any> {
    console.log("🔄 Fetching all Warframe items...");
    const url = `${this.apiBase}/items`;
    return await this.makeRequest(url);
  }

  async getItemByName(itemName: string): Promise<any> {
    console.log(`🔄 Fetching item: ${itemName}...`);
    const url = `${this.apiBase}/items/${itemName}`;
    return await this.makeRequest(url);
  }

  async getItemOrders(itemName: string): Promise<any> {
    console.log(`🔄 Fetching orders for: ${itemName}...`);
    const url = `${this.apiBase}/items/${itemName}/orders`;
    return await this.makeRequest(url);
  }

  async getRivens(): Promise<any> {
    console.log("🔄 Fetching Riven mods...");
    const url = `${this.apiBase}/riven/items`;
    return await this.makeRequest(url);
  }

  async getRivenOrders(weaponName: string): Promise<any> {
    console.log(`🔄 Fetching Riven orders for: ${weaponName}...`);
    const url = `${this.apiBase}/riven/items/${weaponName}/orders`;
    return await this.makeRequest(url);
  }

  async getAuctions(): Promise<any> {
    console.log("🔄 Fetching Riven auctions...");
    const url = `${this.apiBase}/auctions/search?type=riven&buyout_policy=direct`;
    return await this.makeRequest(url);
  }

  // Health check methods
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.getItems();
      return !!(result && result.payload && result.payload.items);
    } catch (error) {
      console.error("Connection test failed:", error.message);
      return false;
    }
  }

  getProxyStats(): any {
    return {
      message: "Proxy stats are managed by ProxyRotation static class",
      available: "Use ProxyRotation.getProxyStats(proxy) for individual proxy stats",
    };
  }
}
