import "./env";
import { Request } from 'express';
import server from "./Express/ExpressSetup";
import { MongooseServer } from "./database";
import { Warframe } from "./warframe";

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
    server.getJsonProtected('build_relics', async (req: Request): Promise<any> => {
         return m.buildRelics();
    });
    server.getJson('relic/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getRelic(url_name);
        return results;
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
}

main();