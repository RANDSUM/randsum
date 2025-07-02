import { type ErrorContext, RandsumError } from './randsumError'

export class RollConstraintError extends RandsumError {
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

    const autoSuggestions =
      suggestions ??
      RollConstraintError.generateSuggestions(constraint, errorContext)

    super(message, 'ROLL_CONSTRAINT', errorContext, autoSuggestions)
    this.name = 'RollConstraintError'
  }

  private static generateSuggestions(
    constraint: string,
    context: ErrorContext
  ): string[] {
    const suggestions: string[] = []

    if (constraint.includes('unique')) {
      const details = context.details
      if (details?.['sides'] && details['quantity']) {
        const sides = Number(details['sides'])
        const quantity = Number(details['quantity'])
        suggestions.push(
          `Reduce quantity to ${String(sides)} or fewer for unique rolls on a d${String(sides)}`
        )
        suggestions.push('Remove the unique modifier to allow duplicate values')
        suggestions.push(
          `Use a die with more sides (d${String(quantity)} or higher) for ${String(quantity)} unique rolls`
        )
      } else {
        suggestions.push(
          'Ensure the number of dice is not greater than the number of sides'
        )
        suggestions.push(
          'Remove the unique modifier if duplicate values are acceptable'
        )
      }
    }

    if (constraint.includes('drop') || constraint.includes('keep')) {
      suggestions.push(
        'Ensure drop/keep count is less than the total number of dice'
      )
      suggestions.push(
        'Reduce the drop/keep amount or increase the number of dice'
      )
    }

    if (constraint.includes('negative') || constraint.includes('zero')) {
      suggestions.push('Use positive values for dice sides and quantities')
      suggestions.push('Minimum values: 1 die with 1 side')
    }

    if (constraint.includes('reroll')) {
      suggestions.push('Ensure reroll values are within the die face range')
      suggestions.push('Check that reroll conditions can be satisfied')
    }

    if (constraint.includes('explode')) {
      suggestions.push('Ensure explode conditions are achievable')
      suggestions.push('Set reasonable limits to prevent infinite explosions')
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'Check that all roll parameters are valid and achievable'
      )
      suggestions.push('Refer to the documentation for parameter limits')
    }

    return suggestions
  }

  public static forUniqueRollViolation(
    sides: number,
    quantity: number
  ): RollConstraintError {
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
