// Duviri Circuit weekly reward rotations — the data + pure clock math behind
// /circuit. The Circuit resets every Monday 00:00 UTC: Normal mode cycles 3
// Warframes over an 11-week loop; Steel Path cycles 5 Incarnon Genesis adapters
// over a 9-week loop (Groups A–I). This computes "this week" from the clock
// alone, so the page updates passively with no manual edits or API dependency.
//
// Anchor verified against the live worldState (warframestat.us /pc/duviriCycle)
// on 2026-07-18: week of Mon 2026-07-13 UTC = Normal Week 3 (Ash/Frost/Nyx) and
// Steel Path Group C (Bo/Latron/Furis/Furax/Strun). Cross-checks against the
// canonical wiki epochs (Normal 2023-04-24 → 168 wks, 168 mod 11 = 3; Steel Path
// 2023-07-17 → 156 wks, 156 mod 9 = 3 = Group C). Source: wiki.warframe.com/w/The_Circuit.
//
// NOTE: if Digital Extremes expands a pool (e.g. adds a 10th Incarnon group, as
// happened 8→9), update the arrays below — that's the only maintenance. The page
// can also cross-check the live API to self-correct the highlighted week.

/** Normal Circuit — 3 Warframes/week, canonical Week 1 → 11. */
export const NORMAL_ROTATION: string[][] = [
  ['Excalibur', 'Trinity', 'Ember'], // Week 1
  ['Loki', 'Mag', 'Rhino'], // Week 2
  ['Ash', 'Frost', 'Nyx'], // Week 3  (anchor)
  ['Saryn', 'Vauban', 'Nova'], // Week 4
  ['Nekros', 'Valkyr', 'Oberon'], // Week 5
  ['Hydroid', 'Mirage', 'Limbo'], // Week 6
  ['Mesa', 'Chroma', 'Atlas'], // Week 7
  ['Ivara', 'Inaros', 'Titania'], // Week 8
  ['Nidus', 'Octavia', 'Harrow'], // Week 9
  ['Gara', 'Khora', 'Revenant'], // Week 10
  ['Garuda', 'Baruuk', 'Hildryn'], // Week 11
]

/** Steel Path Circuit — 5 Incarnon Genesis adapters/group, canonical Group A → I. */
export const INCARNON_ROTATION: string[][] = [
  ['Braton', 'Lato', 'Skana', 'Paris', 'Kunai'], // A
  ['Boar', 'Gammacor', 'Angstrum', 'Gorgon', 'Anku'], // B
  ['Bo', 'Latron', 'Furis', 'Furax', 'Strun'], // C  (anchor)
  ['Lex', 'Magistar', 'Boltor', 'Bronco', 'Ceramic Dagger'], // D
  ['Torid', 'Dual Toxocyst', 'Dual Ichor', 'Miter', 'Atomos'], // E
  ['Ack & Brunt', 'Soma', 'Vasto', 'Nami Solo', 'Burston'], // F
  ['Zylok', 'Sibear', 'Dread', 'Despair', 'Hate'], // G
  ['Dera', 'Sybaris', 'Cestra', 'Sicarus', 'Okina'], // H
  ['Vectis', 'Stug', 'Ballistica', 'Destreza', 'Obex'], // I
]

/** Group letters, aligned to INCARNON_ROTATION indices. */
export const INCARNON_GROUP_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

const WEEK_MS = 604800000
const ANCHOR_UTC = Date.UTC(2026, 6, 13) // Mon 2026-07-13 00:00 UTC (month 0-based: 6 = July)
const ANCHOR_NORMAL_IDX = 2 // Week 3
const ANCHOR_HARD_IDX = 2 // Group C

const mod = (n: number, m: number) => ((n % m) + m) % m

export interface CircuitState {
  /** Canonical index into NORMAL_ROTATION (0 = Week 1). */
  normalIdx: number
  /** Canonical index into INCARNON_ROTATION (0 = Group A). */
  hardIdx: number
  /** This week's 3 Warframes. */
  warframes: string[]
  /** This week's 5 Incarnon adapters. */
  incarnons: string[]
  /** Steel Path group letter for this week. */
  group: string
  /** Start of the current Circuit week (Mon 00:00 UTC), ms. */
  weekStartMs: number
  /** Next Monday 00:00 UTC (when the pools rotate), ms. */
  nextResetMs: number
}

/** Compute the active Circuit week from a timestamp (defaults to now). */
export function circuitState(nowMs: number): CircuitState {
  const w = Math.floor((nowMs - ANCHOR_UTC) / WEEK_MS)
  const normalIdx = mod(ANCHOR_NORMAL_IDX + w, NORMAL_ROTATION.length)
  const hardIdx = mod(ANCHOR_HARD_IDX + w, INCARNON_ROTATION.length)
  const weekStartMs = ANCHOR_UTC + w * WEEK_MS
  return {
    normalIdx,
    hardIdx,
    warframes: NORMAL_ROTATION[normalIdx],
    incarnons: INCARNON_ROTATION[hardIdx],
    group: INCARNON_GROUP_LABELS[hardIdx],
    weekStartMs,
    nextResetMs: weekStartMs + WEEK_MS,
  }
}

/**
 * Find the canonical rotation index whose set of names matches `choices`
 * (order-insensitive) — used to self-correct the highlighted week from the live
 * worldState API. Returns -1 if no group matches (pool changed → update arrays).
 */
export function matchRotationIndex(rotation: string[][], choices: string[] | undefined): number {
  if (!choices || !choices.length) return -1
  const key = (a: string[]) => a.map((s) => s.toLowerCase().trim()).sort().join('|')
  const target = key(choices)
  return rotation.findIndex((g) => key(g) === target)
}
