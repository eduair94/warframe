/**
 * Shared valuation for the /endo Endo Exchange (mod flipping + endo sources).
 *
 * All the interesting maths lives here (not in the page) so it can be unit-tested
 * and so the two directions agree — the same split the relic pages use
 * (`useRelicValue`). The server (`/endo_flip`) ships only each mod's identity +
 * per-rank flip ladder; this module turns that into profit-per-endo.
 *
 * ## The two directions
 * - **Spend Endo → Plat (mod flip):** buy a mod at the cheapest worthwhile rank,
 *   finish it with endo, resell maxed. Ranked by plat per 1,000 endo. Because
 *   the fusion cost is a geometric series, buying a *partially* ranked copy skips
 *   the cheap early rank-ups — so the best buy-in isn't always rank 0.
 * - **Get Endo cheap: Plat → Endo (endo sources):** rank Ayatan sculptures,
 *   rivens and normal mods (bought maxed & dissolved) by endo per platinum.
 *
 * Endo/credit maths mirror services/EndoCost.ts (wiki-verified 2026-07-14).
 */

/** rarity string (case-insensitive) → tier; archon=Legendary, peculiar=Uncommon. */
const RARITY_TIER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
  archon: 4,
  peculiar: 2,
}
const ENDO_BASE_PER_TIER = 10
const CREDIT_BASE_PER_TIER = 483
const DISSOLVE_BASE_PER_TIER = 5
const DISSOLVE_REFUND = 0.75

/** Liquidity half-weight — a maxed mod's 48h volume where its demand counts half. */
export const VOL_K = 5

export function rarityTier(rarity: string | undefined | null): number {
  return RARITY_TIER[String(rarity || '').toLowerCase()] ?? 0
}

/** Requiem (Kuva Lich) mods — murmur-ranked, not endo. Keyed by url_name. */
const REQUIEM_MODS = new Set(['ash', 'fass', 'jahu', 'khra', 'lohk', 'netra', 'ris', 'vome', 'xata'])
/** True when a mod can be ranked with endo (excludes Requiem/Kuva + Invocation). */
export function isEndoRankableMod(urlName: string | undefined | null, tags: string[] = []): boolean {
  const u = String(urlName || '').toLowerCase()
  if (REQUIEM_MODS.has(u)) return false
  if (u.endsWith('_invocation')) return false
  if ((tags || []).some((t) => String(t).toLowerCase() === 'requiem')) return false
  return true
}
function geo(rank: number): number {
  const n = Number(rank) || 0
  return n <= 0 ? 0 : Math.pow(2, n) - 1
}
/** Cumulative endo to fuse a mod from unranked to `rank`. */
export function cumulativeEndo(rarity: string, rank: number): number {
  const t = rarityTier(rarity)
  return t ? t * ENDO_BASE_PER_TIER * geo(rank) : 0
}
/** Total endo to take a mod unranked → maxed. */
export function endoToMax(rarity: string, maxRank: number): number {
  return cumulativeEndo(rarity, maxRank)
}
/** Total credits to take a mod unranked → maxed. */
export function creditsToMax(rarity: string, maxRank: number): number {
  const t = rarityTier(rarity)
  return t ? t * CREDIT_BASE_PER_TIER * geo(maxRank) : 0
}
/** Endo to FINISH a mod bought at `fromRank`, up to `maxRank` (skips early ranks). */
export function endoFromRankToMax(rarity: string, fromRank: number, maxRank: number): number {
  const t = rarityTier(rarity)
  const from = Math.max(0, Number(fromRank) || 0)
  const max = Number(maxRank) || 0
  if (!t || max <= 0 || from >= max) return 0
  return t * ENDO_BASE_PER_TIER * (Math.pow(2, max) - Math.pow(2, from))
}
/** Credits to finish a mod bought at `fromRank`, up to `maxRank`. */
export function creditsFromRankToMax(rarity: string, fromRank: number, maxRank: number): number {
  const t = rarityTier(rarity)
  const from = Math.max(0, Number(fromRank) || 0)
  const max = Number(maxRank) || 0
  if (!t || max <= 0 || from >= max) return 0
  return t * CREDIT_BASE_PER_TIER * (Math.pow(2, max) - Math.pow(2, from))
}
/** Endo returned dissolving a mod at `rank`: floor(0.75·cumulative) + tier·5. */
export function dissolveEndo(rarity: string, rank: number): number {
  const t = rarityTier(rarity)
  if (!t) return 0
  return Math.floor(DISSOLVE_REFUND * cumulativeEndo(rarity, rank)) + t * DISSOLVE_BASE_PER_TIER
}

// ---- flip data shapes (mirror services/ModFlipCalculator.ts) ----
export interface FlipRung {
  rank: number
  ask: number
  bid: number
  sellCount: number
  buyCount: number
}
export interface FlipStat {
  avg_price: number
  volume: number
}
export interface ModFlip {
  rarity: string
  maxRank: number
  ranks: FlipRung[]
  unranked: FlipStat
  maxed: FlipStat
  updatedAt?: string
}
export interface EndoFlipRow {
  item_name: string
  url_name: string
  thumb: string
  tags: string[]
  flip: ModFlip
}

/** One buy-in candidate: acquire at `rank`, finish to max. */
export interface FlipOption {
  rank: number
  /** Lowest sell order at this rank — buy instantly at the ask. */
  ask: number
  /** Highest buy order at this rank — the competitive buy-order price. */
  bid: number
  /** Price actually used as the buy-in (ask by default; bid in buy-order mode). */
  buyIn: number
  endoToFinish: number
  creditsToFinish: number
  /** maxedSell − buyIn (before credits/time). */
  profit: number
  /** profit ÷ endoToFinish × 1000 — the ranking metric. */
  platPer1kEndo: number
}

/** Full client-side evaluation of one mod-flip row. */
export interface FlipEval {
  rarity: string
  maxRank: number
  /**
   * Realizable maxed sell = the CURRENT lowest maxed sell order (what you'd list
   * at, competing with other sellers). Falls back to the 48h average only when
   * no maxed sell order exists. NOT the 48h average by default — on thin mods
   * the average is one stale trade and wildly overstates the sell price.
   */
  maxedSell: number
  /** Current lowest maxed sell order (list price). */
  maxedAsk: number
  /** Highest maxed buy order — instant-sell price (0 if nobody is buying). */
  maxedBid: number
  maxedAvg: number
  maxedVolume: number
  /** Lowest unranked (rank-0) ask — the classic buy-in. */
  unrankedAsk: number
  unrankedVolume: number
  endoToMax: number
  creditsToMax: number
  /** Best rank to buy at (highest plat-per-endo, profit > 0), or null. */
  best: FlipOption | null
  /** Baseline: buy unranked and max it. */
  unrankedOption: FlipOption | null
  /** Every profitable buy-in rank, best first. */
  options: FlipOption[]
  /** vol/(vol+K) in [0,1) from maxed 48h volume. */
  liquidity: number
  demand: DemandTier
  /** Endo from dissolving a maxed copy (Direction B). */
  dissolveEndoMaxed: number
  /** When this mod's order-book snapshot was taken (ISO), for the freshness line. */
  updatedAt: string
}

export interface DemandTier {
  key: 'high' | 'med' | 'low' | 'dead'
  label: string
  cls: string
}
export function demandTier(liq: number): DemandTier {
  if (liq >= 0.66) return { key: 'high', label: 'High demand', cls: 'dem--high' }
  if (liq >= 0.33) return { key: 'med', label: 'Fair demand', cls: 'dem--med' }
  if (liq > 0) return { key: 'low', label: 'Thin demand', cls: 'dem--low' }
  return { key: 'dead', label: 'No demand', cls: 'dem--dead' }
}

/** How to price the maxed sell side. */
export type SellBasis =
  | 'ask' // list at the current lowest maxed ask (default; compete with sellers)
  | 'avg' // the 48h average traded price (smoother, but can be stale on thin mods)
  | 'instant' // dump to the highest maxed buy order (fast, usually less)

/** Options for evaluating a flip. */
export interface FlipOpts {
  /**
   * Buy the mod via a competitive BUY ORDER (pay ~the highest existing bid)
   * instead of taking the lowest ASK. Cheaper when there's a buy-order pool to
   * compete in, but slower/less certain. Default false (buy at the ask).
   */
  buyViaBid?: boolean
  /** How to value the maxed sell. Default 'ask' (current lowest maxed sell). */
  sellBasis?: SellBasis
}

/**
 * Evaluate a mod-flip row: the maxed sell side, every profitable buy-in rank,
 * the best one, and liquidity. Pure — safe to call in a computed.
 *
 * Prices come from the CURRENT order-book ladder (lowest ask / highest bid per
 * rank), not the 48h average — the average can be a single stale trade that
 * badly overstates a thin mod's value.
 */
export function evalFlip(row: EndoFlipRow, opts: FlipOpts = {}): FlipEval {
  const flip = row?.flip || ({} as ModFlip)
  const rarity = flip.rarity || ''
  const maxRank = Number(flip.maxRank) || 0
  const rungs = Array.isArray(flip.ranks) ? flip.ranks : []
  const byRank = (r: number) => rungs.find((x) => x.rank === r)

  const maxRung = byRank(maxRank)
  const maxedAsk = Number(maxRung?.ask) || 0
  const maxedBid = Number(maxRung?.bid) || 0
  const maxedAvg = Number(flip.maxed?.avg_price) || 0
  const maxedVolume = Number(flip.maxed?.volume) || 0
  // What you RECEIVE selling maxed. DEFAULT ('ask') = the current lowest maxed
  // sell order from an online player — the real, present price, so a single
  // stale/fake 48h trade can't mislead. 'instant' = dump to the top buy order;
  // 'avg' = opt in to the 48h traded average. Each falls back sensibly.
  const listSell = maxedAsk > 0 ? maxedAsk : maxedAvg
  let maxedSell: number
  if (opts.sellBasis === 'avg') maxedSell = maxedAvg > 0 ? maxedAvg : listSell
  else if (opts.sellBasis === 'instant') maxedSell = maxedBid > 0 ? maxedBid : listSell
  else maxedSell = listSell

  const unrankedRung = byRank(0)
  const unrankedAsk = Number(unrankedRung?.ask) || 0
  const unrankedVolume = Number(flip.unranked?.volume) || 0

  // Candidate buy-in ranks: every rank below max where you can acquire a copy.
  // Finishing from a higher rank costs less endo but the copy costs more to buy.
  const options: FlipOption[] = []
  for (const rung of rungs) {
    if (rung.rank >= maxRank) continue // maxed rung isn't a buy-in
    const ask = Number(rung.ask) || 0
    const bid = Number(rung.bid) || 0
    // Buy-in: at the ask (instant), or via a buy order competing at the bid.
    const buyIn = opts.buyViaBid ? (bid > 0 ? bid : ask) : ask
    if (buyIn <= 0) continue
    const endoToFinish = endoFromRankToMax(rarity, rung.rank, maxRank)
    if (endoToFinish <= 0) continue
    const profit = maxedSell - buyIn
    const platPer1kEndo = (profit / endoToFinish) * 1000
    options.push({
      rank: rung.rank,
      ask,
      bid,
      buyIn,
      endoToFinish,
      creditsToFinish: creditsFromRankToMax(rarity, rung.rank, maxRank),
      profit,
      platPer1kEndo,
    })
  }
  const profitable = options.filter((o) => o.profit > 0)
  profitable.sort((a, b) => b.platPer1kEndo - a.platPer1kEndo)
  const best = profitable[0] || null
  const unrankedOption = options.find((o) => o.rank === 0) || null

  const liquidity = maxedVolume / (maxedVolume + VOL_K)

  return {
    rarity,
    maxRank,
    maxedSell,
    maxedAsk,
    maxedBid,
    maxedAvg,
    maxedVolume,
    unrankedAsk,
    unrankedVolume,
    endoToMax: endoToMax(rarity, maxRank),
    creditsToMax: creditsToMax(rarity, maxRank),
    best,
    unrankedOption,
    options: profitable,
    liquidity,
    demand: demandTier(liquidity),
    dissolveEndoMaxed: dissolveEndo(rarity, maxRank),
    updatedAt: flip.updatedAt || '',
  }
}

/** A flip is worth showing when the best buy-in makes a profit and maxed sells. */
export function hasFlip(ev: FlipEval): boolean {
  return !!ev.best && ev.best.profit > 0 && ev.maxedSell > 0
}

// =====================================================================
// Direction B — endo sources (Plat → Endo)
// =====================================================================

export type EndoSourceKind = 'sculpture' | 'riven' | 'mod'

export interface EndoSourceRow {
  kind: EndoSourceKind
  name: string
  url_name?: string
  thumb?: string
  /** Full warframe.market URL for this source (item page, or riven auction). */
  link: string
  /** Ready-to-send WTB whisper for this source. */
  whisper: string
  /** Endo you get. */
  endo: number
  /** Plat you pay to acquire it. */
  plat: number
  /** endo ÷ plat — higher is a cheaper endo source. */
  endoPerPlat: number
  /** 48h volume (liquidity), where known. */
  volume?: number
  liquidity: number
  sub?: string
}

export function endoPerPlat(endo: number, plat: number): number {
  const e = Number(endo) || 0
  const p = Number(plat) || 0
  return p > 0 ? e / p : 0
}

/** warframe.market item page URL. */
export function itemUrl(urlName: string): string {
  return 'https://warframe.market/items/' + urlName
}

/**
 * A ready-to-paste warframe.market WTB whisper. The site's own "buy" button
 * copies the same shape with the seller's name prefixed; we omit the name since
 * the aggregate feed has no single seller — paste it after picking one.
 */
export function buyWhisper(name: string, plat: number): string {
  return `/w  Hi! I want to buy: "${name}" for ${Math.round(Number(plat) || 0)} platinum. (warframe.market)`
}

/**
 * Fully-starred Ayatan sculpture endo (wiki-verified 2026-07-14). Keyed by the
 * short slug warframe.market uses, e.g. `sculpture_anasa` → `anasa`.
 */
export const SCULPTURE_ENDO: Record<string, number> = {
  anasa: 3450,
  ayr: 1425,
  chattraka: 2600,
  hemakara: 2600,
  kitha: 3000,
  orta: 2700,
  piv: 1725,
  sah: 1500,
  valana: 1575,
  vaya: 1800,
  zambuka: 2600,
}

/**
 * Build an endo-source row for a normal mod: buy a maxed copy, dissolve it.
 * The cost basis is the 48h AVERAGE maxed price (robust — a single 1p troll ask
 * can't inflate endo/plat here), falling back to the current ask only when there
 * is no traded average. The page only feeds liquid mods (real 48h volume) into
 * this, so the average is meaningful.
 */
export function modAsEndoSource(row: EndoFlipRow): EndoSourceRow {
  const ev = evalFlip(row)
  const plat = ev.maxedAvg > 0 ? ev.maxedAvg : ev.maxedAsk
  const endo = ev.dissolveEndoMaxed
  return {
    kind: 'mod',
    name: row.item_name,
    url_name: row.url_name,
    thumb: row.thumb,
    link: itemUrl(row.url_name),
    whisper: buyWhisper(row.item_name, plat),
    endo,
    plat,
    endoPerPlat: endoPerPlat(endo, plat),
    volume: ev.maxedVolume,
    liquidity: ev.liquidity,
    sub: `${row.flip.rarity} · dissolve maxed (48h avg)`,
  }
}

export function fmtPlat(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
export function fmtEndo(n: number): string {
  return Math.round(Number(n) || 0).toLocaleString('en-US')
}
/** Compact endo like "20.5k" for tight columns. */
export function fmtEndoK(n: number): string {
  const v = Number(n) || 0
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
  return String(Math.round(v))
}
export function fmtNum(n: number, dp = 1): string {
  return (Number(n) || 0).toFixed(dp)
}
