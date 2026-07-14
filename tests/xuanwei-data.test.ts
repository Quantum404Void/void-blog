import { describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { NAYIN_TAGS } from '../app/engine/knowledge/bazi/nayin'
import { HEXAGRAMS } from '../app/engine/knowledge/iching'
import { GUANYIN_LOTS } from '../app/engine/knowledge/lots'
import { MAJOR_ARCANA, MINOR_ARCANA } from '../app/engine/knowledge/tarot/cards'
import { REGISTERED_MODULES } from '../app/engine/knowledge'

const root = path.resolve('app/assets/data/xuanwei')
const manifest = yaml.load(fs.readFileSync(path.join(root, 'DATA_MANIFEST.yaml'), 'utf8')) as {
  schema: string
  coverage: { status: string; percent: number; published_modules: number; covered_modules: number; definition: string }
  modules: Record<string, { status: string; scope: string; sources: string[] }>
  files: Record<string, { system: string; status: string; records: number; breakdown?: Record<string, number> }>
}

const load = (relative: string) => yaml.load(fs.readFileSync(path.join(root, relative), 'utf8')) as Record<string, any>
const isText = (value: unknown) => typeof value === 'string' && value.trim().length > 0
const expectUnique = (values: unknown[]) => expect(new Set(values).size).toBe(values.length)

describe('xuanwei YAML data integrity', () => {
  test('every manifest file exists and parses as YAML', () => {
    expect(manifest.schema).toBe('xuanwei-data-manifest/v2')
    const yamlFiles = fs.readdirSync(path.join(root, 'data')).filter(file => file.endsWith('.yaml')).map(file => `data/${file}`)
    yamlFiles.push('bazi-rules.yaml')
    expect(Object.keys(manifest.files).sort()).toEqual(yamlFiles.sort())

    for (const [relative, metadata] of Object.entries(manifest.files)) {
      const file = path.join(root, relative)
      expect(fs.existsSync(file)).toBe(true)
      expect(() => yaml.load(fs.readFileSync(file, 'utf8'))).not.toThrow()
      expect(metadata.system.trim()).toBeTruthy()
      expect(metadata.status).toBe('complete')
      expect(metadata.records).toBeGreaterThan(0)
    }
  })

  test('covers 100% of published modules and their declared sources', () => {
    const registeredIds = REGISTERED_MODULES.map(module => module.id).sort()
    const coveredIds = Object.keys(manifest.modules).sort()
    expect(coveredIds).toEqual(registeredIds)
    expect(manifest.coverage).toMatchObject({
      status: 'complete',
      percent: 100,
      published_modules: registeredIds.length,
      covered_modules: coveredIds.length,
    })
    expect(isText(manifest.coverage.definition)).toBe(true)
    for (const module of Object.values(manifest.modules)) {
      expect(module.status).toBe('complete')
      expect(isText(module.scope)).toBe(true)
      expect(module.sources.length).toBeGreaterThan(0)
      for (const source of module.sources) expect(fs.existsSync(path.resolve(source))).toBe(true)
    }
  })

  test('declared collection counts match the source YAML', () => {
    const checks: Array<[string, number]> = [
      ['bazi-rules.yaml', load('bazi-rules.yaml').rules.length],
      ['data/bazi-nayin.yaml', load('data/bazi-nayin.yaml').nayin.length],
      ['data/chenggu-data.yaml', Object.keys(load('data/chenggu-data.yaml').yearWeight).length + load('data/chenggu-data.yaml').monthWeight.length + load('data/chenggu-data.yaml').dayWeight.length + load('data/chenggu-data.yaml').hourWeight.length + Object.keys(load('data/chenggu-data.yaml').songs).length],
      ['data/classics-catalog.yaml', load('data/classics-catalog.yaml').classics.length],
      ['data/iching-hexagrams.yaml', load('data/iching-hexagrams.yaml').hexagrams.length],
      ['data/lots-data.yaml', load('data/lots-data.yaml').lots.length],
      ['data/dream-data.yaml', Object.keys(load('data/dream-data.yaml').dreams).length],
      ['data/fengshui-data.yaml', Object.keys(load('data/fengshui-data.yaml').youNian).length],
      ['data/nameology-data.yaml', Object.keys(load('data/nameology-data.yaml').numberMeaning).length + Object.keys(load('data/nameology-data.yaml').sancaiConfig).length],
      ['data/tarot-cards.yaml', load('data/tarot-cards.yaml').majorArcana.length + Object.values(load('data/tarot-cards.yaml').minorArcana).reduce((sum: number, suit: any) => sum + suit.cards.length, 0)],
      ['data/shuowen-chars.yaml', load('data/shuowen-chars.yaml').characters.length],
      ['data/shuowen-radicals.yaml', load('data/shuowen-radicals.yaml').radicals.length],
      ['data/shuowen.yaml', load('data/shuowen.yaml').characters.length],
    ]
    for (const [relative, count] of checks) expect(manifest.files[relative]?.records).toBe(count)

    expect(manifest.files['data/bazi-nayin.yaml']?.breakdown).toEqual({ stem_branches: 60, nayin_pairs: 30 })
    expect(manifest.files['data/chenggu-data.yaml']?.breakdown).toEqual({ year_weights: 60, month_weights: 12, day_weights: 30, hour_weights: 12, songs: 46 })
    expect(manifest.files['data/fengshui-data.yaml']?.breakdown).toEqual({ palaces: 8, star_meanings: 8, directions: 9 })
    expect(manifest.files['data/nameology-data.yaml']?.breakdown).toEqual({ number_meanings: 38, sancai_configs: 10 })
    expect(manifest.files['data/tarot-cards.yaml']?.breakdown).toEqual({ major_arcana: 22, minor_arcana: 56, spreads: 2 })
  })

  test('catalogs every classic named in BOOKS.md without false full-text claims', () => {
    const catalog = load('data/classics-catalog.yaml')
    const classics = catalog.classics as Array<Record<string, string>>
    const books = fs.readFileSync(path.join(root, 'BOOKS.md'), 'utf8')
    const namedTitles = [...books.matchAll(/《([^》]+)》/g)].map(match => match[1].replace(/\(.+\)$/u, ''))
    const aliases: Record<string, string> = { '周易': '周易', '易经': '周易' }
    const catalogTitles = new Set(classics.map(item => item.title))

    expect(catalog.schema).toBe('xuanwei-classics-catalog/v1')
    expect(catalog.coverage.status).toBe('complete')
    expectUnique(classics.map(item => item.id))
    expectUnique(classics.map(item => item.title))
    for (const title of namedTitles) expect(catalogTitles.has(aliases[title] ?? title)).toBe(true)
    for (const item of classics) {
      expect([item.id, item.title, item.system, item.period, item.author, item.mode, item.source_status].every(isText)).toBe(true)
      expect(['structured', 'indexed'].includes(item.mode)).toBe(true)
      expect(['open', 'excerpt_open', 'bibliography', 'variant', 'copyright_review', 'title_review'].includes(item.source_status)).toBe(true)
      if (['open', 'excerpt_open'].includes(item.source_status)) expect(item.source_url?.startsWith('https://')).toBe(true)
    }
  })

  test('I Ching contains the canonical 64 unique hexagrams', () => {
    const hexagrams = load('data/iching-hexagrams.yaml').hexagrams
    const trigrams = new Set(['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'])
    expect(load('data/iching-hexagrams.yaml').total).toBe(64)
    expect(hexagrams.map((item: any) => item.n)).toEqual(Array.from({ length: 64 }, (_, index) => index + 1))
    expectUnique(hexagrams.map((item: any) => item.nm))
    for (const item of hexagrams) {
      expect(trigrams.has(item.u)).toBe(true)
      expect(trigrams.has(item.l)).toBe(true)
      expect(isText(item.j)).toBe(true)
      expect(isText(item.i)).toBe(true)
    }
    expect(hexagrams).toEqual(HEXAGRAMS.map(item => ({ n: item.number, nm: item.name, u: item.upperTrigram, l: item.lowerTrigram, j: item.judgement, i: item.image })))
  })

  test('divination collections have complete fields and stable identifiers', () => {
    const lots = load('data/lots-data.yaml').lots
    const tarot = load('data/tarot-cards.yaml')
    expect(lots.map((item: any) => item.number)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1))
    expectUnique(tarot.majorArcana.map((item: any) => item.id))
    expect(tarot.majorArcana.map((item: any) => item.number)).toEqual(Array.from({ length: 22 }, (_, index) => index))
    for (const item of lots) expect([item.level, item.poem, item.note].every(isText)).toBe(true)
    for (const item of tarot.majorArcana) expect([item.id, item.name, item.element, item.planet, item.meaning, item.desc].every(isText)).toBe(true)
    for (const suit of Object.values(tarot.minorArcana) as any[]) {
      expect(suit.cards).toHaveLength(14)
      expectUnique(suit.cards.map((item: any) => item.rank))
      for (const item of suit.cards) expect([item.rank, item.name, item.meaning, item.desc].every(isText)).toBe(true)
    }
    expect(lots).toEqual(GUANYIN_LOTS.map(({ id: _id, ...item }) => item))
    expect(tarot.majorArcana.map((item: any) => item.id)).toEqual(MAJOR_ARCANA.map(item => item.id))
    expect(Object.values(tarot.minorArcana).flatMap((suit: any) => suit.cards.map((item: any) => item.name))).toEqual(MINOR_ARCANA.map(item => item.name))
  })

  test('reference collections contain valid non-empty records', () => {
    const nayin = load('data/bazi-nayin.yaml').nayin
    const chenggu = load('data/chenggu-data.yaml')
    const dreams = load('data/dream-data.yaml').dreams
    const fengshui = load('data/fengshui-data.yaml')
    const nameology = load('data/nameology-data.yaml')
    const rules = load('bazi-rules.yaml').rules
    expectUnique(nayin.map((item: any) => item.stemBranch))
    expect(nayin.map((item: any) => item.stemBranch)).toEqual(NAYIN_TAGS.map(item => item.attributes.stemBranch))
    for (const item of nayin) expect([item.stemBranch, item.nayin, item.element].every(isText)).toBe(true)
    for (const name of new Set(nayin.map((item: any) => item.nayin))) {
      expect(nayin.some((item: any) => item.nayin === name && isText(item.desc))).toBe(true)
    }
    expect(Object.keys(chenggu.yearWeight)).toHaveLength(60)
    expect(chenggu.monthWeight).toHaveLength(12)
    expect(chenggu.dayWeight).toHaveLength(30)
    expect(chenggu.hourWeight).toHaveLength(12)
    expect(Object.keys(chenggu.songs)).toHaveLength(46)
    expect(Object.values(dreams).every(isText)).toBe(true)
    expect(Object.keys(fengshui.youNian).sort()).toEqual(['乾', '兑', '坎', '坤', '巽', '离', '艮', '震'].sort())
    for (const palace of Object.values(fengshui.youNian) as Record<string, string>[]) expect(Object.keys(palace)).toHaveLength(9)
    expect(Object.keys(nameology.numberMeaning)).toHaveLength(38)
    expect(Object.keys(nameology.sancaiConfig)).toHaveLength(10)
    expectUnique(rules.map((item: any) => item.id))
  })

  test('Shuowen collections have declared totals and required fields', () => {
    const checks: Array<[string, string, string[]]> = [
      ['data/shuowen-chars.yaml', 'characters', ['c', 'radical', 'strokes', 'struct', 'def', 'py']],
      ['data/shuowen-radicals.yaml', 'radicals', ['radical', 'strokes', 'def', 'pinyin']],
      ['data/shuowen.yaml', 'characters', ['char', 'radical', 'structure', 'definition', 'pinyin', 'strokes', 'source']],
    ]
    for (const [relative, collection, fields] of checks) {
      const data = load(relative)
      if (data.total) expect(data.total).toBe(data[collection].length)
      const key = collection === 'radicals' ? 'radical' : collection === 'characters' && relative.endsWith('shuowen.yaml') ? 'char' : 'c'
      expectUnique(data[collection].map((item: any) => item[key]))
      for (const item of data[collection]) {
        for (const field of fields) expect(field === 'strokes' ? Number.isInteger(item[field]) && item[field] > 0 : isText(item[field])).toBe(true)
      }
    }
  })
})
