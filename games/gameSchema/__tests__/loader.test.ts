import { resolve } from 'node:path'

import { describe, expect, test } from 'bun:test'

import testSpec from './fixtures/test.randsum.json'
import { loadSpec, loadSpecAsync } from '../src'

const TEST_SPEC_PATH = resolve(import.meta.dir, './fixtures/test.randsum.json')

const VALID_ROLL_RESULTS = ['high', 'low'] as const
const VALID_BONUS_RESULTS = ['done'] as const

describe('loadSpec with file path', () => {
  test('loads spec from disk path and returns callable roll functions', () => {
    const game = loadSpec(TEST_SPEC_PATH)
    const result = game.roll({ count: 2 })
    expect(VALID_ROLL_RESULTS).toContain(result.result)
    expect(result.rolls).toHaveLength(1)
  })

  test('same keys as loadSpec with spec object', () => {
    const fromPath = loadSpec(TEST_SPEC_PATH)
    const fromObj = loadSpec(testSpec)
    expect(Object.keys(fromPath).sort()).toEqual(Object.keys(fromObj).sort())
  })
})

describe('loadSpecAsync with file path', () => {
  test('loads spec asynchronously from disk path', async () => {
    const game = await loadSpecAsync(TEST_SPEC_PATH)
    const result = game.roll({ count: 2 })
    expect(VALID_ROLL_RESULTS).toContain(result.result)
    expect(result.rolls).toHaveLength(1)
  })

  test('same keys as loadSpec with spec object', async () => {
    const fromPath = await loadSpecAsync(TEST_SPEC_PATH)
    const fromObj = loadSpec(testSpec)
    expect(Object.keys(fromPath).sort()).toEqual(Object.keys(fromObj).sort())
  })
})

describe('loadSpec with test.randsum.json', () => {
  const game = loadSpec(testSpec)

  describe('roll', () => {
    test('count 3: result in valid set, rolls.length === 1, total 1-6', () => {
      const result = game.roll({ count: 3 })
      expect(VALID_ROLL_RESULTS).toContain(result.result)
      expect(result.rolls).toHaveLength(1)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.total).toBeLessThanOrEqual(6)
    })

    test('no input: uses default count 1, returns valid result', () => {
      const result = game.roll()
      expect(VALID_ROLL_RESULTS).toContain(result.result)
      expect(result.rolls).toHaveLength(1)
    })

    test('rolls expose initialRolls on each RollRecord', () => {
      const result = game.roll({ count: 3 })
      expect(result.rolls[0]?.initialRolls).toHaveLength(3)
    })

    test('100-iteration stress test: all results are valid', () => {
      Array.from({ length: 100 }).forEach(() => {
        const result = game.roll({ count: Math.floor(Math.random() * 4) + 1 })
        expect(VALID_ROLL_RESULTS).toContain(result.result)
        expect(typeof result.total).toBe('number')
        expect(result.rolls).toHaveLength(1)
      })
    })
  })

  describe('rollBonus', () => {
    test('sides 8: result valid, rolls.length === 1', () => {
      const result = game.rollBonus({ sides: 8 })
      expect(VALID_BONUS_RESULTS).toContain(result.result)
      expect(result.rolls).toHaveLength(1)
    })

    test('no input: uses default sides 6, returns valid result', () => {
      const result = game.rollBonus()
      expect(VALID_BONUS_RESULTS).toContain(result.result)
    })
  })

  describe('spec keys', () => {
    test('exposes roll and rollBonus', () => {
      expect(Object.keys(game).sort()).toEqual(['roll', 'rollBonus'])
    })
  })
})
