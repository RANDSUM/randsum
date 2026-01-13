import type { ValidationResult } from '@randsum/roller'
import { isError } from '@randsum/shared'

export function formatValidationResult(result: ValidationResult): string {
  if (isError(result)) {
    return `❌ Invalid Dice Notation: ${result.error.message}`
  }

  const { notation, description, options } = result.data
  const header = `✅ Valid Dice Notation:`
  const separator = '─'.repeat(25)

  const details = [
    `Notation: ${notation.join(', ')}`,
    `Description: ${description.join(', ')}`,
    '',
    'Parsed Details:',
    JSON.stringify(options, null, 2)
  ]

  return [header, separator, ...details].join('\n')
}
