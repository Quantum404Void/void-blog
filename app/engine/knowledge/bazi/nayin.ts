/**
 * engine/knowledge/bazi/nayin.ts — 六十甲子纳音
 * 数据来源：《三命通会·论纳音》
 */

import type { SemanticTag } from '@/engine/types'

const NAYIN_TABLE: { stemBranch: string; nayin: string; element: string }[] = [
  { stemBranch: '甲子', nayin: '海中金', element: '金' },
  { stemBranch: '乙丑', nayin: '海中金', element: '金' },
  { stemBranch: '丙寅', nayin: '炉中火', element: '火' },
  { stemBranch: '丁卯', nayin: '炉中火', element: '火' },
  { stemBranch: '戊辰', nayin: '大林木', element: '木' },
  { stemBranch: '己巳', nayin: '大林木', element: '木' },
  { stemBranch: '庚午', nayin: '路旁土', element: '土' },
  { stemBranch: '辛未', nayin: '路旁土', element: '土' },
  { stemBranch: '壬申', nayin: '剑锋金', element: '金' },
  { stemBranch: '癸酉', nayin: '剑锋金', element: '金' },
  { stemBranch: '甲戌', nayin: '山头火', element: '火' },
  { stemBranch: '乙亥', nayin: '山头火', element: '火' },
  { stemBranch: '丙子', nayin: '涧下水', element: '水' },
  { stemBranch: '丁丑', nayin: '涧下水', element: '水' },
  { stemBranch: '戊寅', nayin: '城头土', element: '土' },
  { stemBranch: '己卯', nayin: '城头土', element: '土' },
  { stemBranch: '庚辰', nayin: '白蜡金', element: '金' },
  { stemBranch: '辛巳', nayin: '白蜡金', element: '金' },
  { stemBranch: '壬午', nayin: '杨柳木', element: '木' },
  { stemBranch: '癸未', nayin: '杨柳木', element: '木' },
  { stemBranch: '甲申', nayin: '泉中水', element: '水' },
  { stemBranch: '乙酉', nayin: '泉中水', element: '水' },
  { stemBranch: '丙戌', nayin: '屋上土', element: '土' },
  { stemBranch: '丁亥', nayin: '屋上土', element: '土' },
  { stemBranch: '戊子', nayin: '霹雳火', element: '火' },
  { stemBranch: '己丑', nayin: '霹雳火', element: '火' },
  { stemBranch: '庚寅', nayin: '松柏木', element: '木' },
  { stemBranch: '辛卯', nayin: '松柏木', element: '木' },
  { stemBranch: '壬辰', nayin: '长流水', element: '水' },
  { stemBranch: '癸巳', nayin: '长流水', element: '水' },
  { stemBranch: '甲午', nayin: '沙中金', element: '金' },
  { stemBranch: '乙未', nayin: '沙中金', element: '金' },
  { stemBranch: '丙申', nayin: '山下火', element: '火' },
  { stemBranch: '丁酉', nayin: '山下火', element: '火' },
  { stemBranch: '戊戌', nayin: '平地木', element: '木' },
  { stemBranch: '己亥', nayin: '平地木', element: '木' },
  { stemBranch: '庚子', nayin: '壁上土', element: '土' },
  { stemBranch: '辛丑', nayin: '壁上土', element: '土' },
  { stemBranch: '壬寅', nayin: '金箔金', element: '金' },
  { stemBranch: '癸卯', nayin: '金箔金', element: '金' },
  { stemBranch: '甲辰', nayin: '覆灯火', element: '火' },
  { stemBranch: '乙巳', nayin: '覆灯火', element: '火' },
  { stemBranch: '丙午', nayin: '天河水', element: '水' },
  { stemBranch: '丁未', nayin: '天河水', element: '水' },
  { stemBranch: '戊申', nayin: '大驿土', element: '土' },
  { stemBranch: '己酉', nayin: '大驿土', element: '土' },
  { stemBranch: '庚戌', nayin: '钗钏金', element: '金' },
  { stemBranch: '辛亥', nayin: '钗钏金', element: '金' },
  { stemBranch: '壬子', nayin: '桑柘木', element: '木' },
  { stemBranch: '癸丑', nayin: '桑柘木', element: '木' },
  { stemBranch: '甲寅', nayin: '大溪水', element: '水' },
  { stemBranch: '乙卯', nayin: '大溪水', element: '水' },
  { stemBranch: '丙辰', nayin: '沙中土', element: '土' },
  { stemBranch: '丁巳', nayin: '沙中土', element: '土' },
  { stemBranch: '戊午', nayin: '天上火', element: '火' },
  { stemBranch: '己未', nayin: '天上火', element: '火' },
  { stemBranch: '庚申', nayin: '石榴木', element: '木' },
  { stemBranch: '辛酉', nayin: '石榴木', element: '木' },
  { stemBranch: '壬戌', nayin: '大海水', element: '水' },
  { stemBranch: '癸亥', nayin: '大海水', element: '水' }
]

/** 三十纳音详解（《三命通会》）— 必须在 NAYIN_TAGS 之前定义 */
const NAYIN_DESCRIPTIONS: Record<string, string> = {
  '海中金': '甲子乙丑海中金。子丑为水旺之地，金死于子、墓于丑，水旺金衰，故为海中金。',
  '炉中火': '丙寅丁卯炉中火。寅卯为木旺之地，木生火，火得木生，如炉中之火。',
  '大林木': '戊辰己巳大林木。辰巳近午，木气将衰，故为大林木，取茂盛之意。',
  '路旁土': '庚午辛未路旁土。午未为火旺之地，火能生土，土得火生，如路旁之土。',
  '剑锋金': '壬申癸酉剑锋金。申酉为金旺之地，金气刚强，如剑锋之锐利。',
  '山头火': '甲戌乙亥山头火。戌亥为天门，火在天上，如山头之火，光照远方。',
  '涧下水': '丙子丁丑涧下水。子丑为水旺，水势湍急，如山涧之水奔流不息。',
  '城头土': '戊寅己卯城头土。寅卯为木旺克土，土得木制而坚实，如城头之土。',
  '白蜡金': '庚辰辛巳白蜡金。辰巳近火，金得火炼而色白，如白蜡之金。',
  '杨柳木': '壬午癸未杨柳木。午未火旺，木见火则柔，如杨柳之婀娜。',
  '泉中水': '甲申乙酉泉中水。申酉为金，金生水，水源清冽，如泉中之水。',
  '屋上土': '丙戌丁亥屋上土。戌亥为天门，土在天上，如屋上之土。',
  '霹雳火': '戊子己丑霹雳火。子丑水旺，火入水中，相激而成霹雳。',
  '松柏木': '庚寅辛卯松柏木。寅卯为木旺，木性刚直，如松柏之挺拔。',
  '长流水': '壬辰癸巳长流水。辰为水库、巳近午火，水势绵长不断。',
  '沙中金': '甲午乙未沙中金。午未火旺克金，金藏沙中，隐而不显。',
  '山下火': '丙申丁酉山下火。申酉金旺，火见金则藏，如山脚下之余烬。',
  '平地木': '戊戌己亥平地木。戌亥为天门，木在天门下，如平地之木。',
  '壁上土': '庚子辛丑壁上土。子丑水旺，水土相和，如墙壁之土。',
  '金箔金': '壬寅癸卯金箔金。寅卯木旺，金被木所薄，如金箔之薄。',
  '覆灯火': '甲辰乙巳覆灯火。辰巳近午火，火光微弱，如覆灯之火。',
  '天河水': '丙午丁未天河水。午未为火旺极处，火极生水，如天河之水。',
  '大驿土': '戊申己酉大驿土。申酉金旺，土生金而气散，如大路之土。',
  '钗钏金': '庚戌辛亥钗钏金。戌亥为天门，金在天门，如首饰之金。',
  '桑柘木': '壬子癸丑桑柘木。子丑水旺，木得水而生，如桑树之繁茂。',
  '大溪水': '甲寅乙卯大溪水。寅卯木旺，水生木而势大，如大溪之水。',
  '沙中土': '丙辰丁巳沙中土。辰巳近火，土被火烧而成沙。',
  '天上火': '戊午己未天上火。午未火旺极处，火势冲天。',
  '石榴木': '庚申辛酉石榴木。申酉金旺克木，木性坚韧，如石榴之木。',
  '大海水': '壬戌癸亥大海水。戌亥为天门，水在天门，如大海之水，浩瀚无边。'
}

export const NAYIN_TAGS: SemanticTag[] = NAYIN_TABLE.map((item, idx) => ({
  id: `nayin-${item.stemBranch}`,
  name: item.nayin,
  category: 'nayin',
  attributes: { stemBranch: item.stemBranch, element: item.element, index: String(idx) },
  description: NAYIN_DESCRIPTIONS[item.nayin] || `${item.stemBranch}: ${item.nayin}`,
  source: '《三命通会·论纳音》'
}))

export function getNayin(stem: string, branch: string): SemanticTag | undefined {
  return NAYIN_TAGS.find((t) => t.attributes.stemBranch === `${stem}${branch}`)
}

export const NAYIN_ORDER = NAYIN_TABLE.map((n) => n.stemBranch)
