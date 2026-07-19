/**
 * Shared item-category taxonomy. The same `categoryOf(tags)` logic was
 * copy-pasted across ~9 analytics pages (movers, flip, ducats, screener, …);
 * this is the single source of truth. Portfolio's alert picker adopts it; the
 * other copies can migrate here later.
 *
 * Categories are DERIVED FROM warframe.market `tags` — a flat, ~9-value,
 * non-hierarchical set. That flatness is exactly why the alert picker uses
 * single-select chips (not a treemap): see the Spec A design doc.
 */

/** Display order for the category chips. `All` is prepended by the option builder. */
export const CATEGORY_ORDER = [
  'Warframe',
  'Primary',
  'Secondary',
  'Melee',
  'Mod',
  'Sentinel',
  'Companion',
  'Arcane',
  'Other',
] as const

export type ItemCategory = (typeof CATEGORY_ORDER)[number]

/** Map an item's `tags` to its single top-level category (matches the legacy copies). */
export function categoryOf(tags: string[] = []): ItemCategory {
  const t = (tags || []).map((x) => (x || '').toLowerCase())
  if (t.includes('warframe')) return 'Warframe'
  if (t.includes('primary')) return 'Primary'
  if (t.includes('secondary')) return 'Secondary'
  if (t.includes('melee')) return 'Melee'
  if (t.includes('mod')) return 'Mod'
  if (t.includes('sentinel')) return 'Sentinel'
  if (t.includes('companion') || t.includes('pet')) return 'Companion'
  if (t.includes('arcane_enhancement') || t.includes('arcane')) return 'Arcane'
  return 'Other'
}

/**
 * Build the chip list for a set of items: `All` plus every category actually
 * present, in `CATEGORY_ORDER`. Hiding empty categories keeps the chip row short.
 */
export function categoryOptionsFor(items: Array<{ tags?: string[] }>): string[] {
  const present = new Set<string>()
  for (const it of items) present.add(categoryOf(it.tags))
  return ['All', ...CATEGORY_ORDER.filter((c) => present.has(c))]
}

export function useItemCategory() {
  return { categoryOf, categoryOptionsFor, CATEGORY_ORDER }
}
