<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `URL 工具 | ${siteName}` })

const input = shallowRef('https://void.dev/blog?tag=Nuxt&lang=zh-CN#content')
const output = shallowRef('')
const error = shallowRef('')
const parsed = shallowRef<Array<{ label: string; value: string }>>([])
const { copy, copied } = useClipboard()

function setOutput(value: string) {
  output.value = value
  parsed.value = []
  error.value = ''
}

function encode() { setOutput(encodeURIComponent(input.value)) }

function decode() {
  try { setOutput(decodeURIComponent(input.value)) }
  catch { output.value = ''; parsed.value = []; error.value = '存在无效的百分号编码。' }
}

function parseUrl() {
  try {
    const url = new URL(input.value.trim())
    const rows = [
      { label: '协议', value: url.protocol },
      { label: '主机', value: url.host },
      { label: '路径', value: url.pathname || '/' },
      { label: '查询', value: url.search || '—' },
      { label: '锚点', value: url.hash || '—' },
      ...Array.from(url.searchParams.entries(), ([key, value]) => ({ label: `参数 · ${key}`, value })),
    ]
    parsed.value = rows
    output.value = url.href
    error.value = ''
  }
  catch { parsed.value = []; output.value = ''; error.value = '请输入包含协议的完整 URL，例如 https://void.dev。' }
}

function clear() { input.value = ''; output.value = ''; parsed.value = []; error.value = '' }
</script>

<template>
  <LabLayout title="URL 工具" desc="编解码 URL 组件，并检查协议、主机、路径、查询参数与锚点。" accent="var(--color-neon-purple)">
    <section class="tool-panel">
      <label for="url-input" class="tool-label">URL 或文本</label>
      <textarea id="url-input" v-model="input" class="tool-field tool-textarea min-h-32" spellcheck="false" />
      <div class="tool-toolbar mt-3">
        <button class="tool-button tool-button-primary" @click="encode">编码组件</button>
        <button class="tool-button tool-button-success" @click="decode">解码组件</button>
        <button class="tool-button" @click="parseUrl">解析 URL</button>
        <button class="tool-button tool-button-danger" @click="clear">清空</button>
      </div>
    </section>

    <p v-if="error" class="tool-status mt-6 text-[var(--color-neon-pink)]" role="alert">! {{ error }}</p>

    <section v-if="output" class="tool-panel mt-6">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-mono text-sm font-semibold text-[var(--color-text-primary)]">结果</h2>
        <button class="tool-button px-3" @click="copy(output)">{{ copied ? '已复制' : '复制' }}</button>
      </div>
      <p class="tool-output mt-3 font-mono text-sm text-[var(--color-neon-cyan)]">{{ output }}</p>
    </section>

    <section v-if="parsed.length" class="mt-6 overflow-hidden rounded-xl border border-[var(--color-void-border)]">
      <dl>
        <div v-for="row in parsed" :key="`${row.label}-${row.value}`" class="grid gap-1 border-b border-[var(--color-void-border)] px-4 py-3 last:border-0 sm:grid-cols-[8rem_1fr]">
          <dt class="font-mono text-xs text-[var(--color-text-muted)]">{{ row.label }}</dt>
          <dd class="break-all font-mono text-sm text-[var(--color-text-primary)]">{{ row.value }}</dd>
        </div>
      </dl>
    </section>
  </LabLayout>
</template>
