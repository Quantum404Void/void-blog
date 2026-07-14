/**
 * engine/knowledge/mianxiang/index.ts — 面相（古籍参考）
 *
 * 数据来源：《麻衣相法》(宋·麻衣道者)、《柳庄相法》(明·袁珙)
 * 面相模块为古籍知识查阅，不涉及AI人脸扫描。
 * 用户选择面部部位后，查阅该部位在相书中的各种形态及其含义。
 */

import { createEmptyMatrix } from '@/engine/types'
import type { SymbolMatrix } from '@/engine/types'

/** 各部位相书条文 */
const REFERENCES: Record<string, { form: string; meaning: string }[]> = {
  '眉': [
    { form: '眉长过目', meaning: '兄弟和睦，朋友众多。' },
    { form: '眉清目秀', meaning: '心思细腻，聪慧过人。' },
    { form: '眉粗压目', meaning: '性格急躁，果敢有魄力。' },
    { form: '眉间宽广', meaning: '心胸开阔，不斤斤计较。' },
    { form: '眉疏淡薄', meaning: '性格淡泊，不慕名利。' },
    { form: '双眉相交', meaning: '心胸狭窄，易生嫉妒。' },
    { form: '眉尾上扬', meaning: '志向高远，不甘平庸。' },
    { form: '眉尾下垂', meaning: '性情温和，处事低调。' },
    { form: '眉毛逆生', meaning: '性格叛逆，不循常规。' },
    { form: '眉有彩毫', meaning: '主大贵，为大器晚成之相。' }
  ],
  '眼': [
    { form: '目有神采', meaning: '精力充沛，处事精明。' },
    { form: '眼大明亮', meaning: '性格开朗，待人热情。' },
    { form: '眼细而长', meaning: '深思熟虑，智慧超群。' },
    { form: '眼角下垂', meaning: '性格温和，心地善良。' },
    { form: '三白眼', meaning: '性格刚强，不轻易妥协。' },
    { form: '眼白多黑少', meaning: '性情急躁，易冲动行事。' },
    { form: '凤眼修长', meaning: '聪慧秀丽，异性缘佳。' },
    { form: '龙目圆睁', meaning: '威仪不凡，有将帅之风。' },
    { form: '桃花眼', meaning: '人缘极好，异性缘旺。' },
    { form: '眼尾有痣', meaning: '感情丰富，易动真情。' }
  ],
  '鼻': [
    { form: '鼻梁高挺', meaning: '自信心强，有志竟成。' },
    { form: '鼻头圆润', meaning: '财运亨通，善理财。' },
    { form: '鼻翼丰满', meaning: '善于储蓄，不挥霍。' },
    { form: '鼻直口方', meaning: '为人正直，言行一致。' },
    { form: '山根高耸', meaning: '多得贵人相助。' },
    { form: '狮鼻肥大', meaning: '财源广进，富贵之相。' },
    { form: '鹰钩鼻', meaning: '精明算计，善于谋划。' },
    { form: '鼻梁塌陷', meaning: '自信心不足，需外力扶持。' },
    { form: '准头有肉', meaning: '中年财运亨通。' },
    { form: '鼻如悬胆', meaning: '福寿双全之相。' }
  ],
  '口': [
    { form: '口角上扬', meaning: '天性乐观，积极向上。' },
    { form: '唇红齿白', meaning: '身体健康，精力充沛。' },
    { form: '口小如樱', meaning: '气质秀雅，不善言辞。' },
    { form: '唇薄者', meaning: '口才出众，善于辩论。' },
    { form: '唇厚者', meaning: '重感情，为人忠厚。' },
    { form: '口大容拳', meaning: '气魄不凡，有领导力。' },
    { form: '口如吹火', meaning: '多言好辩，易惹是非。' },
    { form: '嘴角生痣', meaning: '食禄丰厚，口福不浅。' }
  ],
  '耳': [
    { form: '耳高于眉', meaning: '聪慧早达，少年成名。' },
    { form: '耳垂厚大', meaning: '福寿双全，晚年安康。' },
    { form: '耳廓分明', meaning: '性格果断，有决策力。' },
    { form: '贴脑耳', meaning: '机敏灵活，适应力强。' },
    { form: '招风耳', meaning: '好动好奇，不喜拘束。' },
    { form: '耳如棋子', meaning: '聪慧过人，善解人意。' },
    { form: '耳有轮珠', meaning: '祖业丰厚，福荫深厚。' },
    { form: '耳薄如纸', meaning: '体质较弱，需注意养生。' }
  ],
  '额': [
    { form: '天庭饱满', meaning: '少年得志，早发之相。' },
    { form: '额头宽阔', meaning: '智慧超群，思维开阔。' },
    { form: '额有伏犀', meaning: '大贵之相，官运亨通。' },
    { form: '额窄发低', meaning: '早年辛劳，晚来方成。' },
    { form: '额有横纹', meaning: '操心劳碌，思虑过多。' },
    { form: '额如覆肝', meaning: '贵人提携，仕途顺遂。' }
  ],
  '颧': [
    { form: '颧骨高耸', meaning: '手握权柄，有领导力。' },
    { form: '颧与鼻配', meaning: '威严自立，不怒而威。' },
    { form: '颧削平滑', meaning: '性格温和，不喜争斗。' },
    { form: '颧有肉包', meaning: '福气深厚，人缘极好。' },
    { form: '颧骨横张', meaning: '好斗好胜，易惹是非。' }
  ],
  '下巴': [
    { form: '地阁方圆', meaning: '晚年运势佳，福寿安康。' },
    { form: '下巴丰满', meaning: '善于积蓄，晚景丰隆。' },
    { form: '下巴尖削', meaning: '晚景平淡，需早作规划。' },
    { form: '双下巴', meaning: '福气深厚，衣食无忧。' },
    { form: '下巴后缩', meaning: '意志力薄弱，需外力推动。' }
  ]
}

export function mianxiangLookup(feature: string): SymbolMatrix {
  const matrix = createEmptyMatrix('mianxiang', `面相查阅: ${feature}`)
  const entries = REFERENCES[feature]

  if (entries) {
    matrix.symbols.push({ id: `mx-${feature}`, name: feature, category: 'mianxiang', position: feature, attributes: { count: String(entries.length) } })
    const lines = entries.map((e, i) => `${i + 1}. ${e.form}：${e.meaning}`)
    matrix.interpretations.push({
      id: `mx-${feature}-ref`, ruleId: 'mianxiang-ref', category: 'general',
      text: `【${feature}】相书条文（《麻衣相法》）：\n${lines.join('\n')}`,
      tone: 'neutral', source: '《麻衣相法》', weight: 80,
      modernNote: '面相学为古代观人术，以面部形态特征推断性格与运势。现代视角下可视为一种人格类型学的朴素表达。'
    })
  } else {
    matrix.interpretations.push({
      id: 'mx-notfound', ruleId: 'mianxiang', category: 'general',
      text: `未找到"${feature}"的相关条文。可选部位：眉、眼、鼻、口、耳、额、颧、下巴。`,
      tone: 'neutral', weight: 50
    })
  }

  return matrix
}
