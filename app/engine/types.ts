/**
 * engine/types.ts — 规则引擎统一类型定义
 * 所有类型集中于此，无向后兼容层。
 */

// ═══ L0: 语义标签 ═══

export interface SemanticTag {
  id: string
  name: string
  category: string
  attributes: Record<string, string>
  description?: string
  source?: string
}

// ═══ 规则系统 ═══

export type ConditionType = 'tagMatch' | 'combination' | 'conflict' | 'position'

export interface RuleCondition {
  type: ConditionType
  tags: string[]
  optional?: string[]
  exclude?: string[]
}

export interface Interpretation {
  id: string
  text: string
  category: 'general' | 'career' | 'wealth' | 'love' | 'health' | 'family' | 'study' | 'travel'
  tone: 'positive' | 'neutral' | 'negative' | 'warning'
  source?: string
  modernNote?: string
  weight: number
}

export interface OracleRule {
  id: string
  systemId: string
  name: string
  condition: RuleCondition
  interpretations: Interpretation[]
  priority: number
}

// ═══ 输入/输出 ═══

export interface BaziInput {
  year: number
  month: number
  day: number
  hour: number
  gender: 'male' | 'female'
}

export interface TarotInput {
  spreadType: 'single' | 'three' | 'celtic'
  cards: TarotCardDraw[]
}

export interface TarotCardDraw {
  cardId: string
  reversed: boolean
  position: string
}

export interface OracleResult {
  systemId: string
  input: unknown
  tags: SemanticTag[]
  matchedRules: string[]
  interpretations: Interpretation[]
  timestamp: number
}

// ═══ 知识库 ═══

export interface OracleSystem {
  id: string
  name: string
  version: string
  description: string
}

export interface KnowledgeBase {
  system: OracleSystem
  tags: SemanticTag[]
  rules: OracleRule[]
  compute: (input: unknown) => SemanticTag[]
}

// ═══ SymbolMatrix (L0/L1/L2 三层架构) ═══

export interface MatrixSymbol {
  id: string
  name: string
  category: string
  position: string
  attributes: Record<string, string>
}

export interface DerivedTag {
  id: string
  name: string
  category: string
  position: string
  derivedFrom: string[]
  attributes: Record<string, string>
}

export interface OracleInterpretation {
  id: string
  ruleId: string
  category: 'general' | 'career' | 'wealth' | 'love' | 'health' | 'family' | 'study' | 'travel' | 'fortune'
  text: string
  tone: 'positive' | 'neutral' | 'reminder'
  source?: string
  modernNote?: string
  weight: number
}

export interface SymbolMatrix {
  systemId: string
  timestamp: number
  inputSummary: string
  symbols: MatrixSymbol[]
  derivedTags: DerivedTag[]
  interpretations: OracleInterpretation[]
  metadata: {
    seed?: number
    calculatorVersion: string
    knowledgeVersion: string
  }
}

export function createEmptyMatrix(systemId: string, inputSummary: string): SymbolMatrix {
  return {
    systemId, timestamp: Date.now(), inputSummary,
    symbols: [], derivedTags: [], interpretations: [],
    metadata: { calculatorVersion: '1.0.0', knowledgeVersion: '1.0.0' }
  }
}
