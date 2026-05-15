<template>
  <div class="pathfinding-page">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'Pathfinding' }]" />

    <main class="content">
      <div class="header">
        <h1 class="title">
          <span class="neon-green">PATH</span><span class="neon-purple">FINDING</span>
          <span class="cursor">_</span>
        </h1>
        <p class="subtitle">// visualize search algorithms on a grid</p>
      </div>

      <div class="controls">
        <div class="control-group">
          <label class="label">ALGORITHM</label>
          <div class="algo-buttons">
            <button
              v-for="algo in algorithms"
              :key="algo.id"
              class="algo-btn"
              :class="{ active: selectedAlgo === algo.id }"
              @click="selectedAlgo = algo.id"
            >{{ algo.name }}</button>
          </div>
        </div>

        <div class="control-group">
          <label class="label">MODE</label>
          <div class="algo-buttons">
            <button
              class="algo-btn"
              :class="{ active: drawMode === 'wall' }"
              @click="drawMode = 'wall'"
            >WALL</button>
            <button
              class="algo-btn"
              :class="{ active: drawMode === 'start' }"
              @click="drawMode = 'start'"
            >START</button>
            <button
              class="algo-btn"
              :class="{ active: drawMode === 'end' }"
              @click="drawMode = 'end'"
            >END</button>
          </div>
        </div>

        <div class="control-group">
          <label class="label">MOVEMENT</label>
          <div class="algo-buttons">
            <button
              class="algo-btn"
              :class="{ active: !diagonal }"
              @click="diagonal = false"
            >4-DIR</button>
            <button
              class="algo-btn"
              :class="{ active: diagonal }"
              @click="diagonal = true"
            >8-DIR</button>
          </div>
        </div>

        <div class="control-group">
          <label class="label">SPEED</label>
          <div class="speed-control">
            <input
              type="range"
              min="1"
              max="20"
              v-model.number="animSpeed"
              class="speed-slider"
            />
            <span class="speed-val neon-cyan">{{ animSpeed }}</span>
          </div>
        </div>

        <div class="control-group">
          <label class="label">ACTIONS</label>
          <div class="algo-buttons">
            <button class="action-btn run" @click="runAlgorithm" :disabled="isRunning">
              {{ isRunning ? 'RUNNING...' : '▶ RUN' }}
            </button>
            <button class="action-btn" @click="generateMaze" :disabled="isRunning">MAZE</button>
            <button class="action-btn" @click="clearWalls" :disabled="isRunning">CLEAR WALLS</button>
            <button class="action-btn reset" @click="resetGrid" :disabled="isRunning">RESET</button>
          </div>
        </div>
      </div>

      <div class="stats" v-if="stats.time !== null">
        <div class="stat">
          <span class="stat-label">TIME</span>
          <span class="stat-value neon-cyan">{{ stats.time }}ms</span>
        </div>
        <div class="stat">
          <span class="stat-label">VISITED</span>
          <span class="stat-value neon-purple">{{ stats.visited }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">PATH LENGTH</span>
          <span class="stat-value neon-green">{{ stats.pathLength ?? '—' }}</span>
        </div>
      </div>

      <div class="canvas-wrapper">
        <canvas
          ref="canvasRef"
          :width="COLS * CELL"
          :height="ROWS * CELL"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          @mouseleave="onMouseUp"
          @contextmenu.prevent
        />
      </div>

      <div class="legend">
        <div class="legend-item" v-for="item in legend" :key="item.label">
          <span class="legend-swatch" :style="{ background: item.color }"></span>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const { siteName } = useSiteConfig()
useSeoMeta({ title: 'Pathfinding — Lab' })

const COLS = 30
const ROWS = 20
const CELL = 28

type CellState = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path'

// ── MinHeap ───────────────────────────────────────────────────────────────────
class MinHeap<T> {
  private data: { priority: number; item: T }[] = []
  push(item: T, priority: number) {
    this.data.push({ priority, item })
    this._bubbleUp(this.data.length - 1)
  }
  pop(): T | undefined {
    const top = this.data[0]
    const last = this.data.pop()!
    if (this.data.length > 0) {
      this.data[0] = last
      this._sinkDown(0)
    }
    return top?.item
  }
  get size() { return this.data.length }
  private _bubbleUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.data[p].priority <= this.data[i].priority) break
      ;[this.data[p], this.data[i]] = [this.data[i], this.data[p]]
      i = p
    }
  }
  private _sinkDown(i: number) {
    const n = this.data.length
    while (true) {
      let min = i
      const l = 2 * i + 1, r = 2 * i + 2
      if (l < n && this.data[l].priority < this.data[min].priority) min = l
      if (r < n && this.data[r].priority < this.data[min].priority) min = r
      if (min === i) break
      ;[this.data[min], this.data[i]] = [this.data[i], this.data[min]]
      i = min
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isRunning = ref(false)
const drawMode = ref<'wall' | 'start' | 'end'>('wall')
const selectedAlgo = ref<'astar' | 'bfs' | 'dfs' | 'dijkstra' | 'greedy'>('astar')
const isMouseDown = ref(false)
const eraseMode = ref(false)
const animSpeed = ref(4)
const diagonal = ref(false)

const stats = ref<{ time: number | null; visited: number; pathLength: number | null }>({
  time: null, visited: 0, pathLength: null
})

const algorithms = [
  { id: 'astar', name: 'A*' },
  { id: 'greedy', name: 'Greedy' },
  { id: 'dijkstra', name: 'Dijkstra' },
  { id: 'bfs', name: 'BFS' },
  { id: 'dfs', name: 'DFS' },
]

const legend = [
  { label: 'Empty', color: '#0f0f1a' },
  { label: 'Wall', color: '#1a1a2e' },
  { label: 'Start', color: '#00ff88' },
  { label: 'End', color: '#ff2d78' },
  { label: 'Visited', color: 'rgba(0,212,255,0.5)' },
  { label: 'Path', color: '#b400ff' },
]

// Grid state
const grid = ref<CellState[][]>(
  Array.from({ length: ROWS }, () => Array(COLS).fill('empty') as CellState[])
)
let startPos = { r: 10, c: 5 }
let endPos = { r: 10, c: 24 }

function initGrid() {
  grid.value = Array.from({ length: ROWS }, () => Array(COLS).fill('empty') as CellState[])
  grid.value[startPos.r][startPos.c] = 'start'
  grid.value[endPos.r][endPos.c] = 'end'
}

// Drawing
function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const state = grid.value[r][c]
      const x = c * CELL
      const y = r * CELL

      if (state === 'wall') {
        ctx.fillStyle = '#1a1a2e'
      } else if (state === 'start') {
        ctx.fillStyle = '#00ff88'
      } else if (state === 'end') {
        ctx.fillStyle = '#ff2d78'
      } else if (state === 'path') {
        ctx.fillStyle = '#b400ff'
      } else if (state === 'visited') {
        ctx.fillStyle = 'rgba(0,212,255,0.3)'
      } else {
        ctx.fillStyle = '#0f0f1a'
      }
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2)

      if (state === 'start') {
        ctx.fillStyle = '#0a0a0f'
        ctx.font = `bold ${CELL * 0.55}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('S', x + CELL / 2, y + CELL / 2)
      } else if (state === 'end') {
        ctx.fillStyle = '#0a0a0f'
        ctx.font = `bold ${CELL * 0.55}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('E', x + CELL / 2, y + CELL / 2)
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, CELL, CELL)
    }
  }
}

// Mouse interaction
function getCell(e: MouseEvent) {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const c = Math.floor(x / CELL)
  const r = Math.floor(y / CELL)
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null
  return { r, c }
}

function applyCell(r: number, c: number, erase: boolean) {
  const cur = grid.value[r][c]
  if (drawMode.value === 'wall') {
    if (cur === 'start' || cur === 'end') return
    grid.value[r][c] = erase ? 'empty' : 'wall'
  } else if (drawMode.value === 'start') {
    if (cur === 'end') return
    grid.value[startPos.r][startPos.c] = 'empty'
    startPos = { r, c }
    grid.value[r][c] = 'start'
  } else if (drawMode.value === 'end') {
    if (cur === 'start') return
    grid.value[endPos.r][endPos.c] = 'empty'
    endPos = { r, c }
    grid.value[r][c] = 'end'
  }
  draw()
}

function onMouseDown(e: MouseEvent) {
  if (isRunning.value) return
  isMouseDown.value = true
  const cell = getCell(e)
  if (!cell) return
  eraseMode.value = grid.value[cell.r][cell.c] === 'wall' && drawMode.value === 'wall'
  applyCell(cell.r, cell.c, eraseMode.value)
}

function onMouseMove(e: MouseEvent) {
  if (!isMouseDown.value || isRunning.value) return
  const cell = getCell(e)
  if (!cell) return
  applyCell(cell.r, cell.c, eraseMode.value)
}

function onMouseUp() {
  isMouseDown.value = false
}

// Algorithms
type Pos = { r: number; c: number }

function neighbors(r: number, c: number): Pos[] {
  const dirs4 = [[-1,0],[1,0],[0,-1],[0,1]]
  const dirs8 = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
  const dirs = diagonal.value ? dirs8 : dirs4
  return dirs
    .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
    .filter(p => p.r >= 0 && p.r < ROWS && p.c >= 0 && p.c < COLS && grid.value[p.r][p.c] !== 'wall')
}

function moveCost(from: Pos, to: Pos) {
  return from.r !== to.r && from.c !== to.c ? 1.414 : 1
}

function heuristic(a: Pos, b: Pos) {
  if (diagonal.value) {
    // Octile distance for 8-dir
    const dr = Math.abs(a.r - b.r)
    const dc = Math.abs(a.c - b.c)
    return Math.max(dr, dc) + (1.414 - 1) * Math.min(dr, dc)
  }
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c)
}

function bfsSearch(): { visited: Pos[]; path: Pos[] } {
  const queue: Pos[] = [startPos]
  const prev = new Map<string, Pos | null>()
  const key = (p: Pos) => `${p.r},${p.c}`
  prev.set(key(startPos), null)
  const visited: Pos[] = []

  while (queue.length) {
    const cur = queue.shift()!
    visited.push(cur)
    if (cur.r === endPos.r && cur.c === endPos.c) break
    for (const nb of neighbors(cur.r, cur.c)) {
      if (!prev.has(key(nb))) {
        prev.set(key(nb), cur)
        queue.push(nb)
      }
    }
  }

  const path: Pos[] = []
  let cur: Pos | null | undefined = endPos
  while (cur) {
    path.unshift(cur)
    cur = prev.get(`${cur.r},${cur.c}`)
    if (cur && cur.r === startPos.r && cur.c === startPos.c) break
  }
  if (prev.has(`${endPos.r},${endPos.c}`)) return { visited, path }
  return { visited, path: [] }
}

function dfsSearch(): { visited: Pos[]; path: Pos[] } {
  const stack: Pos[] = [startPos]
  const prev = new Map<string, Pos | null>()
  const key = (p: Pos) => `${p.r},${p.c}`
  prev.set(key(startPos), null)
  const visited: Pos[] = []
  let found = false

  while (stack.length) {
    const cur = stack.pop()!
    if (visited.some(v => v.r === cur.r && v.c === cur.c)) continue
    visited.push(cur)
    if (cur.r === endPos.r && cur.c === endPos.c) { found = true; break }
    for (const nb of neighbors(cur.r, cur.c)) {
      if (!prev.has(key(nb))) {
        prev.set(key(nb), cur)
        stack.push(nb)
      }
    }
  }

  if (!found) return { visited, path: [] }
  const path: Pos[] = []
  let cur: Pos | null | undefined = endPos
  while (cur && !(cur.r === startPos.r && cur.c === startPos.c)) {
    path.unshift(cur)
    cur = prev.get(`${cur.r},${cur.c}`)
  }
  return { visited, path }
}

function dijkstraSearch(): { visited: Pos[]; path: Pos[] } {
  const key = (p: Pos) => `${p.r},${p.c}`
  const dist = new Map<string, number>()
  const prev = new Map<string, Pos | null>()
  const visited: Pos[] = []

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      dist.set(`${r},${c}`, Infinity)

  dist.set(key(startPos), 0)
  prev.set(key(startPos), null)

  const heap = new MinHeap<Pos>()
  heap.push(startPos, 0)

  while (heap.size > 0) {
    const cur = heap.pop()!
    const ck = key(cur)
    if (visited.some(v => v.r === cur.r && v.c === cur.c)) continue
    visited.push(cur)
    if (cur.r === endPos.r && cur.c === endPos.c) break

    for (const nb of neighbors(cur.r, cur.c)) {
      const nk = key(nb)
      const nd = (dist.get(ck) ?? Infinity) + moveCost(cur, nb)
      if (nd < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, nd)
        prev.set(nk, cur)
        heap.push(nb, nd)
      }
    }
  }

  if (dist.get(key(endPos)) === Infinity) return { visited, path: [] }
  const path: Pos[] = []
  let cur: Pos | null | undefined = endPos
  while (cur && !(cur.r === startPos.r && cur.c === startPos.c)) {
    path.unshift(cur)
    cur = prev.get(`${cur.r},${cur.c}`)
  }
  return { visited, path }
}

function astarSearch(): { visited: Pos[]; path: Pos[] } {
  const key = (p: Pos) => `${p.r},${p.c}`
  const g = new Map<string, number>()
  const prev = new Map<string, Pos | null>()
  const visited: Pos[] = []
  const closed = new Set<string>()

  g.set(key(startPos), 0)
  prev.set(key(startPos), null)

  const heap = new MinHeap<Pos>()
  heap.push(startPos, heuristic(startPos, endPos))

  while (heap.size > 0) {
    const cur = heap.pop()!
    const ck = key(cur)
    if (closed.has(ck)) continue
    closed.add(ck)
    visited.push(cur)
    if (cur.r === endPos.r && cur.c === endPos.c) break

    for (const nb of neighbors(cur.r, cur.c)) {
      const nk = key(nb)
      if (closed.has(nk)) continue
      const ng = (g.get(ck) ?? Infinity) + moveCost(cur, nb)
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng)
        prev.set(nk, cur)
        heap.push(nb, ng + heuristic(nb, endPos))
      }
    }
  }

  if (!prev.has(key(endPos))) return { visited, path: [] }
  const path: Pos[] = []
  let cur: Pos | null | undefined = endPos
  while (cur && !(cur.r === startPos.r && cur.c === startPos.c)) {
    path.unshift(cur)
    cur = prev.get(`${cur.r},${cur.c}`)
  }
  return { visited, path }
}

function greedySearch(): { visited: Pos[]; path: Pos[] } {
  const key = (p: Pos) => `${p.r},${p.c}`
  const prev = new Map<string, Pos | null>()
  const visited: Pos[] = []
  const closed = new Set<string>()

  prev.set(key(startPos), null)

  const heap = new MinHeap<Pos>()
  heap.push(startPos, heuristic(startPos, endPos))

  while (heap.size > 0) {
    const cur = heap.pop()!
    const ck = key(cur)
    if (closed.has(ck)) continue
    closed.add(ck)
    visited.push(cur)
    if (cur.r === endPos.r && cur.c === endPos.c) break

    for (const nb of neighbors(cur.r, cur.c)) {
      const nk = key(nb)
      if (closed.has(nk)) continue
      if (!prev.has(nk)) {
        prev.set(nk, cur)
        heap.push(nb, heuristic(nb, endPos))
      }
    }
  }

  if (!prev.has(key(endPos))) return { visited, path: [] }
  const path: Pos[] = []
  let cur: Pos | null | undefined = endPos
  while (cur && !(cur.r === startPos.r && cur.c === startPos.c)) {
    path.unshift(cur)
    cur = prev.get(`${cur.r},${cur.c}`)
  }
  return { visited, path }
}

let animRaf: number | null = null

function runAlgorithm() {
  if (isRunning.value) return
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid.value[r][c] === 'visited' || grid.value[r][c] === 'path')
        grid.value[r][c] = 'empty'
  grid.value[startPos.r][startPos.c] = 'start'
  grid.value[endPos.r][endPos.c] = 'end'

  const t0 = performance.now()
  let result: { visited: Pos[]; path: Pos[] }
  if (selectedAlgo.value === 'bfs') result = bfsSearch()
  else if (selectedAlgo.value === 'dfs') result = dfsSearch()
  else if (selectedAlgo.value === 'dijkstra') result = dijkstraSearch()
  else if (selectedAlgo.value === 'greedy') result = greedySearch()
  else result = astarSearch()
  const elapsed = performance.now() - t0

  isRunning.value = true
  stats.value = { time: null, visited: 0, pathLength: null }

  let vi = 0
  let pi = 0
  let phase: 'visit' | 'path' = 'visit'

  function animate() {
    const steps = animSpeed.value
    if (phase === 'visit') {
      for (let i = 0; i < steps && vi < result.visited.length; i++, vi++) {
        const p = result.visited[vi]
        if (grid.value[p.r][p.c] === 'empty') grid.value[p.r][p.c] = 'visited'
        stats.value.visited = vi + 1
      }
      if (vi >= result.visited.length) phase = 'path'
    } else {
      for (let i = 0; i < steps && pi < result.path.length; i++, pi++) {
        const p = result.path[pi]
        if (grid.value[p.r][p.c] !== 'start' && grid.value[p.r][p.c] !== 'end')
          grid.value[p.r][p.c] = 'path'
      }
      if (pi >= result.path.length) {
        draw()
        isRunning.value = false
        stats.value = {
          time: Math.round(elapsed * 100) / 100,
          visited: result.visited.length,
          pathLength: result.path.length || null,
        }
        return
      }
    }
    draw()
    animRaf = requestAnimationFrame(animate)
  }

  animRaf = requestAnimationFrame(animate)
}

function generateMaze() {
  initGrid()
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if ((r === startPos.r && c === startPos.c) || (r === endPos.r && c === endPos.c)) continue
      if (Math.random() < 0.28) grid.value[r][c] = 'wall'
    }
  draw()
}

function clearWalls() {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (grid.value[r][c] === 'wall') grid.value[r][c] = 'empty'
  draw()
}

function resetGrid() {
  if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null }
  isRunning.value = false
  startPos = { r: 10, c: 5 }
  endPos = { r: 10, c: 24 }
  stats.value = { time: null, visited: 0, pathLength: null }
  initGrid()
  draw()
}

onMounted(() => {
  initGrid()
  draw()
})

onUnmounted(() => {
  if (animRaf) cancelAnimationFrame(animRaf)
})
</script>

<style scoped>
.pathfinding-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e8e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.content {
  max-width: 920px;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0 0 0.25rem;
}

.neon-green { color: #00ff88; }
.neon-purple { color: #b400ff; }
.neon-cyan { color: #00d4ff; }
.neon-pink { color: #ff2d78; }

.cursor {
  color: #00d4ff;
  animation: blink 1s step-end infinite;
}
@keyframes blink { 50% { opacity: 0; } }

.subtitle {
  color: rgba(136, 136, 170, 0.8);
  font-size: 0.85rem;
  margin: 0;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.label {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: rgba(136, 136, 170, 0.8);
}

.algo-buttons {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.algo-btn {
  background: #0f0f1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(136, 136, 170, 0.8);
  padding: 0.35rem 0.8rem;
  font-size: 0.78rem;
  font-family: inherit;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s;
}
.algo-btn:hover {
  border-color: #00d4ff;
  color: #00d4ff;
}
.algo-btn.active {
  border-color: #00ff88;
  color: #00ff88;
  background: rgba(0, 255, 136, 0.07);
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.speed-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  cursor: pointer;
}
.speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #00d4ff;
  cursor: pointer;
  border: none;
}
.speed-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #00d4ff;
  cursor: pointer;
  border: none;
}

.speed-val {
  font-size: 0.85rem;
  min-width: 1.5rem;
}

.action-btn {
  background: #0f0f1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(136, 136, 170, 0.8);
  padding: 0.35rem 0.8rem;
  font-size: 0.78rem;
  font-family: inherit;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn:hover:not(:disabled) {
  border-color: #00d4ff;
  color: #00d4ff;
}
.action-btn.run {
  border-color: #00ff88;
  color: #00ff88;
}
.action-btn.run:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.1);
}
.action-btn.reset {
  border-color: #ff2d78;
  color: #ff2d78;
}
.action-btn.reset:hover:not(:disabled) {
  background: rgba(255, 45, 120, 0.1);
}
.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background: #0f0f1a;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.stat-label {
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  color: rgba(136, 136, 170, 0.6);
}
.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.canvas-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: inline-block;
  line-height: 0;
  box-shadow: 0 0 40px rgba(0, 212, 255, 0.06);
}

canvas {
  display: block;
  cursor: crosshair;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: rgba(136, 136, 170, 0.7);
  letter-spacing: 0.06em;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}
</style>
