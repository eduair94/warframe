import { Schema } from "mongoose";
import { ProxyAgent, request } from "undici";
import UserAgent from "user-agents";
import { createBrotliDecompress, createGunzip, createInflate } from "zlib";
import { AntiDetection, ProxyRotation } from "./anti-detection";
import { Auction } from "./auction.interface";
import { MongooseServer } from "./database";
import { sleep } from "./Express/config";
import proxies from "./Express/Proxies";
import { Item, OrdersWarframe, StatisticsWarframe, WarframeItemSingle, WarframeItems } from "./interface";
import { RivenItems } from "./riven.items.interface";

export default class WarframeUndici {
  private maxRetries: number = 10;
  private apiBase: string = "https://api.warframe.market/v1";
  db: MongooseServer;
  dbRivens: MongooseServer;
  dbRelics: MongooseServer;

  constructor() {
    this.db = MongooseServer.getInstance(
      "warframe-items",
      new Schema(
        {
          id: { type: String, unique: true },
        },
        { strict: false }
      )
    );

    this.dbRivens = MongooseServer.getInstance(
      "warframe-rivens",
      new Schema(
        {
          id: { type: String, unique: true },
        },
        { strict: false }
      )
    );

    this.dbRelics = MongooseServer.getInstance(
      "warframe-relics",
      new Schema(
        {
          relicName: { type: String, unique: true },
        },
        { strict: false }
      )
    );
  }

  private getRandomHeaders() {
    const userAgent = new UserAgent({ deviceCategory: "desktop" });
    const commonReferers = ["https://www.google.com/", "https://www.bing.com/", "https://duckduckgo.com/", "https://warframe.market/", "https://warframe.market/items", ""];

    const acceptLanguages = ["en-US,en;q=0.9", "en-GB,en;q=0.9", "en-US,en;q=0.8,es;q=0.6", "en-US,en;q=0.9,fr;q=0.8", "en-US,en;q=0.9,de;q=0.8"];

    // More realistic headers that exactly match browser requests
    const baseHeaders = {
      "User-Agent": userAgent.toString(),
      Accept: "application/json, text/plain, */*",
      "Accept-Language": acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
      "Accept-Encoding": "gzip, deflate, br, zstd",
      DNT: Math.random() > 0.5 ? "1" : "0",
      Connection: "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      Priority: "u=1, i",
      Referer: commonReferers[Math.floor(Math.random() * commonReferers.length)] || "https://warframe.market/",
      Origin: "https://warframe.market",
    };

    // Remove empty referer if selected
    if (!baseHeaders.Referer) {
      delete baseHeaders.Referer;
    }

    return baseHeaders;
  }

  private async addRandomDelay(min = 500, max = 2000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await sleep(delay);
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

  async getWarframeItems(): Promise<WarframeItems> {
    return this.getItems();
  }

  async getSingleItemDB(item: Item) {
    return this.db.findEntry({ url_name: item.url_name });
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

  async relics() {
    const r = await this.dbRelics.allEntries({});
    return r;
  }
  async buildRelics() {
    const url = "https://drops.warframestat.us/data/relics.json";
    const res = await this.makeRequest(url);
    const relics = res.relics.filter((el: any) => el.state === "Intact");
    for (let relic of relics) {
      delete relic._id;
      await this.dbRelics.getAnUpdateEntry({ relicName: (relic.tier as string).toLowerCase() + " " + relic.relicName }, relic);
    }
    return { success: true, relics: relics.length };
  }

  async saveItem(id: string, item: any) {
    await this.db.getAnUpdateEntry({ id }, item);
  }

  async getSaveRivens() {
    const url = "https://api.warframe.market/v1/riven/items";
    await this.addRandomDelay();
    const data: RivenItems = await this.makeRequest(url);
    const results = data.payload.items;
    console.log("Rivens", results.length);
    await this.dbRivens.saveEntries(results);
  }

  async getAllRivens(): Promise<RivenItems["payload"]["items"]> {
    return this.dbRivens.allEntries({});
  }

  async syncSingleRiven(riven: RivenItems["payload"]["items"][0]) {
    try {
      const url_name = riven.url_name;
      const re_rolls_min = 50;
      const url = `https://api.warframe.market/v1/auctions/search?type=riven&weapon_url_name=${url_name}&polarity=any&re_rolls_min=${re_rolls_min}&buyout_policy=direct&sort_by=price_asc`;

      await this.addRandomDelay();
      const result: Auction = await this.makeRequest(url);
      const items = result.payload.auctions
        .filter((el) => el.buyout_price)
        .map((el) => {
          const { buyout_price, item } = el;
          const { mod_rank, re_rolls, mastery_level } = item;
          const endo = this.endoRiven(mastery_level, mod_rank, re_rolls);
          const endoPerPlat = Math.round((endo / buyout_price) * 100) / 100;
          (el as any).endo = endo;
          (el as any).endoPerPlat = endoPerPlat;
          return el;
        });
      await this.dbRivens.getAnUpdateEntry({ url_name }, { items });
    } catch (e: any) {
      console.log("Retrying riven sync due to error:", e.message);
      await this.addRandomDelay(1000, 3000);
      return this.syncSingleRiven(riven);
    }
  }

  async getSaveOffers() {
    const all_rivens = await this.getAllRivens();
    let idx = 1;
    for (let riven of all_rivens) {
      console.log("Loading", idx, all_rivens.length, riven.item_name);
      await this.syncSingleRiven(riven);
      idx++;
    }
  }

  async rivenMods() {
    const aggregationPipeline = [
      {
        $unwind: "$items",
      },
      {
        $match: {
          "items.owner.status": "ingame",
        },
      },
      {
        $sort: {
          "items.endoPerPlat": -1,
        },
      },
      {
        $limit: 10,
      },
    ];

    // Execute the aggregation pipeline
    const model = this.dbRivens.getModel();
    return new Promise((resolve) => {
      model.aggregate(aggregationPipeline).exec((err: any, result: any) => {
        if (err) {
          console.error("Error executing aggregation:", err);
        } else {
          resolve(result);
        }
      });
    });
  }

  endoRiven(mastery_level: number, mod_rank: number, re_rolls: number) {
    return 100 * (mastery_level - 8) + 22.5 * Math.pow(mod_rank, 2) + 200 * re_rolls;
  }

  async getRelic(url_name: string) {
    const res: any = await this.getSingleItemDB({ url_name } as any);
    const tier = url_name.split(/_/g)[0];
    const name = url_name.split(/_/g)[1].toUpperCase();
    const relic: any = await this.dbRelics.findEntry({ relicName: tier + " " + name });
    const items = relic.rewards.map((el: any) => el.itemName);
    let results = await this.db.allEntries({ item_name: { $in: items } });
    const itemByParts = JSON.parse(JSON.stringify(res));
    itemByParts.item_name = `${res.item_name} by Parts`;
    itemByParts.market.buy = 0;
    itemByParts.market.sell = 0;
    return { set: [this.processItem(res)], items: results.map((el: any) => this.processItem(el)) };
  }

  async getSet(url_name: string) {
    const res: any = await this.getSingleItemDB({ url_name } as any);
    const items = res.items_in_set.filter((el: any) => el.url_name !== url_name).map((el: any) => el.url_name);
    let results = await this.db.allEntries({ url_name: { $in: items } });
    results = results.map((el: any) => {
      el.item_in_set = res.items_in_set.find((x: any) => x.url_name === el.url_name);
      return el;
    });
    const itemByParts = JSON.parse(JSON.stringify(res));
    itemByParts.item_name = `${res.item_name} by Parts`;
    itemByParts.market.buy = results.reduce((prev: any, curr: any) => prev + curr.market.buy * curr.item_in_set.quantity_for_set, 0);
    itemByParts.market.sell = results.reduce((prev: any, curr: any) => prev + curr.market.sell * curr.item_in_set.quantity_for_set, 0);
    return { set: [this.processItem(res), this.processItem(itemByParts)], items: results.map((el: any) => this.processItem(el)) };
  }

  processItem(item: Item) {
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate } = item;
    if (!market) return "";
    if (!items_in_set || !items_in_set.length) return "";
    const { tags } = items_in_set[0];
    return { item_name, thumb, market: { ...market, diff: market.sell - market.buy }, url_name, tags, set: items_in_set.length > 1, priceUpdate };
  }

  async getItemsDatabaseServer() {
    const entries = await this.db.allEntries({});
    return entries
      .map((item: Item) => {
        return this.processItem(item);
      })
      .filter((el) => el);
  }

  async getItemsDatabase() {
    return await this.db.allEntries({});
  }

  async removeItemDB(id: string) {
    return await this.db.deleteEntry({ id });
  }

  async getItemsDatabaseDate() {
    return await this.db.allEntriesSort({}, { priceUpdate: 1 });
  }

  async getSingleItemData(item: Item): Promise<WarframeItemSingle> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}`;
    console.log("url", url);
    await this.addRandomDelay();
    const res = await this.makeRequest(url);
    return res;
  }

  async getWarframeItemOrders(item: Item, att = 0): Promise<{ buy: number; sell: number; volume: number; not_found?: boolean }> {
    try {
      const url = `https://api.warframe.market/v1/items/${item.url_name}/orders`;

      await this.addRandomDelay();
      const res = await this.makeRequest(url);
      const itemSet = item.items_in_set[0];
      let max_rank = itemSet.mod_max_rank;
      const { volume } = await this.getWarframeItemStatistics(item, max_rank);
      return { ...this.getWarframeItemBuySellPrice(res, max_rank), volume };
    } catch (e: any) {
      if (e.message && e.message.includes("429")) {
        await sleep(2000 + Math.random() * 3000); // Random delay between 2-5 seconds
        return this.getWarframeItemOrders(item, att + 1);
      } else if (e.message && e.message.includes("404")) {
        console.log("Item not found", item.url_name);
        return { buy: 0, sell: 0, volume: 0, not_found: true };
      } else {
        console.error(e);
      }
      return { buy: 0, sell: 0, volume: 0 };
    }
  }

  async getWarframeItemStatistics(item: Item, max_rank: number | undefined): Promise<{ volume: number }> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}/statistics`;

    await this.addRandomDelay(300, 1000);
    const res: StatisticsWarframe = await this.makeRequest(url);
    const volume = res.payload.statistics_closed["48hours"].reduce((prev, curr) => (max_rank === undefined || curr.mod_rank === max_rank ? prev + curr.volume : prev), 0);
    return {
      volume,
    };
  }

  getWarframeItemBuySellPrice(data: OrdersWarframe, max_rank: number | undefined) {
    const orders = data.payload.orders;
    const buyOrders = orders.filter((order) => order.order_type === "buy" && order.user.status === "ingame" && (max_rank === undefined || order.mod_rank === max_rank));
    const sellOrders = orders.filter((order) => order.order_type === "sell" && order.user.status === "ingame" && (max_rank === undefined || order.mod_rank === max_rank));
    // Find the lowest buy order by the property platinum
    let buyPlat = 0;
    let buyAvg = 0;
    if (buyOrders.length) {
      // sort orders by platinum ascending
      const highestBuyOrders = buyOrders.sort((prev, curr) => curr.platinum - prev.platinum);
      buyPlat = highestBuyOrders[0].platinum;

      const max = highestBuyOrders.length > 5 ? 5 : highestBuyOrders.length;
      buyAvg = highestBuyOrders.slice(0, max).reduce((prev, curr) => prev + curr.platinum, 0) / max;
    }
    // Same for sell Orders.
    let sellPlat = 0;
    let sellAvg = 0;
    if (sellOrders.length) {
      const lowestSellOrders = sellOrders.sort((prev, curr) => prev.platinum - curr.platinum);
      sellPlat = lowestSellOrders[0].platinum;
      // Get average platinum first 5 items array lowestSellOrders
      const max = lowestSellOrders.length > 5 ? 5 : lowestSellOrders.length;
      sellAvg = lowestSellOrders.slice(0, max).reduce((prev, curr) => prev + curr.platinum, 0) / max;
    }
    return {
      buy: buyPlat,
      sell: sellPlat,
      buyAvg,
      sellAvg,
    };
  }
}
