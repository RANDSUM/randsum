import { describe, expect, test } from 'bun:test'
import { OptionsConverter } from '../../../src/lib/utils/optionsConverter'
import {
  createCustomRollOptions,
  createNumericRollOptions
} from '../../support/fixtures'

describe('OptionsConverter', () => {
  describe('toNotation', () => {
    test('converts basic numeric options to notation', () => {
      const options = createNumericRollOptions()
      const converter = new OptionsConverter(options)
      expect(converter.toNotation).toBe('1d20')
    })

    test('converts numeric options with quantity to notation', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 3 })
      const converter = new OptionsConverter(options)
      expect(converter.toNotation).toBe('3d6')
    })

    test('converts custom options to notation', () => {
      const options = createCustomRollOptions()
      const converter = new OptionsConverter(options)
      expect(converter.toNotation).toBe('1d{HeadsTails}')
    })

    test('handles options with drop modifier', () => {
      const options = createNumericRollOptions({
        quantity: 2,
        modifiers: { drop: { lowest: 1 } }
      })
      const converter = new OptionsConverter(options)
      const result = converter.toNotation
      expect(result).toContain('2d20')
      expect(result).toMatch(/[Ll]/)
    })

    test('handles large negative plus modifiers', () => {
      const options = createNumericRollOptions({
        quantity: 2,
        modifiers: { plus: -3 }
      })
      const converter = new OptionsConverter(options)
      const result = converter.toNotation
      expect(result).toContain('2d20-3')
    })
  })

  describe('toDescription', () => {
    test('generates description for basic numeric options', () => {
      const options = createNumericRollOptions()
      const converter = new OptionsConverter(options)
      const description = converter.toDescription

      expect(description).toContain('Roll 1 20-sided die')
    })

    test('generates description for multiple dice', () => {
      const options = createNumericRollOptions({ sides: 6, quantity: 3 })
      const converter = new OptionsConverter(options)
      const description = converter.toDescription

      expect(description).toContain('Roll 3 6-sided dice')
    })

    test('generates description for custom dice', () => {
      const options = createCustomRollOptions()
      const converter = new OptionsConverter(options)
      const description = converter.toDescription

      expect(description[0]).toContain('Roll 1 die with the following sides')
      expect(description[0]).toContain('Heads')
      expect(description[0]).toContain('Tails')
    })

    test('includes modifier descriptions', () => {
      const options = createNumericRollOptions({
        quantity: 2,
        modifiers: { drop: { lowest: 1 } }
      })
      const converter = new OptionsConverter(options)
      const description = converter.toDescription

      expect(description.length).toBeGreaterThan(1)
      expect(description[0]).toContain('Roll 2 20-sided dice')
      expect(description).toContainEqual(expect.stringContaining('Drop lowest'))
    })
  })
})
