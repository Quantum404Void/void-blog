import { describe, expect, test } from 'bun:test'
import { generateHoroscope } from '../app/engine/knowledge/astrology'
import { computeBaziMatrix } from '../app/engine/knowledge/bazi'
import { chengguFromSolarDate } from '../app/engine/knowledge/chenggu'
import { daliurenCast } from '../app/engine/knowledge/daliuren'
import { dreamInterpret } from '../app/engine/knowledge/dream'
import { fengshuiAnalyze } from '../app/engine/knowledge/fengshui'
import { castHexagram } from '../app/engine/knowledge/iching'
import { liuyaoCast } from '../app/engine/knowledge/liuyao'
import { drawLot } from '../app/engine/knowledge/lots'
import { meihuaByNumbers } from '../app/engine/knowledge/meihua'
import { mianxiangLookup } from '../app/engine/knowledge/mianxiang'
import { nameologyAnalyze } from '../app/engine/knowledge/nameology'
import { qimenCast } from '../app/engine/knowledge/qimen'
import { drawTarot } from '../app/engine/knowledge/tarot'
import { computeZiweiMatrix } from '../app/engine/knowledge/ziwei'

describe('xuanwei engines', () => {
  const cases = [
    ['bazi', () => computeBaziMatrix({ year: 2000, month: 1, day: 1, hour: 0, gender: 'male' })],
    ['ziwei', () => computeZiweiMatrix(2000, 1, 1, 0, 'male')],
    ['astrology', () => generateHoroscope(3, 21, 1)],
    ['nameology', () => nameologyAnalyze('李', '明')],
    ['chenggu', () => chengguFromSolarDate(2000, 1, 1, 0)],
    ['liuyao', () => liuyaoCast(1)],
    ['meihua', () => meihuaByNumbers(3, 5, 2)],
    ['qimen', () => qimenCast(2024, 7, 14, 10)],
    ['daliuren', () => daliurenCast(2024, 7, 14, 10)],
    ['iching', () => castHexagram(1, 1, 1)],
    ['tarot', () => drawTarot({ spreadType: 'three', cards: [] }, 1)],
    ['lots', () => drawLot(1)],
    ['fengshui', () => fengshuiAnalyze(1990, 'male')],
    ['mianxiang', () => mianxiangLookup('眉')],
    ['dream', () => dreamInterpret('蛇')],
  ] as const

  test.each(cases)('%s returns a populated matrix', (_name, run) => {
    const matrix = run()
    expect(matrix.systemId).toBeTruthy()
    expect(matrix.symbols.length + matrix.interpretations.length).toBeGreaterThan(0)
  })

  test('nameology uses real character strokes and complete five-grid fields', () => {
    const matrix = nameologyAnalyze('李', '明')
    expect(matrix.symbols.map(symbol => [symbol.position, symbol.attributes.value, symbol.attributes.element])).toEqual([
      ['天格', '8', '金'],
      ['人格', '15', '土'],
      ['地格', '9', '水'],
      ['外格', '2', '木'],
      ['总格', '15', '土'],
    ])
    expect(matrix.interpretations.map(item => item.text).join('\n')).not.toContain('属中性')
    expect(matrix.interpretations.map(item => item.text).join('\n')).toContain('金土水')
  })
})
