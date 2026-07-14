import { LiveBook, FairValueInputs, Verdict, VerdictKind } from './LiveTypes';

export interface VerdictOpts {
  halfVolume: number;
  baseBandPct: number;
  maxBandPct: number;
  confMin: number;
  thinVolume: number; // 48h volume below this -> thin/rig-risk, verdict forced to hold
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Liquidity-weighted blend of realized avg_price and history median.
 * w = volume / (volume + halfVolume): high volume trusts realized trades,
 * thin items lean on the slower history median. Degenerate inputs (missing
 * avg_price or missing history) collapse to the side that has data.
 */
export function computeFairValue(fv: FairValueInputs, halfVolume: number): number {
  const avg = fv.avg_price > 0 ? fv.avg_price : 0;
  const med = fv.medianHistory > 0 ? fv.medianHistory : 0;
  if (avg <= 0 && med <= 0) return 0;
  if (avg <= 0) return med;
  if (med <= 0) return avg;
  const denom = fv.volume + halfVolume;
  const w = denom > 0 ? fv.volume / denom : 0;
  return w * avg + (1 - w) * med;
}

/** Confidence 0..1 from realized volume, live book depth, and history depth. */
function confidenceOf(book: LiveBook, fv: FairValueInputs): number {
  const vol = clamp(fv.volume / 30, 0, 1);
  const depth = clamp((book.onlineBuyCount + book.onlineSellCount) / 6, 0, 1);
  const hist = clamp(fv.dataDays / 30, 0, 1);
  return clamp(0.4 * vol + 0.3 * depth + 0.3 * hist, 0, 1);
}

/** Volatility widens the neutral band so jumpy items don't cry wolf. */
function bandOf(fv: FairValueInputs, o: VerdictOpts): number {
  const factor = 1 + clamp((fv.volatility ?? 0) / 50, 0, 1); // up to 2x
  return Math.min(o.baseBandPct * factor, o.maxBandPct);
}

export function computeVerdict(book: LiveBook, fvIn: FairValueInputs, o: VerdictOpts): Verdict {
  const fair = computeFairValue(fvIn, o.halfVolume);
  const confidence = confidenceOf(book, fvIn);
  const band = bandOf(fvIn, o);

  const buySignal = fair > 0 && book.bestSell > 0 ? (fair - book.bestSell) / fair : 0;   // + = cheap to buy
  const sellSignal = fair > 0 && book.bestBuy > 0 ? (book.bestBuy - fair) / fair : 0;     // + = rich to sell
  const dealPct = fair > 0 && book.bestSell > 0 ? (fair - book.bestSell) / fair : 0;
  const flipMargin = book.bestSell > 0 && book.bestBuy > 0 ? book.bestSell - book.bestBuy : 0;

  const volume = Math.max(0, Number(fvIn.volume) || 0);
  const thin = volume < o.thinVolume;

  let verdict: VerdictKind;
  let reason: string;
  if (!(fair > 0)) {
    verdict = 'hold';
    reason = 'no fair-value baseline yet';
  } else if (thin) {
    // Low realized volume: a couple of orders can rig the price, so never advise.
    verdict = 'hold';
    reason = `thin volume (${Math.round(volume)}/48h) — price easily rigged, not advised`;
  } else if (confidence < o.confMin) {
    verdict = 'hold';
    reason = 'insufficient liquidity/history to trust a signal';
  } else if (buySignal >= band) {
    verdict = 'buy';
    reason = `sell price ${Math.round(buySignal * 100)}% below fair value (${Math.round(fair)}p)`;
  } else if (sellSignal >= band) {
    verdict = 'sell';
    reason = `buyers paying ${Math.round(sellSignal * 100)}% above fair value (${Math.round(fair)}p)`;
  } else {
    verdict = 'fair';
    reason = `within ${Math.round(band * 100)}% of fair value (${Math.round(fair)}p)`;
  }

  const score = verdict === 'buy'
    ? Math.round(clamp(buySignal / (band || 1), -1, 1) * 100)
    : verdict === 'sell'
    ? -Math.round(clamp(sellSignal / (band || 1), -1, 1) * 100)
    : 0;

  return {
    url_name: book.url_name,
    verdict, score, confidence,
    fv: fair, bestBuy: book.bestBuy, bestSell: book.bestSell,
    dealPct, flipMargin, volume, thin, reason,
  };
}
