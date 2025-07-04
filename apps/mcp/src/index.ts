#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  type DiceNotation,
  type RollResult,
  type ValidationResult,
  isDiceNotation,
  roll,
  validateNotation
} from '@randsum/roller'
import { createServer } from 'http'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

const TRANSPORT_TYPE = (cliOptions.transport || 'stdio') as
  | 'stdio'
  | 'http'
  | 'sse'

const CLI_PORT = (() => {
  const parsed = parseInt(cliOptions.port, 10)
  return isNaN(parsed) ? undefined : parsed
})()

const sseTransports: Record<string, SSEServerTransport> = {}

const diceNotationSchema = z
  .string()
  .min(1, 'Dice notation cannot be empty')
  .refine((value): value is DiceNotation => isDiceNotation(value), {
    message: 'Invalid dice notation. Use formats like "2d20+5", "4d6L", "3d8!"'
  })

const rollToolSchema = z.object({
  notation: diceNotationSchema.describe(
    `RANDSUM dice notation string following pattern: {quantity}d{sides}{modifiers}

BASIC EXAMPLES:
• "2d6" - Roll 2 six-sided dice
• "1d20+5" - Roll 1d20, add 5
• "4d6L" - Roll 4d6, drop lowest (D&D ability score)
• "2d20H" - Roll 2d20, keep highest (advantage)
• "3d6!" - Roll 3d6 with exploding dice
• "4d6R{1}" - Roll 4d6, reroll any 1s
• "4d20U" - Roll 4d20 with unique results
• "4d20C{>18}" - Roll 4d20, cap results above 18
• "2d{HT}" - Roll 2 custom dice with H/T faces

COMPLEX COMBINATIONS:
• "4d6LR{1}+3" - Drop lowest, reroll 1s, add 3
• "4d6LHR{1,6}C{<2,>5}U!+10-3" - All modifiers combined

GAMING PATTERNS:
• D&D Ability: "4d6L"
• D&D Advantage: "2d20H"
• D&D Damage: "1d8+3"
• Skill Check: "1d20+7"
• Custom Narrative: "3d{⚔️🛡️🏹}"`
  )
})

const validateNotationToolSchema = z.object({
  notation: z.string().min(1, 'Notation string cannot be empty')
    .describe(`Dice notation string to validate and parse. Can be any potential RANDSUM notation.

VALIDATION EXAMPLES:
• "4d6L" - Valid drop lowest syntax
• "2d20H" - Valid advantage mechanics
• "3d6!" - Valid exploding dice
• "4d6R{1,2}" - Valid reroll syntax
• "2d{HT}L" - Invalid (custom faces + modifiers)
• "4d6R{<=3}" - Invalid (unsupported operator)
• "1d4+1d6" - Invalid (multiple expressions)

USE CASES:
• Validate user input before rolling
• Learn notation syntax and structure
• Debug complex modifier combinations
• Understand parsing behavior
• Catch common notation errors

RETURNS: For valid notation, shows parsed structure with quantity, sides, and modifiers. For invalid notation, provides specific error with correction guidance.`)
})

function formatRollResult(result: RollResult): string {
  const { type, total, rolls, rawResults } = result

  const header = `🎲 RANDSUM Roll Result (${type}):`
  const separator = '─'.repeat(30)
  const totalLine = `Total: ${String(total)}`

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

// Read version from package.json at runtime
function getPackageVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    // In built form, we're in dist/ and package.json is in parent directory
    const packageJsonPath = join(__dirname, '..', 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version: string
    }
    return packageJson.version
  } catch (error) {
    console.error('Failed to read package version:', error)
    return '0.0.0' // Fallback version
  }
}

export const config = {
  version: getPackageVersion(),
  name: 'RANDSUM'
}

function createServerInstance(): McpServer {
  const server = new McpServer(config, {
    instructions: `🎲 RANDSUM MCP Server - Advanced Dice Rolling & Game Mechanics Engine

COMPREHENSIVE DICE ROLLING SYSTEM with sophisticated modifiers for tabletop gaming, probability simulation, and randomization tasks.

🚀 CORE CAPABILITIES:
• Execute dice rolls with advanced RANDSUM notation system
• Support for standard polyhedral dice (d4, d6, d8, d10, d12, d20, d100, etc.)
• Custom-faced dice with arbitrary symbols, text, or emojis
• Complex modifier combinations for sophisticated game mechanics
• Detailed roll breakdowns with individual die results and modifier applications
• Real-time notation validation with comprehensive error feedback

🔧 AVAILABLE TOOLS:

🎯 roll - Advanced Dice Rolling Engine
• Execute sophisticated dice rolls with full modifier support
• Returns detailed breakdowns: total, raw results, modified results, subtotals
• Supports numeric dice (standard gaming) and custom faces (narrative/symbolic)
• Handles complex modifier combinations for advanced game mechanics

🔍 validate-notation - Syntax Validator & Parser
• Validate dice notation before execution to prevent errors
• Detailed parsing feedback showing notation interpretation
• Comprehensive error messages with correction guidance
• Essential for learning syntax and debugging complex expressions

📚 COMPREHENSIVE MODIFIER SYSTEM:

DROP MODIFIERS (L/H): Remove extreme results
• 4d6L - Drop lowest (D&D ability scores)
• 2d20H - Drop highest (disadvantage mechanics)
• 4d6LH - Drop both extremes (middle values)

REROLL MODIFIERS (R): Conditional rerolling
• 4d6R{1} - Reroll 1s (avoid failures)
• 4d6R{<3} - Reroll below threshold
• 4d6R{1,2,6} - Reroll specific values

EXPLODING DICE (!): Cascade rolling
• 3d6! - Reroll and add on maximum (critical hits)
• Open-ended results for dramatic outcomes

UNIQUE RESULTS (U): No duplicates
• 4d20U - All different results (card draws, selections)

CAPPING (C): Range enforcement
• 4d20C{>18} - Cap maximum values
• 4d6C{<2,>5} - Enforce result ranges

ARITHMETIC (+/-): Fixed adjustments
• 2d6+3 - Add modifiers (damage + ability)
• 1d20-2 - Apply penalties

CUSTOM FACES: Non-numeric dice
• 2d{HT} - Coin flips
• 3d{⚔️🛡️🏹} - Symbol dice
• 4d{NSEW} - Directional results
⚠️ Cannot combine with other modifiers

🎮 GAMING APPLICATIONS:
• D&D/Pathfinder: Ability scores, attacks, damage, saves
• Narrative Games: Story prompts, oracle dice, complications
• Probability: Statistical analysis, random sampling
• Custom Systems: Unique mechanics, symbol resolution

� LLM INTEGRATION BEST PRACTICES:
• Always validate complex notation before rolling
• Use for character creation, combat resolution, skill challenges
• Combine modifiers for sophisticated game mechanics
• Custom faces perfect for narrative and symbolic outcomes

📖 COMPLETE REFERENCE:
Access via dice-notation-docs resource for comprehensive syntax guide

🔥 QUICK EXAMPLES:
• 4d6L - D&D ability score (drop lowest)
• 2d20H - Advantage roll (keep highest)
• 3d6! - Exploding damage dice
• 4d6R{1}+3 - Reroll 1s, add modifier
• 2d{🎭🗡️🏰} - Narrative story elements`
  })

  server.tool(
    'roll',
    `🎲 RANDSUM Advanced Dice Rolling Engine

COMPREHENSIVE DICE ROLLING with sophisticated modifier support for tabletop gaming, probability simulation, and randomization tasks.

📋 CORE FUNCTIONALITY:
• Execute dice rolls using advanced RANDSUM notation
• Returns detailed breakdowns with individual die results, modifier applications, and final totals
• Supports both numeric dice (standard polyhedral) and custom-faced dice with arbitrary symbols
• Handles complex modifier combinations for sophisticated game mechanics

🔧 SUPPORTED NOTATION PATTERNS:

BASIC DICE:
• 2d6, 1d20, 4d8, 100d1 - Standard polyhedral dice
• 0d6, 2d0 - Edge cases (valid but produce no/zero results)

DROP MODIFIERS (L/H) - Remove extreme results:
• 4d6L - Roll 4d6, drop lowest (D&D ability scores)
• 4d6L2 - Roll 4d6, drop 2 lowest
• 2d20H - Roll 2d20, drop highest (disadvantage)
• 4d6LH - Drop both lowest and highest (middle values only)

REROLL MODIFIERS (R) - Conditional rerolling:
• 4d6R{1} - Reroll any 1s (avoid critical failures)
• 4d6R{1,2} - Reroll 1s and 2s (higher minimum)
• 4d6R{<3} - Reroll results below 3
• 4d6R{>4} - Reroll results above 4
• 4d6R{<2,>5} - Reroll results outside 2-5 range

EXPLODING DICE (!) - Cascade rolling:
• 3d6! - Roll 3d6, reroll and add on 6s (critical hits)
• 2d10! - Roll 2d10, reroll and add on 10s (open-ended results)

UNIQUE RESULTS (U) - No duplicates:
• 4d20U - Roll 4d20 with all different results (card draws)
• 5d6U - Roll 5d6 ensuring no duplicates (lottery systems)

CAPPING MODIFIERS (C) - Range enforcement:
• 4d20C{>18} - No results above 18 (cap maximum)
• 4d20C{<3} - No results below 3 (cap minimum)
• 4d6C{<2,>5} - Results must be 2-5 only (bounded results)

ARITHMETIC MODIFIERS (+/-) - Fixed adjustments:
• 2d6+3 - Roll 2d6, add 3 (damage + modifier)
• 1d20+5 - Roll 1d20, add 5 (skill check with bonus)
• 2d6+10-3 - Multiple operations (net +7)

CUSTOM DICE FACES - Non-numeric results:
• 2d{HT} - Coin flips (Heads/Tails)
• 3d{⚔️🛡️🏹} - Combat symbols
• 4d{NSEW} - Directional results
• 2d{red,blue,green} - Each character becomes a face
⚠️ LIMITATION: Custom faces CANNOT combine with other modifiers

COMPLEX COMBINATIONS:
• 4d6LR{1}!+3 - Drop lowest, reroll 1s, exploding, +3
• 4d6LHR{1,6}C{<2,>5}U!+10-3 - All modifiers combined

🎮 COMMON GAMING PATTERNS:
• D&D Ability Scores: 4d6L
• D&D Advantage: 2d20H
• D&D Disadvantage: 2d20L
• Damage + Modifier: 1d8+3
• Critical Hit: 2d8+3
• Skill Check: 1d20+{modifier}

🚫 UNSUPPORTED FEATURES:
• Multiplication/Division: 2d6*2, 2d6/2
• Compound operators: <=, >=
• Multiple expressions: 1d4+1d6+2d8
• Keep highest/lowest notation (use drop instead)

💡 LLM USAGE TIPS:
• Always validate complex notation with validate-notation tool first
• Use for character creation, combat resolution, skill challenges, random generation
• Custom faces perfect for narrative outcomes and symbol systems
• Combine modifiers for sophisticated game mechanics

RETURNS: Detailed breakdown with total, raw results, modified results (if different), and subtotal for each roll group.`,
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
    `🔍 RANDSUM Notation Syntax Validator & Parser

COMPREHENSIVE VALIDATION ENGINE for dice notation syntax with detailed parsing feedback and error guidance.

📋 CORE FUNCTIONALITY:
• Validate dice notation syntax before execution
• Provide detailed parsing breakdown showing how notation will be interpreted
• Generate specific error messages with correction guidance
• Essential for learning notation syntax and debugging complex expressions

🎯 WHEN TO USE:
• Before executing complex modifier combinations
• When processing user-provided notation input
• For learning and understanding notation syntax
• When debugging unexpected roll behavior
• Before building complex dice expressions

🔧 VALIDATION FEATURES:

SYNTAX CHECKING:
• Verifies proper dice notation format (NdS pattern)
• Validates modifier syntax and combinations
• Checks for conflicting modifiers (e.g., custom faces + modifiers)
• Ensures logical parameter values

DETAILED PARSING:
• Shows parsed structure: quantity, sides, modifiers
• Breaks down modifier parameters and conditions
• Explains how each component will be processed
• Displays final notation interpretation

ERROR GUIDANCE:
• Specific error messages for common mistakes
• Suggestions for correcting invalid notation
• Explains why certain combinations are invalid
• Provides alternative notation patterns

📊 RETURN FORMATS:

VALID NOTATION:
✅ Valid Dice Notation (numeric/custom):
• Notation: [input notation]
• Description: [human-readable explanation]
• Parsed Details: [JSON structure showing components]

INVALID NOTATION:
❌ Invalid Dice Notation
• Error: [specific error description]
• Common causes and solutions

🎮 COMMON VALIDATION SCENARIOS:

LEARNING PATTERNS:
• validate-notation("4d6L") → Understand drop lowest syntax
• validate-notation("2d20H") → Learn advantage mechanics
• validate-notation("3d6!") → Explore exploding dice

DEBUGGING COMPLEX NOTATION:
• validate-notation("4d6LR{1}!+3") → Verify modifier combination
• validate-notation("4d6C{<2,>5}") → Check capping syntax
• validate-notation("2d{HT}L") → Catch invalid custom+modifier combo

ERROR PREVENTION:
• validate-notation("4d6R{<=3}") → Identify unsupported operators
• validate-notation("1d4+1d6") → Catch multiple expression errors
• validate-notation("2d6*2") → Find unsupported arithmetic

💡 LLM INTEGRATION PATTERNS:

VALIDATION-FIRST WORKFLOW:
1. validate-notation(user_input) → Check syntax
2. If valid → roll(user_input) → Execute roll
3. If invalid → Provide corrected notation

LEARNING ASSISTANCE:
1. validate-notation(complex_notation) → Show parsing
2. Explain each modifier component
3. Suggest simpler alternatives if needed

BATCH VALIDATION:
• Validate multiple notation patterns for comparison
• Build complex expressions step by step
• Verify each modifier addition before combining

🚨 COMMON ERROR PATTERNS TO CATCH:
• Custom faces + modifiers: "3d{abc}L" → Invalid
• Compound operators: "4d6R{<=3}" → Use "<4" instead
• Multiple expressions: "1d4+1d6" → Single expression only
• Unsupported arithmetic: "2d6*2" → Use multiple rolls
• Invalid conditions: "4d6C{3,4,5}" → Use range conditions

RETURNS: For valid notation, returns parsed structure with quantity, sides, and modifier details. For invalid notation, returns specific error message with correction guidance.`,
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
