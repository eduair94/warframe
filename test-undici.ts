import { ProxyAgent, request } from "undici";
import { createBrotliDecompress, createGunzip, createInflate } from "zlib";

// Simple proxy list for testing
const testProxies = [
  "http://116858:VVWeyj58TxDD@94.229.71.37:8800",
  // Add more proxies as needed
];

let currentProxyIndex = 0;

function getNextProxy() {
  const proxy = testProxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % testProxies.length;
  return proxy;
}

function getRandomHeaders() {
  return {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
    "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    Origin: "https://warframe.market",
    Referer: "https://warframe.market/",
  };
}

async function makeRequest(url: string, retries = 10): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const proxy = getNextProxy();
      console.log(`Attempt ${attempt + 1} using proxy: ${proxy}`);

      const dispatcher = new ProxyAgent(proxy);

      const response = await request(url, {
        headers: getRandomHeaders(),
        dispatcher,
        // Enable automatic decompression
        method: "GET",
      });

      console.log(`Response status: ${response.statusCode}`);
      console.log(`Response headers:`, response.headers);

      if (response.statusCode === 200) {
        const contentType = response.headers["content-type"];
        const contentEncoding = response.headers["content-encoding"];
        console.log(`Content-Type: ${contentType}`);
        console.log(`Content-Encoding: ${contentEncoding}`);

        try {
          let responseText: string;

          // Handle different compression types
          if (contentEncoding === "gzip") {
            console.log("Decompressing gzip...");
            const chunks: Buffer[] = [];
            for await (const chunk of response.body) {
              chunks.push(chunk as Buffer);
            }
            // @ts-ignore
            const compressed = Buffer.concat(chunks);
            const gunzip = createGunzip();
            gunzip.write(compressed);
            gunzip.end();

            const decompressed: Buffer[] = [];
            for await (const chunk of gunzip) {
              decompressed.push(chunk as Buffer);
            }
            // @ts-ignore
            responseText = Buffer.concat(decompressed).toString("utf8");
          } else if (contentEncoding === "deflate") {
            console.log("Decompressing deflate...");
            const chunks: Buffer[] = [];
            for await (const chunk of response.body) {
              chunks.push(chunk as Buffer);
            }
            // @ts-ignore
            const compressed = Buffer.concat(chunks);
            const inflate = createInflate();
            inflate.write(compressed);
            inflate.end();

            const decompressed: Buffer[] = [];
            for await (const chunk of inflate) {
              decompressed.push(chunk as Buffer);
            }
            // @ts-ignore
            responseText = Buffer.concat(decompressed).toString("utf8");
          } else if (contentEncoding === "br") {
            console.log("Decompressing brotli...");
            const chunks: Buffer[] = [];
            for await (const chunk of response.body) {
              chunks.push(chunk as Buffer);
            }
            // @ts-ignore
            const compressed = Buffer.concat(chunks);
            const brotli = createBrotliDecompress();
            brotli.write(compressed);
            brotli.end();

            const decompressed: Buffer[] = [];
            for await (const chunk of brotli) {
              decompressed.push(chunk as Buffer);
            }
            // @ts-ignore
            responseText = Buffer.concat(decompressed).toString("utf8");
          } else {
            // No compression or unknown compression
            console.log("No compression detected, reading as text...");
            responseText = await response.body.text();
          }

          console.log("Decompressed text (first 200 chars):", responseText.substring(0, 200));

          // Try to parse as JSON
          const data = JSON.parse(responseText);
          console.log("✅ Success! Got data with keys:", Object.keys(data));
          return data;
        } catch (jsonError: any) {
          console.log("❌ Failed to parse JSON:", jsonError.message);
          throw new Error("Invalid JSON response received");
        }
      } else if (response.statusCode === 403 || response.statusCode === 429) {
        console.log(`❌ Got ${response.statusCode}, retrying with new proxy...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
        continue;
      } else {
        throw new Error(`HTTP ${response.statusCode}`);
      }
    } catch (error: any) {
      console.log(`❌ Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
  }
}

async function testUndici() {
  console.log("Testing Undici HTTP client against Cloudflare...");

  try {
    console.log("\n--- Testing Warframe Items API ---");
    const items = await makeRequest("https://api.warframe.market/v1/items");
    console.log("Items API - Success! Got", items?.payload?.items?.length || 0, "items");

    console.log("\n--- Testing Single Item API ---");
    const singleItem = await makeRequest("https://api.warframe.market/v1/items/ash_prime_set");
    console.log("Single Item API - Success! Got item:", singleItem?.payload?.item?.item_name);

    console.log("\n--- Testing Orders API (most likely to be blocked) ---");
    const orders = await makeRequest("https://api.warframe.market/v1/items/ash_prime_set/orders");
    console.log("Orders API - Success! Got", orders?.payload?.orders?.length || 0, "orders");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
  }
}

testUndici();
