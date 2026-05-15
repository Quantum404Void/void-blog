<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tools', href: '/lab' }, { label: 'number-theory' }]" />
    <div class="max-w-3xl mx-auto px-6 py-10">
      <h1 class="font-mono text-xl font-bold mb-1" style="color:rgba(255,165,0,0.9)">Number Theory</h1>
      <p class="font-mono text-xs text-[var(--color-text-muted)] mb-6">数论工具箱 — 质因数分解、GCD/LCM、质数检测、欧拉函数、快速幂</p>

      <!-- Tab selector -->
      <div class="flex flex-wrap gap-2 mb-7">
        <button v-for="t in tabs" :key="t.id" @click="activeTab=t.id" class="font-mono text-xs px-3 py-1.5 rounded-lg border transition-all"
          :style="activeTab===t.id?'border-color:rgba(255,165,0,0.5);color:rgba(255,165,0,1);background:rgba(255,165,0,0.1)':'border-color:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4)'">
          {{ t.label }}
        </button>
      </div>

      <!-- Factorize -->
      <div v-if="activeTab==='factor'" class="space-y-4">
        <div class="flex gap-3">
          <input v-model.number="factorN" type="number" min="2" max="999999999" placeholder="输入正整数（≤ 10^9）" class="flex-1 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 outline-none text-[var(--color-text-primary)]">
          <button @click="doFactor" class="font-mono text-xs px-4 py-2.5 rounded-lg border border-[rgba(255,165,0,0.4)] text-[rgba(255,165,0,0.9)] hover:bg-[rgba(255,165,0,0.1)] transition-all">分解</button>
        </div>
        <div v-if="factorResult.length" class="border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)]">
          <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">
            {{ factorN }} = {{ factorResult.map(f => f.p === f.count ? String(f.p) : `${f.p}^${f.count}`).join(' × ') }}
          </div>
          <!-- Animation steps -->
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(f, i) in factorResult"
              :key="i"
              class="font-mono text-sm px-3 py-2 rounded-lg border animate-fade-in"
              style="border-color:rgba(255,165,0,0.4);color:rgba(255,165,0,0.9);background:rgba(255,165,0,0.08);animation-delay:var(--delay)"
              :style="`--delay:${i*80}ms`"
            >
              {{ f.p }}<sup v-if="f.count>1" class="text-[10px]">{{ f.count }}</sup>
            </div>
          </div>
          <!-- Divisors -->
          <div class="mt-4 font-mono text-xs text-[var(--color-text-muted)]">
            所有因数（{{ divisors.length }}个）:<br>
            <span class="text-[var(--color-text-primary)]">{{ divisors.join(', ') }}</span>
          </div>
          <div class="mt-2 font-mono text-xs text-[var(--color-text-muted)]">
            欧拉函数 φ({{ factorN }}) = <span style="color:rgba(180,0,255,0.9)">{{ eulerPhi }}</span>
          </div>
        </div>
      </div>

      <!-- GCD/LCM -->
      <div v-if="activeTab==='gcd'" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="gcdA" type="number" placeholder="a" class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 outline-none text-[var(--color-text-primary)]">
          <input v-model.number="gcdB" type="number" placeholder="b" class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 outline-none text-[var(--color-text-primary)]">
        </div>
        <button @click="doGcd" class="font-mono text-xs px-4 py-2.5 rounded-lg border border-[rgba(0,212,255,0.4)] text-[rgba(0,212,255,0.9)] hover:bg-[rgba(0,212,255,0.1)] transition-all">计算</button>
        <div v-if="gcdSteps.length" class="border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)]">
          <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">欧几里得算法步骤:</div>
          <div v-for="(step, i) in gcdSteps" :key="i" class="font-mono text-xs py-1 border-b border-[rgba(255,255,255,0.04)] last:border-0">
            <span class="text-[var(--color-text-muted)]">gcd(</span><span style="color:rgba(0,212,255,0.9)">{{ step.a }}</span><span class="text-[var(--color-text-muted)]">, </span><span style="color:rgba(0,212,255,0.9)">{{ step.b }}</span><span class="text-[var(--color-text-muted)]">) → {{ step.a }} = {{ step.q }} × {{ step.b }} + <span style="color:rgba(255,165,0,0.9)">{{ step.r }}</span></span>
          </div>
          <div class="mt-3 flex gap-6 font-mono text-sm">
            <span>GCD = <span style="color:rgba(57,255,20,0.9)">{{ gcdResult }}</span></span>
            <span>LCM = <span style="color:rgba(180,0,255,0.9)">{{ lcmResult }}</span></span>
          </div>
        </div>
      </div>

      <!-- Prime check -->
      <div v-if="activeTab==='prime'" class="space-y-4">
        <div class="flex gap-3">
          <input v-model.number="primeN" type="number" min="2" placeholder="输入正整数" class="flex-1 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-4 py-2.5 outline-none text-[var(--color-text-primary)]">
          <button @click="doPrime" class="font-mono text-xs px-4 py-2.5 rounded-lg border border-[rgba(57,255,20,0.4)] text-[rgba(57,255,20,0.9)] hover:bg-[rgba(57,255,20,0.1)] transition-all">检测</button>
        </div>
        <div v-if="primeResult !== null" class="border rounded-xl p-5 bg-[var(--color-void-card)]" :style="primeResult?'border-color:rgba(57,255,20,0.4)':'border-color:rgba(255,80,80,0.4)'">
          <div class="font-mono text-lg mb-1" :style="primeResult?'color:rgba(57,255,20,1)':'color:rgba(255,80,80,0.9)'">
            {{ primeN }} {{ primeResult ? '是质数 ✓' : '不是质数 ✗' }}
          </div>
          <div class="font-mono text-xs text-[var(--color-text-muted)]">{{ primeResult ? 'Miller-Rabin 概率测试通过' : '通过因数分解确认为合数' }}</div>
        </div>
      </div>

      <!-- Fast power -->
      <div v-if="activeTab==='pow'" class="space-y-4">
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="font-mono text-[10px] text-[var(--color-text-muted)] mb-1 block">底数 a</label>
            <input v-model.number="powA" type="number" placeholder="a" class="w-full font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2.5 outline-none text-[var(--color-text-primary)]">
          </div>
          <div>
            <label class="font-mono text-[10px] text-[var(--color-text-muted)] mb-1 block">指数 b</label>
            <input v-model.number="powB" type="number" placeholder="b" class="w-full font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2.5 outline-none text-[var(--color-text-primary)]">
          </div>
          <div>
            <label class="font-mono text-[10px] text-[var(--color-text-muted)] mb-1 block">模数 m</label>
            <input v-model.number="powM" type="number" placeholder="m" class="w-full font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg px-3 py-2.5 outline-none text-[var(--color-text-primary)]">
          </div>
        </div>
        <button @click="doPow" class="font-mono text-xs px-4 py-2.5 rounded-lg border border-[rgba(180,0,255,0.4)] text-[rgba(180,0,255,0.9)] hover:bg-[rgba(180,0,255,0.1)] transition-all">计算 a^b mod m</button>
        <div v-if="powResult !== null" class="border border-[var(--color-void-border)] rounded-xl p-5 bg-[var(--color-void-card)]">
          <div class="font-mono text-lg" style="color:rgba(180,0,255,0.9)">{{ powA }}^{{ powB }} mod {{ powM }} = <span style="color:rgba(57,255,20,1)">{{ powResult }}</span></div>
          <div class="font-mono text-xs text-[var(--color-text-muted)] mt-2">使用快速幂算法（二进制展开，O(log b) 次乘法）</div>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="(step, i) in powSteps" :key="i" class="font-mono text-[10px] px-2 py-1 rounded bg-[rgba(255,255,255,0.04)] text-[var(--color-text-muted)]">{{ step }}</span>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Number Theory | ${siteName}` })

const tabs = [
  { id: 'factor', label: '质因数分解' },
  { id: 'gcd',    label: 'GCD / LCM' },
  { id: 'prime',  label: '质数检测' },
  { id: 'pow',    label: '快速幂' },
]
const activeTab = ref('factor')

// --- Factorization ---
const factorN = ref<number>(360)
const factorResult = ref<{p:number,count:number}[]>([])
const divisors = ref<number[]>([])
const eulerPhi = ref(0)

function doFactor() {
  const n = factorN.value
  if (!n || n < 2) return
  const factors: {p:number,count:number}[] = []
  let x = n
  for (let d = 2; d * d <= x; d++) {
    if (x % d === 0) {
      let cnt = 0
      while (x % d === 0) { cnt++; x = Math.floor(x / d) }
      factors.push({ p: d, count: cnt })
    }
  }
  if (x > 1) factors.push({ p: x, count: 1 })
  factorResult.value = factors

  // Divisors
  const divs: number[] = []
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) { divs.push(i); if (i !== n/i) divs.push(n/i) }
  }
  divisors.value = divs.sort((a,b) => a-b)

  // Euler phi
  let phi = n
  for (const f of factors) phi = phi / f.p * (f.p - 1)
  eulerPhi.value = phi
}

// --- GCD/LCM ---
const gcdA = ref<number>(48)
const gcdB = ref<number>(18)
const gcdSteps = ref<{a:number,b:number,q:number,r:number}[]>([])
const gcdResult = ref(0)
const lcmResult = ref(0)

function doGcd() {
  let a = Math.abs(gcdA.value), b = Math.abs(gcdB.value)
  if (!a || !b) return
  const steps: {a:number,b:number,q:number,r:number}[] = []
  while (b) {
    const q = Math.floor(a / b), r = a % b
    steps.push({ a, b, q, r })
    a = b; b = r
  }
  gcdSteps.value = steps
  gcdResult.value = a
  lcmResult.value = Math.abs(gcdA.value * gcdB.value) / a
}

// --- Prime (Miller-Rabin) ---
const primeN = ref<number>(997)
const primeResult = ref<boolean | null>(null)

function mulmod(a: bigint, b: bigint, m: bigint): bigint { return (a * b) % m }
function powmod(base: bigint, exp: bigint, mod: bigint): bigint {
  let r = 1n; base %= mod
  while (exp > 0n) { if (exp & 1n) r = mulmod(r, base, mod); base = mulmod(base, base, mod); exp >>= 1n }
  return r
}
function millerRabin(n: bigint): boolean {
  if (n < 2n) return false
  if (n === 2n || n === 3n || n === 5n || n === 7n) return true
  if (n % 2n === 0n) return false
  let d = n - 1n, r = 0n
  while (d % 2n === 0n) { d /= 2n; r++ }
  for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (a >= n) continue
    let x = powmod(a, d, n)
    if (x === 1n || x === n-1n) continue
    let composite = true
    for (let i = 0n; i < r-1n; i++) {
      x = mulmod(x, x, n)
      if (x === n-1n) { composite = false; break }
    }
    if (composite) return false
  }
  return true
}

function doPrime() {
  if (!primeN.value || primeN.value < 2) return
  primeResult.value = millerRabin(BigInt(primeN.value))
}

// --- Fast power ---
const powA = ref<number>(2)
const powB = ref<number>(10)
const powM = ref<number>(1000)
const powResult = ref<number | null>(null)
const powSteps = ref<string[]>([])

function doPow() {
  let a = BigInt(powA.value ?? 0), b = BigInt(powB.value ?? 0), m = BigInt(powM.value ?? 1)
  if (m === 0n) return
  const steps: string[] = []
  let result = 1n, base = ((a % m) + m) % m, exp = b
  let stepN = 0
  while (exp > 0n) {
    if (exp & 1n) {
      result = (result * base) % m
      steps.push(`bit${stepN}: ×${base}→${result}`)
    }
    base = (base * base) % m
    exp >>= 1n; stepN++
  }
  powResult.value = Number(result)
  powSteps.value = steps
}

// Auto-run defaults
onMounted(() => { doFactor(); doGcd(); doPrime(); doPow() })
</script>

<style scoped>
@keyframes fade-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
.animate-fade-in { animation: fade-in 0.3s ease-out both; animation-delay: var(--delay, 0ms); }
</style>
