// Offline for the RANDSUM Roller at app.randsum.dev. The host serves only the
// app, so the worker is scoped to the whole origin. The page is network-first (a deploy shows up on the next
// online visit) and falls back to the cached copy; fingerprinted /_astro/
// assets and the app's own files are cache-first.
const CACHE = 'randsum-app-v2'
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
]

// Module scripts and fonts are CORS requests, so the server may answer with a
// Vary header the cached copy doesn't satisfy; the fingerprint is the identity.
const MATCH = { ignoreVary: true, ignoreSearch: true }

// Every /_astro/ file the page names: scripts, styles, fonts
const assetsIn = html => [...new Set(html.match(/\/_astro\/[^"'()\s]+/g) ?? [])]

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(SHELL)
      const page = await cache.match('/', MATCH)
      if (page) await cache.addAll(assetsIn(await page.text())).catch(() => undefined)
      await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter(key => key.startsWith('randsum-app-') && key !== CACHE)
          .map(key => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

// The page sends what it loaded before this worker took control
self.addEventListener('message', event => {
  if (event.data?.type !== 'cache' || !Array.isArray(event.data.urls)) return
  const urls = event.data.urls.filter(
    url => new URL(url, self.location.origin).origin === self.location.origin
  )
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache =>
        Promise.all(
          urls.map(url =>
            cache.match(url, MATCH).then(hit => hit ?? cache.add(url).catch(() => undefined))
          )
        )
      )
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request)
          if (response.ok) {
            const cache = await caches.open(CACHE)
            await cache.put('/', response.clone())
          }
          return response
        } catch {
          return (await caches.match('/', MATCH)) ?? Response.error()
        }
      })()
    )
    return
  }

  if (url.pathname.startsWith('/_astro/') || SHELL.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const hit = await caches.match(request, MATCH)
        if (hit) return hit
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE)
          await cache.put(request, response.clone())
        }
        return response
      })()
    )
  }
})
