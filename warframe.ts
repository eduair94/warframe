import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults } from "axios";
import axiosRetry from "axios-retry";
import dotenv from "dotenv";
import UserAgent from "user-agents";
import proxies from "./Express/Proxies";
import { sleep } from "./Express/config";
import { AntiDetection, ProxyRotation } from "./anti-detection";
import { Auction } from "./auction.interface";
import { MongooseServer, Schema } from "./database";
import { Item, OrdersWarframe, StatisticsWarframe, WarframeItemSingle, WarframeItems } from "./interface";
import privateProxy from "./proxy";
import { RivenItems } from "./riven.items.interface";
dotenv.config();

class Warframe {
  db: MongooseServer;
  dbRivens: MongooseServer;
  axios: AxiosInstance;
  dbRelics: MongooseServer;
  private userAgent: UserAgent;

  constructor() {
    this.userAgent = new UserAgent({ deviceCategory: "desktop" });

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

    let config: CreateAxiosDefaults = {
      timeout: 30000,
      headers: this.getRandomHeaders(),
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 300; // default
      },
      // Add browser-like behavior
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      // Disable automatic decompression to handle it manually like browsers
      decompress: true,
    };
    const initialAgent = proxies.getProxyAgent();
    if (initialAgent && process.env.proxyless !== "true") {
      config.httpAgent = initialAgent;
      config.httpsAgent = initialAgent;
      config.proxy = false; // Disable axios proxy handling
      config.timeout = 10000;
    }
    console.log("Axios config", privateProxy);
    this.axios = axios.create(config);
    axiosRetry(this.axios, {
      retryDelay: (retryNumber) => {
        // Add random jitter to delay to appear more human-like
        const baseDelay = Math.pow(2, retryNumber) * 1000;
        const jitter = Math.random() * 1000;
        return baseDelay + jitter;
      },
      retries: 100,
      shouldResetTimeout: true,
      retryCondition: (error) => {
        // Retry on network errors, 5xx errors, and specific 4xx errors like 403, 429, 503
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 403 || error.response?.status === 429 || error.response?.status === 503;
      },
      onRetry: (retryCount, error, requestConfig) => {
        console.log(`Retry attempt ${retryCount} for status ${error.response?.status || "network error"}`);
        // Change proxy and headers for a new one if it fails with 403, 503, or 429
        if (error.response?.status === 403 || error.response?.status === 503 || error.response?.status === 429) {
          let newProxy = proxies.getProxy();

          // Keep trying to get a good proxy
          let attempts = 0;
          while (ProxyRotation.shouldAvoidProxy(newProxy) && attempts < 5) {
            newProxy = proxies.getProxy();
            attempts++;
          }

          console.log("Update proxy to:", newProxy);
          const proxyObj = proxies.getProxyAgent(newProxy);
          requestConfig.httpAgent = proxyObj;
          requestConfig.httpsAgent = proxyObj;

          // Mark old proxy as having issues if we can identify it
          if (error.response?.status === 403) {
            // Record this proxy as potentially problematic
            const currentProxy = requestConfig.httpAgent?.proxy || requestConfig.httpsAgent?.proxy;
            if (currentProxy) {
              ProxyRotation.recordProxyPerformance(currentProxy.toString(), false);
            }
          }

          // Reset session and update headers with new random values
          AntiDetection.resetSession();
          requestConfig.headers = { ...requestConfig.headers, ...this.getRandomHeaders(), ...AntiDetection.getBrowserHeaders() };
        }
      },
    });
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
    const res = await axios.get(url).then((res) => res.data);
    const relics = res.relics.filter((el) => el.state === "Intact");
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
    const data: RivenItems = await this.axios
      .get(url, {
        headers: this.getRandomHeaders(),
      })
      .then((res) => res.data);
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
      const httpAgent = proxies.getProxyAgent();

      await this.addRandomDelay();
      const result: Auction = await this.axios
        .get(url, {
          httpAgent: httpAgent,
          httpsAgent: httpAgent,
          headers: this.getRandomHeaders(),
        })
        .then((res) => res.data);
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
    } catch (e) {
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
      model.aggregate(aggregationPipeline).exec((err, result) => {
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
    return { set: [this.processItem(res)], items: results.map((el) => this.processItem(el)) };
  }
  async getSet(url_name: string) {
    const res: any = await this.getSingleItemDB({ url_name } as any);
    const items = res.items_in_set.filter((el: any) => el.url_name !== url_name).map((el) => el.url_name);
    let results = await this.db.allEntries({ url_name: { $in: items } });
    results = results.map((el) => {
      el.item_in_set = res.items_in_set.find((x: any) => x.url_name === el.url_name);
      return el;
    });
    const itemByParts = JSON.parse(JSON.stringify(res));
    itemByParts.item_name = `${res.item_name} by Parts`;
    itemByParts.market.buy = results.reduce((prev: any, curr: any) => prev + curr.market.buy * curr.item_in_set.quantity_for_set, 0);
    itemByParts.market.sell = results.reduce((prev: any, curr: any) => prev + curr.market.sell * curr.item_in_set.quantity_for_set, 0);
    return { set: [this.processItem(res), this.processItem(itemByParts)], items: results.map((el) => this.processItem(el)) };
  }
  processItem(item: Item) {
    const { item_name, thumb, market, url_name, items_in_set, priceUpdate } = item;
    if (!market) return "";
    if (!items_in_set && !items_in_set.length) return "";
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
    const res = await this.axios
      .get("https://api.warframe.market/v1/items", {
        headers: this.getRandomHeaders(),
      })
      .then((res) => res.data);
    return res;
  }
  async getSingleItemDB(item: Item) {
    return this.db.findEntry({ url_name: item.url_name });
  }
  async getSingleItemData(item: Item): Promise<WarframeItemSingle> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}`;
    console.log("url", url);
    await this.addRandomDelay();
    const res = await this.axios
      .get(url, {
        headers: this.getRandomHeaders(),
      })
      .then((res) => res.data);
    return res;
  }
  async getWarframeItemOrders(item: Item, att = 0): Promise<{ buy: number; sell: number; volume: number; not_found?: boolean }> {
    try {
      const httpAgent = proxies.getProxyAgent();
      const url = `https://api.warframe.market/v1/items/${item.url_name}/orders`;

      await this.addRandomDelay();
      const res = await this.axios
        .get(url, {
          httpAgent: httpAgent,
          httpsAgent: httpAgent,
          timeout: 10000,
          headers: this.getRandomHeaders(),
        })
        .then((res) => res.data);
      const itemSet = item.items_in_set[0];
      let max_rank = itemSet.mod_max_rank;
      const { volume } = await this.getWarframeItemStatistics(item, max_rank);
      return { ...this.getWarframeItemBuySellPrice(res, max_rank), volume };
    } catch (e) {
      const err: AxiosError = e;
      if (err?.response?.status == 429) {
        await sleep(2000 + Math.random() * 3000); // Random delay between 2-5 seconds
        return this.getWarframeItemOrders(item, att + 1);
      } else if (err?.response?.status == 404) {
        console.log("Item not found", item.url_name);
        return { buy: 0, sell: 0, volume: 0, not_found: true };
      } else {
        console.error(e);
      }
      return null;
    }
  }
  async getWarframeItemStatistics(item: Item, max_rank: number | undefined): Promise<{ volume: number }> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}/statistics`;

    await this.addRandomDelay(300, 1000);
    const res: StatisticsWarframe = await this.axios
      .get(url, {
        headers: this.getRandomHeaders(),
      })
      .then((res) => res.data);
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

export { Warframe };
