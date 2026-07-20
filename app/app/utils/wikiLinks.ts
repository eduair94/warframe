/**
 * Warframe wiki links for star-chart worlds, nodes, and items. The wiki migrated
 * off Fandom to wiki.warframe.com (path prefix /w/) on 2025-01-31 — Fandom is a
 * stale fork that 403s, so all links target the official host.
 *
 * Node deep-links use a disambiguated title (some node names collide with an
 * item/frame article) — the backend supplies that title as `wikiLink`.
 */

const WIKI_BASE = 'https://wiki.warframe.com/w/'

/** Worlds whose wiki article title differs from the drop-map name. */
const ARTICLE_OVERRIDES: Record<string, string> = {
  Void: 'The Void',
  Zariman: 'Zariman Ten Zero',
  Sanctuary: 'Sanctuary Onslaught',
  'Dark Refractory, Deimos': 'Deimos',
}

/**
 * Open-world articles on the new wiki (the old Fandom Special:AllMaps interactive
 * maps do not exist there, so these point at the landscape's article page).
 */
const INTERACTIVE_MAPS: Record<string, { title: string; path: string }> = {
  Earth: { title: 'Plains of Eidolon', path: 'Plains_of_Eidolon' },
  Venus: { title: 'Orb Vallis', path: 'Orb_Vallis' },
  Deimos: { title: 'Cambion Drift', path: 'Cambion_Drift' },
  Duviri: { title: 'Duviri', path: 'Duviri' },
}

function wikiUrl(title: string): string {
  return WIKI_BASE + encodeURIComponent(title.replace(/ /g, '_'))
}

/** Wiki article URL for a world (always resolvable — falls back to the name). */
export function worldWikiUrl(world: string): string {
  return wikiUrl(ARTICLE_OVERRIDES[world] ?? world)
}

/** Wiki article for a world's open-world landscape, or null when it has none. */
export function worldWikiMap(world: string): { title: string; url: string } | null {
  const m = INTERACTIVE_MAPS[world]
  return m ? { title: m.title, url: wikiUrl(m.path) } : null
}

/** Wiki article for a mission node, using the backend's disambiguated title. */
export function nodeWikiUrl(wikiLink: string): string {
  const s = (wikiLink || '').trim()
  return s ? wikiUrl(s) : ''
}

/**
 * Best-effort wiki article for any drop/reward/item name. Strips a leading
 * quantity ("100X Rubedo" → "Rubedo", "3,000 Credits Cache" → …) and a
 * trailing parenthetical ("Cephalon Capture (Extra)" → …) so the link lands on
 * the real article; the fandom wiki auto-suggests if an exact page is missing.
 * Returns '' for empty input so callers can v-if it away.
 */
export function itemWikiUrl(name: string): string {
  let s = (name || '').trim()
  if (!s) return ''
  s = s
    .replace(/^\d[\d,.]*\s*[x×]?\s+/i, '') // quantity prefix
    .replace(/\s*\([^)]*\)\s*$/, '') // trailing (Extra) / (Radiant) …
    .trim()
  if (!s) return ''
  return wikiUrl(s)
}
