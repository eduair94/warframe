/**
 * @fileoverview Stable URL slug for a mission drop source.
 * @module services/missionSlug
 *
 * `(planet, location)` is unique across the WFCD mission-reward tables (no
 * duplicate planet keys; location keys are unique within a planet), so a kebab
 * of the two is a stable, collision-free id for the /mission/<slug> page. Shared
 * by DropService (stamps it on dialog rows) and MissionService (page lookup).
 *
 * NOTE: Theoretically, two different (planet, location) pairs could collide if
 * text straddles the join point the same way after normalization (e.g.,
 * `missionSlug('A B', 'C')` and `missionSlug('A', 'B C')` both yield `"a-b-c"`).
 * Empirically verified as a non-issue: zero collisions across the real 435-node
 * WFCD dataset (24 fixed planets × their locations) as of July 2026.
 */
export function missionSlug(planet: string, location: string): string {
  return `${planet || ''} ${location || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
