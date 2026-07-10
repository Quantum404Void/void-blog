<script setup lang="ts">
import * as yaml from 'js-yaml'
import { useClipboard } from '@vueuse/core'

type Direction = 'yaml2json' | 'json2yaml'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `YAML ↔ JSON | ${siteName}` })

const direction = shallowRef<Direction>('yaml2json')
const input = shallowRef('name: void-blog\nfeatures:\n  - Nuxt\n  - Cloudflare\nenabled: true')
const indent = shallowRef(2)
const output = shallowRef('')
const error = shallowRef('')
const { copy, copied } = useClipboard()

function convert() {
  if (!input.value.trim()) { output.value = ''; error.value = ''; return }
  try {
    output.value = direction.value === 'yaml2json'
      ? JSON.stringify(yaml.load(input.value), null, indent.value)
      : yaml.dump(JSON.parse(input.value), { indent: indent.value, lineWidth: -1, noRefs: true })
    error.value = ''
  }
  catch (cause) {
    output.value = ''
    error.value = cause instanceof Error ? cause.message.split('\n')[0] ?? '解析失败' : '解析失败'
  }
}

function swapDirection() {
  if (output.value) input.value = output.value
  direction.value = direction.value === 'yaml2json' ? 'json2yaml' : 'yaml2json'
}

watch([input, indent, direction], convert, { immediate: true })
</script>

<template>
  <LabLayout title="YAML ↔ JSON" desc="双向转换 YAML 与 JSON，并提供明确的语法错误反馈。">
    <div class="tool-toolbar mb-5">
      <button class="tool-button tool-button-primary" @click="swapDirection">{{ direction === 'yaml2json' ? 'YAML → JSON' : 'JSON → YAML' }} · 切换</button>
      <label for="yaml-indent" class="ml-auto font-mono text-xs text-[var(--color-text-secondary)]">缩进</label>
      <select id="yaml-indent" v-model.number="indent" class="tool-field w-24">
        <option :value="2">2</option>
        <option :value="4">4</option>
        <option :value="8">8</option>
      </select>
    </div>

    <div class="grid gap-5 lg:grid-cols-2">
      <section>
        <label for="yaml-input" class="tool-label">{{ direction === 'yaml2json' ? 'YAML 输入' : 'JSON 输入' }}</label>
        <textarea id="yaml-input" v-model="input" class="tool-field tool-textarea min-h-80" spellcheck="false" />
        <p v-if="error" class="tool-status mt-3 text-[var(--color-neon-pink)]" role="alert">! {{ error }}</p>
      </section>
      <section>
        <div class="flex items-center justify-between gap-3">
          <label for="yaml-output" class="tool-label">{{ direction === 'yaml2json' ? 'JSON 输出' : 'YAML 输出' }}</label>
          <button class="tool-button px-3" :disabled="!output" @click="copy(output)">{{ copied ? '已复制' : '复制' }}</button>
        </div>
        <textarea id="yaml-output" :value="output" readonly class="tool-field tool-textarea min-h-80" placeholder="转换结果" />
      </section>
    </div>
  </LabLayout>
</template>
