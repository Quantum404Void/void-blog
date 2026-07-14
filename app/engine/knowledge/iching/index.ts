/**
 * engine/knowledge/iching/index.ts — 易经六十四卦
 *
 * 数据来源：《周易》—— 卦辞、大象传原文
 * 六十四卦完整数据（上经30卦 + 下经34卦），每卦含卦名、卦辞、大象传。
 *
 * 基础八卦：☰乾 ☷坤 ☳震 ☴巽 ☵坎 ☲离 ☶艮 ☱兑
 */

import type { MatrixSymbol, SymbolMatrix } from '@/engine/types'
import { createEmptyMatrix } from '@/engine/types'

export const TRIGRAMS: MatrixSymbol[] = [
  { id: 'trigram-qian', name: '乾', category: 'trigram', position: '上/下卦', attributes: { element: '金', nature: '天', attribute: '健', number: '1', yaoSeq: '111' } },
  { id: 'trigram-dui', name: '兑', category: 'trigram', position: '上/下卦', attributes: { element: '金', nature: '泽', attribute: '悦', number: '2', yaoSeq: '110' } },
  { id: 'trigram-li', name: '离', category: 'trigram', position: '上/下卦', attributes: { element: '火', nature: '火', attribute: '丽', number: '3', yaoSeq: '101' } },
  { id: 'trigram-zhen', name: '震', category: 'trigram', position: '上/下卦', attributes: { element: '木', nature: '雷', attribute: '动', number: '4', yaoSeq: '100' } },
  { id: 'trigram-xun', name: '巽', category: 'trigram', position: '上/下卦', attributes: { element: '木', nature: '风', attribute: '入', number: '5', yaoSeq: '011' } },
  { id: 'trigram-kan', name: '坎', category: 'trigram', position: '上/下卦', attributes: { element: '水', nature: '水', attribute: '陷', number: '6', yaoSeq: '010' } },
  { id: 'trigram-gen', name: '艮', category: 'trigram', position: '上/下卦', attributes: { element: '土', nature: '山', attribute: '止', number: '7', yaoSeq: '001' } },
  { id: 'trigram-kun', name: '坤', category: 'trigram', position: '上/下卦', attributes: { element: '土', nature: '地', attribute: '顺', number: '8', yaoSeq: '000' } }
]

export interface Hexagram {
  id: string; number: number; name: string
  upperTrigram: string; lowerTrigram: string
  judgement: string; image: string
}

export const HEXAGRAMS: Hexagram[] = [
  { id: 'hexagram-01', number: 1, name: '乾为天', upperTrigram: '乾', lowerTrigram: '乾', judgement: '乾：元，亨，利，贞。', image: '天行健，君子以自强不息。' },
  { id: 'hexagram-02', number: 2, name: '坤为地', upperTrigram: '坤', lowerTrigram: '坤', judgement: '坤：元，亨，利牝马之贞。君子有攸往，先迷后得主，利。', image: '地势坤，君子以厚德载物。' },
  { id: 'hexagram-03', number: 3, name: '水雷屯', upperTrigram: '坎', lowerTrigram: '震', judgement: '屯：元亨利贞。勿用有攸往，利建侯。', image: '云雷，屯。君子以经纶。' },
  { id: 'hexagram-04', number: 4, name: '山水蒙', upperTrigram: '艮', lowerTrigram: '坎', judgement: '蒙：亨。匪我求童蒙，童蒙求我。', image: '山下出泉，蒙。君子以果行育德。' },
  { id: 'hexagram-05', number: 5, name: '水天需', upperTrigram: '坎', lowerTrigram: '乾', judgement: '需：有孚，光亨，贞吉。利涉大川。', image: '云上于天，需。君子以饮食宴乐。' },
  { id: 'hexagram-06', number: 6, name: '天水讼', upperTrigram: '乾', lowerTrigram: '坎', judgement: '讼：有孚窒惕，中吉，终凶。利见大人，不利涉大川。', image: '天与水违行，讼。君子以作事谋始。' },
  { id: 'hexagram-07', number: 7, name: '地水师', upperTrigram: '坤', lowerTrigram: '坎', judgement: '师：贞，丈人吉，无咎。', image: '地中有水，师。君子以容民畜众。' },
  { id: 'hexagram-08', number: 8, name: '水地比', upperTrigram: '坎', lowerTrigram: '坤', judgement: '比：吉。原筮，元永贞，无咎。不宁方来，后夫凶。', image: '地上有水，比。先王以建万国，亲诸侯。' },
  { id: 'hexagram-09', number: 9, name: '风天小畜', upperTrigram: '巽', lowerTrigram: '乾', judgement: '小畜：亨。密云不雨，自我西郊。', image: '风行天上，小畜。君子以懿文德。' },
  { id: 'hexagram-10', number: 10, name: '天泽履', upperTrigram: '乾', lowerTrigram: '兑', judgement: '履虎尾，不咥人，亨。', image: '上天下泽，履。君子以辨上下，定民志。' },
  { id: 'hexagram-11', number: 11, name: '地天泰', upperTrigram: '坤', lowerTrigram: '乾', judgement: '泰：小往大来，吉亨。', image: '天地交，泰。后以财成天地之道，辅相天地之宜，以左右民。' },
  { id: 'hexagram-12', number: 12, name: '天地否', upperTrigram: '乾', lowerTrigram: '坤', judgement: '否之匪人，不利君子贞。大往小来。', image: '天地不交，否。君子以俭德辟难，不可荣以禄。' },
  { id: 'hexagram-13', number: 13, name: '天火同人', upperTrigram: '乾', lowerTrigram: '离', judgement: '同人于野，亨。利涉大川，利君子贞。', image: '天与火，同人。君子以类族辨物。' },
  { id: 'hexagram-14', number: 14, name: '火天大有', upperTrigram: '离', lowerTrigram: '乾', judgement: '大有：元亨。', image: '火在天上，大有。君子以遏恶扬善，顺天休命。' },
  { id: 'hexagram-15', number: 15, name: '地山谦', upperTrigram: '坤', lowerTrigram: '艮', judgement: '谦：亨，君子有终。', image: '地中有山，谦。君子以裒多益寡，称物平施。' },
  { id: 'hexagram-16', number: 16, name: '雷地豫', upperTrigram: '震', lowerTrigram: '坤', judgement: '豫：利建侯行师。', image: '雷出地奋，豫。先王以作乐崇德，殷荐之上帝，以配祖考。' },
  { id: 'hexagram-17', number: 17, name: '泽雷随', upperTrigram: '兑', lowerTrigram: '震', judgement: '随：元亨利贞，无咎。', image: '泽中有雷，随。君子以向晦入宴息。' },
  { id: 'hexagram-18', number: 18, name: '山风蛊', upperTrigram: '艮', lowerTrigram: '巽', judgement: '蛊：元亨，利涉大川。先甲三日，后甲三日。', image: '山下有风，蛊。君子以振民育德。' },
  { id: 'hexagram-19', number: 19, name: '地泽临', upperTrigram: '坤', lowerTrigram: '兑', judgement: '临：元亨利贞。至于八月有凶。', image: '泽上有地，临。君子以教思无穷，容保民无疆。' },
  { id: 'hexagram-20', number: 20, name: '风地观', upperTrigram: '巽', lowerTrigram: '坤', judgement: '观：盥而不荐，有孚颙若。', image: '风行地上，观。先王以省方，观民设教。' },
  { id: 'hexagram-21', number: 21, name: '火雷噬嗑', upperTrigram: '离', lowerTrigram: '震', judgement: '噬嗑：亨。利用狱。', image: '雷电，噬嗑。先王以明罚敕法。' },
  { id: 'hexagram-22', number: 22, name: '山火贲', upperTrigram: '艮', lowerTrigram: '离', judgement: '贲：亨。小利有攸往。', image: '山下有火，贲。君子以明庶政，无敢折狱。' },
  { id: 'hexagram-23', number: 23, name: '山地剥', upperTrigram: '艮', lowerTrigram: '坤', judgement: '剥：不利有攸往。', image: '山附于地，剥。上以厚下安宅。' },
  { id: 'hexagram-24', number: 24, name: '地雷复', upperTrigram: '坤', lowerTrigram: '震', judgement: '复：亨。出入无疾，朋来无咎。反复其道，七日来复，利有攸往。', image: '雷在地中，复。先王以至日闭关，商旅不行，后不省方。' },
  { id: 'hexagram-25', number: 25, name: '天雷无妄', upperTrigram: '乾', lowerTrigram: '震', judgement: '无妄：元亨利贞。其匪正有眚，不利有攸往。', image: '天下雷行，物与无妄。先王以茂对时，育万物。' },
  { id: 'hexagram-26', number: 26, name: '山天大畜', upperTrigram: '艮', lowerTrigram: '乾', judgement: '大畜：利贞，不家食吉，利涉大川。', image: '天在山中，大畜。君子以多识前言往行，以畜其德。' },
  { id: 'hexagram-27', number: 27, name: '山雷颐', upperTrigram: '艮', lowerTrigram: '震', judgement: '颐：贞吉。观颐，自求口实。', image: '山下有雷，颐。君子以慎言语，节饮食。' },
  { id: 'hexagram-28', number: 28, name: '泽风大过', upperTrigram: '兑', lowerTrigram: '巽', judgement: '大过：栋桡，利有攸往，亨。', image: '泽灭木，大过。君子以独立不惧，遁世无闷。' },
  { id: 'hexagram-29', number: 29, name: '坎为水', upperTrigram: '坎', lowerTrigram: '坎', judgement: '习坎：有孚，维心亨，行有尚。', image: '水洊至，习坎。君子以常德行，习教事。' },
  { id: 'hexagram-30', number: 30, name: '离为火', upperTrigram: '离', lowerTrigram: '离', judgement: '离：利贞，亨。畜牝牛，吉。', image: '明两作，离。大人以继明照于四方。' },
  { id: 'hexagram-31', number: 31, name: '泽山咸', upperTrigram: '兑', lowerTrigram: '艮', judgement: '咸：亨，利贞，取女吉。', image: '山上有泽，咸。君子以虚受人。' },
  { id: 'hexagram-32', number: 32, name: '雷风恒', upperTrigram: '震', lowerTrigram: '巽', judgement: '恒：亨，无咎，利贞，利有攸往。', image: '雷风，恒。君子以立不易方。' },
  { id: 'hexagram-33', number: 33, name: '天山遁', upperTrigram: '乾', lowerTrigram: '艮', judgement: '遁：亨，小利贞。', image: '天下有山，遁。君子以远小人，不恶而严。' },
  { id: 'hexagram-34', number: 34, name: '雷天大壮', upperTrigram: '震', lowerTrigram: '乾', judgement: '大壮：利贞。', image: '雷在天上，大壮。君子以非礼弗履。' },
  { id: 'hexagram-35', number: 35, name: '火地晋', upperTrigram: '离', lowerTrigram: '坤', judgement: '晋：康侯用锡马蕃庶，昼日三接。', image: '明出地上，晋。君子以自昭明德。' },
  { id: 'hexagram-36', number: 36, name: '地火明夷', upperTrigram: '坤', lowerTrigram: '离', judgement: '明夷：利艰贞。', image: '明入地中，明夷。君子以莅众，用晦而明。' },
  { id: 'hexagram-37', number: 37, name: '风火家人', upperTrigram: '巽', lowerTrigram: '离', judgement: '家人：利女贞。', image: '风自火出，家人。君子以言有物，而行有恒。' },
  { id: 'hexagram-38', number: 38, name: '火泽睽', upperTrigram: '离', lowerTrigram: '兑', judgement: '睽：小事吉。', image: '上火下泽，睽。君子以同而异。' },
  { id: 'hexagram-39', number: 39, name: '水山蹇', upperTrigram: '坎', lowerTrigram: '艮', judgement: '蹇：利西南，不利东北。利见大人，贞吉。', image: '山上有水，蹇。君子以反身修德。' },
  { id: 'hexagram-40', number: 40, name: '雷水解', upperTrigram: '震', lowerTrigram: '坎', judgement: '解：利西南，无所往，其来复吉。有攸往，夙吉。', image: '雷雨作，解。君子以赦过宥罪。' },
  { id: 'hexagram-41', number: 41, name: '山泽损', upperTrigram: '艮', lowerTrigram: '兑', judgement: '损：有孚，元吉，无咎，可贞，利有攸往。曷之用？二簋可用享。', image: '山下有泽，损。君子以惩忿窒欲。' },
  { id: 'hexagram-42', number: 42, name: '风雷益', upperTrigram: '巽', lowerTrigram: '震', judgement: '益：利有攸往，利涉大川。', image: '风雷，益。君子以见善则迁，有过则改。' },
  { id: 'hexagram-43', number: 43, name: '泽天夬', upperTrigram: '兑', lowerTrigram: '乾', judgement: '夬：扬于王庭，孚号有厉。告自邑，不利即戎，利有攸往。', image: '泽上于天，夬。君子以施禄及下，居德则忌。' },
  { id: 'hexagram-44', number: 44, name: '天风姤', upperTrigram: '乾', lowerTrigram: '巽', judgement: '姤：女壮，勿用取女。', image: '天下有风，姤。后以施命诰四方。' },
  { id: 'hexagram-45', number: 45, name: '泽地萃', upperTrigram: '兑', lowerTrigram: '坤', judgement: '萃：亨。王假有庙，利见大人，亨，利贞。用大牲吉，利有攸往。', image: '泽上于地，萃。君子以除戎器，戒不虞。' },
  { id: 'hexagram-46', number: 46, name: '地风升', upperTrigram: '坤', lowerTrigram: '巽', judgement: '升：元亨，用见大人，勿恤，南征吉。', image: '地中生木，升。君子以顺德，积小以高大。' },
  { id: 'hexagram-47', number: 47, name: '泽水困', upperTrigram: '兑', lowerTrigram: '坎', judgement: '困：亨，贞，大人吉，无咎。有言不信。', image: '泽无水，困。君子以致命遂志。' },
  { id: 'hexagram-48', number: 48, name: '水风井', upperTrigram: '坎', lowerTrigram: '巽', judgement: '井：改邑不改井，无丧无得，往来井井。汔至亦未繘井，羸其瓶，凶。', image: '木上有水，井。君子以劳民劝相。' },
  { id: 'hexagram-49', number: 49, name: '泽火革', upperTrigram: '兑', lowerTrigram: '离', judgement: '革：己日乃孚，元亨利贞，悔亡。', image: '泽中有火，革。君子以治历明时。' },
  { id: 'hexagram-50', number: 50, name: '火风鼎', upperTrigram: '离', lowerTrigram: '巽', judgement: '鼎：元吉，亨。', image: '木上有火，鼎。君子以正位凝命。' },
  { id: 'hexagram-51', number: 51, name: '震为雷', upperTrigram: '震', lowerTrigram: '震', judgement: '震：亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。', image: '洊雷，震。君子以恐惧修省。' },
  { id: 'hexagram-52', number: 52, name: '艮为山', upperTrigram: '艮', lowerTrigram: '艮', judgement: '艮其背，不获其身，行其庭，不见其人，无咎。', image: '兼山，艮。君子以思不出其位。' },
  { id: 'hexagram-53', number: 53, name: '风山渐', upperTrigram: '巽', lowerTrigram: '艮', judgement: '渐：女归吉，利贞。', image: '山上有木，渐。君子以居贤德善俗。' },
  { id: 'hexagram-54', number: 54, name: '雷泽归妹', upperTrigram: '震', lowerTrigram: '兑', judgement: '归妹：征凶，无攸利。', image: '泽上有雷，归妹。君子以永终知敝。' },
  { id: 'hexagram-55', number: 55, name: '雷火丰', upperTrigram: '震', lowerTrigram: '离', judgement: '丰：亨，王假之，勿忧，宜日中。', image: '雷电皆至，丰。君子以折狱致刑。' },
  { id: 'hexagram-56', number: 56, name: '火山旅', upperTrigram: '离', lowerTrigram: '艮', judgement: '旅：小亨，旅贞吉。', image: '山上有火，旅。君子以明慎用刑，而不留狱。' },
  { id: 'hexagram-57', number: 57, name: '巽为风', upperTrigram: '巽', lowerTrigram: '巽', judgement: '巽：小亨，利有攸往，利见大人。', image: '随风，巽。君子以申命行事。' },
  { id: 'hexagram-58', number: 58, name: '兑为泽', upperTrigram: '兑', lowerTrigram: '兑', judgement: '兑：亨，利贞。', image: '丽泽，兑。君子以朋友讲习。' },
  { id: 'hexagram-59', number: 59, name: '风水涣', upperTrigram: '巽', lowerTrigram: '坎', judgement: '涣：亨。王假有庙，利涉大川，利贞。', image: '风行水上，涣。先王以享于帝立庙。' },
  { id: 'hexagram-60', number: 60, name: '水泽节', upperTrigram: '坎', lowerTrigram: '兑', judgement: '节：亨。苦节不可贞。', image: '泽上有水，节。君子以制数度，议德行。' },
  { id: 'hexagram-61', number: 61, name: '风泽中孚', upperTrigram: '巽', lowerTrigram: '兑', judgement: '中孚：豚鱼吉，利涉大川，利贞。', image: '泽上有风，中孚。君子以议狱缓死。' },
  { id: 'hexagram-62', number: 62, name: '雷山小过', upperTrigram: '震', lowerTrigram: '艮', judgement: '小过：亨，利贞。可小事，不可大事。飞鸟遗之音，不宜上，宜下，大吉。', image: '山上有雷，小过。君子以行过乎恭，丧过乎哀，用过乎俭。' },
  { id: 'hexagram-63', number: 63, name: '水火既济', upperTrigram: '坎', lowerTrigram: '离', judgement: '既济：亨小，利贞。初吉终乱。', image: '水在火上，既济。君子以思患而豫防之。' },
  { id: 'hexagram-64', number: 64, name: '火水未济', upperTrigram: '离', lowerTrigram: '坎', judgement: '未济：亨。小狐汔济，濡其尾，无攸利。', image: '火在水上，未济。君子以慎辨物居方。' }
]

export function castHexagram(upperNum: number, lowerNum: number, changingYao: number): SymbolMatrix {
  const matrix = createEmptyMatrix('iching', `起卦: ${upperNum}/${lowerNum}, 动爻: ${changingYao}`)
  const upperIdx = (upperNum - 1) % 8
  const lowerIdx = (lowerNum - 1) % 8
  const upper = TRIGRAMS[upperIdx]
  const lower = TRIGRAMS[lowerIdx]

  if (upper && lower) {
    matrix.symbols.push(
      { ...upper, position: '上卦', id: `trigram-upper-${upper.name}` },
      { ...lower, position: '下卦', id: `trigram-lower-${lower.name}` }
    )
    const hexagram = HEXAGRAMS.find(h => h.upperTrigram === upper.name && h.lowerTrigram === lower.name)
    if (hexagram) {
      matrix.derivedTags.push({
        id: `hexagram-${hexagram.number}`, name: hexagram.name, category: 'hexagram', position: '本卦',
        derivedFrom: [upper.id, lower.id], attributes: { number: String(hexagram.number) }
      })
      matrix.interpretations.push({
        id: `iching-judgement-${hexagram.number}`, ruleId: 'iching-judgement', category: 'general',
        text: `《周易》卦辞：${hexagram.judgement}\n象曰：${hexagram.image}`,
        tone: 'neutral', source: '《周易》', weight: 90
      })
    }
  }
  return matrix
}

export { createEmptyMatrix }
