import dotenv from "dotenv";
import { got, Got } from "got";
import { HttpsProxyAgent } from "hpagent";
import { CookieJar } from "tough-cookie";
import UserAgent from "user-agents";
import proxies from "./Express/Proxies";
import { sleep } from "./Express/config";
import { AntiDetection, ProxyRotation } from "./anti-detection";
import { Auction } from "./auction.interface";
import { MongooseServer, Schema } from "./database";
import { Item, OrdersWarframe, StatisticsWarframe, WarframeItems, WarframeItemSingle } from "./interface";
import { RivenItems } from "./riven.items.interface";
dotenv.config();

class WarframeGot {
  db: MongooseServer;
  dbRivens: MongooseServer;
  httpClient: Got;
  dbRelics: MongooseServer;
  private userAgent: UserAgent;
  private cookieJar: CookieJar;

  constructor() {
    this.userAgent = new UserAgent({ deviceCategory: "desktop" });
    this.cookieJar = new CookieJar();

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

    // Configure got with anti-detection measures
    let gotOptions: any = {
      timeout: {
        request: 30000,
      },
      headers: this.getRandomHeaders(),
      cookieJar: this.cookieJar,
      http2: true, // Enable HTTP/2 like modern browsers
      followRedirect: true,
      maxRedirects: 5,
      retry: {
        limit: 10,
        methods: ["GET", "POST", "PUT", "DELETE"],
        statusCodes: [403, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
        errorCodes: ["TIMEOUT", "ECONNRESET", "EADDRINUSE", "ECONNREFUSED", "EPIPE", "ENOTFOUND", "ENETUNREACH", "EAI_AGAIN"],
        calculateDelay: ({ attemptCount }) => {
          // Jittered exponential backoff
          const baseDelay = Math.pow(2, attemptCount) * 1000;
          const jitter = Math.random() * 1000;
          return Math.min(baseDelay + jitter, 30000);
        },
      },
      hooks: {
        beforeRequest: [
          (options) => {
            // Add random delay before each request
            return new Promise((resolve) => {
              const delay = 500 + Math.random() * 1500;
              setTimeout(() => resolve(undefined), delay);
            });
          },
        ],
        beforeRetry: [
          (error, retryCount) => {
            console.log(`Retry attempt ${retryCount} for ${error.message}`);

            // If it's a 403 error, rotate proxy and headers
            if (error.response?.statusCode === 403 || error.response?.statusCode === 429 || error.response?.statusCode === 503) {
              let newProxy = proxies.getProxy();

              // Keep trying to get a good proxy
              let attempts = 0;
              while (ProxyRotation.shouldAvoidProxy(newProxy) && attempts < 5) {
                newProxy = proxies.getProxy();
                attempts++;
              }

              console.log("Update proxy to:", newProxy);

              // Update proxy agent
              const proxyAgent = new HttpsProxyAgent({
                proxy: newProxy,
                keepAlive: true,
              });

              error.options.agent = {
                https: proxyAgent,
                http: proxyAgent,
              };

              // Update headers
              error.options.headers = this.getRandomHeaders();

              // Reset session
              AntiDetection.resetSession();
            }
          },
        ],
      },
    };

    // Add proxy if not disabled
    if (process.env.proxyless !== "true") {
      const proxy = proxies.getProxy();
      const proxyAgent = new HttpsProxyAgent({
        proxy: proxy,
        keepAlive: true,
      });

      gotOptions.agent = {
        https: proxyAgent,
        http: proxyAgent,
      };

      console.log("HTTP Client config with proxy:", proxy);
    }

    this.httpClient = got.extend(gotOptions);
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

  async relics() {
    const r = await this.dbRelics.allEntries({});
    return r;
  }

  async buildRelics() {
    const url = "https://drops.warframestat.us/data/relics.json";
    const res = await this.httpClient.get(url).json();
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
    const data: RivenItems = await this.httpClient
      .get(url, {
        headers: this.getRandomHeaders(),
      })
      .json();
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

      // Get fresh proxy for this request
      const proxy = proxies.getProxy();
      const proxyAgent = new HttpsProxyAgent({
        proxy: proxy,
        keepAlive: true,
      });

      await this.addRandomDelay();
      const result: Auction = await this.httpClient
        .get(url, {
          agent: {
            https: proxyAgent,
            http: proxyAgent,
          },
          headers: this.getRandomHeaders(),
        })
        .json();

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

  async getWarframeItems(): Promise<WarframeItems> {
    await this.addRandomDelay();
    const res = await this.httpClient
      .get("https://api.warframe.market/v1/items", {
        headers: this.getRandomHeaders(),
      })
      .json();
    return res;
  }

  async getSingleItemDB(item: Item) {
    return this.db.findEntry({ url_name: item.url_name });
  }

  async getSingleItemData(item: Item): Promise<WarframeItemSingle> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}`;
    console.log("url", url);
    await this.addRandomDelay();
    const res = await this.httpClient
      .get(url, {
        headers: this.getRandomHeaders(),
      })
      .json();
    return res;
  }

  async getWarframeItemOrders(item: Item, att = 0): Promise<{ buy: number; sell: number; volume: number; not_found?: boolean }> {
    try {
      const proxy = proxies.getProxy();
      const proxyAgent = new HttpsProxyAgent({
        proxy: proxy,
        keepAlive: true,
      });
      const url = `https://api.warframe.market/v1/items/${item.url_name}/orders`;

      await this.addRandomDelay();
      const res = await this.httpClient
        .get(url, {
          agent: {
            https: proxyAgent,
            http: proxyAgent,
          },
          timeout: { request: 10000 },
          headers: this.getRandomHeaders(),
        })
        .json();

      const itemSet = item.items_in_set[0];
      let max_rank = itemSet.mod_max_rank;
      const { volume } = await this.getWarframeItemStatistics(item, max_rank, proxyAgent);
      return { ...this.getWarframeItemBuySellPrice(res, max_rank), volume };
    } catch (e: any) {
      if (e.response?.statusCode === 429) {
        await sleep(2000 + Math.random() * 3000); // Random delay between 2-5 seconds
        return this.getWarframeItemOrders(item, att + 1);
      } else if (e.response?.statusCode === 404) {
        console.log("Item not found", item.url_name);
        return { buy: 0, sell: 0, volume: 0, not_found: true };
      } else {
        console.error(e);
      }
      return null;
    }
  }

  async getWarframeItemStatistics(item: Item, max_rank: number | undefined, proxyAgent: HttpsProxyAgent): Promise<{ volume: number }> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}/statistics`;

    await this.addRandomDelay(300, 1000);
    const res: StatisticsWarframe = await this.httpClient
      .get(url, {
        agent: {
          https: proxyAgent,
          http: proxyAgent,
        },
        headers: this.getRandomHeaders(),
      })
      .json();

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

export { WarframeGot };
