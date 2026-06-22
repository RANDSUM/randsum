import { describe, expect, test } from 'bun:test'
import { NOTATION_DOCS } from '@randsum/roller/docs'
import type { ModifierCategory, NotationDoc } from '@randsum/roller/docs'
import {
  CATEGORY_ORDER,
  CONDITION_KEYS,
  DICE_SIDES_KEYS,
  NUMBER_KEYS,
  OPERATORS,
  canAddModifier,
  getBuilderType,
  groupByCategory
} from '../src/notationBuilder'

// Build a minimal NotationDoc for unit cases where we only care about classification fields.
function makeDoc(
  overrides: Partial<NotationDoc> & Pick<NotationDoc, 'key' | 'category' | 'displayBase'>
): NotationDoc {
  return {
    title: overrides.title ?? overrides.key,
    description: overrides.description ?? '',
    color: overrides.color ?? '#000',
    colorLight: overrides.colorLight ?? '#fff',
    forms: overrides.forms ?? [],
    examples: overrides.examples ?? [],
    ...overrides
  }
}

describe('classification sets', () => {
  test('NUMBER_KEYS holds the numeric-argument modifier keys', () => {
    for (const key of ['K', 'KL', 'KM', '+', '-', '*', '//', '%', '**', 'ms{..}']) {
      expect(NUMBER_KEYS.has(key)).toBe(true)
    }
    expect(NUMBER_KEYS.has('R{..}')).toBe(false)
    expect(NUMBER_KEYS.has('xDN')).toBe(false)
  })

  test('CONDITION_KEYS holds the condition-argument modifier keys', () => {
    for (const key of [
      'R{..}',
      'ro{..}',
      'C{..}',
      'V{..}',
      'D{..}',
      '#{..}',
      'S{..}',
      'F{..}',
      '!s{..}'
    ]) {
      expect(CONDITION_KEYS.has(key)).toBe(true)
    }
    expect(CONDITION_KEYS.has('+')).toBe(false)
    expect(CONDITION_KEYS.has('xDN')).toBe(false)
  })

  test('DICE_SIDES_KEYS holds the sided special-dice keys', () => {
    for (const key of ['gN', 'DDN', 'zN']) {
      expect(DICE_SIDES_KEYS.has(key)).toBe(true)
    }
    expect(DICE_SIDES_KEYS.has('d%')).toBe(false)
  })

  test('the three classification sets are mutually exclusive', () => {
    const all = [...NUMBER_KEYS, ...CONDITION_KEYS, ...DICE_SIDES_KEYS]
    expect(new Set(all).size).toBe(all.length)
  })

  test('OPERATORS lists the five comparison operators in order', () => {
    expect(OPERATORS).toEqual(['<', '>', '=', '<=', '>='])
  })
})

describe('getBuilderType', () => {
  test('xDN is the dice builder', () => {
    expect(getBuilderType(makeDoc({ key: 'xDN', category: 'Core', displayBase: 'xDN' }))).toEqual({
      kind: 'dice'
    })
  })

  test('sided special dice strip the trailing N for prefix and actual', () => {
    const result = getBuilderType(makeDoc({ key: 'gN', category: 'Special', displayBase: 'gN' }))
    expect(result).toEqual({ kind: 'number', prefix: 'g', actual: 'g' })
  })

  test('numeric modifiers use displayBase as prefix and the key as actual', () => {
    const result = getBuilderType(makeDoc({ key: '+', category: 'Scale', displayBase: '+' }))
    expect(result).toEqual({ kind: 'number', prefix: '+', actual: '+' })
  })

  test('minus uses the literal "-" as actual even when displayBase differs', () => {
    // The real doc uses the unicode minus sign as displayBase but emits ASCII "-".
    const result = getBuilderType(makeDoc({ key: '-', category: 'Scale', displayBase: '−' }))
    expect(result).toEqual({ kind: 'number', prefix: '−', actual: '-' })
  })

  test('ms{..} maps to actual "ms"', () => {
    const result = getBuilderType(
      makeDoc({ key: 'ms{..}', category: 'Scale', displayBase: 'ms{..}' })
    )
    expect(result).toEqual({ kind: 'number', prefix: 'ms{..}', actual: 'ms' })
  })

  test('condition modifiers strip the {..} placeholder from prefix and actual', () => {
    const result = getBuilderType(
      makeDoc({ key: 'R{..}', category: 'Substitute', displayBase: 'R{..}' })
    )
    expect(result).toEqual({ kind: 'condition', prefix: 'R', actual: 'R' })
  })

  test('sort emits the "sa" no-arg fragment', () => {
    const result = getBuilderType(makeDoc({ key: 'sort', category: 'Order', displayBase: 'sa' }))
    expect(result).toEqual({ kind: 'no-arg', fragment: 'sa' })
  })

  test('any unclassified key falls through to a no-arg builder using its own key', () => {
    const result = getBuilderType(makeDoc({ key: '!', category: 'Generate', displayBase: '!' }))
    expect(result).toEqual({ kind: 'no-arg', fragment: '!' })
  })

  test('every real NOTATION_DOCS entry produces a builder type', () => {
    for (const doc of Object.values(NOTATION_DOCS)) {
      const result = getBuilderType(doc)
      expect(['dice', 'number', 'condition', 'no-arg']).toContain(result.kind)
    }
  })
})

describe('canAddModifier', () => {
  const coreDoc = makeDoc({ key: 'xDN', category: 'Core', displayBase: 'xDN' })
  const specialDoc = makeDoc({ key: 'd%', category: 'Special', displayBase: 'd%' })
  const modDoc = makeDoc({ key: 'L', category: 'Filter', displayBase: 'L' })

  test('Core dice are always addable regardless of notation', () => {
    expect(canAddModifier('', coreDoc)).toBe(true)
    expect(canAddModifier(undefined, coreDoc)).toBe(true)
  })

  test('Special dice are always addable regardless of notation', () => {
    expect(canAddModifier('', specialDoc)).toBe(true)
    expect(canAddModifier(undefined, specialDoc)).toBe(true)
  })

  test('modifiers require an existing dice expression', () => {
    expect(canAddModifier('', modDoc)).toBe(false)
    expect(canAddModifier(undefined, modDoc)).toBe(false)
    expect(canAddModifier('hello', modDoc)).toBe(false)
  })

  test('modifiers become addable once notation contains NdS', () => {
    expect(canAddModifier('2d6', modDoc)).toBe(true)
    expect(canAddModifier('d20', modDoc)).toBe(true)
    expect(canAddModifier('1d%', modDoc)).toBe(true)
    expect(canAddModifier('4dF', modDoc)).toBe(true)
    expect(canAddModifier('2d{1,2}', modDoc)).toBe(true)
  })

  test('is case-insensitive on the dice marker', () => {
    expect(canAddModifier('2D6', modDoc)).toBe(true)
  })
})

describe('CATEGORY_ORDER', () => {
  test('starts with the dice categories then modifier categories', () => {
    expect(CATEGORY_ORDER[0]).toBe('Core')
    expect(CATEGORY_ORDER[1]).toBe('Special')
  })

  test('has no duplicates', () => {
    expect(new Set(CATEGORY_ORDER).size).toBe(CATEGORY_ORDER.length)
  })

  test('covers every category present in NOTATION_DOCS', () => {
    const present = new Set<ModifierCategory>()
    for (const doc of Object.values(NOTATION_DOCS)) present.add(doc.category)
    for (const cat of present) {
      expect(CATEGORY_ORDER).toContain(cat)
    }
  })
})

describe('groupByCategory', () => {
  test('groups docs under their category key', () => {
    const docs: Record<string, NotationDoc> = {
      a: makeDoc({ key: 'L', category: 'Filter', displayBase: 'L' }),
      b: makeDoc({ key: 'H', category: 'Filter', displayBase: 'H' }),
      c: makeDoc({ key: '+', category: 'Scale', displayBase: '+' })
    }
    const grouped = groupByCategory(docs)
    expect(grouped.get('Filter')).toHaveLength(2)
    expect(grouped.get('Scale')).toHaveLength(1)
    expect(grouped.has('Core')).toBe(false)
  })

  test('preserves insertion order within a category', () => {
    const docs: Record<string, NotationDoc> = {
      a: makeDoc({ key: 'L', category: 'Filter', displayBase: 'L' }),
      b: makeDoc({ key: 'H', category: 'Filter', displayBase: 'H' })
    }
    const filter = groupByCategory(docs).get('Filter') ?? []
    expect(filter.map(d => d.key)).toEqual(['L', 'H'])
  })

  test('every grouped doc actually carries the category it is filed under', () => {
    const grouped = groupByCategory(NOTATION_DOCS)
    for (const [category, docs] of grouped) {
      for (const doc of docs) {
        expect(doc.category).toBe(category)
      }
    }
  })

  test('groups the full real registry without dropping entries', () => {
    const grouped = groupByCategory(NOTATION_DOCS)
    const total = [...grouped.values()].reduce((sum, docs) => sum + docs.length, 0)
    expect(total).toBe(Object.values(NOTATION_DOCS).length)
  })
})
