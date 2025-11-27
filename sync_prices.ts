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
  dim: '\x1b[2m',
};

function log(icon: string, message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

// Live status indicator
let lastActivityTime = Date.now();
let activityInterval: NodeJS.Timeout;

function startActivityMonitor() {
  activityInterval = setInterval(() => {
    const timeSinceActivity = Math.floor((Date.now() - lastActivityTime) / 1000);
    if (timeSinceActivity > 5) {
      process.stdout.write(`\r${colors.yellow}⏳ Waiting for API response... (${timeSinceActivity}s)${colors.reset}   `);
    }
  }, 1000);
}

function stopActivityMonitor() {
  if (activityInterval) clearInterval(activityInterval);
}

function updateActivity() {
  lastActivityTime = Date.now();
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
    let inFlightCount = 0;
    const concurrencyLimit = 20;
    
    async function processEntry(item: Item) {
      inFlightCount++;
      const itemStart = Date.now();
      
      try {
        updateActivity();
        const market = await m.getWarframeItemOrders(item);
        updateActivity();
        
        const duration = Date.now() - itemStart;
        
        if (market) {
          if (market.not_found) {
            log('🗑️', `Removed: ${item.url_name} (${duration}ms)`, colors.yellow);
            await m.removeItemDB(item.id);
            removedCount++;
          } else {
            await m.saveItem(item.id, { market, priceUpdate: new Date() });
            successCount++;
            // Show individual item completion for first few items
            if (idx < 5) {
              log('✓', `${item.url_name} synced (${duration}ms)`, colors.dim);
            }
          }
        }
      } catch (error: any) {
        log('❌', `Error: ${item.url_name} - ${error.message}`, colors.red);
        errorCount++;
      } finally {
        inFlightCount--;
      }
    }
    
    log('📦', 'Fetching items from database...', colors.blue);
    const items = await m.getItemsDatabaseDate();
    log('📊', `Found ${items.length} items to sync`, colors.magenta);
    
    log('⚡', `Processing with concurrency limit: ${concurrencyLimit}`, colors.blue);
    log('⏳', 'Starting first batch...', colors.yellow);
    
    startActivityMonitor();
    
    // Process in batches
    let batchNum = 0;
    const totalBatches = Math.ceil(items.length / concurrencyLimit);
    
    for (let i = 0; i < items.length; i += concurrencyLimit) {
      batchNum++;
      const batchStart = Date.now();
      const chunk = items.slice(i, i + concurrencyLimit);
      
      // Clear activity line and show batch start
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
      log('🔄', `Batch ${batchNum}/${totalBatches} - Processing ${chunk.length} items...`, colors.blue);
      
      await Promise.all(chunk.map((item: Item) => processEntry(item)));
      
      idx += chunk.length;
      const batchDuration = ((Date.now() - batchStart) / 1000).toFixed(1);
      const progress = ((idx / items.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (idx / (Date.now() - startTime) * 1000).toFixed(1);
      const eta = idx > 0 ? Math.round((items.length - idx) / (idx / (Date.now() - startTime) * 1000)) : 0;
      
      log('📈', `Progress: ${idx}/${items.length} (${progress}%) | ✅ ${successCount} | ❌ ${errorCount} | 🗑️ ${removedCount} | ⏱️ ${elapsed}s | ${rate}/s | ETA: ${eta}s`, colors.cyan);
    }
    
    stopActivityMonitor();
    
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
    stopActivityMonitor();
    log('💥', `Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
