import { describe, expect, test } from 'bun:test'
import { isDiceNotation } from '../../src/validate'
import { roll } from '../../src/roll'
import { ValidationError } from '../../src/errors'
import type { DiceNotation } from '../../src/notation/types'

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
        const result = roll('2dF+2dF' as DiceNotation)
        expect(result.rolls.length).toBe(2)
        expect(typeof result.total).toBe('number')
      })

      test('roll("1d20+dF") produces 2 pools and numeric total', () => {
        const result = roll('1d20+dF' as DiceNotation)
        expect(result.rolls.length).toBe(2)
        expect(typeof result.total).toBe('number')
      })
    })

    describe('string-faced pools in a multi-pool throw (no meaningful total)', () => {
      test('roll("1d20+d{H,T}") throws a ValidationError', () => {
        expect(() => roll('1d20+d{H,T}' as DiceNotation)).toThrow(ValidationError)
      })

      test('roll("d{H,T}+d{A,B,C}") throws a ValidationError', () => {
        expect(() => roll('d{H,T}+d{A,B,C}')).toThrow(ValidationError)
      })

      test('the thrown message explains the mix is unsupported', () => {
        expect(() => roll('1d20+d{H,T}' as DiceNotation)).toThrow(/custom-faced dice/)
      })
    })

    describe('single custom-faced pool still rolls (index-based total preserved)', () => {
      test('roll("d{H,T}") produces one pool and does not throw', () => {
        const result = roll('d{H,T}')
        expect(result.rolls.length).toBe(1)
        expect(result.values.every(v => v === 'H' || v === 'T')).toBe(true)
      })
    })
  })
})
