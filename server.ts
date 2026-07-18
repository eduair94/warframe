import "./env";
import { Request } from 'express';
import server from "./Express/ExpressSetup";
import { serverConfig } from "./Express/config";
import { MongooseServer } from "./database";
import { Warframe } from "./warframe";
import { startCacheWarmer } from "./services/CacheWarmer";
import { TranslationService } from "./services/TranslationService";

async function main() {
    await MongooseServer.startConnectionPromise();
    console.log("Start express");
    const m = new Warframe();
    server.getJsonCache('/', async (req: Request): Promise<any> => {
        const results = await m.getItemsDatabaseServer();
        return results;
    });
    server.getJson('set/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getSet(url_name);
        return results;
    });
    server.getJsonCache('sets_comparison', async (req: Request): Promise<any> => {
        const sets = await m.getSetsComparison();
        return { sets };
    });
    server.getJsonCache('relics_ev', async (req: Request): Promise<any> => {
        const relics = await m.getRelicsEv();
        return { relics };
    });
    server.getJson('rivens', async (req: Request): Promise<any> => {
        return m.rivenMods();
    });   
    server.getJson('relics', async (req: Request): Promise<any> => {
        return m.relics();
    });
    // i18n: localized `{ slug -> name }` dictionary for one game-noun scope +
    // language. English needs no dictionary (names are already the canonical
    // `item_name`). Scope/lang are whitelisted so the cache (keyed by URL) can't
    // be flooded with arbitrary keys. Cached like the other read aggregates.
    server.getJsonCache('i18n/:scope/:lang', async (req: Request): Promise<any> => {
        const { scope, lang } = req.params;
        if (!TranslationService.isValidScope(scope) || !TranslationService.isValidLang(lang)) {
            return { scope, lang, map: {} };
        }
        const map = await m.getTranslations(scope, lang);
        return { scope, lang, map };
    });
    server.getJsonProtected('build_relics', async (req: Request): Promise<any> => {
         return m.buildRelics();
    });
    server.getJson('relic/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getRelic(url_name);
        return results;
    });
    // Live order-book depth (price levels + quantities) for the "bulk buy/sell"
    // modeler — fetched on demand when a details dialog opens, walked client-side.
    server.getJson('orders/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        return m.getOrderBook(url_name);
    });
    // Star Chart: planets → nodes ranked by expected plat/run (WFCD drop chances
    // joined with live market prices). Cached like the other aggregate views.
    server.getJsonCache('drops/map', async (req: Request): Promise<any> => {
        return m.getDropsMap();
    });
    // Drop-locations dialog: where a single item drops (missions + relics).
    server.getJsonCache('drops/item/:name', async (req: Request): Promise<any> => {
        const name = req.params.name;
        return m.getItemDrops(name);
    });
    // Refreshes the WFCD drop-data backup in Mongo (protected: triggers a real fetch).
    server.getJsonProtected('build_drops', async (req: Request): Promise<any> => {
        return m.syncDrops();
    });
    server.getJson('price_history/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getPriceHistory(url_name);
        return results;
    });
    // Cross-item analytics feed (Screener, Top Movers, Volatility, Buy/Sell
    // timing, Vault Spikes). One document per item joined with its daily price
    // history - cached like the other aggregate views.
    server.getJsonCache('market_analytics', async (req: Request): Promise<any> => {
        return m.getMarketAnalytics();
    });
    // Endo Exchange (mod flipping): every rank-able mod with a stored per-rank
    // flip ladder, for the endo->plat tool. Cached like the other aggregates;
    // the client (useEndoValue) computes best buy-rank / profit / plat-per-endo.
    server.getJsonCache('endo_flip', async (req: Request): Promise<any> => {
        return m.getEndoFlip();
    });
    // Riven fair-value page: weapon picker list + one weapon's auction corpus.
    server.getJsonCache('riven_weapons', async (req: Request): Promise<any> => {
        const weapons = await m.getRivenWeaponsList();
        return { weapons };
    });
    server.getJson('riven_value/:weapon', async (req: Request): Promise<any> => {
        const weapon = req.params.weapon;
        const results = await m.getRivenValueData(weapon);
        return results || { url_name: weapon, items: [] };
    });

    // Keep the heavy aggregate routes permanently warm so their stale copy never
    // ages out — otherwise a cold ~20s recompute reaches Cloudflare and times out
    // to a 502. See services/CacheWarmer.ts.
    startCacheWarmer(serverConfig.port);
}

main();