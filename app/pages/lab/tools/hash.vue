<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Hash 工具 | ${siteName}` })

const mode = shallowRef<'text' | 'file'>('text')
const input = shallowRef('void.dev')
const selectedAlgorithm = shallowRef<HashAlgorithm>('SHA-256')
const result = shallowRef('')
const error = shallowRef('')
const fileName = shallowRef('')
const fileBuffer = shallowRef<ArrayBuffer | null>(null)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const algorithms: HashAlgorithm[] = ['SHA-256', 'SHA-512', 'SHA-384', 'SHA-1']
const { copy, copied } = useClipboard()
let computeVersion = 0

async function compute() {
  const version = ++computeVersion
  const data = mode.value === 'file' ? fileBuffer.value : new TextEncoder().encode(input.value).buffer
  if (!data || (mode.value === 'text' && !input.value)) {
    result.value = ''
    error.value = ''
    return
  }
  try {
    const digest = await crypto.subtle.digest(selectedAlgorithm.value, data)
    if (version !== computeVersion) return
    result.value = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    error.value = ''
  }
  catch {
    if (version !== computeVersion) return
    result.value = ''
    error.value = '当前浏览器无法计算该摘要。'
  }
}

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  fileName.value = file.name
  fileBuffer.value = await file.arrayBuffer()
  await compute()
}

watch([input, selectedAlgorithm, mode], () => { void compute() }, { immediate: true })
</script>

<template>
  <LabLayout title="Hash 计算" desc="使用浏览器 Web Crypto 计算文本或文件摘要。SHA-1 仅用于兼容检查，不建议用于安全用途。" accent="var(--color-neon-purple)">
    <div class="mb-6 tool-tabs" role="tablist" aria-label="输入类型">
      <button class="tool-tab" role="tab" :aria-selected="mode === 'text'" @click="mode = 'text'">文本</button>
      <button class="tool-tab" role="tab" :aria-selected="mode === 'file'" @click="mode = 'file'">文件</button>
    </div>

    <section class="tool-panel">
      <div v-if="mode === 'text'">
        <label for="hash-input" class="tool-label">文本输入</label>
        <textarea id="hash-input" v-model="input" class="tool-field tool-textarea min-h-40" />
      </div>
      <div v-else>
        <input ref="fileInput" type="file" class="sr-only" @change="onFile">
        <p class="tool-label">文件输入</p>
        <button class="tool-button tool-button-primary w-full sm:w-auto" @click="fileInput?.click()">选择文件</button>
        <p class="tool-help mt-3">{{ fileName || '文件只在本地读取，不会上传。' }}</p>
      </div>

      <fieldset class="mt-6">
        <legend class="tool-label">摘要算法</legend>
        <div class="tool-toolbar">
          <button v-for="algorithm in algorithms" :key="algorithm" class="tool-button" :class="selectedAlgorithm === algorithm ? 'tool-button-primary' : ''" @click="selectedAlgorithm = algorithm">{{ algorithm }}</button>
        </div>
      </fieldset>
    </section>

    <p v-if="error" class="tool-status mt-6 text-[var(--color-neon-pink)]" role="alert">! {{ error }}</p>
    <section v-if="result" class="tool-panel mt-6">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-mono text-sm font-semibold text-[var(--color-text-primary)]">{{ selectedAlgorithm }} 摘要</h2>
        <button class="tool-button px-3" @click="copy(result)">{{ copied ? '已复制' : '复制' }}</button>
      </div>
      <p class="tool-output mt-3 font-mono text-sm text-[var(--color-neon-cyan)]">{{ result }}</p>
    </section>
  </LabLayout>
</template>
