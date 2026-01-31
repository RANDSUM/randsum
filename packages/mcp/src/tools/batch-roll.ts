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
    // Return default description if file doesn't exist
    return 'Roll dice multiple times in a batch. Useful for generating multiple ability scores, initiative rolls, etc.'
  }
}

const batchRollToolSchemaShape = {
  notation: z.string().min(1, 'Dice notation cannot be empty'),
  count: z.number().int().min(1).max(100).describe('Number of times to roll (1-100)'),
  label: z
    .string()
    .optional()
    .describe('Optional label for the batch (e.g., "Strength", "Initiative")')
}

export function registerBatchRollTool(server: McpServer): void {
  const description = getToolDescription('batch-roll.md')

  registerTool(
    server,
    'batch-roll',
    description,
    batchRollToolSchemaShape,
    ({
      notation,
      count,
      label
    }: {
      notation: string
      count: number
      label: string | undefined
    }) => {
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

        if (count < 1 || count > 100) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid count: ${count}. Must be between 1 and 100.`
              }
            ]
          }
        }

        const results: { index: number; total: number; rolls: number[] }[] = []
        const allTotals: number[] = []

        for (let i = 0; i < count; i++) {
          const result = roll(notation)
          const firstRoll = result.rolls[0]
          results.push({
            index: i + 1,
            total: result.total,
            rolls: firstRoll?.modifierHistory.modifiedRolls ?? []
          })
          allTotals.push(result.total)
        }

        const batchLabel = label ? `${label} ` : ''
        const header = `🎲 Batch Roll: ${batchLabel}${notation} (${count} times)`
        const separator = '─'.repeat(50)

        const totalsLine = `\nTotal Results: [${allTotals.join(', ')}]`
        const sumLine = `Sum: ${allTotals.reduce((a, b) => a + b, 0)}`
        const avgLine = `Average: ${(allTotals.reduce((a, b) => a + b, 0) / count).toFixed(2)}`
        const minLine = `Min: ${Math.min(...allTotals)}`
        const maxLine = `Max: ${Math.max(...allTotals)}`

        const resultsList = results
          .map(r => `  ${r.index}. Total: ${r.total} [${r.rolls.join(', ')}]`)
          .join('\n')

        const output = [
          header,
          separator,
          totalsLine,
          sumLine,
          avgLine,
          minLine,
          maxLine,
          '\nIndividual Results:',
          resultsList
        ].join('\n')

        return {
          content: [
            {
              type: 'text',
              text: output
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
              text: `❌ Error in batch roll: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
