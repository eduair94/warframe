import "./env";
import { MongooseServer } from "./database";
import { isIncompleteSetRoster } from "./services/SetService";
import WarframeUndici from "./warframe-undici";

/**
 * @fileoverview Targeted repair for set docs with a degenerate `items_in_set`
 * roster (only their own entry).
 *
 * A set item v2-enriched during its post-launch window — before warframe.market
 * published the set's `setParts` — is stored with just its own roster entry and
 * stamped `v2_enriched: true`. It then sticks: `/set_full` throws "Not a set",
 * `/set` shows zero parts, and until the next item sync nothing re-reads it.
 * (See {@link isIncompleteSetRoster} and services/SetService.)
 *
 * `sync_items`'s `needsV2Enrichment` now re-enriches these on its nightly run,
 * and that is the long-term fix. This script is the *targeted, fast* version the
 * deploy runs one-shot (like sync-translations / sync-foundry): it scans only
 * the set docs, re-enriches the degenerate ones, and exits — so a Prime released
 * between nightly syncs is healed on the next deploy instead of the next
 * midnight. It uses the same proxy-capable client + retry budget as sync_items,
 * which is the only environment that reliably pulls warframe.market's throttled
 * `/v2/items` catalogue (the API server process cannot).
 *
 * Idempotent: a set whose roster is already complete is skipped, and a set whose
 * `setParts` warframe.market still has not published stays untouched rather than
 * being rewritten with another lone entry.
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(icon: string, message: string, color: string = colors.reset): void {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

async function main(): Promise<void> {
  log('🩹', 'Starting Set Roster Repair...', colors.blue);

  try {
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected', colors.green);

    // Same client tuning as sync_items — the proven config for getting through
    // warframe.market's rate limiting on the item catalogue.
    const m = new WarframeUndici({
      minDelay: parseInt(process.env.MIN_DELAY || '500', 10),
      maxDelay: parseInt(process.env.MAX_DELAY || '1500', 10),
      maxRetries: 5,
    });

    const items = await m.getItemsDatabase();
    const broken = items.filter((it: any) => isIncompleteSetRoster(it));

    log('🔎', `Scanned ${items.length} items — ${broken.length} degenerate set roster(s)`, colors.yellow);
    if (broken.length === 0) {
      log('✨', 'Nothing to repair.', colors.green);
      process.exit(0);
    }

    let repaired = 0;
    let stillLagging = 0;
    let errors = 0;

    for (const doc of broken) {
      const urlName = doc.url_name;
      try {
        const fresh = (await m.getSingleItemData({ url_name: urlName }))?.payload?.item;

        // Upstream still has not published this set's siblings — leave the doc as
        // it is rather than overwriting with another lone-entry roster.
        if (!fresh?.id || isIncompleteSetRoster(fresh)) {
          stillLagging++;
          log('⏭️', `${urlName}: setParts not published yet — skipped`, colors.dim);
          continue;
        }

        // Rewrite from the freshly-enriched doc, preserving the market block and
        // priceUpdate (the detail fetch carries no live prices), exactly as the
        // sync_items "updated" path does.
        await m.saveItem(fresh.id, {
          ...fresh,
          market: doc.market,
          priceUpdate: doc.priceUpdate,
        });
        repaired++;
        const parts = Array.isArray(fresh.items_in_set) ? fresh.items_in_set.length : 0;
        log('🔧', `${urlName}: roster rebuilt (${parts} entries)`, colors.green);
      } catch (err: any) {
        errors++;
        log('❌', `${urlName}: ${err?.message || err}`, colors.red);
      }
    }

    log('🎉', `Repair complete — ${repaired} fixed, ${stillLagging} lagging, ${errors} errors`, colors.green);
    process.exit(0);
  } catch (err: any) {
    log('💥', `Fatal: ${err?.message || err}`, colors.red);
    console.error(err);
    process.exit(1);
  }
}

main();
