/**
 * engine/knowledge/bazi/tenGods.ts — 十神
 *
 * 数据来源：《渊海子平·论十神》《三命通会》
 *
 * 十神是根据日主（日柱天干）与其他天干之间的五行生克关系
 * 及阴阳异同来确定的十种关系：
 *
 *   同我者为比肩、劫财（阴阳相同为比肩，相异为劫财）
 *   我生者为食神、伤官（阴阳相同为食神，相异为伤官）
 *   我克者为正财、偏财（阴阳相同为正财，相异为偏财）
 *   克我者为正官、偏官/七杀（阴阳相同为正官，相异为七杀）
 *   生我者为正印、偏印/枭神（阴阳相同为正印，相异为枭神）
 *
 * 《渊海子平》论十神生克：
 *   生我者父母（印绶），我生者子孙（食伤），
 *   克我者官鬼（官杀），我克者妻财（财星），
 *   同我者兄弟（比劫）。
 */

import type { SemanticTag } from '@/engine/types'
import { STEM_ORDER } from './stems'

/** 十神标签 */
export const TEN_GODS: SemanticTag[] = [
  {
    id: 'tenGod-zhengGuan',
    name: '正官',
    category: 'tenGod',
    attributes: { relation: '克我', yinYang: '异', nature: '吉' },
    description: '克我而阴阳相异。主官禄、地位、约束、正直。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-qiSha',
    name: '七杀',
    category: 'tenGod',
    attributes: { relation: '克我', yinYang: '同', nature: '凶' },
    description: '克我而阴阳相同。又名偏官。主权威、竞争、压力、果敢。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-zhengYin',
    name: '正印',
    category: 'tenGod',
    attributes: { relation: '生我', yinYang: '异', nature: '吉' },
    description: '生我而阴阳相异。主学业、文书、仁慈、庇护。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-pianYin',
    name: '枭神',
    category: 'tenGod',
    attributes: { relation: '生我', yinYang: '同', nature: '凶' },
    description: '生我而阴阳相同。又名偏印。主偏业、特殊才能、孤僻。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-zhengCai',
    name: '正财',
    category: 'tenGod',
    attributes: { relation: '我克', yinYang: '异', nature: '吉' },
    description: '我克而阴阳相异。主正业之财、妻缘、稳定收入。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-pianCai',
    name: '偏财',
    category: 'tenGod',
    attributes: { relation: '我克', yinYang: '同', nature: '中性' },
    description: '我克而阴阳相同。主横财、父缘、慷慨、人缘。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-shiShen',
    name: '食神',
    category: 'tenGod',
    attributes: { relation: '我生', yinYang: '同', nature: '吉' },
    description: '我生而阴阳相同。主口福、才华、享乐、温和。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-shangGuan',
    name: '伤官',
    category: 'tenGod',
    attributes: { relation: '我生', yinYang: '异', nature: '凶' },
    description: '我生而阴阳相异。主才华显露、叛逆、傲气、艺术。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-biJian',
    name: '比肩',
    category: 'tenGod',
    attributes: { relation: '同我', yinYang: '同', nature: '中性' },
    description: '同我而阴阳相同。主兄弟、朋友、竞争、独立。',
    source: '《渊海子平》'
  },
  {
    id: 'tenGod-jieCai',
    name: '劫财',
    category: 'tenGod',
    attributes: { relation: '同我', yinYang: '异', nature: '凶' },
    description: '同我而阴阳相异。主破耗、争夺、冲动、义气。',
    source: '《渊海子平》'
  }
]

/**
 * 五行生克关系定义
 * element: "木" → 生 "火" → 生 "土" → 生 "金" → 生 "水" → 生 "木"
 * element: "木" → 克 "土" → 克 "水" → 克 "火" → 克 "金" → 克 "木"
 */
const ELEMENT_CYCLE: Record<string, { generate: string; overcome: string }> = {
  '木': { generate: '火', overcome: '土' },
  '火': { generate: '土', overcome: '金' },
  '土': { generate: '金', overcome: '水' },
  '金': { generate: '水', overcome: '木' },
  '水': { generate: '木', overcome: '火' }
}

/**
 * 根据日主天干和另一个天干计算十神
 * @param dayMaster 日主天干名称（如 "甲"）
 * @param otherStem 另一天干名称（如 "丙"）
 * @returns 十神 ID，如 "tenGod-shiShen"
 */
export function determineTenGod(dayMaster: string, otherStem: string): string {
  const HEAVENLY_STEMS_DATA: { name: string; element: string; yinYang: string }[] = [
    { name: '甲', element: '木', yinYang: '阳' },
    { name: '乙', element: '木', yinYang: '阴' },
    { name: '丙', element: '火', yinYang: '阳' },
    { name: '丁', element: '火', yinYang: '阴' },
    { name: '戊', element: '土', yinYang: '阳' },
    { name: '己', element: '土', yinYang: '阴' },
    { name: '庚', element: '金', yinYang: '阳' },
    { name: '辛', element: '金', yinYang: '阴' },
    { name: '壬', element: '水', yinYang: '阳' },
    { name: '癸', element: '水', yinYang: '阴' }
  ]

  const dm = HEAVENLY_STEMS_DATA.find((s) => s.name === dayMaster)
  const os = HEAVENLY_STEMS_DATA.find((s) => s.name === otherStem)
  if (!dm || !os) return ''

  const sameYinYang = dm.yinYang === os.yinYang

  // 同我者：比肩（阴阳同）/ 劫财（阴阳异）
  if (dm.element === os.element) {
    return sameYinYang ? 'tenGod-biJian' : 'tenGod-jieCai'
  }

  // 我生者：食神（阴阳同）/ 伤官（阴阳异）
  if (ELEMENT_CYCLE[dm.element].generate === os.element) {
    return sameYinYang ? 'tenGod-shiShen' : 'tenGod-shangGuan'
  }

  // 我克者：偏财（阴阳同）/ 正财（阴阳异）
  if (ELEMENT_CYCLE[dm.element].overcome === os.element) {
    return sameYinYang ? 'tenGod-pianCai' : 'tenGod-zhengCai'
  }

  // 克我者：七杀（阴阳同）/ 正官（阴阳异）
  if (ELEMENT_CYCLE[os.element].overcome === dm.element) {
    return sameYinYang ? 'tenGod-qiSha' : 'tenGod-zhengGuan'
  }

  // 生我者：枭神（阴阳同）/ 正印（阴阳异）
  if (ELEMENT_CYCLE[os.element].generate === dm.element) {
    return sameYinYang ? 'tenGod-pianYin' : 'tenGod-zhengYin'
  }

  return ''
}

/** 根据日柱天干获取四柱的十神标签 */
export function getTenGodsForPillars(
  dayStem: string,
  yearStem: string,
  monthStem: string,
  hourStem: string
): { year: string; month: string; day: string; hour: string } {
  return {
    year: determineTenGod(dayStem, yearStem),
    month: determineTenGod(dayStem, monthStem),
    day: 'tenGod-biJian', // 日柱天干对自身永远是比肩
    hour: determineTenGod(dayStem, hourStem)
  }
}
