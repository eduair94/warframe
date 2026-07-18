/**
 * Two blocking i18n guards (exit 1 on either), run in CI (npm run i18n:check):
 *
 * 1. COMPILE — every message string is fed through vue-i18n's own compiler.
 *    Guards the class of bug that blanked /endo in prod: `endo.table.buyAt =
 *    "Buy @"` — a literal `@` is vue-i18n's linked-message marker and throws
 *    UNEXPECTED_LEXICAL_ANALYSIS at client compile. Escape specials:
 *    `@` -> {'@'}, `{` -> {'{'}, single-brace {name} interpolation.
 *
 * 2. DUPLICATE KEYS — a source-AST scan for two sibling properties with the
 *    same name in one object literal. JS silently keeps the last, so
 *    `tour: 'Tour'` followed by `tour: { ... }` makes `t('nav.tour')` resolve
 *    to an object and render raw. The compile pass above can't see this (it
 *    walks the already-collapsed object), so it needs its own check.
 *
 * Usage: cd app && npm run i18n:check
 */
import { baseCompile } from '@intlify/message-compiler'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import ts from 'typescript'
// SEO parity guard: every PAGE_SEO key must have a localized title+description in
// every non-English locale, or /es/… /de/… ship English <title>/<meta> under
// hreflang alternates (soft-duplicate). These are pure data modules (no Nuxt
// runtime), so tsx can import them directly.
import { PAGE_SEO } from '../app/utils/seo'
import { PAGE_SEO_I18N } from '../app/utils/seo-i18n'
import { PAGE_SEO_I18N_GUIDES } from '../app/utils/seo-i18n-guides'
import { PAGE_SEO_I18N_PAGES } from '../app/utils/seo-i18n-pages'

const here = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(here, '../i18n/messages')
const translationsFile = join(here, '../i18n/translations.ts')
const locales = ['en', 'es', 'pt'] as const

const bad: string[] = []
const dupes: string[] = []

/** Flag any object literal with two sibling properties sharing a name. */
function checkDuplicateKeys(file: string, label: string): void {
  const src = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true)
  const visit = (node: ts.Node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const seen = new Map<string, number>()
      for (const prop of node.properties) {
        const name = prop.name
        let key: string | undefined
        if (name && ts.isIdentifier(name)) key = name.text
        else if (name && ts.isStringLiteral(name)) key = name.text
        if (key === undefined) continue
        const line = sf.getLineAndCharacterOfPosition(prop.getStart(sf)).line + 1
        const first = seen.get(key)
        if (first !== undefined) {
          dupes.push(`  ${label}:${line} :: duplicate key "${key}" (first defined at line ${first})`)
        } else {
          seen.set(key, line)
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

function walk(obj: unknown, path: string, file: string): void {
  const o = (obj ?? {}) as Record<string, unknown>
  for (const k of Object.keys(o)) {
    const v = o[k]
    const p = path ? `${path}.${k}` : k
    if (typeof v === 'string') {
      try {
        baseCompile(v, {
          onError(e) {
            throw e
          },
        })
      } catch (e) {
        const code = (e as { code?: number }).code
        bad.push(`  ${file} :: ${p} (code ${code}): ${JSON.stringify(v).slice(0, 120)}`)
      }
    } else if (v && typeof v === 'object') {
      walk(v, p, file)
    }
  }
}

for (const f of readdirSync(messagesDir).filter((f) => f.endsWith('.ts'))) {
  const path = join(messagesDir, f)
  checkDuplicateKeys(path, `messages/${f}`)
  const mod = (await import(pathToFileURL(path).href)) as {
    default?: Record<string, unknown>
  }
  const dict = mod.default ?? {}
  for (const loc of locales) walk(dict[loc], '', `messages/${f}:${loc}`)
}

checkDuplicateKeys(translationsFile, 'translations.ts')
const translations = ((await import(pathToFileURL(translationsFile).href)) as {
  default?: Record<string, unknown>
}).default ?? {}
for (const loc of locales) walk(translations[loc], '', `translations.ts:${loc}`)

// 3. SEO PARITY — every PAGE_SEO key localized (title + description) in every
//    non-English locale. English is the source (PAGE_SEO); the localized copy is
//    the merge of the three overlays (same order resolveSeo uses).
const SEO_LOCALES = ['es', 'pt', 'de', 'fr', 'ru', 'ko', 'ja', 'zh-hans', 'zh-hant', 'pl', 'it', 'uk']
const seoGaps: string[] = []
for (const loc of SEO_LOCALES) {
  const overlay: Record<string, { title?: string; description?: string }> = {
    ...(PAGE_SEO_I18N_GUIDES[loc] || {}),
    ...(PAGE_SEO_I18N_PAGES[loc] || {}),
    ...(PAGE_SEO_I18N[loc] || {}),
  }
  for (const key of Object.keys(PAGE_SEO)) {
    const e = overlay[key]
    if (!e || typeof e.title !== 'string' || !e.title.trim() || typeof e.description !== 'string' || !e.description.trim()) {
      seoGaps.push(`  ${loc} :: missing/incomplete localized SEO for "${key}"`)
    }
  }
}

let failed = false
if (seoGaps.length) {
  console.error(`\n✗ ${seoGaps.length} localized PAGE_SEO gap(s) — every PAGE_SEO key needs a title+description in every locale (add to seo-i18n / seo-i18n-guides / seo-i18n-pages):\n${seoGaps.slice(0, 60).join('\n')}${seoGaps.length > 60 ? '\n  … (' + (seoGaps.length - 60) + ' more)' : ''}\n`)
  failed = true
}
if (dupes.length) {
  console.error(`\n✗ ${dupes.length} duplicate i18n key(s) — the last silently wins, so t() on the shadowed key renders raw:\n${dupes.join('\n')}\n`)
  failed = true
}
if (bad.length) {
  console.error(`\n✗ ${bad.length} i18n message(s) vue-i18n cannot compile:\n${bad.join('\n')}`)
  console.error("Escape literal specials: @ -> {'@'}, { -> {'{'}, and use single-brace {name} interpolation.\n")
  failed = true
}
if (failed) process.exit(1)
console.log('✓ all i18n messages compile — no duplicate keys')
