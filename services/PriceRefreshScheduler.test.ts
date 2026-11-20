/**
 * @fileoverview Incremental price refresh: what gets fetched, when, and what never does
 */

import { describe, it, expect } from '@jest/globals';
import {
  DEFAULT_PRICE_REFRESH_POLICY,
  PriceRefreshScheduler,
  RefreshItem,
  readPriceRefreshPolicy,
} from './PriceRefreshScheduler';

const MIN = 60_000;
const HOUR = 60 * MIN;
const T0 = Date.parse('2026-11-20T12:00:00Z');

function clock(start = T0) {
  let now = start;
  return { now: () => now, advance: (ms: number) => { now += ms; } };
}

function item(url_name: string, ageMs: number | null, market: RefreshItem['market'] = {}, id = `id_${url_name}`): RefreshItem {
  return { id, url_name, priceUpdate: ageMs === null ? null : new Date(T0 - ageMs), market };
}

const liquid = { sell: 50, buy: 40, volume: 120 };
const active = { sell: 8, buy: 3, volume: 2 };
const idle = { sell: 0, buy: 0, volume: 0 };

function drain(s: PriceRefreshScheduler): string[] {
  const picked: string[] = [];
  for (let it = s.next(); it; it = s.next()) picked.push(it.url_name);
  return picked;
}

describe('PriceRefreshScheduler', () => {
  it('fetches nothing while every item is within its tier age', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('a', 30 * MIN, liquid), item('b', 5 * HOUR, active), item('c', 23 * HOUR, idle)]);
    expect(s.next()).toBeNull();
    expect(s.snapshot()).toMatchObject({ total: 3, due: 0, hot: 0, never: 0 });
  });

  it('refreshes each tier once it passes its max age', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('liquid', 2 * HOUR + MIN, liquid), item('active', 5 * HOUR, active), item('idle', 25 * HOUR, idle)]);
    expect(drain(s).sort()).toEqual(['idle', 'liquid']);
  });

  it('puts never-priced items first, then the most overdue', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([
      item('idle_30h', 30 * HOUR, idle),      // 1.25x its 24h target
      item('liquid_6h', 6 * HOUR, liquid),    // 3x its 2h target
      item('brand_new', null),
      item('active_9h', 9 * HOUR, active),    // 1.5x its 6h target
    ]);
    expect(drain(s)).toEqual(['brand_new', 'liquid_6h', 'active_9h', 'idle_30h']);
  });

  it('makes an item hot when the recent feed shows an order newer than our fetch', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('quiet', 20 * MIN, liquid), item('busy', 20 * MIN, liquid)]);
    expect(s.next()).toBeNull();

    expect(s.noteActivity('id_busy', T0 - 30 * MIN)).toBe(false); // older than our data: not news
    expect(s.next()).toBeNull();
    expect(s.noteActivity('id_busy', T0 - MIN)).toBe(true);
    expect(s.tierOf('busy')).toBe('hot');
    expect(s.next()?.url_name).toBe('busy');
    expect(s.next()).toBeNull();
  });

  it('refreshes a hot item at most once per hotMinInterval however busy it is', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('busy', 20 * MIN, liquid)]);
    s.noteActivity('id_busy', T0 - MIN);
    const first = s.next()!;
    s.complete(first.url_name, 'saved', c.now());

    c.advance(MIN);
    s.noteActivity('id_busy', c.now());
    expect(s.next()).toBeNull();
    c.advance(13 * MIN);
    expect(s.next()).toBeNull();
    c.advance(MIN); // exactly hotMinInterval after the previous fetch started
    expect(s.next()?.url_name).toBe('busy');
  });

  it('ignores feed orders for items outside the catalogue', () => {
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, clock().now);
    s.load([item('a', MIN, liquid)]);
    expect(s.noteActivity('unknown', T0)).toBe(false);
    expect(s.noteActivity('id_a', Number.NaN)).toBe(false);
  });

  it('never hands the same item to two workers', () => {
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, clock().now);
    s.load([item('only', null)]);
    expect(s.next()?.url_name).toBe('only');
    expect(s.next()).toBeNull();
    expect(s.snapshot().inFlight).toBe(1);
  });

  it('does not re-fetch a skipped (all-zero) market in a tight loop', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('empty', 3 * 24 * HOUR, idle)]);
    const it = s.next()!;
    s.complete(it.url_name, 'skipped', c.now());
    expect(s.next()).toBeNull();
    c.advance(23 * HOUR);
    expect(s.next()).toBeNull();
    c.advance(HOUR + MIN);
    expect(s.next()?.url_name).toBe('empty');
  });

  it('retries a failed item after the back-off, and keeps it due', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('flaky', 3 * HOUR, liquid)]);
    s.complete(s.next()!.url_name, 'failed', c.now());
    expect(s.next()).toBeNull();
    c.advance(10 * MIN);
    expect(s.next()?.url_name).toBe('flaky');
  });

  it('forgets a removed item', () => {
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, clock().now);
    s.load([item('gone', null)]);
    s.complete(s.next()!.url_name, 'removed', T0);
    expect(s.snapshot().total).toBe(0);
    expect(s.noteActivity('id_gone', T0 + 1)).toBe(false);
  });

  it('follows the new market data after a save', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('rising', null, idle)]);
    const it = s.next()!;
    s.complete(it.url_name, 'saved', c.now(), { ...it, market: liquid });
    expect(s.tierOf('rising')).toBe('liquid');
  });

  it('keeps in-memory refreshes, activity and in-flight work across catalogue reloads', () => {
    const c = clock();
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, c.now);
    s.load([item('skipped', 3 * 24 * HOUR, idle), item('busy', 20 * MIN, liquid), item('inflight', null)]);
    s.complete('skipped', 'skipped', c.now());       // never written back to the DB
    s.noteActivity('id_busy', T0 - MIN);
    expect(s.next()?.url_name).toBe('inflight');

    // The reload still carries the stale stored timestamps, and drops 'inflight'.
    s.load([item('skipped', 3 * 24 * HOUR, idle), item('busy', 20 * MIN, liquid)]);
    expect(s.tierOf('busy')).toBe('hot');
    expect(s.next()?.url_name).toBe('busy');
    expect(s.next()).toBeNull();                      // 'skipped' stays fresh in memory
    expect(s.snapshot().total).toBe(3);               // 'inflight' kept until it completes
    s.complete('inflight', 'saved', c.now());
    s.load([item('skipped', 3 * 24 * HOUR, idle), item('busy', 20 * MIN, liquid)]);
    expect(s.snapshot().total).toBe(2);
  });

  it('reports the stalest stored item and the never-priced count', () => {
    const s = new PriceRefreshScheduler(DEFAULT_PRICE_REFRESH_POLICY, clock().now);
    s.load([item('a', 3 * HOUR, liquid), item('b', 30 * MIN, liquid), item('c', null)]);
    expect(s.snapshot()).toMatchObject({ total: 3, never: 1, oldestAgeMs: 3 * HOUR });
  });
});

describe('readPriceRefreshPolicy', () => {
  it('uses the defaults without overrides', () => {
    expect(readPriceRefreshPolicy({})).toEqual(DEFAULT_PRICE_REFRESH_POLICY);
  });

  it('reads minute overrides and clamps them to safe floors', () => {
    const p = readPriceRefreshPolicy({
      PRICE_LIQUID_MAX_AGE_MIN: '90',
      PRICE_HOT_MIN_INTERVAL_MIN: '1',
      PRICE_IDLE_MAX_AGE_MIN: 'nonsense',
      PRICE_LIQUID_VOLUME: '50',
    });
    expect(p.liquidMaxAgeMs).toBe(90 * MIN);
    expect(p.hotMinIntervalMs).toBe(5 * MIN);
    expect(p.idleMaxAgeMs).toBe(DEFAULT_PRICE_REFRESH_POLICY.idleMaxAgeMs);
    expect(p.liquidVolume).toBe(50);
  });
});
