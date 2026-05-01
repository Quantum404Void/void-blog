/**
 * Cloudflare Worker — Wandbox 代理
 * 部署后地址例如: https://wandbox-proxy.your-subdomain.workers.dev
 *
 * 允许的来源（可按需修改）
 */
const ALLOWED_ORIGINS = [
  'https://quantum505void.github.io',
  'http://localhost:4321',
  'http://localhost:3000',
]

const WANDBOX_BASE = 'https://wandbox.org'

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || ''
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o))

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, isAllowed),
      })
    }

    const url = new URL(request.url)

    // 只代理 /api/* 路径
    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 })
    }

    // 速率限制：同 IP 每分钟最多 20 次
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const rateLimitKey = `rate:${ip}:${Math.floor(Date.now() / 60000)}`
    if (env.RATE_KV) {
      const count = parseInt((await env.RATE_KV.get(rateLimitKey)) || '0')
      if (count >= 20) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, isAllowed) },
        })
      }
      ctx.waitUntil(env.RATE_KV.put(rateLimitKey, String(count + 1), { expirationTtl: 120 }))
    }

    // 转发到 Wandbox
    const targetUrl = WANDBOX_BASE + url.pathname + url.search
    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'User-Agent': 'void-blog-compiler-proxy/1.0',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
    })

    let resp
    try {
      resp = await fetch(proxyReq, { cf: { cacheTtl: 0 } })
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Upstream error: ' + e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, isAllowed) },
      })
    }

    // 转发响应，注入 CORS 头
    const respHeaders = new Headers(resp.headers)
    const ch = corsHeaders(origin, isAllowed)
    for (const [k, v] of Object.entries(ch)) respHeaders.set(k, v)
    // 移除 Wandbox 自带的 CORS 头，用我们的覆盖
    respHeaders.delete('Access-Control-Allow-Origin')
    respHeaders.set('Access-Control-Allow-Origin', isAllowed ? origin : 'null')

    return new Response(resp.body, {
      status: resp.status,
      headers: respHeaders,
    })
  },
}

function corsHeaders(origin, isAllowed) {
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
