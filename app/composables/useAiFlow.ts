// composables/useAiFlow.ts
// AI Flow 核心状态 composable

import { ref, computed, watch } from 'vue'
import { NODE_SPECS, NO_FLOW, makeId, makeNode, formatLogValue,
  NODE_W, HEADER_H, DESC_H, RESULT_H, PORT_R, STAGE_W, STAGE_H, MINIMAP_W, MINIMAP_H,
  clamp, specFor, nodeHeight, inputPortY, outputPortY, inputLabel, outputLabel, bezierPath,
} from '~/utils/ai-flow'
import { PRESETS, buildPreset } from '~/utils/ai-flow-presets'
import { runGraph as execGraph } from '~/utils/ai-flow-runner'
import type { FlowNode, Wire, FlowGroup } from '~/types/ai-flow'

const STORAGE_KEY = 'void-blog:ai-flow:v2'

export function useAiFlow() {
  // ── 状态 ──
  const nodes = ref<FlowNode[]>([])
  const wires = ref<Wire[]>([])
  const groups = ref<FlowGroup[]>([])
  const runLog = ref<string[]>([])
  const globalError = ref('')
  const lastRunSummary = ref('尚未运行')
  const selectedPreset = ref('branch')
  const selectedNodeIds = ref<string[]>([])
  const saveState = ref('not-saved')
  const hasHydrated = ref(false)
  const historyPast = ref<string[]>([])
  const historyFuture = ref<string[]>([])
  const suspendHistory = ref(false)
  const lastSnapshot = ref('')
  const importJsonText = ref('')

  // ── 辅助 ──
  function getNode(id: string) {
    return nodes.value.find(n => n.id === id)
  }

  function outputPoint(node: FlowNode, port: number) {
    return { x: node.x + NODE_W, y: node.y + outputPortY(node, port) }
  }

  function inputPoint(node: FlowNode, port: number) {
    return { x: node.x, y: node.y + inputPortY(node, port) }
  }

  function wirePath(wire: Wire): string {
    const from = getNode(wire.fromNode)
    const to = getNode(wire.toNode)
    if (!from || !to) return ''
    const start = outputPoint(from, wire.fromPort)
    const end = inputPoint(to, wire.toPort)
    return bezierPath(start.x, start.y, end.x, end.y)
  }

  function wireColor(wire: Wire): string {
    const node = getNode(wire.fromNode)
    return node ? specFor(node.type).color : '#00d4ff'
  }

  function wireSuccess(wire: Wire): boolean {
    const node = getNode(wire.fromNode)
    if (!node || node.error) return false
    const val = node.outputsData?.[wire.fromPort]
    return val !== undefined && val !== NO_FLOW
  }

  function wireCountForInput(nodeId: string, toPort: number) {
    return wires.value.some(w => w.toNode === nodeId && w.toPort === toPort)
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
    const nodeIdSet = new Set(nodes.value.map(n => n.id))
    groups.value = groups.value
      .map(g => ({ ...g, nodeIds: g.nodeIds.filter(id => nodeIdSet.has(id)) }))
      .filter(g => g.nodeIds.length > 0)
  }

  // ── Graph JSON ──
  const graphJsonObject = computed(() => ({
    nodes: nodes.value.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, params: n.params })),
    wires: wires.value,
    groups: groups.value,
  }))

  const graphJson = computed(() => JSON.stringify(graphJsonObject.value, null, 2))

  // ── Mermaid ──
  const mermaidCode = computed(() => {
    const idMap = new Map<string, string>()
    nodes.value.forEach((node, idx) => idMap.set(node.id, `n${idx + 1}`))
    const lines = ['flowchart LR']
    for (const node of nodes.value) {
      const spec = specFor(node.type)
      const id = idMap.get(node.id)
      const label = `${spec.title.replace(/"/g, '\\"')}\\n${node.type}`
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

  // ── Restore ──
  function restoreGraph(payload: any, viewRef?: { x: number; y: number; scale: number }) {
    if (!payload || typeof payload !== 'object') throw new Error('无效的 graph payload')
    const validNodes = (payload.nodes || [])
      .filter((n: any) => n?.id && n?.type && NODE_SPECS[n.type])
      .map((n: any) => ({
        id: n.id, type: n.type,
        x: Number(n.x ?? 0), y: Number(n.y ?? 0),
        params: { ...specFor(n.type).createParams(), ...(n.params || {}) },
        result: undefined, outputsData: [] as any[], error: '',
      }))
    const nodeIdSet = new Set(validNodes.map((n: any) => n.id))
    const validWires = (payload.wires || [])
      .filter((w: any) => w?.id && nodeIdSet.has(w.fromNode) && nodeIdSet.has(w.toNode))
      .map((w: any) => ({
        id: w.id, fromNode: w.fromNode,
        fromPort: Number(w.fromPort ?? 0),
        toNode: w.toNode,
        toPort: Number(w.toPort ?? 0),
      }))
    const validGroups = (payload.groups || [])
      .filter((g: any) => g?.id)
      .map((g: any) => ({
        id: g.id, title: String(g.title || 'Group'), color: String(g.color || '#00d4ff'),
        nodeIds: (g.nodeIds || []).filter((id: any) => nodeIdSet.has(String(id))).map(String),
      }))
      .filter((g: any) => g.nodeIds.length > 0)
    nodes.value = validNodes
    wires.value = validWires
    groups.value = validGroups
    selectedNodeIds.value = []
    runLog.value = []
    globalError.value = ''
    if (viewRef && payload.view) {
      viewRef.x = Number(payload.view.x ?? 120)
      viewRef.y = Number(payload.view.y ?? 80)
      viewRef.scale = clamp(Number(payload.view.scale ?? 1), 0.35, 2.5)
    }
  }

  // ── Save ──
  function saveToLocal(viewRef: { x: number; y: number; scale: number }) {
    if (typeof localStorage === 'undefined') return
    const data = JSON.stringify({ ...graphJsonObject.value, view: viewRef })
    localStorage.setItem(STORAGE_KEY, data)
    saveState.value = `saved ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
  }

  // ── History ──
  function commitHistory(snapshot: string) {
    if (!hasHydrated.value || suspendHistory.value) return
    if (!lastSnapshot.value) { lastSnapshot.value = snapshot; return }
    if (snapshot === lastSnapshot.value) return
    historyPast.value.push(lastSnapshot.value)
    if (historyPast.value.length > 80) historyPast.value.shift()
    historyFuture.value = []
    lastSnapshot.value = snapshot
  }

  function applyHistorySnapshot(snapshot: string, viewRef: { x: number; y: number; scale: number }, mode: 'undo' | 'redo') {
    suspendHistory.value = true
    try {
      restoreGraph(JSON.parse(snapshot), viewRef)
      selectedPreset.value = 'custom'
      lastSnapshot.value = snapshot
      lastRunSummary.value = mode === 'undo' ? '已撤销一步' : '已重做一步'
      doRunGraph()
      saveToLocal(viewRef)
    } finally {
      suspendHistory.value = false
    }
  }

  function undo(viewRef: { x: number; y: number; scale: number }) {
    if (!historyPast.value.length) return
    const cur = graphJson.value
    const snap = historyPast.value.pop()!
    historyFuture.value.push(cur)
    applyHistorySnapshot(snap, viewRef, 'undo')
  }

  function redo(viewRef: { x: number; y: number; scale: number }) {
    if (!historyFuture.value.length) return
    const cur = graphJson.value
    const snap = historyFuture.value.pop()!
    historyPast.value.push(cur)
    applyHistorySnapshot(snap, viewRef, 'redo')
  }

  // ── Run ──
  function doRunGraph() {
    const result = execGraph(nodes.value, wires.value)
    for (const node of nodes.value) {
      const r = result.nodeResults.get(node.id)
      if (r) {
        node.result = r.result
        node.outputsData = r.outputsData
        node.error = r.error
      }
    }
    runLog.value = result.log
    globalError.value = result.globalError
    lastRunSummary.value = result.summary
  }

  // ── CRUD ──
  function deleteNode(nodeId: string) {
    nodes.value = nodes.value.filter(n => n.id !== nodeId)
    wires.value = wires.value.filter(w => w.fromNode !== nodeId && w.toNode !== nodeId)
    selectedNodeIds.value = selectedNodeIds.value.filter(id => id !== nodeId)
  }

  function deleteSelected() {
    const set = new Set(selectedNodeIds.value)
    nodes.value = nodes.value.filter(n => !set.has(n.id))
    wires.value = wires.value.filter(w => !set.has(w.fromNode) && !set.has(w.toNode))
    normalizeGroups()
    selectedNodeIds.value = []
    lastRunSummary.value = '已删除选中节点'
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
      clones.push({
        id: cloneId, type: node.type, x: node.x + 48, y: node.y + 48,
        params: JSON.parse(JSON.stringify(node.params)),
        result: undefined, outputsData: [], error: '',
      })
    }
    const cloneWires = wires.value
      .filter(w => selectedSet.has(w.fromNode) && selectedSet.has(w.toNode))
      .map(w => ({
        id: makeId('wire'),
        fromNode: idMap.get(w.fromNode)!,
        fromPort: w.fromPort,
        toNode: idMap.get(w.toNode)!,
        toPort: w.toPort,
      }))
    nodes.value.push(...clones)
    wires.value.push(...cloneWires)
    selectedNodeIds.value = clones.map(n => n.id)
    lastRunSummary.value = `已复制 ${clones.length} 个节点`
  }

  function createGroup() {
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

  function clearCanvas() {
    nodes.value = []; wires.value = []; groups.value = []
    runLog.value = []; globalError.value = ''
    selectedNodeIds.value = []; selectedPreset.value = 'custom'
    lastRunSummary.value = '已清空画布'
  }

  function loadPreset(key: string, fitViewFn: () => void) {
    clearCanvas()
    selectedPreset.value = key
    const snapshot = buildPreset(key)
    if (!snapshot) return
    nodes.value = snapshot.nodes
    wires.value = snapshot.wires
    groups.value = snapshot.groups
    lastRunSummary.value = `已载入 preset: ${key}`
    fitViewFn()
    doRunGraph()
  }

  function importJson(json: string, fitViewFn: () => void) {
    try {
      const payload = JSON.parse(json)
      restoreGraph(payload)
      selectedPreset.value = 'custom'
      hasHydrated.value = true
      lastRunSummary.value = 'JSON 导入成功'
      fitViewFn()
      doRunGraph()
    } catch (error: any) {
      globalError.value = `导入失败：${error?.message || '未知错误'}`
    }
  }

  // ── AutoLayout ──
  function autoLayout(viewportSize: { width: number; height: number }, fitViewFn: () => void) {
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
    for (const layerIdx of Array.from(layers.keys()).sort((a, b) => a - b)) {
      let y = 80
      for (const node of layers.get(layerIdx)!) {
        node.x = 80 + layerIdx * 360
        node.y = y
        y += nodeHeight(node) + 60
      }
    }
    lastRunSummary.value = '已自动布局'
    fitViewFn()
  }

  return {
    // state
    nodes, wires, groups, runLog, globalError, lastRunSummary,
    selectedPreset, selectedNodeIds, saveState, hasHydrated,
    historyPast, historyFuture, suspendHistory, importJsonText,
    graphJson, mermaidCode,
    // fns
    getNode, wirePath, wireColor, wireSuccess, wireCountForInput,
    groupBounds, normalizeGroups, restoreGraph, saveToLocal,
    commitHistory, undo, redo, doRunGraph,
    deleteNode, deleteSelected, duplicateSelected, createGroup, deleteGroup,
    clearCanvas, loadPreset, importJson, autoLayout,
    PRESETS, NODE_SPECS,
  }
}
