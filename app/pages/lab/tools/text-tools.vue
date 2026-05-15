<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'text-tools' }]" />

    <div class="max-w-4xl mx-auto px-6 py-10">
      <h1 class="font-mono text-2xl font-bold mb-2" style="color:#00ff88;text-shadow:0 0 20px rgba(0,255,136,0.5)">文本工具集</h1>
      <p class="font-mono text-xs text-gray-500 mb-8">Text Tools — 统计 / 转换 / 去重 / 排序 / 转义 / 查找替换</p>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 flex-wrap">
        <button v-for="t in tabs" :key="t.key" @click="activeTab=t.key"
          class="font-mono text-xs px-4 py-2 rounded-lg border transition-all"
          :style="activeTab===t.key ? 'border-color:#00ff88;color:#00ff88;background:rgba(0,255,136,0.08)' : 'border-color:rgba(255,255,255,0.12);color:#666'"
        >{{ t.label }}</button>
      </div>

      <!-- Input area -->
      <div v-if="activeTab !== 'findreplace'" class="mb-4">
        <textarea
          v-model="input"
          placeholder="在此输入文本..."
          class="w-full h-40 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y focus:border-green-800 transition-all placeholder-gray-700"
        />
      </div>

      <!-- === STATS === -->
      <div v-if="activeTab==='stats'">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div v-for="s in stats" :key="s.label" class="border border-gray-800 rounded-xl p-4 bg-[#050508]">
            <div class="font-mono text-xs text-gray-500 mb-1">{{ s.label }}</div>
            <div class="font-mono text-xl font-bold" :style="`color:${s.color}`">{{ s.value }}</div>
          </div>
        </div>
        <div class="border border-gray-800 rounded-xl p-4 bg-[#050508] font-mono text-xs text-gray-400">
          预计阅读时间：<span class="text-green-400 font-bold">{{ readTime }}</span>
        </div>
      </div>

      <!-- === CASE === -->
      <div v-if="activeTab==='case'">
        <div class="flex flex-wrap gap-2 mb-4">
          <button v-for="c in caseOps" :key="c.key" @click="applyCase(c.key)"
            class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:border-green-700 hover:text-green-400 transition-all">{{ c.label }}</button>
        </div>
        <div class="relative">
          <textarea v-model="output" readonly class="w-full h-40 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y" />
          <button @click="copyOutput" class="absolute top-3 right-3 font-mono text-[10px] px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-green-400 transition-all">复制</button>
        </div>
      </div>

      <!-- === DEDUP === -->
      <div v-if="activeTab==='dedup'">
        <div class="flex gap-3 mb-4">
          <button @click="applyDedup" class="font-mono text-xs px-4 py-2 rounded border border-green-800 text-green-400 hover:bg-green-900/20 transition-all">去重</button>
          <span class="font-mono text-xs text-gray-500 self-center">保持原顺序，每行去重</span>
        </div>
        <div class="relative">
          <textarea v-model="output" readonly class="w-full h-40 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y" />
          <button @click="copyOutput" class="absolute top-3 right-3 font-mono text-[10px] px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-green-400 transition-all">复制</button>
        </div>
        <div class="font-mono text-xs text-gray-500 mt-2">原 {{ input.split('\n').filter(Boolean).length }} 行 → 去重后 {{ output.split('\n').filter(Boolean).length }} 行</div>
      </div>

      <!-- === SORT === -->
      <div v-if="activeTab==='sort'">
        <div class="flex gap-3 mb-4 flex-wrap">
          <button @click="applySort('asc')" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-700 transition-all">升序 ↑</button>
          <button @click="applySort('desc')" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-green-400 hover:border-green-700 transition-all">降序 ↓</button>
          <button @click="applySort('num-asc')" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-700 transition-all">数字升 ↑</button>
          <button @click="applySort('num-desc')" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-700 transition-all">数字降 ↓</button>
        </div>
        <div class="relative">
          <textarea v-model="output" readonly class="w-full h-40 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y" />
          <button @click="copyOutput" class="absolute top-3 right-3 font-mono text-[10px] px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-green-400 transition-all">复制</button>
        </div>
      </div>

      <!-- === ESCAPE === -->
      <div v-if="activeTab==='escape'">
        <div class="flex flex-wrap gap-2 mb-4">
          <template v-for="e in escapeOps" :key="e.key">
            <button @click="applyEscape(e.key, true)" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-700 transition-all">{{ e.label }} 转义</button>
            <button @click="applyEscape(e.key, false)" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-700 transition-all">{{ e.label }} 反转义</button>
          </template>
        </div>
        <div class="relative">
          <textarea v-model="output" readonly class="w-full h-40 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y" />
          <button @click="copyOutput" class="absolute top-3 right-3 font-mono text-[10px] px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-green-400 transition-all">复制</button>
        </div>
      </div>

      <!-- === FIND/REPLACE === -->
      <div v-if="activeTab==='findreplace'">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label class="font-mono text-xs text-gray-500 block mb-1">查找</label>
            <input v-model="findStr" placeholder="查找..." class="w-full font-mono text-sm bg-[#050508] border border-gray-800 rounded-lg px-4 py-2 text-gray-200 outline-none focus:border-green-800 transition-all" />
          </div>
          <div>
            <label class="font-mono text-xs text-gray-500 block mb-1">替换</label>
            <input v-model="replaceStr" placeholder="替换为..." class="w-full font-mono text-sm bg-[#050508] border border-gray-800 rounded-lg px-4 py-2 text-gray-200 outline-none focus:border-green-800 transition-all" />
          </div>
        </div>
        <div class="flex gap-3 mb-4">
          <label class="font-mono text-xs text-gray-400 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="useRegex" class="accent-green-400" /> 正则
          </label>
          <label class="font-mono text-xs text-gray-400 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="caseSensitive" class="accent-green-400" /> 区分大小写
          </label>
          <button @click="applyFindReplace" class="font-mono text-xs px-4 py-1.5 rounded border border-green-800 text-green-400 hover:bg-green-900/20 transition-all">替换全部</button>
        </div>
        <textarea v-model="findInput" placeholder="在此输入原始文本..." class="w-full h-36 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y focus:border-green-800 transition-all placeholder-gray-700 mb-4" />
        <div class="relative">
          <textarea v-model="output" readonly class="w-full h-36 font-mono text-sm bg-[#050508] border border-gray-800 rounded-xl p-4 text-gray-200 outline-none resize-y" />
          <button @click="copyOutput" class="absolute top-3 right-3 font-mono text-[10px] px-3 py-1 rounded border border-gray-700 text-gray-400 hover:text-green-400 transition-all">复制</button>
        </div>
        <div v-if="replaceCount >= 0" class="font-mono text-xs text-gray-500 mt-2">替换了 {{ replaceCount }} 处</div>
      </div>

      <div v-if="toast" class="fixed bottom-6 right-6 font-mono text-xs px-4 py-2 rounded-lg bg-[#1a1a2e] border border-green-800 text-green-400 shadow-xl">{{ toast }}</div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@vueuse/core'

const { copy: copyToClipboard } = useClipboard()

const { siteName } = useSiteConfig()
useSeoMeta({ title: `文本工具集 | ${siteName}` })

const tabs = [
  { key: 'stats', label: '字数统计' },
  { key: 'case', label: '大小写' },
  { key: 'dedup', label: '去重' },
  { key: 'sort', label: '排序' },
  { key: 'escape', label: '转义' },
  { key: 'findreplace', label: '查找替换' },
]

const activeTab = ref('stats')
const input = ref('')
const output = ref('')
const findInput = ref('')
const findStr = ref('')
const replaceStr = ref('')
const useRegex = ref(false)
const caseSensitive = ref(false)
const replaceCount = ref(-1)
const toast = ref('')

// ---- Stats ----

const stats = computed(() => {
  const t = input.value
  const chars = t.length
  const charsNoSpace = t.replace(/\s/g, '').length
  const lines = t ? t.split('\n').length : 0
  const paras = t.split(/\n\s*\n/).filter(Boolean).length
  const zhChars = (t.match(/[\u4e00-\u9fff]/g) || []).length
  const enWords = (t.match(/\b[a-zA-Z]+\b/g) || []).length
  return [
    { label: '字符数', value: chars, color: '#00ff88' },
    { label: '非空字符', value: charsNoSpace, color: '#00d4ff' },
    { label: '行数', value: lines, color: '#b400ff' },
    { label: '段落数', value: paras, color: '#ff2d78' },
    { label: '中文字', value: zhChars, color: '#ffaa00' },
    { label: '英文词', value: enWords, color: '#00ff88' },
    { label: '总词数', value: zhChars + enWords, color: '#00d4ff' },
  ]
})

const readTime = computed(() => {
  const total = stats.value.find(s => s.label === '总词数')?.value as number || 0
  const mins = Math.max(1, Math.ceil(total / 300))
  return `约 ${mins} 分钟`
})

// ---- Case ----

const caseOps = [
  { key: 'upper', label: 'UPPERCASE' },
  { key: 'lower', label: 'lowercase' },
  { key: 'title', label: 'Title Case' },
  { key: 'camel', label: 'camelCase' },
  { key: 'snake', label: 'snake_case' },
  { key: 'kebab', label: 'kebab-case' },
  { key: 'pascal', label: 'PascalCase' },
]

function applyCase(key: string) {
  const t = input.value
  if (key === 'upper') output.value = t.toUpperCase()
  else if (key === 'lower') output.value = t.toLowerCase()
  else if (key === 'title') output.value = t.replace(/\b\w/g, c => c.toUpperCase())
  else if (key === 'camel') output.value = t.toLowerCase().replace(/[\s_-]+(\w)/g, (_, c) => c.toUpperCase())
  else if (key === 'snake') output.value = t.replace(/\s+/g, '_').replace(/([a-z])([A-Z])/g, '$1_$2').replace(/-/g, '_').toLowerCase()
  else if (key === 'kebab') output.value = t.replace(/\s+/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').replace(/_/g, '-').toLowerCase()
  else if (key === 'pascal') {
    const camel = t.toLowerCase().replace(/[\s_-]+(\w)/g, (_, c) => c.toUpperCase())
    output.value = camel.charAt(0).toUpperCase() + camel.slice(1)
  }
}

// ---- Dedup ----

function applyDedup() {
  const lines = input.value.split('\n')
  const seen = new Set<string>()
  output.value = lines.filter(l => {
    if (seen.has(l)) return false
    seen.add(l)
    return true
  }).join('\n')
}

// ---- Sort ----

function applySort(mode: string) {
  const lines = input.value.split('\n')
  if (mode === 'asc') lines.sort((a, b) => a.localeCompare(b))
  else if (mode === 'desc') lines.sort((a, b) => b.localeCompare(a))
  else if (mode === 'num-asc') lines.sort((a, b) => parseFloat(a) - parseFloat(b))
  else if (mode === 'num-desc') lines.sort((a, b) => parseFloat(b) - parseFloat(a))
  output.value = lines.join('\n')
}

// ---- Escape ----

const escapeOps = [
  { key: 'html', label: 'HTML' },
  { key: 'json', label: 'JSON' },
  { key: 'url', label: 'URL' },
]

function applyEscape(key: string, encode: boolean) {
  const t = input.value
  if (key === 'html') {
    if (encode) output.value = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')
    else output.value = t.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'")
  } else if (key === 'json') {
    if (encode) output.value = JSON.stringify(t).slice(1, -1)
    else {
      try { output.value = JSON.parse('"' + t + '"') } catch { output.value = t }
    }
  } else if (key === 'url') {
    if (encode) output.value = encodeURIComponent(t)
    else output.value = decodeURIComponent(t)
  }
}

// ---- Find/Replace ----

function applyFindReplace() {
  const t = findInput.value
  if (!findStr.value) { output.value = t; replaceCount.value = 0; return }
  try {
    const flags = 'g' + (caseSensitive.value ? '' : 'i')
    const pattern = useRegex.value ? new RegExp(findStr.value, flags) : new RegExp(findStr.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    let count = 0
    output.value = t.replace(pattern, (m) => { count++; return replaceStr.value })
    replaceCount.value = count
  } catch (e) {
    output.value = '正则表达式错误'
    replaceCount.value = -1
  }
}

// ---- Clipboard ----

async function copyOutput() {
  await copyToClipboard(output.value)
  toast.value = '已复制'
  setTimeout(() => toast.value = '', 2000)
}
</script>
