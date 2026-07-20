import { defineStore } from 'pinia'
import {
  isFirebaseConfigured,
  resolveFirebaseConfig,
  type FirebaseWebConfig,
} from '../utils/firebaseConfig'

/**
 * Firebase session state for the optional Tenno account layer.
 *
 * Design notes
 * ------------
 *  - The Firebase SDK is imported DYNAMICALLY inside `init()`. Signed-out
 *    visitors — the overwhelming majority, and the ones search engines see —
 *    never download it. `init()` only runs when the user reaches for sign-in
 *    or when a previous session left the "signed in recently" hint below.
 *  - CLIENT ONLY. Firebase Auth needs browser APIs and the whole account layer
 *    is local-first, so SSR always renders the signed-out shell and the client
 *    fills in on hydration. No route guards, no SSR session.
 *  - The store keeps a PLAIN, serializable profile (never the Firebase User
 *    object) so Pinia devtools/SSR payloads stay clean.
 */

/** Set once a session exists so a reload can restore it without a user click. */
const SESSION_HINT_KEY = 'wf_auth_hint'
/** Email cached between "send magic link" and completing it on /account. */
const MAGIC_EMAIL_KEY = 'wf_magic_email'

export interface AuthProfile {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  emailVerified: boolean
  provider: string | null
}

export type SignInResult =
  | 'signed-in'
  | 'redirecting'
  | 'sent'
  | 'not-configured'
  | 'cancelled'
  | 'error'

interface AuthState {
  /** null when signed out. */
  profile: AuthProfile | null
  /** false until the first onAuthStateChanged fires (or we decide not to init). */
  ready: boolean
  /** true when a usable Firebase web config exists. */
  configured: boolean
  /** true once the SDK has been loaded and wired. */
  started: boolean
  /** Last human-readable failure, for the sign-in dialog. */
  error: string | null
  /** Email the magic link was sent to (drives the "check your inbox" state). */
  pendingEmail: string | null
  busy: boolean
}

/** Lazily-resolved Firebase handles; never reactive (they're not serializable). */
let authHandle: any = null
let sdk: any = null
let initPromise: Promise<void> | null = null

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readHint(): boolean {
  if (!isBrowser()) return false
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

function writeHint(on: boolean): void {
  if (!isBrowser()) return
  try {
    if (on) window.localStorage.setItem(SESSION_HINT_KEY, '1')
    else window.localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    /* ignore */
  }
}

function toProfile(user: any): AuthProfile {
  return {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    emailVerified: !!user.emailVerified,
    provider: user.providerData?.[0]?.providerId ?? null,
  }
}

/** Firebase error codes we can phrase better than the raw message. */
function friendlyError(e: any): string {
  const code = String(e?.code || '')
  if (code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) {
    return 'cancelled'
  }
  if (code.includes('invalid-email')) return 'invalid-email'
  if (code.includes('unauthorized-domain')) return 'unauthorized-domain'
  if (code.includes('invalid-action-code') || code.includes('expired-action-code')) {
    return 'expired-link'
  }
  if (code.includes('network')) return 'network'
  return 'error'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    profile: null,
    ready: false,
    configured: false,
    started: false,
    error: null,
    pendingEmail: null,
    busy: false,
  }),

  getters: {
    signedIn: (state): boolean => !!state.profile,
    /** Initials for the avatar fallback, e.g. "ED". */
    initials: (state): string => {
      const source = state.profile?.displayName || state.profile?.email || ''
      const parts = source.replace(/@.*$/, '').split(/[\s._-]+/).filter(Boolean)
      const letters = parts.slice(0, 2).map((p) => p[0]).join('')
      return (letters || source[0] || '?').toUpperCase()
    },
  },

  actions: {
    /** The merged compile-time + runtime web config. */
    config(): FirebaseWebConfig {
      const runtime = useRuntimeConfig().public.firebase as Partial<FirebaseWebConfig> | undefined
      return resolveFirebaseConfig(runtime)
    },

    /**
     * Records whether accounts are available at all, WITHOUT loading the SDK.
     * Safe to call from any page; it only reads runtime config.
     */
    detect(): boolean {
      this.configured = isFirebaseConfigured(this.config())
      if (!this.configured) this.ready = true
      return this.configured
    },

    /**
     * Loads the Firebase SDK and starts listening for auth state. Idempotent
     * and concurrency-safe. `force: false` (the default) returns immediately
     * when there is no session hint, so a first-time visitor pays nothing.
     */
    async init(force = false): Promise<void> {
      if (!import.meta.client) return
      if (this.started) return initPromise ?? undefined
      if (!this.detect()) return
      if (!force && !readHint()) {
        this.ready = true
        return
      }
      if (initPromise) return initPromise

      initPromise = (async () => {
        try {
          const [{ initializeApp, getApps }, authMod] = await Promise.all([
            import('firebase/app'),
            import('firebase/auth'),
          ])
          sdk = authMod
          const cfg = this.config()
          const app = getApps().length ? getApps()[0] : initializeApp(cfg)
          authHandle = authMod.getAuth(app)
          // Survive reloads; the account layer is explicitly a "stay signed in"
          // experience (it exists so your vault follows you).
          await authMod.setPersistence(authHandle, authMod.browserLocalPersistence).catch(() => {})
          this.started = true

          authMod.onAuthStateChanged(authHandle, (user: any) => {
            this.profile = user ? toProfile(user) : null
            this.ready = true
            writeHint(!!user)
          })

          // A signInWithRedirect round-trip resolves here.
          await authMod.getRedirectResult(authHandle).catch(() => null)
        } catch (e: any) {
          this.error = friendlyError(e)
          this.ready = true
        } finally {
          initPromise = null
        }
      })()

      return initPromise
    },

    /** Fresh ID token for the Authorization header, or '' when signed out. */
    async getIdToken(forceRefresh = false): Promise<string> {
      if (!import.meta.client || !this.started || !authHandle?.currentUser) return ''
      try {
        return await authHandle.currentUser.getIdToken(forceRefresh)
      } catch {
        return ''
      }
    },

    async signInGoogle(): Promise<SignInResult> {
      if (!import.meta.client) return 'error'
      this.error = null
      if (!this.detect()) return 'not-configured'
      this.busy = true
      try {
        await this.init(true)
        if (!sdk || !authHandle) return 'error'
        const provider = new sdk.GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        try {
          await sdk.signInWithPopup(authHandle, provider)
          return 'signed-in'
        } catch (e: any) {
          const code = String(e?.code || '')
          // Popups are blocked in in-app browsers and by strict settings —
          // fall back to the redirect flow rather than dead-ending the user.
          if (
            code.includes('popup-blocked') ||
            code.includes('operation-not-supported') ||
            code.includes('popup-closed-by-user')
          ) {
            if (code.includes('popup-closed-by-user')) {
              this.error = 'cancelled'
              return 'cancelled'
            }
            await sdk.signInWithRedirect(authHandle, provider)
            return 'redirecting'
          }
          throw e
        }
      } catch (e: any) {
        this.error = friendlyError(e)
        return this.error === 'cancelled' ? 'cancelled' : 'error'
      } finally {
        this.busy = false
      }
    },

    /**
     * Sends a passwordless sign-in link. `continuePath` must be the localized
     * path of the page that completes it (/account, via useLocalePath).
     */
    async sendMagicLink(email: string, continuePath = '/account'): Promise<SignInResult> {
      if (!import.meta.client) return 'error'
      this.error = null
      const clean = String(email || '').trim()
      if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        this.error = 'invalid-email'
        return 'error'
      }
      if (!this.detect()) return 'not-configured'
      this.busy = true
      try {
        await this.init(true)
        if (!sdk || !authHandle) return 'error'
        const url = `${window.location.origin}${continuePath}?magic=1`
        await sdk.sendSignInLinkToEmail(authHandle, clean, {
          url,
          handleCodeInApp: true,
        })
        try {
          window.localStorage.setItem(MAGIC_EMAIL_KEY, clean)
        } catch {
          /* ignore */
        }
        this.pendingEmail = clean
        return 'sent'
      } catch (e: any) {
        this.error = friendlyError(e)
        return 'error'
      } finally {
        this.busy = false
      }
    },

    /**
     * Completes a magic-link sign-in if the current URL is one. Returns
     * 'signed-in' on success, null when this URL is not a sign-in link.
     */
    async completeMagicLink(): Promise<SignInResult | null> {
      if (!import.meta.client) return null
      if (!this.detect()) return null
      await this.init(true)
      if (!sdk || !authHandle) return null
      const href = window.location.href
      if (!sdk.isSignInWithEmailLink(authHandle, href)) return null
      this.busy = true
      try {
        let email = ''
        try {
          email = window.localStorage.getItem(MAGIC_EMAIL_KEY) || ''
        } catch {
          /* ignore */
        }
        // Opening the link on a different device loses the cached address, so
        // ask for it rather than failing (Firebase requires the same address).
        if (!email) {
          email = String(window.prompt('Confirm the email this link was sent to') || '').trim()
        }
        if (!email) {
          this.error = 'invalid-email'
          return 'error'
        }
        await sdk.signInWithEmailLink(authHandle, email, href)
        try {
          window.localStorage.removeItem(MAGIC_EMAIL_KEY)
        } catch {
          /* ignore */
        }
        this.pendingEmail = null
        return 'signed-in'
      } catch (e: any) {
        this.error = friendlyError(e)
        return 'error'
      } finally {
        this.busy = false
        // Strip the (single-use) credential out of the address bar.
        try {
          window.history.replaceState({}, '', window.location.pathname)
        } catch {
          /* ignore */
        }
      }
    },

    async signOut(): Promise<void> {
      if (!import.meta.client || !sdk || !authHandle) {
        this.profile = null
        writeHint(false)
        return
      }
      try {
        await sdk.signOut(authHandle)
      } catch {
        /* ignore */
      }
      this.profile = null
      writeHint(false)
    },

    clearError(): void {
      this.error = null
    },
  },
})
