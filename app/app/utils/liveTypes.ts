// Client mirror of services/live/LiveTypes.ts — keep field-for-field in sync.
// The Nuxt app is a separate package with no path into the repo-root backend, so
// (like MarketData in marketLookup.ts) we re-declare the shapes here. Auto-imported.

export type VerdictKind = 'buy' | 'sell' | 'fair' | 'hold'

export interface LiveBook {
  url_name: string
  bestBuy: number // highest online buy (what you get selling now)
  bestSell: number // lowest online sell (what you pay buying now)
  buyAvg: number
  sellAvg: number
  onlineBuyCount: number
  onlineSellCount: number
  updatedAt: number // epoch ms
}

export interface Verdict {
  url_name: string
  verdict: VerdictKind
  score: number // -100 (overpriced) .. +100 (bargain)
  confidence: number // 0..1
  fv: number
  bestBuy: number
  bestSell: number
  dealPct: number // (fv - bestSell) / fv
  flipMargin: number // bestSell - bestBuy
  volume: number // 48h realized trade volume (rig-risk signal)
  thin: boolean // low volume -> price easily rigged, forced to hold
  reason: string
}

// The 'update' socket event payload broadcast by the warframe-live server.
export interface LiveUpdate {
  url_name: string
  book: LiveBook
  verdict: Verdict
}

// One newly-published wf.market order (from the live 'pulse' broadcast).
export interface RecentOrder {
  itemId: string
  url_name: string
  item_name: string
  thumb: string
  type: 'buy' | 'sell'
  platinum: number
  quantity: number
  rank?: number
  platform: string
  at: number // epoch ms
}

// Global 'pulse' broadcast: online traders, live orders/min, latest listings.
export interface MarketPulse {
  online: { connections: number; authorizedUsers: number }
  ordersPerMin: number
  recent: RecentOrder[]
  updatedAt: number
}
