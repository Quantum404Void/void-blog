/**
 * engine/knowledge/meihua/index.ts — 梅花易数
 *
 * 数据来源：《梅花易数》(宋·邵雍)
 * 以年月日时或随机数字起卦，得本卦、互卦、变卦。
 * 八卦配数：1乾 2兑 3离 4震 5巽 6坎 7艮 8坤
 */

import { createEmptyMatrix } from '@/engine/types'
import { TRIGRAMS, HEXAGRAMS } from '@/engine/knowledge/iching'
import type { SymbolMatrix } from '@/engine/types'

/** 数字→八卦映射 */
const NUM_TO_TRIGRAM = [
  '乾', '兑', '离', '震', '巽', '坎', '艮', '坤'
]

/**
 * 梅花易数起卦（年月日时法）
 * 上卦=(年+月+日)%8, 下卦=(年+月+日+时)%8, 动爻=(年+月+日+时)%6
 */
export function meihuaByDateTime(year: number, month: number, day: number, hour: number): SymbolMatrix {
  const sum1 = year + month + day
  const sum2 = year + month + day + hour
  return meihuaCast(sum1 % 8, sum2 % 8, sum2 % 6)
}

/**
 * 梅花易数起卦（三数法）
 */
export function meihuaByNumbers(n1: number, n2: number, n3: number): SymbolMatrix {
  return meihuaCast(n1 % 8, n2 % 8, n3 % 6)
}

/**
 * 核心起卦逻辑
 * @param upperIdx 上卦索引 (0-7)
 * @param lowerIdx 下卦索引 (0-7)
 * @param changingYao 动爻 (0-5, 0=初爻)
 */
function meihuaCast(upperIdx: number, lowerIdx: number, changingYao: number): SymbolMatrix {
  if (upperIdx === 0) upperIdx = 8; if (lowerIdx === 0) lowerIdx = 8
  const upperIdx0 = upperIdx - 1
  const lowerIdx0 = lowerIdx - 1
  const upperNum = upperIdx
  const lowerNum = lowerIdx
  const yaoNum = changingYao === 0 ? 6 : changingYao

  const upperName = NUM_TO_TRIGRAM[upperIdx0]
  const lowerName = NUM_TO_TRIGRAM[lowerIdx0]
  if (!upperName || !lowerName) throw new Error(`无效卦数：上${upperNum} 下${lowerNum}`)

  const matrix = createEmptyMatrix('meihua', `上${upperNum}(${upperName}) 下${lowerNum}(${lowerName}) 动爻${yaoNum}`)

  // 本卦
  const benGua = HEXAGRAMS.find(h => h.upperTrigram === upperName && h.lowerTrigram === lowerName)
  if (benGua) {
    matrix.symbols.push({ id: `hexagram-${benGua.number}`, name: benGua.name, category: 'hexagram', position: '本卦', attributes: { number: String(benGua.number) } })
    matrix.interpretations.push({ id: `meihua-ben-${benGua.number}`, ruleId: 'meihua-ben', category: 'general', text: `本卦·${benGua.name}：${benGua.judgement}\n象曰：${benGua.image}`, tone: 'neutral', source: '《周易》', weight: 85 })
  }

  // 变卦：只翻转实际动爻，而不是替换整个三爻卦。
  const yaoInUpper = yaoNum > 3  // 动爻在上卦
  const yaoIndex = (yaoNum - 1) % 3
  const changedUpper = yaoInUpper ? getChangedTrigram(upperName, yaoIndex) : upperName
  const changedLower = !yaoInUpper ? getChangedTrigram(lowerName, yaoIndex) : lowerName
  const bianGua = HEXAGRAMS.find(h => h.upperTrigram === changedUpper && h.lowerTrigram === changedLower)
  if (bianGua && bianGua.number !== benGua?.number) {
    matrix.symbols.push({ id: `hexagram-${bianGua.number}`, name: bianGua.name, category: 'hexagram', position: '变卦', attributes: { number: String(bianGua.number) } })
    matrix.interpretations.push({ id: `meihua-bian-${bianGua.number}`, ruleId: 'meihua-bian', category: 'general', text: `变卦·${bianGua.name}：${bianGua.judgement}\n象曰：${bianGua.image}`, tone: 'neutral', source: '《周易》', weight: 80 })
  }

  // 互卦：本卦二三四爻为下卦，三四五爻为上卦。
  const lowerSeq = getYaoSequence(lowerName)
  const upperSeq = getYaoSequence(upperName)
  const fullSeq = `${lowerSeq}${upperSeq}`
  const huLower = getTrigramBySequence(fullSeq.slice(1, 4))
  const huUpper = getTrigramBySequence(fullSeq.slice(2, 5))
  const huGua = HEXAGRAMS.find(h => h.upperTrigram === huUpper && h.lowerTrigram === huLower)
  if (huGua && huGua.number !== benGua?.number) {
    matrix.symbols.push({ id: `hexagram-${huGua.number}`, name: huGua.name, category: 'hexagram', position: '互卦', attributes: { number: String(huGua.number) } })
    matrix.interpretations.push({ id: `meihua-hu-${huGua.number}`, ruleId: 'meihua-hu', category: 'general', text: `互卦·${huGua.name}：${huGua.judgement}`, tone: 'neutral', source: '《周易》', weight: 65 })
  }

  // 体用生克
  const tiGua = yaoInUpper ? lowerName : upperName
  const yongGua = yaoInUpper ? changedUpper : changedLower
  const tiElement = TRIGRAMS.find(t => t.name === tiGua)?.attributes.element ?? '土'
  const yongElement = TRIGRAMS.find(t => t.name === yongGua)?.attributes.element ?? '土'
  const shengKe = getShengKe(tiElement, yongElement)
  matrix.interpretations.push({ id: 'meihua-tiyong', ruleId: 'meihua-tiyong', category: 'general', text: `体卦${tiGua}(${tiElement}) 用卦${yongGua}(${yongElement})：${shengKe}`, tone: 'neutral', source: '《梅花易数》', weight: 90 })

  return matrix
}

/** 找变卦（阴阳爻互换） */
function getYaoSequence(trigram: string): string {
  return TRIGRAMS.find((item) => item.name === trigram)?.attributes.yaoSeq ?? '000'
}

function getTrigramBySequence(sequence: string): string {
  return TRIGRAMS.find((item) => item.attributes.yaoSeq === sequence)?.name ?? '坤'
}

function getChangedTrigram(trigram: string, yaoIndex: number): string {
  const sequence = getYaoSequence(trigram).split('')
  sequence[yaoIndex] = sequence[yaoIndex] === '1' ? '0' : '1'
  return getTrigramBySequence(sequence.join(''))
}

/** 五行生克 */
function getShengKe(ti: string, yong: string): string {
  const cycle: Record<string, { sheng: string; ke: string }> = {
    '木': { sheng: '火', ke: '土' }, '火': { sheng: '土', ke: '金' },
    '土': { sheng: '金', ke: '水' }, '金': { sheng: '水', ke: '木' },
    '水': { sheng: '木', ke: '火' }
  }
  if (ti === yong) return '体用比和，主吉。'
  if (cycle[ti]?.sheng === yong) return '体生用，泄气，小凶。'
  if (cycle[ti]?.ke === yong) return '体克用，费力可成，中吉。'
  if (cycle[yong]?.sheng === ti) return '用生体，大吉，得外来之助。'
  if (cycle[yong]?.ke === ti) return '用克体，大凶，主外来之患。'
  return '体用关系中立。'
}
