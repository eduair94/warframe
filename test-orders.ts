import { Warframe } from "./warframe";

async function testOrdersEndpoint() {
  console.log("Testing the orders endpoint that might be causing 403...");

  const warframe = new Warframe();

  // Create a mock item for testing
  const testItem = {
    url_name: "ash_prime_set",
    items_in_set: [
      {
        mod_max_rank: undefined,
        tags: [],
      },
    ],
  };

  try {
    console.log("Testing getWarframeItemOrders...");
    const orders = await warframe.getWarframeItemOrders(testItem as any);
    console.log("✅ Success! Orders:", orders);
  } catch (error) {
    console.error("❌ Error in getWarframeItemOrders:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("Headers sent:", JSON.stringify(error.config?.headers, null, 2));
  }

  // Test riven sync which might also cause issues
  try {
    console.log("\nTesting getSaveRivens...");
    await warframe.getSaveRivens();
    console.log("✅ Success! Rivens saved");
  } catch (error) {
    console.error("❌ Error in getSaveRivens:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response data:", error.response?.data);
  }
}

testOrdersEndpoint().catch(console.error);
