import { readFileSync } from 'fs'
import { join } from 'path'

const sources = JSON.parse(readFileSync(join(process.cwd(), 'app/app/data/tools.source.json'), 'utf8'))
const CATS = ['trading','database','worldstate','farming','riven','builds','apps','bots','api']
const PLATS = ['web','android','ios','windows','overlay','discord','extension']

describe('tools.source.json', () => {
  it('has unique slugs', () => {
    const slugs = sources.map((s: any) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
  it('every record has valid category, platforms, and an http(s) url', () => {
    for (const s of sources) {
      expect(CATS).toContain(s.category)
      expect(Array.isArray(s.platforms) && s.platforms.length).toBeTruthy()
      for (const p of s.platforms) expect(PLATS).toContain(p)
      expect(s.url).toMatch(/^https?:\/\//)
    }
  })
  it('excludes the dead tools', () => {
    const names = sources.map((s: any) => s.name.toLowerCase())
    expect(names.some((n: string) => n.includes('riven.market'))).toBe(false)
    expect(names.some((n: string) => n.includes('price guide'))).toBe(false)
  })
})
