// A cached response from before quote coverage was introduced cannot prove
// that every required part has a quote. Keep its set price, but fail closed
// for part totals until a response with directional coverage arrives.
const quote = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null

export function normalizeComparisonRow(row: any) {
  const hasParts = Number.isInteger(row.partsCount) && row.partsCount > 0
  const setCost = quote(row.acquire?.setCost)
  const partsCost = hasParts && row.acquire?.missingParts === 0 ? quote(row.acquire?.partsCost) : null
  const setValue = quote(row.resale?.setValue)
  const partsValue = hasParts && row.resale?.missingParts === 0 ? quote(row.resale?.partsValue) : null
  const save = setCost !== null && partsCost !== null ? setCost - partsCost : null
  const extra = setValue !== null && partsValue !== null ? partsValue - setValue : null
  const percent = (difference: number | null, basis: number | null) => {
    if (difference === null || basis === null) return null
    const result = (difference / basis) * 100
    return Number.isFinite(result) ? result : null
  }
  const savePct = percent(save, setCost)
  const extraPct = percent(extra, setValue)
  return {
    ...row,
    acquire: { ...row.acquire, setCost, partsCost, save: savePct === null ? null : save, savePct },
    resale: { ...row.resale, setValue, partsValue, extra: extraPct === null ? null : extra, extraPct },
  }
}

/** Unknown values sort after every real comparison, including negative ones. */
export function compareKnownDescending(a: number | null, b: number | null) {
  if (a === null) return b === null ? 0 : 1
  if (b === null) return -1
  return b - a
}

export function comparisonVerdictKey(row: any): 'unavailable' | 'buy_parts' | 'buy_set' | 'even' {
  const save = row.acquire.save
  if (save === null) return 'unavailable'
  if (save > 0.5) return 'buy_parts'
  if (save < -0.5) return 'buy_set'
  return 'even'
}

export function comparisonStats(rows: any[]) {
  const comparable = rows.filter(row => row.acquire.save !== null)
  const partsCheaper = comparable.filter(row => row.acquire.save > 0)
  const setCheaper = comparable.filter(row => row.acquire.save < 0)
  return {
    total: comparable.length,
    partsCheaper: partsCheaper.length,
    setCheaper: setCheaper.length,
    avgSavePct: partsCheaper.length
      ? partsCheaper.reduce((sum, row) => sum + row.acquire.savePct / partsCheaper.length, 0)
      : null,
  }
}
