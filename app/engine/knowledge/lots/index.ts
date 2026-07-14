/**
 * engine/knowledge/lots/index.ts — 抽签解签（中立纪实版）
 *
 * 签文原文引自传统签诗，不做主观发挥。
 * 解读仅限于签文本身的字面解释。
 */

import { createEmptyMatrix } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

const GUANYIN_LOTS = [
  { id: 'lot-01', number: 1, level: '上上', poem: '天门一挂榜，预定夺标人。马嘶芳草地，秋高听鹿鸣。', note: '签文喻示榜上有名、秋日有成。' },
  { id: 'lot-02', number: 2, level: '中平', poem: '水清鱼不饵，空载月明归。不如守旧业，且待好风吹。', note: '签文以清水无鱼为喻，主张守成待时。' },
  { id: 'lot-03', number: 3, level: '上上', poem: '春雷一震百虫鸣，万物逢时各向荣。千年古镜重磨净，照破人间善恶情。', note: '签文以春雷喻时机，古镜喻明察。' },
  { id: 'lot-04', number: 4, level: '中平', poem: '云开月出正分明，不须进退问前程。守得云开见月明，自然心地放光明。', note: '签文以云开月出喻事态明朗。' },
  { id: 'lot-05', number: 5, level: '上吉', poem: '枯木逢春色欲华，顿然枝盛长萌芽。时人莫作为闲看，不是春时亦放花。', note: '签文以枯木逢春喻转机。' },
  { id: 'lot-06', number: 6, level: '下下', poem: '遇险不须忧，风波终自休。若逢真好事，还向旧根求。', note: '签文谓风波自息，宜回顾本根。' },
  { id: 'lot-07', number: 7, level: '中吉', poem: '一条金秤等君情，无减无增无重轻。为是平生心正直，文章不识义皆明。', note: '签文以金秤喻公平正直。' },
  { id: 'lot-08', number: 8, level: '上吉', poem: '月到天心人未知，忽然光彩满庭辉。劝君且守蓬窗下，自有高人指路歧。', note: '签文以月光忽现喻贵人之助。' },
  { id: 'lot-09', number: 9, level: '中平', poem: '龙潜于渊，阳之深藏。待时而动，自然无殃。', note: '签文以潜龙喻蛰伏待时。' },
  { id: 'lot-10', number: 10, level: '上上', poem: '凤凰翔于千仞兮，览德辉而下之。见则天下安宁兮，遇则万事和谐。', note: '签文以凤凰喻祥瑞和谐。' },
  { id: 'lot-11', number: 11, level: '中吉', poem: '欲求胜事可非常，争奈亲姻日暂忙。到头竟逐中原鹿，好向康庄大道行。', note: '签文以逐鹿喻竞争，终向坦途。' },
  { id: 'lot-12', number: 12, level: '中平', poem: '莫将戏事扰真情，且可随缘道自亨。有朝一日春雷动，得会风云上九重。', note: '签文谓勿为琐事所扰，随缘而行。' },
  { id: 'lot-13', number: 13, level: '下下', poem: '梦中得宝醒来无，应说巫山只是虚。若问婚姻并病讼，别寻生路得相宜。', note: '签文以梦醒宝失喻虚幻，宜另寻出路。' },
  { id: 'lot-14', number: 14, level: '上吉', poem: '宛如仙鹤出樊笼，脱却羁縻处处通。南北东西无障碍，任君直上九霄中。', note: '签文以鹤出樊笼喻摆脱束缚。' },
  { id: 'lot-15', number: 15, level: '中吉', poem: '行人路过白云边，正是春风二月天。若问行人归也未，落花流水两茫然。', note: '签文以落花流水喻归期未定。' },
  { id: 'lot-16', number: 16, level: '下下', poem: '暴风骤雨打残花，无限凄凉日又斜。谁道天公无报应，举头三尺有神查。', note: '签文以风雨残花喻困厄，但谓天理昭昭。' },
  { id: 'lot-17', number: 17, level: '中平', poem: '东风夜放花千树，更吹落、星如雨。宝马雕车香满路。', note: '签文取自辛弃疾词，喻繁华景象。' },
  { id: 'lot-18', number: 18, level: '上上', poem: '一轮明月照九州，几人欢乐几人愁。有缘千里来相会，无缘对面不须求。', note: '签文以月照九州喻缘分天定。' },
  { id: 'lot-19', number: 19, level: '中吉', poem: '锦上添花色愈鲜，运来时来禄相连。须臾变化成龙去，直上青霄步九天。', note: '签文以锦上添花喻好运叠加。' },
  { id: 'lot-20', number: 20, level: '中平', poem: '困龙得水时还泰，自有风云际会时。一朝引出群仙会，万里云霄任所之。', note: '签文以困龙得水喻转机。' }
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

export function drawLot(seed?: number): SymbolMatrix {
  const seedVal = seed ?? Date.now()
  const rand = seededRandom(seedVal)
  const idx = Math.floor(rand() * GUANYIN_LOTS.length)
  const lot = GUANYIN_LOTS[idx]
  const matrix = createEmptyMatrix('lots', `观音灵签 第${lot.number}签`)

  matrix.symbols.push({
    id: lot.id, name: `第${lot.number}签`, category: 'lot', position: '观音灵签',
    attributes: { level: lot.level, number: String(lot.number) }
  })
  matrix.derivedTags.push({
    id: `lot-level-${lot.level}`, name: lot.level, category: 'lotLevel', position: '签等',
    derivedFrom: [lot.id], attributes: { level: lot.level }
  })
  matrix.interpretations.push({
    id: `lot-${lot.number}-text`, ruleId: 'lot-display', category: 'general',
    text: `签诗：${lot.poem}\n释义：${lot.note}`, tone: 'neutral', weight: 80
  })
  return matrix
}

export { GUANYIN_LOTS }
