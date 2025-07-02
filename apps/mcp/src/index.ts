#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'
import { setupToolHandlers } from './tools/index.js'
import { setupResourceHandlers } from './resources/index.js'

const server = createServer()

setupToolHandlers(server)
setupResourceHandlers(server)

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
