// void.dev Service Worker
// Based on OpenClaw Control UI pattern — app-shell cache + network-first for pages.

const CACHE_NAME = 'void-blog-v1'

// Minimal app-shell precache.
const PRECACHE_URLS = ['/']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and cross-origin.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // Skip API routes — never cache dynamic data.
  if (url.pathname.startsWith('/api/')) return

  // Cache-first for hashed assets.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return res
          })
      )
    )
    return
  }

  // Network-first for everything else (HTML pages).
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone()
          void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
