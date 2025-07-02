import { z } from 'zod'
import { roll } from '@randsum/dice'
import { validateNotation } from '@randsum/notation'
import type { RollResult } from '@randsum/dice'
import type { ValidationResult } from '@randsum/notation'

interface ToolResponse {
  content: {
    type: 'text'
    text: string
  }[]
  isError?: boolean
}

export function handleRollTool(args: unknown): ToolResponse {
  const rollArgs = z
    .object({
      notation: z.string()
    })
    .parse(args)

  // Validate notation first
  const validation = validateNotation(rollArgs.notation)
  if (!validation.valid) {
    return {
      content: [
        {
          type: 'text',
          text: `Invalid dice notation: ${rollArgs.notation}\n\nErrors:\n${validation.description.join('\n')}`
        }
      ]
    }
  }

  // Perform the roll
  const result: RollResult = roll(validation.notation)

  const rollDescription = validation.description.join(', ')
  const rollDetails = result.rolls
    .map(
      (r) =>
        `${r.parameters.description.join(' ')}: ${r.rawRolls.join(', ')} (total: ${String(r.total)})`
    )
    .join('\n')

  return {
    content: [
      {
        type: 'text',
        text: `🎲 **Roll Result**\n\n**Notation:** ${rollArgs.notation}\n**Description:** ${rollDescription}\n**Total:** ${String(result.total)}\n\n**Details:**\n${rollDetails}\n\n**Raw Results:** [${result.rawResults.join(', ')}]`
      }
    ]
  }
}

export function handleValidateNotationTool(args: unknown): {
  content: { type: string; text: string }[]
} {
  const validateArgs = z
    .object({
      notation: z.string()
    })
    .parse(args)

  const validation: ValidationResult = validateNotation(validateArgs.notation)

  if (validation.valid) {
    const description = validation.description.join(', ')
    return {
      content: [
        {
          type: 'text',
          text: `✅ **Valid Notation**\n\n**Notation:** ${validateArgs.notation}\n**Type:** ${validation.type}\n**Description:** ${description}`
        }
      ]
    }
  } else {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Invalid Notation**\n\n**Notation:** ${validateArgs.notation}\n\n**Issues:**\n${validation.description.map((desc) => `• ${desc}`).join('\n')}`
        }
      ]
    }
  }
}
