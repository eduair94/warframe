import { describe, expect, it } from '@jest/globals';
import { getDucatMetadataUpdate, getDucatMetadataWrite } from './DucatMetadata';

const identity = { id: '59a5cd4d5cd9938cfede7041', url_name: 'nami_skyla_prime_blade' };
const current = { id: identity.id, slug: identity.url_name, ducats: 65 };

describe('bulk Ducat metadata refresh', () => {
  it('repairs missing top-level metadata on a previously enriched Prime part', () => {
    const stored = { ...identity, v2_enriched: true, items_in_set: [{ ...identity, ducats: 100 }] };
    expect(getDucatMetadataUpdate(stored, current)).toEqual({ ducats: 65 });
  });

  it('updates a changed exchange value without modifying prices, roster or dates', () => {
    const stored = {
      ...identity, ducats: 100, priceUpdate: new Date('2026-11-02T04:21:31Z'),
      market: { sell: 25, volume: 62 }, items_in_set: [{ ...identity, ducats: 100 }],
      v2_enriched_at: new Date('2025-11-27T21:31:05Z'),
    };
    const before = structuredClone(stored);
    const patch = getDucatMetadataUpdate(stored, current);
    expect(patch).toEqual({ ducats: 65 });
    expect(stored).toEqual(before);
    expect({ ...stored, ...patch }).toEqual({ ...before, ducats: 65 });
  });

  it('is idempotent after a successful refresh', () => {
    expect(getDucatMetadataUpdate({ ...identity, ducats: 65 }, current)).toBeNull();
  });

  it('requires both the exact identifier and canonical slug to agree', () => {
    expect(getDucatMetadataUpdate(identity, { ...current, id: 'another-item' })).toBeNull();
    expect(getDucatMetadataUpdate(identity, { ...current, slug: 'nami_skyla_prime_set' })).toBeNull();
    expect(getDucatMetadataUpdate({ id: '', url_name: '' }, { id: '', slug: '', ducats: 65 })).toBeNull();
    expect(getDucatMetadataUpdate(null, current)).toBeNull();
  });

  it('retains last-known metadata for absent and malformed source values', () => {
    for (const ducats of [undefined, null, '65', NaN, Infinity, -1, 65.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(getDucatMetadataUpdate({ ...identity, ducats: 100 }, { ...current, ducats })).toBeNull();
    }
    expect(getDucatMetadataUpdate(identity, null)).toBeNull();
  });

  it('accepts an explicit zero without confusing it with absent metadata', () => {
    expect(getDucatMetadataUpdate({ ...identity, ducats: 100 }, { ...current, ducats: 0 })).toEqual({ ducats: 0 });
  });

  it('retains the source total for a set, leaving exchange eligibility to the caller', () => {
    const set = { id: 'set-id', url_name: 'nami_skyla_prime_set', ducats: 305 };
    expect(getDucatMetadataUpdate(set, { id: set.id, slug: set.url_name, ducats: 235 })).toEqual({ ducats: 235 });
  });

  it('guards the actual write against changed identities, values and concurrent deletion', () => {
    const write = getDucatMetadataWrite({ ...identity, ducats: 100 }, current);
    expect(write).toEqual({
      filter: { ...identity, ducats: 100 },
      update: { $set: { ducats: 65 } },
      options: { upsert: false },
    });
  });

  it('does not overwrite a concurrently supplied value when repairing an absent field', () => {
    const write = getDucatMetadataWrite(identity, current);
    expect(write?.filter).toEqual({ ...identity, ducats: { $exists: false } });
    expect(write?.update).toEqual({ $set: { ducats: 65 } });
  });

  it('does not construct a write for unchanged or invalid source metadata', () => {
    expect(getDucatMetadataWrite({ ...identity, ducats: 65 }, current)).toBeNull();
    expect(getDucatMetadataWrite(identity, { ...current, ducats: '65' })).toBeNull();
    expect(getDucatMetadataWrite(identity, { ...current, slug: 'another_part' })).toBeNull();
  });
});
