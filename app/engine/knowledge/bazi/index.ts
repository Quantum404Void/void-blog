/**
 * engine/knowledge/bazi/index.ts — 八字知识库
 *
 * 整合 L0 基础符号（天干地支）、L1 语义派生（十神、十二长生、纳音、神煞）
 * 和 L2 规则断语，注册到统一规则引擎。
 */

import { RuleMatcher } from '@/engine/core/RuleMatcher'
import { createEmptyMatrix } from '@/engine/types'
import { calculateBazi, baziResultToTags, HOUR_OPTIONS } from './calculator'
import { BAZI_RULES } from './rules'

import type { BaziInput, KnowledgeBase } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

/** 独立规则匹配器实例 */
const baziMatcher = new RuleMatcher(BAZI_RULES)

/**
 * 八字排盘 → SymbolMatrix（完整三层架构输出）
 */
export function computeBaziMatrix(input: BaziInput): SymbolMatrix {
  const result = calculateBazi(input)
  const tags = baziResultToTags(result, input)
  const { interpretations } = baziMatcher.match(tags)

  const genderLabel = input.gender === 'male' ? '男' : '女'
  const inputSummary = `${input.year}年${input.month}月${input.day}日 ${genderLabel}`

  const matrix = createEmptyMatrix('bazi', inputSummary)

  // L0: 基础符号（天干地支）
  const pillars = [
    { key: 'year', name: '年柱' },
    { key: 'month', name: '月柱' },
    { key: 'day', name: '日柱' },
    { key: 'hour', name: '时柱' },
  ] as const

  for (const { key, name } of pillars) {
    const { stem, branch } = result.pillars[key]
    matrix.symbols.push({
      id: `stem-${stem.toLowerCase()}`,
      name: stem,
      category: 'stem',
      position: `${name}/天干`,
      attributes: { pillar: key }
    })
    matrix.symbols.push({
      id: `branch-${branch}`,
      name: branch,
      category: 'branch',
      position: `${name}/地支`,
      attributes: { pillar: key }
    })
  }

  // L1: 语义派生标签
  for (const tag of tags) {
    matrix.derivedTags.push({
      id: tag.id,
      name: tag.name,
      category: tag.category,
      position: tag.attributes.pillar || '',
      derivedFrom: [],
      attributes: tag.attributes
    })
  }

  // L2: 断语
  for (const interp of interpretations) {
    matrix.interpretations.push({
      id: interp.id,
      ruleId: '',
      category: interp.category as 'general' | 'career' | 'wealth' | 'love' | 'health' | 'family' | 'study' | 'travel' | 'fortune',
      text: interp.text,
      tone: interp.tone === 'negative' || interp.tone === 'warning' ? 'reminder' : interp.tone,
      source: interp.source,
      weight: interp.weight
    })
  }

  return matrix
}

/** 八字知识库定义 */
export const baziKnowledgeBase: KnowledgeBase = {
  system: {
    id: 'bazi',
    name: '八字命理',
    version: '1.0.0',
    description: '八字命理排盘与解读 — 渊海子平、三命通会、滴天髓等古籍'
  },
  tags: [],
  rules: BAZI_RULES,
  compute: (input) => baziResultToTags(calculateBazi(input as BaziInput), input as BaziInput)
}

export { calculateBazi, baziResultToTags, HOUR_OPTIONS }
export { HEAVENLY_STEMS, STEM_ORDER } from './stems'
export { EARTHLY_BRANCHES, BRANCH_ORDER } from './branches'
export { TEN_GODS, determineTenGod } from './tenGods'
export { TWELVE_STAGES, getTwelveStage } from './twelveStages'
export { NAYIN_TAGS, getNayin } from './nayin'
export { SHENSHA_TAGS, checkShensha } from './shensha'
export { BAZI_RULES } from './rules'
export type { BaziPillars, BaziResult } from './calculator'
