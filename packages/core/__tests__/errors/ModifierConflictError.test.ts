import { describe, expect, test } from 'bun:test'
import { ModifierConflictError } from '../../src/errors/modifierConflictError'
import { RandsumError } from '../../src/errors/randsumError'

describe('ModifierConflictError', () => {
  describe('constructor', () => {
    test('creates error with conflicting modifiers only', () => {
      const conflictingModifiers = ['H', 'L']
      const error = new ModifierConflictError(conflictingModifiers)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('ModifierConflictError')
      expect(error.code).toBe('MODIFIER_CONFLICT')
      expect(error.message).toBe('Conflicting modifiers detected: H, L')
      expect(error.context.details?.['conflictingModifiers']).toEqual(
        conflictingModifiers
      )
      expect(error.context.location).toBe('modifier validation')
    })

    test('creates error with custom context', () => {
      const conflictingModifiers = ['R', 'E']
      const context = {
        input: '4d6RE',
        expected: 'Either reroll or explode, not both'
      }
      const error = new ModifierConflictError(conflictingModifiers, context)

      expect(error.context.input).toBe(context.input)
      expect(error.context.expected).toBe(context.expected)
      expect(error.context.location).toBe('modifier validation')
      expect(error.context.details?.['conflictingModifiers']).toEqual(
        conflictingModifiers
      )
    })

    test('creates error with custom suggestions', () => {
      const conflictingModifiers = ['unique', 'reroll']
      const suggestions = ['Remove unique modifier', 'Remove reroll modifier']
      const error = new ModifierConflictError(
        conflictingModifiers,
        undefined,
        suggestions
      )

      expect(error.suggestions).toEqual(suggestions)
    })

    test('uses auto-generated suggestions when none provided', () => {
      const conflictingModifiers = ['H', 'L']
      const error = new ModifierConflictError(conflictingModifiers)

      expect(error.suggestions.length).toBeGreaterThan(0)
      expect(error.suggestions).toContain(
        "Use either 'H' to keep highest or 'L' to drop lowest, not both"
      )
    })
  })

  describe('generateSuggestions', () => {
    test('suggests resolution for H/L conflict', () => {
      const error = new ModifierConflictError(['H', 'L'])

      expect(error.suggestions).toContain(
        "Use either 'H' to keep highest or 'L' to drop lowest, not both"
      )
      expect(error.suggestions).toContain(
        "For advantage: '2d20H', for disadvantage: '2d20L'"
      )
    })

    test('handles case insensitive H/L conflict', () => {
      const error = new ModifierConflictError(['h', 'l'])

      expect(error.suggestions).toContain(
        "Use either 'H' to keep highest or 'L' to drop lowest, not both"
      )
    })

    test('suggests resolution for R/E conflict', () => {
      const error = new ModifierConflictError(['R', 'E'])

      expect(error.suggestions).toContain(
        'Reroll and explode modifiers may conflict - choose one approach'
      )
      expect(error.suggestions).toContain(
        "Use 'R' to reroll specific values, or 'E' to explode on maximum"
      )
    })

    test('suggests resolution for R/EXPLODE conflict', () => {
      const error = new ModifierConflictError(['R', 'EXPLODE'])

      expect(error.suggestions).toContain(
        'Reroll and explode modifiers may conflict - choose one approach'
      )
    })

    test('suggests resolution for UNIQUE/R conflict', () => {
      const error = new ModifierConflictError(['UNIQUE', 'R'])

      expect(error.suggestions).toContain(
        'Unique rolls cannot use reroll modifiers'
      )
      expect(error.suggestions).toContain(
        "Remove either 'unique' or 'reroll' modifier"
      )
    })

    test('suggests resolution for UNIQUE/REROLL conflict', () => {
      const error = new ModifierConflictError(['UNIQUE', 'REROLL'])

      expect(error.suggestions).toContain(
        'Unique rolls cannot use reroll modifiers'
      )
    })

    test('suggests resolution for UNIQUE/E conflict', () => {
      const error = new ModifierConflictError(['UNIQUE', 'E'])

      expect(error.suggestions).toContain(
        'Unique rolls cannot use explode modifiers'
      )
      expect(error.suggestions).toContain(
        "Remove either 'unique' or 'explode' modifier"
      )
    })

    test('suggests resolution for UNIQUE/EXPLODE conflict', () => {
      const error = new ModifierConflictError(['UNIQUE', 'EXPLODE'])

      expect(error.suggestions).toContain(
        'Unique rolls cannot use explode modifiers'
      )
    })

    test('suggests resolution for CUSTOM_FACES conflicts', () => {
      const error = new ModifierConflictError(['CUSTOM_FACES', 'H', 'L'])

      expect(error.suggestions).toContain(
        'Custom dice faces cannot be used with other modifiers'
      )
      expect(error.suggestions).toContain('Remove modifiers: H, L')
      expect(error.suggestions).toContain(
        'Use standard numeric dice if you need modifiers'
      )
    })

    test('provides general guidance when no specific conflicts detected', () => {
      const error = new ModifierConflictError(['UNKNOWN1', 'UNKNOWN2'])

      expect(error.suggestions).toContain(
        'Check modifier compatibility in the documentation'
      )
      expect(error.suggestions).toContain(
        'Use only one modifier type per roll for best results'
      )
    })

    test('handles multiple conflict types', () => {
      const error = new ModifierConflictError(['H', 'L', 'UNIQUE', 'R'])

      // Should include suggestions for both H/L and UNIQUE/R conflicts
      expect(error.suggestions.length).toBeGreaterThan(2)
      expect(error.suggestions.some((s) => s.includes('highest or'))).toBe(true)
      expect(error.suggestions.some((s) => s.includes('Unique rolls'))).toBe(
        true
      )
    })

    test('handles empty modifiers array', () => {
      const error = new ModifierConflictError([])

      expect(error.message).toBe('Conflicting modifiers detected: ')
      expect(error.suggestions).toContain(
        'Check modifier compatibility in the documentation'
      )
    })
  })

  describe('forCustomDiceWithModifiers static method', () => {
    test('creates error for custom dice with modifiers', () => {
      const notation = '2d{H,T}L'
      const error = ModifierConflictError.forCustomDiceWithModifiers(notation)

      expect(error.name).toBe('ModifierConflictError')
      expect(error.message).toBe(
        'Conflicting modifiers detected: custom_faces, modifiers'
      )
      expect(error.context.input).toBe(notation)
      expect(error.context.expected).toBe(
        'Custom dice without modifiers, or standard dice with modifiers'
      )
      expect(error.suggestions).toContain(
        'Custom dice faces cannot be used with modifiers'
      )
      expect(error.suggestions).toContain(
        'Use standard dice like "4d6L" if you need modifiers'
      )
      expect(error.suggestions).toContain(
        'Use custom dice like "2d{H,T}" without additional modifiers'
      )
    })
  })

  describe('error inheritance', () => {
    test('maintains proper prototype chain', () => {
      const error = new ModifierConflictError(['H', 'L'])

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('ModifierConflictError')
    })

    test('has correct error properties', () => {
      const error = new ModifierConflictError(['H', 'L'])

      expect(error.name).toBe('ModifierConflictError')
      expect(error.code).toBe('MODIFIER_CONFLICT')
      expect(typeof error.message).toBe('string')
      expect(error.context).toBeDefined()
      expect(Array.isArray(error.suggestions)).toBe(true)
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('edge cases', () => {
    test('handles single modifier', () => {
      const error = new ModifierConflictError(['H'])

      expect(error.message).toBe('Conflicting modifiers detected: H')
      expect(error.suggestions).toContain(
        'Check modifier compatibility in the documentation'
      )
    })

    test('handles duplicate modifiers', () => {
      const error = new ModifierConflictError(['H', 'H', 'L'])

      expect(error.message).toBe('Conflicting modifiers detected: H, H, L')
      expect(error.suggestions).toContain(
        "Use either 'H' to keep highest or 'L' to drop lowest, not both"
      )
    })

    test('handles very long modifier names', () => {
      const longModifier = 'VERY_LONG_MODIFIER_NAME_THAT_EXCEEDS_NORMAL_LENGTH'
      const error = new ModifierConflictError([longModifier, 'H'])

      expect(error.message).toContain(longModifier)
      expect(error.suggestions.length).toBeGreaterThan(0)
    })

    test('handles special characters in modifier names', () => {
      const error = new ModifierConflictError(['H@#$', 'L!@#'])

      expect(error.message).toBe('Conflicting modifiers detected: H@#$, L!@#')
      expect(error.suggestions.length).toBeGreaterThan(0)
    })
  })
})
