// Retires the Roller's old service worker at randsum.dev/app/.
//
// The app moved to app.randsum.dev; randsum.dev/app/ is now its product page.
// Browsers that installed the app here still have the old worker, which would
// keep answering /app/ with the cached app shell. Every navigation checks this
// URL for an update (`_headers` keeps it uncached), so this replacement takes
// over, deletes the old caches, unregisters itself and reloads its pages, which
// then load the product page from the network. Keep this file for as long as
// old installs might still open.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter(key => key.startsWith('randsum-app-')).map(key => caches.delete(key)))
      await self.registration.unregister()
      const windows = await self.clients.matchAll({ type: 'window' })
      await Promise.all(windows.map(client => client.navigate(client.url).catch(() => undefined)))
    })()
  )
})
