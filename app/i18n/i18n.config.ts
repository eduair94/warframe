import translations from './translations'
import {
  en as vEn, es as vEs, pt as vPt, de as vDe, fr as vFr, ru as vRu,
  ko as vKo, ja as vJa, zhHans as vZhHans, zhHant as vZhHant,
  pl as vPl, it as vIt, uk as vUk
} from 'vuetify/locale'

// The Vuetify Nuxt module wires Vuetify to use vue-i18n as its locale source, so
// Vuetify resolves its own `$vuetify.*` strings (data-table sort labels, no-data
// text, input "clear" aria-label, pagination, …) against THESE messages — not
// Vuetify's built-in packs. Without this, those keys render raw as
// `$vuetify.dataTable.sortBy` etc. Merge Vuetify's locale packs under `$vuetify`
// for every locale so both the translated app strings and Vuetify's UI strings
// resolve.
type Dict = Record<string, any>

// Vuetify UI-string packs keyed by our i18n locale codes.
const VUETIFY: Record<string, any> = {
  en: vEn, es: vEs, pt: vPt, de: vDe, fr: vFr, ru: vRu, ko: vKo, ja: vJa,
  'zh-hans': vZhHans, 'zh-hant': vZhHant, pl: vPl, it: vIt, uk: vUk
}

// Every shipped locale (must match nuxt.config i18n.locales codes).
const LOCALE_CODES = Object.keys(VUETIFY)

// Deep-merge so page namespace modules (i18n/messages/*.ts) can each contribute
// their own `{ en, es, pt, … }` slice without clobbering the shared dictionary.
function deepMerge(target: Dict, src: Dict): Dict {
  for (const k of Object.keys(src)) {
    const v = src[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      target[k] = deepMerge(
        target[k] && typeof target[k] === 'object' ? target[k] : {},
        v,
      )
    } else {
      target[k] = v
    }
  }
  return target
}

// Seed every locale so vue-i18n knows about it even before its app strings are
// fully translated (untranslated keys fall back to English via fallbackLocale).
const messages: Dict = {}
for (const code of LOCALE_CODES) messages[code] = {}

// Shared / legacy dictionary (nav, footer, common UI) lives in translations.ts.
deepMerge(messages, translations as unknown as Dict)

// Per-page namespace modules. Each default-exports `{ en: {...}, es: {...},
// pt: {...}, … }` (namespaced under its own top-level key, e.g. `relicsValue`).
// Splitting per page keeps large translation work conflict-free and lazy to add.
const modules = import.meta.glob('./messages/*.ts', { eager: true }) as Record<
  string,
  { default?: Dict }
>
for (const path of Object.keys(modules)) {
  const mod = modules[path]?.default
  if (mod) deepMerge(messages, mod)
}

// Vuetify's own UI strings, per locale (must be after app strings so app keys win).
for (const code of LOCALE_CODES) {
  messages[code].$vuetify = VUETIFY[code]
}

export default defineI18nConfig(() => ({
  legacy: false,
  // Primary/default locale is 'en' (see nuxt.config i18n.defaultLocale). Fall
  // back to English, not Spanish — otherwise any key missing from `en` renders
  // in Spanish on the English site. Also the source for any locale whose app
  // strings aren't fully translated yet.
  fallbackLocale: 'en',
  messages,
}))
