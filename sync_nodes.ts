import "./env";
import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m', magenta: '\x1b[35m',
};

function log(icon: string, message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

/**
 * Refreshes the star-chart node-metadata backup ({ key: 'nodes' } in
 * warframe-drops): faction, mission type and enemy-level range from WFCD
 * Node.json + solNodes. Powers the /mission pages. WFCD only changes on a game
 * patch, so schedule this (pm2/cron); a failed fetch throws without touching Mongo.
 */
async function main() {
  log('🚀', 'Starting Node Metadata Sync...', colors.bright);
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected', colors.green);

    const m = new WarframeUndici();
    const result = await m.syncNodes();

    log('🛰️', `Nodes synced: ${result.nodes}`, colors.magenta);
    log('🎉', 'NODE SYNC COMPLETE', colors.bright + colors.green);
    process.exit(0);
  } catch (error: any) {
    log('💥', `Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
