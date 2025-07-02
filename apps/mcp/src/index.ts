#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

import { roll } from '@randsum/dice'
import { validateNotation } from '@randsum/notation'
import type { RollResult } from '@randsum/dice'
import type { ValidationResult } from '@randsum/notation'

const server = new Server(
  {
    name: 'randsum-mcp-server',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
)

// Roll tool - Core dice rolling functionality
server.setRequestHandler(ListToolsRequestSchema, () => {
  return {
    tools: [
      {
        name: 'roll',
        description:
          'Roll dice using RANDSUM notation (e.g., "2d20+5", "4d6L")',
        inputSchema: {
          type: 'object',
          properties: {
            notation: {
              type: 'string',
              description:
                'Dice notation string (e.g., "2d20+5", "4d6L", "3d8!")'
            }
          },
          required: ['notation']
        }
      },
      {
        name: 'validate-notation',
        description: 'Validate dice notation and get helpful feedback',
        inputSchema: {
          type: 'object',
          properties: {
            notation: {
              type: 'string',
              description: 'Dice notation string to validate'
            }
          },
          required: ['notation']
        }
      },
      {
        name: 'game-roll',
        description:
          'Roll dice using game-specific mechanics (5e, Blades, Daggerheart, Salvage Union)',
        inputSchema: {
          type: 'object',
          properties: {
            game: {
              type: 'string',
              enum: ['5e', 'blades', 'daggerheart', 'salvageunion'],
              description: 'Game system to use for rolling'
            },
            modifier: {
              type: 'number',
              description:
                'Modifier to add to the roll (for 5e and Daggerheart)'
            },
            rollingWith: {
              type: 'string',
              enum: ['Advantage', 'Disadvantage'],
              description:
                'Roll with advantage or disadvantage (5e and Daggerheart)'
            },
            dicePool: {
              type: 'number',
              minimum: 1,
              maximum: 10,
              description: 'Number of dice in pool (for Blades in the Dark)'
            },
            tableName: {
              type: 'string',
              description:
                'Table name for Salvage Union rolls (e.g., "Core Mechanic", "Critical Damage")'
            },
            dc: {
              type: 'number',
              minimum: 1,
              maximum: 30,
              description:
                'Difficulty Class to check against (optional, for 5e and Daggerheart)'
            }
          },
          required: ['game']
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'roll': {
        const rollArgs = z
          .object({
            notation: z.string()
          })
          .parse(args)

        // Validate notation first
        const validation = validateNotation(rollArgs.notation)
        if (!validation.valid) {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid dice notation: ${rollArgs.notation}\n\nErrors:\n${validation.description.join('\n')}`
              }
            ]
          }
        }

        // Perform the roll
        const result: RollResult = roll(validation.notation)

        const rollDescription = validation.description.join(', ')
        const rollDetails = result.rolls
          .map(
            (r) =>
              `${r.parameters.description.join(' ')}: ${r.rawRolls.join(', ')} (total: ${String(r.total)})`
          )
          .join('\n')

        return {
          content: [
            {
              type: 'text',
              text: `🎲 **Roll Result**\n\n**Notation:** ${rollArgs.notation}\n**Description:** ${rollDescription}\n**Total:** ${String(result.total)}\n\n**Details:**\n${rollDetails}\n\n**Raw Results:** [${result.rawResults.join(', ')}]`
            }
          ]
        }
      }

      case 'validate-notation': {
        const validateArgs = z
          .object({
            notation: z.string()
          })
          .parse(args)

        const validation: ValidationResult = validateNotation(
          validateArgs.notation
        )

        if (validation.valid) {
          const description = validation.description.join(', ')
          return {
            content: [
              {
                type: 'text',
                text: `✅ **Valid Notation**\n\n**Notation:** ${validateArgs.notation}\n**Type:** ${validation.type}\n**Description:** ${description}`
              }
            ]
          }
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ **Invalid Notation**\n\n**Notation:** ${validateArgs.notation}\n\n**Issues:**\n${validation.description.map((desc) => `• ${desc}`).join('\n')}`
              }
            ]
          }
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    }
  }
})

// Resources - Dice notation documentation
server.setRequestHandler(ListResourcesRequestSchema, () => {
  return {
    resources: [
      {
        uri: 'randsum://dice-notation-docs',
        mimeType: 'text/markdown',
        name: 'RANDSUM Dice Notation Reference',
        description:
          'Complete reference for RANDSUM dice notation syntax and modifiers'
      }
    ]
  }
})

server.setRequestHandler(ReadResourceRequestSchema, (request) => {
  const { uri } = request.params

  if (uri === 'randsum://dice-notation-docs') {
    // This would ideally read from the actual RANDSUM_DICE_NOTATION.md file
    // For now, providing a basic reference
    const content = `# RANDSUM Dice Notation Reference

## Basic Syntax
- \`NdS\`: Roll N S-sided dice (e.g., \`4d6\`)
- \`NdS+X\`: Add X to total (e.g., \`2d8+3\`)
- \`NdS-X\`: Subtract X from total (e.g., \`2d8-1\`)

## Modifiers
- \`L\`: Drop lowest (e.g., \`4d6L\`)
- \`H\`: Keep highest (e.g., \`2d20H\`)
- \`R{<N}\`: Reroll below N (e.g., \`4d6R{<3}\`)
- \`!\`: Exploding dice (e.g., \`3d8!\`)
- \`U\`: Unique results (e.g., \`3d6U\`)

## Examples
- \`1d20+5\`: Roll 1d20 and add 5
- \`4d6L\`: Roll 4d6, drop the lowest
- \`2d20H\`: Roll 2d20, keep the highest (advantage)
- \`3d8!\`: Roll 3d8 with exploding dice
- \`4d6R{<3}\`: Roll 4d6, reroll any results below 3

## Custom Dice
- \`2d{HT}\`: Roll 2 custom dice with faces H and T (coin flip)
- \`3d{ABC}\`: Roll 3 custom dice with faces A, B, and C`

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content
        }
      ]
    }
  }

  throw new Error(`Resource not found: ${uri}`)
})

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('RANDSUM MCP Server running on stdio')
}

if (import.meta.url === `file://${String(process.argv[1])}`) {
  main().catch((error: unknown) => {
    console.error('Server error:', error)
    process.exit(1)
  })
}
