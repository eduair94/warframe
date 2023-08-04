import { MongooseServer } from "./database";
import { Warframe } from "./warframe";

async function main() {
    await MongooseServer.startConnectionPromise();
    const m = new Warframe();
    console.time('warframe');
    await m.getSaveRivens();
    console.timeEnd('warframe');
}

main();