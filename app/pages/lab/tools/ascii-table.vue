<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'ascii-table' }]" />
    <div class="max-w-5xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-cyan)] mb-1">📋 ASCII 码表</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">完整 ASCII 字符集，点击查看详情</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-3 mb-6 items-center">
        <input
          v-model="search"
          placeholder="搜索字符/数字/十六进制..."
          class="font-mono text-xs px-3 py-2 rounded-lg border bg-[var(--color-void-card)] text-[var(--color-text-primary)] outline-none flex-1 min-w-48"
          style="border-color:rgba(0,212,255,0.3)"
        />
        <label class="font-mono text-xs text-[var(--color-text-muted)] flex items-center gap-2 cursor-pointer">
          <input type="checkbox" v-model="showExtended" class="accent-[var(--color-neon-cyan)]" />
          显示 Latin-1 (128-255)
        </label>
      </div>

      <!-- Table -->
      <div class="grid gap-1" :class="showExtended ? 'grid-cols-8 sm:grid-cols-12 lg:grid-cols-16' : 'grid-cols-8 sm:grid-cols-12 lg:grid-cols-16'">
        <div
          v-for="code in filteredCodes"
          :key="code"
          @click="selectCode(code)"
          :class="[
            'rounded p-1 cursor-pointer transition-all text-center border font-mono hover:scale-105',
            cellClass(code),
            selected === code ? 'ring-1 ring-[var(--color-neon-cyan)] scale-105' : ''
          ]"
        >
          <div class="text-[9px] opacity-60">{{ code }}</div>
          <div class="text-xs font-bold truncate">{{ displayChar(code) }}</div>
        </div>
      </div>

      <!-- Detail card -->
      <transition name="fade">
        <div v-if="selected !== null" class="mt-6 rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-5">
          <div class="flex items-start justify-between mb-4">
            <div>
              <span class="font-mono text-3xl font-bold text-[var(--color-neon-cyan)]">{{ displayChar(selected) }}</span>
              <span class="font-mono text-sm text-[var(--color-text-muted)] ml-3">{{ charName(selected) }}</span>
            </div>
            <button @click="selected = null" class="font-mono text-xs text-[rgba(255,100,100,0.6)] hover:text-[rgba(255,100,100,1)]">✕ 关闭</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div v-for="item in detailItems(selected)" :key="item.label" class="rounded-lg bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] p-3">
              <div class="font-mono text-[10px] text-[var(--color-text-muted)] mb-1">{{ item.label }}</div>
              <div class="font-mono text-sm text-[var(--color-neon-cyan)] font-bold">{{ item.value }}</div>
              <button @click="copyText(item.value)" class="font-mono text-[9px] text-[rgba(0,212,255,0.5)] hover:text-[var(--color-neon-cyan)] mt-1 transition-colors">复制</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- Legend -->
      <div class="mt-6 flex flex-wrap gap-4 font-mono text-xs text-[var(--color-text-muted)]">
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded inline-block" style="background:rgba(255,50,50,0.15)"></span>控制字符 (0-31, 127)</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded inline-block" style="background:rgba(0,212,255,0.12)"></span>可打印字符 (32-126)</div>
        <div v-if="showExtended" class="flex items-center gap-2"><span class="w-3 h-3 rounded inline-block" style="background:rgba(57,255,20,0.08)"></span>Latin-1 (128-255)</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `ASCII 码表 | ${siteName}` })

const search = ref('')
const showExtended = ref(false)
const selected = ref<number | null>(null)

const controlNames: Record<number, string> = {
  0:'NUL',1:'SOH',2:'STX',3:'ETX',4:'EOT',5:'ENQ',6:'ACK',7:'BEL',
  8:'BS',9:'HT',10:'LF',11:'VT',12:'FF',13:'CR',14:'SO',15:'SI',
  16:'DLE',17:'DC1',18:'DC2',19:'DC3',20:'DC4',21:'NAK',22:'SYN',23:'ETB',
  24:'CAN',25:'EM',26:'SUB',27:'ESC',28:'FS',29:'GS',30:'RS',31:'US',
  127:'DEL'
}

const totalCodes = computed(() => showExtended.value ? 256 : 128)

const filteredCodes = computed(() => {
  const codes = Array.from({ length: totalCodes.value }, (_, i) => i)
  if (!search.value) return codes
  const q = search.value.trim().toLowerCase()
  return codes.filter(c => {
    if (String(c) === q) return true
    if (('0x' + c.toString(16)) === q || c.toString(16) === q) return true
    if (c >= 32 && c !== 127 && String.fromCharCode(c).toLowerCase() === q) return true
    if (controlNames[c]?.toLowerCase().includes(q)) return true
    return false
  })
})

function displayChar(code: number) {
  if (controlNames[code]) return controlNames[code]
  if (code === 32) return 'SP'
  return String.fromCharCode(code)
}

function charName(code: number) {
  if (controlNames[code]) return controlNames[code]
  if (code === 32) return 'Space'
  return String.fromCharCode(code)
}

function cellClass(code: number) {
  if (code <= 31 || code === 127) return 'border-[rgba(255,50,50,0.3)] bg-[rgba(255,50,50,0.08)] text-[rgba(255,120,120,0.9)]'
  if (code <= 126) return 'border-[rgba(0,212,255,0.25)] bg-[rgba(0,212,255,0.06)] text-[var(--color-neon-cyan)]'
  return 'border-[rgba(57,255,20,0.2)] bg-[rgba(57,255,20,0.05)] text-[var(--color-neon-green)]'
}

function detailItems(code: number) {
  const char = code >= 32 && code !== 127 ? String.fromCharCode(code) : ''
  return [
    { label: 'Decimal', value: String(code) },
    { label: 'Hex', value: '0x' + code.toString(16).toUpperCase().padStart(2, '0') },
    { label: 'Octal', value: '0' + code.toString(8) },
    { label: 'Binary', value: code.toString(2).padStart(8, '0') },
    { label: 'HTML Entity', value: char ? `&#${code};` : 'N/A' },
    { label: 'Escape', value: char ? JSON.stringify(char) : `\\x${code.toString(16).padStart(2,'0')}` },
  ]
}

function selectCode(code: number) {
  selected.value = selected.value === code ? null : code
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
