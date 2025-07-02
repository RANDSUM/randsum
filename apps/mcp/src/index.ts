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

// RANDSUM dice notation documentation URL
const NOTATION_DOCS_URL =
  'https://raw.githubusercontent.com/RANDSUM/randsum/main/corePackages/notation/RANDSUM_DICE_NOTATION.md'

// Function to fetch the RANDSUM dice notation documentation
async function fetchNotationDocs(): Promise<string> {
  try {
    const response = await fetch(NOTATION_DOCS_URL)
    if (!response.ok) {
      throw new Error(`HTTP ${String(response.status)}: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    // Fallback content if fetch fails
    return `# RANDSUM Dice Notation

## Overview
Dice notation is a compact way to represent dice rolls and their modifications.

## Basic Syntax
- \`2d6\` - Roll two six-sided dice
- \`4d6L\` - Roll four six-sided dice, drop the lowest
- \`2d20H\` - Roll two twenty-sided dice, keep the highest (advantage)
- \`3d6!\` - Roll three six-sided dice with exploding on maximum

## Modifiers
- \`L\` - Drop lowest die
- \`H\` - Drop highest die
- \`!\` - Exploding dice (reroll on maximum)
- \`R{<N}\` - Reroll dice under N
- \`U\` - Unique results only
- \`C{>N}\` - Cap results over N
- \`V{<N=X}\` - Replace values less than N with X
- \`V{>N=X}\` - Replace values greater than N with X
- \`V{N=X}\` - Replace values equal to N with X
- \`V{N}\` - Remove values equal to N
- \`V{<N}\` - Remove values less than N
- \`V{>N}\` - Remove values greater than N
- \`V{<N=X,>N=Y}\` - Replace values less than N with X and greater than N with Y
- \`V{<N=X,>N=Y,N=Z}\` - Replace values less than N with X, greater than N with Y, and equal to N with Z
- \`+X\` - Add X to total
- \`-X\` - Subtract X from total

## Error Loading Documentation
Could not fetch the complete documentation from GitHub.
For the full reference, visit: ${NOTATION_DOCS_URL}

Error: ${error instanceof Error ? error.message : String(error)}`
  }
}

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
      instructions: `RANDSUM MCP Server - Advanced Dice Rolling and Game Mechanics

This server provides comprehensive dice rolling capabilities using RANDSUM's powerful notation system.

🎲 CORE CAPABILITIES:
• Roll dice with standard notation (2d6, 4d20+5, etc.)
• Advanced modifiers: drop lowest/highest (L/H), reroll (R), exploding (!), unique (U)
• Complex conditions: cap values (C), replace values (V), conditional drops/rerolls
• Custom-faced dice with arbitrary symbols
• Detailed roll breakdowns with individual die results

🔧 AVAILABLE TOOLS:
• roll - Execute dice rolls with full RANDSUM notation support
• validate-notation - Validate and explain dice notation syntax

📖 NOTATION REFERENCE:
For complete notation documentation, see: ${NOTATION_DOCS_URL.replace('raw.githubusercontent.com', 'github.com').replace('/main/', '/blob/main/')}

Examples: 4d6L (ability scores), 2d20H (advantage), 3d6! (exploding), 4d20R{<5} (reroll under 5)`
    }
  )

  // Register RANDSUM tools
  server.tool(
    'roll',
    'Roll dice using RANDSUM notation with advanced modifiers. Supports: basic rolls (2d6+3), drop lowest/highest (4d6L, 2d20H), rerolls (4d6R{<3}), exploding dice (3d6!), unique results (4d20U), capping values (4d20C{>18}), custom faces (2d{HT}), and complex combinations (4d6LR{<2}+5). Returns detailed breakdown including individual die results, modifiers applied, and final total.',
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
    'Validate RANDSUM dice notation syntax and receive detailed feedback. Checks for proper format, valid modifiers, logical combinations, and provides helpful error messages with suggestions for corrections. Useful for learning notation syntax or debugging complex roll expressions before execution.',
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

  // Register RANDSUM resources
  server.resource(
    'dice-notation-docs',
    'randsum://dice-notation-docs',
    async () => {
      const docs = await fetchNotationDocs()
      return {
        contents: [
          {
            uri: 'randsum://dice-notation-docs',
            text: docs,
            mimeType: 'text/markdown'
          }
        ]
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
