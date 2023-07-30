import { serverConfig } from "./config";
import Express from "./Express";

const server = new Express(serverConfig.port, "/", {
  siteKey: "",
  secretKey: "",
});
export default server;
