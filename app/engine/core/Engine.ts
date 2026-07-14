/**
 * engine/core/Engine.ts — 统一规则引擎
 *
 * 加载知识库，接收输入，计算语义标签，匹配规则，产生断语。
 */

import { RuleMatcher } from './RuleMatcher'

import type { KnowledgeBase, OracleResult } from '../types'

export class OracleEngine {
  private knowledgeBases = new Map<string, KnowledgeBase>()
  private matchers = new Map<string, RuleMatcher>()

  register(kb: KnowledgeBase): void {
    this.knowledgeBases.set(kb.system.id, kb)
    this.matchers.set(kb.system.id, new RuleMatcher(kb.rules))
  }

  getSystems(): { id: string; name: string; description: string }[] {
    return [...this.knowledgeBases.values()].map((kb) => ({
      id: kb.system.id,
      name: kb.system.name,
      description: kb.system.description
    }))
  }

  getMatcher(systemId: string): RuleMatcher | undefined {
    return this.matchers.get(systemId)
  }

  query(systemId: string, input: unknown): OracleResult | null {
    const kb = this.knowledgeBases.get(systemId)
    if (!kb) return null

    const matcher = this.matchers.get(systemId)
    if (!matcher) return null

    const tags = kb.compute(input)
    const { matchedRules, interpretations } = matcher.match(tags)

    return {
      systemId,
      input,
      tags,
      matchedRules: matchedRules.map((r) => r.id),
      interpretations,
      timestamp: Date.now()
    }
  }

  computeTags(systemId: string, input: unknown): OracleResult | null {
    const kb = this.knowledgeBases.get(systemId)
    if (!kb) return null

    const tags = kb.compute(input)

    return {
      systemId,
      input,
      tags,
      matchedRules: [],
      interpretations: [],
      timestamp: Date.now()
    }
  }
}

export const engine = new OracleEngine()
