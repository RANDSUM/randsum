import { describe, expect, test } from 'bun:test'
import { optionsConverter } from '../../src/utils/optionsConverter'
import {
  createCustomRollOptions,
  createNumericRollOptions
} from '../support/fixtures'

describe('optionsConverter', () => {
  describe('toNotation', () => {
    test('converts basic numeric options to notation', () => {
      const options = createNumericRollOptions()
      expect(optionsConverter.toNotation(options)).toBe('1d20')
    })

    test('converts numeric options with quantity to notation', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 3 })
      expect(optionsConverter.toNotation(options)).toBe('3d6')
    })

    test('converts custom options to notation', () => {
      const options = createCustomRollOptions()
      expect(optionsConverter.toNotation(options)).toBe('1d{HeadsTails}')
    })

    test('handles options with drop modifier', () => {
      const options = createNumericRollOptions({
        quantity: 2,
        modifiers: { drop: { lowest: 1 } }
      })
      const result = optionsConverter.toNotation(options)
      expect(result).toContain('2d20')
      expect(result).toMatch(/[Ll]/)
    })

    test('handles large negative plus modifiers', () => {
      const options = createNumericRollOptions({
        quantity: 2,
        modifiers: { plus: -3 }
      })
      const result = optionsConverter.toNotation(options)
      expect(result).toContain('2d20-3')
    })
  })

  describe('toDescription', () => {
    test('generates description for basic numeric options', () => {
      const options = createNumericRollOptions()
      const description = optionsConverter.toDescription(options)

      expect(description).toContain('Roll 1 20-sided die')
    })

    test('generates description for multiple dice', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 3 })
      const description = optionsConverter.toDescription(options)

      expect(description).toContain('Roll 3 6-sided dice')
    })

    test('generates description for custom dice', () => {
      const options = createCustomRollOptions()
      const description = optionsConverter.toDescription(options)

      expect(description[0]).toContain('Roll 1 die with the following sides')
      expect(description[0]).toContain('Heads')
      expect(description[0]).toContain('Tails')
    })

    test('includes modifier descriptions', () => {
      const options = createNumericRollOptions({
        quantity: 2,
        modifiers: { drop: { lowest: 1 } }
      })
      const description = optionsConverter.toDescription(options)

      expect(description.length).toBeGreaterThan(1)
      expect(description[0]).toContain('Roll 2 20-sided dice')
      expect(description).toContainEqual(expect.stringContaining('Drop lowest'))
    })
  })

  describe('formatCoreNotation', () => {
    test('formats numeric dice notation', () => {
      const options = createNumericRollOptions()
      expect(optionsConverter.formatCoreNotation(options)).toBe('1d20')
    })

    test('formats custom dice notation', () => {
      const options = createCustomRollOptions()
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
      const options = createNumericRollOptions()
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toBe('Roll 1 20-sided die')
    })

    test('formats description for multiple numeric dice', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 3 })
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toBe('Roll 3 6-sided dice')
    })

    test('formats description for custom dice', () => {
      const options = createCustomRollOptions({
        sides: ['Metru', 'Nui']
      })
      const result = optionsConverter.formatCoreDescription(options)

      expect(result).toContain('Roll 1 die with the following sides')
      expect(result).toContain('Metru')
      expect(result).toContain('Nui')
    })

    test('handles custom dice with empty string sides', () => {
      const options = createCustomRollOptions({
        sides: ['A', '', 'B']
      })
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
