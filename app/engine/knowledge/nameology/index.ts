/**
 * engine/knowledge/nameology/index.ts — 姓名学 · 五格剖象法
 * 使用 cnchar 库获取精确笔画数。
 */
import { createEmptyMatrix } from '@/engine/types'
import cnchar from 'cnchar'
import type { SymbolMatrix } from '@/engine/types'

function getStroke(c: string): number {
  const strokes = cnchar.stroke(c)
  if (!Number.isInteger(strokes) || strokes <= 0) throw new Error(`无法识别“${c}”的笔画数，请输入常用汉字`)
  return strokes
}

const numMeaning: Record<number, string> = { 1:'大吉',3:'大吉',5:'大吉',6:'大吉',7:'大吉',8:'大吉',11:'大吉',13:'大吉',15:'大吉',16:'大吉',17:'大吉',18:'大吉',21:'大吉',23:'大吉',24:'大吉',25:'大吉',29:'大吉',31:'大吉',32:'大吉',33:'大吉',35:'大吉',37:'大吉',38:'大吉',39:'大吉',41:'大吉',45:'大吉',47:'大吉',48:'大吉',52:'大吉',57:'大吉',61:'大吉',63:'大吉',65:'大吉',67:'大吉',68:'大吉',72:'大吉',81:'大吉' }

function ml(n: number): string { return numMeaning[n] ? `${n}·大吉` : n % 2 === 0 ? `${n}·凶` : `${n}·中性` }
function el(n: number): string { const l = n % 10; return l <= 2 ? '木' : l <= 4 ? '火' : l <= 6 ? '土' : l <= 8 ? '金' : '水' }

export function nameologyAnalyze(surname: string, givenName: string): SymbolMatrix {
  const m = createEmptyMatrix('nameology', `${surname}${givenName}`)
  const surnameChars = Array.from(surname)
  const givenChars = Array.from(givenName)
  const chars = [...surnameChars, ...givenChars]
  const ss = chars.map(getStroke)
  const sn = surnameChars.length
  const surnameStrokes = ss.slice(0, sn)
  const givenStrokes = ss.slice(sn)
  const t = surnameStrokes.reduce((sum, value) => sum + value, 0) + (sn === 1 ? 1 : 0)
  const r = surnameStrokes.at(-1)! + givenStrokes[0]
  const d = givenStrokes.reduce((sum, value) => sum + value, 0) + (givenChars.length === 1 ? 1 : 0)
  const z = ss.reduce((a, b) => a + b, 0)
  const w = z - r + (sn === 1 ? 1 : 0) + (givenChars.length === 1 ? 1 : 0)
  const sc = `${el(t)}${el(r)}${el(d)}`
  const sm: Record<string, string> = { '木木木':'大吉·基础稳固','木木火':'大吉·成功运佳','木火木':'大吉·得上下惠助','火木木':'大吉·顺调发展','火木火':'大吉·长辈提拔','土木木':'大吉·基础坚实','土木火':'大吉·成功顺调','土火木':'大吉·发展成功','土土火':'大吉·境遇安泰','土土土':'大吉·身心健全' }
  m.symbols.push(
    { id: 'ng-t', name: `天格${t}`, category: 'nameology', position: '天格', attributes: { value: String(t), element: el(t) } },
    { id: 'ng-r', name: `人格${r}`, category: 'nameology', position: '人格', attributes: { value: String(r), element: el(r) } },
    { id: 'ng-d', name: `地格${d}`, category: 'nameology', position: '地格', attributes: { value: String(d), element: el(d) } },
    { id: 'ng-w', name: `外格${w}`, category: 'nameology', position: '外格', attributes: { value: String(w), element: el(w) } },
    { id: 'ng-z', name: `总格${z}`, category: 'nameology', position: '总格', attributes: { value: String(z), element: el(z) } }
  )
  m.interpretations.push(
    { id: 'ng-r', ruleId: 'ng', category: 'general', text: `人格${r}数理：${ml(r)}。`, tone: 'neutral', source: '《五格剖象法》', weight: 80 },
    { id: 'ng-s', ruleId: 'ng', category: 'general', text: `三才（${sc}）：${sm[sc] ?? '属中性'}`, tone: 'neutral', source: '《三才配置论》', weight: 75 },
    { id: 'ng-z', ruleId: 'ng', category: 'general', text: `总格${z}数理：${ml(z)}。`, tone: 'neutral', source: '《五格剖象法》', weight: 70 }
  )
  return m
}
