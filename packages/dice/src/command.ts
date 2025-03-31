#!/usr/bin/env node

import {
  validateNotation,
  type CustomValidationResult,
  type NumericValidationResult
} from '@randsum/notation'
import { roll } from './roll'
import type { RollResult } from './types'

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error(
      'Error: Please provide dice notation (e.g., "2d20" or "4d6L")'
    )
    process.exit(1)
  }

  const validated = validateNotation(args[0] ?? '')
  if (!validated.valid) {
    console.error(
      'Error: Please provide valid dice notation (e.g., "2d20" or "4d6L")'
    )
    process.exit(1)
  }

  const message = formatMessage(roll(validated.notation), validated)
  console.log(message)
  process.exit(1)
}

function formatMessage(
  result: RollResult,
  { description, digested }: CustomValidationResult | NumericValidationResult
) {
  const hasModifiers = digested.modifiers !== undefined
  const rollResult = result.result.join(', ')
  const rawRolls = Object.values(result.rawRolls).flat().join(', ')

  if (hasModifiers) {
    return messageFrame(
      String(result.total),
      `Raw Rolls: [${rawRolls}]\nRolls: [${rollResult}]`,
      description.join(', ')
    )
  }

  return messageFrame(
    String(result.total),
    `Rolls: [${result.result.join(', ')}]`,
    description.join(', ')
  )
}

function messageFrame(total: string, inner: string, description: string) {
  return `
🎲 RANDSUM Roll Result:
───────────────
Total: ${total}
${inner}
Description: ${description}
`
}

main()
