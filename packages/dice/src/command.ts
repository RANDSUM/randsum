#!/usr/bin/env node

import { validateNotation } from '@randsum/notation'
import { roll } from './roll'

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

  const result = roll(validated.notation)
  const description = validated.description.join(', ')
  const message = `
🎲 RANDSUM Roll Result:
───────────────
Total: ${String(result.total)}
Rolls: [${result.result.join(', ')}]
Description: ${description}
`
  console.log(message)
  process.exit(1)
}

main()
