import type { Guide } from '~/data/guides/types'
import { isGuideTranslationCurrent } from '~/utils/guide-translation'

// Lazy loaders for every generated locale override (data/guides/locales/<slug>.<locale>.json).
// Each is a separate chunk, so a page pulls only the one locale file it needs.
const overrides = import.meta.glob('../data/guides/locales/*.json')

/**
 * Return the guide content for the CURRENT locale: the machine-translated override
 * when it matches the source structure/date, else the canonical English guide. English keeps identifiers
 * (slug, ids, routes, video ids, icons) — the overrides only replace display prose.
 *
 * Awaited in the thin guide pages, so SSR renders the right language per prefixed
 * route (/es/guides/credits …) and falls back cleanly when a translation is missing.
 */
export async function useLocalizedGuide(slug: string, en: Guide): Promise<Guide> {
  const { locale } = useI18n()
  const loc = locale.value
  const fallback = () => ({ ...en, contentLanguage: 'en' })
  if (!loc || loc === 'en') return fallback()
  const key = `../data/guides/locales/${slug}.${loc}.json`
  const loader = overrides[key]
  if (!loader) return fallback()
  try {
    const mod = (await loader()) as { default?: Guide } & Guide
    const localized = mod.default ?? mod
    return isGuideTranslationCurrent(en, localized) ? { ...localized as Guide, contentLanguage: loc } : fallback()
  } catch {
    return fallback()
  }
}
