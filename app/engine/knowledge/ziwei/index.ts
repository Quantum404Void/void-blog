/**
 * engine/knowledge/ziwei/index.ts — 紫微斗数排盘
 *
 * 数据来源：《紫微斗数全书》(明·罗洪先)
 * 命宫/身宫/十二宫定位 + 五行局 + 紫微星安星
 */

import { Solar } from 'lunar-javascript'
import { assertValidBranchHour, assertValidSolarDate } from '@/engine/calendar'
import { createEmptyMatrix } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

/** 十二宫名称（从寅宫起顺时针） */
const PALACE_NAMES = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母']
const ZODIAC = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

/** 十四主星 */
const MAIN_STARS = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军']

export interface ZiweiPalace {
  name: string
  branch: string
  stem: string
  stars: string[]
}

export interface ZiweiResult {
  mingGong: { branch: string; stem: string }
  shenGong: { branch: string; stem: string }
  fiveElement: string
  palaces: ZiweiPalace[]
}

/**
 * 紫微斗数排盘
 * @param year 公历年
 * @param month 公历月
 * @param day 公历日
 * @param hour 时辰 (0-11)
 * @param gender 性别
 */
export function calculateZiwei(year: number, month: number, day: number, hour: number, gender: 'male' | 'female'): ZiweiResult {
  assertValidSolarDate(year, month, day)
  assertValidBranchHour(hour)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const lYear = lunar.getYear()
  const lMonth = lunar.getMonth()
  const lDay = lunar.getDay()

  // 年干
  const yearStem = lunar.getYearInGanZhiExact()[0]
  if (!yearStem) throw new Error('无法解析年干')

  // 命宫: 从寅宫起正月，顺数至生月，再逆数至生时
  const mingIdx = ((2 - lMonth + hour + 12) % 12 + 12) % 12
  const mingBranch = ZODIAC[mingIdx]!

  // 身宫: 从寅宫起正月，顺数至生月，再顺数至生时
  const shenIdx = ((2 + lMonth - 1 + hour) % 12 + 12) % 12
  const shenBranch = ZODIAC[shenIdx]!

  // 命宫天干 (五虎遁): 甲己→丙寅, 乙庚→戊寅, 丙辛→庚寅, 丁壬→壬寅, 戊癸→甲寅
  const stemStart: Record<string, number> = {'甲':2,'乙':4,'丙':6,'丁':8,'戊':0,'己':2,'庚':4,'辛':6,'壬':8,'癸':0}
  const stemBase = stemStart[yearStem] ?? 0
  const mingStemIdx = (stemBase + mingIdx) % 10
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const mingStem = STEMS[mingStemIdx]!

  // 五行局: 命宫干支的纳音定五行局
  const nayinMap: Record<string, string> = {
    '甲子':'金','乙丑':'金','丙寅':'火','丁卯':'火','戊辰':'木','己巳':'木',
    '庚午':'土','辛未':'土','壬申':'金','癸酉':'金','甲戌':'火','乙亥':'火',
    '丙子':'水','丁丑':'水','戊寅':'土','己卯':'土','庚辰':'金','辛巳':'金',
    '壬午':'木','癸未':'木','甲申':'水','乙酉':'水','丙戌':'土','丁亥':'土',
    '戊子':'火','己丑':'火','庚寅':'木','辛卯':'木','壬辰':'水','癸巳':'水',
    '甲午':'金','乙未':'金','丙申':'火','丁酉':'火','戊戌':'木','己亥':'木',
    '庚子':'土','辛丑':'土','壬寅':'金','癸卯':'金','甲辰':'火','乙巳':'火',
    '丙午':'水','丁未':'水','戊申':'土','己酉':'土','庚戌':'金','辛亥':'金',
    '壬子':'木','癸丑':'木','甲寅':'水','乙卯':'水','丙辰':'土','丁巳':'土',
    '戊午':'火','己未':'火','庚申':'木','辛酉':'木','壬戌':'水','癸亥':'水'
  }
  const mingGZ = mingStem + mingBranch
  const fiveElement = nayinMap[mingGZ] ?? '木'

  // 紫微星位置: 五行局数 → 生日数 → 紫微星所在宫位
  const bureauNum: Record<string, number> = {'水':2,'木':3,'金':4,'土':5,'火':6}
  const bn = bureauNum[fiveElement] ?? 3
  let ziweiIdx = lDay
  if (ziweiIdx % bn !== 0) {
    ziweiIdx += (bn - (ziweiIdx % bn))
  }
  ziweiIdx = ziweiIdx / bn
  if (ziweiIdx % 2 === 0) {
    ziweiIdx = 12 - ziweiIdx
  }
  const ziweiPos = ((ziweiIdx - 1 + 2) % 12 + 12) % 12  // 从寅宫起算

  // 紫微系主星安星
  const ziweiStars: Record<number, string> = {
    0: '紫微', 1: '天机', 2: '太阳', 3: '武曲', 4: '天同', 5: '廉贞'
  }
  const tianfuStars: Record<number, string> = {
    0: '天府', 1: '太阴', 2: '贪狼', 3: '巨门', 4: '天相', 5: '天梁', 6: '七杀', 7: '破军'
  }
  // 天府定位: 紫微 + 天府 = 寅
  const tianfuPos = (4 - ziweiPos + 12) % 12

  // 构建十二宫
  const palaces: ZiweiPalace[] = []
  for (let i = 0; i < 12; i++) {
    const branch = ZODIAC[(mingIdx + i) % 12]!
    const stemIdx = (stemBase + (mingIdx + i)) % 10
    const stem = STEMS[stemIdx]!
    const stars: string[] = []
    const ziwei = ziweiStars[(i - ziweiPos + 12) % 12]
    const tianfu = tianfuStars[(i - tianfuPos + 12) % 12]
    if (ziwei) stars.push(ziwei)
    if (tianfu) stars.push(tianfu)
    palaces.push({ name: PALACE_NAMES[i]!, branch, stem, stars })
  }

  return { mingGong: { branch: mingBranch, stem: mingStem }, shenGong: { branch: shenBranch, stem: mingStem }, fiveElement, palaces }
}

/**
 * 紫微排盘 → SymbolMatrix
 */
export function computeZiweiMatrix(year: number, month: number, day: number, hour: number, gender: 'male' | 'female'): SymbolMatrix {
  const result = calculateZiwei(year, month, day, hour, gender)
  const matrix = createEmptyMatrix('ziwei', `${year}-${month}-${day} ${ZODIAC[hour]}时`)
  matrix.symbols.push({ id: 'zw-ming', name: `命宫${result.mingGong.stem}${result.mingGong.branch}`, category: 'ziwei', position: '命宫', attributes: { palace: '命宫', stem: result.mingGong.stem, branch: result.mingGong.branch } })
  matrix.symbols.push({ id: 'zw-shen', name: `身宫${result.shenGong.stem}${result.shenGong.branch}`, category: 'ziwei', position: '身宫', attributes: { palace: '身宫', stem: result.shenGong.stem, branch: result.shenGong.branch } })
  matrix.interpretations.push({ id: 'zw-wuxing', ruleId: 'zw-wx', category: 'general', text: `五行局：${result.fiveElement}局。命宫${result.mingGong.stem}${result.mingGong.branch}纳音属${result.fiveElement}。`, tone: 'neutral', source: '《紫微斗数全书》', weight: 80 })
  for (const p of result.palaces) {
    matrix.symbols.push({ id: `zw-${p.name}`, name: p.name, category: 'ziwei', position: p.name, attributes: { stem: p.stem, branch: p.branch, stars: p.stars.join(',') } })
  }
  matrix.interpretations.push({ id: 'zw-main', ruleId: 'zw-main', category: 'general', text: `十二宫：${result.palaces.map(p => `${p.name}(${p.stem}${p.branch})`).join(' ')}`, tone: 'neutral', source: '《紫微斗数全书》', weight: 70 })
  return matrix
}
