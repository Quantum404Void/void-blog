/**
 * engine/knowledge/astrology/index.ts — 星座运势（中立纪实版）
 *
 * 仅提供星座日期范围、属性等事实数据。
 * 运势文本为通用模板，不含主观预测或情感引导。
 */

import { createEmptyMatrix } from '@/engine/types'
import type { MatrixSymbol, SymbolMatrix } from '@/engine/types'

export const ZODIAC_SIGNS: MatrixSymbol[] = [
  { id: 'zodiac-aries', name: '白羊座', category: 'zodiac', position: '3/21-4/19', attributes: { element: '火', planet: '火星', quality: '开创', polarity: '阳' } },
  { id: 'zodiac-taurus', name: '金牛座', category: 'zodiac', position: '4/20-5/20', attributes: { element: '土', planet: '金星', quality: '固定', polarity: '阴' } },
  { id: 'zodiac-gemini', name: '双子座', category: 'zodiac', position: '5/21-6/21', attributes: { element: '风', planet: '水星', quality: '变动', polarity: '阳' } },
  { id: 'zodiac-cancer', name: '巨蟹座', category: 'zodiac', position: '6/22-7/22', attributes: { element: '水', planet: '月亮', quality: '开创', polarity: '阴' } },
  { id: 'zodiac-leo', name: '狮子座', category: 'zodiac', position: '7/23-8/22', attributes: { element: '火', planet: '太阳', quality: '固定', polarity: '阳' } },
  { id: 'zodiac-virgo', name: '处女座', category: 'zodiac', position: '8/23-9/22', attributes: { element: '土', planet: '水星', quality: '变动', polarity: '阴' } },
  { id: 'zodiac-libra', name: '天秤座', category: 'zodiac', position: '9/23-10/23', attributes: { element: '风', planet: '金星', quality: '开创', polarity: '阳' } },
  { id: 'zodiac-scorpio', name: '天蝎座', category: 'zodiac', position: '10/24-11/22', attributes: { element: '水', planet: '冥王星', quality: '固定', polarity: '阴' } },
  { id: 'zodiac-sagittarius', name: '射手座', category: 'zodiac', position: '11/23-12/21', attributes: { element: '火', planet: '木星', quality: '变动', polarity: '阳' } },
  { id: 'zodiac-capricorn', name: '摩羯座', category: 'zodiac', position: '12/22-1/19', attributes: { element: '土', planet: '土星', quality: '开创', polarity: '阴' } },
  { id: 'zodiac-aquarius', name: '水瓶座', category: 'zodiac', position: '1/20-2/18', attributes: { element: '风', planet: '天王星', quality: '固定', polarity: '阳' } },
  { id: 'zodiac-pisces', name: '双鱼座', category: 'zodiac', position: '2/19-3/20', attributes: { element: '水', planet: '海王星', quality: '变动', polarity: '阴' } }
]

export function getZodiacByDate(month: number, day: number): MatrixSymbol {
  const ranges: { id: string; start: [number, number]; end: [number, number] }[] = [
    { id: 'zodiac-capricorn', start: [12, 22], end: [1, 19] },
    { id: 'zodiac-aquarius', start: [1, 20], end: [2, 18] },
    { id: 'zodiac-pisces', start: [2, 19], end: [3, 20] },
    { id: 'zodiac-aries', start: [3, 21], end: [4, 19] },
    { id: 'zodiac-taurus', start: [4, 20], end: [5, 20] },
    { id: 'zodiac-gemini', start: [5, 21], end: [6, 21] },
    { id: 'zodiac-cancer', start: [6, 22], end: [7, 22] },
    { id: 'zodiac-leo', start: [7, 23], end: [8, 22] },
    { id: 'zodiac-virgo', start: [8, 23], end: [9, 22] },
    { id: 'zodiac-libra', start: [9, 23], end: [10, 23] },
    { id: 'zodiac-scorpio', start: [10, 24], end: [11, 22] },
    { id: 'zodiac-sagittarius', start: [11, 23], end: [12, 21] }
  ]
  for (const range of ranges) {
    const [sm, sd] = range.start; const [em, ed] = range.end
    if (sm <= em) {
      if ((month > sm || (month === sm && day >= sd)) && (month < em || (month === em && day <= ed)))
        return ZODIAC_SIGNS.find(s => s.id === range.id)!
    } else {
      if ((month > sm || (month === sm && day >= sd)) || (month < em || (month === em && day <= ed)))
        return ZODIAC_SIGNS.find(s => s.id === range.id)!
    }
  }
  return ZODIAC_SIGNS[0]!
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

const CATEGORY_TEMPLATES: Record<string, string[]> = {
  career: [
    '职场运势属中性，宜按部就班推进现有事务。',
    '工作层面无显著变化，可关注日常积累。',
    '事业方向平稳，重点在于执行而非决策。'
  ],
  wealth: [
    '财运平稳，无大起大落之象。',
    '收支维持平衡状态，无特殊波动。',
    '财务方面宜守不宜攻。'
  ],
  love: [
    '感情运势属常态区间。',
    '人际关系无特殊变化。',
    '情感层面保持平稳。'
  ],
  health: [
    '身体状况无异常提示。',
    '健康运势属中性区间。',
    '身体状态保持平稳。'
  ]
}

export function generateHoroscope(month: number, day: number, seed?: number): SymbolMatrix {
  const sign = getZodiacByDate(month, day)
  const seedVal = seed ?? Date.now()
  const rand = seededRandom(seedVal)
  const matrix = createEmptyMatrix('astrology', `${sign.name} (${month}月${day}日)`)
  matrix.metadata.seed = seedVal
  matrix.symbols.push(sign)

  for (const cat of ['career', 'wealth', 'love', 'health'] as const) {
    const templates = CATEGORY_TEMPLATES[cat] ?? []
    const text = templates[Math.floor(rand() * templates.length)]
    if (!text) continue
    matrix.interpretations.push({
      id: `astro-${cat}-${seedVal}`, ruleId: `astro-${cat}`, category: cat,
      text,
      tone: 'neutral', weight: 50
    })
  }
  return matrix
}
