/**
 * @file Roll constraint error for impossible or invalid roll configurations
 * @module @randsum/core/utils/rollConstraintError
 */

import { type ErrorContext, RandsumError } from './randsumError'

/**
 * Error thrown when roll constraints cannot be satisfied
 *
 * This error is thrown when a roll configuration is mathematically
 * impossible or violates logical constraints. It provides clear
 * explanations and suggestions for fixing the constraint violation.
 *
 * @example
 * ```typescript
 * // This would throw a RollConstraintError
 * roll({ sides: 6, quantity: 7, modifiers: { unique: true } })
 *
 * // Error includes suggestions like:
 * // "Reduce quantity to 6 or fewer for unique rolls on a d6"
 * // "Remove the unique modifier to allow duplicate values"
 * ```
 */
export class RollConstraintError extends RandsumError {
  /**
   * Creates a new RollConstraintError instance
   *
   * @param constraint - Description of the violated constraint
   * @param context - Additional context about the constraint violation
   * @param suggestions - Array of helpful suggestions (auto-generated if not provided)
   */
  constructor(
    constraint: string,
    context?: Partial<ErrorContext>,
    suggestions?: string[]
  ) {
    const message = `Roll constraint violation: ${constraint}`

    const errorContext: ErrorContext = {
      location: 'roll validation',
      ...context
    }

    const autoSuggestions = suggestions ?? RollConstraintError.generateSuggestions(constraint, errorContext)

    super(message, 'ROLL_CONSTRAINT', errorContext, autoSuggestions)
    this.name = 'RollConstraintError'
  }

  /**
   * Generates helpful suggestions based on the constraint violation
   *
   * @param constraint - Description of the violated constraint
   * @param context - Error context for generating specific suggestions
   * @returns Array of suggestions
   * @internal
   */
  private static generateSuggestions(constraint: string, context: ErrorContext): string[] {
    const suggestions: string[] = []

    // Unique roll constraints
    if (constraint.includes('unique')) {
      const details = context.details
      if (details?.['sides'] && details['quantity']) {
        const sides = Number(details['sides'])
        const quantity = Number(details['quantity'])
        suggestions.push(`Reduce quantity to ${String(sides)} or fewer for unique rolls on a d${String(sides)}`)
        suggestions.push('Remove the unique modifier to allow duplicate values')
        suggestions.push(`Use a die with more sides (d${String(quantity)} or higher) for ${String(quantity)} unique rolls`)
      } else {
        suggestions.push('Ensure the number of dice is not greater than the number of sides')
        suggestions.push('Remove the unique modifier if duplicate values are acceptable')
      }
    }

    // Drop/Keep constraints
    if (constraint.includes('drop') || constraint.includes('keep')) {
      suggestions.push('Ensure drop/keep count is less than the total number of dice')
      suggestions.push('Reduce the drop/keep amount or increase the number of dice')
    }

    // Negative values
    if (constraint.includes('negative') || constraint.includes('zero')) {
      suggestions.push('Use positive values for dice sides and quantities')
      suggestions.push('Minimum values: 1 die with 1 side')
    }

    // Reroll constraints
    if (constraint.includes('reroll')) {
      suggestions.push('Ensure reroll values are within the die face range')
      suggestions.push('Check that reroll conditions can be satisfied')
    }

    // Explode constraints
    if (constraint.includes('explode')) {
      suggestions.push('Ensure explode conditions are achievable')
      suggestions.push('Set reasonable limits to prevent infinite explosions')
    }

    // General guidance
    if (suggestions.length === 0) {
      suggestions.push('Check that all roll parameters are valid and achievable')
      suggestions.push('Refer to the documentation for parameter limits')
    }

    return suggestions
  }

  /**
   * Creates a RollConstraintError for unique roll violations
   *
   * @param sides - Number of sides on the die
   * @param quantity - Number of dice being rolled
   * @returns New RollConstraintError instance
   */
  public static forUniqueRollViolation(sides: number, quantity: number): RollConstraintError {
    return new RollConstraintError(
      `Cannot roll ${String(quantity)} unique values on a ${String(sides)}-sided die`,
      {
        details: { sides, quantity, constraint: 'unique_rolls' },
        expected: `Quantity ≤ ${String(sides)} for unique rolls`
      },
      [
        `Reduce quantity to ${String(sides)} or fewer dice`,
        'Remove the unique modifier to allow duplicates',
        `Use a d${String(quantity)} or larger die for ${String(quantity)} unique rolls`
      ]
    )
  }

  /**
   * Creates a RollConstraintError for invalid drop/keep amounts
   *
   * @param operation - The operation being performed ('drop' or 'keep')
   * @param amount - The amount to drop/keep
   * @param totalDice - Total number of dice
   * @returns New RollConstraintError instance
   */
  public static forInvalidDropKeep(
    operation: 'drop' | 'keep',
    amount: number,
    totalDice: number
  ): RollConstraintError {
    return new RollConstraintError(
      `Cannot ${operation} ${String(amount)} dice from ${String(totalDice)} total dice`,
      {
        details: { operation, amount, totalDice },
        expected: `${operation} amount < total dice (${String(totalDice)})`
      },
      [
        `Reduce ${operation} amount to less than ${String(totalDice)}`,
        `Increase total dice to more than ${String(amount)}`,
        `Use ${operation} amount between 1 and ${String(totalDice - 1)}`
      ]
    )
  }
}
