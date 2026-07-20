/**
 * @fileoverview Shared shapes for the signed-in player payload.
 * @module services/userTypes
 *
 * ONE document per Firebase uid holds every synced section, so a single
 * `GET /me` serves the whole account area (see UserDataService). The client
 * mirrors these exact shapes in localStorage, which is what makes the app
 * local-first: signed out it writes localStorage only, signed in it also
 * pushes the same objects here.
 */

/**
 * A watched item + its price-alert thresholds. Field-for-field identical to
 * the client's existing `WatchlistEntry` (app/app/services/portfolio.ts) so a
 * localStorage snapshot can be uploaded verbatim.
 */
export interface WatchlistEntry {
  url_name: string;
  item_name: string;
  addedAt: string;
  /**
   * Last EDIT. The merge picks a winner on this, not on `addedAt` — an entry
   * added on Monday and edited on Friday must beat the same entry sitting
   * untouched on another device, and `addedAt` never changes.
   */
  updatedAt?: string;
  ownedQty: number;
  alertBelow: number | null;
  alertAbove: number | null;
  notifiedBelow: boolean;
  notifiedAbove: boolean;
  alertAtl?: boolean;
  notifiedAtl?: boolean;
}

/** One held item in the Vault (inventory tracker). */
export interface VaultEntry {
  url_name: string;
  item_name: string;
  qty: number;
  /** Average platinum paid per unit, when the user recorded it. */
  cost?: number | null;
  note?: string;
  updatedAt: string;
}

/** A prime set the player is farming towards. */
export interface GoalEntry {
  id: string;
  url_name: string;
  item_name: string;
  targetQty: number;
  createdAt: string;
  /** Last EDIT — the merge tiebreaker (see WatchlistEntry.updatedAt). */
  updatedAt?: string;
  note?: string;
  done?: boolean;
}

/** One recorded trade in the ledger. */
export interface TradeEntry {
  id: string;
  url_name: string;
  item_name: string;
  side: "buy" | "sell";
  qty: number;
  /** Platinum per unit. */
  price: number;
  at: string;
  note?: string;
}

/**
 * Per-item progress in the Foundry mastery tracker, keyed by WFCD `uniqueKey`
 * (the last path segment of `uniqueName`, e.g. `Ninja` for Ash).
 *
 * That key choice is deliberate: it is exactly what warframe-foundry.app writes
 * in its export file, so a user's existing `warframe-foundry.json` imports
 * losslessly and we can export a file that tool can read back.
 */
export interface FoundryItemProgress {
  built?: boolean;
  mastered?: boolean;
  /** Owned count per component uniqueKey (absent/0 = none). */
  comp?: Record<string, number>;
}

/** Mastery earned outside the item checklist (missions, junctions, intrinsics). */
export interface FoundryCounters {
  missions?: number;
  junctions?: number;
  steelMissions?: number;
  steelJunctions?: number;
  intrinsics?: number;
}

export interface FoundryData {
  items: Record<string, FoundryItemProgress>;
  /** How many of each resource the player already has, by resource uniqueKey. */
  resources: Record<string, number>;
  counters: FoundryCounters;
  /** uniqueKeys the player has hidden from their checklist. */
  excluded: string[];
  updatedAt?: string;
}

export interface UserSettings {
  platform?: string;
  /** Which market price the value tools should treat as the basis. */
  basis?: "sell" | "buy" | "avg" | "median";
  /** Discount value by 48h volume (the project's VOL_K model). */
  liquidityAdjust?: boolean;
}

export interface UserData {
  watchlist: Record<string, WatchlistEntry>;
  vault: Record<string, VaultEntry>;
  goals: GoalEntry[];
  trades: TradeEntry[];
  foundry: FoundryData;
  settings: UserSettings;
  updatedAt: string;
}

export interface UserDoc {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  locale?: string;
  provider?: string | null;
  createdAt: string;
  lastSeen: string;
  data: UserData;
}

/** Sections a client may replace one at a time via POST /me/sync. */
export const USER_SECTIONS = [
  "watchlist",
  "vault",
  "goals",
  "trades",
  "foundry",
  "settings",
] as const;
export type UserSection = (typeof USER_SECTIONS)[number];

/**
 * Hard caps. Enforced by truncation rather than rejection: a client that
 * somehow exceeds them keeps working with its most recent entries instead of
 * silently failing every sync. They bound the document far below Mongo's 16 MB.
 */
export const USER_LIMITS = {
  WATCHLIST: 500,
  VAULT: 3000,
  GOALS: 200,
  TRADES: 3000,
  /**
   * Masterable items in the game (~920 today) plus headroom for patches. Kept
   * deliberately tight: these caps are the ONLY thing bounding the document,
   * and the previous 4000 x 40 components x 80-char keys allowed a payload
   * larger than Mongo's 16 MB BSON ceiling, at which point every subsequent
   * save for that account would fail.
   */
  FOUNDRY_ITEMS: 1500,
  /** Distinct crafting resources (~170 today). */
  FOUNDRY_RESOURCES: 500,
  /** Components tracked on a single item (the real maximum is 6). */
  FOUNDRY_COMPONENTS: 16,
  /** WFCD uniqueKey length; the longest real one is well under this. */
  FOUNDRY_KEY: 64,
  /** Max characters for any free-text field (names, notes). */
  TEXT: 200,
  /** Max characters for an item slug. */
  SLUG: 120,
  /** Ceiling for any quantity/price so one bad number can't poison the totals. */
  NUMBER: 1_000_000_000,
} as const;

export function emptyUserData(now = new Date().toISOString()): UserData {
  return {
    watchlist: {},
    vault: {},
    goals: [],
    trades: [],
    foundry: emptyFoundryData(now),
    settings: {},
    updatedAt: now,
  };
}

export function emptyFoundryData(now?: string): FoundryData {
  const data: FoundryData = { items: {}, resources: {}, counters: {}, excluded: [] };
  if (now) data.updatedAt = now;
  return data;
}
