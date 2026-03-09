import { describe, expect, test } from 'bun:test'
import {
  formatComparisonDescription,
  formatComparisonNotation,
  hasConditions,
  parseComparisonNotation
} from '@randsum/notation'

describe('parseComparisonNotation', () => {
  test('parses greater than', () => {
    expect(parseComparisonNotation('>5')).toEqual({ greaterThan: 5 })
  })

  test('parses less than', () => {
    expect(parseComparisonNotation('<3')).toEqual({ lessThan: 3 })
  })

  test('parses greater than or equal', () => {
    expect(parseComparisonNotation('>=10')).toEqual({ greaterThanOrEqual: 10 })
  })

  test('parses less than or equal', () => {
    expect(parseComparisonNotation('<=2')).toEqual({ lessThanOrEqual: 2 })
  })

  test('parses exact values with = prefix', () => {
    expect(parseComparisonNotation('=5')).toEqual({ exact: [5] })
  })

  test('parses bare number as exact', () => {
    expect(parseComparisonNotation('4')).toEqual({ exact: [4] })
  })

  test('parses multiple conditions', () => {
    const result = parseComparisonNotation('>5,<2')
    expect(result.greaterThan).toBe(5)
    expect(result.lessThan).toBe(2)
  })

  test('parses braces around conditions', () => {
    const result = parseComparisonNotation('{>5,<2}')
    expect(result.greaterThan).toBe(5)
    expect(result.lessThan).toBe(2)
  })

  test('parses multiple exact values', () => {
    const result = parseComparisonNotation('1,2,3')
    expect(result.exact).toEqual([1, 2, 3])
  })

  test('handles mixed conditions', () => {
    const result = parseComparisonNotation('>10,<=2,=5')
    expect(result.greaterThan).toBe(10)
    expect(result.lessThanOrEqual).toBe(2)
    expect(result.exact).toEqual([5])
  })

  test('handles empty parts after split', () => {
    const result = parseComparisonNotation('>5')
    expect(result.greaterThan).toBe(5)
  })

  test('ignores NaN values', () => {
    const result = parseComparisonNotation('abc')
    expect(result.exact).toBeUndefined()
  })
})

describe('hasConditions', () => {
  test('returns false for empty object', () => {
    expect(hasConditions({})).toBe(false)
  })

  test('returns true for greaterThan', () => {
    expect(hasConditions({ greaterThan: 5 })).toBe(true)
  })

  test('returns true for greaterThanOrEqual', () => {
    expect(hasConditions({ greaterThanOrEqual: 5 })).toBe(true)
  })

  test('returns true for lessThan', () => {
    expect(hasConditions({ lessThan: 3 })).toBe(true)
  })

  test('returns true for lessThanOrEqual', () => {
    expect(hasConditions({ lessThanOrEqual: 3 })).toBe(true)
  })

  test('returns true for exact with values', () => {
    expect(hasConditions({ exact: [1, 2] })).toBe(true)
  })

  test('returns false for exact with empty array', () => {
    expect(hasConditions({ exact: [] })).toBe(false)
  })
})

describe('formatComparisonNotation', () => {
  test('formats greater than', () => {
    expect(formatComparisonNotation({ greaterThan: 5 })).toEqual(['>5'])
  })

  test('formats less than', () => {
    expect(formatComparisonNotation({ lessThan: 3 })).toEqual(['<3'])
  })

  test('formats greater than or equal', () => {
    expect(formatComparisonNotation({ greaterThanOrEqual: 10 })).toEqual(['>=10'])
  })

  test('formats less than or equal', () => {
    expect(formatComparisonNotation({ lessThanOrEqual: 2 })).toEqual(['<=2'])
  })

  test('formats exact values', () => {
    expect(formatComparisonNotation({ exact: [1, 6] })).toEqual(['1', '6'])
  })

  test('formats multiple conditions', () => {
    const result = formatComparisonNotation({ greaterThan: 5, lessThan: 2 })
    expect(result).toContain('>5')
    expect(result).toContain('<2')
  })

  test('returns empty array for empty options', () => {
    expect(formatComparisonNotation({})).toEqual([])
  })
})

describe('formatComparisonDescription', () => {
  test('formats greater than description', () => {
    expect(formatComparisonDescription({ greaterThan: 5 })).toEqual(['greater than 5'])
  })

  test('formats less than description', () => {
    expect(formatComparisonDescription({ lessThan: 3 })).toEqual(['less than 3'])
  })

  test('formats greater than or equal description', () => {
    expect(formatComparisonDescription({ greaterThanOrEqual: 10 })).toEqual([
      'greater than or equal to 10'
    ])
  })

  test('formats less than or equal description', () => {
    expect(formatComparisonDescription({ lessThanOrEqual: 2 })).toEqual(['less than or equal to 2'])
  })

  test('formats exact values using formatHumanList', () => {
    const result = formatComparisonDescription({ exact: [1, 6] })
    expect(result).toEqual(['1 and 6'])
  })

  test('formats multiple conditions', () => {
    const result = formatComparisonDescription({ greaterThan: 5, lessThan: 2 })
    expect(result).toContain('greater than 5')
    expect(result).toContain('less than 2')
  })

  test('returns empty array for empty options', () => {
    expect(formatComparisonDescription({})).toEqual([])
  })
})
