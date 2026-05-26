<template>
  <div class="min-h-screen bg-[var(--color-void)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'graph-theory' }]" />

    <div class="max-w-5xl mx-auto px-6 py-10">
      <h1 class="font-mono text-2xl font-bold mb-2" style="color:#b400ff;text-shadow:0 0 20px rgba(180,0,255,0.5)">图论可视化</h1>
      <p class="font-mono text-xs text-gray-500 mb-6">Graph Theory — BFS / DFS / Dijkstra / Bipartite / Topological Sort</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-3 mb-4 items-center">
        <div class="flex gap-2">
          <button
            v-for="algo in algos" :key="algo.key"
            @click="runAlgo(algo.key)"
            class="font-mono text-xs px-3 py-1.5 rounded border transition-all"
            :style="activeAlgo===algo.key ? 'border-color:#b400ff;color:#b400ff;background:rgba(180,0,255,0.1)' : 'border-color:rgba(255,255,255,0.15);color:#888'"
          >{{ algo.label }}</button>
        </div>

        <div class="flex gap-2 ml-auto">
          <button @click="toggleDirected" class="font-mono text-xs px-3 py-1.5 rounded border transition-all"
            :style="directed ? 'border-color:#00d4ff;color:#00d4ff' : 'border-color:rgba(255,255,255,0.15);color:#888'">
            {{ directed ? '有向图' : '无向图' }}
          </button>
          <button @click="clearGraph" class="font-mono text-xs px-3 py-1.5 rounded border border-red-800 text-red-400 hover:bg-red-900/20 transition-all">清空</button>
          <button @click="generateRandom" class="font-mono text-xs px-3 py-1.5 rounded border border-gray-700 text-gray-400 hover:text-white transition-all">随机图</button>
        </div>
      </div>

      <!-- Info bar -->
      <div class="flex gap-4 mb-3 font-mono text-[10px] text-gray-500">
        <span>点击空白 → 添加节点</span>
        <span>拖拽节点 → 移动</span>
        <span>点击两节点 → 连边</span>
        <span>右键节点 → 删除</span>
        <span v-if="statusMsg" class="text-cyan-400">{{ statusMsg }}</span>
      </div>

      <!-- Canvas -->
      <div class="rounded-2xl overflow-hidden border border-gray-800" style="background:#050508">
        <canvas
          ref="canvasEl"
          :width="CW" :height="CH"
          class="w-full block cursor-crosshair"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @contextmenu.prevent="onRightClick"
        />
      </div>

      <!-- Legend -->
      <div class="flex gap-6 mt-4 font-mono text-[10px]">
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full inline-block" style="background:#1a1a2e;border:2px solid #00d4ff"></span>默认</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full inline-block" style="background:#b400ff"></span>访问中</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full inline-block" style="background:#00ff88"></span>已访问</span>
        <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-full inline-block" style="background:#ff2d78"></span>路径</span>
        <span v-if="algoResult" class="text-yellow-400 ml-4">{{ algoResult }}</span>
      </div>
    </div>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `图论可视化 | ${siteName}` })

const CW = 900, CH = 480
const canvasEl = ref<HTMLCanvasElement | null>(null)
const directed = ref(false)
const activeAlgo = ref('')
const statusMsg = ref('点击空白处添加节点')
const algoResult = ref('')

interface Node { id: number; x: number; y: number; color: string; label: string }
interface Edge { from: number; to: number; weight: number; color: string }

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
let nextId = 0

// Interaction state
let dragging: Node | null = null
let selected: Node | null = null
let dragOffset = { x: 0, y: 0 }
let animTimeout = 0

const algos = [
  { key: 'bfs', label: 'BFS' },
  { key: 'dfs', label: 'DFS' },
  { key: 'dijkstra', label: 'Dijkstra' },
  { key: 'connected', label: '连通性' },
  { key: 'bipartite', label: '二部图' },
  { key: 'topo', label: '拓扑排序' },
]

const R = 20

function nodeAt(x: number, y: number): Node | null {
  for (let i = nodes.value.length - 1; i >= 0; i--) {
    const n = nodes.value[i]
    if (Math.hypot(n.x - x, n.y - y) < R) return n
  }
  return null
}

function getPos(e: MouseEvent) {
  const rect = canvasEl.value!.getBoundingClientRect()
  const scaleX = CW / rect.width, scaleY = CH / rect.height
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
}

function onMouseDown(e: MouseEvent) {
  const { x, y } = getPos(e)
  const hit = nodeAt(x, y)
  if (hit) {
    dragging = hit
    dragOffset = { x: x - hit.x, y: y - hit.y }
  }
}

function onMouseMove(e: MouseEvent) {
  if (!dragging) return
  const { x, y } = getPos(e)
  dragging.x = x - dragOffset.x
  dragging.y = y - dragOffset.y
  render()
}

function onMouseUp(e: MouseEvent) {
  const { x, y } = getPos(e)
  const hit = nodeAt(x, y)

  if (dragging && Math.hypot(dragging.x - (x - dragOffset.x), dragging.y - (y - dragOffset.y)) < 3) {
    // It was a click, not drag
    if (selected && selected !== hit) {
      // Connect
      const a = selected, b = hit!
      const exists = edges.value.some(e => e.from === a.id && e.to === b.id)
      if (!exists) {
        edges.value.push({ from: a.id, to: b.id, weight: 1, color: 'rgba(255,255,255,0.4)' })
        if (!directed.value) edges.value.push({ from: b.id, to: a.id, weight: 1, color: 'rgba(255,255,255,0.4)' })
      }
      selected.color = '#1a1a2e'
      selected = null
      statusMsg.value = '连边完成'
    } else if (hit) {
      selected = hit
      hit.color = 'rgba(0,212,255,0.5)'
      statusMsg.value = '选中节点，再点另一个节点连边'
    } else {
      // New node
      if (selected) { selected.color = '#1a1a2e'; selected = null }
      nodes.value.push({ id: nextId++, x, y, color: '#1a1a2e', label: String(nodes.value.length) })
      statusMsg.value = `已添加节点 ${nodes.value.length - 1}`
    }
  }

  dragging = null
  render()
}

function onRightClick(e: MouseEvent) {
  const { x, y } = getPos(e)
  const hit = nodeAt(x, y)
  if (!hit) return
  edges.value = edges.value.filter(ed => ed.from !== hit.id && ed.to !== hit.id)
  nodes.value = nodes.value.filter(n => n.id !== hit.id)
  if (selected?.id === hit.id) selected = null
  // Re-label
  nodes.value.forEach((n, i) => n.label = String(i))
  statusMsg.value = '已删除节点'
  render()
}

function toggleDirected() {
  directed.value = !directed.value
  render()
}

function clearGraph() {
  clearAnimations()
  nodes.value = []; edges.value = []; nextId = 0; selected = null; algoResult.value = ''; statusMsg.value = '已清空'
  render()
}

function generateRandom() {
  clearGraph()
  const n = 7
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2
    nodes.value.push({ id: nextId++, x: CW/2 + Math.cos(angle)*160, y: CH/2 + Math.sin(angle)*140, color: '#1a1a2e', label: String(i) })
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    edges.value.push({ from: i, to: j, weight: 1, color: 'rgba(255,255,255,0.4)' })
    if (!directed.value) edges.value.push({ from: j, to: i, weight: 1, color: 'rgba(255,255,255,0.4)' })
  }
  // Extra edges
  edges.value.push({ from: 0, to: 3, weight: 1, color: 'rgba(255,255,255,0.4)' })
  if (!directed.value) edges.value.push({ from: 3, to: 0, weight: 1, color: 'rgba(255,255,255,0.4)' })
  render()
}

function clearAnimations() {
  clearTimeout(animTimeout)
  edges.value.forEach(e => e.color = 'rgba(255,255,255,0.4)')
  nodes.value.forEach(n => n.color = '#1a1a2e')
  selected = null
  algoResult.value = ''
}

// ---- Algorithms ----

function adjacency(id: number) {
  return edges.value.filter(e => e.from === id).map(e => e.to)
}

function animateSteps(steps: Array<() => void>, delay = 400) {
  let i = 0
  function next() {
    if (i >= steps.length) return
    steps[i++]()
    render()
    animTimeout = window.setTimeout(next, delay)
  }
  next()
}

function runAlgo(key: string) {
  if (nodes.value.length === 0) { statusMsg.value = '请先添加节点'; return }
  clearAnimations()
  activeAlgo.value = key
  const start = nodes.value[0]

  if (key === 'bfs') {
    const steps: Array<() => void> = []
    const visited = new Set<number>()
    const queue = [start.id]
    visited.add(start.id)
    while (queue.length) {
      const cur = queue.shift()!
      const node = nodes.value.find(n => n.id === cur)!
      steps.push(() => { node.color = '#b400ff' })
      steps.push(() => { node.color = '#00ff88' })
      for (const nb of adjacency(cur)) {
        if (!visited.has(nb)) {
          visited.add(nb)
          queue.push(nb)
          const edge = edges.value.find(e => e.from === cur && e.to === nb)
          if (edge) steps.push(() => { edge.color = '#00ff88' })
        }
      }
    }
    animateSteps(steps)
    statusMsg.value = 'BFS 遍历'
  }

  if (key === 'dfs') {
    const steps: Array<() => void> = []
    const visited = new Set<number>()
    function dfs(id: number) {
      if (visited.has(id)) return
      visited.add(id)
      const node = nodes.value.find(n => n.id === id)!
      steps.push(() => { node.color = '#b400ff' })
      steps.push(() => { node.color = '#00ff88' })
      for (const nb of adjacency(id)) {
        if (!visited.has(nb)) {
          const edge = edges.value.find(e => e.from === id && e.to === nb)
          if (edge) steps.push(() => { edge.color = '#00ff88' })
          dfs(nb)
        }
      }
    }
    dfs(start.id)
    animateSteps(steps)
    statusMsg.value = 'DFS 遍历'
  }

  if (key === 'dijkstra') {
    const dist: Record<number, number> = {}
    const prev: Record<number, number | null> = {}
    nodes.value.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null })
    dist[start.id] = 0
    const unvisited = new Set(nodes.value.map(n => n.id))
    while (unvisited.size) {
      let u = -1
      unvisited.forEach(id => { if (u === -1 || dist[id] < dist[u]) u = id })
      if (dist[u] === Infinity) break
      unvisited.delete(u)
      for (const edge of edges.value.filter(e => e.from === u)) {
        const alt = dist[u] + edge.weight
        if (alt < dist[edge.to]) { dist[edge.to] = alt; prev[edge.to] = u }
      }
    }
    // Animate path to last node
    const target = nodes.value[nodes.value.length - 1]
    const path: number[] = []
    let cur: number | null = target.id
    while (cur !== null) { path.unshift(cur); cur = prev[cur] }
    const steps: Array<() => void> = []
    if (path[0] !== start.id) {
      algoResult.value = '无路径'
    } else {
      algoResult.value = `最短距离: ${dist[target.id]}`
      path.forEach(id => {
        const n = nodes.value.find(n => n.id === id)!
        steps.push(() => { n.color = '#ff2d78' })
      })
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i+1]
        const edge = edges.value.find(e => e.from === a && e.to === b)
        if (edge) steps.push(() => { edge.color = '#ff2d78' })
      }
    }
    animateSteps(steps, 300)
    statusMsg.value = 'Dijkstra 最短路径'
  }

  if (key === 'connected') {
    const visited = new Set<number>()
    function dfsVisit(id: number) {
      if (visited.has(id)) return
      visited.add(id)
      // Both directions for connectivity
      edges.value.filter(e => e.from === id || (!directed.value && e.to === id)).forEach(e => {
        const nb = e.from === id ? e.to : e.from
        dfsVisit(nb)
      })
    }
    dfsVisit(start.id)
    const isConnected = visited.size === nodes.value.length
    const steps: Array<() => void> = []
    nodes.value.forEach(n => {
      if (visited.has(n.id)) steps.push(() => { n.color = '#00ff88' })
      else steps.push(() => { n.color = '#ff2d78' })
    })
    animateSteps(steps, 150)
    algoResult.value = isConnected ? '✓ 图是连通的' : `✗ 不连通，仅可达 ${visited.size}/${nodes.value.length} 个节点`
    statusMsg.value = '连通性检测'
  }

  if (key === 'bipartite') {
    const color: Record<number, number> = {}
    let isBipartite = true
    const steps: Array<() => void> = []
    const queue = [start.id]
    color[start.id] = 0
    while (queue.length && isBipartite) {
      const cur = queue.shift()!
      for (const nb of adjacency(cur)) {
        if (color[nb] === undefined) {
          color[nb] = 1 - color[cur]
          queue.push(nb)
        } else if (color[nb] === color[cur]) {
          isBipartite = false
        }
      }
    }
    nodes.value.forEach(n => {
      const c = color[n.id] === 0 ? '#00d4ff' : color[n.id] === 1 ? '#b400ff' : '#666'
      steps.push(() => { n.color = c })
    })
    animateSteps(steps, 150)
    algoResult.value = isBipartite ? '✓ 是二部图' : '✗ 不是二部图'
    statusMsg.value = '二部图检测'
  }

  if (key === 'topo') {
    // Kahn's algorithm
    const inDeg: Record<number, number> = {}
    nodes.value.forEach(n => inDeg[n.id] = 0)
    edges.value.forEach(e => inDeg[e.to] = (inDeg[e.to] || 0) + 1)
    const queue = nodes.value.filter(n => inDeg[n.id] === 0).map(n => n.id)
    const order: number[] = []
    const steps: Array<() => void> = []
    while (queue.length) {
      const cur = queue.shift()!
      order.push(cur)
      const node = nodes.value.find(n => n.id === cur)!
      const idx = order.length
      steps.push(() => {
        node.color = '#00ff88'
        node.label = String(idx)
      })
      for (const nb of adjacency(cur)) {
        inDeg[nb]--
        if (inDeg[nb] === 0) queue.push(nb)
      }
    }
    if (order.length < nodes.value.length) {
      algoResult.value = '✗ 有环，无拓扑排序'
    } else {
      algoResult.value = '✓ 拓扑排序完成'
    }
    animateSteps(steps, 400)
    statusMsg.value = '拓扑排序（有向无环图）'
  }
}

// ---- Render ----

function render() {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#050508'
  ctx.fillRect(0, 0, CW, CH)

  // Draw edges
  for (const edge of edges.value) {
    const a = nodes.value.find(n => n.id === edge.from)
    const b = nodes.value.find(n => n.id === edge.to)
    if (!a || !b) continue

    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = edge.color
    ctx.lineWidth = 2
    ctx.shadowColor = edge.color
    ctx.shadowBlur = edge.color !== 'rgba(255,255,255,0.4)' ? 8 : 0
    ctx.stroke()

    if (directed.value) {
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      const ex = b.x - Math.cos(angle) * (R + 4)
      const ey = b.y - Math.sin(angle) * (R + 4)
      ctx.beginPath()
      ctx.moveTo(ex, ey)
      ctx.lineTo(ex - Math.cos(angle - 0.4) * 12, ey - Math.sin(angle - 0.4) * 12)
      ctx.lineTo(ex - Math.cos(angle + 0.4) * 12, ey - Math.sin(angle + 0.4) * 12)
      ctx.closePath()
      ctx.fillStyle = edge.color
      ctx.fill()
    }
  }
  ctx.shadowBlur = 0

  // Draw nodes
  for (const node of nodes.value) {
    ctx.beginPath()
    ctx.arc(node.x, node.y, R, 0, Math.PI * 2)
    ctx.fillStyle = node.color
    ctx.fill()
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 2
    ctx.shadowColor = '#00d4ff'
    ctx.shadowBlur = node.color !== '#1a1a2e' ? 12 : 4
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#fff'
    ctx.font = `bold 11px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(node.label, node.x, node.y)
  }
}

onMounted(() => {
  render()
})

onUnmounted(() => {
  clearTimeout(animTimeout)
})
</script>
