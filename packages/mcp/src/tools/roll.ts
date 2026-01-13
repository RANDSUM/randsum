import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { isDiceNotation, roll } from '@randsum/roller'
import { formatRollResult } from '../formatters/index.js'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  return readFileSync(docPath, 'utf8')
}

const rollToolSchemaShape = {
  notation: z.string().min(1, 'Dice notation cannot be empty')
}

export function registerRollTool(server: McpServer): void {
  const description = getToolDescription('roll.md')

  registerTool(
    server,
    'roll',
    description,
    rollToolSchemaShape,
    ({ notation }: { notation: string }) => {
      try {
        if (!isDiceNotation(notation)) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid dice notation: "${notation}". Use formats like "2d20+5", "4d6L", "3d8!"`
              }
            ]
          }
        }
        const result = roll(notation)
        return {
          content: [
            {
              type: 'text',
              text: formatRollResult(result)
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
              text: `❌ Error rolling dice: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
