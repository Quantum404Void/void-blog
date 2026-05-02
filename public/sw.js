// void.dev Service Worker
// Inspired by OpenClaw control-ui sw.js — install即接管，cache name带版本

const VERSION = '1.0.0'
const CACHE_NAME = `void-blog-v${VERSION}`

const PRECACHE = [
  '/',
  '/blog/',
  '/tags/',
  '/search/',
  '/offline/',
]

// Install: 预缓存核心页面，立即激活
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()  // 直接接管，不等旧 SW 退出
})

// Activate: 清理旧版本 cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()  // 立即控制所有页面
})

// Fetch: 静态资源 cache-first，页面 network-first
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 只处理同源 GET
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // /assets/ 哈希文件 cache-first（永久缓存）
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            }
            return res
          })
      )
    )
    return
  }

  // HTML 页面 network-first，离线时回落缓存
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    )
    return
  }
})

// 接收版本检查消息（可选，用于调试）
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: VERSION })
  }
})
