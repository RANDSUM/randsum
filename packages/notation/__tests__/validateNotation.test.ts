import { describe, expect, it } from 'bun:test'
import { validateNotation } from '../src/validateNotation'

describe(validateNotation, () => {
  describe('when the notation is completely invalid', () => {
    const notation = 'invalid-notation'

    it('returns an error result', () => {
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: false,
        description: ['Invalid Notation'],
        digested: {},
        type: 'invalid'
      })
    })
  })

  describe('when given a typesafe but incorrect dice notation', () => {
    const notation = '2d5XXddf'

    it('returns an error result', () => {
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: false,
        description: ['Invalid Notation'],
        digested: {},
        type: 'invalid'
      })
    })
  })

  describe('when given a numerical notation', () => {
    it('returns a valid result', () => {
      const notation = '2d6'
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: true,
        notation: '2d6',
        type: 'numerical',
        digested: { sides: 6, quantity: 2, modifiers: {} },
        description: ['Roll 2 6-sided dice']
      })

      const notation2 = '1D20'
      const result2 = validateNotation(notation2)

      expect(result2).toEqual({
        valid: true,
        notation: '1d20',
        type: 'numerical',
        digested: { sides: 20, quantity: 1, modifiers: {} },
        description: ['Roll 1 20-sided die']
      })
    })
  })

  describe('when given a custom sides notation', () => {
    it('returns a valid result', () => {
      const notation = '2d{ht}'
      const result = validateNotation(notation)

      expect(result).toEqual({
        valid: true,
        notation: '2d{ht}',
        type: 'custom',
        digested: { sides: ['h', 't'], quantity: 2, modifiers: {} },
        description: ['Roll 2 dice with the following sides: (h,t)']
      })
    })
  })

  describe('corner cases', () => {
    describe('when given comma-less multiple dice notation', () => {
      const notations = [
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
            description: ['Invalid Notation'],
            digested: {},
            type: 'invalid'
          })
        })
      })
    })

    describe('when given a nonsensical drop notation that is bugging me', () => {
      const notation = '2d5D'

      it('returns an error result', () => {
        const result = validateNotation(notation)

        expect(result).toEqual({
          valid: false,
          description: ['Invalid Notation'],
          digested: {},
          type: 'invalid'
        })
      })
    })

    describe('when given custom dice faces with modifiers', () => {
      const notation = '2d{ht}L'

      it('returns an error result with appropriate message', () => {
        const result = validateNotation(notation)

        expect(result).toEqual({
          valid: false,
          description: [
            "Conflicting modifiers detected: custom_faces, modifiers",
            "Custom dice faces cannot be used with modifiers",
            "Use standard dice like \"4d6L\" if you need modifiers",
            "Use custom dice like \"2d{H,T}\" without additional modifiers"
          ],
          digested: {},
          type: 'invalid'
        })
      })
    })
  })
})
