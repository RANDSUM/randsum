import { describe, expect, spyOn, test } from 'bun:test'
import { InvalidUniqueError, applyModifiers } from '../../src'
import type { RollParameters } from '../../src'
import { D } from '@randsum/dice'
import type { Modifiers } from '@randsum/core'

const mockDie = new D(6)

function modifiedParameters(
  modifiers: Modifiers = {},
  quantity = 6
): RollParameters {
  return {
    config: {
      sides: 6,
      quantity,
      modifiers
    },
    argument: '6d6',
    die: mockDie,
    notation: '6d6',
    description: []
  } as RollParameters
}

const initialRolls = [1, 2, 3, 4, 5, 6]

describe('applyModifiers', () => {
  describe('when the modifiers object is empty', () => {
    test('returns the initial rolls', () => {
      const result = applyModifiers(modifiedParameters(), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls
      })
    })
  })

  describe('when the modifiers object features an add', () => {
    const modifiers = { add: 2 }

    test('returns the initial rolls plus the math modifier', () => {
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 2,
        rolls: initialRolls
      })
    })
  })

  describe('when the modifiers object features a subtract', () => {
    const modifiers = { subtract: 2 }

    test('returns the initial rolls plus the math modifier', () => {
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: -2,
        rolls: initialRolls
      })
    })
  })

  describe('when the modifiers object features a simple reroll', () => {
    const modifiers = {
      reroll: { exact: [4], maxReroll: 1, greaterThan: 6, lessThan: 1 }
    }

    test('returns the initial rolls plus the math modifier', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls.map((roll) => (roll === 4 ? 3 : roll))
      })
    })
  })

  describe('when the modifiers object features a reroll that hits max', () => {
    const modifiers = {
      reroll: { exact: [6] }
    }

    test('returns the initial rolls', () => {
      spyOn(mockDie, 'roll').mockReturnValue(6)
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls
      })
    })
  })

  describe('when the modifiers object features a unique', () => {
    const modifiers = {
      unique: true
    }

    test('returns the initial rolls re-rolling any repeats', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), [5, 5])

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: [5, 3]
      })
    })
  })

  describe('when the modifiers object features a unique when there are more dice being rolled than there are sides', () => {
    const modifiers = {
      unique: true
    }

    test('returns the initial rolls re-rolling any repeats', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      expect(() => {
        applyModifiers(modifiedParameters(modifiers, 10), [5, 5])
      }).toThrowError(InvalidUniqueError)
    })
  })

  describe('when the modifiers object features a notunique', () => {
    const modifiers = {
      unique: { notUnique: [4] }
    }

    test('returns the initial rolls re-rolling any repeats except for the notunique', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), [5, 5, 4, 4])

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: [5, 3, 4, 4]
      })
    })
  })

  describe('when the modifiers object features a simple replace', () => {
    const modifiers = {
      replace: { from: 4, to: 3 }
    }

    test('returns the initial rolls with the right replaced values', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls.map((roll) => (roll === 4 ? 3 : roll))
      })
    })
  })

  describe('when the modifiers object features a complex replace', () => {
    const modifiers = {
      replace: { from: { greaterThan: 2 }, to: 2 }
    }

    test('returns the initial rolls with the right replaced values', () => {
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls.map((roll) => (roll > 2 ? 2 : roll))
      })
    })
  })

  describe('when the modifiers object features a greaterThan cap', () => {
    const modifiers = {
      cap: { greaterThan: 4 }
    }

    test('returns the initial rolls within the caps', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls.map((roll) => (roll > 4 ? 4 : roll))
      })
    })
  })

  describe('when the modifiers object features a lessThan cap', () => {
    const modifiers = {
      cap: { lessThan: 4 }
    }

    test('returns the initial rolls within the caps', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls.map((roll) => (roll < 4 ? 4 : roll))
      })
    })
  })

  describe('when the modifiers object features a simple drop', () => {
    const modifiers = {
      drop: { greaterThan: 4 }
    }

    test('returns the initial rolls without any numbers dropped', () => {
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls
          .map((roll) => (roll > 4 ? undefined : roll))
          .filter((roll) => roll !== undefined)
      })
    })
  })

  describe('when the modifiers object features a complex drop', () => {
    const modifiers = {
      drop: { highest: 2 }
    }

    test('returns the initial rolls without any numbers dropped', () => {
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: initialRolls
          .map((roll) => (roll > 4 ? undefined : roll))
          .filter((roll) => roll !== undefined)
      })
    })
  })

  describe('when the modifiers object features an explode', () => {
    const modifiers = {
      explode: true
    }

    test('returns the initial rolls with any max-rolls re-rolled', () => {
      spyOn(mockDie, 'roll').mockReturnValueOnce(3)
      const result = applyModifiers(modifiedParameters(modifiers), initialRolls)

      expect(result).toEqual({
        simpleMathModifier: 0,
        rolls: [...initialRolls, 3]
      })
    })
  })
})
