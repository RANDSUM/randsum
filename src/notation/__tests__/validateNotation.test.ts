import { describe, expect, it } from 'bun:test'

import type { DiceNotation } from '../types'
import { validateNotation } from '../validateNotation'

describe('validateNotation', () => {
  describe('when the notation is completely invalid', () => {
    const notation = 'invalid-notation'

    it('returns an error result', () => {
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: false,
        argument: notation,
        notation: undefined,
        config: undefined,
        description: undefined
      })
    })
  })

  describe('when given a typesafe but incorrect dice notation', () => {
    const notation: DiceNotation = '2d5XXddf'

    it('returns an error result', () => {
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: false,
        argument: notation,
        notation: undefined,
        config: undefined,
        description: undefined
      })
    })
  })

  describe('when given comma-less multiple dice notation', () => {
    const notations: DiceNotation[] = [
      '2d5D{2>2}',
      '2d5V{1=2>2=2}',
      '2d5R{2>2}',
      '2d5U{2>2}',
      '2d5C2>2'
    ]

    notations.forEach((notation) => {
      it(`returns an error result for ${notation}`, () => {
        const result = validateNotation(notation)

        expect(result).toEqual({
          valid: false,
          argument: notation,
          notation: undefined,
          config: undefined,
          description: undefined
        })
      })
    })
  })

  describe('when given a nonsensical drop notation that is bugging me', () => {
    const notation: DiceNotation = '2d5D'

    it('returns an error result', () => {
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: false,
        argument: notation,
        notation: undefined,
        config: undefined,
        description: undefined
      })
    })
  })

  describe('when given a numerical notation', () => {
    it('returns a valid result', () => {
      const notation = '2d6'
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: true,
        argument: notation,
        notation: '2d6',
        config: { sides: 6, quantity: 2, modifiers: {} },
        description: ['Roll 2 6-sided dice']
      })

      const notation2 = '1D20'
      const result2 = validateNotation(notation2)

      expect(result2).toEqual({
        valid: true,
        argument: notation2,
        notation: '1d20',
        config: { sides: 20, quantity: 1, modifiers: {} },
        description: ['Roll 1 20-sided die']
      })
    })
  })
})
