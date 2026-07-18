import { defineStore } from 'pinia'

/** A localized name dictionary: English `url_name`/slug -> localized display name. */
export type NameMap = Record<string, string>

interface TranslationsState {
  /** Keyed by `${scope}:${locale}` -> { slug: localizedName }. */
  maps: Record<string, NameMap>
  /** Fetch guards, keyed like `maps`, to avoid duplicate concurrent requests. */
  loaded: Record<string, boolean>
}

/**
 * Holds the localized game-noun name dictionaries fetched from the API's
 * `/i18n/:scope/:lang` endpoint. English is the canonical language and needs no
 * dictionary (names are already the English `item_name`), so `en` is a no-op.
 *
 * State is filled during SSR for the active locale (app.vue) and rehydrated on
 * the client by @pinia/nuxt, so localized names appear in the server-rendered
 * HTML (required for search indexing) without a second client fetch. Any missing
 * key falls back to the English name in `useLocalizedName`.
 */
export const useTranslationsStore = defineStore('translations', {
  state: (): TranslationsState => ({
    maps: {},
    loaded: {},
  }),
  getters: {
    /** The `{ slug -> name }` dictionary for a scope+locale (empty if unloaded/en). */
    nameMap:
      (state) =>
      (scope: string, locale: string): NameMap =>
        state.maps[`${scope}:${locale}`] || {},
  },
  actions: {
    /**
     * Ensures the dictionary for `scope`+`locale` is loaded (once). No-op for
     * English or an already-loaded pair. Safe to call repeatedly and from both
     * SSR and client (e.g. a locale switch).
     */
    async ensureScope(scope: string, locale: string): Promise<void> {
      if (!locale || locale === 'en') return
      const key = `${scope}:${locale}`
      if (this.loaded[key]) return
      this.loaded[key] = true // optimistic guard against duplicate concurrent fetches
      try {
        const base = useApiBase()
        const res = await $fetch<{ map?: NameMap }>(
          `${base}/i18n/${scope}/${locale}`,
          { retry: 1, timeout: 15000 },
        )
        this.maps[key] = res?.map || {}
      } catch {
        // Leave the map empty (English fallback) and allow a later retry.
        this.maps[key] = {}
        this.loaded[key] = false
      }
    },
  },
})
