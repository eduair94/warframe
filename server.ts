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
    server.getJson('rivens', async (req: Request): Promise<any> => {
        return m.rivenMods();
    });   
    server.getJson('relics', async (req: Request): Promise<any> => {
        return m.relics();
    });
    server.getJson('build_relics', async (req: Request): Promise<any> => {
         return m.buildRelics();
    }); 
    server.getJson('relic/:url_name', async (req: Request): Promise<any> => {
        const url_name = req.params.url_name;
        const results = await m.getRelic(url_name);
        return results;
    });
}

main();