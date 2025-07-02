import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from '../server.js'
import { setupToolHandlers } from '../tools/index.js'
import { setupResourceHandlers } from '../resources/index.js'
import { log } from '../tools/log.js'
import type { ServerOptions } from '../cli.js'

export async function startStdioServer(options: ServerOptions): Promise<void> {
  const server = createServer()
  setupToolHandlers(server)
  setupResourceHandlers(server)

  const transport = new StdioServerTransport()

  log('Starting RANDSUM MCP Server with stdio transport...', options.verbose)

  await server.connect(transport)
  log('RANDSUM MCP Server running on stdio', true)
}
