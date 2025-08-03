import WarframeUndici from "./warframe-undici";

async function testSyncSingleRiven() {
  console.log("🚀 Testing syncSingleRiven function specifically...\n");

  const warframe = new WarframeUndici();

  try {
    // Create a test riven object like the one that would be passed to syncSingleRiven
    const testRiven = {
      url_name: "kulstar",
      item_name: "Kulstar Riven",
    };

    console.log("=== Testing syncSingleRiven with kulstar ===");
    console.log("Test riven:", testRiven);

    // This should now work without 403 errors
    await warframe.syncSingleRiven(testRiven as any);

    console.log("✅ syncSingleRiven completed successfully without 403 errors!");
  } catch (error) {
    console.error("❌ syncSingleRiven failed:", error.message);

    // Try to get more details about the error
    if (error.message.includes("403")) {
      console.log("🔍 Still getting 403 errors. The issue might be:");
      console.log("1. Cloudflare protection triggered by request patterns");
      console.log("2. Need different User-Agent or headers");
      console.log("3. Rate limiting or IP blocking");
    }
  }
}

testSyncSingleRiven();
