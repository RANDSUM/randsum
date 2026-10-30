import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { AVAILABLE_GAMES } from '@randsum/games'
import type { GameShortcode } from '@randsum/games'
import type { InputDeclaration } from '@randsum/games/schema'
import { RandsumError } from '@randsum/roller/errors'
import { z } from 'zod'
import { version as VERSION } from '../package.json'
import { GAME_INPUTS, isRequiredInput, rollGame } from './tools/rollGame'
import { rollNotation } from './tools/roll'
import { validateNotationInput } from './tools/validate'

/**
 * Wraps a plain handler result (or thrown error) in the MCP CallToolResult
 * envelope: JSON text content plus structured content, and `isError` on throw.
 * A thrown RandsumError also reports its `code`, and the `position` in the
 * notation when it has one, as a second text block. Errors carry no structured
 * content, because clients check structured content against the output schema.
 */
function toResult(produce: () => Record<string, unknown>): CallToolResult {
  try {
    const value = produce()
    return {
      content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
      structuredContent: value
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const details =
      error instanceof RandsumError
        ? [
            {
              type: 'text' as const,
              text: JSON.stringify({
                code: error.code,
                ...(error.context?.position !== undefined
                  ? { position: error.context.position }
                  : {})
              })
            }
          ]
        : []
    return {
      content: [{ type: 'text', text: message }, ...details],
      isError: true
    }
  }
}

/** Output of the `roll` tool (RollToolResult). */
const rollOutput = {
  notation: z.string().describe('The notation that was rolled'),
  total: z.number().describe('Combined total across every pool'),
  pools: z
    .array(
      z.object({
        notation: z.string(),
        rolls: z.array(z.number()).describe('Die values after modifiers'),
        total: z.number(),
        description: z.string()
      })
    )
    .describe('One entry per dice pool'),
  description: z.string().describe('Human-readable description of the roll')
}

/** Output of the `validate` tool (ValidateToolResult). */
const validateOutput = {
  notation: z.string(),
  valid: z.boolean(),
  description: z.string().optional().describe('Human-readable description when valid'),
  suggestion: z.string().optional().describe('Suggested fix when invalid'),
  error: z.string().optional().describe('Why the notation is invalid')
}

/** Output of the `roll_game` tool (RollGameToolResult). */
const rollGameOutput = {
  game: z.enum(AVAILABLE_GAMES),
  total: z.number(),
  result: z.unknown().describe("The game's interpreted outcome"),
  details: z.unknown().describe('Game-specific extra detail, when the game provides it'),
  rolls: z
    .array(z.number())
    .describe("Die values after the game's modifiers: only the dice that count")
}

/** One spec input declaration as a Zod field: type, bounds, enum, description. */
function inputField(decl: InputDeclaration): z.ZodType {
  const base = (() => {
    if (decl.type === 'boolean') return z.boolean()
    if (decl.type === 'string') return decl.enum ? z.enum(decl.enum.map(String)) : z.string()
    const int = z.number().int()
    const atLeast = decl.minimum === undefined ? int : int.min(decl.minimum)
    return decl.maximum === undefined ? atLeast : atLeast.max(decl.maximum)
  })()
  const described = decl.description === undefined ? base : base.describe(decl.description)
  return isRequiredInput(decl) ? described : described.optional()
}

/**
 * Each game's `params` schema, built from the inputs its spec declares. Loose,
 * so a key another game uses is ignored rather than rejected, as before.
 */
const GAME_PARAMS = Object.fromEntries(
  AVAILABLE_GAMES.map(game => [
    game,
    z
      .looseObject(
        Object.fromEntries(
          Object.entries(GAME_INPUTS[game]).map(([name, decl]) => [name, inputField(decl)])
        )
      )
      .describe(`params when game is "${game}"`)
  ])
) as Record<GameShortcode, z.ZodObject>

/**
 * `roll_game` input. `params` is advertised as one object schema per game; the
 * refinement then checks it against the chosen game's schema, so the bounds
 * and required fields that apply are the ones for `game`. A top-level
 * discriminated union would be tighter, but the MCP SDK lists any non-object
 * input schema as an empty object, hiding every field from clients.
 */
const rollGameInput = z
  .object({
    game: z.enum(AVAILABLE_GAMES).describe('Which game system to roll for'),
    params: z
      .union(AVAILABLE_GAMES.map(game => GAME_PARAMS[game]))
      .default({})
      .describe("Game-specific inputs; only the chosen game's fields are used")
  })
  .superRefine(({ game, params }, ctx) => {
    const parsed = GAME_PARAMS[game].safeParse(params)
    if (parsed.success) return
    for (const issue of parsed.error.issues) {
      ctx.addIssue({ code: 'custom', path: ['params', ...issue.path], message: issue.message })
    }
  })

/** Sent to clients on initialize; most hosts put it in the model's context. */
const SERVER_INSTRUCTIONS =
  'RANDSUM rolls tabletop RPG dice with a real random number generator. Call a tool for every roll the user asks for; never invent dice results. Use `roll_game` when the user names a supported game (D&D 5e is `fifth`), `roll` for plain notation such as "4d6L" or "2d20L+5", and `validate` to explain or repair notation. Notation reference: https://randsum.dev/spec/'

/**
 * Every tool only computes: it reads no state, changes nothing, and reaches no
 * outside system. The rolling tools differ from `validate` only in returning a
 * new result on each call.
 */
const LOCAL_COMPUTATION = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false
} as const

/**
 * Builds the RANDSUM MCP server with the `roll`, `validate`, and `roll_game`
 * tools registered. Callers attach a transport via `server.connect(...)`.
 */
export function createServer(): McpServer {
  const server = new McpServer(
    { name: '@randsum/mcp', version: VERSION },
    { instructions: SERVER_INSTRUCTIONS }
  )

  server.registerTool(
    'roll',
    {
      title: 'Roll dice',
      description:
        'Roll dice using RANDSUM notation (e.g. "4d6L", "2d20+5"). Use this whenever a user asks for a dice roll or a random result, instead of inventing one. Optionally pass a seed for a deterministic result. Returns the total, per-pool rolls, and a description.',
      inputSchema: {
        notation: z.string().describe('RANDSUM dice notation, e.g. "4d6L", "2d20+5", "1d20"'),
        seed: z
          .number()
          .int()
          .optional()
          .describe('Optional integer seed for a deterministic, reproducible roll')
      },
      outputSchema: rollOutput,
      annotations: { ...LOCAL_COMPUTATION, idempotentHint: false }
    },
    input => toResult(() => ({ ...rollNotation(input) }))
  )

  server.registerTool(
    'validate',
    {
      title: 'Validate dice notation',
      description:
        'Validate RANDSUM dice notation without rolling. Use it to check or explain notation, or to repair notation that `roll` rejected. Returns whether it is valid, a human-readable description, and a suggested fix when invalid.',
      inputSchema: {
        notation: z.string().describe('RANDSUM dice notation to validate, e.g. "4d6L" or "2d20+5"')
      },
      outputSchema: validateOutput,
      annotations: { ...LOCAL_COMPUTATION, idempotentHint: true }
    },
    input => toResult(() => ({ ...validateNotationInput(input) }))
  )

  server.registerTool(
    'roll_game',
    {
      title: 'Roll for a game system',
      description:
        "Roll for a specific tabletop game system (blades, daggerheart, fate, fifth, pbta, root-rpg, salvageunion), interpreting the dice per that game. Prefer it over `roll` when the user names one of these games: it returns the game's outcome, not just a total. Pass game-specific inputs in `params`.",
      inputSchema: rollGameInput,
      outputSchema: rollGameOutput,
      annotations: { ...LOCAL_COMPUTATION, idempotentHint: false }
    },
    ({ game, params }) => toResult(() => ({ ...rollGame(game, params) }))
  )

  return server
}
