<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)] font-mono">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'cpu-scheduler' }]" />

    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-[var(--color-neon-cyan)] mb-2">CPU Scheduler Simulator</h1>
      <p class="text-[var(--color-text-muted)] mb-6 text-sm">Visualize FCFS, SJF, Round Robin, and Priority scheduling</p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Config -->
        <div class="lg:col-span-1 space-y-4">
          <!-- Algorithm -->
          <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
            <div class="text-sm text-[var(--color-text-muted)] mb-3">Algorithm</div>
            <div class="space-y-1">
              <label v-for="alg in algorithms" :key="alg.value" class="flex items-center gap-2 cursor-pointer hover:text-[var(--color-neon-cyan)]">
                <input type="radio" v-model="selectedAlg" :value="alg.value" class="accent-[var(--color-neon-cyan)]" />
                <span class="text-sm">{{ alg.label }}</span>
              </label>
            </div>
            <div v-if="selectedAlg === 'rr'" class="mt-3">
              <label class="text-xs text-[var(--color-text-muted)]">Time Quantum: {{ quantum }}</label>
              <input type="range" v-model.number="quantum" min="1" max="10" class="w-full mt-1 accent-[var(--color-neon-cyan)]" />
            </div>
          </div>

          <!-- Add Process -->
          <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
            <div class="text-sm text-[var(--color-text-muted)] mb-3">Add Process</div>
            <div class="space-y-2">
              <input v-model="newProc.name" placeholder="Name (P1)" class="w-full bg-[var(--color-void)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-2 py-1.5 rounded text-xs outline-none focus:border-[var(--color-neon-cyan)]" />
              <div class="grid grid-cols-3 gap-1">
                <div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mb-0.5">Arrival</div>
                  <input type="number" v-model.number="newProc.arrival" min="0" class="w-full bg-[var(--color-void)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs outline-none focus:border-[var(--color-neon-cyan)]" />
                </div>
                <div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mb-0.5">Burst</div>
                  <input type="number" v-model.number="newProc.burst" min="1" class="w-full bg-[var(--color-void)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs outline-none focus:border-[var(--color-neon-cyan)]" />
                </div>
                <div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mb-0.5">Priority</div>
                  <input type="number" v-model.number="newProc.priority" min="1" class="w-full bg-[var(--color-void)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-2 py-1 rounded text-xs outline-none focus:border-[var(--color-neon-cyan)]" />
                </div>
              </div>
              <button @click="addProcess" class="w-full py-1.5 text-xs bg-[var(--color-neon-cyan)] text-black font-bold rounded hover:opacity-80">+ Add</button>
            </div>
          </div>

          <!-- Process list -->
          <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm text-[var(--color-text-muted)]">Processes</div>
              <button @click="loadPreset" class="text-[10px] border border-[var(--color-void-border)] px-2 py-0.5 rounded text-[var(--color-text-muted)] hover:bg-[var(--color-void)]">Load Preset</button>
            </div>
            <div class="space-y-1.5">
              <div v-for="(p, i) in processes" :key="p.id" class="flex items-center gap-2 text-xs">
                <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ background: p.color }" />
                <span class="flex-1">{{ p.name }}</span>
                <span class="text-[var(--color-text-muted)]">A:{{ p.arrival }} B:{{ p.burst }} P:{{ p.priority }}</span>
                <button @click="removeProcess(i)" class="text-red-400 hover:text-red-300 ml-1">✕</button>
              </div>
              <div v-if="!processes.length" class="text-[var(--color-text-muted)] text-xs">No processes. Load preset or add manually.</div>
            </div>
          </div>
        </div>

        <!-- Main area -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Controls -->
          <div class="flex gap-2 flex-wrap">
            <button @click="runScheduler" :disabled="animating || !processes.length" class="px-4 py-2 bg-[var(--color-neon-cyan)] text-black font-bold rounded hover:opacity-80 disabled:opacity-40 text-sm">
              ▶ Run
            </button>
            <button @click="togglePause" :disabled="!animating && !paused" class="px-4 py-2 border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] rounded hover:bg-[var(--color-void-card)] disabled:opacity-40 text-sm">
              {{ paused ? '⏵ Resume' : '⏸ Pause' }}
            </button>
            <button @click="resetScheduler" class="px-4 py-2 border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded hover:bg-[var(--color-void-card)] text-sm">
              ↺ Reset
            </button>
            <span class="self-center text-xs text-[var(--color-text-muted)]">
              Time: <span class="text-[var(--color-neon-cyan)]">{{ currentTime }}</span>
            </span>
          </div>

          <!-- Gantt Chart -->
          <div class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
            <div class="text-sm text-[var(--color-text-muted)] mb-3">Gantt Chart</div>
            <div v-if="ganttBlocks.length === 0" class="text-xs text-[var(--color-text-muted)]">Run the scheduler to see the Gantt chart.</div>
            <div v-else class="overflow-x-auto">
              <div class="relative">
                <!-- Blocks -->
                <div class="flex h-10 min-w-max">
                  <div
                    v-for="(block, i) in visibleGantt"
                    :key="i"
                    class="h-full flex items-center justify-center text-xs font-bold text-black border-r border-black/20 relative overflow-hidden"
                    :style="{ width: (block.duration * 28) + 'px', background: block.color }"
                    :title="`${block.name}: ${block.start}-${block.end}`"
                  >
                    <span class="truncate px-1">{{ block.name }}</span>
                  </div>
                </div>
                <!-- Time axis -->
                <div class="flex min-w-max text-[10px] text-[var(--color-text-muted)] mt-1">
                  <div v-for="(block, i) in visibleGantt" :key="i" :style="{ width: (block.duration * 28) + 'px' }">
                    {{ block.start }}
                  </div>
                  <div v-if="visibleGantt.length">{{ visibleGantt[visibleGantt.length - 1]?.end }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stats table -->
          <div v-if="stats.length" class="p-4 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded">
            <div class="text-sm text-[var(--color-text-muted)] mb-3">Process Statistics</div>
            <div class="overflow-x-auto">
              <table class="text-xs w-full border-collapse">
                <thead>
                  <tr class="text-[var(--color-text-muted)]">
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Process</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Arrival</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Burst</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Finish</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Turnaround</th>
                    <th class="text-left px-2 py-1 border-b border-[var(--color-void-border)]">Waiting</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="s in stats" :key="s.name" class="hover:bg-[var(--color-void)]">
                    <td class="px-2 py-1 font-bold" :style="{ color: s.color }">{{ s.name }}</td>
                    <td class="px-2 py-1">{{ s.arrival }}</td>
                    <td class="px-2 py-1">{{ s.burst }}</td>
                    <td class="px-2 py-1 text-[var(--color-neon-cyan)]">{{ s.finish }}</td>
                    <td class="px-2 py-1 text-[var(--color-neon-green)]">{{ s.turnaround }}</td>
                    <td class="px-2 py-1 text-[var(--color-text-muted)]">{{ s.waiting }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 flex gap-6 text-xs">
              <div>Avg Waiting: <span class="text-[var(--color-neon-cyan)] font-bold">{{ avgWaiting.toFixed(2) }}</span></div>
              <div>Avg Turnaround: <span class="text-[var(--color-neon-cyan)] font-bold">{{ avgTurnaround.toFixed(2) }}</span></div>
              <div>CPU Utilization: <span class="text-[var(--color-neon-green)] font-bold">{{ cpuUtil.toFixed(1) }}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Process {
  id: number
  name: string
  arrival: number
  burst: number
  priority: number
  color: string
}

interface GanttBlock {
  name: string
  start: number
  end: number
  duration: number
  color: string
}

interface ProcStat {
  name: string
  color: string
  arrival: number
  burst: number
  finish: number
  turnaround: number
  waiting: number
}

const COLORS = ['#00d4ff', '#39ff14', '#ff6b6b', '#ffd700', '#da70d6', '#ff8c00', '#00fa9a', '#ff69b4']

const algorithms = [
  { value: 'fcfs', label: 'FCFS (First Come First Served)' },
  { value: 'sjf', label: 'SJF (Shortest Job First)' },
  { value: 'rr', label: 'Round Robin' },
  { value: 'priority', label: 'Priority (lower = higher)' }
]

const selectedAlg = ref('fcfs')
const quantum = ref(3)
const processes = ref<Process[]>([])
let nextId = 1
let nextColorIdx = 0

const newProc = reactive({ name: '', arrival: 0, burst: 1, priority: 1 })

const ganttBlocks = ref<GanttBlock[]>([])
const visibleGantt = ref<GanttBlock[]>([])
const stats = ref<ProcStat[]>([])
const currentTime = ref(0)
const animating = ref(false)
const paused = ref(false)

let animTimer: ReturnType<typeof setTimeout> | null = null
let animIdx = 0

function addProcess() {
  const name = newProc.name.trim() || `P${nextId}`
  processes.value.push({
    id: nextId++,
    name,
    arrival: newProc.arrival,
    burst: newProc.burst,
    priority: newProc.priority,
    color: COLORS[nextColorIdx++ % COLORS.length]
  })
  newProc.name = ''
  newProc.arrival = 0
  newProc.burst = 1
  newProc.priority = 1
}

function removeProcess(i: number) { processes.value.splice(i, 1) }

function loadPreset() {
  processes.value = []
  nextColorIdx = 0
  const preset = [
    { name: 'P1', arrival: 0, burst: 6, priority: 2 },
    { name: 'P2', arrival: 1, burst: 4, priority: 1 },
    { name: 'P3', arrival: 2, burst: 2, priority: 3 },
    { name: 'P4', arrival: 4, burst: 8, priority: 2 },
    { name: 'P5', arrival: 6, burst: 3, priority: 1 }
  ]
  for (const p of preset) {
    processes.value.push({ id: nextId++, color: COLORS[nextColorIdx++ % COLORS.length], ...p })
  }
}

// Scheduling algorithms
function scheduleFCFS(procs: Process[]): GanttBlock[] {
  const sorted = [...procs].sort((a, b) => a.arrival - b.arrival || a.id - b.id)
  const blocks: GanttBlock[] = []
  let t = 0
  for (const p of sorted) {
    if (t < p.arrival) { blocks.push({ name: 'IDLE', start: t, end: p.arrival, duration: p.arrival - t, color: '#444' }); t = p.arrival }
    blocks.push({ name: p.name, start: t, end: t + p.burst, duration: p.burst, color: p.color })
    t += p.burst
  }
  return blocks
}

function scheduleSJF(procs: Process[]): GanttBlock[] {
  const remaining = procs.map(p => ({ ...p, rem: p.burst, done: false }))
  const blocks: GanttBlock[] = []
  let t = 0
  let done = 0
  while (done < procs.length) {
    const avail = remaining.filter(p => !p.done && p.arrival <= t)
    if (!avail.length) {
      const next = remaining.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0]
      blocks.push({ name: 'IDLE', start: t, end: next.arrival, duration: next.arrival - t, color: '#444' })
      t = next.arrival
      continue
    }
    const p = avail.sort((a, b) => a.burst - b.burst)[0]
    blocks.push({ name: p.name, start: t, end: t + p.burst, duration: p.burst, color: p.color })
    t += p.burst
    p.done = true
    done++
  }
  return blocks
}

function scheduleRR(procs: Process[], q: number): GanttBlock[] {
  const tasks = procs.map(p => ({ ...p, rem: p.burst })).sort((a, b) => a.arrival - b.arrival)
  const blocks: GanttBlock[] = []
  let t = 0
  const queue: typeof tasks = []
  let i = 0
  const enqueue = () => { while (i < tasks.length && tasks[i].arrival <= t) queue.push(tasks[i++]) }
  enqueue()
  while (queue.length > 0 || i < tasks.length) {
    if (!queue.length) {
      const next = tasks[i]
      blocks.push({ name: 'IDLE', start: t, end: next.arrival, duration: next.arrival - t, color: '#444' })
      t = next.arrival
      enqueue()
      continue
    }
    const p = queue.shift()!
    const run = Math.min(q, p.rem)
    blocks.push({ name: p.name, start: t, end: t + run, duration: run, color: p.color })
    t += run
    enqueue()
    p.rem -= run
    if (p.rem > 0) queue.push(p)
  }
  return blocks
}

function schedulePriority(procs: Process[]): GanttBlock[] {
  const remaining = procs.map(p => ({ ...p, rem: p.burst, done: false }))
  const blocks: GanttBlock[] = []
  let t = 0
  let done = 0
  while (done < procs.length) {
    const avail = remaining.filter(p => !p.done && p.arrival <= t)
    if (!avail.length) {
      const next = remaining.filter(p => !p.done).sort((a, b) => a.arrival - b.arrival)[0]
      blocks.push({ name: 'IDLE', start: t, end: next.arrival, duration: next.arrival - t, color: '#444' })
      t = next.arrival
      continue
    }
    const p = avail.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival)[0]
    blocks.push({ name: p.name, start: t, end: t + p.burst, duration: p.burst, color: p.color })
    t += p.burst
    p.done = true
    done++
  }
  return blocks
}

function computeStats(procs: Process[], blocks: GanttBlock[]): ProcStat[] {
  return procs.map(p => {
    const finish = Math.max(...blocks.filter(b => b.name === p.name).map(b => b.end))
    const turnaround = finish - p.arrival
    const waiting = turnaround - p.burst
    return { name: p.name, color: p.color, arrival: p.arrival, burst: p.burst, finish, turnaround, waiting }
  })
}

const avgWaiting = computed(() => stats.value.length ? stats.value.reduce((s, x) => s + x.waiting, 0) / stats.value.length : 0)
const avgTurnaround = computed(() => stats.value.length ? stats.value.reduce((s, x) => s + x.turnaround, 0) / stats.value.length : 0)
const cpuUtil = computed(() => {
  if (!ganttBlocks.value.length) return 0
  const total = ganttBlocks.value[ganttBlocks.value.length - 1]?.end || 0
  const busy = ganttBlocks.value.filter(b => b.name !== 'IDLE').reduce((s, b) => s + b.duration, 0)
  return total ? (busy / total) * 100 : 0
})

function runScheduler() {
  if (!processes.value.length) return
  resetScheduler()
  const alg = selectedAlg.value
  let blocks: GanttBlock[]
  if (alg === 'fcfs') blocks = scheduleFCFS(processes.value)
  else if (alg === 'sjf') blocks = scheduleSJF(processes.value)
  else if (alg === 'rr') blocks = scheduleRR(processes.value, quantum.value)
  else blocks = schedulePriority(processes.value)
  ganttBlocks.value = blocks
  stats.value = computeStats(processes.value, blocks)

  // Animate
  animIdx = 0
  visibleGantt.value = []
  animating.value = true
  paused.value = false
  animateNext()
}

function animateNext() {
  if (paused.value || animIdx >= ganttBlocks.value.length) {
    if (animIdx >= ganttBlocks.value.length) { animating.value = false; currentTime.value = ganttBlocks.value[ganttBlocks.value.length - 1]?.end || 0 }
    return
  }
  const block = ganttBlocks.value[animIdx]
  visibleGantt.value.push(block)
  currentTime.value = block.end
  animIdx++
  animTimer = setTimeout(animateNext, 100)
}

function togglePause() {
  if (animating.value) {
    paused.value = !paused.value
    if (!paused.value) animateNext()
  }
}

function resetScheduler() {
  if (animTimer) { clearTimeout(animTimer); animTimer = null }
  animating.value = false
  paused.value = false
  visibleGantt.value = []
  ganttBlocks.value = []
  stats.value = []
  currentTime.value = 0
  animIdx = 0
}

onUnmounted(() => { if (animTimer) clearTimeout(animTimer) })
</script>
