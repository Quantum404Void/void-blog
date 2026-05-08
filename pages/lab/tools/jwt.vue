<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'jwt' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold mb-1" style="color:#f47067">🔑 JWT 解析器</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">解析 JWT 的 Header / Payload / Signature</p>

      <textarea
        v-model="input"
        placeholder="粘贴 JWT token…"
        class="w-full font-mono text-xs rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none"
        style="height:100px"
        @input="parse"
      ></textarea>

      <div v-if="error" class="mt-4 font-mono text-xs px-4 py-3 rounded-xl border" style="background:rgba(255,0,170,0.08);color:#ff00aa;border-color:rgba(255,0,170,0.3)">
        ❌ {{ error }}
      </div>

      <div v-if="parts" class="mt-6 grid gap-5">
        <!-- Header -->
        <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
          <div class="px-4 py-2 font-mono text-xs font-bold flex items-center gap-2" style="background:rgba(0,212,255,0.08);color:#00d4ff;border-bottom:1px solid rgba(0,212,255,0.2)">
            <span class="w-2 h-2 rounded-full inline-block" style="background:#00d4ff"></span>HEADER
          </div>
          <table class="w-full font-mono text-xs">
            <tr v-for="(val, key) in parts.header" :key="String(key)" class="border-b border-[var(--color-void-border)] last:border-0">
              <td class="px-4 py-2 w-1/3" style="color:#00d4ff">{{ key }}</td>
              <td class="px-4 py-2 text-[var(--color-text-primary)] break-all">{{ val }}</td>
            </tr>
          </table>
        </div>

        <!-- Payload -->
        <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
          <div class="px-4 py-2 font-mono text-xs font-bold flex items-center gap-2" style="background:rgba(0,255,136,0.08);color:#00ff88;border-bottom:1px solid rgba(0,255,136,0.2)">
            <span class="w-2 h-2 rounded-full inline-block" style="background:#00ff88"></span>PAYLOAD
          </div>
          <table class="w-full font-mono text-xs">
            <tr v-for="(val, key) in parts.payload" :key="String(key)" class="border-b border-[var(--color-void-border)] last:border-0">
              <td class="px-4 py-2 w-1/3" style="color:#00ff88">{{ key }}</td>
              <td class="px-4 py-2 text-[var(--color-text-primary)] break-all">
                <template v-if="key === 'exp' || key === 'iat' || key === 'nbf'">
                  {{ val }}
                  <span class="ml-2 text-[var(--color-text-muted)]">({{ formatTs(Number(val)) }})</span>
                  <span v-if="key === 'exp'" class="ml-2 font-bold" :style="isExpired(Number(val)) ? 'color:#ff00aa' : 'color:#00ff88'">
                    {{ isExpired(Number(val)) ? '已过期' : '未过期' }}
                  </span>
                </template>
                <template v-else>{{ val }}</template>
              </td>
            </tr>
          </table>
        </div>

        <!-- Signature -->
        <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
          <div class="px-4 py-2 font-mono text-xs font-bold flex items-center gap-2" style="background:rgba(180,0,255,0.08);color:#b400ff;border-bottom:1px solid rgba(180,0,255,0.2)">
            <span class="w-2 h-2 rounded-full inline-block" style="background:#b400ff"></span>SIGNATURE
          </div>
          <div class="px-4 py-3 font-mono text-xs break-all" style="color:#b400ff">
            {{ parts.signature }}
          </div>
          <div class="px-4 pb-3 font-mono text-[10px] text-[var(--color-text-muted)]">⚠️ 签名未验证（无密钥）</div>
        </div>
      </div>

      <div v-if="!parts && !error && !input" class="mt-10 text-center font-mono text-xs text-[var(--color-text-muted)]">
        在上方粘贴 JWT token 即可解析
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `JWT 解析器 | ${siteName}` })

const input = ref('')
const error = ref('')
const parts = ref<{ header: Record<string, unknown>; payload: Record<string, unknown>; signature: string } | null>(null)

function b64decode(str: string): string {
  // Base64url → Base64
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? b64 + '='.repeat(4 - b64.length % 4) : b64
  return decodeURIComponent(
    Array.from(atob(pad))
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
}

function parse() {
  const token = input.value.trim()
  if (!token) { parts.value = null; error.value = ''; return }
  const segments = token.split('.')
  if (segments.length !== 3) { error.value = '无效的 JWT：应包含 3 段（header.payload.signature）'; parts.value = null; return }
  try {
    const header = JSON.parse(b64decode(segments[0]))
    const payload = JSON.parse(b64decode(segments[1]))
    parts.value = { header, payload, signature: segments[2] }
    error.value = ''
  } catch (e: unknown) {
    error.value = '解析失败：' + (e instanceof Error ? e.message : String(e))
    parts.value = null
  }
}

function formatTs(ts: number): string {
  if (!ts || ts < 0) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}

function isExpired(ts: number): boolean {
  return Date.now() / 1000 > ts
}
</script>
