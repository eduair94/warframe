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
            const itemOrderData = await m.getWarframeItemOrders(item);
            console.log("ItemOrderData", itemOrderData);
            await m.saveItem(item.id, itemOrderData);
            idx++;
        }
        console.timeEnd('warframe');
    });
}

main();