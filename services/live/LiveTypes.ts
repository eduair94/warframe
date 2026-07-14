/** Normalized order — the snake_case subset of transformV2OrdersToV1 output we need. */
export interface NormalizedOrder {
  id: string;
  order_type: 'buy' | 'sell';
  platinum: number;
  quantity: number;
  visible: boolean;
  platform: string;
  mod_rank?: number;
  subtype?: string;
  user: { id?: string; ingame_name?: string; status: 'ingame' | 'online' | 'offline' };
}

/** Best online prices + depth for one item, recomputed on every delta. */
export interface LiveBook {
  url_name: string;
  bestBuy: number;   // highest online buy (what you get selling now)
  bestSell: number;  // lowest online sell (what you pay buying now)
  buyAvg: number;
  sellAvg: number;
  onlineBuyCount: number;
  onlineSellCount: number;
  updatedAt: number; // epoch ms
}

/** Fair-value baseline inputs, loaded from Mongo (no extra HTTP). */
export interface FairValueInputs {
  url_name: string;
  avg_price: number;      // wf.market 48h realized average (item.market.avg_price)
  medianHistory: number;  // rolling median of stored daily-history price
  volatility: number | null;
  dataDays: number;
  volume: number;
  /** Max mod/arcane rank (from items_in_set[0].mod_max_rank); undefined for non-ranked items.
   *  Ranked items (arcanes, mods, rivens) price at this rank so rank-0 lowballs don't skew "best". */
  maxRank?: number;
}

export type VerdictKind = 'buy' | 'sell' | 'fair' | 'hold';

export interface Verdict {
  url_name: string;
  verdict: VerdictKind;
  score: number;       // -100 (overpriced) .. +100 (bargain)
  confidence: number;  // 0..1
  fv: number;
  bestBuy: number;
  bestSell: number;
  dealPct: number;     // (fv - bestSell) / fv
  flipMargin: number;  // bestSell - bestBuy
  volume: number;      // 48h realized trade volume (rig-risk signal)
  thin: boolean;       // volume below the thin threshold -> price easily rigged, forced to hold
  reason: string;
}

/** What the Socket.IO server streams to the front for one item. */
export interface LiveUpdate {
  url_name: string;
  book: LiveBook;
  verdict: Verdict;
}

/** Normalized events emitted by any WfmFeed implementation. */
export interface FeedSnapshot { url_name: string; orders: NormalizedOrder[]; }
export interface PresenceChange { userId: string; status: 'ingame' | 'online' | 'offline'; }
export interface FeedDelta {
  url_name: string;
  upserts?: NormalizedOrder[];
  removeIds?: string[];
  presence?: PresenceChange[];
}
