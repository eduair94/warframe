import { MongooseServer } from "./database";
import WarframeUndici from "./warframe-undici";

async function main() {
  await MongooseServer.startConnectionPromise();
  const m = new WarframeUndici();
  console.time("warframe");
  await m.getSaveRivens();
  console.timeEnd("warframe");
}

main();
