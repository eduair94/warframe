/**
 * Runtime vue-i18n options.
 *
 * The message dictionaries are NOT here any more. This file used to import
 * `translations.ts` plus every `i18n/messages/*.ts` module and merge them into
 * one `messages` object — and since each of those modules carries all thirteen
 * locales inline, the merged result (1.7 MB of source) was bundled into the
 * CLIENT ENTRY CHUNK. Every visitor downloaded the German, Korean, Japanese,
 * Ukrainian … translations in order to read the site in one language: a 1.37 MB
 * entry script, and the largest single contributor to blocking time.
 *
 * Messages are now generated per locale by `scripts/build-locales.mts` into
 * `i18n/locales/<code>.json` and lazy-loaded by @nuxtjs/i18n (see `i18n.lazy` /
 * `i18n.langDir` in nuxt.config.ts), so a visitor loads one language (~97 KB).
 * The per-page `i18n/messages/*.ts` modules remain the source of truth — the
 * generator is wired into `prebuild`/`predev`, and `npm run i18n:check` still
 * reads them directly.
 *
 * Vuetify's own `$vuetify.*` UI strings are merged into each generated file, so
 * the Vuetify-via-vue-i18n wiring still resolves data-table sort labels,
 * no-data text, pagination and friends.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  // Each generated locale file is COMPLETE — English is layered underneath the
  // locale's own strings at generation time — so there is nothing left for a
  // runtime fallback to find. Pointing this at 'en' would only make the lazy
  // loader fetch the English dictionary alongside every other language.
  fallbackLocale: false,
}))
