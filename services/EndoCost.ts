/**
 * @fileoverview Warframe mod fusion (endo/credit) cost + dissolve return.
 * @module services/EndoCost
 *
 * Pure, dependency-free maths so the endo-flip endpoint, the endo-source
 * leaderboard and their tests can share one source of truth. Numbers are
 * wiki-verified (cross-checked against 10+ individual mod pages and live
 * warframe.market data, 2026-07-14; see the research report).
 *
 * ## The one rule that governs everything
 * The per-rank cost DOUBLES each rank, so the cumulative cost from rank 0 to
 * rank N is a geometric series (2^N − 1):
 *
 *   cumulativeEndo(N)    = EBC(rarity) × (2^N − 1)
 *   cumulativeCredits(N) = CrBC(rarity) × (2^N − 1)
 *
 * Base costs scale linearly with rarity tier (Common 1 … Legendary 4):
 *   EBC  = tier × 10   → 10 / 20 / 30 / 40
 *   CrBC = tier × 483  → 483 / 966 / 1449 / 1932
 *
 * Because it's a geometric series, the endo to FINISH a mod bought at some
 * partial rank `r` is the difference of two cumulatives:
 *   endoFromRankToMax = EBC × (2^maxRank − 2^r)
 * — i.e. buying a rank-3 copy skips the (cheap) first three rank-ups. This is
 * what makes "buy partially-ranked, finish it" sometimes beat "buy unranked".
 *
 * CRITICAL: rarity sets ONLY the per-rank cost, NOT the max rank. Max rank is an
 * independent per-mod property (commonly 3, 5, 8, 10) — always read both.
 *
 * API rarity strings: warframe.market emits `common|uncommon|rare|legendary`
 * plus two that must be remapped — `archon` → Legendary (×4) and `peculiar` →
 * Uncommon (×2). Galvanized/Amalgam already arrive as `rare`; Primed/Umbral as
 * `legendary`. Anything else is unknown → tier 0 (excluded from the endo board).
 */

/** rarity string (case-insensitive) → tier index. Unknown → 0. */
const RARITY_TIER: Record<string, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  legendary: 4,
  archon: 4, // Archon mods are Legendary-tier fusion cost
  peculiar: 2, // Peculiar mods are Uncommon-tier fusion cost
};

/** Endo to raise a mod one rank at tier 1 (Common). Scales ×tier. */
export const ENDO_BASE_PER_TIER = 10;
/** Credits to raise a mod one rank at tier 1 (Common). Scales ×tier. */
export const CREDIT_BASE_PER_TIER = 483;
/** Base endo returned when dissolving a rank-0 mod, at tier 1. Scales ×tier. */
export const DISSOLVE_BASE_PER_TIER = 5;
/** Fraction of invested fusion endo refunded when a mod is dissolved. */
export const DISSOLVE_REFUND = 0.75;

/** Resolves a warframe.market rarity string to its tier (1-4), or 0 if unknown. */
export function rarityTier(rarity: string | undefined | null): number {
  return RARITY_TIER[String(rarity || '').toLowerCase()] ?? 0;
}

/**
 * Requiem (Kuva Lich / Sister) mods and their Parazon "Invocation" variants rank
 * up via Requiem Relics / murmurs, NOT endo — so they don't belong on an
 * endo-flip board. Keyed by warframe.market url_name.
 */
const REQUIEM_MODS = new Set([
  'ash', 'fass', 'jahu', 'khra', 'lohk', 'netra', 'ris', 'vome', 'xata',
]);

/**
 * True when a mod can actually be ranked with endo (so it's a valid flip
 * candidate). Excludes Requiem/Kuva mods and their `_invocation` variants and
 * anything tagged `requiem`. `tags` is optional.
 */
export function isEndoRankableMod(
  urlName: string | undefined | null,
  tags: string[] | undefined | null = [],
): boolean {
  const u = String(urlName || '').toLowerCase();
  if (REQUIEM_MODS.has(u)) return false;
  if (u.endsWith('_invocation')) return false;
  if ((tags || []).some((t) => String(t).toLowerCase() === 'requiem')) return false;
  return true;
}

/** 2^rank − 1, the geometric multiplier for a cumulative cost to `rank`. */
function geo(rank: number | undefined | null): number {
  const n = Number(rank) || 0;
  if (n <= 0) return 0;
  return Math.pow(2, n) - 1;
}

/** Cumulative endo to fuse a mod from unranked to `rank`. 0 if rarity unknown. */
export function cumulativeEndo(rarity: string | undefined | null, rank: number | undefined | null): number {
  const tier = rarityTier(rarity);
  if (!tier) return 0;
  return tier * ENDO_BASE_PER_TIER * geo(rank);
}

/** Cumulative credits to fuse a mod from unranked to `rank`. 0 if rarity unknown. */
export function cumulativeCredits(rarity: string | undefined | null, rank: number | undefined | null): number {
  const tier = rarityTier(rarity);
  if (!tier) return 0;
  return tier * CREDIT_BASE_PER_TIER * geo(rank);
}

/** Total endo to take a mod from unranked (0) to fully maxed. */
export function endoToMax(rarity: string | undefined | null, maxRank: number | undefined | null): number {
  return cumulativeEndo(rarity, maxRank);
}

/** Total credits to take a mod from unranked (0) to fully maxed. */
export function creditsToMax(rarity: string | undefined | null, maxRank: number | undefined | null): number {
  return cumulativeCredits(rarity, maxRank);
}

/**
 * Endo to FINISH a mod bought at `fromRank`, taking it to `maxRank`.
 * = EBC × (2^maxRank − 2^fromRank). Buying a partially-ranked copy skips the
 * cheap early rank-ups, so this shrinks fast as `fromRank` rises.
 */
export function endoFromRankToMax(
  rarity: string | undefined | null,
  fromRank: number | undefined | null,
  maxRank: number | undefined | null,
): number {
  const tier = rarityTier(rarity);
  const from = Math.max(0, Number(fromRank) || 0);
  const max = Number(maxRank) || 0;
  if (!tier || max <= 0 || from >= max) return 0;
  return tier * ENDO_BASE_PER_TIER * (Math.pow(2, max) - Math.pow(2, from));
}

/** Credits to finish a mod bought at `fromRank`, taking it to `maxRank`. */
export function creditsFromRankToMax(
  rarity: string | undefined | null,
  fromRank: number | undefined | null,
  maxRank: number | undefined | null,
): number {
  const tier = rarityTier(rarity);
  const from = Math.max(0, Number(fromRank) || 0);
  const max = Number(maxRank) || 0;
  if (!tier || max <= 0 || from >= max) return 0;
  return tier * CREDIT_BASE_PER_TIER * (Math.pow(2, max) - Math.pow(2, from));
}

/**
 * Endo returned when a mod at `rank` is dissolved:
 *   floor(0.75 × cumulativeEndo(rank)) + base, base = tier × 5.
 * Drives the endo-source leaderboard's "buy a cheap maxed mod, dissolve it"
 * comparison. 0 if rarity unknown.
 */
export function dissolveEndo(rarity: string | undefined | null, rank: number | undefined | null): number {
  const tier = rarityTier(rarity);
  if (!tier) return 0;
  const base = tier * DISSOLVE_BASE_PER_TIER;
  return Math.floor(DISSOLVE_REFUND * cumulativeEndo(rarity, rank)) + base;
}
