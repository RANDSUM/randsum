import { describe, expect, it } from 'bun:test'
import {
  validateCustomFacesNotation,
  type CustomFacesDiceNotation
} from '../src'

describe('validate', () => {
  describe('when given a valid custom dice notation', () => {
    const notation: CustomFacesDiceNotation = '2d{HT}'

    it('returns a valid result', () => {
      const result = validateCustomFacesNotation(notation)

      expect(result).toEqual({
        valid: true,
        notation: '2d{HT}',
        config: {
          sides: 2,
          quantity: 2,
          faces: ['H', 'T']
        },
        description: ['Roll 2 2-sided dice', 'with faces: H, T']
      })
    })
  })

  describe('when the notation is completely invalid', () => {
    const notation = 'invalid-notation'

    it('returns an error result', () => {
      const result = validateCustomFacesNotation(notation)

      expect(result).toEqual({
        valid: false,
        notation,
        config: undefined,
        description: undefined
      })
    })
  })
})
