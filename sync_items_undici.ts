import { ProxyAgent, request } from "undici";
import UserAgent from "user-agents";
import { MongooseServer, Schema } from "./database";
import proxies from "./Express/Proxies";

interface WarframeItems {
  payload: {
    items: Array<{
      id: string;
      url_name: string;
      item_name: string;
      thumb: string;
    }>;
  };
}

interface WarframeItemSingle {
  payload: {
    item: any;
  };
}

class UndiciWarframe {
  db: MongooseServer;

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
  }

  private getRandomHeaders() {
    const userAgent = new UserAgent({ deviceCategory: "desktop" });
    return {
      "User-Agent": userAgent.toString(),
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      Connection: "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      Origin: "https://warframe.market",
      Referer: "https://warframe.market/",
    };
  }

  private async makeRequest(url: string, retries = 10): Promise<any> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const proxy = proxies.getProxy();
        console.log(`Attempt ${attempt + 1} using proxy: ${proxy}`);

        const dispatcher = new ProxyAgent(proxy);

        const response = await request(url, {
          headers: this.getRandomHeaders(),
          dispatcher,
        });

        if (response.statusCode === 200) {
          const data = await response.body.json();
          return data;
        } else if (response.statusCode === 403 || response.statusCode === 429) {
          console.log(`Got ${response.statusCode}, retrying with new proxy...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
          continue;
        } else {
          throw new Error(`HTTP ${response.statusCode}`);
        }
      } catch (error: any) {
        console.log(`Attempt ${attempt + 1} failed:`, error.message);
        if (attempt === retries - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
      }
    }
  }

  async getWarframeItems(): Promise<WarframeItems> {
    return this.makeRequest("https://api.warframe.market/v1/items");
  }

  async getSingleItemData(item: { url_name: string }): Promise<WarframeItemSingle> {
    const url = `https://api.warframe.market/v1/items/${item.url_name}`;
    return this.makeRequest(url);
  }

  async getSingleItemDB(item: { url_name: string }) {
    return this.db.findEntry({ url_name: item.url_name });
  }

  async saveItem(id: string, item: any) {
    await this.db.getAnUpdateEntry({ id }, item);
  }
}

async function main() {
  await MongooseServer.startConnectionPromise();
  const m = new UndiciWarframe();
  console.time("warframe");

  try {
    const res = await m.getWarframeItems();
    const items = res.payload.items;
    let idx = 1;

    for (let item of items) {
      console.log("Loading", idx, items.length, item.item_name);
      const itemDB = await m.getSingleItemDB(item);
      if (!itemDB) {
        const itemData = await m.getSingleItemData(item);
        const itemToSave = itemData.payload.item;
        await m.saveItem(itemToSave.id, { ...itemToSave, ...item });
      }
      idx++;
    }
    console.timeEnd("warframe");
  } catch (error) {
    console.error("Failed to sync items:", error);
  }
}

main();
