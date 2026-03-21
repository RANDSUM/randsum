import { describe, expect, test } from 'bun:test'
import { sortSchema } from '../../src/notation/definitions/sort'
import { parseModifiers } from '../../src/notation/parse/parseModifiers'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import {
  modifiersToDescription,
  modifiersToNotation
} from '../../src/notation/transformers/modifiersToStrings'

describe('Sort Notation Schema', () => {
  describe('parse', () => {
    test('parses sa (sort ascending explicit)', () => {
      expect(sortSchema.parse('4d6sa')).toEqual({ sort: 'asc' })
    })

    test('parses sd (sort descending)', () => {
      expect(sortSchema.parse('4d6sd')).toEqual({ sort: 'desc' })
    })

    test('parses SA (uppercase)', () => {
      expect(sortSchema.parse('4d6SA')).toEqual({ sort: 'asc' })
    })

    test('parses SD (uppercase)', () => {
      expect(sortSchema.parse('4d6SD')).toEqual({ sort: 'desc' })
    })

    test('does NOT match S{7} (count successes)', () => {
      expect(sortSchema.parse('4d6S{7}')).toEqual({})
    })

    test('does NOT match S{5,2} (count successes with botch)', () => {
      expect(sortSchema.parse('4d6S{5,2}')).toEqual({})
    })

    test('returns empty for no match', () => {
      expect(sortSchema.parse('no match')).toEqual({})
    })
  })

  describe('toNotation', () => {
    test('formats asc as sa', () => {
      expect(sortSchema.toNotation('asc')).toBe('sa')
    })

    test('formats desc as sd', () => {
      expect(sortSchema.toNotation('desc')).toBe('sd')
    })
  })

  describe('toDescription', () => {
    test('describes ascending', () => {
      expect(sortSchema.toDescription('asc')).toEqual(['Sort ascending'])
    })

    test('describes descending', () => {
      expect(sortSchema.toDescription('desc')).toEqual(['Sort descending'])
    })
  })
})

describe('Sort in parseModifiers', () => {
  test('parses sort ascending from notation', () => {
    expect(parseModifiers('4d6sa')).toEqual({ sort: 'asc' })
  })

  test('parses sort descending from notation', () => {
    expect(parseModifiers('4d6sd')).toEqual({ sort: 'desc' })
  })

  test('does not conflict with S{7} (count successes desugars to count)', () => {
    const result = parseModifiers('4d6S{7}')
    expect(result.count).toEqual({ greaterThanOrEqual: 7 })
    expect(result.sort).toBeUndefined()
  })

  test('combines with other modifiers', () => {
    const result = parseModifiers('4d6Lsa')
    expect(result.drop).toEqual({ lowest: 1 })
    expect(result.sort).toBe('asc')
  })
})

describe('Sort in isDiceNotation', () => {
  test('4d6s is NOT valid notation (bare s not in spec)', () => {
    expect(isDiceNotation('4d6s')).toBe(false)
  })

  test('4d6sa is valid notation', () => {
    expect(isDiceNotation('4d6sa')).toBe(true)
  })

  test('4d6sd is valid notation', () => {
    expect(isDiceNotation('4d6sd')).toBe(true)
  })

  test('4d6Ls is NOT valid notation (bare s not in spec)', () => {
    expect(isDiceNotation('4d6Ls')).toBe(false)
  })
})

describe('Sort in modifiersToNotation', () => {
  test('includes sort ascending as sa in notation output', () => {
    expect(modifiersToNotation({ sort: 'asc' })).toBe('sa')
  })

  test('includes sort descending in notation output', () => {
    expect(modifiersToNotation({ sort: 'desc' })).toBe('sd')
  })
})

describe('Sort in modifiersToDescription', () => {
  test('includes sort in description output', () => {
    expect(modifiersToDescription({ sort: 'asc' })).toEqual(['Sort ascending'])
  })

  test('includes sort descending in description output', () => {
    expect(modifiersToDescription({ sort: 'desc' })).toEqual(['Sort descending'])
  })
})
