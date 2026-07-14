/**
 * engine/knowledge/bazi/shensha.ts — 神煞（32种）
 *
 * 数据来源：《三命通会》《渊海子平》《星平会海》
 * 共计32种神煞，含吉神14种、凶煞11种、中性7种。
 */

import type { SemanticTag } from '@/engine/types'

export const SHENSHA_TAGS: SemanticTag[] = [
  // ── 吉神 (14) ──
  { id: 'shensha-tianYiGuiRen', name: '天乙贵人', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '天乙为命中第一吉神。《三命通会》："天乙者，乃天上之神，在紫微垣阖门外，与太乙并列。"', source: '《三命通会》' },
  { id: 'shensha-taiJiGuiRen', name: '太极贵人', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '太极贵人主智慧。《三命通会》：甲乙生人见子午、丙丁见卯酉等。', source: '《三命通会》' },
  { id: 'shensha-wenChang', name: '文昌', category: 'shensha', attributes: { nature: '吉', type: '文星' }, description: '文昌主科甲学识。以日干查。', source: '《三命通会》' },
  { id: 'shensha-xueTang', name: '学堂', category: 'shensha', attributes: { nature: '吉', type: '文星' }, description: '学堂主学业。以日干长生之位为学堂。', source: '《渊海子平》' },
  { id: 'shensha-jiangXing', name: '将星', category: 'shensha', attributes: { nature: '吉', type: '权星' }, description: '将星主权威。以年支或日支查三合局之仲神。', source: '《三命通会》' },
  { id: 'shensha-luShen', name: '禄神', category: 'shensha', attributes: { nature: '吉', type: '福星' }, description: '禄神即临官之位。甲禄在寅、乙禄在卯等。', source: '《渊海子平》' },
  { id: 'shensha-fuXing', name: '福星', category: 'shensha', attributes: { nature: '吉', type: '福星' }, description: '福星主食禄福寿。', source: '《三命通会》' },
  { id: 'shensha-tianDe', name: '天德贵人', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '天德以月支查天干。正月见丁、二月见申等。', source: '《三命通会》' },
  { id: 'shensha-yueDeGuiRen', name: '月德贵人', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '月德以月支查天干：寅午戌见丙、亥卯未见甲、申子辰见壬、巳酉丑见庚。', source: '《三命通会》' },
  { id: 'shensha-hongLuan', name: '红鸾', category: 'shensha', attributes: { nature: '吉', type: '情星' }, description: '红鸾主婚喜。以年支查。', source: '《星平会海》' },
  { id: 'shensha-tianXi', name: '天喜', category: 'shensha', attributes: { nature: '吉', type: '情星' }, description: '天喜主喜事添丁。红鸾对冲之位即为天喜。', source: '《星平会海》' },
  { id: 'shensha-jinYu', name: '金舆', category: 'shensha', attributes: { nature: '吉', type: '福星' }, description: '金舆主食禄。以日干查。', source: '《三命通会》' },
  { id: 'shensha-tianShe', name: '天赦', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '天赦日：春戊寅、夏甲午、秋戊申、冬甲子。', source: '《渊海子平》' },
  { id: 'shensha-sanQi', name: '三奇贵人', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '天上三奇甲戊庚、地下三奇乙丙丁、人中三奇壬癸辛。', source: '《三命通会》' },

  // ── 凶煞 (11) ──
  { id: 'shensha-yangRen', name: '羊刃', category: 'shensha', attributes: { nature: '凶', type: '刀星' }, description: '帝旺之位为羊刃。甲刃在卯、丙戊在午、庚在酉、壬在子。', source: '《渊海子平》' },
  { id: 'shensha-kongWang', name: '空亡', category: 'shensha', attributes: { nature: '凶', type: '空星' }, description: '旬空之位。甲子旬戌亥空、甲戌旬申酉空等。', source: '《渊海子平》' },
  { id: 'shensha-guChen', name: '孤辰', category: 'shensha', attributes: { nature: '凶', type: '孤星' }, description: '孤辰主孤独。以年支查。', source: '《三命通会》' },
  { id: 'shensha-wangShen', name: '亡神', category: 'shensha', attributes: { nature: '凶', type: '煞星' }, description: '亡神主刑伤。以年支或日支查。', source: '《三命通会》' },
  { id: 'shensha-jieSha', name: '劫煞', category: 'shensha', attributes: { nature: '凶', type: '煞星' }, description: '劫煞主破败是非。以年支或日支查。', source: '《三命通会》' },
  { id: 'shensha-yuanChen', name: '元辰', category: 'shensha', attributes: { nature: '凶', type: '煞星' }, description: '又名大耗，主破耗波折。', source: '《三命通会》' },
  { id: 'shensha-guLuan', name: '孤鸾', category: 'shensha', attributes: { nature: '凶', type: '孤星' }, description: '孤鸾煞以日柱查：甲寅、乙卯、丙午、丁巳、戊辰、戊戌、己丑、己未、庚申、辛酉、壬子、癸亥。', source: '《三命通会》' },
  { id: 'shensha-yinYangChaCuo', name: '阴阳差错', category: 'shensha', attributes: { nature: '凶', type: '孤星' }, description: '以日柱查：丙子、丁丑、戊寅、辛卯、壬辰、癸巳、丙午、丁未、戊申、辛酉、壬戌、癸亥。', source: '《三命通会》' },
  { id: 'shensha-shiEDaBai', name: '十恶大败', category: 'shensha', attributes: { nature: '凶', type: '煞星' }, description: '以日柱查：甲辰、乙巳、壬申、丙申、丁亥、庚辰、戊戌、癸亥、辛巳、己丑。', source: '《三命通会》' },
  { id: 'shensha-tianLuoDiWang', name: '天罗地网', category: 'shensha', attributes: { nature: '凶', type: '煞星' }, description: '辰为天罗、戌为地网。命中辰戌多见为入罗网。', source: '《三命通会》' },
  { id: 'shensha-yueDe', name: '月德', category: 'shensha', attributes: { nature: '吉', type: '贵人' }, description: '（保留兼容）', source: '《三命通会》' },

  // ── 中性 (7) ──
  { id: 'shensha-huaGai', name: '华盖', category: 'shensha', attributes: { nature: '中性', type: '孤星' }, description: '华盖主孤高、玄学艺术。以年支或日支查三合局之墓神。', source: '《三命通会》' },
  { id: 'shensha-taoHua', name: '桃花', category: 'shensha', attributes: { nature: '中性', type: '情星' }, description: '又名咸池。沐浴之位。子午卯酉为四桃花。', source: '《三命通会》' },
  { id: 'shensha-yiMa', name: '驿马', category: 'shensha', attributes: { nature: '中性', type: '动星' }, description: '寅申巳亥为四驿马，主奔波迁移。', source: '《三命通会》' },
  { id: 'shensha-kuiGang', name: '魁罡', category: 'shensha', attributes: { nature: '中性', type: '贵星' }, description: '魁罡日：庚辰、庚戌、壬辰、戊戌。', source: '《三命通会》' },
  { id: 'shensha-jinShen', name: '金神', category: 'shensha', attributes: { nature: '中性', type: '贵星' }, description: '金神日：乙丑、己巳、癸酉。需火制方贵。', source: '《渊海子平》' },
  { id: 'shensha-tianChu', name: '天厨', category: 'shensha', attributes: { nature: '中性', type: '福星' }, description: '天厨主食禄口福。', source: '《三命通会》' },
  { id: 'shensha-deXiu', name: '德秀', category: 'shensha', attributes: { nature: '中性', type: '贵星' }, description: '德秀主品德才华。', source: '《三命通会》' }
]

// ── 查法映射 ──

const TIAN_YI_MAP: Record<string, string[]> = {
  '甲': ['丑', '未'], '乙': ['子', '申'], '丙': ['亥', '酉'],
  '丁': ['亥', '酉'], '戊': ['丑', '未'], '己': ['子', '申'],
  '庚': ['午', '寅'], '辛': ['午', '寅'], '壬': ['卯', '巳'], '癸': ['卯', '巳']
}

const WEN_CHANG_MAP: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
}

const YI_MA_MAP: Record<string, string> = {
  '申': '寅', '子': '寅', '辰': '寅', '亥': '巳', '卯': '巳', '未': '巳',
  '寅': '申', '午': '申', '戌': '申', '巳': '亥', '酉': '亥', '丑': '亥'
}

const TAO_HUA_MAP: Record<string, string> = {
  '申': '酉', '子': '酉', '辰': '酉', '亥': '子', '卯': '子', '未': '子',
  '寅': '卯', '午': '卯', '戌': '卯', '巳': '午', '酉': '午', '丑': '午'
}

const JIANG_XING_MAP: Record<string, string> = {
  '申': '子', '子': '子', '辰': '子', '亥': '卯', '卯': '卯', '未': '卯',
  '寅': '午', '午': '午', '戌': '午', '巳': '酉', '酉': '酉', '丑': '酉'
}

const HUA_GAI_MAP: Record<string, string> = {
  '申': '辰', '子': '辰', '辰': '辰', '亥': '未', '卯': '未', '未': '未',
  '寅': '戌', '午': '戌', '戌': '戌', '巳': '丑', '酉': '丑', '丑': '丑'
}

const YANG_REN_MAP: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳',
  '戊': '午', '己': '巳', '庚': '酉', '辛': '申', '壬': '子', '癸': '亥'
}

const TIAN_DE_MAP: Record<string, string> = {
  '寅': '丁', '卯': '申', '辰': '壬', '巳': '辛', '午': '亥', '未': '甲',
  '申': '癸', '酉': '寅', '戌': '丙', '亥': '乙', '子': '巳', '丑': '庚'
}

const YUE_DE_MAP: Record<string, string> = {
  '寅': '丙', '卯': '甲', '辰': '壬', '巳': '庚', '午': '丙', '未': '甲',
  '申': '壬', '酉': '庚', '戌': '丙', '亥': '甲', '子': '壬', '丑': '庚'
}

const KONG_WANG_MAP: Record<number, string[]> = {
  0: ['戌', '亥'], 1: ['申', '酉'], 2: ['午', '未'],
  3: ['辰', '巳'], 4: ['寅', '卯'], 5: ['子', '丑']
}

const HONG_LUAN_MAP: Record<string, string> = {
  '子': '卯', '丑': '寅', '寅': '丑', '卯': '子', '辰': '亥', '巳': '戌',
  '午': '酉', '未': '申', '申': '未', '酉': '午', '戌': '巳', '亥': '辰'
}

const GU_LUAN_DAYS = new Set([
  '甲寅', '乙卯', '丙午', '丁巳', '戊辰', '戊戌',
  '己丑', '己未', '庚申', '辛酉', '壬子', '癸亥'
])

const KUI_GANG_DAYS = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])
const JIN_SHEN_DAYS = new Set(['乙丑', '己巳', '癸酉'])

function pushTag(result: SemanticTag[], baseId: string, pillar: string) {
  const tag = SHENSHA_TAGS.find(t => t.id === baseId)
  if (tag) result.push({ ...tag, id: `${baseId}-${pillar}`, attributes: { ...tag.attributes, pillar } })
}

// ── 主检测函数 ──

export function checkShensha(params: {
  dayStem: string; yearBranch: string; monthBranch: string; dayBranch: string; hourBranch: string
  yearStem: string; monthStem: string; hourStem: string; jiaziIndex: number
}): SemanticTag[] {
  const r: SemanticTag[] = []
  const br = [params.yearBranch, params.monthBranch, params.dayBranch, params.hourBranch]
  const st = [params.yearStem, params.monthStem, params.dayStem, params.hourStem]
  const pn = ['年', '月', '日', '时']
  const dayPillar = `${params.dayStem}${params.dayBranch}`

  // 吉神检测
  for (let i = 0; i < 4; i++) {
    if (TIAN_YI_MAP[params.dayStem]?.includes(br[i])) pushTag(r, 'shensha-tianYiGuiRen', pn[i])
    if (br[i] === WEN_CHANG_MAP[params.dayStem]) pushTag(r, 'shensha-wenChang', pn[i])
    if (br[i] === YI_MA_MAP[params.yearBranch] || br[i] === YI_MA_MAP[params.dayBranch]) pushTag(r, 'shensha-yiMa', pn[i])
    if (br[i] === TAO_HUA_MAP[params.yearBranch] || br[i] === TAO_HUA_MAP[params.dayBranch]) pushTag(r, 'shensha-taoHua', pn[i])
    if (br[i] === JIANG_XING_MAP[params.dayBranch]) pushTag(r, 'shensha-jiangXing', pn[i])
    if (br[i] === HUA_GAI_MAP[params.dayBranch]) pushTag(r, 'shensha-huaGai', pn[i])
    if (br[i] === YANG_REN_MAP[params.dayStem]) pushTag(r, 'shensha-yangRen', pn[i])
    if (st[i] === TIAN_DE_MAP[params.monthBranch]) pushTag(r, 'shensha-tianDe', pn[i])
    if (st[i] === YUE_DE_MAP[params.monthBranch]) pushTag(r, 'shensha-yueDeGuiRen', pn[i])
    if (br[i] === HONG_LUAN_MAP[params.yearBranch]) pushTag(r, 'shensha-hongLuan', pn[i])
    // 天喜为红鸾对冲
    const hl = HONG_LUAN_MAP[params.yearBranch]
    if (hl) {
      const hlIdx = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].indexOf(hl)
      const txIdx = (hlIdx + 6) % 12
      if (br[i] === ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][txIdx]) pushTag(r, 'shensha-tianXi', pn[i])
    }
  }

  // 空亡
  for (const kw of KONG_WANG_MAP[Math.floor(params.jiaziIndex / 10)] || []) {
    for (let i = 0; i < 4; i++) if (br[i] === kw) pushTag(r, 'shensha-kongWang', pn[i])
  }

  // 日柱特殊神煞
  if (GU_LUAN_DAYS.has(dayPillar)) pushTag(r, 'shensha-guLuan', '日')
  if (KUI_GANG_DAYS.has(dayPillar)) pushTag(r, 'shensha-kuiGang', '日')
  if (JIN_SHEN_DAYS.has(dayPillar)) pushTag(r, 'shensha-jinShen', '日')

  // 辰戌为天罗地网
  let chenCount = 0, xuCount = 0
  for (const b of br) { if (b === '辰') chenCount++; if (b === '戌') xuCount++ }
  if (chenCount >= 2 || xuCount >= 2) pushTag(r, 'shensha-tianLuoDiWang', '四柱')

  return r
}
