import server from "./Express/ExpressSetup";
import { MongooseServer } from "./database";
import { Warframe } from "./warframe";

async function main() {
    await MongooseServer.startConnectionPromise();
    console.log("Start express");
    const m = new Warframe();
    server.getJson('/', async (req: Request): Promise<any> => {
        const results = await m.getItemsDatabaseServer();
        return results;
    });
    server.postJson('/set', async (req: Request): Promise<any> => {
        const results = await m.getSet(req.body as any);
        return results;
    });
}

main();