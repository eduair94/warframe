import proxies from "./Express/Proxies";
import { MongooseServer } from "./database";
import { Item } from "./interface";
import { Warframe } from "./warframe";

async function main() {
    await MongooseServer.startConnectionPromise();
    await proxies.setProxies();
    const m = new Warframe();
    console.time('warframe');
    let concurrencyLimit = 5;
    async function processEntry(item) {
        const market = await m.getWarframeItemOrders(item);
        await m.saveItem(item.id, { market });
    }
    m.getItemsDatabase().then(async items => {
        const processQueue = items.map(async (entry:Item, index) => {
            await processEntry(entry);
            console.log(`Finished processing entry ${index + 1}`);
        });
        const processWithConcurrencyLimit = async () => {
            for (let i = 0; i < items.length; i += concurrencyLimit) {
                const chunk = processQueue.slice(i, i + concurrencyLimit);
                await Promise.all(chunk);
            }
            console.timeEnd('warframe');
            process.exit(1);
        };

        processWithConcurrencyLimit();
    });
}

main();