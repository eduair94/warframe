/**
 * Authenticated calls to the account API (`/me*`).
 *
 * Every request carries a fresh Firebase ID token in `Authorization: Bearer`.
 * The API verifies it itself (services/firebaseToken.ts) and answers with
 * `Cache-Control: private, no-store`, so none of this ever touches the shared
 * response cache.
 *
 * All methods resolve to `null` rather than throwing: sync is best-effort
 * background work behind a local-first UI, and a failed sync must never break
 * the page the user is looking at. Callers surface state via `useUserData()`'s
 * `syncState` instead.
 */
import type { UserData, UserSection } from '../utils/userStorage'

export interface AccountUser {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
  locale?: string
  provider?: string | null
  createdAt: string
  lastSeen: string
  data: UserData
}

export function useUserApi() {
  const base = useApiBase()
  const auth = useAuthStore()

  async function authed<T>(path: string, options: Record<string, any> = {}): Promise<T | null> {
    const token = await auth.getIdToken()
    if (!token) return null
    try {
      return await $fetch<T>(`${base}${path}`, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
        // Sync is chatty and non-critical; fail fast instead of hanging the UI.
        timeout: options.timeout ?? 20000,
        retry: options.retry ?? 1,
      })
    } catch {
      return null
    }
  }

  /** Whether the API has accounts switched on (public, cacheable). */
  async function config(): Promise<{ enabled: boolean; projectId: string } | null> {
    try {
      return await $fetch<{ enabled: boolean; projectId: string }>(`${base}/auth/config`, {
        timeout: 10000,
      })
    } catch {
      return null
    }
  }

  /** Full account payload; creates the record on first call. */
  async function me(locale?: string): Promise<AccountUser | null> {
    const query = locale ? `?locale=${encodeURIComponent(locale)}` : ''
    const res = await authed<{ ok: boolean; user: AccountUser }>(`/me${query}`)
    return res?.user ?? null
  }

  /** Replace one section server-side. */
  async function sync(section: UserSection, value: unknown): Promise<boolean> {
    const res = await authed<{ ok?: boolean; error?: string }>('/me/sync', {
      method: 'POST',
      body: { section, value },
    })
    return !!res?.ok
  }

  /** Union the local snapshot with the stored copy (first sign-in). */
  async function merge(data: UserData, locale?: string): Promise<AccountUser | null> {
    const res = await authed<{ ok: boolean; user: AccountUser }>('/me/merge', {
      method: 'POST',
      body: { data, locale },
    })
    return res?.user ?? null
  }

  async function profile(patch: {
    displayName?: string
    locale?: string
  }): Promise<AccountUser | null> {
    const res = await authed<{ ok: boolean; user: AccountUser }>('/me/profile', {
      method: 'POST',
      body: patch,
    })
    return res?.user ?? null
  }

  /** Deletes everything the server holds for this account. */
  async function destroy(): Promise<boolean> {
    const res = await authed<{ ok?: boolean }>('/me/delete', { method: 'POST', body: {} })
    return !!res?.ok
  }

  return { config, me, sync, merge, profile, destroy }
}
