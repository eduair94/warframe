#!/usr/bin/env node
// Auto-refresh the Warframe Knowledge Center guides with Google Gemini
// (grounded with Google Search), on a rolling ~90-day cadence.
//
// Pipeline per guide (app/app/data/guides/<slug>.ts):
//   1. Extract the `const guide: Guide = {…}` JSON payload from the .ts file.
//   2. Ask Gemini (with the googleSearch tool) to fact-check + refresh it as of
//      today — same schema, same voice, only change what's actually outdated,
//      and flag nerfs/removals. Returns the updated guide as JSON.
//   3. HARD GATE: re-verify EVERY YouTube video id via the oEmbed endpoint and
//      drop any that no longer resolve (dead/private/embedding-off). Never let an
//      unverified id reach the file — a broken embed is worse than one fewer video.
//   4. Structurally validate the object against the Guide shape.
//   5. Re-emit the .ts file (same header/footer) and record it as changed.
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

const ALLOWED_BLOCK_TYPES = new Set(['p', 'list', 'steps', 'tip', 'warn', 'info', 'table', 'video', 'links', 'kv', 'quote'])

// ── file <-> object ───────────────────────────────────────────────────
function listGuideFiles() {
  return readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith('.ts') && !NOT_GUIDES.has(f))
    .map((f) => ({ slug: f.replace(/\.ts$/, ''), path: join(GUIDES_DIR, f) }))
    .filter((g) => ONLY.length === 0 || ONLY.includes(g.slug))
}

function extractGuideJson(source) {
  const m = source.match(/const guide: Guide =\s*([\s\S]*?)\n\s*export default guide/)
  if (!m) throw new Error('could not locate `const guide: Guide = {…}` payload')
  return JSON.parse(m[1].trim())
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

// ── video verification (the hard gate) ────────────────────────────────
async function oembedOk(id) {
  if (typeof id !== 'string' || id.length !== 11) return false
  const url = `https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${id}&format=json`
  try {
    const res = await fetch(url, { redirect: 'follow' })
    if (!res.ok) return false
    const json = await res.json()
    return Boolean(json && json.title)
  } catch {
    return false
  }
}

/** Verify every video id on the guide (top-level grid + inline `video` blocks);
 *  drop the ones that fail. Returns { guide, dropped: [ids] }. */
async function verifyVideos(guideObj) {
  const dropped = []
  const seen = new Map()
  const check = async (id) => {
    if (!seen.has(id)) seen.set(id, await oembedOk(id))
    return seen.get(id)
  }

  if (Array.isArray(guideObj.videos)) {
    const kept = []
    for (const v of guideObj.videos) {
      if (await check(v.id)) kept.push(v)
      else dropped.push(v.id)
    }
    guideObj.videos = kept
  }

  for (const section of guideObj.sections || []) {
    const blocks = []
    for (const b of section.blocks || []) {
      if (b.type === 'video') {
        if (await check(b.video?.id)) blocks.push(b)
        else dropped.push(b.video?.id)
      } else {
        blocks.push(b)
      }
    }
    section.blocks = blocks
  }
  return { guide: guideObj, dropped }
}

// ── structural validation ─────────────────────────────────────────────
function validateGuide(g, slug) {
  const errs = []
  if (!g || typeof g !== 'object') return [`${slug}: not an object`]
  if (g.slug !== slug) errs.push(`${slug}: slug changed to "${g.slug}"`)
  for (const f of ['title', 'lede', 'category']) if (typeof g[f] !== 'string' || !g[f]) errs.push(`${slug}: missing ${f}`)
  if (!Array.isArray(g.sections) || g.sections.length === 0) errs.push(`${slug}: no sections`)
  for (const [i, s] of (g.sections || []).entries()) {
    if (typeof s.id !== 'string' || typeof s.title !== 'string') errs.push(`${slug}: section ${i} missing id/title`)
    if (!Array.isArray(s.blocks)) errs.push(`${slug}: section ${i} has no blocks`)
    for (const [j, b] of (s.blocks || []).entries()) {
      if (!ALLOWED_BLOCK_TYPES.has(b.type)) errs.push(`${slug}: section ${i} block ${j} bad type "${b.type}"`)
      if (b.type === 'video' && (!b.video || (b.video.id || '').length !== 11)) errs.push(`${slug}: section ${i} bad video block`)
    }
  }
  for (const [i, v] of (g.videos || []).entries()) {
    if ((v.id || '').length !== 11 || !v.title || !v.channel) errs.push(`${slug}: grid video ${i} malformed`)
  }
  for (const [i, f] of (g.faqs || []).entries()) {
    if (!f.q || !f.a) errs.push(`${slug}: faq ${i} malformed`)
  }
  return errs
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
    `- Set "updated" to "${today}".`,
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
    config: { tools: [{ googleSearch: {} }], temperature: 0.4 },
  })
  return parseModelJson(res.text)
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

  const changed = []
  let failures = 0

  for (const { slug, path } of files) {
    try {
      const source = readFileSync(path, 'utf8')
      const current = extractGuideJson(source)

      let next = current
      if (live) {
        next = await refreshWithGemini(current, today)
      }

      const { guide: verified, dropped } = await verifyVideos(next)
      if (dropped.length) console.log(`  ${slug}: dropped ${dropped.length} dead video id(s): ${dropped.join(', ')}`)

      const errs = validateGuide(verified, slug)
      if (errs.length) {
        console.error(`  ${slug}: VALIDATION FAILED\n    - ${errs.join('\n    - ')}`)
        failures++
        continue
      }

      const out = emitGuideFile(verified)
      // round-trip guard: what we are about to write must re-parse cleanly
      extractGuideJson(out)

      if (out !== source) {
        if (WRITE) {
          writeFileSync(path, out, 'utf8')
          console.log(`  ${slug}: UPDATED`)
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
  if (failures > 0) process.exit(1)
}

main().catch((err) => {
  console.error('refresh-guides: fatal', err)
  process.exit(1)
})
