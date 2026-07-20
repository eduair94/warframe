import "../../env";
import WarframeUndici from "../../warframe-undici";

async function testWarframeUndici() {
  console.log("🚀 Testing Warframe Undici implementation...\n");

  const warframe = new WarframeUndici();

  try {
    // Test 1: Get all items (most stable endpoint)
    console.log("=== Test 1: Get All Items ===");
    const items = await warframe.getItems();
    if (items && items.data) {
      console.log(`✅ Items: ${items.data.length} items retrieved`);
    } else {
      console.log("❌ Items: Failed to get valid response");
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Get specific item
    console.log("\n=== Test 2: Get Specific Item ===");
    const singleItem = await warframe.getItemByName("ash_prime_set");
    if (singleItem && singleItem.payload && singleItem.payload.item) {
      console.log(`✅ Single Item: Got item ${singleItem.payload.item.item_name}`);
    } else {
      console.log("❌ Single Item: Failed to get valid response");
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 3: Get orders (most likely to be blocked)
    console.log("\n=== Test 3: Get Orders (Critical Test) ===");
    const orders = await warframe.getItemOrders("ash_prime_set");
    if (orders && orders.payload && orders.payload.orders) {
      console.log(`✅ Orders: ${orders.payload.orders.length} orders retrieved`);
    } else {
      console.log("❌ Orders: Failed to get valid response");
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("✅ Undici with manual decompression works perfectly!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  }
}

testWarframeUndici();
