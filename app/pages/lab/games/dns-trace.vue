<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'dns-trace' }]" />

    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">DNS 解析追踪</h1>
      <p class="text-[var(--color-text-muted)] mb-6 font-mono text-sm">递归解析可视化 · DNS 记录类型 · TTL 缓存</p>

      <!-- Input -->
      <div class="flex gap-3 mb-6">
        <input
          v-model="domain"
          @keydown.enter="startTrace"
          placeholder="输入域名，如 www.example.com"
          class="flex-1 bg-[var(--color-void-card)] border border-[var(--color-void-border)] font-mono text-sm px-4 py-2 text-[var(--color-text-primary)] outline-none focus:border-[var(--color-neon-cyan)] transition-colors placeholder:text-[var(--color-text-muted)]"
        />
        <button @click="startTrace" :disabled="tracing" class="font-mono text-xs px-4 py-2 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]/10 disabled:opacity-40 transition-all">
          {{ tracing ? '解析中...' : '▶ 开始解析' }}
        </button>
        <button @click="resetTrace" class="font-mono text-xs px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)]/50 transition-all">↺ 重置</button>
        <button
          @click="slowMode = !slowMode"
          :class="['font-mono text-xs px-3 py-2 border transition-all', slowMode ? 'border-yellow-500 text-yellow-400' : 'border-[var(--color-void-border)] text-[var(--color-text-muted)]']"
        >{{ slowMode ? '慢速' : '快速' }}</button>
      </div>

      <!-- Resolution Path -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <!-- Left: Visual path -->
        <div class="lg:col-span-2 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-6">
          <h2 class="font-mono text-xs text-[var(--color-text-muted)] mb-4 uppercase tracking-widest">解析路径</h2>
          <div class="space-y-1">
            <div v-for="(step, i) in steps" :key="i" class="relative">
              <!-- Step node -->
              <div
                :class="['flex items-start gap-3 p-3 rounded transition-all',
                  step.active ? 'bg-[var(--color-neon-cyan)]/5 border border-[var(--color-neon-cyan)]/30' :
                  step.done ? 'opacity-60' : 'opacity-30'
                ]"
              >
                <div :class="['w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-mono rounded-full border',
                  step.active ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] animate-pulse' :
                  step.done ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)]' :
                  'border-[var(--color-void-border)] text-[var(--color-text-muted)]'
                ]">{{ step.done && !step.active ? '✓' : i + 1 }}</div>
                <div class="flex-1">
                  <div class="font-mono text-sm text-[var(--color-text-primary)]">{{ step.name }}</div>
                  <div class="font-mono text-xs text-[var(--color-text-muted)]">{{ step.ip }}</div>
                  <div v-if="step.query" class="mt-1 font-mono text-xs">
                    <span class="text-yellow-400">→ 查询</span>
                    <span class="text-[var(--color-text-muted)] ml-1">{{ step.query }}</span>
                    <span v-if="step.recordType" class="ml-2 px-1 border border-[var(--color-neon-cyan)]/50 text-[var(--color-neon-cyan)] text-xs">{{ step.recordType }}</span>
                  </div>
                  <div v-if="step.response && step.done" class="mt-1 font-mono text-xs">
                    <span class="text-[var(--color-neon-green)]">← 响应</span>
                    <span class="text-[var(--color-text-muted)] ml-1">{{ step.response }}</span>
                  </div>
                </div>
              </div>
              <!-- Connecting arrow -->
              <div v-if="i < steps.length - 1" class="ml-6 pl-3 py-1 border-l border-dashed border-[var(--color-void-border)]">
                <div v-if="step.done" class="font-mono text-xs text-[var(--color-text-muted)] animate-pulse-once">↓</div>
              </div>
            </div>
          </div>

          <!-- Final result -->
          <div v-if="finalResult" class="mt-4 p-3 border border-[var(--color-neon-green)]/50 bg-[var(--color-neon-green)]/5 rounded font-mono text-sm">
            <span class="text-[var(--color-neon-green)]">✓ 解析结果：</span>
            <span class="text-[var(--color-text-primary)] ml-2">{{ domain }} → {{ finalResult }}</span>
          </div>
        </div>

        <!-- Right: Server info & TTL -->
        <div class="space-y-4">
          <!-- Server list -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <h2 class="font-mono text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-widest">真实服务器</h2>
            <div class="space-y-2">
              <div v-for="srv in servers" :key="srv.name" class="font-mono text-xs">
                <div class="text-[var(--color-text-primary)]">{{ srv.name }}</div>
                <div class="text-[var(--color-neon-cyan)]">{{ srv.ip }}</div>
                <div class="text-[var(--color-text-muted)] text-[10px]">{{ srv.desc }}</div>
              </div>
            </div>
          </div>

          <!-- TTL Countdown -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <h2 class="font-mono text-xs text-[var(--color-text-muted)] mb-3 uppercase tracking-widest">TTL 缓存倒计时</h2>
            <div v-if="!finalResult" class="text-[var(--color-text-muted)] font-mono text-xs">解析后开始倒计时</div>
            <div v-else>
              <div class="flex justify-between font-mono text-xs mb-2">
                <span class="text-[var(--color-text-muted)]">TTL</span>
                <span :class="ttlRemaining < 30 ? 'text-red-400 animate-pulse' : 'text-[var(--color-neon-green)]'">{{ ttlRemaining }}s</span>
              </div>
              <div class="w-full bg-[var(--color-void-border)] rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full transition-all duration-1000"
                  :class="ttlRemaining < 30 ? 'bg-red-500' : 'bg-[var(--color-neon-green)]'"
                  :style="{ width: `${(ttlRemaining / ttlTotal) * 100}%` }"
                ></div>
              </div>
              <div class="font-mono text-xs text-[var(--color-text-muted)] mt-2">缓存过期后需重新查询</div>
            </div>
          </div>
        </div>
      </div>

      <!-- DNS Record Types -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-6">
        <h2 class="font-mono text-xs text-[var(--color-text-muted)] mb-4 uppercase tracking-widest">DNS 记录类型</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            v-for="rec in recordTypes"
            :key="rec.type"
            @click="selectedRecord = selectedRecord === rec.type ? null : rec.type"
            :class="['cursor-pointer p-3 border rounded transition-all',
              selectedRecord === rec.type
                ? 'border-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10'
                : 'border-[var(--color-void-border)] hover:border-[var(--color-neon-cyan)]/50'
            ]"
          >
            <div class="font-mono text-sm font-bold" :style="{ color: rec.color }">{{ rec.type }}</div>
            <div class="font-mono text-xs text-[var(--color-text-muted)] mt-1">{{ rec.short }}</div>
          </div>
        </div>
        <!-- Detail panel -->
        <div v-if="selectedRecord" class="mt-4 p-4 border border-[var(--color-neon-cyan)]/30 bg-[var(--color-neon-cyan)]/5 rounded font-mono text-sm">
          <div v-for="rec in recordTypes" :key="rec.type">
            <div v-if="rec.type === selectedRecord">
              <div class="text-[var(--color-neon-cyan)] font-bold mb-2">{{ rec.type }} — {{ rec.name }}</div>
              <div class="text-[var(--color-text-muted)] text-xs mb-2">{{ rec.desc }}</div>
              <div class="text-xs border border-[var(--color-void-border)] p-2 rounded bg-[var(--color-void)]">
                <span class="text-[var(--color-text-muted)]">格式：</span>
                <span class="text-[var(--color-text-primary)]">{{ rec.format }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `DNS Trace | ${siteName}` })
import { ref, onUnmounted } from 'vue'

definePageMeta({ layout: false })

const domain = ref('www.example.com')
const tracing = ref(false)
const slowMode = ref(true)
const finalResult = ref('')
const selectedRecord = ref<string | null>(null)
const ttlRemaining = ref(0)
const ttlTotal = 300

let timers: ReturnType<typeof setTimeout>[] = []
let ttlTimer: ReturnType<typeof setInterval> | null = null

const servers = [
  { name: 'Root NS (a)', ip: '198.41.0.4', desc: 'Verisign root-servers.net' },
  { name: 'Root NS (b)', ip: '199.9.14.201', desc: 'USC-ISI root-servers.net' },
  { name: '.com TLD NS', ip: '192.5.6.30', desc: 'Verisign gtld-servers.net' },
  { name: 'Authoritative', ip: '205.251.196.1', desc: 'AWS Route53' },
]

interface Step {
  name: string
  ip: string
  query: string
  recordType: string
  response: string
  active: boolean
  done: boolean
}

const steps = ref<Step[]>([
  { name: '本地缓存检查', ip: '127.0.0.1', query: domain.value, recordType: 'A', response: '未命中，继续查询', active: false, done: false },
  { name: '递归解析器', ip: '8.8.8.8 (Google DNS)', query: domain.value, recordType: 'A', response: '开始递归查询', active: false, done: false },
  { name: '根域名服务器 (.)', ip: '198.41.0.4', query: '.com NS', recordType: 'NS', response: 'a.gtld-servers.net', active: false, done: false },
  { name: '顶级域服务器 (.com)', ip: '192.5.6.30', query: 'example.com NS', recordType: 'NS', response: 'ns1.example.com', active: false, done: false },
  { name: '权威域名服务器', ip: '205.251.196.1', query: 'www.example.com A', recordType: 'A', response: '93.184.216.34', active: false, done: false },
])

function buildSteps() {
  const d = domain.value || 'www.example.com'
  const parts = d.split('.')
  const tld = parts[parts.length - 1]
  const sld = parts.slice(-2).join('.')
  steps.value = [
    { name: '本地缓存检查', ip: '127.0.0.1', query: d, recordType: 'A', response: '未命中，继续查询', active: false, done: false },
    { name: '递归解析器', ip: '8.8.8.8 (Google DNS)', query: d, recordType: 'A', response: '开始递归查询', active: false, done: false },
    { name: `根域名服务器 (.)`, ip: '198.41.0.4', query: `.${tld} NS`, recordType: 'NS', response: `a.gtld-servers.net`, active: false, done: false },
    { name: `顶级域服务器 (.${tld})`, ip: '192.5.6.30', query: `${sld} NS`, recordType: 'NS', response: `ns1.${sld}`, active: false, done: false },
    { name: '权威域名服务器', ip: '205.251.196.1', query: `${d} A`, recordType: 'A', response: '93.184.216.34', active: false, done: false },
  ]
}

function startTrace() {
  if (tracing.value) return
  resetTrace()
  buildSteps()
  tracing.value = true
  const delay = slowMode.value ? 1200 : 400

  steps.value.forEach((_, i) => {
    const t1 = setTimeout(() => {
      steps.value[i].active = true
    }, delay * i)
    const t2 = setTimeout(() => {
      steps.value[i].active = false
      steps.value[i].done = true
      if (i === steps.value.length - 1) {
        finalResult.value = steps.value[i].response
        tracing.value = false
        startTTL()
      }
    }, delay * i + delay * 0.8)
    timers.push(t1, t2)
  })
}

function startTTL() {
  ttlRemaining.value = ttlTotal
  if (ttlTimer) clearInterval(ttlTimer)
  ttlTimer = setInterval(() => {
    if (ttlRemaining.value > 0) {
      ttlRemaining.value--
    } else {
      clearInterval(ttlTimer!)
    }
  }, 1000)
}

function resetTrace() {
  timers.forEach(clearTimeout)
  timers = []
  if (ttlTimer) clearInterval(ttlTimer)
  tracing.value = false
  finalResult.value = ''
  ttlRemaining.value = 0
  buildSteps()
}

const recordTypes = [
  { type: 'A', short: 'IPv4 地址', name: 'Address Record', color: '#00d4ff', desc: '将域名映射到 IPv4 地址，最常见的记录类型。', format: 'example.com. 300 IN A 93.184.216.34' },
  { type: 'AAAA', short: 'IPv6 地址', name: 'IPv6 Address', color: '#39ff14', desc: '将域名映射到 IPv6 地址。', format: 'example.com. 300 IN AAAA 2606:2800:220:1:248:1893:25c8:1946' },
  { type: 'CNAME', short: '别名', name: 'Canonical Name', color: '#f59e0b', desc: '将一个域名映射到另一个域名（别名）。链末必须是 A/AAAA 记录。', format: 'www.example.com. 300 IN CNAME example.com.' },
  { type: 'MX', short: '邮件服务器', name: 'Mail Exchange', color: '#a78bfa', desc: '指定域名的邮件服务器，带优先级（数值越小优先级越高）。', format: 'example.com. 300 IN MX 10 mail.example.com.' },
  { type: 'TXT', short: '文本记录', name: 'Text Record', color: '#fb7185', desc: '存储任意文本，常用于域名验证（SPF/DKIM/验证码）。', format: 'example.com. 300 IN TXT "v=spf1 include:_spf.google.com ~all"' },
  { type: 'NS', short: '域名服务器', name: 'Name Server', color: '#34d399', desc: '指定域名的权威 DNS 服务器，委托某个 DNS 来管理该域。', format: 'example.com. 86400 IN NS ns1.example.com.' },
]

onUnmounted(() => {
  timers.forEach(clearTimeout)
  if (ttlTimer) clearInterval(ttlTimer)
})
</script>
