/**
 * @fileoverview Stable URL slug for a mission drop source.
 * @module services/missionSlug
 *
 * `(planet, location)` is unique across the WFCD mission-reward tables (no
 * duplicate planet keys; location keys are unique within a planet), so a kebab
 * of the two is a stable, collision-free id for the /mission/<slug> page. Shared
 * by DropService (stamps it on dialog rows) and MissionService (page lookup).
 */
export function missionSlug(planet: string, location: string): string {
  return `${planet || ''} ${location || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
