import { describe, expect, it } from 'bun:test'
import { customNotationToCustomRollConfig } from '../src/utils/customNotationToCustomRollConfig'

describe('customNotificationToCustomRollConfig', () => {
  describe('given standard dice notation', () => {
    const argument = '2d6'

    it('returns a valid custom roll config', () => {
      const result = customNotationToCustomRollConfig(argument)

      expect(result).toEqual({
        faces: ['1', '2', '3', '4', '5', '6'],
        quantity: 2,
        sides: 6
      })
    })
  })

  describe('given custom dice notation', () => {
    const argument = '2d{++  --}'

    it('returns a valid custom roll config', () => {
      const result = customNotationToCustomRollConfig(argument)

      expect(result).toEqual({
        faces: ['+', '+', ' ', ' ', '-', '-'],
        quantity: 2,
        sides: 6
      })
    })
  })
})
