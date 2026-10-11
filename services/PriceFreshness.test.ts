/**
 * @fileoverview Unit tests for PriceFreshness (/health price-age field)
 */

import { describe, it, expect, jest } from '@jest/globals';
import { createPriceFreshness } from './PriceFreshness';

describe('createPriceFreshness', () => {
  it('reports the newest price update and its age in seconds', async () => {
    const now = Date.parse('2026-10-11T20:00:00Z');
    const get = createPriceFreshness(async () => new Date('2026-10-11T19:00:00Z'), 60_000, () => now);

    await expect(get()).resolves.toEqual({
      prices_updated_at: '2026-10-11T19:00:00.000Z',
      prices_age_s: 3600,
    });
  });

  it('queries the database at most once per ttl', async () => {
    let now = 0;
    const fetchNewest = jest.fn(async () => new Date(0));
    const get = createPriceFreshness(fetchNewest, 60_000, () => now);

    await get();
    now = 30_000;
    await get();
    expect(fetchNewest).toHaveBeenCalledTimes(1);
    now = 61_000;
    await get();
    expect(fetchNewest).toHaveBeenCalledTimes(2);
  });

  it('keeps the age current between queries', async () => {
    let now = Date.parse('2026-10-11T19:00:10Z');
    const get = createPriceFreshness(async () => new Date('2026-10-11T19:00:00Z'), 60_000, () => now);

    expect((await get()).prices_age_s).toBe(10);
    now += 20_000;
    expect((await get()).prices_age_s).toBe(30);
  });

  it('returns nulls instead of throwing when the query fails', async () => {
    const get = createPriceFreshness(async () => {
      throw new Error('mongo down');
    });

    await expect(get()).resolves.toEqual({ prices_updated_at: null, prices_age_s: null });
  });

  it('returns nulls when no item has ever been priced', async () => {
    const get = createPriceFreshness(async () => null);

    await expect(get()).resolves.toEqual({ prices_updated_at: null, prices_age_s: null });
  });
});
