/**
 * engine/knowledge/bazi/twelveStages.ts — 十二长生
 *
 * 数据来源：《三命通会·论十二长生》
 *
 * 十二长生描述天干在地支上的十二种旺衰状态，
 * 以"长生"为起点，阳干顺行、阴干逆行：
 *
 *   长生 → 沐浴 → 冠带 → 临官 → 帝旺 → 衰 → 病 → 死 → 墓 → 绝 → 胎 → 养
 *
 * 《三命通会》：
 *   五行之在十二宫，各有长生、沐浴、冠带、临官、帝旺、
 *   衰、病、死、墓、绝、胎、养之位。
 *
 * 阳干长生位（顺排）：
 *   甲木长生在亥、丙火长生在寅、戊土长生在寅、
 *   庚金长生在巳、壬水长生在申。
 *
 * 阴干长生位（逆排）：
 *   乙木长生在午、丁火长生在酉、己土长生在酉、
 *   辛金长生在子、癸水长生在卯。
 */

import type { SemanticTag } from '@/engine/types'
import { BRANCH_ORDER } from './branches'

/** 十二长生标签 */
export const TWELVE_STAGES: SemanticTag[] = [
  {
    id: 'stage-changSheng',
    name: '长生',
    category: 'twelveStage',
    attributes: { index: '0', nature: '吉', meaning: '初生' },
    description: '万物初生，如人之初生。充满活力与希望。',
    source: '《三命通会》'
  },
  {
    id: 'stage-muYu',
    name: '沐浴',
    category: 'twelveStage',
    attributes: { index: '1', nature: '凶', meaning: '败地' },
    description: '又名败地，如婴儿洗浴。桃花之位，易生风波。',
    source: '《三命通会》'
  },
  {
    id: 'stage-guanDai',
    name: '冠带',
    category: 'twelveStage',
    attributes: { index: '2', nature: '中性', meaning: '成长' },
    description: '如人渐长，着冠束带。学业有成，日渐成熟。',
    source: '《三命通会》'
  },
  {
    id: 'stage-linGuan',
    name: '临官',
    category: 'twelveStage',
    attributes: { index: '3', nature: '吉', meaning: '仕进' },
    description: '又名建禄。如人出仕为官，事业有成。',
    source: '《三命通会》'
  },
  {
    id: 'stage-diWang',
    name: '帝旺',
    category: 'twelveStage',
    attributes: { index: '4', nature: '中性', meaning: '极盛' },
    description: '如帝王之盛。旺极则衰，物极必反。',
    source: '《三命通会》'
  },
  {
    id: 'stage-shuai',
    name: '衰',
    category: 'twelveStage',
    attributes: { index: '5', nature: '中性', meaning: '衰退' },
    description: '盛极而衰。宜守不宜攻。',
    source: '《三命通会》'
  },
  {
    id: 'stage-bing',
    name: '病',
    category: 'twelveStage',
    attributes: { index: '6', nature: '凶', meaning: '疾病' },
    description: '如人之病。诸事不顺，宜休养。',
    source: '《三命通会》'
  },
  {
    id: 'stage-si',
    name: '死',
    category: 'twelveStage',
    attributes: { index: '7', nature: '凶', meaning: '死亡' },
    description: '如人之死。生机断绝，需待转运。',
    source: '《三命通会》'
  },
  {
    id: 'stage-mu',
    name: '墓',
    category: 'twelveStage',
    attributes: { index: '8', nature: '中性', meaning: '收藏' },
    description: '又名库。如人入墓，收藏内敛。财入库则富。',
    source: '《三命通会》'
  },
  {
    id: 'stage-jue',
    name: '绝',
    category: 'twelveStage',
    attributes: { index: '9', nature: '凶', meaning: '灭绝' },
    description: '气绝而后生。旧事已了，新机将萌。',
    source: '《三命通会》'
  },
  {
    id: 'stage-tai',
    name: '胎',
    category: 'twelveStage',
    attributes: { index: '10', nature: '中性', meaning: '怀胎' },
    description: '如人之受胎。新机初萌，宜静待。',
    source: '《三命通会》'
  },
  {
    id: 'stage-yang',
    name: '养',
    category: 'twelveStage',
    attributes: { index: '11', nature: '吉', meaning: '养育' },
    description: '如人在养。滋养成长，渐入佳境。',
    source: '《三命通会》'
  }
]

/**
 * 阳干长生起点地支:
 *   甲→亥, 丙→寅, 戊→寅, 庚→巳, 壬→申
 * 阴干长生起点地支:
 *   乙→午, 丁→酉, 己→酉, 辛→子, 癸→卯
 *
 * 阳干顺行(地支顺序)，阴干逆行(地支逆序)
 */
const STEM_CHANG_SHENG_MAP: Record<string, { startBranch: string; forward: boolean }> = {
  '甲': { startBranch: '亥', forward: true },
  '乙': { startBranch: '午', forward: false },
  '丙': { startBranch: '寅', forward: true },
  '丁': { startBranch: '酉', forward: false },
  '戊': { startBranch: '寅', forward: true },
  '己': { startBranch: '酉', forward: false },
  '庚': { startBranch: '巳', forward: true },
  '辛': { startBranch: '子', forward: false },
  '壬': { startBranch: '申', forward: true },
  '癸': { startBranch: '卯', forward: false }
}

/**
 * 获取天干在某地支上的十二长生状态
 * @returns 十二长生阶段 ID
 */
export function getTwelveStage(stem: string, branch: string): string {
  const stageIds = TWELVE_STAGES.map((s) => s.id)

  const config = STEM_CHANG_SHENG_MAP[stem]
  if (!config) return ''

  const startIdx = BRANCH_ORDER.indexOf(config.startBranch)
  const branchIdx = BRANCH_ORDER.indexOf(branch)
  if (startIdx === -1 || branchIdx === -1) return ''

  let offset: number
  if (config.forward) {
    // 阳干顺行
    offset = (branchIdx - startIdx + 12) % 12
  } else {
    // 阴干逆行
    offset = (startIdx - branchIdx + 12) % 12
  }

  return stageIds[offset] ?? ''
}
