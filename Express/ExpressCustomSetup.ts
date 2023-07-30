import Express from "./Express";

function custom_server(port: number): Express {
  const server = new Express(port, "/", { siteKey: null, secretKey: null });
  return server;
}

export default custom_server;
