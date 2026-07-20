/**
 * @fileoverview Sanitizers for everything a signed-in client uploads.
 * @module services/userValidate
 *
 * The client is not trusted. Every section is rebuilt field-by-field from the
 * incoming JSON: unknown keys are dropped, strings clamped, numbers coerced and
 * bounded, collections truncated to USER_LIMITS. Nothing here throws — a junk
 * payload degrades to an empty/partial section rather than 500ing a sync that
 * the client will only retry.
 *
 * Pure functions only (no DB, no env) so the whole file is unit-testable.
 */

import {
  USER_LIMITS,
  USER_SECTIONS,
  emptyFoundryData,
  emptyUserData,
  type GoalEntry,
  type TradeEntry,
  type UserData,
  type UserSection,
  type FoundryCounters,
  type FoundryData,
  type FoundryItemProgress,
  type UserSettings,
  type VaultEntry,
  type WatchlistEntry,
} from "./userTypes";

const BASES = new Set(["sell", "buy", "avg", "median"]);

export function isSection(value: any): value is UserSection {
  return typeof value === "string" && (USER_SECTIONS as readonly string[]).includes(value);
}

/** Trimmed string clamped to `max`; empty/non-string becomes "". */
export function str(value: any, max: number = USER_LIMITS.TEXT): string {
  if (typeof value !== "string") return "";
  const t = value.trim();
  return t.length > max ? t.slice(0, max) : t;
}

/** Finite non-negative number clamped to USER_LIMITS.NUMBER, else `fallback`. */
export function num(value: any, fallback = 0): number {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  if (n < 0) return fallback;
  return n > USER_LIMITS.NUMBER ? USER_LIMITS.NUMBER : n;
}

/** Like `num`, but `null` is a meaningful "unset" value (alert thresholds). */
export function numOrNull(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return n > USER_LIMITS.NUMBER ? USER_LIMITS.NUMBER : n;
}

/** ISO timestamp, or `now` when the client sent something unusable. */
export function iso(value: any, now = new Date().toISOString()): string {
  if (typeof value !== "string" || !value) return now;
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return now;
  return new Date(t).toISOString();
}

/** warframe.market slug: lowercase word characters only. "" when invalid. */
export function slug(value: any): string {
  const s = str(value, USER_LIMITS.SLUG).toLowerCase();
  // `__proto__` matches the slug pattern and would be used as an object key,
  // where it hits the prototype setter and silently drops the entry.
  if (s === "__proto__" || s === "constructor" || s === "prototype") return "";
  return /^[a-z0-9_]+$/.test(s) ? s : "";
}

/**
 * Opaque client-generated id (uuid-ish). "" when invalid. Over-long ids are
 * REJECTED rather than truncated — truncating could silently collapse two
 * distinct rows onto the same id and merge them.
 */
export function id(value: any): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  return /^[A-Za-z0-9_-]{1,64}$/.test(s) ? s : "";
}

// ---------------------------------------------------------------- sections

export function sanitizeWatchlist(input: any): Record<string, WatchlistEntry> {
  const out: Record<string, WatchlistEntry> = {};
  if (!input || typeof input !== "object") return out;
  // Accept both the object map the client persists and a plain array.
  const list: any[] = Array.isArray(input) ? input : Object.values(input);
  for (const raw of list) {
    if (Object.keys(out).length >= USER_LIMITS.WATCHLIST) break;
    if (!raw || typeof raw !== "object") continue;
    const url_name = slug(raw.url_name);
    if (!url_name) continue;
    out[url_name] = {
      url_name,
      item_name: str(raw.item_name) || url_name,
      addedAt: iso(raw.addedAt),
      // Defaults to the creation stamp so documents written before this field
      // existed still compare sensibly in the merge.
      updatedAt: iso(raw.updatedAt, iso(raw.addedAt)),
      ownedQty: num(raw.ownedQty, 0),
      alertBelow: numOrNull(raw.alertBelow),
      alertAbove: numOrNull(raw.alertAbove),
      notifiedBelow: !!raw.notifiedBelow,
      notifiedAbove: !!raw.notifiedAbove,
      alertAtl: !!raw.alertAtl,
      notifiedAtl: !!raw.notifiedAtl,
    };
  }
  return out;
}

export function sanitizeVault(input: any): Record<string, VaultEntry> {
  const out: Record<string, VaultEntry> = {};
  if (!input || typeof input !== "object") return out;
  const list: any[] = Array.isArray(input) ? input : Object.values(input);
  for (const raw of list) {
    if (Object.keys(out).length >= USER_LIMITS.VAULT) break;
    if (!raw || typeof raw !== "object") continue;
    const url_name = slug(raw.url_name);
    if (!url_name) continue;
    const entry: VaultEntry = {
      url_name,
      item_name: str(raw.item_name) || url_name,
      qty: Math.round(num(raw.qty, 0)),
      cost: numOrNull(raw.cost),
      updatedAt: iso(raw.updatedAt),
    };
    const note = str(raw.note);
    if (note) entry.note = note;
    out[url_name] = entry;
  }
  return out;
}

export function sanitizeGoals(input: any): GoalEntry[] {
  if (!Array.isArray(input)) return [];
  const out: GoalEntry[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (out.length >= USER_LIMITS.GOALS) break;
    if (!raw || typeof raw !== "object") continue;
    const url_name = slug(raw.url_name);
    const gid = id(raw.id) || url_name;
    if (!url_name || !gid || seen.has(gid)) continue;
    seen.add(gid);
    const goal: GoalEntry = {
      id: gid,
      url_name,
      item_name: str(raw.item_name) || url_name,
      targetQty: Math.max(1, Math.round(num(raw.targetQty, 1)) || 1),
      createdAt: iso(raw.createdAt),
      updatedAt: iso(raw.updatedAt, iso(raw.createdAt)),
      done: !!raw.done,
    };
    const note = str(raw.note);
    if (note) goal.note = note;
    out.push(goal);
  }
  return out;
}

export function sanitizeTrades(input: any): TradeEntry[] {
  if (!Array.isArray(input)) return [];
  const out: TradeEntry[] = [];
  const seen = new Set<string>();
  // Keep the MOST RECENT trades when over the cap — the tail is what the P/L
  // curve and the "recent activity" list actually show.
  const src = input.length > USER_LIMITS.TRADES ? input.slice(-USER_LIMITS.TRADES) : input;
  for (const raw of src) {
    if (!raw || typeof raw !== "object") continue;
    const url_name = slug(raw.url_name);
    const tid = id(raw.id);
    if (!url_name || !tid || seen.has(tid)) continue;
    seen.add(tid);
    const trade: TradeEntry = {
      id: tid,
      url_name,
      item_name: str(raw.item_name) || url_name,
      side: raw.side === "buy" ? "buy" : "sell",
      qty: Math.max(1, Math.round(num(raw.qty, 1)) || 1),
      price: num(raw.price, 0),
      at: iso(raw.at),
    };
    const note = str(raw.note);
    if (note) trade.note = note;
    out.push(trade);
  }
  return out;
}

/**
 * WFCD `uniqueKey` — the last path segment of a `uniqueName`, e.g. `Ninja`,
 * `AshPrime`, `SapientPrimaryBlueprint`, `1999ResourceCommonA`. Letters, digits,
 * and the occasional underscore/hyphen. "" when unusable.
 */
export function foundryKey(value: any): string {
  if (typeof value !== "string") return "";
  const s = value.trim();
  if (s.length > USER_LIMITS.FOUNDRY_KEY) return "";
  // Rejects "__proto__" / "constructor" / "prototype" by construction: they
  // would be written as object keys below, where `__proto__` in particular hits
  // the prototype setter instead of creating an own property.
  if (s === "__proto__" || s === "constructor" || s === "prototype") return "";
  return /^[A-Za-z0-9_-]+$/.test(s) ? s : "";
}

/** Non-negative integer counter, clamped. */
function count(value: any, max: number = USER_LIMITS.NUMBER): number {
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.round(n), max);
}

export function sanitizeFoundry(
  input: any,
  now: string = new Date().toISOString()
): FoundryData {
  const out = emptyFoundryData();
  if (!input || typeof input !== "object") {
    out.updatedAt = now;
    return out;
  }

  const rawItems = input.items;
  if (rawItems && typeof rawItems === "object") {
    for (const [rawKey, rawValue] of Object.entries(rawItems)) {
      if (Object.keys(out.items).length >= USER_LIMITS.FOUNDRY_ITEMS) break;
      const key = foundryKey(rawKey);
      if (!key || !rawValue || typeof rawValue !== "object") continue;
      const value = rawValue as any;
      const entry: FoundryItemProgress = {};
      if (value.built === true) entry.built = true;
      if (value.mastered === true) entry.mastered = true;
      if (value.comp && typeof value.comp === "object") {
        const comp: Record<string, number> = {};
        for (const [ck, cv] of Object.entries(value.comp)) {
          if (Object.keys(comp).length >= USER_LIMITS.FOUNDRY_COMPONENTS) break;
          const compKey = foundryKey(ck);
          const n = count(cv, 10_000);
          // A zero owned-count carries no information; dropping it keeps the
          // document small and matches what the export format does.
          if (compKey && n > 0) comp[compKey] = n;
        }
        if (Object.keys(comp).length) entry.comp = comp;
      }
      // An item with nothing ticked is not worth storing.
      if (entry.built || entry.mastered || entry.comp) out.items[key] = entry;
    }
  }

  const rawResources = input.resources;
  if (rawResources && typeof rawResources === "object") {
    for (const [rawKey, rawValue] of Object.entries(rawResources)) {
      if (Object.keys(out.resources).length >= USER_LIMITS.FOUNDRY_RESOURCES) break;
      const key = foundryKey(rawKey);
      const n = count(rawValue);
      if (key && n > 0) out.resources[key] = n;
    }
  }

  const rawCounters = input.counters;
  if (rawCounters && typeof rawCounters === "object") {
    const counters: FoundryCounters = {};
    // Bounded well above any real value; they only feed the mastery estimate.
    const c = rawCounters as any;
    if (count(c.missions)) counters.missions = count(c.missions, 100_000);
    if (count(c.junctions)) counters.junctions = count(c.junctions, 1000);
    if (count(c.steelMissions)) counters.steelMissions = count(c.steelMissions, 100_000);
    if (count(c.steelJunctions)) counters.steelJunctions = count(c.steelJunctions, 1000);
    if (count(c.intrinsics)) counters.intrinsics = count(c.intrinsics, 1000);
    out.counters = counters;
  }

  if (Array.isArray(input.excluded)) {
    const seen = new Set<string>();
    for (const raw of input.excluded) {
      if (seen.size >= USER_LIMITS.FOUNDRY_ITEMS) break;
      const key = foundryKey(raw);
      if (key) seen.add(key);
    }
    out.excluded = Array.from(seen);
  }

  out.updatedAt = iso(input.updatedAt, now);
  return out;
}

export function sanitizeSettings(input: any): UserSettings {
  const out: UserSettings = {};
  if (!input || typeof input !== "object") return out;
  const platform = str(input.platform, 24).toLowerCase();
  if (platform) out.platform = platform;
  const basis = str(input.basis, 12).toLowerCase();
  if (BASES.has(basis)) out.basis = basis as UserSettings["basis"];
  if (typeof input.liquidityAdjust === "boolean") out.liquidityAdjust = input.liquidityAdjust;
  return out;
}

/** Sanitize ONE section's value. Returns undefined for an unknown section. */
export function sanitizeSection(section: string, value: any): any | undefined {
  switch (section) {
    case "watchlist":
      return sanitizeWatchlist(value);
    case "vault":
      return sanitizeVault(value);
    case "goals":
      return sanitizeGoals(value);
    case "trades":
      return sanitizeTrades(value);
    case "foundry":
      return sanitizeFoundry(value);
    case "settings":
      return sanitizeSettings(value);
    default:
      return undefined;
  }
}

/** Sanitize a whole `data` blob (used by /me/merge and by the doc reader). */
export function sanitizeUserData(input: any, now = new Date().toISOString()): UserData {
  if (!input || typeof input !== "object") return emptyUserData(now);
  return {
    watchlist: sanitizeWatchlist(input.watchlist),
    vault: sanitizeVault(input.vault),
    goals: sanitizeGoals(input.goals),
    trades: sanitizeTrades(input.trades),
    foundry: sanitizeFoundry(input.foundry, now),
    settings: sanitizeSettings(input.settings),
    updatedAt: iso(input.updatedAt, now),
  };
}

/** Locale code the client claims, whitelisted to the shipped set. */
const LOCALES = new Set([
  "en", "es", "pt", "de", "fr", "ru", "ko", "ja",
  "zh-hans", "zh-hant", "pl", "it", "uk",
]);

export function sanitizeLocale(value: any): string {
  const s = str(value, 12).toLowerCase();
  return LOCALES.has(s) ? s : "en";
}
