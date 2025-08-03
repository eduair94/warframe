import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";

async function main() {
  await MongooseServer.startConnectionPromise();
  const m = new WarframeUndici();
  console.time("warframe");
  m.getWarframeItems().then(async (res) => {
    const items = res.payload.items;
    let idx = 1;
    for (let item of items) {
      console.log("Loading", idx, items.length);
      const itemDB = await m.getSingleItemDB(item);
      if (!itemDB) {
        const itemData = await m.getSingleItemData(item);
        const itemToSave = itemData.payload.item;
        await m.saveItem(itemToSave.id, { ...itemToSave, ...item });
      }
      idx++;
    }
    console.timeEnd("warframe");
  });
}

main();
