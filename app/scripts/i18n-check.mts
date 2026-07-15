/**
 * Compiles every i18n message with vue-i18n's own compiler and fails (exit 1)
 * on any it rejects. Guards the class of bug that blanked /endo in prod:
 * `endo.table.buyAt = "Buy @"` — a literal `@` is vue-i18n's linked-message
 * marker and throws UNEXPECTED_LEXICAL_ANALYSIS during client compilation.
 *
 * Runs in CI (npm run i18n:check, blocking). To emit a literal special char,
 * escape it: `@` -> `{'@'}`, `{` -> `{'{'}`.
 *
 * Usage: cd app && npm run i18n:check
 */
import { baseCompile } from '@intlify/message-compiler'
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const messagesDir = join(here, '../i18n/messages')
const locales = ['en', 'es', 'pt'] as const

const bad: string[] = []

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
  const mod = (await import(pathToFileURL(join(messagesDir, f)).href)) as {
    default?: Record<string, unknown>
  }
  const dict = mod.default ?? {}
  for (const loc of locales) walk(dict[loc], '', `messages/${f}:${loc}`)
}

const translations = ((await import(
  pathToFileURL(join(here, '../i18n/translations.ts')).href
)) as {
  default?: Record<string, unknown>
}).default ?? {}
for (const loc of locales) walk(translations[loc], '', `translations.ts:${loc}`)

if (bad.length) {
  console.error(`\n✗ ${bad.length} i18n message(s) vue-i18n cannot compile:\n${bad.join('\n')}\n`)
  console.error("Escape literal specials: @ -> {'@'}, { -> {'{'}, and use single-brace {name} interpolation.")
  process.exit(1)
}
console.log('✓ all i18n messages compile')
