// utils/ai-flow.ts
// NO_FLOW symbol、helper 函数、NODE_SPECS、工具函数

import { NO_FLOW } from '~/types/ai-flow'
import type { NodeSpec, NodeRunResult, FlowNode } from '~/types/ai-flow'

// Re-export so consumers can import from here directly
export { NO_FLOW }

// ── Helper 函数 ────────────────────────────────────────────

export function parseArrayInput(raw: string): any[] {
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

export function requireArray(value: any, label = '输入'): any[] {
  if (!Array.isArray(value)) throw new Error(`${label} 需要数组`)
  return value
}

export function requireString(value: any, label = '输入'): string {
  if (typeof value !== 'string') throw new Error(`${label} 需要字符串`)
  return value
}

export function requireNumber(value: any, label = '输入'): number {
  const num = Number(value)
  if (!Number.isFinite(num)) throw new Error(`${label} 需要 number`)
  return num
}

export function requireBoolean(value: any, label = '输入'): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`${label} 需要 boolean`)
}

export function requireNumberArray(value: any, label = '输入'): number[] {
  const arr = requireArray(value, label)
  if (!arr.every(v => typeof v === 'number' && Number.isFinite(v))) throw new Error(`${label} 需要 number[]`)
  return arr as number[]
}

export function mapValue(value: any, mode: string): any {
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

export function normalizeRunResult(raw: any, outputCount: number): { result: any; outputs: any[] } {
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

export function safeCompare(left: any, right: any, mode: string): boolean {
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

export function formatValue(value: any): string {
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

export function formatLogValue(value: any): string {
  if (value === NO_FLOW) return 'no-flow'
  if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 80)}…` : value
  try {
    const json = JSON.stringify(value)
    return json.length > 80 ? `${json.slice(0, 80)}…` : json
  } catch {
    return String(value)
  }
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
