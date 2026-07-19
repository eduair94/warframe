/**
 * Pure request validation for POST /push/subscribe (Spec B). Kept pure + apart
 * from the route so it is unit-testable and so the handler can validate INSIDE
 * itself — Express.postJson's built-in validation branch has a latent bug (it
 * `return`s the error object instead of sending a response, hanging the request).
 */
import type { UpsertInput } from "./PushSubscriptionService";
import type { IncomingAlert } from "./pushEval";

export const MAX_ALERTS = 250;

export type ParseResult = { value: UpsertInput } | { error: string };

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function coerceThreshold(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? Number(v) : v;
  return isNum(n) && n >= 0 ? n : null;
}

function parseAlert(raw: any): IncomingAlert | null {
  if (!raw || typeof raw.url_name !== "string" || !raw.url_name) return null;
  const item_name = typeof raw.item_name === "string" && raw.item_name ? raw.item_name : raw.url_name;
  return {
    url_name: raw.url_name.slice(0, 200),
    item_name: item_name.slice(0, 200),
    below: coerceThreshold(raw.below),
    above: coerceThreshold(raw.above),
    atl: !!raw.atl,
  };
}

export function parseSubscribeBody(body: any): ParseResult {
  if (!body || typeof body !== "object") return { error: "body required" };

  const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
  if (!deviceId || deviceId.length > 200) return { error: "deviceId required" };

  const sub = body.subscription;
  const endpoint = sub && typeof sub.endpoint === "string" ? sub.endpoint : "";
  const p256dh = sub && sub.keys && typeof sub.keys.p256dh === "string" ? sub.keys.p256dh : "";
  const auth = sub && sub.keys && typeof sub.keys.auth === "string" ? sub.keys.auth : "";
  // Push endpoints are HTTPS capability URLs issued by the browser's push service.
  if (!/^https:\/\//i.test(endpoint) || !p256dh || !auth) {
    return { error: "invalid subscription" };
  }

  const rawAlerts = Array.isArray(body.alerts) ? body.alerts.slice(0, MAX_ALERTS) : [];
  const alerts = rawAlerts.map(parseAlert).filter((a: IncomingAlert | null): a is IncomingAlert => a !== null);

  const locale = typeof body.locale === "string" ? body.locale.slice(0, 20) : undefined;

  return { value: { deviceId, subscription: { endpoint, keys: { p256dh, auth } }, alerts, locale } };
}
