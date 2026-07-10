<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `JSON 工具 | ${siteName}` })

const input = shallowRef('{\n  "name": "void.dev",\n  "stack": ["Nuxt", "Vue", "Cloudflare"]\n}')
const message = shallowRef('')
const messageOk = shallowRef(true)
const pathQuery = shallowRef('$.stack[0]')
const pathResult = shallowRef('')
const pathOk = shallowRef(true)

function parseInput() {
  try {
    return { ok: true as const, value: JSON.parse(input.value) }
  }
  catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'JSON 解析失败' }
  }
}

function updateInput(transform: (value: unknown) => string, successMessage: string) {
  const result = parseInput()
  if (!result.ok) {
    message.value = result.error
    messageOk.value = false
    return
  }
  input.value = transform(result.value)
  message.value = successMessage
  messageOk.value = true
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, sortKeys(nested)]))
  }
  return value
}

function format() { updateInput(value => JSON.stringify(value, null, 2), '格式化完成') }
function minify() { updateInput(value => JSON.stringify(value), '压缩完成') }
function sort() { updateInput(value => JSON.stringify(sortKeys(value), null, 2), 'Key 已按字母排序') }
function clear() { input.value = ''; message.value = ''; pathResult.value = '' }

function queryPath(value: unknown, path: string): unknown {
  const keys = path.replace(/^\$\.?/, '').split(/[.\[\]]+/).filter(Boolean)
  let current = value
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function runQuery() {
  const result = parseInput()
  if (!result.ok) {
    pathResult.value = '请先修复 JSON 语法错误'
    pathOk.value = false
    return
  }
  const value = queryPath(result.value, pathQuery.value)
  pathOk.value = value !== undefined
  pathResult.value = value === undefined ? '路径不存在' : JSON.stringify(value, null, 2)
}
</script>

<template>
  <LabLayout title="JSON 工具" desc="格式化、压缩、排序并用简化 JSONPath 提取数据。所有处理都在浏览器本地完成。" accent="var(--color-neon-green)">
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section>
        <label for="json-input" class="tool-label">JSON 输入</label>
        <textarea id="json-input" v-model="input" spellcheck="false" class="tool-field tool-textarea min-h-[22rem]" />
        <div class="mt-3 flex flex-wrap gap-2" aria-label="JSON 操作">
          <button class="tool-button tool-button-success" @click="format">格式化</button>
          <button class="tool-button tool-button-primary" @click="minify">压缩</button>
          <button class="tool-button" @click="sort">排序 Key</button>
          <button class="tool-button tool-button-danger" @click="clear">清空</button>
        </div>
        <div v-if="message" class="tool-status mt-3" :class="messageOk ? 'text-[var(--color-neon-green)]' : 'text-[var(--color-neon-pink)]'" role="status">
          {{ messageOk ? '✓' : '!' }} {{ message }}
        </div>
      </section>

      <aside class="tool-panel h-fit">
        <h2 class="mb-1 font-mono text-sm font-semibold text-[var(--color-text-primary)]">JSONPath 查询</h2>
        <p class="tool-help mb-4">支持点号与数组索引，例如 <code>$.stack[0]</code>。</p>
        <label for="json-path" class="tool-label">查询路径</label>
        <input id="json-path" v-model="pathQuery" class="tool-field" placeholder="$.store.book[0].title">
        <button class="tool-button tool-button-primary mt-3 w-full" @click="runQuery">运行查询</button>
        <pre v-if="pathResult" class="mt-4 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--color-void)] p-3 font-mono text-xs" :class="pathOk ? 'text-[var(--color-neon-cyan)]' : 'text-[var(--color-neon-pink)]'" aria-live="polite">{{ pathResult }}</pre>
      </aside>
    </div>
  </LabLayout>
</template>
