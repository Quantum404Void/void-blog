<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `Base64 工具 | ${siteName}` })

const input = shallowRef('void.dev 你好')
const output = shallowRef('')
const error = shallowRef('')
const { copy, copied } = useClipboard()

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const normalized = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

function encode() {
  error.value = ''
  output.value = bytesToBase64(new TextEncoder().encode(input.value))
}

function decode() {
  try {
    output.value = new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(input.value))
    error.value = ''
  }
  catch {
    output.value = ''
    error.value = '输入不是有效的 Base64 或 UTF-8 文本。'
  }
}

function swap() {
  if (!output.value) return
  const previous = input.value
  input.value = output.value
  output.value = previous
  error.value = ''
}

function clear() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<template>
  <LabLayout title="Base64 编解码" desc="安全处理 UTF-8 文本与 Base64，也兼容 URL-safe Base64。数据不会离开浏览器。">
    <div class="grid gap-6 lg:grid-cols-2">
      <section>
        <label for="base64-input" class="tool-label">输入</label>
        <textarea id="base64-input" v-model="input" class="tool-field tool-textarea min-h-64" spellcheck="false" />
        <div class="tool-toolbar mt-3">
          <button class="tool-button tool-button-primary" @click="encode">编码</button>
          <button class="tool-button tool-button-success" @click="decode">解码</button>
          <button class="tool-button" :disabled="!output" @click="swap">交换</button>
          <button class="tool-button tool-button-danger" @click="clear">清空</button>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between gap-3">
          <label for="base64-output" class="tool-label">输出</label>
          <button class="tool-button px-3" :disabled="!output" @click="copy(output)">{{ copied ? '已复制' : '复制' }}</button>
        </div>
        <textarea id="base64-output" :value="output" readonly class="tool-field tool-textarea min-h-64" placeholder="结果将在这里显示" />
        <p v-if="error" class="tool-status mt-3 text-[var(--color-neon-pink)]" role="alert">! {{ error }}</p>
        <p v-else class="tool-help mt-3">支持中文、Emoji 与多行文本。</p>
      </section>
    </div>
  </LabLayout>
</template>
