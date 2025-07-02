import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import type { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { toolDefinitions } from './definitions.js'
import { handleRollTool, handleValidateNotationTool } from './handlers.js'

export function setupToolHandlers(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, () => {
    return {
      tools: toolDefinitions
    }
  })

  server.setRequestHandler(CallToolRequestSchema, (request) => {
    const { name, arguments: args } = request.params

    try {
      switch (name) {
        case 'roll':
          return handleRollTool(args)

        case 'validate-notation':
          return handleValidateNotationTool(args)

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
}
