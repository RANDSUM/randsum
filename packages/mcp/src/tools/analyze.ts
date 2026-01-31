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
    // Return default description if file doesn't exist
    return 'Analyze the probability distribution of a dice notation. Returns statistics including min, max, mean, median, mode, standard deviation, and probability distribution.'
  }
}

const analyzeToolSchemaShape = {
  notation: z.string().min(1, 'Dice notation cannot be empty'),
  samples: z
    .number()
    .int()
    .min(100)
    .max(100000)
    .default(10000)
    .describe('Number of samples for Monte Carlo simulation (100-100000, default: 10000)')
}

export function registerAnalyzeTool(server: McpServer): void {
  const description = getToolDescription('analyze.md')

  registerTool(
    server,
    'analyze',
    description,
    analyzeToolSchemaShape,
    ({ notation, samples = 10000 }: { notation: string; samples?: number }) => {
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

        const analysis = analyze(notation, samples)

        // Format distribution map for display
        const distributionEntries = Array.from(analysis.distribution.entries())
          .sort(([a], [b]) => a - b)
          .map(([value, probability]) => `  ${value}: ${(probability * 100).toFixed(2)}%`)
          .join('\n')

        const output = `📊 Probability Analysis: ${notation}

Samples: ${samples.toLocaleString()}

Statistics:
  Minimum: ${analysis.min}
  Maximum: ${analysis.max}
  Mean: ${analysis.mean.toFixed(2)}
  Median: ${analysis.median.toFixed(2)}
  Mode: ${analysis.mode}
  Standard Deviation: ${analysis.standardDeviation.toFixed(2)}

Probability Distribution:
${distributionEntries.length > 0 ? distributionEntries : '  (no distribution data)'}`

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
              text: `❌ Error analyzing notation: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
