import { MongooseServer } from "./database";
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

// Performance configuration
const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY || '30', 10);
const MIN_DELAY = parseInt(process.env.MIN_DELAY || '100', 10);
const MAX_DELAY = parseInt(process.env.MAX_DELAY || '300', 10);

// Check if we should force v2 enrichment for all items
const FORCE_V2_ENRICHMENT = process.env.FORCE_V2 === 'true';

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

/**
 * Check if an item needs v2 enrichment
 * @param itemDB - The item from database
 * @returns true if the item needs to be updated with v2 data
 */
function needsV2Enrichment(itemDB: any): boolean {
  if (FORCE_V2_ENRICHMENT) return true;
  
  // Item was never enriched with v2 data
  if (!itemDB.v2_enriched) return true;
  
  return false;
}

async function main() {
  log('🚀', 'Starting Items Sync Process...', colors.bright);
  log('⚙️', `Config: Concurrency=${CONCURRENCY_LIMIT}, Delay=${MIN_DELAY}-${MAX_DELAY}ms`, colors.dim);
  if (FORCE_V2_ENRICHMENT) {
    log('🔄', 'FORCE_V2=true - Will re-enrich all items with v2 API data', colors.yellow);
  }
  
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected successfully', colors.green);
    
    // Create client with optimized settings for bulk sync
    const m = new WarframeUndici({
      minDelay: MIN_DELAY,
      maxDelay: MAX_DELAY,
      maxRetries: 5,
      priceConfig: {
        ordersMinDelay: 0,
        ordersMaxDelay: 0,
        statsMinDelay: 0,
        statsMaxDelay: 0
      }
    });
    const startTime = Date.now();
    
    log('📦', 'Fetching items from Warframe Market API...', colors.blue);
    const res = await m.getWarframeItems();
    // Map v2 API fields to v1 format for database compatibility
    const items = res.data.map((item: any) => ({
      ...item,
      url_name: item.slug,  // v2 uses 'slug' instead of 'url_name'
      item_name: item.i18n?.en?.name || item.slug,  // v2 uses i18n.en.name
      thumb: item.i18n?.en?.thumb || '',  // v2 uses i18n.en.thumb
    }));
    log('📊', `Found ${items.length} items from API`, colors.magenta);
    log('⚡', `Processing with concurrency limit: ${CONCURRENCY_LIMIT}`, colors.blue);
    
    let idx = 0;
    let newItems = 0;
    let updatedItems = 0;
    let skippedItems = 0;
    let errorCount = 0;
    
    startActivityMonitor();
    
    // Process in batches for better concurrency
    const totalBatches = Math.ceil(items.length / CONCURRENCY_LIMIT);
    
    for (let batchIdx = 0; batchIdx < items.length; batchIdx += CONCURRENCY_LIMIT) {
      const batchNum = Math.floor(batchIdx / CONCURRENCY_LIMIT) + 1;
      const chunk = items.slice(batchIdx, batchIdx + CONCURRENCY_LIMIT);
      
      process.stdout.write('\r' + ' '.repeat(60) + '\r');
      log('🔄', `Batch ${batchNum}/${totalBatches} - Processing ${chunk.length} items...`, colors.blue);
      
      const batchResults = await Promise.all(chunk.map(async (item: any) => {
        updateActivity();
        try {
          const itemDB = await m.getSingleItemDB(item);
          
          if (!itemDB) {
            // New item - fetch and save with v2 enrichment
            if (newItems < 5) {
              log('➕', `New item: ${item.url_name}`, colors.green);
            }
            const itemData = await m.getSingleItemData(item);
            const itemToSave = itemData.payload.item;
            await m.saveItem(itemToSave.id, { ...itemToSave, ...item });
            return { status: 'new' };
          } else if (needsV2Enrichment(itemDB)) {
            // Existing item needs v2 enrichment
            if (updatedItems < 5) {
              log('🔄', `Updating v2 data: ${item.url_name}`, colors.yellow);
            }
            const itemData = await m.getSingleItemData(item);
            const itemToSave = itemData.payload.item;
            // Preserve existing market data and priceUpdate, but update with new v2 enriched data
            await m.saveItem(itemToSave.id, {
              ...itemToSave,
              ...item,
              market: itemDB.market,
              priceUpdate: itemDB.priceUpdate
            });
            return { status: 'updated' };
          } else {
            return { status: 'skipped' };
          }
        } catch (error: any) {
          log('❌', `Error: ${item.url_name} - ${error.message}`, colors.red);
          return { status: 'error' };
        }
      }));
      
      // Count results
      for (const result of batchResults) {
        idx++;
        if (result.status === 'new') newItems++;
        else if (result.status === 'updated') updatedItems++;
        else if (result.status === 'skipped') skippedItems++;
        else if (result.status === 'error') errorCount++;
      }
      
      // Progress log after each batch
      const progress = ((idx / items.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (idx / (Date.now() - startTime) * 1000).toFixed(1);
      const eta = idx > 0 ? Math.round((items.length - idx) / (idx / (Date.now() - startTime) * 1000)) : 0;
      
      log('📈', `Progress: ${idx}/${items.length} (${progress}%) | ➕ ${newItems} | 🔄 ${updatedItems} | ⏭️ ${skippedItems} | ❌ ${errorCount} | ⏱️ ${elapsed}s | ${rate}/s | ETA: ${eta}s`, colors.cyan);
    }
    
    stopActivityMonitor();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'ITEMS SYNC COMPLETE!', colors.bright + colors.green);
    console.log('='.repeat(60));
    log('📊', `Total items checked: ${idx}`, colors.cyan);
    log('➕', `New items added: ${newItems}`, colors.green);
    log('🔄', `Updated with v2 data: ${updatedItems}`, colors.yellow);
    log('⏭️', `Already up-to-date: ${skippedItems}`, colors.dim);
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
