// Shared by the runtime loader and the offline editorial gate. A translated
// snapshot must preserve the source structure and destinations, not just its date.
const invariantKeys = new Set(['slug', 'id', 'type', 'category', 'num', 'tone', 'to', 'href', 'icon', 'updated'])

function structure(value: unknown, key = '', preserveText = false): unknown {
  if (typeof value === 'string') {
    if (preserveText || invariantKeys.has(key)) return value
    return { text: true, links: [...value.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]).sort() }
  }
  if (Array.isArray(value)) return value.map((entry) => structure(entry, '', preserveText))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([name, entry]) => [name, structure(entry, name,
        preserveText || ['sources', 'videos', 'video'].includes(name))]))
  }
  return value
}

export function isGuideTranslationCurrent(current: { slug: string; updated?: string }, localized: unknown): boolean {
  if (!localized || typeof localized !== 'object') return false
  const candidate = localized as { slug?: unknown; updated?: unknown }
  if (candidate.slug !== current.slug || candidate.updated !== current.updated) return false
  return JSON.stringify(structure(current)) === JSON.stringify(structure(localized))
}
