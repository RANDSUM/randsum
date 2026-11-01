import { describe, expect, test } from 'bun:test'
import { applyModifier } from '../../../src/modifiers/registry'
import { RANDSUM_MODIFIERS } from '../../../src/modifiers'
import { modifiersOf } from '../../support/modifiersOf'
import { ModifierError } from '../../../src/errors'
import type { ModifierContext } from '../../../src/modifiers/schema'
import type { ModifierOptions } from '../../../src/types'

describe('RANDSUM_MODIFIERS definition contract', () => {
  test('registers exactly 19 modifiers', () => {
    expect(RANDSUM_MODIFIERS).toHaveLength(19)
  })

  test('every modifier carries both schema and behavior fields', () => {
    for (const modifier of RANDSUM_MODIFIERS) {
      expect(modifier.name).toBeDefined()
      expect(typeof modifier.priority).toBe('number')
      expect(modifier.pattern).toBeInstanceOf(RegExp)
      expect(typeof modifier.parse).toBe('function')
      expect(typeof modifier.toNotation).toBe('function')
      expect(typeof modifier.toDescription).toBe('function')
      expect(typeof modifier.apply).toBe('function')
    }
  })
})

describe('applyModifier error cases', () => {
  test('throws ModifierError when modifier requires rollFn but none provided', () => {
    // reroll requires rollFn — no registry mutation needed
    const ctx: ModifierContext = { parameters: { sides: 6, quantity: 4 } }

    expect(() => {
      applyModifier('reroll', { exact: [1] }, [1, 2, 3, 4], ctx)
    }).toThrow(ModifierError)
  })

  test('throws ModifierError when modifier requires parameters but none provided', () => {
    // unique requires parameters for validation — no registry mutation needed
    const rollOne = (): number => 5
    const ctx: ModifierContext = { rollOne }

    expect(() => {
      applyModifier('unique', true, [1, 1, 2, 3], ctx)
    }).toThrow(ModifierError)
  })

  test('throws ModifierError for unknown modifier type', () => {
    expect(() => {
      applyModifier('nonexistent' as keyof ModifierOptions, {}, [1, 2, 3], {
        rollOne: (): number => 5,
        parameters: { sides: 6, quantity: 4 }
      })
    }).toThrow(ModifierError)
  })
})

describe('modifiersOf - stateful regex safety', () => {
  test('returns identical results on repeated calls with same notation', () => {
    const notation = '4d6L+3'
    const result1 = modifiersOf(notation)
    const result2 = modifiersOf(notation)
    const result3 = modifiersOf(notation)
    expect(result1).toEqual(result2)
    expect(result2).toEqual(result3)
  })

  test('returns correct results when alternating between two notations', () => {
    const a = '2d6R{<2}'
    const b = '4d6L'
    Array.from({ length: 20 }).forEach(() => {
      const resultA = modifiersOf(a)
      const resultB = modifiersOf(b)
      expect(resultA.reroll).toBeDefined()
      expect(resultA.drop).toBeUndefined()
      expect(resultB.drop).toBeDefined()
      expect(resultB.reroll).toBeUndefined()
    })
  })
})

describe('applyModifier error propagation', () => {
  test('a ModifierError from apply() keeps its message and context', () => {
    const ctx: ModifierContext = { rollOne: () => 1, parameters: { sides: 6, quantity: 2 } }
    const caught = (() => {
      try {
        applyModifier('unique', true, [1, 1], ctx)
        return undefined
      } catch (error) {
        return error
      }
    })()
    expect(caught).toBeInstanceOf(ModifierError)
    expect((caught as ModifierError).message).toBe(
      'Modifier error for "unique": Could not find a unique value after 99 attempts'
    )
  })

  test('a non-RANDSUM error is a bug and propagates unchanged', () => {
    const ctx: ModifierContext = {
      rollOne: () => {
        throw new TypeError('boom')
      },
      parameters: { sides: 6, quantity: 1 }
    }
    expect(() => applyModifier('reroll', { exact: [1] }, [1], ctx)).toThrow(TypeError)
  })
})
