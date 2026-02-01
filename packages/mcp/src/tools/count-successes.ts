import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { isDiceNotation, roll } from '@randsum/roller'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  try {
    return readFileSync(docPath, 'utf8')
  } catch {
    return 'Roll dice and count successes instead of summing. Useful for dice pool systems like World of Darkness, Shadowrun, etc.'
  }
}

const countSuccessesToolSchemaShape = {
  notation: z.string().min(1, 'Dice notation cannot be empty'),
  threshold: z
    .number()
    .int()
    .min(1)
    .describe('Success threshold (rolls >= this value count as successes)'),
  botchThreshold: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe('Optional botch threshold (rolls <= this value count as botches/failures)')
}

export function registerCountSuccessesTool(server: McpServer): void {
  const description = getToolDescription('count-successes.md')

  registerTool(
    server,
    'count-successes',
    description,
    countSuccessesToolSchemaShape,
    ({
      notation,
      threshold,
      botchThreshold
    }: {
      notation: string
      threshold: number
      botchThreshold: number | undefined
    }) => {
      try {
        if (!isDiceNotation(notation)) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid dice notation: "${notation}". Use formats like "8d10", "5d6", "10d20"`
              }
            ]
          }
        }

        const match = /^(\d+)d(\d+)/i.exec(notation)
        if (!match) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Could not parse notation: "${notation}". Expected format like "8d10" for success counting.`
              }
            ]
          }
        }

        const quantity = Number.parseInt(match[1] ?? '0', 10)
        const sides = Number.parseInt(match[2] ?? '0', 10)

        if (threshold > sides) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Success threshold (${threshold}) cannot be greater than dice sides (${sides}).`
              }
            ]
          }
        }

        if (botchThreshold && botchThreshold >= threshold) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Botch threshold (${botchThreshold}) must be less than success threshold (${threshold}).`
              }
            ]
          }
        }

        const result = roll({
          sides,
          quantity,
          modifiers: {
            countSuccesses: {
              threshold,
              ...(botchThreshold ? { botchThreshold } : {})
            }
          }
        })

        const firstRoll = result.rolls[0]
        const rawRolls = firstRoll?.rolls ?? []
        const successes = rawRolls.filter(r => r >= threshold).length
        const botches = botchThreshold ? rawRolls.filter(r => r <= botchThreshold).length : 0
        const failures = botchThreshold
          ? rawRolls.filter(r => r > botchThreshold && r < threshold).length
          : rawRolls.filter(r => r < threshold).length

        const successLine = `Successes (>= ${threshold}): ${successes}`
        const botchLine = botchThreshold ? `Botches (<= ${botchThreshold}): ${botches}` : ''
        const failureLine = botchThreshold ? `Failures: ${failures}` : ''
        const totalLine = `Total Successes: ${result.total} (used for total)`

        const output = `✅ Success Count Roll: ${notation}
${'─'.repeat(40)}

Raw Rolls: [${rawRolls.join(', ')}]
${successLine}
${botchLine}
${failureLine}
${totalLine}

Note: The total shows the number of successes (not the sum of dice).`

        return {
          content: [
            {
              type: 'text',
              text: output.trim()
            }
          ]
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : 'An unknown error occurred'
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error counting successes: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
