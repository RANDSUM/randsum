import type { ValidationResult } from '@randsum/roller'

export function formatValidationResult(result: ValidationResult): string {
  if (result.error) {
    return `❌ Invalid Dice Notation: ${result.error.message}`
  }

  const { notation, description, options } = result
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
