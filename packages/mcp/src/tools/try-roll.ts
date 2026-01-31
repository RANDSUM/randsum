import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { type DiceNotation, isError, isSuccess, tryRoll } from '@randsum/roller'
import { formatRollResult, formatRollResultJson } from '../formatters/index.js'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  try {
    return readFileSync(docPath, 'utf8')
  } catch {
    // Return default description if file doesn't exist
    return 'Safely roll dice without throwing errors. Returns a Result object that can be checked for success or failure.'
  }
}

const tryRollToolSchemaShape = {
  notation: z.string().min(1, 'Dice notation cannot be empty'),
  format: z
    .enum(['text', 'json'])
    .default('text')
    .describe('Output format: "text" for human-readable, "json" for structured data')
}

export function registerTryRollTool(server: McpServer): void {
  const description = getToolDescription('try-roll.md')

  registerTool(
    server,
    'try-roll',
    description,
    tryRollToolSchemaShape,
    ({ notation, format }: { notation: string; format: 'text' | 'json' | undefined }) => {
      const outputFormat = format ?? 'text'
      // Cast to DiceNotation - tryRoll will handle invalid input gracefully
      const result = tryRoll(notation as DiceNotation)

      if (isError(result)) {
        const errorMessage =
          result.error instanceof Error ? result.error.message : String(result.error)

        if (outputFormat === 'json') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: errorMessage,
                    notation
                  },
                  null,
                  2
                )
              }
            ]
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: `❌ Error rolling dice: ${errorMessage}\nNotation: "${notation}"`
            }
          ]
        }
      }

      if (isSuccess(result)) {
        const rollResult = result.data

        if (outputFormat === 'json') {
          return {
            content: [
              {
                type: 'text',
                text: formatRollResultJson(rollResult)
              }
            ]
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: formatRollResult(rollResult)
            }
          ]
        }
      }

      // This should never happen, but TypeScript needs it
      return {
        content: [
          {
            type: 'text',
            text: '❌ Unknown error occurred'
          }
        ]
      }
    }
  )
}
