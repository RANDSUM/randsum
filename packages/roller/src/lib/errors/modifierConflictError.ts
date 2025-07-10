import { type ErrorContext, RandsumError } from './randsumError'

export class ModifierConflictError extends RandsumError {
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

    const autoSuggestions =
      suggestions ??
      ModifierConflictError.generateSuggestions(conflictingModifiers)

    super(message, 'MODIFIER_CONFLICT', errorContext, autoSuggestions)
    this.name = 'ModifierConflictError'
  }

  private static generateSuggestions(conflictingModifiers: string[]): string[] {
    const suggestions: string[] = []
    const modifiers = new Set(conflictingModifiers.map((m) => m.toUpperCase()))

    if (modifiers.has('H') && modifiers.has('L')) {
      suggestions.push(
        "Use either 'H' to keep highest or 'L' to drop lowest, not both"
      )
      suggestions.push("For advantage: '2d20H', for disadvantage: '2d20L'")
    }

    if (
      modifiers.has('R') &&
      (modifiers.has('E') || modifiers.has('EXPLODE'))
    ) {
      suggestions.push(
        'Reroll and explode modifiers may conflict - choose one approach'
      )
      suggestions.push(
        "Use 'R' to reroll specific values, or 'E' to explode on maximum"
      )
    }

    if (modifiers.has('UNIQUE')) {
      if (modifiers.has('R') || modifiers.has('REROLL')) {
        suggestions.push('Unique rolls cannot use reroll modifiers')
        suggestions.push("Remove either 'unique' or 'reroll' modifier")
      }
      if (modifiers.has('E') || modifiers.has('EXPLODE')) {
        suggestions.push('Unique rolls cannot use explode modifiers')
        suggestions.push("Remove either 'unique' or 'explode' modifier")
      }
    }

    if (modifiers.has('CUSTOM_FACES')) {
      const otherModifiers = Array.from(modifiers).filter(
        (m) => m !== 'CUSTOM_FACES'
      )
      if (otherModifiers.length > 0) {
        suggestions.push(
          'Custom dice faces cannot be used with other modifiers'
        )
        suggestions.push(`Remove modifiers: ${otherModifiers.join(', ')}`)
        suggestions.push('Use standard  dice if you need modifiers')
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Check modifier compatibility in the documentation')
      suggestions.push('Use only one modifier type per roll for best results')
    }

    return suggestions
  }

  public static forCustomDiceWithModifiers(
    notation: string
  ): ModifierConflictError {
    return new ModifierConflictError(
      ['custom_faces', 'modifiers'],
      {
        input: notation,
        expected:
          'Custom dice without modifiers, or standard dice with modifiers'
      },
      [
        'Custom dice faces cannot be used with modifiers',
        'Use standard dice like "4d6L" if you need modifiers',
        'Use custom dice like "2d{H,T}" without additional modifiers'
      ]
    )
  }
}
