// Converts raw PNG captures in app/public/img/tools/_raw/<slug>.png
// to optimized WebP at app/public/img/tools/<slug>.webp, then removes the raw dir.
// Capture step (Playwright, one-off) is documented in the Phase-1 plan; this
// converter is the committed, reproducible half of the screenshot pipeline.
import { readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const OUT = join(process.cwd(), 'public/img/tools')
const RAW = join(OUT, '_raw')
mkdirSync(OUT, { recursive: true })
if (!existsSync(RAW)) {
  console.error('No _raw dir; capture PNGs first')
  process.exit(1)
}

for (const f of readdirSync(RAW).filter((f) => f.endsWith('.png'))) {
  const slug = f.replace(/\.png$/, '')
  await sharp(join(RAW, f))
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(join(OUT, `${slug}.webp`))
  console.log(`webp ${slug}`)
}
rmSync(RAW, { recursive: true, force: true })
