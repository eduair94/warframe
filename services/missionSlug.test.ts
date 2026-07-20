import { describe, it, expect } from '@jest/globals';
import { missionSlug } from './missionSlug';

describe('missionSlug', () => {
  it('kebab-cases planet + location deterministically', () => {
    expect(missionSlug('Sedna', 'Hydron')).toBe('sedna-hydron');
    expect(missionSlug('Duviri', 'Endless: Repeated Rewards (Hard)')).toBe(
      'duviri-endless-repeated-rewards-hard',
    );
  });

  it('collapses punctuation/whitespace and trims stray dashes', () => {
    expect(missionSlug('Dark Refractory, Deimos', 'Nex')).toBe('dark-refractory-deimos-nex');
    expect(missionSlug('Void', 'Ani (Extra)')).toBe('void-ani-extra');
  });
});
