import { MongooseServer } from "./database";
import { Item } from "./interface";
import WarframeUndici from "./warframe-undici";

async function main() {
  await MongooseServer.startConnectionPromise();
  //await proxies.setProxies();
  const m = new WarframeUndici();
  console.time("warframe");
  let idx = 0;
  let concurrencyLimit = 20;
  async function processEntry(item) {
    const market = await m.getWarframeItemOrders(item);
    if (market) {
      if (market.not_found) {
        console.log("remove not found item", item.id);
        await m.removeItemDB(item.id);
      } else {
        await m.saveItem(item.id, { market, priceUpdate: new Date() });
      }
    }
  }
  m.getItemsDatabaseDate().then(async (items) => {
    const processQueue = items.map((entry: Item) => {
      return async () => {
        await processEntry(entry);
        console.log(`${idx + 1}/${items.length}`);
        idx++;
      };
    });
    const processWithConcurrencyLimit = async () => {
      for (let i = 0; i < items.length; i += concurrencyLimit) {
        const chunk = processQueue.slice(i, i + concurrencyLimit);
        const entries = chunk.map((el: any) => el());
        await Promise.all(entries);
      }
      console.timeEnd("warframe");
      process.exit(1);
    };

    processWithConcurrencyLimit();
  });
}

main();
