<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'tcp-handshake' }]" />

    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">TCP 握手可视化</h1>
      <p class="text-[var(--color-text-muted)] mb-6 font-mono text-sm">三次握手 · 四次挥手 · 状态机 · 滑动窗口</p>

      <!-- Mode & Tab Controls -->
      <div class="flex flex-wrap gap-3 mb-6">
        <div class="flex gap-2">
          <button
            v-for="m in modes"
            :key="m.value"
            @click="selectMode(m.value)"
            :class="['font-mono text-xs px-3 py-1 border transition-all', mode === m.value
              ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan)]/10'
              : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)]/50']"
          >{{ m.label }}</button>
        </div>
        <div class="flex gap-2 ml-auto">
          <button
            v-for="t in tabs"
            :key="t.value"
            @click="activeTab = t.value"
            :class="['font-mono text-xs px-3 py-1 border transition-all', activeTab === t.value
              ? 'border-[var(--color-neon-green)] text-[var(--color-neon-green)] bg-[var(--color-neon-green)]/10'
              : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-green)]/50']"
          >{{ t.label }}</button>
        </div>
      </div>

      <!-- Main Visualization -->
      <div v-if="activeTab === 'handshake'" class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-6">
        <!-- State display -->
        <div class="flex justify-between mb-6">
          <div class="text-center">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-1">CLIENT</div>
            <div class="font-mono text-sm px-3 py-1 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] rounded">{{ clientState }}</div>
          </div>
          <div class="text-center">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-1">SERVER</div>
            <div class="font-mono text-sm px-3 py-1 border border-[var(--color-neon-green)] text-[var(--color-neon-green)] rounded">{{ serverState }}</div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="relative" style="min-height: 480px;">
          <!-- Vertical lines -->
          <div class="absolute left-[15%] top-0 bottom-0 w-px bg-[var(--color-neon-cyan)]/30"></div>
          <div class="absolute right-[15%] top-0 bottom-0 w-px bg-[var(--color-neon-green)]/30"></div>

          <!-- Column headers -->
          <div class="absolute left-[15%] -translate-x-1/2 top-0 font-mono text-xs text-[var(--color-neon-cyan)]">客户端</div>
          <div class="absolute right-[15%] translate-x-1/2 top-0 font-mono text-xs text-[var(--color-neon-green)]">服务端</div>

          <!-- Packets -->
          <TransitionGroup name="packet">
            <div
              v-for="pkt in visiblePackets"
              :key="pkt.id"
              class="absolute"
              :style="getPacketStyle(pkt)"
            >
              <div
                class="relative group cursor-pointer"
                @mouseenter="hoveredPacket = pkt"
                @mouseleave="hoveredPacket = null"
              >
                <!-- Arrow line -->
                <svg :width="arrowWidth" height="28" class="overflow-visible">
                  <defs>
                    <marker :id="`arrow-${pkt.id}`" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" :fill="pkt.color" />
                    </marker>
                  </defs>
                  <line
                    :x1="pkt.dir === 'right' ? 0 : arrowWidth"
                    y1="14"
                    :x2="pkt.dir === 'right' ? arrowWidth - 4 : 4"
                    y2="14"
                    :stroke="pkt.color"
                    stroke-width="1.5"
                    :marker-end="`url(#arrow-${pkt.id})`"
                  />
                  <text
                    :x="arrowWidth / 2"
                    y="10"
                    text-anchor="middle"
                    :fill="pkt.color"
                    font-family="monospace"
                    font-size="11"
                  >{{ pkt.label }}</text>
                  <text
                    :x="arrowWidth / 2"
                    y="26"
                    text-anchor="middle"
                    fill="#888"
                    font-family="monospace"
                    font-size="9"
                  >{{ pkt.meta }}</text>
                </svg>

                <!-- Tooltip -->
                <div v-if="hoveredPacket?.id === pkt.id" class="absolute z-10 top-8 left-1/2 -translate-x-1/2 bg-[var(--color-void)] border border-[var(--color-void-border)] rounded p-3 text-xs font-mono w-64 shadow-lg">
                  <div class="text-[var(--color-neon-cyan)] font-bold mb-1">{{ pkt.label }}</div>
                  <div class="text-[var(--color-text-muted)]">{{ pkt.explain }}</div>
                  <div class="mt-1 text-[var(--color-text-primary)]">Seq={{ pkt.seq }} Ack={{ pkt.ack }}</div>
                  <div class="text-[var(--color-text-muted)]">Flags: {{ pkt.flags }}</div>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <!-- Done message -->
          <div v-if="done" class="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-[var(--color-neon-green)] animate-pulse">
            ✓ 完成
          </div>
        </div>

        <!-- Controls -->
        <div class="flex gap-3 mt-4">
          <button @click="startAnimation" :disabled="playing" class="font-mono text-xs px-4 py-2 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]/10 disabled:opacity-40 transition-all">
            {{ playing ? '播放中...' : '▶ 播放' }}
          </button>
          <button @click="resetAnimation" class="font-mono text-xs px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)]/50 transition-all">
            ↺ 重置
          </button>
          <div class="ml-auto flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)]">
            速度：
            <input type="range" min="200" max="2000" step="100" v-model.number="speed" class="w-24 accent-[var(--color-neon-cyan)]" />
            {{ speed }}ms
          </div>
        </div>
      </div>

      <!-- Sliding Window Tab -->
      <div v-else-if="activeTab === 'window'" class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-6">
        <h2 class="font-mono text-sm text-[var(--color-neon-cyan)] mb-4">滑动窗口演示</h2>
        <div class="font-mono text-xs text-[var(--color-text-muted)] mb-4">窗口大小: {{ windowSize }} | 已发送未确认: {{ unacked }} | 可发送: {{ windowSize - unacked }}</div>

        <div class="flex gap-1 mb-4 flex-wrap">
          <div
            v-for="(seg, i) in segments"
            :key="i"
            :class="['w-10 h-10 flex items-center justify-center text-xs font-mono border transition-all rounded',
              seg.state === 'acked' ? 'bg-[var(--color-neon-green)]/20 border-[var(--color-neon-green)] text-[var(--color-neon-green)]' :
              seg.state === 'sent' ? 'bg-[var(--color-neon-cyan)]/20 border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]' :
              seg.state === 'lost' ? 'bg-red-500/20 border-red-500 text-red-400' :
              'border-[var(--color-void-border)] text-[var(--color-text-muted)]'
            ]"
          >{{ i + 1 }}</div>
        </div>

        <div class="flex gap-2 text-xs font-mono flex-wrap mb-6">
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-[var(--color-neon-green)]/20 border border-[var(--color-neon-green)] rounded-sm"></span> 已确认</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-[var(--color-neon-cyan)]/20 border border-[var(--color-neon-cyan)] rounded-sm"></span> 已发送</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500/20 border border-red-500 rounded-sm"></span> 丢包</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 border border-[var(--color-void-border)] rounded-sm"></span> 待发送</span>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button @click="sendNext" class="font-mono text-xs px-3 py-1 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]/10 transition-all">发送下一个</button>
          <button @click="ackNext" class="font-mono text-xs px-3 py-1 border border-[var(--color-neon-green)] text-[var(--color-neon-green)] hover:bg-[var(--color-neon-green)]/10 transition-all">确认</button>
          <button @click="simulateLoss" class="font-mono text-xs px-3 py-1 border border-red-500 text-red-400 hover:bg-red-500/10 transition-all">模拟丢包</button>
          <button @click="retransmit" class="font-mono text-xs px-3 py-1 border border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 transition-all">重传</button>
          <button @click="resetWindow" class="font-mono text-xs px-3 py-1 border border-[var(--color-void-border)] text-[var(--color-text-muted)] transition-all">重置</button>
          <div class="ml-auto flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)]">
            窗口大小：
            <input type="range" min="1" max="8" v-model.number="windowSize" class="w-20 accent-[var(--color-neon-cyan)]" />
            {{ windowSize }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

definePageMeta({ layout: false })

const modes = [
  { value: 'handshake', label: '仅握手' },
  { value: 'teardown', label: '仅挥手' },
  { value: 'full', label: '完整流程' },
]
const tabs = [
  { value: 'handshake', label: '握手/挥手' },
  { value: 'window', label: '滑动窗口' },
]

const mode = ref<'handshake' | 'teardown' | 'full'>('full')
const activeTab = ref('handshake')
const speed = ref(800)
const playing = ref(false)
const done = ref(false)
const hoveredPacket = ref<any>(null)
const arrowWidth = 400

const clientState = ref('CLOSED')
const serverState = ref('CLOSED')
const visiblePackets = ref<any[]>([])

interface Packet {
  id: string
  label: string
  meta: string
  dir: 'right' | 'left'
  top: number
  color: string
  seq: number
  ack: number
  flags: string
  explain: string
}

const handshakePackets: Packet[] = [
  { id: 'syn', label: 'SYN', meta: 'Seq=0', dir: 'right', top: 60, color: '#00d4ff', seq: 0, ack: 0, flags: 'SYN', explain: '客户端发起连接，随机初始序列号 ISN=0，进入 SYN_SENT 状态' },
  { id: 'synack', label: 'SYN-ACK', meta: 'Seq=0 Ack=1', dir: 'left', top: 140, color: '#39ff14', seq: 0, ack: 1, flags: 'SYN+ACK', explain: '服务端确认 SYN，同时发送自己的 SYN，进入 SYN_RCVD 状态' },
  { id: 'ack1', label: 'ACK', meta: 'Seq=1 Ack=1', dir: 'right', top: 220, color: '#00d4ff', seq: 1, ack: 1, flags: 'ACK', explain: '客户端确认服务端 SYN，双方进入 ESTABLISHED 状态，三次握手完成' },
]

const teardownPackets: Packet[] = [
  { id: 'fin1', label: 'FIN', meta: 'Seq=100', dir: 'right', top: 60, color: '#f59e0b', seq: 100, ack: 0, flags: 'FIN', explain: '客户端发起关闭，进入 FIN_WAIT_1 状态' },
  { id: 'ack2', label: 'ACK', meta: 'Seq=200 Ack=101', dir: 'left', top: 140, color: '#39ff14', seq: 200, ack: 101, flags: 'ACK', explain: '服务端确认客户端 FIN，进入 CLOSE_WAIT；客户端进入 FIN_WAIT_2' },
  { id: 'fin2', label: 'FIN', meta: 'Seq=200', dir: 'left', top: 220, color: '#f59e0b', seq: 200, ack: 0, flags: 'FIN', explain: '服务端完成数据传输，发送 FIN，进入 LAST_ACK 状态' },
  { id: 'ack3', label: 'ACK', meta: 'Seq=101 Ack=201', dir: 'right', top: 300, color: '#00d4ff', seq: 101, ack: 201, flags: 'ACK', explain: '客户端确认，进入 TIME_WAIT（等待 2MSL），服务端进入 CLOSED' },
]

const stateSequences = {
  handshake: [
    { client: 'SYN_SENT', server: 'LISTEN' },
    { client: 'SYN_SENT', server: 'SYN_RCVD' },
    { client: 'ESTABLISHED', server: 'ESTABLISHED' },
  ],
  teardown: [
    { client: 'FIN_WAIT_1', server: 'ESTABLISHED' },
    { client: 'FIN_WAIT_2', server: 'CLOSE_WAIT' },
    { client: 'TIME_WAIT', server: 'LAST_ACK' },
    { client: 'CLOSED', server: 'CLOSED' },
  ],
}

let timers: ReturnType<typeof setTimeout>[] = []

function getPacketStyle(pkt: Packet) {
  return {
    top: `${pkt.top}px`,
    left: pkt.dir === 'right' ? '15%' : 'auto',
    right: pkt.dir === 'left' ? '15%' : 'auto',
  }
}

function selectMode(m: 'handshake' | 'teardown' | 'full') {
  mode.value = m
  resetAnimation()
}

function getPackets() {
  if (mode.value === 'handshake') return handshakePackets
  if (mode.value === 'teardown') return teardownPackets
  // full: combine with offset
  const offset = 300
  const td = teardownPackets.map(p => ({ ...p, id: 'td_' + p.id, top: p.top + handshakePackets.length * 80 + offset }))
  return [...handshakePackets, ...td]
}

function startAnimation() {
  if (playing.value) return
  playing.value = true
  done.value = false
  visiblePackets.value = []
  clientState.value = mode.value === 'teardown' ? 'ESTABLISHED' : 'CLOSED'
  serverState.value = mode.value === 'teardown' ? 'ESTABLISHED' : 'LISTEN'

  const pkts = getPackets()
  const isHandshake = (i: number) => mode.value === 'handshake' || (mode.value === 'full' && i < handshakePackets.length)
  const isTeardown = (i: number) => mode.value === 'teardown' || (mode.value === 'full' && i >= handshakePackets.length)

  pkts.forEach((pkt, i) => {
    const t = setTimeout(() => {
      visiblePackets.value.push(pkt)
      // update states
      if (isHandshake(i)) {
        const seq = stateSequences.handshake[i] || stateSequences.handshake[stateSequences.handshake.length - 1]
        clientState.value = seq.client
        serverState.value = seq.server
      } else {
        const tdIdx = i - (mode.value === 'full' ? handshakePackets.length : 0)
        const seq = stateSequences.teardown[tdIdx] || stateSequences.teardown[stateSequences.teardown.length - 1]
        clientState.value = seq.client
        serverState.value = seq.server
      }
      if (i === pkts.length - 1) {
        playing.value = false
        done.value = true
      }
    }, speed.value * (i + 1))
    timers.push(t)
  })
}

function resetAnimation() {
  timers.forEach(clearTimeout)
  timers = []
  playing.value = false
  done.value = false
  visiblePackets.value = []
  clientState.value = 'CLOSED'
  serverState.value = 'CLOSED'
}

// Sliding Window
const windowSize = ref(4)
const totalSegs = 16
const segments = ref(Array.from({ length: totalSegs }, () => ({ state: 'unsent' as 'unsent' | 'sent' | 'acked' | 'lost' })))
const sendPtr = ref(0)
const ackPtr = ref(0)

const unacked = computed(() => sendPtr.value - ackPtr.value)

function sendNext() {
  if (unacked.value >= windowSize.value || sendPtr.value >= totalSegs) return
  segments.value[sendPtr.value].state = 'sent'
  sendPtr.value++
}

function ackNext() {
  if (ackPtr.value >= sendPtr.value) return
  if (segments.value[ackPtr.value].state === 'lost') return
  segments.value[ackPtr.value].state = 'acked'
  ackPtr.value++
}

function simulateLoss() {
  const sentIdx = segments.value.findIndex((s, i) => s.state === 'sent' && i >= ackPtr.value)
  if (sentIdx !== -1) segments.value[sentIdx].state = 'lost'
}

function retransmit() {
  const lostIdx = segments.value.findIndex(s => s.state === 'lost')
  if (lostIdx !== -1) segments.value[lostIdx].state = 'sent'
}

function resetWindow() {
  segments.value = Array.from({ length: totalSegs }, () => ({ state: 'unsent' }))
  sendPtr.value = 0
  ackPtr.value = 0
}

onUnmounted(() => { timers.forEach(clearTimeout) })
</script>

<style scoped>
.packet-enter-active { transition: opacity 0.3s, transform 0.3s; }
.packet-enter-from { opacity: 0; transform: scaleX(0.5); }
</style>
