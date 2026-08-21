/**
 * Behaviour tests for the edge Worker (cloudflare/worker.js).
 *
 * This Worker is the only thing standing between an origin outage and a dead
 * site, and it is the one component that CANNOT be verified by hitting prod when
 * prod is down. So its contract is pinned here instead:
 *
 *   - a healthy origin response is stored twice: a short-TTL fresh copy AND a
 *     long-TTL backup, under DISTINCT cache keys;
 *   - when the origin is unhealthy (5xx, incl. Cloudflare 52x/53x tunnel
 *     errors) or unreachable, the backup is served;
 *   - when there is no backup either, the visitor gets our branded offline page
 *     / a structured 503 — never Cloudflare's raw "Error 1033" interstitial;
 *   - per-user responses never enter the cache.
 *
 * The Worker is an ES module written for the Workers runtime, so it is loaded
 * here by evaluating its source with the runtime globals injected, rather than
 * imported (ts-jest emits CommonJS, which cannot `import` an ESM file).
 */

import * as fs from "fs";
import * as path from "path";

type AnyRecord = Record<string, any>;

const WORKER_SRC = fs.readFileSync(path.join(__dirname, "worker.js"), "utf8");

/** In-memory stand-in for the Workers Cache API (`caches.default`). */
function makeCaches() {
  const store = new Map<string, Response>();
  return {
    store,
    caches: {
      default: {
        async match(req: Request): Promise<Response | undefined> {
          const hit = store.get(req.url);
          return hit ? hit.clone() : undefined;
        },
        async put(req: Request, resp: Response): Promise<void> {
          store.set(req.url, resp.clone());
        },
      },
    },
  };
}

/**
 * Evaluate worker.js with injected globals and hand back its default export.
 * `export default X` becomes `return X` so the module body works as a function.
 */
function loadWorker(fetchImpl: (req: Request) => Promise<Response>, cachesImpl: AnyRecord) {
  const body = WORKER_SRC.replace(/export default/, "return");
  // eslint-disable-next-line no-new-func
  const factory = new Function("fetch", "caches", "Response", "Headers", "Request", "URL", body);
  return factory(fetchImpl, cachesImpl, Response, Headers, Request, URL);
}

/** ctx.waitUntil collector, so cache writes are awaited before assertions. */
function makeCtx() {
  const pending: Promise<any>[] = [];
  return { ctx: { waitUntil: (p: Promise<any>) => pending.push(p) }, settle: () => Promise.all(pending) };
}

const GOOD_BODY = JSON.stringify({ items: ["mirage_prime_set"] });

const okResponse = () =>
  new Response(GOOD_BODY, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });

/** What Cloudflare itself returns when the tunnel has no connection (error 1033). */
const tunnelDownResponse = () =>
  new Response("<html>Cloudflare Tunnel error</html>", {
    status: 530,
    headers: { "Content-Type": "text/html" },
  });

const jsonReq = (url = "https://warframe.digitalshopuy.com/items") => new Request(url);
const htmlReq = (url = "https://warframe-app.digitalshopuy.com/relic") =>
  new Request(url, { headers: { Accept: "text/html,application/xhtml+xml" } });

describe("edge worker — caching a healthy origin", () => {
  it("stores the fresh copy and the backup under DISTINCT keys", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(async () => okResponse(), caches);
    const { ctx, settle } = makeCtx();

    const res = await worker.fetch(jsonReq(), ctx);
    await settle();

    expect(res.status).toBe(200);
    expect(res.headers.get("x-edge-cache")).toBe("MISS");

    const keys = [...store.keys()].sort();
    expect(keys).toHaveLength(2);
    // If these ever collapse to one key, the backup silently overwrites the
    // fresh copy and the outage shield stops existing.
    expect(keys).toEqual([
      "https://warframe.digitalshopuy.com/items",
      "https://warframe.digitalshopuy.com/items?__edge_backup=1",
    ]);
  });

  it("serves the second request from the edge without touching the origin", async () => {
    const { caches } = makeCaches();
    let originCalls = 0;
    const worker = loadWorker(async () => {
      originCalls++;
      return okResponse();
    }, caches);

    const first = makeCtx();
    await worker.fetch(jsonReq(), first.ctx);
    await first.settle();

    const second = makeCtx();
    const res = await worker.fetch(jsonReq(), second.ctx);

    expect(originCalls).toBe(1);
    expect(res.headers.get("x-edge-cache")).toBe("HIT");
    expect(await res.text()).toBe(GOOD_BODY);
  });
});

describe("edge worker — origin outage", () => {
  /** Prime the cache from a healthy origin, then expire only the fresh copy. */
  async function primeThenExpireFresh(url: string) {
    const { caches, store } = makeCaches();
    const worker = loadWorker(async () => okResponse(), caches);
    const { ctx, settle } = makeCtx();
    await worker.fetch(new Request(url), ctx);
    await settle();
    store.delete(url); // edge TTL elapsed; the 7-day backup survives
    return { caches, store };
  }

  it("serves the backup when the origin returns Cloudflare 530 (tunnel down)", async () => {
    const { caches } = await primeThenExpireFresh("https://warframe.digitalshopuy.com/items");
    const worker = loadWorker(async () => tunnelDownResponse(), caches);
    const { ctx } = makeCtx();

    const res = await worker.fetch(jsonReq(), ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-edge-cache")).toBe("STALE-ON-ERROR");
    expect(await res.text()).toBe(GOOD_BODY);
  });

  it("serves the backup when the origin fetch throws outright", async () => {
    const { caches } = await primeThenExpireFresh("https://warframe.digitalshopuy.com/items");
    const worker = loadWorker(async () => {
      throw new Error("connect ETIMEDOUT");
    }, caches);
    const { ctx } = makeCtx();

    const res = await worker.fetch(jsonReq(), ctx);

    expect(res.headers.get("x-edge-cache")).toBe("STALE-ON-ERROR");
    expect(await res.text()).toBe(GOOD_BODY);
  });

  it("returns the branded offline page (never a raw 530) for an HTML request with no backup", async () => {
    const { caches } = makeCaches();
    const worker = loadWorker(async () => tunnelDownResponse(), caches);
    const { ctx } = makeCtx();

    const res = await worker.fetch(htmlReq(), ctx);
    const body = await res.text();

    expect(res.status).toBe(503);
    expect(res.status).not.toBe(530);
    expect(res.headers.get("x-edge-cache")).toBe("OFFLINE");
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(body).toContain("Void Ledger is offline");
    expect(body).not.toContain("Cloudflare Tunnel error");
  });

  it("returns structured JSON (not HTML) for an API request with no backup", async () => {
    const { caches } = makeCaches();
    const worker = loadWorker(async () => tunnelDownResponse(), caches);
    const { ctx } = makeCtx();

    const res = await worker.fetch(jsonReq(), ctx);

    expect(res.status).toBe(503);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(JSON.parse(await res.text()).error).toBe("origin_unavailable");
  });

  it("does not poison the cache with the outage response", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(async () => tunnelDownResponse(), caches);
    const { ctx, settle } = makeCtx();

    await worker.fetch(jsonReq(), ctx);
    await settle();

    expect(store.size).toBe(0);
  });
});

describe("edge worker — per-user responses must never be cached", () => {
  it("passes /me straight through and stores nothing", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(
      async () =>
        new Response(JSON.stringify({ email: "someone@example.com" }), {
          status: 200,
          headers: { "Cache-Control": "private, no-store" },
        }),
      caches,
    );
    const { ctx, settle } = makeCtx();

    const res = await worker.fetch(jsonReq("https://warframe.digitalshopuy.com/me"), ctx);
    await settle();

    expect(res.status).toBe(200);
    expect(store.size).toBe(0);
  });

  it("bypasses any response the origin marks private/no-store", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(
      async () =>
        new Response("{}", { status: 200, headers: { "Cache-Control": "private, max-age=0" } }),
      caches,
    );
    const { ctx, settle } = makeCtx();

    const res = await worker.fetch(jsonReq(), ctx);
    await settle();

    expect(res.headers.get("x-edge-cache")).toBe("BYPASS");
    expect(store.size).toBe(0);
  });

  it("bypasses a session-bearing SSR response (Set-Cookie)", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(
      async () =>
        new Response("<html>dashboard</html>", {
          status: 200,
          headers: { "Cache-Control": "public, max-age=60", "Set-Cookie": "sid=abc123; Path=/" },
        }),
      caches,
    );
    const { ctx, settle } = makeCtx();

    const res = await worker.fetch(htmlReq(), ctx);
    await settle();

    expect(res.headers.get("x-edge-cache")).toBe("BYPASS");
    expect(store.size).toBe(0);
  });

  it("passes an Authorization-bearing request through uncached", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(async () => okResponse(), caches);
    const { ctx, settle } = makeCtx();

    const req = new Request("https://warframe.digitalshopuy.com/items", {
      headers: { Authorization: "Bearer token" },
    });
    await worker.fetch(req, ctx);
    await settle();

    expect(store.size).toBe(0);
  });
});

describe("edge worker — backup retention", () => {
  it("keeps the backup far longer than the edge TTL", async () => {
    const { caches, store } = makeCaches();
    const worker = loadWorker(async () => okResponse(), caches);
    const { ctx, settle } = makeCtx();

    await worker.fetch(jsonReq(), ctx);
    await settle();

    const fresh = store.get("https://warframe.digitalshopuy.com/items")!;
    const backup = store.get("https://warframe.digitalshopuy.com/items?__edge_backup=1")!;

    expect(fresh.headers.get("Cache-Control")).toBe("public, max-age=60");
    // 7 days. A 24h backup expired mid-incident during the 2026-08 host outage
    // and every visitor fell through to Cloudflare's 1033 page.
    expect(backup.headers.get("Cache-Control")).toBe("public, max-age=604800");
  });
});
