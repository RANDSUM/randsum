import { describe, expect, test } from 'bun:test'
import { matchesCondition } from '../../../src/modifiers/shared/conditionMatch'

describe('matchesCondition', () => {
  test('greaterThanOrEqual', () => {
    expect(matchesCondition(8, { greaterThanOrEqual: 8 })).toBe(true)
    expect(matchesCondition(7, { greaterThanOrEqual: 8 })).toBe(false)
    expect(matchesCondition(9, { greaterThanOrEqual: 8 })).toBe(true)
  })

  test('greaterThan', () => {
    expect(matchesCondition(9, { greaterThan: 8 })).toBe(true)
    expect(matchesCondition(8, { greaterThan: 8 })).toBe(false)
  })

  test('lessThanOrEqual', () => {
    expect(matchesCondition(3, { lessThanOrEqual: 3 })).toBe(true)
    expect(matchesCondition(4, { lessThanOrEqual: 3 })).toBe(false)
  })

  test('lessThan', () => {
    expect(matchesCondition(2, { lessThan: 3 })).toBe(true)
    expect(matchesCondition(3, { lessThan: 3 })).toBe(false)
  })

  test('exact values', () => {
    expect(matchesCondition(5, { exact: [5, 10] })).toBe(true)
    expect(matchesCondition(6, { exact: [5, 10] })).toBe(false)
    expect(matchesCondition(10, { exact: [5, 10] })).toBe(true)
  })

  test('multiple conditions OR together', () => {
    expect(matchesCondition(9, { greaterThanOrEqual: 8, exact: [3] })).toBe(true)
    expect(matchesCondition(3, { greaterThanOrEqual: 8, exact: [3] })).toBe(true)
    expect(matchesCondition(5, { greaterThanOrEqual: 8, exact: [3] })).toBe(false)
  })
})
