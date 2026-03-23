import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/notation/isDiceNotation'
import { roll } from '../../src'

describe('multi-pool special dice notation', () => {
  describe('isDiceNotation', () => {
    describe('percentile in multi-pool', () => {
      test('isDiceNotation("1d20+1d%") returns true', () => {
        expect(isDiceNotation('1d20+1d%')).toBe(true)
      })

      test('isDiceNotation("1d20+d%") returns true', () => {
        expect(isDiceNotation('1d20+d%')).toBe(true)
      })

      test('isDiceNotation("1d20-1d%") returns true', () => {
        expect(isDiceNotation('1d20-1d%')).toBe(true)
      })

      test('isDiceNotation("1d%+1d20") returns true', () => {
        expect(isDiceNotation('1d%+1d20')).toBe(true)
      })

      test('isDiceNotation("3d%+2d6") returns true', () => {
        expect(isDiceNotation('3d%+2d6')).toBe(true)
      })
    })

    describe('geometric in multi-pool', () => {
      test('isDiceNotation("1d20+g6") returns true', () => {
        expect(isDiceNotation('1d20+g6')).toBe(true)
      })

      test('isDiceNotation("1d20+3g6") returns true', () => {
        expect(isDiceNotation('1d20+3g6')).toBe(true)
      })

      test('isDiceNotation("1d20-g6") returns true', () => {
        expect(isDiceNotation('1d20-g6')).toBe(true)
      })

      test('isDiceNotation("g6+1d20") returns true', () => {
        expect(isDiceNotation('g6+1d20')).toBe(true)
      })
    })

    describe('draw die in multi-pool', () => {
      test('isDiceNotation("4d6L+3DD8") returns true', () => {
        expect(isDiceNotation('4d6L+3DD8')).toBe(true)
      })

      test('isDiceNotation("1d20+DD6") returns true', () => {
        expect(isDiceNotation('1d20+DD6')).toBe(true)
      })

      test('isDiceNotation("1d20-3DD8") returns true', () => {
        expect(isDiceNotation('1d20-3DD8')).toBe(true)
      })

      test('isDiceNotation("DD6+1d20") returns true', () => {
        expect(isDiceNotation('DD6+1d20')).toBe(true)
      })
    })

    describe('scope fence: non-numeric stays invalid in multi-pool', () => {
      test('isDiceNotation("1d20+dF") returns false', () => {
        expect(isDiceNotation('1d20+dF')).toBe(false)
      })

      test('isDiceNotation("1d20+d{H,T}") returns false', () => {
        expect(isDiceNotation('1d20+d{H,T}')).toBe(false)
      })
    })
  })

  describe('roll', () => {
    describe('1d20+1d% produces 2 roll records', () => {
      test('roll("1d20+1d%").rolls.length is 2', () => {
        const result = roll('1d20+1d%')
        expect(result.rolls).toHaveLength(2)
      })

      test('roll("1d20+1d%") has correct sides', () => {
        const result = roll('1d20+1d%')
        const sides = result.rolls.map(r => r.parameters.sides).sort((a, b) => a - b)
        expect(sides).toEqual([20, 100])
      })
    })

    describe('1d20+g6 produces 2 roll records', () => {
      test('roll("1d20+g6").rolls.length is 2', () => {
        const result = roll('1d20+g6')
        expect(result.rolls).toHaveLength(2)
      })
    })

    describe('4d6L+3DD8 produces 2 roll records', () => {
      test('roll("4d6L+3DD8").rolls.length is 2', () => {
        const result = roll('4d6L+3DD8')
        expect(result.rolls).toHaveLength(2)
      })
    })

    describe('subtraction arithmetic', () => {
      test('roll("1d20-1d%") roll[1] has arithmetic subtract', () => {
        const result = roll('1d20-1d%')
        expect(result.rolls).toHaveLength(2)
        expect(result.rolls[1]!.parameters.arithmetic).toBe('subtract')
      })
    })
  })
})
