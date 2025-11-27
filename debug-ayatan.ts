import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";

async function debugAyatan() {
  console.log("Debugging Ayatan Orta Sculpture Sync...\n");
  
  await MongooseServer.startConnectionPromise();
  console.log("Connected to MongoDB\n");
  
  const client = new WarframeUndici({
    minDelay: 0,
    maxDelay: 100,
    priceConfig: {
      ordersMinDelay: 0,
      ordersMaxDelay: 0,
      statsMinDelay: 0,
      statsMaxDelay: 0
    }
  });

  // Step 0: First sync the item from API to DB
  console.log("Step 0: Syncing items from API to database...");
  const apiItems = await client.getItems();
  console.log("  - Got", apiItems.payload.items.length, "items from API");
  
  // Find ayatan_orta_sculpture in API
  const ayatanFromApi = apiItems.payload.items.find(
    (item: any) => item.url_name === 'ayatan_orta_sculpture'
  );
  console.log("  - ayatan_orta_sculpture in API:", !!ayatanFromApi);
  if (ayatanFromApi) {
    console.log("  - API data:", JSON.stringify(ayatanFromApi, null, 2));
    
    // Get full item details
    console.log("  - Fetching full item details...");
    const itemDetails = await client.getSingleItemData({ url_name: 'ayatan_orta_sculpture' });
    const itemToSave = itemDetails.payload.item;
    console.log("  - Full item id:", itemToSave.id);
    console.log("  - items_in_set length:", itemToSave.items_in_set?.length);
    console.log("  - items_in_set[0].mod_max_rank:", itemToSave.items_in_set?.[0]?.mod_max_rank);
    
    // Save to DB (same way as sync_items.ts)
    console.log("  - Saving item to database...");
    await client.saveItem(itemToSave.id, { ...itemToSave, ...ayatanFromApi });
    console.log("  - Item synced to database!");
  }
  console.log("");

  // Step 1: Now get the item from DB
  console.log("Step 1: Getting item from database...");
  const dbItem = await client.getSingleItemDB({ url_name: 'ayatan_orta_sculpture' });
  if (!dbItem) {
    console.log("  ERROR: Item not found in database after sync!");
    process.exit(1);
  }
  console.log("  - id:", dbItem?.id || dbItem?._id);
  console.log("  - url_name:", dbItem?.url_name);
  console.log("  - items_in_set exists:", !!dbItem?.items_in_set);
  console.log("  - items_in_set[0]?.mod_max_rank:", dbItem?.items_in_set?.[0]?.mod_max_rank);
  console.log("  - Current market data:", JSON.stringify(dbItem?.market, null, 4));
  console.log("");
  
  // Step 2: Fetch fresh prices (as sync_prices does)
  console.log("Step 2: Fetching fresh prices (getWarframeItemOrders)...");
  const market = await client.getWarframeItemOrders(dbItem) as any;
  console.log("  - Result:", JSON.stringify(market, null, 2));
  console.log("");
  
  // Step 3: Save to DB
  console.log("Step 3: Saving market data to database...");
  const itemId = dbItem?.id || dbItem?._id;
  await client.saveItem(itemId, { market, priceUpdate: new Date() });
  console.log("  - Saved!");
  console.log("");
  
  // Step 4: Re-fetch to confirm
  console.log("Step 4: Re-fetching from DB to confirm...");
  const updatedItem = await client.getSingleItemDB({ url_name: 'ayatan_orta_sculpture' });
  console.log("  - Updated market:", JSON.stringify(updatedItem?.market, null, 2));
  
  process.exit(0);
}

debugAyatan().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});
