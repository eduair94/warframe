/**
 * @fileoverview Merging a local (localStorage) snapshot into the server copy.
 * @module services/userMerge
 *
 * The app is local-first: every tool writes localStorage immediately and only
 * mirrors to the server when signed in. So the moment a user signs in on a
 * second device we have two divergent copies and MUST NOT let either clobber
 * the other — the whole point of accounts is that nothing is lost.
 *
 * Rules
 * -----
 *  - keyed maps (watchlist, vault): union by key; on collision the entry with
 *    the newer EDIT timestamp (`updatedAt`) wins — comparing creation stamps
 *    would silently revert every cross-device edit, since `addedAt` never
 *    changes. A tie keeps the stored copy. Quantities are deliberately NOT summed — merge
 *    runs on every fresh sign-in, and summing would double the vault each time.
 *  - arrays (goals, trades): union by `id`, newer `createdAt`/`at` wins.
 *  - settings: shallow spread, local wins for keys it actually defines (it is
 *    the device the user is looking at).
 *  - caps are re-applied afterwards, so a merge can never exceed USER_LIMITS.
 *
 * Pure functions only — fully unit-testable.
 */

import {
  USER_LIMITS,
  type FoundryData,
  type UserData,
  type UserSettings,
} from "./userTypes";
import { sanitizeUserData } from "./userValidate";

function ts(value: any): number {
  if (typeof value !== "string") return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

/** Newest-wins union of two keyed maps, comparing `field` as a timestamp. */
function mergeMap<T extends Record<string, any>>(
  a: Record<string, T>,
  b: Record<string, T>,
  field: string,
  limit: number
): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [key, entry] of Object.entries(b)) {
    const existing = out[key];
    // Strictly newer wins; a TIE keeps the stored copy rather than letting an
    // uploader with an identical timestamp overwrite it.
    if (!existing || ts(entry[field]) > ts(existing[field])) out[key] = entry;
  }
  const keys = Object.keys(out);
  if (keys.length <= limit) return out;
  // Over the cap: keep the most recently touched entries.
  keys.sort((x, y) => ts(out[y][field]) - ts(out[x][field]));
  const trimmed: Record<string, T> = {};
  for (const key of keys.slice(0, limit)) trimmed[key] = out[key];
  return trimmed;
}

/** Newest-wins union of two arrays keyed by `id`, ordered oldest → newest. */
function mergeList<T extends { id: string }>(
  a: T[],
  b: T[],
  field: string,
  limit: number
): T[] {
  const byId = new Map<string, T>();
  for (const entry of a) byId.set(entry.id, entry);
  for (const entry of b) {
    const existing = byId.get(entry.id);
    if (!existing || ts((entry as any)[field]) > ts((existing as any)[field])) {
      byId.set(entry.id, entry);
    }
  }
  const all = Array.from(byId.values()).sort(
    (x, y) => ts((x as any)[field]) - ts((y as any)[field])
  );
  return all.length > limit ? all.slice(all.length - limit) : all;
}

function mergeSettings(server: UserSettings, local: UserSettings): UserSettings {
  return { ...server, ...local };
}

/**
 * Foundry progress is monotonic in practice — a player ticks things off, they do
 * not un-master gear — so the merge takes the MAXIMUM of the two sides rather
 * than a newest-wins pick. That is the behaviour a user expects when they have
 * been ticking items on their phone and their desktop: nothing they marked
 * anywhere is lost. `excluded` is a union for the same reason.
 */
function mergeFoundry(server: FoundryData, local: FoundryData): FoundryData {
  const items: FoundryData["items"] = {};
  for (const key of new Set([...Object.keys(server.items), ...Object.keys(local.items)])) {
    if (Object.keys(items).length >= USER_LIMITS.FOUNDRY_ITEMS) break;
    const a = server.items[key] || {};
    const b = local.items[key] || {};
    const merged: FoundryData["items"][string] = {};
    if (a.built || b.built) merged.built = true;
    if (a.mastered || b.mastered) merged.mastered = true;
    const comp: Record<string, number> = {};
    for (const ck of new Set([...Object.keys(a.comp || {}), ...Object.keys(b.comp || {})])) {
      const n = Math.max(a.comp?.[ck] || 0, b.comp?.[ck] || 0);
      if (n > 0) comp[ck] = n;
    }
    if (Object.keys(comp).length) merged.comp = comp;
    if (merged.built || merged.mastered || merged.comp) items[key] = merged;
  }

  const resources: Record<string, number> = {}
  for (const key of new Set([...Object.keys(server.resources), ...Object.keys(local.resources)])) {
    if (Object.keys(resources).length >= USER_LIMITS.FOUNDRY_RESOURCES) break;
    const n = Math.max(server.resources[key] || 0, local.resources[key] || 0);
    if (n > 0) resources[key] = n;
  }

  const counters = { ...server.counters };
  for (const [k, v] of Object.entries(local.counters || {})) {
    const key = k as keyof typeof counters;
    counters[key] = Math.max(counters[key] || 0, Number(v) || 0);
  }

  const excluded = Array.from(new Set([...(server.excluded || []), ...(local.excluded || [])]));

  return { items, resources, counters, excluded, updatedAt: local.updatedAt || server.updatedAt };
}

/**
 * Merge a client snapshot (`local`) into the stored copy (`server`).
 * Both sides are sanitized first, so this is safe to call with raw client JSON.
 */
export function mergeUserData(
  server: any,
  local: any,
  now = new Date().toISOString()
): UserData {
  const s = sanitizeUserData(server, now);
  const l = sanitizeUserData(local, now);
  return {
    watchlist: mergeMap(s.watchlist, l.watchlist, "updatedAt", USER_LIMITS.WATCHLIST),
    vault: mergeMap(s.vault, l.vault, "updatedAt", USER_LIMITS.VAULT),
    goals: mergeList(s.goals, l.goals, "updatedAt", USER_LIMITS.GOALS),
    trades: mergeList(s.trades, l.trades, "at", USER_LIMITS.TRADES),
    foundry: mergeFoundry(s.foundry, l.foundry),
    settings: mergeSettings(s.settings, l.settings),
    updatedAt: now,
  };
}
