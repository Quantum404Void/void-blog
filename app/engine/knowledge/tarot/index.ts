/**
 * engine/knowledge/tarot/index.ts — 塔罗占卜模块（78张完整牌组）
 */

import { createEmptyMatrix } from '@/engine/types'
import { MAJOR_ARCANA, MINOR_ARCANA, SPREADS } from './cards'

import type { SymbolMatrix } from '@/engine/types'
import type { SemanticTag, TarotInput } from '@/engine/types'

const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

function findCard(id: string): SemanticTag | undefined {
  return FULL_DECK.find(c => c.id === id)
}

export function drawTarot(input: TarotInput, seed?: number): SymbolMatrix {
  const spread = SPREADS[input.spreadType]
  const seedVal = seed ?? Date.now()
  const rand = seededRandom(seedVal)
  const shuffled = shuffle(FULL_DECK, rand)
  const matrix = createEmptyMatrix('tarot', `牌阵: ${spread.name}`)
  matrix.metadata.seed = seedVal

  const cards = input.cards.length > 0
    ? input.cards
    : spread.positions.map((pos, i) => ({
        cardId: shuffled[i]?.id ?? 'tarot-0', reversed: rand() > 0.5, position: pos.id
      }))

  for (let i = 0; i < cards.length; i++) {
    const draw = cards[i]
    const card = findCard(draw.cardId)
    const pos = spread.positions[i]
    if (!card) continue

    matrix.symbols.push({
      id: card.id, name: card.name, category: card.category,
      position: pos?.label ?? draw.position,
      attributes: { reversed: String(draw.reversed), number: card.attributes.number || '', element: card.attributes.element }
    })

    matrix.derivedTags.push({
      id: `${card.id}-${draw.reversed ? 'reversed' : 'upright'}`,
      name: draw.reversed ? `${card.name}(逆位)` : `${card.name}(正位)`,
      category: draw.reversed ? 'reversed' : 'upright',
      position: pos?.label ?? draw.position, derivedFrom: [card.id],
      attributes: { element: card.attributes.element }
    })

    const prefix = draw.reversed ? '（逆位）' : ''
    matrix.interpretations.push({
      id: `${card.id}-interp`, ruleId: `tarot-card-${card.id}`, category: 'general',
      text: `${prefix}${card.description}`, tone: draw.reversed ? 'neutral' : 'neutral', weight: 70
    })
  }

  if (cards.length >= 3) {
    matrix.interpretations.push({
      id: 'tarot-summary', ruleId: 'tarot-summary', category: 'general',
      text: '三张牌构成一个故事线——从过去的积累，到现在的状态，再到未来的方向。', tone: 'neutral', weight: 85
    })
  }
  return matrix
}

export { MAJOR_ARCANA, MINOR_ARCANA, SPREADS }
