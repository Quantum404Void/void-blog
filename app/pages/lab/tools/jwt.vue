<script setup lang="ts">
import { jwtDecode } from 'jwt-decode'

interface ParsedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

const { siteName } = useSiteConfig()
useSeoMeta({ title: `JWT 解析器 | ${siteName}` })

const input = shallowRef('')
const error = shallowRef('')
const parsed = shallowRef<ParsedJwt | null>(null)

watch(input, (value) => {
  const token = value.trim()
  error.value = ''
  parsed.value = null
  if (!token) return
  const segments = token.split('.')
  if (segments.length !== 3) {
    error.value = 'JWT 应由 Header、Payload、Signature 三段组成。'
    return
  }
  try {
    parsed.value = {
      header: jwtDecode(token, { header: true }) as Record<string, unknown>,
      payload: jwtDecode(token) as Record<string, unknown>,
      signature: segments[2] ?? '',
    }
  }
  catch (cause) {
    error.value = `解析失败：${cause instanceof Error ? cause.message : 'Token 格式无效'}`
  }
})

function displayValue(value: unknown) {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function formatTimestamp(value: unknown) {
  const timestamp = Number(value)
  if (!Number.isFinite(timestamp)) return '无效时间'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

function isExpired(value: unknown) {
  const timestamp = Number(value)
  return Number.isFinite(timestamp) && Date.now() >= timestamp * 1000
}
</script>

<template>
  <LabLayout title="JWT 解析器" desc="在本地解码 JWT Header 与 Payload。此工具不会验证签名，也不会发送 Token。" accent="var(--color-neon-pink)">
    <section>
      <label for="jwt-input" class="tool-label">JWT Token</label>
      <textarea id="jwt-input" v-model="input" class="tool-field tool-textarea min-h-32" spellcheck="false" placeholder="eyJhbGciOi..." />
      <p class="tool-help mt-2">不要在不可信设备上粘贴仍然有效的生产 Token。</p>
    </section>

    <p v-if="error" class="tool-status mt-5 text-[var(--color-neon-pink)]" role="alert">! {{ error }}</p>

    <div v-if="parsed" class="mt-6 grid gap-5 lg:grid-cols-2">
      <section v-for="section in [{ title: 'Header', data: parsed.header, color: 'var(--color-neon-cyan)' }, { title: 'Payload', data: parsed.payload, color: 'var(--color-neon-green)' }]" :key="section.title" class="tool-panel overflow-hidden p-0">
        <h2 class="border-b border-[var(--color-void-border)] px-4 py-3 font-mono text-sm font-semibold" :style="{ color: section.color }">{{ section.title }}</h2>
        <dl>
          <div v-for="(value, key) in section.data" :key="String(key)" class="grid gap-1 border-b border-[var(--color-void-border)] px-4 py-3 last:border-0 sm:grid-cols-[7rem_1fr]">
            <dt class="font-mono text-xs" :style="{ color: section.color }">{{ key }}</dt>
            <dd class="min-w-0 break-all font-mono text-xs text-[var(--color-text-primary)]">
              {{ displayValue(value) }}
              <span v-if="key === 'exp' || key === 'iat' || key === 'nbf'" class="mt-1 block text-[var(--color-text-muted)]">
                {{ formatTimestamp(value) }}
                <strong v-if="key === 'exp'" :class="isExpired(value) ? 'text-[var(--color-neon-pink)]' : 'text-[var(--color-neon-green)]'"> · {{ isExpired(value) ? '已过期' : '未过期' }}</strong>
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section class="tool-panel lg:col-span-2">
        <h2 class="font-mono text-sm font-semibold text-[var(--color-neon-purple)]">Signature</h2>
        <p class="mt-3 break-all font-mono text-xs text-[var(--color-text-secondary)]">{{ parsed.signature }}</p>
        <p class="tool-help mt-3">仅展示签名片段，未使用密钥验证真实性。</p>
      </section>
    </div>

    <div v-else-if="!input && !error" class="mt-10 border-y border-[var(--color-void-border)] py-12 text-center">
      <p class="font-mono text-sm text-[var(--color-text-muted)]">粘贴 Token 后自动解析</p>
    </div>
  </LabLayout>
</template>
