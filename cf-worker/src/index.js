/**
 * Cloudflare Worker — Wandbox 编译代理
 * 部署: wrangler deploy
 * 本地测试: wrangler dev
 *
 * 支持语言 (通过 Wandbox API):
 *   C/C++  → compiler: gcc-head-c / gcc-head
 *   Go     → compiler: go-head
 *   Rust   → compiler: rust-head
 *   Java   → compiler: openjdk-head
 *   Python3→ compiler: cpython-head
 */

const ALLOWED_ORIGINS = [
  'https://quantum505void.github.io',
  'http://localhost:4321',
  'http://localhost:3000',
]

const WANDBOX_BASE = 'https://wandbox.org'

/** 编译超时时间（ms），Wandbox 通常 10-20s，留 25s 余量 */
const COMPILE_TIMEOUT_MS = 25000

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || ''
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o))
    const url = new URL(request.url)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, isAllowed),
      })
    }

    // 健康检查
    if (url.pathname === '/health') {
      return json({ ok: true, ts: Date.now() }, 200, origin, isAllowed)
    }

    // 只代理 /api/* 路径
    if (!url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found' }, 404, origin, isAllowed)
    }

    // 速率限制：同 IP 每分钟最多 20 次
    if (env.RATE_KV) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
      const key = `rate:${ip}:${Math.floor(Date.now() / 60000)}`
      const count = parseInt((await env.RATE_KV.get(key)) || '0')
      if (count >= 20) {
        return json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429, origin, isAllowed)
      }
      ctx.waitUntil(env.RATE_KV.put(key, String(count + 1), { expirationTtl: 120 }))
    }

    // POST /api/compile.json → 转发到 Wandbox
    if (request.method === 'POST' && url.pathname === '/api/compile.json') {
      let body
      try {
        body = await request.json()
      } catch {
        return json({ error: 'Invalid JSON body' }, 400, origin, isAllowed)
      }

      // 基本校验
      if (!body.compiler || typeof body.code !== 'string') {
        return json({ error: 'Missing required fields: compiler, code' }, 400, origin, isAllowed)
      }

      // 代码长度限制 64KB
      if (body.code.length > 65536) {
        return json({ error: 'Code too long (max 64KB)' }, 413, origin, isAllowed)
      }

      const targetUrl = WANDBOX_BASE + '/api/compile.json'
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), COMPILE_TIMEOUT_MS)

      let resp
      try {
        resp = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'void-blog-compiler-proxy/2.0',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })
      } catch (e) {
        clearTimeout(timeout)
        const isTimeout = e.name === 'AbortError'
        return json(
          { error: isTimeout ? 'Compile timeout (25s)' : 'Upstream error: ' + e.message },
          isTimeout ? 504 : 502,
          origin,
          isAllowed
        )
      }
      clearTimeout(timeout)

      const data = await resp.json()
      return json(data, resp.status, origin, isAllowed)
    }

    // GET /api/list.json → 获取 Wandbox 支持的编译器列表 (带缓存)
    if (request.method === 'GET' && url.pathname === '/api/list.json') {
      const cacheKey = new Request(WANDBOX_BASE + '/api/list.json', { method: 'GET' })
      const cache = caches.default

      let cached = await cache.match(cacheKey)
      if (cached) {
        const h = new Headers(cached.headers)
        Object.entries(corsHeaders(origin, isAllowed)).forEach(([k, v]) => h.set(k, v))
        return new Response(cached.body, { status: cached.status, headers: h })
      }

      let resp
      try {
        resp = await fetch(WANDBOX_BASE + '/api/list.json', {
          headers: { 'User-Agent': 'void-blog-compiler-proxy/2.0' },
        })
      } catch (e) {
        return json({ error: 'Upstream error: ' + e.message }, 502, origin, isAllowed)
      }

      const body = await resp.text()
      const respToCache = new Response(body, {
        status: resp.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      })
      ctx.waitUntil(cache.put(cacheKey, respToCache.clone()))

      const h = new Headers(respToCache.headers)
      Object.entries(corsHeaders(origin, isAllowed)).forEach(([k, v]) => h.set(k, v))
      return new Response(body, { status: resp.status, headers: h })
    }

    return json({ error: 'Method not allowed' }, 405, origin, isAllowed)
  },
}

function json(data, status, origin, isAllowed) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, isAllowed),
    },
  })
}

function corsHeaders(origin, isAllowed) {
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
