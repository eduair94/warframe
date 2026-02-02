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
  console.log("  - Got", apiItems.data.length, "items from API");
  
  // Find ayatan_orta_sculpture in API (v2 uses 'slug' instead of 'url_name')
  const ayatanFromApiRaw = apiItems.data.find(
    (item: any) => item.slug === 'ayatan_orta_sculpture'
  );
  // Map v2 fields to v1 format for database compatibility
  const ayatanFromApi = ayatanFromApiRaw ? {
    ...ayatanFromApiRaw,
    url_name: ayatanFromApiRaw.slug,
    item_name: ayatanFromApiRaw.i18n?.en?.name || ayatanFromApiRaw.slug,
    thumb: ayatanFromApiRaw.i18n?.en?.thumb || '',
  } : null;
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
  
  // Step 2.5: VALIDATE market data before saving
  console.log("Step 2.5: Validating market data...");
  const isValidMarket = (m: any): boolean => {
    if (!m) {
      console.log("  ❌ INVALID: market is null/undefined");
      return false;
    }
    if (m.not_found) {
      console.log("  ❌ INVALID: item not found on API");
      return false;
    }
    // Check if all price data is zero (indicates a failed fetch)
    if (m.buy === 0 && m.sell === 0 && m.volume === 0 && m.avg_price === 0) {
      console.log("  ❌ INVALID: All market values are 0 (likely failed fetch)");
      return false;
    }
    // At minimum, we should have either buy or sell > 0, or volume > 0
    if (m.buy === 0 && m.sell === 0 && m.volume === 0) {
      console.log("  ⚠️ WARNING: No buy/sell orders and no volume - item may have no market activity");
      // Still valid, just no activity
    }
    return true;
  };
  
  if (!isValidMarket(market)) {
    console.log("  🛑 ABORTING: Will NOT save invalid market data to database!");
    console.log("  - Current DB market data preserved");
    process.exit(1);
  }
  console.log("  ✅ Market data is valid!");
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
