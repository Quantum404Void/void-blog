// utils/ai-flow.ts
// NO_FLOW symbol、helper 函数、NODE_SPECS、工具函数

import { NO_FLOW } from '~/types/ai-flow'
import type { FlowValue, NodeRunContext, NodeRunResult, NodeSpec, FlowNode } from '~/types/ai-flow'

// Re-export so consumers can import from here directly
export { NO_FLOW }

// ── Helper 函数 ────────────────────────────────────────────

export function parseArrayInput(raw: string): FlowValue[] {
  const text = String(raw ?? '').trim()
  if (!text) return []
  if (text.startsWith('[')) {
    const parsed = JSON.parse(text)
    if (!Array.isArray(parsed)) throw new Error('不是合法 JSON 数组')
    return parsed as FlowValue[]
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

export function requireArray(value: FlowValue, label = '输入'): FlowValue[] {
  if (!Array.isArray(value)) throw new Error(`${label} 需要数组`)
  return value
}

export function requireString(value: FlowValue, label = '输入'): string {
  if (typeof value !== 'string') throw new Error(`${label} 需要字符串`)
  return value
}

export function requireNumber(value: FlowValue, label = '输入'): number {
  const num = Number(value)
  if (!Number.isFinite(num)) throw new Error(`${label} 需要 number`)
  return num
}

export function requireBoolean(value: FlowValue, label = '输入'): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`${label} 需要 boolean`)
}

export function requireNumberArray(value: FlowValue, label = '输入'): number[] {
  const arr = requireArray(value, label)
  if (!arr.every(v => typeof v === 'number' && Number.isFinite(v))) throw new Error(`${label} 需要 number[]`)
  return arr as number[]
}

export function mapValue(value: FlowValue, mode: string): FlowValue {
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

export function normalizeRunResult(raw: FlowValue | NodeRunResult, outputCount: number): { result: FlowValue; outputs: FlowValue[] } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as NodeRunResult).outputs)) {
    const nr = raw as NodeRunResult
    const result = Object.prototype.hasOwnProperty.call(nr, 'result') ? nr.result : nr.outputs![0]
    return {
      result,
      outputs: Array.from({ length: outputCount }, (_, idx) => nr.outputs![idx] ?? NO_FLOW) as FlowValue[],
    }
  }
  const r = raw as FlowValue
  return {
    result: r,
    outputs: outputCount > 0
      ? Array.from({ length: outputCount }, (_, idx) => idx === 0 ? r : NO_FLOW) as FlowValue[]
      : [],
  }
}

export function safeCompare(left: FlowValue, right: FlowValue, mode: string): boolean {
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

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function makeNode(type: string, x: number, y: number): FlowNode {
  const spec = NODE_SPECS[type]
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

export function formatValue(value: FlowValue): string {
  if (value === undefined) return '—'
  if ((value as unknown) === NO_FLOW) return '⏭ no flow'
  if (typeof value === 'string') return value.length > 220 ? `${value.slice(0, 220)}…` : value
  try {
    const json = JSON.stringify(value, null, 2)
    return json.length > 220 ? `${json.slice(0, 220)}…` : json
  } catch {
    return String(value)
  }
}

export function formatLogValue(value: FlowValue): string {
  if ((value as unknown) === NO_FLOW) return 'no-flow'
  if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 80)}…` : value
  try {
    const json = JSON.stringify(value)
    return json.length > 80 ? `${json.slice(0, 80)}…` : json
  } catch {
    return String(value)
  }
}

// ── Geometry constants and pure functions ────────────────────

export const NODE_W = 260
export const HEADER_H = 40
export const DESC_H = 38
export const RESULT_H = 78
export const PORT_R = 6
export const STAGE_W = 3200
export const STAGE_H = 2000
export const MINIMAP_W = 220
export const MINIMAP_H = 140

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function specFor(type: string) {
  return NODE_SPECS[type]
}

export function nodeHeight(node: FlowNode): number {
  const spec = specFor(node.type)
  const paramsH = spec.params.reduce((sum, param) => sum + (param.kind === 'textarea' ? 88 : 42), 0)
  return HEADER_H + DESC_H + paramsH + RESULT_H
}

export function inputPortY(node: FlowNode, index: number): number {
  const spec = specFor(node.type)
  const h = nodeHeight(node)
  if (spec.inputs <= 1) return h / 2
  return (index + 1) * (h / (spec.inputs + 1))
}

export function outputPortY(node: FlowNode, index: number): number {
  const spec = specFor(node.type)
  const h = nodeHeight(node)
  if (spec.outputs <= 1) return h / 2
  return (index + 1) * (h / (spec.outputs + 1))
}

export function inputLabel(spec: NodeSpec, index: number): string {
  return spec.inputLabels?.[index] ?? `in${index + 1}`
}

export function outputLabel(spec: NodeSpec, index: number): string {
  return spec.outputLabels?.[index] ?? `out${index + 1}`
}

export function bezierPath(fromX: number, fromY: number, toX: number, toY: number): string {
  const cx = Math.max(60, Math.abs(toX - fromX) * 0.45)
  return `M ${fromX} ${fromY} C ${fromX + cx} ${fromY}, ${toX - cx} ${toY}, ${toX} ${toY}`
}

// ── NODE_SPECS ─────────────────────────────────────────────

export const NODE_SPECS: Record<string, NodeSpec> = {
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
    run: ({ params }: NodeRunContext) => Number(params.value ?? 0),
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
    run: ({ params }: NodeRunContext) => Boolean(params.value),
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
    run: ({ params }: NodeRunContext) => String(params.text ?? ''),
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
    run: ({ params }: NodeRunContext) => parseArrayInput(String(params.items ?? '')),
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
    run: ({ params }: NodeRunContext) => {
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
    run: ({ inputs, params }: NodeRunContext) => requireArray(inputs[0]).map(item => mapValue(item, String(params.mode))),
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
    run: ({ inputs, params }: NodeRunContext) => {
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
    run: ({ inputs, params }: NodeRunContext) => {
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
    run: ({ inputs, params }: NodeRunContext) => {
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
    run: ({ inputs }: NodeRunContext) => {
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
    run: ({ inputs, params }: NodeRunContext) => requireArray(inputs[0]).slice(0, Number(params.count ?? 0)),
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
    run: ({ inputs }: NodeRunContext) => requireNumber(inputs[0], 'a') + requireNumber(inputs[1], 'b'),
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
    run: ({ inputs }: NodeRunContext) => requireNumber(inputs[0], 'a') * requireNumber(inputs[1], 'b'),
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
    run: ({ inputs, params }: NodeRunContext) => safeCompare(inputs[0], inputs[1], String(params.mode)),
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
    run: ({ inputs }: NodeRunContext) => {
      const [left, right] = inputs
      if (Array.isArray(left) && Array.isArray(right)) return [...left, ...right]
      if (typeof left === 'string' || typeof right === 'string') return `${String(left)}${String(right)}`
      if (left && right && typeof left === 'object' && typeof right === 'object') return { ...(left as Record<string, FlowValue>), ...(right as Record<string, FlowValue>) }
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
    run: ({ inputs }: NodeRunContext): NodeRunResult => {
      const cond = requireBoolean(inputs[0], 'cond')
      const payload = inputs[1]
      return {
        result: { routed: cond ? 'true' : 'false', payload } as unknown as FlowValue,
        outputs: cond ? [payload, NO_FLOW as unknown as FlowValue] : [NO_FLOW as unknown as FlowValue, payload],
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
    run: ({ inputs, params }: NodeRunContext) => requireString(inputs[0]).split(String(params.separator ?? ' ')).filter(Boolean),
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
    run: ({ inputs, params }: NodeRunContext) => requireArray(inputs[0]).map(v => String(v)).join(String(params.separator ?? ', ')),
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
    run: ({ inputs }: NodeRunContext) => requireString(inputs[0]).toUpperCase(),
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
    run: ({ inputs }: NodeRunContext) => requireString(inputs[0]).toLowerCase(),
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
    run: ({ inputs }: NodeRunContext) => {
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
    run: ({ inputs }: NodeRunContext) => {
      const arr = requireNumberArray(inputs[0])
      const count = arr.length
      const sum = arr.reduce((a, b) => a + b, 0)
      return {
        count,
        min: count ? Math.min(...arr) : null,
        max: count ? Math.max(...arr) : null,
        avg: count ? Number((sum / count).toFixed(4)) : null,
        sum,
      } as unknown as FlowValue
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
    run: ({ inputs }: NodeRunContext) => JSON.parse(requireString(inputs[0])) as FlowValue,
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
    run: ({ inputs, params }: NodeRunContext) => JSON.stringify(inputs[0], null, params.pretty ? 2 : 0),
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
    run: ({ inputs }: NodeRunContext) => inputs[0],
  },

  // ---- Math ----
  'math-round': {
    title: 'Round',
    icon: '🔵',
    color: '#ffd400',
    category: 'Math',
    description: '对数值做 round / ceil / floor。',
    inputs: 1,
    outputs: 1,
    params: [
      {
        key: 'mode', label: 'mode', kind: 'select' as const, options: [
          { label: 'round', value: 'round' },
          { label: 'ceil',  value: 'ceil'  },
          { label: 'floor', value: 'floor' },
        ],
      },
      { key: 'decimals', label: 'decimals', kind: 'number' as const, step: 1, min: 0, max: 10 },
    ],
    createParams: () => ({ mode: 'round', decimals: 0 }),
    run: ({ inputs, params }: NodeRunContext) => {
      const n = requireNumber(inputs[0])
      const d = Number(params.decimals ?? 0)
      const factor = 10 ** d
      switch (params.mode) {
        case 'ceil':  return Math.ceil(n * factor) / factor
        case 'floor': return Math.floor(n * factor) / factor
        default:      return Math.round(n * factor) / factor
      }
    },
  },

  // ---- Array ----
  'flatten': {
    title: 'Flatten',
    icon: '📐',
    color: '#39ff14',
    category: 'Array',
    description: '嵌套数组展平一层（depth=1）。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }: NodeRunContext) => requireArray(inputs[0]).flat() as FlowValue[],
  },
  'chunk': {
    title: 'Chunk',
    icon: '🍰',
    color: '#39ff14',
    category: 'Array',
    description: '把数组切成固定大小的子数组。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'size', label: 'size', kind: 'number' as const, step: 1, min: 1 },
    ],
    createParams: () => ({ size: 2 }),
    run: ({ inputs, params }: NodeRunContext) => {
      const arr = requireArray(inputs[0])
      const size = Math.max(1, Number(params.size ?? 2))
      const chunks: FlowValue[][] = []
      for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
      return chunks
    },
  },
  'zip': {
    title: 'Zip',
    icon: '🤐',
    color: '#39ff14',
    category: 'Array',
    description: '把两个数组逐元素配对为 [a,b] 对。',
    inputs: 2,
    outputs: 1,
    inputLabels: ['arr1', 'arr2'],
    params: [],
    createParams: () => ({}),
    run: ({ inputs }: NodeRunContext) => {
      const a = requireArray(inputs[0], 'arr1')
      const b = requireArray(inputs[1], 'arr2')
      const len = Math.min(a.length, b.length)
      return Array.from({ length: len }, (_, i) => [a[i], b[i]] as FlowValue[])
    },
  },
  'count': {
    title: 'Count',
    icon: '#️⃣',
    color: '#39ff14',
    category: 'Array',
    description: '输出数组长度。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }: NodeRunContext) => requireArray(inputs[0]).length,
  },
  'reverse': {
    title: 'Reverse',
    icon: '🔄',
    color: '#39ff14',
    category: 'Array',
    description: '反转数组顺序。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }: NodeRunContext) => [...requireArray(inputs[0])].reverse(),
  },

  // ---- Object ----
  'obj-keys': {
    title: 'Object.keys',
    icon: '🗝️',
    color: '#aa88ff',
    category: 'Object',
    description: '提取对象的 key 数组。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }: NodeRunContext) => {
      const v = inputs[0]
      if (v && typeof v === 'object' && !Array.isArray(v)) return Object.keys(v)
      throw new Error('输入需要 object')
    },
  },
  'obj-values': {
    title: 'Object.values',
    icon: '📋',
    color: '#aa88ff',
    category: 'Object',
    description: '提取对象的 value 数组。',
    inputs: 1,
    outputs: 1,
    params: [],
    createParams: () => ({}),
    run: ({ inputs }: NodeRunContext) => {
      const v = inputs[0]
      if (v && typeof v === 'object' && !Array.isArray(v)) return Object.values(v) as FlowValue[]
      throw new Error('输入需要 object')
    },
  },
  'obj-pick': {
    title: 'Object.pick',
    icon: '🎯',
    color: '#aa88ff',
    category: 'Object',
    description: '从对象中选取指定 key，逗号分隔。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'keys', label: 'keys', kind: 'text' as const, placeholder: 'name, age' },
    ],
    createParams: () => ({ keys: 'name, age' }),
    run: ({ inputs, params }: NodeRunContext) => {
      const v = inputs[0]
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('输入需要 object')
      const obj = v as Record<string, FlowValue>
      const ks = String(params.keys ?? '').split(',').map((k: string) => k.trim()).filter(Boolean)
      return Object.fromEntries(ks.filter((k: string) => k in obj).map((k: string) => [k, obj[k]])) as Record<string, FlowValue>
    },
  },

  // ---- String ----
  'regex-match': {
    title: 'Regex Match',
    icon: '🔍',
    color: '#ff7a00',
    category: 'String',
    description: '正则匹配，输出所有匹配项。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'pattern', label: 'pattern', kind: 'text' as const, placeholder: '\\d+' },
      { key: 'flags',   label: 'flags',   kind: 'text' as const, placeholder: 'g' },
    ],
    createParams: () => ({ pattern: '\\d+', flags: 'g' }),
    run: ({ inputs, params }: NodeRunContext) => {
      const str = requireString(inputs[0])
      const re = new RegExp(String(params.pattern ?? ''), String(params.flags ?? ''))
      if (String(params.flags ?? '').includes('g')) {
        return [...str.matchAll(re)].map(m => m[0])
      }
      const m = str.match(re)
      return m ? [...m] : []
    },
  },
  'regex-replace': {
    title: 'Regex Replace',
    icon: '✏️',
    color: '#ff7a00',
    category: 'String',
    description: '正则替换字符串。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'pattern',     label: 'pattern',     kind: 'text' as const, placeholder: '\\s+' },
      { key: 'replacement', label: 'replacement', kind: 'text' as const, placeholder: '_' },
      { key: 'flags',       label: 'flags',       kind: 'text' as const, placeholder: 'g' },
    ],
    createParams: () => ({ pattern: '\\s+', replacement: '_', flags: 'g' }),
    run: ({ inputs, params }: NodeRunContext) => {
      const str = requireString(inputs[0])
      const re = new RegExp(String(params.pattern ?? ''), String(params.flags ?? ''))
      return str.replace(re, String(params.replacement ?? ''))
    },
  },
  'string-slice': {
    title: 'Slice',
    icon: '🔪',
    color: '#ff7a00',
    category: 'String',
    description: '字符串切片 str.slice(start, end)。',
    inputs: 1,
    outputs: 1,
    params: [
      { key: 'start', label: 'start', kind: 'number' as const, step: 1 },
      { key: 'end',   label: 'end',   kind: 'number' as const, step: 1 },
    ],
    createParams: () => ({ start: 0, end: 10 }),
    run: ({ inputs, params }: NodeRunContext) => {
      const str = requireString(inputs[0])
      const s = Number(params.start ?? 0)
      const e = (params.end !== '' && params.end !== null && params.end !== undefined) ? Number(params.end) : undefined
      return str.slice(s, e)
    },
  },

  // ---- Source ----
  'source-random': {
    title: 'Random',
    icon: '🎲',
    color: '#00d4ff',
    category: 'Source',
    description: '生成随机数数组（min~max 之间）。',
    inputs: 0,
    outputs: 1,
    params: [
      { key: 'count', label: 'count', kind: 'number' as const, step: 1, min: 1 },
      { key: 'min',   label: 'min',   kind: 'number' as const, step: 1 },
      { key: 'max',   label: 'max',   kind: 'number' as const, step: 1 },
      {
        key: 'mode', label: 'mode', kind: 'select' as const, options: [
          { label: 'float', value: 'float' },
          { label: 'int',   value: 'int'   },
        ],
      },
    ],
    createParams: () => ({ count: 8, min: 1, max: 100, mode: 'int' }),
    run: ({ params }: NodeRunContext) => {
      const count = Math.min(1000, Math.max(1, Number(params.count ?? 8)))
      const min = Number(params.min ?? 0)
      const max = Number(params.max ?? 100)
      return Array.from({ length: count }, () => {
        const r = Math.random() * (max - min) + min
        return params.mode === 'int' ? Math.floor(r) : Math.round(r * 1000) / 1000
      })
    },
  },
}
