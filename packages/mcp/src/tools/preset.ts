import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { resolvePreset, resolvePresetParam, roll } from '@randsum/roller'
import { formatRollResult } from '../formatters/index.js'
import { registerTool } from './helpers.js'

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  try {
    return readFileSync(docPath, 'utf8')
  } catch {
    return 'Roll dice using a preset configuration. Supports common roll patterns like D&D ability scores, advantage, Fate dice, etc.'
  }
}

const presetToolSchemaShape = {
  preset: z
    .enum(['dnd-ability-score', 'dnd-advantage', 'dnd-disadvantage', 'fate-dice', 'shadowrun-pool'])
    .describe('Preset name'),
  args: z
    .record(z.unknown())
    .optional()
    .describe('Optional arguments for parameterized presets (e.g., {"dice": 8} for shadowrun-pool)')
}

export function registerPresetTool(server: McpServer): void {
  const description = getToolDescription('preset.md')

  registerTool(
    server,
    'preset',
    description,
    presetToolSchemaShape,
    ({ preset, args }: { preset: string; args: Record<string, unknown> | undefined }) => {
      const resolvedArgs = args ?? {}
      try {
        const presetValue =
          preset === 'shadowrun-pool'
            ? resolvePresetParam(preset, resolvedArgs)
            : resolvePreset(preset)

        const result = roll(presetValue)

        const presetInfo = `🎲 Preset Roll: ${preset}
${typeof presetValue === 'string' ? `Notation: ${presetValue}` : `Options: ${JSON.stringify(presetValue)}`}
${'─'.repeat(40)}`

        const rollOutput = formatRollResult(result)

        return {
          content: [
            {
              type: 'text',
              text: `${presetInfo}\n\n${rollOutput}`
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
              text: `❌ Error using preset: ${errorMessage}`
            }
          ]
        }
      }
    }
  )
}
