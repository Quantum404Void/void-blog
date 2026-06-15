// utils/ai-flow-presets.ts
// 各 preset 的节点+连线工厂函数

import { makeId, makeNode, NODE_SPECS } from './nodes'
import type { FlowNode, Wire, FlowGroup } from '~/types/ai-flow'

export interface GraphSnapshot {
  nodes: FlowNode[]
  wires: Wire[]
  groups: FlowGroup[]
}

function w(fromNode: FlowNode, fromPort: number, toNode: FlowNode, toPort: number): Wire {
  return { id: makeId('wire'), fromNode: fromNode.id, fromPort, toNode: toNode.id, toPort }
}

export function buildSquaresPreset(): GraphSnapshot {
  const a = makeNode('source-range', 50, 70)
  a.params = { start: 1, end: 12, step: 1 }
  const b = makeNode('map', 360, 70)
  b.params = { mode: 'square' }
  const c = makeNode('filter', 690, 70)
  c.params = { mode: 'gte', threshold: 20, text: 'void' }
  const d = makeNode('stats', 1020, 40)
  const e = makeNode('preview', 1020, 280)
  return {
    nodes: [a, b, c, d, e],
    wires: [
      w(a, 0, b, 0),
      w(b, 0, c, 0),
      w(c, 0, d, 0),
      w(c, 0, e, 0),
    ],
    groups: [],
  }
}

export function buildTextPreset(): GraphSnapshot {
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
  return {
    nodes: [a, b, c, d, e, f, g],
    wires: [
      w(a, 0, b, 0),
      w(b, 0, c, 0),
      w(c, 0, d, 0),
      w(d, 0, e, 0),
      w(e, 0, f, 0),
      w(f, 0, g, 0),
    ],
    groups: [],
  }
}

export function buildJsonPreset(): GraphSnapshot {
  const a = makeNode('source-text', 60, 80)
  a.params = { text: '{"name":"void","skills":["nuxt","ts","d1"],"stars":3}' }
  const b = makeNode('json-parse', 380, 80)
  const c = makeNode('json-stringify', 700, 80)
  c.params = { pretty: true }
  const d = makeNode('preview', 1030, 80)
  return {
    nodes: [a, b, c, d],
    wires: [
      w(a, 0, b, 0),
      w(b, 0, c, 0),
      w(c, 0, d, 0),
    ],
    groups: [],
  }
}

export function buildBranchPreset(): GraphSnapshot {
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
  return {
    nodes: [a, b, c, d, e, f, g],
    wires: [
      w(a, 0, c, 0),
      w(b, 0, c, 1),
      w(c, 0, e, 0),
      w(d, 0, e, 1),
      w(e, 0, f, 0),
      w(e, 1, g, 0),
    ],
    groups: [],
  }
}

export function buildMathPreset(): GraphSnapshot {
  const a = makeNode('source-number', 60, 60)
  a.params = { value: 8 }
  const b = makeNode('source-number', 60, 260)
  b.params = { value: 13 }
  const c = makeNode('add', 380, 140)
  const d = makeNode('source-number', 380, 360)
  d.params = { value: 3 }
  const e = makeNode('multiply', 730, 220)
  const f = makeNode('preview', 1080, 220)
  return {
    nodes: [a, b, c, d, e, f],
    wires: [
      w(a, 0, c, 0),
      w(b, 0, c, 1),
      w(c, 0, e, 0),
      w(d, 0, e, 1),
      w(e, 0, f, 0),
    ],
    groups: [],
  }
}

export const PRESETS = [
  { key: 'squares', label: 'Square Filter', desc: 'Range → Map(x²) → Filter(>=20) → Stats / Preview' },
  { key: 'text',    label: 'Text Clean',    desc: 'Text → Split → Unique → Sort → Join → Preview' },
  { key: 'json',    label: 'JSON Inspect',  desc: 'Text(JSON) → JSON.parse → JSON.stringify(pretty) → Preview' },
  { key: 'branch',  label: 'Branch Demo',   desc: 'Compare → Branch(true/false) → 双 Preview' },
  { key: 'math',    label: 'Math Demo',     desc: 'Number + Number → Multiply → Preview' },
]

export function buildPreset(key: string): GraphSnapshot | null {
  switch (key) {
    case 'squares': return buildSquaresPreset()
    case 'text':    return buildTextPreset()
    case 'json':    return buildJsonPreset()
    case 'branch':  return buildBranchPreset()
    case 'math':    return buildMathPreset()
    default:        return null
  }
}
