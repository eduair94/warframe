/**
 * @fileoverview Mastery / collection catalogue for the Foundry tracker.
 * @module services/FoundryService
 *
 * What this powers
 * ----------------
 * `/foundry` is a mastery + build checklist in the spirit of
 * warframe-foundry.app: every masterable item, its crafting components, and the
 * raw resources those components consume. The user ticks Built / Mastered per
 * item and partial counts per component; we then tell them what is left, what
 * the remaining resources are, and — the thing a market site can add and a pure
 * checklist cannot — what the missing pieces would COST in platinum.
 *
 * Identity
 * --------
 * The canonical key is `uniqueKey` = the last path segment of WFCD's
 * `uniqueName` (`/Lotus/Powersuits/Ninja/Ninja` -> `Ninja`). That is exactly the
 * key warframe-foundry.app uses in its export file, which is what makes a
 * lossless import of a user's existing `warframe-foundry.json` possible. Keys
 * are not guaranteed globally unique across categories, so the catalogue is
 * indexed per category first and globally second.
 *
 * Data source
 * -----------
 * WFCD `warframe-items` raw JSON (the same project the drop tables come from),
 * read through the raw.githubusercontent mirror because the primary host sits
 * behind Cloudflare. Rebuilt on a schedule like the drop data, with the last
 * good copy kept in Mongo so a fetch failure never empties the page.
 */

import mongoose from "mongoose";
import { MongooseServer } from "../database";
import { COLLECTIONS } from "../constants";

const Schema = mongoose.Schema;

const WFCD_JSON_BASE =
  "https://raw.githubusercontent.com/WFCD/warframe-items/master/data/json/";

/** Mongo document key for the built catalogue (one doc, like the drops map). */
export const FOUNDRY_DOC_KEY = "catalogue";

/** The seven buckets the tracker groups items into. */
export const FOUNDRY_CATEGORIES = [
  "warframes",
  "primary",
  "secondary",
  "melee",
  "companions",
  "archwing",
  "miscellaneous",
] as const;
export type FoundryCategory = (typeof FOUNDRY_CATEGORIES)[number];

/**
 * Which WFCD file feeds which bucket.
 *
 * A few placements are deliberate rather than obvious:
 *  - `SentinelWeapons` goes to PRIMARY, because that is the category WFCD gives
 *    them and it is what warframe-foundry.app shows (its "Primary" tab is
 *    195 + 24 = 219 items). Keeping the same split keeps the two trackers
 *    comparable for anyone migrating.
 *  - Arch-Gun and Arch-Melee join Archwing rather than Primary/Melee, so the
 *    Archwing tab is the complete 5 + 20 + 8 = 33 the game treats as one group.
 *  - `Misc` is filtered hard (see MISC_TYPES): it holds 1240 entries of which
 *    only the modular Amp / Kitgun / K-Drive parts are masterable gear.
 */
const SOURCES: Array<{ file: string; category: FoundryCategory }> = [
  { file: "Warframes", category: "warframes" },
  { file: "Primary", category: "primary" },
  { file: "SentinelWeapons", category: "primary" },
  { file: "Secondary", category: "secondary" },
  { file: "Melee", category: "melee" },
  { file: "Sentinels", category: "companions" },
  { file: "Pets", category: "companions" },
  { file: "Archwing", category: "archwing" },
  { file: "Arch-Gun", category: "archwing" },
  { file: "Arch-Melee", category: "archwing" },
  { file: "Misc", category: "miscellaneous" },
];

/** Extra file fetched only to classify components as resources. */
const RESOURCE_FILE = "Resources";

/**
 * `Misc.json` is a grab-bag. Only the modular-weapon parts in it are gear the
 * player builds and masters; Exalted Weapons come free with their frame and
 * Conservation Prey are not built at all, so both are excluded.
 */
const MISC_TYPES = new Set(["Amp", "Kitgun Component", "K-Drive Component"]);

/**
 * `Pets.json` mixes real companions with the parts and resources used to build
 * them. Only these types are the masterable companion itself.
 */
const PET_TYPES = new Set(["Pets", "Pet Parts"]);

/**
 * Mastery points per mastered item, by bucket. Warframes and companions are
 * worth double a weapon. An item may override this with its own value — Kuva /
 * Tenet / Coda weapons are worth 4000 rather than 3000.
 */
const MASTERY_POINTS: Record<FoundryCategory, number> = {
  warframes: 6000,
  primary: 3000,
  secondary: 3000,
  melee: 3000,
  companions: 6000,
  archwing: 3000,
  miscellaneous: 3000,
};

/** Weapon families the game awards 4000 rather than 3000 mastery for. */
const HIGH_VALUE_PREFIX = /^(Kuva|Tenet|Coda) /;

export interface FoundryComponent {
  uniqueKey: string;
  uniqueName: string;
  name: string;
  /** How many of this component one build consumes. */
  itemCount: number;
  imageName?: string;
  /** True for raw resources (Ferrite, Plastids…) rather than crafted parts. */
  resource?: boolean;
  /** warframe.market url_name, when this component is tradable there. */
  market?: string;
}

export interface FoundryItem {
  uniqueKey: string;
  uniqueName: string;
  name: string;
  category: FoundryCategory;
  masteryReq: number;
  masteryPoints: number;
  imageName?: string;
  wikiaUrl?: string;
  vaulted?: boolean;
  /** Excalibur Prime & friends — hidden unless the user opts in. */
  founderOnly?: boolean;
  components: FoundryComponent[];
  /** warframe.market url_name for the tradable set/item, when one exists. */
  market?: string;
}

export interface FoundryResource {
  uniqueKey: string;
  uniqueName: string;
  name: string;
  imageName?: string;
  /** Total units required across every item in each category. */
  perCategory: Record<FoundryCategory, number>;
  total: number;
  /** warframe.market url_name, when the resource is tradable (rare). */
  market?: string;
}

export interface FoundryCatalogue {
  items: FoundryItem[];
  resources: FoundryResource[];
  counts: Record<FoundryCategory, number>;
  meta: {
    total: number;
    resourceCount: number;
    mastered: number;
    /** Total mastery points available from items alone. */
    maxItemPoints: number;
    updatedAt: string;
    source: "db" | "live";
  };
}

/** Last path segment of a WFCD uniqueName — the key foundry exports use. */
export function uniqueKeyOf(uniqueName: string): string {
  if (!uniqueName || typeof uniqueName !== "string") return "";
  const parts = uniqueName.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
}

/** Mastery points one mastered item is worth. */
export function masteryPointsFor(
  name: string,
  category: FoundryCategory,
  explicit?: number
): number {
  if (typeof explicit === "number" && explicit > 0) return explicit;
  if (HIGH_VALUE_PREFIX.test(name || "")) return 4000;
  return MASTERY_POINTS[category] ?? 3000;
}

/**
 * Cumulative mastery-point thresholds for ranks 0-34. Rank N needs
 * `2500 * N^2` up to 30, then a flat 25 000 per Legendary rank.
 */
export function rankThresholds(): number[] {
  const out: number[] = [];
  for (let rank = 0; rank <= 30; rank++) out.push(2500 * rank * rank);
  for (let rank = 31; rank <= 34; rank++) out.push(out[30] + 147_500 * (rank - 30));
  return out;
}

/** Highest rank fully reached with `points` mastery. */
export function rankForPoints(points: number): number {
  const t = rankThresholds();
  let rank = 0;
  for (let i = 0; i < t.length; i++) if (points >= t[i]) rank = i;
  return rank;
}

/** Normalizes a display name for market lookup (same rules as marketLookup). */
function normalizeName(name: string): string {
  return String(name || "")
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+blueprint$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export class FoundryService {
  private db: any;

  constructor() {
    this.db = MongooseServer.getInstance(
      COLLECTIONS.FOUNDRY,
      new Schema({ key: { type: String, unique: true } }, { strict: false })
    );
    this.db.ensureIndex?.({ key: 1 }, { unique: true, sparse: true }).catch(() => {});
  }

  // ------------------------------------------------------------- fetching

  /** Fetch one WFCD data file. Overridable in tests. */
  protected async fetchFile(file: string): Promise<any[]> {
    const res = await fetch(`${WFCD_JSON_BASE}${file}.json`);
    if (!res.ok) throw new Error(`WFCD ${file}.json -> HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) throw new Error(`WFCD ${file}.json is not an array`);
    return json;
  }

  /**
   * Builds the whole catalogue from already-fetched WFCD payloads. Pure — no
   * network, no DB — so the classification rules are unit-testable.
   *
   * @param files     `{ 'Warframes': [...], 'Primary': [...], … }`
   * @param resources the `Resources.json` payload, used to tell a raw resource
   *                  component apart from a crafted part
   * @param marketByName optional `normalizedName -> url_name` map used to attach
   *                  warframe.market links (that is what enables plat pricing)
   */
  static buildCatalogue(
    files: Record<string, any[]>,
    resources: any[] = [],
    marketByName: Record<string, string> = {}
  ): Omit<FoundryCatalogue, "meta"> & { meta: Omit<FoundryCatalogue["meta"], "source"> } {
    const resourceNames = new Set<string>();
    for (const r of resources || []) if (r?.uniqueName) resourceNames.add(r.uniqueName);

    /**
     * A component is a RAW RESOURCE (goes in the resources table) rather than a
     * crafted part (gets a tick box) when WFCD lists it in Resources.json, or it
     * lives under /Lotus/Types/Items/ (the resource namespace). Forma is the one
     * everyday exception: it is filed under Recipes but is spent like a resource.
     */
    const isResource = (uniqueName: string, name: string): boolean => {
      if (resourceNames.has(uniqueName)) return true;
      if (/\/Lotus\/Types\/Items\//.test(uniqueName)) return true;
      if (/^Forma$/i.test(name || "")) return true;
      return false;
    };

    const lookupMarket = (name: string): string | undefined =>
      marketByName[normalizeName(name)];

    const items: FoundryItem[] = [];
    const seen = new Set<string>();
    const resourceAcc = new Map<string, FoundryResource>();
    const emptyPerCategory = (): Record<FoundryCategory, number> =>
      FOUNDRY_CATEGORIES.reduce(
        (acc, c) => ({ ...acc, [c]: 0 }),
        {} as Record<FoundryCategory, number>
      );

    for (const { file, category } of SOURCES) {
      const rows = files[file];
      if (!Array.isArray(rows)) continue;
      for (const raw of rows) {
        if (!raw || typeof raw.masteryReq !== "number") continue;
        if (category === "miscellaneous" && !MISC_TYPES.has(raw.type)) continue;
        if (file === "Pets" && !PET_TYPES.has(raw.type)) continue;
        const uniqueKey = uniqueKeyOf(raw.uniqueName);
        if (!uniqueKey || seen.has(uniqueKey)) continue;
        seen.add(uniqueKey);

        const components: FoundryComponent[] = [];
        for (const c of raw.components || []) {
          const key = uniqueKeyOf(c?.uniqueName);
          if (!key) continue;
          const resource = isResource(c.uniqueName, c.name);
          const comp: FoundryComponent = {
            uniqueKey: key,
            uniqueName: c.uniqueName,
            name: c.name || key,
            itemCount: Math.max(1, Number(c.itemCount) || 1),
            imageName: c.imageName,
          };
          if (resource) comp.resource = true;
          // Parts are traded under "<Item> <Part>" on warframe.market
          // ("Ash Prime Systems"); a bare part name almost never resolves.
          const partMarket =
            lookupMarket(`${raw.name} ${c.name}`) ||
            (resource ? lookupMarket(c.name) : undefined);
          if (partMarket) comp.market = partMarket;
          components.push(comp);

          if (!resource) continue;
          let agg = resourceAcc.get(key);
          if (!agg) {
            agg = {
              uniqueKey: key,
              uniqueName: c.uniqueName,
              name: c.name || key,
              imageName: c.imageName,
              perCategory: emptyPerCategory(),
              total: 0,
            };
            const rm = lookupMarket(c.name);
            if (rm) agg.market = rm;
            resourceAcc.set(key, agg);
          }
          agg.perCategory[category] += comp.itemCount;
          agg.total += comp.itemCount;
        }

        const item: FoundryItem = {
          uniqueKey,
          uniqueName: raw.uniqueName,
          name: raw.name || uniqueKey,
          category,
          masteryReq: raw.masteryReq,
          masteryPoints: masteryPointsFor(raw.name, category, raw.masteryPoints),
          imageName: raw.imageName,
          wikiaUrl: raw.wikiaUrl,
          components,
        };
        if (raw.vaulted) item.vaulted = true;
        // Founder-only gear can never be obtained; WFCD does not flag it, so
        // recognise the two by name and let the UI hide them by default.
        if (/^(Excalibur Prime|Lato Prime|Skana Prime)$/.test(item.name)) {
          item.founderOnly = true;
        }
        // Prime gear trades as a SET; everything else, if tradable at all,
        // trades under its own name.
        const market =
          lookupMarket(`${item.name} Set`) || lookupMarket(item.name) || undefined;
        if (market) item.market = market;
        items.push(item);
      }
    }

    items.sort((a, b) => a.name.localeCompare(b.name));
    const resourceRows = Array.from(resourceAcc.values()).sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name)
    );

    const counts = emptyPerCategory();
    let maxItemPoints = 0;
    for (const it of items) {
      counts[it.category] += 1;
      maxItemPoints += it.masteryPoints;
    }

    return {
      items,
      resources: resourceRows,
      counts,
      meta: {
        total: items.length,
        resourceCount: resourceRows.length,
        mastered: 0,
        maxItemPoints,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // ------------------------------------------------------------ persistence

  /**
   * Refetches every WFCD file, rebuilds the catalogue and stores it. Throws
   * without touching Mongo if a fetch fails, so a bad run leaves the last good
   * copy in place (same contract as the drop-data sync).
   */
  async sync(marketByName: Record<string, string> = {}): Promise<FoundryCatalogue["meta"]> {
    const files: Record<string, any[]> = {};
    const wanted = Array.from(new Set(SOURCES.map((s) => s.file)));
    for (const file of wanted) files[file] = await this.fetchFile(file);
    const resources = await this.fetchFile(RESOURCE_FILE);

    const built = FoundryService.buildCatalogue(files, resources, marketByName);
    const doc = {
      key: FOUNDRY_DOC_KEY,
      items: built.items,
      resources: built.resources,
      counts: built.counts,
      meta: built.meta,
      updatedAt: built.meta.updatedAt,
    };
    await this.db.getAnUpdateEntry({ key: FOUNDRY_DOC_KEY }, doc);
    return { ...built.meta, source: "live" };
  }

  /** The stored catalogue, or null when it has never been synced. */
  async get(): Promise<FoundryCatalogue | null> {
    const rows = (await this.db.allEntries({ key: FOUNDRY_DOC_KEY })) as any[];
    const doc = rows && rows[0];
    if (!doc || !Array.isArray(doc.items) || !doc.items.length) return null;
    return {
      items: doc.items,
      resources: doc.resources || [],
      counts: doc.counts || {},
      meta: { ...(doc.meta || {}), source: "db" },
    } as FoundryCatalogue;
  }
}
