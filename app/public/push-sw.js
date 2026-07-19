/**
 * Web Push handler (Spec B). This file is pulled into the vite-pwa generated
 * service worker via `pwa.workbox.importScripts` (nuxt.config.ts), so it runs in
 * the same SW that already handles offline caching — no second registration.
 *
 * The server sends a JSON payload { title, body, url, tag }. We show it and, on
 * click, focus an existing tab (navigating it to the item) or open a new one.
 */
/* global self, clients */
self.addEventListener('push', function (event) {
  var data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = {}
  }
  var title = data.title || 'Warframe price alert'
  var options = {
    body: data.body || '',
    tag: data.tag || undefined,
    renotify: !!data.tag,
    icon: '/android-chrome-192x192.png',
    data: { url: data.url || '/portfolio' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  var target = (event.notification.data && event.notification.data.url) || '/portfolio'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (wins) {
      for (var i = 0; i < wins.length; i++) {
        var c = wins[i]
        if ('focus' in c) {
          if ('navigate' in c) {
            try {
              c.navigate(target)
            } catch (e) {
              /* cross-origin or detached — ignore, just focus */
            }
          }
          return c.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(target)
    })
  )
})
