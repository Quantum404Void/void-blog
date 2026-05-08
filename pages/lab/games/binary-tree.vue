<template>
  <div class="bst-page">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'binary-tree' }]" />
    <div class="bst-container">
      <h1 class="title">Binary Search Tree <span class="dim">Visualizer</span></h1>

      <div class="controls">
        <input
          v-model="inputVal"
          type="number"
          placeholder="value"
          class="num-input"
          @keydown.enter="doInsert"
        />
        <button class="btn insert" @click="doInsert">Insert</button>
        <button class="btn search" @click="doSearch">Search</button>
        <button class="btn delete" @click="doDelete">Delete</button>
        <span class="divider" />
        <button class="btn random" @click="doRandom">Random</button>
        <button class="btn clear" @click="doClear">Clear</button>
      </div>

      <div class="traversal-row">
        <button
          v-for="t in traversals"
          :key="t.key"
          class="btn trav"
          :class="{ active: activeTrav === t.key }"
          @click="doTraversal(t.key)"
        >{{ t.label }}</button>
        <span v-if="travResult.length" class="trav-result">
          {{ travResult.join(' → ') }}
        </span>
      </div>

      <div class="status-bar">{{ statusMsg }}</div>

      <canvas ref="canvasEl" class="bst-canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

useSeoMeta({ title: 'Binary Tree — Lab' })

// ── Node ────────────────────────────────────────────────────────────────────
interface BSTNode {
  val: number
  left: BSTNode | null
  right: BSTNode | null
  x: number
  y: number
  color: string
}

function makeNode(val: number): BSTNode {
  return { val, left: null, right: null, x: 0, y: 0, color: '#0f0f1a' }
}

// ── BST ops ─────────────────────────────────────────────────────────────────
let root: BSTNode | null = null

function insert(node: BSTNode | null, val: number): BSTNode {
  if (!node) return makeNode(val)
  if (val < node.val) node.left = insert(node.left, val)
  else if (val > node.val) node.right = insert(node.right, val)
  return node
}

function findMin(node: BSTNode): BSTNode {
  while (node.left) node = node.left
  return node
}

function deleteNode(node: BSTNode | null, val: number): BSTNode | null {
  if (!node) return null
  if (val < node.val) { node.left = deleteNode(node.left, val); return node }
  if (val > node.val) { node.right = deleteNode(node.right, val); return node }
  if (!node.left) return node.right
  if (!node.right) return node.left
  const succ = findMin(node.right)
  node.val = succ.val
  node.right = deleteNode(node.right, succ.val)
  return node
}

function searchPath(node: BSTNode | null, val: number): BSTNode[] {
  const path: BSTNode[] = []
  let cur = node
  while (cur) {
    path.push(cur)
    if (val === cur.val) break
    cur = val < cur.val ? cur.left : cur.right
  }
  return path
}

function inorder(node: BSTNode | null, out: number[]) {
  if (!node) return
  inorder(node.left, out); out.push(node.val); inorder(node.right, out)
}
function preorder(node: BSTNode | null, out: number[]) {
  if (!node) return
  out.push(node.val); preorder(node.left, out); preorder(node.right, out)
}
function postorder(node: BSTNode | null, out: number[]) {
  if (!node) return
  postorder(node.left, out); postorder(node.right, out); out.push(node.val)
}

// ── Layout ──────────────────────────────────────────────────────────────────
const V_GAP = 72
const R = 22
const H_GAP = 52  // min horizontal gap between nodes

// Assign x by in-order index (Reingold-Tilford simplified)
// Returns the width of the subtree in node-units
function assignX(node: BSTNode | null, counter: { i: number }) {
  if (!node) return
  assignX(node.left, counter)
  node.x = counter.i++
  assignX(node.right, counter)
}

function assignY(node: BSTNode | null, depth: number) {
  if (!node) return
  node.y = 60 + depth * V_GAP
  assignY(node.left, depth + 1)
  assignY(node.right, depth + 1)
}

function layout(node: BSTNode | null, canvasWidth: number) {
  if (!node) return
  // 1. Assign x by in-order position
  const counter = { i: 0 }
  assignX(node, counter)
  const totalNodes = counter.i
  // 2. Scale x positions to canvas width
  const padding = 40
  const available = canvasWidth - padding * 2
  const step = totalNodes <= 1 ? 0 : available / (totalNodes - 1)
  function scaleX(n: BSTNode | null) {
    if (!n) return
    n.x = padding + n.x * step
    scaleX(n.left)
    scaleX(n.right)
  }
  scaleX(node)
  // 3. Assign y by depth
  assignY(node, 0)
}

// ── Canvas ───────────────────────────────────────────────────────────────────
const canvasEl = ref<HTMLCanvasElement | null>(null)
let animFrame = 0
let highlighted: Set<BSTNode> = new Set()
let currentNode: BSTNode | null = null
let animStep = 0
let animTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null

const inputVal = ref<string>('')
const statusMsg = ref('Insert values or click Random to start.')
const travResult = ref<number[]>([])
const activeTrav = ref('')

const traversals = [
  { key: 'inorder', label: 'Inorder' },
  { key: 'preorder', label: 'Preorder' },
  { key: 'postorder', label: 'Postorder' },
]

function getCanvasSize() {
  const el = canvasEl.value
  if (!el) return { w: 800, h: 500 }
  return { w: el.clientWidth, h: el.clientHeight }
}

function nodeColor(n: BSTNode): string {
  if (n === currentNode) return '#b400ff'
  if (highlighted.has(n)) return '#00ff88'
  // leaf
  if (!n.left && !n.right) return '#00d4ff'
  return '#0f0f1a'
}

function draw() {
  const el = canvasEl.value
  if (!el) return
  const ctx = el.getContext('2d')!
  const w = el.parentElement?.clientWidth || 800
  
  // Calculate needed height based on tree depth
  let maxDepth = 0
  function getDepth(n: BSTNode | null, d: number) {
    if (!n) return
    maxDepth = Math.max(maxDepth, d)
    getDepth(n.left, d + 1)
    getDepth(n.right, d + 1)
  }
  if (root) getDepth(root, 0)
  const h = Math.max(320, 60 + (maxDepth + 1) * V_GAP + R + 20)
  
  el.width = w
  el.height = h
  el.style.height = h + 'px'

  ctx.clearRect(0, 0, w, h)

  if (!root) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Empty tree', w / 2, h / 2)
    return
  }

  layout(root, w)

  // draw edges
  function drawEdges(n: BSTNode | null) {
    if (!n) return
    const edgeColor = 'rgba(0,212,255,0.25)'
    if (n.left) {
      ctx.strokeStyle = edgeColor
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.left.x, n.left.y); ctx.stroke()
      drawEdges(n.left)
    }
    if (n.right) {
      ctx.strokeStyle = edgeColor
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n.right.x, n.right.y); ctx.stroke()
      drawEdges(n.right)
    }
  }
  drawEdges(root)

  // draw nodes
  function drawNodes(n: BSTNode | null) {
    if (!n) return
    const c = nodeColor(n)
    // glow
    if (highlighted.has(n) || n === currentNode) {
      ctx.shadowColor = c
      ctx.shadowBlur = 18
    } else {
      ctx.shadowBlur = 0
    }
    ctx.beginPath()
    ctx.arc(n.x, n.y, R, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
    ctx.strokeStyle = highlighted.has(n) || n === currentNode ? c : 'rgba(0,212,255,0.4)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n.val), n.x, n.y)

    drawNodes(n.left)
    drawNodes(n.right)
  }
  drawNodes(root)
}

function scheduleAnim(path: BSTNode[], finalMsg: string, delay = 350) {
  if (animTimer) clearTimeout(animTimer)
  highlighted.clear()
  currentNode = null
  animStep = 0

  function step() {
    if (animStep < path.length) {
      highlighted.add(path[animStep])
      currentNode = path[animStep]
      draw()
      animStep++
      animTimer = setTimeout(step, delay)
    } else {
      currentNode = null
      statusMsg.value = finalMsg
      draw()
    }
  }
  step()
}

function doInsert() {
  const v = parseInt(inputVal.value)
  if (isNaN(v)) { statusMsg.value = 'Enter a valid number.'; return }
  const path = searchPath(root, v)
  root = insert(root, v)
  const newNode = searchPath(root, v)
  scheduleAnim(newNode, `Inserted ${v}`)
  inputVal.value = ''
  travResult.value = []
  activeTrav.value = ''
}

function doSearch() {
  const v = parseInt(inputVal.value)
  if (isNaN(v)) { statusMsg.value = 'Enter a valid number.'; return }
  const path = searchPath(root, v)
  const found = path.length && path[path.length - 1].val === v
  scheduleAnim(path, found ? `Found ${v}` : `${v} not found`)
}

function doDelete() {
  const v = parseInt(inputVal.value)
  if (isNaN(v)) { statusMsg.value = 'Enter a valid number.'; return }
  const path = searchPath(root, v)
  const found = path.length && path[path.length - 1].val === v
  if (!found) { statusMsg.value = `${v} not found`; return }
  scheduleAnim(path, `Deleting ${v}…`, 300)
  setTimeout(() => {
    root = deleteNode(root, v)
    highlighted.clear()
    currentNode = null
    statusMsg.value = `Deleted ${v}`
    draw()
  }, 300 * (path.length + 1))
  inputVal.value = ''
  travResult.value = []
  activeTrav.value = ''
}

function doRandom() {
  doClear()
  const count = 10 + Math.floor(Math.random() * 6)
  const vals = new Set<number>()
  while (vals.size < count) vals.add(1 + Math.floor(Math.random() * 99))
  for (const v of vals) root = insert(root, v)
  statusMsg.value = `Random tree with ${count} nodes`
  draw()
  travResult.value = []
  activeTrav.value = ''
}

function doClear() {
  root = null
  highlighted.clear()
  currentNode = null
  if (animTimer) clearTimeout(animTimer)
  travResult.value = []
  activeTrav.value = ''
  statusMsg.value = 'Tree cleared.'
  draw()
}

function doTraversal(type: string) {
  if (!root) { statusMsg.value = 'Tree is empty.'; return }
  activeTrav.value = type
  const result: number[] = []
  if (type === 'inorder') inorder(root, result)
  else if (type === 'preorder') preorder(root, result)
  else postorder(root, result)
  travResult.value = result
  statusMsg.value = `${type} traversal`

  // animate traversal nodes in order
  const allNodes = result.map(v => searchPath(root, v).pop()!).filter(Boolean)
  highlighted.clear()
  currentNode = null
  scheduleAnim(allNodes, `${type} done`, 250)
}

onMounted(() => {
  nextTick(() => {
    draw()
    resizeObserver = new ResizeObserver(() => draw())
    if (canvasEl.value?.parentElement) resizeObserver.observe(canvasEl.value.parentElement)
  })
  window.addEventListener('resize', draw)
})
onUnmounted(() => {
  if (animTimer) clearTimeout(animTimer)
  resizeObserver?.disconnect()
  window.removeEventListener('resize', draw)
  cancelAnimationFrame(animFrame)
})
</script>

<style scoped>
.bst-page {
  min-height: 100vh;
  background: #0a0a0f;
  color: #e0e0ff;
  font-family: 'JetBrains Mono', monospace, sans-serif;
}
.bst-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}
.title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #00d4ff;
  margin-bottom: 20px;
  letter-spacing: 0.05em;
}
.title .dim { color: rgba(0,212,255,0.4); font-weight: 400; }
.controls, .traversal-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}
.num-input {
  background: #111122;
  border: 1px solid rgba(0,212,255,0.3);
  color: #e0e0ff;
  padding: 6px 10px;
  border-radius: 6px;
  font-family: inherit;
  width: 90px;
  font-size: 0.9rem;
}
.num-input:focus { outline: none; border-color: #00d4ff; }
.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn.insert  { background: rgba(0,255,136,0.08); border-color: #00ff88; color: #00ff88; }
.btn.search  { background: rgba(0,212,255,0.08); border-color: #00d4ff; color: #00d4ff; }
.btn.delete  { background: rgba(255,50,50,0.08); border-color: #ff4444; color: #ff4444; }
.btn.random  { background: rgba(180,0,255,0.08); border-color: #b400ff; color: #b400ff; }
.btn.clear   { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.5); }
.btn.trav    { background: rgba(0,212,255,0.05); border-color: rgba(0,212,255,0.3); color: rgba(0,212,255,0.7); }
.btn.trav.active { background: rgba(0,212,255,0.15); border-color: #00d4ff; color: #00d4ff; }
.btn:hover { filter: brightness(1.2); }
.divider { width: 1px; height: 24px; background: rgba(255,255,255,0.1); }
.trav-result {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
  max-width: 500px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-bar {
  font-size: 0.8rem;
  color: rgba(0,212,255,0.6);
  margin-bottom: 8px;
  min-height: 20px;
}
.bst-canvas {
  width: 100%;
  min-height: 320px;
  border: 1px solid rgba(0,212,255,0.1);
  border-radius: 10px;
  background: #080810;
  display: block;
}
</style>
