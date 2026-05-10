<script setup lang="ts">
const { siteName } = useSiteConfig()
useSeoMeta({ title: `AI Flow | ${siteName}` })

const crumbs = [
  { label: 'lab', href: '/lab' },
  { label: 'games', href: '/lab' },
  { label: 'ai-flow' },
]

type ParamKind = 'number' | 'text' | 'textarea' | 'select' | 'boolean'

interface ParamOption {
  label: string
  value: string | number | boolean
}

interface ParamSpec {
  key: string
  label: string
  kind: ParamKind
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: ParamOption[]
}

interface NodeRunResult {
  result?: any
  outputs?: any[]
}

interface NodeSpec {
  title: string
  icon: string
  color: string
  category: string
  description: string
  inputs: number
  outputs: number
  inputLabels?: string[]
  outputLabels?: string[]
  params: ParamSpec[]
  createParams: () => Record<string, any>
  run: (ctx: { inputs: any[]; params: Record<string, any> }) => any | NodeRunResult
}

interface FlowNode {
  id: string
  type: string
  x: number
  y: number
  params: Record<string, any>
  result?: any
  outputsData?: any[]
  error?: string
}

interface Wire {
  id: string
  fromNode: string
  fromPort: number
  toNode: string
  toPort: number
}

interface Preset {
  key: string
  label: string
  desc: string
}

const NODE_W = 260
const HEADER_H = 40
const DESC_H = 38
const RESULT_H = 78
const PORT_R = 6
const STAGE_W = 3200
const STAGE_H = 2000
const MINIMAP_W = 220
const MINIMAP_H = 140
const NO_FLOW = Symbol('NO_FLOW')

function parseArrayInput(raw: string) {
  const text = String(raw ?? '').trim()
  if (!text) return []
  if (text.startsWith('[')) {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('不是合法 JSON 数组')
    return parsed
  }
  return text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map((item) => {
      const n = Number(item)
      return Number.isFinite(n) && /^-?\d+(\.\d+)?$/.test(item) ? n : item
    })
}

function requireArray(value: any, label = '输入') {
  if (!Array.isArray(value)) throw new Error(`${label} 需要数组`)
  return value
}

function requireString(value: any, label = '输入') {
  if (typeof value !== 'string') throw new Error(`${label} 需要字符串`)
  return value
}

function requireNumber(value: any, label = '输入') {
  const num = Number(value)
  if (!Number.isFinite(num)) throw new Error(`${label} 需要 number`)
  return num
}

function requireBoolean(value: any, label = '输入') {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`${label} 需要 boolean`)
}

function requireNumberArray(value: any, label = '输入') {
  const arr = requireArray(value, label)
  if (!arr.every(v => typeof v === 'number' && Number.isFinite(v))) throw new Error(`${label} 需要 number[]`)
  return arr as number[]
}

function mapValue(value: any, mode: string) {
  switch (mode) {
    case 'double': return Number(value) * 2
    case 'square': return Number(value) ** 2
    case 'negate': return -Number(value)
    case 'abs': return Math.abs(Number(value))
    case 'string': return String(value)
    case 'trim': return String(value).trim()
    case 'upper': return String(value).toUpperCase()
    case 'lower': return String(value).toLowerCase()
    default: return value
  }
}

function normalizeRunResult(raw: any, outputCount: number) {
  if (raw && typeof raw === 'object' && Array.isArray(raw.outputs)) {
    const result = Object.prototype.hasOwnProperty.call(raw, 'result') ? raw.result : raw.outputs[0]
    return {
      result,
      outputs: Array.from({ length: outputCount }, (_, idx) => raw.outputs[idx] ?? NO_FLOW),
    }
  }
  return {
    result: raw,
    outputs: outputCount > 0
      ? Array.from({ length: outputCount }, (_, idx) => idx === 0 ? raw : NO_FLOW)
      : [],
  }
}

function safeCompare(left: any, right: any, mode: string) {
  switch (mode) {
    case 'eq': return left === right
    case 'neq': return left !== right
    case 'gt': return requireNumber(left, '左输入') > requireNumber(right, '右输入')
    case 'gte': return requireNumber(left, '左输入') >= requireNumber(right, '右输入')
    case 'lt': return requireNumber(left, '左输入') < requireNumber(right, '右输入')
    case 'lte': return requireNumber(left, '左输入') <= requireNumber(right, '右输入')
    case 'contains': return String(left).includes(String(right))
    default: return false
  }
}

const NODE_SPECS: Record<string, NodeSpec> = {
  'source-number': {
    title: 'Number',
    icon: '🔢',
    color: '#00d4ff',
    category: 'Source',
    description: '固定数值源，适合测试算子。',
    inputs: 0,
    outputs: 1,
    params: [
      { key: 'value', label: 'value', kind: 'number', step: 1 },
    ],
    createParams: () => ({ value: 42 }),
    run: ({ params }) => Number(params.value ?? 0),
  },
  'source-boolean': {
    title: 'Boolean',
    icon: '🔘',
    color: '#00d4ff',
    category: 'Source',
    description: '布尔值源，适合控制分支。',
    inputs: 0,
    outputs: 1,
    params: [
      {
        key: 'value', label: 'value', kind: 'select', options: [
          { label: 'true', value: true },
          { label: 'false', value: false },
        ],
      },
    ],
    createParams: () => ({ value: true }),
    run: ({ params }) => Boolean(params.value),
  },
  'source-text': {
    title: 'Text',
    icon: '📝',
    color: '#00d4ff',
    category: 'Source',
    description: '文本源，可接字符串链路或 JSON。',
    inputs: 0,
    outputs: 1,
    params: [
      { key: 'text', label: 'text', kind: 'textarea', placeholder: 'hello world' },
    ],
    createParams: () => ({ text: 'hello void, hello flow' }),
    run: ({ params }) => String(params.text ?? ''),
  },
  'source-array': {
    title: 'Array',
    icon: '📦',
    color: '#00d4ff',
    category: 'Source',
    description: '数组源，支持 CSV / 换行 / JSON 数组。',
    inputs: 0,
    outputs: 1,
    params: [
      { key: 'items', label: 'items', kind: 'textarea', placeholder: '1, 2, 3' },
    ],
    createParams: () => ({ items: '1, 2, 3, 5, 8, 13' }),
    run: ({ params }) => parseArrayInput(params.items),
  },
  'source-range': {
    title: 'Range',
    icon: '📏',
    color: '#00d4ff',
    category: 'Source',
    description: '生成 start..end 的数列。',
    inputs: 0,
    outputs: 1,
    params: [
      { key: 'start', label: 'start', kind: 'number', step: 1 },
      { key: 'end', label: 'end', kind: 'number', step: 1 },
      { key: 'step', label: 'step', kind: 'number', step: 1 },
    ],
    createParams: () => ({ start: 1, end: 10, step: 1 }),
    run: ({ params }) => {
      const start = Number(params.start ?? 0)
      const end = Number(params.end ?? 0)
      const step = Number(params.step ?? 1)
      if (!step) throw new Error('step 不能为 0')
      const out: number[] = []
      if (step > 0) {
        for (let i = start; i <= end; i += step) out.push(i)
      } else {
        for (let i = start; i >= end; i += step) out.push(i)
      }
      return out
    },
  },

  map: {
    title: 'Map',
    icon: '🧮',
    color: '#39ff14',
    category: 'Array',
    description: '对数组每个元素做同构变换。',
    inputs: 1,
    outputs: 1,
    params: [
      {
        key: 'mode', label: 'mode', kind: 'select', options: [
          { label: 'x * 2', value: 'double' },
          { label: 'x²', value: 'square' },
          { label: '-x', value: 'negate' },
          { label: '|x|', value: 'abs' },
          { label: 'toString()', value: 'string' },
          { label: 'trim()', value: 'trim' },
          { label: 'toUpperCase()', value: 'upper' },
          { label: 'toLowerCase()', value: 'lower' },
        ],
      },
    ],
    createParams: () => ({ mode: 'square' }),
    run: ({ inputs, params }) => requireArray(inputs[0]).map(item => mapValue(item, String(params.mode))),
  },
  filter: {
    title: 'Filter',
    icon: '🧲',
    color: '#39ff14',
    category: 'Array',
    description: '过滤数组元素。',
    inputs: 1,
    outputs: 1,
    params: [
      {
        key: 'mode', label: 'mode', kind: 'select', options: [
          { label: 'even', value: 'even' },
          { label: 'odd', value: 'odd' },
          { label: '>= threshold', value: 'gte' },
          { label: 'contains text', value: 'contains' },
          { label: 'truthy', value: 'truthy' },
        ],
      },
      { key: 'threshold', label: 'threshold', kind: 'number', step: 1 },
      { key: 'text', label: 'text', kind: 'text', placeholder: 'hello' },
    ],
    createParams: () => ({ mode: 'gte', threshold: 10, text: 'void' }),
    run: ({ inputs, params }) => {
      const arr = requireArray(inputs[0])
      const mode = String(params.mode)
      const threshold = Number(params.threshold ?? 0)
      const text = String(params.text ?? '')
      return arr.filter((item) => {
        switch (mode) {
          case 'even': return Number(item) % 2 === 0
          case 'odd': return Math.abs(Number(item) % 2) === 1
          case 'gte': return Number(item) >= threshold
          case 'contains': return String(item).includes(text)
          case 'truthy': return Boolean(item)
          default: return true
        }
      })
    },
  },
  reduce: {
    title: 'Reduce',
    icon: '∑',
    color: '#39ff14',
    category: 'Array',
    description: '把数组折叠为单值。',
    inputs: 1,
    outputs: 1,
    params: [
      {
        key: 'mode', label: 'mode', kind: 'select', options: [
          { label: 'sum', value: 'sum' },
          { label: 'product', value: 'product' },
          { label: 'max', value: 'max' },
          { label: 'min', value: 'min' },
          { label: 'concat', value: 'concat' },
        ],
      },
      { key: 'separator', label: 'separator', kind: 'text', placeholder: ', ' },
    ],
    createParams: () => ({ mode: 'sum', separator: ', ' }),
    run: ({ inputs, params }) => {
      const arr = requireArray(inputs[0])
      switch (params.mode) {
        case 'sum': return requireNumberArray(arr).reduce((a, b) => a + b, 0)
        case 'product': return requireNumberArray(arr).reduce((a, b) => a * b, 1)
        case 'max': return Math.max(...requireNumberArray(arr))
        case 'min': return Math.min(...requireNumberArray(arr))
        case 'concat': return arr.map(v => String(v)).join(String(params.separator ?? ', '))
        default: return arr
      }
    },
  },
  sort: {
    title: 'Sort',
    icon: '↕️',
    color: '#39ff14',
    category: 'Array',
    description: '数组排序。',
    inputs: 1,
    outputs: 1,
    params: [
      {
        key: 'mode', label: 'mode', kind: 'select', options: [
          { label: 'numeric ↑', value: 'num-asc' },
          { label: 'numeric ↓', value: 'num-desc' },
          { label: 'alpha ↑', value: 'str-asc' },
          { label: 'alpha ↓', value: 'str-desc' },
        ],
      },
    ],
    createParams: () => ({ mode: 'num-asc' }),
    run: ({ inputs, params }) => {
      const arr = [...requireArray(inputs[0])]
      switch (params.mode) {
        case 'num-asc': return arr.sort((a, b) => Number(a) - Number(b))
        case 'num-desc': return arr.sort((a, b) => Number(b) - Number(a))
        case 'str-desc': return arr.sort((a, b) => String(b).localeCompare(String(a)))
        default: return arr.sort((a, b) => String(a).localeCompare(String(b)))
      }
    },
  },
  unique: {
    title: 'Unique',
    icon: '🧬',
    color: '#39ff14',
    category: 'Array',
    description: '去重但保留原顺序。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => {
      const arr = requireArray(inputs[0])
      const seen = new Set<string>()
      return arr.filter((item) => {
        const key = JSON.stringify(item)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    },
  },
  take: {
    title: 'Take',
    icon: '✂️',
    color: '#39ff14',
    category: 'Array',
    description: '截取前 N 个元素。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'count', label: 'count', kind: 'number', step: 1 },
    ],
    createParams: () => ({ count: 5 }),
    run: ({ inputs, params }) => requireArray(inputs[0]).slice(0, Number(params.count ?? 0)),
  },

  add: {
    title: 'Add',
    icon: '➕',
    color: '#ffd400',
    category: 'Math',
    description: '双输入数值相加。',
    inputs: 2,
    outputs: 1,
    inputLabels: ['a', 'b'],
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => requireNumber(inputs[0], 'a') + requireNumber(inputs[1], 'b'),
  },
  multiply: {
    title: 'Multiply',
    icon: '✖️',
    color: '#ffd400',
    category: 'Math',
    description: '双输入数值相乘。',
    inputs: 2,
    outputs: 1,
    inputLabels: ['a', 'b'],
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => requireNumber(inputs[0], 'a') * requireNumber(inputs[1], 'b'),
  },
  compare: {
    title: 'Compare',
    icon: '⚖️',
    color: '#ffd400',
    category: 'Math',
    description: '双输入比较，输出 boolean。',
    inputs: 2,
    outputs: 1,
    inputLabels: ['left', 'right'],
    params: [
      {
        key: 'mode', label: 'mode', kind: 'select', options: [
          { label: '===', value: 'eq' },
          { label: '!==', value: 'neq' },
          { label: '>', value: 'gt' },
          { label: '>=', value: 'gte' },
          { label: '<', value: 'lt' },
          { label: '<=', value: 'lte' },
          { label: 'contains', value: 'contains' },
        ],
      },
    ],
    createParams: () => ({ mode: 'gt' }),
    run: ({ inputs, params }) => safeCompare(inputs[0], inputs[1], String(params.mode)),
  },

  merge: {
    title: 'Merge',
    icon: '🔀',
    color: '#ffa500',
    category: 'Control',
    description: '双输入合并，数组 concat / 对象 merge / 字符串拼接。',
    inputs: 2,
    outputs: 1,
    inputLabels: ['left', 'right'],
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => {
      const [left, right] = inputs
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right]
      if (typeof left === 'string' || typeof right === 'string') return `${String(left)}${String(right)}`
      if (left && right && typeof left === 'object' && typeof right === 'object') return { ...left, ...right }
      return [left, right]
    },
  },
  branch: {
    title: 'Branch',
    icon: '🌿',
    color: '#ffa500',
    category: 'Control',
    description: '根据条件把 payload 路由到 true / false 分支。',
    inputs: 2,
    outputs: 2,
    inputLabels: ['cond', 'payload'],
    outputLabels: ['true', 'false'],
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => {
      const cond = requireBoolean(inputs[0], 'cond')
      const payload = inputs[1]
      return {
        result: { routed: cond ? 'true' : 'false', payload },
        outputs: cond ? [payload, NO_FLOW] : [NO_FLOW, payload],
      }
    },
  },

  split: {
    title: 'Split',
    icon: '🔪',
    color: '#ff7a00',
    category: 'String',
    description: '字符串切片为数组。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'separator', label: 'separator', kind: 'text', placeholder: ' ' },
    ],
    createParams: () => ({ separator: ' ' }),
    run: ({ inputs, params }) => requireString(inputs[0]).split(String(params.separator ?? ' ')).filter(Boolean),
  },
  join: {
    title: 'Join',
    icon: '🔗',
    color: '#ff7a00',
    category: 'String',
    description: '数组拼接为字符串。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'separator', label: 'separator', kind: 'text', placeholder: ', ' },
    ],
    createParams: () => ({ separator: ', ' }),
    run: ({ inputs, params }) => requireArray(inputs[0]).map(v => String(v)).join(String(params.separator ?? ', ')),
  },
  uppercase: {
    title: 'Uppercase',
    icon: '🔠',
    color: '#ff7a00',
    category: 'String',
    description: '字符串转大写。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => requireString(inputs[0]).toUpperCase(),
  },
  lowercase: {
    title: 'Lowercase',
    icon: '🔡',
    color: '#ff7a00',
    category: 'String',
    description: '字符串转小写。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => requireString(inputs[0]).toLowerCase(),
  },

  length: {
    title: 'Length',
    icon: '📐',
    color: '#b400ff',
    category: 'Utility',
    description: '返回长度或键数量。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => {
      const value = inputs[0]
      if (Array.isArray(value) || typeof value === 'string') return value.length
      if (value && typeof value === 'object') return Object.keys(value).length
      return 0
    },
  },
  stats: {
    title: 'Stats',
    icon: '📊',
    color: '#b400ff',
    category: 'Utility',
    description: '输出 count / min / max / avg / sum。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => {
      const arr = requireNumberArray(inputs[0])
      const count = arr.length
      const sum = arr.reduce((a, b) => a + b, 0)
      return {
        count,
        min: count ? Math.min(...arr) : null,
        max: count ? Math.max(...arr) : null,
        avg: count ? Number((sum / count).toFixed(4)) : null,
        sum,
      }
    },
  },
  'json-parse': {
    title: 'JSON.parse',
    icon: '🧾',
    color: '#b400ff',
    category: 'Utility',
    description: '把 JSON 字符串解析成对象。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => JSON.parse(requireString(inputs[0])),
  },
  'json-stringify': {
    title: 'JSON.stringify',
    icon: '🗜️',
    color: '#b400ff',
    category: 'Utility',
    description: '把任意值序列化为 JSON。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'pretty', label: 'pretty', kind: 'boolean' },
    ],
    createParams: () => ({ pretty: true }),
    run: ({ inputs, params }) => JSON.stringify(inputs[0], null, params.pretty ? 2 : 0),
  },

  preview: {
    title: 'Preview',
    icon: '🖥️',
    color: '#00ffaa',
    category: 'Sink',
    description: '终端节点，专门用于展示最终结果。',
    inputs: 1,
    outputs: 0,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }) => inputs[0],
  },
}

const presets: Preset[] = [
  { key: 'squares', label: 'Square Filter', desc: 'Range → Map(x²) → Filter(>=20) → Stats / Preview' },
  { key: 'text', label: 'Text Clean', desc: 'Text → Split → Unique → Sort → Join → Preview' },
  { key: 'json', label: 'JSON Inspect', desc: 'Text(JSON) → JSON.parse → JSON.stringify(pretty) → Preview' },
  { key: 'branch', label: 'Branch Demo', desc: 'Compare → Branch(true/false) → 双 Preview' },
  { key: 'math', label: 'Math Demo', desc: 'Number + Number → Multiply → Preview' },
]

const nodes = ref<FlowNode[]>([])
const wires = ref<Wire[]>([])
const canvasEl = ref<HTMLDivElement | null>(null)
const runLog = ref<string[]>([])
const globalError = ref('')
const lastRunSummary = ref('尚未运行')
const selectedPreset = ref('branch')
const selectedNodeIds = ref<string[]>([])
const viewportSize = ref({ width: 0, height: 0 })
const spacePressed = ref(false)

const view = reactive({
  x: 120,
  y: 80,
  scale: 1,
})

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

function updateViewportSize() {
  if (!canvasEl.value) return
  const rect = canvasEl.value.getBoundingClientRect()
  viewportSize.value = { width: rect.width, height: rect.height }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button, label'))
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function specFor(type: string) {
  return NODE_SPECS[type]
}

function makeNode(type: string, x: number, y: number): FlowNode {
  const spec = specFor(type)
  return {
    id: makeId('node'),
    type,
    x,
    y,
    params: spec.createParams(),
    result: undefined,
    outputsData: [],
    error: '',
  }
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

function inputLabel(spec: NodeSpec, index: number) {
  return spec.inputLabels?.[index] ?? `in${index + 1}`
}

function outputLabel(spec: NodeSpec, index: number) {
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
  const out: Record<string, Array<{ type: string; spec: NodeSpec }>> = {}
  for (const [type, spec] of Object.entries(NODE_SPECS)) {
    if (!out[spec.category]) out[spec.category] = []
    out[spec.category].push({ type, spec })
  }
  return out
})

function formatValue(value: any) {
  if (value === undefined) return '—'
  if (value === NO_FLOW) return '⏭ no flow'
  if (typeof value === 'string') return value.length > 220 ? `${value.slice(0, 220)}…` : value
  try {
    const json = JSON.stringify(value, null, 2)
    return json.length > 220 ? `${json.slice(0, 220)}…` : json
  } catch {
    return String(value)
  }
}

function formatLogValue(value: any) {
  if (value === NO_FLOW) return 'no-flow'
  if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 80)}…` : value
  try {
    const json = JSON.stringify(value)
    return json.length > 80 ? `${json.slice(0, 80)}…` : json
  } catch {
    return String(value)
  }
}

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

const graphJson = computed(() => JSON.stringify({
  nodes: nodes.value.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y, params: n.params })),
  wires: wires.value,
  view: { x: view.x, y: view.y, scale: view.scale },
}, null, 2))

const selectionRectStyle = computed(() => {
  if (!selecting.value) return null
  const left = Math.min(selecting.value.startScreenX, selecting.value.currentScreenX)
  const top = Math.min(selecting.value.startScreenY, selecting.value.currentScreenY)
  const width = Math.abs(selecting.value.currentScreenX - selecting.value.startScreenX)
  const height = Math.abs(selecting.value.currentScreenY - selecting.value.startScreenY)
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
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
  if (!nodes.value.length) {
    view.x = 120
    view.y = 80
    view.scale = 1
    return
  }
  const minX = Math.min(...nodes.value.map(n => n.x))
  const minY = Math.min(...nodes.value.map(n => n.y))
  const maxX = Math.max(...nodes.value.map(n => n.x + NODE_W))
  const maxY = Math.max(...nodes.value.map(n => n.y + nodeHeight(n)))
  const width = Math.max(200, maxX - minX)
  const height = Math.max(160, maxY - minY)
  const scaleX = (viewportSize.value.width - 120) / width
  const scaleY = (viewportSize.value.height - 120) / height
  view.scale = clamp(Math.min(scaleX, scaleY), 0.35, 2)
  view.x = (viewportSize.value.width - width * view.scale) / 2 - minX * view.scale
  view.y = (viewportSize.value.height - height * view.scale) / 2 - minY * view.scale
}

function resetZoom() {
  view.scale = 1
  view.x = 120
  view.y = 80
}

function clearCanvas() {
  nodes.value = []
  wires.value = []
  pendingWire.value = null
  runLog.value = []
  globalError.value = ''
  selectedNodeIds.value = []
  lastRunSummary.value = '已清空画布'
}

function onPanelDragStart(e: DragEvent, type: string) {
  e.dataTransfer?.setData('nodeType', type)
}

function onCanvasDragOver(e: DragEvent) {
  e.preventDefault()
}

function onCanvasDrop(e: DragEvent) {
  e.preventDefault()
  const type = e.dataTransfer?.getData('nodeType')
  if (!type) return
  const point = pointerToWorld(e.clientX, e.clientY)
  nodes.value.push(makeNode(type, point.x - NODE_W / 2, point.y - 24))
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)]
}

function isNodeSelected(nodeId: string) {
  return selectedNodeIds.value.includes(nodeId)
}

function onNodeMouseDown(e: MouseEvent, node: FlowNode) {
  const target = e.target as HTMLElement
  if (target.closest('input, textarea, select, button, label, .port')) return
  e.preventDefault()
  e.stopPropagation()
  const point = pointerToWorld(e.clientX, e.clientY)

  let ids = selectedNodeIds.value
  if (e.shiftKey) ids = uniqueIds([...selectedNodeIds.value, node.id])
  else if (!selectedNodeIds.value.includes(node.id)) ids = [node.id]

  selectedNodeIds.value = ids
  const dragIds = ids.includes(node.id) ? ids : [node.id]
  dragging.value = {
    ids: dragIds,
    startX: point.x,
    startY: point.y,
    origins: Object.fromEntries(dragIds.map(id => {
      const n = getNode(id)!
      return [id, { x: n.x, y: n.y }]
    })),
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
    panning.value = {
      startScreenX: point.screenX,
      startScreenY: point.screenY,
      originX: view.x,
      originY: view.y,
    }
    return
  }

  if (e.button !== 0) return

  selecting.value = {
    startX: point.x,
    startY: point.y,
    currentX: point.x,
    currentY: point.y,
    startScreenX: point.screenX,
    startScreenY: point.screenY,
    currentScreenX: point.screenX,
    currentScreenY: point.screenY,
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
    .filter((node) => {
      const nx1 = node.x
      const ny1 = node.y
      const nx2 = node.x + NODE_W
      const ny2 = node.y + nodeHeight(node)
      return nx1 < x2 && nx2 > x1 && ny1 < y2 && ny2 > y1
    })
    .map(node => node.id)
  selectedNodeIds.value = uniqueIds([...selecting.value.baseSelection, ...inside])
}

function onCanvasMouseMove(e: MouseEvent) {
  const point = pointerToWorld(e.clientX, e.clientY)
  if (panning.value) {
    view.x = panning.value.originX + (point.screenX - panning.value.startScreenX)
    view.y = panning.value.originY + (point.screenY - panning.value.startScreenY)
    return
  }
  if (dragging.value) {
    const dx = point.x - dragging.value.startX
    const dy = point.y - dragging.value.startY
    for (const id of dragging.value.ids) {
      const node = getNode(id)
      const origin = dragging.value.origins[id]
      if (node && origin) {
        node.x = origin.x + dx
        node.y = origin.y + dy
      }
    }
  }
  if (pendingWire.value) {
    pendingWire.value.x = point.x
    pendingWire.value.y = point.y
  }
  if (selecting.value) {
    selecting.value.currentX = point.x
    selecting.value.currentY = point.y
    selecting.value.currentScreenX = point.screenX
    selecting.value.currentScreenY = point.screenY
    applySelectionRect()
  }
}

function onCanvasMouseUp() {
  dragging.value = null
  panning.value = null
  selecting.value = null
}

function onCanvasWheel(e: WheelEvent) {
  if (e.ctrlKey) return
  e.preventDefault()
  const point = pointerToWorld(e.clientX, e.clientY)
  const beforeX = point.x
  const beforeY = point.y
  const nextScale = clamp(view.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.35, 2.5)
  view.scale = nextScale
  view.x = point.screenX - beforeX * view.scale
  view.y = point.screenY - beforeY * view.scale
}

function startWire(e: MouseEvent, node: FlowNode, port: number) {
  e.stopPropagation()
  const point = pointerToWorld(e.clientX, e.clientY)
  pendingWire.value = {
    fromNode: node.id,
    fromPort: port,
    x: point.x,
    y: point.y,
  }
}

function finishWire(e: MouseEvent, node: FlowNode, port: number) {
  e.stopPropagation()
  const pending = pendingWire.value
  if (!pending) return
  if (pending.fromNode === node.id) {
    pendingWire.value = null
    return
  }
  const targetSpec = specFor(node.type)
  if (port >= targetSpec.inputs) return
  const dup = wires.value.find(w => w.fromNode === pending.fromNode && w.fromPort === pending.fromPort && w.toNode === node.id && w.toPort === port)
  if (dup) {
    pendingWire.value = null
    return
  }
  wires.value = wires.value.filter(w => !(w.toNode === node.id && w.toPort === port))
  wires.value.push({
    id: makeId('wire'),
    fromNode: pending.fromNode,
    fromPort: pending.fromPort,
    toNode: node.id,
    toPort: port,
  })
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
  selectedNodeIds.value = []
  lastRunSummary.value = '已删除选中节点'
}

function resetNodeState() {
  for (const node of nodes.value) {
    node.result = undefined
    node.outputsData = []
    node.error = ''
  }
}

function runGraph() {
  resetNodeState()
  runLog.value = []
  globalError.value = ''

  const nodeMap = new Map(nodes.value.map(node => [node.id, node]))
  const incoming = new Map<string, Wire[]>()
  const outgoing = new Map<string, Wire[]>()
  const indegree = new Map<string, number>()

  for (const node of nodes.value) {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
    indegree.set(node.id, 0)
  }

  for (const wire of wires.value) {
    if (!nodeMap.has(wire.fromNode) || !nodeMap.has(wire.toNode)) continue
    incoming.get(wire.toNode)!.push(wire)
    outgoing.get(wire.fromNode)!.push(wire)
    indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) + 1)
  }

  const queue = nodes.value.filter(node => (indegree.get(node.id) ?? 0) === 0).map(node => node.id)
  const order: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const wire of outgoing.get(id) ?? []) {
      indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) - 1)
      if ((indegree.get(wire.toNode) ?? 0) === 0) queue.push(wire.toNode)
    }
  }

  if (order.length !== nodes.value.length) {
    globalError.value = '图里存在环，当前执行器只支持 DAG（无环图）'
    lastRunSummary.value = '执行失败：检测到循环依赖'
    return
  }

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId)!
    const spec = specFor(node.type)
    const inWires = [...(incoming.get(node.id) ?? [])].sort((a, b) => a.toPort - b.toPort)
    const inputs = Array.from({ length: spec.inputs }, () => undefined)
    const linkedPorts = new Set(inWires.map(w => w.toPort))

    if (spec.inputs > 0 && Array.from({ length: spec.inputs }, (_, idx) => idx).some(idx => !linkedPorts.has(idx))) {
      node.error = '输入未连完整'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`✗ ${spec.title}: 输入未连完整`)
      continue
    }

    for (const wire of inWires) {
      const source = nodeMap.get(wire.fromNode)
      const sourceValue = source?.outputsData?.[wire.fromPort]
      inputs[wire.toPort] = sourceValue === undefined ? source?.result : sourceValue
    }

    if (inputs.includes(NO_FLOW)) {
      node.result = '⏭ skipped (no flow)'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`↷ ${spec.title}: skipped (no flow)`)
      continue
    }

    if (spec.inputs > 0 && inputs.some(v => v === undefined)) {
      node.error = '上游结果缺失'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`✗ ${spec.title}: 上游结果缺失`)
      continue
    }

    try {
      const normalized = normalizeRunResult(spec.run({ inputs, params: node.params }), spec.outputs)
      node.result = normalized.result
      node.outputsData = normalized.outputs
      runLog.value.push(`✓ ${spec.title}: ${formatLogValue(normalized.result)}`)
    } catch (error: any) {
      node.error = error?.message || '运行失败'
      node.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      runLog.value.push(`✗ ${spec.title}: ${node.error}`)
    }
  }

  const ok = nodes.value.filter(node => !node.error).length
  lastRunSummary.value = `执行完成：${ok}/${nodes.value.length} 节点可用`
}

function wireCountForInput(nodeId: string, toPort: number) {
  return wires.value.some(w => w.toNode === nodeId && w.toPort === toPort)
}

function loadPreset(key: string) {
  clearCanvas()
  selectedPreset.value = key

  if (key === 'squares') {
    const a = makeNode('source-range', 50, 70)
    a.params = { start: 1, end: 12, step: 1 }
    const b = makeNode('map', 360, 70)
    b.params = { mode: 'square' }
    const c = makeNode('filter', 690, 70)
    c.params = { mode: 'gte', threshold: 20, text: 'void' }
    const d = makeNode('stats', 1020, 40)
    const e = makeNode('preview', 1020, 280)
    nodes.value = [a, b, c, d, e]
    wires.value = [
      { id: makeId('wire'), fromNode: a.id, fromPort: 0, toNode: b.id, toPort: 0 },
      { id: makeId('wire'), fromNode: b.id, fromPort: 0, toNode: c.id, toPort: 0 },
      { id: makeId('wire'), fromNode: c.id, fromPort: 0, toNode: d.id, toPort: 0 },
      { id: makeId('wire'), fromNode: c.id, fromPort: 0, toNode: e.id, toPort: 0 },
    ]
  } else if (key === 'text') {
    const a = makeNode('source-text', 50, 60)
    a.params = { text: 'kernel  tcp  tcp  epoll  bpf  kernel  io_uring' }
    const b = makeNode('split', 360, 60)
    b.params = { separator: ' ' }
    const c = makeNode('filter', 690, 60)
    c.params = { mode: 'truthy', threshold: 0, text: '' }
    const d = makeNode('unique', 1010, 60)
    const e = makeNode('sort', 1310, 60)
    e.params = { mode: 'str-asc' }
    const f = makeNode('join', 1620, 60)
    f.params = { separator: ' | ' }
    const g = makeNode('preview', 1930, 60)
    nodes.value = [a, b, c, d, e, f, g]
    wires.value = [
      { id: makeId('wire'), fromNode: a.id, fromPort: 0, toNode: b.id, toPort: 0 },
      { id: makeId('wire'), fromNode: b.id, fromPort: 0, toNode: c.id, toPort: 0 },
      { id: makeId('wire'), fromNode: c.id, fromPort: 0, toNode: d.id, toPort: 0 },
      { id: makeId('wire'), fromNode: d.id, fromPort: 0, toNode: e.id, toPort: 0 },
      { id: makeId('wire'), fromNode: e.id, fromPort: 0, toNode: f.id, toPort: 0 },
      { id: makeId('wire'), fromNode: f.id, fromPort: 0, toNode: g.id, toPort: 0 },
    ]
  } else if (key === 'json') {
    const a = makeNode('source-text', 60, 80)
    a.params = { text: '{"name":"void","skills":["nuxt","ts","d1"],"stars":3}' }
    const b = makeNode('json-parse', 380, 80)
    const c = makeNode('json-stringify', 700, 80)
    c.params = { pretty: true }
    const d = makeNode('preview', 1030, 80)
    nodes.value = [a, b, c, d]
    wires.value = [
      { id: makeId('wire'), fromNode: a.id, fromPort: 0, toNode: b.id, toPort: 0 },
      { id: makeId('wire'), fromNode: b.id, fromPort: 0, toNode: c.id, toPort: 0 },
      { id: makeId('wire'), fromNode: c.id, fromPort: 0, toNode: d.id, toPort: 0 },
    ]
  } else if (key === 'branch') {
    const a = makeNode('source-number', 50, 60)
    a.params = { value: 12 }
    const b = makeNode('source-number', 50, 280)
    b.params = { value: 10 }
    const c = makeNode('compare', 380, 140)
    c.params = { mode: 'gt' }
    const d = makeNode('source-text', 380, 360)
    d.params = { text: 'packet: high-priority job' }
    const e = makeNode('branch', 760, 180)
    const f = makeNode('preview', 1130, 80)
    const g = makeNode('preview', 1130, 300)
    nodes.value = [a, b, c, d, e, f, g]
    wires.value = [
      { id: makeId('wire'), fromNode: a.id, fromPort: 0, toNode: c.id, toPort: 0 },
      { id: makeId('wire'), fromNode: b.id, fromPort: 0, toNode: c.id, toPort: 1 },
      { id: makeId('wire'), fromNode: c.id, fromPort: 0, toNode: e.id, toPort: 0 },
      { id: makeId('wire'), fromNode: d.id, fromPort: 0, toNode: e.id, toPort: 1 },
      { id: makeId('wire'), fromNode: e.id, fromPort: 0, toNode: f.id, toPort: 0 },
      { id: makeId('wire'), fromNode: e.id, fromPort: 1, toNode: g.id, toPort: 0 },
    ]
  } else {
    const a = makeNode('source-number', 60, 60)
    a.params = { value: 8 }
    const b = makeNode('source-number', 60, 260)
    b.params = { value: 13 }
    const c = makeNode('add', 380, 140)
    const d = makeNode('source-number', 380, 360)
    d.params = { value: 3 }
    const e = makeNode('multiply', 730, 220)
    const f = makeNode('preview', 1080, 220)
    nodes.value = [a, b, c, d, e, f]
    wires.value = [
      { id: makeId('wire'), fromNode: a.id, fromPort: 0, toNode: c.id, toPort: 0 },
      { id: makeId('wire'), fromNode: b.id, fromPort: 0, toNode: c.id, toPort: 1 },
      { id: makeId('wire'), fromNode: c.id, fromPort: 0, toNode: e.id, toPort: 0 },
      { id: makeId('wire'), fromNode: d.id, fromPort: 0, toNode: e.id, toPort: 1 },
      { id: makeId('wire'), fromNode: e.id, fromPort: 0, toNode: f.id, toPort: 0 },
    ]
  }

  lastRunSummary.value = `已载入 preset: ${key}`
  fitView()
  runGraph()
}

function onMinimapClick(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  const worldX = x * STAGE_W
  const worldY = y * STAGE_H
  view.x = viewportSize.value.width / 2 - worldX * view.scale
  view.y = viewportSize.value.height / 2 - worldY * view.scale
}

function onWindowKeyDown(e: KeyboardEvent) {
  if (isEditableTarget(e.target)) return
  if (e.code === 'Space') {
    spacePressed.value = true
    e.preventDefault()
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.value.length) {
    deleteSelected()
    e.preventDefault()
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
    selectedNodeIds.value = nodes.value.map(n => n.id)
    e.preventDefault()
  }
}

function onWindowKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spacePressed.value = false
}

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('keydown', onWindowKeyDown)
  window.addEventListener('keyup', onWindowKeyUp)
  loadPreset('branch')
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportSize)
  window.removeEventListener('keydown', onWindowKeyDown)
  window.removeEventListener('keyup', onWindowKeyUp)
})
</script>

<template>
  <div class="min-h-screen flex flex-col" style="background:#08080f;color:var(--color-text-primary)">
    <AppNav :crumbs="crumbs" />

    <div class="px-4 pt-3 pb-2 flex flex-wrap gap-2 items-center border-b" style="border-color:var(--color-void-border)">
      <div class="text-sm font-mono font-bold" style="color:var(--color-neon-cyan)">AI Flow / Executable Flowchart</div>
      <div class="text-xs font-mono" style="color:var(--color-text-muted)">现在带 Zoom / Pan / Minimap / 框选，多输入和分支也都在。</div>
      <button
        class="ml-auto px-3 py-1.5 rounded border text-xs font-mono transition-all"
        style="border-color:#39ff14;color:#39ff14;background:rgba(57,255,20,0.08)"
        @click="runGraph"
      >▶ Run</button>
      <button
        class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
        style="border-color:var(--color-void-border);color:var(--color-text-muted)"
        @click="fitView"
      >Fit</button>
      <button
        class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
        style="border-color:var(--color-void-border);color:var(--color-text-muted)"
        @click="resetZoom"
      >100%</button>
      <button
        class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
        style="border-color:var(--color-void-border);color:var(--color-text-muted)"
        @click="clearCanvas"
      >Clear</button>
      <button
        class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
        :style="selectedNodeIds.length
          ? 'border-color:#ff6b6b;color:#ff8f8f;background:rgba(255,107,107,0.08)'
          : 'border-color:var(--color-void-border);color:var(--color-text-muted)'"
        @click="deleteSelected"
      >Delete Selected</button>
      <button
        class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
        style="border-color:var(--color-void-border);color:var(--color-text-muted)"
        @click="copyText(mermaidCode, 'Mermaid')"
      >Copy Mermaid</button>
      <button
        class="px-3 py-1.5 rounded border text-xs font-mono transition-all"
        style="border-color:var(--color-void-border);color:var(--color-text-muted)"
        @click="copyText(graphJson, 'JSON')"
      >Copy JSON</button>
    </div>

    <div class="flex flex-1 overflow-hidden" style="height:calc(100vh - 96px)">
      <aside class="w-72 shrink-0 p-3 border-r overflow-y-auto" style="border-color:var(--color-void-border);background:var(--color-void-card)">
        <div class="text-xs font-mono leading-6" style="color:var(--color-text-muted)">
          这版开始像 <span style="color:var(--color-neon-cyan)">正经 flow editor</span> 了：
          鼠标滚轮缩放，<span style="color:#c9f8d8">Alt/Space + 拖拽</span> 平移，拖框多选，右下角还有 minimap。
        </div>

        <div class="mt-4 rounded-lg border p-3 text-[10px] font-mono leading-5" style="border-color:var(--color-void-border);background:rgba(255,255,255,0.02);color:var(--color-text-muted)">
          - Wheel：Zoom<br>
          - Alt/Space + Drag：Pan<br>
          - Blank Area Drag：框选<br>
          - Delete / Backspace：删除选中<br>
          - Ctrl/Cmd + A：全选
        </div>

        <div class="mt-4 mb-2 text-xs font-mono font-bold" style="color:var(--color-neon-cyan)">Presets</div>
        <button
          v-for="preset in presets"
          :key="preset.key"
          class="w-full text-left rounded-lg border p-3 mb-2 transition-all"
          :style="selectedPreset === preset.key
            ? 'border-color:#00d4ff;background:rgba(0,212,255,0.08);color:#e6faff'
            : 'border-color:var(--color-void-border);background:rgba(255,255,255,0.02);color:var(--color-text-primary)'"
          @click="loadPreset(preset.key)"
        >
          <div class="text-xs font-mono font-bold">{{ preset.label }}</div>
          <div class="text-[10px] font-mono mt-1" style="color:var(--color-text-muted)">{{ preset.desc }}</div>
        </button>

        <div class="mt-4 mb-2 text-xs font-mono font-bold" style="color:var(--color-neon-cyan)">Node Palette</div>
        <div v-for="(items, category) in groupedSpecs" :key="category" class="mb-4">
          <div class="text-[11px] font-mono mb-2 uppercase tracking-wide" style="color:var(--color-text-muted)">{{ category }}</div>
          <div
            v-for="item in items"
            :key="item.type"
            draggable="true"
            @dragstart="onPanelDragStart($event, item.type)"
            class="rounded-lg border p-3 mb-2 cursor-grab active:cursor-grabbing transition-all"
            :style="`border-color:${item.spec.color}44;background:${item.spec.color}12`"
          >
            <div class="flex items-center gap-2">
              <span>{{ item.spec.icon }}</span>
              <span class="text-xs font-mono font-bold" :style="`color:${item.spec.color}`">{{ item.spec.title }}</span>
            </div>
            <div class="text-[10px] font-mono mt-1" style="color:var(--color-text-muted)">{{ item.spec.description }}</div>
          </div>
        </div>
      </aside>

      <main
        ref="canvasEl"
        class="flex-1 relative overflow-hidden select-none"
        style="background:#08080f"
        @dragover="onCanvasDragOver"
        @drop="onCanvasDrop"
        @mousedown="onCanvasMouseDown"
        @mousemove="onCanvasMouseMove"
        @mouseup="onCanvasMouseUp"
        @mouseleave="onCanvasMouseUp"
        @wheel.prevent="onCanvasWheel"
      >
        <div class="absolute inset-0 overflow-hidden">
          <div class="absolute left-0 top-0" :style="stageStyle">
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
                  :d="wirePath(wire)"
                  :stroke="wireColor(wire)"
                  stroke-width="2.2"
                  fill="none"
                  stroke-dasharray="10 6"
                  opacity="0.9"
                  filter="url(#flow-glow)"
                  style="pointer-events:none"
                />
                <path
                  :d="wirePath(wire)"
                  stroke="transparent"
                  stroke-width="16"
                  fill="none"
                  style="cursor:pointer"
                  @click.stop="deleteWire(wire.id)"
                />
              </g>

              <path
                v-if="pendingWire"
                :d="pendingWirePath"
                stroke="rgba(57,255,20,0.8)"
                stroke-width="2.2"
                stroke-dasharray="8 5"
                fill="none"
                filter="url(#flow-glow)"
              />
            </svg>

            <div
              v-for="node in nodes"
              :key="node.id"
              class="node-shell absolute rounded-xl border-2 overflow-visible"
              :style="`
                left:${node.x}px;
                top:${node.y}px;
                width:${NODE_W}px;
                height:${nodeHeight(node)}px;
                border-color:${isNodeSelected(node.id) ? '#00d4ff' : specFor(node.type).color};
                background:rgba(7,10,18,0.92);
                box-shadow:${isNodeSelected(node.id)
                  ? '0 0 0 1px rgba(0,212,255,0.6), 0 0 32px rgba(0,212,255,0.25)'
                  : '0 0 0 1px rgba(255,255,255,0.03), 0 0 24px ' + specFor(node.type).color + '22'};
                z-index:${isNodeSelected(node.id) ? 30 : 10};
              `"
              @mousedown="onNodeMouseDown($event, node)"
            >
              <div
                class="flex items-center gap-2 px-3 rounded-t-xl"
                :style="`
                  height:${HEADER_H}px;
                  background:${specFor(node.type).color}18;
                  border-bottom:1px solid ${specFor(node.type).color}44;
                  cursor:move;
                `"
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

              <div class="px-3 py-2 text-[10px] font-mono leading-5" style="height:38px;color:var(--color-text-muted)">
                {{ specFor(node.type).description }}
              </div>

              <div class="px-3 pb-2">
                <div v-for="param in specFor(node.type).params" :key="param.key" class="mb-2">
                  <label class="block text-[10px] font-mono mb-1" style="color:var(--color-text-muted)">{{ param.label }}</label>

                  <input
                    v-if="param.kind === 'number'"
                    v-model.number="node.params[param.key]"
                    type="number"
                    :step="param.step ?? 1"
                    :min="param.min"
                    :max="param.max"
                    class="w-full rounded border px-2 py-1.5 text-xs font-mono"
                    style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff"
                  >

                  <input
                    v-else-if="param.kind === 'text'"
                    v-model="node.params[param.key]"
                    type="text"
                    :placeholder="param.placeholder"
                    class="w-full rounded border px-2 py-1.5 text-xs font-mono"
                    style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff"
                  >

                  <textarea
                    v-else-if="param.kind === 'textarea'"
                    v-model="node.params[param.key]"
                    :placeholder="param.placeholder"
                    rows="3"
                    class="w-full rounded border px-2 py-1.5 text-xs font-mono resize-none"
                    style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff"
                  />

                  <select
                    v-else-if="param.kind === 'select'"
                    v-model="node.params[param.key]"
                    class="w-full rounded border px-2 py-1.5 text-xs font-mono"
                    style="border-color:rgba(255,255,255,0.08);background:#0f1320;color:#e7f7ff"
                  >
                    <option v-for="option in param.options" :key="String(option.value)" :value="option.value">{{ option.label }}</option>
                  </select>

                  <label v-else class="flex items-center gap-2 text-xs font-mono" style="color:#e7f7ff">
                    <input v-model="node.params[param.key]" type="checkbox">
                    enabled
                  </label>
                </div>
              </div>

              <div class="mx-3 mt-1 rounded-lg border p-2" style="min-height:62px;border-color:rgba(255,255,255,0.08);background:rgba(255,255,255,0.03)">
                <div class="text-[10px] font-mono mb-1" style="color:var(--color-text-muted)">runtime</div>
                <pre class="text-[10px] font-mono whitespace-pre-wrap break-all leading-5" :style="node.error ? 'color:#ff7878' : 'color:#c9f8d8'">{{ node.error || formatValue(node.result) }}</pre>
              </div>

              <template v-for="i in specFor(node.type).inputs" :key="`in-${i}`">
                <div
                  class="absolute text-[9px] font-mono"
                  :style="`
                    left:-42px;
                    top:${inputPortY(node, i - 1) - 6}px;
                    width:30px;
                    text-align:right;
                    color:${wireCountForInput(node.id, i - 1) ? '#39ff14' : 'rgba(255,255,255,0.45)'};
                  `"
                >{{ inputLabel(specFor(node.type), i - 1) }}</div>
                <div
                  class="port absolute rounded-full border-2"
                  :style="`
                    left:-8px;
                    top:${inputPortY(node, i - 1) - PORT_R}px;
                    width:${PORT_R * 2}px;
                    height:${PORT_R * 2}px;
                    border-color:#08080f;
                    background:${wireCountForInput(node.id, i - 1) ? '#39ff14' : specFor(node.type).color};
                    box-shadow:0 0 10px ${specFor(node.type).color};
                    cursor:crosshair;
                  `"
                  @mouseup.stop="finishWire($event, node, i - 1)"
                />
              </template>

              <template v-for="i in specFor(node.type).outputs" :key="`out-${i}`">
                <div
                  class="absolute text-[9px] font-mono"
                  :style="`
                    right:-52px;
                    top:${outputPortY(node, i - 1) - 6}px;
                    width:42px;
                    text-align:left;
                    color:rgba(255,255,255,0.45);
                  `"
                >{{ outputLabel(specFor(node.type), i - 1) }}</div>
                <div
                  class="port absolute rounded-full border-2"
                  :style="`
                    right:-8px;
                    top:${outputPortY(node, i - 1) - PORT_R}px;
                    width:${PORT_R * 2}px;
                    height:${PORT_R * 2}px;
                    border-color:#08080f;
                    background:${specFor(node.type).color};
                    box-shadow:0 0 10px ${specFor(node.type).color};
                    cursor:crosshair;
                  `"
                  @mousedown.stop="startWire($event, node, i - 1)"
                />
              </template>
            </div>
          </div>

          <div v-if="selectionRectStyle" class="absolute border pointer-events-none" :style="{ ...selectionRectStyle, borderColor: '#00d4ff', background: 'rgba(0,212,255,0.08)', zIndex: 60 }" />

          <div v-if="nodes.length === 0" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="text-center font-mono" style="color:rgba(255,255,255,0.14)">
              <div class="text-5xl mb-4">🕸️</div>
              <div class="text-sm">拖节点进来，连成一张真能跑的 flow graph</div>
              <div class="text-xs mt-2">拖拽节点 · Wheel 缩放 · Alt/Space+拖拽平移 · Blank Drag 框选</div>
            </div>
          </div>

          <div class="minimap-box absolute right-4 bottom-4 rounded-xl border p-2" style="width:240px;border-color:rgba(255,255,255,0.08);background:rgba(7,10,18,0.88);backdrop-filter:blur(4px);z-index:80">
            <div class="flex items-center justify-between mb-2">
              <div class="text-[10px] font-mono" style="color:var(--color-neon-cyan)">minimap</div>
              <div class="text-[10px] font-mono" style="color:var(--color-text-muted)">{{ Math.round(view.scale * 100) }}%</div>
            </div>
            <div
              class="relative rounded-md overflow-hidden cursor-pointer"
              :style="`width:${MINIMAP_W}px;height:${MINIMAP_H}px;background:#0c101b;border:1px solid rgba(255,255,255,0.06)`"
              @click.stop="onMinimapClick"
            >
              <div v-for="node in nodes" :key="`mini-${node.id}`" class="absolute rounded-sm"
                :style="`
                  left:${(node.x / STAGE_W) * MINIMAP_W}px;
                  top:${(node.y / STAGE_H) * MINIMAP_H}px;
                  width:${Math.max(8, (NODE_W / STAGE_W) * MINIMAP_W)}px;
                  height:${Math.max(6, (nodeHeight(node) / STAGE_H) * MINIMAP_H)}px;
                  background:${isNodeSelected(node.id) ? '#00d4ff' : specFor(node.type).color};
                  opacity:0.85;
                `"
              />
              <div class="absolute border rounded-sm pointer-events-none" :style="{ ...minimapViewportStyle, borderColor: '#ffffff88', background: 'rgba(255,255,255,0.06)' }" />
            </div>
          </div>
        </div>
      </main>

      <aside class="w-80 shrink-0 p-3 border-l overflow-y-auto" style="border-color:var(--color-void-border);background:var(--color-void-card)">
        <div class="text-xs font-mono font-bold mb-2" style="color:var(--color-neon-cyan)">Runtime</div>
        <div class="rounded-lg border p-3 text-xs font-mono" style="border-color:var(--color-void-border);background:rgba(255,255,255,0.02);color:var(--color-text-muted)">
          <div>nodes: <span style="color:#e7f7ff">{{ nodes.length }}</span></div>
          <div>wires: <span style="color:#e7f7ff">{{ wires.length }}</span></div>
          <div>selected: <span style="color:#e7f7ff">{{ selectedNodeIds.length }}</span></div>
          <div>view: <span style="color:#e7f7ff">{{ Math.round(view.scale * 100) }}%</span></div>
          <div class="mt-2" style="color:#c9f8d8">{{ lastRunSummary }}</div>
          <div v-if="globalError" class="mt-2" style="color:#ff7878">{{ globalError }}</div>
        </div>

        <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">Execution Log</div>
        <div class="rounded-lg border p-3" style="border-color:var(--color-void-border);background:rgba(255,255,255,0.02)">
          <div v-if="runLog.length === 0" class="text-[10px] font-mono" style="color:var(--color-text-muted)">还没跑，点一下 Run。</div>
          <div
            v-for="(line, idx) in runLog"
            :key="idx"
            class="text-[10px] font-mono leading-5 break-all"
            :style="line.startsWith('✗') ? 'color:#ff7878' : line.startsWith('↷') ? 'color:#ffd166' : 'color:#c9f8d8'"
          >
            {{ line }}
          </div>
        </div>

        <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">Mermaid Export</div>
        <textarea
          :value="mermaidCode"
          readonly
          rows="12"
          class="w-full rounded-lg border p-3 text-[10px] font-mono resize-none"
          style="border-color:var(--color-void-border);background:#0f1320;color:#d9f3ff"
        />

        <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">这轮增强</div>
        <div class="text-[10px] font-mono leading-5" style="color:var(--color-text-muted)">
          - Zoom / Pan / Fit / Reset Zoom<br>
          - Minimap + 点击跳转视口<br>
          - 框选 / 多选 / 批量拖动<br>
          - Delete Selected + 键盘快捷键
        </div>

        <div class="text-xs font-mono font-bold mt-4 mb-2" style="color:var(--color-neon-cyan)">玩法说明</div>
        <div class="text-[10px] font-mono leading-5" style="color:var(--color-text-muted)">
          1. 左侧拖节点到画布。<br>
          2. 从节点右侧输出端口拉线到目标左侧输入端口。<br>
          3. Wheel 缩放；Alt/Space + Drag 平移视图。<br>
          4. 在空白区拖拽可框选多个节点，然后一起移动。<br>
          5. 当前执行器只支持 DAG，不支持环。
        </div>
      </aside>
    </div>
  </div>
</template>
