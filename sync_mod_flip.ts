/**
 * Endo Exchange bootstrap sync — refreshes the per-rank mod-flip ladder for
 * MODS ONLY, so the /endo_flip board can populate without waiting for a full
 * catalogue sync.
 *
 * It reuses the exact same fetch as the daily price sync
 * (getWarframeItemOrders -> MarketService.getItemPrices), which now also returns
 * the per-rank `flip` block (unranked..maxRank ask/bid ladder + 48h stat blocks)
 * extracted from the same orders + statistics calls — no extra requests per mod.
 * The result is saved onto each mod's `market` sub-doc (flip nested inside), the
 * same shape the daily sync stores going forward.
 *
 * Run:  npx ts-node sync_mod_flip.ts     (or the project's ts runner)
 */
import "./env";
import { MongooseServer } from "./database";
import { Item } from "./interface";
import WarframeUndici from "./warframe-undici";

const CONCURRENCY_LIMIT = parseInt(process.env.CONCURRENCY || '20', 10);
const MIN_DELAY = parseInt(process.env.MIN_DELAY || '150', 10);
const MAX_DELAY = parseInt(process.env.MAX_DELAY || '400', 10);
// Ops/test knobs: cap how many mods to sync, or target specific slugs
// (comma-separated), e.g. MOD_SLUGS=serration,vitality MODS_LIMIT=5.
const MODS_LIMIT = parseInt(process.env.MODS_LIMIT || '0', 10);
const MOD_SLUGS = (process.env.MOD_SLUGS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function log(icon: string, message: string) {
  const ts = new Date().toISOString().replace('T', ' ').split('.')[0];
  console.log(`[${ts}] ${icon} ${message}`);
}

/** A mod we can flip on an endo basis: tagged `mod`, rank-able, not an arcane. */
function isFlippableMod(item: any): boolean {
  const set0 = item?.items_in_set?.[0];
  if (!set0) return false;
  const tags: string[] = set0.tags || [];
  const maxRank = Number(set0.mod_max_rank) || 0;
  if (maxRank <= 0) return false;
  if (!tags.includes('mod')) return false;
  // Arcanes rank by combining duplicates (not endo); Requiem by charges/Kuva.
  if (tags.includes('arcane_enhancement') || tags.includes('requiem')) return false;
  return true;
}

async function main() {
  log('🚀', 'Endo Exchange mod-flip sync starting…');
  log('⚙️', `Concurrency=${CONCURRENCY_LIMIT}, Delay=${MIN_DELAY}-${MAX_DELAY}ms`);
  try {
    await MongooseServer.startConnectionPromise();
    log('✅', 'MongoDB connected');

    const m = new WarframeUndici({ minDelay: MIN_DELAY, maxDelay: MAX_DELAY, maxRetries: 5 });

    const all = await m.getItemsDatabaseDate();
    let mods = (all as any[]).filter(isFlippableMod);
    if (MOD_SLUGS.length) mods = mods.filter((it) => MOD_SLUGS.includes(String(it.url_name).toLowerCase()));
    if (MODS_LIMIT > 0) mods = mods.slice(0, MODS_LIMIT);
    log('📊', `Found ${mods.length} rank-able mods (of ${all.length} items)${MOD_SLUGS.length || MODS_LIMIT ? ' [filtered]' : ''}`);

    let ok = 0;
    let skipped = 0;
    let errors = 0;
    let withLadder = 0;

    async function processEntry(item: Item) {
      try {
        const market: any = await m.getWarframeItemOrders(item as any);
        if (!market || market.not_found) { skipped++; return; }
        // Never overwrite good data with an all-zero read.
        const allZero = !market.buy && !market.sell && !market.volume && !market.avg_price && !market.flip;
        if (allZero) { skipped++; return; }
        if (market.flip && Array.isArray(market.flip.ranks)) withLadder++;
        await m.saveItem(item.id, { market, priceUpdate: new Date() });
        ok++;
      } catch (e: any) {
        errors++;
        log('❌', `${item.url_name}: ${e?.message}`);
      }
    }

    const total = Math.ceil(mods.length / CONCURRENCY_LIMIT);
    for (let i = 0; i < mods.length; i += CONCURRENCY_LIMIT) {
      const batch = i / CONCURRENCY_LIMIT + 1;
      const chunk = mods.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.all(chunk.map((it: any) => processEntry(it as Item)));
      log('🔄', `Batch ${batch}/${total} — ✅ ${ok} · 🪜 ${withLadder} ladders · ⚠️ ${skipped} · ❌ ${errors}`);
    }

    log('🎉', `Done. Updated ${ok} mods (${withLadder} with a flip ladder), skipped ${skipped}, errors ${errors}.`);
    process.exit(0);
  } catch (e: any) {
    log('💥', `Fatal: ${e?.message}`);
    console.error(e);
    process.exit(1);
  }
}

main();
