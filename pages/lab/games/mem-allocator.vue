<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'mem-allocator' }]" />

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
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">malloc(size) 1-120</label>
          <div class="flex gap-2">
            <input v-model.number="mallocSize" type="number" min="1" max="120" placeholder="bytes"
              class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-primary)] px-3 py-2 rounded w-24" />
            <button @click="doMalloc" :disabled="animating"
              class="font-mono text-sm px-4 py-2 rounded border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan)] hover:text-black transition-colors disabled:opacity-40">
              malloc
            </button>
          </div>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">free(id)</label>
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
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">速度 {{ speed }}x</label>
          <input type="range" min="0.5" max="4" step="0.5" v-model.number="speed" class="w-24" />
        </div>
      </div>

      <!-- Status message -->
      <div class="font-mono text-sm mb-4 h-6">
        <span :class="statusColor">{{ statusMsg }}</span>
      </div>

      <!-- Memory visualization -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 mb-6">
        <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">堆内存 ({{ TOTAL_BYTES }} bytes)</div>
        <!-- Memory bar -->
        <div class="relative w-full h-14 flex rounded overflow-hidden border border-[var(--color-void-border)]"
             @mouseleave="tooltip = null">
          <div
            v-for="block in blocks"
            :key="block.id + '-' + block.free"
            class="relative h-full flex-shrink-0 transition-all duration-200 overflow-hidden cursor-pointer"
            :style="blockStyle(block)"
            @mouseenter="tooltip = block"
          >
            <!-- Header section -->
            <div class="absolute left-0 top-0 bottom-0" :style="{ width: headerWidthPct(block) + '%' }"
                 style="background: rgba(180,0,255,0.55); border-right: 1px solid rgba(180,0,255,0.8);">
            </div>
            <!-- Internal frag overlay -->
            <div v-if="!block.free && internalFrag(block) > 0"
                 class="absolute right-0 top-0 bottom-0"
                 :style="{ width: fragWidthPct(block) + '%', background: 'repeating-linear-gradient(45deg, rgba(234,179,8,0.35) 0px, rgba(234,179,8,0.35) 4px, transparent 4px, transparent 8px)' }">
            </div>
            <!-- Search highlight overlay -->
            <div v-if="searchHighlight === block.start"
                 class="absolute inset-0 animate-pulse"
                 style="background: rgba(255,255,255,0.35); border: 1px solid white;">
            </div>
            <!-- Label -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span v-if="blockPxWidth(block) > 30" class="font-mono text-xs drop-shadow select-none"
                    :style="{ color: block.free ? 'rgba(255,255,255,0.5)' : 'white', fontSize: '10px' }">
                {{ block.free ? block.size + 'B' : '#' + block.id }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tooltip -->
        <div v-if="tooltip" class="mt-2 font-mono text-xs bg-[#0a0a14] border border-[var(--color-void-border)] rounded px-3 py-2 inline-block">
          <span class="text-[var(--color-text-muted)]">
            {{ tooltip.free ? '空闲块' : `块 #${tooltip.id}` }}
            · start={{ tooltip.start }}
            · size={{ tooltip.size }}B
            <template v-if="!tooltip.free">
              · data={{ tooltip.dataSize }}B
              · frag={{ internalFrag(tooltip) }}B
            </template>
          </span>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-4 mt-3 font-mono text-xs text-[var(--color-text-muted)]">
          <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.3)"></span>空闲</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-purple-600 mr-1"></span>Header</span>
          <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:hsl(47,80%,55%)"></span>已分配</span>
          <span><span class="inline-block w-3 h-3 rounded-sm mr-1" style="background:repeating-linear-gradient(45deg,rgba(234,179,8,0.6) 0px,rgba(234,179,8,0.6) 4px,transparent 4px,transparent 8px)"></span>内部碎片</span>
          <span><span class="inline-block w-3 h-3 rounded-sm bg-white mr-1" style="opacity:0.9"></span>搜索中</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Free list -->
        <div class="lg:col-span-1 bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4">
          <div class="font-mono text-xs text-[var(--color-text-muted)] mb-3">空闲链表 (Free List)</div>
          <div v-if="freeBlocks.length === 0" class="font-mono text-xs text-[var(--color-text-muted)] italic">链表为空</div>
          <div class="space-y-2">
            <div v-for="(node, i) in freeBlocks" :key="node.start">
              <div class="font-mono text-xs border border-[var(--color-void-border)] rounded p-2 bg-[#0a0a14]">
                <div class="text-[var(--color-neon-green)]">[ offset: {{ node.start }} ]</div>
                <div class="text-[var(--color-text-muted)]">size: {{ node.size }} bytes</div>
                <div class="text-[var(--color-text-muted)]">usable: {{ node.size - HEADER }} bytes</div>
              </div>
              <div v-if="i < freeBlocks.length - 1" class="text-[var(--color-text-muted)] text-center font-mono text-sm">↓</div>
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
                <div class="font-mono text-xl text-[var(--color-neon-cyan)]">{{ stats.utilization }}%</div>
                <div class="font-mono text-xs text-[var(--color-text-muted)]">内存利用率</div>
              </div>
              <div>
                <div class="font-mono text-xl" :class="stats.fragRatio > 0.8 ? 'text-red-400' : 'text-yellow-400'">
                  {{ stats.fragPct }}%
                </div>
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
            <div v-if="oomCount > 0" class="mt-2 font-mono text-xs text-red-400">OOM 次数: {{ oomCount }}</div>
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
                  <th class="text-left pb-1">data</th>
                  <th class="text-left pb-1">total</th>
                  <th class="text-left pb-1">内部碎片</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in allocatedBlocks" :key="b.id" :style="{ color: blockColor(b.id) }">
                  <td class="py-0.5">#{{ b.id }}</td>
                  <td>{{ b.start }}</td>
                  <td>{{ b.dataSize }}B</td>
                  <td>{{ b.size }}B</td>
                  <td class="text-yellow-500">{{ internalFrag(b) }}B</td>
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
const HEADER = 8  // header overhead per block

interface MemBlock {
  id: number      // -1 for free blocks
  start: number   // byte offset
  size: number    // total size (incl header)
  dataSize: number // user requested size
  free: boolean
  color?: string
}

const strategy = ref<'first' | 'best' | 'worst'>('first')
const mallocSize = ref(32)
const freeId = ref<number | null>(null)
const animating = ref(false)
const speed = ref(2)
const statusMsg = ref('就绪 · 选择策略并开始分配')
const statusColor = ref('text-[var(--color-text-muted)]')
const allocCount = ref(0)
const freeCount = ref(0)
const oomCount = ref(0)
const searchHighlight = ref(-1)
const tooltip = ref<MemBlock | null>(null)

let nextId = 0
let animCancel = false

const blocks = ref<MemBlock[]>([
  { id: -1, start: 0, size: TOTAL_BYTES, dataSize: 0, free: true }
])

const freeBlocks = computed(() => blocks.value.filter(b => b.free))
const allocatedBlocks = computed(() => blocks.value.filter(b => !b.free))

const stats = computed(() => {
  const totalFree = freeBlocks.value.reduce((s, b) => s + b.size, 0)
  const totalAlloc = allocatedBlocks.value.reduce((s, b) => s + b.size, 0)
  const utilization = Math.round((totalAlloc / TOTAL_BYTES) * 100)

  const freeSizes = freeBlocks.value.map(b => b.size)
  const maxFree = freeSizes.length ? Math.max(...freeSizes) : 0
  const fragRatio = totalFree > 0 ? maxFree / totalFree : 1
  const fragPct = totalFree > 0 ? Math.round((1 - fragRatio) * 100) : 0

  return { utilization, fragRatio, fragPct }
})

function internalFrag(b: MemBlock) {
  if (b.free) return 0
  return b.size - HEADER - b.dataSize
}

function blockColor(id: number) {
  return `hsl(${(id * 47) % 360}, 80%, 55%)`
}

function blockStyle(b: MemBlock) {
  const widthPct = (b.size / TOTAL_BYTES) * 100
  if (b.free) {
    return {
      width: widthPct + '%',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.15)',
    }
  }
  return {
    width: widthPct + '%',
    background: blockColor(b.id) + '33',
    border: `1px solid ${blockColor(b.id)}88`,
  }
}

function headerWidthPct(b: MemBlock) {
  return (HEADER / b.size) * 100
}

function fragWidthPct(b: MemBlock) {
  const frag = internalFrag(b)
  return frag > 0 ? (frag / b.size) * 100 : 0
}

function blockPxWidth(b: MemBlock) {
  // estimate pixel width (rough)
  return (b.size / TOTAL_BYTES) * 800
}

function sleep(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

function coalesce() {
  let i = 0
  while (i < blocks.value.length - 1) {
    if (blocks.value[i].free && blocks.value[i + 1].free) {
      blocks.value[i].size += blocks.value[i + 1].size
      blocks.value.splice(i + 1, 1)
    } else {
      i++
    }
  }
}

async function doMalloc() {
  if (animating.value) return
  const reqSize = mallocSize.value
  if (!reqSize || reqSize < 1 || reqSize > 120) return

  animating.value = true
  animCancel = false
  const total = reqSize + HEADER

  const candidates = blocks.value.filter(b => b.free && b.size >= total)
  if (candidates.length === 0) {
    statusMsg.value = `❌ malloc(${reqSize}) OOM · 无足够连续空间`
    statusColor.value = 'text-red-400'
    oomCount.value++
    animating.value = false
    return
  }

  let target: MemBlock
  if (strategy.value === 'first') {
    target = candidates[0]
  } else if (strategy.value === 'best') {
    target = candidates.reduce((a, b) => a.size < b.size ? a : b)
  } else {
    target = candidates.reduce((a, b) => a.size > b.size ? a : b)
  }

  // Search animation: highlight each free block being examined
  const stratLabel = strategy.value === 'first' ? 'First' : strategy.value === 'best' ? 'Best' : 'Worst'
  statusMsg.value = `🔍 ${stratLabel} Fit 搜索中...`
  statusColor.value = 'text-white'

  const freeOnly = blocks.value.filter(b => b.free)
  for (const b of freeOnly) {
    if (animCancel) break
    searchHighlight.value = b.start
    await sleep(50 / speed.value)
    if (b === target) break
    searchHighlight.value = -1
  }
  searchHighlight.value = -1

  if (animCancel) { animating.value = false; return }

  await sleep(120 / speed.value)

  // Find target index in blocks array
  const idx = blocks.value.indexOf(target)
  if (idx === -1) { animating.value = false; return }

  const remaining = target.size - total
  const id = nextId++

  if (remaining > HEADER + 1) {
    // Split
    const newFree: MemBlock = {
      id: -1,
      start: target.start + total,
      size: remaining,
      dataSize: 0,
      free: true,
    }
    blocks.value[idx] = {
      id,
      start: target.start,
      size: total,
      dataSize: reqSize,
      free: false,
    }
    blocks.value.splice(idx + 1, 0, newFree)
  } else {
    // Internal fragmentation: use whole block
    blocks.value[idx] = {
      id,
      start: target.start,
      size: target.size,
      dataSize: reqSize,
      free: false,
    }
  }

  allocCount.value++
  statusMsg.value = `✅ malloc(${reqSize}) → 块 #${id} @ offset ${blocks.value[idx].start}`
  statusColor.value = 'text-[var(--color-neon-green)]'
  animating.value = false
}

async function doFree() {
  if (animating.value) return
  const id = freeId.value
  if (id === null) return

  animating.value = true
  const block = blocks.value.find(b => b.id === id && !b.free)
  if (!block) {
    statusMsg.value = `❌ free(#${id}) 失败 · 块不存在或已释放`
    statusColor.value = 'text-red-400'
    animating.value = false
    return
  }

  // Flash the block before freeing
  searchHighlight.value = block.start
  await sleep(200 / speed.value)
  searchHighlight.value = -1

  block.free = true
  block.id = -1
  block.dataSize = 0

  statusMsg.value = `🔗 合并相邻空闲块...`
  statusColor.value = 'text-yellow-400'
  await sleep(150 / speed.value)

  coalesce()

  freeCount.value++
  statusMsg.value = `✅ free(#${id}) 完成`
  statusColor.value = 'text-[var(--color-neon-cyan)]'
  animating.value = false
}

async function runRandom() {
  if (animating.value) return
  const sizes = [16, 24, 32, 48, 64, 80]
  for (let i = 0; i < 6; i++) {
    mallocSize.value = sizes[Math.floor(Math.random() * sizes.length)]
    await doMalloc()
    await sleep(150)
  }
  // Free some random allocated blocks
  const alive = blocks.value.filter(b => !b.free)
  const toFree = alive.slice(0, Math.ceil(alive.length / 2))
  for (const b of toFree) {
    freeId.value = b.id
    await doFree()
    await sleep(100)
  }
  // Allocate again to show coalescing effect
  mallocSize.value = sizes[Math.floor(Math.random() * sizes.length)]
  await doMalloc()
}

function resetMem() {
  animCancel = true
  blocks.value = [{ id: -1, start: 0, size: TOTAL_BYTES, dataSize: 0, free: true }]
  nextId = 0
  allocCount.value = 0
  freeCount.value = 0
  oomCount.value = 0
  searchHighlight.value = -1
  tooltip.value = null
  statusMsg.value = '已重置'
  statusColor.value = 'text-[var(--color-text-muted)]'
  setTimeout(() => { animating.value = false }, 50)
}
</script>
