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
};

function log(icon: string, message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

async function main() {
  log('🚀', 'Starting Items Sync Process...', colors.bright);
  
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected successfully', colors.green);
    
    const m = new WarframeUndici();
    const startTime = Date.now();
    
    log('📦', 'Fetching items from Warframe Market API...', colors.blue);
    const res = await m.getWarframeItems();
    const items = res.payload.items;
    log('📊', `Found ${items.length} items from API`, colors.magenta);
    
    let idx = 0;
    let newItems = 0;
    let skippedItems = 0;
    let errorCount = 0;
    
    for (const item of items) {
      idx++;
      
      try {
        const itemDB = await m.getSingleItemDB(item);
        
        if (!itemDB) {
          log('➕', `New item found: ${item.url_name}`, colors.green);
          const itemData = await m.getSingleItemData(item);
          const itemToSave = itemData.payload.item;
          await m.saveItem(itemToSave.id, { ...itemToSave, ...item });
          newItems++;
        } else {
          skippedItems++;
        }
        
        // Progress log every 100 items or at milestones
        if (idx % 100 === 0 || idx === items.length) {
          const progress = ((idx / items.length) * 100).toFixed(1);
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          log('📈', `Progress: ${idx}/${items.length} (${progress}%) | ➕ ${newItems} new | ⏭️ ${skippedItems} skipped | ⏱️ ${elapsed}s`, colors.cyan);
        }
      } catch (error: any) {
        log('❌', `Error processing ${item.url_name}: ${error.message}`, colors.red);
        errorCount++;
      }
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'ITEMS SYNC COMPLETE!', colors.bright + colors.green);
    console.log('='.repeat(60));
    log('📊', `Total items checked: ${idx}`, colors.cyan);
    log('➕', `New items added: ${newItems}`, colors.green);
    log('⏭️', `Already in DB: ${skippedItems}`, colors.yellow);
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
