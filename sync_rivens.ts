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
  log('🚀', 'Starting Rivens Sync Process...', colors.bright);
  
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected successfully', colors.green);
    
    const m = new WarframeUndici();
    const startTime = Date.now();
    
    log('🔫', 'Fetching riven items from API...', colors.blue);
    log('📝', 'Saving riven items to database...', colors.yellow);
    
    await m.getSaveRivens();
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'RIVENS SYNC COMPLETE!', colors.bright + colors.green);
    console.log('='.repeat(60));
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
