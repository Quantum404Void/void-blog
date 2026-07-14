/**
 * engine/knowledge/bazi/calculator.ts — 八字排盘计算器
 *
 * 使用 lunar-javascript 库进行精确的农历/干支/纳音计算。
 * 原算法源自《渊海子平》《三命通会》。
 */

import { solarFromBranchHour } from '@/engine/calendar'
import { EARTHLY_BRANCHES, getJiaziIndex } from './branches'
import { getNayin } from './nayin'
import { checkShensha } from './shensha'
import { HEAVENLY_STEMS, STEM_ORDER } from './stems'
import { TEN_GODS, determineTenGod } from './tenGods'
import { getTwelveStage, TWELVE_STAGES } from './twelveStages'

import type { BaziInput, SemanticTag } from '@/engine/types'

export interface BaziPillars {
  year: { stem: string; branch: string; stemId: string; branchId: string }
  month: { stem: string; branch: string; stemId: string; branchId: string }
  day: { stem: string; branch: string; stemId: string; branchId: string }
  hour: { stem: string; branch: string; stemId: string; branchId: string }
}

export interface BaziResult {
  pillars: BaziPillars
  dayMaster: string
  tenGods: { year: string; month: string; day: string; hour: string }
  twelveStages: { year: string; month: string; day: string; hour: string }
  nayin: { year: string; month: string; day: string; hour: string }
  dayJiaziIndex: number
}

export interface DayunStep {
  startAge: number
  stem: string
  branch: string
  pillar: string
}

/**
 * 使用 lunar-javascript 精确排盘
 */
export function calculateBazi(input: BaziInput): BaziResult {
  const solar = solarFromBranchHour(input.year, input.month, input.day, input.hour)
  const lunar = solar.getLunar()

  const yearGZ = lunar.getYearInGanZhiExact()
  const monthGZ = lunar.getMonthInGanZhiExact()
  const dayGZ = lunar.getDayInGanZhiExact()
  const timeGZ = lunar.getTimeInGanZhi()

  const yearStem = yearGZ[0]; const yearBranch = yearGZ[1]
  const monthStem = monthGZ[0]; const monthBranch = monthGZ[1]
  const dayStem = dayGZ[0]; const dayBranch = dayGZ[1]
  const hourStem = timeGZ[0]; const hourBranch = timeGZ[1]

  const pillars: BaziPillars = {
    year: { stem: yearStem, branch: yearBranch, stemId: `stem-${yearStem.toLowerCase()}`, branchId: `branch-${yearBranch}` },
    month: { stem: monthStem, branch: monthBranch, stemId: `stem-${monthStem.toLowerCase()}`, branchId: `branch-${monthBranch}` },
    day: { stem: dayStem, branch: dayBranch, stemId: `stem-${dayStem.toLowerCase()}`, branchId: `branch-${dayBranch}` },
    hour: { stem: hourStem, branch: hourBranch, stemId: `stem-${hourStem.toLowerCase()}`, branchId: `branch-${hourBranch}` }
  }

  const dayMaster = dayStem
  const tenGods = {
    year: determineTenGod(dayMaster, yearStem),
    month: determineTenGod(dayMaster, monthStem),
    day: 'tenGod-biJian',
    hour: determineTenGod(dayMaster, hourStem)
  }
  const twelveStages = {
    year: getTwelveStage(dayMaster, yearBranch),
    month: getTwelveStage(dayMaster, monthBranch),
    day: getTwelveStage(dayMaster, dayBranch),
    hour: getTwelveStage(dayMaster, hourBranch)
  }
  const nayin = {
    year: lunar.getYearNaYin(),
    month: lunar.getMonthNaYin(),
    day: lunar.getDayNaYin(),
    hour: lunar.getTimeNaYin()
  }
  const dayJiaziIndex = getJiaziIndex(dayStem, dayBranch)

  return { pillars, dayMaster, tenGods, twelveStages, nayin, dayJiaziIndex }
}

export function calculateDayun(year: number, month: number, day: number, hour: number, gender: 'male' | 'female', yearStem: string, monthStem: string, monthBranch: string): DayunStep[] {
  const yangStems = new Set(['甲', '丙', '戊', '庚', '壬'])
  const isYangYear = yangStems.has(yearStem)
  const forward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female')
  const startAge = Math.max(1, Math.min(10, Math.floor(((month - 1) * 30 + day) / 3)))
  const result: DayunStep[] = []
  const stemOrder = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const branchOrder = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
  let si = stemOrder.indexOf(monthStem), bi = branchOrder.indexOf(monthBranch)
  for (let step = 0; step < 8; step++) {
    if (step === 0) { forward ? (si=(si+1)%10,bi=(bi+1)%12) : (si=(si+9)%10,bi=(bi+11)%12) }
    else { forward ? (si=(si+1)%10,bi=(bi+1)%12) : (si=(si+9)%10,bi=(bi+11)%12) }
    result.push({ startAge: startAge + step * 10, stem: stemOrder[si], branch: branchOrder[bi], pillar: `${stemOrder[si]}${branchOrder[bi]}` })
  }
  return result
}

export function baziResultToTags(result: BaziResult, input: BaziInput): SemanticTag[] {
  const tags: SemanticTag[] = []
  const pillarKeys = ['year','month','day','hour'] as const
  const pillarLabels = ['年柱','月柱','日柱','时柱']
  for (let i = 0; i < 4; i++) {
    const key = pillarKeys[i], label = pillarLabels[i]
    const stemTag = HEAVENLY_STEMS.find(s => s.name === result.pillars[key].stem)
    if (stemTag) tags.push({ ...stemTag, id: `pillar-${key}-${stemTag.id}`, attributes: { ...stemTag.attributes, pillar: label } })
    const branchTag = EARTHLY_BRANCHES.find(b => b.name === result.pillars[key].branch)
    if (branchTag) tags.push({ ...branchTag, id: `pillar-${key}-${branchTag.id}`, attributes: { ...branchTag.attributes, pillar: label } })
    const tgTag = TEN_GODS.find(t => t.id === result.tenGods[key])
    if (tgTag) tags.push({ ...tgTag, id: `pillar-${key}-${tgTag.id}`, attributes: { ...tgTag.attributes, pillar: label } })
    const stageTag = TWELVE_STAGES.find(s => s.id === result.twelveStages[key])
    if (stageTag) tags.push({ ...stageTag, id: `pillar-${key}-${stageTag.id}`, attributes: { ...stageTag.attributes, pillar: label } })
    const nayinTag = getNayin(result.pillars[key].stem, result.pillars[key].branch)
    if (nayinTag) tags.push({ ...nayinTag, id: `pillar-${key}-${nayinTag.id}`, attributes: { ...nayinTag.attributes, pillar: label } })
  }
  tags.push({ id: `dayMaster-${result.dayMaster}`, name: result.dayMaster, category: 'dayMaster', attributes: { stem: result.dayMaster, gender: input.gender }, description: `日主为${result.dayMaster}` })
  tags.push(...checkShensha({ dayStem: result.dayMaster, yearBranch: result.pillars.year.branch, monthBranch: result.pillars.month.branch, dayBranch: result.pillars.day.branch, hourBranch: result.pillars.hour.branch, yearStem: result.pillars.year.stem, monthStem: result.pillars.month.stem, hourStem: result.pillars.hour.stem, jiaziIndex: result.dayJiaziIndex }))
  return tags
}

/** 时辰对照表 */
export const HOUR_OPTIONS = [
  { branch: '子', modern: '23:00-00:59', value: 0 }, { branch: '丑', modern: '01:00-02:59', value: 1 },
  { branch: '寅', modern: '03:00-04:59', value: 2 }, { branch: '卯', modern: '05:00-06:59', value: 3 },
  { branch: '辰', modern: '07:00-08:59', value: 4 }, { branch: '巳', modern: '09:00-10:59', value: 5 },
  { branch: '午', modern: '11:00-12:59', value: 6 }, { branch: '未', modern: '13:00-14:59', value: 7 },
  { branch: '申', modern: '15:00-16:59', value: 8 }, { branch: '酉', modern: '17:00-18:59', value: 9 },
  { branch: '戌', modern: '19:00-20:59', value: 10 }, { branch: '亥', modern: '21:00-22:59', value: 11 }
]
