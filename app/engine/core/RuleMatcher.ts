/**
 * engine/core/RuleMatcher.ts — 规则匹配器
 *
 * 根据已计算的语义标签集合，匹配并触发规则，收集断语。
 */

import type {
  Interpretation,
  OracleRule,
  RuleCondition,
  SemanticTag
} from '../types'

/** 单条规则匹配结果 */
interface RuleMatch {
  rule: OracleRule
  score: number // 匹配得分 (0-100)
  matchedTags: string[] // 实际匹配的标签
}

/**
 * 检查标签集合是否满足单个条件
 */
function matchCondition(tagIds: Set<string>, condition: RuleCondition): RuleMatch | null {
  switch (condition.type) {
    case 'tagMatch': {
      // 所有必选标签必须存在
      const allRequired = condition.tags.every((t) => tagIds.has(t))
      if (!allRequired) return null

      // 排除标签不能存在
      if (condition.exclude) {
        const hasExcluded = condition.exclude.some((t) => tagIds.has(t))
        if (hasExcluded) return null
      }

      // 计算匹配得分
      let score = 50 // 基础分
      const matchedTags = [...condition.tags]

      // 可选标签加分
      if (condition.optional) {
        for (const opt of condition.optional) {
          if (tagIds.has(opt)) {
            score += 15
            matchedTags.push(opt)
          }
        }
      }

      return { rule: null as unknown as OracleRule, score, matchedTags }
    }

    case 'combination': {
      // 至少一个必选标签存在
      const anyRequired = condition.tags.some((t) => tagIds.has(t))
      if (!anyRequired) return null

      let score = 40
      const matchedTags: string[] = []

      for (const t of condition.tags) {
        if (tagIds.has(t)) {
          score += 15
          matchedTags.push(t)
        }
      }

      return { rule: null as unknown as OracleRule, score, matchedTags }
    }

    case 'conflict': {
      // 冲突检测：tags 中至少有两个同时存在
      const present = condition.tags.filter((t) => tagIds.has(t))
      if (present.length < 2) return null

      let score = 30 + present.length * 15
      return { rule: null as unknown as OracleRule, score, matchedTags: present }
    }

    case 'position': {
      // 位置匹配：按顺序检查标签
      let score = 50
      const matchedTags: string[] = []

      for (const t of condition.tags) {
        if (tagIds.has(t)) {
          score += 15
          matchedTags.push(t)
        } else {
          score -= 10
        }
      }

      if (matchedTags.length === 0) return null
      return { rule: null as unknown as OracleRule, score, matchedTags }
    }

    default:
      return null
  }
}

/**
 * 规则匹配器
 */
export class RuleMatcher {
  private rules: OracleRule[]

  constructor(rules: OracleRule[]) {
    this.rules = rules
  }

  /**
   * 匹配所有规则，返回所有匹配的规则（按得分排序）
   */
  match(tags: SemanticTag[]): { matchedRules: OracleRule[]; interpretations: Interpretation[] } {
    const tagIds = new Set(tags.map((t) => t.id))
    const matches: { rule: OracleRule; score: number }[] = []

    for (const rule of this.rules) {
      const match = matchCondition(tagIds, rule.condition)
      if (match) {
        matches.push({ rule, score: match.score + rule.priority })
      }
    }

    // 按总分降序排列
    matches.sort((a, b) => b.score - a.score)

    // 收集断语，去重 (按 id)，限制每个分类最多 3 条
    const seenIds = new Set<string>()
    const categoryCounts = new Map<string, number>()
    const interpretations: Interpretation[] = []

    const matchedRules = matches.map((m) => m.rule)

    for (const { rule } of matches) {
      for (const interp of rule.interpretations) {
        if (seenIds.has(interp.id)) continue

        const catCount = categoryCounts.get(interp.category) ?? 0
        if (catCount >= 3) continue // 每分类最多 3 条

        seenIds.add(interp.id)
        categoryCounts.set(interp.category, catCount + 1)
        interpretations.push(interp)
      }
    }

    return { matchedRules, interpretations }
  }
}
