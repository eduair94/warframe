import "./env";
import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";
import { TRANSLATION_LANGS, TRANSLATION_SCOPES } from "./constants";
import type { TranslationMap } from "./services/TranslationService";

/**
 * Translation collector.
 *
 * Reuses warframe.market's own localized names to build `{ slug -> name }`
 * dictionaries for every game noun (items, riven weapons/attributes,
 * lich/sister weapons/quirks/ephemeras, npcs, missions, locations) in every
 * language the market serves. One list request per (scope, language) — the
 * `Language:` request header makes the v2 API return `i18n.{en, <lang>}` for
 * that call, so no per-entity requests are needed.
 *
 * English is the canonical language (already stored as `item_name`), so only
 * NON-EN dictionaries are collected, and a value is stored ONLY when it differs
 * from the English name (the frontend falls back to English for any missing
 * key — this keeps dictionaries small, e.g. weapon names identical across
 * languages are omitted).
 *
 * Runs slowly / on a daily cadence: these dictionaries change only when DE ships
 * new content. Pacing + retries are inherited from the undici HTTP client.
 *
 *   npm run sync_translations
 */

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m', magenta: '\x1b[35m', dim: '\x1b[2m',
};

// Delay between (scope, lang) requests, on top of the HTTP client's own pacing.
const BATCH_DELAY = parseInt(process.env.TRANSLATION_BATCH_DELAY || '1200', 10);

function log(icon: string, message: string, color: string = colors.reset) {
  const ts = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`${colors.cyan}[${ts}]${colors.reset} ${icon} ${color}${message}${colors.reset}`);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Builds a `{ slug -> localized name }` map for one scope+lang from a v2 list
 * response. `nameField` is 'name' for most scopes, 'nodeName' for locations.
 * Only entities whose localized value exists AND differs from the English value
 * are stored.
 */
function buildMap(data: any[], lang: string, nameField: string): TranslationMap {
  const map: TranslationMap = {};
  for (const entity of data) {
    const slug = entity?.slug;
    if (!slug) continue;
    const i18n = entity?.i18n || {};
    const localized = i18n?.[lang]?.[nameField];
    const en = i18n?.en?.[nameField];
    if (localized && localized !== en) {
      map[slug] = localized;
    }
  }
  return map;
}

async function main() {
  log('🌐', 'Starting Translation Sync...', colors.bright);
  log('⚙️', `Scopes=${TRANSLATION_SCOPES.length}, Langs=${TRANSLATION_LANGS.length}, BatchDelay=${BATCH_DELAY}ms`, colors.dim);

  try {
    log('🔌', 'Connecting to MongoDB...', colors.blue);
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected', colors.green);

    const client = new WarframeUndici({ minDelay: 600, maxDelay: 1800, maxRetries: 6 });
    const startTime = Date.now();

    let saved = 0;
    let failed = 0;

    for (const { scope, path, nameField } of TRANSLATION_SCOPES) {
      log('📦', `Scope: ${scope} (${path})`, colors.magenta);

      for (const lang of TRANSLATION_LANGS) {
        try {
          const res: any = await client.getLocalizedCollection(path, lang);
          const data: any[] = res?.data || [];

          const map = buildMap(data, lang, nameField);
          await client.saveTranslations(scope, lang, map);
          saved++;
          log('  ✓', `${scope}/${lang}: ${Object.keys(map).length}/${data.length} localized`, colors.green);

          // Locations carry a second localizable field (systemName / planet),
          // captured from the SAME response as a synthetic scope — no extra call.
          if (scope === 'locations') {
            const sysMap = buildMap(data, lang, 'systemName');
            await client.saveTranslations('location-systems', lang, sysMap);
            log('  ✓', `location-systems/${lang}: ${Object.keys(sysMap).length}/${data.length} localized`, colors.green);
          }
        } catch (err: any) {
          failed++;
          log('  ✗', `${scope}/${lang} failed: ${err?.message}`, colors.red);
        }
        await sleep(BATCH_DELAY);
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n' + '='.repeat(60));
    log('🎉', 'TRANSLATION SYNC COMPLETE', colors.bright + colors.green);
    console.log('='.repeat(60));
    log('✅', `Dictionaries saved: ${saved}`, colors.green);
    log('❌', `Failed: ${failed}`, colors.red);
    log('⏱️', `Total time: ${totalTime}s`, colors.magenta);
    console.log('='.repeat(60) + '\n');

    process.exit(failed > 0 && saved === 0 ? 1 : 0);
  } catch (error: any) {
    log('💥', `Fatal error: ${error?.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

main();
