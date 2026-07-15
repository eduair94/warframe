import "./env";
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

function log(icon: string, message: string, color: string = colors.reset) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

/**
 * Refreshes the WFCD drop data in Mongo — BOTH the drop-data backup (the
 * `warframe-drops` map/index that powers the Star Chart, the drop dialog, and the
 * relic EV board's "currently dropping" gate) AND the relic collection itself
 * (the intact-relic list + rewards that `/relics_ev` iterates).
 *
 * Both pull from the SAME WFCD source (relics.json / missionRewards.json), so
 * running them together keeps the relic set and the dropping-keys in lockstep —
 * otherwise a rotation (e.g. Varzia swapping the Prime Resurgence "Vanguard"
 * relics) would refresh the dropping-keys daily but leave the relic list stale,
 * lingering old Resurgence relics and never surfacing new ones.
 *
 * WFCD only changes when the game patches, so this is meant to be scheduled
 * (pm2/cron) rather than run continuously. A failed fetch throws without touching
 * Mongo, so the last-good backup survives an outage.
 */
async function main() {
  log('🚀', 'Starting Drops Sync Process...', colors.bright);

  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected successfully', colors.green);

    const m = new WarframeUndici();
    const startTime = Date.now();

    // Relic collection first (the `/relics_ev` source), then the drop map/index
    // that gates "currently dropping" — both off the same WFCD fetch.
    log('💠', 'Syncing relic collection (relics.json → DB)...', colors.blue);
    const relicResult = await m.buildRelics();
    log(
      relicResult?.success ? '✅' : '⚠️',
      `Relics synced: ${relicResult?.relics ?? 0}${relicResult?.error ? ` (error: ${relicResult.error})` : ''}`,
      relicResult?.success ? colors.green : colors.yellow,
    );

    log('🪐', 'Fetching WFCD mission + relic drop data...', colors.blue);
    const result = await m.syncDrops();

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'DROPS SYNC COMPLETE!', colors.bright + colors.green);
    console.log('='.repeat(60));
    log('💠', `Relics: ${relicResult?.relics ?? 0}`, colors.magenta);
    log('🌍', `Planets: ${result.planets}`, colors.magenta);
    log('📍', `Nodes: ${result.nodes}`, colors.magenta);
    log('🗂️', `Index entries: ${result.indexEntries}`, colors.magenta);
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
