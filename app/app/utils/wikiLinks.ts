/**
 * Warframe wiki (fandom) links for star-chart worlds — the article page for
 * every world plus the wiki's interactive maps (Special:AllMaps) for the
 * open-world zones. Pure module: auto-imported by Nuxt from `utils/`.
 *
 * Every article title below was verified against the MediaWiki API
 * (action=query) on 2026-07-14 — no guessed links.
 */

const WIKI_BASE = 'https://warframe.fandom.com/wiki/'

/** Worlds whose wiki article title differs from the drop-map name. */
const ARTICLE_OVERRIDES: Record<string, string> = {
  Void: 'The Void',
  Zariman: 'Zariman Ten Zero',
  Sanctuary: 'Sanctuary Onslaught',
  // Entrati lab zone grouped under its host world's article
  'Dark Refractory, Deimos': 'Deimos',
}

/** The wiki's interactive maps (fandom Special:AllMaps), keyed by world. */
const INTERACTIVE_MAPS: Record<string, { title: string; path: string }> = {
  Earth: { title: 'Plains of Eidolon', path: 'Map:Plains_of_Eidolon' },
  Venus: { title: 'Orb Vallis', path: 'Map:Orb_Vallis' },
  Deimos: { title: 'Cambion Drift', path: 'Map:Cambion_Drift' },
  Duviri: { title: 'Duviri', path: 'Map:Duviri' },
}

function wikiUrl(title: string): string {
  return WIKI_BASE + encodeURIComponent(title.replace(/ /g, '_'))
}

/** Wiki article URL for a world (always resolvable — falls back to the name). */
export function worldWikiUrl(world: string): string {
  return wikiUrl(ARTICLE_OVERRIDES[world] ?? world)
}

/** Interactive wiki map for a world, or null when it has none. */
export function worldWikiMap(world: string): { title: string; url: string } | null {
  const m = INTERACTIVE_MAPS[world]
  return m ? { title: m.title, url: WIKI_BASE + m.path } : null
}
