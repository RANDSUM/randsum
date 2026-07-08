import { suggestNotationFix } from '@randsum/roller'
import { validateNotation } from '@randsum/roller/validate'

/** Input for the `validate` tool handler. */
export interface ValidateToolInput {
  readonly notation: string
}

/** Structured result returned by the `validate` tool handler. */
export interface ValidateToolResult {
  readonly notation: string
  readonly valid: boolean
  readonly description: string | undefined
  readonly suggestion: string | undefined
  readonly error: string | undefined
}

/**
 * Validates RANDSUM dice notation, returning a human-readable description when
 * valid and a suggested fix when invalid.
 */
export function validateNotationInput(input: ValidateToolInput): ValidateToolResult {
  const result = validateNotation(input.notation)

  if (result.valid) {
    return {
      notation: input.notation,
      valid: true,
      description: result.description.map(lines => lines.join(', ')).join('; '),
      suggestion: undefined,
      error: undefined
    }
  }

  return {
    notation: input.notation,
    valid: false,
    description: undefined,
    suggestion: suggestNotationFix(input.notation),
    error: result.error.message
  }
}
