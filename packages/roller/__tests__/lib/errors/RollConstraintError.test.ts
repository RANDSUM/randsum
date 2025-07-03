import { describe, expect, test } from 'bun:test'
import { RollConstraintError } from '../../../src/lib/errors/rollConstraintError'
import { RandsumError } from '../../../src/lib/errors/randsumError'

describe('RollConstraintError', () => {
  describe('constructor', () => {
    test('creates error with constraint only', () => {
      const constraint = 'Cannot roll 7 unique values on a 6-sided die'
      const error = new RollConstraintError(constraint)

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('RollConstraintError')
      expect(error.code).toBe('ROLL_CONSTRAINT')
      expect(error.message).toBe(`Roll constraint violation: ${constraint}`)
      expect(error.context.location).toBe('roll validation')
      expect(error.suggestions.length).toBeGreaterThan(0)
    })

    test('creates error with custom context', () => {
      const constraint = 'Invalid drop amount'
      const context = {
        input: '4d6L5',
        expected: 'Drop amount less than total dice',
        details: { operation: 'drop', amount: 5, totalDice: 4 }
      }
      const error = new RollConstraintError(constraint, context)

      expect(error.context.input).toBe(context.input)
      expect(error.context.expected).toBe(context.expected)
      expect(error.context.details).toEqual(context.details)
      expect(error.context.location).toBe('roll validation')
    })

    test('creates error with custom suggestions', () => {
      const constraint = 'Custom constraint'
      const suggestions = ['Custom suggestion 1', 'Custom suggestion 2']
      const error = new RollConstraintError(constraint, undefined, suggestions)

      expect(error.suggestions).toEqual(suggestions)
    })

    test('uses auto-generated suggestions when none provided', () => {
      const constraint = 'Cannot roll unique values'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions.length).toBeGreaterThan(0)
      expect(error.suggestions.some((s) => s.includes('unique'))).toBe(true)
    })
  })

  describe('generateSuggestions', () => {
    test('generates unique roll suggestions with sides and quantity', () => {
      const constraint = 'Cannot roll unique values'
      const context = {
        details: { sides: 6, quantity: 8 }
      }
      const error = new RollConstraintError(constraint, context)

      expect(error.suggestions).toContain(
        'Reduce quantity to 6 or fewer for unique rolls on a d6'
      )
      expect(error.suggestions).toContain(
        'Remove the unique modifier to allow duplicate values'
      )
      expect(error.suggestions).toContain(
        'Use a die with more sides (d8 or higher) for 8 unique rolls'
      )
    })

    test('generates unique roll suggestions without specific details', () => {
      const constraint = 'Cannot roll unique values'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Ensure the number of dice is not greater than the number of sides'
      )
      expect(error.suggestions).toContain(
        'Remove the unique modifier if duplicate values are acceptable'
      )
    })

    test('generates drop constraint suggestions', () => {
      const constraint = 'Cannot drop more dice than available'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Ensure drop/keep count is less than the total number of dice'
      )
      expect(error.suggestions).toContain(
        'Reduce the drop/keep amount or increase the number of dice'
      )
    })

    test('generates keep constraint suggestions', () => {
      const constraint = 'Cannot keep more dice than available'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Ensure drop/keep count is less than the total number of dice'
      )
      expect(error.suggestions).toContain(
        'Reduce the drop/keep amount or increase the number of dice'
      )
    })

    test('generates negative value suggestions', () => {
      const constraint = 'Cannot use negative dice count'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Use positive values for dice sides and quantities'
      )
      expect(error.suggestions).toContain('Minimum values: 1 die with 1 side')
    })

    test('generates zero value suggestions', () => {
      const constraint = 'Cannot use zero sides'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Use positive values for dice sides and quantities'
      )
      expect(error.suggestions).toContain('Minimum values: 1 die with 1 side')
    })

    test('generates reroll constraint suggestions', () => {
      const constraint = 'Invalid reroll configuration'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Ensure reroll values are within the die face range'
      )
      expect(error.suggestions).toContain(
        'Check that reroll conditions can be satisfied'
      )
    })

    test('generates explode constraint suggestions', () => {
      const constraint = 'Invalid explode configuration'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Ensure explode conditions are achievable'
      )
      expect(error.suggestions).toContain(
        'Set reasonable limits to prevent infinite explosions'
      )
    })

    test('generates general suggestions for unknown constraints', () => {
      const constraint = 'Unknown constraint type'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions).toContain(
        'Check that all roll parameters are valid and achievable'
      )
      expect(error.suggestions).toContain(
        'Refer to the documentation for parameter limits'
      )
    })

    test('handles multiple constraint types', () => {
      const constraint = 'Cannot drop unique values with negative count'
      const error = new RollConstraintError(constraint)

      expect(error.suggestions.length).toBeGreaterThan(3)
      expect(error.suggestions.some((s) => s.includes('unique'))).toBe(true)
      expect(error.suggestions.some((s) => s.includes('drop'))).toBe(true)
      expect(error.suggestions.some((s) => s.includes('positive'))).toBe(true)
    })
  })

  describe('forUniqueRollViolation static method', () => {
    test('creates error for unique roll violation', () => {
      const error = RollConstraintError.forUniqueRollViolation(6, 8)

      expect(error.name).toBe('RollConstraintError')
      expect(error.message).toBe(
        'Roll constraint violation: Cannot roll 8 unique values on a 6-sided die'
      )
      expect(error.context.details).toEqual({
        sides: 6,
        quantity: 8,
        constraint: 'unique_rolls'
      })
      expect(error.context.expected).toBe('Quantity ≤ 6 for unique rolls')
      expect(error.suggestions).toContain('Reduce quantity to 6 or fewer dice')
      expect(error.suggestions).toContain(
        'Remove the unique modifier to allow duplicates'
      )
      expect(error.suggestions).toContain(
        'Use a d8 or larger die for 8 unique rolls'
      )
    })

    test('handles edge case with 1-sided die', () => {
      const error = RollConstraintError.forUniqueRollViolation(1, 2)

      expect(error.message).toContain(
        'Cannot roll 2 unique values on a 1-sided die'
      )
      expect(error.suggestions).toContain('Reduce quantity to 1 or fewer dice')
      expect(error.suggestions).toContain(
        'Use a d2 or larger die for 2 unique rolls'
      )
    })

    test('handles large numbers', () => {
      const error = RollConstraintError.forUniqueRollViolation(20, 100)

      expect(error.message).toContain(
        'Cannot roll 100 unique values on a 20-sided die'
      )
      expect(error.suggestions).toContain('Reduce quantity to 20 or fewer dice')
      expect(error.suggestions).toContain(
        'Use a d100 or larger die for 100 unique rolls'
      )
    })
  })

  describe('forInvalidDropKeep static method', () => {
    test('creates error for invalid drop operation', () => {
      const error = RollConstraintError.forInvalidDropKeep('drop', 5, 4)

      expect(error.name).toBe('RollConstraintError')
      expect(error.message).toBe(
        'Roll constraint violation: Cannot drop 5 dice from 4 total dice'
      )
      expect(error.context.details).toEqual({
        operation: 'drop',
        amount: 5,
        totalDice: 4
      })
      expect(error.context.expected).toBe('drop amount < total dice (4)')
      expect(error.suggestions).toContain('Reduce drop amount to less than 4')
      expect(error.suggestions).toContain('Increase total dice to more than 5')
      expect(error.suggestions).toContain('Use drop amount between 1 and 3')
    })

    test('creates error for invalid keep operation', () => {
      const error = RollConstraintError.forInvalidDropKeep('keep', 10, 6)

      expect(error.message).toContain('Cannot keep 10 dice from 6 total dice')
      expect(error.context.details?.['operation']).toBe('keep')
      expect(error.context.expected).toBe('keep amount < total dice (6)')
      expect(error.suggestions).toContain('Reduce keep amount to less than 6')
      expect(error.suggestions).toContain('Increase total dice to more than 10')
      expect(error.suggestions).toContain('Use keep amount between 1 and 5')
    })

    test('handles edge case with 1 die', () => {
      const error = RollConstraintError.forInvalidDropKeep('drop', 1, 1)

      expect(error.message).toContain('Cannot drop 1 dice from 1 total dice')
      expect(error.suggestions).toContain('Reduce drop amount to less than 1')
      expect(error.suggestions).toContain('Use drop amount between 1 and 0')
    })

    test('handles large numbers', () => {
      const error = RollConstraintError.forInvalidDropKeep('keep', 1000, 500)

      expect(error.message).toContain(
        'Cannot keep 1000 dice from 500 total dice'
      )
      expect(error.suggestions).toContain('Reduce keep amount to less than 500')
      expect(error.suggestions).toContain(
        'Increase total dice to more than 1000'
      )
    })
  })

  describe('error inheritance', () => {
    test('maintains proper prototype chain', () => {
      const error = new RollConstraintError('Test constraint')

      expect(error instanceof Error).toBe(true)
      expect(error instanceof RandsumError).toBe(true)
      expect(error.name).toBe('RollConstraintError')
    })

    test('has correct error properties', () => {
      const error = new RollConstraintError('Test constraint')

      expect(error.name).toBe('RollConstraintError')
      expect(error.code).toBe('ROLL_CONSTRAINT')
      expect(typeof error.message).toBe('string')
      expect(error.context).toBeDefined()
      expect(Array.isArray(error.suggestions)).toBe(true)
      expect(error.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('edge cases', () => {
    test('handles empty constraint string', () => {
      const error = new RollConstraintError('')

      expect(error.message).toBe('Roll constraint violation: ')
      expect(error.suggestions.length).toBeGreaterThan(0)
    })

    test('handles very long constraint descriptions', () => {
      const longConstraint = 'A'.repeat(1000)
      const error = new RollConstraintError(longConstraint)

      expect(error.message).toContain(longConstraint)
      expect(error.suggestions.length).toBeGreaterThan(0)
    })

    test('handles constraint with special characters', () => {
      const constraint = 'Cannot roll @#$%^&*() values'
      const error = new RollConstraintError(constraint)

      expect(error.message).toContain(constraint)
      expect(error.suggestions.length).toBeGreaterThan(0)
    })

    test('handles context with undefined values', () => {
      const constraint = 'Test constraint'
      const context = {
        input: undefined,
        expected: undefined,
        details: { sides: null, quantity: undefined }
      }
      const error = new RollConstraintError(constraint, context)

      expect(error.context.input).toBeUndefined()
      expect(error.context.expected).toBeUndefined()
      expect(error.context.details).toEqual(context.details)
    })

    test('handles zero values in static methods', () => {
      const uniqueError = RollConstraintError.forUniqueRollViolation(0, 0)
      expect(uniqueError.message).toContain(
        'Cannot roll 0 unique values on a 0-sided die'
      )

      const dropError = RollConstraintError.forInvalidDropKeep('drop', 0, 0)
      expect(dropError.message).toContain(
        'Cannot drop 0 dice from 0 total dice'
      )
    })

    test('handles negative values in static methods', () => {
      const uniqueError = RollConstraintError.forUniqueRollViolation(-5, -3)
      expect(uniqueError.message).toContain(
        'Cannot roll -3 unique values on a -5-sided die'
      )

      const keepError = RollConstraintError.forInvalidDropKeep('keep', -10, -5)
      expect(keepError.message).toContain(
        'Cannot keep -10 dice from -5 total dice'
      )
    })
  })
})
