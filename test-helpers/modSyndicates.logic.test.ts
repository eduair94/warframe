import {
  normalizeModName,
  syndicatesForMod,
} from '../app/app/data/modSyndicates'
import { modImageName } from '../app/app/data/modImages'

describe('syndicate mod mapping', () => {
  it('maps a dual-syndicate Warframe augment to both offering factions', () => {
    expect(syndicatesForMod('Irradiating Disarm')).toEqual([
      'Arbiters of Hexis',
      'Red Veil',
    ])
  })

  it('maps a weapon augment to its offering faction', () => {
    expect(syndicatesForMod('Shattering Justice')).toEqual([
      'Steel Meridian',
    ])
  })

  it('does not label a non-offering market tag as a faction mod', () => {
    expect(syndicatesForMod('Spring-Loaded Blade')).toEqual([])
  })

  it('normalizes punctuation and diacritics consistently', () => {
    expect(normalizeModName('Mesa’s Waltz')).toBe('mesaswaltz')
    expect(normalizeModName('Mêsa’s Waltz')).toBe('mesaswaltz')
  })

  it('provides the WFCD image filename when the market thumbnail is unknown', () => {
    expect(modImageName('Razor Mortar')).toBe('SentientWhirlwindAugmentCard.jpg')
  })
})
