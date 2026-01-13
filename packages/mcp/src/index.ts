#!/usr/bin/env node

import { Command } from 'commander'
import { createServerInstance } from './server.js'
import { runHttpTransport, runSseTransport, runStdioTransport } from './transports/index.js'

const program = new Command()
  .option('--transport <type>', 'transport type', 'stdio')
  .option('--port <number>', 'port for HTTP/SSE transport', '3000')
  .allowUnknownOption() // Passthrough for other services
  .parse(process.argv)

const cliOptions = program.opts<{
  transport: string
  port: string
}>()

const allowedTransports = ['stdio', 'http', 'sse']
if (!allowedTransports.includes(cliOptions.transport)) {
  console.error(
    `Invalid --transport value: '${cliOptions.transport}'. Must be one of: stdio, http, sse.`
  )
  process.exit(1)
}

const TRANSPORT_TYPE = (cliOptions.transport || 'stdio') as 'stdio' | 'http' | 'sse'

const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10)
  return isNaN(parsed) ? undefined : parsed
})()

async function main(): Promise<void> {
  try {
    const shutdown = (): void => {
      console.error('Shutting down RANDSUM MCP server...')
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    const server = createServerInstance()

    switch (TRANSPORT_TYPE) {
      case 'stdio':
        await runStdioTransport(server)
        break
      case 'http': {
        const httpPort = CLI_PORT ?? 3000
        runHttpTransport(server, httpPort)
        break
      }
      case 'sse': {
        const ssePort = CLI_PORT ?? 3000
        runSseTransport(server, ssePort)
        break
      }
      default:
        throw new Error(`Unsupported transport: ${TRANSPORT_TYPE as string}`)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'An unknown error occurred'
    console.error('Fatal error starting RANDSUM MCP server:', errorMessage)
    process.exit(1)
  }
}

main().catch((error: unknown) => {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'An unknown error occurred'
  console.error('Unhandled error:', errorMessage)
  process.exit(1)
})
