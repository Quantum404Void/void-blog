<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'bitwise' }]" />
    <div class="max-w-4xl mx-auto px-6 py-10">
      <p class="font-mono text-[10px] text-[var(--color-text-muted)] tracking-[0.25em] uppercase mb-2">~/lab/tools/bitwise</p>

      <h1 class="font-mono text-xl font-bold mb-1" style="color:rgba(0,212,255,0.9)">Bitwise Calculator</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">32 位整数位运算可视化计算器</p>

      <!-- Signed toggle -->
      <div class="flex gap-2 mb-6">
        <button @click="signed=false" class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all" :style="!signed?'border-color:rgba(0,212,255,0.5);color:rgba(0,212,255,1);background:rgba(0,212,255,0.1)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)'">无符号</button>
        <button @click="signed=true" class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all" :style="signed?'border-color:rgba(0,212,255,0.5);color:rgba(0,212,255,1);background:rgba(0,212,255,0.1)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)'">有符号</button>
      </div>

      <!-- Inputs -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div v-for="(inp, idx) in ['A', 'B']" :key="inp" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)]">
          <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">操作数 <span style="color:rgba(0,212,255,0.9)">{{ inp }}</span></div>
          <div class="flex gap-2 mb-3">
            <button v-for="fmt in ['dec','hex','bin']" :key="fmt" @click="setFmt(idx, fmt)" class="font-mono text-[10px] px-2 py-1 rounded border transition-all" :style="inputFmt[idx]===fmt?'border-color:rgba(0,212,255,0.4);color:rgba(0,212,255,0.9);background:rgba(0,212,255,0.08)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3)'">{{ fmt }}</button>
          </div>
          <input
            v-model="inputStr[idx]"
            @input="parseInput(idx)"
            :placeholder="inputFmt[idx]==='dec'?'十进制':inputFmt[idx]==='hex'?'十六进制(如 0xFF)':'二进制(如 1010)'"
            class="w-full font-mono text-sm bg-[rgba(0,0,0,0.3)] border border-[var(--color-void-border)] rounded-lg px-3 py-2 outline-none text-[var(--color-text-primary)]"
            :style="inputErr[idx]?'border-color:rgba(255,80,80,0.5)':''"
          >
          <div v-if="inputErr[idx]" class="font-mono text-[10px] text-[rgba(255,80,80,0.8)] mt-1">{{ inputErr[idx] }}</div>
          <!-- 32-bit visualization -->
          <div class="mt-3 flex flex-wrap gap-[2px]">
            <span
              v-for="bit in 32"
              :key="bit"
              class="font-mono text-[9px] w-[18px] h-[18px] flex items-center justify-center rounded-sm transition-colors"
              :style="getBit(vals[idx], 32-bit) ? 'background:rgba(0,212,255,0.4);color:rgba(0,212,255,1)' : 'background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.2)'"
            >{{ getBit(vals[idx], 32-bit) ? '1' : '0' }}</span>
          </div>
          <div class="mt-1 font-mono text-[10px] text-[var(--color-text-muted)]">= {{ signed ? toSigned(vals[idx]) : vals[idx] >>> 0 }}</div>
        </div>
      </div>

      <!-- Shift amount -->
      <div class="flex items-center gap-3 mb-6">
        <span class="font-mono text-xs text-[var(--color-text-muted)]">移位量 n:</span>
        <input v-model.number="shiftN" type="number" min="0" max="31" class="font-mono text-sm w-20 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-1.5 outline-none text-[var(--color-text-primary)]">
      </div>

      <!-- Results -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        <div v-for="op in ops" :key="op.name" class="border border-[var(--color-void-border)] rounded-xl p-4 bg-[var(--color-void-card)] hover:border-[rgba(0,212,255,0.3)] transition-colors">
          <div class="font-mono text-[10px] text-[var(--color-text-muted)] mb-1">{{ op.label }}</div>
          <div class="font-mono text-xs mb-2" style="color:rgba(0,212,255,0.9)">{{ formatResult(op.value) }}</div>
          <div class="flex flex-wrap gap-[2px]">
            <span
              v-for="bit in 32"
              :key="bit"
              class="font-mono text-[8px] w-[15px] h-[15px] flex items-center justify-center rounded-sm"
              :style="getBit(op.value, 32-bit) ? 'background:rgba(57,255,20,0.35);color:rgba(57,255,20,1)' : 'background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.15)'"
            >{{ getBit(op.value, 32-bit) ? '1' : '0' }}</span>
          </div>
        </div>
      </div>

      <!-- Tricks cheatsheet -->
      <div class="border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)]">
        <div class="font-mono text-[10px] uppercase tracking-widest text-[rgba(180,0,255,0.7)] mb-4">常用位运算技巧</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="trick in tricks" :key="trick.code" class="bg-[rgba(0,0,0,0.2)] rounded-lg p-3">
            <code class="font-mono text-xs text-[rgba(180,0,255,0.9)] block mb-1">{{ trick.code }}</code>
            <span class="font-mono text-[11px] text-[var(--color-text-muted)]">{{ trick.desc }}</span>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Bitwise Calculator | ${siteName}` })

const signed = ref(false)
const inputStr = ref(['0', '0'])
const inputFmt = ref(['dec', 'dec'])
const inputErr = ref(['', ''])
const vals = ref([0, 0])
const shiftN = ref(1)

function setFmt(idx: number, fmt: string) {
  inputFmt.value[idx] = fmt
  // Re-encode current value in new format
  const v = vals.value[idx] >>> 0
  if (fmt === 'dec') inputStr.value[idx] = String(v)
  else if (fmt === 'hex') inputStr.value[idx] = '0x' + v.toString(16)
  else inputStr.value[idx] = v.toString(2)
  inputErr.value[idx] = ''
}

function parseInput(idx: number) {
  const s = inputStr.value[idx].trim()
  inputErr.value[idx] = ''
  let v: number
  try {
    const fmt = inputFmt.value[idx]
    if (fmt === 'dec') v = parseInt(s, 10)
    else if (fmt === 'hex') v = parseInt(s.replace(/^0x/i, ''), 16)
    else v = parseInt(s, 2)
    if (isNaN(v)) throw new Error('无效')
    vals.value[idx] = v | 0
  } catch {
    inputErr.value[idx] = '格式错误'
  }
}

function getBit(n: number, pos: number): boolean {
  return !!((n >>> pos) & 1)
}

function toSigned(n: number): number {
  return n | 0
}

function formatResult(v: number): string {
  const u = v >>> 0
  return `0x${u.toString(16).padStart(8,'0')} (${signed.value ? (v|0) : u})`
}

const ops = computed(() => {
  const a = vals.value[0], b = vals.value[1], n = Math.max(0, Math.min(31, shiftN.value))
  return [
    { name: 'and', label: 'A AND B', value: a & b },
    { name: 'or',  label: 'A OR B',  value: a | b },
    { name: 'xor', label: 'A XOR B', value: a ^ b },
    { name: 'nota',label: 'NOT A',   value: ~a },
    { name: 'notb',label: 'NOT B',   value: ~b },
    { name: 'shl', label: `A << ${n}`, value: a << n },
    { name: 'shr', label: `A >> ${n}`, value: a >> n },
    { name: 'ushr',label: `A >>> ${n}`,value: a >>> n },
  ]
})

const tricks = [
  { code: 'x & (x-1)', desc: '清除最低位的 1' },
  { code: 'x & (-x)', desc: '提取最低位的 1' },
  { code: 'x | (x-1)', desc: '设置最低位后的所有位' },
  { code: '(x ^ y) >= 0', desc: '判断同号' },
  { code: 'x ^ x', desc: '清零（结果为 0）' },
  { code: 'x >> 31', desc: '符号位扩展（-1 或 0）' },
  { code: '(x + y) >> 1', desc: '两数平均（防溢出）' },
  { code: 'x & 1', desc: '判断奇偶（1=奇，0=偶）' },
  { code: '~x + 1', desc: '取补码（相当于 -x）' },
  { code: 'x & (x-1) === 0', desc: '判断是否为 2 的幂' },
]
</script>
