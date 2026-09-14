type EntityKind = 'set' | 'relic' | 'mission'

/** Null is the API's explicit absent-entity response; error envelopes are not. */
export function entityPayloadStatus(kind: EntityKind, payload: unknown): 200 | 404 | 503 {
  if (payload === null && kind !== 'set') return 404
  if (!payload || typeof payload !== 'object') return 503
  const value = payload as Record<string, unknown>
  if (kind === 'set' && typeof value.error === 'string' && /^(?:Set not found|Not a set): /.test(value.error)) {
    return 404
  }
  if ('error' in value) return 503
  if (kind === 'set') return value.set && Array.isArray(value.parts) ? 200 : 503
  if (kind === 'relic') return Array.isArray(value.rewards) ? 200 : 503
  return Array.isArray(value.rotations) ? 200 : 503
}
