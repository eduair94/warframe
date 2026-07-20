/**
 * Generates one complete message file per locale for @nuxtjs/i18n's lazy loader.
 *
 * WHY
 * `i18n/i18n.config.ts` used to eagerly merge `i18n/translations.ts` and every
 * `i18n/messages/*.ts` module into a single `messages` object and hand it to
 * `defineI18nConfig`. Those modules each carry all thirteen locales inline, so
 * the merged object — 1.7 MB of source — ended up inside the CLIENT ENTRY
 * CHUNK. Every visitor downloaded the German, Korean, Japanese, Ukrainian, …
 * translations to read the site in one language: 1.37 MB of JavaScript to parse
 * before the app could hydrate, and the single largest contributor to blocking
 * time.
 *
 * The per-page modules stay the source of truth (they are convenient to edit and
 * to review, and `npm run i18n:check` reads them). This script just slices them
 * by locale ahead of the build, so the bundler ships one locale per visitor.
 *
 * Each generated file is COMPLETE: locale strings are layered on top of English,
 * so a partially translated locale still renders fully rather than falling back
 * key-by-key at runtime.
 *
 * Run: npm run i18n:build   (also runs automatically via `prebuild`/`predev`)
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  en as vEn, es as vEs, pt as vPt, de as vDe, fr as vFr, ru as vRu,
  ko as vKo, ja as vJa, zhHans as vZhHans, zhHant as vZhHant,
  pl as vPl, it as vIt, uk as vUk,
} from 'vuetify/locale'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MESSAGES_DIR = join(ROOT, 'i18n/messages')
const OUT_DIR = join(ROOT, 'i18n/locales')

type Dict = Record<string, any>

/** Vuetify's own `$vuetify.*` UI strings, keyed by our locale codes. */
const VUETIFY: Record<string, Dict> = {
  en: vEn, es: vEs, pt: vPt, de: vDe, fr: vFr, ru: vRu, ko: vKo, ja: vJa,
  'zh-hans': vZhHans, 'zh-hant': vZhHant, pl: vPl, it: vIt, uk: vUk,
}
const LOCALE_CODES = Object.keys(VUETIFY)
const DEFAULT_LOCALE = 'en'

function deepMerge(target: Dict, src: Dict): Dict {
  for (const key of Object.keys(src)) {
    const value = src[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(
        target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])
          ? target[key]
          : {},
        value,
      )
    } else {
      target[key] = value
    }
  }
  return target
}

const load = async (path: string): Promise<Dict> => {
  const mod = await import(pathToFileURL(path).href)
  return (mod.default ?? mod) as Dict
}

// Same order i18n.config.ts used: the shared/legacy dictionary first, then each
// per-page namespace module.
const sources: Dict[] = [await load(join(ROOT, 'i18n/translations.ts'))]
for (const file of readdirSync(MESSAGES_DIR).filter((f) => f.endsWith('.ts')).sort()) {
  sources.push(await load(join(MESSAGES_DIR, file)))
}

// Merge into { [locale]: messages }.
const byLocale: Dict = Object.fromEntries(LOCALE_CODES.map((c) => [c, {}]))
for (const source of sources) {
  for (const code of Object.keys(source)) {
    if (!byLocale[code]) byLocale[code] = {}
    deepMerge(byLocale[code], source[code])
  }
}

mkdirSync(OUT_DIR, { recursive: true })
const englishBase = byLocale[DEFAULT_LOCALE] ?? {}
for (const code of LOCALE_CODES) {
  // English underneath, the locale on top: a half-translated locale still
  // renders every string instead of leaning on runtime fallback (which would
  // force the loader to fetch the English file as well).
  const messages = deepMerge(deepMerge({}, englishBase), byLocale[code] ?? {})
  messages.$vuetify = VUETIFY[code]
  const out = join(OUT_DIR, `${code}.json`)
  writeFileSync(out, JSON.stringify(messages))
  console.log(`i18n:build  ${code.padEnd(8)} ${(JSON.stringify(messages).length / 1024).toFixed(0)} KB`)
}
console.log(`i18n:build  wrote ${LOCALE_CODES.length} locale files to i18n/locales/`)
