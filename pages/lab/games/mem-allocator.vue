<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'mem-allocator' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">Memory Allocator</h1>
      <p class="font-mono text-sm text-[var(--color-text-muted)] mb-6">可视化内存分配策略 · First Fit / Best Fit / Worst Fit</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">分配策略</label>
          <select v-model="strategy" class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-neon-cyan)] px-3 py-2 rounded">
            <option value="first">First Fit</option>
            <option value="best">Best Fit</option>
            <option value="worst">Worst Fit</option>
          </select>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">malloc(size)</label>
          <div class="flex gap-2">
            <input v-model.number="mallocSize" type="number" min="1" max="128" placeholder="bytes"
              class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-3 py-2 rounded w-24" />
            <button @click="doMalloc" :disabled="animating"
              class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)] hover:text-black transition-colors disabled:opacity-40">
              malloc
            </button>
          </div>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">free(ptr)</label>
          <div class="flex gap-2">
            <input v-model.number="freeId" type="number" min="0" placeholder="block id"
              class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-3 py-2 rounded w-24" />
            <button @click="doFree" :disabled="animating"
              class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-neon-green)] text-[var(--color-neon-green)] hover:bg-[var(--color-neon-green)] hover:text-black transition-colors disabled:opacity-40">
              free
            </button>
          </div>
        </div>
        <button @click="runRandom" :disabled="animating"
          class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)] transition-colors disabled:opacity-40 self-end">
          随机测试
        </button>
        <button @click="resetMem"
          class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:text-red-400 hover:border-red-400 transition-colors self-end">
          重置
        </button>
        <div class="self-end">
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">速度</label>
          <input type="range" min="1" max="10" v-model.number="speed" class="w-24" />
        </div>
      </div>

      <!-- Status message -->
      <div class="font-mono text-sm mb-4 h-6">
        <span :class="statusColor">{{ statusMsg }}</span>
      </div>

      <!-- Memory visualization -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 mb-6">
        <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">堆内存 ({{ TOTAL_BYTES }} bytes, 每格 {{ CELL_SIZE }} bytes)</div>
        <div class="flex flex-wrap gap-px">
          <div
            v-for="(cell, i) in cells"
            :key="i"
            :class="cellClass(cell, i)"
            :title="`offset: ${i * CELL_SIZE}`"
            class="transition-all duration-200"
            style="width: 18px; height: 28px; border-radius: 2px;"
          >
          </div>
        </div>
        <!-- Legend -->
        <div class="flex flex-wrap gap-4 mt-3 font-mono text-xs text-[var(--color-text-muted)]">
          <span><span class="inline-block w-3 h-3 rounded-sm bg-[#1a1a2e] border border-gray-700 mr-1"></span>空闲</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-purple-600 mr-1"></span>Header</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-[var(--color-neon-cyan)] mr-1" style="opacity:0.7"></span>已分配</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-yellow-500 mr-1" style="opacity:0.6"></span>内部碎片</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-red-700 mr-1" style="opacity:0.5"></span>外部碎片</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-white mr-1" style="opacity:0.9"></span>搜索中</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Free list -->
        <div class="lg:col-span-1 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
          <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">空闲链表 (Free List)</div>
          <div v-if="freeList.length === 0" class="font-mono text-xs text-[var(--color-text-muted)] italic">链表为空</div>
          <div class="space-y-2">
            <div v-for="(node, i) in freeList" :key="i" class="font-mono text-xs">
              <div class="border border-[var(--color-void-border)] rounded p-2 bg-[#0a0a14]">
                <div class="text-[var(--color-neon-green)]">[ offset: {{ node.offset }} ]</div>
                <div class="text-[var(--color-text-muted)]">size: {{ node.size }} bytes</div>
                <div class="text-[var(--color-text-muted)]">prev: {{ node.prev !== null ? node.prev : 'NULL' }}</div>
                <div class="text-[var(--color-text-muted)]">next: {{ node.next !== null ? node.next : 'NULL' }}</div>
              </div>
              <div v-if="i < freeList.length - 1" class="text-[var(--color-text-muted)] text-center">↓</div>
            </div>
          </div>
        </div>

        <!-- Stats + Allocated blocks -->
        <div class="lg:col-span-2 space-y-4">
          <!-- Stats -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">统计</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div class="font-mono text-xl text-[var(--color-neon-cyan)]">{{ utilization }}%</div>
                <div class="font-mono text-xs text-[var(--color-text-muted)]">内存利用率</div>
              </div>
              <div>
                <div class="font-mono text-xl text-yellow-400">{{ fragmentation }}%</div>
                <div class="font-mono text-xs text-[var(--color-text-muted)]">碎片率</div>
              </div>
              <div>
                <div class="font-mono text-xl text-[var(--color-neon-green)]">{{ allocCount }}</div>
                <div class="font-mono text-xs text-[var(--color-text-muted)]">分配次数</div>
              </div>
              <div>
                <div class="font-mono text-xl text-purple-400">{{ freeCount }}</div>
                <div class="font-mono text-xs text-[var(--color-text-muted)]">释放次数</div>
              </div>
            </div>
          </div>

          <!-- Allocated blocks table -->
          <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
            <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">已分配块</div>
            <div v-if="allocatedBlocks.length === 0" class="font-mono text-xs text-[var(--color-text-muted)] italic">无</div>
            <table v-else class="font-mono text-xs w-full">
              <thead>
                <tr class="text-[var(--color-text-muted)] border-b border-[var(--color-void-border)]">
                  <th class="text-left pb-1">ID</th>
                  <th class="text-left pb-1">offset</th>
                  <th class="text-left pb-1">req</th>
                  <th class="text-left pb-1">actual</th>
                  <th class="text-left pb-1">内部碎片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in allocatedBlocks" :key="b.id" :style="{ color: blockColor(b.id) }">
                  <td class="py-0.5">#{{ b.id }}</td>
                  <td>{{ b.offset }}</td>
                  <td>{{ b.reqSize }}</td>
                  <td>{{ b.size }}</td>
                  <td class="text-yellow-500">{{ b.size - b.reqSize - HEADER_SIZE }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `Mem Allocator | ${siteName}` })
const TOTAL_BYTES = 512
const CELL_SIZE = 8 // bytes per cell
const HEADER_SIZE = 8 // header bytes per block
const TOTAL_CELLS = TOTAL_BYTES / CELL_SIZE

const BLOCK_COLORS = [
  '#00d4ff', '#39ff14', '#ff6b6b', '#ffd700', '#ff69b4',
  '#00ff7f', '#ff4500', '#7b68ee', '#00ced1', '#ff1493',
]

type CellType = 'free' | 'header' | 'allocated' | 'padding' | 'search' | 'external-frag'

interface Cell {
  type: CellType
  blockId: number | null
}

interface Block {
  id: number
  offset: number // in bytes
  size: number   // total allocated size including header
  reqSize: number // user requested size
  freed: boolean
}

interface FreeNode {
  offset: number
  size: number
  prev: number | null
  next: number | null
}

const strategy = ref<'first' | 'best' | 'worst'>('first')
const mallocSize = ref(32)
const freeId = ref<number | null>(null)
const animating = ref(false)
const speed = ref(5)
const statusMsg = ref('就绪 · 选择策略并开始分配')
const statusColor = ref('text-[var(--color-text-muted)]')
const allocCount = ref(0)
const freeCount = ref(0)

// Memory state
const cells = ref<Cell[]>(Array.from({ length: TOTAL_CELLS }, () => ({ type: 'free', blockId: null })))
const blocks = ref<Block[]>([])
let nextId = 0

const allocatedBlocks = computed(() => blocks.value.filter(b => !b.freed))

const freeList = computed((): FreeNode[] => {
  // Build free list from cells
  const result: FreeNode[] = []
  let i = 0
  while (i < TOTAL_CELLS) {
    if (cells.value[i].type === 'free' || cells.value[i].type === 'external-frag') {
      let start = i
      while (i < TOTAL_CELLS && (cells.value[i].type === 'free' || cells.value[i].type === 'external-frag')) i++
      const size = (i - start) * CELL_SIZE
      result.push({ offset: start * CELL_SIZE, size, prev: null, next: null })
    } else {
      i++
    }
  }
  // Link
  for (let j = 0; j < result.length; j++) {
    result[j].prev = j > 0 ? result[j - 1].offset : null
    result[j].next = j < result.length - 1 ? result[j + 1].offset : null
  }
  return result
})

const utilization = computed(() => {
  const used = cells.value.filter(c => c.type === 'allocated' || c.type === 'header' || c.type === 'padding').length
  return Math.round((used / TOTAL_CELLS) * 100)
})

const fragmentation = computed(() => {
  // External fragmentation: free cells that are too small to satisfy even 1 byte (less than header+1)
  const minAlloc = Math.ceil((HEADER_SIZE + 1) / CELL_SIZE)
  const freeRuns: number[] = []
  let i = 0
  while (i < TOTAL_CELLS) {
    if (cells.value[i].type === 'free') {
      let start = i
      while (i < TOTAL_CELLS && cells.value[i].type === 'free') i++
      freeRuns.push(i - start)
    } else i++
  }
  if (freeRuns.length === 0) return 0
  const externalFrag = freeRuns.filter(r => r < minAlloc).reduce((a, b) => a + b, 0)
  const totalFree = freeRuns.reduce((a, b) => a + b, 0)
  if (totalFree === 0) return 0
  return Math.round((externalFrag / TOTAL_CELLS) * 100)
})

function blockColor(id: number) {
  return BLOCK_COLORS[id % BLOCK_COLORS.length]
}

function cellClass(cell: Cell, _i: number) {
  const base = 'inline-block'
  switch (cell.type) {
    case 'free': return `${base} bg-[#1a1a2e] border border-gray-800`
    case 'header': return `${base} bg-purple-700 border border-purple-500`
    case 'allocated': return `${base} border border-transparent`
    case 'padding': return `${base} bg-yellow-600 border border-yellow-400 opacity-60`
    case 'external-frag': return `${base} bg-red-900 border border-red-700 opacity-50`
    case 'search': return `${base} bg-white border border-white opacity-90`
    default: return base
  }
}

// Override style for allocated cells with block color
function getAllocStyle(cell: Cell) {
  if (cell.type === 'allocated' && cell.blockId !== null) {
    return { backgroundColor: BLOCK_COLORS[cell.blockId % BLOCK_COLORS.length] + 'aa' }
  }
  return {}
}

// Find free runs
function getFreeRuns() {
  const runs: { start: number; len: number }[] = []
  let i = 0
  while (i < TOTAL_CELLS) {
    if (cells.value[i].type === 'free') {
      let start = i
      while (i < TOTAL_CELLS && cells.value[i].type === 'free') i++
      runs.push({ start, len: i - start })
    } else i++
  }
  return runs
}

const delay = () => new Promise(r => setTimeout(r, Math.round(600 / speed.value)))

async function doMalloc() {
  if (animating.value) return
  const reqBytes = mallocSize.value
  if (!reqBytes || reqBytes < 1) return
  animating.value = true

  const totalNeeded = reqBytes + HEADER_SIZE
  const cellsNeeded = Math.ceil(totalNeeded / CELL_SIZE)

  const runs = getFreeRuns()
  const eligible = runs.filter(r => r.len >= cellsNeeded)

  if (eligible.length === 0) {
    statusMsg.value = `❌ malloc(${reqBytes}) 失败 · 无足够连续空间`
    statusColor.value = 'text-red-400'
    animating.value = false
    return
  }

  let chosen: { start: number; len: number }
  if (strategy.value === 'first') {
    chosen = eligible[0]
  } else if (strategy.value === 'best') {
    chosen = eligible.reduce((a, b) => a.len < b.len ? a : b)
  } else {
    chosen = eligible.reduce((a, b) => a.len > b.len ? a : b)
  }

  // Animate search
  statusMsg.value = `🔍 ${strategy.value === 'first' ? 'First' : strategy.value === 'best' ? 'Best' : 'Worst'} Fit 搜索中...`
  statusColor.value = 'text-white'
  for (const run of runs) {
    for (let j = run.start; j < run.start + run.len; j++) {
      cells.value[j] = { type: 'search', blockId: null }
    }
    await delay()
    const isChosen = run.start === chosen.start
    if (!isChosen) {
      // restore to free
      for (let j = run.start; j < run.start + run.len; j++) {
        cells.value[j] = { type: 'free', blockId: null }
      }
    }
    if (strategy.value === 'first' && isChosen) break
  }

  await delay()

  // Allocate
  const id = nextId++
  const headerCells = Math.ceil(HEADER_SIZE / CELL_SIZE)
  const dataCells = cellsNeeded - headerCells
  const paddingBytes = cellsNeeded * CELL_SIZE - totalNeeded
  const paddingCells = Math.ceil(paddingBytes / CELL_SIZE)

  for (let j = chosen.start; j < chosen.start + headerCells; j++) {
    cells.value[j] = { type: 'header', blockId: id }
  }
  for (let j = chosen.start + headerCells; j < chosen.start + cellsNeeded - paddingCells; j++) {
    cells.value[j] = { type: 'allocated', blockId: id }
  }
  for (let j = chosen.start + cellsNeeded - paddingCells; j < chosen.start + cellsNeeded; j++) {
    cells.value[j] = { type: 'padding', blockId: id }
  }

  blocks.value.push({
    id,
    offset: chosen.start * CELL_SIZE,
    size: cellsNeeded * CELL_SIZE,
    reqSize: reqBytes,
    freed: false,
  })

  allocCount.value++
  statusMsg.value = `✅ malloc(${reqBytes}) → 块 #${id} @ offset ${chosen.start * CELL_SIZE}`
  statusColor.value = 'text-[var(--color-neon-green)]'
  animating.value = false
}

async function doFree() {
  if (animating.value) return
  const id = freeId.value
  if (id === null) return
  animating.value = true

  const block = blocks.value.find(b => b.id === id && !b.freed)
  if (!block) {
    statusMsg.value = `❌ free(#${id}) 失败 · 块不存在或已释放`
    statusColor.value = 'text-red-400'
    animating.value = false
    return
  }

  const startCell = block.offset / CELL_SIZE
  const endCell = startCell + block.size / CELL_SIZE

  // Animate free
  for (let j = startCell; j < endCell; j++) {
    cells.value[j] = { type: 'search', blockId: null }
  }
  await delay()

  block.freed = true
  for (let j = startCell; j < endCell; j++) {
    cells.value[j] = { type: 'free', blockId: null }
  }

  statusMsg.value = `🔗 尝试合并相邻空闲块...`
  statusColor.value = 'text-yellow-400'
  await delay()

  // Coalescing is automatic since we track by cells; already done
  freeCount.value++
  statusMsg.value = `✅ free(#${id}) 完成 · 已尝试合并`
  statusColor.value = 'text-[var(--color-neon-cyan)]'
  animating.value = false
}

async function runRandom() {
  if (animating.value) return
  const sizes = [16, 24, 32, 48, 64, 80]
  for (let i = 0; i < 5; i++) {
    mallocSize.value = sizes[Math.floor(Math.random() * sizes.length)]
    await doMalloc()
    await new Promise(r => setTimeout(r, 200))
  }
  // Free some
  const alive = blocks.value.filter(b => !b.freed)
  if (alive.length > 1) {
    freeId.value = alive[Math.floor(Math.random() * alive.length)].id
    await doFree()
  }
}

function resetMem() {
  cells.value = Array.from({ length: TOTAL_CELLS }, () => ({ type: 'free', blockId: null }))
  blocks.value = []
  nextId = 0
  allocCount.value = 0
  freeCount.value = 0
  statusMsg.value = '已重置'
  statusColor.value = 'text-[var(--color-text-muted)]'
}
</script>
