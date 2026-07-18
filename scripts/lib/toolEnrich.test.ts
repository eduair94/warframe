// scripts/lib/toolEnrich.test.ts
import { registrableDomain, isOwnDomain, computeAgeYears, parseWhois, mergeTool } from './toolEnrich'

describe('registrableDomain', () => {
  it('reduces subdomains and strips www', () => {
    expect(registrableDomain('https://hub.warframestat.us/')).toBe('warframestat.us')
    expect(registrableDomain('https://www.warframe.com/droptables')).toBe('warframe.com')
    expect(registrableDomain('https://warframe.market/')).toBe('warframe.market')
  })
})

describe('isOwnDomain', () => {
  it('is false for known platform hosts', () => {
    expect(isOwnDomain('https://github.com/WFCD/warframe-items')).toBe(false)
    expect(isOwnDomain('https://play.google.com/store/apps/details?id=x')).toBe(false)
    expect(isOwnDomain('https://alecaframe.com/')).toBe(true)
  })
})

describe('computeAgeYears', () => {
  it('floors to whole years', () => {
    const now = Date.parse('2026-07-17T00:00:00Z')
    expect(computeAgeYears('2014-11-13T16:24:23Z', now)).toBe(11)
  })
})

describe('parseWhois', () => {
  it('extracts date/registrar and computes age', () => {
    const now = Date.parse('2026-07-17T00:00:00Z')
    const r = parseWhois({ date: { created: '2014-11-13T16:24:23.470Z', expires: '2026-11-13T16:24:23.470Z' }, registrar: { name: 'cloudflare, inc' } }, now)
    expect(r.created).toBe('2014-11-13T16:24:23.470Z')
    expect(r.ageYears).toBe(11)
    expect(r.registrar).toBe('cloudflare, inc')
    expect(r.expires).toBe('2026-11-13T16:24:23.470Z')
  })
  it('returns nulls when the TLD omits dates (e.g. .gg)', () => {
    const r = parseWhois({ nameserver: ['x'] }, Date.now())
    expect(r.created).toBeNull()
    expect(r.ageYears).toBeNull()
  })
})

describe('mergeTool', () => {
  it('defaults verified false when no enrichment', () => {
    const m = mergeTool({ slug: 'x', name: 'X', url: 'https://x.io/', category: 'trading', platforms: ['web'] })
    expect(m.verified).toBe(false)
    expect(m.name).toBe('X')
  })
  it('overlays enriched fields', () => {
    const m = mergeTool(
      { slug: 'x', name: 'X', url: 'https://x.io/', category: 'trading', platforms: ['web'] },
      { verified: true, httpStatus: 200, domain: { created: '2014-01-01', ageYears: 12, registrar: 'r', expires: null } }
    )
    expect(m.verified).toBe(true)
    expect(m.domain?.ageYears).toBe(12)
  })
})
