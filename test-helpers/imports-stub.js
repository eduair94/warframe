// Minimal `#imports` stand-in so the pure valuation composables (which pull
// `useNuxtApp` from Nuxt's virtual `#imports` for i18n labels) can be unit
// tested under the backend's Node/jest setup, which has no Nuxt runtime.
// The composables only touch this inside a try/catch label helper, so an empty
// Nuxt app is enough — the English fallbacks are used.
module.exports = {
  useNuxtApp: () => ({}),
};
