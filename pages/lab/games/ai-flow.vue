<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `AI Flow | ${siteName}` })

const crumbs = [
  { label: 'lab', href: '/lab' },
  { label: 'games', href: '/lab' },
  { label: 'ai-flow' }
]

// ── Types ──────────────────────────────────────────────────────────────────
interface Port {
  id: string
  nodeId: string
  kind: 'input' | 'output'
  x: number
  y: number
}

interface NodeDef {
  id: string
  type: string
  label: string
  icon: string
  color: string
  category: string
  x: number
  y: number
  inputs: Port[]
  outputs: Port[]
  description: string
}

interface Connection {
  id: string
  fromNode: string
  fromPort: string
  toNode: string
  toPort: string
}

interface LevelDef {
  title: string
  goal: string
  nodeTypes: string[]
  requiredConnections: { from: string; to: string }[]
  hint: string[]
  successInfo: string
}

// ── Node type catalogue ────────────────────────────────────────────────────
const NODE_CATALOGUE: Record<string, { icon: string; color: string; category: string; description: string }> = {
  DataLoader:     { icon: '🗂️', color: '#00d4ff', category: 'data',      description: '加载批量训练数据' },
  Normalize:      { icon: '📐', color: '#39ff14', category: 'preprocess', description: '归一化输入特征' },
  LinearLayer:    { icon: '⚡', color: '#b400ff', category: 'model',      description: '全连接线性变换' },
  Sigmoid:        { icon: '∿',  color: '#ff00aa', category: 'activation', description: '将输出压缩到 (0,1)' },
  Threshold:      { icon: '✂️', color: '#ff4500', category: 'output',     description: '阈值二分类判断' },
  ImageLoader:    { icon: '🖼️', color: '#00d4ff', category: 'data',      description: '加载图片数据' },
  'Resize(224)':  { icon: '📏', color: '#39ff14', category: 'preprocess', description: '缩放到 224×224' },
  ToTensor:       { icon: '🔢', color: '#39ff14', category: 'preprocess', description: '转换为张量格式' },
  BatchLoader:    { icon: '📦', color: '#00d4ff', category: 'data',      description: '组装 mini-batch' },
  TextInput:      { icon: '📝', color: '#00d4ff', category: 'data',      description: '原始文本输入' },
  Tokenizer:      { icon: '✂️', color: '#39ff14', category: 'preprocess', description: '分词 & 编码' },
  Embedding:      { icon: '🔤', color: '#b400ff', category: 'model',      description: '词向量嵌入层' },
  LSTM:           { icon: '🔄', color: '#b400ff', category: 'model',      description: '长短期记忆网络' },
  Dropout:        { icon: '💧', color: '#ff00aa', category: 'regularize', description: '随机丢弃防过拟合' },
  Softmax:        { icon: '∿',  color: '#ff00aa', category: 'activation', description: '多分类概率输出' },
  ArgMax:         { icon: '🏆', color: '#ff4500', category: 'output',     description: '取概率最大类别' },
  Model:          { icon: '🧠', color: '#b400ff', category: 'model',      description: '神经网络模型' },
  'Loss(CrossEntropy)': { icon: '💥', color: '#ff4500', category: 'loss', description: '交叉熵损失函数' },
  Backward:       { icon: '↩️', color: '#ffa500', category: 'train',      description: '反向传播梯度' },
  'Optimizer(Adam)': { icon: '🔧', color: '#ffa500', category: 'train',   description: 'Adam 自适应优化器' },
  Update:         { icon: '✅', color: '#39ff14', category: 'train',      description: '更新模型参数' },
  UserQuery:      { icon: '❓', color: '#00d4ff', category: 'data',      description: '用户输入的问题' },
  Embedder:       { icon: '🔤', color: '#b400ff', category: 'model',      description: '文本向量化' },
  VectorDB:       { icon: '🗄️', color: '#00d4ff', category: 'data',      description: '向量数据库' },
  Retriever:      { icon: '🔍', color: '#39ff14', category: 'preprocess', description: '检索相关文档' },
  ContextMerger:  { icon: '🔀', color: '#ffa500', category: 'preprocess', description: '合并问题与上下文' },
  LLM:            { icon: '🤖', color: '#00d4ff', category: 'model',      description: '大语言模型' },
  Output:         { icon: '📤', color: '#39ff14', category: 'output',     description: '最终输出结果' },
}

const NODE_W = 150
const NODE_H = 60

// ── Levels ────────────────────────────────────────────────────────────────
const levels: LevelDef[] = [
  {
    title: '关卡 1：Hello 分类器',
    goal: '把「原始数据」处理成「二分类结果」',
    nodeTypes: ['DataLoader', 'Normalize', 'LinearLayer', 'Sigmoid', 'Threshold'],
    requiredConnections: [
      { from: 'DataLoader', to: 'Normalize' },
      { from: 'Normalize', to: 'LinearLayer' },
      { from: 'LinearLayer', to: 'Sigmoid' },
      { from: 'Sigmoid', to: 'Threshold' },
    ],
    hint: ['DataLoader → Normalize → LinearLayer → Sigmoid → Threshold'],
    successInfo: '🎓 Sigmoid 把线性输出压缩到 (0,1)，Threshold（通常 0.5）将概率转化为 0/1 类别标签 —— 这就是最简单的二元分类器！',
  },
  {
    title: '关卡 2：图像预处理',
    goal: '把「原始图片」变成「可训练的张量」',
    nodeTypes: ['ImageLoader', 'Resize(224)', 'ToTensor', 'Normalize', 'BatchLoader'],
    requiredConnections: [
      { from: 'ImageLoader', to: 'Resize(224)' },
      { from: 'Resize(224)', to: 'ToTensor' },
      { from: 'ToTensor', to: 'Normalize' },
      { from: 'Normalize', to: 'BatchLoader' },
    ],
    hint: ['ImageLoader → Resize(224) → ToTensor → Normalize → BatchLoader'],
    successInfo: '🎓 ImageNet 标准预处理：先 resize 到 224px，再转张量 [0,1]，最后用均值/标准差归一化。BatchLoader 把单张图片打包成 batch，GPU 才能高效并行！',
  },
  {
    title: '关卡 3：NLP Pipeline',
    goal: '文本 → 情感分类',
    nodeTypes: ['TextInput', 'Tokenizer', 'Embedding', 'LSTM', 'Dropout', 'Softmax', 'ArgMax'],
    requiredConnections: [
      { from: 'TextInput', to: 'Tokenizer' },
      { from: 'Tokenizer', to: 'Embedding' },
      { from: 'Embedding', to: 'LSTM' },
      { from: 'LSTM', to: 'Dropout' },
      { from: 'Dropout', to: 'Softmax' },
      { from: 'Softmax', to: 'ArgMax' },
    ],
    hint: ['TextInput → Tokenizer → Embedding → LSTM → Dropout → Softmax → ArgMax', '提示：Dropout 必须在 Softmax 之前'],
    successInfo: '🎓 LSTM 能记住文本的长程依赖；Dropout 在训练时随机关掉神经元，防止过拟合；Softmax 输出各类别概率；ArgMax 选出最高概率的情感类别！',
  },
  {
    title: '关卡 4：训练循环',
    goal: '搭建完整的训练循环',
    nodeTypes: ['DataLoader', 'Model', 'Loss(CrossEntropy)', 'Backward', 'Optimizer(Adam)', 'Update'],
    requiredConnections: [
      { from: 'DataLoader', to: 'Model' },
      { from: 'Model', to: 'Loss(CrossEntropy)' },
      { from: 'Loss(CrossEntropy)', to: 'Backward' },
      { from: 'Backward', to: 'Optimizer(Adam)' },
      { from: 'Optimizer(Adam)', to: 'Update' },
    ],
    hint: ['DataLoader → Model → Loss → Backward → Optimizer → Update'],
    successInfo: '🎓 训练循环：前向传播得到预测 → 计算损失 → 反向传播求梯度 → Adam 自适应地调整学习率 → 更新参数。循环千次，模型越来越准！',
  },
  {
    title: '关卡 5：RAG Pipeline',
    goal: 'Retrieval-Augmented Generation',
    nodeTypes: ['UserQuery', 'Embedder', 'VectorDB', 'Retriever', 'ContextMerger', 'LLM', 'Output'],
    requiredConnections: [
      { from: 'UserQuery', to: 'Embedder' },
      { from: 'Embedder', to: 'VectorDB' },
      { from: 'VectorDB', to: 'Retriever' },
      { from: 'Retriever', to: 'ContextMerger' },
      { from: 'UserQuery', to: 'ContextMerger' },
      { from: 'ContextMerger', to: 'LLM' },
      { from: 'LLM', to: 'Output' },
    ],
    hint: [
      'UserQuery → Embedder → VectorDB → Retriever → ContextMerger → LLM → Output',
      '提示：UserQuery 同时直连 ContextMerger（query 直接传入）',
    ],
    successInfo: '🎓 RAG 的核心：把用户问题向量化，在知识库里检索相关片段，再把原始问题 + 检索内容一起喂给 LLM。LLM 有了"参考资料"，幻觉大幅减少！',
  },
]

// ── State ─────────────────────────────────────────────────────────────────
const currentLevel = ref(0)
const unlockedLevel = ref(0)
const canvasNodes = ref<NodeDef[]>([])
const connections = ref<Connection[]>([])

// Dragging node on canvas
const dragging = ref<{ nodeId: string; ox: number; oy: number } | null>(null)

// Port connection
const pendingConn = ref<{ fromNode: string; fromPort: string; mx: number; my: number } | null>(null)

// Animation
const dashOffset = ref(0)
const runningAnim = ref(false)
const animPacketPos = ref<{ x: number; y: number; opacity: number }[]>([])
const showSuccess = ref(false)
const showHint = ref(false)
const hintNodes = ref<string[]>([])

// Validation
const validationErrors = ref<string[]>([])
const isValid = ref(false)

// Canvas ref
const canvasEl = ref<HTMLDivElement | null>(null)

// ── Helpers ───────────────────────────────────────────────────────────────
function makeNode(type: string, x: number, y: number): NodeDef {
  const cat = NODE_CATALOGUE[type] ?? { icon: '❔', color: '#888', category: 'misc', description: '' }
  const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  return {
    id,
    type,
    label: type,
    icon: cat.icon,
    color: cat.color,
    category: cat.category,
    x,
    y,
    inputs: [{ id: `${id}-in`, nodeId: id, kind: 'input', x: 0, y: NODE_H / 2 }],
    outputs: [{ id: `${id}-out`, nodeId: id, kind: 'output', x: NODE_W, y: NODE_H / 2 }],
    description: cat.description,
  }
}

function getNodeById(id: string) {
  return canvasNodes.value.find(n => n.id === id)
}

function portAbsPos(node: NodeDef, port: Port) {
  return { x: node.x + port.x, y: node.y + port.y }
}

function bezierPath(fromX: number, fromY: number, toX: number, toY: number) {
  const cx = (fromX + toX) / 2
  return `M ${fromX} ${fromY} C ${cx} ${fromY}, ${cx} ${toY}, ${toX} ${toY}`
}

function connPath(conn: Connection) {
  const fn = getNodeById(conn.fromNode)
  const tn = getNodeById(conn.toNode)
  if (!fn || !tn) return ''
  const fp = fn.outputs[0]
  const tp = tn.inputs[0]
  return bezierPath(fn.x + fp.x, fn.y + fp.y, tn.x + tp.x, tn.y + tp.y)
}

// ── Level init ────────────────────────────────────────────────────────────
function initLevel(idx: number) {
  currentLevel.value = idx
  canvasNodes.value = []
  connections.value = []
  pendingConn.value = null
  showSuccess.value = false
  showHint.value = false
  hintNodes.value = []
  validationErrors.value = []
  isValid.value = false
  runningAnim.value = false
  animPacketPos.value = []
}

// ── Drop from panel ───────────────────────────────────────────────────────
function onPanelDragStart(e: DragEvent, type: string) {
  e.dataTransfer?.setData('nodeType', type)
}

function onCanvasDrop(e: DragEvent) {
  e.preventDefault()
  const type = e.dataTransfer?.getData('nodeType')
  if (!type) return
  const rect = canvasEl.value!.getBoundingClientRect()
  const x = e.clientX - rect.left - NODE_W / 2
  const y = e.clientY - rect.top - NODE_H / 2
  canvasNodes.value.push(makeNode(type, x, y))
  validate()
}

function onCanvasDragOver(e: DragEvent) { e.preventDefault() }

// ── Node dragging ─────────────────────────────────────────────────────────
function onNodeMousedown(e: MouseEvent, node: NodeDef) {
  if ((e.target as HTMLElement).classList.contains('port')) return
  e.preventDefault()
  const rect = canvasEl.value!.getBoundingClientRect()
  dragging.value = { nodeId: node.id, ox: e.clientX - rect.left - node.x, oy: e.clientY - rect.top - node.y }
}

function onCanvasMousemove(e: MouseEvent) {
  const rect = canvasEl.value!.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  if (dragging.value) {
    const node = getNodeById(dragging.value.nodeId)
    if (node) { node.x = mx - dragging.value.ox; node.y = my - dragging.value.oy }
  }
  if (pendingConn.value) {
    pendingConn.value.mx = mx
    pendingConn.value.my = my
  }
}

function onCanvasMouseup() { dragging.value = null }

// ── Port connection ───────────────────────────────────────────────────────
function onOutputPortClick(e: MouseEvent, node: NodeDef, port: Port) {
  e.stopPropagation()
  const rect = canvasEl.value!.getBoundingClientRect()
  pendingConn.value = {
    fromNode: node.id,
    fromPort: port.id,
    mx: e.clientX - rect.left,
    my: e.clientY - rect.top,
  }
}

function onInputPortClick(e: MouseEvent, node: NodeDef, port: Port) {
  e.stopPropagation()
  if (!pendingConn.value) return
  if (pendingConn.value.fromNode === node.id) { pendingConn.value = null; return }
  // Avoid duplicate
  const dup = connections.value.find(c => c.fromNode === pendingConn.value!.fromNode && c.toNode === node.id)
  if (!dup) {
    connections.value.push({
      id: `conn-${Date.now()}`,
      fromNode: pendingConn.value.fromNode,
      fromPort: pendingConn.value.fromPort,
      toNode: node.id,
      toPort: port.id,
    })
  }
  pendingConn.value = null
  validate()
}

function onCanvasClick() { pendingConn.value = null }

// ── Delete ────────────────────────────────────────────────────────────────
function deleteNode(node: NodeDef) {
  connections.value = connections.value.filter(c => c.fromNode !== node.id && c.toNode !== node.id)
  canvasNodes.value = canvasNodes.value.filter(n => n.id !== node.id)
  validate()
}

function deleteConn(id: string) {
  connections.value = connections.value.filter(c => c.id !== id)
  validate()
}

// ── Validate ──────────────────────────────────────────────────────────────
function validate() {
  const level = levels[currentLevel.value]
  const errors: string[] = []
  for (const req of level.requiredConnections) {
    const found = connections.value.some(c => {
      const fn = getNodeById(c.fromNode)
      const tn = getNodeById(c.toNode)
      return fn?.type === req.from && tn?.type === req.to
    })
    if (!found) errors.push(`缺少连接：${req.from} → ${req.to}`)
  }
  validationErrors.value = errors
  isValid.value = errors.length === 0
}

// ── Hint ──────────────────────────────────────────────────────────────────
function showHintFn() {
  const level = levels[currentLevel.value]
  // Find first missing connection
  for (const req of level.requiredConnections) {
    const found = connections.value.some(c => {
      const fn = getNodeById(c.fromNode)
      const tn = getNodeById(c.toNode)
      return fn?.type === req.from && tn?.type === req.to
    })
    if (!found) {
      hintNodes.value = [req.from, req.to]
      showHint.value = true
      setTimeout(() => { showHint.value = false }, 2500)
      return
    }
  }
}

// ── Run pipeline ──────────────────────────────────────────────────────────
async function runPipeline() {
  if (!isValid.value || runningAnim.value) return
  runningAnim.value = true
  animPacketPos.value = []

  // Topological order via required connections
  const level = levels[currentLevel.value]
  const order: string[] = []
  const visited = new Set<string>()
  function visit(type: string) {
    if (visited.has(type)) return
    visited.add(type)
    order.push(type)
  }
  // Walk required connections in order
  for (const req of level.requiredConnections) {
    visit(req.from)
    visit(req.to)
  }

  // Find canvas nodes in that order
  const orderedNodes: NodeDef[] = []
  for (const t of order) {
    const n = canvasNodes.value.find(n => n.type === t)
    if (n) orderedNodes.push(n)
  }

  // Animate packet along connections
  for (let i = 0; i < orderedNodes.length - 1; i++) {
    const a = orderedNodes[i]
    const b = orderedNodes[i + 1]
    const startX = a.x + NODE_W
    const startY = a.y + NODE_H / 2
    const endX = b.x
    const endY = b.y + NODE_H / 2

    // Flash current node
    a._flash = true
    await sleep(120)
    a._flash = false

    // Animate packet
    const steps = 30
    for (let s = 0; s <= steps; s++) {
      const t2 = s / steps
      const cx = (startX + endX) / 2
      const bx = lerp3(startX, cx, endX, t2)
      const by = lerp3(startY, cx, endY, t2) // reuse cx intentionally for cubic feel
      // Actually use proper bezier:
      const px = cubicBezierX(startX, cx, cx, endX, t2)
      const py = cubicBezierX(startY, startY, endY, endY, t2)
      animPacketPos.value = [{ x: px, y: py, opacity: 1 }]
      await sleep(16)
    }
  }
  // Flash last node
  if (orderedNodes.length > 0) {
    orderedNodes[orderedNodes.length - 1]._flash = true
    await sleep(200)
    orderedNodes[orderedNodes.length - 1]._flash = false
  }

  animPacketPos.value = []
  runningAnim.value = false
  showSuccess.value = true
  if (currentLevel.value >= unlockedLevel.value) {
    unlockedLevel.value = currentLevel.value + 1
  }
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }
function cubicBezierX(p0: number, p1: number, p2: number, p3: number, t: number) {
  return (1-t)**3*p0 + 3*(1-t)**2*t*p1 + 3*(1-t)*t**2*p2 + t**3*p3
}
function lerp3(a: number, _b: number, c: number, t: number) { return a + (c - a) * t }

// ── Dash animation ─────────────────────────────────────────────────────────
let dashTimer: ReturnType<typeof setInterval>
onMounted(() => { dashTimer = setInterval(() => { dashOffset.value = (dashOffset.value + 1) % 24 }, 40) })
onUnmounted(() => clearInterval(dashTimer))

// ── Next level ────────────────────────────────────────────────────────────
function goNextLevel() {
  if (currentLevel.value < levels.length - 1) initLevel(currentLevel.value + 1)
  else showSuccess.value = false
}

// Init first level
initLevel(0)
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background: #08080f; color: var(--color-text-primary)">
    <AppNav :crumbs="crumbs" />

    <!-- Level tabs -->
    <div class="flex gap-1 px-4 pt-3 pb-1 flex-wrap">
      <button
        v-for="(lv, idx) in levels"
        :key="idx"
        class="px-3 py-1 rounded text-xs font-mono transition-all border"
        :class="idx === currentLevel
          ? 'border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[rgba(0,212,255,0.08)]'
          : idx <= unlockedLevel
            ? 'border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] cursor-pointer'
            : 'border-[var(--color-void-border)] text-[var(--color-text-muted)] opacity-40 cursor-not-allowed'"
        @click="idx <= unlockedLevel && initLevel(idx)"
      >
        L{{ idx + 1 }} <span class="hidden sm:inline">{{ idx <= unlockedLevel ? '' : '🔒' }}</span>
      </button>
      <button
        class="ml-auto px-3 py-1 rounded text-xs font-mono border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-orange-400 hover:text-orange-400"
        @click="initLevel(currentLevel)"
      >清空</button>
      <button
        v-if="currentLevel < levels.length - 1"
        class="px-3 py-1 rounded text-xs font-mono border border-[var(--color-void-border)] text-[var(--color-text-muted)] hover:border-yellow-400 hover:text-yellow-400"
        @click="unlockedLevel = Math.max(unlockedLevel, currentLevel + 1); initLevel(currentLevel + 1)"
      >跳过</button>
    </div>

    <!-- Main layout -->
    <div class="flex flex-1 overflow-hidden" style="height: calc(100vh - 96px)">

      <!-- Left panel: nodes + goal -->
      <div class="w-52 flex-shrink-0 flex flex-col gap-3 p-3 border-r overflow-y-auto" style="border-color: var(--color-void-border); background: var(--color-void-card)">
        <div>
          <div class="text-xs font-mono font-bold mb-1" style="color: var(--color-neon-cyan)">{{ levels[currentLevel].title }}</div>
          <div class="text-xs font-mono leading-relaxed" style="color: var(--color-text-muted)">目标：{{ levels[currentLevel].goal }}</div>
        </div>
        <div class="h-px" style="background: var(--color-void-border)"></div>
        <div class="text-xs font-mono mb-1" style="color: var(--color-text-muted)">可用节点（拖拽到画布）</div>
        <div
          v-for="type in levels[currentLevel].nodeTypes"
          :key="type"
          draggable="true"
          @dragstart="onPanelDragStart($event, type)"
          class="flex items-center gap-2 px-2 py-2 rounded border cursor-grab active:cursor-grabbing transition-all select-none group"
          :style="`border-color: ${NODE_CATALOGUE[type]?.color ?? '#888'}33; background: ${NODE_CATALOGUE[type]?.color ?? '#888'}0d`"
        >
          <span class="text-base leading-none">{{ NODE_CATALOGUE[type]?.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-mono font-semibold truncate" :style="`color: ${NODE_CATALOGUE[type]?.color}`">{{ type }}</div>
            <div class="text-[10px] font-mono truncate" style="color: var(--color-text-muted)">{{ NODE_CATALOGUE[type]?.description }}</div>
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <div
        ref="canvasEl"
        class="flex-1 relative overflow-hidden select-none"
        style="background: #08080f; cursor: default"
        @dragover="onCanvasDragOver"
        @drop="onCanvasDrop"
        @mousemove="onCanvasMousemove"
        @mouseup="onCanvasMouseup"
        @click="onCanvasClick"
      >
        <!-- SVG layer -->
        <svg class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 0">
          <defs>
            <pattern id="aiflow-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="15" cy="15" r="0.8" fill="rgba(255,255,255,0.05)" />
            </pattern>
            <!-- Glow filter -->
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#aiflow-grid)" />

          <!-- Connections -->
          <g v-for="conn in connections" :key="conn.id" class="pointer-events-auto">
            <path
              :d="connPath(conn)"
              stroke="#00d4ff"
              stroke-width="2"
              fill="none"
              stroke-dasharray="8 4"
              :stroke-dashoffset="dashOffset"
              filter="url(#glow)"
              opacity="0.85"
            />
            <!-- Click zone -->
            <path
              :d="connPath(conn)"
              stroke="transparent"
              stroke-width="12"
              fill="none"
              class="cursor-pointer"
              @click.stop="deleteConn(conn.id)"
            />
          </g>

          <!-- Pending connection line -->
          <path
            v-if="pendingConn"
            :d="(() => {
              const fn = getNodeById(pendingConn.fromNode)
              if (!fn) return ''
              const fp = fn.outputs[0]
              return bezierPath(fn.x + fp.x, fn.y + fp.y, pendingConn.mx, pendingConn.my)
            })()"
            stroke="rgba(0,212,255,0.45)"
            stroke-width="2"
            stroke-dasharray="6 3"
            fill="none"
          />

          <!-- Animated data packet -->
          <g v-for="(pkt, i) in animPacketPos" :key="i">
            <circle :cx="pkt.x" :cy="pkt.y" r="7" fill="#39ff14" :opacity="pkt.opacity" filter="url(#glow)" />
            <circle :cx="pkt.x" :cy="pkt.y" r="3" fill="#fff" :opacity="pkt.opacity" />
          </g>
        </svg>

        <!-- Nodes -->
        <div
          v-for="node in canvasNodes"
          :key="node.id"
          class="absolute rounded-lg border-2 flex items-center gap-2 font-mono select-none"
          :style="`
            left: ${node.x}px; top: ${node.y}px;
            width: ${NODE_W}px; height: ${NODE_H}px;
            border-color: ${node.color};
            background: ${node.color}18;
            box-shadow: 0 0 12px ${node.color}55${showHint && hintNodes.includes(node.type) ? ', 0 0 28px ' + node.color + 'cc' : ''};
            padding: 0 10px;
            z-index: 10;
            cursor: move;
            transition: box-shadow 0.2s;
          `"
          @mousedown="onNodeMousedown($event, node)"
          @dblclick.stop="deleteNode(node)"
        >
          <!-- Input port -->
          <div
            class="port absolute w-3 h-3 rounded-full border-2 cursor-crosshair"
            :style="`left: -7px; top: ${NODE_H/2 - 6}px; background: ${node.color}; border-color: #08080f; z-index: 20`"
            @click.stop="onInputPortClick($event, node, node.inputs[0])"
          />
          <span class="text-base leading-none flex-shrink-0" style="font-size: 1.1em">{{ node.icon }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-bold truncate leading-tight" :style="`color: ${node.color}`">{{ node.label }}</div>
            <div class="text-[9px] truncate" style="color: rgba(255,255,255,0.4)">{{ node.category }}</div>
          </div>
          <!-- Output port -->
          <div
            class="port absolute w-3 h-3 rounded-full border-2 cursor-crosshair"
            :style="`right: -7px; top: ${NODE_H/2 - 6}px; background: ${node.color}; border-color: #08080f; z-index: 20`"
            @click.stop="onOutputPortClick($event, node, node.outputs[0])"
          />
        </div>

        <!-- Empty hint -->
        <div
          v-if="canvasNodes.length === 0"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div class="text-center font-mono" style="color: rgba(255,255,255,0.12)">
            <div class="text-4xl mb-3">🧩</div>
            <div class="text-sm">从左侧拖拽节点到画布</div>
            <div class="text-xs mt-1">点击输出端口 → 点击输入端口 建立连接</div>
            <div class="text-xs mt-1">双击节点删除 | 点击连接线删除</div>
          </div>
        </div>
      </div>

      <!-- Right panel: status + run -->
      <div class="w-52 flex-shrink-0 flex flex-col gap-3 p-3 border-l overflow-y-auto" style="border-color: var(--color-void-border); background: var(--color-void-card)">
        <!-- Progress -->
        <div class="text-xs font-mono" style="color: var(--color-text-muted)">
          关卡进度 <span :style="`color: var(--color-neon-cyan)`">{{ currentLevel + 1 }}/{{ levels.length }}</span>
        </div>
        <div class="flex gap-1">
          <div
            v-for="i in levels.length" :key="i"
            class="flex-1 h-1 rounded-full"
            :style="i <= currentLevel + 1 ? 'background: var(--color-neon-cyan)' : 'background: rgba(255,255,255,0.1)'"
          />
        </div>

        <div class="h-px" style="background: var(--color-void-border)"></div>

        <!-- Validation -->
        <div class="text-xs font-mono font-bold" style="color: var(--color-text-muted)">连接状态</div>
        <div class="flex flex-col gap-1">
          <div
            v-for="req in levels[currentLevel].requiredConnections"
            :key="`${req.from}-${req.to}`"
            class="flex items-center gap-1 text-[10px] font-mono"
          >
            <span :style="connections.some(c => { const fn = getNodeById(c.fromNode); const tn = getNodeById(c.toNode); return fn?.type === req.from && tn?.type === req.to }) ? 'color:#39ff14' : 'color:#ff4444'">
              {{ connections.some(c => { const fn = getNodeById(c.fromNode); const tn = getNodeById(c.toNode); return fn?.type === req.from && tn?.type === req.to }) ? '✓' : '✗' }}
            </span>
            <span style="color: rgba(255,255,255,0.5)" class="truncate">{{ req.from }}→{{ req.to }}</span>
          </div>
        </div>

        <div class="h-px" style="background: var(--color-void-border)"></div>

        <!-- Hint -->
        <button
          class="text-xs font-mono px-3 py-2 rounded border transition-all"
          style="border-color: var(--color-void-border); color: var(--color-text-muted)"
          :class="showHint ? 'border-yellow-400 text-yellow-400' : 'hover:border-yellow-400 hover:text-yellow-400'"
          @click="showHintFn"
        >
          💡 提示下一步
        </button>

        <div v-if="showHint" class="text-[10px] font-mono p-2 rounded" style="background: rgba(255,200,0,0.08); border: 1px solid rgba(255,200,0,0.3); color: #ffd700">
          连接 <b>{{ hintNodes[0] }}</b> → <b>{{ hintNodes[1] }}</b>
        </div>

        <!-- Run button -->
        <button
          class="mt-auto text-sm font-mono font-bold px-4 py-3 rounded-lg border-2 transition-all"
          :class="isValid && !runningAnim
            ? 'cursor-pointer'
            : 'opacity-40 cursor-not-allowed'"
          :style="isValid && !runningAnim
            ? 'border-color: #39ff14; color: #39ff14; background: rgba(57,255,20,0.1); box-shadow: 0 0 16px rgba(57,255,20,0.3)'
            : 'border-color: var(--color-void-border); color: var(--color-text-muted)'"
          @click="runPipeline"
        >
          {{ runningAnim ? '⏳ 运行中...' : '▶ 运行流水线' }}
        </button>
        <div v-if="!isValid && canvasNodes.length > 0" class="text-[10px] font-mono" style="color: #ff6666">
          还差 {{ validationErrors.length }} 条连接
        </div>
      </div>
    </div>

    <!-- Success modal -->
    <Teleport to="body">
      <div
        v-if="showSuccess"
        class="fixed inset-0 flex items-center justify-center z-50"
        style="background: rgba(0,0,0,0.8); backdrop-filter: blur(4px)"
        @click.self="showSuccess = false"
      >
        <div
          class="rounded-2xl border-2 p-8 max-w-md w-full mx-4 font-mono"
          style="border-color: var(--color-neon-cyan); background: #0a0a1a; box-shadow: 0 0 48px rgba(0,212,255,0.3)"
        >
          <div class="text-3xl text-center mb-4">🎉</div>
          <div class="text-center text-lg font-bold mb-2" style="color: var(--color-neon-cyan)">流水线运行成功！</div>
          <div class="text-sm leading-relaxed mb-6" style="color: var(--color-text-muted)">
            {{ levels[currentLevel].successInfo }}
          </div>
          <div class="flex gap-3 justify-center">
            <button
              class="px-4 py-2 rounded border text-sm transition-all hover:opacity-80"
              style="border-color: var(--color-void-border); color: var(--color-text-muted)"
              @click="showSuccess = false"
            >继续探索</button>
            <button
              v-if="currentLevel < levels.length - 1"
              class="px-4 py-2 rounded border-2 text-sm font-bold transition-all"
              style="border-color: #39ff14; color: #39ff14; background: rgba(57,255,20,0.1)"
              @click="goNextLevel"
            >下一关 →</button>
            <div v-else class="px-4 py-2 text-sm" style="color: var(--color-neon-cyan)">🏆 全部通关！</div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
