/**
 * Ambient shim so the app's shared composables — which import `useNuxtApp` from
 * Nuxt's virtual `#imports` module — type-check under the backend jest program.
 * Runtime resolution is handled separately by jest.config `moduleNameMapper`
 * (`#imports` → test-helpers/imports-stub.js).
 */
declare module '#imports' {
  export function useNuxtApp(): any;
}
