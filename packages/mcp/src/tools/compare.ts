import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { analyze, isDiceNotation } from '@randsum/roller'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  try {
    return readFileSync(docPath, 'utf8')
  } catch {
    return 'Compare probability distributions of two dice notations. Useful for comparing different roll options.'
  }
}

const compareToolSchemaShape = {
  notation1: z.string().min(1, 'First dice notation cannot be empty'),
  notation2: z.string().min(1, 'Second dice notation cannot be empty'),
  samples: z
    .number()
    .int()
    .min(100)
    .max(100000)
    .default(10000)
    .describe('Number of samples for Monte Carlo simulation (100-100000, default: 10000)')
}

export function registerCompareTool(server: McpServer): void {
  const description = getToolDescription('compare.md')

  registerTool(
    server,
    'compare',
    description,
    compareToolSchemaShape,
    ({
      notation1,
      notation2,
      samples = 10000
    }: {
      notation1: string
      notation2: string
      samples?: number
    }) => {
      try {
        if (!isDiceNotation(notation1)) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid first dice notation: "${notation1}". Use formats like "2d20+5", "4d6L", "3d8!"`
              }
            ]
          }
        }

        if (!isDiceNotation(notation2)) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Invalid second dice notation: "${notation2}". Use formats like "2d20+5", "4d6L", "3d8!"`
              }
            ]
          }
        }

        const analysis1 = analyze(notation1, samples)
        const analysis2 = analyze(notation2, samples)

        const meanDiff = analysis1.mean - analysis2.mean
        const meanDiffPct = ((meanDiff / analysis2.mean) * 100).toFixed(1)
        const meanComparison =
          meanDiff > 0
            ? `${notation1} is higher by ${meanDiff.toFixed(2)} (${meanDiffPct}%)`
            : meanDiff < 0
              ? `${notation2} is higher by ${Math.abs(meanDiff).toFixed(2)} (${Math.abs(parseFloat(meanDiffPct))}%)`
              : 'Equal means'

        const output = `📊 Probability Comparison

${'─'.repeat(60)}

Notation 1: ${notation1}
  Min: ${analysis1.min}
  Max: ${analysis1.max}
  Mean: ${analysis1.mean.toFixed(2)}
  Median: ${analysis1.median.toFixed(2)}
  Mode: ${analysis1.mode}
  Std Dev: ${analysis1.standardDeviation.toFixed(2)}

Notation 2: ${notation2}
  Min: ${analysis2.min}
  Max: ${analysis2.max}
  Mean: ${analysis2.mean.toFixed(2)}
  Median: ${analysis2.median.toFixed(2)}
  Mode: ${analysis2.mode}
  Std Dev: ${analysis2.standardDeviation.toFixed(2)}

${'─'.repeat(60)}

Comparison:
  Mean Difference: ${meanComparison}
  Range Overlap: ${Math.max(analysis1.min, analysis2.min)} - ${Math.min(analysis1.max, analysis2.max)}
  ${analysis1.max >= analysis2.min && analysis2.max >= analysis1.min ? 'Ranges overlap' : 'Ranges do not overlap'}

Samples: ${samples.toLocaleString()} each`

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
              text: `❌ Error comparing notations: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
