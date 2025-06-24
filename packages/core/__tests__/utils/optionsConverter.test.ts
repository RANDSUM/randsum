import { describe, expect, test } from 'bun:test'
import type { CustomRollOptions, NumericRollOptions } from '../../src/types'
import { optionsConverter } from '../../src/utils/optionsConverter'

describe('optionsConverter', () => {
  describe('toNotation', () => {
    test('converts basic numeric options to notation', () => {
      const options: NumericRollOptions = { sides: 20, quantity: 1 }
      expect(optionsConverter.toNotation(options)).toBe('1d20')
    })

    test('converts numeric options with quantity to notation', () => {
      const options: NumericRollOptions = { sides: 6, quantity: 3 }
      expect(optionsConverter.toNotation(options)).toBe('3d6')
    })

    test('converts custom options to notation', () => {
      const options: CustomRollOptions = {
        sides: ['Heads', 'Tails'],
        quantity: 1
      }
      expect(optionsConverter.toNotation(options)).toBe('1d{HeadsTails}')
    })

    test('handles options with drop modifier', () => {
      const options: NumericRollOptions = {
        sides: 20,
        quantity: 2,
        modifiers: { drop: { lowest: 1 } }
      }
      const result = optionsConverter.toNotation(options)
      expect(result).toContain('2d20')
      expect(result).toMatch(/[Ll]/)
    })
  })

  describe('toDescription', () => {
    test('generates description for basic numeric options', () => {
      const options: NumericRollOptions = { sides: 20, quantity: 1 }
      const description = optionsConverter.toDescription(options)

      expect(description).toContain('Roll 1 20-sided die')
    })

    test('generates description for multiple dice', () => {
      const options: NumericRollOptions = { sides: 6, quantity: 3 }
      const description = optionsConverter.toDescription(options)

      expect(description).toContain('Roll 3 6-sided dice')
    })

    test('generates description for custom dice', () => {
      const options: CustomRollOptions = {
        sides: ['Heads', 'Tails'],
        quantity: 1
      }
      const description = optionsConverter.toDescription(options)

      expect(description[0]).toContain('Roll 1 die with the following sides')
      expect(description[0]).toContain('Heads')
      expect(description[0]).toContain('Tails')
    })

    test('includes modifier descriptions', () => {
      const options: NumericRollOptions = {
        sides: 20,
        quantity: 2,
        modifiers: { drop: { lowest: 1 } }
      }
      const description = optionsConverter.toDescription(options)

      expect(description.length).toBeGreaterThan(1)
      expect(description[0]).toContain('Roll 2 20-sided dice')
      expect(description).toContainEqual(expect.stringContaining('Drop lowest'))
    })
  })

  describe('formatCoreNotation', () => {
    test('formats numeric dice notation', () => {
      const options: NumericRollOptions = { sides: 20, quantity: 1 }
      expect(optionsConverter.formatCoreNotation(options)).toBe('1d20')
    })

    test('formats custom dice notation', () => {
      const options: CustomRollOptions = {
        sides: ['Heads', 'Tails'],
        quantity: 1
      }
      expect(optionsConverter.formatCoreNotation(options)).toBe(
        '1d{HeadsTails}'
      )
    })

    test('uses default quantity of 1 when not specified', () => {
      const options = { sides: 10 }
      expect(optionsConverter.formatCoreNotation(options)).toBe('1d10')
    })
  })

  describe('formatCoreDescription', () => {
    test('formats description for single numeric die', () => {
      const options: NumericRollOptions = { sides: 20, quantity: 1 }
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toBe('Roll 1 20-sided die')
    })

    test('formats description for multiple numeric dice', () => {
      const options: NumericRollOptions = { sides: 6, quantity: 3 }
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toBe('Roll 3 6-sided dice')
    })

    test('formats description for custom dice', () => {
      const options: CustomRollOptions = {
        sides: ['Metru', 'Nui'],
        quantity: 1
      }
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toContain('Roll 1 die with the following sides')
      expect(result).toContain('Metru')
      expect(result).toContain('Nui')
    })

    test('handles custom dice with empty string sides', () => {
      const options: CustomRollOptions = {
        sides: ['A', '', 'B'],
        quantity: 1
      }
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toBe('Roll 1 die with the following sides: (A ,B)')
    })

    test('uses default quantity of 1 when not specified', () => {
      const options = { sides: 10 }
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toBe('Roll 1 10-sided die')
    })
  })
})
