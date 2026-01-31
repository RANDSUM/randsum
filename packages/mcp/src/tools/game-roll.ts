import { z } from 'zod'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerTool } from './helpers.js'

// Generic result type that covers all game roll results
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
    // Return default description if file doesn't exist
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
      try {
        let result: GameRollResult

        switch (game) {
          case 'blades': {
            const { rollBlades } = await import('@randsum/blades')
            const countArg = args['count']
            const count = typeof countArg === 'number' ? countArg : Number(countArg)

            result = rollBlades(count) as GameRollResult
            break
          }

          case 'fifth': {
            const { actionRoll } = await import('@randsum/fifth')

            result = actionRoll(
              args as {
                modifier: number
                rollingWith?: { advantage?: boolean; disadvantage?: boolean }
              }
            ) as GameRollResult
            break
          }

          case 'pbta': {
            const { rollPbtA } = await import('@randsum/pbta')

            result = rollPbtA(
              args as {
                stat: number
                forward?: number
                ongoing?: number
                advantage?: boolean
                disadvantage?: boolean
              }
            ) as GameRollResult
            break
          }

          case 'daggerheart': {
            const { rollDaggerheart } = await import('@randsum/daggerheart')

            result = rollDaggerheart(
              args as {
                rollingWith?: 'Advantage' | 'Disadvantage'
                amplifyHope?: boolean
                amplifyFear?: boolean
                modifier?: number
              }
            ) as GameRollResult
            break
          }

          case 'root-rpg': {
            const { rollRootRpg } = await import('@randsum/root-rpg')
            const bonusArg = args['bonus']
            const bonus = typeof bonusArg === 'number' ? bonusArg : Number(bonusArg)

            result = rollRootRpg(bonus) as GameRollResult
            break
          }

          case 'salvageunion': {
            const { rollTable } = await import('@randsum/salvageunion')
            const tableNameArg = args['tableName']
            const tableName = typeof tableNameArg === 'string' ? tableNameArg : undefined

            result = rollTable(tableName) as GameRollResult
            break
          }

          default: {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ Unknown game system: "${game}". Supported games: blades, fifth, pbta, daggerheart, root-rpg, salvageunion`
                }
              ]
            }
          }
        }

        // Format result for display
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
