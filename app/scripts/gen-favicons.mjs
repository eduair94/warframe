/**
 * Regenerate the full favicon / PWA icon set from the single master
 * `public/favicon.svg` (the Orokin diamond-node mark). Run after editing the
 * mark:  `node scripts/gen-favicons.mjs`
 *
 * Outputs (all into public/):
 *   favicon.ico                 - multi-res 16/32/48 (legacy tab icon)
 *   favicon-16x16.png           - transparent-corner PNG
 *   favicon-32x32.png
 *   apple-touch-icon.png        - 180, flattened on solid void (iOS squares it)
 *   android-chrome-192x192.png  - "any" purpose
 *   android-chrome-384x384.png
 *   maskable-icon-512x512.png   - mark inside the 80% safe zone on solid void
 *
 * Uses sharp (librsvg) so gradients + rounded rects render faithfully — the
 * committed rasters are the shipped artifacts; production build needs no
 * rasterizer.
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const VOID = { r: 11, g: 12, b: 22, alpha: 1 } // #0b0c16
const svg = await readFile(join(PUBLIC, 'favicon.svg'))

/** Render the master SVG to a square PNG buffer at `size`px. */
function renderPng(size, { flatten = false } = {}) {
  let img = sharp(svg, { density: 512 }).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  if (flatten) img = img.flatten({ background: VOID })
  return img.png().toBuffer()
}

// Bg-less diamond mark (no rounded field / frame) for the maskable icon, so the
// void bleeds edge-to-edge and only the diamond sits in the safe zone.
const MARK_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <path d="M200 50 L350 200 L200 350 L50 200 Z" fill="none" stroke="#d4af5a" stroke-width="30" stroke-linejoin="round"/>
    <path d="M200 118 L282 200 L200 282 L118 200 Z" fill="#4fb3bf"/>
    <circle cx="200" cy="50" r="14" fill="#d4af5a"/>
    <circle cx="350" cy="200" r="14" fill="#d4af5a"/>
    <circle cx="200" cy="350" r="14" fill="#d4af5a"/>
    <circle cx="50" cy="200" r="14" fill="#d4af5a"/>
  </svg>`,
)

/** Maskable: full-bleed void field with the diamond in the central ~70%. */
async function renderMaskable(size) {
  const inner = Math.round(size * 0.7)
  const mark = await sharp(MARK_SVG, { density: 512 }).resize(inner, inner).png().toBuffer()
  return sharp({ create: { width: size, height: size, channels: 4, background: VOID } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function write(name, buf) {
  await writeFile(join(PUBLIC, name), buf)
  console.log('  ✓', name)
}

console.log('Generating favicons from public/favicon.svg …')

const [p16, p32, p48] = await Promise.all([renderPng(16), renderPng(32), renderPng(48)])

await write('favicon-16x16.png', p16)
await write('favicon-32x32.png', p32)
await write('apple-touch-icon.png', await renderPng(180, { flatten: true }))
await write('android-chrome-192x192.png', await renderPng(192))
await write('android-chrome-384x384.png', await renderPng(384))
await write('maskable-icon-512x512.png', await renderMaskable(512))
await write('favicon.ico', await pngToIco([p16, p32, p48]))

console.log('Done.')
