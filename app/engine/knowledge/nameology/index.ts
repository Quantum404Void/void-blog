/**
 * engine/knowledge/nameology/index.ts — 姓名学 · 五格剖象法
 * 使用 cnchar 库获取精确笔画数。
 */
import { createEmptyMatrix } from '@/engine/types'
import { load as loadYaml } from 'js-yaml'
import cnchar from 'cnchar'
import nameologyRaw from '@/assets/data/xuanwei/data/nameology-data.yaml?raw'
import type { SymbolMatrix } from '@/engine/types'

interface NameologyData {
  numberMeaning: Record<string, string>
  sancaiConfig: Record<string, string>
}

const nameologyData = loadYaml(nameologyRaw) as NameologyData

function getStroke(c: string): number {
  // cnchar.stroke 在未传 'array' 时对单字返回 number
  const strokes = cnchar.stroke(c)
  if (typeof strokes !== 'number' || !Number.isInteger(strokes) || strokes <= 0) {
    throw new Error(`无法识别“${c}”的笔画数，请输入常用汉字`)
  }
  return strokes
}

function ml(n: number): string {
  const referenceNumber = n > 81 ? ((n - 1) % 80) + 1 : n
  return `${n}·${nameologyData.numberMeaning[String(referenceNumber)]}`
}
function el(n: number): string { const l = n % 10; return l <= 2 ? '木' : l <= 4 ? '火' : l <= 6 ? '土' : l <= 8 ? '金' : '水' }

export function nameologyAnalyze(surname: string, givenName: string): SymbolMatrix {
  const m = createEmptyMatrix('nameology', `${surname}${givenName}`)
  const surnameChars = Array.from(surname)
  const givenChars = Array.from(givenName)
  if (!surnameChars.length || !givenChars.length) throw new Error('请完整输入姓氏和名字')
  const chars = [...surnameChars, ...givenChars]
  const ss = chars.map(getStroke)
  const sn = surnameChars.length
  const surnameStrokes = ss.slice(0, sn)
  const givenStrokes = ss.slice(sn)
  const t = surnameStrokes.reduce((sum, value) => sum + value, 0) + (sn === 1 ? 1 : 0)
  const r = surnameStrokes.at(-1)! + givenStrokes[0]!
  const d = givenStrokes.reduce((sum, value) => sum + value, 0) + (givenChars.length === 1 ? 1 : 0)
  const z = ss.reduce((a, b) => a + b, 0)
  const w = z - r + (sn === 1 ? 1 : 0) + (givenChars.length === 1 ? 1 : 0)
  const sc = `${el(t)}${el(r)}${el(d)}`
  m.symbols.push(
    { id: 'ng-t', name: `天格${t}`, category: 'nameology', position: '天格', attributes: { value: String(t), element: el(t) } },
    { id: 'ng-r', name: `人格${r}`, category: 'nameology', position: '人格', attributes: { value: String(r), element: el(r) } },
    { id: 'ng-d', name: `地格${d}`, category: 'nameology', position: '地格', attributes: { value: String(d), element: el(d) } },
    { id: 'ng-w', name: `外格${w}`, category: 'nameology', position: '外格', attributes: { value: String(w), element: el(w) } },
    { id: 'ng-z', name: `总格${z}`, category: 'nameology', position: '总格', attributes: { value: String(z), element: el(z) } }
  )
  m.interpretations.push(
    { id: 'ng-r', ruleId: 'ng', category: 'general', text: `人格${r}数理：${ml(r)}。`, tone: 'neutral', source: '《五格剖象法》', weight: 80 },
    { id: 'ng-s', ruleId: 'ng', category: 'general', text: `三才（${sc}）：${nameologyData.sancaiConfig[sc]}`, tone: 'neutral', source: '五行生克关系', weight: 75 },
    { id: 'ng-z', ruleId: 'ng', category: 'general', text: `总格${z}数理：${ml(z)}。`, tone: 'neutral', source: '《五格剖象法》', weight: 70 }
  )
  return m
}
