<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'password-gen' }]" />
    <div class="max-w-2xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold text-[var(--color-neon-green)] mb-1">🔐 密码生成器</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">高熵密码生成，安全可靠</p>

      <!-- Settings -->
      <div class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-5 mb-5">
        <!-- Length -->
        <div class="mb-5">
          <div class="flex justify-between mb-2">
            <label class="font-mono text-xs text-[var(--color-text-muted)]">密码长度</label>
            <span class="font-mono text-sm font-bold text-[var(--color-neon-green)]">{{ length }}</span>
          </div>
          <input type="range" min="4" max="128" v-model.number="length" class="w-full accent-[var(--color-neon-green)]" />
        </div>

        <!-- Charset options -->
        <div class="grid grid-cols-2 gap-2 mb-4">
          <label v-for="opt in charsetOpts" :key="opt.key" class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="opt.enabled" class="accent-[var(--color-neon-green)]" />
            <span class="font-mono text-xs text-[var(--color-text-muted)]">{{ opt.label }}</span>
          </label>
        </div>

        <!-- Custom symbols -->
        <div class="mb-4">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)] block mb-1">自定义符号集</label>
          <input v-model="customSymbols" class="font-mono text-xs px-3 py-2 rounded-lg border bg-[var(--color-void)] text-[var(--color-text-primary)] outline-none w-full" style="border-color:rgba(57,255,20,0.3)" placeholder="!@#$%^&*()" />
        </div>

        <!-- Options row -->
        <div class="flex flex-wrap gap-4 mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="excludeSimilar" class="accent-[var(--color-neon-cyan)]" />
            <span class="font-mono text-xs text-[var(--color-text-muted)]">排除相似字符 (0/O/l/I/1)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="wordBased" class="accent-[var(--color-neon-cyan)]" />
            <span class="font-mono text-xs text-[var(--color-text-muted)]">可记忆词组模式</span>
          </label>
        </div>

        <!-- Count -->
        <div class="flex items-center gap-3">
          <label class="font-mono text-[10px] text-[var(--color-text-muted)]">生成数量</label>
          <input type="range" min="1" max="20" v-model.number="genCount" class="flex-1 accent-[var(--color-neon-green)]" />
          <span class="font-mono text-sm text-[var(--color-neon-green)] w-6 text-right">{{ genCount }}</span>
        </div>
      </div>

      <!-- Generate button -->
      <button @click="generate" class="w-full font-mono text-sm font-bold py-3 rounded-xl border transition-all hover:translate-y-[-1px] mb-5" style="border-color:rgba(57,255,20,0.5);color:#39ff14;background:rgba(57,255,20,0.09)">
        ⚡ 生成密码
      </button>

      <!-- Passwords list -->
      <div v-if="passwords.length" class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] overflow-hidden mb-5">
        <div class="px-4 py-2 border-b border-[var(--color-void-border)] flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
          <span>{{ passwords.length }} 个密码</span>
          <button @click="copyAll" :class="copiedAll ? 'text-[var(--color-neon-green)]' : 'text-[rgba(0,212,255,0.6)]'" class="transition-colors">{{ copiedAll ? '✓ 全部复制' : '批量复制' }}</button>
        </div>
        <div v-for="(pw, i) in passwords" :key="i" class="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-void-border)] last:border-0 hover:bg-[rgba(57,255,20,0.03)] transition-colors">
          <span class="font-mono text-sm text-[var(--color-text-primary)] flex-1 break-all">{{ pw }}</span>
          <button @click="copySingle(i)" class="font-mono text-[10px] shrink-0 transition-colors" :style="copiedIdx === i ? 'color:#39ff14' : 'color:rgba(0,212,255,0.5)'">{{ copiedIdx === i ? '✓' : '复制' }}</button>
        </div>
      </div>

      <!-- Strength (first password) -->
      <div v-if="passwords.length" class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] p-4 mb-5">
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-xs text-[var(--color-text-muted)]">密码强度（首个）</span>
          <span class="font-mono text-xs font-bold" :style="`color:${strengthColor}`">{{ strengthLabel }}</span>
        </div>
        <div class="h-2 rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500" :style="`width:${strengthPct}%;background:${strengthColor}`"></div>
        </div>
        <div class="font-mono text-[10px] text-[var(--color-text-muted)] mt-2">熵值 ≈ {{ entropy }} bits</div>
      </div>

      <!-- History -->
      <div v-if="history.length" class="rounded-xl border border-[var(--color-void-border)] bg-[var(--color-void-card)] overflow-hidden">
        <div class="px-4 py-2 border-b border-[var(--color-void-border)] flex items-center justify-between font-mono text-[10px] text-[var(--color-text-muted)]">
          <span>历史记录（最近 10 个）</span>
          <button @click="history = []" class="text-[rgba(255,100,100,0.5)] hover:text-[rgba(255,100,100,0.9)]">清空</button>
        </div>
        <div v-for="(hw, i) in history" :key="i" class="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-void-border)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
          <span class="font-mono text-xs text-[rgba(255,255,255,0.4)] flex-1 break-all">{{ hw }}</span>
          <button @click="reuseHistory(hw)" class="font-mono text-[10px] text-[rgba(0,212,255,0.4)] hover:text-[var(--color-neon-cyan)] transition-colors shrink-0">使用</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
const { copy: copyToClipboard, copied: copiedSingle } = useClipboard()
const { siteName } = useSiteConfig()
useSeoMeta({ title: `密码生成器 | ${siteName}` })

const length = ref(16)
const genCount = ref(5)
const excludeSimilar = ref(false)
const wordBased = ref(false)
const customSymbols = ref('!@#$%^&*()')
const passwords = ref<string[]>([])
const history = ref<string[]>([])
const copiedIdx = ref<number | null>(null)
const copiedAll = ref(false)

const charsetOpts = reactive([
  { key: 'upper', label: '大写字母 A-Z', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', enabled: true },
  { key: 'lower', label: '小写字母 a-z', chars: 'abcdefghijklmnopqrstuvwxyz', enabled: true },
  { key: 'digits', label: '数字 0-9', chars: '0123456789', enabled: true },
  { key: 'symbols', label: '特殊符号', chars: '', enabled: true },
])

const wordlist = 'apple brave cloud dance eager flame globe happy input judge knife lemon magic noble ocean proud quiet river storm tiger unity valor water xray yield zebra alpha beta core data echo forest grain hero image jump karma light monk nova orbit pixel quest radar solar trace ultra vivid wave xenon youth'.split(' ')

function buildCharset(): string {
  const similar = new Set('0OlI1')
  let chars = ''
  for (const opt of charsetOpts) {
    if (!opt.enabled) continue
    const c = opt.key === 'symbols' ? customSymbols.value : opt.chars
    chars += c
  }
  if (excludeSimilar.value) chars = chars.split('').filter(c => !similar.has(c)).join('')
  return [...new Set(chars.split(''))].join('')
}

function genPassword(): string {
  if (wordBased.value) {
    const words = Array.from({ length: 3 + Math.floor(Math.random() * 2) }, () => wordlist[Math.floor(Math.random() * wordlist.length)])
    return words.join('-') + Math.floor(Math.random() * 100)
  }
  const charset = buildCharset()
  if (!charset) return ''
  const arr = new Uint32Array(length.value)
  crypto.getRandomValues(arr)
  return Array.from(arr, n => charset[n % charset.length]).join('')
}

function generate() {
  const newPws = Array.from({ length: genCount.value }, genPassword)
  passwords.value = newPws
  history.value = [...newPws.slice(0, 1), ...history.value].slice(0, 10)
}

const entropy = computed(() => {
  if (!passwords.value[0]) return 0
  const charset = wordBased.value ? 50000 : buildCharset().length
  return Math.round(Math.log2(charset) * (wordBased.value ? 4 : length.value))
})

const strengthLabel = computed(() => {
  const e = entropy.value
  if (e < 40) return 'Weak'
  if (e < 60) return 'Fair'
  if (e < 80) return 'Strong'
  return 'Very Strong'
})

const strengthColor = computed(() => {
  const e = entropy.value
  if (e < 40) return '#ff3b30'
  if (e < 60) return '#ff9500'
  if (e < 80) return '#00d4ff'
  return '#39ff14'
})

const strengthPct = computed(() => Math.min(100, Math.round(entropy.value / 128 * 100)))

async function copySingle(i: number) {
  await copyToClipboard(passwords.value[i])
  copiedIdx.value = i
  setTimeout(() => copiedIdx.value = null, 2000)
}

async function copyAll() {
  await copyToClipboard(passwords.value.join('\n'))
  copiedAll.value = true
  setTimeout(() => copiedAll.value = false, 2000)
}

function reuseHistory(pw: string) {
  passwords.value = [pw]
}
</script>
