// Minimal `vue` stand-in so the pure relic-valuation composable can be unit
// tested under the backend's Node/jest setup (which has no Vue installed).
// `unref` is the only runtime symbol the composable imports.
module.exports = {
  unref: (v) => (v && typeof v === 'object' && 'value' in v ? v.value : v),
}
