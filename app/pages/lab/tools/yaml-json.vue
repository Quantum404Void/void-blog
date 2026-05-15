<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'yaml-json' }]" />
    <div class="max-w-6xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-1">⇄ YAML ↔ JSON 转换器</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">双向实时转换，内置简化 YAML 解析器</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-3 mb-4 items-center">
        <button @click="swapDirection" class="font-mono text-xs px-4 py-2 rounded-lg border transition-all hover:translate-y-[-1px]" style="border-color:rgba(0,212,255,0.4);color:#00d4ff;background:rgba(0,212,255,0.07)">
          {{ direction === 'yaml2json' ? 'YAML → JSON' : 'JSON → YAML' }} ⇄ 切换
        </button>
        <div v-if="direction === 'yaml2json'" class="flex items-center gap-2 ml-auto">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)]">缩进</label>
          <select v-model.number="indent" class="font-mono text-xs px-2 py-1 rounded border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none" style="border-color:rgba(0,212,255,0.3)">
            <option :value="2">2 spaces</option>
            <option :value="4">4 spaces</option>
            <option :value="0">压缩</option>
          </select>
        </div>
        <button @click="loadExample" class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-colors" style="border-color:rgba(57,255,20,0.3);color:#39ff14">示例</button>
      </div>

      <!-- Editors -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Input -->
        <div class="flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-xs font-bold" :style="direction === 'yaml2json' ? 'color:#39ff14' : 'color:#00d4ff'">
              {{ direction === 'yaml2json' ? 'YAML 输入' : 'JSON 输入' }}
            </span>
            <button @click="inputVal = ''" class="font-mono text-[10px] text-[rgba(255,100,100,0.5)] hover:text-[rgba(255,100,100,0.9)]">清空</button>
          </div>
          <textarea
            v-model="inputVal"
            spellcheck="false"
            placeholder="在此粘贴输入..."
            class="flex-1 min-h-80 font-mono text-xs p-4 rounded-xl border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none resize-none leading-relaxed transition-colors"
            :style="hasError ? 'border-color:rgba(255,60,60,0.6)' : `border-color:rgba(${direction==='yaml2json'?'57,255,20':'0,212,255'},0.3)`"
          />
          <div v-if="hasError" class="mt-2 font-mono text-xs text-[rgba(255,80,80,0.9)] bg-[rgba(255,50,50,0.08)] rounded-lg px-3 py-2">
            ⚠ {{ errorMsg }}
          </div>
        </div>

        <!-- Output -->
        <div class="flex flex-col">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-xs font-bold" :style="direction === 'yaml2json' ? 'color:#00d4ff' : 'color:#39ff14'">
              {{ direction === 'yaml2json' ? 'JSON 输出' : 'YAML 输出' }}
            </span>
            <button @click="copyOutput" class="font-mono text-[10px] transition-colors" :style="copied ? 'color:#39ff14' : 'color:rgba(0,212,255,0.6)'">
              {{ copied ? '✓ 已复制' : '复制' }}
            </button>
          </div>
          <div class="flex-1 min-h-80 font-mono text-xs p-4 rounded-xl border bg-[var(--color-void-card)] overflow-auto leading-relaxed"
            :style="`border-color:rgba(${direction==='yaml2json'?'0,212,255':'57,255,20'},0.2);color:var(--color-text-primary)`">
            <pre v-if="outputVal" class="whitespace-pre-wrap text-[var(--color-text-primary)]">{{ outputVal }}</pre>
            <span v-else class="text-[var(--color-text-muted)]">输出将显示在此...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `YAML ↔ JSON 转换器 | ${siteName}` })

const direction = ref<'yaml2json' | 'json2yaml'>('yaml2json')
const inputVal = ref('')
const outputVal = ref('')
const indent = ref(2)
const hasError = ref(false)
const errorMsg = ref('')
const copied = ref(false)
let debounceTimer: any = null

const example = `# 示例配置
name: void-blog
version: "1.0.0"
features:
  - dark-mode
  - neon-theme
  - markdown
database:
  host: localhost
  port: 5432
  ssl: true
  credentials:
    user: admin
    password: null
tags:
  - blog
  - nuxt
  - typescript`

function loadExample() {
  if (direction.value === 'yaml2json') {
    inputVal.value = example
  } else {
    inputVal.value = JSON.stringify({name:'void-blog',version:'1.0.0',features:['dark-mode','neon-theme'],database:{host:'localhost',port:5432,ssl:true}},null,2)
  }
}

// Mini YAML parser
function parseYaml(text: string): any {
  const lines = text.split('\n')
  return parseBlock(lines, 0, 0).value
}

function parseBlock(lines: string[], startIdx: number, baseIndent: number): { value: any; nextIdx: number } {
  const result: any = {}
  const arr: any[] = []
  let isArray = false
  let i = startIdx

  while (i < lines.length) {
    const line = lines[i]
    const stripped = line.trimStart()
    if (!stripped || stripped.startsWith('#')) { i++; continue }
    const indent = line.length - stripped.length
    if (indent < baseIndent) break

    if (stripped.startsWith('- ')) {
      isArray = true
      const rest = stripped.slice(2).trim()
      if (rest) {
        arr.push(parseScalar(rest))
        i++
      } else {
        const sub = parseBlock(lines, i + 1, indent + 2)
        arr.push(sub.value)
        i = sub.nextIdx
      }
    } else if (stripped.includes(': ') || stripped.endsWith(':')) {
      const colonIdx = stripped.indexOf(': ')
      let key: string, valStr: string
      if (colonIdx === -1) {
        key = stripped.slice(0, -1).trim()
        valStr = ''
      } else {
        key = stripped.slice(0, colonIdx).trim()
        valStr = stripped.slice(colonIdx + 2).trim()
      }
      if (valStr === '' || valStr === '|' || valStr === '>') {
        const sub = parseBlock(lines, i + 1, indent + 2)
        result[key] = sub.value
        i = sub.nextIdx
      } else {
        result[key] = parseScalar(valStr)
        i++
      }
    } else {
      i++
    }
  }
  return { value: isArray ? arr : (Object.keys(result).length ? result : null), nextIdx: i }
}

function parseScalar(s: string): any {
  if (s === 'null' || s === '~') return null
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^-?\d+$/.test(s)) return parseInt(s)
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s)
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1)
  return s
}

function jsonToYaml(obj: any, indent = 0): string {
  const pad = ' '.repeat(indent)
  if (obj === null) return 'null'
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj)
  if (typeof obj === 'string') return obj.includes('\n') || /[:#\[\]{}&*!,|>'"@`]/.test(obj) ? JSON.stringify(obj) : obj
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]'
    return obj.map(item => {
      const val = typeof item === 'object' && item !== null ? '\n' + jsonToYaml(item, indent + 2) : ' ' + jsonToYaml(item, indent + 2)
      return pad + '-' + val
    }).join('\n')
  }
  const entries = Object.entries(obj)
  if (entries.length === 0) return '{}'
  return entries.map(([k, v]) => {
    if (typeof v === 'object' && v !== null) {
      return pad + k + ':\n' + jsonToYaml(v, indent + 2)
    }
    return pad + k + ': ' + jsonToYaml(v, indent + 2)
  }).join('\n')
}

function convert() {
  if (!inputVal.value.trim()) { outputVal.value = ''; hasError.value = false; return }
  try {
    if (direction.value === 'yaml2json') {
      const parsed = parseYaml(inputVal.value)
      outputVal.value = indent.value === 0
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, indent.value)
    } else {
      const parsed = JSON.parse(inputVal.value)
      outputVal.value = jsonToYaml(parsed)
    }
    hasError.value = false
  } catch (e: any) {
    hasError.value = true
    errorMsg.value = e.message
    outputVal.value = ''
  }
}

watch([inputVal, indent, direction], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(convert, 300)
})

function swapDirection() {
  if (outputVal.value) {
    inputVal.value = outputVal.value
  }
  direction.value = direction.value === 'yaml2json' ? 'json2yaml' : 'yaml2json'
}

async function copyOutput() {
  if (!outputVal.value) return
  await navigator.clipboard.writeText(outputVal.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>
