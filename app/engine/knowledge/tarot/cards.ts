/**
 * engine/knowledge/tarot/cards.ts — 塔罗牌数据
 *
 * 78张塔罗牌（22张大阿卡纳 + 56张小阿卡纳）
 * 数据来源：Rider-Waite-Smith 塔罗体系
 */

import type { SemanticTag } from '@/engine/types'

/** 大阿卡纳 (Major Arcana) — 22张 */
export const MAJOR_ARCANA: SemanticTag[] = [
  { id: 'tarot-0', name: '愚者', category: 'majorArcana', attributes: { number: '0', element: '风', planet: '天王星', meaning: '新的开始、冒险、天真' }, description: 'The Fool — 新的旅程，无限可能。如初生之犊，心怀梦想踏上征程。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-1', name: '魔术师', category: 'majorArcana', attributes: { number: '1', element: '风', planet: '水星', meaning: '创造力、技能、自信' }, description: 'The Magician — 拥有将想法变为现实的能力，时机成熟。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-2', name: '女祭司', category: 'majorArcana', attributes: { number: '2', element: '水', planet: '月亮', meaning: '直觉、智慧、神秘' }, description: 'The High Priestess — 倾听内心的声音，直觉会告诉你答案。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-3', name: '女皇', category: 'majorArcana', attributes: { number: '3', element: '土', planet: '金星', meaning: '丰饶、母性、美' }, description: 'The Empress — 丰收的季节，创造力与温暖的滋养。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-4', name: '皇帝', category: 'majorArcana', attributes: { number: '4', element: '火', planet: '白羊座', meaning: '权威、秩序、稳定' }, description: 'The Emperor — 建立规则与秩序，稳健前行。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-5', name: '教皇', category: 'majorArcana', attributes: { number: '5', element: '土', planet: '金牛座', meaning: '传统、信仰、指导' }, description: 'The Hierophant — 遵循内心的信念，寻求智慧的指引。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-6', name: '恋人', category: 'majorArcana', attributes: { number: '6', element: '风', planet: '双子座', meaning: '选择、爱情、和谐' }, description: 'The Lovers — 重要的选择时刻，听从心的声音。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-7', name: '战车', category: 'majorArcana', attributes: { number: '7', element: '水', planet: '巨蟹座', meaning: '意志力、胜利、前进' }, description: 'The Chariot — 坚定的意志是最大的武器，勇往直前。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-8', name: '力量', category: 'majorArcana', attributes: { number: '8', element: '火', planet: '狮子座', meaning: '勇气、内在力量、耐心' }, description: 'Strength — 真正的力量来自内心的温柔与坚韧。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-9', name: '隐士', category: 'majorArcana', attributes: { number: '9', element: '土', planet: '处女座', meaning: '内省、智慧、孤独' }, description: 'The Hermit — 暂别喧嚣，在独处中找到答案。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-10', name: '命运之轮', category: 'majorArcana', attributes: { number: '10', element: '火', planet: '木星', meaning: '命运、转折、机遇' }, description: 'Wheel of Fortune — 命运之轮转动，顺其自然，好运将至。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-11', name: '正义', category: 'majorArcana', attributes: { number: '11', element: '风', planet: '天秤座', meaning: '公正、因果、平衡' }, description: 'Justice — 种什么因得什么果，公平自会到来。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-12', name: '倒吊人', category: 'majorArcana', attributes: { number: '12', element: '水', planet: '海王星', meaning: '牺牲、换个角度、等待' }, description: 'The Hanged Man — 换个角度看世界，暂时的停滞是为了更大的飞跃。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-13', name: '死神', category: 'majorArcana', attributes: { number: '13', element: '水', planet: '天蝎座', meaning: '结束、转变、新生' }, description: 'Death — 旧的不去新的不来，这是重生的前奏。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-14', name: '节制', category: 'majorArcana', attributes: { number: '14', element: '火', planet: '射手座', meaning: '调和、适度、平衡' }, description: 'Temperance — 不疾不徐，找到生活的节奏与平衡。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-15', name: '恶魔', category: 'majorArcana', attributes: { number: '15', element: '土', planet: '摩羯座', meaning: '束缚、欲望、物质' }, description: 'The Devil — 看清束缚你的枷锁，觉醒就是解脱的开始。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-16', name: '高塔', category: 'majorArcana', attributes: { number: '16', element: '火', planet: '火星', meaning: '突变、崩塌、觉醒' }, description: 'The Tower — 旧结构崩塌，但废墟之上可以建起更高的楼。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-17', name: '星星', category: 'majorArcana', attributes: { number: '17', element: '风', planet: '水瓶座', meaning: '希望、治愈、宁静' }, description: 'The Star — 希望之光始终照耀，保持信念。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-18', name: '月亮', category: 'majorArcana', attributes: { number: '18', element: '水', planet: '双鱼座', meaning: '潜意识、恐惧、幻觉' }, description: 'The Moon — 面对内心的阴影，穿越迷雾方见光明。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-19', name: '太阳', category: 'majorArcana', attributes: { number: '19', element: '火', planet: '太阳', meaning: '快乐、成功、活力' }, description: 'The Sun — 阳光普照，一切都会好起来！', source: 'Rider-Waite-Smith' },
  { id: 'tarot-20', name: '审判', category: 'majorArcana', attributes: { number: '20', element: '火', planet: '冥王星', meaning: '觉醒、召唤、重生' }, description: 'Judgement — 听从内心的召唤，是时候重新出发了。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-21', name: '世界', category: 'majorArcana', attributes: { number: '21', element: '土', planet: '土星', meaning: '完成、圆满、旅程' }, description: 'The World — 一个循环的圆满结束，新的旅程即将开启。', source: 'Rider-Waite-Smith' }
]

/** 塔罗牌阵定义 */
export const SPREADS = {
  single: {
    name: '单张牌',
    positions: [{ id: 'center', label: '今日指引' }]
  },
  three: {
    name: '三张牌阵',
    positions: [
      { id: 'past', label: '过去' },
      { id: 'present', label: '现在' },
      { id: 'future', label: '未来' }
    ]
  },
  celtic: {
    name: '凯尔特十字',
    positions: [
      { id: 'core', label: '核心' },
      { id: 'cross', label: '阻碍' },
      { id: 'foundation', label: '根基' },
      { id: 'past', label: '过去' },
      { id: 'crown', label: '目标' },
      { id: 'future', label: '未来' },
      { id: 'self', label: '自我' },
      { id: 'environment', label: '环境' },
      { id: 'hopes', label: '希望' },
      { id: 'outcome', label: '结果' }
    ]
  }
}

/** 小阿卡纳 (Minor Arcana) — 56张，4组花色各14张 */
export const MINOR_ARCANA: SemanticTag[] = [
  // ── 权杖 Wands (火) ──
  { id: 'tarot-wa01', name: '权杖王牌', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: 'ace', meaning: '新的行动、创造力、灵感' }, description: 'Ace of Wands — 新的创造性行动的萌芽。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa02', name: '权杖二', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '2', meaning: '规划、展望未来、决策' }, description: 'Two of Wands — 手握地球仪望向远方，谋划未来。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa03', name: '权杖三', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '3', meaning: '远见、扩展、商业' }, description: 'Three of Wands — 站在岸边瞭望，期待船只归来。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa04', name: '权杖四', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '4', meaning: '庆祝、和谐、稳定' }, description: 'Four of Wands — 花环装饰的庆典场景，欢乐与安居。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa05', name: '权杖五', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '5', meaning: '竞争、冲突、挑战' }, description: 'Five of Wands — 五人各持权杖相争，激烈的竞争场面。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa06', name: '权杖六', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '6', meaning: '胜利、认可、凯旋' }, description: 'Six of Wands — 戴着桂冠骑马而归，众人欢呼。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa07', name: '权杖七', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '7', meaning: '坚守、防御、勇气' }, description: 'Seven of Wands — 一人站在高处抵御六根权杖的攻击。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa08', name: '权杖八', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '8', meaning: '迅速、行动、消息' }, description: 'Eight of Wands — 八根权杖在空中飞驰，快速推进。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa09', name: '权杖九', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '9', meaning: '警惕、坚持、最后的考验' }, description: 'Nine of Wands — 受伤但仍紧握权杖，保持警觉。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa10', name: '权杖十', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: '10', meaning: '负担、责任、压力' }, description: 'Ten of Wands — 怀抱十根权杖艰难前行，重担在肩。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa11', name: '权杖侍从', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: 'page', meaning: '热情、探索、新消息' }, description: 'Page of Wands — 手持权杖的年轻探索者。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa12', name: '权杖骑士', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: 'knight', meaning: '行动、冒险、冲动' }, description: 'Knight of Wands — 骑马的骑士，勇往直前。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa13', name: '权杖王后', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: 'queen', meaning: '自信、热情、领导力' }, description: 'Queen of Wands — 坐在宝座上手持向日葵与权杖。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-wa14', name: '权杖国王', category: 'minorArcana', attributes: { suit: 'wands', element: '火', rank: 'king', meaning: '远见、创业、荣誉' }, description: 'King of Wands — 威严的国王手持开花的权杖。', source: 'Rider-Waite-Smith' },
  // ── 圣杯 Cups (水) ──
  { id: 'tarot-cu01', name: '圣杯王牌', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: 'ace', meaning: '新感情、直觉、丰裕' }, description: 'Ace of Cups — 圣杯中涌出清泉，象征情感的源头。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu02', name: '圣杯二', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '2', meaning: '结合、伙伴关系、吸引力' }, description: 'Two of Cups — 男女各持圣杯对视，和谐的联结。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu03', name: '圣杯三', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '3', meaning: '欢庆、友谊、团聚' }, description: 'Three of Cups — 三位女子举杯欢庆，丰收喜悦。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu04', name: '圣杯四', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '4', meaning: '沉思、不满、冷漠' }, description: 'Four of Cups — 树下坐着的人对三杯视而不见。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu05', name: '圣杯五', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '5', meaning: '失落、悲伤、遗憾' }, description: 'Five of Cups — 黑袍人低头看着倾倒的三杯。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu06', name: '圣杯六', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '6', meaning: '回忆、怀旧、童年' }, description: 'Six of Cups — 男孩给女孩递花，温馨的回忆场景。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu07', name: '圣杯七', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '7', meaning: '幻想、选择、诱惑' }, description: 'Seven of Cups — 云中浮现七个杯子，各放奇异之物。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu08', name: '圣杯八', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '8', meaning: '离开、追寻、更高追求' }, description: 'Eight of Cups — 转身离开八只杯子的背影。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu09', name: '圣杯九', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '9', meaning: '满足、愿望实现、自得' }, description: 'Nine of Cups — 满足地坐在九只圣杯前的人。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu10', name: '圣杯十', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: '10', meaning: '圆满、家庭幸福、和谐' }, description: 'Ten of Cups — 彩虹下拥抱的夫妻与欢跳的孩子。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu11', name: '圣杯侍从', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: 'page', meaning: '直觉、敏感、创意' }, description: 'Page of Cups — 手持杯中跃出鱼儿的少年。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu12', name: '圣杯骑士', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: 'knight', meaning: '浪漫、追求理想、邀约' }, description: 'Knight of Cups — 骑白马的浪漫骑士。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu13', name: '圣杯王后', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: 'queen', meaning: '同情心、直觉、滋养' }, description: 'Queen of Cups — 凝视华丽圣杯的慈祥王后。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-cu14', name: '圣杯国王', category: 'minorArcana', attributes: { suit: 'cups', element: '水', rank: 'king', meaning: '情感成熟、宽容、艺术' }, description: 'King of Cups — 坐在海上的沉稳国王。', source: 'Rider-Waite-Smith' },
  // ── 宝剑 Swords (风) ──
  { id: 'tarot-sw01', name: '宝剑王牌', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: 'ace', meaning: '清晰、真理、新思维' }, description: 'Ace of Swords — 云中伸出的手高举宝剑，象征真理。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw02', name: '宝剑二', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '2', meaning: '僵局、抉择、逃避' }, description: 'Two of Swords — 蒙眼女子交叉双剑坐于海边。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw03', name: '宝剑三', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '3', meaning: '心碎、悲伤、分离' }, description: 'Three of Swords — 三把剑穿过一颗红心，背景雨中。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw04', name: '宝剑四', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '4', meaning: '休息、冥想、恢复' }, description: 'Four of Swords — 躺在教堂中休息的骑士雕像。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw05', name: '宝剑五', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '5', meaning: '冲突、失败、空虚的胜利' }, description: 'Five of Swords — 胜利者回头看着两位落败者。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw06', name: '宝剑六', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '6', meaning: '过渡、疗伤、远行' }, description: 'Six of Swords — 船夫载着母子渡过平静的水面。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw07', name: '宝剑七', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '7', meaning: '策略、欺骗、偷跑' }, description: 'Seven of Swords — 偷偷抱走五把剑的人。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw08', name: '宝剑八', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '8', meaning: '束缚、限制、无助' }, description: 'Eight of Swords — 被绑缚在剑阵中的蒙眼女子。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw09', name: '宝剑九', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '9', meaning: '焦虑、噩梦、恐惧' }, description: 'Nine of Swords — 深夜坐起掩面哭泣的人。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw10', name: '宝剑十', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: '10', meaning: '终结、最低点、解脱' }, description: 'Ten of Swords — 背插十剑的人，地平线上曙光初现。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw11', name: '宝剑侍从', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: 'page', meaning: '警觉、好奇、新想法' }, description: 'Page of Swords — 举剑迎风的警觉少年。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw12', name: '宝剑骑士', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: 'knight', meaning: '果断、冲锋、迅速' }, description: 'Knight of Swords — 全速冲锋的骑士。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw13', name: '宝剑王后', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: 'queen', meaning: '独立、敏锐、理性' }, description: 'Queen of Swords — 一手举剑一手伸出的威严王后。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-sw14', name: '宝剑国王', category: 'minorArcana', attributes: { suit: 'swords', element: '风', rank: 'king', meaning: '权威、公正、逻辑' }, description: 'King of Swords — 端坐王位的理性裁决者。', source: 'Rider-Waite-Smith' },
  // ── 星币 Pentacles (土) ──
  { id: 'tarot-pe01', name: '星币王牌', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: 'ace', meaning: '新机会、繁荣、物质' }, description: 'Ace of Pentacles — 云中伸出的手托着一枚金色星币。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe02', name: '星币二', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '2', meaning: '平衡、变通、多任务' }, description: 'Two of Pentacles — 耍弄两枚星币的杂耍者。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe03', name: '星币三', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '3', meaning: '团队合作、技艺、规划' }, description: 'Three of Pentacles — 工匠与建筑师讨论图纸。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe04', name: '星币四', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '4', meaning: '固守、节俭、安全感' }, description: 'Four of Pentacles — 紧紧抱住四枚星币的人。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe05', name: '星币五', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '5', meaning: '匮乏、困境、被忽视' }, description: 'Five of Pentacles — 雪夜中相互搀扶的贫苦路人。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe06', name: '星币六', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '6', meaning: '施与受、慈善、平衡' }, description: 'Six of Pentacles — 商人用天平分钱给乞丐。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe07', name: '星币七', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '7', meaning: '评估、耐心、等待收获' }, description: 'Seven of Pentacles — 农夫倚锄看着生长的作物。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe08', name: '星币八', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '8', meaning: '勤奋、技艺、专注' }, description: 'Eight of Pentacles — 专注雕刻星币的工匠。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe09', name: '星币九', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '9', meaning: '独立、富足、享受' }, description: 'Nine of Pentacles — 在葡萄园中优雅散步的女子。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe10', name: '星币十', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: '10', meaning: '财富、传承、家族' }, description: 'Ten of Pentacles — 庭院中老人与孩童的富足场景。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe11', name: '星币侍从', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: 'page', meaning: '学习、实践、新技能' }, description: 'Page of Pentacles — 专注凝视星币的勤奋少年。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe12', name: '星币骑士', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: 'knight', meaning: '可靠、耐心、稳步前进' }, description: 'Knight of Pentacles — 骑黑马的稳重骑士。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe13', name: '星币王后', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: 'queen', meaning: '慷慨、务实、滋养' }, description: 'Queen of Pentacles — 在繁茂花园中端详星币的王后。', source: 'Rider-Waite-Smith' },
  { id: 'tarot-pe14', name: '星币国王', category: 'minorArcana', attributes: { suit: 'pentacles', element: '土', rank: 'king', meaning: '富足、稳健、商业头脑' }, description: 'King of Pentacles — 坐在葡萄藤王座上的富足国王。', source: 'Rider-Waite-Smith' }
]
