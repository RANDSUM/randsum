import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { type DiceNotation, roll } from '@randsum/roller'
import { formatRollResult, formatRollResultJson } from '../formatters/index.js'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  try {
    return readFileSync(docPath, 'utf8')
  } catch {
    return 'Roll dice using RANDSUM notation. Supports standard dice (2d6), modifiers (4d6L for drop lowest), exploding dice (3d6!), and arithmetic (+5).'
  }
}

const rollToolSchemaShape = {
  notation: z.string().min(1, 'Dice notation cannot be empty'),
  format: z
    .enum(['text', 'json'])
    .default('text')
    .describe('Output format: "text" for human-readable, "json" for structured data')
}

export function registerRollTool(server: McpServer): void {
  const description = getToolDescription('roll.md')

  registerTool(
    server,
    'roll',
    description,
    rollToolSchemaShape,
    ({ notation, format = 'text' }: { notation: string; format?: 'text' | 'json' }) => {
      const result = roll(notation as DiceNotation)

      if (result.error !== null) {
        const errorMessage: string = result.error.message

        if (format === 'json') {
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

      if (format === 'json') {
        return {
          content: [
            {
              type: 'text',
              text: formatRollResultJson(result)
            }
          ]
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: formatRollResult(result)
          }
        ]
      }
    }
  )
}
