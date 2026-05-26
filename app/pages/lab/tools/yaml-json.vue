<template>
  <LabLayout title="yaml ↔ json" desc="YAML ↔ JSON 互转，支持格式化缩进">
    <!-- 控制栏 -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <button @click="toggleDir"
        class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
        :style="direction==='yaml2json' ? 'border-color:rgba(57,255,20,0.4);color:#39ff14;background:rgba(57,255,20,0.06)' : 'border-color:rgba(0,212,255,0.4);color:#00d4ff;background:rgba(0,212,255,0.06)'">
        {{ direction === 'yaml2json' ? 'YAML → JSON' : 'JSON → YAML' }} ⇄
      </button>
      <label class="font-mono text-[10px] text-[var(--color-text-muted)] flex items-center gap-2">
        缩进
        <select v-model.number="indent" class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded px-2 py-1 text-[var(--color-text-primary)] text-xs">
          <option :value="2">2</option><option :value="4">4</option><option :value="8">8</option>
        </select>
      </label>
      <button @click="loadExample" class="ml-auto font-mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-green)]">示例</button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- 输入 -->
      <div class="flex flex-col gap-1">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
          {{ direction === 'yaml2json' ? 'YAML 输入' : 'JSON 输入' }}
        </div>
        <textarea v-model="inputVal"
          class="w-full h-72 font-mono text-sm rounded-xl border p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none transition-colors"
          :class="hasError ? 'border-[rgba(255,60,60,0.6)]' : 'border-[var(--color-void-border)] focus:border-[rgba(0,212,255,0.4)]'"
          :placeholder="inputPlaceholder"
        />
        <p v-if="hasError" class="font-mono text-[10px] text-red-400">⚠ {{ errorMsg }}</p>
      </div>
      <!-- 输出 -->
      <div class="flex flex-col gap-1">
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest flex items-center justify-between">
          <span>{{ direction === 'yaml2json' ? 'JSON 输出' : 'YAML 输出' }}</span>
          <button v-if="outputVal" @click="copy" class="text-[10px] px-2 py-0.5 rounded border transition-all"
            :class="copied ? 'border-[rgba(0,255,136,0.4)] text-[var(--color-neon-green)]' : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]'">
            {{ copied ? '✓ 已复制' : '复制' }}
          </button>
        </div>
        <textarea :value="outputVal" readonly
          class="w-full h-72 font-mono text-sm rounded-xl border border-[var(--color-void-border)] p-4 resize-none bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none opacity-80"
          placeholder="转换结果…"
        />
      </div>
    </div>
  </LabLayout>
</template>

<script setup lang="ts">
import * as yaml from 'js-yaml'
import { useClipboard } from '@vueuse/core'

const { copy: copyToClipboard, copied } = useClipboard()

const { siteName } = useSiteConfig()
useSeoMeta({ title: `YAML ↔ JSON | ${siteName}` })

const direction = ref<'yaml2json' | 'json2yaml'>('yaml2json')
const inputVal = ref('')
const indent = ref(2)
const hasError = ref(false)
const errorMsg = ref('')

const inputPlaceholder = computed(() =>
  direction.value === 'yaml2json' ? 'key: value\nlist:\n  - item' : '{"key": "value"}'
)

const EXAMPLE_YAML = `name: void-blog\nversion: "1.0.0"\nfeatures:\n  - dark-mode\n  - neon-theme\ndatabase:\n  host: localhost\n  port: 5432\n  ssl: true`

const outputVal = computed(() => {
  if (!inputVal.value.trim()) return ''
  hasError.value = false
  try {
    if (direction.value === 'yaml2json') {
      return JSON.stringify(yaml.load(inputVal.value), null, indent.value)
    } else {
      return yaml.dump(JSON.parse(inputVal.value), { indent: indent.value, lineWidth: -1 })
    }
  } catch (e: any) {
    hasError.value = true
    errorMsg.value = e.message?.split('\n')[0] ?? '解析失败'
    return ''
  }
})

function toggleDir() {
  if (outputVal.value) inputVal.value = outputVal.value
  direction.value = direction.value === 'yaml2json' ? 'json2yaml' : 'yaml2json'
}

function loadExample() {
  inputVal.value = direction.value === 'yaml2json' ? EXAMPLE_YAML
    : JSON.stringify({ name: 'void-blog', version: '1.0.0', features: ['dark-mode', 'neon-theme'], database: { host: 'localhost', port: 5432, ssl: true } }, null, 2)
}

async function copy() {
  await copyToClipboard(outputVal.value)
}
</script>
