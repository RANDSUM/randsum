import { describe, expect, test } from 'bun:test'
import { compareValues, evaluateNormalizedWhen } from '../../src/lib/conditionEvaluator'
import { SchemaError } from '../../src/lib/errors'
import type { NormalizedRollCase } from '../../src/lib/normalizedTypes'

describe('compareValues', () => {
  test('= operator with matching values', () => {
    expect(compareValues(5, '=', 5)).toBe(true)
  })

  test('= operator with non-matching values', () => {
    expect(compareValues(5, '=', 6)).toBe(false)
  })

  test('= operator with string values', () => {
    expect(compareValues('hello', '=', 'hello')).toBe(true)
    expect(compareValues('hello', '=', 'world')).toBe(false)
  })

  test('> operator', () => {
    expect(compareValues(10, '>', 5)).toBe(true)
    expect(compareValues(5, '>', 10)).toBe(false)
    expect(compareValues(5, '>', 5)).toBe(false)
  })

  test('>= operator', () => {
    expect(compareValues(10, '>=', 5)).toBe(true)
    expect(compareValues(5, '>=', 5)).toBe(true)
    expect(compareValues(4, '>=', 5)).toBe(false)
  })

  test('< operator', () => {
    expect(compareValues(3, '<', 5)).toBe(true)
    expect(compareValues(5, '<', 5)).toBe(false)
    expect(compareValues(6, '<', 5)).toBe(false)
  })

  test('<= operator', () => {
    expect(compareValues(3, '<=', 5)).toBe(true)
    expect(compareValues(5, '<=', 5)).toBe(true)
    expect(compareValues(6, '<=', 5)).toBe(false)
  })

  test('throws for non-numeric values with > operator', () => {
    expect(() => compareValues('a', '>', 'b')).toThrow(SchemaError)
    expect(() => compareValues('a', '>', 'b')).toThrow('requires numeric values')
  })

  test('throws for non-numeric values with >= operator', () => {
    expect(() => compareValues('a', '>=', 'b')).toThrow('requires numeric values')
  })

  test('throws for non-numeric values with < operator', () => {
    expect(() => compareValues('a', '<', 'b')).toThrow('requires numeric values')
  })

  test('throws for non-numeric values with <= operator', () => {
    expect(() => compareValues('a', '<=', 'b')).toThrow('requires numeric values')
  })
})

describe('evaluateNormalizedWhen', () => {
  test('returns undefined for undefined cases', () => {
    expect(evaluateNormalizedWhen(undefined, {})).toBeUndefined()
  })

  test('returns undefined when no conditions match', () => {
    const cases: readonly NormalizedRollCase[] = [
      {
        condition: { input: 'mode', operator: '=', value: 'boost' },
        override: { modify: [] }
      }
    ]
    expect(evaluateNormalizedWhen(cases, { mode: 'normal' })).toBeUndefined()
  })

  test('returns undefined when input is missing', () => {
    const cases: readonly NormalizedRollCase[] = [
      {
        condition: { input: 'mode', operator: '=', value: 'boost' },
        override: { modify: [] }
      }
    ]
    expect(evaluateNormalizedWhen(cases, {})).toBeUndefined()
  })

  test('returns override when condition matches', () => {
    const override = { modify: [] }
    const cases: readonly NormalizedRollCase[] = [
      {
        condition: { input: 'mode', operator: '=', value: 'boost' },
        override
      }
    ]
    expect(evaluateNormalizedWhen(cases, { mode: 'boost' })).toBe(override)
  })

  test('returns first matching override', () => {
    const override1 = { modify: [] }
    const override2 = { modify: [{ add: 5 }] }
    const cases: readonly NormalizedRollCase[] = [
      {
        condition: { input: 'val', operator: '>', value: 5 },
        override: override1
      },
      {
        condition: { input: 'val', operator: '>', value: 3 },
        override: override2
      }
    ]
    expect(evaluateNormalizedWhen(cases, { val: 10 })).toBe(override1)
  })
})
