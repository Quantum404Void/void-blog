/**
 * engine/knowledge/chenggu/index.ts — 袁天罡称骨歌
 *
 * 数据来源：《袁天罡称骨歌》(唐·袁天罡)
 * 按出生年月日时各查骨重（以"钱"为单位，10钱=1两），
 * 合计总骨重，对照称骨歌诀。
 */

import { createEmptyMatrix } from '@/engine/types'
import { solarFromBranchHour } from '@/engine/calendar'
import type { SymbolMatrix } from '@/engine/types'

/** 年干支配骨重 (钱) — 六十甲子 */
const YEAR_WEIGHT: Record<string, number> = {
  '甲子':9,'乙丑':8,'丙寅':6,'丁卯':7,'戊辰':5,'己巳':7,'庚午':8,'辛未':7,'壬申':7,'癸酉':8,
  '甲戌':5,'乙亥':6,'丙子':7,'丁丑':5,'戊寅':8,'己卯':7,'庚辰':5,'辛巳':5,'壬午':9,'癸未':6,
  '甲申':7,'乙酉':5,'丙戌':6,'丁亥':5,'戊子':7,'己丑':6,'庚寅':8,'辛卯':7,'壬辰':5,'癸巳':4,
  '甲午':5,'乙未':6,'丙申':5,'丁酉':5,'戊戌':5,'己亥':9,'庚子':7,'辛丑':7,'壬寅':9,'癸卯':8,
  '甲辰':8,'乙巳':7,'丙午':5,'丁未':5,'戊申':8,'己酉':5,'庚戌':9,'辛亥':7,'壬子':8,'癸丑':7,
  '甲寅':7,'乙卯':8,'丙辰':8,'丁巳':6,'戊午':6,'己未':6,'庚申':8,'辛酉':8,'壬戌':5,'癸亥':6
}

/** 农历月骨重 (钱) — 正月到十二月 */
const MONTH_WEIGHT = [6,7,18,9,5,16,9,15,18,8,9,5]

/** 农历日骨重 (钱) — 初一到三十 */
const DAY_WEIGHT = [
  5,7,8,15,16,15,8,16,8,16,9,17,8,17,10,8,9,18,5,15,
  10,9,8,9,6,18,7,8,16,6
]

/** 时辰骨重 (钱) — 子时到亥时 */
const HOUR_WEIGHT = [16,6,7,10,9,16,10,8,8,9,6,6]

/** 称骨歌诀 — 按总骨重（两.钱）对应 */
const CHENGGU_SONGS: Record<string, string> = {
  '2.1': '短命非业谓大凶，平生灾难事重重。凶祸频临陷逆境，终世困苦事不成。',
  '2.2': '身寒骨冷苦伶仃，此命推来行乞人。劳劳碌碌无度日，终年打拱过平生。',
  '2.3': '此命推来骨格轻，求谋作事事难成。妻儿兄弟应难许，别处他乡作散人。',
  '2.4': '此命推来福禄无，门庭困苦总难荣。六亲骨肉皆无靠，流浪他乡作老翁。',
  '3.1': '劳劳碌碌苦中求，东奔西走何日休。若使终身勤与俭，老来稍可免忧烦。',
  '3.2': '时来运未来，有缘财不聚。时运若到来，枯木会逢春。',
  '3.3': '早年作事事难成，百计徒劳枉费心。半世自如流水去，后来运到得黄金。',
  '3.4': '此命福气果如何，僧道门中衣禄多。离祖出家方为妙，朝晚拜佛念弥陀。',
  '3.5': '生平福量不周全，祖业根基觉少传。营事生涯宜守旧，时来衣食胜从前。',
  '3.6': '不须劳碌过平生，独自成家福不轻。早有福星常照命，任君行去百般成。',
  '3.7': '此命般般事不成，弟兄少力自孤行。虽然祖业须微有，来得明时去不明。',
  '3.8': '一身骨肉最清高，早入簧门姓氏标。待到年将三十六，蓝衫脱去换红袍。',
  '3.9': '此命终身运不通，劳劳作事尽皆空。苦心竭力成家计，到得那时在梦中。',
  '4.0': '平生衣禄是绵长，件件心中自主张。前面风霜多受过，后来必定享安康。',
  '4.1': '此命推来事不同，为人能干异凡庸。中年还有逍遥福，不比前时运未通。',
  '4.2': '得宽怀处且宽怀，何用双眉皱不开。若使中年命运济，那时名利一齐来。',
  '4.3': '为人心性最聪明，作事轩昂近贵人。衣禄一生天数定，不须劳碌是丰亨。',
  '4.4': '万事由天莫苦求，须知福禄赖人修。当年财帛难如意，晚景欣然便不忧。',
  '4.5': '名利推求竟若何，前番辛苦后奔波。命中难养男与女，骨肉扶持也不多。',
  '4.6': '东西南北尽皆通，出姓移居更觉隆。衣禄无亏天数定，中年晚景一般同。',
  '4.7': '此命推求旺末年，妻荣子贵自怡然。平生原有滔滔福，可卜财源若水泉。',
  '4.8': '初年运道未曾通，几许蹉跎命亦穷。兄弟六亲无有靠，一生事业晚来隆。',
  '4.9': '此命推来福不轻，自成自立显门庭。从来富贵人钦敬，使婢差奴过一生。',
  '5.0': '为利为名终日劳，中年福禄也多遭。老来自有财星照，不比前番目下高。',
  '5.1': '一世荣华事事通，不须劳碌自亨通。弟兄叔侄皆如意，家业成时福禄宏。',
  '5.2': '一世亨通事事能，不须劳苦自然宁。宗族有光欣喜甚，家产丰盈自称心。',
  '5.3': '此格推来福泽宏，兴家立业在其中。一生衣食安排定，却是人间一富翁。',
  '5.4': '此格详采福泽宏，诗书满腹看功成。丰衣足食多安稳，正是人间有福人。',
  '5.5': '策马扬鞭争名利，少年作事费筹论。一朝福禄源源至，富贵荣华显六亲。',
  '5.6': '此格推来礼义通，一身福禄用无穷。甜酸苦辣皆尝过，滚滚财源盈而丰。',
  '5.7': '福禄丰盈万事全，一身荣耀乐天年。名扬威震人争羡，此世逍遥宛似仙。',
  '5.8': '平生衣食自然来，名利双全富贵偕。金榜题名登甲第，紫袍玉带走金阶。',
  '5.9': '细推此格秀而清，必定才高学业成。甲第之中应有分，扬鞭走马显威荣。',
  '6.0': '一朝金榜快题名，显祖荣宗大器成。衣禄定然无欠缺，田园财帛更丰盈。',
  '6.1': '不作朝中金榜客，定为世上大财翁。聪明天赋经书熟，名显高科自是荣。',
  '6.2': '此命生来福不穷，读书必定显亲宗。紫衣金带为卿相，富贵荣华孰与同。',
  '6.3': '命主为官福禄长，得来富贵实丰常。名题金塔传金榜，定中高科天下扬。',
  '6.4': '此格威权不可当，紫袍金带坐高堂。荣华富贵谁能及，万古留名姓氏扬。',
  '6.5': '细推此命福非轻，富贵荣华孰与争。定国安邦人极品，威声显赫震寰瀛。',
  '6.6': '此格人间一福人，堆金积玉满堂春。从来富贵由天定，正笏垂绅谒圣君。',
  '6.7': '此命生来福自宏，田园家业最高隆。平生衣禄盈丰足，一路荣华万事通。',
  '6.8': '富贵由天莫苦求，万金家计不须谋。十年不比前番事，祖业根基千古留。',
  '6.9': '君是人间衣禄星，一生富贵众人钦。总然福禄由天定，安享荣华过一生。',
  '7.0': '此命推来福不轻，何须愁虑苦劳心。荣华富贵由天定，正笏垂绅拜紫宸。',
  '7.1': '此命生成大不同，公侯卿相在其中。一生自有逍遥福，富贵荣华极品隆。',
  '7.2': '此命生成大不同，公侯卿相在其中。一生自有逍遥福，富贵荣华极品隆。'
}

export function chengguCalculate(yearPillar: string, month: number, day: number, hour: number): SymbolMatrix {
  const matrix = createEmptyMatrix('chenggu', `年${yearPillar} 月${month} 日${day} 时${hour}`)

  const yw = YEAR_WEIGHT[yearPillar] ?? 5
  const mw = MONTH_WEIGHT[(month - 1 + 12) % 12]
  const dw = DAY_WEIGHT[(day - 1 + 30) % 30]
  const hw = HOUR_WEIGHT[hour % 12]

  const totalQian = yw + mw + dw + hw
  const liang = Math.floor(totalQian / 10)
  const qian = totalQian % 10
  const key = `${liang}.${qian}`

  matrix.symbols.push(
    { id: 'cg-year', name: `${yearPillar}年`, category: 'chenggu', position: '年', attributes: { weight: String(yw) } },
    { id: 'cg-month', name: `${month}月`, category: 'chenggu', position: '月', attributes: { weight: String(mw) } },
    { id: 'cg-day', name: `${day}日`, category: 'chenggu', position: '日', attributes: { weight: String(dw) } },
    { id: 'cg-hour', name: `${hour}时`, category: 'chenggu', position: '时', attributes: { weight: String(hw) } }
  )

  matrix.derivedTags.push({
    id: 'cg-total', name: `${liang}两${qian}钱`, category: 'chenggu', position: '总骨重',
    derivedFrom: [], attributes: { liang: String(liang), qian: String(qian), totalQian: String(totalQian) }
  })

  const song = CHENGGU_SONGS[key] ?? '骨重超出范围，暂无对应歌诀。'
  matrix.interpretations.push({
    id: 'cg-song', ruleId: 'chenggu-song', category: 'general',
    text: `称骨歌（${liang}两${qian}钱）：${song}`,
    tone: 'neutral', source: '《袁天罡称骨歌》', weight: 90
  })

  return matrix
}

export function chengguFromSolarDate(year: number, month: number, day: number, hour: number): SymbolMatrix {
  const lunar = solarFromBranchHour(year, month, day, hour).getLunar()
  return chengguCalculate(
    lunar.getYearInGanZhiExact(),
    Math.abs(lunar.getMonth()),
    lunar.getDay(),
    hour
  )
}
