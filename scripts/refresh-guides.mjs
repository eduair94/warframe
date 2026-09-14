#!/usr/bin/env node
// Auto-refresh the Warframe Knowledge Center guides with Google Gemini
// (grounded with Google Search), on a rolling ~90-day cadence.
//
// Pipeline per guide (app/app/data/guides/<slug>.ts):
//   1. Parse the `const guide: Guide = {…}` data literals from the .ts file.
//   2. Ask Gemini (with the googleSearch tool) to fact-check + refresh it as of
//      today — same schema, same voice, only change what's actually outdated,
//      and flag nerfs/removals. Returns the updated guide as JSON.
//   3. HARD GATE: re-verify EVERY YouTube video id via the oEmbed endpoint and
//      drop confirmed missing videos; abort on transient verification errors. Never let an
//      unverified id reach the file — a broken embed is worse than one fewer video.
//   4. Validate rendered block shapes, source links and non-future review dates.
//   5. Write substantive changes only after every guide in the batch passes.
//
// The GitHub Action (.github/workflows/refresh-guides.yml) runs this, then only
// commits to main (which auto-deploys) if the script SUCCEEDS and the i18n gate
// passes — so a bad model run fails the job and leaves prod untouched.
//
// Modes:
//   node scripts/refresh-guides.mjs            # live: calls Gemini, writes files
//   node scripts/refresh-guides.mjs --dry-run  # no Gemini: only re-verify videos + report
//   node scripts/refresh-guides.mjs --dry-run --write   # dry, but persist dropped-video edits
//   GUIDE_SLUGS=credits,kuva node scripts/refresh-guides.mjs   # limit to some slugs
//
// Env: GEMINI_API_KEY (required in live mode), GEMINI_MODEL (default gemini-2.5-pro).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { ALLOWED_BLOCK_TYPES, extractGuideJson, validateGuide, verifyVideos, preserveUnchangedReviewDate, hasSearchGrounding } from './lib/guide-quality.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const GUIDES_DIR = join(__dirname, '..', 'app', 'app', 'data', 'guides')
const NOT_GUIDES = new Set(['types.ts', 'registry.ts', 'farmIndex.ts'])

const DRY_RUN = process.argv.includes('--dry-run')
const NO_WRITE = process.argv.includes('--no-write')
// Write by default in live mode; --dry-run needs --write to persist; --no-write
// forces a read-only run (real Gemini call, but nothing touched — for testing).
const WRITE = !NO_WRITE && (!DRY_RUN || process.argv.includes('--write'))
const MODEL = process.env.GEMINI_MODEL || 'gemini-pro-latest'
const ONLY = (process.env.GUIDE_SLUGS || '').split(',').map((s) => s.trim()).filter(Boolean)

// ── file <-> object ───────────────────────────────────────────────────
function listGuideFiles() {
  return readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.ts') && !NOT_GUIDES.has(f))
    .map((f) => ({ slug: f.replace(/\.ts$/, ''), path: join(GUIDES_DIR, f) }))
    .filter((g) => ONLY.length === 0 || ONLY.includes(g.slug))
}

const FILE_HEADER = `// Auto-generated Warframe Knowledge Center guide content.
// Drafted grounded in r/Warframe research + the Warframe wiki, then fact-checked
// for accuracy and refreshed by scripts/refresh-guides.mjs (Gemini + Google
// Search). Embedded video ids are verified live via YouTube oEmbed. Edit freely —
// this is the single source for the /guides/<slug> page (rendered by <GuideArticle>).
import type { Guide } from './types'

const guide: Guide = `

function emitGuideFile(guideObj) {
  return FILE_HEADER + JSON.stringify(guideObj, null, 2) + '\n\nexport default guide\n'
}

// ── Gemini ────────────────────────────────────────────────────────────
function buildPrompt(guideObj, today) {
  return [
    `You are fact-checking and refreshing a Warframe (the game) strategy guide for a fan site. Today is ${today}.`,
    `The guide is a JSON object. Use Google Search to check for anything that changed since it was last reviewed ("updated": "${guideObj.updated || 'unknown'}") — balance passes, nerfs, reworks, removed or renamed nodes, new content that beats the listed farms.`,
    ``,
    `Rules:`,
    `- Return ONLY the updated guide as a single valid JSON object. No markdown, no commentary, no code fences.`,
    `- Keep the EXACT same schema and the same "slug". Keep the established voice: punchy, practical, second-person, honest about nerfs, never overclaims exact numbers (say "check the wiki" for volatile figures).`,
    `- Only change what is actually outdated or wrong. Preserve internal cross-links written as markdown "(/guides/...)" or "(/flip)" etc.`,
    `- Allowed block "type" values: ${[...ALLOWED_BLOCK_TYPES].join(', ')}. Block shapes: {type:"p",text}, {type:"list",items[]}, {type:"steps",steps:[{h,p}]}, {type:"tip"|"warn"|"info",text}, {type:"table",table:{columns[],rows[][],note?}}, {type:"kv",kv:[{k,v}]}, {type:"quote",text,cite?}, {type:"video",video:{id,title,channel}}, {type:"links",links:[{label,to?|href?,note?,icon?}]}.`,
    `- Videos: only include YouTube videos you are confident currently exist and are about this exact topic; prefer recent ones. Use the real 11-character id, the real title, and the real channel. Do NOT invent ids (they are re-verified and dropped if wrong).`,
    `- Cite the authoritative pages you actually checked in "sources" (prefer warframe.com patch notes and wiki.warframe.com). Never invent a source URL.`,
    `- Keep "updated" unchanged if the content is still correct. Only set it to "${today}" when you make a substantive, source-supported correction.`,
    ``,
    `Current guide JSON:`,
    JSON.stringify(guideObj),
  ].join('\n')
}

function parseModelJson(text) {
  let t = String(text || '').trim()
  // strip accidental code fences
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  // if there is leading/trailing prose, grab the outermost {...}
  const first = t.indexOf('{')
  const last = t.lastIndexOf('}')
  if (first > 0 || last < t.length - 1) t = t.slice(first, last + 1)
  return JSON.parse(t)
}

async function refreshWithGemini(guideObj, today) {
  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: buildPrompt(guideObj, today),
    config: { tools: [{ googleSearch: {} }], temperature: 0.4, httpOptions: { timeout: 180_000 } },
  })
  if (!hasSearchGrounding(res)) throw new Error('model returned no Google Search grounding; no refresh will be written')
  const next = parseModelJson(res.text)
  if (!Array.isArray(next.sources) || !next.sources.some((source) => source.href)) throw new Error('refreshed guide has no source links')
  return preserveUnchangedReviewDate(guideObj, next)
}

// ── main ──────────────────────────────────────────────────────────────
async function main() {
  const today = new Date().toISOString().slice(0, 10)
  const live = !DRY_RUN
  if (live && !process.env.GEMINI_API_KEY) {
    console.error('FATAL: GEMINI_API_KEY is not set (required in live mode).')
    process.exit(1)
  }

  const files = listGuideFiles()
  console.log(`refresh-guides: mode=${live ? 'LIVE' : 'DRY'} model=${MODEL} guides=${files.length} write=${WRITE}`)

  if (!files.length) throw new Error(`no guides matched GUIDE_SLUGS=${ONLY.join(',')}`)
  const changed = []
  const pending = []
  let failures = 0

  for (const { slug, path } of files) {
    try {
      const source = readFileSync(path, 'utf8')
      const current = extractGuideJson(source)
      const currentErrors = validateGuide(current, slug, today)
      if (currentErrors.length) throw new Error(currentErrors.join('; '))

      let next = current
      if (live) {
        next = await refreshWithGemini(current, today)
      }

      const generatedErrors = validateGuide(next, slug, today)
      if (generatedErrors.length) throw new Error(generatedErrors.join('; '))
      const { guide: verified, dropped } = await verifyVideos(next)
      if (dropped.length) console.log(`  ${slug}: dropped ${dropped.length} dead video id(s): ${dropped.join(', ')}`)

      const errs = validateGuide(verified, slug)
      if (errs.length) {
        console.error(`  ${slug}: VALIDATION FAILED\n    - ${errs.join('\n    - ')}`)
        failures++
        continue
      }

      // Keep hand-edited formatting and dates on a no-op run. Re-emitting the
      // header alone used to create a misleading refresh commit.
      const out = JSON.stringify(current) === JSON.stringify(verified) ? source : emitGuideFile(verified)
      // round-trip guard: what we are about to write must re-parse cleanly
      extractGuideJson(out)

      if (out !== source) {
        if (WRITE) {
          pending.push({ path, out })
          console.log(`  ${slug}: staged`)
        } else {
          console.log(`  ${slug}: would update (write skipped)`)
        }
        changed.push(slug)
      } else {
        console.log(`  ${slug}: no change`)
      }
    } catch (err) {
      console.error(`  ${slug}: ERROR ${err?.message || err}`)
      failures++
    }
  }

  console.log(`\nrefresh-guides: ${changed.length} changed, ${failures} failure(s).`)
  if (failures > 0) {
    console.error('No guide files written: resolve the failed checks and retry.')
    process.exitCode = 1
    return
  }
  // Validate the entire batch before changing any file. A transient provider
  // failure late in a run must not leave earlier guides partially refreshed.
  for (const { path, out } of pending) writeFileSync(path, out, 'utf8')
  if (pending.length) console.log(`Wrote ${pending.length} verified guide(s).`)
}

main().catch((err) => {
  console.error('refresh-guides: fatal', err)
  process.exit(1)
})
