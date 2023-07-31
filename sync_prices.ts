import { MongooseServer } from "./database";
import { Warframe } from "./warframe";

async function main() {
    await MongooseServer.startConnectionPromise();
    const m = new Warframe();
    console.time('warframe');
    m.getItemsDatabase().then(async items => {
        let idx = 0;
        for (let item of items) {
            console.log("Loading", idx, items.length);
            const market = await m.getWarframeItemOrders(item);
            await m.saveItem(item.id, { market });
            idx++;
        }
        console.timeEnd('warframe');
        process.exit(1);
    });
}

main();