import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import type { Server } from '@modelcontextprotocol/sdk/server/index.js'

const DICE_NOTATION_DOCS_CONTENT = `# RANDSUM Dice Notation Reference

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

export function setupResourceHandlers(server: Server): void {
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
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: DICE_NOTATION_DOCS_CONTENT
          }
        ]
      }
    }

    throw new Error(`Resource not found: ${uri}`)
  })
}
