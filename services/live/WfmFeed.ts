import { EventEmitter } from 'events';
import { NormalizedOrder, FeedSnapshot, FeedDelta } from './LiveTypes';

export type FeedStatus = { source: 'poller' | 'socket'; up: boolean; detail?: string };

/**
 * A source of live order data for the hot set. Implementations (HotPoller,
 * WfmSocketClient) emit the SAME normalized events so LiveGateway never cares
 * which one is running.
 *   emit('snapshot', FeedSnapshot)  — full order list for one item
 *   emit('delta', FeedDelta)        — incremental change for one item
 *   emit('status', FeedStatus)      — source up/down (drives poller fallback)
 */
export interface WfmFeed extends EventEmitter {
  subscribe(url_name: string): void;
  unsubscribe(url_name: string): void;
  setLiveSet(urls: string[]): void;
  start(): void;
  stop(): void;
}

const STATUSES = new Set(['ingame', 'online', 'offline']);

/** Maps the v1 `{payload:{orders}}` rows MarketService returns into NormalizedOrder[]. */
export function mapV1OrdersToNormalized(v1Orders: any[]): NormalizedOrder[] {
  const out: NormalizedOrder[] = [];
  for (const o of v1Orders || []) {
    if (!o || o.id == null) continue;
    const status = STATUSES.has(o?.user?.status) ? o.user.status : 'offline';
    out.push({
      id: String(o.id),
      order_type: o.order_type === 'buy' ? 'buy' : 'sell',
      platinum: Number(o.platinum) || 0,
      quantity: Number(o.quantity) || 1,
      visible: o.visible !== false,
      platform: o.platform || 'pc',
      mod_rank: o.mod_rank,
      subtype: o.subtype,
      user: { id: o?.user?.id, ingame_name: o?.user?.ingame_name, status },
    });
  }
  return out;
}

export type { FeedSnapshot, FeedDelta };
