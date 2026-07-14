/**
 * engine/knowledge/liuyao/index.ts — 六爻纳甲（京房易）
 *
 * 数据来源：《京氏易传》(汉·京房)、《卜筮正宗》(清·王洪绪)
 * 以三枚铜钱掷六次成卦，配合纳甲装卦。
 */

import { createEmptyMatrix } from '@/engine/types'
import { HEXAGRAMS, TRIGRAMS } from '@/engine/knowledge/iching'
import type { SymbolMatrix } from '@/engine/types'

/** 八卦纳甲配干支 */
const NAJIA: Record<string, string[]> = {
  '乾': ['甲子','甲寅','甲辰','壬午','壬申','壬戌'],
  '坤': ['乙未','乙巳','乙卯','癸丑','癸亥','癸酉'],
  '震': ['庚子','庚寅','庚辰','庚午','庚申','庚戌'],
  '巽': ['辛丑','辛亥','辛酉','辛未','辛巳','辛卯'],
  '坎': ['戊寅','戊辰','戊午','戊申','戊戌','戊子'],
  '离': ['己卯','己丑','己亥','己酉','己未','己巳'],
  '艮': ['丙辰','丙午','丙申','丙戌','丙子','丙寅'],
  '兑': ['丁巳','丁卯','丁丑','丁亥','丁酉','丁未']
}

/** 爻象名称：6=老阴⚋, 7=少阳⚊, 8=少阴⚋, 9=老阳⚊ */
function yaoName(v: number): string {
  if (v === 6) return '老阴 ⚋⚋'
  if (v === 7) return '少阳 ⚊'
  if (v === 8) return '少阴 ⚋'
  if (v === 9) return '老阳 ⚊⚊'
  return String(v)
}

function yaoIsYang(v: number): boolean { return v === 7 || v === 9 }
function yaoChanges(v: number): boolean { return v === 6 || v === 9 }

/**
 * 掷铜钱一次，三枚铜钱正反面
 * 三正=老阳9, 两正一反=少阳7, 一正两反=少阴8, 三反=老阴6
 */
function tossCoin(rand: () => number): number {
  const heads = (rand() > 0.5 ? 1 : 0) + (rand() > 0.5 ? 1 : 0) + (rand() > 0.5 ? 1 : 0)
  if (heads === 3) return 9
  if (heads === 2) return 7
  if (heads === 1) return 8
  return 6
}

/**
 * 六爻起卦 → SymbolMatrix
 */
export function liuyaoCast(seed?: number): SymbolMatrix {
  const seedVal = seed ?? Date.now()
  let s = seedVal
  const rand = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }

  // 掷六次（初爻到上爻）
  const yaoValues: number[] = []
  for (let i = 0; i < 6; i++) yaoValues.push(tossCoin(rand))

  const matrix = createEmptyMatrix('liuyao', `六爻起卦: ${seedVal}`)
  matrix.metadata.seed = seedVal

  // 构建本卦的上卦和下卦
  const lowerYangs = yaoValues.slice(0, 3).map(v => yaoIsYang(v) ? '1' : '0').join('')
  const upperYangs = yaoValues.slice(3, 6).map(v => yaoIsYang(v) ? '1' : '0').join('')
  const lowerTrigram = findTrigram(lowerYangs)
  const upperTrigram = findTrigram(upperYangs)

  // 变卦
  const changedLower = yaoValues.slice(0, 3).map(v => yaoChanges(v) ? (yaoIsYang(v) ? '0' : '1') : (yaoIsYang(v) ? '1' : '0')).join('')
  const changedUpper = yaoValues.slice(3, 6).map(v => yaoChanges(v) ? (yaoIsYang(v) ? '0' : '1') : (yaoIsYang(v) ? '1' : '0')).join('')
  const changedLowerName = findTrigram(changedLower)
  const changedUpperName = findTrigram(changedUpper)

  // 爻象
  const yaoNames = ['初爻','二爻','三爻','四爻','五爻','上爻']
  for (let i = 0; i < 6; i++) {
    matrix.symbols.push({ id: `yao-${i}`, name: yaoNames[i], category: 'yao', position: yaoNames[i], attributes: { value: String(yaoValues[i]), name: yaoName(yaoValues[i]), changing: String(yaoChanges(yaoValues[i])) } })
  }

  // 本卦
  const benGua = HEXAGRAMS.find(h => h.upperTrigram === upperTrigram && h.lowerTrigram === lowerTrigram)
  if (benGua) {
    matrix.symbols.push({ id: `hexagram-${benGua.number}`, name: benGua.name, category: 'hexagram', position: '本卦', attributes: { number: String(benGua.number) } })
    matrix.interpretations.push({ id: `ly-ben-${benGua.number}`, ruleId: 'liuyao-ben', category: 'general', text: `本卦·${benGua.name}：${benGua.judgement}\n象曰：${benGua.image}`, tone: 'neutral', source: '《周易》', weight: 85 })
  }

  // 变卦
  const bianGua = HEXAGRAMS.find(h => h.upperTrigram === changedUpperName && h.lowerTrigram === changedLowerName)
  if (bianGua && bianGua.number !== benGua?.number) {
    matrix.symbols.push({ id: `hexagram-${bianGua.number}`, name: bianGua.name, category: 'hexagram', position: '变卦', attributes: { number: String(bianGua.number) } })
    matrix.interpretations.push({ id: `ly-bian-${bianGua.number}`, ruleId: 'liuyao-bian', category: 'general', text: `变卦·${bianGua.name}：${bianGua.judgement}`, tone: 'neutral', source: '《周易》', weight: 75 })
  }

  // 纳甲（本卦初爻至上爻）
  const najiaStrs = NAJIA[lowerTrigram]
  if (najiaStrs) {
    const najiaLines = [...najiaStrs.slice(0, 3), ...(NAJIA[upperTrigram]?.slice(3, 6) ?? [])]
    matrix.interpretations.push({ id: 'ly-najia', ruleId: 'liuyao-najia', category: 'general', text: `纳甲：${najiaLines.join(' ')}`, tone: 'neutral', source: '《京氏易传》', weight: 60 })
  }

  // 世应简要
  matrix.interpretations.push({ id: 'ly-shiying', ruleId: 'liuyao-shiying', category: 'general', text: '六爻纳甲以世爻为我、应爻为彼。世应相生则吉，相克则凶。', tone: 'neutral', source: '《卜筮正宗》', weight: 55 })

  return matrix
}

function findTrigram(yaoSeq: string): string {
  const map: Record<string, string> = { '111': '乾', '110': '兑', '101': '离', '100': '震', '011': '巽', '010': '坎', '001': '艮', '000': '坤' }
  return map[yaoSeq] ?? '坤'
}
