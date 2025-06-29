import { beforeEach, describe, expect, test } from 'bun:test'
import { UniqueModifier } from '../../src/modifiers/UniqueModifier'
import type {
  NumericRollBonus,
  RequiredNumericRollParameters
} from '../../src/types'
import { RandsumError } from '../../src/errors'

describe('UniqueModifier', () => {
  describe('static pattern', () => {
    test('matches unique notation correctly', () => {
      const pattern = UniqueModifier.pattern

      expect('U'.match(pattern)).not.toBeNull()
      expect('u'.match(pattern)).not.toBeNull()
      expect('U{1}'.match(pattern)).not.toBeNull()
      expect('U{1,2}'.match(pattern)).not.toBeNull()
      expect('2d6U'.match(pattern)).not.toBeNull()

      expect('1d20'.match(pattern)).toBeNull()
      expect('2d6+1'.match(pattern)).toBeNull()
    })
  })

  describe('static parse', () => {
    test('extracts basic unique flag', () => {
      const result = UniqueModifier.parse('U')
      expect(result).toEqual({ unique: true })
    })

    test('extracts notUnique values', () => {
      const result = UniqueModifier.parse('U{1}')
      expect(result).toEqual({ unique: { notUnique: [1] } })
    })

    test('extracts multiple notUnique values', () => {
      const result = UniqueModifier.parse('U{1,2}')
      expect(result).toEqual({ unique: { notUnique: [1, 2] } })
    })

    test('returns empty object when no unique notation found', () => {
      const result = UniqueModifier.parse('2d20')
      expect(result).toEqual({})
    })
  })

  describe('apply', () => {
    const mockRollSequence = [4, 5, 6]
    let rollIndex = 0
    const mockRollOne = (): number => {
      const value = mockRollSequence[rollIndex % mockRollSequence.length]
      rollIndex++
      return Number(value)
    }

    beforeEach(() => {
      rollIndex = 0
    })

    test('ensures all values are unique', () => {
      const modifier = new UniqueModifier(true)
      const bonus: NumericRollBonus = {
        rolls: [1, 2, 1],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 3
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([1, 2, 4])
    })

    test('allows specified values to be duplicated', () => {
      const modifier = new UniqueModifier({ notUnique: [1] })
      const bonus: NumericRollBonus = {
        rolls: [1, 2, 1, 2],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 4
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result.rolls).toEqual([1, 2, 1, 4])
    })

    test('throws RandsumError when more rolls than sides', () => {
      const modifier = new UniqueModifier(true)
      const bonus: NumericRollBonus = {
        rolls: [1, 2, 3],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 2,
        quantity: 3
      }

      expect(() => {
        modifier.apply(bonus, params, mockRollOne)
      }).toThrow(RandsumError)
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new UniqueModifier(undefined)
      const bonus: NumericRollBonus = {
        rolls: [1, 1, 2],
        simpleMathModifier: 0
      }
      const params: RequiredNumericRollParameters = {
        sides: 6,
        quantity: 3
      }

      const result = modifier.apply(bonus, params, mockRollOne)
      expect(result).toBe(bonus)
    })
  })

  describe('toDescription', () => {
    test('returns description for boolean unique modifier', () => {
      const modifier = new UniqueModifier(true)
      const result = modifier.toDescription()

      expect(result).toEqual(['No Duplicate Rolls'])
    })

    test('returns description for unique modifier with notUnique values', () => {
      const modifier = new UniqueModifier({ notUnique: [1, 6] })
      const result = modifier.toDescription()

      expect(result).toEqual(['No Duplicates (except [1] and [6])'])
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new UniqueModifier(undefined)
      const result = modifier.toDescription()

      expect(result).toBeUndefined()
    })
  })

  describe('toNotation', () => {
    test('returns notation for boolean unique modifier', () => {
      const modifier = new UniqueModifier(true)
      const result = modifier.toNotation()

      expect(result).toBe('U')
    })

    test('returns notation for unique modifier with notUnique values', () => {
      const modifier = new UniqueModifier({ notUnique: [1, 6] })
      const result = modifier.toNotation()

      expect(result).toBe('U{1,6}')
    })

    test('returns undefined when options is undefined', () => {
      const modifier = new UniqueModifier(undefined)
      const result = modifier.toNotation()

      expect(result).toBeUndefined()
    })
  })
})
