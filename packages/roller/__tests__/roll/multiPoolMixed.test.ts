import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/validate'
import { roll } from '../../src/roll'

describe('mixed multi-pool notation', () => {
  describe('isDiceNotation', () => {
    describe('Fate in multi-pool', () => {
      test('isDiceNotation("1d20+dF") returns true', () => {
        expect(isDiceNotation('1d20+dF')).toBe(true)
      })

      test('isDiceNotation("2dF+1d6") returns true', () => {
        expect(isDiceNotation('2dF+1d6')).toBe(true)
      })

      test('isDiceNotation("4dF.2+1d20") returns true', () => {
        expect(isDiceNotation('4dF.2+1d20')).toBe(true)
      })

      test('isDiceNotation("2dF+2dF") returns true', () => {
        expect(isDiceNotation('2dF+2dF')).toBe(true)
      })
    })

    describe('custom faces in multi-pool', () => {
      test('isDiceNotation("1d20+d{H,T}") returns true', () => {
        expect(isDiceNotation('1d20+d{H,T}')).toBe(true)
      })

      test('isDiceNotation("d{H,T}+d{1,2,3}") returns true', () => {
        expect(isDiceNotation('d{H,T}+d{1,2,3}')).toBe(true)
      })
    })

    describe('zN in multi-pool', () => {
      test('isDiceNotation("1d20+z6") returns true', () => {
        expect(isDiceNotation('1d20+z6')).toBe(true)
      })
    })
  })

  describe('roll', () => {
    describe('Fate pools are numeric — total is sum', () => {
      test('roll("2dF+2dF") produces 2 pools and numeric total', () => {
        const result = roll('2dF+2dF')
        expect(result.rolls.length).toBe(2)
        expect(typeof result.total).toBe('number')
      })

      test('roll("1d20+dF") produces 2 pools and numeric total', () => {
        const result = roll('1d20+dF')
        expect(result.rolls.length).toBe(2)
        expect(typeof result.total).toBe('number')
      })
    })

    describe('string-faced pools force total to 0', () => {
      test('roll("1d20+d{H,T}") has total 0', () => {
        const result = roll('1d20+d{H,T}')
        expect(result.rolls.length).toBe(2)
        expect(result.total).toBe(0)
      })

      test('roll("d{H,T}+d{A,B,C}") has total 0', () => {
        const result = roll('d{H,T}+d{A,B,C}')
        expect(result.rolls.length).toBe(2)
        expect(result.total).toBe(0)
      })
    })

    describe('individual pool results preserved', () => {
      test('roll("1d20+d{H,T}") has individual results', () => {
        const result = roll('1d20+d{H,T}')
        expect(result.rolls[0]).toBeDefined()
        expect(result.rolls[1]).toBeDefined()
      })
    })
  })
})
