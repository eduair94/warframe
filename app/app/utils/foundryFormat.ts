/**
 * Interop with **warframe-foundry.app**'s `warframe-foundry.json` backup file.
 *
 * That tool is the mastery/build checklist a lot of Tenno already use, and its
 * only persistence is browser localStorage — its own author's standing advice is
 * "export your data at some point, just to be 200% safe". So the migration path
 * that actually matters is: take their export, keep it in an account, and never
 * lose it again. This module is both halves of that — read their file, and write
 * one they can read back, so nobody is locked in either direction.
 *
 * Their format (confirmed against the live app, version 2):
 *
 * ```json
 * {
 *   "items":     { "data": { "SapientPrimaryWeapon": { "SapientPrimaryBlueprint": 1, "built": true, "mastered": true } } },
 *   "resources": { "Ferrite": 0, "Nanospores": 0, ... every resource key ... },
 *   "settings":  { "missionCount": 0, "junctionCount": 0, ..., "excludedItems": [] },
 *   "version": 2
 * }
 * ```
 *
 * Version 1 files are still in the wild and carry a *per-category* shape instead
 * of one `items.data`: `{ primary: { data: {…} }, secondary: { data: {…} }, … }`.
 * Both are accepted — merging the seven category maps is exactly what their own
 * in-app migration does.
 *
 * Two quirks worth knowing, both confirmed in their code:
 *  - component counts are stored as SIBLINGS of `built`/`mastered` inside the
 *    same object, so `built`/`mastered` are reserved names in that namespace. We
 *    normalise them into a separate `comp` map and flatten again on export.
 *  - their own resource importer is broken (it tests `state.hasOwnProperty(key)`
 *    against the wrong object), so real users' "Have" numbers are usually all
 *    zeros. We still read them — a zero costs nothing — but do not treat an
 *    all-zero resource block as meaningful data.
 *
 * Pure functions, no Vue/Nuxt imports, so the whole file is unit-testable under
 * the backend jest setup (see test-helpers/foundryFormat.logic.test.ts).
 */

import type { FoundryCounters, FoundryData, FoundryItemProgress } from './userStorage'

/** The seven per-category buckets a version-1 file splits its items across. */
const V1_CATEGORIES = [
  'primary',
  'secondary',
  'melee',
  'warframes',
  'companions',
  'archwing',
  'miscellaneous',
] as const

/** Keys inside an item record that are flags, not component counts. */
const ITEM_FLAGS = new Set(['built', 'mastered'])

/** Their settings key -> our counter name. */
const COUNTER_KEYS: Array<[string, keyof FoundryCounters]> = [
  ['missionCount', 'missions'],
  ['junctionCount', 'junctions'],
  ['steelMissionCount', 'steelMissions'],
  ['steelJunctionCount', 'steelJunctions'],
  ['intrinsicsCount', 'intrinsics'],
]

export interface FoundryImportResult {
  data: FoundryData
  /** What we actually understood, for the "imported N items" confirmation. */
  stats: {
    version: number
    items: number
    built: number
    mastered: number
    components: number
    resources: number
    excluded: number
  }
}

function intOf(value: unknown, max = 10_000_000): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : (value as number)
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.round(n), max)
}

function isKey(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value.trim())
}

/** True when `json` looks like a warframe-foundry.app backup file. */
export function isFoundryExport(json: any): boolean {
  if (!json || typeof json !== 'object') return false
  if (typeof json.version !== 'number') return false
  if (json.items && typeof json.items === 'object' && json.items.data) return true
  return V1_CATEGORIES.some((c) => json[c] && typeof json[c] === 'object' && json[c].data)
}

/** Pulls the flat `uniqueKey -> record` progress map out of either file version. */
function progressMapOf(json: any): Record<string, any> {
  if (json?.items?.data && typeof json.items.data === 'object') {
    return json.items.data as Record<string, any>
  }
  const merged: Record<string, any> = {}
  for (const category of V1_CATEGORIES) {
    const data = json?.[category]?.data
    if (data && typeof data === 'object') Object.assign(merged, data)
  }
  return merged
}

/**
 * Parses a `warframe-foundry.json` (v1 or v2) into our normalized shape.
 * Never throws — an unrecognised file yields empty data with `items: 0`, which
 * the UI reports as "nothing to import" rather than an error dialog.
 */
export function parseFoundryExport(json: any): FoundryImportResult {
  const data: FoundryData = { items: {}, resources: {}, counters: {}, excluded: [] }
  const stats = {
    version: typeof json?.version === 'number' ? json.version : 0,
    items: 0,
    built: 0,
    mastered: 0,
    components: 0,
    resources: 0,
    excluded: 0,
  }
  if (!json || typeof json !== 'object') return { data, stats }

  for (const [rawKey, rawRecord] of Object.entries(progressMapOf(json))) {
    const key = isKey(rawKey) ? rawKey.trim() : ''
    if (!key || !rawRecord || typeof rawRecord !== 'object') continue
    const record = rawRecord as Record<string, unknown>
    const entry: FoundryItemProgress = {}
    if (record.built === true) entry.built = true
    if (record.mastered === true) entry.mastered = true
    const comp: Record<string, number> = {}
    for (const [ck, cv] of Object.entries(record)) {
      if (ITEM_FLAGS.has(ck)) continue
      if (!isKey(ck)) continue
      const n = intOf(cv)
      if (n > 0) comp[ck] = n
    }
    if (Object.keys(comp).length) entry.comp = comp
    // Their exporter already strips empty records; skip any that slipped through.
    if (!entry.built && !entry.mastered && !entry.comp) continue
    data.items[key] = entry
    stats.items++
    if (entry.built) stats.built++
    if (entry.mastered) stats.mastered++
    stats.components += Object.keys(entry.comp || {}).length
  }

  if (json.resources && typeof json.resources === 'object') {
    for (const [rawKey, rawValue] of Object.entries(json.resources)) {
      if (!isKey(rawKey)) continue
      const n = intOf(rawValue)
      // Their export always writes every resource key, mostly as 0 — storing
      // those would be pure noise.
      if (n > 0) {
        data.resources[rawKey.trim()] = n
        stats.resources++
      }
    }
  }

  const settings = json.settings && typeof json.settings === 'object' ? json.settings : {}
  for (const [theirs, ours] of COUNTER_KEYS) {
    const n = intOf((settings as any)[theirs], 1_000_000)
    if (n > 0) data.counters[ours] = n
  }
  if (Array.isArray((settings as any).excludedItems)) {
    const seen = new Set<string>()
    for (const raw of (settings as any).excludedItems) {
      if (isKey(raw)) seen.add(String(raw).trim())
    }
    data.excluded = Array.from(seen)
    stats.excluded = data.excluded.length
  }

  data.updatedAt = new Date().toISOString()
  return { data, stats }
}

export interface FoundryExportOptions {
  /**
   * Every resource key in the catalogue. Their exporter always writes the full
   * set (zeros included) and their UI iterates it, so a partial block would show
   * up over there as a shorter resource table.
   */
  resourceKeys?: string[]
}

/**
 * Serializes our foundry progress into a version-2 `warframe-foundry.json`
 * that warframe-foundry.app can import verbatim.
 *
 * The `settings` block is written in full because their importer dispatches
 * `settings/importData` with whatever it receives; sending their own defaults
 * for the cosmetic keys keeps that side in a valid state instead of half-set.
 */
export function toFoundryExport(
  data: FoundryData | null | undefined,
  options: FoundryExportOptions = {}
): Record<string, any> {
  const items: Record<string, any> = {}
  for (const [key, entry] of Object.entries(data?.items || {})) {
    if (!entry) continue
    const record: Record<string, any> = {}
    // Component counts are siblings of the flags in their format.
    for (const [ck, cv] of Object.entries(entry.comp || {})) {
      const n = intOf(cv)
      if (n > 0 && !ITEM_FLAGS.has(ck)) record[ck] = n
    }
    if (entry.built) record.built = true
    if (entry.mastered) record.mastered = true
    // They strip empty records on export; match that so a round trip is stable.
    if (Object.keys(record).length) items[key] = record
  }

  const resources: Record<string, number> = {}
  const keys = options.resourceKeys && options.resourceKeys.length
    ? options.resourceKeys
    : Object.keys(data?.resources || {})
  for (const key of keys) resources[key] = intOf(data?.resources?.[key])
  // Anything the player has a count for but that is not in the catalogue must
  // still survive the round trip.
  for (const [key, value] of Object.entries(data?.resources || {})) {
    if (!(key in resources)) resources[key] = intOf(value)
  }

  const counters = data?.counters || {}
  return {
    items: { data: items },
    resources,
    settings: {
      showImages: true,
      showComponents: true,
      hideBuiltItems: false,
      hideMasteredItems: false,
      showFounderItems: false,
      pagination: {
        descending: false,
        page: 1,
        rowsPerPage: 24,
        sortBy: null,
        totalItems: 0,
      },
      missionCount: intOf(counters.missions, 1_000_000),
      junctionCount: intOf(counters.junctions, 1_000_000),
      steelMissionCount: intOf(counters.steelMissions, 1_000_000),
      steelJunctionCount: intOf(counters.steelJunctions, 1_000_000),
      intrinsicsCount: intOf(counters.intrinsics, 1_000_000),
      excludedSearchTerm: null,
      excludedItems: Array.isArray(data?.excluded) ? data!.excluded.slice() : [],
    },
    version: 2,
  }
}

/**
 * Union of two progress sets, taking the higher value on every collision.
 * Used when importing on top of existing progress: a player importing an old
 * backup must never lose a tick they have made since.
 */
export function mergeFoundryData(a: FoundryData, b: FoundryData): FoundryData {
  const items: Record<string, FoundryItemProgress> = {}
  for (const key of new Set([...Object.keys(a?.items || {}), ...Object.keys(b?.items || {})])) {
    const x = a?.items?.[key] || {}
    const y = b?.items?.[key] || {}
    const entry: FoundryItemProgress = {}
    if (x.built || y.built) entry.built = true
    if (x.mastered || y.mastered) entry.mastered = true
    const comp: Record<string, number> = {}
    for (const ck of new Set([...Object.keys(x.comp || {}), ...Object.keys(y.comp || {})])) {
      const n = Math.max(x.comp?.[ck] || 0, y.comp?.[ck] || 0)
      if (n > 0) comp[ck] = n
    }
    if (Object.keys(comp).length) entry.comp = comp
    if (entry.built || entry.mastered || entry.comp) items[key] = entry
  }

  const resources: Record<string, number> = {}
  for (const key of new Set([
    ...Object.keys(a?.resources || {}),
    ...Object.keys(b?.resources || {}),
  ])) {
    const n = Math.max(a?.resources?.[key] || 0, b?.resources?.[key] || 0)
    if (n > 0) resources[key] = n
  }

  const counters: FoundryCounters = { ...(a?.counters || {}) }
  for (const [k, v] of Object.entries(b?.counters || {})) {
    const key = k as keyof FoundryCounters
    counters[key] = Math.max(counters[key] || 0, Number(v) || 0)
  }

  return {
    items,
    resources,
    counters,
    excluded: Array.from(new Set([...(a?.excluded || []), ...(b?.excluded || [])])),
    updatedAt: new Date().toISOString(),
  }
}
