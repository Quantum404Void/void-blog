<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'http-compare' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">HTTP/1.1 vs HTTP/2 vs HTTP/3</h1>
      <p class="text-[var(--color-text-muted)] mb-6 font-mono text-sm">请求瀑布图 · 多路复用 · QUIC · 丢包模拟</p>

      <!-- Controls -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 mb-6">
        <div class="flex flex-wrap gap-6 items-center">
          <div class="flex items-center gap-2 font-mono text-xs">
            <span class="text-[var(--color-text-muted)]">并发请求数：</span>
            <input type="range" min="1" max="20" v-model.number="requestCount" class="w-24 accent-[var(--color-neon-cyan)]" />
            <span class="text-[var(--color-neon-cyan)] w-4">{{ requestCount }}</span>
          </div>
          <div class="flex items-center gap-2 font-mono text-xs">
            <span class="text-[var(--color-text-muted)]">丢包率：</span>
            <input type="range" min="0" max="30" v-model.number="packetLoss" class="w-24 accent-[var(--color-neon-cyan)]" />
            <span class="text-[var(--color-neon-cyan)] w-8">{{ packetLoss }}%</span>
          </div>
          <div class="flex gap-2 ml-auto">
            <button @click="simulate" :disabled="running" class="font-mono text-xs px-4 py-2 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]/10 disabled:opacity-40 transition-all">
              {{ running ? '模拟中...' : '▶ 开始模拟' }}
            </button>
            <button @click="simulateLoss" :disabled="running" class="font-mono text-xs px-4 py-2 border border-red-500 text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all">
              📦 模拟丢包
            </button>
            <button @click="reset" class="font-mono text-xs px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)]/50 transition-all">↺ 重置</button>
          </div>
        </div>
      </div>

      <!-- Waterfall grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div v-for="proto in protocols" :key="proto.name" class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg overflow-hidden">
          <!-- Header -->
          <div class="px-4 py-3 border-b border-[var(--color-void-border)]" :style="{ borderColor: proto.color + '40' }">
            <div class="font-mono text-sm font-bold" :style="{ color: proto.color }">{{ proto.name }}</div>
            <div class="font-mono text-xs text-[var(--color-text-muted)] mt-0.5">{{ proto.tagline }}</div>
          </div>

          <!-- Stats -->
          <div class="px-4 py-2 border-b border-[var(--color-void-border)] flex gap-4 font-mono text-xs">
            <div>
              <span class="text-[var(--color-text-muted)]">总耗时 </span>
              <span :style="{ color: proto.color }">{{ proto.totalTime > 0 ? proto.totalTime + 'ms' : '--' }}</span>
            </div>
            <div>
              <span class="text-[var(--color-text-muted)]">请求数 </span>
              <span class="text-[var(--color-text-primary)]">{{ requestCount }}</span>
            </div>
            <div v-if="proto.lostPackets > 0">
              <span class="text-[var(--color-text-muted)]">丢包 </span>
              <span class="text-red-400">{{ proto.lostPackets }}</span>
            </div>
          </div>

          <!-- Waterfall -->
          <div class="p-4 relative" style="min-height: 280px;">
            <div class="relative" :style="{ height: requestCount * 22 + 'px' }">
              <!-- Time axis -->
              <div v-if="proto.totalTime > 0" class="absolute right-0 top-0 bottom-0 flex flex-col justify-between font-mono text-[10px] text-[var(--color-text-muted)] pr-1">
                <span>0</span>
                <span>{{ Math.round(proto.totalTime / 2) }}</span>
                <span>{{ proto.totalTime }}ms</span>
              </div>

              <!-- Bars -->
              <div
                v-for="(req, i) in proto.requests"
                :key="i"
                class="absolute h-4 flex items-center"
                :style="{
                  top: `${i * 22}px`,
                  left: `${req.startPct}%`,
                  width: `${req.widthPct}%`,
                  minWidth: '4px',
                  backgroundColor: req.color + (req.lost ? '40' : 'cc'),
                  borderLeft: `2px solid ${req.color}`,
                  transition: 'width 0.5s, left 0.5s',
                }"
              >
                <span v-if="req.lost" class="font-mono text-[10px] text-red-400 ml-1 whitespace-nowrap">✗</span>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="proto.requests.length === 0" class="absolute inset-0 flex items-center justify-center font-mono text-xs text-[var(--color-text-muted)]">
              点击「开始模拟」
            </div>
          </div>

          <!-- Legend -->
          <div class="px-4 pb-3 flex flex-wrap gap-2">
            <span v-for="rt in resourceTypes" :key="rt.label" class="flex items-center gap-1 font-mono text-[10px]">
              <span class="w-3 h-2 rounded-sm" :style="{ background: rt.color }"></span>
              <span class="text-[var(--color-text-muted)]">{{ rt.label }}</span>
            </span>
          </div>

          <!-- Protocol notes -->
          <div class="px-4 pb-4">
            <div v-if="packetLoss > 0 && simulated" class="font-mono text-xs p-2 border rounded" :style="{ borderColor: proto.color + '40', backgroundColor: proto.color + '08' }">
              <span :style="{ color: proto.color }">丢包影响：</span>
              <span class="text-[var(--color-text-muted)]">{{ proto.lossNote }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature comparison table -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--color-void-border)]">
          <h2 class="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">协议特性对比</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full font-mono text-xs">
            <thead>
              <tr class="border-b border-[var(--color-void-border)]">
                <th class="text-left px-4 py-2 text-[var(--color-text-muted)]">特性</th>
                <th v-for="p in protocols" :key="p.name" class="px-4 py-2 text-center" :style="{ color: p.color }">{{ p.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="feat in features" :key="feat.name" class="border-b border-[var(--color-void-border)]/50 hover:bg-white/2">
                <td class="px-4 py-2 text-[var(--color-text-muted)]">{{ feat.name }}</td>
                <td v-for="(val, i) in feat.values" :key="i" class="px-4 py-2 text-center">
                  <span :class="val === '✓' ? 'text-[var(--color-neon-green)]' : val === '✗' ? 'text-red-400' : 'text-[var(--color-text-primary)]'">{{ val }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `HTTP Compare | ${siteName}` })
import { ref, reactive } from 'vue'

definePageMeta({ layout: false })

const requestCount = ref(8)
const packetLoss = ref(0)
const running = ref(false)
const simulated = ref(false)

const resourceTypes = [
  { label: 'HTML', color: '#00d4ff' },
  { label: 'CSS', color: '#39ff14' },
  { label: 'JS', color: '#f59e0b' },
  { label: '图片', color: '#a78bfa' },
]

function getResourceColor(i: number) {
  return resourceTypes[i % resourceTypes.length].color
}

interface Request {
  startPct: number
  widthPct: number
  color: string
  lost: boolean
}

interface Protocol {
  name: string
  tagline: string
  color: string
  requests: Request[]
  totalTime: number
  lostPackets: number
  lossNote: string
}

const protocols = reactive<Protocol[]>([
  {
    name: 'HTTP/1.1',
    tagline: '串行队头阻塞',
    color: '#f59e0b',
    requests: [],
    totalTime: 0,
    lostPackets: 0,
    lossNote: '所有请求串行，单次丢包阻塞整个队列',
  },
  {
    name: 'HTTP/2',
    tagline: '多路复用 · 帧交错',
    color: '#00d4ff',
    requests: [],
    totalTime: 0,
    lostPackets: 0,
    lossNote: 'TCP 层丢包影响所有流（队头阻塞在 TCP 层仍存在）',
  },
  {
    name: 'HTTP/3',
    tagline: 'QUIC · 无队头阻塞',
    color: '#39ff14',
    requests: [],
    totalTime: 0,
    lostPackets: 0,
    lossNote: 'QUIC 流独立，丢包只延迟单个流，其余流不受影响',
  },
])

function buildH1(n: number, lossRate: number) {
  // Serial: each request starts after previous ends
  const baseW = 8 // base width % per request (of 100%)
  const total = n * baseW
  const scale = Math.min(1, 100 / total)
  const w = baseW * scale
  let requests: Request[] = []
  let cur = 0
  let lost = 0
  for (let i = 0; i < n; i++) {
    const isLost = Math.random() * 100 < lossRate
    if (isLost) { lost++; cur += w * 2 } // retransmit doubles this req time
    requests.push({ startPct: cur, widthPct: w, color: getResourceColor(i), lost: isLost })
    cur += w
  }
  return { requests, totalTime: Math.round(cur * 20 + 50), lostPackets: lost }
}

function buildH2(n: number, lossRate: number) {
  // Parallel (multiplexed), but TCP loss stalls all streams together
  const w = 40 + Math.random() * 20
  let requests: Request[] = []
  let maxEnd = 0
  let lost = 0
  for (let i = 0; i < n; i++) {
    const start = Math.random() * 5
    const isLost = Math.random() * 100 < lossRate
    const extra = isLost ? 15 : 0
    if (isLost) lost++
    const width = w / n * (6 + Math.random() * 4) + extra
    const end = start + width
    if (end > maxEnd) maxEnd = end
    requests.push({ startPct: start, widthPct: width, color: getResourceColor(i), lost: isLost })
  }
  // normalize to 90%
  const scale = 90 / maxEnd
  requests = requests.map(r => ({ ...r, startPct: r.startPct * scale, widthPct: r.widthPct * scale }))
  return { requests, totalTime: Math.round(maxEnd * 8 + 80), lostPackets: lost }
}

function buildH3(n: number, lossRate: number) {
  // QUIC: fully parallel, each stream independent — loss only delays that stream
  let requests: Request[] = []
  let maxEnd = 0
  let lost = 0
  for (let i = 0; i < n; i++) {
    const start = Math.random() * 3
    const isLost = Math.random() * 100 < lossRate
    if (isLost) lost++
    const width = 20 + Math.random() * 15 + (isLost ? 12 : 0)
    const end = start + width
    if (end > maxEnd) maxEnd = end
    requests.push({ startPct: start, widthPct: width, color: getResourceColor(i), lost: isLost })
  }
  const scale = 90 / maxEnd
  requests = requests.map(r => ({ ...r, startPct: r.startPct * scale, widthPct: r.widthPct * scale }))
  return { requests, totalTime: Math.round(maxEnd * 7 + 60), lostPackets: lost }
}

function simulate(lossOverride?: number) {
  if (running.value) return
  running.value = true
  simulated.value = false
  const loss = lossOverride !== undefined ? lossOverride : packetLoss.value

  // Clear
  protocols.forEach(p => { p.requests = []; p.totalTime = 0; p.lostPackets = 0 })

  setTimeout(() => {
    const h1 = buildH1(requestCount.value, loss)
    const h2 = buildH2(requestCount.value, loss)
    const h3 = buildH3(requestCount.value, loss)
    protocols[0].requests = h1.requests; protocols[0].totalTime = h1.totalTime; protocols[0].lostPackets = h1.lostPackets
    protocols[1].requests = h2.requests; protocols[1].totalTime = h2.totalTime; protocols[1].lostPackets = h2.lostPackets
    protocols[2].requests = h3.requests; protocols[2].totalTime = h3.totalTime; protocols[2].lostPackets = h3.lostPackets
    running.value = false
    simulated.value = true
  }, 600)
}

function simulateLoss() {
  const savedLoss = packetLoss.value
  packetLoss.value = Math.max(packetLoss.value, 15)
  simulate(packetLoss.value)
  if (savedLoss < 15) {
    setTimeout(() => { packetLoss.value = savedLoss }, 100)
  }
}

function reset() {
  protocols.forEach(p => { p.requests = []; p.totalTime = 0; p.lostPackets = 0 })
  simulated.value = false
}

const features = [
  { name: '头部压缩', values: ['✗', 'HPACK', 'QPACK'] },
  { name: '连接复用', values: ['✗', '✓', '✓'] },
  { name: '多路复用', values: ['✗', '✓', '✓'] },
  { name: '服务器推送', values: ['✗', '✓', '✓'] },
  { name: '传输协议', values: ['TCP', 'TCP', 'QUIC/UDP'] },
  { name: '队头阻塞', values: ['HTTP层', 'TCP层', '✗'] },
  { name: 'TLS 版本', values: ['可选', 'TLS 1.2+', 'TLS 1.3'] },
  { name: '0-RTT 握手', values: ['✗', '✗', '✓'] },
  { name: '连接迁移', values: ['✗', '✗', '✓'] },
  { name: '明文传输', values: ['✓', '✗', '✗'] },
]
</script>
