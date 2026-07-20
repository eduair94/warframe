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
 * Rebuilds the Foundry mastery/build catalogue ({ key: 'catalogue' } in
 * warframe-foundry) from WFCD warframe-items: every masterable weapon, warframe,
 * companion and modular part, its crafting components, and the aggregated raw
 * resource requirements.
 *
 * It also re-links every item and part to its warframe.market url_name using
 * this app's own catalogue, which is what lets /foundry answer "what would the
 * gear I am still missing cost in platinum" — the thing a plain checklist can't.
 *
 * WFCD only changes on a game patch and the market names drift as items are
 * added, so a daily run (scheduled by pm2, staggered after the item sync) keeps
 * both halves current. A failed fetch throws WITHOUT touching Mongo, so the last
 * good catalogue keeps serving.
 */
async function main() {
  log('🚀', 'Starting Foundry Catalogue Sync...', colors.bright);
  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected', colors.green);

    const m = new WarframeUndici();
    const meta = await m.syncFoundry();

    log('🔨', `Items: ${meta.total} · resources: ${meta.resourceCount}`, colors.magenta);
    log('🏅', `Mastery points available from items: ${meta.maxItemPoints.toLocaleString()}`, colors.magenta);
    log('🎉', 'FOUNDRY SYNC COMPLETE', colors.bright + colors.green);
    process.exit(0);
  } catch (error: any) {
    log('💥', `Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
