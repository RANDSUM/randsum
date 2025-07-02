import { Server } from '@modelcontextprotocol/sdk/server/index.js'

export function createServer(): Server {
  return new Server(
    {
      name: 'randsum-mcp-server',
      version: '0.2.1'
    },
    {
      capabilities: {
        tools: {
          listChanged: true
        },
        resources: {
          subscribe: true,
          listChanged: true
        }
      }
    }
  )
}
