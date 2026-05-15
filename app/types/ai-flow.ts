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

export interface NodeRunResult {
  result?: any
  outputs?: any[]
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
  createParams: () => Record<string, any>
  run: (ctx: { inputs: any[]; params: Record<string, any> }) => any | NodeRunResult
}

export interface FlowNode {
  id: string
  type: string
  x: number
  y: number
  params: Record<string, any>
  result?: any
  outputsData?: any[]
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
