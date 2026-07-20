/**
 * @fileoverview Firebase ID-token verification WITHOUT the firebase-admin SDK.
 * @module services/firebaseToken
 *
 * Why not firebase-admin
 * ----------------------
 * firebase-admin needs a service-account credential (a secret JSON file) and
 * drags in the whole @google-cloud client stack. This box has no secret-file
 * deploy path (ecosystem.config.js is committed; the API .env is hand-managed)
 * and the frontend build is already memory-bound, so a fat dependency is a real
 * cost. Verifying the token ourselves is the path Google documents for
 * third-party backends: a Firebase ID token is a plain RS256 JWT signed by
 * Google's `securetoken@system.gserviceaccount.com` service account, whose
 * public x509 certificates are published at a well-known URL.
 *
 * What we check (Google's documented list)
 * ----------------------------------------
 *  - alg      RS256, and a `kid` present in the current certificate set
 *  - signature against that certificate
 *  - exp      in the future, iat/auth_time not in the future
 *  - aud      == FIREBASE_PROJECT_ID
 *  - iss      == https://securetoken.google.com/<FIREBASE_PROJECT_ID>
 *  - sub      non-empty (this is the uid)
 *
 * The whole feature is OFF unless FIREBASE_PROJECT_ID is set — same flag style
 * as Web Push (VAPID keys). When off, `isEnabled()` is false and every verify
 * call rejects, so the account routes degrade to a clean "disabled" response
 * instead of half-working.
 */

import jwt from "jsonwebtoken";

/** Google's public x509 certs for Firebase ID tokens, keyed by `kid`. */
const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

/** Clock skew we tolerate on exp/iat, in seconds. */
const CLOCK_SKEW_SEC = 60;

/** Fallback cache lifetime if the response carries no usable max-age. */
const DEFAULT_TTL_MS = 60 * 60_000;

/**
 * Minimum spacing between "unknown kid, refetch the certs" calls.
 *
 * `kid` is an attacker-controlled header field and no signature has been
 * verified when we read it, so without this a stream of forged tokens carrying
 * random kids maps 1:1 onto outbound requests to Google's certificate endpoint.
 * Google would rate-limit this origin, every cert fetch would start failing, and
 * legitimate sign-ins would break for everyone. Real key rotation still recovers
 * within one window (Google publishes new keys well before retiring old ones).
 */
const FORCE_REFRESH_MIN_MS = 5 * 60_000;

export interface VerifiedUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  /** Sign-in provider reported by Firebase, e.g. "google.com" / "password". */
  provider: string | null;
}

export interface CertSource {
  /** Returns `{ kid -> PEM certificate }`. */
  fetchCerts(): Promise<Record<string, string>>;
}

/** Live cert source — fetches Google's published certificates. */
class GoogleCertSource implements CertSource {
  async fetchCerts(): Promise<Record<string, string>> {
    // Node 18+ global fetch; undici is already a dependency of this project.
    const res = await fetch(CERT_URL);
    if (!res.ok) throw new Error(`cert fetch failed: ${res.status}`);
    const ttl = parseMaxAgeMs(res.headers.get("cache-control"));
    const body = (await res.json()) as Record<string, string>;
    if (!body || typeof body !== "object") throw new Error("cert payload invalid");
    lastFetchTtlMs = ttl;
    return body;
  }
}

/** Parses `max-age=<n>` out of a Cache-Control header into ms (0 if absent). */
export function parseMaxAgeMs(header: string | null | undefined): number {
  if (!header) return 0;
  const m = /max-age\s*=\s*(\d+)/i.exec(header);
  if (!m) return 0;
  const secs = parseInt(m[1], 10);
  return Number.isFinite(secs) && secs > 0 ? secs * 1000 : 0;
}

let lastFetchTtlMs = 0;

/**
 * Pure claim validation, split out so it can be unit-tested without any
 * network or signature machinery. Returns an error string, or null when the
 * claims are acceptable.
 */
export function validateClaims(
  payload: any,
  projectId: string,
  nowSec: number = Math.floor(Date.now() / 1000)
): string | null {
  if (!payload || typeof payload !== "object") return "malformed token";
  if (!projectId) return "auth disabled";
  if (payload.aud !== projectId) return "audience mismatch";
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return "issuer mismatch";
  if (typeof payload.sub !== "string" || !payload.sub) return "missing subject";
  if (payload.sub.length > 128) return "invalid subject";
  const exp = Number(payload.exp);
  if (!Number.isFinite(exp) || exp + CLOCK_SKEW_SEC < nowSec) return "token expired";
  const iat = Number(payload.iat);
  if (Number.isFinite(iat) && iat - CLOCK_SKEW_SEC > nowSec) return "token issued in the future";
  const authTime = Number(payload.auth_time);
  if (Number.isFinite(authTime) && authTime - CLOCK_SKEW_SEC > nowSec) {
    return "auth_time in the future";
  }
  return null;
}

/** Maps verified claims onto the shape the rest of the API consumes. */
export function toUser(payload: any): VerifiedUser {
  const firebase = payload.firebase || {};
  return {
    uid: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: !!payload.email_verified,
    name: typeof payload.name === "string" ? payload.name : null,
    picture: typeof payload.picture === "string" ? payload.picture : null,
    provider: typeof firebase.sign_in_provider === "string" ? firebase.sign_in_provider : null,
  };
}

export class FirebaseTokenVerifier {
  private projectId: string;
  private certs: Record<string, string> | null = null;
  private certsExpireAt = 0;
  private inflight: Promise<Record<string, string>> | null = null;
  /** When we last forced a refetch because of an unrecognised `kid`. */
  private lastForcedFetchAt = 0;
  private source: CertSource;

  constructor(projectId?: string, source?: CertSource) {
    this.projectId = (projectId ?? process.env.FIREBASE_PROJECT_ID ?? "").trim();
    this.source = source || new GoogleCertSource();
    if (!this.projectId) {
      console.warn("[auth] FIREBASE_PROJECT_ID not set — accounts disabled");
    }
  }

  isEnabled(): boolean {
    return !!this.projectId;
  }

  getProjectId(): string {
    return this.projectId;
  }

  /**
   * Certificates, cached until Google's own max-age lapses (floored by
   * FIREBASE_JWKS_TTL_MS so a pathological header can't make us refetch per
   * request). Concurrent misses share one fetch.
   */
  private async getCerts(force = false): Promise<Record<string, string>> {
    const now = Date.now();
    if (!force && this.certs && now < this.certsExpireAt) return this.certs;
    if (this.inflight) return this.inflight;
    this.inflight = (async () => {
      try {
        const certs = await this.source.fetchCerts();
        const floor = parseInt(process.env.FIREBASE_JWKS_TTL_MS || "", 10);
        const ttl = Math.max(
          Number.isFinite(floor) && floor > 0 ? floor : 0,
          lastFetchTtlMs || DEFAULT_TTL_MS
        );
        this.certs = certs;
        this.certsExpireAt = Date.now() + ttl;
        return certs;
      } finally {
        this.inflight = null;
      }
    })();
    return this.inflight;
  }

  /**
   * Verifies a raw ID token. Throws with a short, non-leaky message on any
   * failure; callers turn that into a 401.
   */
  async verify(idToken: string): Promise<VerifiedUser> {
    if (!this.projectId) throw new Error("auth disabled");
    if (typeof idToken !== "string" || idToken.length < 20 || idToken.length > 8192) {
      throw new Error("malformed token");
    }

    const decoded: any = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.header) throw new Error("malformed token");
    if (decoded.header.alg !== "RS256") throw new Error("unsupported algorithm");
    const kid = decoded.header.kid;
    if (typeof kid !== "string" || !kid) throw new Error("missing key id");

    let certs = await this.getCerts();
    if (!certs[kid]) {
      // Google rotates keys, so one forced refresh is worth it — but throttled,
      // because `kid` is unverified attacker input at this point (see
      // FORCE_REFRESH_MIN_MS). Stamped BEFORE the await so a failing fetch is
      // throttled exactly like a successful one.
      const nowMs = Date.now();
      if (nowMs - this.lastForcedFetchAt < FORCE_REFRESH_MIN_MS) {
        throw new Error("unknown key id");
      }
      this.lastForcedFetchAt = nowMs;
      certs = await this.getCerts(true);
    }
    const cert = certs[kid];
    if (!cert) throw new Error("unknown key id");

    let payload: any;
    try {
      payload = jwt.verify(idToken, cert, {
        algorithms: ["RS256"],
        audience: this.projectId,
        issuer: `https://securetoken.google.com/${this.projectId}`,
        clockTolerance: CLOCK_SKEW_SEC,
      });
    } catch (e: any) {
      throw new Error(e?.message === "jwt expired" ? "token expired" : "invalid token");
    }

    const problem = validateClaims(payload, this.projectId);
    if (problem) throw new Error(problem);
    return toUser(payload);
  }
}

/** Process-wide singleton (mirrors `cache` in CacheService). */
export const firebaseAuth = new FirebaseTokenVerifier();
