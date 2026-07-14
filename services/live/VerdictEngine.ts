import { LiveBook, FairValueInputs, Verdict, VerdictKind } from './LiveTypes';

export interface VerdictOpts {
  halfVolume: number;
  baseBandPct: number;
  maxBandPct: number;
  confMin: number;
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

  let verdict: VerdictKind;
  let reason: string;
  if (!(fair > 0) || confidence < o.confMin) {
    verdict = 'hold';
    reason = fair <= 0 ? 'no fair-value baseline yet' : 'insufficient liquidity/history to trust a signal';
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

  const score = verdict === 'sell'
    ? -Math.round(clamp(sellSignal / (band || 1), -1, 1) * 100)
    : Math.round(clamp(buySignal / (band || 1), -1, 1) * 100);

  return {
    url_name: book.url_name,
    verdict, score, confidence,
    fv: fair, bestBuy: book.bestBuy, bestSell: book.bestSell,
    dealPct, flipMargin, reason,
  };
}
