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
const MIN_DELAY = parseInt(process.env.MIN_DELAY || '100', 10);
const MAX_DELAY = parseInt(process.env.MAX_DELAY || '300', 10);

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

async function main() {
  log('🚀', 'Starting Rivens Sync Process...', colors.bright);
  log('⚙️', `Config: Delay=${MIN_DELAY}-${MAX_DELAY}ms`, colors.dim);
  
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
    
    log('🔫', 'Fetching riven items from API...', colors.blue);
    log('📝', 'Saving riven items to database...', colors.yellow);
    
    startActivityMonitor();
    
    await m.getSaveRivens();
    
    stopActivityMonitor();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'RIVENS SYNC COMPLETE!', colors.bright + colors.green);
    console.log('='.repeat(60));
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
