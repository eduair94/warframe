/** Refresh exchange values from the bulk catalogue without touching live prices. */
export function getDucatMetadataUpdate(
  stored: { id?: unknown; url_name?: unknown; ducats?: unknown } | null | undefined,
  source: { id?: unknown; slug?: unknown; ducats?: unknown } | null | undefined,
): { ducats: number } | null {
  if (
    !stored || !source ||
    typeof stored.id !== 'string' || !stored.id || stored.id !== source.id ||
    typeof stored.url_name !== 'string' || !stored.url_name || stored.url_name !== source.slug
  ) return null;

  // Missing metadata is not a zero value. A malformed response must not erase
  // the last known value or introduce NaN/string values into the calculator.
  const ducats = source.ducats;
  if (typeof ducats !== 'number' || !Number.isSafeInteger(ducats) || ducats < 0) return null;
  if (stored.ducats === ducats) return null;

  // A partial update deliberately excludes prices, review/enrichment dates and
  // the set roster. In particular, never write a stale market snapshot back.
  return { ducats };
}

/** A compare-and-set write: skip deletions or concurrent metadata changes. */
export function getDucatMetadataWrite(
  stored: { id?: unknown; url_name?: unknown; ducats?: unknown } | null | undefined,
  source: { id?: unknown; slug?: unknown; ducats?: unknown } | null | undefined,
) {
  const patch = getDucatMetadataUpdate(stored, source);
  if (!patch || !stored) return null;
  return {
    filter: {
      id: stored.id,
      url_name: stored.url_name,
      ducats: stored.ducats === undefined ? { $exists: false } : stored.ducats,
    },
    update: { $set: patch },
    options: { upsert: false },
  };
}
