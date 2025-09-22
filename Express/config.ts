const serverConfig = {
  port: process.env.API_PORT ? parseInt(process.env.API_PORT) : 3529,
};

export { serverConfig };

// Sleep function with promise receiving ms as parameter, await promise, setTimeout 100
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
