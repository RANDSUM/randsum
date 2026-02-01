import { describe, expect, test } from 'bun:test'
import {
  createArithmeticLog,
  createFrequencyMap,
  createModifierLog,
  mergeLogs
} from '../../../src/lib/modifiers/log'

describe('createFrequencyMap', () => {
  test('creates frequency map from array', () => {
    const freq = createFrequencyMap([1, 2, 2, 3, 3, 3])

    expect(freq.get(1)).toBe(1)
    expect(freq.get(2)).toBe(2)
    expect(freq.get(3)).toBe(3)
  })

  test('handles empty array', () => {
    const freq = createFrequencyMap([])

    expect(freq.size).toBe(0)
  })

  test('handles single value', () => {
    const freq = createFrequencyMap([5])

    expect(freq.get(5)).toBe(1)
    expect(freq.size).toBe(1)
  })

  test('handles all same values', () => {
    const freq = createFrequencyMap([4, 4, 4, 4])

    expect(freq.get(4)).toBe(4)
    expect(freq.size).toBe(1)
  })
})

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

describe('mergeLogs', () => {
  test('appends new log to existing logs', () => {
    const existing = [{ modifier: 'drop', options: undefined, added: [], removed: [1] }]
    const newLog = { modifier: 'plus', options: 5, added: [], removed: [] }

    const merged = mergeLogs(existing, newLog)

    expect(merged).toHaveLength(2)
    expect(merged[0]).toEqual(existing[0])
    expect(merged[1]).toEqual(newLog)
  })

  test('handles empty existing logs', () => {
    const newLog = { modifier: 'plus', options: 5, added: [], removed: [] }

    const merged = mergeLogs([], newLog)

    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual(newLog)
  })

  test('does not mutate original array', () => {
    const existing = [{ modifier: 'drop', options: undefined, added: [], removed: [] }]
    const newLog = { modifier: 'plus', options: 5, added: [], removed: [] }

    const merged = mergeLogs(existing, newLog)

    expect(existing).toHaveLength(1)
    expect(merged).toHaveLength(2)
    expect(merged).not.toBe(existing)
  })
})
