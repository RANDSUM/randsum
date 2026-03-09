import { describe, expect, test } from 'bun:test'
import { createArithmeticLog, createModifierLog } from '../../../src/lib/modifiers/log'

describe('createArithmeticLog', () => {
  test('creates log with modifier name and options', () => {
    const log = createArithmeticLog('plus', 5)

    expect(log.modifier).toBe('plus')
    expect(log.options).toBe(5)
    expect(log.added).toEqual([])
    expect(log.removed).toEqual([])
  })

  test('creates log with undefined options', () => {
    const log = createArithmeticLog('minus', undefined)

    expect(log.modifier).toBe('minus')
    expect(log.options).toBeUndefined()
    expect(log.added).toEqual([])
    expect(log.removed).toEqual([])
  })

  test('creates log with object options', () => {
    const options = { greaterThan: 5, lessThan: 2 }
    const log = createArithmeticLog('cap', options)

    expect(log.modifier).toBe('cap')
    expect(log.options).toEqual(options)
    expect(log.added).toEqual([])
    expect(log.removed).toEqual([])
  })
})

describe('createModifierLog', () => {
  test('returns empty added/removed when arrays are identical reference', () => {
    const rolls = [1, 2, 3]
    const log = createModifierLog('test', undefined, rolls, rolls)

    expect(log.added).toEqual([])
    expect(log.removed).toEqual([])
  })

  test('handles empty initial rolls', () => {
    const log = createModifierLog('explode', undefined, [], [5, 6])

    expect(log.added).toEqual([5, 6])
    expect(log.removed).toEqual([])
  })

  test('handles empty new rolls', () => {
    const log = createModifierLog('drop', undefined, [1, 2, 3], [])

    expect(log.added).toEqual([])
    expect(log.removed).toEqual([1, 2, 3])
  })

  test('detects added values', () => {
    const log = createModifierLog('explode', undefined, [6], [6, 5])

    expect(log.added).toContain(5)
    expect(log.removed).toEqual([])
  })

  test('detects removed values', () => {
    const log = createModifierLog('drop', { lowest: 1 }, [1, 3, 5], [3, 5])

    expect(log.added).toEqual([])
    expect(log.removed).toContain(1)
  })

  test('detects both added and removed values', () => {
    const log = createModifierLog('reroll', { exact: [1] }, [1, 3, 5], [4, 3, 5])

    expect(log.added).toContain(4)
    expect(log.removed).toContain(1)
  })

  test('handles multiple of same value added', () => {
    const log = createModifierLog('explode', undefined, [6], [6, 6, 6])

    expect(log.added.length).toBe(2)
    expect(log.added).toEqual([6, 6])
  })

  test('handles multiple of same value removed', () => {
    const log = createModifierLog('drop', undefined, [1, 1, 3, 5], [3, 5])

    expect(log.removed.length).toBe(2)
    expect(log.removed).toEqual([1, 1])
  })

  test('includes modifier and options in log', () => {
    const options = { lowest: 2 }
    const log = createModifierLog('drop', options, [1, 2, 3, 4], [3, 4])

    expect(log.modifier).toBe('drop')
    expect(log.options).toEqual(options)
  })
})
