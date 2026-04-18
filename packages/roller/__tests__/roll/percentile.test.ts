import { describe, expect, test } from 'bun:test'
import { roll } from '../../src'
import { STRESS_ITERATIONS } from '../stressIterations'

describe('Percentile dice (d%)', () => {
  test('roll("d%") returns a result', () => {
    const result = roll('d%')
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  test('roll("D%") is case-insensitive', () => {
    const result = roll('D%')
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(100)
  })

  test('result has correct structure', () => {
    const result = roll('d%')
    expect(result.rolls).toHaveLength(1)
    expect(result.rolls[0]!.rolls).toHaveLength(1)
  })

  test('stress test: all values in [1, 100]', () => {
    Array.from({ length: STRESS_ITERATIONS }).forEach(() => {
      const result = roll('d%')
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(100)
    })
  })

  test('multiple d% arguments work', () => {
    const result = roll('d%', 'd%')
    expect(result.rolls).toHaveLength(2)
    expect(result.total).toBeGreaterThanOrEqual(2)
    expect(result.total).toBeLessThanOrEqual(200)
  })

  test('d% mixed with other arguments', () => {
    const result = roll('d%', 20, '2d6')
    expect(result.rolls).toHaveLength(3)
  })
})
