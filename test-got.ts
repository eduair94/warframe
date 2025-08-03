import { WarframeGot } from "./warframe-got";

async function testGot() {
  console.log("Testing Got-based HTTP client...");

  const warframe = new WarframeGot();

  try {
    console.log("Testing getWarframeItems...");
    const items = await warframe.getWarframeItems();
    console.log("✅ Success! Got", items.payload?.items?.length || 0, "items");
  } catch (error: any) {
    console.error("❌ Error in getWarframeItems:", error.message);
    console.error("Status:", error.response?.statusCode);
    console.error("Body:", error.response?.body);
  }

  // Test a single item
  try {
    console.log("\nTesting getSingleItemData...");
    const singleItem = await warframe.getSingleItemData({ url_name: "ash_prime_set" } as any);
    console.log("✅ Success! Got single item data");
  } catch (error: any) {
    console.error("❌ Error in getSingleItemData:", error.message);
    console.error("Status:", error.response?.statusCode);
  }

  // Test orders endpoint that typically fails
  try {
    console.log("\nTesting getWarframeItemOrders...");
    const testItem = {
      url_name: "ash_prime_set",
      items_in_set: [
        {
          mod_max_rank: undefined,
          tags: [],
        },
      ],
    };
    const orders = await warframe.getWarframeItemOrders(testItem as any);
    console.log("✅ Success! Orders:", orders);
  } catch (error: any) {
    console.error("❌ Error in getWarframeItemOrders:", error.message);
    console.error("Status:", error.response?.statusCode);
  }
}

testGot().catch(console.error);
