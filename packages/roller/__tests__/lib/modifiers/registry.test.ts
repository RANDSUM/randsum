import { describe, expect, test } from 'bun:test'
import { applyModifier } from '../../../src/modifiers/registry'
import { RANDSUM_MODIFIERS } from '../../../src/modifiers'
import { modifiersOf } from '../../support/modifiersOf'
import { ModifierError } from '../../../src/errors'
import { contextOf } from '../../support/modifierContext'

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

describe('applyModifier error cases', () => {})

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
    const ctx = contextOf({ rollOne: () => 1, parameters: { sides: 6, quantity: 2 } })
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
    const ctx = contextOf({
      rollOne: () => {
        throw new TypeError('boom')
      },
      parameters: { sides: 6, quantity: 1 }
    })
    expect(() => applyModifier('reroll', { exact: [1] }, [1], ctx)).toThrow(TypeError)
  })
})

// Spec 3.3: stage boundaries are structural. Stage 1 (priority < 40) never rolls
// new dice; Stage 3 (priority >= 80) never changes the pool, except Sort, the
// presentation directive that may reorder it (spec 6.6.1).
describe('modifier stage metadata', () => {
  test.each(RANDSUM_MODIFIERS.map(m => [m.name, m] as const))('%s respects its stage', (_, m) => {
    if (m.priority < 40) expect(m.requiresRollFn).not.toBe(true)
    if (m.priority >= 80 && m.name !== 'sort') expect(m.mutatesRolls).toBe(false)
  })
})
