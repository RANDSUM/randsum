import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTool } from './helpers.js'

/**
 * Generic result type that covers all game roll results.
 *
 * Each game package returns a specific GameRollResult<TResult, TDetails, TRollRecord>,
 * but for MCP tool formatting we only need these common properties. The type assertions
 * to GameRollResult in the switch statement are safe because all game packages conform
 * to this interface (they all extend the base GameRollResult from @randsum/roller).
 */
interface GameRollResult {
  total: number
  result: unknown
  rolls: {
    total: number
    modifierHistory: {
      modifiedRolls: number[]
    }
  }[]
  details?: unknown
}

function getToolDescription(filename: string): string {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const docPath = join(__dirname, '..', '..', 'docs', 'tools', filename)
  try {
    return readFileSync(docPath, 'utf8')
  } catch {
    return 'Roll dice for a specific game system. Supports all RANDSUM game packages.'
  }
}

const gameRollToolSchemaShape = {
  game: z
    .enum(['blades', 'fifth', 'pbta', 'daggerheart', 'root-rpg', 'salvageunion'])
    .describe('Game system name'),
  args: z.record(z.unknown()).describe('Game-specific arguments as JSON object')
}

export function registerGameRollTool(server: McpServer): void {
  const description = getToolDescription('game-roll.md')

  registerTool(
    server,
    'game-roll',
    description,
    gameRollToolSchemaShape,
    async ({ game, args }: { game: string; args: Record<string, unknown> }) => {
      const executeGameRoll = async (): Promise<GameRollResult | null> => {
        switch (game) {
          case 'blades': {
            const { roll } = await import('@randsum/blades')
            const countArg = args['count']
            const count = typeof countArg === 'number' ? countArg : Number(countArg)
            return roll(count) as GameRollResult
          }

          case 'fifth': {
            const { roll } = await import('@randsum/fifth')
            return roll(
              args as {
                modifier: number
                rollingWith?: { advantage?: boolean; disadvantage?: boolean }
              }
            ) as GameRollResult
          }

          case 'pbta': {
            const { roll } = await import('@randsum/pbta')
            return roll(
              args as {
                stat: number
                forward?: number
                ongoing?: number
                advantage?: boolean
                disadvantage?: boolean
              }
            ) as GameRollResult
          }

          case 'daggerheart': {
            const { roll } = await import('@randsum/daggerheart')
            return roll(
              args as {
                rollingWith?: 'Advantage' | 'Disadvantage'
                amplifyHope?: boolean
                amplifyFear?: boolean
                modifier?: number
              }
            ) as GameRollResult
          }

          case 'root-rpg': {
            const { roll } = await import('@randsum/root-rpg')
            const bonusArg = args['bonus']
            const bonus = typeof bonusArg === 'number' ? bonusArg : Number(bonusArg)
            return roll(bonus) as GameRollResult
          }

          case 'salvageunion': {
            const { roll } = await import('@randsum/salvageunion')
            const tableNameArg = args['tableName']
            const tableName = typeof tableNameArg === 'string' ? tableNameArg : undefined
            return roll(tableName) as GameRollResult
          }

          default:
            return null
        }
      }

      try {
        const result = await executeGameRoll()

        if (result === null) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Unknown game system: "${game}". Supported games: blades, fifth, pbta, daggerheart, root-rpg, salvageunion`
              }
            ]
          }
        }

        const output = `🎮 ${game.toUpperCase()} Roll Result

Total: ${result.total}
Result: ${JSON.stringify(result.result, null, 2)}

Rolls: ${result.rolls.length} roll group(s)
${result.rolls
  .map(
    (roll, i) => `  Roll ${i + 1}: ${roll.total} (${roll.modifierHistory.modifiedRolls.join(', ')})`
  )
  .join('\n')}

${result.details ? `Details: ${JSON.stringify(result.details, null, 2)}` : ''}`

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
              text: `❌ Error rolling ${game}: ${errorMessage}\nArgs: ${JSON.stringify(args)}`
            }
          ]
        }
      }
    }
  )
}
