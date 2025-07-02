import { Server } from '@modelcontextprotocol/sdk/server/index.js'

export function createServer(): Server {
  return new Server(
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
}
