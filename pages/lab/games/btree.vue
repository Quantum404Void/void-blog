<template>
  <div class="min-h-screen bg-[var(--color-void)] text-[var(--color-text-primary)]">
    <AppNav :crumbs="[{ label: 'lab', href: '/lab' }, { label: 'btree' }]" />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="font-mono text-2xl text-[var(--color-neon-cyan)] mb-2">B+ 树操作动画</h1>
      <p class="text-[var(--color-text-muted)] font-mono text-sm mb-6">插入 · 删除 · 查找 · 分裂 · 合并</p>

      <!-- Controls -->
      <div class="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">阶数</label>
          <select v-model.number="order" @change="reset" class="font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded px-2 py-1.5 focus:outline-none focus:border-[var(--color-neon-cyan)]">
            <option :value="3">3 阶</option>
            <option :value="4">4 阶</option>
            <option :value="5">5 阶</option>
          </select>
        </div>
        <div>
          <label class="font-mono text-xs text-[var(--color-text-muted)] block mb-1">键值</label>
          <input v-model.number="inputKey" type="number" class="w-24 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded px-2 py-1.5 focus:outline-none focus:border-[var(--color-neon-cyan)]" placeholder="整数" />
        </div>
        <button @click="doInsert" :disabled="animating" class="px-4 py-1.5 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] rounded hover:bg-[rgba(0,212,255,0.1)] disabled:opacity-40 transition-colors">插入</button>
        <button @click="doDelete" :disabled="animating" class="px-4 py-1.5 font-mono text-sm bg-[var(--color-void-card)] border border-red-500 text-red-400 rounded hover:bg-[rgba(255,68,68,0.1)] disabled:opacity-40 transition-colors">删除</button>
        <button @click="doFind" :disabled="animating" class="px-4 py-1.5 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded hover:border-[var(--color-neon-cyan)] disabled:opacity-40 transition-colors">查找</button>
        <button @click="insertBatch" :disabled="animating" class="px-4 py-1.5 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-neon-green)] text-[var(--color-neon-green)] rounded hover:bg-[rgba(57,255,20,0.1)] disabled:opacity-40 transition-colors">随机10键</button>
        <button @click="reset" class="px-4 py-1.5 font-mono text-sm bg-[var(--color-void-card)] border border-[var(--color-void-border)] text-[var(--color-text-muted)] rounded hover:border-red-400 transition-colors">重置</button>
        <div class="flex items-center gap-2 ml-auto">
          <label class="font-mono text-xs text-[var(--color-text-muted)]">速度</label>
          <input type="range" v-model.number="speed" min="1" max="5" step="1" class="w-24 accent-cyan-400" />
          <span class="font-mono text-xs text-[var(--color-text-muted)]">×{{ speed }}</span>
        </div>
      </div>

      <!-- Status bar -->
      <div class="font-mono text-sm text-[var(--color-neon-cyan)] min-h-6 mb-3">
        {{ statusMsg }}
      </div>

      <!-- Tree SVG -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 overflow-x-auto mb-4">
        <svg ref="treeSvg" :width="treeW" :height="treeH" :viewBox="`0 0 ${treeW} ${treeH}`">
          <!-- Edges -->
          <line v-for="e in edges" :key="e.key"
            :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
            :stroke="e.highlight ? '#00d4ff' : '#2d3748'" :stroke-width="e.highlight ? 2 : 1" />

          <!-- Nodes -->
          <g v-for="n in treeNodes" :key="n.id" :transform="`translate(${n.x},${n.y})`">
            <rect
              :x="-n.w/2" :y="-14"
              :width="n.w" :height="28"
              rx="4"
              :fill="n.id === splitNode ? 'rgba(255,165,0,0.2)' : n.isLeaf ? 'rgba(0,212,255,0.06)' : 'rgba(0,0,0,0.4)'"
              :stroke="highlightNodes.has(n.id) ? '#00d4ff' : (n.id === splitNode ? '#ffa500' : (n.isLeaf ? '#1e3a4a' : '#2d3748'))"
              :stroke-width="highlightNodes.has(n.id) ? 2 : 1"
            />
            <!-- key cells -->
            <g v-for="(k, ki) in n.keys" :key="ki">
              <line :x1="-n.w/2 + (ki+1)*cellW(n)" y1="-14" :x2="-n.w/2 + (ki+1)*cellW(n)" y2="14"
                stroke="#2d3748" stroke-width="0.5" />
              <text :x="-n.w/2 + (ki+0.5)*cellW(n)" y="5"
                font-family="monospace" font-size="11"
                :fill="highlightNodes.has(n.id) ? '#00d4ff' : '#a0aec0'"
                text-anchor="middle">{{ k }}</text>
            </g>
            <!-- leaf marker -->
            <text v-if="n.isLeaf" x="0" y="24" font-family="monospace" font-size="8" fill="#2d3748" text-anchor="middle">leaf</text>
            <!-- next pointer for leaf -->
            <line v-if="n.isLeaf && n.hasNext" :x1="n.w/2" y1="0" :x2="n.w/2 + 15" y2="0" stroke="#2d3748" stroke-width="1" />
            <text v-if="n.isLeaf && n.hasNext" :x="n.w/2+18" y="4" font-family="monospace" font-size="8" fill="#2d3748">→</text>
          </g>
        </svg>
      </div>

      <!-- Leaf chain -->
      <div class="bg-[var(--color-void-card)] border border-[var(--color-void-border)] rounded-lg p-4 overflow-x-auto">
        <div class="font-mono text-xs text-[var(--color-text-muted)] mb-2">叶节点链表（B+ 树特性）</div>
        <div class="flex gap-0 flex-nowrap min-w-0">
          <template v-for="(leaf, i) in leafChain" :key="i">
            <div class="flex-none border border-[var(--color-void-border)] rounded px-2 py-1 font-mono text-xs"
              :class="highlightLeafKeys.has(Number(k)) ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)]' : 'text-[var(--color-text-muted)]'"
              v-for="k in leaf" :key="k">{{ k }}</div>
            <div v-if="i < leafChain.length - 1" class="flex-none flex items-center px-1 text-[var(--color-text-muted)] font-mono text-xs">→</div>
          </template>
          <div v-if="!leafChain.length" class="font-mono text-xs text-[var(--color-text-muted)]">—</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `B+ Tree | ${siteName}` })
// ─── B+ Tree Implementation ──────────────────────────────────────────────────
interface BNode {
  id: number
  keys: number[]
  children: BNode[]   // empty for leaf
  isLeaf: boolean
  next: BNode | null  // leaf chain
}

let nodeIdCounter = 0
function mkNode(isLeaf: boolean): BNode {
  return { id: nodeIdCounter++, keys: [], children: [], isLeaf, next: null }
}

class BPlusTree {
  root: BNode
  order: number
  constructor(order: number) {
    this.order = order
    this.root = mkNode(true)
  }

  get maxKeys() { return this.order - 1 }
  get minKeys() { return Math.ceil(this.order / 2) - 1 }

  insert(key: number, onSplit?: (id: number) => void) {
    const { newKey, newChild } = this._insert(this.root, key, onSplit)
    if (newChild) {
      const newRoot = mkNode(false)
      newRoot.keys = [newKey]
      newRoot.children = [this.root, newChild]
      this.root = newRoot
      onSplit?.(newRoot.id)
    }
  }

  _insert(node: BNode, key: number, onSplit?: (id: number) => void): { newKey: number; newChild: BNode | null } {
    if (node.isLeaf) {
      let i = 0
      while (i < node.keys.length && key > node.keys[i]) i++
      node.keys.splice(i, 0, key)
      if (node.keys.length > this.maxKeys) {
        return this._splitLeaf(node, onSplit)
      }
      return { newKey: 0, newChild: null }
    } else {
      let i = 0
      while (i < node.keys.length && key >= node.keys[i]) i++
      const { newKey, newChild } = this._insert(node.children[i], key, onSplit)
      if (newChild) {
        node.keys.splice(i, 0, newKey)
        node.children.splice(i + 1, 0, newChild)
        onSplit?.(node.id)
        if (node.keys.length > this.maxKeys) {
          return this._splitInternal(node, onSplit)
        }
      }
      return { newKey: 0, newChild: null }
    }
  }

  _splitLeaf(node: BNode, onSplit?: (id: number) => void): { newKey: number; newChild: BNode } {
    const mid = Math.ceil(node.keys.length / 2)
    const sibling = mkNode(true)
    sibling.keys = node.keys.splice(mid)
    sibling.next = node.next
    node.next = sibling
    onSplit?.(node.id)
    return { newKey: sibling.keys[0], newChild: sibling }
  }

  _splitInternal(node: BNode, onSplit?: (id: number) => void): { newKey: number; newChild: BNode } {
    const mid = Math.floor(node.keys.length / 2)
    const pushUp = node.keys[mid]
    const sibling = mkNode(false)
    sibling.keys = node.keys.splice(mid + 1)
    node.keys.splice(mid)
    sibling.children = node.children.splice(mid + 1)
    onSplit?.(sibling.id)
    return { newKey: pushUp, newChild: sibling }
  }

  delete(key: number): boolean {
    const deleted = this._delete(this.root, key)
    if (!this.root.isLeaf && this.root.keys.length === 0 && this.root.children.length > 0) {
      this.root = this.root.children[0]
    }
    return deleted
  }

  _delete(node: BNode, key: number): boolean {
    if (node.isLeaf) {
      const i = node.keys.indexOf(key)
      if (i === -1) return false
      node.keys.splice(i, 1)
      return true
    }
    let i = 0
    while (i < node.keys.length && key >= node.keys[i]) i++
    const child = node.children[i]
    const deleted = this._delete(child, key)
    if (!deleted) return false
    if (child.keys.length < this.minKeys) {
      this._rebalance(node, i)
    }
    // fix internal keys
    for (let j = 0; j < node.keys.length; j++) {
      const leftLeaf = this._leftmostLeaf(node.children[j+1])
      if (leftLeaf) node.keys[j] = leftLeaf.keys[0]
    }
    return true
  }

  _rebalance(parent: BNode, idx: number) {
    const child = parent.children[idx]
    const leftSib = idx > 0 ? parent.children[idx-1] : null
    const rightSib = idx < parent.children.length-1 ? parent.children[idx+1] : null

    if (rightSib && rightSib.keys.length > this.minKeys) {
      // borrow from right
      child.keys.push(rightSib.keys.shift()!)
      if (!child.isLeaf && rightSib.children.length) child.children.push(rightSib.children.shift()!)
    } else if (leftSib && leftSib.keys.length > this.minKeys) {
      // borrow from left
      child.keys.unshift(leftSib.keys.pop()!)
      if (!child.isLeaf && leftSib.children.length) child.children.unshift(leftSib.children.pop()!)
    } else if (rightSib) {
      // merge with right
      child.keys.push(...rightSib.keys)
      if (!child.isLeaf) child.children.push(...rightSib.children)
      else { child.next = rightSib.next }
      parent.children.splice(idx+1, 1)
      parent.keys.splice(idx, 1)
    } else if (leftSib) {
      // merge into left
      leftSib.keys.push(...child.keys)
      if (!child.isLeaf) leftSib.children.push(...child.children)
      else { leftSib.next = child.next }
      parent.children.splice(idx, 1)
      parent.keys.splice(idx-1, 1)
    }
  }

  _leftmostLeaf(node: BNode): BNode | null {
    if (node.isLeaf) return node
    return node.children.length ? this._leftmostLeaf(node.children[0]) : null
  }

  find(key: number): boolean {
    let node = this.root
    while (!node.isLeaf) {
      let i = 0
      while (i < node.keys.length && key >= node.keys[i]) i++
      node = node.children[i]
    }
    return node.keys.includes(key)
  }

  getLeafChain(): number[][] {
    const chain: number[][] = []
    let node: BNode | null = this._leftmostLeaf(this.root)
    while (node) { chain.push([...node.keys]); node = node.next }
    return chain
  }

  collectNodes(): BNode[] {
    const result: BNode[] = []
    const q = [this.root]
    while (q.length) {
      const n = q.shift()!
      result.push(n)
      if (!n.isLeaf) q.push(...n.children)
    }
    return result
  }
}

// ─── Vue State ────────────────────────────────────────────────────────────────
const order = ref(4)
const inputKey = ref<number>(10)
const speed = ref(3)
const animating = ref(false)
const statusMsg = ref('B+ 树就绪')
const highlightNodes = ref<Set<number>>(new Set())
const highlightLeafKeys = ref<Set<number>>(new Set())
const splitNode = ref<number | null>(null)

let tree = new BPlusTree(order.value)

function reset() {
  tree = new BPlusTree(order.value)
  nodeIdCounter = 0
  statusMsg.value = 'B+ 树已重置'
  highlightNodes.value = new Set()
  highlightLeafKeys.value = new Set()
  splitNode.value = null
  renderTree()
}

const delay = computed(() => Math.max(100, 600 - speed.value * 100))

// ─── Layout ───────────────────────────────────────────────────────────────────
interface RenderNode { id: number; x: number; y: number; w: number; keys: number[]; isLeaf: boolean; hasNext: boolean }
interface Edge { x1: number; y1: number; x2: number; y2: number; key: string; highlight: boolean }

const treeNodes = ref<RenderNode[]>([])
const edges = ref<Edge[]>([])
const treeW = ref(800)
const treeH = ref(300)
const leafChain = ref<number[][]>([])

const CELL_W = 22
const NODE_H = 28
const LEVEL_H = 80

function cellW(n: RenderNode) { return n.w / n.keys.length }

function computeLayout() {
  const allNodes = tree.collectNodes()
  const levels: BNode[][] = []
  const q: [BNode, number][] = [[tree.root, 0]]
  const levelMap = new Map<number, number>()
  while (q.length) {
    const [n, lv] = q.shift()!
    if (!levels[lv]) levels[lv] = []
    levels[lv].push(n)
    levelMap.set(n.id, lv)
    if (!n.isLeaf) n.children.forEach(c => q.push([c, lv+1]))
  }

  const positions = new Map<number, { x: number; y: number; w: number }>()
  const maxLevels = levels.length

  // Bottom-up x positioning
  function subtreeWidth(n: BNode): number {
    if (n.isLeaf || n.children.length === 0) return Math.max(60, n.keys.length * CELL_W + 16)
    return n.children.reduce((s, c) => s + subtreeWidth(c) + 10, -10)
  }

  function assignX(n: BNode, left: number) {
    const lv = levelMap.get(n.id) ?? 0
    const y = 30 + lv * LEVEL_H
    if (n.isLeaf || n.children.length === 0) {
      const w = Math.max(60, n.keys.length * CELL_W + 16)
      positions.set(n.id, { x: left + w/2, y, w })
      return left + w + 10
    }
    let cx = left
    const childPositions: number[] = []
    for (const c of n.children) {
      const cw = subtreeWidth(c)
      childPositions.push(cx + cw/2)
      cx = assignX(c, cx) + 0
    }
    const x = (childPositions[0] + childPositions[childPositions.length-1]) / 2
    const w = Math.max(60, n.keys.length * CELL_W + 16)
    positions.set(n.id, { x, y, w })
    return cx
  }

  assignX(tree.root, 40)

  // Compute total width
  const xs = [...positions.values()].map(p => p.x + p.w/2)
  const totalW = xs.length ? Math.max(800, Math.max(...xs) + 60) : 800
  const totalH = maxLevels * LEVEL_H + 60

  treeW.value = totalW
  treeH.value = totalH

  const rNodes: RenderNode[] = []
  const rEdges: Edge[] = []

  allNodes.forEach(n => {
    const pos = positions.get(n.id)
    if (!pos) return
    rNodes.push({
      id: n.id, x: pos.x, y: pos.y, w: pos.w,
      keys: [...n.keys], isLeaf: n.isLeaf,
      hasNext: n.isLeaf && n.next !== null
    })
    if (!n.isLeaf) {
      n.children.forEach(c => {
        const cp = positions.get(c.id)
        if (!cp) return
        rEdges.push({
          x1: pos.x, y1: pos.y + NODE_H/2,
          x2: cp.x, y2: cp.y - NODE_H/2,
          key: `${n.id}-${c.id}`,
          highlight: highlightNodes.value.has(n.id) && highlightNodes.value.has(c.id)
        })
      })
    }
  })

  treeNodes.value = rNodes
  edges.value = rEdges
  leafChain.value = tree.getLeafChain()
}

function renderTree() { computeLayout() }

// ─── Operations ───────────────────────────────────────────────────────────────
async function doInsert() {
  if (animating.value || inputKey.value === undefined) return
  const key = Number(inputKey.value)
  animating.value = true
  statusMsg.value = `插入键 ${key}...`
  highlightNodes.value = new Set()
  splitNode.value = null

  // Highlight search path
  let node = tree.root
  const path: number[] = []
  while (!node.isLeaf) {
    path.push(node.id)
    highlightNodes.value = new Set(path)
    renderTree()
    await new Promise(r => setTimeout(r, delay.value))
    let i = 0
    while (i < node.keys.length && key >= node.keys[i]) i++
    node = node.children[i]
  }
  path.push(node.id)
  highlightNodes.value = new Set(path)
  renderTree()
  await new Promise(r => setTimeout(r, delay.value))

  const splitIds = new Set<number>()
  tree.insert(key, id => splitIds.add(id))
  statusMsg.value = splitIds.size ? `插入 ${key} → 触发节点分裂` : `已插入 ${key}`
  if (splitIds.size) {
    for (const id of splitIds) { splitNode.value = id; renderTree(); await new Promise(r => setTimeout(r, delay.value)) }
  }
  splitNode.value = null
  highlightLeafKeys.value = new Set([key])
  renderTree()
  await new Promise(r => setTimeout(r, delay.value * 2))
  highlightNodes.value = new Set()
  highlightLeafKeys.value = new Set()
  renderTree()
  animating.value = false
}

async function doDelete() {
  if (animating.value || inputKey.value === undefined) return
  const key = Number(inputKey.value)
  animating.value = true
  statusMsg.value = `删除键 ${key}...`

  // Search highlight
  let node = tree.root
  const path: number[] = []
  while (!node.isLeaf) {
    path.push(node.id)
    highlightNodes.value = new Set(path)
    renderTree()
    await new Promise(r => setTimeout(r, delay.value))
    let i = 0; while (i < node.keys.length && key >= node.keys[i]) i++
    node = node.children[i]
  }
  path.push(node.id)
  highlightNodes.value = new Set(path)
  renderTree()
  await new Promise(r => setTimeout(r, delay.value))

  const ok = tree.delete(key)
  statusMsg.value = ok ? `已删除 ${key}` : `未找到键 ${key}`
  renderTree()
  await new Promise(r => setTimeout(r, delay.value))
  highlightNodes.value = new Set()
  renderTree()
  animating.value = false
}

async function doFind() {
  if (animating.value || inputKey.value === undefined) return
  const key = Number(inputKey.value)
  animating.value = true
  statusMsg.value = `查找键 ${key}...`

  let node = tree.root
  const path: number[] = []
  while (!node.isLeaf) {
    path.push(node.id)
    highlightNodes.value = new Set(path)
    renderTree()
    await new Promise(r => setTimeout(r, delay.value))
    let i = 0; while (i < node.keys.length && key >= node.keys[i]) i++
    node = node.children[i]
  }
  path.push(node.id)
  highlightNodes.value = new Set(path)
  const found = node.keys.includes(key)
  if (found) highlightLeafKeys.value = new Set([key])
  statusMsg.value = found ? `✓ 找到键 ${key}` : `✗ 未找到键 ${key}`
  renderTree()
  await new Promise(r => setTimeout(r, delay.value * 2))
  highlightNodes.value = new Set()
  highlightLeafKeys.value = new Set()
  renderTree()
  animating.value = false
}

async function insertBatch() {
  if (animating.value) return
  const keys = Array.from({ length: 10 }, () => Math.floor(Math.random() * 99) + 1)
  statusMsg.value = `批量插入：${keys.join(', ')}`
  for (const k of keys) {
    inputKey.value = k
    await doInsert()
    await new Promise(r => setTimeout(r, 50))
  }
}

onMounted(() => renderTree())
</script>
