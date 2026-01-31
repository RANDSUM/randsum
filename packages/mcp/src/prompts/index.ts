import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

interface PromptArgs {
  count?: string | number
  dicePool?: string | number
  initiativeModifier?: string | number
  attackModifier?: string | number
  advantage?: string | boolean
  stat?: string | number
  forward?: string | number
  ongoing?: string | number
}

interface PromptRequest {
  params: {
    name: string
    arguments?: PromptArgs
  }
}

interface PromptListResponse {
  prompts: {
    name: string
    description: string
    arguments?: { name: string; description: string }[]
  }[]
}

interface PromptGetResponse {
  messages: {
    role: string
    content: { type: string; text: string }
  }[]
}

// Extended server interface that includes prompt handlers
interface McpServerWithPrompts extends McpServer {
  setRequestHandler(method: 'prompts/list', handler: () => PromptListResponse): void
  setRequestHandler(
    method: 'prompts/get',
    handler: (request: PromptRequest) => PromptGetResponse
  ): void
}

/**
 * Registers all MCP prompts for common scenarios.
 */
export function registerPrompts(server: McpServer): void {
  const promptServer = server as McpServerWithPrompts
  // D&D Ability Scores prompt
  promptServer.setRequestHandler('prompts/list', () => {
    return {
      prompts: [
        {
          name: 'dnd-ability-scores',
          description: 'Generate D&D 5e ability scores using 4d6 drop lowest method',
          arguments: [
            {
              name: 'count',
              description: 'Number of ability scores to generate (default: 6)'
            }
          ]
        },
        {
          name: 'blades-action',
          description: 'Roll a Blades in the Dark action roll',
          arguments: [
            {
              name: 'dicePool',
              description: 'Number of dice in the pool (0-10)'
            }
          ]
        },
        {
          name: 'combat-round',
          description: 'Roll initiative and attack rolls for a combat round',
          arguments: [
            {
              name: 'initiativeModifier',
              description: 'Initiative modifier (default: 0)'
            },
            {
              name: 'attackModifier',
              description: 'Attack modifier (default: 0)'
            },
            {
              name: 'advantage',
              description: 'Roll with advantage (default: false)'
            }
          ]
        },
        {
          name: 'pbta-roll',
          description: 'Roll a Powered by the Apocalypse move',
          arguments: [
            {
              name: 'stat',
              description: 'Stat modifier (-3 to 5)'
            },
            {
              name: 'forward',
              description: 'Forward bonus (-5 to 5, default: 0)'
            },
            {
              name: 'ongoing',
              description: 'Ongoing bonus (-5 to 5, default: 0)'
            }
          ]
        }
      ]
    }
  })

  promptServer.setRequestHandler('prompts/get', (request: PromptRequest) => {
    const { name, arguments: args } = request.params

    switch (name) {
      case 'dnd-ability-scores': {
        const count = args?.count ? Number(args.count) : 6
        const notation = '4d6L'
        const rolls = Array.from({ length: count }, (_, i) => i + 1)
          .map(i => `Roll ${i}: ${notation}`)
          .join('\n')

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Roll ${count} D&D 5e ability scores using ${notation} (4d6, drop lowest). Generate one ability score per roll.\n\nRolls to execute:\n${rolls}`
              }
            }
          ]
        }
      }

      case 'blades-action': {
        const dicePool = args?.dicePool ? Number(args.dicePool) : 2

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Roll a Blades in the Dark action roll with ${dicePool} dice. Use the game-roll tool with game="blades" and args={"count": ${dicePool}}.`
              }
            }
          ]
        }
      }

      case 'combat-round': {
        const initiativeMod = args?.initiativeModifier ? Number(args.initiativeModifier) : 0
        const attackMod = args?.attackModifier ? Number(args.attackModifier) : 0
        const advantage = args?.advantage === true || args?.advantage === 'true'

        const initiativeNotation = `1d20+${initiativeMod}`
        const attackNotation = advantage ? `2d20L+${attackMod}` : `1d20+${attackMod}`

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Roll for a combat round:\n1. Initiative: ${initiativeNotation}\n2. Attack: ${attackNotation}${advantage ? ' (with advantage)' : ''}\n\nExecute both rolls and present the results.`
              }
            }
          ]
        }
      }

      case 'pbta-roll': {
        const stat = args?.stat ? Number(args.stat) : 0
        const forward = args?.forward ? Number(args.forward) : 0
        const ongoing = args?.ongoing ? Number(args.ongoing) : 0

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Roll a Powered by the Apocalypse move with stat=${stat}, forward=${forward}, ongoing=${ongoing}. Use the game-roll tool with game="pbta" and args={"stat": ${stat}, "forward": ${forward}, "ongoing": ${ongoing}}.`
              }
            }
          ]
        }
      }

      default:
        throw new Error(`Unknown prompt: ${name}`)
    }
  })
}
