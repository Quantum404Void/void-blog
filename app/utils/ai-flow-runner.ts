// utils/ai-flow-runner.ts
// 纯函数运行器：接收 nodes/wires，返回执行结果，无副作用

import { NO_FLOW, normalizeRunResult, formatLogValue, NODE_SPECS } from '~/utils/ai-flow'
import type { FlowNode, Wire } from '~/types/ai-flow'

export interface NodeExecutionResult {
  result: unknown
  outputsData: unknown[]
  error: string
}

export interface RunResult {
  nodeResults: Map<string, NodeExecutionResult>
  log: string[]
  summary: string
  globalError: string
}

export function runGraph(nodes: FlowNode[], wires: Wire[]): RunResult {
  const log: string[] = []
  let globalError = ''
  const nodeResults = new Map<string, NodeExecutionResult>()

  // init
  for (const node of nodes) {
    nodeResults.set(node.id, { result: undefined, outputsData: [], error: '' })
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]))
  const incoming = new Map<string, Wire[]>()
  const outgoing = new Map<string, Wire[]>()
  const indegree = new Map<string, number>()

  for (const node of nodes) {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
    indegree.set(node.id, 0)
  }

  for (const wire of wires) {
    if (!nodeMap.has(wire.fromNode) || !nodeMap.has(wire.toNode)) continue
    incoming.get(wire.toNode)!.push(wire)
    outgoing.get(wire.fromNode)!.push(wire)
    indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) + 1)
  }

  const queue = nodes.filter(n => (indegree.get(n.id) ?? 0) === 0).map(n => n.id)
  const order: string[] = []

  while (queue.length) {
    const id = queue.shift()!
    order.push(id)
    for (const wire of outgoing.get(id) ?? []) {
      indegree.set(wire.toNode, (indegree.get(wire.toNode) ?? 0) - 1)
      if ((indegree.get(wire.toNode) ?? 0) === 0) queue.push(wire.toNode)
    }
  }

  if (order.length !== nodes.length) {
    globalError = '图里存在环，当前执行器只支持 DAG（无环图）'
    return { nodeResults, log, summary: '执行失败：检测到循环依赖', globalError }
  }

  for (const nodeId of order) {
    const node = nodeMap.get(nodeId)!
    const spec = NODE_SPECS[node.type]
    const inWires = [...(incoming.get(node.id) ?? [])].sort((a, b) => a.toPort - b.toPort)
    const inputs: unknown[] = Array.from({ length: spec.inputs }, () => undefined)
    const linkedPorts = new Set(inWires.map(w => w.toPort))
    const res = nodeResults.get(nodeId)!

    if (spec.inputs > 0 && Array.from({ length: spec.inputs }, (_, i) => i).some(i => !linkedPorts.has(i))) {
      res.error = '输入未连完整'
      res.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      log.push(`✗ ${spec.title}: 输入未连完整`)
      continue
    }

    for (const wire of inWires) {
      const srcResult = nodeResults.get(wire.fromNode)
      const srcValue = srcResult?.outputsData?.[wire.fromPort]
      inputs[wire.toPort] = (srcValue === undefined || srcValue === null) ? srcResult?.result : srcValue
    }

    if (inputs.includes(NO_FLOW)) {
      res.result = '⏭ skipped'
      res.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      log.push(`↷ ${spec.title}: skipped (no flow)`)
      continue
    }

    if (spec.inputs > 0 && inputs.some(v => v === undefined)) {
      res.error = '上游结果缺失'
      res.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      log.push(`✗ ${spec.title}: 上游结果缺失`)
      continue
    }

    try {
      const normalized = normalizeRunResult(spec.run({ inputs, params: node.params }), spec.outputs)
      res.result = normalized.result
      res.outputsData = normalized.outputs
      log.push(`✓ ${spec.title}: ${formatLogValue(normalized.result)}`)
    } catch (error: unknown) {
      res.error = error instanceof Error ? error.message : '运行失败'
      res.outputsData = Array.from({ length: spec.outputs }, () => NO_FLOW)
      log.push(`✗ ${spec.title}: ${res.error}`)
    }
  }

  const ok = nodes.filter(n => !nodeResults.get(n.id)?.error).length
  return {
    nodeResults,
    log,
    summary: `执行完成：${ok}/${nodes.length} 节点可用`,
    globalError,
  }
}
