import { describe, expect, test } from 'bun:test'
import { rollNotation } from '../src/tools/roll'

describe('rollNotation', () => {
  test('rolls basic notation within range', () => {
    const result = rollNotation({ notation: '1d20' })
    expect(result.notation).toBe('1d20')
    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(20)
    expect(result.pools).toHaveLength(1)
    expect(result.pools[0]?.rolls).toHaveLength(1)
    expect(typeof result.description).toBe('string')
  })

  test('is deterministic for a given seed', () => {
    const a = rollNotation({ notation: '4d6L', seed: 42 })
    const b = rollNotation({ notation: '4d6L', seed: 42 })
    expect(a.total).toBe(b.total)
    expect(a.pools[0]?.rolls).toEqual(b.pools[0]?.rolls ?? [])
  })

  test('different seeds generally differ', () => {
    const a = rollNotation({ notation: '20d20', seed: 1 })
    const b = rollNotation({ notation: '20d20', seed: 2 })
    expect(a.total).not.toBe(b.total)
  })

  test('combines multiple pools when notation has arithmetic', () => {
    const result = rollNotation({ notation: '2d6+3', seed: 7 })
    expect(result.total).toBeGreaterThanOrEqual(5)
    expect(result.total).toBeLessThanOrEqual(15)
  })

  test('throws with a suggestion on invalid notation', () => {
    expect(() => rollNotation({ notation: 'not-dice' })).toThrow(/Invalid dice notation/)
  })
})
