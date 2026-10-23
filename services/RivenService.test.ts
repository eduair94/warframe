/**
 * @fileoverview Unit tests for RivenService sync retry/pacing behavior
 * @module tests/services/RivenService.test
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { RivenService, IRivenItem } from './RivenService';
import { RIVEN_SYNC_DEFAULTS } from '../constants';

function makeRiven(overrides: Partial<IRivenItem> = {}): IRivenItem {
  return {
    id: '1',
    url_name: 'lex',
    item_name: 'Lex',
    thumb: '',
    group: 'pistol',
    riven_type: 'lex',
    ...overrides
  };
}

function makeHttpClient(getImpl: any) {
  return {
    get: jest.fn(getImpl),
    post: jest.fn(),
    addRandomDelay: jest.fn(async () => {})
  } as any;
}

describe('RivenService', () => {
  describe('shared Riven stat multiplier after Hotfix 44.1.3', () => {
    it('normalizes outdated upstream weapon metadata when importing without changing weapon identities', async () => {
      const weapons = [
        { id: 'a', slug: 'acceltra', group: 'primary', rivenType: 'rifle', disposition: 0.65, reqMasteryRank: 8, i18n: { en: { name: 'Acceltra', icon: 'a.png', thumb: 'a-small.png' } } },
        { id: 'b', slug: 'flux_rifle', group: 'primary', rivenType: 'rifle', disposition: 1.55, reqMasteryRank: 6, i18n: { en: { name: 'Flux Rifle', icon: 'b.png', thumb: 'b-small.png' } } },
      ];
      const service = new RivenService(makeHttpClient(async () => ({ data: weapons })), {} as any);
      const result = await service.fetchAllRivenItems();
      expect(result.map(({ id, url_name, item_name, disposition }) => ({ id, url_name, item_name, disposition }))).toEqual([
        { id: 'a', url_name: 'acceltra', item_name: 'Acceltra', disposition: 1.2 },
        { id: 'b', url_name: 'flux_rifle', item_name: 'Flux Rifle', disposition: 1.2 },
      ]);
      expect(weapons.map(weapon => weapon.disposition)).toEqual([0.65, 1.55]);
    });

    it('serves the common multiplier for old and missing stored values while retaining counts and buyout prices', async () => {
      const records = [
        Object.freeze({ ...makeRiven({ url_name: 'acceltra', disposition: 0.65 }), auctionCount: 164, minBuyout: 75 }),
        Object.freeze({ ...makeRiven({ url_name: 'flux_rifle', disposition: 1.55 }), auctionCount: 7, minBuyout: 40 }),
        Object.freeze({ ...makeRiven({ url_name: 'unknown_multiplier' }), auctionCount: 3, minBuyout: 110 }),
      ];
      const repository = { aggregate: jest.fn(async () => records) } as any;
      const service = new RivenService(makeHttpClient(async () => { throw new Error('No upstream read expected'); }), repository);
      const result = await service.getWeaponsList();
      expect(result.map(({ url_name, disposition, auctionCount, minBuyout }) => ({ url_name, disposition, auctionCount, minBuyout }))).toEqual([
        { url_name: 'acceltra', disposition: 1.2, auctionCount: 164, minBuyout: 75 },
        { url_name: 'flux_rifle', disposition: 1.2, auctionCount: 7, minBuyout: 40 },
        { url_name: 'unknown_multiplier', disposition: 1.2, auctionCount: 3, minBuyout: 110 },
      ]);
      expect(records[0].disposition).toBe(0.65);
    });

    it('corrects detail metadata without rescaling stored auction stats, prices or Endo values', async () => {
      const auctions = [{ id: 'listing', buyout_price: 125, starting_price: 100, endo: 12440, endoPerPlat: 99.52,
        item: { weapon_url_name: 'acceltra', attributes: [{ url_name: 'critical_chance', value: 175, positive: true }], mod_rank: 8, re_rolls: 50, mastery_level: 8 } }];
      const originalAuctions = structuredClone(auctions);
      const record = Object.freeze({ ...makeRiven({ url_name: 'acceltra', disposition: 0.65 }), items: auctions });
      const repository = { findEntry: jest.fn(async () => record) } as any;
      const service = new RivenService(makeHttpClient(async () => { throw new Error('No upstream read expected'); }), repository);
      const result = await service.getWeaponAuctions('acceltra');
      expect(repository.findEntry).toHaveBeenCalledWith({ url_name: 'acceltra' });
      expect(result?.disposition).toBe(1.2);
      expect(result?.items).toBe(auctions);
      expect(result?.items).toEqual(originalAuctions);
      expect(record.disposition).toBe(0.65);
    });

    it('does not manufacture a weapon when the requested detail record is absent', async () => {
      const service = new RivenService(makeHttpClient(async () => ({})), { findEntry: jest.fn(async () => null) } as any);
      expect(await service.getWeaponAuctions('missing')).toBeNull();
    });
  });

  describe('syncSingleRiven', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('gives up after MAX_SYNC_ATTEMPTS instead of retrying forever', async () => {
      const httpClient = makeHttpClient(async () => {
        throw new Error('boom');
      });
      const repository = { getAnUpdateEntry: jest.fn(async () => ({})) } as any;
      const service = new RivenService(httpClient, repository);

      const promise = service.syncSingleRiven(makeRiven());
      await jest.advanceTimersByTimeAsync(120000);
      await promise;

      expect(httpClient.get).toHaveBeenCalledTimes(RIVEN_SYNC_DEFAULTS.MAX_SYNC_ATTEMPTS);
      expect(repository.getAnUpdateEntry).not.toHaveBeenCalled();
    });

    it('recovers after a transient failure within the attempt cap', async () => {
      let callCount = 0;
      const httpClient = makeHttpClient(async () => {
        callCount++;
        if (callCount < 2) throw new Error('transient');
        return { payload: { auctions: [] } };
      });
      const repository = { getAnUpdateEntry: jest.fn(async () => ({})) } as any;
      const service = new RivenService(httpClient, repository);

      const promise = service.syncSingleRiven(makeRiven());
      await jest.advanceTimersByTimeAsync(10000);
      await promise;

      expect(httpClient.get).toHaveBeenCalledTimes(2);
      expect(repository.getAnUpdateEntry).toHaveBeenCalledTimes(1);
    });

    it('succeeds on the first attempt without any delay', async () => {
      const httpClient = makeHttpClient(async () => ({ payload: { auctions: [] } }));
      const repository = { getAnUpdateEntry: jest.fn(async () => ({})) } as any;
      const service = new RivenService(httpClient, repository);

      await service.syncSingleRiven(makeRiven());

      expect(httpClient.get).toHaveBeenCalledTimes(1);
      expect(repository.getAnUpdateEntry).toHaveBeenCalledWith({ url_name: 'lex' }, { items: [] });
    });
  });

  describe('syncAllRivenAuctions', () => {
    it('paces successive weapon syncs via httpClient.addRandomDelay', async () => {
      const httpClient = makeHttpClient(async () => ({ payload: { auctions: [] } }));
      const repository = {
        getAnUpdateEntry: jest.fn(async () => ({})),
        allEntries: jest.fn(async () => [
          makeRiven({ id: '1', url_name: 'lex', item_name: 'Lex' }),
          makeRiven({ id: '2', url_name: 'braton', item_name: 'Braton' })
        ])
      } as any;
      const service = new RivenService(httpClient, repository);

      await service.syncAllRivenAuctions();

      // 2 weapons -> 1 gap between them, none after the last
      expect(httpClient.addRandomDelay).toHaveBeenCalledTimes(1);
      expect(httpClient.get).toHaveBeenCalledTimes(2);
    });

    it('does not stall on a permanently-failing weapon - advances to the next one', async () => {
      jest.useFakeTimers();
      const httpClient = makeHttpClient(async (url: string) => {
        if (url.includes('lex')) throw new Error('always fails');
        return { payload: { auctions: [] } };
      });
      const repository = {
        getAnUpdateEntry: jest.fn(async () => ({})),
        allEntries: jest.fn(async () => [
          makeRiven({ id: '1', url_name: 'lex', item_name: 'Lex' }),
          makeRiven({ id: '2', url_name: 'braton', item_name: 'Braton' })
        ])
      } as any;
      const service = new RivenService(httpClient, repository);

      const promise = service.syncAllRivenAuctions();
      await jest.advanceTimersByTimeAsync(120000);
      await promise;

      expect(repository.getAnUpdateEntry).toHaveBeenCalledTimes(1);
      expect(repository.getAnUpdateEntry).toHaveBeenCalledWith({ url_name: 'braton' }, { items: [] });
      jest.useRealTimers();
    });
  });
});
