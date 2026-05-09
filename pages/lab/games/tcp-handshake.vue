<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'tcp-handshake' }]" />

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
            :disabled="playing"
            :class="['font-mono text-xs px-3 py-1 border transition-all disabled:opacity-40', mode === m.value
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

      <!-- Handshake/Teardown Tab -->
      <div v-if="activeTab === 'handshake'" class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-6 overflow-y-auto" :style="{ maxHeight: mode === 'full' ? '90vh' : 'none' }">

        <!-- Three-column layout -->
        <div class="grid grid-cols-[1fr_2fr_1fr] gap-4 mb-6">
          <!-- Client column -->
          <div class="flex flex-col items-center gap-2">
            <div class="font-mono text-xs text-[var(--color-text-muted)]">CLIENT</div>
            <div class="font-mono text-xs px-3 py-1 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] rounded transition-all duration-300 text-center min-w-[120px]">
              {{ clientState }}
            </div>
            <div class="font-mono text-sm text-[var(--color-text-muted)]">client</div>
          </div>

          <!-- Center: timeline label -->
          <div class="flex flex-col items-center justify-end">
            <div class="font-mono text-xs text-[var(--color-text-muted)]">数据包时序</div>
          </div>

          <!-- Server column -->
          <div class="flex flex-col items-center gap-2">
            <div class="font-mono text-xs text-[var(--color-text-muted)]">SERVER</div>
            <div class="font-mono text-xs px-3 py-1 border border-[var(--color-neon-green)] text-[var(--color-neon-green)] rounded transition-all duration-300 text-center min-w-[120px]">
              {{ serverState }}
            </div>
            <div class="font-mono text-sm text-[var(--color-text-muted)]">server</div>
          </div>
        </div>

        <!-- Packet animation area -->
        <div class="relative" :style="{ minHeight: mode === 'full' ? '780px' : '400px' }">
          <!-- Vertical timeline lines -->
          <div class="absolute left-0 top-0 bottom-0 w-px bg-[var(--color-neon-cyan)]/30" style="left: calc(1/6 * 100%)"></div>
          <div class="absolute top-0 bottom-0 w-px bg-[var(--color-neon-green)]/30" style="left: calc(5/6 * 100%)"></div>

          <!-- Packets -->
          <div
            v-for="pkt in packets"
            :key="pkt.id"
            v-show="pkt.visible"
            class="absolute w-full"
            :style="{ top: pkt.top + 'px' }"
          >
            <div class="relative h-10 flex items-center px-[16.67%]">
              <!-- Horizontal line (full width between client/server lines) -->
              <div
                class="absolute h-px transition-opacity duration-200"
                :style="{
                  left: 'calc(1/6 * 100%)',
                  right: 'calc(1/6 * 100%)',
                  background: pkt.color,
                  opacity: pkt.visible ? 1 : 0
                }"
              />

              <!-- Flying arrowhead -->
              <div
                class="absolute w-3 h-3 transition-all"
                :style="{
                  left: arrowHeadLeft(pkt),
                  top: '50%',
                  transform: 'translateY(-50%) translateX(-50%) rotate(45deg)',
                  background: pkt.color,
                  transitionDuration: pkt.transitioning ? '500ms' : '0ms',
                }"
              />

              <!-- Label centered on line -->
              <div
                class="absolute font-mono text-[10px] -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap"
                :style="{ color: pkt.color }"
              >{{ pkt.label }}</div>

              <!-- Direction indicator (small triangle at end) -->
              <div
                class="absolute w-0 h-0"
                :style="arrowTipStyle(pkt)"
              />

              <!-- Tooltip -->
              <div
                v-if="hoveredPacket === pkt.id && pkt.arrived"
                class="absolute z-20 top-8 left-1/2 -translate-x-1/2 bg-[var(--color-void)] border border-[var(--color-void-border)] rounded p-3 text-xs font-mono w-64 shadow-lg pointer-events-none"
              >
                <div class="font-bold mb-1" :style="{ color: pkt.color }">{{ pkt.label }}</div>
                <div class="text-[var(--color-text-muted)] mb-1">{{ pkt.explain }}</div>
                <div class="text-[var(--color-text-primary)]">Seq={{ pkt.seqAck }}</div>
                <div class="text-[var(--color-text-muted)]">Flags: {{ pkt.flags }}</div>
              </div>

              <!-- Hover target -->
              <div
                class="absolute inset-0 cursor-pointer"
                @mouseenter="hoveredPacket = pkt.id"
                @mouseleave="hoveredPacket = null"
              />
            </div>
          </div>

          <!-- "Sending" indicator -->
          <div
            v-if="sendingLabel"
            class="absolute font-mono text-xs animate-pulse"
            :style="sendingStyle"
          >
            {{ sendingLabel }}
          </div>

          <!-- Done message -->
          <div v-if="done" class="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-[var(--color-neon-green)] animate-pulse">
            ✓ 完成
          </div>
        </div>

        <!-- Controls -->
        <div class="flex gap-3 mt-4 flex-wrap items-center">
          <button
            @click="startAnimation"
            :disabled="playing"
            class="font-mono text-xs px-4 py-2 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)]/10 disabled:opacity-40 transition-all"
          >{{ playing ? '播放中...' : '▶ 播放' }}</button>
          <button
            @click="resetAnimation"
            class="font-mono text-xs px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)]/50 transition-all"
          >↺ 重置</button>
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
        <div class="font-mono text-xs text-[var(--color-text-muted)] mb-4">
          窗口大小: {{ windowSize }} | 已发送未确认: {{ unacked }} | 可发送: {{ Math.max(0, windowSize - unacked) }}
        </div>

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
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-[var(--color-neon-green)]/20 border border-[var(--color-neon-green)] rounded-sm inline-block"></span> 已确认</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-[var(--color-neon-cyan)]/20 border border-[var(--color-neon-cyan)] rounded-sm inline-block"></span> 已发送</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 bg-red-500/20 border border-red-500 rounded-sm inline-block"></span> 丢包</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 border border-[var(--color-void-border)] rounded-sm inline-block"></span> 待发送</span>
        </div>

        <div class="flex gap-2 flex-wrap items-center">
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

const { siteName } = useSiteConfig()
useSeoMeta({ title: `TCP Handshake | ${siteName}` })

definePageMeta({ layout: false })

// ─── Mode & Tab ───────────────────────────────────────────────────────────────
const modes = [
  { value: 'handshake', label: '仅握手' },
  { value: 'teardown', label: '仅挥手' },
  { value: 'full',     label: '完整流程' },
] as const
const tabs = [
  { value: 'handshake', label: '握手/挥手' },
  { value: 'window',    label: '滑动窗口' },
]

type Mode = 'handshake' | 'teardown' | 'full'
const mode = ref<Mode>('full')
const activeTab = ref('handshake')
const speed = ref(800)

// ─── Packet Definition ────────────────────────────────────────────────────────
interface Packet {
  id: string
  label: string
  dir: 'right' | 'left'
  flags: string
  seqAck: string
  explain: string
  color: string
  top: number          // px from top of animation area
  // animation state
  visible: boolean
  progress: number     // 0 = sender side, 1 = receiver side
  transitioning: boolean
  arrived: boolean
}

const HANDSHAKE_STEPS: Omit<Packet, 'visible' | 'progress' | 'transitioning' | 'arrived'>[] = [
  {
    id: 'syn', label: 'SYN', dir: 'right', top: 40,
    flags: 'SYN', seqAck: 'Seq=0',
    color: '#00d4ff',
    explain: '客户端发起连接，随机初始序列号 ISN=0，进入 SYN_SENT 状态',
  },
  {
    id: 'synack', label: 'SYN-ACK', dir: 'left', top: 120,
    flags: 'SYN+ACK', seqAck: 'Seq=0 Ack=1',
    color: '#39ff14',
    explain: '服务端确认 SYN，同时发送自己的 SYN，进入 SYN_RCVD 状态',
  },
  {
    id: 'ack1', label: 'ACK', dir: 'right', top: 200,
    flags: 'ACK', seqAck: 'Seq=1 Ack=1',
    color: '#00d4ff',
    explain: '客户端确认服务端 SYN，双方进入 ESTABLISHED，三次握手完成',
  },
]

const TEARDOWN_STEPS: Omit<Packet, 'visible' | 'progress' | 'transitioning' | 'arrived'>[] = [
  {
    id: 'fin1', label: 'FIN', dir: 'right', top: 40,
    flags: 'FIN', seqAck: 'Seq=100',
    color: '#f59e0b',
    explain: '客户端发起关闭，进入 FIN_WAIT_1 状态',
  },
  {
    id: 'ack2', label: 'ACK', dir: 'left', top: 120,
    flags: 'ACK', seqAck: 'Seq=200 Ack=101',
    color: '#39ff14',
    explain: '服务端确认客户端 FIN，进入 CLOSE_WAIT；客户端进入 FIN_WAIT_2',
  },
  {
    id: 'fin2', label: 'FIN', dir: 'left', top: 200,
    flags: 'FIN', seqAck: 'Seq=200',
    color: '#f59e0b',
    explain: '服务端完成数据传输，发送 FIN，进入 LAST_ACK 状态',
  },
  {
    id: 'ack3', label: 'ACK', dir: 'right', top: 280,
    flags: 'ACK', seqAck: 'Seq=101 Ack=201',
    color: '#00d4ff',
    explain: '客户端确认，进入 TIME_WAIT（2MSL），服务端进入 CLOSED',
  },
]

// State sequences (applied BEFORE packet arrives at destination)
const HANDSHAKE_STATES = [
  { client: 'SYN_SENT',     server: 'LISTEN' },
  { client: 'SYN_SENT',     server: 'SYN_RCVD' },
  { client: 'ESTABLISHED',  server: 'ESTABLISHED' },
]

const TEARDOWN_STATES = [
  { client: 'FIN_WAIT_1',  server: 'ESTABLISHED' },
  { client: 'FIN_WAIT_2',  server: 'CLOSE_WAIT' },
  { client: 'FIN_WAIT_2',  server: 'LAST_ACK' },
  { client: 'TIME_WAIT',   server: 'CLOSED' },
]

// ─── Reactive State ───────────────────────────────────────────────────────────
const clientState = ref('CLOSED')
const serverState = ref('CLOSED')
const packets = ref<Packet[]>([])
const playing = ref(false)
const done = ref(false)
const hoveredPacket = ref<string | null>(null)
const sendingLabel = ref('')
const sendingStyle = ref<Record<string, string>>({})

// ─── Arrow head position ──────────────────────────────────────────────────────
// The packet area spans from left=16.67% to right=16.67%
// progress 0 = sender side, 1 = receiver side (in absolute % of container)
function arrowHeadLeft(pkt: Packet): string {
  // left edge of arrow track ≈ 16.67%, right edge ≈ 83.33%
  const trackStart = 16.67
  const trackEnd = 83.33
  const p = pkt.progress
  const pct = pkt.dir === 'right'
    ? trackStart + p * (trackEnd - trackStart)
    : trackEnd - p * (trackEnd - trackStart)
  return `${pct}%`
}

function arrowTipStyle(pkt: Packet): Record<string, string> {
  // Static arrow triangle at destination
  if (!pkt.arrived) return { display: 'none' }
  const base: Record<string, string> = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '0',
    height: '0',
    borderTop: '5px solid transparent',
    borderBottom: '5px solid transparent',
  }
  if (pkt.dir === 'right') {
    return {
      ...base,
      left: 'calc(83.33% - 1px)',
      borderLeft: `8px solid ${pkt.color}`,
    }
  } else {
    return {
      ...base,
      left: 'calc(16.67% - 7px)',
      borderRight: `8px solid ${pkt.color}`,
    }
  }
}

// ─── Animation Engine ─────────────────────────────────────────────────────────
let cancelFlag = false

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms)
    // Poll cancel
    const poll = setInterval(() => {
      if (cancelFlag) { clearTimeout(id); clearInterval(poll); resolve() }
    }, 50)
    setTimeout(() => clearInterval(poll), ms + 100)
  })
}

function makePackets(steps: typeof HANDSHAKE_STEPS, topOffset = 0): Packet[] {
  return steps.map(s => ({
    ...s,
    top: s.top + topOffset,
    visible: false,
    progress: 0,
    transitioning: false,
    arrived: false,
  }))
}

function initPackets() {
  if (mode.value === 'handshake') {
    packets.value = makePackets(HANDSHAKE_STEPS)
  } else if (mode.value === 'teardown') {
    packets.value = makePackets(TEARDOWN_STEPS)
  } else {
    const hs = makePackets(HANDSHAKE_STEPS)
    const td = makePackets(TEARDOWN_STEPS, HANDSHAKE_STEPS.length * 80 + 60)
    // Rename teardown ids to avoid collision
    td.forEach(p => { p.id = 'td_' + p.id })
    packets.value = [...hs, ...td]
  }
}

async function runAnimation() {
  cancelFlag = false
  playing.value = true
  done.value = false

  const isHandshakeMode = mode.value === 'handshake'
  const isTeardownMode = mode.value === 'teardown'
  const isFullMode = mode.value === 'full'

  // Initial states
  clientState.value = isTeardownMode ? 'ESTABLISHED' : 'CLOSED'
  serverState.value = isTeardownMode ? 'ESTABLISHED' : 'LISTEN'

  const hsCount = HANDSHAKE_STEPS.length
  const allPkts = packets.value

  for (let i = 0; i < allPkts.length; i++) {
    if (cancelFlag) break
    const pkt = allPkts[i]

    // Determine which state sequence to use
    let states: typeof HANDSHAKE_STATES
    let stateIdx: number
    if (isHandshakeMode) {
      states = HANDSHAKE_STATES
      stateIdx = i
    } else if (isTeardownMode) {
      states = TEARDOWN_STATES
      stateIdx = i
    } else {
      // full mode
      if (i < hsCount) {
        states = HANDSHAKE_STATES
        stateIdx = i
      } else {
        states = TEARDOWN_STATES
        stateIdx = i - hsCount
      }
    }

    const stateEntry = states[stateIdx] ?? states[states.length - 1]

    // 1. Show "sending" indicator
    const isRight = pkt.dir === 'right'
    sendingLabel.value = `发送 ${pkt.label}...`
    sendingStyle.value = {
      top: (pkt.top - 2) + 'px',
      left: isRight ? '2%' : 'auto',
      right: isRight ? 'auto' : '2%',
      color: pkt.color,
      fontSize: '10px',
      fontFamily: 'monospace',
    }

    await sleep(150)
    if (cancelFlag) break

    // Update sender state immediately
    clientState.value = stateEntry.client
    serverState.value = stateEntry.server

    // 2. Make packet visible at progress=0 (sender side)
    pkt.visible = true
    pkt.progress = 0
    pkt.transitioning = false
    pkt.arrived = false

    await sleep(80)
    if (cancelFlag) break

    // 3. Trigger CSS transition: move to progress=1
    pkt.transitioning = true
    pkt.progress = 1

    // 4. Wait for transition to complete
    await sleep(520)
    if (cancelFlag) break

    // 5. Mark arrived
    pkt.arrived = true
    sendingLabel.value = ''

    await sleep(120)
    if (cancelFlag) break

    // 6. Wait speed ms before next step
    await sleep(speed.value)
  }

  if (!cancelFlag) {
    done.value = true
  }
  playing.value = false
}

function startAnimation() {
  if (playing.value) return
  resetAnimation()
  initPackets()
  runAnimation()
}

function resetAnimation() {
  cancelFlag = true
  playing.value = false
  done.value = false
  sendingLabel.value = ''
  packets.value = []
  clientState.value = 'CLOSED'
  serverState.value = 'CLOSED'
  hoveredPacket.value = null
}

function selectMode(m: Mode) {
  if (playing.value) return
  mode.value = m
  resetAnimation()
}

// ─── Sliding Window ───────────────────────────────────────────────────────────
const windowSize = ref(4)
const TOTAL_SEGS = 16
const segments = ref(Array.from({ length: TOTAL_SEGS }, () => ({ state: 'unsent' as 'unsent' | 'sent' | 'acked' | 'lost' })))
const sendPtr = ref(0)
const ackPtr = ref(0)

const unacked = computed(() => sendPtr.value - ackPtr.value)

function sendNext() {
  if (unacked.value >= windowSize.value || sendPtr.value >= TOTAL_SEGS) return
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
  const idx = segments.value.findIndex((s, i) => s.state === 'sent' && i >= ackPtr.value)
  if (idx !== -1) segments.value[idx].state = 'lost'
}

function retransmit() {
  const idx = segments.value.findIndex(s => s.state === 'lost')
  if (idx !== -1) segments.value[idx].state = 'sent'
}

function resetWindow() {
  segments.value = Array.from({ length: TOTAL_SEGS }, () => ({ state: 'unsent' }))
  sendPtr.value = 0
  ackPtr.value = 0
}

onUnmounted(() => { cancelFlag = true })
</script>

<style scoped>
/* Smooth arrowhead flight */
.transition-all {
  transition-property: left, right, top, opacity, transform;
  transition-timing-function: ease-in-out;
}
</style>
