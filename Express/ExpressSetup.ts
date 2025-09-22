import { serverConfig } from "./config";
import Express from "./Express";

const server = new Express(serverConfig.port, "/", {
  siteKey: process.env.RECAPTCHA_SITE_KEY || "",
  secretKey: process.env.RECAPTCHA_SECRET_KEY || "",
});
export default server;
