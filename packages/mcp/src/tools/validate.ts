import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { validateNotation } from '@randsum/roller'
import { formatValidationResult } from '../formatters/index.js'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  return readFileSync(docPath, 'utf8')
}

const validateNotationToolSchemaShape = {
  notation: z.string().min(1, 'Notation string cannot be empty')
}

export function registerValidateTool(server: McpServer): void {
  const description = getToolDescription('validate-notation.md')

  registerTool(
    server,
    'validate-notation',
    description,
    validateNotationToolSchemaShape,
    ({ notation }: { notation: string }) => {
      try {
        const validation = validateNotation(notation)
        return {
          content: [
            {
              type: 'text',
              text: formatValidationResult(validation)
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
              text: `❌ Error validating notation: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
