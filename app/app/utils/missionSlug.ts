/** Same rule as the backend services/missionSlug.ts — keep them in sync. */
export function missionSlug(planet: string, location: string): string {
  return `${planet || ''} ${location || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
