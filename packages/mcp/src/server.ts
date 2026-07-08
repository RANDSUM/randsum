import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { version as VERSION } from '../package.json'
import { AVAILABLE_GAMES, rollGame } from './tools/rollGame'
import { rollNotation } from './tools/roll'
import { validateNotationInput } from './tools/validate'

/**
 * Wraps a plain handler result (or thrown error) in the MCP CallToolResult
 * envelope: JSON text content plus structured content, and `isError` on throw.
 */
function toResult(produce: () => Record<string, unknown>): CallToolResult {
  try {
    const value = produce()
    return {
      content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      structuredContent: value
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      content: [{ type: 'text', text: message }],
      isError: true
    }
  }
}

const rollingWith = z.enum(['Advantage', 'Disadvantage'])

const gameParamsSchema = z
  .object({
    rating: z.number().int().optional().describe('Blades in the Dark: action rating (0-4)'),
    modifier: z.number().optional().describe('Daggerheart / Fate / D&D 5e: flat modifier'),
    amplifyHope: z.boolean().optional().describe('Daggerheart: amplify the Hope die'),
    amplifyFear: z.boolean().optional().describe('Daggerheart: amplify the Fear die'),
    rollingWith: rollingWith
      .optional()
      .describe('Daggerheart / 5e / PbtA / Root: advantage or disadvantage'),
    crit: z.boolean().optional().describe('D&D 5e: roll critical (double dice)'),
    stat: z.number().optional().describe('Powered by the Apocalypse: stat value (required)'),
    forward: z.number().optional().describe('Powered by the Apocalypse: forward bonus'),
    ongoing: z.number().optional().describe('Powered by the Apocalypse: ongoing bonus'),
    bonus: z.number().optional().describe('Root RPG: bonus applied to the roll (required)'),
    tableName: z.string().optional().describe('Salvage Union: name of the table to roll on')
  })
  .default({})

/**
 * Builds the RANDSUM MCP server with the `roll`, `validate`, and `roll_game`
 * tools registered. Callers attach a transport via `server.connect(...)`.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: '@randsum/mcp', version: VERSION })

  server.registerTool(
    'roll',
    {
      title: 'Roll dice',
      description:
        'Roll dice using RANDSUM notation (e.g. "4d6L", "2d20+5"). Optionally pass a seed for a deterministic result. Returns the total, per-pool rolls, and a description.',
      inputSchema: {
        notation: z.string().describe('RANDSUM dice notation, e.g. "4d6L", "2d20+5", "1d20"'),
        seed: z
          .number()
          .int()
          .optional()
          .describe('Optional integer seed for a deterministic, reproducible roll')
      }
    },
    input => toResult(() => ({ ...rollNotation(input) }))
  )

  server.registerTool(
    'validate',
    {
      title: 'Validate dice notation',
      description:
        'Validate RANDSUM dice notation. Returns whether it is valid, a human-readable description, and a suggested fix when invalid.',
      inputSchema: {
        notation: z.string().describe('RANDSUM dice notation to validate, e.g. "4d6L" or "2d20+5"')
      }
    },
    input => toResult(() => ({ ...validateNotationInput(input) }))
  )

  server.registerTool(
    'roll_game',
    {
      title: 'Roll for a game system',
      description:
        'Roll for a specific tabletop game system (blades, daggerheart, fate, fifth, pbta, root-rpg, salvageunion), interpreting the dice per that game. Pass game-specific inputs in `params`.',
      inputSchema: {
        game: z.enum(AVAILABLE_GAMES).describe('Which game system to roll for'),
        params: gameParamsSchema.describe(
          'Game-specific inputs; only the fields relevant to the chosen game are used'
        )
      }
    },
    ({ game, params }) => toResult(() => ({ ...rollGame(game, params) }))
  )

  return server
}
