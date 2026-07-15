/**
 * @fileoverview Endo Exchange (mod-flip) payload interfaces.
 * @module interfaces/endo
 *
 * The `/endo_flip` endpoint is a thin join: it emits each rank-able mod's
 * identity plus the stored per-rank flip ladder. All valuation (endo cost, best
 * buy rank, profit, plat-per-endo) happens client-side in `useEndoValue` — the
 * same split the relic pages use (server sends drops + prices, client computes
 * EV) — so the maths lives in one unit-tested place.
 */

import type { IModFlipData } from '../services/ModFlipCalculator';

/** One mod row in the Endo Exchange payload. */
export interface IEndoFlipRow {
  /** Display name, e.g. "Serration". */
  item_name: string;
  /** URL-friendly name for warframe.market links / thumbs. */
  url_name: string;
  /** Thumbnail path (warframe.market asset). */
  thumb: string;
  /** Item tags (mod, primary, corrupted, aura, …) for client-side categorising. */
  tags: string[];
  /** Per-rank ask/bid ladder + rank-0/max 48h stat blocks (see ModFlipCalculator). */
  flip: IModFlipData;
}

/** Full `/endo_flip` response. */
export interface IEndoFlipResponse {
  meta: { count: number; generatedAt: string };
  mods: IEndoFlipRow[];
}
