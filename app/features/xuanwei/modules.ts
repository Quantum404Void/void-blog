export interface XuanweiModule {
  id: string
  name: string
  glyph: string
  description: string
  group: '命理星曜' | '易学术数' | '占测民俗'
}

export const xuanweiModules: XuanweiModule[] = [
  { id: 'bazi', name: '八字命理', glyph: '命', description: '天干地支、十神、十二长生、纳音神煞', group: '命理星曜' },
  { id: 'ziwei', name: '紫微斗数', glyph: '紫', description: '紫微星曜、十二宫位与四化飞星', group: '命理星曜' },
  { id: 'astrology', name: '星座运势', glyph: '星', description: '十二星座、每日趋势与生活提示', group: '命理星曜' },
  { id: 'nameology', name: '姓名学', glyph: '名', description: '五格剖象、三才配置与字义参考', group: '命理星曜' },
  { id: 'chenggu', name: '称骨歌', glyph: '骨', description: '骨重计算、传统歌诀与白话解读', group: '命理星曜' },
  { id: 'liuyao', name: '六爻纳甲', glyph: '爻', description: '世应六亲、动爻与变卦解析', group: '易学术数' },
  { id: 'meihua', name: '梅花易数', glyph: '梅', description: '数字或时间起卦、体用生克', group: '易学术数' },
  { id: 'qimen', name: '奇门遁甲', glyph: '奇', description: '九宫排盘、门星神与时空格局', group: '易学术数' },
  { id: 'daliuren', name: '大六壬', glyph: '壬', description: '天地盘、三传四课与神将推演', group: '易学术数' },
  { id: 'iching', name: '易经六十四卦', glyph: '易', description: '卦象、卦爻辞与变卦参考', group: '易学术数' },
  { id: 'tarot', name: '塔罗占卜', glyph: '牌', description: '七十八张牌、经典牌阵与正逆位', group: '占测民俗' },
  { id: 'lots', name: '抽签解签', glyph: '签', description: '观音灵签、签文典故与白话解读', group: '占测民俗' },
  { id: 'fengshui', name: '风水堪舆', glyph: '宅', description: '玄空飞星、八宅方位与居家参考', group: '占测民俗' },
  { id: 'mianxiang', name: '面相', glyph: '相', description: '五官十二宫与古籍条文对照', group: '占测民俗' },
  { id: 'dream', name: '周公解梦', glyph: '梦', description: '梦境分类、传统释义与现代提示', group: '占测民俗' },
]

export const xuanweiModuleMap = new Map(xuanweiModules.map(module => [module.id, module]))

export const xuanweiGroups = ['命理星曜', '易学术数', '占测民俗'] as const
