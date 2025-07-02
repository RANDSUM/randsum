#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { roll } from '@randsum/dice'
import type { RollResult } from '@randsum/dice'
import {
  type DiceNotation,
  isDiceNotation,
  validateNotation
} from '@randsum/notation'
import type { ValidationResult } from '@randsum/notation'
import { createServer } from 'http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { Command } from 'commander'

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

// Transport configuration
const TRANSPORT_TYPE = (cliOptions.transport || 'stdio') as
  | 'stdio'
  | 'http'
  | 'sse'

// HTTP/SSE port configuration
const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10)
  return isNaN(parsed) ? undefined : parsed
})()

// Store SSE transports by session ID
const sseTransports: Record<string, SSEServerTransport> = {}

// Enhanced Zod schemas for MCP tool parameters
const diceNotationSchema = z
  .string()
  .min(1, 'Dice notation cannot be empty')
  .refine((value): value is DiceNotation => isDiceNotation(value), {
    message: 'Invalid dice notation. Use formats like "2d20+5", "4d6L", "3d8!"'
  })

// Roll tool parameter schema
const rollToolSchema = z.object({
  notation: diceNotationSchema.describe(
    'Dice notation string (e.g., "2d20+5", "4d6L", "3d8!")'
  )
})

// Validate notation tool parameter schema
const validateNotationToolSchema = z.object({
  notation: z
    .string()
    .min(1, 'Notation string cannot be empty')
    .describe('Dice notation string to validate')
})

// Roll result formatting utilities
function formatRollResult(result: RollResult): string {
  const { type, total, rolls, rawResults } = result

  // Create header with total and type
  const header = `🎲 RANDSUM Roll Result (${type}):`
  const separator = '─'.repeat(30)
  const totalLine = `Total: ${String(total)}`

  // Format individual roll details
  const rollDetails = rolls
    .map((roll, index) => {
      const { parameters, rawRolls, modifiedRolls } = roll
      const notation = parameters.notation
      const rawRollsStr = rawRolls.join(', ')
      const modifiedRollsStr = modifiedRolls.rolls.join(', ')

      let rollInfo = `Roll ${(index + 1).toString()}: ${notation}`
      rollInfo += `\n  Raw: [${rawRollsStr}]`

      // Show modified rolls if different from raw
      if (rawRollsStr !== modifiedRollsStr) {
        rollInfo += `\n  Modified: [${modifiedRollsStr}]`
      }

      rollInfo += `\n  Subtotal: ${String(roll.total)}`
      return rollInfo
    })
    .join('\n\n')

  // Format raw results summary
  const rawResultsLine = `Raw Results: [${rawResults.join(', ')}]`

  return [
    header,
    separator,
    totalLine,
    rawResultsLine,
    '',
    'Roll Details:',
    rollDetails
  ].join('\n')
}

function formatValidationResult(result: ValidationResult): string {
  if (!result.valid) {
    return `❌ Invalid Dice Notation\n\nError: ${result.description.join(', ')}`
  }

  const { type, notation, description, digested } = result
  const header = `✅ Valid Dice Notation (${type}):`
  const separator = '─'.repeat(25)

  const details = [
    `Notation: ${notation}`,
    `Description: ${description.join(', ')}`,
    '',
    'Parsed Details:',
    JSON.stringify(digested, null, 2)
  ]

  return [header, separator, ...details].join('\n')
}

// Function to create a new server instance with all tools registered
function createServerInstance(): McpServer {
  const server = new McpServer(
    {
      name: 'RANDSUM',
      version: '0.2.6'
    },
    {
      instructions:
        'Use this server to roll dice using RANDSUM notation and validate dice notation syntax.'
    }
  )

  // Register RANDSUM tools
  server.tool(
    'roll',
    'Roll dice using RANDSUM notation (e.g., "2d20+5", "4d6L")',
    rollToolSchema.shape,
    ({ notation }) => {
      try {
        const result = roll(notation)
        return {
          content: [
            {
              type: 'text',
              text: formatRollResult(result)
            }
          ]
        }
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error rolling dice: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        }
      }
    }
  )

  server.tool(
    'validate-notation',
    'Validate dice notation and get helpful feedback',
    validateNotationToolSchema.shape,
    ({ notation }) => {
      try {
        const validation = validateNotation(notation)
        return {
          content: [
            {
              type: 'text',
              text: formatValidationResult(validation)
            }
          ]
        }
      } catch (error: unknown) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error validating notation: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        }
      }
    }
  )

  return server
}

async function main(): Promise<void> {
  try {
    const shutdown = (): void => {
      console.error('Shutting down RANDSUM MCP server...')
      process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    switch (TRANSPORT_TYPE) {
      case 'stdio':
        await runStdioTransport()
        break
      case 'http': {
        const httpPort = CLI_PORT ?? 3000
        runHttpTransport(httpPort)
        break
      }
      case 'sse': {
        const ssePort = CLI_PORT ?? 3000
        runSseTransport(ssePort)
        break
      }
      default:
        throw new Error(`Unsupported transport: ${TRANSPORT_TYPE as string}`)
    }
  } catch (error: unknown) {
    console.error('Fatal error starting RANDSUM MCP server:', error)
    process.exit(1)
  }
}

async function runStdioTransport(): Promise<void> {
  const server = createServerInstance()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

function runHttpTransport(port: number): void {
  const server = createServerInstance()
  const httpServer = createServer()

  httpServer.on('request', (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => Math.random().toString(36).substring(2, 15)
    })
    server.connect(transport).catch((error: unknown) => {
      console.error('HTTP transport error:', error)
      if (!res.headersSent) {
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    })
  })

  httpServer.listen(port, () => {
    console.error(
      `RANDSUM MCP server running on http://localhost:${port.toString()}`
    )
  })
}

function runSseTransport(port: number): void {
  const httpServer = createServer()

  httpServer.on('request', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.url?.startsWith('/sse')) {
      const url = new URL(req.url, `http://${String(req.headers.host)}`)
      const sessionId = url.searchParams.get('sessionId')

      if (!sessionId) {
        res.writeHead(400)
        res.end('Missing sessionId parameter')
        return
      }

      const server = createServerInstance()
      const transport = new SSEServerTransport('/sse', res)
      sseTransports[sessionId] = transport

      server.connect(transport).catch((error: unknown) => {
        console.error('SSE transport error:', error)
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sseTransports[sessionId]
      })

      req.on('close', () => {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete sseTransports[sessionId]
      })
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })

  httpServer.listen(port, () => {
    console.error(
      `RANDSUM MCP server (SSE) running on http://localhost:${String(port)}`
    )
  })
}

main().catch((error: unknown) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})
