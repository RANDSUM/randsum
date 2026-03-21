import { describe, expect, test } from 'bun:test'
import { matchesComparison } from '../../../src/lib/comparison/matchesComparison'

describe('matchesComparison', () => {
  test('greaterThanOrEqual', () => {
    expect(matchesComparison(8, { greaterThanOrEqual: 8 })).toBe(true)
    expect(matchesComparison(7, { greaterThanOrEqual: 8 })).toBe(false)
    expect(matchesComparison(9, { greaterThanOrEqual: 8 })).toBe(true)
  })

  test('greaterThan', () => {
    expect(matchesComparison(9, { greaterThan: 8 })).toBe(true)
    expect(matchesComparison(8, { greaterThan: 8 })).toBe(false)
  })

  test('lessThanOrEqual', () => {
    expect(matchesComparison(3, { lessThanOrEqual: 3 })).toBe(true)
    expect(matchesComparison(4, { lessThanOrEqual: 3 })).toBe(false)
  })

  test('lessThan', () => {
    expect(matchesComparison(2, { lessThan: 3 })).toBe(true)
    expect(matchesComparison(3, { lessThan: 3 })).toBe(false)
  })

  test('exact values', () => {
    expect(matchesComparison(5, { exact: [5, 10] })).toBe(true)
    expect(matchesComparison(6, { exact: [5, 10] })).toBe(false)
    expect(matchesComparison(10, { exact: [5, 10] })).toBe(true)
  })

  test('multiple conditions OR together', () => {
    expect(matchesComparison(9, { greaterThanOrEqual: 8, exact: [3] })).toBe(true)
    expect(matchesComparison(3, { greaterThanOrEqual: 8, exact: [3] })).toBe(true)
    expect(matchesComparison(5, { greaterThanOrEqual: 8, exact: [3] })).toBe(false)
  })
})
