import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { RecaptchaV2 } from "express-recaptcha";
import { ValidationChain, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import * as http from "http";
import { bError } from "../utils";
import { INBOUND_RATE_LIMIT } from "../constants";
import {
  AuthedRequest,
  FunctionExpress,
  FunctionExpressAuth,
} from "./Express.interface";
import { cache } from "../services/CacheService";
import { firebaseAuth } from "../services/firebaseToken";

// Default edge/L2 TTL for cached GET routes. The heavy aggregates cost ~20s of
// CPU to recompute, so a longer fresh window means far fewer recomputes on a
// busy/shared box (5-min staleness is fine — the sync jobs refresh the data on a
// slower cadence anyway). Stale-serve + background refresh keep responses fast
// across the window. Per-route overrides are allowed.
const DEFAULT_CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || "300", 10);

class Express {
  private port: number;
  private app: express.Application = express();
  private baseUrl: string;
  private recaptcha: RecaptchaV2;

  constructor(
    port: number,
    baseUrl: string,
    recaptchaKey: { siteKey: string; secretKey: string } = {
      siteKey: "",
      secretKey: "",
    }
  ) {
    this.baseUrl = baseUrl;
    this.port = port;
    if (recaptchaKey.siteKey) {
      this.recaptcha = new RecaptchaV2(
        recaptchaKey.siteKey,
        recaptchaKey.secretKey
      );
    }
    const origin = process.env.origin;
    console.log("ORIGIN", origin);
    this.app.use(cors());

    this.app.use(bodyParser.json({ limit: "50mb" }));
    this.app.set("trust proxy", true);
    this.app.use(bodyParser.urlencoded({ extended: false }));
    // Built-in throttling to prevent API abuse (README "API Optimization").
    // Applies to every route on this instance; build_relics gets its own
    // stricter limiter on top of this in getJsonProtected below.
    this.app.use(
      rateLimit({
        windowMs: INBOUND_RATE_LIMIT.WINDOW_MS,
        limit: INBOUND_RATE_LIMIT.MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many requests, please try again later." },
      })
    );
    this.start();
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getRecaptchaMiddleWare() {
    // Previously threw a TypeError if RECAPTCHA_SITE_KEY was unset (this.recaptcha
    // stays undefined in that case) - fall back to a no-op so callers don't crash.
    if (!this.recaptcha) return (req: Request, res: Response, next: () => void) => next();
    return this.recaptcha.middleware.verify;
  }

  /**
   * Lets Cloudflare's shared (edge) cache serve these JSON responses and, most
   * importantly, keep serving the last good copy when the origin errors or times
   * out (`stale-if-error`) — that is what keeps the site up during an origin blip
   * instead of showing "caído". `s-maxage` targets the shared cache; the browser
   * follows `max-age`.
   */
  private setEdgeCacheHeaders(res: Response, ttlSeconds: number): void {
    // `stale-while-revalidate` is the edge's grace window: after the s-maxage
    // fresh window lapses, Cloudflare keeps serving the last-good copy for this
    // many extra seconds while it revalidates in the BACKGROUND, so a user never
    // blocks on a (possibly very slow, ~40-75s on a starved box) origin recompute.
    // It was 60s — far too short: any quiet stretch longer than fresh+60s left the
    // next visitor to eat the full cold compute (or an SSR timeout -> blank page).
    // A wide grace (default 1h, env-tunable) means the edge can always answer
    // instantly while the origin catches up. Freshness is still bounded by
    // max-age/s-maxage; this only governs how long stale may cover a slow refresh.
    const swr = parseInt(process.env.CACHE_STALE_WHILE_REVALIDATE_SECONDS || "3600", 10);
    // Browser (`max-age`) is deliberately much shorter than the edge
    // (`s-maxage`): a browser that trusts a long max-age pins users to an
    // hours-old JSON snapshot (the "everything updated an hour ago" bug) with
    // no way for us to invalidate it. 60s keeps client traffic cheap while the
    // edge absorbs the load. NOTE: Cloudflare's zone-level "Browser Cache TTL"
    // must be "Respect Existing Headers", or CF inflates max-age (default 4h)
    // and reintroduces the bug.
    const browserMaxAge = parseInt(process.env.CACHE_BROWSER_MAX_AGE_SECONDS || "60", 10);
    res.set(
      "Cache-Control",
      `public, max-age=${browserMaxAge}, s-maxage=${ttlSeconds}, stale-while-revalidate=${swr}, stale-if-error=86400`
    );
  }

  /**
   * Cached GET route. The response is served through the two-tier CacheService
   * (in-process L1 + shared/durable Redis L2 with single-flight), so a restart
   * comes up warm and concurrent misses don't stampede Mongo — the exact failure
   * that took the site down. Keyed by req.originalUrl so each distinct URL (incl.
   * query/params) gets its own bucket.
   */
  public getJsonCache(
    requestUrl: string,
    f: FunctionExpress,
    ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS
  ): void {
    this.app.get(
      `${this.baseUrl}${requestUrl}`,
      async (req: Request, res: Response) => {
        try {
          const result: any = await cache.getOrSet(
            req.originalUrl,
            ttlSeconds * 1000,
            async () => f(req, res).catch((e) => bError(e.message))
          );
          this.setEdgeCacheHeaders(res, ttlSeconds);
          res.json(result);
        } catch (e: any) {
          res.json(bError(e?.message || "cache error"));
        }
      }
    );
  }

  public getJson(
    requestUrl: string,
    f: FunctionExpress,
    ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS
  ): void {
    this.app.get(
      `${this.baseUrl}${requestUrl}`,
      async (req: Request, res: Response) => {
        try {
          const result: any = await cache.getOrSet(
            req.originalUrl,
            ttlSeconds * 1000,
            async () => f(req, res).catch((e) => bError(e.message))
          );
          this.setEdgeCacheHeaders(res, ttlSeconds);
          res.json(result);
        } catch (e: any) {
          res.json(bError(e?.message || "cache error"));
        }
      }
    );
  }

  /**
   * Like getJson, but for mutating GET endpoints (e.g. build_relics, which
   * triggers a real DB write on every call). Adds a stricter per-IP limiter
   * and, when ADMIN_SYNC_TOKEN is set, requires it via ?token= or
   * x-admin-token header - uncached, since a resync must always run live.
   */
  public getJsonProtected(requestUrl: string, f: FunctionExpress): void {
    const strictLimiter = rateLimit({
      windowMs: INBOUND_RATE_LIMIT.BUILD_RELICS_WINDOW_MS,
      limit: INBOUND_RATE_LIMIT.BUILD_RELICS_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many sync requests, please try again later." },
    });
    const requireAdminToken = (req: Request, res: Response, next: NextFunction) => {
      const expected = process.env.ADMIN_SYNC_TOKEN;
      if (!expected) return next(); // not configured - limiter above is still enforced
      const provided = req.query.token || req.headers["x-admin-token"];
      if (provided !== expected) {
        res.status(403).json({ error: "Missing or invalid admin token" });
        return;
      }
      next();
    };
    this.app.get(
      `${this.baseUrl}${requestUrl}`,
      strictLimiter,
      requireAdminToken,
      async (req: Request, res: Response) => {
        const result: any = await f(req, res).catch((e) => {
          return bError(e.message);
        });
        res.json(result);
      }
    );
  }

  /**
   * Shared limiter for every authenticated route. A signed-in session does one
   * GET /me plus a debounced sync per edit burst, so this is generous — it only
   * exists so a runaway client can't hammer Mongo with unbounded writes.
   */
  private authLimiter = rateLimit({
    windowMs: INBOUND_RATE_LIMIT.AUTH_WINDOW_MS,
    limit: INBOUND_RATE_LIMIT.AUTH_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    // Bucket on the VERIFIED Firebase uid, not on req.ip. `trust proxy` is true
    // (the app sits behind a cloudflared tunnel), so req.ip is the left-most
    // X-Forwarded-For entry — fully client-supplied, and therefore a limit an
    // attacker can sidestep by rotating one header. The uid comes from a
    // signature-checked token, so it cannot be forged; this middleware runs
    // AFTER requireAuth so it is always populated.
    keyGenerator: (req: Request) => (req as AuthedRequest).user?.uid || "anonymous",
  });

  /**
   * Verifies the `Authorization: Bearer <firebase id token>` header and hangs
   * the resulting identity off `req.user`. 401s on anything unverifiable.
   */
  private requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    // Stamp the private headers FIRST so they apply to the rejection responses
    // too. A cached 401/503 would be almost as bad as a cached payload: the
    // edge would pin "unauthorized" for every user until the entry expired.
    this.setPrivateHeaders(res);
    if (!firebaseAuth.isEnabled()) {
      res.status(503).json({ error: "auth disabled" });
      return;
    }
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    try {
      (req as AuthedRequest).user = await firebaseAuth.verify(token);
      next();
    } catch (e: any) {
      res.status(401).json({ error: e?.message || "unauthorized" });
    }
  };

  /**
   * Per-user responses must NEVER touch the shared cache: getJson/getJsonCache
   * key `cache.getOrSet` on `req.originalUrl`, so two accounts hitting `/me`
   * would be served each other's vault. These wrappers bypass the cache
   * entirely and tell every intermediary (browser, Cloudflare) the same.
   */
  private setPrivateHeaders(res: Response): void {
    res.set("Cache-Control", "private, no-store, max-age=0");
    res.set("Vary", "Authorization");
  }

  /** Authenticated, UNCACHED GET. Handler receives `req.user`. */
  public getJsonAuth(requestUrl: string, f: FunctionExpressAuth): void {
    this.app.get(
      `${this.baseUrl}${requestUrl}`,
      this.requireAuth,
      this.authLimiter,
      async (req: Request, res: Response) => {
        this.setPrivateHeaders(res);
        const result: any = await f(req as AuthedRequest, res).catch((e) =>
          bError(e?.message || "error")
        );
        res.json(result);
      }
    );
  }

  /**
   * Authenticated, UNCACHED POST. Unlike `postJson` this always sends a
   * response (postJson's express-validator branch `return`s an object instead
   * of responding, hanging the request) — handlers validate their own body.
   */
  public postJsonAuth(requestUrl: string, f: FunctionExpressAuth): void {
    this.app.post(
      `${this.baseUrl}${requestUrl}`,
      this.requireAuth,
      this.authLimiter,
      async (req: Request, res: Response) => {
        this.setPrivateHeaders(res);
        const result: any = await f(req as AuthedRequest, res).catch((e) => {
          console.error("[auth route]", requestUrl, e?.message);
          return bError(e?.message || "error");
        });
        res.json(result);
      }
    );
  }

  public get(requestUrl: string, f: any): void {
    this.app.get(
      `${this.baseUrl}${requestUrl}`,
      async (req: Request, res: Response) => {
        f(req, res).catch((e) => {
          res.status(404);
          res.end();
        });
      }
    );
  }

  public confirmPull(requestUrl: string, f: FunctionExpress): void {
    this.app.post(
      `${this.baseUrl}${requestUrl}`,
      async (req: Request, res: Response) => {
        res.json({ received: true });
        const result: any = await f(req);
      }
    );
  }

  public postJson(
    requestUrl: string,
    f: FunctionExpress,
    validation: ValidationChain[] = []
  ): void {
    this.app.post(
      `${this.baseUrl}${requestUrl}`,
      validation,
      async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return { error: errors.array() };
        const result: any = await f(req).catch((e) => {
          console.error(e);
          return bError(e.message);
        });
        res.json(result);
      }
    );
  }

  public postJsonRecaptcha(
    requestUrl: string,
    f: FunctionExpress,
    validation: ValidationChain[] = []
  ): void {
    this.app.post(
      `${this.baseUrl}${requestUrl}`,
      this.getRecaptchaMiddleWare(),
      async (req: Request, res: Response) => {
        if (!req["recaptcha"]?.["error"]) {
          const errors = validationResult(req);
          if (!errors.isEmpty()) return { error: errors.array() };
          const result: any = await f(req).catch((e) => {
            return bError(e.message);
          });
          res.json(result);
        } else {
          res.json({ error: "Bad recaptcha" });
        }
      }
    );
  }

  async start() {
    const server = http.createServer(this.app);
    server.listen(this.port, () => {
      console.log("Express server listening on port " + this.port);
    });
    server.on("error", function (e) {
      console.log(`Not connected to express ${e.message}`);
    });
  }
}

export default Express;
