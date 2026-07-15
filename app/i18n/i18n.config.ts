import translations from './translations'
import { en as vuetifyEn, es as vuetifyEs, pt as vuetifyPt } from 'vuetify/locale'

// The Vuetify Nuxt module wires Vuetify to use vue-i18n as its locale source, so
// Vuetify resolves its own `$vuetify.*` strings (data-table sort labels, no-data
// text, input "clear" aria-label, pagination, …) against THESE messages — not
// Vuetify's built-in packs. Without this, those keys render raw as
// `$vuetify.dataTable.sortBy` etc. Merge Vuetify's locale packs under `$vuetify`
// for every locale so both the translated app strings and Vuetify's UI strings
// resolve.
type Dict = Record<string, any>
const base = translations as unknown as Dict
const messages: Dict = {
  ...base,
  en: { ...(base.en || {}), $vuetify: vuetifyEn },
  es: { ...(base.es || {}), $vuetify: vuetifyEs },
  pt: { ...(base.pt || {}), $vuetify: vuetifyPt },
}

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'es',
  messages,
}))
