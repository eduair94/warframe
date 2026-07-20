/**
 * Progress, mastery and cost maths for the /foundry tracker.
 *
 * Everything here is a PURE function over plain objects — no Vue reactivity, no
 * Nuxt — so it is unit-tested under the backend's jest setup (see
 * test-helpers/useFoundryProgress.logic.test.ts).
 *
 * The mastery formula matches what the game awards, and deliberately matches
 * what warframe-foundry.app computes, so a migrating user sees the same number
 * they are used to:
 *
 *   points = Σ(mastered item points)
 *          + 1000 × junctions      + 1000 × steel junctions
 *          +   63 × missions       +   63 × steel missions
 *          + 1500 × intrinsics
 *
 * Where this tool goes beyond a checklist is the last section: pricing the gear
 * you have NOT built yet against live market data, so "what is left" becomes a
 * platinum number and a buy-or-farm decision.
 */

/** Mastery awarded per junction cleared. */
export const POINTS_PER_JUNCTION = 1000
/** Mastery awarded per star-chart mission node cleared. */
export const POINTS_PER_MISSION = 63
/** Mastery awarded per intrinsic rank (Railjack / Drifter). */
export const POINTS_PER_INTRINSIC = 1500

export type FoundryCategory =
  | 'warframes'
  | 'primary'
  | 'secondary'
  | 'melee'
  | 'companions'
  | 'archwing'
  | 'miscellaneous'

export interface CatalogueComponent {
  uniqueKey: string
  name: string
  itemCount: number
  imageName?: string
  resource?: boolean
  /** warframe.market url_name, when tradable. */
  market?: string
}

export interface CatalogueItem {
  uniqueKey: string
  uniqueName: string
  name: string
  category: FoundryCategory
  masteryReq: number
  masteryPoints: number
  imageName?: string
  wikiaUrl?: string
  vaulted?: boolean
  founderOnly?: boolean
  components: CatalogueComponent[]
  market?: string
}

export interface CatalogueResource {
  uniqueKey: string
  name: string
  imageName?: string
  perCategory: Record<string, number>
  total: number
  market?: string
}

export interface FoundryProgressItem {
  built?: boolean
  mastered?: boolean
  comp?: Record<string, number>
}

export interface FoundryProgress {
  items: Record<string, FoundryProgressItem>
  resources: Record<string, number>
  counters: {
    missions?: number
    junctions?: number
    steelMissions?: number
    steelJunctions?: number
    intrinsics?: number
  }
  excluded: string[]
}

/** Cumulative mastery thresholds for ranks 0-34. */
export function rankThresholds(): number[] {
  const out: number[] = []
  for (let rank = 0; rank <= 30; rank++) out.push(2500 * rank * rank)
  // Legendary ranks add a flat 147 500 each on top of rank 30's 2 250 000.
  for (let rank = 31; rank <= 34; rank++) out.push(out[30] + 147_500 * (rank - 30))
  return out
}

export interface RankInfo {
  rank: number
  /** Display label — "Legendary 3" past rank 30. */
  label: string
  points: number
  /** Points needed for the next rank, null at the cap. */
  nextAt: number | null
  /** Progress towards the next rank in [0,1]. */
  progress: number
}

export function rankInfo(points: number): RankInfo {
  const t = rankThresholds()
  const p = Math.max(0, Math.round(Number(points) || 0))
  let rank = 0
  for (let i = 0; i < t.length; i++) if (p >= t[i]) rank = i
  const nextAt = rank + 1 < t.length ? t[rank + 1] : null
  const floor = t[rank]
  const progress = nextAt === null ? 1 : Math.min(1, (p - floor) / (nextAt - floor))
  const label = rank > 30 ? `Legendary ${rank - 30}` : String(rank)
  return { rank, label, points: p, nextAt, progress }
}

/** Mastery points earned from the mission / junction / intrinsic counters. */
export function counterPoints(counters: FoundryProgress['counters'] = {}): number {
  const n = (v: unknown) => Math.max(0, Math.round(Number(v) || 0))
  return (
    POINTS_PER_JUNCTION * n(counters.junctions) +
    POINTS_PER_JUNCTION * n(counters.steelJunctions) +
    POINTS_PER_MISSION * n(counters.missions) +
    POINTS_PER_MISSION * n(counters.steelMissions) +
    POINTS_PER_INTRINSIC * n(counters.intrinsics)
  )
}

export interface CategoryProgress {
  category: string
  total: number
  built: number
  mastered: number
  /** Mastered / total in [0,1]. */
  ratio: number
  points: number
  maxPoints: number
}

export interface FoundrySummary {
  total: number
  built: number
  mastered: number
  ratio: number
  itemPoints: number
  counterPoints: number
  points: number
  maxItemPoints: number
  rank: RankInfo
  byCategory: CategoryProgress[]
}

/**
 * Overall + per-category progress.
 *
 * `excluded` items are HIDDEN, not completed — warframe-foundry.app users use
 * the exclusion list to drop gear they will never build, so counting it as done
 * would inflate their rank. It is removed from both sides of the ratio instead.
 */
export function summarize(
  catalogue: CatalogueItem[],
  progress: FoundryProgress,
  options: { includeFounder?: boolean } = {}
): FoundrySummary {
  const excluded = new Set(progress?.excluded || [])
  const items = (catalogue || []).filter((it) => {
    if (!it) return false
    if (excluded.has(it.uniqueKey)) return false
    if (it.founderOnly && !options.includeFounder) return false
    return true
  })

  const buckets = new Map<string, CategoryProgress>()
  let built = 0
  let mastered = 0
  let itemPoints = 0
  let maxItemPoints = 0

  for (const it of items) {
    let bucket = buckets.get(it.category)
    if (!bucket) {
      bucket = {
        category: it.category,
        total: 0,
        built: 0,
        mastered: 0,
        ratio: 0,
        points: 0,
        maxPoints: 0,
      }
      buckets.set(it.category, bucket)
    }
    bucket.total++
    bucket.maxPoints += it.masteryPoints
    maxItemPoints += it.masteryPoints

    const rec = progress?.items?.[it.uniqueKey]
    if (rec?.built || rec?.mastered) {
      built++
      bucket.built++
    }
    if (rec?.mastered) {
      mastered++
      bucket.mastered++
      itemPoints += it.masteryPoints
      bucket.points += it.masteryPoints
    }
  }

  for (const bucket of buckets.values()) {
    bucket.ratio = bucket.total ? bucket.mastered / bucket.total : 0
  }

  const cPoints = counterPoints(progress?.counters)
  const points = itemPoints + cPoints
  return {
    total: items.length,
    built,
    mastered,
    ratio: items.length ? mastered / items.length : 0,
    itemPoints,
    counterPoints: cPoints,
    points,
    maxItemPoints,
    rank: rankInfo(points),
    byCategory: Array.from(buckets.values()),
  }
}

export interface ResourceNeed {
  uniqueKey: string
  name: string
  imageName?: string
  /** Units still required by everything not yet built. */
  needed: number
  /** Units the player says they have. */
  have: number
  /** needed - have, floored at zero. */
  short: number
  market?: string
}

/**
 * Raw resources still required, counting ONLY items that are not built yet.
 *
 * This is the number a checklist exists to produce, and it is why "built" has to
 * be tracked separately from "mastered": a mastered-and-sold item no longer
 * needs its resources, but an un-built one on your list still does.
 */
export function resourceNeeds(
  catalogue: CatalogueItem[],
  resources: CatalogueResource[],
  progress: FoundryProgress,
  options: { includeFounder?: boolean } = {}
): ResourceNeed[] {
  const excluded = new Set(progress?.excluded || [])
  const needed = new Map<string, number>()

  for (const it of catalogue || []) {
    if (!it || excluded.has(it.uniqueKey)) continue
    if (it.founderOnly && !options.includeFounder) continue
    const rec = progress?.items?.[it.uniqueKey]
    if (rec?.built) continue
    for (const comp of it.components || []) {
      if (!comp?.resource) continue
      // A component already owned no longer consumes its resources. Components
      // are all-or-nothing per unit, so partial ownership scales the remainder.
      const owned = Math.min(rec?.comp?.[comp.uniqueKey] || 0, comp.itemCount)
      const remaining = Math.max(0, comp.itemCount - owned)
      if (!remaining) continue
      needed.set(comp.uniqueKey, (needed.get(comp.uniqueKey) || 0) + remaining)
    }
  }

  const byKey = new Map((resources || []).map((r) => [r.uniqueKey, r]))
  const rows: ResourceNeed[] = []
  for (const [uniqueKey, amount] of needed) {
    const meta = byKey.get(uniqueKey)
    const have = Math.max(0, Math.round(progress?.resources?.[uniqueKey] || 0))
    rows.push({
      uniqueKey,
      name: meta?.name || uniqueKey,
      imageName: meta?.imageName,
      needed: amount,
      have,
      short: Math.max(0, amount - have),
      market: meta?.market,
    })
  }
  return rows.sort((a, b) => b.short - a.short || b.needed - a.needed || a.name.localeCompare(b.name))
}

export interface MissingCost {
  uniqueKey: string
  name: string
  category: FoundryCategory
  masteryPoints: number
  vaulted?: boolean
  /** Platinum to buy it outright, when it is tradable and priced. */
  plat: number | null
  market?: string
  /** plat / masteryPoints — the "cheapest mastery" ranking. */
  platPerPoint: number | null
}

/**
 * Prices everything the player has not mastered yet.
 *
 * This is the part a pure checklist cannot do and the reason this tracker lives
 * on a market site: it turns "437 items left" into "4 180 platinum, and here is
 * the cheapest mastery you can buy today".
 *
 * @param priceOf resolves a warframe.market url_name to a platinum price
 *                (whatever basis the caller prefers — ask, average, realizable).
 */
export function missingCosts(
  catalogue: CatalogueItem[],
  progress: FoundryProgress,
  priceOf: (urlName: string) => number | null | undefined,
  options: { includeFounder?: boolean } = {}
): MissingCost[] {
  const excluded = new Set(progress?.excluded || [])
  const rows: MissingCost[] = []
  for (const it of catalogue || []) {
    if (!it || excluded.has(it.uniqueKey)) continue
    if (it.founderOnly && !options.includeFounder) continue
    if (progress?.items?.[it.uniqueKey]?.mastered) continue
    const raw = it.market ? priceOf(it.market) : null
    const plat = typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null
    rows.push({
      uniqueKey: it.uniqueKey,
      name: it.name,
      category: it.category,
      masteryPoints: it.masteryPoints,
      vaulted: it.vaulted,
      plat,
      market: it.market,
      platPerPoint: plat === null || !it.masteryPoints ? null : plat / it.masteryPoints,
    })
  }
  return rows
}

export interface MissingCostTotals {
  items: number
  priced: number
  /** Total platinum to buy every priced missing item. */
  plat: number
  /** Mastery points those purchases would award. */
  points: number
  /** The best plat-per-mastery-point buys, cheapest first. */
  bestValue: MissingCost[]
}

export function summarizeMissingCosts(rows: MissingCost[], topN = 10): MissingCostTotals {
  let plat = 0
  let points = 0
  let priced = 0
  for (const row of rows) {
    if (row.plat === null) continue
    priced++
    plat += row.plat
    points += row.masteryPoints
  }
  const bestValue = rows
    .filter((r) => r.platPerPoint !== null)
    .sort((a, b) => (a.platPerPoint as number) - (b.platPerPoint as number))
    .slice(0, topN)
  return { items: rows.length, priced, plat, points, bestValue }
}

/**
 * Which items to tick when the user asks to "mark everything up to MR X".
 * Returns the uniqueKeys — the caller passes them to `bulkFoundryMastered`.
 */
export function keysUpToMasteryReq(
  catalogue: CatalogueItem[],
  maxMasteryReq: number,
  options: { includeFounder?: boolean } = {}
): string[] {
  const cap = Math.max(0, Math.round(Number(maxMasteryReq) || 0))
  return (catalogue || [])
    .filter((it) => it && it.masteryReq <= cap && (options.includeFounder || !it.founderOnly))
    .map((it) => it.uniqueKey)
}
