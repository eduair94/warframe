import { MongooseServer } from "./database";
import { Item } from "./interface";
import WarframeUndici from "./warframe-undici";

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(icon: string, message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

async function main() {
  log('🚀', 'Starting Price Sync Process...', colors.bright);
  
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected successfully', colors.green);
    
    const m = new WarframeUndici();
    const startTime = Date.now();
    
    let idx = 0;
    let successCount = 0;
    let errorCount = 0;
    let removedCount = 0;
    const concurrencyLimit = 20;
    
    async function processEntry(item: Item) {
      try {
        const market = await m.getWarframeItemOrders(item);
        if (market) {
          if (market.not_found) {
            log('🗑️', `Removing not found item: ${item.url_name}`, colors.yellow);
            await m.removeItemDB(item.id);
            removedCount++;
          } else {
            await m.saveItem(item.id, { market, priceUpdate: new Date() });
            successCount++;
          }
        }
      } catch (error: any) {
        log('❌', `Error processing ${item.url_name}: ${error.message}`, colors.red);
        errorCount++;
      }
    }
    
    log('📦', 'Fetching items from database...', colors.blue);
    const items = await m.getItemsDatabaseDate();
    log('📊', `Found ${items.length} items to sync`, colors.magenta);
    
    const processQueue = items.map((entry: Item) => {
      return async () => {
        await processEntry(entry);
        idx++;
        
        // Progress log every 20 items (matching concurrency) or at milestones
        if (idx % 20 === 0 || idx === items.length || idx === 1) {
          const progress = ((idx / items.length) * 100).toFixed(1);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = idx > 0 ? (idx / (Date.now() - startTime) * 1000).toFixed(1) : '0';
          log('📈', `Progress: ${idx}/${items.length} (${progress}%) | ✅ ${successCount} | ❌ ${errorCount} | 🗑️ ${removedCount} | ⏱️ ${elapsed}s | ${rate} items/s`, colors.cyan);
        }
      };
    });
    
    log('⚡', `Processing with concurrency limit: ${concurrencyLimit}`, colors.blue);
    log('⏳', 'First batch starting... (this may take a moment)', colors.yellow);
    
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const chunk = processQueue.slice(i, i + concurrencyLimit);
      await Promise.all(chunk.map((fn: any) => fn()));
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'PRICE SYNC COMPLETE!', colors.bright + colors.green);
    console.log('='.repeat(60));
    log('📊', `Total items processed: ${idx}`, colors.cyan);
    log('✅', `Successfully updated: ${successCount}`, colors.green);
    log('🗑️', `Removed (not found): ${removedCount}`, colors.yellow);
    log('❌', `Errors: ${errorCount}`, colors.red);
    log('⏱️', `Total time: ${totalTime}s`, colors.magenta);
    console.log('='.repeat(60) + '\n');
    
    process.exit(0);
  } catch (error: any) {
    log('💥', `Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
