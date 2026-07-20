/**
 * Firebase WEB config.
 *
 * These values are PUBLIC by design — a Firebase web config identifies the
 * project, it does not authorize anything (access is governed by the Auth
 * providers, the Authorized-domains list and, server-side, by ID-token
 * verification in services/firebaseToken.ts). Google ships them in every
 * client bundle; there is nothing here to keep secret.
 *
 * The defaults below are baked in so a plain `npm run build` works, and each
 * field can be overridden at RUNTIME through Nitro's `NUXT_PUBLIC_*` mechanism
 * (see nuxt.config `runtimeConfig.public.firebase`) — that matters because the
 * deploy script does not export build-time env vars, so anything read only in
 * nuxt.config would be frozen at build time.
 *
 * Until a real project is configured, `apiKey` stays empty: `isFirebaseConfigured()`
 * then returns false, the sign-in entry point is hidden and every tool keeps
 * working in its signed-out, localStorage-only mode. See docs/firebase-setup.md.
 */

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  messagingSenderId?: string
  storageBucket?: string
}

/** Compile-time defaults; override per-deployment with NUXT_PUBLIC_FIREBASE_*. */
export const FIREBASE_DEFAULTS: FirebaseWebConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: '',
  messagingSenderId: '',
  storageBucket: '',
}

/** A config is usable only when Firebase's three required fields are present. */
export function isFirebaseConfigured(cfg?: Partial<FirebaseWebConfig> | null): boolean {
  return !!(cfg && cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)
}

/** Merges the runtime override (if any) over the compile-time defaults. */
export function resolveFirebaseConfig(
  runtime?: Partial<FirebaseWebConfig> | null
): FirebaseWebConfig {
  const merged: FirebaseWebConfig = { ...FIREBASE_DEFAULTS }
  if (runtime) {
    for (const key of Object.keys(merged) as Array<keyof FirebaseWebConfig>) {
      const value = runtime[key]
      if (typeof value === 'string' && value) merged[key] = value as never
    }
  }
  return merged
}
