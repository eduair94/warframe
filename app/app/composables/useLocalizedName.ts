/**
 * Resolves localized display names for Warframe game nouns (items, riven
 * weapons/attributes, locations, missions, npcs, …) using the dictionaries in
 * `useTranslationsStore`, keyed by the stable English `url_name`/slug.
 *
 * English is canonical, so on the `en` locale (or for any missing key) the
 * English fallback is returned verbatim — display never shows a blank or a raw
 * slug. Internal logic (set detection, lookups, URL building) must keep using
 * the English `item_name`/`url_name`; only DISPLAY should use these helpers.
 *
 * The dictionary for a scope must be loaded first (see `useTranslationsStore`):
 * `items` is loaded globally in app.vue; page-specific scopes are loaded by the
 * pages that render them via `store.ensureScope(scope, locale)`.
 */
export function useLocalizedName() {
  const { locale } = useI18n()
  const store = useTranslationsStore()

  /** Localize one key within a scope, falling back to the English `fallback`. */
  const localName = (scope: string, key: string | undefined | null, fallback = ''): string => {
    if (!key || locale.value === 'en') return fallback
    return store.maps[`${scope}:${locale.value}`]?.[key] ?? fallback
  }

  /** Convenience for catalogue items: localize by `url_name`, fall back to `item_name`. */
  const localItemName = (item: { url_name?: string; item_name?: string } | null | undefined): string => {
    if (!item) return ''
    return localName('items', item.url_name, item.item_name ?? '')
  }

  /** Ensure a scope's dictionary is loaded for the active locale (fire-and-forget). */
  const ensureScope = (scope: string): Promise<void> => store.ensureScope(scope, locale.value)

  return { localName, localItemName, ensureScope }
}
