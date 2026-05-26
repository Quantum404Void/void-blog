// types/ai-flow.ts
// 所有 AI Flow 相关类型定义

/** 特殊 Symbol：表示该端口无数据流经过（分支未命中） */
export const NO_FLOW = Symbol('NO_FLOW')

export type ParamKind = 'number' | 'text' | 'textarea' | 'select' | 'boolean'

export interface ParamOption {
  label: string
  value: string | number | boolean
}

export interface ParamSpec {
  key: string
  label: string
  kind: ParamKind
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: ParamOption[]
}

/**
 * FlowValue — 流中流转的所有可能值类型。
 * 使用 unknown 而非 any，强制调用方做类型守卫。
 */
export type FlowValue = string | number | boolean | FlowValue[] | Record<string, FlowValue> | null | undefined

/** 节点运行上下文 */
export interface NodeRunContext {
  inputs: FlowValue[]
  params: Record<string, FlowValue>
}

/** 节点运行结果（多输出时用 outputs，单输出直接 return） */
export interface NodeRunResult {
  result?: FlowValue
  outputs?: FlowValue[]
}

export interface NodeSpec {
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
  createParams: () => Record<string, FlowValue>
  run: (ctx: NodeRunContext) => FlowValue | NodeRunResult
}

export interface FlowNode {
  id: string
  type: string
  x: number
  y: number
  params: Record<string, FlowValue>
  result?: FlowValue
  outputsData?: FlowValue[]
  error?: string
}

export interface Wire {
  id: string
  fromNode: string
  fromPort: number
  toNode: string
  toPort: number
}

export interface FlowGroup {
  id: string
  title: string
  color: string
  nodeIds: string[]
}

export interface Preset {
  key: string
  label: string
  desc: string
}
