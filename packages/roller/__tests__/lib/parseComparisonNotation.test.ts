import { describe, expect, test } from 'bun:test'
import { parseComparisonNotation } from '../../src/lib/comparison'

describe('parseComparisonNotation — >= and <=', () => {
  test('parses >= alone', () => {
    const result = parseComparisonNotation('>=5')
    expect(result.greaterThanOrEqual).toBe(5)
  })

  test('parses <= alone', () => {
    const result = parseComparisonNotation('<=3')
    expect(result.lessThanOrEqual).toBe(3)
  })

  test('parses >= combined with other operators', () => {
    const result = parseComparisonNotation('>=5,<2')
    expect(result.greaterThanOrEqual).toBe(5)
    expect(result.lessThan).toBe(2)
  })

  test('parses <= combined with other operators', () => {
    const result = parseComparisonNotation('<=3,>1')
    expect(result.lessThanOrEqual).toBe(3)
    expect(result.greaterThan).toBe(1)
  })

  test('parses braced >= and <=', () => {
    const result = parseComparisonNotation('{>=4,<=2}')
    expect(result.greaterThanOrEqual).toBe(4)
    expect(result.lessThanOrEqual).toBe(2)
  })
})
