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
