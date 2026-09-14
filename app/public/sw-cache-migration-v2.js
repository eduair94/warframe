/** Retire the old API cache, which could include authenticated /me responses. */
/* global self, caches */
self.addEventListener('activate', function (event) {
  // Exact name only: retain public prices, installed icons and compiled assets.
  event.waitUntil(caches.delete('warframe-api'))
})
