<script setup lang="ts">
import { NODE_SPECS, makeId, makeNode, formatValue,
  clamp, specFor, nodeHeight, inputPortY, outputPortY,
  inputLabel, outputLabel, bezierPath,
  NODE_W, PORT_R, STAGE_W, STAGE_H, MINIMAP_W, MINIMAP_H,
} from '~/utils/ai-flow'
import { PRESETS } from '~/utils/ai-flow-presets'
import type { FlowNode, Wire, FlowGroup } from '~/types/ai-flow'
import { useAiFlow } from '~/composables/useAiFlow'

const { siteName } = useSiteConfig()
useSeoMeta({ title: `AI Flow | ${siteName}` })
const crumbs = [{ label: 'lab', href: '/lab' }, { label: 'games', href: '/lab' }, { label: 'ai-flow' }]

const {
  nodes, wires, groups, runLog, globalError, lastRunSummary,
  selectedPreset, selectedNodeIds, saveState, hasHydrated,
  historyPast, historyFuture, importJsonText,
  graphJson, mermaidCode,
  getNode, wirePath, wireColor, wireSuccess, wireCountForInput,
  groupBounds, normalizeGroups, restoreGraph, saveToLocal,
  commitHistory, undo: undoFn, redo: redoFn, doRunGraph,
  deleteNode, deleteSelected, duplicateSelected, createGroup, deleteGroup,
  clearCanvas, loadPreset: loadPresetFn, importJson: importJsonFn, autoLayout: autoLayoutFn,
} = useAiFlow()

// ── view / viewport（频繁变化，不走 composable）──
const STORAGE_KEY = 'void-blog:ai-flow:v2'
const canvasEl = ref<HTMLDivElement | null>(null)
const viewportSize = ref({ width: 0, height: 0 })
const spacePressed = ref(false)
const quickAddOpen = ref(false)
const quickAddQuery = ref('')
const contextMenu = ref<{ x: number; y: number; nodeId: string } | null>(null)
const helpOpen = ref(false)
const snapToGrid = ref(false)
const GRID_SIZE = 20

const view = reactive({ x: 120, y: 80, scale: 1 })
const pendingWire = ref<{ fromNode: string; fromPort: number; x: number; y: number } | null>(null)
const dragging = ref<{ ids: string[]; startX: number; startY: number; origins: Record<string, { x: number; y: number }> } | null>(null)
const panning = ref<{ startScreenX: number; startScreenY: number; originX: number; originY: number } | null>(null)
const groupDragging = ref<{ groupId: string; startX: number; startY: number; origins: Record<string, { x: number; y: number }> } | null>(null)
const selecting = ref<{
  startX: number; startY: number; currentX: number; currentY: number
  startScreenX: number; startScreenY: number; currentScreenX: number; currentScreenY: number
  baseSelection: string[]
} | null>(null)

// ── 工具 ──
function snap(v: number) {
  return snapToGrid.value ? Math.round(v / GRID_SIZE) * GRID_SIZE : v
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button, label'))
}

function pointerToWorld(clientX: number, clientY: number) {
  if (!canvasEl.value) return { x: 0, y: 0, screenX: 0, screenY: 0 }
  const rect = canvasEl.value.getBoundingClientRect()
  const screenX = clientX - rect.left
  const screenY = clientY - rect.top
  return { x: (screenX - view.x) / view.scale, y: (screenY - view.y) / view.scale, screenX, screenY }
}

function uniqueIds(ids: string[]) { return [...new Set(ids)] }

function isNodeSelected(nodeId: string) { return selectedNodeIds.value.includes(nodeId) }

function nodeColorFn(type: string) { return NODE_SPECS[type]?.color ?? '#00d4ff' }

function updateViewportSize() {
  if (!canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  viewportSize.value = { width: rect.width, height: rect.height }
}

function fitView() {
  updateViewportSize()
  if (!nodes.value.length) { view.x = 120; view.y = 80; view.scale = 1; return }
  const minX = Math.min(...nodes.value.map(n => n.x))
  const minY = Math.min(...nodes.value.map(n => n.y))
  const maxX = Math.max(...nodes.value.map(n => n.x + NODE_W))
  const maxY = Math.max(...nodes.value.map(n => n.y + nodeHeight(n)))
  const w = Math.max(200, maxX - minX); const h = Math.max(160, maxY - minY)
  view.scale = clamp(Math.min((viewportSize.value.width - 120) / w, (viewportSize.value.height - 120) / h), 0.35, 2)
  view.x = (viewportSize.value.width - w * view.scale) / 2 - minX * view.scale
  view.y = (viewportSize.value.height - h * view.scale) / 2 - minY * view.scale
}

function resetZoom() { view.scale = 1; view.x = 120; view.y = 80 }

// ── 包装函数 ──
function undo() { undoFn(view) }
function redo() { redoFn(view) }
function autoLayout() { autoLayoutFn(viewportSize.value, fitView) }
function loadPreset(key: string) { selectedPreset.value = key; loadPresetFn(key, fitView) }
function importGraphJson() { importJsonFn(importJsonText.value, fitView) }
function runGraph() { doRunGraph() }

function createNodeAtCenter(type: string) {
  const x = snap(-view.x / view.scale + viewportSize.value.width / view.scale / 2 - NODE_W / 2)
  const y = snap(-view.y / view.scale + viewportSize.value.height / view.scale / 2 - 120)
  const node = makeNode(type, x, y)
  nodes.value.push(node)
  selectedNodeIds.value = [node.id]
  quickAddOpen.value = false; quickAddQuery.value = ''
  lastRunSummary.value = `已创建节点 ${specFor(type).title}`
}

// ── Computed ──
const stageStyle = computed(() => ({
  width: `${STAGE_W}px`, height: `${STAGE_H}px`,
  transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
  transformOrigin: '0 0',
}))

const pendingWirePath = computed(() => {
  if (!pendingWire.value) return ''
  const from = getNode(pendingWire.value.fromNode)
  if (!from) return ''
  const start = { x: from.x + NODE_W, y: from.y + outputPortY(from, pendingWire.value.fromPort) }
  return bezierPath(start.x, start.y, pendingWire.value.x, pendingWire.value.y)
})

const groupedSpecs = computed(() => {
  const out: Record<string, Array<{ type: string; spec: any }>> = {}
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

const selectionRectStyle = computed(() => {
  if (!selecting.value) return null
  const left = Math.min(selecting.value.startScreenX, selecting.value.currentScreenX)
  const top = Math.min(selecting.value.startScreenY, selecting.value.currentScreenY)
  const width = Math.abs(selecting.value.currentScreenX - selecting.value.startScreenX)
  const height = Math.abs(selecting.value.currentScreenY - selecting.value.startScreenY)
  return { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` }
})

const viewportWorld = computed(() => ({
  x: -view.x / view.scale, y: -view.y / view.scale,
  width: viewportSize.value.width / view.scale, height: viewportSize.value.height / view.scale,
}))

const minimapViewportStyle = computed(() => ({
  left: `${clamp((viewportWorld.value.x / STAGE_W) * MINIMAP_W, 0, MINIMAP_W)}px`,
  top: `${clamp((viewportWorld.value.y / STAGE_H) * MINIMAP_H, 0, MINIMAP_H)}px`,
  width: `${clamp((viewportWorld.value.width / STAGE_W) * MINIMAP_W, 12, MINIMAP_W)}px`,
  height: `${clamp((viewportWorld.value.height / STAGE_H) * MINIMAP_H, 12, MINIMAP_H)}px`,
}))

// ── 事件处理 ──
function nudgeSelected(dx: number, dy: number) {
  for (const id of selectedNodeIds.value) {
    const node = getNode(id)
    if (!node) continue
    node.x = snap(node.x + dx); node.y = snap(node.y + dy)
  }
}

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
  if (e.shiftKey) selectedNodeIds.value = uniqueIds([...selectedNodeIds.value, node.id])
  else if (!selectedNodeIds.value.includes(node.id)) selectedNodeIds.value = [node.id]
  const dragIds = selectedNodeIds.value.includes(node.id) ? selectedNodeIds.value : [node.id]
  dragging.value = {
    ids: dragIds, startX: point.x, startY: point.y,
    origins: Object.fromEntries(dragIds.map(id => { const n = getNode(id)!; return [id, { x: n.x, y: n.y }] })),
  }
}

function onCanvasMouseDown(e: MouseEvent) {
  if (contextMenu.value) closeContextMenu()
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
  selectedNodeIds.value = uniqueIds([
    ...selecting.value.baseSelection,
    ...nodes.value.filter(n => n.x < x2 && n.x + NODE_W > x1 && n.y < y2 && n.y + nodeHeight(n) > y1).map(n => n.id),
  ])
}

function onCanvasMouseMove(e: MouseEvent) {
  const point = pointerToWorld(e.clientX, e.clientY)
  if (panning.value) {
    view.x = panning.value.originX + (point.screenX - panning.value.startScreenX)
    view.y = panning.value.originY + (point.screenY - panning.value.startScreenY)
    return
  }
  if (groupDragging.value) {
    const dx = point.x - groupDragging.value.startX; const dy = point.y - groupDragging.value.startY
    for (const [id, origin] of Object.entries(groupDragging.value.origins)) {
      const node = getNode(id)
      if (node) { node.x = snap(origin.x + dx); node.y = snap(origin.y + dy) }
    }
  }
  if (dragging.value) {
    const dx = point.x - dragging.value.startX; const dy = point.y - dragging.value.startY
    for (const id of dragging.value.ids) {
      const node = getNode(id); const origin = dragging.value.origins[id]
      if (node && origin) { node.x = snap(origin.x + dx); node.y = snap(origin.y + dy) }
    }
  }
  if (pendingWire.value) { pendingWire.value.x = point.x; pendingWire.value.y = point.y }
  if (selecting.value) {
    selecting.value.currentX = point.x; selecting.value.currentY = point.y
    selecting.value.currentScreenX = point.screenX; selecting.value.currentScreenY = point.screenY
    applySelectionRect()
  }
}

function onCanvasMouseUp() { dragging.value = null; groupDragging.value = null; panning.value = null; selecting.value = null }

function onCanvasWheel(e: WheelEvent) {
  e.preventDefault()
  const point = pointerToWorld(e.clientX, e.clientY)
  if (e.ctrlKey) {
    const nextScale = clamp(view.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.35, 2.5)
    view.scale = nextScale
    view.x = point.screenX - point.x * nextScale
    view.y = point.screenY - point.y * nextScale
    return
  }
  view.x -= e.deltaX; view.y -= e.deltaY
}

function startWire(e: MouseEvent, node: FlowNode, port: number) {
  e.stopPropagation()
  const point = pointerToWorld(e.clientX, e.clientY)
  pendingWire.value = { fromNode: node.id, fromPort: port, x: point.x, y: point.y }
}

function finishWire(e: MouseEvent, node: FlowNode, port: number) {
  e.stopPropagation()
  const pending = pendingWire.value
  if (!pending || pending.fromNode === node.id) { pendingWire.value = null; return }
  if (port >= specFor(node.type).inputs) return
  const dup = wires.value.find(w => w.fromNode === pending.fromNode && w.fromPort === pending.fromPort && w.toNode === node.id && w.toPort === port)
  if (dup) { pendingWire.value = null; return }
  wires.value = wires.value.filter(w => !(w.toNode === node.id && w.toPort === port))
  wires.value.push({ id: makeId('wire'), fromNode: pending.fromNode, fromPort: pending.fromPort, toNode: node.id, toPort: port })
  pendingWire.value = null
}

function deleteWire(wireId: string) { wires.value = wires.value.filter(w => w.id !== wireId) }

function openContextMenu(e: MouseEvent, nodeId: string) { e.preventDefault(); e.stopPropagation(); contextMenu.value = { x: e.clientX, y: e.clientY, nodeId } }
function closeContextMenu() { contextMenu.value = null }
function ctxDelete() { if (!contextMenu.value) return; deleteNode(contextMenu.value.nodeId); closeContextMenu() }
function ctxDuplicate() { if (!contextMenu.value) return; selectedNodeIds.value = [contextMenu.value.nodeId]; duplicateSelected(); closeContextMenu() }
function ctxGroup() { if (!contextMenu.value) return; selectedNodeIds.value = [contextMenu.value.nodeId]; createGroup(); closeContextMenu() }

function onMinimapClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  view.x = viewportSize.value.width / 2 - ((e.clientX - rect.left) / rect.width) * STAGE_W * view.scale
  view.y = viewportSize.value.height / 2 - ((e.clientY - rect.top) / rect.height) * STAGE_H * view.scale
}

async function copyText(text: string, label: string) {
  try { await navigator.clipboard.writeText(text); lastRunSummary.value = `${label} 已复制到剪贴板` }
  catch { lastRunSummary.value = `${label} 复制失败` }
}

function onWindowKeyDown(e: KeyboardEvent) {
  if (quickAddOpen.value) {
    if (e.key === 'Escape') { quickAddOpen.value = false; quickAddQuery.value = ''; e.preventDefault(); return }
    if (e.key === 'Enter' && quickAddItems.value.length) { createNodeAtCenter(quickAddItems.value[0].type); e.preventDefault(); return }
  }
  if (isEditableTarget(e.target)) return
  if (e.key === 'Tab') { quickAddOpen.value = !quickAddOpen.value; if (!quickAddOpen.value) quickAddQuery.value = ''; e.preventDefault(); return }
  if (e.code === 'Space') { spacePressed.value = true; e.preventDefault() }
  if (e.key === '?') { helpOpen.value = !helpOpen.value; return }
  if (e.key === 'f' || e.key === 'F') { fitView(); e.preventDefault(); return }
  if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) { snapToGrid.value = !snapToGrid.value; e.preventDefault(); return }
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { runGraph(); e.preventDefault(); return }
  if (e.key === '0') { resetZoom(); e.preventDefault(); return }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.value.length) { deleteSelected(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') { selectedNodeIds.value = nodes.value.map(n => n.id); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { duplicateSelected(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') { createGroup(); e.preventDefault() }
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

function onWindowKeyUp(e: KeyboardEvent) { if (e.code === 'Space') spacePressed.value = false }

// ── Autosave + History ──
let saveTimer: ReturnType<typeof setTimeout> | null = null

watch(graphJson, (snapshot) => {
  commitHistory(snapshot)
  if (!hasHydrated.value) return
  saveState.value = 'saving…'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveToLocal(view), 250)
})

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('keydown', onWindowKeyDown)
  window.addEventListener('keyup', onWindowKeyUp)
  ;['void-b\u2026w:v1', 'void-aiflow', 'ai-flow-state', 'aiflow-v1', 'void-blog:ai-flow:v1'].forEach(k => { try { localStorage.removeItem(k) } catch {} })
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      restoreGraph(JSON.parse(saved), view)
      selectedPreset.value = 'custom'
      hasHydrated.value = true
      lastRunSummary.value = '已恢复上次编辑状态'
      runGraph(); return
    }
  } catch {}
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
  <div class="h-screen flex flex-col overflow-hidden" style="background:#08080f;color:var(--color-text-primary)">
    <AppNav :crumbs="crumbs" />

    <!-- 顶部工具栏 -->
    <AiFlowToolbar
      :has-selection="selectedNodeIds.length > 0"
      :can-undo="historyPast.length > 0"
      :can-redo="historyFuture.length > 0"
      :snap-to-grid="snapToGrid"
      @run="runGraph"
      @fit-view="fitView"
      @reset-zoom="resetZoom"
      @auto-layout="autoLayout"
      @undo="undo"
      @redo="redo"
      @clear="clearCanvas"
      @delete-selected="deleteSelected"
      @duplicate="duplicateSelected"
      @group="createGroup"
      @copy-mermaid="copyText(mermaidCode, 'Mermaid')"
      @copy-json="copyText(graphJson, 'JSON')"
      @quick-add="quickAddOpen = true"
      @help="helpOpen = true"
      @toggle-snap="snapToGrid = !snapToGrid"
    />

    <div class="flex flex-1 overflow-hidden" style="height:calc(100vh - 96px)">
      <!-- 左侧面板 -->
      <AiFlowNodePalette
        :grouped-specs="groupedSpecs"
        :presets="PRESETS"
        :selected-preset="selectedPreset"
        @load-preset="loadPreset"
        @drag-start="(e, type) => e.dataTransfer?.setData('nodeType', type)"
        @open-help="helpOpen = true"
      />

      <!-- 画布 -->
      <main
        ref="canvasEl"
        class="flex-1 relative overflow-hidden select-none"
        style="background:#08080f"
        @dragover.prevent
        @drop.prevent="(e) => { const type = e.dataTransfer?.getData('nodeType'); if (type) { const p = pointerToWorld(e.clientX, e.clientY); nodes.push(makeNode(type, snap(p.x - NODE_W / 2), snap(p.y - 24))) } }"
        @mousedown="onCanvasMouseDown($event)"
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
                <pattern v-if="snapToGrid" id="snap-grid" :width="GRID_SIZE" :height="GRID_SIZE" patternUnits="userSpaceOnUse">
                  <path :d="`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`" fill="none" stroke="rgba(0,255,136,0.08)" stroke-width="0.5" />
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
              <rect v-if="snapToGrid" :width="STAGE_W" :height="STAGE_H" fill="url(#snap-grid)" />

              <g v-for="wire in wires" :key="wire.id">
                <path
                  :d="wirePath(wire)" :stroke="wireColor(wire)" stroke-width="2.2"
                  fill="none"
                  :stroke-dasharray="wireSuccess(wire) ? 'none' : '10 6'"
                  :opacity="wireSuccess(wire) ? 1 : 0.55"
                  filter="url(#flow-glow)"
                  style="pointer-events:none"
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
              v-memo="[node.x, node.y, node.result, node.error, isNodeSelected(node.id), node.params]"
              :class="[
                'node-shell absolute rounded-xl border-2 overflow-visible',
                isNodeSelected(node.id)
                  ? 'border-[rgba(0,212,255,0.7)]'
                  : node.error
                    ? 'border-[rgba(255,45,120,0.5)]'
                    : (node.result !== undefined && !node.error)
                      ? 'border-[rgba(0,255,136,0.3)]'
                      : 'border-[rgba(255,255,255,0.08)]'
              ]"
              :style="`
                left:${node.x}px;top:${node.y}px;
                width:${NODE_W}px;height:${nodeHeight(node)}px;
                background:rgba(7,10,18,0.92);
                box-shadow:${isNodeSelected(node.id)
                  ? '0 0 0 1px rgba(0,212,255,0.6), 0 0 32px rgba(0,212,255,0.25)'
                  : node.error
                    ? '0 0 0 1px rgba(255,45,120,0.3), 0 0 24px rgba(255,45,120,0.12)'
                    : '0 0 0 1px rgba(255,255,255,0.03), 0 0 24px ' + specFor(node.type).color + '22'};
                z-index:${isNodeSelected(node.id) ? 30 : 10};
              `"
              @mousedown="onNodeMouseDown($event, node)"
              @contextmenu.prevent="openContextMenu($event, node.id)"
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
                <!-- 状态指示点 -->
                <span
                  v-if="node.error"
                  class="w-2 h-2 rounded-full bg-[#ff2d78] shrink-0"
                  title="执行失败"
                  style="box-shadow:0 0 6px rgba(255,45,120,0.8)"
                />
                <span
                  v-else-if="node.result !== undefined"
                  class="w-2 h-2 rounded-full bg-[#00ff88] shrink-0"
                  title="执行成功"
                  style="box-shadow:0 0 6px rgba(0,255,136,0.8)"
                />
                <span
                  v-else
                  class="w-2 h-2 rounded-full shrink-0"
                  title="未执行"
                  style="background:rgba(255,255,255,0.15)"
                />
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
            @select="createNodeAtCenter"
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
        :import-json-value="importJsonText"
        @import-json="(json) => { importJsonText = json; importGraphJson() }"
        @load-export="importJsonText = graphJson"
        @update:import-json-value="importJsonText = $event"
      />
    </div>
  </div>

  <!-- Context Menu -->
  <Teleport to="body">
    <div
      v-if="contextMenu"
      class="fixed z-[200] min-w-[140px] rounded-xl border shadow-2xl py-1 font-mono text-xs"
      style="background:rgba(13,13,20,0.97);border-color:rgba(0,212,255,0.25);backdrop-filter:blur(12px)"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <button
        class="w-full px-4 py-2 text-left transition-colors hover:bg-[rgba(0,212,255,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]"
        @click="ctxDuplicate"
      >⊕ Duplicate</button>
      <button
        class="w-full px-4 py-2 text-left transition-colors hover:bg-[rgba(180,76,255,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-purple)]"
        @click="ctxGroup"
      >⬡ Group</button>
      <div class="my-1 h-px mx-3" style="background:rgba(255,255,255,0.06)"></div>
      <button
        class="w-full px-4 py-2 text-left transition-colors hover:bg-[rgba(255,45,120,0.1)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-pink)]"
        @click="ctxDelete"
      >✕ Delete</button>
    </div>
  </Teleport>

  <!-- Keyboard Help Overlay -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="helpOpen"
        class="fixed inset-0 z-[300] flex items-center justify-center"
        style="background:rgba(0,0,0,0.6);backdrop-filter:blur(4px)"
        @click="helpOpen = false"
      >
        <div
          class="rounded-2xl border p-6 w-[480px] max-h-[70vh] overflow-y-auto"
          style="background:rgba(13,13,20,0.98);border-color:rgba(0,212,255,0.25)"
          @click.stop
        >
          <div class="flex items-center justify-between mb-4">
            <span class="font-mono text-sm font-bold" style="color:var(--color-neon-cyan)">⌨ 快捷键</span>
            <button @click="helpOpen = false" class="font-mono text-xs text-[var(--color-text-muted)] hover:text-white">✕</button>
          </div>
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-xs text-[var(--color-text-muted)]">
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">▶ Run</kbd> Ctrl+Enter</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Undo</kbd> Ctrl+Z</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Redo</kbd> Ctrl+Shift+Z</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Delete</kbd> Del / Backspace</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Quick Add</kbd> Tab</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Fit View</kbd> F</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">100%</kbd> 0</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Select All</kbd> Ctrl+A</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Duplicate</kbd> Ctrl+D</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Group</kbd> Ctrl+G</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Snap Grid</kbd> G</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Pan</kbd> Space+Drag</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Nudge</kbd> Arrow Keys</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Help</kbd> ?</div>
            <div><kbd class="px-1.5 py-0.5 rounded border border-[rgba(255,255,255,0.15)] text-white">Right Click</kbd> 节点菜单</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
