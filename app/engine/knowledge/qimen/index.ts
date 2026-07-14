/**
 * engine/knowledge/qimen/index.ts — 奇门遁甲（时家奇门基础）
 *
 * 数据来源：《奇门遁甲秘笈大全》《烟波钓叟赋》
 */
import { solarFromBranchHour } from '@/engine/calendar'
import { createEmptyMatrix } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

const EARTH_PLATE = ['坎','坤','震','巽','中','乾','兑','艮','离'] // 地盘九宫
const STAR_NAMES = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英']
const DOOR_NAMES = ['休','死','伤','杜','','开','惊','生','景']
const GOD_NAMES_YANG = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'] // 阳遁八神
const GOD_NAMES_YIN = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'] // 同

const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

/**
 * 时家奇门基础排盘
 */
export function qimenCast(year: number, month: number, day: number, hour: number): SymbolMatrix {
  const solar = solarFromBranchHour(year, month, day, hour)
  const lunar = solar.getLunar()
  const timeGZ = lunar.getTimeInGanZhi()
  const dayGZ = lunar.getDayInGanZhiExact()

  // 定局: 根据节气确定阴阳遁和局数
  const jieQi = lunar.getPrevJieQi(true)?.getName() ?? ''
  const isYangDun = ['冬至','小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种'].some(j => jieQi.includes(j))

  // 符头定局数 (简化: 用日干支序号)
  const dayStem = dayGZ[0]; const dayBranch = dayGZ[1]
  const stemIdx = STEMS.indexOf(dayStem)
  const branchIdx = BRANCHES.indexOf(dayBranch)
  const juNum = ((stemIdx + branchIdx) % 9) + 1

  const matrix = createEmptyMatrix('qimen', `时家奇门 ${jieQi} ${isYangDun?'阳遁':'阴遁'}${juNum}局`)
  matrix.symbols.push({ id: 'qm-ju', name: `${isYangDun?'阳':'阴'}遁${juNum}局`, category: 'qimen', position: '定局', attributes: { ju: String(juNum), dun: isYangDun?'阳':'阴' } })

  // 地盘九宫
  for (let i = 0; i < 9; i++) {
    const starIdx = isYangDun ? ((i + juNum - 1) % 9) : ((i - juNum + 1 + 9) % 9)
    matrix.symbols.push({
      id: `qm-g${i}`, name: EARTH_PLATE[i], category: 'qimen', position: `宫${i+1}`,
      attributes: { star: STAR_NAMES[starIdx], door: DOOR_NAMES[starIdx], god: isYangDun ? GOD_NAMES_YANG[i%8] : GOD_NAMES_YIN[i%8] }
    })
  }

  matrix.interpretations.push({
    id: 'qm-summary', ruleId: 'qimen-summary', category: 'general',
    text: `奇门遁甲 ${isYangDun?'阳遁':'阴遁'}${juNum}局。${jieQi}节气。九宫有天盘九星、人盘八门、神盘八神。`,
    tone: 'neutral', source: '《奇门遁甲秘笈大全》', weight: 80
  })

  // 时干落宫
  const timeStem = timeGZ[0]
  const timeStemIdx = STEMS.indexOf(timeStem)
  matrix.interpretations.push({
    id: 'qm-time', ruleId: 'qm-time', category: 'general',
    text: `时干${timeStem}落${EARTH_PLATE[timeStemIdx % 9]}宫。时干为事体，代表所问之事的状态。`,
    tone: 'neutral', source: '《烟波钓叟赋》', weight: 70
  })

  return matrix
}
