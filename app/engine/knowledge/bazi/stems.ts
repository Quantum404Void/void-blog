/**
 * engine/knowledge/bazi/stems.ts — 十天干
 *
 * 数据来源：《渊海子平》《三命通会》《滴天髓》
 * 十天干分阴阳五行，各有方位、季节、脏腑、颜色等属性。
 */

import type { SemanticTag } from '@/engine/types'

/**
 * 十天干 — Heavenly Stems
 *
 * 甲(jia3) 乙(yi3) 丙(bing3) 丁(ding1) 戊(wu4) 己(ji3) 庚(geng1) 辛(xin1) 壬(ren2) 癸(gui3)
 *
 * 《渊海子平·论天干》：
 *   东方甲乙木，南方丙丁火，中央戊己土，西方庚辛金，北方壬癸水。
 *
 * 《滴天髓·天干论》：
 *   甲木参天，脱胎要火。乙木虽柔，刲羊解牛。
 *   丙火猛烈，欺霜侮雪。丁火柔中，内性昭融。
 *   戊土固重，既中且正。己土卑湿，中正蓄藏。
 *   庚金带煞，刚健为最。辛金软弱，温润而清。
 *   壬水通河，能泄金气。癸水至弱，达于天津。
 */
export const HEAVENLY_STEMS: SemanticTag[] = [
  {
    id: 'stem-jia',
    name: '甲',
    category: 'stem',
    attributes: {
      yinYang: '阳',
      element: '木',
      direction: '东',
      season: '春',
      organ: '胆',
      color: '青',
      number: '1',
      note: '参天之木，栋梁之材'
    },
    description: '甲木为阳木，如参天大树，主仁德、正直、领导',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-yi',
    name: '乙',
    category: 'stem',
    attributes: {
      yinYang: '阴',
      element: '木',
      direction: '东',
      season: '春',
      organ: '肝',
      color: '绿',
      number: '2',
      note: '花草之木，柔韧婉转'
    },
    description: '乙木为阴木，如花草藤萝，主柔顺、适应、艺术',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-bing',
    name: '丙',
    category: 'stem',
    attributes: {
      yinYang: '阳',
      element: '火',
      direction: '南',
      season: '夏',
      organ: '小肠',
      color: '红',
      number: '3',
      note: '太阳之火，光明磊落'
    },
    description: '丙火为阳火，如烈日当空，主热情、光明、礼仪',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-ding',
    name: '丁',
    category: 'stem',
    attributes: {
      yinYang: '阴',
      element: '火',
      direction: '南',
      season: '夏',
      organ: '心',
      color: '紫',
      number: '4',
      note: '灯烛之火，内性昭融'
    },
    description: '丁火为阴火，如灯烛星光，主智慧、文采、细腻',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-wu',
    name: '戊',
    category: 'stem',
    attributes: {
      yinYang: '阳',
      element: '土',
      direction: '中',
      season: '长夏',
      organ: '胃',
      color: '黄',
      number: '5',
      note: '城墙之土，厚重诚信'
    },
    description: '戊土为阳土，如城墙堤坝，主诚信、厚重、包容',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-ji',
    name: '己',
    category: 'stem',
    attributes: {
      yinYang: '阴',
      element: '土',
      direction: '中',
      season: '长夏',
      organ: '脾',
      color: '棕',
      number: '6',
      note: '田园之土，滋养万物'
    },
    description: '己土为阴土，如田园土壤，主滋养、细腻、策划',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-geng',
    name: '庚',
    category: 'stem',
    attributes: {
      yinYang: '阳',
      element: '金',
      direction: '西',
      season: '秋',
      organ: '大肠',
      color: '白',
      number: '7',
      note: '斧钺之金，刚健带煞'
    },
    description: '庚金为阳金，如刀剑斧钺，主义气、刚强、变革',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-xin',
    name: '辛',
    category: 'stem',
    attributes: {
      yinYang: '阴',
      element: '金',
      direction: '西',
      season: '秋',
      organ: '肺',
      color: '银',
      number: '8',
      note: '珠玉之金，温润清秀'
    },
    description: '辛金为阴金，如金银珠玉，主精致、审美、敏锐',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-ren',
    name: '壬',
    category: 'stem',
    attributes: {
      yinYang: '阳',
      element: '水',
      direction: '北',
      season: '冬',
      organ: '膀胱',
      color: '黑',
      number: '9',
      note: '江河之水，奔流不息'
    },
    description: '壬水为阳水，如江河湖海，主智慧、流通、变通',
    source: '《渊海子平》《滴天髓》'
  },
  {
    id: 'stem-gui',
    name: '癸',
    category: 'stem',
    attributes: {
      yinYang: '阴',
      element: '水',
      direction: '北',
      season: '冬',
      organ: '肾',
      color: '蓝',
      number: '10',
      note: '雨露之水，至弱至柔'
    },
    description: '癸水为阴水，如雨露甘霖，主机敏、细腻、内敛',
    source: '《渊海子平》《滴天髓》'
  }
]

/** 天干名称 → ID 映射 */
export const STEM_BY_NAME: Record<string, string> = Object.fromEntries(
  HEAVENLY_STEMS.map((s) => [s.name, s.id])
)

/** 天干顺序列表 */
export const STEM_ORDER = HEAVENLY_STEMS.map((s) => s.name)
