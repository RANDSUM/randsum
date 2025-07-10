import { describe, expect, test } from 'bun:test'
import { UniqueModifier } from '../../../src/lib'
import { RandsumError } from '../../../src/lib'
import {
  createMockRollOne,
  createRollBonus,
  createRequiredRollParameters
} from '../../support/fixtures'

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
    test('ensures all values are unique', () => {
      const modifier = new UniqueModifier(true)
      const bonus = createRollBonus({
        rolls: [1, 2, 1]
      })
      const params = createRequiredRollParameters({
        quantity: 3
      })

      const result = modifier.apply(bonus, params, createMockRollOne())
      expect(result.rolls).toEqual([1, 2, 4])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'unique',
        options: true,
        added: [4],
        removed: [1]
      })
    })

    test('allows specified values to be duplicated', () => {
      const modifier = new UniqueModifier({ notUnique: [1] })
      const bonus = createRollBonus({
        rolls: [1, 2, 1, 2]
      })
      const params = createRequiredRollParameters({
        quantity: 4
      })

      const result = modifier.apply(bonus, params, createMockRollOne())
      expect(result.rolls).toEqual([1, 2, 1, 4])

      expect(result.logs).toHaveLength(1)
      expect(result.logs[0]).toMatchObject({
        modifier: 'unique',
        options: { notUnique: [1] },
        added: [4],
        removed: [2]
      })
    })

    test('throws RandsumError when more rolls than sides', () => {
      const modifier = new UniqueModifier(true)
      const bonus = createRollBonus({
        rolls: [1, 2, 3]
      })
      const params = createRequiredRollParameters({
        sides: 2,
        quantity: 3
      })

      expect(() => {
        modifier.apply(bonus, params, createMockRollOne())
      }).toThrow(RandsumError)
    })

    test('returns original bonus when options is undefined', () => {
      const modifier = new UniqueModifier(undefined)
      const bonus = createRollBonus({
        rolls: [1, 1, 2]
      })
      const params = createRequiredRollParameters({
        quantity: 3
      })

      const result = modifier.apply(bonus, params, createMockRollOne())
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
