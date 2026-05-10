<script setup lang="ts">
import { NODE_SPECS, NO_FLOW, makeId, makeNode, normalizeRunResult, formatValue, formatLogValue } from '~/utils/ai-flow'
import { PRESETS, buildPreset } from '~/utils/ai-flow-presets'
import type { FlowNode, Wire, FlowGroup } from '~/types/ai-flow'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `AI Flow | ${siteName}` })

const crumbs = [
  { label: 'lab', href: '/lab' },
  { label: 'games', href: '/lab' },
  { label: 'ai-flow' },
]

// ── 常量 ──────────────────────────────────────────────────
const NODE_W = 260
const HEADER_H = 40
const DESC_H = 38
const RESULT_H = 78
const PORT_R = 6
const STAGE_W = 3200
const STAGE_H = 2000
const MINIMAP_W = 220
const MINIMAP_H = 140
const STORAGE_KEY = 'void-blog:ai-flow:v2'

// ── 状态 ──────────────────────────────────────────────────
const nodes = ref<FlowNode[]>([])
const wires = ref<Wire[]>([])
const groups = ref<FlowGroup[]>([])
const canvasEl = ref<HTMLDivElement | null>(null)
const runLog = ref<string[]>([])
const globalError = ref('')
const lastRunSummary = ref('尚未运行')
const selectedPreset = ref('branch')
const selectedNodeIds = ref<string[]>([])
const viewportSize = ref({ width: 0, height: 0 })
const spacePressed = ref(false)
const importJson = ref('')
const saveState = ref('not-saved')
const hasHydrated = ref(false)
const historyPast = ref<string[]>([])
const historyFuture = ref<string[]>([])
const suspendHistory = ref(false)
const lastSnapshot = ref('')
const quickAddOpen = ref(false)
const quickAddQuery = ref('')

const view = reactive({ x: 120, y: 80, scale: 1 })

const pendingWire = ref<{ fromNode: string; fromPort: number; x: number; y: number } | null>(null)
const dragging = ref<{
  ids: string[]
  startX: number
  startY: number
  origins: Record<string, { x: number; y: number }>
} | null>(null)
const panning = ref<{
  startScreenX: number
  startScreenY: number
  originX: number
  originY: number
} | null>(null)
const groupDragging = ref<{
  groupId: string
  startX: number
  startY: number
  origins: Record<string, { x: number; y: number }>
} | null>(null)
const selecting = ref<{
  startX: number
  startY: number
  currentX: number
  currentY: number
  startScreenX: number
  startScreenY: number
  currentScreenX: number
  currentScreenY: number
  baseSelection: string[]
} | null>(null)

// ── 工具函数 ──────────────────────────────────────────────
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button, label'))
}

function specFor(type: string) {
  return NODE_SPECS[type]
}

function nodeHeight(node: FlowNode) {
  const spec = specFor(node.type)
  const paramsH = spec.params.reduce((sum, param) => sum + (param.kind === 'textarea' ? 88 : 42), 0)
  return HEADER_H + DESC_H + paramsH + RESULT_H
}

function inputPortY(node: FlowNode, index: number) {
  const spec = specFor(node.type)
  const h = nodeHeight(node)
  if (spec.inputs <= 1) return h / 2
  return (index + 1) * (h / (spec.inputs + 1))
}

function outputPortY(node: FlowNode, index: number) {
  const spec = specFor(node.type)
  const h = nodeHeight(node)
  if (spec.outputs <= 1) return h / 2
  return (index + 1) * (h / (spec.outputs + 1))
}

function inputLabel(spec: ReturnType<typeof specFor>, index: number) {
  return spec.inputLabels?.[index] ?? `in${index + 1}`
}

function outputLabel(spec: ReturnType<typeof specFor>, index: number) {
  return spec.outputLabels?.[index] ?? `out${index + 1}`
}

function getNode(nodeId: string) {
  return nodes.value.find(n => n.id === nodeId)
}

function outputPoint(node: FlowNode, port: number) {
  return { x: node.x + NODE_W, y: node.y + outputPortY(node, port) }
}

function inputPoint(node: FlowNode, port: number) {
  return { x: node.x, y: node.y + inputPortY(node, port) }
}

function bezierPath(fromX: number, fromY: number, toX: number, toY: number) {
  const cx = Math.max(60, Math.abs(toX - fromX) * 0.45)
  return `M ${fromX} ${fromY} C ${fromX + cx} ${fromY}, ${toX - cx} ${toY}, ${toX} ${toY}`
}

function wirePath(wire: Wire) {
  const from = getNode(wire.fromNode)
  const to = getNode(wire.toNode)
  if (!from || !to) return ''
  const start = outputPoint(from, wire.fromPort)
  const end = inputPoint(to, wire.toPort)
  return bezierPath(start.x, start.y, end.x, end.y)
}

function wireColor(wire: Wire) {
  const node = getNode(wire.fromNode)
  return node ? specFor(node.type).color : '#00d4ff'
}

function nodeColorFn(type: string) {
  return NODE_SPECS[type]?.color ?? '#00d4ff'
}

function groupBounds(group: FlowGroup) {
  const members = group.nodeIds.map(id => getNode(id)).filter(Boolean) as FlowNode[]
  if (!members.length) return { x: 0, y: 0, width: 220, height: 140 }
  const minX = Math.min(...members.map(n => n.x)) - 28
  const minY = Math.min(...members.map(n => n.y)) - 52
  const maxX = Math.max(...members.map(n => n.x + NODE_W)) + 28
  const maxY = Math.max(...members.map(n => n.y + nodeHeight(n))) + 28
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

function normalizeGroups() {
  const nodeIds = new Set(nodes.value.map(n => n.id))
  groups.value = groups.value
    .map(g => ({ ...g, nodeIds: g.nodeIds.filter(id => nodeIds.has(id)) }))
    .filter(g => g.nodeIds.length > 0)
}

function pointerToWorld(clientX: number, clientY: number) {
  if (!canvasEl.value) return { x: 0, y: 0, screenX: 0, screenY: 0 }
  const rect = canvasEl.value.getBoundingClientRect()
  const screenX = clientX - rect.left
  const screenY = clientY - rect.top
  return {
    x: (screenX - view.x) / view.scale,
    y: (screenY - view.y) / view.scale,
    screenX,
    screenY,
  }
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)]
}

function isNodeSelected(nodeId: string) {
  return selectedNodeIds.value.includes(nodeId)
}

function wireCountForInput(nodeId: string, toPort: number) {
  return wires.value.some(w => w.toNode === nodeId && w.toPort === toPort)
}

function updateViewportSize() {
  if (!canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  viewportSize.value = { width: rect.width, height: rect.height }
}

// ── Computed ──────────────────────────────────────────────
const stageStyle = computed(() => ({
  width: `${STAGE_W}px`,
  height: `${STAGE_H}px`,
  transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
  transformOrigin: '0 0',
}))

const pendingWirePath = computed(() => {
  if (!pendingWire.value) return ''
  const from = getNode(pendingWire.value.fromNode)
  if (!from) return ''
  const start = outputPoint(from, pendingWire.value.fromPort)
  return bezierPath(start.x, start.y, pendingWire.value.x, pendingWire.value.y)
})

const groupedSpecs = computed(() => {
  const out: Record<string, Array<{ type: string; spec: ReturnType<typeof specFor> }>> = {}
  for (const [type, spec] of Object.entries(NODE_SPECS)) {
    if (!out[spec.category]) out[spec.category] = []
    out[spec.category].push({ type, spec })
  }
  return out
})

const quickAddItems = computed(() => {
  const q = quickAddQuery.value.trim().toLowerCase()
  const all = Object.entries(NODE_SPECS).map(([type, spec]) => ({ type, spec }))
  if (!q) return all.slice(0, 16)
  return all.filter(({ type, spec }) =>
    [type, spec.title, spec.category, spec.description].join(' ').toLowerCase().includes(q)
  ).slice(0, 24)
})

const mermaidCode = computed(() => {
  const idMap = new Map<string, string>()
  nodes.value.forEach((node, idx) => idMap.set(node.id, `n${idx + 1}`))
  const lines = ['flowchart LR']
  for (const node of nodes.value) {
    const spec = specFor(node.type)
    const id = idMap.get(node.id)
    const label = `${spec.title}\\n${node.type}`.replace(/"/g, '\\"')
    lines.push(`  ${id}["${label}"]`)
  }
  for (const wire of wires.value) {
    const from = idMap.get(wire.fromNode)
    const to = idMap.get(wire.toNode)
    const source = getNode(wire.fromNode)
    const target = getNode(wire.toNode)
    const sourceSpec = source ? specFor(source.type) : null
    const targetSpec = target ? specFor(target.type) : null
    const label = sourceSpec?.outputs && sourceSpec.outputs > 1
      ? `${outputLabel(sourceSpec, wire.fromPort)}→${targetSpec ? inputLabel(targetSpec, wire.toPort) : `in${wire.toPort + 1}`}`
      : ''
    if (from && to) lines.push(label ? `  ${from} -->|${label}| ${to}` : `  ${from} --> ${to}`)
  }
  return lines.join('\n')
})

const graphJsonObject = computed(() => ({
  nodes: nodes.value.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, params: n.params })),
  wires: wires.value,
  groups: groups.value,
  view: { x: view.x, y: view.y, scale: view.scale },
}))

const graphJson = computed(() => JSON.stringify(graphJsonObject.value, null, 2))

const selectionRectStyle = computed(() => {
  if (!selecting.value) return null
  const left = Math.min(selecting.value.startScreenX, selecting.value.currentScreenX)
  const top = Math.min(selecting.value.startScreenY, selecting.value.currentScreenY)
  const width = Math.abs(selecting.value.currentScreenX - selecting.value.startScreenX)
  const height = Math.abs(selecting.value.currentScreenY - selecting.value.startScreenY)
  return { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }
})

const viewportWorld = computed(() => ({
  x: -view.x / view.scale,
  y: -view.y / view.scale,
  width: viewportSize.value.width / view.scale,
  height: viewportSize.value.height / view.scale,
}))

const minimapViewportStyle = computed(() => ({
  left: `${clamp((viewportWorld.value.x / STAGE_W) * MINIMAP_W, 0, MINIMAP_W)}px`,
  top: `${clamp((viewportWorld.value.y / STAGE_H) * MINIMAP_H, 0, MINIMAP_H)}px`,
  width: `${clamp((viewportWorld.value.width / STAGE_W) * MINIMAP_W, 12, MINIMAP_W)}px`,
  height: `${clamp((viewportWorld.value.height / STAGE_H) * MINIMAP_H, 12, MINIMAP_H)}px`,
}))

// ── Graph 操作 ────────────────────────────────────────────
function restoreGraph(payload: any) {
  if (!payload || typeof payload !== 'object') throw new Error('无效的 graph payload')
  if (!Array.isArray(payload.nodes) || !Array.isArray(payload.wires)) throw new Error('缺少 nodes / wires')

  const validNodes = payload.nodes
    .filter((n: any) => n && typeof n.id === 'string' && typeof n.type === 'string' && NODE_SPECS[n.type])
    .map((n: any) => ({
      id: n.id, type: n.type,
      x: Number(n.x ?? 0), y: Number(n.y ?? 0),
      params: { ...specFor(n.type).createParams(), ...(n.params || {}) },
      result: undefined, outputsData: [], error: '',
    }))

  const nodeIds = new Set(validNodes.map((n: any) => n.id))
  const validWires = payload.wires
    .filter((w: any) => w && typeof w.id === 'string' && nodeIds.has(w.fromNode) && nodeIds.has(w.toNode))
    .map((w: any) => ({
      id: w.id, fromNode: w.fromNode,
      fromPort: Number(w.fromPort ?? 0),
      toNode: w.toNode,
      toPort: Number(w.toPort ?? 0),
    }))

  const validGroups = Array.isArray(payload.groups)
    ? payload.groups
      .filter((g: any) => g && typeof g.id === 'string')
      .map((g: any) => ({
        id: g.id, title: String(g.title || 'Group'), color: String(g.color || '#00d4ff'),
        nodeIds: Array.isArray(g.nodeIds) ? g.nodeIds.filter((id: any) => nodeIds.has(String(id))).map(String) : [],
      }))
      .filter((g: any) => g.nodeIds.length > 0)
    : []

  nodes.value = validNodes
  wires.value = validWires
  groups.value = validGroups
  selectedNodeIds.value = []
  pendingWire.value = null
  runLog.value = []
  globalError.value = ''

  if (payload.view && typeof payload.view === 'object') {
    view.x = Number(payload.view.x ?? 120)
    view.y = Number(payload.view.y ?? 80)
    view.scale = clamp(Number(payload.view.scale ?? 1), 0.35, 2.5)
  }
}

function saveGraphToLocal() {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, graphJson.value)
  saveState.value = `saved ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
}

function commitHistorySnapshot(snapshot: string) {
  if (!hasHydrated.value || suspendHistory.value) return
  if (!lastSnapshot.value) { lastSnapshot.value = snapshot; return }
  if (snapshot === lastSnapshot.value) return
  historyPast.value.push(lastSnapshot.value)
  if (historyPast.value.length > 80) historyPast.value.shift()
  historyFuture.value = []
  lastSnapshot.value = snapshot
}

function applySnapshot(snapshot: string, mode: 'undo' | 'redo') {
  try {
    suspendHistory.value = true
    restoreGraph(JSON.parse(snapshot))
    selectedPreset.value = 'custom'
    lastSnapshot.value = snapshot
    lastRunSummary.value = mode === 'undo' ? '已撤销一步' : '已重做一步'
    runGraph()
    saveGraphToLocal()
  } finally {
    suspendHistory.value = false
  }
}

function undo() {
  if (!historyPast.value.length) return
  const current = graphJson.value
  const snapshot = historyPast.value.pop()!
  historyFuture.value.push(current)
  applySnapshot(snapshot, 'undo')
}

function redo() {
  if (!historyFuture.value.length) return
  const current = graphJson.value
  const snapshot = historyFuture.value.pop()!
  historyPast.value.push(current)
  applySnapshot(snapshot, 'redo')
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    lastRunSummary.value = `${label} 已复制到剪贴板`
  } catch {
    lastRunSummary.value = `${label} 复制失败，请手动复制`
  }
}

function fitView() {
  updateViewportSize()
  if (!nodes.value.length) { view.x = 120; view.y = 80; view.scale = 1; return }
  const minX = Math.min(...nodes.value.map(n => n.x))
  const minY = Math.min(...nodes.value.map(n => n.y))
  const maxX = Math.max(...nodes.value.map(n => n.x + NODE_W))
  const maxY = Math.max(...nodes.value.map(n => n.y + nodeHeight(n)))
  const w = Math.max(200, maxX - minX)
  const h = Math.max(160, maxY - minY)
  const scaleX = (viewportSize.value.width - 120) / w
  const scaleY = (viewportSize.value.height - 120) / h
  view.scale = clamp(Math.min(scaleX, scaleY), 0.35, 2)
  view.x = (viewportSize.value.width - w * view.scale) / 2 - minX * view.scale
  view.y = (viewportSize.value.height - h * view.scale) / 2 - minY * view.scale
}

function resetZoom() {
  view.scale = 1; view.x = 120; view.y = 80
}

function autoLayout() {
  if (!nodes.value.length) return
  const nodeMap = new Map(nodes.value.map(n => [n.id, n]))
  const indegree = new Map(nodes.value.map(n => [n.id, 0]))
  const outgoing = new Map(nodes.value.map(n => [n.id, [] as Wire[]]))
  for (const wire of wires.value) {
    if (!nodeMap.has(wire.fromNode) || !nodeMap.has(wire.toNode)) continue
    indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) + 1)
    outgoing.get(wire.fromNode)!.push(wire)
  }
  const queue = nodes.value.filter(n => (indegree.get(n.id) ?? 0) === 0).map(n => n.id)
  const level = new Map<string, number>(nodes.value.map(n => [n.id, 0]))
  while (queue.length) {
    const id = queue.shift()!
    for (const wire of outgoing.get(id) ?? []) {
      level.set(wire.toNode, Math.max(level.get(wire.toNode) ?? 0, (level.get(id) ?? 0) + 1))
      indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) - 1)
      if ((indegree.get(wire.toNode) ?? 0) === 0) queue.push(wire.toNode)
    }
  }
  const layers = new Map<number, FlowNode[]>()
  for (const node of nodes.value) {
    const l = level.get(node.id) ?? 0
    if (!layers.has(l)) layers.set(l, [])
    layers.get(l)!.push(node)
  }
  for (const layerIndex of Array.from(layers.keys()).sort((a, b) => a - b)) {
    let y = 80
    for (const node of layers.get(layerIndex)!) {
      node.x = 80 + layerIndex * 360
      node.y = y
      y += nodeHeight(node) + 60
    }
  }
  lastRunSummary.value = '已自动布局'
  fitView()
}

function nudgeSelected(dx: number, dy: number) {
  if (!selectedNodeIds.value.length) return
  for (const id of selectedNodeIds.value) {
    const node = getNode(id)
    if (!node) continue
    node.x += dx; node.y += dy
  }
}

function duplicateSelected() {
  if (!selectedNodeIds.value.length) return
  const selectedSet = new Set(selectedNodeIds.value)
  const idMap = new Map<string, string>()
  const clones: FlowNode[] = []
  for (const id of selectedNodeIds.value) {
    const node = getNode(id)
    if (!node) continue
    const cloneId = makeId('node')
    idMap.set(id, cloneId)
    clones.push({ id: cloneId, type: node.type, x: node.x + 48, y: node.y + 48, params: JSON.parse(JSON.stringify(node.params)), result: undefined, outputsData: [], error: '' })
  }
  const cloneWires = wires.value
    .filter(w => selectedSet.has(w.fromNode) && selectedSet.has(w.toNode))
    .map(w => ({ id: makeId('wire'), fromNode: idMap.get(w.fromNode)!, fromPort: w.fromPort, toNode: idMap.get(w.toNode)!, toPort: w.toPort }))
  nodes.value.push(...clones)
  wires.value.push(...cloneWires)
  selectedNodeIds.value = clones.map(n => n.id)
  lastRunSummary.value = `已复制 ${clones.length} 个节点`
}

function createGroupFromSelection() {
  if (!selectedNodeIds.value.length) return
  const colors = ['#00d4ff', '#8b5cf6', '#39ff14', '#f59e0b', '#ff5ea8']
  groups.value.push({
    id: makeId('group'),
    title: `Group ${groups.value.length + 1}`,
    color: colors[groups.value.length % colors.length],
    nodeIds: [...selectedNodeIds.value],
  })
  lastRunSummary.value = `已将 ${selectedNodeIds.value.length} 个节点编组`
}

function deleteGroup(groupId: string) {
  groups.value = groups.value.filter(g => g.id !== groupId)
}

function importGraphJson() {
  try {
    const payload = JSON.parse(importJson.value)
    restoreGraph(payload)
    selectedPreset.value = 'custom'
    hasHydrated.value = true
    lastRunSummary.value = 'JSON 导入成功'
    fitView()
    runGraph()
  } catch (error: any) {
    globalError.value = `导入失败：${error?.message || '未知错误'}`
  }
}

function clearCanvas() {
  nodes.value = []; wires.value = []; groups.value = []
  pendingWire.value = null; runLog.value = []; globalError.value = ''
  selectedNodeIds.value = []; selectedPreset.value = 'custom'
  importJson.value = ''; quickAddOpen.value = false; quickAddQuery.value = ''
  lastRunSummary.value = '已清空画布'
}

function createNodeAtViewportCenter(type: string) {
  const x = -view.x / view.scale + viewportSize.value.width / view.scale / 2 - NODE_W / 2
  const y = -view.y / view.scale + viewportSize.value.height / view.scale / 2 - 120
  const node = makeNode(type, x, y)
  nodes.value.push(node)
  selectedNodeIds.value = [node.id]
  quickAddOpen.value = false; quickAddQuery.value = ''
  lastRunSummary.value = `已创建节点 ${specFor(type).title}`
}

function loadPreset(key: string) {
  clearCanvas()
  selectedPreset.value = key
  const snapshot = buildPreset(key)
  if (!snapshot) return
  nodes.value = snapshot.nodes
  wires.value = snapshot.wires
  groups.value = snapshot.groups
  lastRunSummary.value = `已载入 preset: ${key}`
  fitView()
  runGraph()
}

// ── 运行图 ────────────────────────────────────────────────
function runGraph() {
  for (const node of nodes.value) { node.result = undefined; node.outputsData = []; node.error = '' }
  runLog.value = []; globalError.value = ''

  const nodeMap = new Map(nodes.value.map(n => [n.id, n]))
  const incoming = new Map<string, Wire[]>()
  const outgoing = new Map<string, Wire[]>()
  const indegree = new Map<string, number>()
  for (const node of nodes.value) { incoming.set(node.id, []); outgoing.set(node.id, []); indegree.set(node.id, 0) }
  for (const wire of wires.value) {
    if (!nodeMap.has(wire.fromNode) || !nodeMap.has(wire.toNode)) continue
    incoming.get(wire.toNode)!.push(wire)
    outgoing.get(wire.fromNode)!.push(wire)
    indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) + 1)
  }
  const queue = nodes.value.filter(n => (indegree.get(n.id) ?? 0) === 0).map(n => n.id)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()!; order.push(id)
    for (const wire of outgoing.get(id) ?? []) {
      indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) - 1)
      if ((indegree.get(wire.toNode) ?? 0) === 0) queue.push(wire.toNode)
    }
  }
  if (order.length !== nodes.value.length) {
    globalError.value = '图里存在环，当前执行器只支持 DAG（无环图）'
    lastRunSummary.value = '执行失败：检测到循环依赖'; return
  }

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId)!
    const spec = specFor(node.type)
    const inWires = [...(incoming.get(node.id) ?? [])].sort((a, b) => a.toPort - b.toPort)
    const inputs = Array.from({ length: spec.inputs }, () => undefined) as any[]
    const linkedPorts = new Set(inWires.map(w => w.toPort))

    if (spec.inputs > 0 && Array.from({ length: spec.inputs }, (_, i) => i).some(i => !linkedPorts.has(i))) {
      node.error = '输入未连完整'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`✗ ${spec.title}: 输入未连完整`); continue
    }
    for (const wire of inWires) {
      const source = nodeMap.get(wire.fromNode)
      const sourceValue = source?.outputsData?.[wire.fromPort]
      inputs[wire.toPort] = sourceValue === undefined ? source?.result : sourceValue
    }
    if (inputs.includes(NO_FLOW)) {
      node.result = '⏭ skipped (no flow)'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`↷ ${spec.title}: skipped (no flow)`); continue
    }
    if (spec.inputs > 0 && inputs.some(v => v === undefined)) {
      node.error = '上游结果缺失'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`✗ ${spec.title}: 上游结果缺失`); continue
    }
    try {
      const normalized = normalizeRunResult(spec.run({ inputs, params: node.params }), spec.outputs)
      node.result = normalized.result; node.outputsData = normalized.outputs
      runLog.value.push(`✓ ${spec.title}: ${formatLogValue(normalized.result)}`)
    } catch (error: any) {
      node.error = error?.message || '运行失败'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`✗ ${spec.title}: ${node.error}`)
    }
  }

  const ok = nodes.value.filter(n => !n.error).length
  lastRunSummary.value = `执行完成：${ok}/${nodes.value.length} 节点可用`
}

// ── 事件处理 ──────────────────────────────────────────────
function onGroupMouseDown(e: MouseEvent, group: FlowGroup) {
  const target = e.target as HTMLElement
  if (target.closest('input, button')) return
  e.preventDefault(); e.stopPropagation()
  const point = pointerToWorld(e.clientX, e.clientY)
  selectedNodeIds.value = [...group.nodeIds]
  groupDragging.value = {
    groupId: group.id, startX: point.x, startY: point.y,
    origins: Object.fromEntries(group.nodeIds.map(id => { const n = getNode(id)!; return [id, { x: n.x, y: n.y }] })),
  }
}

function onNodeMouseDown(e: MouseEvent, node: FlowNode) {
  const target = e.target as HTMLElement
  if (target.closest('input, textarea, select, button, label, .port')) return
  e.preventDefault(); e.stopPropagation()
  const point = pointerToWorld(e.clientX, e.clientY)
  let ids = selectedNodeIds.value
  if (e.shiftKey) ids = uniqueIds([...selectedNodeIds.value, node.id])
  else if (!selectedNodeIds.value.includes(node.id)) ids = [node.id]
  selectedNodeIds.value = ids
  const dragIds = ids.includes(node.id) ? ids : [node.id]
  dragging.value = {
    ids: dragIds, startX: point.x, startY: point.y,
    origins: Object.fromEntries(dragIds.map(id => { const n = getNode(id)!; return [id, { x: n.x, y: n.y }] })),
  }
}

function onCanvasMouseDown(e: MouseEvent) {
  if (isEditableTarget(e.target)) return
  const target = e.target as HTMLElement
  if (target.closest('.node-shell, .port, .minimap-box')) return
  const point = pointerToWorld(e.clientX, e.clientY)
  pendingWire.value = null
  if (e.button === 1 || e.altKey || spacePressed.value) {
    e.preventDefault()
    panning.value = { startScreenX: point.screenX, startScreenY: point.screenY, originX: view.x, originY: view.y }
    return
  }
  if (e.button !== 0) return
  selecting.value = {
    startX: point.x, startY: point.y, currentX: point.x, currentY: point.y,
    startScreenX: point.screenX, startScreenY: point.screenY,
    currentScreenX: point.screenX, currentScreenY: point.screenY,
    baseSelection: e.shiftKey ? [...selectedNodeIds.value] : [],
  }
  if (!e.shiftKey) selectedNodeIds.value = []
}

function applySelectionRect() {
  if (!selecting.value) return
  const x1 = Math.min(selecting.value.startX, selecting.value.currentX)
  const y1 = Math.min(selecting.value.startY, selecting.value.currentY)
  const x2 = Math.max(selecting.value.startX, selecting.value.currentX)
  const y2 = Math.max(selecting.value.startY, selecting.value.currentY)
  const inside = nodes.value
    .filter(n => n.x < x2 && n.x + NODE_W > x1 && n.y < y2 && n.y + nodeHeight(n) > y1)
    .map(n => n.id)
  selectedNodeIds.value = uniqueIds([...selecting.value.baseSelection, ...inside])
}

function onCanvasMouseMove(e: MouseEvent) {
  const point = pointerToWorld(e.clientX, e.clientY)
  if (panning.value) {
    view.x = panning.value.originX + (point.screenX - panning.value.startScreenX)
    view.y = panning.value.originY + (point.screenY - panning.value.startScreenY)
    return
  }
  if (groupDragging.value) {
    const dx = point.x - groupDragging.value.startX
    const dy = point.y - groupDragging.value.startY
    for (const [id, origin] of Object.entries(groupDragging.value.origins)) {
      const node = getNode(id)
      if (node) { node.x = origin.x + dx; node.y = origin.y + dy }
    }
  }
  if (dragging.value) {
    const dx = point.x - dragging.value.startX
    const dy = point.y - dragging.value.startY
    for (const id of dragging.value.ids) {
      const node = getNode(id)
      const origin = dragging.value.origins[id]
      if (node && origin) { node.x = origin.x + dx; node.y = origin.y + dy }
    }
  }
  if (pendingWire.value) { pendingWire.value.x = point.x; pendingWire.value.y = point.y }
  if (selecting.value) {
    selecting.value.currentX = point.x; selecting.value.currentY = point.y
    selecting.value.currentScreenX = point.screenX; selecting.value.currentScreenY = point.screenY
    applySelectionRect()
  }
}

function onCanvasMouseUp() {
  dragging.value = null; groupDragging.value = null; panning.value = null; selecting.value = null
}

function onCanvasWheel(e: WheelEvent) {
  if (e.ctrlKey) return
  e.preventDefault()
  const point = pointerToWorld(e.clientX, e.clientY)
  const beforeX = point.x; const beforeY = point.y
  const nextScale = clamp(view.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.35, 2.5)
  view.scale = nextScale
  view.x = point.screenX - beforeX * view.scale
  view.y = point.screenY - beforeY * view.scale
}

function startWire(e: MouseEvent, node: FlowNode, port: number) {
  e.stopPropagation()
  const point = pointerToWorld(e.clientX, e.clientY)
  pendingWire.value = { fromNode: node.id, fromPort: port, x: point.x, y: point.y }
}

function finishWire(e: MouseEvent, node: FlowNode, port: number) {
  e.stopPropagation()
  const pending = pendingWire.value
  if (!pending) return
  if (pending.fromNode === node.id) { pendingWire.value = null; return }
  const targetSpec = specFor(node.type)
  if (port >= targetSpec.inputs) return
  const dup = wires.value.find(w => w.fromNode === pending.fromNode && w.fromPort === pending.fromPort && w.toNode === node.id && w.toPort === port)
  if (dup) { pendingWire.value = null; return }
  wires.value = wires.value.filter(w => !(w.toNode === node.id && w.toPort === port))
  wires.value.push({ id: makeId('wire'), fromNode: pending.fromNode, fromPort: pending.fromPort, toNode: node.id, toPort: port })
  pendingWire.value = null
}

function deleteWire(wireId: string) {
  wires.value = wires.value.filter(w => w.id !== wireId)
}

function deleteNode(nodeId: string) {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  wires.value = wires.value.filter(w => w.fromNode !== nodeId && w.toNode !== nodeId)
  selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
}

function deleteSelected() {
  if (!selectedNodeIds.value.length) return
  const set = new Set(selectedNodeIds.value)
  nodes.value = nodes.value.filter(n => !set.has(n.id))
  wires.value = wires.value.filter(w => !set.has(w.fromNode) && !set.has(w.toNode))
  normalizeGroups()
  selectedNodeIds.value = []
  lastRunSummary.value = '已删除选中节点'
}

function onMinimapClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  view.x = viewportSize.value.width / 2 - x * STAGE_W * view.scale
  view.y = viewportSize.value.height / 2 - y * STAGE_H * view.scale
}

function onWindowKeyDown(e: KeyboardEvent) {
  if (quickAddOpen.value) {
    if (e.key === 'Escape') { quickAddOpen.value = false; quickAddQuery.value = ''; e.preventDefault(); return }
    if (e.key === 'Enter' && quickAddItems.value.length) { createNodeAtViewportCenter(quickAddItems.value[0].type); e.preventDefault(); return }
  }
  if (isEditableTarget(e.target)) return
  if (e.key === 'Tab') { quickAddOpen.value = !quickAddOpen.value; if (!quickAddOpen.value) quickAddQuery.value = ''; e.preventDefault(); return }
  if (e.code === 'Space') { spacePressed.value = true; e.preventDefault() }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.value.length) { deleteSelected(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { selectedNodeIds.value = nodes.value.map(n => n.id); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { duplicateSelected(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') { createGroupFromSelection(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') { autoLayout(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { undo(); e.preventDefault() }
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')) { redo(); e.preventDefault() }
  if (selectedNodeIds.value.length && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const step = e.shiftKey ? 16 : 4
    if (e.key === 'ArrowUp') nudgeSelected(0, -step)
    if (e.key === 'ArrowDown') nudgeSelected(0, step)
    if (e.key === 'ArrowLeft') nudgeSelected(-step, 0)
    if (e.key === 'ArrowRight') nudgeSelected(step, 0)
    e.preventDefault()
  }
}

function onWindowKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spacePressed.value = false
}

// ── Autosave + History ────────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null

watch(() => graphJson.value, (snapshot) => {
  commitHistorySnapshot(snapshot)
  if (!hasHydrated.value || suspendHistory.value) return
  saveState.value = 'saving…'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveGraphToLocal(), 250)
})

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('keydown', onWindowKeyDown)
  window.addEventListener('keyup', onWindowKeyUp)

  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (saved) {
      restoreGraph(JSON.parse(saved))
      selectedPreset.value = 'custom'
      hasHydrated.value = true
      importJson.value = saved
      lastRunSummary.value = '已恢复上次编辑状态'
      runGraph(); return
    }
  } catch (error: any) {
    saveState.value = `restore failed: ${error?.message || 'unknown'}`
  }

  hasHydrated.value = true
  loadPreset('branch')
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
  window.removeEventListener('resize', updateViewportSize)
  window.removeEventListener('keydown', onWindowKeyDown)
  window.removeEventListener('keyup', onWindowKeyUp)
})
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background:#08080f;color:var(--color-text-primary)">
    <AppNav :crumbs="crumbs" />

    <!-- 顶部工具栏 -->
    <AiFlowToolbar
      :has-selection="selectedNodeIds.length > 0"
      :can-undo="historyPast.length > 0"
      :can-redo="historyFuture.length > 0"
      @run="runGraph"
      @fit-view="fitView"
      @reset-zoom="resetZoom"
      @auto-layout="autoLayout"
      @undo="undo"
      @redo="redo"
      @clear="clearCanvas"
      @delete-selected="deleteSelected"
      @duplicate="duplicateSelected"
      @group="createGroupFromSelection"
      @copy-mermaid="copyText(mermaidCode, 'Mermaid')"
      @copy-json="copyText(graphJson, 'JSON')"
      @quick-add="quickAddOpen = true"
    />

    <div class="flex flex-1 overflow-hidden" style="height:calc(100vh - 96px)">
      <!-- 左侧面板 -->
      <AiFlowNodePalette
        :grouped-specs="groupedSpecs"
        :presets="PRESETS"
        :selected-preset="selectedPreset"
        @load-preset="loadPreset"
        @drag-start="(e, type) => e.dataTransfer?.setData('nodeType', type)"
      />

      <!-- 画布 -->
      <main
        ref="canvasEl"
        class="flex-1 relative overflow-hidden select-none"
        style="background:#08080f"
        @dragover.prevent
        @drop.prevent="(e) => { const type = e.dataTransfer?.getData('nodeType'); if (type) { const p = pointerToWorld(e.clientX, e.clientY); nodes.push(makeNode(type, p.x - NODE_W / 2, p.y - 24)) } }"
        @mousedown="onCanvasMouseDown"
        @mousemove="onCanvasMouseMove"
        @mouseup="onCanvasMouseUp"
        @mouseleave="onCanvasMouseUp"
        @wheel.prevent="onCanvasWheel"
      >
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute left-0 top-0" :style="stageStyle">
            <!-- SVG 连线层 -->
            <svg :width="STAGE_W" :height="STAGE_H" style="position:absolute;left:0;top:0;z-index:0">
              <defs>
                <pattern id="flow-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="14" cy="14" r="0.8" fill="rgba(255,255,255,0.08)" />
                </pattern>
                <filter id="flow-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect :width="STAGE_W" :height="STAGE_H" fill="url(#flow-grid)" />

              <g v-for="wire in wires" :key="wire.id">
                <path
                  :d="wirePath(wire)" :stroke="wireColor(wire)" stroke-width="2.2"
                  fill="none" stroke-dasharray="10 6" opacity="0.9"
                  filter="url(#flow-glow)" style="pointer-events:none"
                />
                <path
                  :d="wirePath(wire)" stroke="transparent" stroke-width="16"
                  fill="none" style="cursor:pointer" @click.stop="deleteWire(wire.id)"
                />
              </g>

              <path
                v-if="pendingWire" :d="pendingWirePath"
                stroke="rgba(57,255,20,0.8)" stroke-width="2.2" stroke-dasharray="8 5"
                fill="none" filter="url(#flow-glow)"
              />
            </svg>

            <!-- Groups -->
            <div
              v-for="group in groups"
              :key="group.id"
              class="absolute rounded-2xl border border-dashed overflow-visible"
              :style="`
                left:${groupBounds(group).x}px;top:${groupBounds(group).y}px;
                width:${groupBounds(group).width}px;height:${groupBounds(group).height}px;
                border-color:${group.color};background:${group.color}10;
                box-shadow:0 0 24px ${group.color}18 inset;z-index:2;
              `"
            >
              <div
                class="absolute left-3 -top-4 flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-mono"
                :style="`border-color:${group.color};background:#0b1020;color:${group.color};cursor:move;`"
                @mousedown="onGroupMouseDown($event, group)"
              >
                <input v-model="group.title" class="bg-transparent outline-none w-24" :style="`color:${group.color}`">
                <span style="color:rgba(255,255,255,0.5)">{{ group.nodeIds.length }} nodes</span>
                <button @click.stop="deleteGroup(group.id)" style="color:rgba(255,255,255,0.65)">×</button>
              </div>
            </div>

            <!-- Nodes -->
            <div
              v-for="node in nodes"
              :key="node.id"
              class="node-shell absolute rounded-xl border-2 overflow-visible"
              :style="`
                left:${node.x}px;top:${node.y}px;
                width:${NODE_W}px;height:${nodeHeight(node)}px;
                border-color:${isNodeSelected(node.id) ? '#00d4ff' : specFor(node.type).color};
                background:rgba(7,10,18,0.92);
                box-shadow:${isNodeSelected(node.id)
                  ? '0 0 0 1px rgba(0,212,255,0.6), 0 0 32px rgba(0,212,255,0.25)'
                  : '0 0 0 1px rgba(255,255,255,0.03), 0 0 24px ' + specFor(node.type).color + '22'};
                z-index:${isNodeSelected(node.id) ? 30 : 10};
              `"
              @mousedown="onNodeMouseDown($event, node)"
            >
              <!-- 节点头部 -->
              <div
                class="flex items-center gap-2 px-3 rounded-t-xl"
                :style="`height:${HEADER_H}px;background:${specFor(node.type).color}18;border-bottom:1px solid ${specFor(node.type).color}44;cursor:move;`"
              >
                <span>{{ specFor(node.type).icon }}</span>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-mono font-bold truncate" :style="`color:${specFor(node.type).color}`">{{ specFor(node.type).title }}</div>
                  <div class="text-[10px] font-mono truncate" style="color:var(--color-text-muted)">{{ node.type }}</div>
                </div>
                <div v-if="isNodeSelected(node.id)" class="text-[9px] font-mono px-2 py-0.5 rounded-full border" style="border-color:rgba(0,212,255,0.35);color:#9aeaff;background:rgba(0,212,255,0.08)">selected</div>
                <button
                  class="w-6 h-6 rounded border text-[10px] font-mono"
                  style="border-color:rgba(255,255,255,0.08);color:var(--color-text-muted);background:rgba(255,255,255,0.03)"
                  @click.stop="deleteNode(node.id)"
                >x</button>
              </div>

              <!-- 描述 -->
              <div class="px-3 py-2 text-[10px] font-mono leading-5" style="height:38px;color:var(--color-text-muted)">
                {{ specFor(node.type).description }}
              </div>

              <!-- 参数 -->
              <div class="px-3 pb-2">
                <div v-for="param in specFor(node.type).params" :key="param.key" class="mb-2">
                  <label class="block text-[10px] font-mono mb-1" style="color:var(--color-text-muted)">{{ param.label }}</label>
                  <input v-if="param.kind === 'number'" v-model.number="node.params[param.key]" type="number" :step="param.step ?? 1" :min="param.min" :max="param.max" class="w-full rounded border px-2 py-1.5 text-xs font-mono" style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff">
                  <input v-else-if="param.kind === 'text'" v-model="node.params[param.key]" type="text" :placeholder="param.placeholder" class="w-full rounded border px-2 py-1.5 text-xs font-mono" style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff">
                  <textarea v-else-if="param.kind === 'textarea'" v-model="node.params[param.key]" :placeholder="param.placeholder" rows="3" class="w-full rounded border px-2 py-1.5 text-xs font-mono resize-none" style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff" />
                  <select v-else-if="param.kind === 'select'" v-model="node.params[param.key]" class="w-full rounded border px-2 py-1.5 text-xs font-mono" style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff">
                    <option v-for="option in param.options" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
                  </select>
                  <label v-else class="flex items-center gap-2 text-xs font-mono" style="color:#e7f7ff">
                    <input v-model="node.params[param.key]" type="checkbox"> enabled
                  </label>
                </div>
              </div>

              <!-- 运行结果 -->
              <div class="mx-3 mt-1 rounded-lg border p-2" style="min-height:62px;border-color:rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)">
                <div class="text-[10px] font-mono mb-1" style="color:var(--color-text-muted)">runtime</div>
                <pre class="text-[10px] font-mono whitespace-pre-wrap break-all leading-5" :style="node.error ? 'color:#ff7878' : 'color:#c9f8d8'">{{ node.error || formatValue(node.result) }}</pre>
              </div>

              <!-- 输入端口 -->
              <template v-for="i in specFor(node.type).inputs" :key="`in-${i}`">
                <div class="absolute text-[9px] font-mono"
                  :style="`left:-42px;top:${inputPortY(node, i - 1) - 6}px;width:30px;text-align:right;color:${wireCountForInput(node.id, i - 1) ? '#39ff14' : 'rgba(255,255,255,0.45)'};`"
                >{{ inputLabel(specFor(node.type), i - 1) }}</div>
                <div
                  class="port absolute rounded-full border-2"
                  :style="`left:-8px;top:${inputPortY(node, i - 1) - PORT_R}px;width:${PORT_R * 2}px;height:${PORT_R * 2}px;border-color:#08080f;background:${wireCountForInput(node.id, i - 1) ? '#39ff14' : specFor(node.type).color};box-shadow:0 0 10px ${specFor(node.type).color};cursor:crosshair;`"
                  @mouseup.stop="finishWire($event, node, i - 1)"
                />
              </template>

              <!-- 输出端口 -->
              <template v-for="i in specFor(node.type).outputs" :key="`out-${i}`">
                <div class="absolute text-[9px] font-mono"
                  :style="`right:-52px;top:${outputPortY(node, i - 1) - 6}px;width:42px;text-align:left;color:rgba(255,255,255,0.45);`"
                >{{ outputLabel(specFor(node.type), i - 1) }}</div>
                <div
                  class="port absolute rounded-full border-2"
                  :style="`right:-8px;top:${outputPortY(node, i - 1) - PORT_R}px;width:${PORT_R * 2}px;height:${PORT_R * 2}px;border-color:#08080f;background:${specFor(node.type).color};box-shadow:0 0 10px ${specFor(node.type).color};cursor:crosshair;`"
                  @mousedown.stop="startWire($event, node, i - 1)"
                />
              </template>
            </div>
          </div>

          <!-- 框选矩形 -->
          <div
            v-if="selectionRectStyle"
            class="absolute border pointer-events-none"
            :style="{ ...selectionRectStyle, borderColor: '#00d4ff', background: 'rgba(0,212,255,0.08)', zIndex: 60 }"
          />

          <!-- 空状态提示 -->
          <div v-if="nodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center font-mono" style="color:rgba(255,255,255,0.14)">
              <div class="text-5xl mb-4">🕸️</div>
              <div class="text-sm">拖节点进来，连成一张真能跑的 flow graph</div>
              <div class="text-xs mt-2">拖拽节点 · Wheel 缩放 · Alt/Space+拖拽平移 · Blank Drag 框选</div>
            </div>
          </div>

          <!-- Quick Add -->
          <AiFlowQuickAdd
            :open="quickAddOpen"
            :query="quickAddQuery"
            :items="quickAddItems"
            @update:query="quickAddQuery = $event"
            @select="createNodeAtViewportCenter"
            @close="quickAddOpen = false; quickAddQuery = ''"
          />

          <!-- Minimap -->
          <AiFlowMinimap
            :nodes="nodes"
            :view-scale="Math.round(view.scale * 100)"
            :viewport-style="minimapViewportStyle"
            :node-color-fn="nodeColorFn"
            :node-height-fn="nodeHeight"
            :is-selected-fn="isNodeSelected"
            @click="onMinimapClick"
          />
        </div>
      </main>

      <!-- 右侧面板 -->
      <AiFlowLogPanel
        :node-count="nodes.length"
        :wire-count="wires.length"
        :group-count="groups.length"
        :selected-count="selectedNodeIds.length"
        :history-past="historyPast.length"
        :history-future="historyFuture.length"
        :view-scale="Math.round(view.scale * 100)"
        :save-state="saveState"
        :last-run-summary="lastRunSummary"
        :global-error="globalError"
        :run-log="runLog"
        :graph-json="graphJson"
        :mermaid-code="mermaidCode"
        :import-json-value="importJson"
        @import-json="(json) => { importJson = json; importGraphJson() }"
        @load-export="importJson = graphJson"
        @update:import-json-value="importJson = $event"
      />
    </div>
  </div>
</template>
