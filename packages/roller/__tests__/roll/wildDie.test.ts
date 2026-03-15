import { describe, expect, test } from 'bun:test'
import { roll } from '../../src/index'

describe('Wild Die (W) integration', () => {
  test('roll with wild die notation produces a result', () => {
    const result = roll('5d6W')

    expect(result.total).toBeTypeOf('number')
    expect(result.rolls).toHaveLength(1)
  })

  test('roll with wild die via options object', () => {
    const result = roll({ sides: 6, quantity: 5, modifiers: { wildDie: true } })

    expect(result.total).toBeTypeOf('number')
    expect(result.rolls).toHaveLength(1)
  })

  test('wild die modifier appears in modifier logs', () => {
    const result = roll('5d6W')
    const record = result.rolls[0]

    // The wild die modifier should be present in the record
    expect(record?.parameters.modifiers.wildDie).toBe(true)
  })

  test('wild die result total is never NaN', () => {
    // Run multiple times to exercise different random paths
    for (const _ of Array.from({ length: 100 })) {
      const result = roll('5d6W')
      expect(Number.isNaN(result.total)).toBe(false)
    }
  })

  test('wild die with arithmetic', () => {
    const result = roll('5d6W+3')

    expect(result.total).toBeTypeOf('number')
    expect(result.rolls[0]?.parameters.modifiers.plus).toBe(3)
    expect(result.rolls[0]?.parameters.modifiers.wildDie).toBe(true)
  })
})
