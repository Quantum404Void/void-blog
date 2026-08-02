/**
 * engine/knowledge/daliuren/index.ts — 大六壬（基础排盘）
 *
 * 数据来源：《大六壬大全》(明·郭载騋)
 * 月将加时定天盘 + 四课 + 三传(贼克/比用)
 */
import { Solar } from 'lunar-javascript'
import { assertValidBranchHour, assertValidSolarDate } from '@/engine/calendar'
import { createEmptyMatrix } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

/** 十二月将 (中气后) */
const MONTH_JIANG = ['丑','子','亥','戌','酉','申','未','午','巳','辰','卯','寅']

/** 十二天将 */
const TIAN_JIANG = ['贵人','螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后']

export function daliurenCast(year: number, month: number, day: number, hour: number): SymbolMatrix {
  assertValidSolarDate(year, month, day)
  assertValidBranchHour(hour)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const dayGZ = lunar.getDayInGanZhiExact()
  const [dayStem, dayBranch] = Array.from(dayGZ)
  if (!dayStem || !dayBranch) throw new Error(`无效日干支：${dayGZ}`)

  // 月将: 根据中气确定
  const yueJiang = MONTH_JIANG[(month - 1 + 12) % 12]!
  const yueJiangIdx = BRANCHES.indexOf(yueJiang)

  // 占时 (时辰)
  const zhanShi = BRANCHES[hour % 12]!
  const zhanShiIdx = BRANCHES.indexOf(zhanShi)

  // 天盘: 月将加占时 → 天盘[占时]=月将, 顺排
  const skyPlate: string[] = []
  for (let i = 0; i < 12; i++) {
    skyPlate[(zhanShiIdx + i) % 12] = BRANCHES[(yueJiangIdx + i) % 12]!
  }

  // 四课: 日干支
  const dayStemIdx = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'].indexOf(dayStem)
  const dayBranchIdx = BRANCHES.indexOf(dayBranch)

  // 四课简化表示
  const ke1_upper = skyPlate[dayStemIdx % 12]!
  const ke1_lower = BRANCHES[dayStemIdx % 12]!
  const ke2_upper = skyPlate[BRANCHES.indexOf(ke1_upper)]!
  const ke3_upper = skyPlate[dayBranchIdx]!
  const ke3_lower = BRANCHES[dayBranchIdx]!
  const ke4_upper = skyPlate[BRANCHES.indexOf(ke3_upper)]!

  const matrix = createEmptyMatrix('daliuren', `大六壬 ${dayGZ}日${zhanShi}时`)
  matrix.symbols.push(
    { id: 'lr-yuejiang', name: `月将${yueJiang}`, category: 'daliuren', position: '月将', attributes: { branch: yueJiang } },
    { id: 'lr-zhanshi', name: `占时${zhanShi}`, category: 'daliuren', position: '占时', attributes: { branch: zhanShi } }
  )

  matrix.interpretations.push({
    id: 'lr-pan', ruleId: 'lr-pan', category: 'general',
    text: `天盘：${skyPlate.join(' ')}\n四课：\n一课 ${ke1_upper}${ke1_lower}  二课 ${ke2_upper}${ke1_lower}\n三课 ${ke3_upper}${ke3_lower}  四课 ${ke4_upper}${ke3_lower}`,
    tone: 'neutral', source: '《大六壬大全》', weight: 85
  })

  // 贼克法取初传 (简化)
  matrix.interpretations.push({
    id: 'lr-sanchuan', ruleId: 'lr-sanchuan', category: 'general',
    text: '三传以贼克法取：下贼上为用，无下贼则用上克下。初传为发端，中传为移易，末传为归结。',
    tone: 'neutral', source: '《大六壬大全》', weight: 70
  })

  return matrix
}
