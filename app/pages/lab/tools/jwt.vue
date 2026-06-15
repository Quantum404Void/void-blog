<template>
  <LabLayout title="jwt" desc="解析 JWT 的 Header / Payload / Signature" accent="var(--color-neon-pink)">
    <textarea v-model="input" placeholder="粘贴 JWT token…"
      class="w-full font-mono text-xs rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none focus:border-[rgba(244,112,103,0.4)] transition-colors"
      style="height:90px"
    />

    <div v-if="error" class="mt-4 font-mono text-xs px-4 py-3 rounded-xl border" style="background:rgba(255,0,170,0.07);color:#ff00aa;border-color:rgba(255,0,170,0.25)">
      ❌ {{ error }}
    </div>

    <div v-if="parsed" class="mt-6 grid gap-4">
      <!-- Header -->
      <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
        <div class="px-4 py-2 font-mono text-xs font-bold flex items-center gap-2" style="background:rgba(0,212,255,0.08);color:#00d4ff;border-bottom:1px solid rgba(0,212,255,0.2)">
          <span class="w-2 h-2 rounded-full" style="background:#00d4ff" />HEADER
        </div>
        <table class="w-full font-mono text-xs">
          <tr v-for="(val, key) in parsed.header" :key="String(key)" class="border-b border-[var(--color-void-border)] last:border-0">
            <td class="px-4 py-2 w-1/3" style="color:#00d4ff">{{ key }}</td>
            <td class="px-4 py-2 text-[var(--color-text-primary)] break-all">{{ val }}</td>
          </tr>
        </table>
      </div>
      <!-- Payload -->
      <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
        <div class="px-4 py-2 font-mono text-xs font-bold flex items-center gap-2" style="background:rgba(0,255,136,0.08);color:#00ff88;border-bottom:1px solid rgba(0,255,136,0.2)">
          <span class="w-2 h-2 rounded-full" style="background:#00ff88" />PAYLOAD
        </div>
        <table class="w-full font-mono text-xs">
          <tr v-for="(val, key) in parsed.payload" :key="String(key)" class="border-b border-[var(--color-void-border)] last:border-0">
            <td class="px-4 py-2 w-1/3" style="color:#00ff88">{{ key }}</td>
            <td class="px-4 py-2 text-[var(--color-text-primary)] break-all">
              <template v-if="key === 'exp' || key === 'iat' || key === 'nbf'">
                {{ val }} <span class="ml-2 text-[var(--color-text-muted)]">({{ formatTs(Number(val)) }})</span>
                <span v-if="key === 'exp'" class="ml-2 font-bold" :style="isExpired(Number(val)) ? 'color:#ff00aa' : 'color:#00ff88'">
                  {{ isExpired(Number(val)) ? '已过期' : '未过期' }}
                </span>
              </template>
              <template v-else>{{ val }}</template>
            </td>
          </tr>
        </table>
      </div>
      <div class="rounded-xl border border-[var(--color-void-border)] overflow-hidden">
        <div class="px-4 py-2 font-mono text-xs font-bold flex items-center gap-2" style="background:rgba(180,0,255,0.08);color:#b400ff;border-bottom:1px solid rgba(180,0,255,0.2)">
          <span class="w-2 h-2 rounded-full" style="background:#b400ff" />SIGNATURE
        </div>
        <div class="px-4 py-3 font-mono text-xs break-all" style="color:#b400ff">{{ parsed.signature }}</div>
        <div class="px-4 pb-3 font-mono text-[10px] text-[var(--color-text-muted)]">⚠️ 签名未验证（无密钥）</div>
      </div>
    </div>

    <div v-else-if="!error && !input" class="mt-10 text-center font-mono text-xs text-[var(--color-text-muted)]">
      在上方粘贴 JWT token 即可解析
    </div>
  </LabLayout>
</template>

<script setup lang="ts">
import { jwtDecode } from 'jwt-decode'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `JWT 解析器 | ${siteName}` })

const input = ref('')
const error = ref('')

interface Parsed { header: Record<string, unknown>; payload: Record<string, unknown>; signature: string }
const parsed = computed<Parsed | null>(() => {
  const token = input.value.trim()
  if (!token) { error.value = ''; return null }
  const segs = token.split('.')
  if (segs.length !== 3) { error.value = '无效的 JWT：应包含 3 段'; return null }
  try {
    error.value = ''
    return {
      header: jwtDecode(token, { header: true }) as Record<string, unknown>,
      payload: jwtDecode(token) as Record<string, unknown>,
      signature: segs[2],
    }
  } catch (e: unknown) {
    error.value = '解析失败：' + (e instanceof Error ? e.message : String(e))
    return null
  }
})

function formatTs(ts: number): string {
  return new Date(ts * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
}
function isExpired(ts: number): boolean { return Date.now() / 1000 > ts }
</script>

