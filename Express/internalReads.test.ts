import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import http, { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
import type { AddressInfo } from "net";
import Express from "./Express";
import { isDirectInternalRead } from "./internalReads";
import { INBOUND_RATE_LIMIT } from "../constants";

jest.mock("../utils", () => ({ bError: (error: string) => ({ error }) }));
jest.mock("../services/CacheService", () => ({
  cache: { getOrSet: (_key: string, _ttl: number, producer: () => Promise<unknown>) => producer() },
}));
jest.mock("../services/firebaseToken", () => ({
  firebaseAuth: {
    isEnabled: () => true,
    verify: async () => ({ uid: "same-verified-user" }),
  },
}));

function requestShape(overrides: Partial<Parameters<typeof isDirectInternalRead>[0]> = {}) {
  return {
    method: "GET",
    path: "/riven_weapons",
    socket: { remoteAddress: "127.0.0.1", localPort: 3529 },
    headers: { host: "127.0.0.1:3529" },
    ...overrides,
  };
}

describe("direct internal read boundary", () => {
  it.each([
    ["127.0.0.1", "127.0.0.1", 80],
    ["127.0.0.1", "127.0.0.1:3529", 3529],
    ["::1", "[::1]:1", 1],
    ["::ffff:127.0.0.1", "127.0.0.1:65535", 65535],
  ])("accepts a direct literal loopback request from %s to %s on port %s", (address, host, localPort) => {
    expect(isDirectInternalRead(requestShape({ socket: { remoteAddress: address, localPort }, headers: { host } }))).toBe(true);
  });

  it.each([undefined, "", "192.0.2.1", "10.0.0.1", "127.0.0.2", "::ffff:192.0.2.1", "::ffff:127.0.0.2"])(
    "rejects a nonapproved socket address %s even with a spoofed Express IP",
    (remoteAddress) => {
      const req = { ...requestShape({ socket: { remoteAddress, localPort: 3529 } }), ip: "127.0.0.1" };
      expect(isDirectInternalRead(req)).toBe(false);
    },
  );

  it.each([
    undefined, "", "localhost:3529", "api.example.com", "127.0.0.1.example.com",
    "127.1:3529", "2130706433:3529", "0x7f000001:3529", "0177.0.0.1:3529",
    "http://127.0.0.1:3529", "127.0.0.1@api.example.com", "api.example.com@127.0.0.1",
    "127.0.0.1:3529/path", "127.0.0.1:3529?x=1", "127.0.0.1:3529#x", "127.0.0.1.",
    "127.0.0.1:", "127.0.0.1:0", "127.0.0.1:65536", "127.0.0.1:123456",
    "127.0.0.1:-1", "127.0.0.1:+80", "127.0.0.1:80.0", "127.0.0.1:abc",
    "127.0.0.1:3529 ", " 127.0.0.1:3529", "::1", "::1:3529", "[::1]:0",
    "[::1]:65536", "[::1%lo]:3529", "[::ffff:7f00:1]:3529", "[::ffff:127.0.0.1]:3529", "127.0.0.1,api.example.com",
  ])("rejects a missing, nonliteral or malformed Host %s", (host) => {
    expect(isDirectInternalRead(requestShape({ headers: { host } }))).toBe(false);
  });

  it.each([undefined, 0, 80, 3528, 65536, NaN])("rejects a Host that does not match listening port %s", (localPort) => {
    expect(isDirectInternalRead(requestShape({ socket: { remoteAddress: "127.0.0.1", localPort } }))).toBe(false);
  });

  it.each([
    "forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-new-marker",
    "cf-connecting-ip", "cf-connecting-ipv6", "cf-ray", "cf-visitor", "cf-new-marker",
    "x-real-ip", "cdn-loop", "true-client-ip", "via", "Forwarded", "CF-Ray",
  ])("rejects proxy marker %s by presence, including an empty value", (name) => {
    for (const value of ["", "127.0.0.1", undefined]) {
      expect(isDirectInternalRead(requestShape({ headers: { host: "127.0.0.1:3529", [name]: value } }))).toBe(false);
    }
  });

  it.each(["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])("does not exempt %s", (method) => {
    expect(isDirectInternalRead(requestShape({ method }))).toBe(false);
  });

  it.each(["/build_relics", "/build_drops", "/build_nodes", "/build_foundry", "/BUILD_RELICS/extra", "/me", "/ME", "/me/sync"])(
    "does not exempt protected or account route %s", (path) => {
      expect(isDirectInternalRead(requestShape({ path }))).toBe(false);
    },
  );
});

describe("production Express rate limit middleware", () => {
  let listener: http.Server;
  let port: number;
  let previousAdminToken: string | undefined;

  const send = (path = "/read", headers: OutgoingHttpHeaders = {}, method = "GET") =>
    new Promise<{ status: number; headers: IncomingHttpHeaders; body: string }>((resolve, reject) => {
      const req = http.request({ host: "127.0.0.1", port, path, method, headers, agent: false }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on("error", reject);
      req.end();
    });

  beforeEach(async () => {
    previousAdminToken = process.env.ADMIN_SYNC_TOKEN;
    process.env.ADMIN_SYNC_TOKEN = "rate-limit-test-token";
    jest.spyOn(Express.prototype, "start").mockResolvedValue(undefined);
    jest.spyOn(console, "log").mockImplementation(() => {});
    const originalError = console.error;
    jest.spyOn(console, "error").mockImplementation((...args) => {
      // Existing trust-proxy configuration is outside this change. Preserve all
      // other diagnostic output; this known warning fires once per limiter.
      if ((args[0] as { code?: string })?.code !== "ERR_ERL_PERMISSIVE_TRUST_PROXY") originalError(...args);
    });
    const server = new Express(0, "/");
    const response = async () => ({ success: "ok", error: null });
    server.getJsonCache("read", response);
    server.postJson("write", response);
    server.getJsonProtected("build_test", response);
    server.getJsonAuth("me", response);
    listener = http.createServer(server.getApp());
    await new Promise<void>((resolve) => listener.listen(0, "127.0.0.1", resolve));
    port = (listener.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
    if (previousAdminToken === undefined) delete process.env.ADMIN_SYNC_TOKEN;
    else process.env.ADMIN_SYNC_TOKEN = previousAdminToken;
    jest.restoreAllMocks();
  });

  it("serves more than 60 SSR reads without consuming or depending on the public quota", async () => {
    for (let i = 0; i < INBOUND_RATE_LIMIT.MAX_REQUESTS + 10; i++) {
      const result = await send();
      expect(result.status).toBe(200);
      expect(result.headers["ratelimit-limit"]).toBeUndefined();
    }
    for (let i = 0; i < INBOUND_RATE_LIMIT.MAX_REQUESTS; i++) {
      expect((await send("/read", { host: "api.example.com" })).status).toBe(200);
    }
    const blocked = await send("/read", { host: "api.example.com" });
    expect(blocked.status).toBe(429);
    expect(blocked.headers["ratelimit-limit"]).toBe("60");
    expect(blocked.headers["retry-after"]).toBeDefined();
    expect((await send()).status).toBe(200);
  });

  it.each([
    { "cf-connecting-ip": "198.51.100.1" },
    { "x-forwarded-for": "127.0.0.1" },
    { "cf-ray": "" },
  ])("counts proxied or spoofed requests even with a loopback Host: %j", async (headers) => {
    for (let i = 0; i < INBOUND_RATE_LIMIT.MAX_REQUESTS; i++) {
      expect((await send("/read", headers)).status).toBe(200);
    }
    expect((await send("/read", headers)).status).toBe(429);
  });

  it("keeps direct loopback writes in the general quota", async () => {
    for (let i = 0; i < INBOUND_RATE_LIMIT.MAX_REQUESTS; i++) {
      expect((await send("/write", {}, "POST")).status).toBe(200);
    }
    expect((await send("/write", {}, "POST")).status).toBe(429);
  });

  it("keeps the independent protected-route limiter and token requirement", async () => {
    expect((await send("/build_test")).status).toBe(403);
    expect((await send("/build_test", { "x-admin-token": "rate-limit-test-token" })).status).toBe(200);
    const blocked = await send("/build_test", { "x-admin-token": "rate-limit-test-token" });
    expect(blocked.status).toBe(429);
    expect(blocked.body).toContain("Too many sync requests");
  });

  it("requires authentication and counts direct loopback account reads in the general quota", async () => {
    expect((await send("/me")).status).toBe(401);
    for (let i = 1; i < INBOUND_RATE_LIMIT.MAX_REQUESTS; i++) {
      expect((await send("/me", { authorization: "Bearer verified-test-token" })).status).toBe(200);
    }
    expect((await send("/me", { authorization: "Bearer verified-test-token" })).status).toBe(429);
  });

  it("preserves the separate per-user quota across different public IP buckets", async () => {
    for (let i = 0; i < INBOUND_RATE_LIMIT.AUTH_MAX_REQUESTS; i++) {
      const headers = { authorization: "Bearer verified-test-token", "x-forwarded-for": `198.51.100.${i + 1}` };
      expect((await send("/me", headers)).status).toBe(200);
    }
    const blocked = await send("/me", { authorization: "Bearer verified-test-token", "x-forwarded-for": "198.51.100.250" });
    expect(blocked.status).toBe(429);
    expect(blocked.headers["ratelimit-limit"]).toBe(String(INBOUND_RATE_LIMIT.AUTH_MAX_REQUESTS));
  });
});
