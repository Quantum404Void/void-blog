/**
 * engine/knowledge/bazi/branches.ts — 十二地支
 *
 * 数据来源：《渊海子平》《三命通会》
 * 十二地支各有阴阳五行、生肖、月份、时辰、藏干。
 *
 * 《渊海子平·论地支》：
 *   子丑寅卯辰巳午未申酉戌亥
 *
 * 藏干（地支所藏天干）依《三命通会·论人元司事》：
 *   子宫单癸水，丑宫己癸辛，寅宫甲丙戊，
 *   卯宫独乙木，辰宫戊乙癸，巳宫丙戊庚，
 *   午宫丁己土，未宫己丁乙，申宫庚壬戊，
 *   酉宫独辛金，戌宫戊辛丁，亥宫壬甲木。
 */

import type { SemanticTag } from '@/engine/types'

/** 十天干顺序（本地定义） */
const STEM_ORDER = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/**
 * 十二地支 — Earthly Branches
 */
export const EARTHLY_BRANCHES: SemanticTag[] = [
  {
    id: 'branch-zi',
    name: '子',
    category: 'branch',
    attributes: {
      yinYang: '阳',
      element: '水',
      animal: '鼠',
      month: '11',
      hour: '23-1',
      season: '冬',
      direction: '北',
      hiddenStems: '癸',
      number: '1'
    },
    description: '子水为阳水，藏癸水。仲冬之月，万物滋生。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-chou',
    name: '丑',
    category: 'branch',
    attributes: {
      yinYang: '阴',
      element: '土',
      animal: '牛',
      month: '12',
      hour: '1-3',
      season: '冬',
      direction: '东北',
      hiddenStems: '己,癸,辛',
      number: '2'
    },
    description: '丑土为阴土，藏己土癸水辛金。季冬之月，寒土凝冰。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-yin',
    name: '寅',
    category: 'branch',
    attributes: {
      yinYang: '阳',
      element: '木',
      animal: '虎',
      month: '1',
      hour: '3-5',
      season: '春',
      direction: '东北',
      hiddenStems: '甲,丙,戊',
      number: '3'
    },
    description: '寅木为阳木，藏甲木丙火戊土。孟春之月，万物生发。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-mao',
    name: '卯',
    category: 'branch',
    attributes: {
      yinYang: '阴',
      element: '木',
      animal: '兔',
      month: '2',
      hour: '5-7',
      season: '春',
      direction: '东',
      hiddenStems: '乙',
      number: '4'
    },
    description: '卯木为阴木，藏乙木。仲春之月，花草繁茂。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-chen',
    name: '辰',
    category: 'branch',
    attributes: {
      yinYang: '阳',
      element: '土',
      animal: '龙',
      month: '3',
      hour: '7-9',
      season: '春',
      direction: '东南',
      hiddenStems: '戊,乙,癸',
      number: '5'
    },
    description: '辰土为阳土，藏戊土乙木癸水。季春之月，水库之地。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-si',
    name: '巳',
    category: 'branch',
    attributes: {
      yinYang: '阴',
      element: '火',
      animal: '蛇',
      month: '4',
      hour: '9-11',
      season: '夏',
      direction: '东南',
      hiddenStems: '丙,戊,庚',
      number: '6'
    },
    description: '巳火为阴火，藏丙火戊土庚金。孟夏之月，火气渐旺。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-wu',
    name: '午',
    category: 'branch',
    attributes: {
      yinYang: '阳',
      element: '火',
      animal: '马',
      month: '5',
      hour: '11-13',
      season: '夏',
      direction: '南',
      hiddenStems: '丁,己',
      number: '7'
    },
    description: '午火为阳火，藏丁火己土。仲夏之月，火势炎炎。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-wei',
    name: '未',
    category: 'branch',
    attributes: {
      yinYang: '阴',
      element: '土',
      animal: '羊',
      month: '6',
      hour: '13-15',
      season: '夏',
      direction: '西南',
      hiddenStems: '己,丁,乙',
      number: '8'
    },
    description: '未土为阴土，藏己土丁火乙木。季夏之月，木库之地。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-shen',
    name: '申',
    category: 'branch',
    attributes: {
      yinYang: '阳',
      element: '金',
      animal: '猴',
      month: '7',
      hour: '15-17',
      season: '秋',
      direction: '西南',
      hiddenStems: '庚,壬,戊',
      number: '9'
    },
    description: '申金为阳金，藏庚金壬水戊土。孟秋之月，金气始盛。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-you',
    name: '酉',
    category: 'branch',
    attributes: {
      yinYang: '阴',
      element: '金',
      animal: '鸡',
      month: '8',
      hour: '17-19',
      season: '秋',
      direction: '西',
      hiddenStems: '辛',
      number: '10'
    },
    description: '酉金为阴金，藏辛金。仲秋之月，金气最旺。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-xu',
    name: '戌',
    category: 'branch',
    attributes: {
      yinYang: '阳',
      element: '土',
      animal: '狗',
      month: '9',
      hour: '19-21',
      season: '秋',
      direction: '西北',
      hiddenStems: '戊,辛,丁',
      number: '11'
    },
    description: '戌土为阳土，藏戊土辛金丁火。季秋之月，火库之地。',
    source: '《渊海子平》《三命通会》'
  },
  {
    id: 'branch-hai',
    name: '亥',
    category: 'branch',
    attributes: {
      yinYang: '阴',
      element: '水',
      animal: '猪',
      month: '10',
      hour: '21-23',
      season: '冬',
      direction: '西北',
      hiddenStems: '壬,甲',
      number: '12'
    },
    description: '亥水为阴水，藏壬水甲木。孟冬之月，水气渐旺。',
    source: '《渊海子平》《三命通会》'
  }
]

/** 地支名称 → ID 映射 */
export const BRANCH_BY_NAME: Record<string, string> = Object.fromEntries(
  EARTHLY_BRANCHES.map((b) => [b.name, b.id])
)

/** 地支顺序 */
export const BRANCH_ORDER = EARTHLY_BRANCHES.map((b) => b.name)

/**
 * 六十甲子表 — 天干地支组合
 * 甲子起，癸亥止，共六十组。
 */
export function getJiaziIndex(stem: string, branch: string): number {
  const si = STEM_ORDER.indexOf(stem)
  const bi = BRANCH_ORDER.indexOf(branch)
  if (si === -1 || bi === -1) return -1
  // 六十甲子: 从甲子(0)到癸亥(59)
  // 天干序号和地支序号之差必须是偶数（阳配阳，阴配阴）
  if ((si - bi) % 2 !== 0) return -1
  // index = (si * 6 + bi) mod 60 ... actually simpler:
  // 天干循环10，地支循环12，最小公倍数60
  // The traditional mapping: 甲子=0, 乙丑=1, ..., 癸亥=59
  // Since stems and branches advance together:
  // If we start with 甲(0)子(0): diff = 0, mod works
  // Next is 乙(1)丑(1): diff = 0
  // ...
  // When stem wraps: 甲(0)戌(10): diff = -10 mod 10 = 0, wait...
  // Actually it's simpler: find k such that:
  // stemIndex = (k * 1) % 10 => stemSeq maps to k % 10
  // branchIndex = (k * 1) % 12
  // So k ≡ si (mod 10) and k ≡ bi (mod 12)
  // Use Chinese Remainder Theorem: for each (stem, branch) pair,
  // there's at most one k in [0, 59]
  for (let k = 0; k < 60; k++) {
    if (k % 10 === si && k % 12 === bi) return k
  }
  return -1
}
