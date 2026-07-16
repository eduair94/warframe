import bodyParser from "body-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { RecaptchaV2 } from "express-recaptcha";
import { ValidationChain, validationResult } from "express-validator";
import rateLimit from "express-rate-limit";
import * as http from "http";
import { bError } from "../utils";
import { INBOUND_RATE_LIMIT } from "../constants";
import { FunctionExpress } from "./Express.interface";
import { cache } from "../services/CacheService";

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
    res.set(
      "Cache-Control",
      `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}, stale-while-revalidate=60, stale-if-error=86400`
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
