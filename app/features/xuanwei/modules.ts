export interface XuanweiModule {
  id: string
  name: string
  glyph: string
  description: string
  group: '命理星曜' | '易学术数' | '占测民俗' | '古籍资料'
}

export const xuanweiModules: XuanweiModule[] = [
  { id: 'bazi', name: '八字命理', glyph: '命', description: '天干地支、十神、十二长生、纳音神煞', group: '命理星曜' },
  { id: 'ziwei', name: '紫微斗数', glyph: '紫', description: '十四主星、十二宫与命身宫基础排盘', group: '命理星曜' },
  { id: 'astrology', name: '星座运势', glyph: '星', description: '十二星座日期属性与中性趋势模板', group: '命理星曜' },
  { id: 'nameology', name: '姓名学', glyph: '名', description: '标准笔画、五格数理与三才配置', group: '命理星曜' },
  { id: 'chenggu', name: '称骨歌', glyph: '骨', description: '骨重计算与传统歌诀查阅', group: '命理星曜' },
  { id: 'liuyao', name: '六爻纳甲', glyph: '爻', description: '铜钱起卦、纳甲、本卦与变卦', group: '易学术数' },
  { id: 'meihua', name: '梅花易数', glyph: '梅', description: '数字或时间起卦、本卦互卦与变卦', group: '易学术数' },
  { id: 'qimen', name: '奇门遁甲', glyph: '奇', description: '九宫、九星、八门与八神基础盘', group: '易学术数' },
  { id: 'daliuren', name: '大六壬', glyph: '壬', description: '天地盘与四课基础排盘', group: '易学术数' },
  { id: 'iching', name: '易经六十四卦', glyph: '易', description: '六十四卦卦辞与大象传查阅', group: '易学术数' },
  { id: 'tarot', name: '塔罗占卜', glyph: '牌', description: '七十八张牌、经典牌阵与正逆位', group: '占测民俗' },
  { id: 'lots', name: '抽签解签', glyph: '签', description: '20 支观音灵签精选、签诗与注释', group: '占测民俗' },
  { id: 'fengshui', name: '风水堪舆', glyph: '宅', description: '八宅命卦、游年星与方位', group: '占测民俗' },
  { id: 'mianxiang', name: '面相', glyph: '相', description: '八部位、62 条固定形态与古籍条文', group: '占测民俗' },
  { id: 'dream', name: '周公解梦', glyph: '梦', description: '38 个梦象关键词与传统释义', group: '占测民俗' },
  { id: 'classics', name: '古籍目录', glyph: '籍', description: '46 部资料的版本、来源与收录状态', group: '古籍资料' },
]

export const xuanweiModuleMap = new Map(xuanweiModules.map(module => [module.id, module]))

export const xuanweiGroups = ['命理星曜', '易学术数', '占测民俗', '古籍资料'] as const
