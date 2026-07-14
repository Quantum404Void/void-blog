/**
 * engine/knowledge/bazi/rules.ts — 八字断语规则（中立纪实版 · 含现代注解）
 *
 * 数据来源：《渊海子平》《三命通会》《滴天髓》《穷通宝鉴》《子平真诠》
 */
import type { OracleRule } from '@/engine/types'

export const BAZI_RULES: OracleRule[] = [
  // ═══ 十神格局类 ═══
  { id: 'bazi-r-001', systemId: 'bazi', name: '正官格', priority: 70,
    condition: { type: 'tagMatch', tags: ['pillar-month-tenGod-zhengGuan'], optional: ['pillar-year-tenGod-zhengYin', 'pillar-hour-tenGod-zhengCai'] },
    interpretations: [{ id: 'bi-001a', category: 'career', tone: 'neutral', weight: 80,
      text: '月令正官，属正气官星。《子平真诠》："官以克身，虽与七杀有别，终受彼制。"官星得印则化，得财则生。',
      source: '《子平真诠·论正官》',
      modernNote: '正官代表规则、制度、上级。月令正官意味着出生月份中官星当令，在传统命理中被视为正直守序的格局。' }]
  },
  { id: 'bazi-r-002', systemId: 'bazi', name: '七杀格', priority: 70,
    condition: { type: 'tagMatch', tags: ['pillar-month-tenGod-qiSha'], optional: ['pillar-year-tenGod-shiShen'] },
    interpretations: [{ id: 'bi-002a', category: 'career', tone: 'neutral', weight: 75,
      text: '月令七杀（偏官），煞气攻身。《渊海子平》："七杀有制化为权，垂手登云发少年。"无制则克身，有制则权柄。',
      source: '《渊海子平》《子平真诠》',
      modernNote: '七杀在命理中代表压力、竞争、权威。无制则表现为持续的外部压力，有制（如食神制杀、印星化杀）则可将压力转化为成就。' }]
  },
  { id: 'bazi-r-003', systemId: 'bazi', name: '食神制杀', priority: 85,
    condition: { type: 'combination', tags: ['tenGod-qiSha', 'tenGod-shiShen'] },
    interpretations: [{ id: 'bi-003a', category: 'career', tone: 'neutral', weight: 90,
      text: '食神制杀格局。《渊海子平》论："食神制杀，英雄独压万人。"杀为忌时，食神为制杀之神，以智谋克制压力。',
      source: '《渊海子平·论食神》',
      modernNote: '食神代表智慧、技艺。当七杀（压力/挑战）遇到食神（解决问题的方法），形成了"以智取胜"的结构。' }]
  },
  { id: 'bazi-r-004', systemId: 'bazi', name: '伤官见官', priority: 80,
    condition: { type: 'conflict', tags: ['tenGod-shangGuan', 'tenGod-zhengGuan'] },
    interpretations: [{ id: 'bi-004a', category: 'career', tone: 'neutral', weight: 85,
      text: '伤官与正官同见。《渊海子平》："伤官见官，为祸百端。"伤官克官，与规则体制冲突。财星通关（伤官生财、财生官）可化解。',
      source: '《渊海子平·论伤官》',
      modernNote: '伤官代表创新、反传统、个人才华。正官代表规则、制度。二者相遇构成"创新 vs. 规则"的矛盾，需财星（实际价值产出）作为桥梁。' }]
  },

  // ═══ 神煞类 ═══
  { id: 'bazi-r-030', systemId: 'bazi', name: '天乙贵人', priority: 90,
    condition: { type: 'tagMatch', tags: ['shensha-tianYiGuiRen'] },
    interpretations: [{ id: 'bi-030a', category: 'general', tone: 'neutral', weight: 90,
      text: '命带天乙贵人。《三命通会》："天乙者，乃天上之神，在紫微垣阖门外，与太乙并列。"其神最尊贵，所至之处一切凶煞隐然而避。',
      source: '《三命通会·论天乙贵人》',
      modernNote: '天乙贵人是神煞体系中的第一吉星。传统认为命带天乙者更易在关键时刻得到外界帮助。' }]
  },

  // ═══ 《滴天髓》十天干论（精确匹配日主） ═══
  { id: 'bazi-r-070', systemId: 'bazi', name: '甲木日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-甲'] },
    interpretations: [{ id: 'bi-070a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："甲木参天，脱胎要火。春不容金，秋不容土。火炽乘龙，水宕骑虎。地润天和，植立千古。"',
      source: '《滴天髓·天干论》',
      modernNote: '甲木如参天大树，象征生长与向上。喜火（阳光）温暖、水（雨露）滋润。"脱胎要火"指甲木需火的温暖才能发芽生长。' }]
  },
  { id: 'bazi-r-071', systemId: 'bazi', name: '乙木日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-乙'] },
    interpretations: [{ id: 'bi-071a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："乙木虽柔，刲羊解牛。怀丁抱丙，跨凤乘猴。虚湿之地，骑马亦忧。藤萝系甲，可春可秋。"',
      source: '《滴天髓·天干论》',
      modernNote: '乙木如花草藤萝，柔韧而能适应环境。"藤萝系甲"指乙木依附甲木（大树）而存，象征借助外力达成目标的特质。' }]
  },
  { id: 'bazi-r-072', systemId: 'bazi', name: '丙火日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-丙'] },
    interpretations: [{ id: 'bi-072a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："丙火猛烈，欺霜侮雪。能煅庚金，逢辛反怯。土众成慈，水猖显节。虎马犬乡，甲来焚灭。"',
      source: '《滴天髓·天干论》',
      modernNote: '丙火为太阳之火，光明炽热。喜壬水（江河）调剂，水火既济方为佳境。过旺则需水土平衡。' }]
  },
  { id: 'bazi-r-073', systemId: 'bazi', name: '丁火日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-丁'] },
    interpretations: [{ id: 'bi-073a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："丁火柔中，内性昭融。抱乙而孝，合壬而忠。旺而不烈，衰而不穷。如有嫡母，可秋可冬。"',
      source: '《滴天髓·天干论》',
      modernNote: '丁火为灯烛星光，柔和而持久。不同于丙火的猛烈外放，丁火以内敛的温暖照亮周围。"如有嫡母"指甲木为丁火之印。' }]
  },
  { id: 'bazi-r-074', systemId: 'bazi', name: '戊土日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-戊'] },
    interpretations: [{ id: 'bi-074a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："戊土固重，既中且正。静翕动辟，万物司命。水润物生，火燥物病。若在艮坤，怕冲宜静。"',
      source: '《滴天髓·天干论》',
      modernNote: '戊土为厚重城墙之土，稳重坚实。喜水润泽、忌火过度烤燥。在艮（寅）坤（申）之位怕冲克。' }]
  },
  { id: 'bazi-r-075', systemId: 'bazi', name: '己土日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-己'] },
    interpretations: [{ id: 'bi-075a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："己土卑湿，中正蓄藏。不愁木盛，不畏水狂。火少火晦，金多金光。若要物旺，宜助宜帮。"',
      source: '《滴天髓·天干论》',
      modernNote: '己土为田园之土，滋养万物而不张扬。其特性是包容和孕育，需要丙火阳光和戊土帮身来发挥作用。' }]
  },
  { id: 'bazi-r-076', systemId: 'bazi', name: '庚金日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-庚'] },
    interpretations: [{ id: 'bi-076a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："庚金带煞，刚健为最。得水而清，得火而锐。土润则生，土干则脆。能赢甲兄，输于乙妹。"',
      source: '《滴天髓·天干论》',
      modernNote: '庚金为刀剑斧钺之金，刚硬锋利。需火（丁火）锻炼、水（壬水）淬砺方能成器。"输于乙妹"指甲乙合，庚金不敌乙木的柔韧。' }]
  },
  { id: 'bazi-r-077', systemId: 'bazi', name: '辛金日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-辛'] },
    interpretations: [{ id: 'bi-077a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："辛金软弱，温润而清。畏土之叠，乐水之盈。能扶社稷，能救生灵。热则喜母，寒则喜丁。"',
      source: '《滴天髓·天干论》',
      modernNote: '辛金为金银珠玉，细腻精致。不喜土多（土重埋金），喜水淘洗（水洗则光）。"热喜母"指夏热喜己土湿土润金。' }]
  },
  { id: 'bazi-r-078', systemId: 'bazi', name: '壬水日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-壬'] },
    interpretations: [{ id: 'bi-078a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："壬水通河，能泄金气。刚中之德，周流不滞。通根透癸，冲天奔地。化则有情，从则相济。"',
      source: '《滴天髓·天干论》',
      modernNote: '壬水为江河大海之水，流动不息。需要戊土堤防来约束，否则有泛滥之势。"化则有情"指丁壬合化木。' }]
  },
  { id: 'bazi-r-079', systemId: 'bazi', name: '癸水日主', priority: 55,
    condition: { type: 'tagMatch', tags: ['dayMaster-癸'] },
    interpretations: [{ id: 'bi-079a', category: 'general', tone: 'neutral', weight: 65,
      text: '《滴天髓》："癸水至弱，达于天津。得龙而运，功化斯神。不愁火土，不论庚辛。合戊见火，化象斯真。"',
      source: '《滴天髓·天干论》',
      modernNote: '癸水为雨露之水，至柔至弱却能渗透万物。"得龙而运"指见辰（龙）为水库，癸水得库则能发挥功用。"合戊化火"是癸水的重要变化。' }]
  },

  // ═══ 保留的核心规则（精简版） ═══
  { id: 'bazi-r-005', systemId: 'bazi', name: '财官双美', priority: 75,
    condition: { type: 'combination', tags: ['tenGod-zhengCai', 'tenGod-zhengGuan'] },
    interpretations: [{ id: 'bi-005a', category: 'wealth', tone: 'neutral', weight: 80,
      text: '正财正官齐透。《三命通会》以财官为"名利之基"。财生官、官护财，二者相生。若身强能任，则为富贵格局。',
      source: '《三命通会》' }]
  },
  { id: 'bazi-r-050', systemId: 'bazi', name: '食神生财', priority: 80,
    condition: { type: 'combination', tags: ['tenGod-shiShen', 'tenGod-zhengCai'] },
    interpretations: [{ id: 'bi-050a', category: 'wealth', tone: 'neutral', weight: 85,
      text: '食神生财。《子平真诠》：食神为财之源，如母生子，财源有根。',
      source: '《子平真诠》' }]
  },
  { id: 'bazi-r-051', systemId: 'bazi', name: '财官印三奇', priority: 90,
    condition: { type: 'tagMatch', tags: ['tenGod-zhengCai', 'tenGod-zhengGuan', 'tenGod-zhengYin'] },
    interpretations: [{ id: 'bi-051a', category: 'general', tone: 'neutral', weight: 95,
      text: '财官印俱全。《三命通会》以财官印为三奇，财生官、官生印、印护身，五行流通。需身强方任。',
      source: '《三命通会》',
      modernNote: '财（资源）、官（地位）、印（学识）三者齐全是命理中高度均衡的结构。五行形成"财→官→印→身"的流通链。' }]
  },
  { id: 'bazi-r-052', systemId: 'bazi', name: '伤官配印', priority: 75,
    condition: { type: 'combination', tags: ['tenGod-shangGuan', 'tenGod-zhengYin'] },
    interpretations: [{ id: 'bi-052a', category: 'study', tone: 'neutral', weight: 80,
      text: '伤官配印。《子平真诠》：伤官为才华之显露，印星约束其锋芒，有才而不越矩。',
      source: '《子平真诠》' }]
  },
  { id: 'bazi-r-053', systemId: 'bazi', name: '杀印相生', priority: 80,
    condition: { type: 'combination', tags: ['tenGod-qiSha', 'tenGod-zhengYin'] },
    interpretations: [{ id: 'bi-053a', category: 'career', tone: 'neutral', weight: 85,
      text: '杀印相生。《子平真诠》：杀印相生，功名显达。七杀攻身，得印化杀生身，杀之凶转为权柄。',
      source: '《子平真诠·论印绶》' }]
  },
  // 神煞简化规则
  { id: 'bazi-r-031', systemId: 'bazi', name: '文昌星', priority: 80,
    condition: { type: 'tagMatch', tags: ['shensha-wenChang'] },
    interpretations: [{ id: 'bi-031a', category: 'study', tone: 'neutral', weight: 80,
      text: '命带文昌星。《三命通会》文昌为文星，主科甲学识。查法以日干为主。',
      source: '《三命通会》' }]
  },
  { id: 'bazi-r-035', systemId: 'bazi', name: '羊刃', priority: 75,
    condition: { type: 'tagMatch', tags: ['shensha-yangRen'] },
    interpretations: [{ id: 'bi-035a', category: 'general', tone: 'neutral', weight: 80,
      text: '命带羊刃。《渊海子平》：羊刃者，禄前一位也。帝旺之地即为羊刃，为凶煞。',
      source: '《渊海子平·论羊刃》' }]
  },
  { id: 'bazi-r-038', systemId: 'bazi', name: '空亡', priority: 65,
    condition: { type: 'tagMatch', tags: ['shensha-kongWang'] },
    interpretations: [{ id: 'bi-038a', category: 'general', tone: 'neutral', weight: 65,
      text: '命带空亡。《渊海子平》以旬空为"虚而不实"之象。吉者不宜空，凶者空则减力。',
      source: '《渊海子平》' }]
  },
  { id: 'bazi-r-010', systemId: 'bazi', name: '建禄格', priority: 65,
    condition: { type: 'tagMatch', tags: ['pillar-month-stage-linGuan'] },
    interpretations: [{ id: 'bi-010a', category: 'general', tone: 'neutral', weight: 70,
      text: '月令临官（建禄），日主得令而旺。《三命通会》：建禄者，主人肌厚气实。身强则需财官为用。',
      source: '《三命通会》' }]
  },
  { id: 'bazi-r-020', systemId: 'bazi', name: '日主帝旺', priority: 60,
    condition: { type: 'tagMatch', tags: ['pillar-month-stage-diWang'] },
    interpretations: [{ id: 'bi-020a', category: 'health', tone: 'neutral', weight: 70,
      text: '日主在月令处帝旺之地，身极强。《滴天髓》：旺极则衰。需克泄耗方能平衡。',
      source: '《滴天髓》' }]
  },
]
