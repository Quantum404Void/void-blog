/**
 * engine/knowledge/fengshui/index.ts — 风水堪舆（八宅派）
 *
 * 数据来源：《八宅明镜》《阳宅三要》
 * 以命卦定东西四命，配八宅方位吉凶。
 */

import { Solar } from 'lunar-javascript'
import { createEmptyMatrix } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

/** 八卦配数 */
const GUA_NUM: Record<string, number> = { '坎':1,'坤':2,'震':3,'巽':4,'中':5,'乾':6,'兑':7,'艮':8,'离':9 }

/** 东西四命 */
const EAST_FOUR = ['坎','离','震','巽']
const WEST_FOUR = ['乾','坤','艮','兑']

/** 八宅游年星 */
const YOU_NIAN: Record<string, Record<number, string>> = {
  '坎': {1:'伏位',2:'绝命',3:'天医',4:'生气',5:'五鬼',6:'延年',7:'祸害',8:'六煞',9:'延年'},
  '坤': {1:'绝命',2:'伏位',3:'祸害',4:'五鬼',5:'生气',6:'延年',7:'天医',8:'六煞',9:'六煞'},
  '震': {1:'天医',2:'祸害',3:'伏位',4:'延年',5:'六煞',6:'五鬼',7:'绝命',8:'生气',9:'生气'},
  '巽': {1:'生气',2:'五鬼',3:'延年',4:'伏位',5:'天医',6:'祸害',7:'六煞',8:'绝命',9:'天医'},
  '乾': {1:'六煞',2:'延年',3:'五鬼',4:'祸害',5:'天医',6:'伏位',7:'生气',8:'绝命',9:'绝命'},
  '兑': {1:'祸害',2:'天医',3:'绝命',4:'六煞',5:'生气',6:'生气',7:'伏位',8:'延年',9:'五鬼'},
  '艮': {1:'五鬼',2:'生气',3:'六煞',4:'绝命',5:'祸害',6:'绝命',7:'延年',8:'伏位',9:'天医'},
  '离': {1:'延年',2:'六煞',3:'生气',4:'天医',5:'祸害',6:'绝命',7:'五鬼',8:'天医',9:'伏位'}
}

const PALACE_NAMES = ['北','西南','东','东南','中','西北','西','东北','南']  // 坎1→北
const STAR_MEANING: Record<string, string> = {
  '生气': '大吉·主丁财两旺，事业兴旺',
  '天医': '大吉·主健康长寿，疾病得愈',
  '延年': '大吉·主家庭和睦，延年益寿',
  '伏位': '中平·主平稳安和，无大起落',
  '绝命': '大凶·主破败伤亡，宜避之',
  '五鬼': '大凶·主口舌是非，火灾盗贼',
  '六煞': '凶·主淫邪败荡，桃花不利',
  '祸害': '凶·主官非诉讼，病痛缠身'
}

/**
 * 计算命卦（男：100-年生/9余数 女：年生-4/9余数）
 */
function calcMingGua(year: number, gender: 'male' | 'female'): string {
  const num = gender === 'male'
    ? (100 - (year % 100) + 9) % 9 || 9
    : ((year % 100) - 4 + 9) % 9 || 9
  const map: Record<number, string> = { 1:'坎',2:'坤',3:'震',4:'巽',5:'中',6:'乾',7:'兑',8:'艮',9:'离' }
  // 中5: 男寄坤, 女寄艮
  if (num === 5) return gender === 'male' ? '坤' : '艮'
  return map[num]
}

export function fengshuiAnalyze(year: number, gender: 'male' | 'female'): SymbolMatrix {
  const mingGua = calcMingGua(year, gender)
  const groupName = EAST_FOUR.includes(mingGua) ? '东四命' : '西四命'
  const matrix = createEmptyMatrix('fengshui', `${year}年 ${gender==='male'?'男':'女'} 命卦${mingGua}`)

  matrix.symbols.push({ id: 'fs-ming', name: `命卦${mingGua}`, category: 'fengshui', position: '命卦', attributes: { gua: mingGua, group: groupName } })

  // 八宅游年
  for (let i = 1; i <= 9; i++) {
    if (i === 5) continue
    const star = YOU_NIAN[mingGua]?.[i] ?? '伏位'
    const dir = PALACE_NAMES[i - 1]
    matrix.symbols.push({ id: `fs-g${i}`, name: `${dir}(${star})`, category: 'fengshui', position: dir, attributes: { star, direction: dir } })
  }

  matrix.interpretations.push({
    id: 'fs-ming', ruleId: 'fs-ming', category: 'general',
    text: `命卦${mingGua}，属${groupName}。${EAST_FOUR.includes(mingGua) ? '宜住东四宅（坎离震巽向）' : '宜住西四宅（乾坤艮兑向）'}。${mingGua}为${groupName}，${groupName==='东四命'?'忌住西四宅':'忌住东四宅'}。`,
    tone: 'neutral', source: '《八宅明镜》', weight: 85
  })

  // 吉方位
  const yanNian = YOU_NIAN[mingGua]
  if (yanNian) {
    const jiFang: string[] = [], xiongFang: string[] = []
    for (let i = 1; i <= 9; i++) {
      if (i === 5) continue
      const star = yanNian[i]
      if (star && ['生气','天医','延年','伏位'].includes(star)) jiFang.push(`${PALACE_NAMES[i-1]}(${star})`)
      else if (star) xiongFang.push(`${PALACE_NAMES[i-1]}(${star})`)
    }
    matrix.interpretations.push({ id: 'fs-ji', ruleId: 'fs-ji', category: 'general', text: `吉方：${jiFang.join(' ')}\n凶方：${xiongFang.join(' ')}`, tone: 'neutral', source: '《八宅明镜》', weight: 75, modernNote: '八宅法以命卦配宅卦，宅命相合则吉。生气方宜安床、开门；绝命方宜作厕所。' })
  }

  return matrix
}
