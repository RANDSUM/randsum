/**
 * @file Modifier conflict error for incompatible modifier combinations
 * @module @randsum/core/utils/modifierConflictError
 */

import { type ErrorContext, RandsumError } from './randsumError'

/**
 * Error thrown when conflicting modifiers are applied to dice
 *
 * This error is thrown when modifiers that cannot be used together
 * are applied to the same dice roll. It provides guidance on which
 * modifiers conflict and suggests alternatives.
 *
 * @example
 * ```typescript
 * // This would throw a ModifierConflictError
 * roll('4d6HL') // Can't both keep highest AND drop lowest
 *
 * // Error includes suggestions like:
 * // "Use either 'H' to keep highest or 'L' to drop lowest, not both"
 * // "For advantage/disadvantage, use '2d20H' or '2d20L'"
 * ```
 */
export class ModifierConflictError extends RandsumError {
  /**
   * Creates a new ModifierConflictError instance
   *
   * @param conflictingModifiers - Array of conflicting modifier names
   * @param context - Additional context about the conflict
   * @param suggestions - Array of helpful suggestions (auto-generated if not provided)
   */
  constructor(
    conflictingModifiers: string[],
    context?: Partial<ErrorContext>,
    suggestions?: string[]
  ) {
    const modifierList = conflictingModifiers.join(', ')
    const message = `Conflicting modifiers detected: ${modifierList}`

    const errorContext: ErrorContext = {
      details: { conflictingModifiers },
      location: 'modifier validation',
      ...context
    }

    const autoSuggestions = suggestions ?? ModifierConflictError.generateSuggestions(conflictingModifiers)

    super(message, 'MODIFIER_CONFLICT', errorContext, autoSuggestions)
    this.name = 'ModifierConflictError'
  }

  /**
   * Generates helpful suggestions based on the conflicting modifiers
   *
   * @param conflictingModifiers - Array of conflicting modifier names
   * @returns Array of suggestions
   * @internal
   */
  private static generateSuggestions(conflictingModifiers: string[]): string[] {
    const suggestions: string[] = []
    const modifiers = new Set(conflictingModifiers.map(m => m.toUpperCase()))

    // High/Low conflicts
    if (modifiers.has('H') && modifiers.has('L')) {
      suggestions.push("Use either 'H' to keep highest or 'L' to drop lowest, not both")
      suggestions.push("For advantage: '2d20H', for disadvantage: '2d20L'")
    }

    // Reroll conflicts with other modifiers
    if (modifiers.has('R') && (modifiers.has('E') || modifiers.has('EXPLODE'))) {
      suggestions.push("Reroll and explode modifiers may conflict - choose one approach")
      suggestions.push("Use 'R' to reroll specific values, or 'E' to explode on maximum")
    }

    // Unique conflicts
    if (modifiers.has('UNIQUE')) {
      if (modifiers.has('R') || modifiers.has('REROLL')) {
        suggestions.push("Unique rolls cannot use reroll modifiers")
        suggestions.push("Remove either 'unique' or 'reroll' modifier")
      }
      if (modifiers.has('E') || modifiers.has('EXPLODE')) {
        suggestions.push("Unique rolls cannot use explode modifiers")
        suggestions.push("Remove either 'unique' or 'explode' modifier")
      }
    }

    // Custom dice conflicts
    if (modifiers.has('CUSTOM_FACES')) {
      const otherModifiers = Array.from(modifiers).filter(m => m !== 'CUSTOM_FACES')
      if (otherModifiers.length > 0) {
        suggestions.push("Custom dice faces cannot be used with other modifiers")
        suggestions.push(`Remove modifiers: ${otherModifiers.join(', ')}`)
        suggestions.push("Use standard numeric dice if you need modifiers")
      }
    }

    // General guidance
    if (suggestions.length === 0) {
      suggestions.push("Check modifier compatibility in the documentation")
      suggestions.push("Use only one modifier type per roll for best results")
    }

    return suggestions
  }

  /**
   * Creates a ModifierConflictError for custom dice with modifiers
   *
   * @param notation - The notation that caused the conflict
   * @returns New ModifierConflictError instance
   */
  public static forCustomDiceWithModifiers(notation: string): ModifierConflictError {
    return new ModifierConflictError(
      ['custom_faces', 'modifiers'],
      {
        input: notation,
        expected: 'Custom dice without modifiers, or standard dice with modifiers'
      },
      [
        'Custom dice faces cannot be used with modifiers',
        'Use standard dice like "4d6L" if you need modifiers',
        'Use custom dice like "2d{H,T}" without additional modifiers'
      ]
    )
  }
}
